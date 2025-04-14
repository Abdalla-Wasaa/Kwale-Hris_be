const mongoose = require('mongoose')
const activityCodeSchema = new mongoose.Schema({
    Code : String,
    PermitAmount : String,
    ActivityDescription: String

    },
    {
        timestamps:true
    }
    )

const activityCodeModel = mongoose.model("activityCode", activityCodeSchema)
module.exports= activityCodeModel