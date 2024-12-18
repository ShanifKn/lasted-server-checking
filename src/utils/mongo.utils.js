/* eslint-disable no-console */
const mongoose = require('mongoose');

async function databaseConnect(url) {
  await mongoose.connect(url);
}

async function connectionStats() {
  await mongoose.connection.once('open', () => {
    console.log('Database Connected');
  });

  await mongoose.connection.on('error', (err) => {
    console.log('Database error occured, shutting down...', err);
  });
}

module.exports = {
  databaseConnect,
  connectionStats,
};
