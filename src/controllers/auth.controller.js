const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const catchAsync = require('../utils/catchasync.utlils');
const Staff = require('../models/staff.model');
const AppError = require('../utils/app-error.utils');
const sendEmail = require('../utils/email-generation.util');
const regex = require('../utils/regex');
const PasswordReset = require('../models/reset.model');
const Level = require('../models/levels.model');
const Menu = require('../models/menus.model');
const sendgrid = require('../utils/send-grid.utils');
const messageController = require('../controllers/message.controller');
const Country = require('../models/country.model');
const Designation = require('../models/designation.model');
const Gender = require('../models/gender.model');

const jwtSign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '90d',
  });

exports.addStaff = catchAsync(async (req, res, next) => {
  try {
    const { email, name, password, addedBy, contact } = req.body;
    const encPass = await bcrypt.hash(password, 12);
    if (!email || !name || !password || !addedBy || !contact) {
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
    let codeGen = '';
    try {
      const sortOptions = { staffid: -1 };
      const staffUpd = await Staff.find().sort(sortOptions);
      var arr = [];
      if (staffUpd.length > 0) {
        staffUpd.forEach(async (e) => {
          if (e.staffid != undefined) {
            const lastDigitMatch = e.staffid.match(/\d/g);
            const digits = lastDigitMatch.join('');
            arr.push(parseInt(digits));
          }
        });

        arr.sort(function (a, b) {
          return b - a; // Sort in descending order
        });
        const nextDigit = (arr[0] + 1).toString().padStart(1, '0');
        codeGen = 'BS' + nextDigit;
      }
    } catch (error) {
      codeGen = '';
    }
    const newStaff = await Staff.create({
      staffid: codeGen,
      name,
      email,
      contact: contact,
      password: encPass,
      addedBy,
      is_active: true,
    });
    const token = jwtSign(newStaff._id);
    let content = `<table border='0' cellspacing='0' cellpadding='0' width='100%' style='color:#44546A;'>
    <tbody>
    <tr>
    <td width='460'>
    <h1 style='font-family: Arial, Helvetica, sans-serif;font-weight:normal'>
    Admin Portal Registration Initiated
    </h1>
    </td>
    </tr>
    <tr>
    <td width='460'>
    <p>
    <strong>
    Dear ${name},
    </strong>
    </p>
    <p>
    We’re pleased to inform you that your registration in our admin portal has been initiated. Below are your login credentials:
    </p>
      <p>
      Username: ${email}<br/>
      Password: ${password}<br/>
      Admin Panel Link: admin.bathool.com<br/>
      </p>
      <p>
      Please note that you will not yet be able to access the portal. Once we complete your registration, we’ll send a confirmation email. At that time, you may log in and begin using the system.
      </p>
      <p>
      Thank you for your patience and cooperation.
      </p>
      <p>
      Regards,
      </p>
      <p style='color:#00622A;font-size:16px;'>Team Bathool
      </p>
      </td>
      </tr>
      </tbody>
      </table>`;

    const emailObject = {
      email: email,
      fullContent: content,
      subject: 'Admin Portal Registration Initiated',
    };
    const sendEmailStaff = await sendgrid.sendMailStaff(emailObject);
    res.status(200).json({
      status: 'success',
      token,
      data: {},
    });
  } catch (err) {
    console.log(err);
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1048',
          req.headers['accept-language'],
        ),
        404,
      ),
    );
  }
  const user = await Staff.findOne({ email });
  if (!user) {
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
  if (!(await bcrypt.compare(password, user.password))) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1001',
          req.headers['accept-language'],
        ),
        401,
      ),
    );
  }
  const token = jwtSign(user._id);

  res.status(200).json({
    status: 'success',
    token,
    user: user._id,
  });
});

exports.protectRoute = catchAsync(async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer')
  ) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1049',
          req.headers['accept-language'],
        ),
        401,
      ),
    );
  }
  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1050',
          req.headers['accept-language'],
        ),
        401,
      ),
    );
  }

  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  if (!decode) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1050',
          req.headers['accept-language'],
        ),
        401,
      ),
    );
  }

  const currentStaff = await Staff.findById(decode.id)
    .populate('designation')
    .exec();
  currentStaff.accessType = currentStaff.designation.accessType;
  // console.log(currentStaff.designation.accessType,"accesstype");
  await currentStaff.save({ validateBeforeSave: false });

  if (!currentStaff) {
    return next(
      new AppError(
        await messageController.getMessage(
          'MSG1052',
          req.headers['accept-language'],
        ),
        401,
      ),
    );
  }
  req.staff = currentStaff;

  // if (currentStaff.isModified('designation.accessType')) {
  //   req.staff.accessType = currentStaff.designation.accessType;
  //   await req.staff.save({ validateBeforeSave: false });
  // }

  next();
});

