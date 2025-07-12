import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('Element Properties', () => {
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

    describe('Text Content', () => {
        it('should get element text content', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get text from paragraph
            const textResult = await client.callTool('get_element_text', {
                by: 'id',
                value: 'text-para'
            });
            expect(textResult.content[0].text).toBe('This is sample text content');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle empty element text', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get text from empty div
            const textResult = await client.callTool('get_element_text', {
                by: 'id',
                value: 'empty-div'
            });
            expect(textResult.content[0].text).toBe('');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should get nested text content', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get text from nested element
            const textResult = await client.callTool('get_element_text', {
                by: 'id',
                value: 'nested-text'
            });
            expect(textResult.content[0].text).toContain('Nested');
            expect(textResult.content[0].text).toContain('text');
            expect(textResult.content[0].text).toContain('content');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Element Attributes', () => {
        it('should get standard HTML attributes', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get input type attribute
            const typeResult = await client.callTool('get_element_attribute', {
                by: 'id',
                value: 'text-input',
                attribute: 'type'
            });
            expect(typeResult.content[0].text).toContain("Attribute 'type': text");

            // Get input value attribute
            const valueResult = await client.callTool('get_element_attribute', {
                by: 'id',
                value: 'text-input',
                attribute: 'value'
            });
            expect(valueResult.content[0].text).toContain("Attribute 'value': default value");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should get custom data attributes', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get custom data attribute
            const customResult = await client.callTool('get_element_attribute', {
                by: 'id',
                value: 'text-input',
                attribute: 'data-custom'
            });
            expect(customResult.content[0].text).toContain("Attribute 'data-custom': custom-value");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle non-existent attributes', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get non-existent attribute
            const nonExistentResult = await client.callTool('get_element_attribute', {
                by: 'id',
                value: 'text-input',
                attribute: 'non-existent'
            });
            expect(nonExistentResult.content[0].text).toContain("Attribute 'non-existent': null");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should get image attributes', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get image alt attribute
            const altResult = await client.callTool('get_element_attribute', {
                by: 'id',
                value: 'test-image',
                attribute: 'alt'
            });
            expect(altResult.content[0].text).toContain("Attribute 'alt': Test Image");

            // Get image width attribute
            const widthResult = await client.callTool('get_element_attribute', {
                by: 'id',
                value: 'test-image',
                attribute: 'width'
            });
            expect(widthResult.content[0].text).toContain("Attribute 'width': 100");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Element Properties', () => {
        it('should get form element properties', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get input value property
            const valueResult = await client.callTool('get_element_property', {
                by: 'id',
                value: 'text-input',
                property: 'value'
            });
            expect(valueResult.content[0].text).toContain("Property 'value':");

            // Get checkbox checked property
            const checkedResult = await client.callTool('get_element_property', {
                by: 'id',
                value: 'checked-box',
                property: 'checked'
            });
            expect(checkedResult.content[0].text).toContain("Property 'checked': true");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should get element state properties', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get disabled property
            const disabledResult = await client.callTool('get_element_property', {
                by: 'id',
                value: 'disabled-btn',
                property: 'disabled'
            });
            expect(disabledResult.content[0].text).toContain("Property 'disabled': true");

            // Get enabled property (should be false for disabled button)
            const enabledResult = await client.callTool('get_element_property', {
                by: 'id',
                value: 'enabled-btn',
                property: 'disabled'
            });
            expect(enabledResult.content[0].text).toContain("Property 'disabled': false");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle non-existent properties', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get non-existent property
            const nonExistentResult = await client.callTool('get_element_property', {
                by: 'id',
                value: 'text-input',
                property: 'nonExistentProperty'
            });
            expect(nonExistentResult.content[0].text).toContain("Property 'nonExistentProperty':");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Element State', () => {
        it('should check if element is displayed', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Check visible element
            const visibleResult = await client.callTool('is_element_displayed', {
                by: 'id',
                value: 'visible-div'
            });
            expect(visibleResult.content[0].text).toContain('Element is displayed: true');

            // Check hidden element
            const hiddenResult = await client.callTool('is_element_displayed', {
                by: 'id',
                value: 'hidden-div'
            });
            expect(hiddenResult.content[0].text).toContain('Element is displayed: false');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should check if element is enabled', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Check enabled button
            const enabledResult = await client.callTool('is_element_enabled', {
                by: 'id',
                value: 'enabled-btn'
            });
            expect(enabledResult.content[0].text).toContain('Element is enabled: true');

            // Check disabled button
            const disabledResult = await client.callTool('is_element_enabled', {
                by: 'id',
                value: 'disabled-btn'
            });
            expect(disabledResult.content[0].text).toContain('Element is enabled: false');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should check if element is selected', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Check unchecked checkbox
            const uncheckedResult = await client.callTool('is_element_selected', {
                by: 'id',
                value: 'unchecked-box'
            });
            expect(uncheckedResult.content[0].text).toContain('Element is selected: false');

            // Check checked checkbox
            const checkedResult = await client.callTool('is_element_selected', {
                by: 'id',
                value: 'checked-box'
            });
            expect(checkedResult.content[0].text).toContain('Element is selected: true');

            // Check selected radio button
            const radioResult = await client.callTool('is_element_selected', {
                by: 'id',
                value: 'radio2'
            });
            expect(radioResult.content[0].text).toContain('Element is selected: true');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('CSS Values', () => {
        it('should get CSS property values', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get color CSS value
            const colorResult = await client.callTool('get_element_css_value', {
                by: 'id',
                value: 'styled-div',
                cssProperty: 'color'
            });
            expect(colorResult.content[0].text).toBeDefined();

            // Get font-size CSS value
            const fontResult = await client.callTool('get_element_css_value', {
                by: 'id',
                value: 'styled-div',
                cssProperty: 'font-size'
            });
            expect(fontResult.content[0].text).toBeDefined();

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should get inline style values', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get inline color CSS value
            const colorResult = await client.callTool('get_element_css_value', {
                by: 'id',
                value: 'inline-styled',
                cssProperty: 'color'
            });
            expect(colorResult.content[0].text).toBeDefined();

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Element Geometry', () => {
        it('should get element tag name', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get div tag name
            const divResult = await client.callTool('get_element_tag_name', {
                by: 'id',
                value: 'styled-div'
            });
            expect(divResult.content[0].text).toContain('div');

            // Get input tag name
            const inputResult = await client.callTool('get_element_tag_name', {
                by: 'id',
                value: 'text-input'
            });
            expect(inputResult.content[0].text).toContain('input');

            // Get heading tag name
            const headingResult = await client.callTool('get_element_tag_name', {
                by: 'id',
                value: 'heading-tag'
            });
            expect(headingResult.content[0].text).toContain('h3');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should get element size', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get large element size
            const sizeResult = await client.callTool('get_element_size', {
                by: 'id',
                value: 'large-element'
            });
            expect(sizeResult.content[0].text).toBeDefined();
            // Size should contain width and height information
            expect(sizeResult.content[0].text).toMatch(/Element size: width=\d+, height=\d+/);

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should get element location', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get element location
            const locationResult = await client.callTool('get_element_location', {
                by: 'id',
                value: 'positioned-element'
            });
            expect(locationResult.content[0].text).toBeDefined();
            // Location should contain x and y coordinates
            expect(locationResult.content[0].text).toMatch(/Element location: x=\d+, y=\d+/);

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should get element rectangle', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get element rectangle (combines location and size)
            const rectResult = await client.callTool('get_element_rect', {
                by: 'id',
                value: 'large-element'
            });
            expect(rectResult.content[0].text).toBeDefined();
            // Rectangle should contain position and size information
            expect(rectResult.content[0].text).toMatch(/x|y|width|height|\d+/);

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

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get text using CSS selector
            const textResult = await client.callTool('get_element_text', {
                by: 'css',
                value: '.styled-element',
                attribute: 'class'
            });
            expect(textResult.content[0].text).toContain('Styled Element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should work with XPath', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Get attribute using XPath
            const attrResult = await client.callTool('get_element_attribute', {
                by: 'xpath',
                value: '//input[@type="text"]',
                attribute: 'placeholder'
            });
            expect(attrResult.content[0].text).toContain("Attribute 'placeholder': Enter text");

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Error Handling', () => {
        it('should handle non-existent elements', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Try to get text from non-existent element
            const textResult = await client.callTool('get_element_text', {
                by: 'id',
                value: 'non-existent-element'
            });
            expect(textResult.content[0].text).toContain('Error getting element text');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle invalid selectors', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to element properties page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-element-properties.html'
            });

            // Try with invalid XPath
            const attrResult = await client.callTool('get_element_attribute', {
                by: 'xpath',
                value: '//invalid[xpath[syntax',
                attribute: 'any'
            });
            expect(attrResult.content[0].text).toContain('Error');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });
});