// const Employer = require('../models/employer.model');
const Seeker = require('../models/staff.model');
const APIFeatures = require('../utils/api-features.utils');
const AppError = require('../utils/app-error.utils');
const catchAsync = require('../utils/catchasync.utlils');
const messageController = require('../controllers/message.controller');

exports.createEmployer = catchAsync(async (req, res, next) => {
  const {
    organizationName,
    organizationType,
    addressLocality,
    addressCountry,
    website,
    socialAccount,
  } = req.body;

  if (
    organizationName ||
    organizationType ||
    addressLocality ||
    addressCountry ||
    website ||
    socialAccount
  ) {
    return next(new AppError(await messageController.getMessage('MSG1057',req.headers['accept-language']), 400));
  }

  //   const newEmployer = await Employer.create({
  //     organizationName,
  //     organizationType,
  //     addressLocality,
  //     addressCountry,
  //     website,
  //     socialAccount,
  //   });
});

exports.getAllSeekers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Seeker.find(), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const allSeekers = await features.query;
  res.status(200).json({
    status: 'success',
    data: {
      seekers: allSeekers,
    },
  });
});
