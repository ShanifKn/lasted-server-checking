const Location = require('../models/location.model');
const APIFeatures = require('../utils/api-features.utils');
const AppError = require('../utils/app-error.utils');
const catchAsync = require('../utils/catchasync.utlils');
const messageController = require('../controllers/message.controller');

exports.getAllLocations = catchAsync(async (req, res, next) => {
  const { country } = req.params;
  const features = new APIFeatures(
    Location.find({ country: country }).populate('addedBy', 'name'),
    req.query,
  )
    .filter()
    .fields()
    .paginate()
    .sort();

  const allLocation = await features.query;

  res.status(200).json({
    status: 'success',
    results: allLocation.length,
    data: {
      locations: allLocation,
    },
  });
});

exports.addLocation = catchAsync(async (req, res, next) => {
  try {
    const { name, name_ar, state, country, added_by } = req.body;
    if (!name || !name_ar || !country || !added_by) {
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

    const newLocation = await Location.create({
      name,
      name_ar,
      state,
      country,
      addedBy:added_by,
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully created',
    });
  } catch (err) {
    console.log(err);
  }
});

exports.updateLocation = catchAsync(async (req, res, next) => {
  try {
    const LocationDetails = await Location.findById(req.params.location);
    const { name, country, active, name_ar, state } = req.body;
    //console.log(location);
    if (!LocationDetails) {
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

    const updatedLocation = await Location.findByIdAndUpdate(
      LocationDetails._id,
      {
        $set: {
          name: name,
          country: country,
          active: active,
          name_ar: name_ar,
          state: state
        },
      },
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

exports.getLocation = catchAsync(async (req, res, next) => {
  console.log('ddd');
  try {
    const locationId = req.params.location;

    if (!locationId) {
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

    const location = await Location.findById(locationId);

    if (!location) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1054',
            req.headers['accept-language'],
          ),
          404,
        ),
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        location,
      },
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
});
