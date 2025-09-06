const { initDriver } = require("../config/appium");

async function showClickableItems() {
  const d = await initDriver();
  const clickables = await d.$$('//*[@clickable="true"]');
  return Promise.all(
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
  return Promise.all(
    texts.map(async (el, i) => ({
      index: i,
      text: await el.getText(),
    }))
  );
}

async function showPageXML() {
  const d = await initDriver();
  return await d.getPageSource();
}

module.exports = { showClickableItems, showAllTexts, showPageXML };
