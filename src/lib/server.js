#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pkg from 'selenium-webdriver';
import path from "path";
const { Builder, By, Key, until, Actions, Capabilities } = pkg;
import os from 'os';
import { spawn } from "child_process";

// Create an MCP server
const server = new McpServer({
    name: "MCP Tauri",
    version: "0.1.0"
});

// Server state
const state = {
    drivers: new Map(),
    currentSession: null,
    tauriDriver: null,
};

// Helper functions
const getDriver = () => {
    const driver = state.drivers.get(state.currentSession);
    if (!driver) {
        throw new Error('No active browser session');
    }
    return driver;
};

const getLocator = (by, value) => {
    switch (by.toLowerCase()) {
        case 'id': return By.id(value);
        case 'css': return By.css(value);
        case 'xpath': return By.xpath(value);
        case 'name': return By.name(value);
        case 'tag': return By.css(value);
        case 'class': return By.className(value);
        case 'linktext': return By.linkText(value);
        case 'partiallinktext': return By.partialLinkText(value);
        default: throw new Error(`Unsupported locator strategy: ${by}`);
    }
};

const startTauriDriver = async (port = 4444) => {
    if (state.tauriDriver) {
        return; // already init
    }

    const tauriDriverPath = path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver');

    state.tauriDriver = spawn(tauriDriverPath, ['--port', port.toString()], {
        stdio: ['ignore', 'pipe', 'pipe']
    });

    // wait for the driver to start
    await new Promise(resolve => setTimeout(resolve, 4000));
    return state.tauriDriver;
}

// Common schemas
const locatorSchema = {
    by: z.enum(["id", "css", "xpath", "name", "tag", "class", "linkText", "partialLinkText"]).describe("Locator strategy to find element"),
    value: z.string().describe("Value for the locator strategy"),
    timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
};

