const mongoose = require('mongoose')
const cessSchema = new mongoose.Schema({
    RevenueId : Number,
    TransactionCode : String,
    Amount : Number,
    Description : String,
    TransactionDate : Date,
    PaymodeId : Number,
    CustomerName : String,
    UnitQty : Number,
    ServedBy : String,
 
    },
    {
        timestamps:true
    }
    )

const cessModel = mongoose.model("cess", cessSchema)
module.exports= cessModel



