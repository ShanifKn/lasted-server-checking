const Category = require('../models/category.model');
const APIFeatures = require('../utils/api-features.utils');
const AppError = require('../utils/app-error.utils');
const catchAsync = require('../utils/catchasync.utlils');
const messageController = require('../controllers/message.controller');

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Category.find(), req.query)
    .filter()
    .fields()
    .sort();

  const allCategories = await features.query;

  res.status(200).json({
    status: 'success',
    results: allCategories.length,
    data: {
      categories: allCategories,
    },
  });
});


exports.updateCategory = catchAsync(async (req, res, next) => {

  try
  {
    const categoryDetails = await Category.findById(req.params.category);
    const { priority_perc} = req.body;
    if (!categoryDetails || !priority_perc) {
      return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryDetails._id,
      { $set: { priority_perc: priority_perc} }, { new: true }
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

exports.updateCategoryValues = catchAsync(async (req, res, next) => {
  
  const { high,low,medium } = req.body;
  if (!high || !low || !medium) {
    return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
  }

  const highData = await Category.findOne({ name: "High" }, { _id: 1 });
  const lowData = await Category.findOne({ name: "Low" }, { _id: 1 });
  const mediumData = await Category.findOne({ name: "Medium" }, { _id: 1 });
  if(!highData || !lowData || !mediumData)
  {
    return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
  }
  const updatedHCategory = await Category.findByIdAndUpdate(
    highData._id,
    { $set: { priority_perc: high} }, { new: true }
  );
  const updatedLCategory = await Category.findByIdAndUpdate(
    lowData._id,
    { $set: { priority_perc: low} }, { new: true }
  );
  const updatedMCategory = await Category.findByIdAndUpdate(
    mediumData._id,
    { $set: { priority_perc: medium} }, { new: true }
  );
  
  res.status(201).json({
    status: 'success',
    message:'Successfully updated'
  });

});
