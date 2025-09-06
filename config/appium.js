const wdio = require("webdriverio");

let driver;

const opts = {
  hostname: "127.0.0.1",
  port: 4723,
  path: "/",
  logLevel: "error",
  capabilities: {
    platformName: "Android",
    "appium:platformVersion": "15",
    "appium:deviceName": "emulator-5554",
    "appium:automationName": "UiAutomator2",
    "appium:appPackage": "com.directpayapp",
    "appium:noReset": true,
    "appium:fullReset": false,
    "appium:dontStopAppOnReset": true,
  },
};

async function initDriver() {
  if (!driver) {
    console.log("⚡ Starting Appium session...");
    driver = await wdio.remote(opts);
  } else {
    try {
      await driver.getPageSource();
    } catch {
      console.log("♻️ Restarting dead Appium session...");
      driver = await wdio.remote(opts);
    }
  }
  return driver;
}

async function closeDriver() {
  if (driver) {
    console.log("🛑 Closing Appium session...");
    await driver.deleteSession();
    driver = null;
  }
}

module.exports = { initDriver, closeDriver };
