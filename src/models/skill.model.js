const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    name:
    {
        type: String,
        unique:true,
        required: [true, 'skill name is missing']
    },
    name_ar:
    {
        type: String,
        unique:true,
        required: [true, 'skill name is missing'],
    },
    active:
    {
        type: Boolean,
        default:true
    }
  },{ timestamps:true});
  
const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;