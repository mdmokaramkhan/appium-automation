const { initDriver } = require("../config/appium");
const { goToHome } = require("./navigation");

async function checkBalance() {
  const d = await initDriver();
  try {
    await d.activateApp("com.directpayapp");
    await goToHome(d);

    const checkBalBtn = await d.$("id=com.directpayapp:id/btn_check");
    if (!(await checkBalBtn.isExisting())) {
      return { success: false, error: "❌ Check Balance button not found" };
    }

    await checkBalBtn.click();

    const title = await d.$("id=com.directpayapp:id/title");
    await title.waitForDisplayed({ timeout: 15000 });
    const balance = await d.$("id=com.directpayapp:id/mainbal");

    const result = {
      title: await title.getText(),
      balance: await balance.getText(),
    };

    const okayBtn = await d.$("id=com.directpayapp:id/okay");
    if (await okayBtn.isExisting()) await okayBtn.click();

    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { checkBalance };
