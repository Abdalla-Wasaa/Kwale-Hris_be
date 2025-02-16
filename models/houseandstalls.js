const mongoose = require('mongoose')
const HouseandStallSchema = new mongoose.Schema({
    HouseOrStallNumber : String,
    Subcounty : String,
    Arrears : Number,
    PhysicalLocation : String,
    FeeName : String,
    OwnerName : String,
    OwnerEmail : String,
    OwnerPin : String,
    CreatedBy : String,
    DateCreated : Date

    
    },
    {
        timestamps:true
    }
    )

const houseandstallModel = mongoose.model("houseandstalls", HouseandStallSchema)
module.exports= houseandstallModel