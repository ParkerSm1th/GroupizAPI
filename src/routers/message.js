const express = require('express');
const router = express.Router();

const randomUtil = require('../utils/randomUtil');
const communityUtil = require('../utils/communityUtil');
const logger = require('../utils/loggerUtil');

const User = require('../models/user');
const Message = require('../models/message');
const Community = require('../models/community');
const auth = require('../middleware/auth');

/* ------------------ Log Messages  ------------------ */

router.post('/message/log', auth, async (req, res) => {
  // Logs a new message
  try {

    const user = req.user;

    if (req.body.author == null || req.body.author == "" || req.body.communityId == null || req.body.communityId == "" || req.body.channelId == null || req.body.channelId == "" || req.body.message == null || req.body.message == "") {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      })
    }

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const community = await Community.findByCommunityId(req.body.communityId);

    const author = await User.findByUserId(req.body.author);

    if (author === null) {
      return res.status(400).send({
        success: false,
        code: 1002,
        message: "Invalid user"
      })
    }
    const inCommunity = await User.inCommunity(author.userId, community.communityId);
    if (inCommunity !== true) {
      return res.status(400).send({
        success: false,
        code: 1003,
        message: "You must be a member of that community!"
      })
    }

    const validChannel = await communityUtil.validChannel(req);
    if (validChannel !== null) return res.status(400).send(validChannel);

    const message = new Message();
    message.author = author.userId;
    message.community = community.communityId;
    message.channel = req.body.channelId;
    message.message = req.body.message;
    message.timestamp = Date.now();
    message.pinned = false;


    await message.save();
    res.status(201).send({
      success: true,
      code: 201
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

router.post('/message/list', auth, async (req, res) => {
  // Logs a new message
  try {

    const user = req.user;

    if (req.body.communityId == null || req.body.communityId == "" || req.body.channelId == null || req.body.channelId == "") {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      })
    }

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const community = await Community.findByCommunityId(req.body.communityId);

    const inCommunity = await User.inCommunity(user.userId, community.communityId);
    if (inCommunity !== true) {
      return res.status(400).send({
        success: false,
        code: 1003,
        message: "You must be a member of that community!"
      })
    }

    const validChannel = await communityUtil.validChannel(req);
    if (validChannel !== null) return res.status(400).send(validChannel);
    const channel = req.body.channelId;
    let limit = 50;
    if (req.body.limit !== undefined) {
      if (req.body.limit > 0 && req.body.limit <= 100) {
        limit = req.body.limit;
      } else {
        return res.status(400).send({
          success: false,
          code: 1001,
          message: "Invalid format"
        })
      }
    }
    let messages = [];
    let finalMessages = [];
    if (req.body.before !== undefined) {
      messages = await Message.fetchBefore(community.communityId, channel, limit, req.body.before);
      for (const id in messages) {
        const message = messages[id];
        finalMessages.push({
          author: message.author,
          timestamp: message.timestamp,
          message: message.message,
          reactions: message.reactions,
          pinned: message.pinned
        });
      }
      finalMessages.reverse();
    } else {
      messages = await Message.fetch(community.communityId, channel, limit);
      for (const id in messages) {
        const message = messages[id];
        finalMessages.push({
          author: message.author,
          timestamp: message.timestamp,
          message: message.message,
          reactions: message.reactions,
          pinned: message.pinned
        });
      }
      if (limit > 1) {
        finalMessages.reverse();
      }
    }

    res.status(201).send({
      success: true,
      messages: finalMessages
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


module.exports = router