const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

  code:{
    type: String,
    required: [true, 'code is missing'],
  },
  msg_en: {
    type: String,
    required: [true, 'message in english is missing'],
  },

  msg_ar: {
    type: String,
    required: [true, 'message in arabic is missing'],
  },
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Staff',
    required: [true, 'added by user is missing'],
  },
  
},{ timestamps: true });

const Message = mongoose.model('Messages', messageSchema);

module.exports = Message;