// Browser Management Tools
server.tool(
    "start_tauri_app",
    "launches tauri-driver and connects to Tauri application",
    {
        application: z.string().describe("Path to Tauri application binary"),
        port: z.number().optional().describe("Port for tauri-driver (defaults to 4444)")
    },
    async ({ application, port = 4444 }) => {
        try {
            // Start tauri-driver automatically
            await startTauriDriver(port);

            const tauriDriverUrl = `http://localhost:${port}`;

            // Create Tauri-specific capabilities
            const capabilities = new Capabilities();
            capabilities.set("tauri:options", { application });
            capabilities.setBrowserName("wry");

            const driver = await new Builder()
                .withCapabilities(capabilities)
                .usingServer(tauriDriverUrl)
                .build();

            const sessionId = `tauri_${Date.now()}`;
            state.drivers.set(sessionId, driver);
            state.currentSession = sessionId;

            return {
                content: [{ type: 'text', text: `Started tauri-driver and connected to Tauri app at ${application} with session_id: ${sessionId}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error starting Tauri app: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "navigate",
    "navigates to a URL",
    {
        url: z.string().describe("URL to navigate to")

    },
    async ({ url }) => {
        try {
            const driver = getDriver();
            await driver.get(url);
            return {
                content: [{ type: 'text', text: `Navigated to ${url}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error navigating: ${e.message}` }]
            };
        }
    }
);

// Element Interaction Tools
server.tool(
    "find_element",
    "finds an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            await driver.wait(until.elementLocated(locator), timeout);
            return {
                content: [{ type: 'text', text: 'Element found' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error finding element: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "click_element",
    "clicks an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            await element.click();
            return {
                content: [{ type: 'text', text: 'Element clicked' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error clicking element: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "send_keys",
    "sends keys to an element, aka typing",
    {
        ...locatorSchema,
        text: z.string().describe("Text to enter into the element")
    },
    async ({ by, value, text, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            await element.clear();
            await element.sendKeys(text);
            return {
                content: [{ type: 'text', text: `Text "${text}" entered into element` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error entering text: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_element_text",
    "gets the text() of an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const text = await element.getText();
            return {
                content: [{ type: 'text', text }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting element text: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "hover",
    "moves the mouse to hover over an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const actions = driver.actions({ bridge: true });
            await actions.move({ origin: element }).perform();
            return {
                content: [{ type: 'text', text: 'Hovered over element' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error hovering over element: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "drag_and_drop",
    "drags an element and drops it onto another element",
    {
        ...locatorSchema,
        targetBy: z.enum(["id", "css", "xpath", "name", "tag", "class", "linkText", "partialLinkText"]).describe("Locator strategy to find target element"),
        targetValue: z.string().describe("Value for the target locator strategy")
    },
    async ({ by, value, targetBy, targetValue, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const sourceLocator = getLocator(by, value);
            const targetLocator = getLocator(targetBy, targetValue);

            const sourceElement = await driver.wait(until.elementLocated(sourceLocator), timeout);
            const targetElement = await driver.wait(until.elementLocated(targetLocator), timeout);

            const actions = driver.actions({ bridge: true });
            await actions.dragAndDrop(sourceElement, targetElement).perform();

            return {
                content: [{ type: 'text', text: 'Drag and drop completed' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error performing drag and drop: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "double_click",
    "performs a double click on an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const actions = driver.actions({ bridge: true });
            await actions.doubleClick(element).perform();
            return {
                content: [{ type: 'text', text: 'Double click performed' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error performing double click: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "right_click",
    "performs a right click (context click) on an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const actions = driver.actions({ bridge: true });
            await actions.contextClick(element).perform();
            return {
                content: [{ type: 'text', text: 'Right click performed' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error performing right click: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "press_key",
    "simulates pressing a keyboard key",
    {
        key: z.string().describe("Key to press (e.g., 'Enter', 'Tab', 'a', etc.)")
    },
    async ({ key }) => {
        try {
            const driver = getDriver();
            const actions = driver.actions({ bridge: true });
            await actions.keyDown(key).keyUp(key).perform();
            return {
                content: [{ type: 'text', text: `Key '${key}' pressed` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error pressing key: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "upload_file",
    "uploads a file using a file input element",
    {
        ...locatorSchema,
        filePath: z.string().describe("Absolute path to the file to upload")
    },
    async ({ by, value, filePath, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            await element.sendKeys(filePath);
            return {
                content: [{ type: 'text', text: 'File upload initiated' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error uploading file: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "take_screenshot",
    "captures a screenshot of the current page",
    {
        outputPath: z.string().optional().describe("Optional path where to save the screenshot. If not provided, returns base64 data.")
    },
    async ({ outputPath }) => {
        try {
            const driver = getDriver();
            const screenshot = await driver.takeScreenshot();

            if (outputPath) {
                const fs = await import('fs');
                await fs.promises.writeFile(outputPath, screenshot, 'base64');
                return {
                    content: [{ type: 'text', text: `Screenshot saved to ${outputPath}` }]
                };
            } else {
                return {
                    content: [
                        { type: 'text', text: 'Screenshot captured as base64:' },
                        { type: 'text', text: screenshot }
                    ]
                };
            }
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error taking screenshot: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "close_session",
    "closes the current Tauri session",
    {},
    async () => {
        try {
            const driver = getDriver();
            await driver.quit();
            state.drivers.delete(state.currentSession);
            const sessionId = state.currentSession;
            state.currentSession = null;
            return {
                content: [{ type: 'text', text: `Tauri session ${sessionId} closed` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error closing session: ${e.message}` }]
            };
        }
    }
);

