const mongoose = require('mongoose');
mongoose.pluralize(null);
const Schema = mongoose.Schema;

const companySchema = new Schema({
    email:
    {
      type: String,
      required: [true, 'email is required'],
      unique: true,
    },
    comp_name:
    {
        type: String,
        required: [true, 'email is required'],
    },
    comp_name_ar:
    {
        type: String
    },
    active:
    {
        type: Boolean,
        default:false
    },
    pending:
    {
        type: Boolean,
        default:true
    },
    addedBy:
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Staff',
      required: [true, 'added by user is missing'],
    },
    location:
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Location',
      required: [true, 'location user is missing'],
    },
    industry:
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Industry',
      required: [true, 'Industry user is missing'],
    },
    category:
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Category user is missing'],
    },
    inactive_status: {
      status: {
        type: Number,
        enum: [0, 1, 2], //0->Reject 1->Remove 2->Unsubscribe
      },
      reason: {
        type: String,
      },
      date: {
        type: Date,
      },
    },
}, { timestamps: true }
);

// Define models for each company
const CompanyAE = mongoose.model('CompanyAE', companySchema);
const CompanyQA = mongoose.model('CompanyQA', companySchema);
const CompanySA = mongoose.model('CompanySA', companySchema);
/*
const CompanyA = Company.discriminator('company_ae', new Schema({}));
const CompanyB = Company.discriminator('company_qa', new Schema({}));
const CompanyC = Company.discriminator('company_sa', new Schema({}));
*/

module.exports = { CompanyAE,CompanyQA,CompanySA};


/*
const mongoose = require('mongoose');
const validator = require('validator');

const firmSchema = new mongoose.Schema({
  industry: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Industry',
  },
  email: {
    type: String,
    required: [true, 'Please enter email'],
    unique: true,
    validator: [validator.isEmail, 'Please enter a valid email'],
  },
  location: {
    type: mongoose.Schema.ObjectId,
    ref: 'Location',
    country: {
      type: mongoose.Schema.ObjectId,
      ref: 'Country',
    },
  },
  category: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Category',
  },
  by_staff: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Staff',
  },
  firmName: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    required: true,
    default: false,
  },
});

// firmSchema.pre(/^find/, function (next) {
//   this.find({ active: true });
//   next();
// });

const Firm = mongoose.model('Firm', firmSchema);

module.exports = Firm;
*/