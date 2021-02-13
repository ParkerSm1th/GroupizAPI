'use strict';

const fs = require('fs');
const path = require('path');
const {
  createLogger,
  format,
  transports
} = require('winston');
let logOutput = process.env.LOG_FILE_OUTPUT;
const env = process.env.NODE_ENV || 'development';

if (logOutput == null) {
  logOutput = './';
}

if (!fs.existsSync(logOutput)) {
  fs.mkdirSync(logOutput);
}

const filename = path.join(logOutput, 'verse-api.log');

const logger = createLogger({
  level: ['debug', 'error'],
  format: format.combine(
    format.errors({
      stack: true
    }),
    format.metadata(),
    format.json(),
    format.label({
      label: path.basename(process.mainModule.filename)
    }),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`)
  ),
  transports: [
    new transports.Console({
      level: env === 'development' ? 'debug' : 'info',
      format: format.combine(
        format.label({
          label: path.basename(process.mainModule.filename)
        }),
        format.colorize(),
        format.printf(
          info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
        )
      )
    }),
    new transports.File({
      filename
    })
  ]
});

module.exports = logger;