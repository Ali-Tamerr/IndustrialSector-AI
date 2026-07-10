use std::process::{Child, Command};
use std::sync::Mutex;
use std::path::Path;
use std::net::TcpStream;
use std::time::{Duration, Instant};
use tauri::Manager;

struct AppState {
    next_process: Mutex<Option<Child>>,
    python_process: Mutex<Option<Child>>,
}

// Windows-specific process tree termination or standard process kill for Unix
fn kill_process_tree(pid: u32, name: &str) {
    println!("[Tauri] Terminating background service {} (PID: {})...", name, pid);
    if cfg!(target_os = "windows") {
        let _ = Command::new("taskkill")
            .args(["/pid", &pid.to_string(), "/f", "/t"])
            .spawn();
    } else {
        let _ = Command::new("kill")
            .args(["-9", &pid.to_string()])
            .spawn();
    }
}

fn wait_for_local_server(port: u16, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;

    while Instant::now() < deadline {
        if TcpStream::connect(("127.0.0.1", port)).is_ok() {
            return true;
        }

        std::thread::sleep(Duration::from_millis(250));
    }

    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // ponytail: simplified dev/release process spawner. In dev, we spawn scripts. In release, we run bundled binaries directly.
      let is_dev = cfg!(debug_assertions);
      let mut python_child = None;
      let mut next_child = None;

      if is_dev {
          // Dev Mode: Spawn using local virtual environment and npm
          let run_dir = Path::new("..").join("backend");
          let venv_python = Path::new("..").join(".venv").join("Scripts").join("python.exe");
          let python_cmd = if venv_python.exists() {
              venv_python.to_str().unwrap().to_string()
          } else {
              let venv_python_unix = Path::new("..").join(".venv").join("bin").join("python");
              if venv_python_unix.exists() {
                  venv_python_unix.to_str().unwrap().to_string()
              } else {
                  "python".to_string()
              }
          };

          println!("[Tauri] Dev Mode: Spawning background Python Daemon...");
          let python_proc = if cfg!(target_os = "windows") {
              Command::new("cmd")
                  .args(["/C", &format!("\"{}\" daemon.py", python_cmd)])
                  .current_dir(&run_dir)
                  .spawn()
          } else {
              Command::new(&python_cmd)
                  .arg("daemon.py")
                  .current_dir(&run_dir)
                  .spawn()
          };

          match python_proc {
              Ok(child) => {
                  println!("[Tauri] Python Daemon spawned (PID: {})", child.id());
                  python_child = Some(child);
              }
              Err(e) => eprintln!("[Tauri] Failed to spawn Python Daemon: {}", e),
          }
      } else {
          // Release Mode: Zero-dependency execution using bundled sidecar resources
          let resource_dir = app.path().resource_dir().expect("failed to get resource directory");
          let resources_path = resource_dir.join("resources");
          let daemon_exe = resources_path.join("daemon.exe");
          let node_exe = resources_path.join("node.exe");
          let standalone_path = resources_path.join("standalone");
          let server_js = standalone_path.join("server.js");

          println!("[Tauri] Production: Spawning bundled Python Daemon...");
          let python_proc = Command::new(&daemon_exe)
              .current_dir(&resources_path)
              .spawn();

          match python_proc {
              Ok(child) => {
                  println!("[Tauri] Bundled Python Daemon spawned (PID: {})", child.id());
                  python_child = Some(child);
              }
              Err(e) => eprintln!("[Tauri] Failed to spawn bundled Python Daemon: {}", e),
          }

          println!("[Tauri] Production: Spawning bundled Next.js server on port 3160...");
          let next_proc = Command::new(&node_exe)
              .arg(&server_js)
              .env("HOSTNAME", "127.0.0.1")
              .env("PORT", "3160")
              .current_dir(&standalone_path)
              .spawn();

          match next_proc {
              Ok(child) => {
                  println!("[Tauri] Bundled Next.js Server spawned (PID: {})", child.id());
                  next_child = Some(child);
              }
              Err(e) => eprintln!("[Tauri] Failed to spawn bundled Next.js Server: {}", e),
          }

          if !wait_for_local_server(3160, Duration::from_secs(30)) {
              eprintln!("[Tauri] Local server did not become ready within 30 seconds.");
          }
      }


      // Store child process handles in app state
      app.manage(AppState {
          next_process: Mutex::new(next_child),
          python_process: Mutex::new(python_child),
      });

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app_handle, event| {
        if let tauri::RunEvent::Exit = event {
            // Retrieve process states and clean up cleanly on exit
            let state = app_handle.state::<AppState>();
            
            if let Ok(mut lock) = state.next_process.lock() {
                if let Some(child) = lock.take() {
                    kill_process_tree(child.id(), "Next.js Server");
                }
            };

            if let Ok(mut lock) = state.python_process.lock() {
                if let Some(child) = lock.take() {
                    kill_process_tree(child.id(), "Python Daemon");
                }
            };
        }
    });
}
