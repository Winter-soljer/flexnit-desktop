use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};

static ACTIVE_DOWNLOADS: std::sync::LazyLock<Arc<Mutex<HashMap<String, u32>>>> =
    std::sync::LazyLock::new(|| Arc::new(Mutex::new(HashMap::new())));

#[derive(serde::Deserialize)]
pub struct StartDownloadRequest {
    pub id: String,
    pub title: String,
    pub source_url: String,
    pub destination_dir: Option<String>,
}

#[derive(serde::Serialize, Clone)]
pub struct DownloadProgressPayload {
    pub id: String,
    pub status: String, // "downloading" | "completed" | "failed" | "cancelled"
    pub progress: f64,
    pub phase: String,
    pub speed: Option<String>,
    pub eta: Option<String>,
    pub file_path: Option<String>,
    pub error: Option<String>,
}

fn resolve_binary_path(app: &tauri::AppHandle, bin_name: &str) -> Result<PathBuf, String> {
    // 1. Check directory of current running executable
    if let Ok(mut exe_dir) = std::env::current_exe() {
        exe_dir.pop();
        let direct_exe = exe_dir.join(format!("{}.exe", bin_name));
        if direct_exe.exists() {
            return Ok(direct_exe);
        }
        let triple_exe = exe_dir.join(format!("{}-x86_64-pc-windows-msvc.exe", bin_name));
        if triple_exe.exists() {
            return Ok(triple_exe);
        }
        let sub_exe = exe_dir.join("binaries").join(format!("{}.exe", bin_name));
        if sub_exe.exists() {
            return Ok(sub_exe);
        }
        let sub_triple = exe_dir
            .join("binaries")
            .join(format!("{}-x86_64-pc-windows-msvc.exe", bin_name));
        if sub_triple.exists() {
            return Ok(sub_triple);
        }
    }

    // 2. Check app resource dir
    if let Ok(res_dir) = app.path().resource_dir() {
        let candidate1 = res_dir.join(format!("{}.exe", bin_name));
        if candidate1.exists() {
            return Ok(candidate1);
        }
        let candidate2 = res_dir.join(format!("{}-x86_64-pc-windows-msvc.exe", bin_name));
        if candidate2.exists() {
            return Ok(candidate2);
        }
        let candidate3 = res_dir.join("binaries").join(format!("{}.exe", bin_name));
        if candidate3.exists() {
            return Ok(candidate3);
        }
        let candidate4 = res_dir
            .join("binaries")
            .join(format!("{}-x86_64-pc-windows-msvc.exe", bin_name));
        if candidate4.exists() {
            return Ok(candidate4);
        }
    }

    // 3. Check development paths relative to current working directory
    let dev_candidates = [
        format!("src-tauri/binaries/{}-x86_64-pc-windows-msvc.exe", bin_name),
        format!("binaries/{}-x86_64-pc-windows-msvc.exe", bin_name),
        format!("src-tauri/binaries/{}.exe", bin_name),
        format!("binaries/{}.exe", bin_name),
    ];
    for rel in dev_candidates {
        let p = PathBuf::from(&rel);
        if p.exists() {
            if let Ok(abs) = std::fs::canonicalize(&p) {
                return Ok(abs);
            }
            return Ok(p);
        }
    }

    Err(format!(
        "Binary '{}' not found in bundle or dev paths",
        bin_name
    ))
}

fn get_default_downloads_dir(app: &tauri::AppHandle) -> PathBuf {
    let base_dir = app
        .path()
        .app_local_data_dir()
        .unwrap_or_else(|_| {
            if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
                PathBuf::from(local_app_data).join("Flexnit")
            } else {
                PathBuf::from("Flexnit_Downloads")
            }
        });
    let downloads_dir = base_dir.join("downloads");
    let _ = std::fs::create_dir_all(&downloads_dir);
    downloads_dir
}

fn sanitize_filename(name: &str) -> String {
    let sanitized: String = name
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect();
    let trimmed = sanitized.trim().trim_matches('.');
    if trimmed.is_empty() {
        "video".to_string()
    } else {
        trimmed.to_string()
    }
}

fn parse_download_line(line: &str) -> Option<(f64, Option<String>, Option<String>, String)> {
    if line.contains("[Merger]") {
        return Some((99.0, None, None, "Merging video and audio...".to_string()));
    }
    if line.contains("[Fixup") {
        return Some((99.5, None, None, "Finalizing container...".to_string()));
    }
    if !line.contains("[download]") {
        return None;
    }

    let percent_idx = line.find('%')?;
    let prefix = &line[..percent_idx];
    let start_idx = prefix.rfind(|c: char| c.is_whitespace() || c == ']')? + 1;
    let percent_str = prefix[start_idx..].trim();
    let percent: f64 = percent_str.parse().ok()?;

    let speed = if let Some(at_idx) = line.find(" at ") {
        let after_at = &line[at_idx + 4..].trim_start();
        after_at.split_whitespace().next().map(|s| s.to_string())
    } else {
        None
    };

    let eta = if let Some(eta_idx) = line.find("ETA ") {
        let after_eta = &line[eta_idx + 4..].trim_start();
        after_eta.split_whitespace().next().map(|s| s.to_string())
    } else {
        None
    };

    let phase = format!("Downloading ({:.1}%)", percent);
    Some((percent, speed, eta, phase))
}

