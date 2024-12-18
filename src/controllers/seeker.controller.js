/* eslint-disable camelcase */
const Seeker = require('../models/seeker.model');
const APIFeatures = require('../utils/api-features.utils');
const AppError = require('../utils/app-error.utils');
const catchAsync = require('../utils/catchasync.utlils');
const Country = require('../models/country.model');
const {
  CompanyAE,
  CompanyQA,
  CompanySA,
} = require('../models/companies.model');
const mongoose = require('mongoose');
const Batch = require('../models/batch.model');
const Plan = require('../models/plan.model');
const Location = require('../models/location.model');
const Industry = require('../models/industries.model');
const Language = require('../models/language.model');
const Skill = require('../models/skill.model');
const Visa = require('../models/visa.model');
const {
  LogHistoryAE,
  LogHistoryQA,
  LogHistorySA,
} = require('../models/loghistory.model');

const { LogsAE, LogsQA, LogsSA } = require('../models/logs.model');
const sendgrid = require('../utils/send-grid.utils');
const jwt = require('jsonwebtoken');
const messageController = require('../controllers/message.controller');
const Gender = require('../models/gender.model');
const DocumentType = require('../models/documentType.model');
const jwtSign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

exports.getAllSeeker = catchAsync(async (req, res, next) => {
  const country = req.params.countryId;
  const { page, limit} = req.query;
  let query = {};
  query.apply_country = country;
  const seekerCount = await Seeker.countDocuments(query);
  const features = new APIFeatures(Seeker.find({ apply_country: country }).populate('nationality', 'nicename'), req.query)
    .filter()
    // .sort()
    .fields()
    .paginate(page, limit);

  const allSeekers = await features.query;
  res.status(200).json({
    status: 'success',
    total: seekerCount,
    results: allSeekers.length,
    data: {
      seekers: allSeekers,
    },
  });
});

exports.getPaidSeekers = catchAsync(async (req, res, next) => {
  const country = req.params.countryId;
  const { page, limit} = req.query;
  let query = {};
  query.apply_country = country;
  query.seeker_plans = { $not: { $size: 0 }};
  
  const seekerCount = await Seeker.countDocuments(query);
  const features = new APIFeatures(
    Seeker.find(
      {
        seeker_plans: { $not: { $size: 0 } }, // Ensures seeker_plans array is not empty
        apply_country: country, // Filters by the country
      }
    )
      .populate('nationality', 'nicename'), // Populates `nationality` field with `nicename` only
    req.query
  )
    .fields() // Applies field selection if defined in query params
    .filter() // Applies filters based on query params
    .paginate(page, limit); // Applies pagination if defined in query params

  const paidSeekers = await features.query;

  res.status(200).json({
    message: 'success',
    total: seekerCount,
    results: paidSeekers.length,
    data: {
      seekers: paidSeekers,
    },
  });
});


exports.getSeekerById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const currentSeeker = await Seeker.findById(id)
  .populate('gender','name')
  .populate('nationality','nicename')
  .populate('apply_country','nicename')
  .populate('residing_country','nicename')
  .populate('visa_status','name')
  .populate('seeker_industries.industry','name')
  .populate('seeker_location.location','name')
  .populate('seeker_plans.plan','name')
  .populate('driving_license.country','nicename')
  .populate('seeker_keywords.keyword','name')
  .populate('languages_known.language','name')
  .populate('admin_industries.industry','name')
  .populate('admin_location.location','name')
  .populate('seeker_documents.type','name')
 
  
  // .populate('seeker_location.location');
  let companyModel;
  let applyCountryId = (currentSeeker.apply_country._id).toString();
  
  if(applyCountryId === '6337f7aafe05a7d9f4e7b016') {
    companyModel = 'CompanyAE';
  } else if(applyCountryId === '6337f7aafe05a7d9f4e7b0c2') {
    companyModel = 'CompanyQA';
  } else if(applyCountryId === '6337f7aafe05a7d9f4e7b0cf') {
    companyModel = 'CompanySA';
  }
  
  await currentSeeker.populate({
    path: 'exclude_companies.company',
    select: 'comp_name',
    model: companyModel,
  })

  currentSeeker.seeker_plans.sort((a, b) => {
    return new Date(b.activated_on) - new Date(a.activated_on);
  });
  
  if (!currentSeeker) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1056',
          req.headers['accept-language'],
        ),
      ),
    );
  }
  res.status(200).json({
    message: 'success',
    seeker: currentSeeker,
  });
});



exports.updateSeeker = catchAsync(async (req, res, next) => {
  try {
    const seekerId = req.params.seeker;
    if (seekerId === ':seeker') {
      return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
    }

    const forbiddenFields = [
      'email', 'password', 'status', 'code', 'permission_cl', 'otp',
      'first_name', 'last_name', 'total_exp_year', 'total_exp_month',
      'expect_salary_start', 'expect_salary_end', 'gender', 'contact',
      'date_of_birth', 'marital_status', 'notice_period',
      'languages_known_ids', 'seeker_driving_ids', 'seeker_exclude_ids'
    ];

    if (forbiddenFields.some((field) => req.body[field])) {
      return next(new AppError(await messageController.getMessage('MSG1054',req.headers['accept-language']), 400));
    }

    const { looking, cover_letter, residing_country, high, medium, low } = req.body;

    if (looking) {
      await updateWorkInfo(req, res, next, seekerId);
    } else if (cover_letter) {
      await updateCoverLetter(req, res, seekerId, cover_letter);
    } else if (residing_country) {
      await updateAdditionalInfo(req, res, next, seekerId);
    } else if (high || medium || low) {
      await updatePriority(req, res, next, seekerId, { high, medium, low });
    } else {
      return next(new AppError('No valid fields to update.', 400));
    }
  } catch (err) {
    console.error('Error in updateSeeker:', err);
    next(err);
  }
});


