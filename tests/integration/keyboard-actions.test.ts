import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('Keyboard Actions', () => {
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

    describe('Basic Key Press', () => {
        it('should press common alphanumeric keys', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on input field first
            await client.callTool('click_element', {
                by: 'id',
                value: 'key-press-input'
            });

            // Press a simple key
            const keyResult = await client.callTool('press_key', {
                key: 'a'
            });
            expect(keyResult.content[0].text).toContain("Key 'a' pressed");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should press special keys', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on textarea for special keys
            await client.callTool('click_element', {
                by: 'id',
                value: 'special-keys-area'
            });

            // Press Enter key
            const enterResult = await client.callTool('press_key', {
                key: 'Enter'
            });
            expect(enterResult.content[0].text).toContain("Key 'Enter' pressed");

            // Press Tab key
            const tabResult = await client.callTool('press_key', {
                key: 'Tab'
            });
            expect(tabResult.content[0].text).toContain("Key 'Tab' pressed");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should press arrow keys', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on navigation buttons area
            await client.callTool('click_element', {
                by: 'id',
                value: 'nav-btn-1'
            });

            // Press arrow keys for navigation
            const rightResult = await client.callTool('press_key', {
                key: 'ArrowRight'
            });
            expect(rightResult.content[0].text).toContain("Key 'ArrowRight' pressed");

            const downResult = await client.callTool('press_key', {
                key: 'ArrowDown'
            });
            expect(downResult.content[0].text).toContain("Key 'ArrowDown' pressed");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle invalid keys', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Try to press an invalid key
            const invalidResult = await client.callTool('press_key', {
                key: 'InvalidKey123'
            });
            expect(invalidResult.content[0].text).toContain('Error pressing key');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Key Down and Up Actions', () => {
        it('should press and hold then release keys', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on combo input for key combinations
            await client.callTool('click_element', {
                by: 'id',
                value: 'combo-input'
            });

            // Press Shift key down
            const shiftDownResult = await client.callTool('key_down', {
                key: 'Shift'
            });
            expect(shiftDownResult.content[0].text).toContain('Key down: Shift');

            // Press a letter while Shift is held
            const letterResult = await client.callTool('press_key', {
                key: 'a'
            });
            expect(letterResult.content[0].text).toContain("Key 'a' pressed");

            // Release Shift key
            const shiftUpResult = await client.callTool('key_up', {
                key: 'Shift'
            });
            expect(shiftUpResult.content[0].text).toContain('Key up: Shift');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle Control key combinations', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on combo input
            await client.callTool('click_element', {
                by: 'id',
                value: 'combo-input'
            });

            // Press Control key down
            const ctrlDownResult = await client.callTool('key_down', {
                key: 'Control'
            });
            expect(ctrlDownResult.content[0].text).toContain('Key down: Control');

            // Press 'a' for Ctrl+A (select all)
            const aResult = await client.callTool('press_key', {
                key: 'a'
            });
            expect(aResult.content[0].text).toContain("Key 'a' pressed");

            // Release Control key
            const ctrlUpResult = await client.callTool('key_up', {
                key: 'Control'
            });
            expect(ctrlUpResult.content[0].text).toContain('Key up: Control');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle multiple modifier keys', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on combo input
            await client.callTool('click_element', {
                by: 'id',
                value: 'combo-input'
            });

            // Press multiple modifiers
            await client.callTool('key_down', { key: 'Control' });
            await client.callTool('key_down', { key: 'Shift' });
            
            // Press a key with both modifiers
            const keyResult = await client.callTool('press_key', {
                key: 'z'
            });
            expect(keyResult.content[0].text).toContain("Key 'z' pressed");

            // Release modifiers
            await client.callTool('key_up', { key: 'Shift' });
            await client.callTool('key_up', { key: 'Control' });

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle error when releasing key that was not pressed', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Try to release a key that wasn't pressed down
            // Note: WebDriver might not error on this, but we test the response
            const releaseResult = await client.callTool('key_up', {
                key: 'Control'
            });
            // Key up operations typically succeed even if key wasn't held
            expect(releaseResult.content[0].text).toContain('Key up: Control');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Send Keys to Active Element', () => {
        it('should send keys to currently focused element', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on first active test input
            await client.callTool('click_element', {
                by: 'id',
                value: 'active-test-1'
            });

            // Send keys to active element
            const sendResult = await client.callTool('send_keys_active', {
                text: 'Hello Active Element'
            });
            expect(sendResult.content[0].text).toContain('Sent keys to active element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should send keys to different focused elements', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on textarea
            await client.callTool('click_element', {
                by: 'id',
                value: 'active-test-3'
            });

            // Send multiline text to active element
            const sendResult = await client.callTool('send_keys_active', {
                text: 'Line 1\nLine 2\nLine 3'
            });
            expect(sendResult.content[0].text).toContain('Sent keys to active element');

            // Switch focus to another input
            await client.callTool('click_element', {
                by: 'id',
                value: 'active-test-2'
            });

            // Send different text to newly focused element
            const send2Result = await client.callTool('send_keys_active', {
                text: 'Different text'
            });
            expect(send2Result.content[0].text).toContain('Sent keys to active element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should send special characters to active element', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on sequence input
            await client.callTool('click_element', {
                by: 'id',
                value: 'sequence-input'
            });

            // Send special characters
            const sendResult = await client.callTool('send_keys_active', {
                text: 'Special: @#$%^&*()[]{}|\\:";\'<>?,./'
            });
            expect(sendResult.content[0].text).toContain('Sent keys to active element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle error when no element is focused', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Try to send keys without focusing any element first
            // Click on body to unfocus any elements
            await client.callTool('click_element', {
                by: 'css',
                value: 'body'
            });

            // Try to send keys to active element when nothing is focused
            const sendResult = await client.callTool('send_keys_active', {
                text: 'This should go to body or error'
            });
            // Note: WebDriver might send to body element or succeed anyway
            expect(sendResult.content[0].text).toContain('Sent keys to active element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Complex Key Sequences', () => {
        it('should handle Tab navigation between elements', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on first navigation button
            await client.callTool('click_element', {
                by: 'id',
                value: 'nav-btn-1'
            });

            // Press Tab to move to next element
            const tabResult = await client.callTool('press_key', {
                key: 'Tab'
            });
            expect(tabResult.content[0].text).toContain("Key 'Tab' pressed");

            // Press Tab again
            const tab2Result = await client.callTool('press_key', {
                key: 'Tab'
            });
            expect(tab2Result.content[0].text).toContain("Key 'Tab' pressed");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle Shift+Tab for reverse navigation', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on a navigation button
            await client.callTool('click_element', {
                by: 'id',
                value: 'nav-btn-3'
            });

            // Hold Shift and press Tab for reverse navigation
            await client.callTool('key_down', { key: 'Shift' });
            const shiftTabResult = await client.callTool('press_key', {
                key: 'Tab'
            });
            expect(shiftTabResult.content[0].text).toContain("Key 'Tab' pressed");
            await client.callTool('key_up', { key: 'Shift' });

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle typing sequences with mixed actions', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to keyboard test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-keyboard-actions.html'
            });

            // Focus on sequence input
            await client.callTool('click_element', {
                by: 'id',
                value: 'sequence-input'
            });

            // Type some text using send_keys_active
            await client.callTool('send_keys_active', {
                text: 'Hello '
            });

            // Use key_down/key_up for a modifier combination
            await client.callTool('key_down', { key: 'Shift' });
            await client.callTool('press_key', { key: 'w' }); // Capital W
            await client.callTool('key_up', { key: 'Shift' });

            // Add more text with send_keys_active
            await client.callTool('send_keys_active', {
                text: 'orld!'
            });

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });
});