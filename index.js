const express = require("express");
const bodyParser = require("body-parser");
const wdio = require("webdriverio");

const app = express();
app.use(bodyParser.json());
const PORT = 3000;

let driver; // shared Appium driver

// -------------------- Appium Options --------------------
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

// -------------------- Init Driver --------------------
async function initDriver() {
  if (!driver) {
    console.log("⚡ Starting Appium session...");
    driver = await wdio.remote(opts);
  }
  return driver;
}

// -------------------- Helper Functions --------------------
async function showClickableItems() {
  const d = await initDriver();
  const clickables = await d.$$('//*[@clickable="true"]');
  return await Promise.all(
    clickables.map(async (el, i) => ({
      index: i,
      text: await el.getText(),
      resourceId: await el.getAttribute("resourceId"),
    }))
  );
}

async function showAllTexts() {
  const d = await initDriver();
  const texts = await d.$$("//android.widget.TextView");
  return await Promise.all(
    texts.map(async (el, i) => ({
      index: i,
      text: await el.getText(),
    }))
  );
}

async function checkActivityAndDialog() {
  const d = await initDriver();
  const activity = await d.getCurrentActivity();
  const pkg = await d.getCurrentPackage();

  // fetch dialog message textviews
  const textViews = await d.$$('//android.widget.TextView[@resource-id="android:id/message"]');

  // fetch generic dialogs if needed
  const dialogRoots = await d.$$('//android.app.Dialog');

  // merge both lists
  const dialogs = [...textViews, ...dialogRoots];

  const dialogData = [];
  for (let i = 0; i < dialogs.length; i++) {
    try {
      const txt = await dialogs[i].getText();
      if (txt && txt.trim() !== "") {
        dialogData.push({ index: i, text: txt });
      }
    } catch (_) {
      // ignore elements without text
    }
  }

  return {
    activity,
    package: pkg,
    dialogs: dialogData,
  };
}


async function showPageXML() {
  const d = await initDriver();
  return await d.getPageSource();
}

async function checkBalance() {
  const d = await initDriver();
  try {
    const checkBalBtn = await d.$("id=com.directpayapp:id/btn_check");
    await checkBalBtn.click();

    const title = await d.$("id=com.directpayapp:id/title");
    const balance = await d.$("id=com.directpayapp:id/mainbal");

    const result = {
      title: await title.getText(),
      balance: await balance.getText(),
    };

    const okayBtn = await d.$("id=com.directpayapp:id/okay");
    await okayBtn.click();

    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function mobileRecharge(req) {
  const d = await initDriver();
  try {
    // 🔹 Select Opretor
    const operators = await d.$$(
      "id=com.directpayapp:id/android_gridview_text"
    );
    await operators[2].click(); // e.g., 0=AirTel, 1=BSNL, etc.

    // 🔹 Fill number
    const numberInput = await d.$("id=com.directpayapp:id/input_prepaidnumber");
    await numberInput.setValue(req.number);

    // 🔹 Fill amount
    const amountInput = await d.$("id=com.directpayapp:id/input_amount");
    await amountInput.setValue(req.amount);

    // 🔹 Click Recharge button
    const rechargeBtn = await d.$("id=com.directpayapp:id/recharge");
    await rechargeBtn.click();

    // Wait for dialog to appear
    const titleEl = await d.$("id=com.directpayapp:id/title");
    const messageEl = await d.$("id=com.directpayapp:id/message");

    const titleText = await titleEl.getText();
    const messageText = await messageEl.getText();

    console.log("💬 Confirmation Dialog:");
    console.log("Title:", titleText);
    console.log("Message:", messageText);

    // Check if number and amount match
    if (
      titleText.includes(req.number.toString()) &&
      titleText.includes(req.amount.toString())
    ) {
      console.log("✅ Number & amount match, continuing...");
      const continueBtn = await d.$("id=com.directpayapp:id/positiveBtn");
      await continueBtn.click();
      // Wait for final dialog
      const finalMsgEl = await d.$("id=com.directpayapp:id/message");
      const finalText = await finalMsgEl.getText();

      console.log("🎉 Final Dialog Message:", finalText);

      // Click OK button
      const okBtn = await d.$("id=com.directpayapp:id/positiveBtn");
      await okBtn.click();

      return { success: true, finalMessage: finalText };
    } else {
      console.log("❌ Mismatch! Cancelling...");
      const cancelBtn = await d.$("id=com.directpayapp:id/negativeBtn");
      await cancelBtn.click();
      return { success: false, action: "cancelled", title: titleText };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -------------------- API Endpoints --------------------
app.get("/clickables", async (req, res) => {
  res.json(await showClickableItems());
});

app.get("/texts", async (req, res) => {
  res.json(await showAllTexts());
});

app.get("/activity", async (req, res) => {
  res.json(await checkActivityAndDialog());
});

app.get("/xml", async (req, res) => {
  res.type("xml").send(await showPageXML());
});

app.get("/check-balance", async (req, res) => {
  res.json(await checkBalance());
});

app.post("/check-balance", async (req, res) => {
  res.json(await checkBalance(req));
});

app.post("/recharge", async (req, res) => {
  const { number, operator, amount } = req.body;

  if (!number || !operator || !amount) {
    return res
      .status(400)
      .json({ success: false, error: "number and operator are required" });
  }

  const result = await mobileRecharge({ number, operator, amount });
  res.json(result);
});

// -------------------- Graceful Shutdown --------------------
process.on("SIGINT", async () => {
  if (driver) {
    console.log("🛑 Closing Appium session...");
    await driver.deleteSession();
  }
  process.exit();
});

app.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}`);
});
