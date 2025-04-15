// File: src/lib/logger.js
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'message.log');
const MAX_RECORDS = 10000;

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

export const logMessage = (data, host) => {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            host: host || 'unknown',
            data,
        };

        // Read current log file to count records
        let recordCount = 0;
        if (fs.existsSync(LOG_FILE)) {
            const content = fs.readFileSync(LOG_FILE, 'utf8');
            recordCount = content ? content.split('\n').filter(line => line.trim()).length : 0;
        }

        // If record count exceeds MAX_RECORDS, clear and start new log file
        if (recordCount >= MAX_RECORDS) {
            fs.writeFileSync(LOG_FILE, ''); // Clear the file
            recordCount = 0;
        }

        // Append new log entry
        fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n', 'utf8');
    } catch (error) {
        console.error('Error writing to log file:', error.message);
    }
};