/* eslint-disable camelcase */
const Industry = require('../models/industries.model');
const APIFeatures = require('../utils/api-features.utils');
const AppError = require('../utils/app-error.utils');
const catchAsync = require('../utils/catchasync.utlils');
const messageController = require('../controllers/message.controller');

exports.getAllIndustries = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Industry.find().populate('addedBy', 'name'), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const industries = await features.query;

  res.status(200).json({
    message: 'success',
    results: industries.length,
    data: {
      industries,
    },
  });
});


exports.addIndustries = catchAsync(async (req, res, next) => {

  try
  {
    const { name, name_ar, added_by} = req.body;
    if (!name || !name_ar || !added_by) {
      return next(new AppError(await messageController.getMessage('MSG1051',req.headers['accept-language']), 400));
    }
  
    const newIndustry = await Industry.create({
      name,
      name_ar,
      addedBy:added_by
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


exports.updateIndustry = catchAsync(async (req, res, next) => {

  try
  {
    const IndustryDetails = await Industry.findById(req.params.industry);
    const { name, active, name_ar, access_to} = req.body;
    //console.log(location);
    if (!IndustryDetails || !name ||  !name_ar ) {
      return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
    }

    const updatedIndustry = await Industry.findByIdAndUpdate(
      IndustryDetails._id,
      { $set: { name: name,access_to: access_to,active:active,name_ar:name_ar} }, { new: true }
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


