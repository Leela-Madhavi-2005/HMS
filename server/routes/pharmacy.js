const express = require("express");
const PharmacyStock = require("../models/PharmacyStock");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET all stock
router.get("/", protect, async (req, res) => {
  try {
    const stock = await PharmacyStock.find().sort({ createdAt: -1 });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pharmacy stock" });
  }
});

// POST add stock
router.post("/", protect, async (req, res) => {
  try {
    const { name, batchNumber, expiryDate, quantity, unitPrice, gst, supplier } = req.body;
    const item = await PharmacyStock.create({
      name,
      batchNumber,
      expiryDate: new Date(expiryDate),
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      gst: Number(gst || 18),
      supplier,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to add pharmacy stock" });
  }
});

// PUT update stock quantity or price
router.put("/:id", protect, async (req, res) => {
  try {
    const { quantity, unitPrice, gst } = req.body;
    const updates = {};
    if (quantity !== undefined) updates.quantity = Number(quantity);
    if (unitPrice !== undefined) updates.unitPrice = Number(unitPrice);
    if (gst !== undefined) updates.gst = Number(gst);

    const item = await PharmacyStock.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!item) return res.status(404).json({ message: "Stock item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to update pharmacy stock" });
  }
});

// DELETE stock item
router.delete("/:id", protect, async (req, res) => {
  try {
    const item = await PharmacyStock.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Stock item not found" });
    res.json({ message: "Stock item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete stock item" });
  }
});

module.exports = router;
