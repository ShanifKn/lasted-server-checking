const mongoose = require('mongoose');
mongoose.pluralize(null);
const Schema = mongoose.Schema;

const logsSchema = new Schema({
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
        type: mongoose.Schema.ObjectId
      }
}, { timestamps: true }
);

// Define models for each company
const LogAE = mongoose.model('LogAE', logsSchema);
const LogQA = mongoose.model('LogQA', logsSchema);
const LogSA = mongoose.model('LogSA', logsSchema);

module.exports = { LogAE,LogQA,LogSA};
