import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERNAME = process.env.MOBI_USERNAME;
const PASSWORD = process.env.MOBI_PASSWORD;

if (!USERNAME || !PASSWORD) {
  throw new Error('MOBI_USERNAME and MOBI_PASSWORD must be set in environment variables');
}

const WEEKDAYS = [
  "poniedziałek",
  "wtorek",
  "środa",
  "czwartek",
  "piątek"
];

export default {
  async execute({ day = 'tomorrow' } = {}) {
    return new Promise((resolve, reject) => {
      let targetDate = new Date();
      let daysToAdd = 0;

      switch (day.toLowerCase()) {
        case 'tomorrow':
          daysToAdd = 1;
          break;
        case 'dayaftertomorrow':
          daysToAdd = 2;
          break;
        case 'today':
          daysToAdd = 0;
          break;
        default:
          reject(new Error('Invalid day parameter. Use "today", "tomorrow", or "dayaftertomorrow"'));
          return;
      }

      targetDate.setDate(targetDate.getDate() + daysToAdd);
      const weekday = targetDate.getDay() - 1; 

      if (weekday < 0 || weekday > 4) {
        resolve({
          date: targetDate.toISOString().split('T')[0],
          message: "No classes on weekends",
          schedule: []
        });
        return;
      }

      const pythonScript = path.join(__dirname, 'mobi.py');
      const python = spawn('python', [
        pythonScript,
        '-u', USERNAME,
        '-p', PASSWORD
      ]);

      let outputData = '';
      let errorData = '';

      python.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          try {
            const error = JSON.parse(errorData);
            reject(new Error(error.error));
          } catch {
            reject(new Error(`Python script failed: ${errorData}`));
          }
          return;
        }

        try {
          const schedule = JSON.parse(outputData);
          const targetWeekday = WEEKDAYS[weekday];
          
          resolve({
            date: targetDate.toISOString().split('T')[0],
            weekday: targetWeekday,
            schedule: schedule[targetWeekday] || []
          });
        } catch (error) {
          reject(new Error(`Failed to parse schedule output: ${error.message}`));
        }
      });
    });
  }
};