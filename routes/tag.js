//import express
const express = require('express');

//import models
const Tag = require('../models/tag');

//retreive the router from the express app
const router = express.Router();

//handle the read route
router.get('/', async (p_request, p_response) => {
    //check for the API_KEY in the headers first
    if(p_request.get(process.env.API_KEY_HEADER_NAME) === process.env.API_KEY){
        try{
            if(p_request.query.id){
                //tag document id is specified, return this specific document then
                const tag = await Tag.findById(p_request.query.id);

                if(tag){
                    p_response.send({
                        result:'successful',
                        tag:tag
                    });
                }
                else{
                    p_response.send({
                        result:'not_found',
                        message:`unable to find a tag with this id ${p_request.query.id}`
                    });
                }
            }
            else{
                //reservation document id is not specified, build a search query
                const search_query = {};
                if(p_request.query.name){
                    //client specified a /?name=XXXX/
                    search_query.name = new RegExp(p_request.query.name, 'i');
                }
                if(p_request.query.color){
                    //client specified a /?color=ffffffff/
                    search_query.name = new RegExp(p_request.query.color, 'i');
                }

                if(Object.keys(search_query).length > 0){
                    //there is a search query provided, run the search query
                    const matching_tags = await Tag.find(search_query);

                    if(matching_tags.length > 0){
                        p_response.send({
                            result:'successful',
                            tags:matching_tags,
                            message:'found results matching search query'
                        });
                    }
                    else{
                        //matching_reservations is empty
                        p_response.send({
                            result:'not_found',
                            message:`unable to find any tags with this search query \n${JSON.stringify(search_query)}`
                        });
                    }
                }
                else{
                    //there isn't a search query provided, so attempt to return all tags
                    //todo: implement a secret to prevent unauthorized access
                    const all_tags = await Tag.find({});
                    p_response.send({
                        result:'successful',
                        tags:all_tags,
                        message:'no search query provided, returning all tags'
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
        p_response.sendStatus(process.env.API_KEY_REJECTION_RESPONSE_CODE);
    }

});

//handle create route
router.post('/', async (p_request, p_response) => {
    //check for the API_KEY in the headers first
    if(p_request.get(process.env.API_KEY_HEADER_NAME) === process.env.API_KEY){
        //create a new tag object
        let new_tag = new Tag({
            name:p_request.body.name,
            color:p_request.body.color
        });

        //try to create the tag in mongodb
        try{
            //check if there are duplicate tags before creating a new one
            const existing_tags = await Tag.find({
                name:p_request.body.name
            });

            if(existing_tags.length > 0 && p_request.body.ignoreDuplicates !== true){
                //this might be a potential duplicate reservation
                p_response.send({
                    result:'found_duplicates',
                    tag:new_tag,
                    existingTags:existing_tags,
                    message:'found the following tags with the same name'
                });
            }
            else{
                //either there was no existing tags, or the ignoreDuplicates flag is set
                new_tag = await new_tag.save();
                p_response.send({
                    result:'successful',
                    tag:new_tag,
                });
            }
        }
        catch(e){
            p_response.send({
                result:'error_occured',
                message:`${e.name} - ${e.message}`,
                tag:new_tag,
            });
        }
    }
    else {
        p_response.sendStatus(process.env.API_KEY_REJECTION_RESPONSE_CODE);
    }

});

//handle update route
router.put('/', async (p_request, p_response) => {
    //check for the API_KEY in the headers first
    if(p_request.get(process.env.API_KEY_HEADER_NAME) === process.env.API_KEY){
        if(p_request.body.id){
            //object id is specified, build update query
            const update_query = {};
            if(p_request.body.name){
                update_query.name = p_request.body.name;
            }
            if(p_request.body.color){
                update_query.color = p_request.body.color;
            }

            //attempt to update the specified document id
            try{
                //note: this function has limited validation support, use .save() for full validation support
                await Tag.findByIdAndUpdate(p_request.body.id, update_query, {runValidators:true});
                p_response.send({
                    result:'successful'
                });

                // //find the document id to update
                // let reservation = await Reservation.findById(p_request.body.id);

                // //update the reservation
                // if(p_request.body.date){
                //     reservation.date = p_request.body.date;
                // }
                // if(p_request.body.time){
                //     reservation.time = p_request.body.time;
                // }
                // if(p_request.body.seats){
                //     reservation.seats = p_request.body.seats;
                // }
                // if(p_request.body.firstName){
                //     reservation.firstName = p_request.body.firstName;
                // }
                // if(p_request.body.lastName){
                //     reservation.lastName = p_request.body.lastName;
                // }
                // if(p_request.body.phoneNumber){
                //     reservation.phoneNumber = p_request.body.phoneNumber;
                // }
                // if(p_request.body.notes){
                //     reservation.notes = p_request.body.notes;
                // }
                // if(p_request.body.tags){
                //     reservation.tags = p_request.body.tags;
                // }

                // //check for duplicates, same date & time with either the same phone number or name
                // const existing_reservations = await Reservation.find({
                //     date:p_request.body.date,
                //     time:p_request.body.time,
                //     $or:[
                //         {
                //             phoneNumber:p_request.body.phoneNumber
                //         },
                //         {
                //             firstName:p_request.body.firstName,
                //             lastName:p_request.body.lastName
                //         }
                //     ]
                // });

                // if(existing_reservations.length > 0 && p_request.body.ignoreDuplicates !== true){
                //     //this might be a potential duplicate reservation
                //     p_response.send({
                //         result:'found_duplicates',
                //         existingReservations:existing_reservations,
                //         message:'found the following reservations on the same date and time with either the same phoneNumber or firstName and lastName'
                //     });
                // }
                // else{
                //     //either there was no existing reservations, or the ignoreDuplicates flag is set
                //     reservation = await reservation.save();
                //     p_response.send({
                //         result:'successful',
                //         reservation:reservation,
                //     });
                // }
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
                message:'tag document id was not specified in the request'
            });
        }
    }
    else {
        p_response.sendStatus(process.env.API_KEY_REJECTION_RESPONSE_CODE);
    }

});

//handle delete route
router.delete('/', async (p_request, p_response) => {
    //check for the API_KEY in the headers first
    if(p_request.get(process.env.API_KEY_HEADER_NAME) === process.env.API_KEY){
        try{
            if(p_request.body.ids && p_request.body.ids.length > 0){
                //there is an array of object ids to delete and the array is not empty
                await Tag.deleteMany({
                    _id:{
                        $in:p_request.body.ids
                    }
                });
                p_response.send({
                    result:'successful'
                });
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
        p_response.sendStatus(process.env.API_KEY_REJECTION_RESPONSE_CODE);
    }

});

//export the router
module.exports = router;