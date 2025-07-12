import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';

describe('Session Timeouts', () => {
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


    describe('Timeout Management', () => {
        it('should get default timeouts', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Get default timeouts
            const timeoutsResult = await client.callTool('get_timeouts', {});
            expect(timeoutsResult).toBeDefined();
            expect(timeoutsResult.content[0].text).toBeTruthy();

            // Parse and verify the timeouts
            try {
                const timeouts = JSON.parse(timeoutsResult.content[0].text);

                // Verify structure
                expect(timeouts).toBeTruthy();
                expect(typeof timeouts).toBe('object');
                // Common timeout properties
                if ('script' in timeouts) expect(typeof timeouts.script).toBe('number');
                if ('pageLoad' in timeouts) expect(typeof timeouts.pageLoad).toBe('number');
                if ('implicit' in timeouts) expect(typeof timeouts.implicit).toBe('number');
            } catch (e) {
                console.error('Failed to parse timeouts:', e);
            }

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should set and get custom timeouts', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Set custom timeouts
            const setResult = await client.callTool('set_timeouts', {
                script: 15000,
                pageLoad: 20000,
                implicit: 5000
            });
            expect(setResult.content[0].text).toContain('Timeouts set:');
            expect(setResult.content[0].text).toContain('"script":15000');
            expect(setResult.content[0].text).toContain('"pageLoad":20000');
            expect(setResult.content[0].text).toContain('"implicit":5000');

            // Get timeouts to verify they were set
            const getResult = await client.callTool('get_timeouts', {});
            const timeouts = JSON.parse(getResult.content[0].text);
            

            // Verify the values were set
            expect(timeouts.script).toBe(15000);
            expect(timeouts.pageLoad).toBe(20000);
            expect(timeouts.implicit).toBe(5000);

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should set partial timeouts', async () => {
            // Wait between tests to avoid session conflicts
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Get initial timeouts
            const initialResult = await client.callTool('get_timeouts', {});
            const initialTimeouts = JSON.parse(initialResult.content[0].text);

            // Set only script timeout
            const setScriptResult = await client.callTool('set_timeouts', {
                script: 25000
            });
            expect(setScriptResult.content[0].text).toContain('Timeouts set:');
            expect(setScriptResult.content[0].text).toContain('"script":25000');

            // Get timeouts to verify
            const afterScriptResult = await client.callTool('get_timeouts', {});
            const afterScriptTimeouts = JSON.parse(afterScriptResult.content[0].text);
            
            expect(afterScriptTimeouts.script).toBe(25000);
            // Other timeouts should remain unchanged
            if ('pageLoad' in initialTimeouts) {
                expect(afterScriptTimeouts.pageLoad).toBe(initialTimeouts.pageLoad);
            }

            // Set only pageLoad timeout
            const setPageLoadResult = await client.callTool('set_timeouts', {
                pageLoad: 30000
            });
            expect(setPageLoadResult.content[0].text).toContain('"pageLoad":30000');

            // Get final timeouts
            const finalResult = await client.callTool('get_timeouts', {});
            const finalTimeouts = JSON.parse(finalResult.content[0].text);
            

            expect(finalTimeouts.script).toBe(25000);
            expect(finalTimeouts.pageLoad).toBe(30000);

            // Close session
            await client.callTool('close_session', {});
        }, 60000);
    });

    describe('Error Handling', () => {
        it('should fail when no session is active', async () => {
            // Wait to ensure no active sessions
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Try to get timeouts without session
            let result = await client.callTool('get_timeouts', {});
            expect(result.content[0].text).toContain('Error');
            expect(result.content[0].text).toContain('No active browser session');

            // Try to set timeouts without session
            result = await client.callTool('set_timeouts', { script: 10000 });
            expect(result.content[0].text).toContain('Error');
            expect(result.content[0].text).toContain('No active browser session');

        });
    });

    describe('Edge Cases', () => {
        it('should handle zero timeouts', async () => {
            // Wait between tests to avoid session conflicts
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Try to set zero timeouts (might be rejected by some drivers)
            const setResult = await client.callTool('set_timeouts', {
                implicit: 0
            });
            
            // Should either succeed or fail gracefully
            expect(setResult).toBeDefined();
            expect(setResult.content[0].text).toBeTruthy();

            if (!setResult.content[0].text.includes('Error')) {
                // If it succeeded, verify it was set
                const getResult = await client.callTool('get_timeouts', {});
                const timeouts = JSON.parse(getResult.content[0].text);
                expect(timeouts.implicit).toBe(0);
            }

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should handle very large timeouts', async () => {
            // Wait between tests to avoid session conflicts
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Set a very large timeout (1 hour)
            const setResult = await client.callTool('set_timeouts', {
                pageLoad: 3600000
            });
            
            expect(setResult).toBeDefined();
            
            if (!setResult.content[0].text.includes('Error')) {
                expect(setResult.content[0].text).toContain('"pageLoad":3600000');
                
                // Verify it was set
                const getResult = await client.callTool('get_timeouts', {});
                const timeouts = JSON.parse(getResult.content[0].text);
                expect(timeouts.pageLoad).toBe(3600000);
            }

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });
});