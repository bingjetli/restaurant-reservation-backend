//import mongoose module
const mongoose = require('mongoose');

//define the time-off-request schema
const time_off_request_schema = new mongoose.Schema({
    schemaVersion:{
        type:Number,
        required:true,
        default:1.0, 
        /** schema changelog:
         * 1.0 : created
        */
    },
    startDate:{
        type:String,
        required: true,
        trim:true,
    },
    endDate:{
        type:String,
        required:true,
        trim:true,
    },
    name:{
        type:String,
        required:true,
        trim:true,
        lowercase:true,
    },
    deleted:{
        type:Boolean,
        required:true,
        default:false,
    },
    details:{
        type:String,
        trim:true,
    },
    status:{
        required:true,
        type:String,
        trim:true,
        lowercase:true,
        default:'pending',
    },
});

//export the schema as a new model, ProperCamelCase for model names
module.exports = mongoose.model('TimeOffRequest', time_off_request_schema);