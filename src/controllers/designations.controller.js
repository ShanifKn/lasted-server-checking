const Designation = require('../models/designation.model');
const APIFeatures = require('../utils/api-features.utils');
const AppError = require('../utils/app-error.utils');
const catchAsync = require('../utils/catchasync.utlils');
const messageController = require('../controllers/message.controller');

exports.getAllDesignations = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Designation.find().populate('addedBy', 'name'), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const designations = await features.query;
  res.status(200).json({
    message: 'success',
    results: designations.length,
    data: {
      designations,
    },
  });
});

exports.addDesignation = catchAsync(async (req, res, next) => {
  try
  {
    const { name, name_ar, des, accessType, added_by} = req.body;
    if (!name || !name_ar || !accessType || !added_by) {
      return next(new AppError(await messageController.getMessage('MSG1051',req.headers['accept-language']), 400));
    }
   
    const newDesignation = await Designation.create({
      name,
      name_ar,
      des,
      accessType,
      added_by
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


exports.updateDesignation = catchAsync(async (req, res, next) => {

  try
  {
    
    const designationDetails = await Designation.findById(req.params.designation);
    const { name, active, name_ar, des, accessType} = req.body;
    //console.log(location);
    if (!designationDetails || !name || !des || !active || !name_ar  || !accessType) {
      return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
    }

    const updatedDesignation = await Designation.findByIdAndUpdate(
      designationDetails._id,
      { $set: { name: name,des: des,active:active,name_ar:name_ar,accessType:accessType} }, { new: true }
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




