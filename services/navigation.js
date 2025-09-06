/**
 * Ensure we are on the CustomMain activity (home page).
 * Tries to navigate back up to 10 times if not already there.
 * @param {object} d - WebDriver instance
 * @returns {boolean} - true if on CustomMain, false otherwise
 */
async function goToHome(d) {
  let activity = await d.getCurrentActivity();

  if (activity.includes("CustomMain")) {
    return true; // already home
  }

  console.log("🔄 Not on main page, navigating...");

  let attempts = 0;
  while (!activity.includes("CustomMain") && attempts < 10) {
    await d.back();
    await d.pause(500); // wait for UI to update
    activity = await d.getCurrentActivity();
    attempts++;
  }

  const success = activity.includes("CustomMain");
  console.log(success ? "✅ Now on main page." : "❌ Could not reach main page.");
  return success;
}

/**
 * Navigate to OperatorsPDActivity from any activity
 * Handles different entry points gracefully.
 * @param {object} d - WebDriver instance
 */
async function navigateToOperators(d) {
  let current = await d.getCurrentActivity();
  console.log("📌 Current Activity:", current);

  if (current.includes("CustomMain")) {
    // Case 1: already on home
    const rechargesBtn = await d.$("id=com.directpayapp:id/recharge");
    await rechargesBtn.waitForDisplayed({ timeout: 10000 });
    await rechargesBtn.click();
  } else if (current.includes("DirRechargeActivity")) {
    // Case 2: directly in Recharge section → continue below
    console.log("✅ Already in DirRechargeActivity.");
  } else if (current.includes("PrepaidActivity")) {
    // Case 3: inside prepaid → back out
    console.log("↩️ In PrepaidActivity, going back...");
    await d.back();
  } else {
    // Case 4: unknown page → go home, then click recharge
    console.log("⚠️ Unknown activity, forcing navigation to home...");
    const ok = await goToHome(d);
    if (!ok) throw new Error("❌ Could not reach CustomMain");

    const rechargesBtn = await d.$("id=com.directpayapp:id/recharge");
    await rechargesBtn.waitForDisplayed({ timeout: 10000 });
    await rechargesBtn.click();
  }

  // 🔹 Wait for the grid view to appear
  const gridItems = await d.$$(
    "id=com.directpayapp:id/android_gridview_text"
  );
  if (!gridItems || gridItems.length === 0) {
    const firstGridItem = await d.$("id=com.directpayapp:id/android_gridview_text");
    await firstGridItem.waitForDisplayed({ timeout: 10000 });
  }

  // Click the first grid item (Mobile Recharge)
  const mobileRechargeBtn = await d.$$(
    "id=com.directpayapp:id/android_gridview_text"
  );
  if (!mobileRechargeBtn || mobileRechargeBtn.length === 0) {
    throw new Error("❌ Mobile Recharge option not found after waiting");
  }
  await mobileRechargeBtn[0].click();

  // 🔹 Ensure OperatorsPDActivity has loaded
  await d.waitUntil(
    async () => (await d.getCurrentActivity()).includes("OperatorsPDActivity"),
    {
      timeout: 10000,
      timeoutMsg: "❌ Navigation timeout: OperatorsPDActivity not reached",
    }
  );

  console.log("✅ Now on OperatorsPDActivity");
  return true;
}

module.exports = { goToHome, navigateToOperators };
