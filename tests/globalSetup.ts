import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const exec = promisify(spawn);

export default async function globalSetup() {
    console.log('Building Tauri test app...');

    const testAppPath = path.resolve('./tests/mcp-tauri-test-app');

    // Build the Tauri app
    await new Promise((resolve, reject) => {
        const build = spawn('npm run tauri build', {
            cwd: testAppPath,
            stdio: 'pipe', // Hide output
            shell: true
        });

        build.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Build failed with code ${code}`));
            } else {
                console.log('Tauri app built successfully!');
                resolve(undefined);
            }
        });
    });
}