const express = require('express');
const router = express.Router();

const randomUtil = require('../utils/randomUtil');
const usernameUtil = require('../utils/usernameUtil');
const quizUtil = require('../utils/quizUtil');
const base64Util = require('../utils/base64Util');
const logger = require('../utils/loggerUtil');

const Quiz = require('../models/quiz');
const auth = require('../middleware/auth');


/* ------------------ Quiz Management  ------------------ */

router.post('/quiz/create', async (req, res) => {
  // Create a new quiz
  try {
    if (req.body.quizName == null || req.body.quizCode == null || req.body.questionCount == null || req.body.quizName == "" || req.body.quizCode == "" || req.body.questionCount == "" || req.body.hostName == null || req.body.hostName == "") {
      var errors = [];
      if (req.body.quizName == null || req.body.quizName == "") {
        errors.push({
          code: "missing_quizName",
          message: "Missing data",
          field: "quizName"
        });
      }
      if (req.body.quizCode == null || req.body.quizCode == "") {
        errors.push({
          code: "missing_quizCode",
          message: "Missing data",
          field: "quizCode"
        });
      }
      if (req.body.questionCount == null || req.body.questionCount == "") {
        errors.push({
          code: "missing_questionCount",
          message: "Missing data",
          field: "questionCount"
        });
      }
      if (req.body.hostName == null || req.body.hostName == "") {
        errors.push({
          code: "missing_hostName",
          message: "Missing data",
          field: "hostName"
        });
      }
      return res.status(400).send({
        success: false,
        code: "invalid_format",
        message: "Invalid format",
        errors: [errors]
      });
    }
    const quiz = new Quiz();
    quiz.quizName = req.body.quizName
    quiz.quizCode = req.body.quizCode
    quiz.questionCount = req.body.questionCount;
    quiz.hostName = req.body.hostName;
    const foundCode = await Quiz.findByCode(quiz.quizCode);
    if (foundCode != null) {
      var throwError = true;
      if (throwError) {
        return res.status(400).send({
          success: false,
          code: "invalid_data",
          message: "Invalid data",
          errors: [{
            code: "duplicate_code",
            message: "A quiz already exists with that code",
            field: "quizCode"
          }]
        });
      }
    }
    if (quiz.quizCode == "about" || quiz.quizCode == "404" || quiz.quizCode == "help" || quiz.quizCode == "faq") {
      return res.status(400).send({
        success: false,
        code: "invalid_data",
        message: "Invalid data",
        errors: [{
          code: "duplicate_code",
          message: "That code is a banned quiz code",
          field: "quizCode"
        }]
      });
    }
    const quizId = await randomUtil.getNewQuizId();
    quiz.quizId = quizId;
    console.log("passed checks");
    await quiz.save();
    quiz.questions = [];
    for (i = 0; i < quiz.questionCount; i++) {
      let newQuestionId = await randomUtil.getNewQuestionId(quiz.quizId);
      quiz.questions.push({
        questionString: "Click to enter the question",
        questionId: newQuestionId.toString()
      });
    }
    const hostId = await randomUtil.getNewUserId(quiz.quizId);
    quiz.users = [];
    quiz.users.push({
      name: quiz.hostName.toString(),
      userId: hostId,
      host: true
    })
    await quiz.save();
    console.log("Created questions");
    res.status(201).send({
      success: true,
      quizId: quizId,
      hostId: hostId
    });
    logger.debug(`Quiz created with code: ${quiz.quizCode}`);
  } catch (error) {
    console.log(error);
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.post('/quiz/:quizCode/users/create', async (req, res) => {
  // Create a new user
  try {
    if (req.body.name == null || req.body.name == "") {
      var errors = [];
      if (req.body.name == null || req.body.name == "") {
        errors.push({
          code: "missing_name",
          message: "Missing data",
          field: "name"
        });
      }
      return res.status(400).send({
        success: false,
        code: "invalid_format",
        message: "Invalid format",
        errors: [errors]
      });
    }

    const validQuiz = await quizUtil.validQuiz(req);
    if (validQuiz !== null) return res.status(400).send(validQuiz);

    const quiz = await Quiz.findByCode(req.params.quizCode)

    const userId = await randomUtil.getNewUserId(quiz.quizId);
    quiz.users.push({
      name: req.body.name.toString(),
      userId: userId
    })
    await quiz.save();
    res.status(201).send({
      success: true,
      quizId: quiz.quizId,
      userId: userId
    });
    logger.debug(`Added user to quiz ${quiz.quizCode} with username: ${req.body.name}`);
  } catch (error) {
    console.log(error);
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.post('/quiz/:quizCode/questions/new', async (req, res) => {
  // Add a new question
  try {

    const validQuiz = await quizUtil.validQuiz(req);
    if (validQuiz !== null) return res.status(400).send(validQuiz);

    const quiz = await Quiz.findByCode(req.params.quizCode)

    let newQuestionId = await randomUtil.getNewQuestionId(quiz.quizId);
    quiz.questions.push({
      questionString: "Click to enter the question",
      questionId: newQuestionId.toString()
    });
    quiz.questionCount = quiz.questionCount + 1;
    quiz.save();
    logger.debug(`Added a new question to quiz with quiz code: ${quiz.quizCode}`);
    res.status(201).send({
      success: true,
      quizId: quiz.quizId,
      quizCode: quiz.quizCode,
      questions: quiz.questions
    });
  } catch (error) {
    console.log(error);
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.post('/quiz/:quizCode/questions/:questionId/addAnswer', async (req, res) => {
  // Pulls specific question and answers
  try {
    if (req.body.answer == null || req.body.answer == "" || req.body.user == null || req.body.user == "") {
      var errors = [];
      if (req.body.answer == null || req.body.answer == "") {
        errors.push({
          code: "missing_answer",
          message: "Missing data",
          field: "answer"
        });
      }
      if (req.body.user == null || req.body.user == "") {
        errors.push({
          code: "missing_user",
          message: "Missing data",
          field: "user"
        });
      }
      return res.status(400).send({
        success: false,
        code: "invalid_format",
        message: "Invalid format",
        errors: [errors]
      });
    }

    const validQuiz = await quizUtil.validQuiz(req);
    if (validQuiz !== null) return res.status(400).send(validQuiz);

    const validQuestion = await quizUtil.validQuestion(req);
    if (validQuestion !== null) return res.status(400).send(validQuestion);

    const quiz = await Quiz.findByCode(req.params.quizCode)
    var question = await Quiz.findQuestionById(req.params.quizCode, req.params.questionId);

    var answer = {
      answer: req.body.answer,
      user: req.body.user
    };
    const addAnswer = await Quiz.addAnswer(quiz.quizCode, question.questionId, answer);

    if (!addAnswer) {
      res.status(400).send({
        success: false,
        code: 1000,
        message: "Unknown error"
      });
    }
    logger.debug(`Added answer to quiz with quiz code: ${quiz.quizCode}`);
    question = await Quiz.findQuestionById(req.params.quizCode, req.params.questionId);
    res.status(201).send({
      success: true,
      quizId: quiz.quizId,
      quizCode: quiz.quizCode,
      question
    });
  } catch (error) {
    console.log(error);
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.post('/quiz/:quizCode/questions/:questionId/rename', async (req, res) => {
  // Pulls specific question and answers
  try {
    if (req.body.name == null || req.body.name == "") {
      var errors = [];
      if (req.body.name == null || req.body.name == "") {
        errors.push({
          code: "missing_name",
          message: "Missing data",
          field: "name"
        });
      }
      return res.status(400).send({
        success: false,
        code: "invalid_format",
        message: "Invalid format",
        errors: [errors]
      });
    }

    const validQuiz = await quizUtil.validQuiz(req);
    if (validQuiz !== null) return res.status(400).send(validQuiz);

    const validQuestion = await quizUtil.validQuestion(req);
    if (validQuestion !== null) return res.status(400).send(validQuestion);

    const quiz = await Quiz.findByCode(req.params.quizCode)
    var question = await Quiz.findQuestionById(req.params.quizCode, req.params.questionId);

    const rename = await Quiz.rename(quiz.quizCode, question.questionId, req.body.name);

    if (!rename) {
      res.status(400).send({
        success: false,
        code: 1000,
        message: "Unknown error"
      });
    }
    logger.debug(`Renamed question with quizcode: ${quiz.quizCode}`);
    question = await Quiz.findQuestionById(req.params.quizCode, req.params.questionId);
    res.status(201).send({
      success: true,
      quizId: quiz.quizId,
      quizCode: quiz.quizCode,
      question
    });
  } catch (error) {
    console.log(error);
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})


/* Quiz Data Pulling */

router.get('/quizzes', async (req, res) => {
  // Pulls all users
  try {
    var count = req.query.count;
    var quizzes;
    if (count == null) {
      quizzes = await Quiz.findLast(5);
    } else { 
      count = Number.parseInt(count);
      if (count > 15) {
        var errors = [];
        errors.push({
          code: "invalid_count",
          message: "You cannot request more than 15 quizzes",
          field: "count"
        });
        return res.status(400).send({
          success: false,
          code: "invalid_format",
          message: "Invalid format",
          errors: [errors]
        });
        return true;
      }
      quizzes = await Quiz.findLast(count);
    }
    
    const newQuizzes = [];
    quizzes.forEach(function(quiz) {
      newQuiz = {
        name: quiz.quizName,
        quizCode: quiz.quizCode
      };
      newQuizzes.push(newQuiz);
    })

    res.status(201).send({
      success: true,
      quizzes: newQuizzes
    });
  } catch (error) {
    console.log(error);
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.get('/quiz/:quizCode/users', async (req, res) => {
  // Pulls all users
  try {
    const validQuiz = await quizUtil.validQuiz(req);
    if (validQuiz !== null) return res.status(400).send(validQuiz);

    const quiz = await Quiz.findByCode(req.params.quizCode)

    res.status(201).send({
      success: true,
      quizId: quiz.quizId,
      quizCode: quiz.quizCode,
      users: quiz.users
    });
  } catch (error) {
    console.log(error);
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.get('/quiz/:quizCode/questions', async (req, res) => {
  // Pulls questions & answers
  try {
    const validQuiz = await quizUtil.validQuiz(req);
    if (validQuiz !== null) return res.status(400).send(validQuiz);

    const quiz = await Quiz.findByCode(req.params.quizCode)

    res.status(201).send({
      success: true,
      quizId: quiz.quizId,
      quizCode: quiz.quizCode,
      questions: quiz.questions
    });
  } catch (error) {
    console.log(error);
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.get('/quiz/:quizCode/name', async (req, res) => {
  // Pulls question name
  try {
    const validQuiz = await quizUtil.validQuiz(req);
    if (validQuiz !== null) return res.status(400).send(validQuiz);

    const quiz = await Quiz.findByCode(req.params.quizCode)

    res.status(201).send({
      success: true,
      quizId: quiz.quizId,
      quizCode: quiz.quizCode,
      name: quiz.quizName
    });
  } catch (error) {
    console.log(error);
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.get('/quiz/:quizCode/questions/:questionId', async (req, res) => {
  // Pulls specific question and answers
  try {
    const validQuiz = await quizUtil.validQuiz(req);
    if (validQuiz !== null) return res.status(400).send(validQuiz);

    const validQuestion = await quizUtil.validQuestion(req);
    if (validQuestion !== null) return res.status(400).send(validQuestion);

    const quiz = await Quiz.findByCode(req.params.quizCode)
    const question = await Quiz.findQuestionById(req.params.quizCode, req.params.questionId);
    res.status(201).send({
      success: true,
      quizId: quiz.quizId,
      quizCode: quiz.quizCode,
      question
    });
  } catch (error) {
    console.log(error);
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})



module.exports = router