const updateWorkInfo = async (req, res, next, seekerId) => {
  const { looking, admin_location_ids, seeker_skill_ids, admin_industries_ids } = req.body;
  
  // Validate required field
    if (!looking) {
      return next(
        new AppError(
          await messageController.getMessage('MSG1051', req.headers['accept-language']),
          400
        )
      );
    }

    try {
      // Initialize promises array for optional fields
      const promises = [];
      
      if (admin_location_ids) {
        promises.push(Location.find({ _id: { $in: admin_location_ids } }));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      if (admin_industries_ids) {
        promises.push(Industry.find({ _id: { $in: admin_industries_ids } }));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      if (seeker_skill_ids) {
        promises.push(Skill.find({ _id: { $in: seeker_skill_ids } }));
      } else {
        promises.push(Promise.resolve([]));
      }

      // Await all promises
      const [validLocationDocs, validIndustryDocs, validSkillDocs] = await Promise.all(promises);

      // Map valid documents into the required format
      const filteredLocations = validLocationDocs.map((doc) => ({ location: doc._id }));
      const filteredIndustries = validIndustryDocs.map((doc) => ({ industry: doc._id }));
      const filteredSkills = validSkillDocs.map((doc) => ({ keyword: doc._id }));

      // Remove existing data from the arrays (unconditionally)
      await Seeker.updateOne(
        { _id: seekerId },
        {
          $unset: {
            admin_location: "",
            admin_industries: "",
            seeker_keywords: "",
          },
        }
      );

      // Update the seeker with new data, adding only provided fields
      const updateData = {
        $set: { looking },
      };

      if (filteredLocations.length) {
        updateData.$addToSet = {
          ...updateData.$addToSet,
          admin_location: { $each: filteredLocations },
        };
      }

      if (filteredIndustries.length) {
        updateData.$addToSet = {
          ...updateData.$addToSet,
          admin_industries: { $each: filteredIndustries },
        };
      }

      if (filteredSkills.length) {
        updateData.$addToSet = {
          ...updateData.$addToSet,
          seeker_keywords: { $each: filteredSkills },
        };
      }

      await Seeker.updateOne({ _id: seekerId }, updateData);

      // Respond with success
      res.status(201).json({
        status: 'success',
        updatedFields: {
          locations: filteredLocations.length,
          industries: filteredIndustries.length,
          skills: filteredSkills.length,
        },
      });
    } catch (err) {
      console.error('Error in updateLooking:', err);
      next(err);
    }
};

const updateCoverLetter = async (req, res, seekerId,next) => {
  const { cover_letter} = req.body;

  // Validate required fields
  if (!cover_letter) {
    return next(
      new AppError(
        await messageController.getMessage('MSG1051', req.headers['accept-language']),
        400
      )
    );
  }

  try {

    await Seeker.updateOne(
      { _id: seekerId },
      {
        $set: { cover_letter }
      }
    );

    // Respond with success
    res.status(201).json({
      status: 'success'
    });
  } catch (err) {
    console.error('Error in updateCoverletter:', err);
    next(err);
  }
};

const updatePriority = async (req, res, next,seekerId) => {
  const { high,medium,low} = req.body;

  // Validate required fields
  if (!high || !medium || !low) {
    return next(
      new AppError(
        await messageController.getMessage('MSG1051', req.headers['accept-language']),
        400
      )
    );
  }

  try {
    
    // if(seekerData.seeker_plans)
    await Seeker.updateOne(
      { _id: seekerId },
      {
        $set: { 'priority.high':high,'priority.medium':medium,'priority.low':low }
      }
    );

    updateSeekerPlanStatus(seekerId);

    // Respond with success
    res.status(201).json({
      status: 'success'
    });
  } catch (err) {
    console.error('Error in updatePriority:', err);
    next(err);
  }
};


const updateAdditionalInfo = async (req, res, next,seekerId) => {
  const { nationality,residing_country,visa_status,visa_validity,is_active} = req.body;

  // Validate required fields
  if (!nationality || !residing_country || !visa_status) {
    return next(
      new AppError(
        await messageController.getMessage('MSG1051', req.headers['accept-language']),
        400
      )
    );
  }

  try {

    await Seeker.updateOne(
      { _id: seekerId },
      {
        $set: { nationality,residing_country,visa_status,visa_validity,is_active}
      }
    );

    // Respond with success
    res.status(201).json({
      status: 'success'
    });
  } catch (err) {
    console.error('Error in updateAdditionalInfo:', err);
    next(err);
  }
};



exports.generateEmail = catchAsync(async (req, res, next) => {
  try {
    const { seeker } = req.params;
    const { id } = req.body;
    const countryData = await Country.findById(id);
    const seekerDetails = await Seeker.findById(seeker);
    const iso = countryData.iso;
    const countryDetails = await Country.findOne({ iso: iso });
    if (!seekerDetails || !countryDetails) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1055',
            req.headers['accept-language'],
          ),
        ),
      );
    }
    const companyColName = countryDetails.colname;
    const companyLogHistoryName = countryDetails.loghistoryname;
    const companyLogName = countryDetails.logname;

    if (
      companyColName == '' ||
      companyLogHistoryName == '' ||
      companyLogName == ''
    ) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1057',
            req.headers['accept-language'],
          ),
        ),
      );
    }
    const Company = mongoose.model(companyColName);
    const LogHistory = mongoose.model(companyLogHistoryName);
    const Logs = mongoose.model(companyLogName);

    const planObjIdArr = [];
    seekerDetails.seeker_plans.forEach((element) => {
      if (element.status === 1 && !element.hold) {
        planObjIdArr.push({ plan: element.plan, seekerPlan: element._id });
      }
    });

    const seekerPerc = seekerDetails.priority;
    const locations = [];
    const industries = [];
    let available = [];
    seekerDetails.seeker_location.forEach((element) => {
      locations.push(element.location);
    });
    seekerDetails.admin_location.forEach((element) => {
      locations.push(element.location);
    });

    seekerDetails.seeker_industries.forEach((element) => {
      industries.push(element.industry);
    });

    seekerDetails.admin_industries.forEach((element) => {
      industries.push(element.industry);
    });

    const features = new APIFeatures(
      Company.find({
        location: { $in: locations },
        industry: { $in: industries },
        active: true,
      }),
      req.query,
    )
      .filter()
      .sort()
      .fields()
      .paginate();

    const companies = await features.query;
    companies.forEach((element) => {
      available.push(element._id);
    });
    let combinedArray = [];

    //changes to dynamic
    const batchData = await Batch.find({
      seeker: { $in: seeker },
    });

    batchData.forEach((element) => {
      combinedArray.push(element.company);
    });
    seekerDetails.exclude_companies.forEach((element) => {
      combinedArray.push(element.company);
    });

    availabeFiltered = available.filter((value) =>
      combinedArray.some((otherValue) => value.equals(otherValue)),
    );
    available = available.filter(
      (value) =>
        !availabeFiltered.some((otherValue) => value.equals(otherValue)),
    );

    const seekerLowPerc = seekerPerc.low;
    const seekerMedPerc = seekerPerc.medium;
    const seekerHighPerc = seekerPerc.high;
    let quotaLimit = 0;
    //console.log(planObjIdArr,"planObjIdArr");
    const selectedPlansArr = [];
    for (const ele of planObjIdArr) {
      const planData = await Plan.findById(ele.plan);
      selectedPlansArr.push({
        plan: ele.plan,
        count: planData.quota_limit,
        seekerPlan: ele.seekerPlan,
      });
      quotaLimit = quotaLimit + planData.quota_limit;
    }
    //console.log(selectedPlansArr,"selectedPlansArr");
    const seekerLowCount = Math.floor((quotaLimit * seekerLowPerc) / 100);
    //console.log(seekerLowCount,"seekerLowCount");
    const seekerMedCount = Math.floor((quotaLimit * seekerMedPerc) / 100);

    const seekerHighCount = quotaLimit - seekerLowCount - seekerMedCount;
    const lowCompanies = [];
    let lowcompaniesCount = 0;
    const medCompanies = [];
    let medcompaniesCount = 0;
    const highCompanies = [];
    let highcompaniesCount = 0;
    const sendMail = [];
    const inLogHistory = [];

    const availableWithCategory = await Company.find({
      _id: { $in: available },
    })
      .populate({
        path: 'category',
        select: 'name',
      })
      .select('category');
    const availableLowCompanies = [];
    const availableMedCompanies = [];
    const availableHighCompanies = [];
    availableWithCategory.forEach((company) => {
      if (company.category.name === 'Low') {
        availableLowCompanies.push(company);
      } else if (company.category.name === 'Medium') {
        availableMedCompanies.push(company);
      } else if (company.category.name === 'High') {
        availableHighCompanies.push(company);
      }
    });

    const availableLowObjIds = [];
    availableLowCompanies.forEach((element) => {
      availableLowObjIds.push(element._id);
    });

    const availableMedObjIds = [];
    availableMedCompanies.forEach((element) => {
      availableMedObjIds.push(element._id);
    });

    const availableHighObjIds = [];
    availableHighCompanies.forEach((element) => {
      availableHighObjIds.push(element._id);
    });

    const loghistoryData = await LogHistory.find({
      company: { $in: available },
    });

    const loghistoryObjIds = [];
    loghistoryData.forEach((element) => {
      loghistoryObjIds.push(element.company);
    });

    const logsData = await Logs.find({
      seeker: { $in: seeker },
    });

    logsData.forEach((element) => {
      loghistoryObjIds.push(element.company);
    });

    const uniqueLogObjectIds = loghistoryObjIds.reduce((acc, current) => {
      if (!acc.find((objId) => objId.toString() === current.toString())) {
        acc.push(current);
      }
      return acc;
    }, []);

    const inLogHistoryLow = uniqueLogObjectIds.filter((value) =>
      availableLowObjIds.some((otherValue) => value.equals(otherValue)),
    );
    const notLogHistoryLow = availableLowObjIds.filter(
      (value) =>
        !inLogHistoryLow.some((otherValue) => value.equals(otherValue)),
    );
    const orderedAvailableLowComp = notLogHistoryLow.concat(inLogHistoryLow);

    orderedAvailableLowComp.forEach((el) => {
      if (lowcompaniesCount < seekerLowCount) {
        lowCompanies.push(el);
        sendMail.push(el._id);
        lowcompaniesCount++;
      }
    });

    inLogHistoryLow.forEach((el) => {
      inLogHistory.push(el._id);
    });

    const inLogHistoryMed = uniqueLogObjectIds.filter((value) =>
      availableMedObjIds.some((otherValue) => value.equals(otherValue)),
    );
    const notLogHistoryMed = availableMedObjIds.filter(
      (value) =>
        !inLogHistoryMed.some((otherValue) => value.equals(otherValue)),
    );
    const orderedAvailableMedComp = notLogHistoryMed.concat(inLogHistoryMed);
    let remMediumCount = seekerMedCount + (seekerLowCount - lowcompaniesCount);
    orderedAvailableMedComp.forEach((el) => {
      if (medcompaniesCount < remMediumCount) {
        medCompanies.push(el);
        sendMail.push(el._id);
        medcompaniesCount++;
      }
    });

    inLogHistoryMed.forEach((el) => {
      inLogHistory.push(el._id);
    });

    const inLogHistoryHigh = uniqueLogObjectIds.filter((value) =>
      availableHighObjIds.some((otherValue) => value.equals(otherValue)),
    );
    const notLogHistoryHigh = availableHighObjIds.filter(
      (value) =>
        !inLogHistoryHigh.some((otherValue) => value.equals(otherValue)),
    );
    const orderedAvailableHighComp = notLogHistoryHigh.concat(inLogHistoryHigh);
    let remHighCount = seekerHighCount + remMediumCount - medcompaniesCount;
    orderedAvailableHighComp.forEach((el) => {
      if (highcompaniesCount < remHighCount) {
        highCompanies.push(el);
        sendMail.push(el._id);
        highcompaniesCount++;
      }
    });

    inLogHistoryHigh.forEach((el) => {
      inLogHistory.push(el._id);
    });

    const allCompArr = [];
    const allCompIdArr = [];
    lowCompanies.forEach((item) => {
      allCompIdArr.push(item._id);
      allCompArr.push({ company: item });
    });

    medCompanies.forEach((item) => {
      allCompIdArr.push(item._id);
      allCompArr.push({ company: item });
    });

    highCompanies.forEach((item) => {
      allCompIdArr.push(item._id);
      allCompArr.push({ company: item });
    });

    const matchLogHis = sendMail.filter((value) =>
      inLogHistory.some((otherValue) => value.equals(otherValue)),
    );
    const batchArr = [];
    let batchSend = false;
    let result;
    let messageData ='';
    if (allCompIdArr.length < quotaLimit) {
      batchSend = false;
      allCompArr.splice(0, allCompArr.length);
      generationStatus = 'lesscount';
    } else {
      batchSend = true;
      const deleteLogHistory = await LogHistory.deleteMany({
        company: matchLogHis,
      });
      const sendToLogHistoryArr = await LogHistory.insertMany(allCompArr);
      let currentPlanIndex = 0;
      let remainingCount = selectedPlansArr[currentPlanIndex]?.count || 0;
      allCompIdArr.forEach((field, index) => {
        allCompIdArr.seekerPlan = selectedPlansArr[currentPlanIndex].seekerPlan;
        remainingCount--;
        batchArr.push({
          seeker: seeker,
          company: field,
          plan: allCompIdArr.seekerPlan,
          iso: iso,
        });
        if (
          remainingCount === 0 &&
          currentPlanIndex < selectedPlansArr.length - 1
        ) {
          currentPlanIndex++;
          remainingCount = selectedPlansArr[currentPlanIndex]?.count || 0;
        }
      });

      if (batchArr.length === allCompIdArr.length) {
        for (const ele of planObjIdArr) {
          const planStatusUpdate = await Seeker.findByIdAndUpdate(
            seeker,
            { $set: { 'seeker_plans.$[elem].status': 2 } },
            {
              arrayFilters: [{ 'elem.plan': ele.plan, 'elem.hold': false }],
              new: true, // Return the modified document rather than the original
            },
          );
        }
      }
      generationStatus = 'generationsuccess';
      const sendToBatchCol = await Batch.insertMany(batchArr);
      if(sendToBatchCol.length ===0)
      {
        messageData = 'No companies found.';
      }
    }

    if(messageData)
    {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1060',
            req.headers['accept-language'],
          ),
        ),
      );
    }
    else
    {
      if(generationStatus =="lesscount")
      {
        return next(
          new AppError(
            await messageController.getMessage(
              'MSG1061',
              req.headers['accept-language'],
            ),
          ),
        );
      }
      else
      {
        res.status(200).json({
          message: 'success',
          batchStatus: generationStatus,
        });
      }
      
    }
    
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'error',
      results: 0,
      data:err
    });
  }
});

