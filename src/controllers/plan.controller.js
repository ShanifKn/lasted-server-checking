const Plan = require('../models/plan.model');
const APIFeatures = require('../utils/api-features.utils');
const AppError = require('../utils/app-error.utils');
const catchAsync = require('../utils/catchasync.utlils');
const messageController = require('../controllers/message.controller');

exports.getAllPlans = catchAsync(async (req, res, next) => {
  const { country } = req.params;
  const features = new APIFeatures(Plan.find({ iso: country }).populate('addedBy', 'name'), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const allPlans = await features.query;

  res.status(200).json({
    message: 'success',
    results: allPlans.length,
    data: {
      allPlans,
    },
  });
});


exports.addPlan = catchAsync(async (req, res, next) => {
  try
  {
    const { name, name_ar,type,description, color_card,color_button,iso,amount,total_limit,quota_limit,paymentMode} = req.body;
    if(type=="Live")
    {
      if(!amount)
      {
        return next(new AppError(await messageController.getMessage('MSG1057',req.headers['accept-language']), 400));
      }
    }

    if (!name || !name_ar || !type || !description || !iso || !total_limit || !quota_limit || !paymentMode) {
      return next(new AppError(await messageController.getMessage('MSG1051',req.headers['accept-language']), 400));
    }
  
    const newPlan = await Plan.create({
      name,
      name_ar,
      type,
      description,
      iso,
      amount,
      total_limit,
      quota_limit,
      addedBy:req.staff.id,
      paymentMode
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


exports.updatePlan = catchAsync(async (req, res, next) => {

  try
  {
    const planDetails = await Plan.findById(req.params.plan);
    const { name, name_ar,type,description, color_card,color_button,amount,total_limit,quota_limit,paymentMode,active} = req.body;
    // console.log(planDetails,"!planDetails");
    //console.log(req.body,"!name || !name_ar || !type || !description  || !amount || !total_limit || !quota_limit || !paymentMode");
    if (!planDetails || !name || !name_ar || !type || !description  || !amount || !total_limit || !quota_limit || !paymentMode) {
      return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
    }

    const updatedPlan = await Plan.findByIdAndUpdate(
      planDetails._id,
      { $set: { name: name, name_ar:name_ar, type:type, description:description, color_card:color_card, color_button:color_button, amount:amount, total_limit:total_limit, quota_limit:quota_limit, paymentMode:paymentMode,active:active  } }, { new: true }
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