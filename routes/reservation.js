//import express
const express = require('express');

//import models
const Reservation = require('../models/reservation');

//retreive the router from the express app
const router = express.Router();

//handle the read route
router.get('/', async (p_request, p_response) => {
    if(p_request.get(process.env.API_KEY_HEADER_NAME) === process.env.API_KEY){
        //API_KEY_HEADER_NAME = the name of the HTTP Header containing the API_KEY
        try{
            if(p_request.query.id){
                //reservation document id is specified, return this specific document then
                const reservation = await Reservation.findById(p_request.query.id);

                if(reservation){
                    p_response.send({
                        result:'successful',
                        reservation:reservation
                    });
                }
                else{
                    p_response.send({
                        result:'not_found',
                        message:`unable to find a reservation with this id ${p_request.query.id}`
                    });
                }
            }
            else{
                //reservation document id is not specified, build a search query
                const search_query = {};
                if(p_request.query.startDate){
                    if(p_request.query.endDate){
                        //do a range search if start and end is defined
                        search_query.date = {
                            $gte:p_request.query.startDate,
                            $lte:p_request.query.endDate
                        };
                    }
                    else{
                        //otherwise just search for the start date
                        search_query.date = p_request.query.startDate;
                    }
                }
                if(p_request.query.startTime){
                    if(p_request.query.endTime){
                        //do a range search if start and end is defined
                        search_query.time = {
                            $gte:p_request.query.startTime,
                            $lte:p_request.query.endTime
                        };
                    }
                    else{
                        //otherwise just search for the start time
                        search_query.time = p_request.query.startTime;
                    }
                }
                if(p_request.query.seats){
                    search_query.seats = p_request.query.seats;
                }
                if(p_request.query.firstName){
                    search_query.firstName = new RegExp(p_request.query.firstName, 'i');
                }
                if(p_request.query.lastName){
                    search_query.lastName = new RegExp(p_request.query.lastName, 'i');
                }
                if(p_request.query.phoneNumber){
                    //note: omit the + sign during querying, since it doesn't get recognized without an escape character
                    search_query.phoneNumber = p_request.query.phoneNumber;
                }
                if(p_request.query.tags){
                    search_query.tags = {
                        //convert string csv to array
                        $all:p_request.query.tags.split(',')
                    };
                }
                if(p_request.query.includeDeleted === false || p_request.query.includeDeleted === undefined){
                    //do not include deleted reservations, or the specifier wasn't defined, we will not include delted reservations by default
                    search_query.deleted = false; //only search reservations that aren't deleted
                }

                //p_response.send(search_query);
                if(Object.keys(search_query).length > 0){
                    //there is a search query provided, run the search query
                    const matching_reservations = await Reservation.find(search_query);

                    if(matching_reservations.length > 0){
                        p_response.send({
                            result:'successful',
                            reservations:matching_reservations,
                            message:'found results matching search query'
                        });
                    }
                    else{
                        //matching_reservations is empty
                        p_response.send({
                            result:'not_found',
                            message:`unable to find any reservations with this search query \n${JSON.stringify(search_query)}`
                        });
                    }
                }
                else{
                    //there isn't a search query provided, so attempt to return all reservations
                    const all_reservations = await Reservation.find({});
                    p_response.send({
                        result:'successful',
                        reservations:all_reservations,
                        message:'no search query provided, returning all reservations'
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
    if(p_request.get(process.env.API_KEY_HEADER_NAME) === process.env.API_KEY){
        //create a new reservation object
        let new_reservation = new Reservation({
            date:p_request.body.date,
            time:p_request.body.time,
            seats:p_request.body.seats,
            firstName:p_request.body.firstName,
            lastName:p_request.body.lastName,
            phoneNumber:p_request.body.phoneNumber,
            deleted:false,
        });

        //populate optional fields if they exist
        if(p_request.body.tags && p_request.body.tags.length > 0){
            new_reservation.tags = p_request.body.tags;
        }
        if(p_request.body.notes && p_request.body.notes.length > 0){
            new_reservation.notes = p_request.body.notes;
        }
        if(p_request.body.status && p_request.body.status.length > 0){
            new_reservation.status = p_request.body.status;
        }

        //try to create the reservation in mongodb
        try{
            //check if there are duplicate reservations before creating a new one
            const existing_reservations = await Reservation.find({
                date:p_request.body.date,
                $or:[
                    {
                        phoneNumber:p_request.body.phoneNumber
                    },
                    {
                        firstName:p_request.body.firstName,
                        lastName:p_request.body.lastName
                    }
                ],
                deleted:false,
            });

            if(existing_reservations.length > 0 && p_request.body.ignoreDuplicates !== true){
                //this might be a potential duplicate reservation
                p_response.send({
                    result:'found_duplicates',
                    reservation:new_reservation,
                    existingReservations:existing_reservations,
                    message:'found the following reservations on the same date with either the same phoneNumber or firstName and lastName'
                });
            }
            else{
                //either there was no existing reservations, or the ignoreDuplicates flag is set
                new_reservation = await new_reservation.save();
                p_response.send({
                    result:'successful',
                    reservation:new_reservation,
                });
            }
        }
        catch(e){
            p_response.send({
                result:'error_occured',
                message:`${e.name} - ${e.message}`,
                reservation:new_reservation,
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
    if(p_request.get(process.env.API_KEY_HEADER_NAME) === process.env.API_KEY){
        if(p_request.body.id){
            //object id is specified, build update query
            const update_query = {};
            if(p_request.body.date){
                update_query.date = p_request.body.date;
            }
            if(p_request.body.time){
                update_query.time = p_request.body.time;
            }
            if(p_request.body.seats){
                update_query.seats = p_request.body.seats;
            }
            if(p_request.body.firstName){
                update_query.firstName = p_request.body.firstName;
            }
            if(p_request.body.lastName){
                update_query.lastName = p_request.body.lastName;
            }
            if(p_request.body.phoneNumber){
                update_query.phoneNumber = p_request.body.phoneNumber;
            }
            if(p_request.body.notes){
                update_query.notes = p_request.body.notes;
            }
            else if(p_request.body.hasOwnProperty('notes')){
                update_query.$unset = {notes:''};
            }

            if(p_request.body.tags){
                update_query.tags = p_request.body.tags;
            }
            if(p_request.body.status){
                update_query.status = p_request.body.status;
            }
            if(p_request.body.deleted){
                update_query.deleted = p_request.body.deleted;
            }

            //attempt to update the specified document id
            try{
                //note: this function has limited validation support, use .save() for full validation support
                await Reservation.findByIdAndUpdate(p_request.body.id, update_query, {runValidators:true});
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
                message:'reservation document id was not specified in the request'
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
    if(p_request.get(process.env.API_KEY_HEADER_NAME) === process.env.API_KEY){

        try{
            if(p_request.body.ids && p_request.body.ids.length > 0){
                //there is an array of object ids to delete and the array is not empty

                //now we check if the client specified the `permanent` flag to decide whether or not to permanently delete this reservation or just set the `deleted` property in the data model.
                if(p_request.body.permanent){
                    //flag was set to true, therefore do a destructive delete
                    await Reservation.deleteMany({
                        _id:{
                            $in:p_request.body.ids
                        }
                    });

                    //return a response
                    p_response.send({
                        result:'successful',
                        message:'the specified reservations were PERMANENTLY deleted from this database'
                    });
                }
                else{
                    //flag was unset, do a soft delete

                    await Reservation.updateMany({
                        _id:{
                            $in:p_request.body.ids,
                        },
                    }, { deleted : true });

                    //return a response
                    p_response.send({
                        result:'successful',
                        message:'the specified reservations were deleted from this database'
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