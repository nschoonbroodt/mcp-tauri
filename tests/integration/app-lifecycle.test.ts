import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('App Lifecycle Management', () => {
    let client: MCPTestClient;
    const TEST_APP_PATH = path.resolve('./tests/mcp-tauri-test-app/src-tauri/target/release/bundle/appimage/mcp-tauri-test-app_0.1.0_amd64.AppImage');

    beforeAll(async () => {
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
        await client.cleanup();
    });

    describe('Basic App Startup', () => {
        it('should start app and verify window handles', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });

            expect(startResult).toBeDefined();
            expect(startResult.content[0].text).toContain('Started tauri-driver');
            expect(startResult.content[0].text).toContain('session_id');

            // Verify we can get URL
            const urlResult = await client.callTool('get_current_url', {});
            expect(urlResult).toBeDefined();
            expect(urlResult.content[0].text).toContain('Current URL:');

            // Clean up
            await client.callTool('close_session', {});
        }, 30000);

    });

    describe('Session Management', () => {
        it('should handle multiple start attempts gracefully', async () => {
            // Try to start again - should reuse existing session or handle gracefully
            const result = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });

            expect(result).toBeDefined();
            // Should either reuse session or start new one without crashing
            expect(result.content[0].text).toContain('Started tauri-driver');
        }, 30000);

        it('should close session successfully', async () => {
            const result = await client.callTool('close_session', {});

            expect(result).toBeDefined();
            expect(result.content[0].text).toContain('closed');
        });

        it('should fail operations after session closed', async () => {
            const result = await client.callTool('get_current_url', {});

            expect(result).toBeDefined();
            expect(result.content[0].text).toContain('Error');
            expect(result.content[0].text).toContain('No active browser session');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid app path gracefully', async () => {
            const result = await client.callTool('start_tauri_app', {
                application: '/nonexistent/path/to/app',
            });

            expect(result).toBeDefined();
            expect(result.content[0].text).toContain('Error starting Tauri app');
        }, 30000);

        it('should handle port conflicts gracefully', async () => {
            // First start an app on default ports
            await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });

            // Try to start another on same ports (should handle gracefully)
            const result = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
                port: 4444
            });

            // Should either reuse session or give meaningful error
            expect(result).toBeDefined();
            expect(result.content[0].text).toMatch(/(Started tauri-driver|Error)/);

            // Clean up
            await client.callTool('close_session', {});
        }, 60000);
    });


});