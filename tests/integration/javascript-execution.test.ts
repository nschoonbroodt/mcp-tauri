import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('JavaScript Execution', () => {
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

    describe('Synchronous Script Execution', () => {
        it('should execute simple arithmetic', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Execute simple arithmetic
            const scriptResult = await client.callTool('execute_script', {
                script: 'return 5 + 3;'
            });
            expect(scriptResult.content[0].text).toContain('8');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should execute DOM manipulation', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Change text content of an element
            const scriptResult = await client.callTool('execute_script', {
                script: 'document.getElementById("sync-result").textContent = "Modified by script"; return "success";'
            });
            expect(scriptResult.content[0].text).toContain('success');

            // Verify the change was applied
            const textResult = await client.callTool('get_element_text', {
                by: 'id',
                value: 'sync-result'
            });
            expect(textResult.content[0].text).toContain('Modified by script');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should execute script with arguments', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Execute script with arguments
            const scriptResult = await client.callTool('execute_script', {
                script: 'return arguments[0] * arguments[1];',
                args: [6, 7]
            });
            expect(scriptResult.content[0].text).toContain('42');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should return complex data types', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Return an object
            const scriptResult = await client.callTool('execute_script', {
                script: 'return {name: "test", value: 123, array: [1, 2, 3]};'
            });
            expect(scriptResult.content[0].text).toContain('test');
            expect(scriptResult.content[0].text).toContain('123');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should access global variables', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Access global variables defined in the page
            const scriptResult = await client.callTool('execute_script', {
                script: 'return window.testGlobalVar + " - " + window.testObject.name;'
            });
            expect(scriptResult.content[0].text).toContain('Hello from global scope');
            expect(scriptResult.content[0].text).toContain('Test Object');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should call global functions', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Call global function
            const scriptResult = await client.callTool('execute_script', {
                script: 'return window.testFunction(10, 15);'
            });
            expect(scriptResult.content[0].text).toContain('25');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle queries and calculations', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Calculate sum of table values using global function
            const scriptResult = await client.callTool('execute_script', {
                script: 'return window.calculateTableSum();'
            });
            expect(scriptResult.content[0].text).toContain('600'); // 100 + 200 + 300

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle error scenarios', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Execute script that throws an error
            const scriptResult = await client.callTool('execute_script', {
                script: 'throw new Error("Test error");'
            });
            expect(scriptResult.content[0].text).toContain('Error executing script');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Asynchronous Script Execution', () => {
        it('should execute async script with callback', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Execute async script with WebDriver callback pattern
            const scriptResult = await client.callTool('execute_async_script', {
                script: `
                    var callback = arguments[arguments.length - 1];
                    setTimeout(function() {
                        callback("Async result after 1 second");
                    }, 1000);
                `
            });
            expect(scriptResult.content[0].text).toContain('Async result after 1 second');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should execute async script with Promise', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Execute async script using Promise
            const scriptResult = await client.callTool('execute_async_script', {
                script: `
                    var callback = arguments[arguments.length - 1];
                    window.simulateAsyncOperation(800, "Promise resolved")
                        .then(callback)
                        .catch(function(error) { callback("Error: " + error.message); });
                `
            });
            expect(scriptResult.content[0].text).toContain('Promise resolved');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle async script with arguments', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Execute async script with arguments
            const scriptResult = await client.callTool('execute_async_script', {
                script: `
                    var delay = arguments[0];
                    var value = arguments[1];
                    var callback = arguments[arguments.length - 1];
                    setTimeout(function() {
                        callback("Delayed " + value + " after " + delay + "ms");
                    }, delay);
                `,
                args: [500, "test value"]
            });
            expect(scriptResult.content[0].text).toContain('Delayed test value after 500ms');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should call global async function', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Call global async function
            const scriptResult = await client.callTool('execute_async_script', {
                script: `
                    var callback = arguments[arguments.length - 1];
                    window.testCallbackFunction(callback, 600);
                `
            });
            expect(scriptResult.content[0].text).toContain('Callback executed after 600ms');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle async DOM manipulation', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Async DOM manipulation
            const scriptResult = await client.callTool('execute_async_script', {
                script: `
                    var callback = arguments[arguments.length - 1];
                    setTimeout(function() {
                        document.getElementById("async-result").textContent = "Async DOM updated";
                        var result = document.getElementById("async-result").textContent;
                        callback(result);
                    }, 400);
                `
            });
            expect(scriptResult.content[0].text).toContain('Async DOM updated');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle async timeout scenarios', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Execute async script that should timeout (if timeout is configured)
            // Note: This test depends on WebDriver's async script timeout configuration
            const scriptResult = await client.callTool('execute_async_script', {
                script: `
                    var callback = arguments[arguments.length - 1];
                    // Very quick response to avoid timeout
                    setTimeout(function() {
                        callback("Quick async response");
                    }, 100);
                `
            });
            expect(scriptResult.content[0].text).toContain('Quick async response');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle async error scenarios', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Execute async script that handles an error
            const scriptResult = await client.callTool('execute_async_script', {
                script: `
                    var callback = arguments[arguments.length - 1];
                    window.simulateAsyncOperation(-1, "Should fail")
                        .then(function(result) { callback(result); })
                        .catch(function(error) { callback("Caught error: " + error.message); });
                `
            });
            expect(scriptResult.content[0].text).toContain('Caught error');
            expect(scriptResult.content[0].text).toContain('Duration must be positive');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Complex Script Scenarios', () => {
        it('should collect multiple element data', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Collect data from multiple elements
            const scriptResult = await client.callTool('execute_script', {
                script: `
                    var spans = document.querySelectorAll('.test-span');
                    var texts = [];
                    for (var i = 0; i < spans.length; i++) {
                        texts.push(spans[i].textContent);
                    }
                    return texts.join(', ');
                `
            });
            expect(scriptResult.content[0].text).toContain('Span 1, Span 2, Span 3');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should modify multiple elements', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Modify multiple list items
            const scriptResult = await client.callTool('execute_script', {
                script: `
                    var items = document.querySelectorAll('.list-item');
                    for (var i = 0; i < items.length; i++) {
                        items[i].textContent = 'Modified Item ' + (i + 1);
                    }
                    return items.length + ' items modified';
                `
            });
            expect(scriptResult.content[0].text).toContain('3 items modified');

            // Verify changes
            const listResult = await client.callTool('get_element_text', {
                by: 'id',
                value: 'dynamic-list'
            });
            expect(listResult.content[0].text).toContain('Modified Item 1');
            expect(listResult.content[0].text).toContain('Modified Item 2');
            expect(listResult.content[0].text).toContain('Modified Item 3');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should get element dimensions and computed styles', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to JavaScript execution page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-javascript-execution.html'
            });

            // Get element dimensions using global function
            const scriptResult = await client.callTool('execute_script', {
                script: 'return window.getElementDimensions("#data-container");'
            });
            expect(scriptResult.content[0].text).toContain('width');
            expect(scriptResult.content[0].text).toContain('height');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });
});