const { execSync } = require("child_process");
const path = require("path");

// Set your adb path here (adjust if different)
const adbPath = path.resolve(process.env.HOME, "Library/Android/sdk/platform-tools/adb");

function runCmd(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (e) {
    return "";
  }
}

function getDeviceName() {
  const devices = runCmd(`${adbPath} devices`);
  const lines = devices.split("\n").slice(1).filter(l => l.includes("device"));
  if (lines.length > 0) {
    return lines[0].split("\t")[0];
  }
  return "No device found";
}

function getPlatformVersion(device) {
  return runCmd(`${adbPath} -s ${device} shell getprop ro.build.version.release`);
}

function getCurrentApp(device) {
  const focus = runCmd(`${adbPath} -s ${device} shell dumpsys window | grep -E "mCurrentFocus"`);
  const match = focus.match(/ ([^\/\s]+)\/([^\/\s}]+)/);
  if (match) {
    return {
      appPackage: match[1],
      appActivity: match[2]
    };
  }
  return { appPackage: "Unknown", appActivity: "Unknown" };
}

function main() {
  const deviceName = getDeviceName();
  if (deviceName === "No device found") {
    console.log("❌ No device/emulator connected.");
    return;
  }

  const platformVersion = getPlatformVersion(deviceName);
  const { appPackage, appActivity } = getCurrentApp(deviceName);

  console.log("✅ Device Info:");
  console.log(`deviceName:      ${deviceName}`);
  console.log(`platformVersion: ${platformVersion}`);
  console.log(`appPackage:      ${appPackage}`);
  console.log(`appActivity:     ${appActivity}`);
}

main();