#[tauri::command]
fn start_native_download(
    app: tauri::AppHandle,
    request: StartDownloadRequest,
) -> Result<String, String> {
    let yt_dlp_path = resolve_binary_path(&app, "yt-dlp")?;
    let ffmpeg_path = resolve_binary_path(&app, "ffmpeg").ok();

    let output_dir = if let Some(custom_dir) = request.destination_dir {
        let p = PathBuf::from(custom_dir);
        let _ = std::fs::create_dir_all(&p);
        p
    } else {
        get_default_downloads_dir(&app)
    };

    let safe_title = sanitize_filename(&request.title);
    let output_template = output_dir.join(format!("{}.%(ext)s", safe_title));
    let final_mp4 = output_dir.join(format!("{}.mp4", safe_title));

    let mut cmd = Command::new(&yt_dlp_path);
    cmd.arg("-f")
        .arg("bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bestvideo+bestaudio/best")
        .arg("--newline")
        .arg("--no-playlist")
        .arg("--progress")
        .arg("--concurrent-fragments")
        .arg("8")
        .arg("--retries")
        .arg("10")
        .arg("--fragment-retries")
        .arg("10");

    // Pass CDN anti-hotlinking headers for TMDB/Vidspark HLS streams
    if !request.source_url.contains("youtube.com") && !request.source_url.contains("youtu.be") {
        cmd.arg("--referer")
            .arg("https://vidspark.to/")
            .arg("--user-agent")
            .arg("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
            .arg("--add-header")
            .arg("Origin: https://vidspark.to");
    }

    cmd.arg("-o")
        .arg(&output_template)
        .arg(&request.source_url);

    if let Some(ref ffmpeg) = ffmpeg_path {
        cmd.arg("--ffmpeg-location").arg(ffmpeg);
    }

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn yt-dlp: {}", e))?;
    let pid = child.id();

    let download_id = request.id.clone();
    {
        let mut map = ACTIVE_DOWNLOADS.lock().unwrap();
        map.insert(download_id.clone(), pid);
    }

    // Spawn reader thread
    let app_handle = app.clone();
    let thread_download_id = download_id.clone();
    let thread_output_dir = output_dir.clone();
    let thread_safe_title = safe_title.clone();

    std::thread::spawn(move || {
        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        // Initial event: download started
        let _ = app_handle.emit(
            "download-progress",
            DownloadProgressPayload {
                id: thread_download_id.clone(),
                status: "downloading".to_string(),
                progress: 2.0,
                phase: "Initializing stream download...".to_string(),
                speed: None,
                eta: None,
                file_path: None,
                error: None,
            },
        );

        if let Some(out) = stdout {
            let reader = BufReader::new(out);
            for line in reader.lines().flatten() {
                if let Some((percent, speed, eta, phase)) = parse_download_line(&line) {
                    let _ = app_handle.emit(
                        "download-progress",
                        DownloadProgressPayload {
                            id: thread_download_id.clone(),
                            status: "downloading".to_string(),
                            progress: percent,
                            phase,
                            speed,
                            eta,
                            file_path: None,
                            error: None,
                        },
                    );
                }
            }
        }

        let exit_status = child.wait();

        // Remove from active downloads
        {
            let mut map = ACTIVE_DOWNLOADS.lock().unwrap();
            map.remove(&thread_download_id);
        }

        match exit_status {
            Ok(status) if status.success() => {
                // Find resolved output file
                let resolved_file = if final_mp4.exists() {
                    Some(final_mp4)
                } else {
                    std::fs::read_dir(&thread_output_dir).ok().and_then(|entries| {
                        entries.flatten().find_map(|entry| {
                            let name = entry.file_name().to_string_lossy().to_string();
                            if name.starts_with(&thread_safe_title)
                                && !name.ends_with(".part")
                                && !name.ends_with(".ytdl")
                            {
                                Some(entry.path())
                            } else {
                                None
                            }
                        })
                    })
                };

                let file_path_str = resolved_file.map(|p| p.to_string_lossy().to_string());

                let _ = app_handle.emit(
                    "download-progress",
                    DownloadProgressPayload {
                        id: thread_download_id,
                        status: "completed".to_string(),
                        progress: 100.0,
                        phase: "Ready (Saved to disk)".to_string(),
                        speed: None,
                        eta: None,
                        file_path: file_path_str,
                        error: None,
                    },
                );
            }
            Ok(status) => {
                let mut err_msg = format!("Download failed with code {:?}", status.code());
                if let Some(err) = stderr {
                    let reader = BufReader::new(err);
                    let err_lines: Vec<String> = reader.lines().flatten().collect();
                    if !err_lines.is_empty() {
                        err_msg = err_lines.join("\n");
                    }
                }
                let _ = app_handle.emit(
                    "download-progress",
                    DownloadProgressPayload {
                        id: thread_download_id,
                        status: "failed".to_string(),
                        progress: 0.0,
                        phase: "Failed".to_string(),
                        speed: None,
                        eta: None,
                        file_path: None,
                        error: Some(err_msg),
                    },
                );
            }
            Err(e) => {
                let _ = app_handle.emit(
                    "download-progress",
                    DownloadProgressPayload {
                        id: thread_download_id,
                        status: "failed".to_string(),
                        progress: 0.0,
                        phase: "Failed".to_string(),
                        speed: None,
                        eta: None,
                        file_path: None,
                        error: Some(format!("Process error: {}", e)),
                    },
                );
            }
        }
    });

    Ok(download_id)
}

#[tauri::command]
fn cancel_native_download(id: String) -> Result<(), String> {
    let mut map = ACTIVE_DOWNLOADS.lock().unwrap();
    if let Some(pid) = map.remove(&id) {
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            let _ = Command::new("taskkill")
                .args(["/PID", &pid.to_string(), "/F", "/T"])
                .creation_flags(0x08000000)
                .output();
        }
        #[cfg(not(windows))]
        {
            let _ = Command::new("kill")
                .args(["-9", &pid.to_string()])
                .output();
        }
    }
    Ok(())
}

