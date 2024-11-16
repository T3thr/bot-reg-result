// app/api/checkgrade/route.js
import puppeteer from 'puppeteer';
import axios from 'axios';
import User from '@/backend/models/User'; // MongoDB User model
import mongodbConnect from '@/backend/lib/mongodb'; // MongoDB connection utility

const LINE_CHANNEL_ACCESS_TOKEN = "wXKqJzXzcepeevbTzojBnFcbYvKwRS3GM8eJRYYDkcmwhynryA7C4DlvOER8KonAYLkQNaPX+EWNO4faQsf5z6r8baBZWGA8opdSDeK2Ng+25vnVDsrFV0u+XEXqkmkhv5rKiNFmczm1zMaRdRM+sgdB04t89/1O/w1cDnyilFU="; // Replace with your LINE channel access token

const scrapeGrades = async (username, password) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Login to the website
  await page.goto('https://reg9.nu.ac.th/registrar/login_ssl.asp?avs224389944=6');
  await page.type('[name="f_uid"]', username);
  await page.type('[name="f_pwd"]', password);
  await page.keyboard.press('Enter');
  await page.waitForSelector('table'); // Wait for grades table to load

  const grades = await page.evaluate(() => {
    const tables = document.querySelectorAll("table[border='0']");
    let gradeData = {};
    let semesterCounter = 1;

    tables.forEach((table) => {
      let semesterName = `semester${semesterCounter}`;
      gradeData[semesterName] = { totalSubjects: 0, gradedSubjects: 0, eValSubjects: 0, subjects: [] };

      const rows = table.querySelectorAll("tr[valign='TOP']");
      rows.forEach((row) => {
        const gradeField = row.querySelector("td[align='LEFT'] font");
        const gradeText = gradeField ? gradeField.textContent.trim() : '';
        
        // Check if it's an e-val subject
        if (row.querySelector("span[style='color:#92a8d1;background-color:red']")) {
          gradeData[semesterName].eValSubjects += 1;
          gradeData[semesterName].subjects.push('e-val');
        } else if (gradeText) {
          gradeData[semesterName].gradedSubjects += 1;
          gradeData[semesterName].subjects.push(gradeText);
        }
        gradeData[semesterName].totalSubjects += 1;
      });
      semesterCounter++;
    });

    return gradeData;
  });

  await browser.close();
  return grades;
};

const sendLineNotification = async (message, lineUserId) => {
  const url = 'https://api.line.me/v2/bot/message/push';
  const headers = {
    'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
  const data = {
    "to": lineUserId,
    "messages": [{ "type": "text", "text": message }],
  };

  try {
    const response = await axios.post(url, data, { headers });
    if (response.status !== 200) {
      console.error('Failed to send notification', response.data);
    }
  } catch (error) {
    console.error('Error sending LINE notification', error);
  }
};

const compareAndNotify = async (oldState, newState, lineUserId) => {
  let overallMessage = "";
  let specialMessage = "";

  for (const [semester, data] of Object.entries(newState)) {
    const { totalSubjects, gradedSubjects, eValSubjects } = data;

    overallMessage += `${semester} has ${gradedSubjects} out of ${totalSubjects} subjects with grades.\n`;

    if (eValSubjects > 0) {
      specialMessage += `In ${semester}, you have ${eValSubjects} e-val subjects that need evaluation. Please review them.\n`;
    }

    if (oldState[semester]) {
      const oldData = oldState[semester];
      if (oldData.gradedSubjects !== gradedSubjects) {
        await sendLineNotification(`${semester} grade has changed! Now, ${gradedSubjects} out of ${totalSubjects} subjects have grades.`, lineUserId);
      }
    } else {
      await sendLineNotification(`${semester} has ${gradedSubjects} out of ${totalSubjects} subjects with grades.`, lineUserId);
    }
  }

  await sendLineNotification(overallMessage, lineUserId);

  if (specialMessage) {
    await sendLineNotification(specialMessage, lineUserId);
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { lineUserId } = req.body;

    try {
      // Connect to the database
      await mongodbConnect();

      // Find the user in the database
      const user = await User.findOne({ lineUserId });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { username, password } = user;

      // Scrape the grades
      const newState = await scrapeGrades(username, password);

      // Here you can save the newState in a database or in-memory
      // For simplicity, we're skipping state persistence here

      // Compare old and new state (if you have a stored previous state)
      // You can retrieve the oldState from MongoDB or memory here
      // In this example, we'll just assume the previous state is an empty object
      const oldState = {}; // Replace with real data if necessary

      await compareAndNotify(oldState, newState, lineUserId);

      res.status(200).json({ message: 'Grades checked and notifications sent successfully.' });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error occurred while fetching grades.' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}