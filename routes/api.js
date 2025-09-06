const express = require("express");
const { showClickableItems, showAllTexts, showPageXML } = require("../services/utils");
const { checkActivityAndDialog } = require("../services/dialogs");
const { checkBalance } = require("../services/balance");
const { mobileRecharge } = require("../services/recharge");

const router = express.Router();

router.get("/clickables", async (req, res) => res.json(await showClickableItems()));
router.get("/texts", async (req, res) => res.json(await showAllTexts()));
router.get("/activity", async (req, res) => res.json(await checkActivityAndDialog()));
router.get("/xml", async (req, res) => res.type("xml").send(await showPageXML()));
router.get("/check-balance", async (req, res) => res.json(await checkBalance()));
router.post("/check-balance", async (req, res) => res.json(await checkBalance(req)));
router.post("/recharge", async (req, res) => {
  const { number, operator, amount } = req.body;
  if (!number || !operator || !amount) {
    return res.status(400).json({ success: false, error: "number and operator are required" });
  }
  const result = await mobileRecharge({ number, operator, amount });
  res.json(result);
});

module.exports = router;
