import { spawn, execSync } from 'child_process';
import http from 'http';

const api = spawn('npm', ['start', '-w', 'apps/api'], { stdio: 'inherit', shell: true });
const web = spawn('npm', ['start', '-w', 'apps/web'], { stdio: 'inherit', shell: true });

const attempt = () => {
  http.get('http://localhost:3000', (res) => {
    if (res.statusCode) {
      console.log('Web server is ready. Running QA script...');
      const qa = spawn('node', ['scripts/phase1-auth-qa.mjs'], { stdio: 'inherit', shell: true });
      qa.on('close', (code) => {
        api.kill();
        web.kill();
        execSync('npx kill-port 3000 4000', { stdio: 'ignore' });
        process.exit(code);
      });
    }
  }).on('error', () => {
    setTimeout(attempt, 1000);
  });
};

setTimeout(attempt, 2000);
