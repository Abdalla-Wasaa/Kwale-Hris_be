const mongoose = require('mongoose')
const businessSchema = new mongoose.Schema({
    BusinessNumber : String,
    BusinessName : String,
    Description : String,
    ActivityCode : String,
    PermitAmount : Number,
    ActivityDescription : String,
    LocationDescription : String,
    DateCreated : Date,

    
    },
    {
        timestamps:true
    }
    )

const businessModel = mongoose.model("business", businessSchema)
module.exports= businessModel