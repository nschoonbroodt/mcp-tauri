import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('Window Management Tools', () => {
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


    describe('Window Size and Position', () => {
        it('should set and get window size', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Set window size
            const setSizeResult = await client.callTool('set_window_size', {
                width: 800,
                height: 600
            });
            expect(setSizeResult.content[0].text).toBe('Window size set to 800x600');

            // Get window rect to verify
            const rectResult = await client.callTool('get_window_rect', {});

            // Parse the rect values
            const rectMatch = rectResult.content[0].text.match(/x=(\d+), y=(\d+), width=(\d+), height=(\d+)/);
            expect(rectMatch).toBeTruthy();

            const width = parseInt(rectMatch![3]);
            const height = parseInt(rectMatch![4]);

            // Allow margin of error (window decorations, borders, etc.)
            const margin = 50;
            expect(Math.abs(width - 800)).toBeLessThan(margin);
            expect(Math.abs(height - 600)).toBeLessThan(margin);

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should set and get window position', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Set window position
            const setPosResult = await client.callTool('set_window_position', {
                x: 100,
                y: 100
            });
            expect(setPosResult.content[0].text).toBe('Window position set to (100, 100)');

            // Get window rect to verify
            const rectResult = await client.callTool('get_window_rect', {});

            // Parse the rect values
            const rectMatch = rectResult.content[0].text.match(/x=(\d+), y=(\d+), width=(\d+), height=(\d+)/);
            expect(rectMatch).toBeTruthy();

            const x = parseInt(rectMatch![1]);
            const y = parseInt(rectMatch![2]);

            // Allow margin of error (window manager differences, decorations, etc.)
            const margin = 50;
            expect(Math.abs(x - 100)).toBeLessThan(margin);
            expect(Math.abs(y - 100)).toBeLessThan(margin);

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should get complete window rect', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Get window rect
            const rectResult = await client.callTool('get_window_rect', {});
            expect(rectResult.content[0].text).toMatch(/Window rect: x=\d+, y=\d+, width=\d+, height=\d+/);

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Window State Operations', () => {
        it('should maximize window', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Maximize window
            const maxResult = await client.callTool('maximize_window', {});
            expect(maxResult.content[0].text).toBe('Window maximized');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should minimize window', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Minimize window
            const minResult = await client.callTool('minimize_window', {});
            expect(minResult.content[0].text).toBe('Window minimized');

            // Note: Window might be minimized and not visible at this point
            // but we can still interact with it programmatically

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });


});