exports.emailBatchTemplate = async (seekerId, companyId, iso) => {
  const countryDetails = await Country.findOne({ iso: iso });
  const companyColName = countryDetails.colname;
  const Company = mongoose.model(companyColName);
  const employer = await Company.findById(companyId);
  const seeker = await Seeker.findById(seekerId);
  const visaDetails = await Visa.findById(seeker.visa_status);
  const residingDeatils = await Country.findById(seeker.residing_country);
  const coverletter = seeker.cover_letter;
  const seekerName = seeker.name.first_name + ' ' + seeker.name.last_name;
  const totalExpStr =
    seeker.total_exp.year + ' Year & ' + seeker.total_exp.month + ' Months';
  const expectedSalaryStr =
    countryDetails.currency +
    ' ' +
    seeker.expect_salary.start +
    ' - ' +
    seeker.expect_salary.end;
  const contactStr = seeker.contact;
  const payload = { company: companyId, collection: companyColName };
  const token = jwtSign(payload);
  //console.log(coverletter);
  const content = `<br>
  <div style="margin-top:4px;padding-top:4px;border-top:1px solid #f1f1f1;padding-bottom:4px;border-bottom:1px solid #f1f1f1">
  <br>
  <table cellspacing="0" cellpadding="0"><tbody><tr>
  <td>Name </td>
  <td>${seekerName}</td>
  </tr>
  <tr>
  <td>Experience</td>
  <td>${totalExpStr}</td>
  </tr>
  <tr>
  <td>Salary</td>
  <td>${expectedSalaryStr}</td>
  </tr>
  <tr>
  <td>Location</td>
  <td>${residingDeatils.nicename}</td>
  </tr>
  <tr>
  <td>Visa</td>
  <td>${visaDetails.name}</td>
  </tr>
  <tr>
  <td>Phone Number&nbsp;&nbsp;&nbsp;&nbsp;</td>
  <td>${contactStr}</td>
  </tr>
  <tr>
  <td>Email</td>
  <td>${seeker.email}</td>
  </tr>
  </tbody>
  </table>
  <br>
  </diV>`;

  const footNote = `<span style="font-size:12px;color:#8c8c8c">
  If you wish to stop receiving potential candidate profiles on a regular basis, please click 
   <a href="http://localhost:4200/en/unsubscribe/${token}" style="text-decoration: none !important;color:#8c8c8c;"><b>unsubscribe.</b></a></span>`;
  const fullContent =
    `<div><div>` +
    coverletter +
    `</div><div>` +
    content +
    `</div><br></div>` +
    footNote;
  const emailObject = {
    email: employer.email,
    fullContent: fullContent,
    looking: seeker.looking,
    seekerName: seekerName,
    seekerId: seekerId,
  };
  const sendemployerEmail = await sendgrid.sendMailEmployer(emailObject);
  return sendemployerEmail;
};

