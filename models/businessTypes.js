const mongoose = require('mongoose')
const businessTypeSchema = new mongoose.Schema({
    ID : String,
    TypeName : String,
 
    },
    {
        timestamps:true
    }
    )

const businessTypeModel = mongoose.model("businessType", businessTypeSchema)
module.exports= businessTypeModel