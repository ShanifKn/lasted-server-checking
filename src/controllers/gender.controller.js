const APIFeatures = require('../utils/api-features.utils');
const catchAsync = require('../utils/catchasync.utlils');
const AppError = require('../utils/app-error.utils');
const Gender = require('../models/gender.model');
const messageController = require('../controllers/message.controller');

exports.getGenders = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Gender.find(), req.query)
      .filter()
      .sort()
      .fields()
      .paginate();
  
    const genders = await features.query;
  
    res.status(200).json({
      message: 'success',
      results: genders.length,
      data: {
        genders,
      },
    });
  });

