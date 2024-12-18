const APIFeatures = require('../utils/api-features.utils');
const catchAsync = require('../utils/catchasync.utlils');
const Notification = require('../models/notification.model');
const { ObjectId } = require('mongodb');

exports.sendNotification = catchAsync(async (req, res, next) => {
    
    if(req.batchSend ===false)
    {
        const designation = new ObjectId('657b481afb2b874870b61b05');
        const name="Pending activation";
        const message ="Seeker "+req.seeker + " Activation is pending due to insufficient count of generated emails - Required is "+   req.requiredEmail + " and Available is " + req.generatedEmail;
        const type ="admin";
        const priority ="high";
        const active = true;
        //const read = [{'staff':new ObjectId('64e64c3d94730000d30039d0')}];
        const read = [];
        const newNotification = await Notification.create({
        name,
        message,
        priority,
        designation,
        type,
        active,
        read
    });
    }
    return true;
   
});
