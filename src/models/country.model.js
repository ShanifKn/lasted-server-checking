const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  iso:
  {
    type: String,
    unique:true,
    required: [true, 'Nicename is missing'],
  },
  iso3:
  {
    type: String,
    unique:true,
    required: [true, 'Nicename is missing'],
  },
  nicename:
  {
    type: String,
    unique:true,
    required: [true, 'Nicename is missing'],
  },
  nicename_ar:
  {
    type: String,
    unique:true,
    required: [true, 'Nicename is missing'],
  },
  numcode:
  {
    type: Number,
    required: [true, 'Numbcode is missing'],
  },
  phonecode:
  {
    type: Number,
    required: [true, 'Phonecode is missing'],
  },
  currency:
  {
    type: String,
    required: [true, 'Currency is missing'],
  },
  apply_country:
  {
    type: Boolean,
    default: false,
  },
  colname:
  {
    type: String,
  },
  logname:
  {
    type: String,
  },
  loghistoryname:
  {
    type: String,
  },
  active:
  {
    type:Boolean,
    default: false
  },
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Staff',
    required: [true, 'added by user is missing'],
  },

});

const Country = mongoose.model('Country', countrySchema);

module.exports = Country;
