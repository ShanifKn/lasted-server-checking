const amqp = require('amqplib');
const axios = require('axios');
const moment = require('moment');
const CronJob = require('../models/cronjob.model');
const Seeker = require('../models/seeker.model');
const Batch = require('../models/batch.model');
const Country = require('../models/country.model');
const { LogsAE, LogsQA, LogsSA } = require('../models/logs.model');
const seerkerController = require('../controllers/seeker.controller');
const mongoose = require('mongoose');
const sendgrid = require('../utils/send-grid.utils');

async function enqueueEmailBatch(batch) {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const cronjob = await CronJob.findOne({ name: 'Autoenqueue' });
    const emailChunks = chunkArray(batch, cronjob.buffercount);
    let dateStamp;
    let sequenceNumber;
    let queueName;
    let seekerArr = [];
    let seekerArrUniq = [];
    // Use a for...of loop to handle asynchronous operations
    for (const [index, chunk] of emailChunks.entries()) {
      dateStamp = moment().format('YYYYMMDD'); // Date as YYYYMMDD
      sequenceNumber = getNextSequenceNumber(); // Get the next sequence number for today
      queueName = sequenceNumber;
      //const queueName = `emailQueue-${index + 1}`;

      // Ensure the queue exists
      await channel.assertQueue(queueName, { durable: true, autoDelete: true });

      // Enqueue each email in the chunk to the queue
      for (const record of chunk) {
        //console.log(record,"record");
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(record)));
        //console.log(`Enqueued seeker to ${queueName}: ${record.seeker}`);
        seekerArr.push({ seeker: record.seeker, plan: record.plan });
      }
    }

    // Close the channel and connection
    await channel.close();
    await connection.close();
    //console.log(seekerArr,"seekerArr");

    seekerArrUniq = removeDuplicates(seekerArr);
    for (const record of seekerArrUniq) {
      const updateSeekerPlnStatus = await updateSeekerPlanStatus(
        record.seeker,
        record.plan,
        3,
      );
      if (updateSeekerPlnStatus != '{}') {
        let content = `<table border='0' cellspacing='0' cellpadding='0' width='100%' style='color:#44546A;'>
                    <tbody>	
                    <tr>
                        <td width='460'>
                            <h1 style='font-family: Arial, Helvetica, sans-serif;font-weight:normal'>
                                Succesfully Activated
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td width='460'>
                            <p>
                                <strong>Dear ${updateSeekerPlnStatus.name},</strong>
                            </p>
                            <p>
                            Your plan has been successfully activated. All job applications will be processed and sent once the queue begins.
                            </p>
                            <p>
                                All the best and looking forward to your get hired reply soon.
                            </p>
                            <p>
                                Regards,
                            </p>
                            <h3 style='height:10px;'>
                                Ajmal Hamza
                            </h3>
                            <h3 style='color:#00622A;'>
                                Bathool
                            </h3>
                            <table>
                            <tr>
                                <td style='width:30px;' width='30'><a href='https://www.linkedin.com/company/bathool'><img alt='Bathool linkedin' src='http://bathool.com/assets/images/bathooliconlinkedin.png' style='width:25px' width='25' /></a></td>
                                <td style='width:30px;' width='30'><a href='https://www.instagram.com/bathoolinsta'><img alt='Bathool instagram' src='http://bathool.com/assets/images/bathooliconinsta.png' style='width:25px' width='25' /></a></td>
                                <td style='width:30px;' width='30'><a href='https://www.facebook.com/FacebookBathool'><img alt='Bathool facebook' src='http://bathool.com/assets/images/bathooliconfb.png' style='width:25px' width='25' /></a></td>
                                <td style='width:30px;' width='30'><a href='https://www.youtube.com/channel/UC5juFRHwM4TxwVpWTXgRLtA'><img alt='Bathool youtube' src='http://bathool.com/assets/images/bathooliconyt.png' style='width:25px' width='25' /></a></td>
                                <td style='width:30px;' width='30'><a href='https://whatsapp.com/channel/0029VaC6pkaKGGG9R7TX0r1j'><img alt='Bathool whatsapp' src='http://bathool.com/assets/images/bathooliconwhats.png' style='width:25px' width='25' /></a></td>
                                <td style='width:30px;' width='30'><a href='http://t.me/bathooljobs'><img alt='Bathool telegram' src='http://bathool.com/assets/images/bathoolicontelegram.png' style='width:25px' width='25' /></a></td>
                            </tr>
                            </table>
                        </td>
                    </tr>
                    </tbody>
                </table>`;
        const emailObject = {
          email: updateSeekerPlnStatus.email,
          fullContent: content,
          subject: 'Activated',
        };
        const sendEmailActivated = await sendgrid.sendMailSeeker(emailObject);
      }
    }
  } catch (error) {
    console.log('Error connecting to RabbitMQ:', error);
    process.exit(1); // Consider more graceful error handling depending on your application needs
  }
}

