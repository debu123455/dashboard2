const mongoose = require("mongoose");

const systemHealthSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    status: {
      type: String,
      enum: ["Healthy", "Warning", "Down"],
      default: "Healthy"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemHealth", systemHealthSchema);
