const mongoose = require('mongoose')
const PropertySchema = new mongoose.Schema({
    UPN : String,
    LrNumber : String,
    Subcounty : String,
    PhysicalLocation : String,
    AreaInHa : Number,
    SiteValue : Number,
    AnnualRates : Number,
    PenaltyArrearsBF : Number,
    RatesArrearsBF : Number,
    OwnerName : String,
    OwnerEmail : String,
    OwnerPin : String,
    DateCreated : Date,
    CreatedBy : String,

    
    },
    {
        timestamps:true
    }
    )

const propertyModel = mongoose.model("property", PropertySchema)
module.exports= propertyModel