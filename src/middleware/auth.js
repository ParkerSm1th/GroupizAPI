const jwt = require('jsonwebtoken');
const User = require('../models/quiz');
var mongoose = require('mongoose');


function checkAuthorization(token, res) {
  // Basic check to see if there's both a token type and a token provided
  if (token == null) {
    res.status(400).send({
      success: false,
      code: 1001,
      message: "Missing bearer token"
    });
    return null;
  }
  if (!token.includes(" ")) {
    res.status(400).send({
      success: false,
      code: 1002,
      message: "Invalid data",
      errors: [{
        code: 2002,
        message: "Invalid token provided",
        field: token
      }]
    });
    return null;
  }

  const [type, auth] = token.split(" ");
  if (!type || !auth) {
    res.status(400).send({
      success: false,
      code: 1002,
      message: "Invalid data",
      errors: [{
        code: 2002,
        message: "Invalid token provided",
        field: token
      }]
    });
    return null;
  }

  return {
    type,
    token: auth
  };
}

const auth = async (req, res, next) => {
  const token = req.header("Authorization");
  const authData = checkAuthorization(token, res);

  if (authData == null) return;

  if (authData.type !== "Bearer") {
    return res.status(400).send({
      success: false,
      code: 1002,
      message: "Invalid data",
      errors: [{
        code: 2005,
        message: "Invalid token type",
        field: token
      }]
    });
  }

  const validAuthToken = await User.validAuthToken(authData.token);

  if (!validAuthToken) {
    return res.status(400).send({
      success: false,
      code: 1002,
      message: "Invalid data",
      errors: [{
        code: 2002,
        message: "Invalid token provided",
        field: token
      }]
    });
  }

  try {
    jwt.verify(authData.token, process.env.JWT_KEY, async function (err, decoded) {
      if (err) {
        return res.status(500).send({
          success: false,
          message: 'Failed to authenticate token.'
        });
      }
      // if everything good, save to request for use in other routes
      req.user = await User.findFromId(`${decoded._id}`);
      next();
    });
  } catch (e) {

  }
}
module.exports = auth;