const authorize = (requiredAccessType) => {
  return (req, res, next) => {
    // Assuming user's designation and accessType is already in req.user (after authentication)
    const userAccessType = req.user.accessType;

    // Check if user's access type meets the required level
    if (userAccessType >= requiredAccessType) {
      next(); // Access granted
    } else {
      res.status(403).json({ message: 'Access Denied' });
    }
  };
};

exports.restrictTo = (accessType) => {
  return (req, res, next) => {
    const staffAccessType = req.staff.accessType;

    if (staffAccessType >= accessType) {
      next(); // Access granted
    } else {
      return next(new AppError('Access Denied', 403));
    }
  };
};

exports.resetPassword = catchAsync(async (req, res, next) => {
  try {
    const getUser = await PasswordReset.findOne({
      token: req.params.token,
    }).lean();
    //console.log(getUser,"staff");
    if (!getUser) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1050',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }
    if (req.body.password != req.body.passwordConfirm) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1053',
            req.headers['accept-language'],
          ),
          400,
        ),
      );
    }
    const currentStaff = await Staff.findById(getUser.userId);
    currentStaff.password = req.body.password;
    currentStaff.passwordConfirm = undefined;
    await currentStaff.save();
    let content = `<table border='0' cellspacing='0' cellpadding='0' width='100%' style='color:#44546A;'>
    <tbody>
    <tr>
    <td width='460'>
    <h1 style='font-family: Arial, Helvetica, sans-serif;font-weight:normal'>
    Password reset succesfully
    </h1>
    </td>
    </tr>
    <tr>
    <td width='460'>
    <p>
    <strong>
    Dear Staff,
    </strong>
    </p>
    <p>
    Your password of Bathool for Business has been successfully reset.
    </p>
      <p>
      If you did not initiate this request, you can confidently disregard and delete this email. 
      </p>
      <p>
      Regards,
      </p>
      <p style='color:#00622A;font-size:16px;'>Bathool
      </p>
      </td>
      </tr>
      </tbody>
      </table>`;

    const emailObject = {
      email: currentStaff.email,
      fullContent: content,
      subject: 'Reset Password',
    };
    const sendEmailStaff = await sendgrid.sendMailStaff(emailObject);
    res.status(200).json({
      status: 'success',
    });
  } catch (err) {
    console.log(err);
  }
});

