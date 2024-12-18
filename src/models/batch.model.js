const mongoose = require('mongoose');
const validator = require('validator');

const batchSchema = new mongoose.Schema({

  seeker:{
    type: mongoose.Schema.ObjectId,
    ref: 'Seeker',
    required: [true, 'seeker is missing'],
  },
  company: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'company is missing'],
  },
  plan :{
    type: mongoose.Schema.ObjectId,
    required: [true, 'plan is missing'],
  },
  iso:{
    type:String,
    required: [true, 'iso is missing'],
  }
});

// firmSchema.pre(/^find/, function (next) {
//   this.find({ active: true });
//   next();
// });

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;