// Window and Tab Management Tools
server.tool(
    "get_window_handle",
    "gets the current window handle",
    {},
    async () => {
        try {
            const driver = getDriver();
            const handle = await driver.getWindowHandle();
            return {
                content: [{ type: 'text', text: `Current window handle: ${handle}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting window handle: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_all_window_handles",
    "gets all window handles",
    {},
    async () => {
        try {
            const driver = getDriver();
            const handles = await driver.getAllWindowHandles();
            return {
                content: [{ type: 'text', text: `All window handles: ${handles.join(', ')}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting window handles: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "switch_to_window",
    "switches to a specific window by handle",
    {
        handle: z.string().describe("Window handle to switch to")
    },
    async ({ handle }) => {
        try {
            const driver = getDriver();
            await driver.switchTo().window(handle);
            return {
                content: [{ type: 'text', text: `Switched to window: ${handle}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error switching to window: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "new_window",
    "opens a new window or tab",
    {
        type: z.enum(["tab", "window"]).optional().describe("Type of new window to open")
    },
    async ({ type = "tab" }) => {
        try {
            const driver = getDriver();
            await driver.switchTo().newWindow(type);
            const handle = await driver.getWindowHandle();
            return {
                content: [{ type: 'text', text: `New ${type} opened with handle: ${handle}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error opening new ${type}: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "close_window",
    "closes the current window",
    {},
    async () => {
        try {
            const driver = getDriver();
            await driver.close();
            return {
                content: [{ type: 'text', text: 'Current window closed' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error closing window: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "maximize_window",
    "maximizes the current window",
    {},
    async () => {
        try {
            const driver = getDriver();
            await driver.manage().window().maximize();
            return {
                content: [{ type: 'text', text: 'Window maximized' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error maximizing window: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "minimize_window",
    "minimizes the current window",
    {},
    async () => {
        try {
            const driver = getDriver();
            await driver.manage().window().minimize();
            return {
                content: [{ type: 'text', text: 'Window minimized' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error minimizing window: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "set_window_size",
    "sets the window size",
    {
        width: z.number().describe("Window width in pixels"),
        height: z.number().describe("Window height in pixels")
    },
    async ({ width, height }) => {
        try {
            const driver = getDriver();
            await driver.manage().window().setRect({ width, height });
            return {
                content: [{ type: 'text', text: `Window size set to ${width}x${height}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error setting window size: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "set_window_position",
    "sets the window position",
    {
        x: z.number().describe("X coordinate"),
        y: z.number().describe("Y coordinate")
    },
    async ({ x, y }) => {
        try {
            const driver = getDriver();
            await driver.manage().window().setRect({ x, y });
            return {
                content: [{ type: 'text', text: `Window position set to (${x}, ${y})` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error setting window position: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_window_rect",
    "gets the window position and size",
    {},
    async () => {
        try {
            const driver = getDriver();
            const rect = await driver.manage().window().getRect();
            return {
                content: [{ type: 'text', text: `Window rect: x=${rect.x}, y=${rect.y}, width=${rect.width}, height=${rect.height}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting window rect: ${e.message}` }]
            };
        }
    }
);

// Frame Management Tools
server.tool(
    "switch_to_frame",
    "switches to a frame or iframe",
    {
        frame: z.union([z.number(), z.string()]).describe("Frame index, name, or element locator")
    },
    async ({ frame }) => {
        try {
            const driver = getDriver();
            if (typeof frame === 'number') {
                await driver.switchTo().frame(frame);
            } else {
                await driver.switchTo().frame(frame);
            }
            return {
                content: [{ type: 'text', text: `Switched to frame: ${frame}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error switching to frame: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "switch_to_parent_frame",
    "switches to the parent frame",
    {},
    async () => {
        try {
            const driver = getDriver();
            await driver.switchTo().parentFrame();
            return {
                content: [{ type: 'text', text: 'Switched to parent frame' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error switching to parent frame: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "switch_to_default_content",
    "switches to the default content (main document)",
    {},
    async () => {
        try {
            const driver = getDriver();
            await driver.switchTo().defaultContent();
            return {
                content: [{ type: 'text', text: 'Switched to default content' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error switching to default content: ${e.message}` }]
            };
        }
    }
);

// Alert Handling Tools
server.tool(
    "accept_alert",
    "accepts the current alert",
    {},
    async () => {
        try {
            const driver = getDriver();
            const alert = await driver.switchTo().alert();
            await alert.accept();
            return {
                content: [{ type: 'text', text: 'Alert accepted' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error accepting alert: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "dismiss_alert",
    "dismisses the current alert",
    {},
    async () => {
        try {
            const driver = getDriver();
            const alert = await driver.switchTo().alert();
            await alert.dismiss();
            return {
                content: [{ type: 'text', text: 'Alert dismissed' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error dismissing alert: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_alert_text",
    "gets the text of the current alert",
    {},
    async () => {
        try {
            const driver = getDriver();
            const alert = await driver.switchTo().alert();
            const text = await alert.getText();
            return {
                content: [{ type: 'text', text: `Alert text: ${text}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting alert text: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "send_alert_text",
    "sends text to an alert prompt",
    {
        text: z.string().describe("Text to send to the alert")
    },
    async ({ text }) => {
        try {
            const driver = getDriver();
            const alert = await driver.switchTo().alert();
            await alert.sendKeys(text);
            return {
                content: [{ type: 'text', text: `Text sent to alert: ${text}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error sending text to alert: ${e.message}` }]
            };
        }
    }
);

// Navigation Tools
server.tool(
    "go_back",
    "navigates back in browser history",
    {},
    async () => {
        try {
            const driver = getDriver();
            await driver.navigate().back();
            return {
                content: [{ type: 'text', text: 'Navigated back' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error navigating back: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "go_forward",
    "navigates forward in browser history",
    {},
    async () => {
        try {
            const driver = getDriver();
            await driver.navigate().forward();
            return {
                content: [{ type: 'text', text: 'Navigated forward' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error navigating forward: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "refresh_page",
    "refreshes the current page",
    {},
    async () => {
        try {
            const driver = getDriver();
            await driver.navigate().refresh();
            return {
                content: [{ type: 'text', text: 'Page refreshed' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error refreshing page: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_current_url",
    "gets the current page URL",
    {},
    async () => {
        try {
            const driver = getDriver();
            const url = await driver.getCurrentUrl();
            return {
                content: [{ type: 'text', text: `Current URL: ${url}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting current URL: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_title",
    "gets the page title",
    {},
    async () => {
        try {
            const driver = getDriver();
            const title = await driver.getTitle();
            return {
                content: [{ type: 'text', text: `Page title: ${title}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting page title: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_page_source",
    "gets the page source HTML",
    {},
    async () => {
        try {
            const driver = getDriver();
            const source = await driver.getPageSource();
            return {
                content: [{ type: 'text', text: source }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting page source: ${e.message}` }]
            };
        }
    }
);

// Advanced Element Tools
server.tool(
    "find_elements",
    "finds multiple elements",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            await driver.wait(until.elementLocated(locator), timeout);
            const elements = await driver.findElements(locator);
            return {
                content: [{ type: 'text', text: `Found ${elements.length} elements` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error finding elements: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_element_attribute",
    "gets an attribute value from an element",
    {
        ...locatorSchema,
        attribute: z.string().describe("Attribute name to get")
    },
    async ({ by, value, attribute, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const attrValue = await element.getAttribute(attribute);
            return {
                content: [{ type: 'text', text: `Attribute '${attribute}': ${attrValue}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting element attribute: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_element_property",
    "gets a property value from an element",
    {
        ...locatorSchema,
        property: z.string().describe("Property name to get")
    },
    async ({ by, value, property, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const propValue = await element.getProperty(property);
            return {
                content: [{ type: 'text', text: `Property '${property}': ${propValue}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting element property: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_element_css_value",
    "gets a CSS value from an element",
    {
        ...locatorSchema,
        cssProperty: z.string().describe("CSS property name to get")
    },
    async ({ by, value, cssProperty, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const cssValue = await element.getCssValue(cssProperty);
            return {
                content: [{ type: 'text', text: `CSS property '${cssProperty}': ${cssValue}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting CSS value: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "is_element_displayed",
    "checks if an element is displayed",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const isDisplayed = await element.isDisplayed();
            return {
                content: [{ type: 'text', text: `Element is displayed: ${isDisplayed}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error checking if element is displayed: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "is_element_enabled",
    "checks if an element is enabled",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const isEnabled = await element.isEnabled();
            return {
                content: [{ type: 'text', text: `Element is enabled: ${isEnabled}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error checking if element is enabled: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "is_element_selected",
    "checks if an element is selected (for checkboxes, radio buttons, options)",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const isSelected = await element.isSelected();
            return {
                content: [{ type: 'text', text: `Element is selected: ${isSelected}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error checking if element is selected: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_element_tag_name",
    "gets the tag name of an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const tagName = await element.getTagName();
            return {
                content: [{ type: 'text', text: `Element tag name: ${tagName}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting element tag name: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_element_size",
    "gets the size of an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const size = await element.getSize();   // TODO: Bug with tauri, or maybe in general
            return {
                content: [{ type: 'text', text: `Element size: width=${size.width}, height=${size.height}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting element size: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_element_location",
    "gets the location of an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const location = await element.getLocation();
            return {
                content: [{ type: 'text', text: `Element location: x=${location.x}, y=${location.y}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting element location: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_element_rect",
    "gets the rectangle (location and size) of an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const rect = await element.getRect();
            return {
                content: [{ type: 'text', text: `Element rect: x=${rect.x}, y=${rect.y}, width=${rect.width}, height=${rect.height}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting element rect: ${e.message}` }]
            };
        }
    }
);


// Wait Conditions Tools
server.tool(
    "wait_for_element_visible",
    "waits for an element to be visible",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            await driver.wait(until.elementIsVisible(driver.findElement(locator)), timeout);
            return {
                content: [{ type: 'text', text: 'Element is now visible' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error waiting for element to be visible: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "wait_for_element_not_visible",
    "waits for an element to not be visible",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.findElement(locator);
            await driver.wait(until.elementIsNotVisible(element), timeout);
            return {
                content: [{ type: 'text', text: 'Element is no longer visible' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error waiting for element to not be visible: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "wait_for_element_clickable",
    "waits for an element to be clickable",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            await driver.wait(until.elementIsEnabled(driver.findElement(locator)), timeout);
            return {
                content: [{ type: 'text', text: 'Element is now clickable' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error waiting for element to be clickable: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "wait_for_title_contains",
    "waits for the page title to contain specific text",
    {
        title: z.string().describe("Text that should be contained in title"),
        timeout: z.number().optional().describe("Maximum time to wait in milliseconds")
    },
    async ({ title, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            await driver.wait(until.titleContains(title), timeout);
            return {
                content: [{ type: 'text', text: `Title now contains: ${title}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error waiting for title to contain text: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "wait_for_url_contains",
    "waits for the URL to contain specific text",
    {
        url: z.string().describe("Text that should be contained in URL"),
        timeout: z.number().optional().describe("Maximum time to wait in milliseconds")
    },
    async ({ url, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            await driver.wait(until.urlContains(url), timeout);
            return {
                content: [{ type: 'text', text: `URL now contains: ${url}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error waiting for URL to contain text: ${e.message}` }]
            };
        }
    }
);

// JavaScript Execution Tools
server.tool(
    "execute_script",
    "executes JavaScript in the browser",
    {
        script: z.string().describe("JavaScript code to execute"),
        args: z.array(z.any()).optional().describe("Arguments to pass to the script")
    },
    async ({ script, args = [] }) => {
        try {
            const driver = getDriver();
            const result = await driver.executeScript(script, ...args);
            return {
                content: [{ type: 'text', text: `Script executed. Result: ${JSON.stringify(result)}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error executing script: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "execute_async_script",
    "executes asynchronous JavaScript in the browser",
    {
        script: z.string().describe("Asynchronous JavaScript code to execute"),
        args: z.array(z.any()).optional().describe("Arguments to pass to the script")
    },
    async ({ script, args = [] }) => {
        try {
            const driver = getDriver();
            const result = await driver.executeAsyncScript(script, ...args);
            return {
                content: [{ type: 'text', text: `Async script executed. Result: ${JSON.stringify(result)}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error executing async script: ${e.message}` }]
            };
        }
    }
);

// Scroll and Advanced Actions
server.tool(
    "scroll_to_element",
    "scrolls to an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            await driver.executeScript("arguments[0].scrollIntoView(true);", element);
            return {
                content: [{ type: 'text', text: 'Scrolled to element' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error scrolling to element: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "scroll_by",
    "scrolls the page by specified pixels",
    {
        x: z.number().describe("Horizontal pixels to scroll"),
        y: z.number().describe("Vertical pixels to scroll")
    },
    async ({ x, y }) => {
        try {
            const driver = getDriver();
            await driver.executeScript(`window.scrollBy(${x}, ${y});`);
            return {
                content: [{ type: 'text', text: `Scrolled by x=${x}, y=${y}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error scrolling: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "scroll_to_top",
    "scrolls to the top of the page",
    {},
    async () => {
        try {
            const driver = getDriver();
            await driver.executeScript("window.scrollTo(0, 0);");
            return {
                content: [{ type: 'text', text: 'Scrolled to top of page' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error scrolling to top: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "scroll_to_bottom",
    "scrolls to the bottom of the page",
    {},
    async () => {
        try {
            const driver = getDriver();
            await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
            return {
                content: [{ type: 'text', text: 'Scrolled to bottom of page' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error scrolling to bottom: ${e.message}` }]
            };
        }
    }
);

// Select dropdown tools
server.tool(
    "select_by_visible_text",
    "selects an option from a dropdown by visible text",
    {
        ...locatorSchema,
        text: z.string().describe("Visible text of the option to select")
    },
    async ({ by, value, text, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            await driver.executeScript(`
                const select = arguments[0];
                const options = select.options;
                for (let i = 0; i < options.length; i++) {
                    if (options[i].text === arguments[1]) {
                        select.selectedIndex = i;
                        select.dispatchEvent(new Event('change'));
                        break;
                    }
                }
            `, element, text);
            return {
                content: [{ type: 'text', text: `Selected option with text: ${text}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error selecting by visible text: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "select_by_value",
    "selects an option from a dropdown by value",
    {
        ...locatorSchema,
        optionValue: z.string().describe("Value of the option to select")
    },
    async ({ by, value, optionValue, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            await driver.executeScript(`
                const select = arguments[0];
                select.value = arguments[1];
                select.dispatchEvent(new Event('change'));
            `, element, optionValue);
            return {
                content: [{ type: 'text', text: `Selected option with value: ${optionValue}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error selecting by value: ${e.message}` }]
            };
        }
    }
);





/**
 * Advanced Actions: Click and Hold
 * Simulates pressing and holding the mouse button on an element.
 * W3C Mapping: Actions API - pointer actions.
 */
server.tool(
    "click_and_hold",
    "clicks and holds the mouse button on an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const actions = driver.actions({ bridge: true });
            await actions.move({ origin: element }).press().perform();
            return {
                content: [{ type: 'text', text: 'Mouse button held down on element' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error clicking and holding: ${e.message}` }]
            };
        }
    }
);

/**
 * Advanced Actions: Release
 * Simulates releasing the mouse button (after click_and_hold).
 * W3C Mapping: Actions API - pointer actions.
 */
server.tool(
    "release",
    "releases the mouse button (after click_and_hold)",
    {},
    async () => {
        try {
            const driver = getDriver();
            const actions = driver.actions({ bridge: true });
            await actions.release().perform();
            return {
                content: [{ type: 'text', text: 'Mouse button released' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error releasing mouse button: ${e.message}` }]
            };
        }
    }
);

/**
 * Advanced Actions: Move By Offset
 * Moves the mouse by a given offset from its current position.
 * W3C Mapping: Actions API - pointer actions.
 */
server.tool(
    "move_by_offset",
    "moves the mouse by a given offset from its current position",
    {
        x: z.number().describe("Horizontal offset in pixels"),
        y: z.number().describe("Vertical offset in pixels")
    },
    async ({ x, y }) => {
        try {
            const driver = getDriver();
            const actions = driver.actions({ bridge: true });
            await actions.move({ x, y, origin: 'pointer' }).perform();
            return {
                content: [{ type: 'text', text: `Mouse moved by offset x=${x}, y=${y}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error moving mouse by offset: ${e.message}` }]
            };
        }
    }
);

/**
 * Advanced Actions: Send Keys to Active Element
 * Sends keys to the currently focused element.
 * W3C Mapping: Actions API - key actions.
 */
server.tool(
    "send_keys_active",
    "sends keys to the currently active element",
    {
        text: z.string().describe("Text to send to the active element")
    },
    async ({ text }) => {
        try {
            const driver = getDriver();
            const actions = driver.actions({ bridge: true });
            await actions.sendKeys(text).perform();
            return {
                content: [{ type: 'text', text: `Sent keys to active element: ${text}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error sending keys to active element: ${e.message}` }]
            };
        }
    }
);

/**
 * Advanced Actions: Key Down
 * Simulates pressing a key down (without releasing).
 * W3C Mapping: Actions API - key actions.
 */
server.tool(
    "key_down",
    "presses a key down (without releasing)",
    {
        key: z.string().describe("Key to press down (e.g., 'Shift', 'Control', 'a', etc.)")
    },
    async ({ key }) => {
        try {
            const driver = getDriver();
            const actions = driver.actions({ bridge: true });
            await actions.keyDown(key).perform();
            return {
                content: [{ type: 'text', text: `Key down: ${key}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error pressing key down: ${e.message}` }]
            };
        }
    }
);

/**
 * Advanced Actions: Key Up
 * Simulates releasing a key (after key_down).
 * W3C Mapping: Actions API - key actions.
 */
server.tool(
    "key_up",
    "releases a key (after key_down)",
    {
        key: z.string().describe("Key to release (e.g., 'Shift', 'Control', 'a', etc.)")
    },
    async ({ key }) => {
        try {
            const driver = getDriver();
            const actions = driver.actions({ bridge: true });
            await actions.keyUp(key).perform();
            return {
                content: [{ type: 'text', text: `Key up: ${key}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error releasing key: ${e.message}` }]
            };
        }
    }
);

/**
 * Element Submit
 * Submits a form element (if applicable).
 * W3C Mapping: Element Interaction - submit.
 */
server.tool(
    "submit_element",
    "submits a form element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            await element.submit();
            return {
                content: [{ type: 'text', text: 'Element submitted' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error submitting element: ${e.message}` }]
            };
        }
    }
);

/**
 * Get Session Capabilities
 * Returns the capabilities of the current session.
 * W3C Mapping: Session - capabilities.
 */
server.tool(
    "get_capabilities",
    "gets the capabilities of the current session",
    {},
    async () => {
        try {
            const driver = getDriver();
            const caps = await driver.getCapabilities();
            return {
                content: [{ type: 'text', text: JSON.stringify(caps, null, 2) }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting capabilities: ${e.message}` }]
            };
        }
    }
);

/**
 * Set Timeouts
 * Sets timeouts for script, page load, and implicit waits.
 * W3C Mapping: Session - timeouts.
 */
server.tool(
    "set_timeouts",
    "sets timeouts for script, page load, and implicit waits",
    {
        script: z.number().optional().describe("Script timeout in ms"),
        pageLoad: z.number().optional().describe("Page load timeout in ms"),
        implicit: z.number().optional().describe("Implicit wait timeout in ms")
    },
    async ({ script, pageLoad, implicit }) => {
        try {
            const driver = getDriver();
            const timeouts = {};
            if (script !== undefined) timeouts.script = script;
            if (pageLoad !== undefined) timeouts.pageLoad = pageLoad;
            if (implicit !== undefined) timeouts.implicit = implicit;
            await driver.manage().setTimeouts(timeouts);
            return {
                content: [{ type: 'text', text: `Timeouts set: ${JSON.stringify(timeouts)}` }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error setting timeouts: ${e.message}` }]
            };
        }
    }
);

/**
 * Get Timeouts
 * Gets the current timeouts for script, page load, and implicit waits.
 * W3C Mapping: Session - timeouts.
 */
server.tool(
    "get_timeouts",
    "gets the current timeouts for script, page load, and implicit waits",
    {},
    async () => {
        try {
            const driver = getDriver();
            const timeouts = await driver.manage().getTimeouts();
            return {
                content: [{ type: 'text', text: JSON.stringify(timeouts, null, 2) }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting timeouts: ${e.message}` }]
            };
        }
    }
);





// Resources
server.resource(
    "tauri-status",
    new ResourceTemplate("tauri-status://current"),
    async (uri) => ({
        contents: [{
            uri: uri.href,
            text: state.currentSession
                ? `Active Tauri session: ${state.currentSession}`
                : "No active Tauri session"
        }]
    })
);

// Cleanup handler
async function cleanup() {
    for (const [sessionId, driver] of state.drivers) {
        try {
            await driver.quit();
        } catch (e) {
            console.error(`Error closing Tauri session ${sessionId}:`, e);
        }
    }
    state.drivers.clear();
    state.currentSession = null;

    // Stop tauri-driver
    if (state.tauriDriver) {
        try {
            state.tauriDriver.kill();
            state.tauriDriver = null;
        } catch (e) {
            console.error('Error stopping tauri-driver:', e);
        }
    }

    process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);