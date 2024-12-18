const APIFeatures = require('../utils/api-features.utils');
const catchAsync = require('../utils/catchasync.utlils');
const AppError = require('../utils/app-error.utils');
const Skill = require('../models/skill.model');
const messageController = require('../controllers/message.controller');

exports.getAllSkills = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Skill.find(), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const skills = await features.query;

  res.status(200).json({
    message: 'success',
    results: skills.length,
    data: {
      skills,
    },
  });
});

exports.addSkill = catchAsync(async (req, res, next) => {
  try {
    const { name, name_ar } = req.body;
    if (!name || !name_ar) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1051',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }

    const newSkill = await Skill.create({
      name,
      name_ar,
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully created',
    });
  } catch (err) {
    console.log(err);
  }
});

exports.updateSkill = catchAsync(async (req, res, next) => {
  try {
    const skillDetails = await Skill.findById(req.params.skill);
    const { name, name_ar, active } = req.body;
    if (!skillDetails || !name || !name_ar ) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1054',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }

    const updatedSkill = await Skill.findByIdAndUpdate(
      skillDetails._id,
      { $set: { name: name, name_ar: name_ar, active: active } },
      { new: true },
    );

    res.status(201).json({
      status: 'success',
      message: 'Successfully updated',
    });
  } catch (err) {
    console.log(err);
  }
});
