const APIFeatures = require('../utils/api-features.utils');
const catchAsync = require('../utils/catchasync.utlils');
const AppError = require('../utils/app-error.utils');
const Country = require('../models/country.model');
const messageController = require('../controllers/message.controller');

exports.getAllApplyCountries = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Country.find({ apply_country: true }),
    req.query,
  )
    .filter()
    .sort()
    .fields();

  const applyCountries = await features.query;

  res.status(200).json({
    status: 'success',
    data: {
      countries: applyCountries,
    },
  });
});

exports.getAllCountries = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Country.find({ active: true }), req.query)
    .filter()
    .sort()
    .fields();

  const allCountries = await features.query;

  res.status(200).json({
    status: 'success',
    data: {
      countries: allCountries,
    },
  });
});

exports.addCountry = catchAsync(async (req, res, next) => {
  try {
    const { iso, iso3, nicename, nicename_ar, numcode, phonecode, currency } =
      req.body;
    if (
      !iso ||
      !iso3 ||
      !nicename ||
      !nicename_ar ||
      !numcode ||
      !phonecode ||
      !currency
    ) {
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

    const newCountry = await Country.create({
      iso,
      iso3,
      nicename,
      nicename_ar,
      numcode,
      phonecode,
      currency,
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully created',
    });
  } catch (err) {
    console.log(err);
  }
});

exports.updateCountry = catchAsync(async (req, res, next) => {
  try {
    const countryDetails = await Country.findById(req.params.country);
    const {
      iso,
      iso3,
      nicename,
      nicename_ar,
      numcode,
      phonecode,
      currency,
      apply_country,
      colname,
      active,
    } = req.body;
    if (!countryDetails) {
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

    let obj = {
      iso: iso,
      iso3: iso3,
      nicename: nicename,
      nicename_ar: nicename_ar,
      numcode: numcode,
      phonecode: phonecode,
      currency: currency,
      apply_country: apply_country,
      active: active,
    };
    if (apply_country) {
      if (!colname) {
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
      obj = {
        iso: iso,
        iso3: iso3,
        nicename: nicename,
        nicename_ar: nicename_ar,
        numcode: numcode,
        phonecode: phonecode,
        currency: currency,
        apply_country: apply_country,
        colname: colname,
        active: active,
      };
    }

    const updatedCountry = await Country.findByIdAndUpdate(
      req.params.country,
      { $set: obj },
      { new: true },
    );

    res.status(201).json({
      status: 'success',
      message: 'Successfully updated',
      data: updatedCountry,
    });
  } catch (err) {
    console.log(err);
  }
});

exports.getCountry = catchAsync(async (req, res, next) => {
  try {
    const countryId = req.params.country;

    if (!countryId) {
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

    const country = await Country.findById(countryId);

    if (!country) {
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
        country,
      },
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
});


