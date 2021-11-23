'use strict';
const { v2beta3 } = require('@google-cloud/tasks');
const MAX_SCHEDULE_LIMIT = 30 * 60 * 60 * 24; // Represents 30 days in seconds.

let schedule = new Date()
schedule.setMinutes(schedule.getMinutes() + 3)
console.log(schedule.toString())


const createHttpTaskWithToken = async function (
  project = 'my-first-project-ce24e',
  queue = 'tryTask',
  location = 'us-central1',
  url = 'https://us-central1-my-first-project-ce24e.cloudfunctions.net/HelloWorld', // api url
  email = 'cloudtask@my-first-project-ce24e.iam.gserviceaccount.com', // Cloud task service account email
  payload = '',
  date = schedule // date to schedule task
) {

  console.log(schedule.toString())

  const client = new v2beta3.CloudTasksClient();

  // Construct the fully qualified queue name.
  const parent = client.queuePath(project, location, queue);
  const convertedPayload = JSON.stringify(payload);
  const body = Buffer.from(convertedPayload).toString('base64');

  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url,
      oidcToken: {
        serviceAccountEmail: email,
        audience: new URL(url).origin,
      },
      scheduleTime:{

      },
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    },
  };

  const convertedDate = new Date(date);
  const currentDate = new Date();

  // Schedule time can not be in the past.
  if (convertedDate < currentDate) {
    console.error('Scheduled date in the past.');
    return
  } else if (convertedDate > currentDate) {
    const date_diff_in_seconds = (convertedDate - currentDate) / 1000;
    // Restrict schedule time to the 30 day maximum.
    if (date_diff_in_seconds > MAX_SCHEDULE_LIMIT) {
      console.error('Schedule time is over 30 day maximum.');
    }
    // Construct future date in Unix time.
    const date_in_seconds =
      Math.min(date_diff_in_seconds, MAX_SCHEDULE_LIMIT) + Date.now() / 1000;
    // Add schedule time to request in Unix time using Timestamp structure.
    // https://googleapis.dev/nodejs/tasks/latest/google.protobuf.html#.Timestamp
    task.scheduleTime = {
      seconds: date_in_seconds,
    };
    
  }

  try {
    // Send create task request.
    const [response] = await client.createTask({ parent, task });
    console.log(`Created task ${response.name}`);
    return response.name;
  } catch (error) {
    console.log(`Api Error : ${error}`)
  }

}


createHttpTaskWithToken()
