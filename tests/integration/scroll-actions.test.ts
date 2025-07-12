import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('Scroll Actions', () => {
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

    describe('Basic Scroll Operations', () => {
        it('should scroll to top of page', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a page with content
            await client.callTool('navigate', {
                url: 'https://example.com'
            });

            // Scroll to top
            const scrollTopResult = await client.callTool('scroll_to_top', {});
            expect(scrollTopResult.content[0].text).toBe('Scrolled to top of page');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should scroll to bottom of page', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a longer page
            await client.callTool('navigate', {
                url: 'https://github.com/tauri-apps/tauri'
            });

            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Scroll to bottom
            const scrollBottomResult = await client.callTool('scroll_to_bottom', {});
            expect(scrollBottomResult.content[0].text).toBe('Scrolled to bottom of page');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should scroll by specific pixels', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a page
            await client.callTool('navigate', {
                url: 'https://github.com/tauri-apps/tauri'
            });

            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Scroll down by 500 pixels
            const scrollDownResult = await client.callTool('scroll_by', {
                x: 0,
                y: 500
            });
            expect(scrollDownResult.content[0].text).toBe('Scrolled by x=0, y=500');

            // Scroll right by 100 pixels
            const scrollRightResult = await client.callTool('scroll_by', {
                x: 100,
                y: 0
            });
            expect(scrollRightResult.content[0].text).toBe('Scrolled by x=100, y=0');

            // Scroll up and left
            const scrollUpLeftResult = await client.callTool('scroll_by', {
                x: -100,
                y: -200
            });
            expect(scrollUpLeftResult.content[0].text).toBe('Scrolled by x=-100, y=-200');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Scroll to Element', () => {
        it('should scroll to a specific element', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a page with elements
            await client.callTool('navigate', {
                url: 'https://github.com/tauri-apps/tauri'
            });

            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Scroll to an element at the bottom (e.g., footer)
            const scrollToElementResult = await client.callTool('scroll_to_element', {
                by: 'css',
                value: 'footer'
            });
            expect(scrollToElementResult.content[0].text).toBe('Scrolled to element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle scroll to non-existent element', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a page
            await client.callTool('navigate', {
                url: 'https://example.com'
            });

            // Try to scroll to non-existent element
            const result = await client.callTool('scroll_to_element', {
                by: 'id',
                value: 'non-existent-element-id'
            });
            expect(result.content[0].text).toContain('Error scrolling to element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Complex Scroll Scenarios', () => {
        it('should perform multiple scroll operations in sequence', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a long page
            await client.callTool('navigate', {
                url: 'https://github.com/tauri-apps/tauri'
            });

            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Scroll sequence
            // 1. Scroll to bottom
            let result = await client.callTool('scroll_to_bottom', {});
            expect(result.content[0].text).toBe('Scrolled to bottom of page');

            // 2. Scroll up by 300 pixels
            result = await client.callTool('scroll_by', { x: 0, y: -300 });
            expect(result.content[0].text).toBe('Scrolled by x=0, y=-300');

            // 3. Scroll to top
            result = await client.callTool('scroll_to_top', {});
            expect(result.content[0].text).toBe('Scrolled to top of page');

            // 4. Scroll to a specific element
            result = await client.callTool('scroll_to_element', {
                by: 'css',
                value: '[href="#features"]'
            });
            expect(result.content[0].text).toBe('Scrolled to element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Error Handling', () => {
        it('should fail scroll operations when no session is active', async () => {
            // Try to scroll without session
            let result = await client.callTool('scroll_to_top', {});
            expect(result.content[0].text).toContain('Error');
            expect(result.content[0].text).toContain('No active browser session');

            // Try to scroll by pixels without session
            result = await client.callTool('scroll_by', { x: 0, y: 100 });
            expect(result.content[0].text).toContain('Error');
            expect(result.content[0].text).toContain('No active browser session');

            // Try to scroll to element without session
            result = await client.callTool('scroll_to_element', {
                by: 'id',
                value: 'some-id'
            });
            expect(result.content[0].text).toContain('Error');
            expect(result.content[0].text).toContain('No active browser session');
        });
    });
});