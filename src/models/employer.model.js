const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: [true, 'Company should have a name'],
  },
  organizationType: {
    type: String,
    required: [true, 'Company should have a email'],
    unique: true,
  },
  addressLocality: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Company should have a location'],
  },
  addressCountry: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Company should have a location'],
  },
  website: {
    type: String,
    required: [true, 'Company should have a website'],
  },
  socialAccount: {
    type: Array,
    required: true,
  },
});

const Employer = mongoose.model('Employer', employerSchema);

module.exports = Employer;
