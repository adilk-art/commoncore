import mongoose from "mongoose";

const addressSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users",
        required:true
    },
    fullName:{
        type:String,
        required:true

    },
    line1:{
        type:String,
        required:true

    },
    line2:{
        type:String

    },
    phone:{
        type:String,
        require:true 
    },
    city:{
        type:String,
        required:true 
    },
    state:{
        type:String,
        required:true
    },
    pincode:{
        type:String,
        required:true
    },
    isDefault:{
        type:Boolean,
        default:false
    }
},{
        timestamps:true,
    })


    export default mongoose.model("Address",addressSchema)