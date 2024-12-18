const mongoose = require('mongoose');

const seekerDocSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'document name is missing'],
    },
    extensions:{
      type :[String],
      required: [true, 'extension is missing'],
      validate: {
        validator: function(array) {
          const allowedExtensions = ['.jpg', '.png', '.jpeg', '.pdf', '.doc', '.docx', '.mp4', '.mov', '.wmv', '.flv', '.webm', 'mkv'];
          // Check if every element in the array is in the allowed extensions
          return array.every(ext => allowedExtensions.includes(ext));
        },
        message: 'Invalid file extension'
      }
    },
    sizeLimitKB:
    {
      type:Number,
      required: [true, 'size is missing'],
    },
    code:
    {
      type : String,
      unique:true,
      required: [true, 'code is missing']
    },
    active:
    {
      type:Boolean,
      defualt:true
    },
    contentType:
    {
      type :String
    }
  },{ timestamps:true});
  
const DocumentType = mongoose.model('DocumentType', seekerDocSchema);

module.exports = DocumentType;