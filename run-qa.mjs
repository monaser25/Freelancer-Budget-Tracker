import { spawn, execSync } from 'child_process';
import http from 'http';

const port = process.env.PORT || '3000';
const webUrl = process.env.WEB_URL || `http://localhost:${port}`;
const env = {
  ...process.env,
  WEB_URL: webUrl,
  API_URL: process.env.API_URL || webUrl,
  NEXT_PUBLIC_API_URL: '',
  NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE || 'dev',
  ENABLE_DEV_AUTH: process.env.ENABLE_DEV_AUTH || 'true',
};

const web = spawn('npm', ['run', 'dev', '-w', 'apps/web', '--', '-p', port], { stdio: 'inherit', shell: true, env });

const attempt = () => {
  http.get(webUrl, (res) => {
    if (res.statusCode) {
      console.log('Web server is ready. Running QA script...');
      const qa = spawn('node', ['scripts/phase0-browser-qa.mjs'], { stdio: 'inherit', shell: true, env });
      qa.on('close', (code) => {
        web.kill();
        try {
          execSync(`npx kill-port ${port}`, { stdio: 'ignore' });
        } catch {
          // Best effort cleanup for Windows shells that keep child processes alive.
        }
        process.exit(code);
      });
    }
  }).on('error', () => {
    setTimeout(attempt, 1000);
  });
};

setTimeout(attempt, 2000);
