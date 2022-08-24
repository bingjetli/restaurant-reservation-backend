//import mongoose module
const mongoose = require('mongoose');

//define the reservation schema
const reservation_schema = new mongoose.Schema({
    schemaVersion:{
        type:Number,
        required:true,
        default:1.2, 
        /** schema changelog:
         * 1.1: firstName & lastName : uppercase:true -> lowercase:true
         * 1.2: added status as an optional field to the schema
        */
    },
    date:{
        type:String,
        required: true,
        trim:true,
    },
    time:{
        type:String,
        required:true,
        trim:true,
    },
    seats:{
        type:Number,
        required:true,
        min:1,
    },
    phoneNumber:{
        type:String,
        required:true,
    },
    firstName:{
        type:String,
        required:true,
        trim:true,
        lowercase:true,
    },
    lastName:{
        type:String,
        required:true,
        trim:true,
        lowercase:true,
    },
    tags:{
        type:Array,
    },
    notes:{
        type:String,
        trim:true,
    },
    status:{
        type:String,
        trim:true,
        lowercase:true,
    },
});

//export the schema as a new model, ProperCamelCase for model names
module.exports = mongoose.model('Reservation', reservation_schema);