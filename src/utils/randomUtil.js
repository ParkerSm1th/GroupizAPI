const Quiz = require('../models/quiz');
const Community = require('../models/community');
const lengths = [1, 2, 4, 8];
const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numsNoZero = '123456789';
const nums = '0123456789';

function generateUniqueId() {
  var uniqueId = "";
  var length = lengths[Math.floor(Math.random() * (lengths.length - 1))];
  for (var i = 0; i < (16 / length); i++) {
    var substr = Math.ceil(Math.random() * (Math.pow(10, length))).toString();
    while (substr.length < length) {
      substr = "0" + substr;
    }
    if (substr.length > length) {
      substr = substr.substring(0, length);
    }
    uniqueId = uniqueId + substr;
  }
  return uniqueId;
}

function randomNum(usernameId) {
  const num = nums[Math.floor(Math.random() * nums.length)];
  if (num == usernameId[usernameId.length - 2]) {
    return randomNum(usernameId)
  } else {
    return num;
  }
}

const getNewQuizId = async () => {
  var quizId = generateUniqueId();
  while (await Quiz.findByQuizId(quizId) != null) {
    quizId = generateUniqueId();
  }
  return quizId;
}

const getNewUserId = async (quizId) => {
  var userId = generateUniqueId();
  while (await Quiz.hasUser(quizId, userId) != false) {
    userId = generateUniqueId();
  }
  return userId;
}

const getNewQuestionId = async (quizId) => {
  var questionId = await generateUniqueId();
  while (await Quiz.findQuestionById(quizId, questionId) != null) {
    questionId = await generateUniqueId();
  }
  return questionId;
}

function generateToken(length) {
  var token = "";
  for (var i = 0; i < length; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

const getNewConfirmationToken = async () => {
  var token = generateToken(64);
  while (await User.findByConfirmationToken(token) != null) {
    token = generateToken(64);
  }
  return token;
}

module.exports.getNewQuizId = getNewQuizId;
module.exports.getNewUserId = getNewUserId;
module.exports.getNewQuestionId = getNewQuestionId;