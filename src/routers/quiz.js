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
        questionString: "Not yet defined",
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
      questionString: "Not yet defined",
      questionId: newQuestionId.toString()
    });
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
          field: "nname"
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

router.post('/users/create/verify', async (req, res) => {
  // Verifies a users email address
  try {
    const {
      token
    } = req.body;
    const user = await User.verifyEmail(token);
    if (!user) {
      return res.status(401).send({
        success: false,
        code: 1002,
        message: "Invalid data",
        errors: [{
          code: 2002,
          message: "This verification code is invalid or has expired.",
          field: "token"
        }]
      });
    }
    res.status(201).send({
      success: true
    });
    logger.debug(`User with email: ${user.email} verified their email address.`);
  } catch (error) {
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
});

router.get('/users/:userID/username/', async (req, res) => {
  if (req.params.userID == null || req.params.userID == "") {
    return res.status(400).send({
      success: false,
      code: 500,
      message: "Invalid format"
    });
  }

  const id = req.params.userID;
  const user = await User.findByUserId(id);

  if (user == null) {
    return res.status(400).send({
      success: false,
      code: 1002,
      message: "Invalid data",
      errors: [{
        code: 2006,
        message: "Invalid user",
        field: "userID"
      }]
    });
  }

  if (user.usernameID == null) {
    return res.status(400).send({
      success: false,
      code: 1002,
      message: "Invalid data, that user has not setup their username yet.",
    });
  }

  const usernameId = user.usernameID.username + "#" + user.usernameID.id;

  return res.status(201).send({
    "success": true,
    "usernameID": usernameId
  });
});


/* ------------------ User Authentication  ------------------ */

router.post('/users/verify', auth, async (req, res) => {
  //Verify a user's authToken matches the provided userId
  try {
    if (req.body.userId == null || req.body.userId == "") {
      return res.status(400).send({
        success: false,
        code: 1002,
        message: "Invalid format"
      });
    }

    const user = await User.findByUserId(req.body.userId);
    if (user == null || req.user.userId != user.userId) {
      return res.status(401).send({
        success: false,
        code: 401,
        message: "Invalid authentication credentials"
      });
    }

    return res.status(200).send({
      success: true,
      code: 200
    });
  } catch (error) {
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
});

router.post('/users/login', async (req, res) => {
  //Login a registered user
  try {
    if (req.body.email == null || req.body.email == "" || req.body.password == null || req.body.password == "") {
      return res.status(400).send({
        success: false,
        code: 1002,
        message: "Invalid format"
      });
    }

    const {
      email,
      password
    } = req.body;
    var user, err;
    try {
      user = await User.findByCredentials(email, password);
    } catch (e) {
      err = true;
    }
    if (err || !user) {
      return res.status(401).send({
        success: false,
        code: 1002,
        message: "Invalid data",
        errors: [{
          code: 2003,
          message: "Invalid login credentials"
        }]
      });
    }

    if (!user.emailConfirmed) {
      return res.status(401).send({
        success: false,
        code: 1003,
        message: "Please verify your email address before logging in."
      });
    }

    res.send({
      success: true,
      userId: user.userId,
      authToken: user.authToken
    });
  } catch (error) {
    logger.error(new Error(error))
    res.status(401).send({
      success: false,
      code: 1002,
      message: "Invalid data",
      errors: [{
        code: 2003,
        message: "Invalid login credentials"
      }]
    });
  }
})

router.post('/users/logout', auth, async (req, res) => {
  // Log user out of all applications by resetting their authToken
  try {
    await req.user.generateAuthToken(req.user);

    res.send({
      success: true
    });
  } catch (error) {
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
});

/* User Data */

router.get('/users/me', auth, async (req, res) => {
  // View userId/usernameID for logged in user
  var username;
  if (req.user.usernameID) {
    username = req.user.usernameID.username + "#" + req.user.usernameID.id;
  } else {
    username = null;
  }
  res.send({
    userId: req.user.userId,
    username: username
  });
})

router.get('/users/me/communities', auth, async (req, res) => {
  // View the communities a user is part of
  const user = req.user;
  try {
    let communities = [];
    for (var i = 0; i < user.communities.length; i++) {
      let community = await Community.findByCommunityId(user.communities[i].communityId);
      if (community !== null) {
        let id = community.communityId;
        let name = community.displayName;
        communities.push({
          id: id,
          displayName: name
        });
      }
    }
    res.send({
      success: true,
      communities: communities
    });
  } catch (error) {
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.get('/users/me/profile', auth, async (req, res) => {
  // View the users profile
  const user = req.user;
  try {
    const checkAvatar = user.avatar;
    let avatar = '';
    if (checkAvatar == null) {
      avatar = await base64Util.getDefault();
    } else {
      avatar = user.avatar.base64;
    }

    const checkUsername = user.usernameID;
    let username = '';
    let usernameID = '';
    if (checkUsername == null) {
      username = null;
      usernameID = null;
    } else {
      usernameID = user.usernameID.username + "#" + user.usernameID.id;
      username = user.usernameID.username;
    }

    const checkTheme = user.theme;
    let theme = '';
    if (checkTheme == null) {
      theme = 'purple';
    } else {
      theme = user.theme;
    }
    res.send({
      success: true,
      displayName: usernameID,
      username: username,
      theme: theme,
      phone: user.phone,
      email: user.email,
      avatar: avatar
    });
  } catch (error) {
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.post('/users/me/profile', auth, async (req, res) => {
  // Enables users to edit their account information
  const user = req.user;
  const body = req.body;
  let errors = [];
  let updated = new Map();
  try {
    // Initializing variables
    let usernameUpdate = avatarUpdate = emailUpdate = phoneUpdate = themeUpdate = true;

    if (body.username == null || body.username == '') usernameUpdate = false;
    if (body.avatar == null || body.avatar == '') avatarUpdate = false;
    if (body.email == null || body.email == '') emailUpdate = false;
    if (body.phone == null || body.phone == '') phoneUpdate = false;
    if (body.theme == null || body.theme == '') themeUpdate = false;

    // Handles functions
    if (usernameUpdate) {
      async () => {
        const username = body.username;
        const usernameCheck = await usernameUtil.checkUsernameSpecifications(username);
        if (usernameCheck !== null) {
          //If username does not pass specifications, return error
          errors.push({
            code: 2006,
            message: usernameCheck,
            field: "username"
          });
          return true;
        }

        if (user.usernameID == null) {
          const id = randomUtil.getNewUsernameId(username);
          if (id == null) {
            errors.push({
              code: 2006,
              message: "Too many users have this username.",
              field: "username"
            });
            return true;
          }

          const usernameId = username + "#" + id;
          user.usernameID = {
            username: username,
            id: id
          };
          updated.set('username', usernameId);
        } else {
          let count = await User.countPerUsernameAndId(username, user.usernameID.id);
          if (username == user.usernameID.username) count = 0; // This checks to make sure it does not return an error if it is the same user.
          if (count > 0) {
            errors.push({
              code: 2006,
              message: "Too many users have this username.",
              field: "username"
            });
            return true;
          }
          user.usernameID = {
            username: username,
            id: user.usernameID.id
          };
          const usernameId = username + "#" + user.usernameID.id;
          updated.set('username', usernameId);
        }
      };
    }

    if (avatarUpdate) {
      async () => {
        const avatar = body.avatar;
        const validBase64 = await base64Util.isBase64(avatar);
        if (!validBase64) {
          errors.push({
            code: 2002,
            message: "Invalid base64 format",
            field: "avatar"
          });
          return true;
        }

        user.avatar.base64 = avatar;
        user.avatar.lastUpdated = Date.now();
        updated.set('avatar', true);
      };
    }

    if (emailUpdate) {
      async () => {
        const foundUser = await User.findByEmail(body.email)
        if (foundUser != null) {
          if (foundUser.userID !== user.userID) {
            errors.push({
              code: 2004,
              message: "An account already exists with this email.",
              field: "email"
            });
            return true;
          }
        }
        const token = await randomUtil.getNewConfirmationToken();
        user.emailConfirmed = false;
        user.email = body.email;
        user.emailConfirm = {
          expires: (Date.now() + (1000 * 60 * 60 * 24)),
          token: token
        };
        updated.set('email', true);
      };
    }

    if (phoneUpdate) {
      async () => {
        if (!body.phone.includes("+")) {
          errors.push({
            code: 2006,
            message: "Please include a country code.",
            field: "phone"
          });
          return true;
        }
        user.phone = body.phone;
        updated.set('phone', true);
      };
    }

    if (themeUpdate) {
      async () => {
        user.theme = body.theme;
        updated.set('theme', true);
      };
    }

    // Handles errors and returns new values if successful
    if (errors.length > 0) {
      return res.status(400).send({
        success: false,
        code: 1002,
        errors: errors
      });
    }
    let values = {};

    updated.forEach(function (value, key) {
      values[key] = value
    });
    user.save();
    res.send({
      success: true,
      fields: values
    });
    if (updated.has('email')) {
      emailUtil.sendConfirmationEmail(user.email, user.emailConfirm.token);
    }
  } catch (error) {
    logger.error(new Error(error))
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.get('/users/me/friends/requests', auth, async (req, res) => {
  const user = req.user;
  try {
    const allFriends = await Friend.findAll(user.userId);

    if (allFriends === null) {
      return res.status(401).send({
        success: false,
        code: 1005,
        message: "You have no friends or friend requests"
      });
    }

    let friends = [];
    let requests = [];

    for (var i = 0; i < allFriends.length; i++) {
      let friend = allFriends[i];
      if (friend.status === true) {
        if (friend.sender === user.userId) {
          friends.push({
            "userId": friend.receiver,
            "started": friend.accepted
          });
        } else {
          friends.push({
            "userId": friend.sender,
            "started": friend.accepted
          });
        }
      } else {
        requests.push({
          "sender": friend.sender,
          "receiver": friend.receiver,
          "sent": friend.sent
        });
      }
    }

    res.send({
      success: true,
      code: 1004,
      friends: friends,
      requests: requests
    });
  } catch (error) {
    logger.error(new Error(error));
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
});

/* Friend Management */

router.post('/users/friend/request', auth, async (req, res) => {
  const user = req.user;
  try {
    if (req.body.userId == null || req.body.userId == '') {
      return res.status(400).send({
        success: false,
        code: 1002,
        message: "Invalid format"
      });
    }

    const reqUser = await User.findByUserId(req.body.userId);
    if (reqUser == null) {
      return res.status(401).send({
        success: false,
        code: 1002,
        message: "Invalid data",
        errors: [{
          code: 2002,
          message: "Invalid user"
        }]
      });
    }

    const currentRequest = await Friend.findByBoth(user.userId, reqUser.userId);
    if (currentRequest !== null) {
      return res.status(401).send({
        success: false,
        code: 1002,
        message: "Invalid data",
        errors: [{
          code: 2004,
          message: "You already have a pending friend request with that user or are already friends with them."
        }]
      });
    }

    const friend = new Friend();
    friend.sender = user.userId;
    friend.receiver = reqUser.userId;
    friend.sent = Date.now();
    friend.status = false;

    friend.save();

    res.send({
      success: true,
      code: 1004,
      message: "Friend request sent."
    });
  } catch (error) {
    logger.error(new Error(error));
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
});

router.delete('/users/friend/respond', auth, async (req, res) => {
  const user = req.user;
  try {
    if (req.body.userId == null || req.body.userId == '') {
      return res.status(400).send({
        success: false,
        code: 1002,
        message: "Invalid format"
      });
    }

    const reqUser = await User.findByUserId(req.body.userId);
    if (reqUser == null) {
      return res.status(401).send({
        success: false,
        code: 1002,
        message: "Invalid data",
        errors: [{
          code: 2002,
          message: "Invalid user"
        }]
      });
    }

    const currentRequest = await Friend.findByBoth(user.userId, reqUser.userId);
    if (currentRequest === null) {
      return res.status(401).send({
        success: false,
        code: 1002,
        message: "Invalid data",
        errors: [{
          code: 2004,
          message: "You do not have a pending request with that user."
        }]
      });
    }

    let pendingDelete = await Friend.deleteRequest(currentRequest._id)

    if (pendingDelete === false) {
      return res.status(400).send({
        success: false,
        code: 1000,
        message: "Not deleted, unknown error"
      });
    }

    res.send({
      success: true,
      code: 1004,
      message: "Friend request deleted or friend removed"
    });
  } catch (error) {
    logger.error(new Error(error));
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
});

router.put('/users/friend/respond', auth, async (req, res) => {
  const user = req.user;
  try {
    if (req.body.userId == null || req.body.userId == '') {
      return res.status(400).send({
        success: false,
        code: 1002,
        message: "Invalid format"
      });
    }

    const reqUser = await User.findByUserId(req.body.userId);
    if (reqUser == null) {
      return res.status(401).send({
        success: false,
        code: 1002,
        message: "Invalid data",
        errors: [{
          code: 2002,
          message: "Invalid user"
        }]
      });
    }

    const currentRequest = await Friend.findByReceiverId(user.userId, reqUser.userId);
    if (currentRequest === null || currentRequest.status === true) {
      return res.status(401).send({
        success: false,
        code: 1002,
        message: "Invalid data",
        errors: [{
          code: 2004,
          message: "You do not have a pending request from that user."
        }]
      });
    }

    let pendingAccept = await Friend.acceptRequest(currentRequest._id)

    if (pendingAccept === false) {
      return res.status(400).send({
        success: false,
        code: 1000,
        message: "Not accepted, unknown error"
      });
    }

    res.send({
      success: true,
      code: 1004,
      message: "Friend request accepted"
    });
  } catch (error) {
    logger.error(new Error(error));
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
});



module.exports = router