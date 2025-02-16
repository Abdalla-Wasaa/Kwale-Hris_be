const mongoose = require('mongoose')
const VehicleSchema = new mongoose.Schema({
    VehicleNumber : String,
    Subcounty : String,
    Route : String,
    Amount : Number,
    OperationStatusDescription : String,
    OwnerName : String,
    OwnerEmail : String,
    OwnerPin : String,
    CreatedBy : String,
    TerminatedDate : Date,

    
    },
    {
        timestamps:true
    }
    )

const vehicleModel = mongoose.model("vehicle", VehicleSchema)
module.exports= vehicleModel



