import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('Form Controls', () => {
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

    describe('Select by Visible Text', () => {
        it('should select option by visible text', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select by visible text
            const selectResult = await client.callTool('select_by_visible_text', {
                by: 'id',
                value: 'single-select',
                text: 'First Option'
            });
            expect(selectResult.content[0].text).toContain('Selected option with text: First Option');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should select different option by visible text', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select different option
            const selectResult = await client.callTool('select_by_visible_text', {
                by: 'id',
                value: 'single-select',
                text: 'Third Option'
            });
            expect(selectResult.content[0].text).toContain('Selected option with text: Third Option');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle complex text options', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select country option with complex text
            const selectResult = await client.callTool('select_by_visible_text', {
                by: 'id',
                value: 'countries-select',
                text: 'United States'
            });
            expect(selectResult.content[0].text).toContain('Selected option with text: United States');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle special characters in text', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select option with quotes
            const selectResult = await client.callTool('select_by_visible_text', {
                by: 'id',
                value: 'special-select',
                text: 'Option with "quotes"'
            });
            expect(selectResult.content[0].text).toContain('Selected option with text: Option with "quotes"');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle error when text not found with improved error message', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Try to select non-existent option
            const selectResult = await client.callTool('select_by_visible_text', {
                by: 'id',
                value: 'single-select',
                text: 'Non-existent Option'
            });
            // Should now show available options in error message
            expect(selectResult.content[0].text).toContain('No option matching \'Non-existent Option\' found');
            expect(selectResult.content[0].text).toContain('Available options:');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should select option with partial text matching', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select using partial match
            const selectResult = await client.callTool('select_by_visible_text', {
                by: 'id',
                value: 'single-select',
                text: 'First',
                partial: true
            });
            expect(selectResult.content[0].text).toContain('Selected option with text:');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Select by Contains Text', () => {
        it('should select option using case-insensitive partial matching', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select using contains text (case-insensitive)
            const selectResult = await client.callTool('select_by_contains_text', {
                by: 'id',
                value: 'single-select',
                text: 'first'
            });
            expect(selectResult.content[0].text).toContain('Selected option with text:');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Select by Value', () => {
        it('should select option by value', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select by value
            const selectResult = await client.callTool('select_by_value', {
                by: 'id',
                value: 'single-select',
                optionValue: 'option2'
            });
            expect(selectResult.content[0].text).toContain('Selected option with value: option2');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should select country by value', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select country by value
            const selectResult = await client.callTool('select_by_value', {
                by: 'id',
                value: 'countries-select',
                optionValue: 'uk'
            });
            expect(selectResult.content[0].text).toContain('Selected option with value: uk');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle special character values', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select by special value
            const selectResult = await client.callTool('select_by_value', {
                by: 'id',
                value: 'special-select',
                optionValue: 'special3'
            });
            expect(selectResult.content[0].text).toContain('Selected option with value: special3');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle non-existent value', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Try to select non-existent value
            const selectResult = await client.callTool('select_by_value', {
                by: 'id',
                value: 'single-select',
                optionValue: 'non-existent-value'
            });
            // Should succeed (JavaScript allows setting any value)
            expect(selectResult.content[0].text).toContain('Selected option with value: non-existent-value');

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

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select using CSS selector
            const selectResult = await client.callTool('select_by_value', {
                by: 'css',
                value: '#large-select',
                optionValue: 'item5'
            });
            expect(selectResult.content[0].text).toContain('Selected option with value: item5');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should work with XPath', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select using XPath
            const selectResult = await client.callTool('select_by_visible_text', {
                by: 'xpath',
                value: '//select[@id="countries-select"]',
                text: 'France'
            });
            expect(selectResult.content[0].text).toContain('Selected option with text: France');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Multi-Select Dropdown', () => {
        it('should select multiple options by value', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select first option
            const select1Result = await client.callTool('select_by_value', {
                by: 'id',
                value: 'multi-select',
                optionValue: 'red'
            });
            expect(select1Result.content[0].text).toContain('Selected option with value: red');

            // Select second option (this will replace the first in a regular select)
            const select2Result = await client.callTool('select_by_value', {
                by: 'id',
                value: 'multi-select',
                optionValue: 'blue'
            });
            expect(select2Result.content[0].text).toContain('Selected option with value: blue');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should select multiple options by text', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select by text
            const selectResult = await client.callTool('select_by_visible_text', {
                by: 'id',
                value: 'multi-select',
                text: 'Green'
            });
            expect(selectResult.content[0].text).toContain('Selected option with text: Green');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Sequential Selections', () => {
        it('should handle multiple selections in sequence', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // First selection by value
            const select1Result = await client.callTool('select_by_value', {
                by: 'id',
                value: 'single-select',
                optionValue: 'option1'
            });
            expect(select1Result.content[0].text).toContain('Selected option with value: option1');

            // Second selection by text (should change selection)
            const select2Result = await client.callTool('select_by_visible_text', {
                by: 'id',
                value: 'single-select',
                text: 'Second Option'
            });
            expect(select2Result.content[0].text).toContain('Selected option with text: Second Option');

            // Third selection by value
            const select3Result = await client.callTool('select_by_value', {
                by: 'id',
                value: 'single-select',
                optionValue: 'option3'
            });
            expect(select3Result.content[0].text).toContain('Selected option with value: option3');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should work across different dropdowns', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Select in first dropdown
            const select1Result = await client.callTool('select_by_value', {
                by: 'id',
                value: 'single-select',
                optionValue: 'option2'
            });
            expect(select1Result.content[0].text).toContain('Selected option with value: option2');

            // Select in countries dropdown
            const select2Result = await client.callTool('select_by_visible_text', {
                by: 'id',
                value: 'countries-select',
                text: 'Germany'
            });
            expect(select2Result.content[0].text).toContain('Selected option with text: Germany');

            // Select in large dropdown
            const select3Result = await client.callTool('select_by_value', {
                by: 'id',
                value: 'large-select',
                optionValue: 'item7'
            });
            expect(select3Result.content[0].text).toContain('Selected option with value: item7');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Error Handling', () => {
        it('should handle error when select element not found', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Try to select from non-existent dropdown
            const selectResult = await client.callTool('select_by_value', {
                by: 'id',
                value: 'non-existent-select',
                optionValue: 'any-value'
            });
            expect(selectResult.content[0].text).toContain('Error selecting by value');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle error when selector is invalid', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Try with invalid XPath
            const selectResult = await client.callTool('select_by_visible_text', {
                by: 'xpath',
                value: '//invalid[xpath[syntax',
                text: 'any text'
            });
            expect(selectResult.content[0].text).toContain('Error selecting by visible text');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Form Submission', () => {
        it('should submit a form using submit button', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Submit the form using submit button
            const submitResult = await client.callTool('submit_element', {
                by: 'id',
                value: 'submit-btn'
            });
            expect(submitResult.content[0].text).toContain('Element submitted');

            // Verify form was submitted by checking status text
            const statusText = await client.callTool('get_element_text', {
                by: 'id',
                value: 'form-status'
            });
            expect(statusText.content[0].text).toContain('submitted successfully');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should submit a form using the form element itself', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Submit the form using the form element
            const submitResult = await client.callTool('submit_element', {
                by: 'id',
                value: 'simple-form'
            });
            expect(submitResult.content[0].text).toContain('Element submitted');

            // Verify form was submitted by checking status text
            const statusText = await client.callTool('get_element_text', {
                by: 'id',
                value: 'simple-status'
            });
            expect(statusText.content[0].text).toContain('submitted successfully');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should submit form using input submit element', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Submit using the input submit element
            const submitResult = await client.callTool('submit_element', {
                by: 'id',
                value: 'simple-submit'
            });
            expect(submitResult.content[0].text).toContain('Element submitted');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle error when element is not submittable', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to form controls page
            await client.callTool('navigate', {
                url: 'tauri://localhost/test-form-controls.html'
            });

            // Try to submit a non-form element (heading)
            const submitResult = await client.callTool('submit_element', {
                by: 'css',
                value: 'h1' // This is a heading, not submittable
            });
            expect(submitResult.content[0].text).toContain('Error submitting element');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });
});