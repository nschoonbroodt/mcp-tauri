import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('Element Interaction', () => {
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

    describe('Element Finding', () => {
        it('should find element by id', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to test page with elements  
            const navigateResult = await client.callTool('navigate', {
                url: 'tauri://localhost/test-button.html'
            });
            expect(navigateResult.content[0].text).toContain('Navigated to');

            // Find element by ID
            const findResult = await client.callTool('find_element', {
                by: 'id',
                value: 'test-button'
            });
            expect(findResult.content[0].text).toContain('Element found');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should find element by CSS selector', async () => {

            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-locators.html'
            });

            // Find element by CSS
            const findResult = await client.callTool('find_element', {
                by: 'css',
                value: '.test-div'
            });
            expect(findResult.content[0].text).toContain('Element found');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle element not found', async () => {

            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to simple page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-empty.html'
            });

            // Try to find non-existent element
            const findResult = await client.callTool('find_element', {
                by: 'id',
                value: 'non-existent-element'
            });
            expect(findResult.content[0].text).toContain('Error');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Element Clicking', () => {
        it('should click a button', async () => {

            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to interactive page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-button.html'
            });

            // Click the button
            const clickResult = await client.callTool('click_element', {
                by: 'id',
                value: 'click-me'
            });
            expect(clickResult.content[0].text).toContain('Element clicked');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should click a link', async () => {

            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to page with link
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-link.html'
            });

            // Click the link
            const clickResult = await client.callTool('click_element', {
                by: 'id',
                value: 'test-link'
            });
            expect(clickResult.content[0].text).toContain('Element clicked');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle click on non-existent element', async () => {

            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to simple page
            await client.callTool('navigate', {
                url: 'data:text/html,<html><body><h1>No Buttons Here</h1></body></html>'
            });

            // Try to click non-existent element
            const clickResult = await client.callTool('click_element', {
                by: 'id',
                value: 'non-existent-button'
            });
            expect(clickResult.content[0].text).toContain('Error');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Text Input', () => {
        it('should send keys to input field', async () => {

            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to page with input
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-input.html'
            });

            // Send keys to input
            const keysResult = await client.callTool('send_keys', {
                by: 'id',
                value: 'text-input',
                text: 'Hello, World!'
            });
            expect(keysResult.content[0].text).toContain('entered into element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should send keys to textarea', async () => {

            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to page with textarea
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-input.html'
            });

            // Send multiline text
            const keysResult = await client.callTool('send_keys', {
                by: 'id',
                value: 'text-area',
                text: 'Line 1\nLine 2\nLine 3'
            });
            expect(keysResult.content[0].text).toContain('entered into element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should send special keys', async () => {

            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to page with input
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-input.html'
            });

            // Send text with tab character
            const keysResult = await client.callTool('send_keys', {
                by: 'id',
                value: 'special-input',
                text: 'Before\tAfter'
            });
            expect(keysResult.content[0].text).toContain('entered into element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle send keys to non-existent element', async () => {

            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to simple page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-empty.html'
            });

            // Try to send keys to non-existent element
            const keysResult = await client.callTool('send_keys', {
                by: 'id',
                value: 'non-existent-input',
                text: 'This should fail'
            });
            expect(keysResult.content[0].text).toContain('Error');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Element Interaction Combinations', () => {
        it('should find, click, and type in sequence', async () => {

            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form.html'
            });

            // Find input field
            const findInputResult = await client.callTool('find_element', {
                by: 'id',
                value: 'name-input'
            });
            expect(findInputResult.content[0].text).toContain('Element found');

            // Type in input field
            const typeResult = await client.callTool('send_keys', {
                by: 'id',
                value: 'name-input',
                text: 'John Doe'
            });
            expect(typeResult.content[0].text).toContain('entered into element');

            // Find submit button
            const findButtonResult = await client.callTool('find_element', {
                by: 'id',
                value: 'submit-btn'
            });
            expect(findButtonResult.content[0].text).toContain('Element found');

            // Click submit button
            const clickResult = await client.callTool('click_element', {
                by: 'id',
                value: 'submit-btn'
            });
            expect(clickResult.content[0].text).toContain('Element clicked');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Different Locator Strategies', () => {
        it('should work with different locator types', async () => {
            // Wait between tests to avoid session conflicts
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to comprehensive test page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-locators.html'
            });

            // Test by class
            const classResult = await client.callTool('find_element', {
                by: 'class',
                value: 'class-btn'
            });
            expect(classResult.content[0].text).toContain('Element found');

            // Test by name
            const nameResult = await client.callTool('find_element', {
                by: 'name',
                value: 'name-btn'
            });
            expect(nameResult.content[0].text).toContain('Element found');

            // Test by link text
            const linkResult = await client.callTool('find_element', {
                by: 'linkText',
                value: 'Link Text'
            });
            expect(linkResult.content[0].text).toContain('Element found');

            // Test by partial link text
            const partialLinkResult = await client.callTool('find_element', {
                by: 'partialLinkText',
                value: 'partial link'
            });
            expect(partialLinkResult.content[0].text).toContain('Element found');

            // Test by xpath
            const xpathResult = await client.callTool('find_element', {
                by: 'xpath',
                value: '//span[@data-testid="xpath-target"]'
            });
            expect(xpathResult.content[0].text).toContain('Element found');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Find Multiple Elements', () => {
        it('should find multiple elements by class', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to page with multiple elements
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-locators.html'
            });

            // Find multiple elements by class
            const elementsResult = await client.callTool('find_elements', {
                by: 'class',
                value: 'btn'
            });
            expect(elementsResult.content[0].text).toContain('Found');
            expect(elementsResult.content[0].text).toContain('elements');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should find multiple elements by tag name', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to page with multiple elements
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-locators.html'
            });

            // Find multiple button elements
            const buttonsResult = await client.callTool('find_elements', {
                by: 'css',
                value: 'button'
            });
            expect(buttonsResult.content[0].text).toContain('Found');
            expect(buttonsResult.content[0].text).toContain('elements');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should find multiple elements with xpath', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to page with multiple elements
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-locators.html'
            });

            // Find multiple elements with xpath
            const xpathResult = await client.callTool('find_elements', {
                by: 'xpath',
                value: '//button'
            });
            expect(xpathResult.content[0].text).toContain('Found');
            expect(xpathResult.content[0].text).toContain('elements');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle no elements found', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to page with multiple elements
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-locators.html'
            });

            // Try to find non-existent elements
            const noElementsResult = await client.callTool('find_elements', {
                by: 'class',
                value: 'non-existent-class'
            });
            expect(noElementsResult.content[0].text).toContain('Found 0 elements');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });
});