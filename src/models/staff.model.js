const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const staffCoutryResSchema = new mongoose.Schema(
  {
    country: {
      type: mongoose.Schema.ObjectId,
      ref: 'Country',
    },
    status: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Date,
      default: Date.now,
    },
    inactive: {
      type: Date,
    },
    addedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Staff',
      required: [true, 'added by user is missing'],
    },
  },
  { _id: true },
);

const staffSchema = new mongoose.Schema({
  staffid: {
    type: String,
    unique: true,
    required: [true, 'Please enter staffid'],
  },
  name: {
    type: String,
    required: [true, 'Please enter name'],
  },
  email: {
    type: String,
    unique: true,
    validator: [validator.isEmail, 'Please enter a valid email'],
    required: [true, 'Please enter email'],
  },
  designation: {
    type: mongoose.Schema.ObjectId,
    ref: 'Designation',
  },
  nationality: {
    type: mongoose.Schema.ObjectId,
    ref: 'Country',
  },

  contact: {
    type: Number,
  },
  password: {
    type: String,
    minLength: 8,
  },
  passwordConfirm: {
    type: String,
    validate: {
      validator: function (el) {
        return el === this.password;
      },
    },
    message: "Password doesn't match",
  },
  status: {
    type: String,
    enum: ['unverified', 'verified'],
    default: 'unverified',
  },
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Staff',
    required: [true, 'added by user is missing'],
  },
  gender: {
    type: mongoose.Schema.ObjectId,
    ref: 'Gender',
  },
  dob: Date,
  location: String,
  address: String,
  is_active: {
    type: Boolean,
    default: false,
  },
  passwordResetToken: String,
  tokenExpires: Date,
  joining_date: Date,
  termination_date: Date,
  whatsapp: Number,
  country_restriction: [staffCoutryResSchema],
});

staffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// staffSchema.pre('save', function (next) {
//   if (!this.isModified('designation') || this.isNew) return next();
// });

// staffSchema.pre(/^find/, function (next) {
//   this.find({ status: { $ne: 'unverified' } });
//   next();
// });

staffSchema.methods.comparePassword = async function (
  candidatePassword,
  staffPassword,
) {
  return await bcrypt.compare(candidatePassword, staffPassword);
};

staffSchema.methods.createToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.tokenExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
