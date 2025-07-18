#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pkg from 'selenium-webdriver';
import path from "path";
const { Builder, By, Key, until, Actions, Capabilities } = pkg;
import os from 'os';
import { spawn } from "child_process";
import packageJson from '../../package.json' with { type: 'json' };

const server = new McpServer({
    name: "MCP Tauri",
    version: packageJson.version
});


// Server state
const state = {
    drivers: new Map(),
    currentSession: null,
    tauriDriver: null,
    tauriDriverPgid: null,
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
        case 'class': return By.className(value);
        case 'linktext': return By.linkText(value);
        case 'partiallinktext': return By.partialLinkText(value);
        default: throw new Error(`Unsupported locator strategy: ${by}`);
    }
};

const mapKeyToWebDriver = (keyName) => {
    // Map common key names to WebDriver Key constants
    const keyMap = {
        'Enter': Key.ENTER,
        'Return': Key.RETURN,
        'Tab': Key.TAB,
        'Escape': Key.ESCAPE,
        'Space': Key.SPACE,
        'Backspace': Key.BACK_SPACE,
        'Delete': Key.DELETE,
        'ArrowUp': Key.ARROW_UP,
        'ArrowDown': Key.ARROW_DOWN,
        'ArrowLeft': Key.ARROW_LEFT,
        'ArrowRight': Key.ARROW_RIGHT,
        'Home': Key.HOME,
        'End': Key.END,
        'PageUp': Key.PAGE_UP,
        'PageDown': Key.PAGE_DOWN,
        'Insert': Key.INSERT,
        'F1': Key.F1,
        'F2': Key.F2,
        'F3': Key.F3,
        'F4': Key.F4,
        'F5': Key.F5,
        'F6': Key.F6,
        'F7': Key.F7,
        'F8': Key.F8,
        'F9': Key.F9,
        'F10': Key.F10,
        'F11': Key.F11,
        'F12': Key.F12,
        'Shift': Key.SHIFT,
        'Control': Key.CONTROL,
        'Alt': Key.ALT,
        'Meta': Key.META,
        'Command': Key.COMMAND
    };

    // Return mapped key or original if no mapping exists (for regular characters)
    return keyMap[keyName] || keyName;
};

const startTauriDriver = async (port = 4444) => {
    if (state.tauriDriver) {
        return; // already init
    }

    const tauriDriverPath = path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver');

    state.tauriDriver = spawn(tauriDriverPath, ['--port', port.toString()], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
        detached: true  // Create new process group
    });

    // Store the process group ID
    state.tauriDriverPgid = state.tauriDriver.pid;

    // wait for the driver to start
    await new Promise(resolve => setTimeout(resolve, 4000));
    return state.tauriDriver;
}

// Common schemas
const locatorSchema = {
    by: z.enum(["id", "css", "xpath", "name", "class", "linkText", "partialLinkText"]).describe("Locator strategy to find element"),
    value: z.string().describe("Value for the locator strategy"),
    timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
};

// Tested tools

// I'm trying to keep some sort of "priority list", but still keep related things together

