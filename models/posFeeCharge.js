const mongoose = require('mongoose')
const posFeeChargeSchema = new mongoose.Schema({
    FeeId : String,
    FeeName : String,
    FFAFeeName : String,
    FeeAmount : String
    
},
{
    timestamps:true
}
)

const POSFeeChargeModel = mongoose.model("posFeeCharges", posFeeChargeSchema)
module.exports= POSFeeChargeModel