const CronJob = require('../models/cronjob.model');

function adjustTime(timeString) {
    // Split the time string into hours, minutes, and seconds
    let [hours, minutes, seconds] = timeString.split(':').map(Number);
  
    // Create a new Date object, initialized to the start of today (or any specific date)
    const date = new Date();
    date.setHours(0, 0, 0, 0); // Reset to midnight of the current day
  
    // Handle the hour part intelligently if it's "24" or more
    if (hours >= 24) {
      // Calculate overflow hours and add them to the date
      date.setDate(date.getDate() + 1); // Increment day due to hour overflow
      hours -= 24; // Subtract 24 to normalize hour
    }
  
    // Set the adjusted time
    date.setHours(hours, minutes, seconds);
  
    // Extract the adjusted time in "HH:MM:SS" format
    let adjustedHours = date.getHours().toString().padStart(2, '0');
    let adjustedMinutes = date.getMinutes().toString().padStart(2, '0');
    let adjustedSeconds = date.getSeconds().toString().padStart(2, '0');
  
    return `${adjustedHours}:${adjustedMinutes}:${adjustedSeconds}`;
}

function convertTimeToEnqCronFormat(time) {
  
    const [hour, minute] = time.split(':');
    return `${minute} ${hour} * * *`;
}

function getTimeDifference(startTime, endTime) {
    // Convert time strings into JavaScript Date objects (assuming the same arbitrary date for both)
    const start = new Date(`1970-01-01T${startTime}Z`); // Z denotes UTC timezone
    const end = new Date(`1970-01-01T${endTime}Z`);
  
    // Calculate difference in milliseconds
    let diff = end - start;
  
    // Handle negative differences if the end time is considered to be the next day
    if (diff < 0) {
        diff += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
    }
  
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
    return { hours, minutes, seconds };
}

function getCurrentTime()
{
  const now = new Date();
  const options = {
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false, 
    timeZone: 'Asia/Dubai' // Specify your desired timezone here
  };
  const formattedTime = now.toLocaleTimeString('en-US', options);
  return formattedTime;
}

async function convertTimeToCronFormat(time) {
    try
    {
      const cronjob = await CronJob.findOne({name:'Autoconsume'});
      let daysExceptionString =[];
      cronjob.daysexception.forEach(ele => {
        if(ele.active ==true)
        {
          daysExceptionString.push(ele.day);
        }
      });
      let daysExceptionObj = daysExceptionString.join(",");
      const [hour, minute] = time.split(':');
      return `${minute} ${hour} * * ${daysExceptionObj}`;
      
    }
      catch (error) {
        console.error('Error ', error);
    }
}



module.exports = {adjustTime,convertTimeToEnqCronFormat,getTimeDifference,getCurrentTime,convertTimeToCronFormat};