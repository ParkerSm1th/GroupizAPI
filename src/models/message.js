const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/loggerUtil');

const messageSchema = mongoose.Schema({
  author: {
    type: String,
    required: true,
    trim: true
  },
  community: {
    type: String,
    required: true,
    trim: true
  },
  channel: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  reactions: [{
    emojiId: {
      type: Number,
      required: true
    },
    emojiName: {
      type: String,
      required: true
    },
    users: [{
      userId: {
        type: String,
        required: true
      }
    }]
  }],
  pinned: {
    type: Boolean,
    required: true
  }
})

messageSchema.pre('save', function (next) {
  var message = this;

  return next();
})

messageSchema.statics.fetch = async (serverId, channelId, limit) => {
  // Fetches the limit of latest messages in the specified channel.
  let request = await Message.find({
    'community': serverId,
    'channel': channelId
  }).sort({
    timestamp: -1
  }).limit(limit);
  if (!request) {
    return null;
  } else {
    return request;
  }
}

messageSchema.statics.fetchBefore = async (serverId, channelId, limit, before) => {
  // Fetches the limit of latest messages in the specified channel before a certain time
  let request = await Message.find({
    'community': serverId,
    'channel': channelId,
    'timestamp': {
      $lt: before
    }
  }).sort({
    timestamp: -1
  }).limit(limit);
  if (!request) {
    return null;
  } else {
    return request;
  }
}

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;