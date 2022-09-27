//import express
const express = require('express');
const time_off_request = require('../models/time_off_request');

//import models
const TimeOffRequest = require('../models/time_off_request');

//retreive the router from the express app
const router = express.Router();

//handle the read route
router.get('/', async (p_request, p_response) => {
    if(p_request.get(process.env.API_KEY_HEADER_NAME).toUpperCase() === process.env.API_KEY.toUpperCase()){
        //API_KEY_HEADER_NAME = the name of the HTTP Header containing the API_KEY
        try{
            if(p_request.query.id){
                //time-off-request document id is specified, return this specific document then
                const time_off_request = await TimeOffRequest.findById(p_request.query.id);

                if(time_off_request){
                    p_response.send({
                        result:'successful',
                        timeOffRequest:time_off_request,
                    });
                }
                else{
                    p_response.send({
                        result:'not_found',
                        message:`unable to find a time-off request with this id ${p_request.query.id}`
                    });
                }
            }
            else{
                //time-off-request document id is not specified, build a search query
                const search_query = {};
                if(p_request.query.startDate){
                    search_query.startDate = {$gte: p_request.query.startDate}
                }
                if(p_request.query.endDate){
                    search_query.endDate = {$lte: p_request.query.endDate}
                }
                if(p_request.query.name){
                    search_query.name = new RegExp(p_request.query.name, 'i');
                }
                if(p_request.query.includeDeleted === false || p_request.query.includeDeleted === undefined){
                    //do not include deleted time-off-requests, or the specifier wasn't defined, we will not include deleted time-off-requests by default
                    search_query.deleted = false; //only search time-off-requests that aren't deleted
                }

                if(Object.keys(search_query).length > 0){
                    //there is a search query provided, run the search query
                    const matching_time_off_requests = await TimeOffRequest.find(search_query);

                    if(matching_time_off_requests.length > 0){
                        //found matching time-off-requests
                        p_response.send({
                            result:'successful',
                            timeOffRequests:matching_time_off_requests,
                            message:'found results matching search query'
                        });
                    }
                    else{
                        //matching_time_off_requests is empty
                        p_response.send({
                            result:'not_found',
                            message:`unable to find any time-off requests with this search query \n${JSON.stringify(search_query)}`
                        });
                    }
                }
                else{
                    //there isn't a search query provided, so attempt to return all time-off requests
                    const all_time_off_requests = await TimeOffRequest.find({});
                    p_response.send({
                        result:'successful',
                        timeOffRequests:all_time_off_requests,
                        message:'no search query provided, returning all time-off requests'
                    });
                }
            }
        }
        catch(e){
            p_response.send({
                result:'error_occured',
                message:e.message
            });
        }
    }
    else {
        p_response.sendStatus(process.env.API_REJECTION_CODE);
    }

});

//handle create route
router.post('/', async (p_request, p_response) => {
    //check for the API_KEY in the headers first
    if(p_request.get(process.env.API_KEY_HEADER_NAME).toUpperCase() === process.env.API_KEY.toUpperCase()){
        //create a new time-off request object
        let new_time_off_request = new TimeOffRequest({
            startDate:p_request.body.startDate,
            endDate:p_request.body.endDate,
            name:p_request.body.name,
        });

        //populate optional fields if they exist
        if(p_request.body.details && p_request.body.details.length > 0){
            new_time_off_request.details = p_request.body.details;
        }
        if(p_request.body.status && p_request.body.status.length > 0){
            new_time_off_request.status = p_request.body.status;
        }
        if(p_request.body.hasOwnProperty('deleted')){
            new_time_off_request.deleted = p_request.body.deleted;
        }

        //try to create the time-off request in mongodb
        try{
            //check if there are duplicate time-off requests before creating a new one
            const existing_time_off_requests = await TimeOffRequest.find({
                startDate:{$gte:p_request.body.startDate},
                endDate:{$lte:p_request.body.endDate},
                name:p_request.body.name,
                deleted:false,
            });

            if(existing_time_off_requests.length > 0 && p_request.body.ignoreDuplicates !== true){
                //this might be a potential duplicate time-off request
                p_response.send({
                    result:'found_duplicates',
                    timeOffRequest:new_time_off_request,
                    existingTimeOffRequests:existing_time_off_requests,
                    message:'found the following time-off requests with the same name in the specified date range'
                });
            }
            else{
                //either there was no existing time-off requests, or the ignoreDuplicates flag is set
                new_time_off_request = await new_time_off_request.save();
                p_response.send({
                    result:'successful',
                    timeOffRequest:new_time_off_request,
                });
            }
        }
        catch(e){
            p_response.send({
                result:'error_occured',
                message:`${e.name} - ${e.message}`,
                timeOffRequest:new_time_off_request,
            });
        }
    }
    else {
        p_response.sendStatus(process.env.API_REJECTION_CODE);
    }

});

