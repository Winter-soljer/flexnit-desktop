// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let log_path = "C:\\Users\\ARDJOOD\\Desktop\\tauri_run_log.txt";
    let _ = std::fs::write(log_path, "App started\n");

    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::Foundation::*;
        use windows_sys::Win32::System::Threading::*;
        use windows_sys::Win32::UI::WindowsAndMessaging::*;

        SetLastError(0);
        let mutex_name = b"Local\\FlexnitDesktopSingleInstanceMutex\0";
        let mutex = CreateMutexA(std::ptr::null(), 1, mutex_name.as_ptr());
        let last_err = GetLastError();

        let _ = std::fs::OpenOptions::new()
            .append(true)
            .open(log_path)
            .map(|mut f| {
                use std::io::Write;
                let _ = writeln!(f, "Mutex handle: {:?}, LastError: {}", mutex, last_err);
            });

        if !mutex.is_null() && last_err == ERROR_ALREADY_EXISTS {
            let _ = std::fs::OpenOptions::new()
                .append(true)
                .open(log_path)
                .map(|mut f| {
                    use std::io::Write;
                    let _ = writeln!(f, "Instance already exists! Focusing and exiting.");
                });
            let window_title = b"Flexnit\0";
            let hwnd = FindWindowA(std::ptr::null(), window_title.as_ptr());
            if !hwnd.is_null() {
                ShowWindow(hwnd, SW_RESTORE);
                SetForegroundWindow(hwnd);
            }
            return;
        }
    }

    std::panic::set_hook(Box::new(|info| {
        let msg = format!("Flexnit startup error: {}\n", info);
        let _ = std::fs::write("C:\\Users\\ARDJOOD\\Desktop\\tauri_crash.txt", &msg);
        let _ = std::fs::OpenOptions::new()
            .append(true)
            .open("C:\\Users\\ARDJOOD\\Desktop\\tauri_run_log.txt")
            .map(|mut f| {
                use std::io::Write;
                let _ = writeln!(f, "{}", msg);
            });
    }));

    let _ = std::fs::OpenOptions::new()
        .append(true)
        .open(log_path)
        .map(|mut f| {
            use std::io::Write;
            let _ = writeln!(f, "Invoking flexnit_lib::run()...");
        });

    flexnit_lib::run();

    let _ = std::fs::OpenOptions::new()
        .append(true)
        .open(log_path)
        .map(|mut f| {
            use std::io::Write;
            let _ = writeln!(f, "flexnit_lib::run() finished.");
        });
}
