const mongoose = require('mongoose');

const cronJobSchema = new mongoose.Schema({
  timestart: {
    type: String,
    required: [true, 'timestart is missing'],
  },
  name:{
    type:String,
    required: [true, 'name is missing'],
  },
  timeend: {
    type: String,
  },
  buffercount: {
    type: Number,
  },
  description:{
    type:String
  },
  bufferduration:{
    type:String
  },
  daysexception: [
    {
      name: {
        type: String
      },
      day:{
        type :Number,
        enum: [0, 1, 2, 3, 4, 5, 6]
      },
      active:
      {
        type:Boolean,
        default:true
      }
    },{ _id: false ,timestamps:true}
  ],
  poolnames: [
    {
      name: {
        type: String
      },
      ip:{
        type :String
      },
      active:
      {
        type:Boolean,
        default:false
      }
    },{ _id: false ,timestamps:true}
  ],
  active:{
    type:Boolean,
    defualt:false
  }
});

const CronJob = mongoose.model('CronJob', cronJobSchema);

module.exports = CronJob;