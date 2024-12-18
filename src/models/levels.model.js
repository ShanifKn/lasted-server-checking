const mongoose = require('mongoose');

const buttonsSchema = new mongoose.Schema({
    name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
    },
    access:
    {
        type:Boolean,
        default:true
    },
    sno:
    {
        type:Number
    }
},{ _id: false ,timestamps:true});

const submenusSchema = new mongoose.Schema({
    name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
    },
    access:
    {
        type:Boolean,
        default:true
    },
    buttons:[buttonsSchema]
    
},{ _id: false ,timestamps:true});

const permissionSchema = new mongoose.Schema({
    name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
    },
    access:
    {
        type:Boolean,
        default:true
    },
    submenus:[submenusSchema]
    
},{ _id: false ,timestamps:true});



const levelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  level: {
    type: Number,
    enum: [1,2,3,4,5,6],
    required: true,
  },
  permissions:[permissionSchema],
 
},{timestamps:true});

const Levels = mongoose.model('Level', levelSchema);

module.exports = Levels;
