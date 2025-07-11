import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from 'mcp-test-client';
import path from 'path';
import { fdatasyncSync } from 'fs';

describe('MCP Tauri Server', () => {
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

    it('should list all available tools', async () => {
        const tools = await client.listTools();

        // Verify start_tauri_app tool exists
        expect(tools).toContainEqual(
            expect.objectContaining({
                name: 'start_tauri_app',
                description: expect.any(String)
            })
        );

        // Verify we have navigation tools
        const toolNames = tools.map(t => t.name);
        expect(toolNames).toContain('navigate');
        expect(toolNames).toContain('click_element');

        // TODO: more checks :-)
    });

    it('should start a Tauri app session', async () => {
        const result = await client.callTool('start_tauri_app', {
            application: TEST_APP_PATH,
        });
        await client.callTool('close_session', {
            application: TEST_APP_PATH,
        });
        expect(result).toBeDefined();
        expect(result.content[0].text).toContain('Started tauri-driver');
        expect(result.content[0].text).toContain('session_id');
    });
});