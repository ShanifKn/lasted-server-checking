/* eslint-disable camelcase */
const APIFeatures = require('../utils/api-features.utils');
const catchAsync = require('../utils/catchasync.utlils');
const Batch = require('../models/batch.model');

exports.createBatch = catchAsync(async (req, res, next) => {
  const { seeker, company, date } =
    req.body;
  const newBatch = await Batch.create({
    seeker,
    company,
    date
  });
  res.status(201).json({
    message: 'success',
    data: {
    },
  });
});

