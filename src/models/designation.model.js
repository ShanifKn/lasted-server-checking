const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  name_ar: {
    type: String,
    unique: true,
  },
  des: {
    type: String,
  },
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Staff',
  },
  active: {
    type: Boolean,
    default: false,
  },
  accessType: {
    type: Number,
    enum: [1,2,3,4,5,6],
    required: [true, 'Please add role'],
  }
},{timestamps:true});

const Designation = mongoose.model('Designation', designationSchema);

module.exports = Designation;
