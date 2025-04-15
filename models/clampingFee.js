const mongoose = require('mongoose')
const clampingFeeSchema = new mongoose.Schema({
    FeeName : String,
    description : String,
    FeeAmount : String
    
},
{
    timestamps:true
}
)

const ClampingFeeModel = mongoose.model("clampingFees", clampingFeeSchema)
module.exports= ClampingFeeModel