const Staff = require('../models/staff.model');
const AppError = require('../utils/app-error.utils');
const emailTemp = require('../utils/email-template.utils');
const catchAsync = require('../utils/catchasync.utlils');
const APIFeatures = require('../utils/api-features.utils');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const sendgrid = require('../utils/send-grid.utils');
const Level = require('../models/levels.model');
const Menu = require('../models/menus.model');
const messageController = require('../controllers/message.controller');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getProfile = catchAsync(async (req, res, next) => {
  const staff = await Staff.findById(req.staff.id);
  if (!staff) {
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

  res.status(200).json({
    message: 'success',
    data: staff,
  });
});

exports.getAllStaff = catchAsync(async (req, res, next) => {
  const staffData = await Staff.find();

  const features = new APIFeatures(
    Staff.find().populate('designation', 'name'),
    req.query,
  )
    .filter()
    .sort()
    .fields()
    .paginate();

  const allStaffs = await features.query;
  res.status(200).json({
    status: 'success',
    results: allStaffs.length,
    total: staffData.length,
    data: {
      staffs: allStaffs,
    },
  });
});

exports.getStaffById = catchAsync(async (req, res, next) => {
  const staff = await Staff.findById(req.params.id)
    .populate('designation', 'name')
    .populate('gender', 'name')
    .populate('nationality', 'nicename')
    .populate('addedBy', 'name')
    .populate('country_restriction.country', 'nicename');
  if (!staff) {
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
    data: staff,
  });
});

exports.dashboard = catchAsync(async (req, res, next) => {
  const accessType = req.staff.designation.accessType; // Assuming accessType is part of staff designation
  let dashboardData = {};
  let menusArr = [];

  if (accessType) {
    // Fetch level details for the current access type
    const levelDetails = await Level.find({ level: accessType });
    if (levelDetails && levelDetails.length > 0) {
      const permissions = levelDetails[0].permissions;

      // Process menus and their submenus
      const menuPromises = permissions.map(async (menu) => {
        const menuLevel = await Menu.findById(menu.name);

        // Process submenus and their buttons
        const submenusArr = await Promise.all(
          menu.submenus.map(async (submenu) => {
            const submenuLevel = await Menu.findById(submenu.name);

            // Process buttons within submenus
            const buttonsArr = await Promise.all(
              submenu.buttons.map(async (button) => {
                const buttonDetails = await Menu.findById(button.name);
                return {
                  id: buttonDetails._id, 
                  name: buttonDetails.name, 
                  label: buttonDetails.display_name,
                  accessLevel: button.access || false, 
                };
              }),
            );

            return {
              id: submenuLevel._id, 
              name: submenuLevel.name, 
              route:submenuLevel.route_name,
              label: submenuLevel.display_name,
              accessLevel: submenu.access || false,
              buttons: buttonsArr, 
            };
          }),
        );

        return {
          id: menuLevel._id, 
          name: menuLevel.name, 
          route:menuLevel.route_name,
          label: menuLevel.display_name,
          accessLevel: menu.access || false,
          submenus: submenusArr, 
        };
      });

      // Wait for all menus to be processed
      menusArr = await Promise.all(menuPromises);

      // Prepare dashboard data
      dashboardData = {
        role: levelDetails[0].name, // Role name
        menus: menusArr, // Processed menus
      };
    }
  }

  // Send response
  res.status(200).json({
    message: 'success',
    data: dashboardData,
  });
});

exports.staffUpdate = catchAsync(async (req, res, next) => {
  try {
    const staffId = req.params.staffId;
    //console.log(staffId,"req.params.staffId ");
    if (staffId == ':staffId') {
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

    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1022',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }

    const filteredBody = filterObj(
      req.body,
      'name',
      'address',
      'contact',
      'designation',
      'dob',
      'gender',
      'joining_date',
      'nationality',
      'termination_date',
      'whatsapp',
      'location',
      'is_active',
      'country_restriction',
      'addedBy',
      'status',
    );

    if (
      filteredBody.country_restriction &&
      Array.isArray(filteredBody.country_restriction)
    ) {
      filteredBody.country_restriction = filteredBody.country_restriction.map(
        (item) => ({
          country: item,
          addedBy: filteredBody.addedBy,
        }),
      );
    }
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.staffId,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: 'success',
      data: {
        updatedStaff,
      },
    });
  } catch (err) {
    console.log(err);
  }
});

// exports.deleteStaff = catchAsync(async (req, res, next) => {
//   await Staff.findByIdAndUpdate(req.staff.id, {
//     is_active: false,
//     status: 'unverified',
//   });

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

exports.addCountryRes = catchAsync(async (req, res, next) => {
  try {
    const { country } = req.body;
    let countryResStaffId = req.params.countryResStaffId;
    if (countryResStaffId == ':countryResStaffId') {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1059',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }
    if (!country) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1059',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }
    const staff = await Staff.findById(countryResStaffId);
    if (!staff) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1059',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }
    let addition = true;
    // console.log(staff.country_restriction,"staff");
    staff.country_restriction.forEach((el) => {
      if (el.country.toString() === country && el.status === true) {
        addition = false;
        return;
      }
    });

    if (!addition) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1059',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }
    const addCountryResStaff = await Staff.findByIdAndUpdate(
      req.staff.id,
      {
        $push: {
          country_restriction: { country: country, addedBy: req.staff.id },
        },
      },
      { new: true },
    );

    res.status(200).json({
      status: 'success',
      message: 'Successfully created',
    });
  } catch (err) {
    console.log(err);
  }
});

exports.updateCountryRes = catchAsync(async (req, res, next) => {
  try {
    const { countryResId, inactive } = req.body;

    let countryResStaffId = req.params.countryResStaffId;

    if (countryResStaffId == ':countryResStaffId') {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1059',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }
    if (!countryResId) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1059',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }
    console.log(countryResStaffId, 'countryResStaffId');
    const staff = await Staff.findById(countryResStaffId);
    if (!staff) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1059',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }

    // console.log(staff);
    if (staff.country_restriction.length > 0) {
      for (const ele of staff.country_restriction) {
        if (ele._id.toString() === countryResId && !ele.inactive) {
          const updatedCountryResStaff = await Staff.findByIdAndUpdate(
            countryResStaffId,
            {
              $set: {
                'country_restriction.$[elem].status': false,
                'country_restriction.$[elem].inactive': inactive,
              },
            },
            {
              arrayFilters: [{ 'elem._id': countryResId }],
              new: true, // Return the modified document rather than the original
            },
          );
        }
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Successfully updated',
    });
  } catch (err) {
    console.log(err);
  }
});

/*
exports.addPlan = catchAsync(async (req, res, next) => {
  const { planId} = req.body;
  if (!planId) {
      return next(new AppError(await msgCode.getMessage('MSG1005',req.headers['accept-language']), 400,2001));
  }
  if(ObjectID.isValid(req.plan))
  {
      return next(new AppError(await msgCode.getMessage('MSG1031',req.headers['accept-language']), 400,2001));
  }
  const seeker = await Seeker.findOne({'_id':req.seeker._id}).lean();
  const plan = await Plan.findOne({'_id':planId}).lean();
  if((seeker._id.toString()==req.seeker._id) && seeker.status && plan)
  {
      
      const updatedPlnSeeker = await Seeker.findByIdAndUpdate(
          seeker._id,
          {
              $push: { "seeker_plans": {plan: planId} }
          },
          { new: true }
      );
      
      if (updatedPlnSeeker) {
          
          sendgrid.sendMailSeekerAddPlan(seeker.email);
          return true;
      }
  }
  else
  {
      return false;
  }
});


*/
