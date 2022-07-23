//import mongoose module
const mongoose = require('mongoose');

//define the tag schema
const tag_schema = new mongoose.Schema({
    schemaVersion:{
        type:Number,
        required:true,
        default:1.0,
    },
    name:{
        type:String,
        required:true
    },
    color:{
        type:String,
        required:true
    }
});

//export the schema as a new model, ProperCamelCase for model names
module.exports = mongoose.model('Tag', tag_schema);