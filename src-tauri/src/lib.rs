// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::fs;
use std::path::PathBuf;
use tauri::{Emitter, Manager, WebviewWindow, AppHandle};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
struct ShortcutsConfig {
    lock: String,
    hide: String,
}

impl Default for ShortcutsConfig {
    fn default() -> Self {
        Self {
            lock: "Ctrl+Alt+L".to_string(),
            hide: "Ctrl+Alt+H".to_string(),
        }
    }
}

struct AppState {
    is_locked: AtomicBool,
    last_ignored: AtomicBool,
    lock_shortcut: Mutex<Option<Shortcut>>,
    hide_shortcut: Mutex<Option<Shortcut>>,
}

fn get_config_path(app: &AppHandle) -> Option<PathBuf> {
    let mut path = app.path().app_config_dir().ok()?;
    let _ = fs::create_dir_all(&path);
    path.push("shortcuts.json");
    Some(path)
}

fn load_config(app: &AppHandle) -> ShortcutsConfig {
    if let Some(path) = get_config_path(app) {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str::<ShortcutsConfig>(&content) {
                    return config;
                }
            }
        }
    }
    ShortcutsConfig::default()
}

fn save_config(app: &AppHandle, config: &ShortcutsConfig) -> Result<(), String> {
    let path = get_config_path(app).ok_or("Could not resolve app config directory")?;
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn toggle_lock(window: WebviewWindow, state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let current = state.is_locked.load(Ordering::Relaxed);
    let next = !current;
    state.is_locked.store(next, Ordering::Relaxed);
    state.last_ignored.store(next, Ordering::Relaxed);
    
    window.set_ignore_cursor_events(next)
        .map_err(|e| e.to_string())?;
    
    window.emit("lock-toggled", next)
        .map_err(|e| e.to_string())?;
        
    Ok(next)
}

#[tauri::command]
fn set_click_through(window: WebviewWindow, ignore: bool, state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.is_locked.store(ignore, Ordering::Relaxed);
    state.last_ignored.store(ignore, Ordering::Relaxed);
    
    window.set_ignore_cursor_events(ignore)
        .map_err(|e| e.to_string())?;
        
    window.emit("lock-toggled", ignore)
        .map_err(|e| e.to_string())?;
        
    Ok(())
}

#[tauri::command]
fn get_shortcuts(app: AppHandle) -> Result<ShortcutsConfig, String> {
    Ok(load_config(&app))
}

#[tauri::command]
fn save_shortcuts(app: AppHandle, lock: String, hide: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let global_shortcut = app.global_shortcut();
    
    // Parse new shortcuts to validate them before unregistering the old ones
    let new_lock_sc: Shortcut = lock.parse().map_err(|e| format!("Invalid Lock shortcut: {}", e))?;
    let new_hide_sc: Shortcut = hide.parse().map_err(|e| format!("Invalid Hide shortcut: {}", e))?;
    
    // Unregister old shortcuts
    {
        let mut lock_guard = state.lock_shortcut.lock().unwrap();
        if let Some(ref old_sc) = *lock_guard {
            let _ = global_shortcut.unregister(*old_sc);
        }
        *lock_guard = None;
    }
    
    {
        let mut hide_guard = state.hide_shortcut.lock().unwrap();
        if let Some(ref old_sc) = *hide_guard {
            let _ = global_shortcut.unregister(*old_sc);
        }
        *hide_guard = None;
    }
    
    // Register new shortcuts
    global_shortcut.register(new_lock_sc).map_err(|e| format!("Failed to register Lock shortcut: {}", e))?;
    global_shortcut.register(new_hide_sc).map_err(|e| format!("Failed to register Hide shortcut: {}", e))?;
    
    // Store new shortcuts in AppState
    {
        let mut lock_guard = state.lock_shortcut.lock().unwrap();
        *lock_guard = Some(new_lock_sc);
    }
    {
        let mut hide_guard = state.hide_shortcut.lock().unwrap();
        *hide_guard = Some(new_hide_sc);
    }
    
    // Save to configuration file
    let config = ShortcutsConfig { lock, hide };
    save_config(&app, &config)?;
    
    // Emit dynamic update event to frontend so the UI refreshes
    let _ = app.emit("shortcuts-updated", config);
    
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
            last_ignored: AtomicBool::new(false),
            lock_shortcut: Mutex::new(None),
            hide_shortcut: Mutex::new(None),
        });

    #[cfg(desktop)]
    {
        builder = builder.plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        let state = app.state::<AppState>();
                        
                        let is_lock_shortcut = {
                            let lock_guard = state.lock_shortcut.lock().unwrap();
                            lock_guard.as_ref() == Some(shortcut)
                        };
                        
                        let is_hide_shortcut = {
                            let hide_guard = state.hide_shortcut.lock().unwrap();
                            hide_guard.as_ref() == Some(shortcut)
                        };

                        if is_lock_shortcut {
                            if let Some(window) = app.get_webview_window("main") {
                                let current = state.is_locked.load(Ordering::Relaxed);
                                let next = !current;
                                state.is_locked.store(next, Ordering::Relaxed);
                                state.last_ignored.store(next, Ordering::Relaxed);
                                
                                let _ = window.set_ignore_cursor_events(next);
                                let _ = window.emit("lock-toggled", next);
                            }
                        } else if is_hide_shortcut {
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
            let config = load_config(app.handle());
            
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::GlobalShortcutExt;
                let state = app.state::<AppState>();
                
                if let Ok(lock_sc) = config.lock.parse::<Shortcut>() {
                    if let Ok(_) = app.global_shortcut().register(lock_sc) {
                        let mut lock_guard = state.lock_shortcut.lock().unwrap();
                        *lock_guard = Some(lock_sc);
                    }
                }
                
                if let Ok(hide_sc) = config.hide.parse::<Shortcut>() {
                    if let Ok(_) = app.global_shortcut().register(hide_sc) {
                        let mut hide_guard = state.hide_shortcut.lock().unwrap();
                        *hide_guard = Some(hide_sc);
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            toggle_lock,
            set_click_through,
            close_app,
            minimize_app,
            toggle_maximize,
            get_shortcuts,
            save_shortcuts
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
