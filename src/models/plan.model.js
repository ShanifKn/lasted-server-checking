const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'amount is missing'],
  },
  name: {
    type: String,
    unique:true,
    required: [true, 'plan is missing'],
  },
  description:{
    type:String,
    required: [true, 'description is missing'],
  },
  name_ar: {
    type: String,
    unique:true,
    required: [true, 'plan is missing'],
  },
  total_limit: {
    type: Number,
    required: [true, 'total limit is missing'],
  },
  type: {
    type: String,
    required: [true, 'type is missing'],
    enum: ['Live', 'Gift'],
  },
  quota_limit:{
    type:Number,
    required: [true, 'quota limit is missing'],
  },
  iso: {
    type: mongoose.Schema.ObjectId,
    ref: 'Country',
    required: [true, 'iso is missing'],
  },
  color_button:{
    type:String
  },
  color_card:{
    type:String
  },
  active: {
    type: Boolean,
    default: true,
  },
  paymentMode:{
    type:String,
    enum:['Online','Offline'],
    required: [true, 'mode of payment is missing'],
  },
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Staff',
    required: [true, 'added by user is missing'],
  },
},{ timestamps: true });

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
