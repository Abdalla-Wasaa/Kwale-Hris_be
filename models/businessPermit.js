const mongoose = require('mongoose')
const businessPermitSchema = new mongoose.Schema({
    BusinessPermitNumber : String,
    BusinessName : String,
    CalendarYear : String,
    AmountPaid : Number,
    DateCreated : Date,

    
    },
    {
        timestamps:true
    }
    )

const businessPermitModel = mongoose.model("businessPermits", businessPermitSchema)
module.exports= businessPermitModel