const mongoose = require('mongoose')
const receiptSchema = new mongoose.Schema({
    ID : String,
    BusinessType : String,
    BillNumber : Number,
    Transaction : Date
 
    },
    {
        timestamps:true
    }
    )

const receiptModel = mongoose.model("receipt", receiptSchema)
module.exports= receiptModel