const Quiz = require('../models/quiz');

async function validQuiz(req) {
  var quiz = await Quiz.findByCode(req.body.quizCode == null ? req.params.quizCode : req.body.quizCode);

  if (!quiz) {
    return {
      success: false,
      code: "invalid_format",
      message: "Invalid format",
      errors: [{
        code: "invalid_quiz",
        message: "Invalid quiz code",
        field: "quizCode"
      }]
    }
  }

  return null;
}

async function validQuestion(req) {
  var quiz = await Quiz.findByCode(req.body.quizCode == null ? req.params.quizCode : req.body.quizCode);

  var question = await Quiz.findQuestionById(req.params.quizCode, req.params.questionId);

  if (!question) {
    return {
      success: false,
      code: "invalid_format",
      message: "Invalid format",
      errors: [{
        code: "invalid_question",
        message: "Invalid questionId",
        field: "questionId"
      }]
    }
  }

  return null;
}

async function validChannel(req) {
  var community = await Community.findByCommunityId(req.body.communityId == null ? req.params.communityId : req.body.communityId);

  if (community == null) return {
    success: false,
    code: 1002,
    message: "Invalid community"
  };

  let channelId = req.body.channelId || req.params.channelId;

  const isInArray = await community.channels.some(function (channel) {
    if (channel.channelId == channelId) {
      return true;
    }
  });

  if (isInArray) {
    return null
  } else {
    return {
      success: false,
      code: 1002,
      message: "Invalid channel"
    }
  }
}

async function validRole(req) {
  var community = await Community.findByCommunityId(req.body.communityId == null ? req.params.communityId : req.body.communityId);

  if (community == null) return {
    success: false,
    code: 1002,
    message: "Invalid community"
  };

  let roleId = req.body.roleId;

  const isInArray = await community.roles.some(function (role) {
    if (role.id == roleId) {
      return true;
    }
  });

  if (isInArray) {
    return null
  } else {
    return {
      success: false,
      code: 1002,
      message: "Invalid role"
    }
  }
}

async function checkPermissions(req) {
  const user = req.user;
  var community = await Community.findByCommunityId(req.body.communityId);

  if (req.body.communityId == null) community = await Community.findByCommunityId(req.params.communityId);

  if (community.owner !== req.user.userId) {
    return {
      success: false,
      code: 1003,
      message: "Invalid permissions"
    }
  }

  return null;
}

async function checkChannelName(name) {
  if (name.length < 2) return {
    success: false,
    code: 1002,
    message: "Channel names must be at least 2 characters long."
  };
  if (name.length > 32) return {
    success: false,
    code: 1002,
    message: "Channel names can only be up to 32 characters long."
  };

  var reg = "^([a-z])[a-z0-9-_]*$";
  if (name.search(reg) == -1) return {
    success: false,
    code: 1002,
    message: "Channel names can only contain lowercase letters, numbers, hyphens, and dashes."
  };

  return null;
}

module.exports.validQuiz = validQuiz;
module.exports.validQuestion = validQuestion;
module.exports.validRole = validRole;
module.exports.checkPermissions = checkPermissions;
module.exports.checkChannelName = checkChannelName;
