const { initDriver } = require("../config/appium");

async function checkActivityAndDialog() {
  const d = await initDriver();
  const activity = await d.getCurrentActivity();
  const pkg = await d.getCurrentPackage();

  const textViews = await d.$$('//android.widget.TextView[@resource-id="android:id/message"]');
  const dialogRoots = await d.$$('//android.app.Dialog');
  const dialogs = [...textViews, ...dialogRoots];

  const dialogData = [];
  for (let i = 0; i < dialogs.length; i++) {
    try {
      const txt = await dialogs[i].getText();
      if (txt && txt.trim()) dialogData.push({ index: i, text: txt });
    } catch {}
  }

  return { activity, package: pkg, dialogs: dialogData };
}

module.exports = { checkActivityAndDialog };
