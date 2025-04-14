const mongoose = require('mongoose')

const businessCategorySchema = new mongoose.Schema(
  {
    CategoryName: {
      type: String,
      required: true,
    },
    ActivityCodes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

const businessCategoryModel = mongoose.model("businessCategory", businessCategorySchema)
module.exports = businessCategoryModel