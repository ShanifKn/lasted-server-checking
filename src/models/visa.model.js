const mongoose = require('mongoose');
mongoose.pluralize(null);
const Schema = mongoose.Schema;

const visaSchema = new Schema({
    name:
    {
        type: String,
        required: [true, 'name is missing'],
    },
    name_ar:
    {
        type: String,
        required: [true, 'name ar is missing'],
    },
    iso:
    {
        type: mongoose.Schema.ObjectId,
        ref: 'Country',
        required: [true, 'iso is missing'],
    },
    addedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'Staff',
        required: [true, 'added by user is missing'],
    },
    active:
    {
        type: Boolean,
        default:true
    }
}, { timestamps: true }
);


module.exports = mongoose.model('VisaStatus',visaSchema);