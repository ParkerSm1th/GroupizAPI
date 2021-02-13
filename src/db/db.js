const mongoose = require('mongoose');
const logger = require('../utils/loggerUtil');

const username = process.env.dbUsername;
const password = process.env.dbPassword;
const address = process.env.dbAddress;
const database = process.env.dbDatabase;

mongoose.connect(`mongodb://mongoadmin:mongoadmin@31.220.63.223:27017/groupiz?authSource=admin&readPreference=primary&appname=GroupizAPI&ssl=false`, {
  auth: {
    user: "mongoadmin",
    password: "mongoadmin",
    database: "groupiz"
  },
  authSource: "admin",
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
}).
then(() => logger.info(`Connected to DB successfully`)).
catch(err => console.log('Caught', err.stack));
