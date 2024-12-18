const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const readSchema = new Schema({
  staff: {
    type: Schema.Types.ObjectId,
    ref: 'Staff'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false  // Disables automatic _id creation for subdocuments
});

const notificationSchema = new mongoose.Schema({
  name: String,
  message:String,
  priority: String,
  designation: {
    type: mongoose.Schema.ObjectId,
    ref: 'Designation',
  },
  type:{
    type: String,
    enum: ['admin', 'seeker'],
    default: 'admin',
  },
  active: Boolean,
  read: [readSchema],
},{timestamps:true});

const Notifications = mongoose.model('StaffNotification', notificationSchema);

module.exports = Notifications;