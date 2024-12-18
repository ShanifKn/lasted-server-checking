const mongoose = require('mongoose');

const industrySchema = new mongoose.Schema({
  name: {
    type: String,
    unique:true,
    required: [true, 'A name is required'],
  },
  name_ar: {
    type: String,
    unique:true,
    required: [true, 'A name in arabic is required'],
  },
  access_to: {
    type: Boolean,
    default: true,
  },
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Staff',
    required: [true, 'added by user is missing'],
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const Industry = mongoose.model('Industry', industrySchema);

module.exports = Industry;
