/* eslint-disable camelcase */
const VisaTypes = require('../models/visa.model');
const APIFeatures = require('../utils/api-features.utils');
const AppError = require('../utils/app-error.utils');
const catchAsync = require('../utils/catchasync.utlils');
const messageController = require('../controllers/message.controller');

exports.getAllVisaTypes = catchAsync(async (req, res, next) => {
    const { country } = req.params;
  const features = new APIFeatures(VisaTypes.find({iso:country}).populate('addedBy', 'name'), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const visaTypes = await features.query;

  res.status(200).json({
    message: 'success',
    results: visaTypes.length,
    data: {
        visaTypes,
    },
  });
});


exports.addVisaType = catchAsync(async (req, res, next) => {

  try
  {
    const { name, name_ar,added_by,iso} = req.body;
    if (!name || !name_ar || !added_by || !iso) {
      return next(new AppError(await messageController.getMessage('MSG1051',req.headers['accept-language']), 400));
    }
  
    const newVisaType = await VisaTypes.create({
      name,
      name_ar,
      iso,
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


exports.updateVisaType = catchAsync(async (req, res, next) => {

  try
  {
    const VisaTypesDetails = await VisaTypes.findById(req.params.visaType);
    const { name, active, name_ar, iso} = req.body;
    //console.log(location);
    if (!VisaTypesDetails || !name ||  !name_ar || !iso) {
      return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
    }

    const updatedVisatype = await VisaTypes.findByIdAndUpdate(
        VisaTypesDetails._id,
      { $set: { name: name,active:active,name_ar:name_ar,iso:iso} }, { new: true }
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