exports.changePassword = catchAsync(async (req, res, next) => {
  try {
    const currentStaff = await Staff.findById(req.staff.id);
    if (
      !(await currentStaff.comparePassword(
        req.body.oldPassword,
        currentStaff.password,
      ))
    ) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1001',
            req.headers['accept-language'],
          ),
          401,
        ),
      );
    }

    currentStaff.password = req.body.newPassword;
    currentStaff.passwordConfirm = undefined;
    await currentStaff.save();

    const token = jwtSign(currentStaff.id);
    let content = `<table border='0' cellspacing='0' cellpadding='0' width='100%' style='color:#44546A;'>
    <tbody>
    <tr>
    <td width='460'>
    <h1 style='font-family: Arial, Helvetica, sans-serif;font-weight:normal'>
    Password changed succesfully
    </h1>
    </td>
    </tr>
    <tr>
    <td width='460'>
    <p>
    <strong>
    Dear Staff,
    </strong>
    </p>
    <p>
    Your password of Bathool for Business has been successfully changed.
    </p>
      <p>
      If you did not initiate this request, you can confidently disregard and delete this email. 
      </p>
      <p>
      Regards,
      </p>
      <p style='color:#00622A;font-size:16px;'>Bathool
      </p>
      </td>
      </tr>
      </tbody>
      </table>`;

    const emailObject = {
      email: currentStaff.email,
      fullContent: content,
      subject: 'Change Password',
    };
    const sendEmailStaff = await sendgrid.sendMailStaff(emailObject);
    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    console.log(err);
  }
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  try {
    if (!req.body.email) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1009',
            req.headers['accept-language'],
          ),
          401,
        ),
      );
    }
    if (!regex.validateEmail(req.body.email)) {
      return next(
        new AppError(
          await messageController.getMessage(
            'MSG1009',
            req.headers['accept-language'],
          ),
          401,
        ),
      );
    }
    if (regex.validateEmail(req.body.email)) {
      const user = await Staff.findOne({ email: req.body.email }).lean();
      if (!user) {
        return next(
          new AppError(
            await messageController.getMessage(
              'MSG1003',
              req.headers['accept-language'],
            ),
            401,
          ),
        );
      }
      if (user) {
        const token = jwtSign(user._id);
        if (token) {
          const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
          const passwordResetUser = await PasswordReset.findOne({
            userId: user._id,
          }).lean();
          if (!passwordResetUser) {
            const passwordReset = new PasswordReset({
              userId: user._id,
              token: hashedToken,
            });
            await passwordReset.save();
          } else {
            const updatedUser = await PasswordReset.findOneAndUpdate(
              { userId: user._id }, // Search criteria
              { $set: { token: hashedToken } }, // Update fields
              { new: true, useFindAndModify: false }, // Options: return updated doc
            );
          }

          let content =
            `<table border='0' cellspacing='0' cellpadding='0' width='100%' style='color:#44546A;'>
            <tbody>
            <tr>
            <td width='460'>
            <h1 style='font-family: Arial, Helvetica, sans-serif;font-weight:normal'>
            Forgot your password?
            </h1>
            </td>
            </tr>
            <tr>
            <td width='460'>
            <p>
            <strong>
            Dear Staff,
            </strong>
            </p>
            <p>
            Kindly use the below link to reset your bathool bussiness password. 
            <p>
            <a href="http://localhost:4200/account/password-rest/` +
            hashedToken +
            `">Reset My Password</a>
            </p>
            </p>
             <p>
             If you did not initiate this request, you can confidently disregard and delete this email. 
             </p>
             <p>
             Regards,
             </p>
             <p style='color:#00622A;font-size:16px;'>Bathool
             </p>
             </td>
             </tr>
             </tbody>
             </table>`;

          const emailObject = {
            email: user.email,
            fullContent: content,
            subject: 'Forgot Password',
          };

          const sendEmailStaff = await sendgrid.sendMailStaff(emailObject);

          // const updatedUser = await Staff.findOneAndUpdate(
          //   { email: user.email },               // Search criteria
          //   { $set: { passwordResetToken: hashedToken} },  // Update fields
          //   { new: true, useFindAndModify: false }     // Options: return updated doc
          // );
          res.status(200).json({
            status: 200,
            message:
              'A password reset link has already been sent to your email.',
          });
        } else {
          return next(
            new AppError(
              await messageController.getMessage(
                'MSG1023',
                req.headers['accept-language'],
              ),
              500,
            ),
          );
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
});

exports.searchStaff = catchAsync(async (req, res, next) => {
  try {
    const {
      email,
      status,
      is_active,
      country_restriction,
      contact,
      whatsapp,
      location,
      name,
      staffid,
      designation,
      nationality,
      gender,
    } = req.body;
    const query = {};

    // Apply filters for email, status, and is_active fields
    if (email) {
      query.email = { $regex: email, $options: 'i' }; // Case-insensitive email search
    }
    if (status) {
      query.status = { $regex: status, $options: 'i' }; // Case-insensitive status search
    }
    if (is_active !== undefined) {
      query.is_active = is_active; // true or false based on user input
    }
    if (contact) {
      query.contact = contact;
    }
    if (whatsapp) {
      query.whatsapp = whatsapp;
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' }; // Case-insensitive email search
    }
    if (name) {
      query.name = { $regex: name, $options: 'i' }; // Case-insensitive email search
    }
    if (staffid) {
      query.staffid = { $regex: `^${staffid}$`, $options: 'i' }; // Case-insensitive email search
    }

    if (country_restriction && country_restriction.length > 0) {
      // Create an array of regex queries for each country name in country_restriction
      const regexQueries = country_restriction.map((country) => ({
        nicename: { $regex: `^${country}$`, $options: 'i' },
      }));

      // Find countries that match any of the regex conditions
      const countries = await Country.find({ $or: regexQueries }).select('_id');

      const countryIdsFromNames = countries.map((country) => country._id);

      if (countryIdsFromNames.length > 0) {
        query['country_restriction.country'] = { $in: countryIdsFromNames };
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

    if (designation) {
      const designationData = await Designation.findOne({
        name: { $regex: `^${designation}$`, $options: 'i' },
      }).select('_id');
      if (designationData) {
        query.designation = designationData._id;
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

    if (nationality) {
      const nationalityData = await Country.findOne({
        nicename: { $regex: `^${nationality}$`, $options: 'i' },
      }).select('_id');
      if (nationalityData) {
        query.nationality = nationalityData._id;
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

    if (gender) {
      const genderData = await Gender.findOne({
        name: { $regex: `^${gender}$`, $options: 'i' },
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

    // Search staff with the constructed query and populate country_restriction
    const searchStaff = await Staff.find(query).populate('designation', 'name');

    // Check if no staff matches the query
    if (searchStaff.length === 0) {
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
    const staffs = searchStaff;
    res.status(200).json({
      status: 'success',
      data: { staffs },
    });
  } catch (err) {
    console.error(err);
    return next(
      new AppError('Something went wrong while searching staff.', 500),
    );
  }
});
