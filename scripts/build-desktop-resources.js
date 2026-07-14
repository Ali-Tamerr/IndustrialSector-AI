const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ponytail: single Node.js script to prepare standalone Tauri resources cross-platform.
const rootDir = path.resolve(__dirname, '..');
const resourcesDir = path.join(rootDir, 'src-tauri', 'resources');
const frontendDistDir = path.join(rootDir, 'frontend-dist');

console.log('[Build] Ensuring resources directory exists...');
fs.mkdirSync(resourcesDir, { recursive: true });
fs.mkdirSync(frontendDistDir, { recursive: true });

// 1. Build Next.js app
console.log('[Build] Building Next.js production app...');
execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

// 2. Build Python daemon
console.log('[Build] Compiling Python daemon into executable...');
try {
  const pyinstallerPath = path.join(rootDir, '.venv', 'Scripts', 'pyinstaller.exe');
  const pyinstallerUnix = path.join(rootDir, '.venv', 'bin', 'pyinstaller');
  const cmd = fs.existsSync(pyinstallerPath) ? pyinstallerPath : (fs.existsSync(pyinstallerUnix) ? pyinstallerUnix : 'pyinstaller');
  execSync(`"${cmd}" --onefile --clean --paths=backend backend/daemon.py`, { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('[Build] Failed to run PyInstaller. Make sure pyinstaller is installed in the virtualenv.', error);
  process.exit(1);
}

// 3. Copy binaries
console.log('[Build] Copying compiled daemon executable...');
fs.copyFileSync(
  path.join(rootDir, 'dist', 'daemon.exe'),
  path.join(resourcesDir, 'daemon.exe')
);

console.log('[Build] Copying Node.js binary...');
const localNode = process.execPath;
fs.copyFileSync(localNode, path.join(resourcesDir, 'node.exe'));

// 4. Copy standalone Next.js build
const standaloneDest = path.join(resourcesDir, 'standalone');
console.log('[Build] Copying standalone Next.js server files...');
if (fs.existsSync(standaloneDest)) {
  fs.rmSync(standaloneDest, { recursive: true, force: true });
}
fs.mkdirSync(standaloneDest, { recursive: true });

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(path.join(rootDir, '.next', 'standalone'), standaloneDest);
copyRecursiveSync(path.join(rootDir, 'public'), path.join(standaloneDest, 'public'));
copyRecursiveSync(path.join(rootDir, '.next', 'static'), path.join(standaloneDest, '.next', 'static'));

const entryHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Industrial Control Tower</title>
    <meta http-equiv="refresh" content="0;url=http://127.0.0.1:3160/" />
    <style>
      :root {
        color-scheme: dark;
      }
      html, body {
        margin: 0;
        height: 100%;
        background: #05070b;
        color: #d7e6ff;
        font-family: Arial, Helvetica, sans-serif;
      }
      body {
        display: grid;
        place-items: center;
      }
      .shell {
        display: grid;
        gap: 12px;
        justify-items: center;
        text-align: center;
        padding: 32px;
      }
      .ring {
        width: 56px;
        height: 56px;
        border-radius: 999px;
        border: 3px solid rgba(96, 165, 250, 0.18);
        border-top-color: rgba(96, 165, 250, 0.95);
        animation: spin 1s linear infinite;
      }
      .title {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .sub {
        font-size: 12px;
        color: #8ea1c7;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="ring" aria-hidden="true"></div>
      <div class="title">Industrial Control Tower</div>
      <div class="sub">Starting local server...</div>
    </div>
    <script>
      window.location.replace('http://127.0.0.1:3160/');
    </script>
  </body>
</html>
`;

fs.writeFileSync(path.join(frontendDistDir, 'index.html'), entryHtml, 'utf8');

console.log('[Build] Standalone resources successfully bundled!');
