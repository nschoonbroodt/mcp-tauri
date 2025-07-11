import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';
import fs from 'fs/promises';
import { PathLike } from 'fs';

describe('Screenshot Tool', () => {
    let client: MCPTestClient;
    const TEST_APP_PATH = path.resolve('./tests/mcp-tauri-test-app/src-tauri/target/release/bundle/appimage/mcp-tauri-test-app_0.1.0_amd64.AppImage');
    const SCREENSHOTS_DIR = path.resolve('./tests/screenshots');

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

        // Create screenshots directory if it doesn't exist
        await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    });

    afterAll(async () => {
        // Clean up
        await client.cleanup();
    });

    describe('Basic Screenshot Functionality', () => {
        it('should take a screenshot and return base64 data', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a page
            await client.callTool('navigate', {
                url: 'https://tauri.app'
            });

            // Take screenshot without path (should return base64)
            const screenshotResult = await client.callTool('take_screenshot', {});

            expect(screenshotResult).toBeDefined();
            expect(screenshotResult.content).toHaveLength(2);
            expect(screenshotResult.content[0].text).toBe('Screenshot captured as base64:');

            // Verify base64 data
            const base64Data = screenshotResult.content[1].text;
            expect(base64Data).toBeTruthy();
            expect(base64Data.length).toBeGreaterThan(100); // Base64 should be reasonably long

            // Verify it's valid base64
            expect(() => Buffer.from(base64Data, 'base64')).not.toThrow();

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should save screenshot to specified file path', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Navigate to a page
            await client.callTool('navigate', {
                url: 'https://tauri.app'
            });

            // Define output path
            const outputPath = path.join(SCREENSHOTS_DIR, 'test-screenshot.png');

            // Remove file if it exists from previous run
            try {
                await fs.unlink(outputPath);
            } catch (e) {
                // File doesn't exist, that's fine
            }

            // Take screenshot with path
            const screenshotResult = await client.callTool('take_screenshot', {
                outputPath: outputPath
            });

            expect(screenshotResult).toBeDefined();
            expect(screenshotResult.content[0].text).toBe(`Screenshot saved to ${outputPath}`);

            // Verify file exists
            const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
            expect(fileExists).toBe(true);

            // Verify file is not empty
            const stats = await fs.stat(outputPath);
            expect(stats.size).toBeGreaterThan(0);

            // Clean up screenshot file
            await fs.unlink(outputPath);

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Screenshot Error Handling', () => {
        it('should fail when no session is active', async () => {
            const result = await client.callTool('take_screenshot', {});

            expect(result).toBeDefined();
            expect(result.content[0].text).toContain('Error');
            expect(result.content[0].text).toContain('No active browser session');
        });

        it('should handle invalid output path gracefully', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Try to save to an invalid path
            const invalidPath = '/invalid/path/that/does/not/exist/screenshot.png';
            const result = await client.callTool('take_screenshot', {
                outputPath: invalidPath
            });

            expect(result).toBeDefined();
            expect(result.content[0].text).toContain('Error');

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });

    describe('Screenshot in Different States', () => {
        it('should capture screenshots at different page states', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            // Screenshot 1: Initial state
            const screenshot1 = await client.callTool('take_screenshot', {});
            expect(screenshot1.content[0].text).toBe('Screenshot captured as base64:');
            const base64_1 = screenshot1.content[1].text;

            // Navigate to a different page
            await client.callTool('navigate', {
                url: 'https://example.com'
            });

            // Wait a bit for page to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Screenshot 2: After navigation
            const screenshot2 = await client.callTool('take_screenshot', {});
            expect(screenshot2.content[0].text).toBe('Screenshot captured as base64:');
            const base64_2 = screenshot2.content[1].text;

            // Screenshots should be different
            expect(base64_1).not.toBe(base64_2);

            // Close session
            await client.callTool('close_session', {});
        }, 30000);

        it('should take multiple screenshots with different filenames', async () => {
            // Start app
            const startResult = await client.callTool('start_tauri_app', {
                application: TEST_APP_PATH,
            });
            expect(startResult.content[0].text).toContain('Started tauri-driver');

            const screenshotPaths: PathLike[] = [];

            // Take multiple screenshots
            for (let i = 1; i <= 3; i++) {
                const outputPath = path.join(SCREENSHOTS_DIR, `screenshot-${i}.png`);
                screenshotPaths.push(outputPath);

                const result = await client.callTool('take_screenshot', {
                    outputPath: outputPath
                });

                expect(result.content[0].text).toBe(`Screenshot saved to ${outputPath}`);
            }

            // Verify all files exist
            for (const screenshotPath of screenshotPaths) {
                const fileExists = await fs.access(screenshotPath).then(() => true).catch(() => false);
                expect(fileExists).toBe(true);
            }

            // Clean up
            for (const screenshotPath of screenshotPaths) {
                await fs.unlink(screenshotPath);
            }

            // Close session
            await client.callTool('close_session', {});
        }, 30000);
    });
});