//handle update route
router.put('/', async (p_request, p_response) => {
    //check for the API_KEY in the headers first
    if(p_request.get(process.env.API_KEY_HEADER_NAME).toUpperCase() === process.env.API_KEY.toUpperCase()){
        //API_KEY is authenticated

        if(p_request.body.id){
            //object id is specified, build update query
            const update_query = {};
            if(p_request.body.startDate){
                update_query.startDate = p_request.body.startDate;
            }
            if(p_request.body.endDate){
                update_query.endDate = p_request.body.endDate;
            }
            if(p_request.body.name){
                update_query.name = p_request.body.name;
            }
            if(p_request.body.details){
                update_query.details = p_request.body.details;
            }
            else if(p_request.body.hasOwnProperty('details')){
                update_query.$unset = {details:''};
            }

            if(p_request.body.status){
                update_query.status = p_request.body.status;
            }
            if(p_request.body.hasOwnProperty('deleted')){
                update_query.deleted = p_request.body.deleted;
            }

            //attempt to update the specified document id
            try{
                //note: this function has limited validation support, use .save() for full validation support
                await TimeOffRequest.findByIdAndUpdate(p_request.body.id, update_query, {runValidators:true});
                p_response.send({
                    result:'successful'
                });
            }
            catch(e){
                p_response.send({
                    result:'error_occured',
                    message:e.message
                });
            }
        }
        else{
            //object id is not specified, updating requires an object id
            p_response.send({
                result:'error_occured',
                message:'time-off request document id was not specified in the request'
            });
        }
    }
    else {
        p_response.sendStatus(process.env.API_REJECTION_CODE);
    }

});

//handle delete route
router.delete('/', async (p_request, p_response) => {
    //check for the API_KEY in the headers first
    if(p_request.get(process.env.API_KEY_HEADER_NAME).toUpperCase() === process.env.API_KEY.toUpperCase()){

        try{
            if(p_request.body.ids && p_request.body.ids.length > 0){
                //there is an array of object ids to delete and the array is not empty

                //now we check if the client specified the `permanent` flag to decide whether or not to permanently delete this time-off request or just set the `deleted` property in the data model.
                if(p_request.body.permanent){
                    //flag was set to true, therefore do a destructive delete
                    await TimeOffRequest.deleteMany({
                        _id:{
                            $in:p_request.body.ids
                        }
                    });

                    //return a response
                    p_response.send({
                        result:'successful',
                        message:'the specified time-off requests were PERMANENTLY deleted from this database'
                    });
                }
                else{
                    //flag was unset, do a soft delete

                    await TimeOffRequest.updateMany({
                        _id:{
                            $in:p_request.body.ids,
                        },
                    }, { deleted : true });

                    //return a response
                    p_response.send({
                        result:'successful',
                        message:'the specified time-off requests were deleted from this database'
                    });
                }
            }
            else{
                //ids doesn't exist in the request body, or the ids array is empty
                p_response.send({
                    result:'error_occured',
                    message:'the delete request was empty or invalid'
                });
            }
        }
        catch(e){
            p_response.send({
                result:'error_occured',
                message:`${e.name} - ${e.message}`
            });
        }

    }
    else {
        p_response.sendStatus(process.env.API_REJECTION_CODE);
    }

});

//export the router
module.exports = router;