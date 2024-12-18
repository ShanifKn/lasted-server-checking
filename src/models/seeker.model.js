const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;

const drivingLicenseSchema = new Schema(
  {
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
    },
  },
  { _id: false },
);

const languageSchema = new Schema(
  {
    language: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language',
    },
  },
  { _id: false },
);

const keywordSchema = new Schema(
  {
    keyword: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    },
  },
  { _id: false },
);

const seekerDocSchema = new mongoose.Schema(
  {
    type: {
      type: mongoose.Schema.ObjectId,
      ref: 'DocumentType',
      unique: true,
      required: [true, 'Document Type is required'],
    },
    path: {
      type: String,
      unique: true,
      required: [true, 'Path is required'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const seeker_planSchema = new mongoose.Schema(
  {
    plan: {
      type: mongoose.Schema.ObjectId,
      ref: 'Plan',
    },
    country: {
      type: mongoose.Schema.ObjectId,
      ref: 'Country',
    },
    status: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5], 
      /* 0-->Paid (to be done pg api), 
      1-->Submitted (done : Seeker Update Priority) 
      2-->Started (done cron job : enQueueCronJob()) 
      3-->Activated (done cron job: consumeCronJob()) 
      4-->Completed (done cron job : planSentCountCronJob())  
      5-->Cancelled*/
      default: 0,
    },
    
    activated_on: {
      type: Date,
      default: Date.now,
    },
    finished_on: {
      type: Date,
    },
    hold: {
      type: Boolean,
      default: false,
    },
    skip_queue: {
      type: Boolean,
      default: false,
    },
    payment_mode: {
      type: String,
      enum: ['Cash', 'Card', 'Gift'],
      default: 'Cash',
    },
  },
  { _id: true },
);

const excludeCompSchema = new Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'excludedCompanies',
    },
  },
  { _id: false },
);

const seeker_industrySchema = new Schema(
  {
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Industry',
    },
  },
  { _id: false },
);

const seeker_locationSchema = new Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
  },
  { _id: false },
);

const admin_industrySchema = new Schema(
  {
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Industry',
    },
  },
  { _id: false },
);

const admin_locationSchema = new Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
  },
  { _id: false },
);

const seekerSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: function () {
        return this.otp_status === true;
      },
    },
    name: {
      first_name: {
        type: String,
        required: [true, 'first name is required'],
      },
      last_name: {
        type: String,
        required: [true, 'last name is required'],
      },
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      validator: [validator.isEmail, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      validate(value) {
        if (value.length < 8) {
          throw new Error('Password should be atleast 8 characters');
        }
      },
    },
    is_active: {
      type: Boolean,
      required: [true, 'active status is required'],
      default: true,
    },
    otp: {
      number: {
        type: Number,
      },
      status: {
        type: Boolean,
        default: false,
      },
    },
    cover_letter: {
      type: String,
      required: [true, 'cover letter is required'],
    },
    apply_country: {
      type: mongoose.Schema.ObjectId,
      ref: 'Country',
    },

    total_exp: {
      month: {
        type: Number,
      },
      year: {
        type: Number,
      },
    },
    expect_salary: {
      start: {
        type: Number,
      },
      end: {
        type: Number,
      },
    },
    gender: {
      type: mongoose.Schema.ObjectId,
      ref: 'Gender',
    },
    residing_country: {
      type: mongoose.Schema.ObjectId,
      ref: 'Country',
    },
    visa_status: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VisaStatus',
    },
    visa_validity: {
      type: Date,
    },
    contact: {
      type:String
    },
    looking: {
      type: String,
    },
    currency: {
      type: String,
    },
    registration_date:
    {
      type:Date
    },
    date_of_birth: {
      type: Date,
    },
    marital_status: {
      type: String,
      enum: ['Single', 'Married', 'Divorced', 'Separated', 'Widowed'],
    },
    nationality: {
      type: mongoose.Schema.ObjectId,
      ref: 'Country',
    },
    notice_period: {
      type: Number,
    },
    permission_cl: {
      type: Boolean,
      default: true,
    },
    seeker_industries: [seeker_industrySchema],
    seeker_location: [seeker_locationSchema],
    admin_industries: [admin_industrySchema],
    admin_location: [admin_locationSchema],
    seeker_plans: [seeker_planSchema],
    languages_known: [languageSchema],
    exclude_companies: [excludeCompSchema],
    seeker_documents: [seekerDocSchema],
    seeker_keywords: [keywordSchema],
    driving_license: [drivingLicenseSchema],
    priority: {
      high: {
        type: Number,
      },
      medium: {
        type: Number,
      },
      low: {
        type: Number,
      },
    },
  },
  { timestamps: true },
);

seekerSchema.pre(/^find/, function (next) {
  this.find({
    $and: [
      { status: { $ne: 'notverified' } },
      { active: { $ne: false } },
      { first_name: { $ne: '' } },
    ],
  });
  next();
});

seekerSchema.virtual('excludedCompanies', {
  ref: function () {
    // Determine the collection based on apply_country
    if (this.apply_country === '6337f7aafe05a7d9f4e7b016') {
      return 'CompanyAE';
    } else if (this.apply_country === '6337f7aafe05a7d9f4e7b0c2') {
      return 'CompanyQA';
    } else if (this.apply_country === '6337f7aafe05a7d9f4e7b0cf') {
      return 'CompanySA';
    } else {
      return null; // Return null if apply_country does not match any condition
    }
  },
  localField: '_id',
  foreignField: 'exclude_companies.company',
  justOne: false,
});

const Seeker = mongoose.model('Seeker', seekerSchema);

module.exports = Seeker;
