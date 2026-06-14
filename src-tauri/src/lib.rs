// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{Emitter, Manager, WebviewWindow, AppHandle};

struct AppState {
    is_locked: AtomicBool,
}

#[tauri::command]
fn toggle_lock(window: WebviewWindow, state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let current = state.is_locked.load(Ordering::Relaxed);
    let next = !current;
    state.is_locked.store(next, Ordering::Relaxed);
    
    window.set_ignore_cursor_events(next)
        .map_err(|e| e.to_string())?;
    
    window.emit("lock-toggled", next)
        .map_err(|e| e.to_string())?;
        
    Ok(next)
}

#[tauri::command]
fn set_click_through(window: WebviewWindow, ignore: bool, state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.is_locked.store(ignore, Ordering::Relaxed);
    
    window.set_ignore_cursor_events(ignore)
        .map_err(|e| e.to_string())?;
        
    window.emit("lock-toggled", ignore)
        .map_err(|e| e.to_string())?;
        
    Ok(())
}

#[tauri::command]
fn close_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn minimize_app(window: WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_maximize(window: WebviewWindow) -> Result<bool, String> {
    let maximized = window.is_maximized().map_err(|e| e.to_string())?;
    if maximized {
        window.unmaximize().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        window.maximize().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .manage(AppState {
            is_locked: AtomicBool::new(false),
        });

    #[cfg(desktop)]
    {
        builder = builder.plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        if shortcut.matches(
                            tauri_plugin_global_shortcut::Modifiers::CONTROL
                                | tauri_plugin_global_shortcut::Modifiers::ALT,
                            tauri_plugin_global_shortcut::Code::KeyL,
                        ) {
                            if let Some(window) = app.get_webview_window("main") {
                                let state = app.state::<AppState>();
                                let current = state.is_locked.load(Ordering::Relaxed);
                                let next = !current;
                                state.is_locked.store(next, Ordering::Relaxed);
                                
                                let _ = window.set_ignore_cursor_events(next);
                                let _ = window.emit("lock-toggled", next);
                            }
                        } else if shortcut.matches(
                            tauri_plugin_global_shortcut::Modifiers::CONTROL
                                | tauri_plugin_global_shortcut::Modifiers::ALT,
                            tauri_plugin_global_shortcut::Code::KeyH,
                        ) {
                            if let Some(window) = app.get_webview_window("main") {
                                if let Ok(visible) = window.is_visible() {
                                    if visible {
                                        let _ = window.hide();
                                    } else {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                            }
                        }
                    }
                })
                .build(),
        );
    }

    builder = builder.plugin(tauri_plugin_opener::init());

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::GlobalShortcutExt;
                let shortcut_l = tauri_plugin_global_shortcut::Shortcut::new(
                    Some(
                        tauri_plugin_global_shortcut::Modifiers::CONTROL
                            | tauri_plugin_global_shortcut::Modifiers::ALT,
                    ),
                    tauri_plugin_global_shortcut::Code::KeyL,
                );
                let shortcut_h = tauri_plugin_global_shortcut::Shortcut::new(
                    Some(
                        tauri_plugin_global_shortcut::Modifiers::CONTROL
                            | tauri_plugin_global_shortcut::Modifiers::ALT,
                    ),
                    tauri_plugin_global_shortcut::Code::KeyH,
                );
                app.global_shortcut().register(shortcut_l)?;
                app.global_shortcut().register(shortcut_h)?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![toggle_lock, set_click_through, close_app, minimize_app, toggle_maximize])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
