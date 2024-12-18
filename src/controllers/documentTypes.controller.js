/* eslint-disable camelcase */
const DocumentTypes = require('../models/documentType.model');
const APIFeatures = require('../utils/api-features.utils');
const AppError = require('../utils/app-error.utils');
const catchAsync = require('../utils/catchasync.utlils');
const messageController = require('./message.controller');

exports.getAllDocTypes = catchAsync(async (req, res, next) => {
  const sortOptions = { staffid: -1 };
  const features = new APIFeatures(DocumentTypes.find(), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const docTypes = await features.query;
  
  res.status(200).json({
    message: 'success',
    results: docTypes.length,
    data: {
      docTypes,
    },
  });
});


exports.updateDocType = catchAsync(async (req, res, next) => {

  try
  {
    const DocTypesDetails = await DocumentTypes.findById(req.params.docType);
    const { name, sizeLimitKB} = req.body;
    //console.log(location);
    if (!DocTypesDetails || !name ||  !sizeLimitKB) {
      return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
    }

    const updatedDoctype = await DocumentTypes.findByIdAndUpdate(
      DocTypesDetails._id,
      { $set: { name: name,sizeLimitKB:sizeLimitKB} }, { new: true }
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


