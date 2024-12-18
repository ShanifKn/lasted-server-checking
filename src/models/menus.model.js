const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  route_name: {
    type: String,
  },
  name: {
    type: String,
    unique:true,
    required: true,
  },
  display_name: {
    type: String,
    unique:true,
    required: true,
  },
  display_name_ar: {
    type: String,
    unique:true,
    required: true,
  },
  description: {
    type: String,
  },
  icon: {
    type: String,
  },
  menu_type: {
    type: String,
    enum:['menu','submenu','button'],
    required:true
  },
  active:{
    type:Boolean,
    default:true
  }
},{timestamps:true});

const Menus = mongoose.model('Menu', menuSchema);

module.exports = Menus;
