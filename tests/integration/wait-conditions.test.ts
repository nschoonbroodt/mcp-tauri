import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('Wait Conditions', () => {
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

    describe('Element Visibility Waits', () => {
        it('should wait for element to become visible', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to dynamic test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-dynamic.html'
            });

            // Click button to show element (with 1s delay)
            await client.callTool('click_element', {
                by: 'id',
                value: 'show-btn'
            });

            // Wait for element to become visible
            const waitResult = await client.callTool('wait_for_element_visible', {
                by: 'id',
                value: 'dynamic-element',
                timeout: 5000
            });
            expect(waitResult.content[0].text).toContain('Element is now visible');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should wait for element to become not visible', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to dynamic test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-dynamic.html'
            });

            // First show the element
            await client.callTool('click_element', {
                by: 'id',
                value: 'show-btn'
            });

            // Wait for it to be visible first
            await client.callTool('wait_for_element_visible', {
                by: 'id',
                value: 'dynamic-element',
                timeout: 5000
            });

            // Now click button to hide element (with 1s delay)
            await client.callTool('click_element', {
                by: 'id',
                value: 'hide-btn'
            });

            // Wait for element to become not visible
            const waitResult = await client.callTool('wait_for_element_not_visible', {
                by: 'id',
                value: 'dynamic-element',
                timeout: 5000
            });
            expect(waitResult.content[0].text).toContain('Element is no longer visible');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should timeout when element never becomes visible', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to dynamic test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-dynamic.html'
            });

            // Wait for non-existent element with short timeout
            const waitResult = await client.callTool('wait_for_element_visible', {
                by: 'id',
                value: 'non-existent-element',
                timeout: 2000
            });
            expect(waitResult.content[0].text).toContain('Error waiting for element to be visible');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Element Clickability Waits', () => {
        it('should wait for element to become clickable', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to dynamic test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-dynamic.html'
            });

            // Click button to enable disabled button (with 1s delay)
            await client.callTool('click_element', {
                by: 'id',
                value: 'enable-btn'
            });

            // Wait for button to become clickable
            const waitResult = await client.callTool('wait_for_element_clickable', {
                by: 'id',
                value: 'disabled-btn',
                timeout: 5000
            });
            expect(waitResult.content[0].text).toContain('Element is now clickable');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should timeout when element never becomes clickable', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to dynamic test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-dynamic.html'
            });

            // Wait for disabled button to become clickable (without enabling it) with short timeout
            const waitResult = await client.callTool('wait_for_element_clickable', {
                by: 'id',
                value: 'disabled-btn',
                timeout: 2000
            });
            expect(waitResult.content[0].text).toContain('Error waiting for element to be clickable');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Page State Waits', () => {
        it('should wait for title to contain text', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to navigation test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-navigation.html'
            });

            // Click button to change title (with 1s delay)
            await client.callTool('click_element', {
                by: 'id',
                value: 'change-title-btn'
            });

            // Wait for title to contain new text
            const waitResult = await client.callTool('wait_for_title_contains', {
                title: 'New Title Text',
                timeout: 5000
            });
            expect(waitResult.content[0].text).toContain('Title now contains: New Title Text');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should wait for URL to contain text', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to navigation test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-navigation.html'
            });

            // Click button to change URL (with 1s delay)
            await client.callTool('click_element', {
                by: 'id',
                value: 'change-url-btn'
            });

            // Wait for URL to contain new hash
            const waitResult = await client.callTool('wait_for_url_contains', {
                url: '#newurl',
                timeout: 5000
            });
            expect(waitResult.content[0].text).toContain('URL now contains: #newurl');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should timeout when title never changes', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to navigation test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-navigation.html'
            });

            // Wait for title that will never appear with short timeout
            const waitResult = await client.callTool('wait_for_title_contains', {
                title: 'This Title Will Never Appear',
                timeout: 2000
            });
            expect(waitResult.content[0].text).toContain('Error waiting for title to contain text');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Different Locator Strategies', () => {
        it('should work with CSS selectors', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to dynamic test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-dynamic.html'
            });

            // Click button to show element
            await client.callTool('click_element', {
                by: 'id',
                value: 'show-btn'
            });

            // Wait for element using CSS selector
            const waitResult = await client.callTool('wait_for_element_visible', {
                by: 'css',
                value: '#dynamic-element',
                timeout: 5000
            });
            expect(waitResult.content[0].text).toContain('Element is now visible');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should work with XPath', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to dynamic test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-dynamic.html'
            });

            // Click button to show element
            await client.callTool('click_element', {
                by: 'id',
                value: 'show-btn'
            });

            // Wait for element using XPath
            const waitResult = await client.callTool('wait_for_element_visible', {
                by: 'xpath',
                value: '//div[@id="dynamic-element"]',
                timeout: 5000
            });
            expect(waitResult.content[0].text).toContain('Element is now visible');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Custom Timeouts', () => {
        it('should respect custom timeout values', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to dynamic test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-dynamic.html'
            });

            // Click button for delayed show (3s delay)
            await client.callTool('click_element', {
                by: 'id',
                value: 'delayed-show-btn'
            });

            // Wait with longer timeout to accommodate the 3s delay
            const waitResult = await client.callTool('wait_for_element_visible', {
                by: 'id',
                value: 'delayed-element',
                timeout: 10000
            });
            expect(waitResult.content[0].text).toContain('Element is now visible');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should timeout quickly with short timeout', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to dynamic test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-dynamic.html'
            });

            // Click button for delayed show (3s delay)
            await client.callTool('click_element', {
                by: 'id',
                value: 'delayed-show-btn'
            });

            // Wait with short timeout that should fail
            const waitResult = await client.callTool('wait_for_element_visible', {
                by: 'id',
                value: 'delayed-element',
                timeout: 1000
            });
            expect(waitResult.content[0].text).toContain('Error waiting for element to be visible');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Sequential Wait Operations', () => {
        it('should handle multiple waits in sequence', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to dynamic test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-wait-dynamic.html'
            });

            // Show element
            await client.callTool('click_element', {
                by: 'id',
                value: 'show-btn'
            });

            // Wait for visible
            const visibleResult = await client.callTool('wait_for_element_visible', {
                by: 'id',
                value: 'dynamic-element',
                timeout: 5000
            });
            expect(visibleResult.content[0].text).toContain('Element is now visible');

            // Hide element
            await client.callTool('click_element', {
                by: 'id',
                value: 'hide-btn'
            });

            // Wait for not visible
            const notVisibleResult = await client.callTool('wait_for_element_not_visible', {
                by: 'id',
                value: 'dynamic-element',
                timeout: 5000
            });
            expect(notVisibleResult.content[0].text).toContain('Element is no longer visible');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });
});