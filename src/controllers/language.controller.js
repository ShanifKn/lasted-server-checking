const APIFeatures = require('../utils/api-features.utils');
const catchAsync = require('../utils/catchasync.utlils');
const AppError = require('../utils/app-error.utils');
const Language = require('../models/language.model');
const messageController = require('../controllers/message.controller');

exports.getAllLanguages = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Language.find(), req.query)
      .filter()
      .sort()
      .fields()
      .paginate();
  
    const languages = await features.query;
  
    res.status(200).json({
      message: 'success',
      results: languages.length,
      data: {
        languages,
      },
    });
  });

exports.addLanguage = catchAsync(async (req, res, next) => {
    try
    {
      const { name, name_ar} = req.body;
      if (!name || !name_ar) {
        return next(new AppError(await messageController.getMessage('MSG1051',req.headers['accept-language']), 400));
      }
     
      const newSkill = await Language.create({
        name,
        name_ar
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


  exports.updateLangauge = catchAsync(async (req, res, next) => {

    try
    {
      const languageDetails = await Language.findById(req.params.language);
      const { name, name_ar,active} = req.body;
      if (!languageDetails || !name || !name_ar) {
        return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
      }
  
      const updatedLanguage = await Language.findByIdAndUpdate(
        languageDetails._id,
        { $set: { name: name, name_ar:name_ar, active:active} }, { new: true }
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