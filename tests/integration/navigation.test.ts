import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('Navigation Tools', () => {
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

    describe('Basic Navigation', () => {
        it('should navigate to a URL and get current URL', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a URL
            const navResult = await client.callTool('navigate', {
                url: 'https://tauri.app'
            });
            expect(navResult.content[0].text).toBe('Navigated to https://tauri.app');

            // Get current URL
            const urlResult = await client.callTool('get_current_url', {});
            expect(urlResult.content[0].text).toContain('Current URL:');
            expect(urlResult.content[0].text).toContain('tauri.app');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should get page title', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a URL
            await client.callTool('navigate', {
                url: 'https://example.com'
            });

            // Get page title
            const titleResult = await client.callTool('get_title', {});
            expect(titleResult.content[0].text).toContain('Page title:');
            expect(titleResult.content[0].text).toContain('Example');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should refresh the page', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a URL
            await client.callTool('navigate', {
                url: 'https://example.com'
            });

            // Refresh the page
            const refreshResult = await client.callTool('refresh_page', {});
            expect(refreshResult.content[0].text).toBe('Page refreshed');

            // Verify we're still on the same page
            const urlResult = await client.callTool('get_current_url', {});
            expect(urlResult.content[0].text).toContain('example.com');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Browser History Navigation', () => {
        it('should navigate back and forward in history', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to first URL
            await client.callTool('navigate', {
                url: 'https://example.com'
            });

            // Navigate to second URL
            await client.callTool('navigate', {
                url: 'https://tauri.app'
            });

            // Verify we're on the second page
            let urlResult = await client.callTool('get_current_url', {});
            expect(urlResult.content[0].text).toContain('tauri.app');

            // Go back
            const backResult = await client.callTool('go_back', {});
            expect(backResult.content[0].text).toBe('Navigated back');

            // Verify we're on the first page
            urlResult = await client.callTool('get_current_url', {});
            expect(urlResult.content[0].text).toContain('example.com');

            // Go forward
            const forwardResult = await client.callTool('go_forward', {});
            expect(forwardResult.content[0].text).toBe('Navigated forward');

            // Verify we're back on the second page
            urlResult = await client.callTool('get_current_url', {});
            expect(urlResult.content[0].text).toContain('tauri.app');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Page Source', () => {
        it('should get page source HTML', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a URL
            await client.callTool('navigate', {
                url: 'https://example.com'
            });

            // Get page source
            const sourceResult = await client.callTool('get_page_source', {});
            expect(sourceResult).toBeDefined();
            expect(sourceResult.content[0].text).toContain('<html');
            expect(sourceResult.content[0].text).toContain('</html>');
            expect(sourceResult.content[0].text).toContain('Example Domain');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Error Handling', () => {
        it('should fail navigation operations when no session is active', async () => {
            // Try to navigate without session
            let result = await client.callTool('navigate', {
                url: 'https://example.com'
            });
            expect(result.content[0].text).toContain('Error');
            expect(result.content[0].text).toContain('No active browser session');

            // Try to get URL without session
            result = await client.callTool('get_current_url', {});
            expect(result.content[0].text).toContain('Error');
            expect(result.content[0].text).toContain('No active browser session');

            // Try to go back without session
            result = await client.callTool('go_back', {});
            expect(result.content[0].text).toContain('Error');
            expect(result.content[0].text).toContain('No active browser session');
        });

        it('should handle invalid URLs gracefully', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Try to navigate to invalid URL
            const result = await client.callTool('navigate', {
                url: 'not-a-valid-url'
            });
            expect(result.content[0].text).toContain('Error navigating');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Multiple Navigations', () => {
        it('should handle multiple sequential navigations', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            const urls = [
                'https://example.com',
                'https://tauri.app',
                'https://github.com'
            ];

            // Navigate to multiple URLs
            for (const url of urls) {
                const navResult = await client.callTool('navigate', { url });
                expect(navResult.content[0].text).toBe(`Navigated to ${url}`);

                // Verify current URL
                const urlResult = await client.callTool('get_current_url', {});
                expect(urlResult.content[0].text).toContain(url.replace('https://', ''));
            }

            // Close session
            await client.callTool('close_session', {});
        }, 45000);
    });
});