const mongoose = require('mongoose')
const businessSchema = new mongoose.Schema({
    BusinessNumber : String,
    BusinessName : String,
    BusinessDescription : String,
    ActivityCode : Number,
    ActivityDescription : String,
    OperationStatusDecription : String,
    SubCounty : String,
    LocationDescription : String,
    PinNumber : String,
    Email : String,
    BuildingName : String,
    PermitAmount : Number,
    CreatedBy : String,
    TerminatedDate : Date,

    
    },
    {
        timestamps:true
    }
    )

const businessModel = mongoose.model("business", businessSchema)
module.exports= businessModel