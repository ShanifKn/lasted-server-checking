/* eslint-disable import/no-unresolved */
const express = require('express');
const morgan = require('morgan');
// eslint-disable-next-line import/no-extraneous-dependencies
const helmet = require('helmet');
const cors = require('cors');
const staffRoute = require('./routes/staff.routes');
const companyRoute = require('./routes/company.routes');
const settingsRoute = require('./routes/settings.routes');
const seekerRoute = require('./routes/seeker.routes');
const globalErrorHandler = require('./controllers/error.controller');
const AppError = require('./utils/app-error.utils');
const fucntions = require('./utils/functions');
const RabbitMQ = require('./utils/rabbit');

//require('./utils/redis.utils');
require('./models/documentType.model');
require('./models/location.model');
require('./models/category.model');
require('./models/gender.model');
require('./models/country.model');
require('./models/companies.model');
require('./models/seeker.model');

const cron = require('node-cron');
// const sendQueue = require('./utils/email-generation.util');
// const rabbitMq = require('./utils/rabbit');
const CronJob = require('./models/cronjob.model');
// const logaeController = require('./controllers/logae.controller');
const cronjobController = require('./controllers/cronjob.controller');

const app = express();

app.use(helmet());

app.use(cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.get('/', async (req, res) => {
  res.status(200).json({
    message: 'Welcome to bathool admin',
  });
});

app.use('/api/v1/seeker', seekerRoute);
app.use('/api/v1/staff', staffRoute);
app.use('/api/v1/company', companyRoute);
app.use('/api/v1/settings', settingsRoute);

app.all('*', (req, res, next) => {
  next(
    new AppError(`Can't find this url ${req.originalUrl} on this server`, 404),
  );
});

async function enQueueCronJob() {
  try {
    const cronjob = await CronJob.findOne({ name: 'Autoenqueue' });
    let startQueue = fucntions.adjustTime(cronjob.timestart);
    startQueue = fucntions.convertTimeToEnqCronFormat(startQueue);
    console.log(startQueue, 'Starting  Queue');
    cron.schedule(
      startQueue,
      async () => {
        console.log('Starting daily message Queue');
        await cronjobController.sendEmailFromBatch();
        // console.log("Completed daily message queue");
      },
      {
        scheduled: true,
      },
    );
  } catch (error) {
    console.error('Error initializing enqueue:', error);
  }
}

async function consumeCronJob() {
  try {
    //refreshConsume();
    const cronjob = await CronJob.findOne({ name: 'Autoconsume' });
    let { startConsume, stopConsume, bufferduration: bufferDuration } = cronjob;
    startConsume = fucntions.adjustTime(cronjob.timestart);
    stopConsume = fucntions.adjustTime(cronjob.timeend);
    let startConsumeTime = await fucntions.convertTimeToCronFormat(
      startConsume.toString(),
    );
    cron.schedule(startConsumeTime, async () => {
      let currentTime = fucntions.getCurrentTime();
      // console.log(currentTime,"current time");
      //start time 20:00:00 & end time 23:30:00 && current time 22:32:00
      if (
        startConsume <= currentTime &&
        currentTime < stopConsume &&
        startConsume < stopConsume
      ) {
        // console.log("normal time");
        const queueNames = await RabbitMQ.getSortedQueueNames();
        for (const queueName of queueNames) {
          currentTime = fucntions.getCurrentTime();
          if (currentTime >= stopConsume) {
            // console.log("Successfully stopped message consumption");
            await channel.close();
            await connection.close();
            break;
          }
          await RabbitMQ.startConsumer(queueName);
          await new Promise((resolve) => setTimeout(resolve, bufferDuration));
        }
      } else if (startConsume > stopConsume) {
        // console.log("next day time");
        currentTime = fucntions.adjustTime(fucntions.getCurrentTime());
        const queueNames = await RabbitMQ.getSortedQueueNames();
        for (const queueName of queueNames) {
          currentTime = fucntions.adjustTime(fucntions.getCurrentTime());
          if (
            (currentTime > stopConsume && currentTime >= startConsume) ||
            (currentTime <= startConsume && currentTime < stopConsume)
          ) {
            await RabbitMQ.startConsumer(queueName);
            await new Promise((resolve) => setTimeout(resolve, bufferDuration));
          } else {
            // console.log("Successfully stopped message consumption");
            await channel.close();
            await connection.close();
            break;
          }
        }
      } else {
        //console.log("error");
        await channel.close();
        await connection.close();
        // console.log("Successfully stopped message consumption");
      }
    });
  } catch (error) {
    console.error('Error initializing consume:', error);
  }
}

app.use(globalErrorHandler);
// enQueueCronJob();
// consumeCronJob();
module.exports = app;
