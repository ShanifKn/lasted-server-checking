const catchAsync = require('./catchasync.utlils');
const {
  CompanyAE,
  CompanyQA,
  CompanySA,
} = require('../models/companies.model');
const Plan = require('../models/plan.model');
const Seeker = require('../models/seeker.model');
const Category = require('../models/category.model');
const {
  LogHistoryAE,
  LogHistoryQA,
  LogHistorySA,
} = require('../models/loghistory.model');
const { LogsAE, LogsQA, LogsSA } = require('../models/logs.model');
const Batch = require('../models/batch.model');
const Cronjob = require('../models/cronjob.model');
const sendgrid = require('../utils/send-grid.utils');
const emailTemplate = require('../utils/email-template.utils');
const rabbitMq = require('../utils/rabbit');
// const sgMail = require("@sendgrid/mail");
const sgMail = require('@sendgrid/mail');
require('dotenv').config();
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);