exports.addSeekerPlan = catchAsync(async (req, res, next) => {
  try {
    const seekerDetails = await Seeker.findById(req.params.seeker);
    const { planId, payment_mode, country } = req.body;
    if (!planId || !payment_mode) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1057',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }
    const plan = await Plan.findOne({ _id: planId, iso:country}).lean();
    if (seekerDetails.otp.status && plan && seekerDetails.is_active) {
      const updatedPlnSeeker = await Seeker.findByIdAndUpdate(
        req.params.seeker,
        {
          $push: { seeker_plans: { plan: planId, payment_mode: payment_mode, country: country} },
        },
        { new: true },
      );

      if (updatedPlnSeeker) {
        let content = `<table border='0' cellspacing='0' cellpadding='0' width='100%' style='color:#44546A;'>
          <tbody>	
          <tr>
              <td width='460'>
                  <h1 style='font-family: Arial, Helvetica, sans-serif;font-weight:normal'>
                    Finally, It's done
                  </h1>
              </td>
          </tr>
          <tr>
              <td width='460'>
                  <p>
                      <strong>Dear ${seekerDetails.name.first_name},</strong>
                  </p>
                  <p>
                  Thank you for choosing our subscription. Kindly note that your plan will be activated within the next 7 to 15 days based on the number of registrations and after confirmation of the payment. 
                  </p>
                  <p>
                  You may visit bathool.com/faq for frequently asked questions about how bathool works.  
                  </p>
                  <p>
		                  We hope you will find your dream job soon.
                  </p>
                  <p>
                      Regards,
                  </p>
                  <h3 style='height:10px;'>
                      Ajmal Hamza
                  </h3>
                  <h3 style='color:#00622A;'>
                      Bathool
                  </h3>
                  <table>
                  <tr>
                      <td style='width:30px;' width='30'><a href='https://www.linkedin.com/company/bathool'><img alt='Bathool linkedin' src='http://bathool.com/assets/images/bathooliconlinkedin.png' style='width:25px' width='25' /></a></td>
                      <td style='width:30px;' width='30'><a href='https://www.instagram.com/bathoolinsta'><img alt='Bathool instagram' src='http://bathool.com/assets/images/bathooliconinsta.png' style='width:25px' width='25' /></a></td>
                      <td style='width:30px;' width='30'><a href='https://www.facebook.com/FacebookBathool'><img alt='Bathool facebook' src='http://bathool.com/assets/images/bathooliconfb.png' style='width:25px' width='25' /></a></td>
                      <td style='width:30px;' width='30'><a href='https://www.youtube.com/channel/UC5juFRHwM4TxwVpWTXgRLtA'><img alt='Bathool youtube' src='http://bathool.com/assets/images/bathooliconyt.png' style='width:25px' width='25' /></a></td>
                      <td style='width:30px;' width='30'><a href='https://whatsapp.com/channel/0029VaC6pkaKGGG9R7TX0r1j'><img alt='Bathool whatsapp' src='http://bathool.com/assets/images/bathooliconwhats.png' style='width:25px' width='25' /></a></td>
                      <td style='width:30px;' width='30'><a href='http://t.me/bathooljobs'><img alt='Bathool telegram' src='http://bathool.com/assets/images/bathoolicontelegram.png' style='width:25px' width='25' /></a></td>
                  </tr>
                  </table>
              </td>
            </tr>
            </tbody>
            </table>`;
        const emailObject = {
          email: seekerDetails.email,
          fullContent: content,
          subject: 'Bathool Subscription',
        };
        const sendEmailActivated = await sendgrid.sendMailSeeker(emailObject);
      }
    } else {
      return next(new AppError('Unathorized', 401));
    }

    res.status(200).json({
      status: 'success',
      message: 'Plan added',
    });
  } catch (err) {
    console.log(err);
  }
});

