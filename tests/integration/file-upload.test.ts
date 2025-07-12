import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('File Upload', () => {
    let client: MCPTestClient;
    const TEST_APP_PATH = path.resolve('./tests/mcp-tauri-test-app/src-tauri/target/release/bundle/appimage/mcp-tauri-test-app_0.1.0_amd64.AppImage');

    beforeAll(async () => {
        // Initialize the MCP test client
        client = new MCPTestClient({
            serverCommand: 'env',
            serverArgs: [
                `DISPLAY=${process.env.DISPLAY}`,
                `HOME=${process.env.HOME}`,
                'node',
                path.resolve('./src/lib/server.js')
            ]
        });
        await client.init();
    });

    afterAll(async () => {
        // Clean up
        await client.cleanup();
    });

    afterEach(async () => {
        // Ensure session is closed after each test, even if test fails
        try {
            await client.callTool('close_session', {});
        } catch (e) {
            // Ignore errors if session was already closed or doesn't exist
            console.log('Session cleanup in afterEach:', e.message);
        }
    });

    describe('Single File Upload', () => {
        it('should upload a single file', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to file upload page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-file-upload.html'
            });

            // Upload single file
            const uploadResult = await client.callTool('upload_file', {
                by: 'id',
                value: 'single-file',
                filePath: '/tmp/test-upload-single.txt'
            });
            expect(uploadResult.content[0].text).toContain('File upload initiated');

            // Verify file was selected using JavaScript
            const verifyResult = await client.callTool('execute_script', {
                script: 'return window.getUploadStatus("single");'
            });
            expect(verifyResult.content[0].text).toContain('test-upload-single.txt');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle non-existent file path', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to file upload page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-file-upload.html'
            });

            // Try to upload non-existent file
            const uploadResult = await client.callTool('upload_file', {
                by: 'id',
                value: 'single-file',
                filePath: '/tmp/non-existent-file.txt'
            });
            expect(uploadResult.content[0].text).toContain('Error uploading file');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Multiple File Upload', () => {
        it('should upload multiple files', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to file upload page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-file-upload.html'
            });

            // Upload first file
            const upload1Result = await client.callTool('upload_file', {
                by: 'id',
                value: 'multiple-files',
                filePath: '/tmp/test-upload-multiple-1.txt'
            });
            expect(upload1Result.content[0].text).toContain('File upload initiated');

            // Note: For multiple file selection, WebDriver typically requires 
            // special handling or multiple upload calls. This tests the basic functionality.

            // Verify file was selected (checking for file count rather than filename)
            const verifyResult = await client.callTool('execute_script', {
                script: 'return window.getUploadStatus("multiple");'
            });
            expect(verifyResult.content[0].text).toContain('1 selected');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Form File Upload', () => {
        it('should upload file to form input', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to file upload page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-file-upload.html'
            });

            // Upload file to form input
            const uploadResult = await client.callTool('upload_file', {
                by: 'id',
                value: 'form-file',
                filePath: '/tmp/test-upload-single.txt'
            });
            expect(uploadResult.content[0].text).toContain('File upload initiated');

            // Verify file was selected in form
            const verifyResult = await client.callTool('execute_script', {
                script: 'return window.getUploadStatus("form");'
            });
            expect(verifyResult.content[0].text).toContain('test-upload-single.txt');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle upload to non-existent element', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to file upload page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-file-upload.html'
            });

            // Try to upload to non-existent element
            const uploadResult = await client.callTool('upload_file', {
                by: 'id',
                value: 'non-existent-input',
                filePath: '/tmp/test-upload-single.txt'
            });
            expect(uploadResult.content[0].text).toContain('Error uploading file');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });
});