const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/loggerUtil');

const friendSchema = mongoose.Schema({
  sender: {
    type: String,
    required: true,
    trim: true
  },
  receiver: {
    type: String,
    required: true,
    trim: true
  },
  sent: {
    type: Number,
    required: true,
    trim: true
  },
  status: {
    type: Boolean,
    required: true
  },
  accepted: {
    type: Number
  },
})

friendSchema.pre('save', function (next) {
  var friend = this;

  return next();
})

friendSchema.statics.findAll = async (userId) => {
  // Finds all friend relations by a userId
  let request = await Friend.find({
    $or: [{
        'sender': userId
      },
      {
        'receiver': userId
      }
    ]
  });
  if (!request) {
    return null;
  } else {
    return request;
  }
}

friendSchema.statics.findBySenderId = async (senderId, receiverId) => {
  // Search for a friend relationship by senderId
  let request = await Friend.findOne({
    "sender": senderId,
    "receiver": receiverId
  });
  if (!request) {
    return null;
  } else {
    return request;
  }
}

friendSchema.statics.findByReceiverId = async (receiverId, senderId) => {
  // Search for a friend relationship by receiverId
  let request = await Friend.findOne({
    "sender": senderId,
    "receiver": receiverId
  });
  if (!request) {
    return null;
  } else {
    return request;
  }
}

friendSchema.statics.findByBoth = async (senderId, receiverId) => {
  // Search for a friend relationship by senderId & receiverId
  let request = await Friend.findOne({
    "sender": senderId,
    "receiver": receiverId
  });
  if (!request) {
    request = await Friend.findOne({
      "sender": receiverId,
      "receiver": senderId
    });
  }
  if (!request) {
    return null;
  } else {
    return request;
  }
}

friendSchema.statics.deleteRequest = async (id) => {
  // Delete's a friend request
  Friend.deleteOne({
    "_id": id
  }, function (err) {
    if (err) {
      logger.error(new Error(err));
      return false;
    }
    return true;
  });
}

friendSchema.statics.acceptRequest = async (id) => {
  // Accepts a friend request
  let request = await Friend.findOne({
    "_id": id
  });

  if (!request) {
    return false;
  } else {
    request.status = true;
    request.accepted = Date.now();

    request.save();
    return true;
  }
}

const Friend = mongoose.model('Friend', friendSchema);

module.exports = Friend;