#[tauri::command]
fn open_in_folder(file_path: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let _ = Command::new("explorer")
            .args(["/select,", &file_path])
            .creation_flags(0x08000000)
            .spawn();
    }
    Ok(())
}

#[tauri::command]
fn minimize_window(window: tauri::WebviewWindow) {
    let _ = window.minimize();
}

#[tauri::command]
fn toggle_maximize_window(window: tauri::WebviewWindow) {
    if let Ok(is_max) = window.is_maximized() {
        if is_max {
            let _ = window.unmaximize();
        } else {
            let _ = window.maximize();
        }
    }
}

#[tauri::command]
fn close_window(window: tauri::WebviewWindow) {
    let _ = window.close();
}

#[tauri::command]
fn is_window_maximized(window: tauri::WebviewWindow) -> bool {
    window.is_maximized().unwrap_or(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let res = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            minimize_window,
            toggle_maximize_window,
            close_window,
            is_window_maximized,
            start_native_download,
            cancel_native_download,
            open_in_folder
        ])
        .setup(|app| {
            let log_path = "C:\\Users\\ARDJOOD\\Desktop\\tauri_run_log.txt";
            let _ = std::fs::OpenOptions::new()
                .append(true)
                .open(log_path)
                .map(|mut f| {
                    use std::io::Write;
                    let _ = writeln!(f, "setup() hook entered!");
                });
            if let Some(window) = app.get_webview_window("main") {
                let _ = std::fs::OpenOptions::new()
                    .append(true)
                    .open(log_path)
                    .map(|mut f| {
                        use std::io::Write;
                        let _ = writeln!(f, "window 'main' found, showing and focusing...");
                    });
                let _ = window.show();
                let _ = window.set_focus();
            } else {
                let _ = std::fs::OpenOptions::new()
                    .append(true)
                    .open(log_path)
                    .map(|mut f| {
                        use std::io::Write;
                        let _ = writeln!(f, "window 'main' NOT found in app.get_webview_window!");
                    });
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            let log_path = "C:\\Users\\ARDJOOD\\Desktop\\tauri_run_log.txt";
            match event {
                tauri::WindowEvent::CloseRequested { .. } => {
                    let _ = std::fs::OpenOptions::new()
                        .append(true)
                        .open(log_path)
                        .map(|mut f| {
                            use std::io::Write;
                            let _ = writeln!(f, "WindowEvent::CloseRequested on {}", window.label());
                        });
                }
                tauri::WindowEvent::Destroyed => {
                    let _ = std::fs::OpenOptions::new()
                        .append(true)
                        .open(log_path)
                        .map(|mut f| {
                            use std::io::Write;
                            let _ = writeln!(f, "WindowEvent::Destroyed on {}", window.label());
                        });
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!());

    if let Err(e) = res {
        let msg = format!("App run error: {:?}\n", e);
        let _ = std::fs::write("C:\\Users\\ARDJOOD\\Desktop\\tauri_crash.txt", &msg);
        let _ = std::fs::OpenOptions::new()
            .append(true)
            .open("C:\\Users\\ARDJOOD\\Desktop\\tauri_run_log.txt")
            .map(|mut f| {
                use std::io::Write;
                let _ = writeln!(f, "{}", msg);
            });
    }
}
