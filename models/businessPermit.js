const mongoose = require('mongoose')
const businessPermitSchema = new mongoose.Schema({
    BusinessPermitNumber : String,
    BusinessId : Number,
    BillId : Number,
    CalendarYear : Number,
    CategoryCode : String,
    AmountPaid : Number,
    DateIssued : Date,
    PrintCount : Number,
    SerialNumber : Number,
    BusinessName : String,
    Status : Number,
    DateCancelled : Date,
    CreatedBy : String,
    DateCreated : Date,
    LastModifiedBy : String,
    DateLastModified : Date,

    
    },
    {
        timestamps:true
    }
    )

const businessPermitModel = mongoose.model("businessPermit", businessPermitSchema)
module.exports= businessPermitModel