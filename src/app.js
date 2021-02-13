require('dotenv').config()
const express = require('express')
const quizRouter = require('./routers/quiz')
var bodyParser = require('body-parser');
const port = process.env.PORT || 3200;
const host = process.env.HOST || '127.0.0.1';
const logger = require('./utils/loggerUtil');


/*
  Database init
*/
require('./db/db')

/*
  App init
*/
var cors = require("cors");
const app = express();
app.use(cors());

app.use(bodyParser.json({
  limit: "50mb"
}));
app.use(bodyParser.urlencoded({
  limit: "50mb",
  extended: true,
  parameterLimit: 50000
}));
app.use(bodyParser.json())
app.use(quizRouter)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});
app.get('/testSocket', function(req, res){
  res.sendFile(__dirname + '/static/test.html');
});

/*
  Start-up
*/
var server = require('http').Server(app);
var io = require('socket.io')(server);
io.on('connection', function(socket) {
  socket.emit('announcements', { message: 'A new user has joined!' });
});

app.listen(port, host, () => {
  logger.info(`Server starting up - Running on ${host}:${port}`);
})

