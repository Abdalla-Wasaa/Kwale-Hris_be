const mongoose = require('mongoose')

const subcountySchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
    },
    Wards: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

const subcountyModel = mongoose.model("subcounty", subcountySchema)
module.exports = subcountyModel