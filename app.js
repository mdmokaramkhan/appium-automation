const express = require("express");
const bodyParser = require("body-parser");
const apiRoutes = require("./routes/api");
const { closeDriver } = require("./config/appium");

const app = express();
app.use(bodyParser.json());

app.use("/", apiRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  await closeDriver();
  process.exit();
});
