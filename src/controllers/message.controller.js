/* eslint-disable camelcase */
const APIFeatures = require('../utils/api-features.utils');
const catchAsync = require('../utils/catchasync.utlils');
const Message = require('../models/message.model');
const messageController = require('../controllers/message.controller');
const AppError = require('../utils/app-error.utils');

exports.createMessage = catchAsync(async (req, res, next) => {
  const { code, msg_en, msg_ar } = req.body;
    if (!code || !msg_en || !msg_ar) {
        return next(new AppError(await messageController.getMessage('MSG1051',req.headers['accept-language']), 400));
    }
    const newMessage = await Message.create({
    code,
    msg_en,
    msg_ar,
    addedBy:req.staff.id,
  });
  res.status(201).json({
    message: 'success',
    data: {
        newMessage,
    },
  });
});

exports.getAllMessages = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Message.find(), req.query)
      .filter()
      .sort()
      .fields()
      .paginate();
  
    const allMessages = await features.query;
  
    res.status(200).json({
      message: 'success',
      results: allMessages.length,
      data: {
        allMessages,
      },
    });
});


exports.updateMessage = catchAsync(async (req, res, next) => {

    try
    {
      const messageDetails = await Message.findById(req.params.message);
      const { msg_en, msg_ar} = req.body;
      if (!messageDetails || !msg_en || !msg_ar ) {
        return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
      }
  
      const updatedMessage = await Message.findByIdAndUpdate(
        messageDetails._id,
        { $set: { msg_en: msg_en, msg_ar:msg_ar} }, { new: true }
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

exports.getMessage= async (msgCode,lang)=>
{
    const msg = await Message.find({code:msgCode});
    let res;
    if(lang =='ar')
    {
        res = msg[0].msg_ar;
    }
    else
    {
        res = msg[0].msg_en;
    }
    return res;
}

