const mongoose = require('mongoose');
mongoose.pluralize(null);
const Schema = mongoose.Schema;

const logsHistorySchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.ObjectId
  },
});

// firmSchema.pre(/^find/, function (next) {
//   this.find({ active: true });
//   next();
// });

const LogHistoryAE = mongoose.model('LogHistoryAE', logsHistorySchema);
const LogHistoryQA = mongoose.model('LogHistoryQA', logsHistorySchema);
const LogHistorySA = mongoose.model('LogHistorySA', logsHistorySchema);

module.exports = {LogHistoryAE,LogHistoryQA,LogHistorySA};
