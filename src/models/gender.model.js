const mongoose = require('mongoose');

const genderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'gender name is missing'],
    },
    name_ar: {
      type: String,
      unique: true,
      required: [true, 'gender name is missing'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Gender = mongoose.model('Gender', genderSchema);

module.exports = Gender;

