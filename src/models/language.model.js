const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
    name:
    {
        type: String,
        unique:true,
        required: [true, 'language name is missing']
    },
    name_ar:
    {
        type: String,
        unique:true,
        required: [true, 'language name is missing'],
    },
    active:
    {
        type: Boolean,
        default:true
    }
  },{ timestamps:true});
  
const Language = mongoose.model('Language', languageSchema);

module.exports = Language;