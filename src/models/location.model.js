const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter name'],
  },
  name_ar: {
    type: String,
    required: [true, 'Please enter name in arabic'],
  },
  state: String,
  country: {
    type: mongoose.Schema.ObjectId,
    ref: 'Country',
  },
  addedBy:{
    type: mongoose.Schema.ObjectId,
    ref: 'Staff',
  },
  active: {
    type: Boolean,
    default: false,
  },
});

locationSchema.index({ name: 1, country: 1 }, { unique: true });
locationSchema.index({ name_ar: 1, country: 1 }, { unique: true });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