async function startConsumer(queueName) {
  try {
    // let sentCount =0;
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    // Ensure the queue is declared
    await channel.assertQueue(queueName, { durable: true, autoDelete: true });
    console.log(`Consumer waiting for messages in queue: ${queueName}`);

    channel.consume(
      queueName,
      async (msg) => {
        if (msg === null) {
          console.log('Received null message. No message to process.');
          return;
        }

        const messageContent = msg.content.toString().trim();
        if (!messageContent) {
          console.log(
            `Received empty message. Acknowledging and deleting from queue: ${queueName}`,
          );
          channel.ack(msg); // Acknowledge the empty message and remove it from the queue
          return;
        }

        try {
          // Process the message
          const record = JSON.parse(messageContent); // Assuming it's a JSON message
          console.log(`Processing record for seeker: ${record.seeker}`);

          // Acknowledge the message after processing
          channel.ack(msg);

          // Use setImmediate to give some time for the ack to process
          setImmediate(async () => {
            // Check the queue's message count after ack
            const queueStatus = await channel.checkQueue(queueName);
            if (queueStatus.messageCount === 0) {
              console.log(`Queue ${queueName} is empty. Deleting queue.`);
              await channel.deleteQueue(queueName);
            }
          });

          const batchData = await Batch.find({
            seeker: record.seeker,
            company: record.company,
            plan: record.plan,
            iso: record.iso,
          });

          // If matching batch data exists, process it
          if (batchData.length > 0) {
            for (const data of batchData) {
              const sendEmail = await seerkerController.emailBatchTemplate(
                record.seeker,
                record.company,
                record.iso,
              );
              await Batch.findByIdAndDelete(data._id);
              const countryDetails = await Country.findOne({ iso: record.iso });
              const companyLogName = countryDetails.logname;
              const Logs = mongoose.model(companyLogName);
              await Logs.insertMany({
                seeker: data.seeker,
                company: data.company,
                plan: data.plan,
              });
            }
          }
           //updateSeekerSentCount(data.seeker,data.plan,sentCount);
          // sentCount++;
        } catch (error) {
          console.error('Error processing message:', error);
          channel.ack(msg); // Acknowledge even if there's an error to prevent requeueing
        }
      },
      { noAck: false },
    ); // Ensure that auto-acknowledgment is turned off
  } catch (err) {
    console.error('Error connecting to RabbitMQ:', err);
  }
}

function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

async function getSortedQueueNames() {
  const rabbitMqApiUrl = 'http://localhost:15672/api/queues'; // Adjust for your RabbitMQ setup
  const username = 'guest'; // Default username, replace with actual if changed
  const password = 'guest'; // Default password, replace with actual if changed

  try {
    // Authenticate and fetch queue data
    const response = await axios.get(rabbitMqApiUrl, {
      auth: {
        username: username,
        password: password,
      },
    });

    // Extract queue names
    const queueNames = response.data.map((queue) => queue.name);

    // Sort queue names based on the embedded date and sequence number
    // Assuming format: 'queue-YYYYMMDD-SEQ'
    const sortedQueueNames = queueNames.sort((a, b) => {
      const regex = /queue-(\d{20})/; // Regex to extract date and sequence number
      const matchA = a.match(regex);
      const matchB = b.match(regex);

      // Compare dates first, then sequence numbers if dates are the same
      if (matchA[1] === matchB[1]) {
        // Compare dates
        return parseInt(matchA[2], 10) - parseInt(matchB[2], 10); // Compare sequence numbers
      }
      return matchA[1].localeCompare(matchB[1]); // Compare dates as strings
    });

    return sortedQueueNames;
  } catch (error) {
    console.error('Failed to fetch or sort queue names:', error);
    return [];
  }
}

function getNextSequenceNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const time = new Date().getTime(); // Milliseconds since epoch
  return `queue-${date}${time}`;
}

function removeDuplicates(data) {
  const seen = new Set();
  return data.filter((item) => {
    const key = `${item.seeker.toString()}-${item.plan.toString()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function updateSeekerPlanStatus(seeker, seekerPlan, status) {
  let seekerObj = {};
  const currentSeeker = await Seeker.findById(seeker);
  if (currentSeeker.seeker_plans.length > 0) {
    for (const record of currentSeeker.seeker_plans) {
      // console.log(record.plans,'plan');
      if (seekerPlan.toString() != '' && record.status == 2) {
        const updatedSeekerPlanStatus = await Seeker.findByIdAndUpdate(
          seeker,
          {
            $set: {
              'seeker_plans.$[elem].status': status,
              'seeker_plans.$[elem].finished_on': new Date(),
            },
          },
          {
            arrayFilters: [{ 'elem._id': seekerPlan }],
            new: true, // Return the modified document rather than the original
          },
        );
        seekerObj = {
          seeker: currentSeeker.code,
          name: currentSeeker.name.first_name,
          email: currentSeeker.email,
        };
      }
    }
  }
  return seekerObj;
}

module.exports = { enqueueEmailBatch, startConsumer, getSortedQueueNames };