exports.updateSeekerPlan = catchAsync(async (req, res, next) => {
  try {
    const seekerDetails = await Seeker.findById(req.params.seeker);
    const { skip_queue, hold, orderId } = req.body;
    if (!orderId) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1057',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }

    if (seekerDetails.otp.status && seekerDetails.is_active) {
      const updatedSeekerPlanStatus = await Seeker.findByIdAndUpdate(
        req.params.seeker,
        {
          $set: {
            'seeker_plans.$[elem].skip_queue': skip_queue,
            'seeker_plans.$[elem].hold': hold,
          },
        },
        {
          arrayFilters: [{ 'elem._id': orderId }],
          new: true, // Return the modified document rather than the original
        },
      );
      // console.log(hold, 'hold');
      if (updatedSeekerPlanStatus && hold) {
        let content = `<table border='0' cellspacing='0' cellpadding='0' width='100%' style='color:#44546A;'>
          <tbody>	
          <tr>
              <td width='460'>
                  <h1 style='font-family: Arial, Helvetica, sans-serif;font-weight:normal'>
                  Activation Paused
                  </h1>
              </td>
          </tr>
          <tr>
              <td width='460'>
                  <p>
                      <strong>Dear ${seekerDetails.name.first_name},</strong>
                  </p>
                  <p>
                  We would like to confirm that your job application plan has been temporarily placed on hold as per your request.
                  </p>
                  <p>
                  Please feel free to reach out to us when you are ready to proceed with the activation.
                  </p>
                  <p>
                  Wishing you all the best, and we look forward to hearing from you soon regarding your hiring progress.
                  </p>
                  <p>
                      Regards,
                  </p>
                  <h3 style='height:10px;'>
                      Ajmal Hamza
                  </h3>
                  <h3 style='color:#00622A;'>
                      Bathool
                  </h3>
                  <table>
                  <tr>
                      <td style='width:30px;' width='30'><a href='https://www.linkedin.com/company/bathool'><img alt='Bathool linkedin' src='http://bathool.com/assets/images/bathooliconlinkedin.png' style='width:25px' width='25' /></a></td>
                      <td style='width:30px;' width='30'><a href='https://www.instagram.com/bathoolinsta'><img alt='Bathool instagram' src='http://bathool.com/assets/images/bathooliconinsta.png' style='width:25px' width='25' /></a></td>
                      <td style='width:30px;' width='30'><a href='https://www.facebook.com/FacebookBathool'><img alt='Bathool facebook' src='http://bathool.com/assets/images/bathooliconfb.png' style='width:25px' width='25' /></a></td>
                      <td style='width:30px;' width='30'><a href='https://www.youtube.com/channel/UC5juFRHwM4TxwVpWTXgRLtA'><img alt='Bathool youtube' src='http://bathool.com/assets/images/bathooliconyt.png' style='width:25px' width='25' /></a></td>
                      <td style='width:30px;' width='30'><a href='https://whatsapp.com/channel/0029VaC6pkaKGGG9R7TX0r1j'><img alt='Bathool whatsapp' src='http://bathool.com/assets/images/bathooliconwhats.png' style='width:25px' width='25' /></a></td>
                      <td style='width:30px;' width='30'><a href='http://t.me/bathooljobs'><img alt='Bathool telegram' src='http://bathool.com/assets/images/bathoolicontelegram.png' style='width:25px' width='25' /></a></td>
                  </tr>
                  </table>
              </td>
            </tr>
            </tbody>
            </table>`;
        const emailObject = {
          email: seekerDetails.email,
          fullContent: content,
          subject: 'Activation Paused',
        };
        const sendEmailActivated = await sendgrid.sendMailSeeker(emailObject);
      }
    } else {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1022',
            req.headers['accept-language'],
          ),
          401,
        ),
      );
    }

    res.status(201).json({
      status: 'success',
      message: 'Plan updated',
    });
  } catch (err) {
    console.log(err);
  }
});


