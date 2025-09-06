const { initDriver } = require("../config/appium");
const { navigateToOperators } = require("./navigation");

/**
 * Perform Mobile Recharge
 * @param {Object} req - recharge request
 * @param {string} req.number - mobile number to recharge
 * @param {string|number} req.amount - recharge amount
 */
async function mobileRecharge(req) {
  const d = await initDriver();

  try {
    // Step 1: Navigate to Operators page
    await navigateToOperators(d);

    // Step 2: Select operator (example: index 2)
    const operators = await d.$$("id=com.directpayapp:id/android_gridview_text");
    if (!operators || operators.length < 3) {
      throw new Error("Operators list not found or too short");
    }
    await operators[(req.operator)-1].click();

    // Step 3: Fill recharge form
    const numberInput = await d.$("id=com.directpayapp:id/input_prepaidnumber");
    const amountInput = await d.$("id=com.directpayapp:id/input_amount");
    await numberInput.setValue(req.number);
    await amountInput.setValue(req.amount);

    // Step 4: Click Recharge button
    const rechargeBtn = await d.$("id=com.directpayapp:id/recharge");
    await rechargeBtn.click();

    // Step 5: Handle confirmation dialog
    const titleEl = await d.$("id=com.directpayapp:id/title");
    await titleEl.waitForDisplayed({ timeout: 15000 });
    const messageEl = await d.$("id=com.directpayapp:id/message");

    const titleText = (await titleEl.getText()) || "";
    const messageText = (await messageEl.getText()) || "";

    // Validate entered details in confirmation dialog
    const numberOk = titleText.includes(req.number.toString());
    const amountOk = titleText.includes(req.amount.toString());

    if (numberOk && amountOk) {
      // Proceed
      const continueBtn = await d.$("id=com.directpayapp:id/positiveBtn");
      await continueBtn.waitForDisplayed({ timeout: 15000 });
      await continueBtn.click();

      // Final message
      const finalMsgEl = await d.$("id=com.directpayapp:id/message");
      await finalMsgEl.waitForDisplayed({ timeout: 15000 });
      const finalText = (await finalMsgEl.getText()) || "";

      const okBtn = await d.$("id=com.directpayapp:id/positiveBtn");
      await okBtn.click();

      return {
        success: true,
        title: titleText,
        message: messageText,
        finalMessage: finalText,
      };
    } else {
      // Cancel if mismatch
      const cancelBtn = await d.$("id=com.directpayapp:id/negativeBtn");
      await cancelBtn.click();

      return {
        success: false,
        action: "cancelled",
        title: titleText,
        message: messageText,
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || "Unknown error occurred",
    };
  }
}

module.exports = { mobileRecharge };
