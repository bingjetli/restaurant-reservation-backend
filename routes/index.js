//load development environment variables if not running in production environment
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

//import express
const express = require('express');

//retreive the router from the express app
const router = express.Router();

//handle the route
router.get('/', (p_request, p_response) => {
    if(p_request.get(process.env.API_KEY_HEADER_NAME) === process.env.API_KEY){
        p_response.sendStatus(200);
        console.log('successful');
    }
    else{
        p_response.sendStatus(process.env.API_KEY_REJECTION_RESPONSE_CODE);
        console.log('failed');
    }
});

//export the router
module.exports = router;