exports.searchSeeker = catchAsync(async (req, res, next) => {
  try {
    const {
      // email,
      // is_active,
      // gender,
      // code,
      // cover_letter,
      // looking,
      // seeker_keywords,
      // languages_known,
      // driving_license,
      // name,
      // contact,
      // marital_status,
      // permission_cl,
      // apply_country,
      // seeker_industries,
      // seeker_location,
      // admin_industries,
      // admin_location,
      // seeker_plans,
      // seeker_documents,
      // seeker_nationalities,
      // seeker_residing,
      // seeker_visaStatus,
      // seeker_applyCountry,
      // seeker_planStatus,
      // registration_date,
      // visa_validity,
      // age,
      // total_exp,
      // notice_period,
      // expect_salary,
      data,
      seekerStatus,
      country
    } = req.body;
    
    const query = {};
    const { page, limit} = req.query;
   
    // Apply filters for email, status, and is_active fields
    if (data.email) {
      query.email = { $regex: data.email, $options: 'i' }; // Case-insensitive email search
    }
    if (data.code) {
      query.code = { $regex: data.code, $options: 'i' }; // Case-insensitive email search
    }

    if (data.cover_letter) {
      query.cover_letter = { $regex: data.cover_letter, $options: 'i' }; // Case-insensitive email search
    }

    if (data.looking) {
      query.looking = { $regex: data.looking, $options: 'i' }; // Case-insensitive email search
    }
    
   
    if (data.name) {
      const nameParts = data.name.trim().split(/\s+/); // Split input name into parts
      query['$and'] = nameParts.map((part) => ({
        $or: [
          { 'name.first_name': { $regex: part, $options: 'i' } },
          { 'name.last_name': { $regex: part, $options: 'i' } },
        ],
      }));
    }

    if (data.contact) {
      const regexInitial = new RegExp(data.contact, 'i'); // Matches anywhere in the string
      const contentWithoutZero = data.contact.replace(/^0+/,'');
      const regexFinal = new RegExp(`-${contentWithoutZero}`, 'i'); // Matches where contact is preceded by "-"
      const fullContentStr = data.contact.replace(/-/g,'');
      query['$or'] = [
        { contact: { $regex: regexInitial } },
        { contact: { $regex: regexFinal } },
        {$expr: {$eq:[{$replaceAll:{input:"$contact",find:"-",replacement:""}},fullContentStr]}}
      ];
    }

    if (data.is_active) {
      query.is_active = data.is_active; // Case-insensitive email search
    }

    if (data.marital_status) {
      switch(data.marital_status)
      {
        case "Single":
          query.marital_status = "Single";
          break;
        case "Married":
          query.marital_status = "Married";
          break;
        case "Divorced":
          query.marital_status = "Divorced";
          break;
        case "Separated":
          query.marital_status = "Separated";
          break;
        case "Widowed":
          query.marital_status = "Widowed";
          break;
        default:
          console.log("Invalid marital status"); 
      }
    }

    if (data.permission_cl) {
      query.permission_cl = data.permission_cl; // Case-insensitive email search
    }

    if (data.gender) {
      const genderData = await Gender.findOne({
        name: { $regex: `^${data.gender}$`, $options: 'i' },
      }).select('_id');
      if (genderData) {
        query.gender = genderData._id;
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

    if (data.apply_country) {
      const applyCountryData = await Country.findOne({
        nicename: { $regex: `^${data.apply_country}$`, $options: 'i' },
      }).select('_id');
      if (applyCountryData) {
        query.apply_country = applyCountryData._id;
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

    if (data.seeker_industries && data.seeker_industries.length > 0) {
      const regexQueries = data.seeker_industries.map((industry) => ({
        name: { $regex: `^${data.industry}$`, $options: 'i' },
      }));

      const industries = await Industry.find({ $or: regexQueries }).select('_id');

      const industryIdsFromNames = industries.map((industry) => industry._id);

      if (industryIdsFromNames.length > 0) {
        query['seeker_industries.industry'] = { $in: industryIdsFromNames };
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

    if (data.seeker_location && data.seeker_location.length > 0) {
      const regexQueries = data.seeker_location.map((location) => ({
        name: { $regex: `^${location}$`, $options: 'i' },
      }));

      const locations = await Location.find({ $or: regexQueries }).select('_id');

      const locationIdsFromNames = locations.map((location) => location._id);

      if (locationIdsFromNames.length > 0) {
        query['seeker_location.location'] = { $in: locationIdsFromNames };
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

    if (data.admin_industries && data.admin_industries.length > 0) {
      const regexQueries = data.admin_industries.map((industry) => ({
        name: { $regex: `^${industry}$`, $options: 'i' },
      }));

      const adminIndustries = await Industry.find({ $or: regexQueries }).select('_id');

      const adminIndustryIdsFromNames = adminIndustries.map((industry) => industry._id);

      if (adminIndustryIdsFromNames.length > 0) {
        query['admin_industries.industry'] = { $in: adminIndustryIdsFromNames };
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


    if (data.admin_location && data.admin_location.length > 0) {
      const regexQueries = data.admin_location.map((location) => ({
        name: { $regex: `^${location}$`, $options: 'i' },
      }));

      const adminLocations = await Location.find({ $or: regexQueries }).select('_id');

      const adminLocationIdsFromNames = adminLocations.map((location) => location._id);

      if (adminLocationIdsFromNames.length > 0) {
        query['admin_location.location'] = { $in: adminLocationIdsFromNames };
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

    if (data.seeker_plans && data.seeker_plans.length > 0) {
      const regexQueries = data.seeker_plans.map((plan) => ({
        name: { $regex: `^${plan}$`, $options: 'i' },
      }));

      const plans = await Plan.find({ $or: regexQueries }).select('_id');

      const planIdsFromNames = plans.map((plan) => plan._id);

      if (planIdsFromNames.length > 0) {
        query['seeker_plans.plan'] = { $in: planIdsFromNames };
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

    if (data.seeker_documents && data.seeker_documents.length > 0) {
      const regexQueries = data.seeker_documents.map((document) => ({
        name: { $regex: `^${document}$`, $options: 'i' },
      }));
      const documents = await DocumentType.find({ $or: regexQueries }).select('_id');
      const documentsIdsFromNames = documents.map((document) => document._id);
      if (documentsIdsFromNames.length > 0) {
        query['seeker_documents.type'] = { $in: documentsIdsFromNames };
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

    if (data.seeker_keywords && data.seeker_keywords.length > 0) {
      // Create an array of regex queries for each country name in country_restriction
      const regexQueries = data.seeker_keywords.map((keyword) => ({
        $or: [
          { name: { $regex: `^${keyword}$`, $options: 'i' } },
          { name_ar: { $regex: `^${keyword}$`, $options: 'i' } }
        ]
      }));

      // Find countries that match any of the regex conditions
      const keywords = await Skill.find({ $or: regexQueries }).select('_id');

      const keywordIdsFromNames = keywords.map((keyword) => keyword._id);

      if (keywordIdsFromNames.length > 0) {
        query['seeker_keywords.keyword'] = { $in: keywordIdsFromNames };
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

    

    if (data.languages_known && data.languages_known.length > 0) {
      // Create an array of regex queries for each country name in country_restriction
      const regexQueries = data.languages_known.map((language) => ({
        $or: [
          { name: { $regex: `^${language}$`, $options: 'i' } },
          { name_ar: { $regex: `^${language}$`, $options: 'i' } }
        ]
      }));

      // Find countries that match any of the regex conditions
      const languages = await Language.find({ $or: regexQueries }).select('_id');

      const languageIdsFromNames = languages.map((language) => language._id);

      if (languageIdsFromNames.length > 0) {
        query['languages_known.language'] = { $in: languageIdsFromNames };
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

    if (data.driving_license && data.driving_license.length > 0) {
      // Create an array of regex queries for each country name in country_restriction
      const regexQueries = data.driving_license.map((country) => ({
        $or: [
          { nicename: { $regex: `^${country}$`, $options: 'i' } },
          { nicename_ar: { $regex: `^${country}$`, $options: 'i' } }
        ]
      }));

      // Find countries that match any of the regex conditions
      const drivingLicenses = await Country.find({ $or: regexQueries }).select('_id');

      const drivingLicenseIdsFromNames = drivingLicenses.map((country) => country._id);

      if (drivingLicenseIdsFromNames.length > 0) {
        query['driving_license.country'] = { $in: drivingLicenseIdsFromNames };
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

    if (data.seeker_nationalities && data.seeker_nationalities.length > 0) {
      const regexQueries = data.seeker_nationalities.map((nationality) => ({
        nicename: { $regex: `^${nationality}$`, $options: 'i' },
      }));
      const nationalities = await Country.find({ $or: regexQueries }).select('_id');
      const nationalitiesIdsFromNames = nationalities.map((nationality) => nationality._id);
      if (nationalitiesIdsFromNames.length > 0) {
        query.nationality = { $in: nationalitiesIdsFromNames };
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

    if (data.seeker_residing && data.seeker_residing.length > 0) {
      const regexQueries = data.seeker_residing.map((residing) => ({
        nicename: { $regex: `^${residing}$`, $options: 'i' },
      }));
      const residings = await Country.find({ $or: regexQueries }).select('_id');
      const residingIdsFromNames = residings.map((residing) => residing._id);
      if (residingIdsFromNames.length > 0) {
        query.residing_country = { $in: residingIdsFromNames };
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

    if (data.seeker_applyCountry && data.seeker_applyCountry.length > 0) {
      const regexQueries = data.seeker_applyCountry.map((apply_country) => ({
        nicename: { $regex: `^${apply_country}$`, $options: 'i' },
      }));
      const apply_countries = await Country.find({ $or: regexQueries }).select('_id');
      const applyCountryIdsFromNames = apply_countries.map((apply_country) => apply_country._id);
      if (applyCountryIdsFromNames.length > 0) {
        query.apply_country = { $in: applyCountryIdsFromNames };
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

    if (data.seeker_visaStatus && data.seeker_visaStatus.length > 0) {
      const regexQueries = data.seeker_visaStatus.map((visaStatus) => ({
        name: { $regex: `^${visaStatus}$`, $options: 'i' },
      }));
      const visaStatusArr = await Visa.find({ $or: regexQueries }).select('_id');
      const visaStatusIdsFromNames = visaStatusArr.map((visaStatus) => visaStatus._id);
      if (visaStatusIdsFromNames.length > 0) {
        query.visa_status = { $in: visaStatusIdsFromNames };
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

    if (data.seeker_planStatus) {
      switch(data.seeker_planStatus)
      {
        case "Paid":
          query['seeker_plans.status'] = 0;
          break;
        case "Submitted":
          query['seeker_plans.status'] = 1;
          break;
        case "Started":
          query['seeker_plans.status'] = 2;
          break;
        case "Activated":
          query['seeker_plans.status'] = 3;
          break;
        case "Completed":
          query['seeker_plans.status'] = 4;
          break;
        case "Cancelled":
          query['seeker_plans.status'] = 5;
        default:
          console.log("Invalid marital status"); 
      }
    }


    if (data.registration_date && data.registration_date.includes('-')) {
      const [startDateStr, endDateStr] = data.registration_date.split('-');
      const startDate = new Date(`${startDateStr.trim()}T00:00:00.000Z`);
      const endDate = new Date(`${endDateStr.trim()}T23:59:59.999Z`);
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }


    if (data.visa_validity && data.visa_validity.includes('-')) {
      const [startDateStr, endDateStr] = data.visa_validity.split('-');
      const startDate = new Date(`${startDateStr.trim()}T00:00:00.000Z`);
      const endDate = new Date(`${endDateStr.trim()}T23:59:59.999Z`);
      query.visa_validity = {
        $gte: startDate, // Start date
        $lte: endDate,   // End date
      };
    }

    if (data.age && data.age.length === 2) {
      const now = new Date(); 
      const currentYear = now.getFullYear();
      const startAge = data.age[0];
      const endAge = data.age[1];
      const startDate = new Date(currentYear - endAge, now.getMonth(), now.getDate());
      const endDate = new Date(currentYear - startAge, now.getMonth(), now.getDate());
    
      query.date_of_birth = {
        $gte: startDate, 
        $lte: endDate,
      };
    }

    if (data.age && data.age.length === 2) {
      const now = new Date(); 
      const currentYear = now.getFullYear();
      const startAge = data.age[0];
      const endAge = data.age[1];
      const startDate = new Date(currentYear - endAge, now.getMonth(), now.getDate());
      const endDate = new Date(currentYear - startAge, now.getMonth(), now.getDate());
    
      query.date_of_birth = {
        $gte: startDate, 
        $lte: endDate,
      };
    }

    if (data.total_exp && data.total_exp.length === 2) {
      
      const startExpYear = data.total_exp[0];
      const endExpYear = data.total_exp[1];
      query['total_exp.year'] = {
        $gte: startExpYear, 
        $lte: endExpYear,
      };
    }

    if (data.notice_period && data.notice_period.length === 2) {
      const startNoticePeriod = data.notice_period[0];
      const endNoticePeriod = data.notice_period[1];
      query.notice_period = {
        $gte: startNoticePeriod, 
        $lte: endNoticePeriod,
      };
    }

    if (data.expect_salary && data.expect_salary.length === 2) {
      const startExpect = data.expect_salary[0]; // Lower limit of the input range
      const endExpect = data.expect_salary[1];   // Upper limit of the input range
    
      query['$and'] = [
        { 'expect_salary.start': { $lte: endExpect } }, // Salary range start is less than or equal to input end
        { 'expect_salary.end': { $gte: startExpect } }, // Salary range end is greater than or equal to input start
      ];
    }
    
     if(seekerStatus)
     { 
       if(seekerStatus =="paid")
       {
        query['seeker_plans'] = { $exists: true, $ne: [] };
       }
     }
     query.apply_country = country;
     
    const features = new APIFeatures(
      Seeker.find(query).populate('nationality', 'nicename'),
      req.query,
    )
      .filter()
      .sort()
      .fields()
      .paginate(page, limit);
    
    // console.log(features);
    const seekers = await features.query;

    const seekerCount = await Seeker.countDocuments(query);
    
    // Check if no staff matches the query
    if (seekers.length === 0) {
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
    // Return matching staff
    //const seekers = searchSeeker;
    res.status(200).json({
      status: 'success',
      total: seekerCount,
      results: seekers.length,
      data: { seekers },
    });
  } catch (err) {
    console.error(err);
    return next(
      new AppError('Something went wrong while searching seeker.', 500),
    );
  }
});


async function updateSeekerPlanStatus(seeker) {
  const currentSeeker = await Seeker.findById(seeker);
  if (currentSeeker.seeker_plans.length > 0) {
    for (const record of currentSeeker.seeker_plans) {
      // console.log(record.plans,'plan');
      if (record._id != '' && record.status == 0 && !record.hold) {
        const updatedSeekerPlanStatus = await Seeker.findByIdAndUpdate(
          seeker,
          {
            $set: {
              'seeker_plans.$[elem].status': 1
            },
          },
          {
            arrayFilters: [{ 'elem._id': record._id }],
            new: true, // Return the modified document rather than the original
          },
        );
      }
    }
  }
}