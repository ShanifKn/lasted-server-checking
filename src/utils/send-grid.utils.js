const sgMail = require('@sendgrid/mail');
const Seeker = require('../models/seeker.model');
const CronJob = require('../models/cronjob.model');

const axios = require('axios');


exports.sendMailStaff = async (emailObject) => {
  
  sgMail.setApiKey(process.env.SENDGRID_HELLO_API_KEY);
  sgMail.send({
      To: emailObject.email.trim(),
      from: {
        email: process.env.EMAIL_FROM_HELLO,
        name: 'Bathool for Business'
      },
      subject: emailObject.subject,
      html: emailObject.fullContent
  })
  
};

exports.sendMailSeeker = async (emailObject) => {
  
  sgMail.setApiKey(process.env.SENDGRID_HELLO_API_KEY);
  sgMail.send({
      To: emailObject.email.trim(),
      from: {
        email: process.env.EMAIL_FROM_HELLO,
        name: 'Bathool'
      },
      subject: emailObject.subject,
      html: emailObject.fullContent
  })
  
};


exports.sendMailEmployer = async (emailObject) => {
  const seekerData = await Seeker.findById(emailObject.seekerId);
  const seekerDocs = seekerData.seeker_documents;
  let seekerDocUrls = [];
  seekerDocs.forEach(ele => {
    seekerDocUrls.push(ele.path);
  });
  
  const attachmentPromises = seekerDocUrls.map(async (url) => {
    const response = await axios.get(url, {
        responseType: 'arraybuffer' // Ensure the response is in binary format
    });

    return {
        content: response.data.toString('base64'),
        filename: url.split('/').pop(),
        type: response.headers['content-type'],
        disposition: 'attachment'
    };
  });
  const attachments = await Promise.all(attachmentPromises);
  let ipPoolName = '';
  const cronjob = await CronJob.findOne({name:'Autoconsume'});
  cronjob.poolnames.forEach(ele => {
    if(ele.active)
    {
      ipPoolName = ele.name;
    }
  });
  
  sgMail.setApiKey(process.env.SENDGRID_CV_API_KEY);
  sgMail.send({
      To: emailObject.email.trim(),
      from: {
        email: process.env.EMAIL_FROM_CV,
        name: emailObject.seekerName
      },
      subject: emailObject.looking,
      html: emailObject.fullContent,
      attachments: attachments,
      ip_pool_name: ipPoolName,
  })
  
};

//module.exports = sendMailEmployer;
