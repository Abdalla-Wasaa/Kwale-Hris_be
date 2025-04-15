const mongoose = require('mongoose')

const wardSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
    },
    Zones: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

const wardModel = mongoose.model("ward", wardSchema)
module.exports = wardModel