/* eslint-disable camelcase */
const APIFeatures = require('../utils/api-features.utils');
const catchAsync = require('../utils/catchasync.utlils');
const CronJob = require('../models/cronjob.model');
const Batch = require('../models/batch.model');
const RabbitMQ = require('../utils/rabbit');
const messageController = require('../controllers/message.controller');
const AppError = require('../utils/app-error.utils');

exports.getAllCronjobs = catchAsync(async (req, res, next) => {

    const features = new APIFeatures(CronJob.find(), req.query)
      .filter()
      .fields()
      .paginate()
      .sort();
  
    const allCronjobs = await features.query;
  
    res.status(200).json({
      status: 'success',
      results: allCronjobs.length,
      data: {
        cronjobs: allCronjobs,
      },
    });
});

exports.addCronjob = catchAsync(async (req, res, next) => {
    try
    {
        
      const { timestart, timeend,daysexception,description, bufferduration,name,poolnames,buffercount,active} = req.body;

      if (!timestart || !name ) {
        return next(new AppError(await messageController.getMessage('MSG1051',req.headers['accept-language']), 400));
      }
    
      const newCronJob = await CronJob.create({
        timestart,
        timeend,
        daysexception,
        description,
        bufferduration,
        buffercount,
        name,
        poolnames,
        active
      });
      
      res.status(200).json({
        status: 'success',
        message:'Successfully created'
      });
    }
    catch(err)
    {
      console.log(err);
    }
    
});

exports.updateCronJob = catchAsync(async (req, res, next) => {

    try
    {
      const cronjobDetails = await CronJob.findById(req.params.cronjob);
      const { timestart, timeend,daysexception,description, bufferduration,name,poolnames,buffercount,active} = req.body;
      if (!cronjobDetails || !timestart  || !description  || !name  ) {
        return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
      }
  
      const updatedCronjob = await CronJob.findByIdAndUpdate(
        cronjobDetails._id,
        { $set: { timestart: timestart, timeend:timeend, daysexception:daysexception, description:description, bufferduration:bufferduration, name:name, poolnames:poolnames,buffercount:buffercount,active:active} }, { new: true }
      );
      
        res.status(201).json({
          status: 'success',
          message:'Successfully updated'
        });
    }
    catch(err)
    {
      console.log(err);
    }
    
});

exports.sendEmailFromBatch =async()=>{
    try 
    {
      
      const batch = await Batch.find({});
      let batchArr =[];
      batch.forEach(ele => {
        batchArr.push({id:ele._id,company:ele.company,seeker:ele.seeker,plan:ele.plan,iso:ele.iso});
      });
      await RabbitMQ.enqueueEmailBatch(batch).then(() => {
      }).catch(err => {
          console.error('Failed to enqueue emails:', err);
      });

      return true;
      
    } catch (error) {
      return null;
  }
  };
  


