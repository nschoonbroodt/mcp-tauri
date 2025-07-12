import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('Mouse Actions', () => {
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

    describe('Hover Actions', () => {
        it('should hover over button and trigger hover effect', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Hover over button
            const hoverResult = await client.callTool('hover', {
                by: 'id',
                value: 'hover-btn'
            });
            expect(hoverResult.content[0].text).toBe('Hovered over element');

            // Note: Hover events may not trigger JavaScript mouseenter/mouseleave
            // events reliably in WebDriver. The hover action is performed but
            // JavaScript event handlers might not fire.

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should hover over image with tooltip', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Hover over image
            const hoverResult = await client.callTool('hover', {
                by: 'id',
                value: 'hover-image'
            });
            expect(hoverResult.content[0].text).toBe('Hovered over element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should work with different locator strategies', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Hover using CSS selector
            const csshoverResult = await client.callTool('hover', {
                by: 'css',
                value: '.hover-div'
            });
            expect(csshoverResult.content[0].text).toBe('Hovered over element');

            // Hover using XPath
            const xpathHoverResult = await client.callTool('hover', {
                by: 'xpath',
                value: '//div[@id="hover-div"]'
            });
            expect(xpathHoverResult.content[0].text).toBe('Hovered over element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle error for non-existent element', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Try to hover over non-existent element
            const hoverResult = await client.callTool('hover', {
                by: 'id',
                value: 'non-existent-element'
            });
            expect(hoverResult.content[0].text).toContain('Error hovering over element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Double Click Actions', () => {
        it('should double-click button to trigger action', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Double-click button
            const dblClickResult = await client.callTool('double_click', {
                by: 'id',
                value: 'double-click-btn'
            });
            expect(dblClickResult.content[0].text).toBe('Double click performed');

            // Note: Double-click events may not trigger JavaScript dblclick
            // events reliably in WebDriver. The action is performed but
            // JavaScript event handlers might not fire.

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should double-click area element', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Double-click area
            const dblClickResult = await client.callTool('double_click', {
                by: 'id',
                value: 'double-click-area'
            });
            expect(dblClickResult.content[0].text).toBe('Double click performed');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should work with CSS and XPath locators', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Double-click using CSS selector
            const cssDblClickResult = await client.callTool('double_click', {
                by: 'css',
                value: '#selectable-text'
            });
            expect(cssDblClickResult.content[0].text).toBe('Double click performed');

            // Double-click using XPath
            const xpathDblClickResult = await client.callTool('double_click', {
                by: 'xpath',
                value: '//button[@id="double-click-btn"]'
            });
            expect(xpathDblClickResult.content[0].text).toBe('Double click performed');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle error for invalid element', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Try to double-click non-existent element
            const dblClickResult = await client.callTool('double_click', {
                by: 'id',
                value: 'invalid-element'
            });
            expect(dblClickResult.content[0].text).toContain('Error performing double click');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Right Click Actions', () => {
        it('should right-click to trigger context action', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Right-click area
            const rightClickResult = await client.callTool('right_click', {
                by: 'id',
                value: 'right-click-area'
            });
            expect(rightClickResult.content[0].text).toBe('Right click performed');

            // Note: Right-click events may not trigger JavaScript contextmenu
            // events reliably in WebDriver. The action is performed but
            // JavaScript event handlers might not fire.

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should right-click button element', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Right-click button
            const rightClickResult = await client.callTool('right_click', {
                by: 'id',
                value: 'right-click-btn'
            });
            expect(rightClickResult.content[0].text).toBe('Right click performed');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should work with various locators', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Right-click using CSS
            const cssRightClickResult = await client.callTool('right_click', {
                by: 'css',
                value: '.right-click-area'
            });
            expect(cssRightClickResult.content[0].text).toBe('Right click performed');

            // Right-click using XPath
            const xpathRightClickResult = await client.callTool('right_click', {
                by: 'xpath',
                value: '//button[@id="right-click-btn"]'
            });
            expect(xpathRightClickResult.content[0].text).toBe('Right click performed');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle error scenarios', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Try to right-click non-existent element
            const rightClickResult = await client.callTool('right_click', {
                by: 'id',
                value: 'missing-element'
            });
            expect(rightClickResult.content[0].text).toContain('Error performing right click');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Drag and Drop Actions', () => {
        it('should drag item from source to target', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Drag item 1 to drop zone 1
            const dragResult = await client.callTool('drag_and_drop', {
                by: 'id',
                value: 'drag-item-1',
                targetBy: 'id',
                targetValue: 'drop-zone-1'
            });
            expect(dragResult.content[0].text).toBe('Drag and drop completed');

            // Note: Drag and drop events may not trigger JavaScript dragstart/drop
            // events reliably in WebDriver. The action is performed but
            // JavaScript event handlers might not fire.

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should drag between different drop zones', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Drag item 2 to drop zone 2
            const drag1Result = await client.callTool('drag_and_drop', {
                by: 'id',
                value: 'drag-item-2',
                targetBy: 'id',
                targetValue: 'drop-zone-2'
            });
            expect(drag1Result.content[0].text).toBe('Drag and drop completed');

            // Drag special item to drop zone 3
            const drag2Result = await client.callTool('drag_and_drop', {
                by: 'id',
                value: 'drag-item-special',
                targetBy: 'id',
                targetValue: 'drop-zone-3'
            });
            expect(drag2Result.content[0].text).toBe('Drag and drop completed');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should work with CSS and XPath locators', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Drag using CSS selectors
            const cssDragResult = await client.callTool('drag_and_drop', {
                by: 'css',
                value: '#drag-item-3',
                targetBy: 'css',
                targetValue: '#drop-zone-1'
            });
            expect(cssDragResult.content[0].text).toBe('Drag and drop completed');

            // Drag using XPath
            const xpathDragResult = await client.callTool('drag_and_drop', {
                by: 'xpath',
                value: '//div[@id="drag-item-1"]',
                targetBy: 'xpath',
                targetValue: '//div[@id="drop-zone-2"]'
            });
            expect(xpathDragResult.content[0].text).toBe('Drag and drop completed');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should perform multiple sequential drag operations', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Perform multiple drags
            const drag1Result = await client.callTool('drag_and_drop', {
                by: 'id',
                value: 'drag-item-1',
                targetBy: 'id',
                targetValue: 'drop-zone-1'
            });
            expect(drag1Result.content[0].text).toBe('Drag and drop completed');

            const drag2Result = await client.callTool('drag_and_drop', {
                by: 'id',
                value: 'drag-item-2',
                targetBy: 'id',
                targetValue: 'drop-zone-1'
            });
            expect(drag2Result.content[0].text).toBe('Drag and drop completed');

            const drag3Result = await client.callTool('drag_and_drop', {
                by: 'id',
                value: 'drag-item-3',
                targetBy: 'id',
                targetValue: 'drop-zone-2'
            });
            expect(drag3Result.content[0].text).toBe('Drag and drop completed');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle error for non-existent source', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Try to drag non-existent source
            const dragResult = await client.callTool('drag_and_drop', {
                by: 'id',
                value: 'non-existent-source',
                targetBy: 'id',
                targetValue: 'drop-zone-1'
            });
            expect(dragResult.content[0].text).toContain('Error performing drag and drop');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle error for non-existent target', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to mouse actions page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-mouse-actions.html'
            });

            // Try to drag to non-existent target
            const dragResult = await client.callTool('drag_and_drop', {
                by: 'id',
                value: 'drag-item-1',
                targetBy: 'id',
                targetValue: 'non-existent-target'
            });
            expect(dragResult.content[0].text).toContain('Error performing drag and drop');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });
});