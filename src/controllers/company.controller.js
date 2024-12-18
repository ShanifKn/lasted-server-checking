/* eslint-disable camelcase */
const APIFeatures = require('../utils/api-features.utils');
const AppError = require('../utils/app-error.utils');
const catchAsync = require('../utils/catchasync.utlils');
const {
  CompanyAE,
  CompanyQA,
  CompanySA,
} = require('../models/companies.model');
const emailGeneration = require('../utils/email-generation.util');
const notification = require('./notification.controller');
const Location = require('../models/location.model');
const Country = require('../models/country.model');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const messageController = require('../controllers/message.controller');
const Industry = require('../models/industries.model');
const Category = require('../models/category.model');
const Staff = require('../models/staff.model');

exports.addCompany = catchAsync(async (req, res, next) => {
  try {
    const { email, comp_name, comp_name_ar, industry, location, category } =
      req.body;

    if (!email || !comp_name || !industry || !location || !category) {
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
    const locationData = await Location.findById(location);
    if (!locationData) {
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

    const countryData = await Country.findById(locationData.country);
    if (!countryData.apply_country) {
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

    const companyColName = countryData.colname;
    if (companyColName == '') {
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
    const Company = mongoose.model(companyColName);
    const newCompany = await Company.create({
      email,
      comp_name,
      comp_name_ar,
      industry,
      location,
      category,
      addedBy: req.staff.id,
    });

    res.status(200).json({
      status: 'success',
      data: {},
    });
  } catch (err) {
    console.log(err);
  }
});

exports.updateCompany = catchAsync(async (req, res, next) => {
  try {
    const companyId = req.params.companyId;

    const countryId = req.query.id;

    const {
      comp_name,
      comp_name_ar,
      industry,
      location,
      category,
      active,
      pending,
      inactive_status,
      rejectReason,
    } = req.body;

    const countryData = await Country.findById(countryId);
    
    if (!countryData.apply_country) {
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
    const companyColName = countryData.colname;
    if (!companyColName) {
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
    
    const updateData = {
      comp_name: comp_name,
      comp_name_ar: comp_name_ar,
      industry: industry,
      location: location,
      category: category,
      active: active,
      pending: pending,
    };

    if (inactive_status) {
      const date = new Date();
      updateData.inactive_status = {
        status: 0,
        reason: rejectReason || null,
        date: date || null,
      };
    }

    const Company = mongoose.model(companyColName);
    const updatedCmpany = await Company.findByIdAndUpdate(
      companyId,
      { $set: updateData },
      { new: true },
    );

    res.status(201).json({
      status: 'success',
      message: 'Successfully updated',
      data: updatedCmpany,
    });
  } catch (err) {
    console.log(err);
  }
});

exports.getAllCompanies = catchAsync(async (req, res, next) => {
  const country = req.params.companyId;
  const { page, limit, active, pending } = req.query;
  if (!country) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1055',
          req.headers['accept-language'],
        ),
        400,
      ),
    );
  }

  const countryData = await Country.findById(country);
  if (!countryData.apply_country) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1056',
          req.headers['accept-language'],
        ),
        400,
      ),
    );
  }

  const companyColName = countryData.colname;
  if (!companyColName) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1056',
          req.headers['accept-language'],
        ),
        400,
      ),
    );
  }
  const Company = mongoose.model(companyColName);

  let query = {};
  if (pending === 'true') {
    query.pending = true;
  } else if (active !== undefined) {
    query.active = active === 'true';
  } else {
    query.active = false;
  }

  const companiesCount = await Company.countDocuments(query);
  const features = new APIFeatures(
    Company.find(query)
      .populate('industry', 'name id')
      .populate('location', 'name id'),
    req.query,
  )
    .filter()
    .sort()
    .fields()
    .paginate(page, limit);

  const companies = await features.query;
  res.status(200).json({
    message: 'success',
    total: companiesCount,
    results: companies.length,
    data: {
      companies: companies,
    },
  });
});


exports.getCompEmail = catchAsync(async (req, res, next) => {
  const country = req.params.countryId;
  const { email } = req.query;

  if (!country || !email) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1055',
          req.headers['accept-language'],
        ),
        400,
      ),
    );
  }

  const countryData = await Country.findById(country);
  if (!countryData || !countryData.apply_country) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1056',
          req.headers['accept-language'],
        ),
        400,
      ),
    );
  }

  const companyColName = countryData.colname;
  if (!companyColName) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1056',
          req.headers['accept-language'],
        ),
        400,
      ),
    );
  }

  const Company = mongoose.model(companyColName);
  const company = await Company.findOne({ email: email });

  res.status(200).json({
    message: 'success',
    exists: !!company,
    data: company ? { id: company._id, email: company.email } : null,
  });
});

