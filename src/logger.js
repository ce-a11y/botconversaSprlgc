
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const logsDir = path.resolve('logs');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

function getTimestamp() {
    const now = new Date();
    return now.toISOString();
}

function getLogFileName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return path.join(logsDir, `${year}-${month}-${day}.log`);
}

function writeToFile(message) {
    const fileName = getLogFileName();
    fs.appendFile(fileName, message + '\n', (err) => {
        if (err) console.error('Erro ao gravar log no arquivo:', err);
    });
}

function log(level, colorFn, message) {
    const timestamp = getTimestamp();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(colorFn(formatted));
    writeToFile(formatted);
}

export const logger = {
    info: (message) => log('info', chalk.blue, message),
    warn: (message) => log('warn', chalk.yellow, message),
    error: (message) => log('error', chalk.red, message),
    debug: (message) => log('debug', chalk.gray, message),
};
