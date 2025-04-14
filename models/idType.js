const mongoose = require('mongoose')
const idTypeSchema = new mongoose.Schema({
    ID : String,
    TypeName : String,
 
    },
    {
        timestamps:true
    }
    )

const idTypeModel = mongoose.model("idType", idTypeSchema)
module.exports= idTypeModel