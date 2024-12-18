const APIFeatures = require('../utils/api-features.utils');
const catchAsync = require('../utils/catchasync.utlils');
const AppError = require('../utils/app-error.utils');
const Menu = require('../models/menus.model');
const messageController = require('../controllers/message.controller');

exports.getAllMenus = catchAsync(async (req, res, next) => {
  const { page, limit} = req.query;
    const features = new APIFeatures(Menu.find(), req.query)
      .filter()
      .sort()
      .fields()
      .paginate(page,limit);
  
    const menus = await features.query;
    let query = {};
    const menusCount = await Menu.countDocuments(query);
    res.status(200).json({
      message: 'success',
      total: menusCount,
      results: menus.length,
      data: {
        menus,
      },
    });
  });


  exports.updateMenu = catchAsync(async (req, res, next) => {

    try
    {
      const menuDetails = await Menu.findById(req.params.menu);
   
      const {description,display_name} = req.body;
   
      if (!menuDetails || !description || !display_name) {
        return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
      }
  
      const updatedMenu = await Menu.findByIdAndUpdate(
        menuDetails._id,
        { $set: { description: description, display_name:display_name} }, { new: true }
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