// Browser Management Tools
server.tool(
    "start_tauri_app",
    "launches tauri-driver and starts and connects to Tauri application",
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


// Navigation Tools
server.tool(
    "navigate",
    "navigates to a URL",
    {
        url: z.string().describe("URL to navigate to")

    },
    async ({ url }) => {
        try {
            const driver = getDriver();

            // Validate URL format
            try {
                const urlObj = new URL(url);
                // Allow http, https, and tauri protocols
                if (!['http:', 'https:', 'tauri:'].includes(urlObj.protocol)) {
                    return {
                        content: [{ type: 'text', text: `Error navigating: Invalid protocol. Only HTTP, HTTPS, and tauri:// are supported.` }]
                    };
                }
            } catch (urlError) {
                // If URL constructor throws, it's not a valid URL
                return {
                    content: [{ type: 'text', text: `Error navigating: Invalid URL format: ${url}` }]
                };
            }

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

// Window and Tab Management Tools


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

// Scroll Actions
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
                content: [{ type: 'text', text: JSON.stringify(timeouts) }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error getting timeouts: ${e.message}` }]
            };
        }
    }
);

// Untested tools below



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
        targetBy: z.enum(["id", "css", "xpath", "name", "class", "linkText", "partialLinkText"]).describe("Locator strategy to find target element"),
        targetValue: z.string().describe("Value for the target locator strategy")
    },
    async ({ by, value, targetBy, targetValue, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const sourceLocator = getLocator(by, value);
            const targetLocator = getLocator(targetBy, targetValue);

            const sourceElement = await driver.wait(until.elementLocated(sourceLocator), timeout);
            const targetElement = await driver.wait(until.elementLocated(targetLocator), timeout);

            await driver.wait(until.elementIsVisible(sourceElement), timeout);
            await driver.wait(until.elementIsVisible(targetElement), timeout);

            // Scroll elements into view with better positioning
            // First, scroll source element to center of viewport
            await driver.executeScript("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", sourceElement);
            await driver.sleep(200);

            // Then scroll target element, but keep source visible if possible
            await driver.executeScript("arguments[0].scrollIntoView({block: 'nearest', inline: 'nearest'});", targetElement);
            await driver.sleep(200);

            const actions = driver.actions({ bridge: true });
            await actions.dragAndDrop(sourceElement, targetElement).perform();

            return {
                content: [{ type: 'text', text: 'Drag and drop completed' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error performing drag and drop: ${e.message || e.toString()}` }]
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
            await driver.wait(until.elementIsVisible(element), timeout);
            // Scroll element into view
            await driver.executeScript("arguments[0].scrollIntoView(true);", element);
            // Small delay to ensure element is ready
            await driver.sleep(100);
            const actions = driver.actions({ bridge: true });
            await actions.doubleClick(element).perform();
            return {
                content: [{ type: 'text', text: 'Double click performed' }]
            };
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error performing double click: ${e.message || e.toString()}` }]
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
            await driver.wait(until.elementIsVisible(element), timeout);
            // Scroll element into view
            await driver.executeScript("arguments[0].scrollIntoView(true);", element);
            // Small delay to ensure element is ready
            await driver.sleep(100);
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
            const mappedKey = mapKeyToWebDriver(key);
            await actions.keyDown(mappedKey).keyUp(mappedKey).perform();
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
    async ({ by, value }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
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
            const rect = await element.getRect();
            return {
                content: [{ type: 'text', text: `Element size: width=${rect.width}, height=${rect.height}` }]
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
            const rect = await element.getRect();
            return {
                content: [{ type: 'text', text: `Element location: x=${rect.x}, y=${rect.y}` }]
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


// Select dropdown tools
server.tool(
    "select_by_visible_text",
    "selects an option from a dropdown by visible text",
    {
        ...locatorSchema,
        text: z.string().describe("Visible text of the option to select"),
        partial: z.boolean().optional().describe("Enable partial text matching (default: false)")
    },
    async ({ by, value, text, partial = false, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            
            const result = await driver.executeScript(`
                const select = arguments[0];
                const searchText = arguments[1];
                const partialMatch = arguments[2];
                const options = select.options;
                const availableOptions = [];
                let foundIndex = -1;
                
                for (let i = 0; i < options.length; i++) {
                    const optionText = options[i].text;
                    availableOptions.push(optionText);
                    
                    let matches = false;
                    if (partialMatch) {
                        matches = optionText.toLowerCase().includes(searchText.toLowerCase());
                    } else {
                        matches = optionText === searchText;
                    }
                    
                    if (matches && foundIndex === -1) {
                        foundIndex = i;
                    }
                }
                
                if (foundIndex !== -1) {
                    select.selectedIndex = foundIndex;
                    select.dispatchEvent(new Event('change'));
                    return { success: true, selectedText: options[foundIndex].text };
                } else {
                    return { success: false, availableOptions: availableOptions };
                }
            `, element, text, partial);
            
            if (result.success) {
                return {
                    content: [{ type: 'text', text: `Selected option with text: ${result.selectedText}` }]
                };
            } else {
                const matchType = partial ? 'containing' : 'matching';
                const availableText = result.availableOptions.length > 0 
                    ? `Available options: [${result.availableOptions.map(opt => `'${opt}'`).join(', ')}]`
                    : 'No options available';
                return {
                    content: [{ type: 'text', text: `No option ${matchType} '${text}' found. ${availableText}` }]
                };
            }
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error selecting by visible text: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "select_by_contains_text",
    "selects an option from a dropdown by partial, case-insensitive text matching",
    {
        ...locatorSchema,
        text: z.string().describe("Text that should be contained in the option (case-insensitive)")
    },
    async ({ by, value, text, timeout = 10000 }) => {
        try {
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            
            const result = await driver.executeScript(`
                const select = arguments[0];
                const searchText = arguments[1].toLowerCase();
                const options = select.options;
                const availableOptions = [];
                let foundIndex = -1;
                
                for (let i = 0; i < options.length; i++) {
                    const optionText = options[i].text;
                    availableOptions.push(optionText);
                    
                    if (optionText.toLowerCase().includes(searchText) && foundIndex === -1) {
                        foundIndex = i;
                    }
                }
                
                if (foundIndex !== -1) {
                    select.selectedIndex = foundIndex;
                    select.dispatchEvent(new Event('change'));
                    return { success: true, selectedText: options[foundIndex].text };
                } else {
                    return { success: false, availableOptions: availableOptions };
                }
            `, element, text);
            
            if (result.success) {
                return {
                    content: [{ type: 'text', text: `Selected option with text: ${result.selectedText}` }]
                };
            } else {
                const availableText = result.availableOptions.length > 0 
                    ? `Available options: [${result.availableOptions.map(opt => `'${opt}'`).join(', ')}]`
                    : 'No options available';
                return {
                    content: [{ type: 'text', text: `No option containing '${text}' found. ${availableText}` }]
                };
            }
        } catch (e) {
            return {
                content: [{ type: 'text', text: `Error selecting by contains text: ${e.message}` }]
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
            await driver.wait(until.elementIsVisible(element), timeout);
            // Scroll element into view
            await driver.executeScript("arguments[0].scrollIntoView(true);", element);
            // Small delay to ensure element is ready
            await driver.sleep(100);
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
            const mappedKey = mapKeyToWebDriver(key);
            await actions.keyDown(mappedKey).perform();
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
            const mappedKey = mapKeyToWebDriver(key);
            await actions.keyUp(mappedKey).perform();
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

    // Stop tauri-driver and its children
    if (state.tauriDriver) {
        try {
            // First try graceful shutdown
            state.tauriDriver.kill('SIGTERM');

            // Give it time to clean up children
            await new Promise(resolve => setTimeout(resolve, 2000));

            // If still running, kill the entire process group
            if (!state.tauriDriver.killed) {
                process.kill(-state.tauriDriverPgid, 'SIGKILL');
            }

            state.tauriDriver = null;
            state.tauriDriverPgid = null;
        } catch (e) {
            console.error('Error stopping tauri-driver:', e);
        }
    }

    process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('beforeExit', cleanup);
process.on('exit', cleanup);
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    cleanup();
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    cleanup();
});

process.stdin.on('close', cleanup);
process.stdin.on('end', cleanup);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);