exports.getPendingCompanies = catchAsync(async (req, res, next) => {
  try {
    const country = req.params.countryId;
    const { page, limit} = req.query;
    
    if (!country) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1055',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }

    const countryData = await Country.findById(country);
    if (!countryData.apply_country) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1056',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }

    const companyColName = countryData.colname;

    if (!companyColName) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1056',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }
    const Company = mongoose.model(companyColName);
    // const companiesCount = await Company.countDocuments(query);
    const features = new APIFeatures(
      Company.find({ pending: true })
        .populate('industry', 'name')
        .populate('location', 'name'),
      req.query,
    )
      .filter()
      .sort()
      .fields()
      .paginate(page, limit);

    const companies = await features.query;
    res.status(200).json({
      message: 'success',
      total: companies.length,
      data: {
        companies,
      },
    });
  } catch (err) {
    console.log(err);
  }
});

exports.unsubscribeCompany = catchAsync(async (req, res, next) => {
  try {
    const token = req.params.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const Company = mongoose.model(decoded.id.collection);
      if (Company) {
        const updatedCmpany = await Company.findByIdAndUpdate(
          decoded.id.company,
          { $set: { active: false } },
          { new: true },
        );
      }
    }
    res.status(201).json({
      status: 'success',
      message: 'Successfully updated',
    });
  } catch (err) {
    console.log(err);
  }
});

exports.getCompanyById = catchAsync(async (req, res, next) => {
  const country = req.params.countryId;
  const { id } = req.query;
  if (!country || !id) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1055',
          req.headers['accept-language'],
        ),
        400,
      ),
    );
  }
  const countryData = await Country.findById(country);
  if (!countryData || !countryData.apply_country) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1056',
          req.headers['accept-language'],
        ),
        400,
      ),
    );
  }

  const companyColName = countryData.colname;
  if (!companyColName) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1056',
          req.headers['accept-language'],
        ),
        400,
      ),
    );
  }

  const Company = mongoose.model(companyColName);

  const companyData = await Company.findById(id)
    .populate('industry', 'name')
    .populate('location', 'name')
    .populate('category', 'name')
    .populate('addedBy', 'name');
  if (!companyData) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1002',
          req.headers['accept-language'],
        ),
        400,
      ),
    );
  }
  res.status(200).json({
    message: 'success',
    data: companyData,
  });
});

exports.searchCompany = catchAsync(async (req, res, next) => {
  try {
    const {
      email,
      comp_name,
      comp_name_ar,
      location,
      industry,
      category,
      addedBy
    } = req.body;

    const country = req.params.countryId;
    const { page, limit,active} = req.query;
    if (!country) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1055',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }
    const countryData = await Country.findById(country);
    if (!countryData || !countryData.apply_country) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1056',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }

    const companyColName = countryData.colname;
    if (!companyColName) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1056',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }

    const Company = mongoose.model(companyColName);
    // const query = {};
    const query =
    active !== undefined ? { active: active === 'true' } : { active: false };
    // Apply filters for email, status, and is_active fields
    if (email) {
      query.email = { $regex: email, $options: 'i' }; // Case-insensitive email search
    }
    if (comp_name) {
      query.comp_name = { $regex: comp_name, $options: 'i' }; // Case-insensitive status search
    }
    if (comp_name_ar) {
      query.comp_name_ar = { $regex: comp_name_ar, $options: 'i' }; // Case-insensitive status search
    }
    if (active !== undefined) {
      query.active = active; // true or false based on user input
    }

    if (location) {
      const locationData = await Location.findOne({
        name: { $regex: `^${location}$`, $options: 'i' },
      }).select('_id');
      if (locationData) {
        query.location = locationData._id;
      } else {
        return next(
          new AppError(
            await messageController.getMessage(
              'MSG1026',
              req.headers['accept-language'],
            ),
            400,
          ),
        );
      }
    }

    if (industry) {
      const industryData = await Industry.findOne({
        name: { $regex: `^${industry}$`, $options: 'i' },
      }).select('_id');
      if (industryData) {
        query.industry = industryData._id;
      } else {
        return next(
          new AppError(
            await messageController.getMessage(
              'MSG1026',
              req.headers['accept-language'],
            ),
            400,
          ),
        );
      }
    }

    if (category) {
      const categoryData = await Category.findOne({
        name: { $regex: `^${category}$`, $options: 'i' },
      }).select('_id');
      if (categoryData) {
        query.category = categoryData._id;
      } else {
        return next(
          new AppError(
            await messageController.getMessage(
              'MSG1026',
              req.headers['accept-language'],
            ),
            400,
          ),
        );
      }
    }

    if (addedBy) {
      const addedByData = await Staff.findOne({
        name: { $regex: `^${addedBy}$`, $options: 'i' },
      }).select('_id');
      if (addedByData) {
        query.addedBy = addedByData._id;
      } else {
        return next(
          new AppError(
            await messageController.getMessage(
              'MSG1026',
              req.headers['accept-language'],
            ),
            400,
          ),
        );
      }
    }


  const companiesCount = await Company.countDocuments(query);
 
  const features = new APIFeatures(
       Company.find(query)
         .populate('industry', 'name id')
         .populate('location', 'name id'),
       req.query,
      )
      .filter()
      .sort()
      .fields()
      .paginate(page, limit);
      const companies = await features.query;
      
      res.status(200).json({
      message: 'success',
      total: companiesCount,
      results: companies.length,
      data: {
        companies: companies,
      },
      });
  } catch (err) {
    console.error(err);
    return next(
      new AppError('Something went wrong while searching company.', 500),
    );
  }
});
