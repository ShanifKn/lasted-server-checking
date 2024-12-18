/* eslint-disable no-console */
require('dotenv').config();
const generateEmail = require('./utils/email-generation.util');

const app = require('./app');
const { databaseConnect, connectionStats } = require('./utils/mongo.utils');

const DB = process.env.DATABASE_URL.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

connectionStats();

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  await databaseConnect(DB);
  console.log(`App listening to port ${PORT}`);
});
