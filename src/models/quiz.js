const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Community = require('./community');


const quizSchema = mongoose.Schema({
  quizId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  quizName: {
    type: String,
    sparse: true,
    trim: true
  },
  quizCode: {
    type: String,
    sparse: true,
    unique: true,
    trim: true
  },
  questionCount: {
    type: Number,
    sparse: true,
    trim: true
  },
  questions: [{
    _id: false,
    questionString: {
      type: String,
      required: false,
      unique: false,
      trim: true
    },
    questionId: {
      type: String,
      required: false,
      unique: false,
      trim: true
    },
    answers: [{
      _id: false,
      answer: {
        type: String,
        required: false,
        unique: false,
        trim: true
      },
      user: {
        type: String,
        required: false,
        unique: false,
        trim: true
      },
    }]
  }],
  users: [{
    _id: false,
    name: {
      type: String,
      required: false,
      unique: false,
      trim: true
    },
    userId: {
      type: String,
      required: false,
      unique: false,
      trim: true
    },
    host: {
      type: Boolean,
      required: false
    }
  }]
})

quizSchema.pre('save', function (next) {
  var quiz = this;

  next();
})


quizSchema.statics.findByQuizId = async (quizId) => {
  const quiz = await Quiz.findOne({
    quizId
  });
  if (!quiz) {
    return null;
  } else {
    return quiz;
  }
}

quizSchema.statics.findByCode = async (quizCode) => {
  const quiz = await Quiz.findOne({
    "quizCode": quizCode
  });
  if (!quiz) {
    return null;
  } else {
    return quiz;
  }
}

quizSchema.statics.hasUser = async (quizId, userId) => {
  // Check if a user is in a quiz
  const quiz = await Quiz.findOne({
    quizId
  });
  if (quiz == null) return null;

  const isInArray = await quiz.users.some(function (user) {
    if (user.userId == userId) {
      return true;
    }
  });

  return isInArray;
}


quizSchema.statics.findQuestionById = async (quizCode, questionId) => {
  // Check if a user is in a quiz
  const quiz = await Quiz.findOne({
    "quizCode": quizCode
  });

  if (!quiz) {
    return null;
  } 

  var questionIndex = null;
  for (var i = 0; i < quiz.questions.length; i++) {
    if (quiz.questions[i].questionId === questionId) {
      questionIndex = i;
      break;
    }
  }
  if (questionIndex == null) return null;

  return quiz.questions[questionIndex];
}

quizSchema.statics.addAnswer = async (quizCode, questionId, answer) => {
  // Edits a channels name.
  const quiz = await Quiz.findOne({
    "quizCode": quizCode
  });

  if (quiz == null) return null;

  var questionIndex = null;
  for (var i = 0; i < quiz.questions.length; i++) {
    if (quiz.questions[i].questionId === questionId) {
      questionIndex = i;
      break;
    }
  }
  if (questionIndex == null) return null;

  quiz.questions[questionIndex].answers.push({
    answer: answer.answer,
    user: answer.user
  })

  quiz.save();
  return true;
}

quizSchema.statics.rename = async (quizCode, questionId, name) => {
  // Edits a channels name.
  const quiz = await Quiz.findOne({
    "quizCode": quizCode
  });

  if (quiz == null) return null;

  var questionIndex = null;
  for (var i = 0; i < quiz.questions.length; i++) {
    if (quiz.questions[i].questionId === questionId) {
      questionIndex = i;
      break;
    }
  }
  if (questionIndex == null) return null;

  quiz.questions[questionIndex].questionString = name;

  quiz.save();
  return true;
}

quizSchema.statics.findLast = async (quizCount) => {
  // Check if a user is in a quiz
  const quizzes = await Quiz.find().sort({ _id: -1 }).limit(quizCount);


  if (!quizzes) {
    return null;
  } 

  return quizzes;
}

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;