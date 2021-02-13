const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/loggerUtil');

const communitySchema = mongoose.Schema({
  communityId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  owner: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  channels: [{
    _id: false,
    channelId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  }],
  members: [{
    _id: false,
    userId: {
      type: String,
      required: true,
      trim: true
    },
    roles: [{
      _id: false,
      id: {
        type: Number,
        required: true
      },
      joined: {
        type: Number,
        required: true
      }
    }]
  }],
  roles: [{
    _id: false,
    id: {
      type: Number,
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    inherit: {
      type: Number,
      required: false
    },
    name: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false
    },
    permissions: {
      type: Map,
      of: Boolean
    }
  }]
})

communitySchema.pre('save', function (next) {
  var community = this;

  return next();
})


communitySchema.statics.findByCommunityId = async (communityId) => {
  // Search for a community by communityId
  const community = await Community.findOne({
    communityId
  });
  if (!community) {
    return null;
  } else {
    return community;
  }
}

communitySchema.statics.findChannelByChannelId = async (communityId, channelId) => {
  // Search for a channel by channelId
  const community = await Community.findOne({
    "communityId": communityId,
    "channels.channelId": channelId
  });
  if (!community) {
    return null;
  } else {
    return community;
  }
}

communitySchema.statics.updateDisplayName = async (community, displayName) => {
  // Changes community display name

  community.displayName = displayName;

  await community.save();
  return true;
}

communitySchema.statics.createChannel = async (communityId, channelName, channelId) => {
  // Creates a channel in a community
  const community = await Community.findOne({
    communityId
  });
  if (community == null) return null;

  community.channels.push({
    channelId: channelId,
    name: channelName
  });

  community.save();
  return true;
}

communitySchema.statics.deleteChannel = async (communityId, channelId) => {
  // Deletes a channel from a community
  const community = await Community.findOne({
    communityId
  });
  if (community == null) return null;

  for (var i = 0; i < community.channels.length; i++) {
    if (community.channels[i].channelId === channelId) {
      community.channels.splice(i, 1);
      break;
    }
  }

  community.save();
  return true;
}

communitySchema.statics.editChannelName = async (communityId, channelId, channelName) => {
  // Edits a channels name.
  const community = await Community.findOne({
    communityId
  });
  if (community == null) return null;

  var channelIndex = null;
  for (var i = 0; i < community.channels.length; i++) {
    if (community.channels[i].channelId === channelId) {
      channelIndex = i;
      break;
    }
  }
  if (channelIndex == null) return null;

  community.channels[channelIndex].name = channelName;

  community.save();
  return true;
}

communitySchema.statics.delete = async (community) => {
  // Deletes community

  Community.deleteOne({
    "communityId": community.communityId
  }, function (err) {
    if (err) {
      logger.error(new Error(err));
      return false;
    }
    return true;
  });
}

communitySchema.statics.findRole = async (community, roleId) => {
  // Find a role by roleId
  var roleIndex = null;
  for (var i = 0; i < community.roles.length; i++) {
    if (community.roles[i].id === roleId) {
      roleIndex = i;
      break;
    }
  }
  if (roleIndex == null) return null;

  return community.roles[roleIndex];
}

communitySchema.statics.hasRole = async (community, user, role) => {
  // Check if user has a role
  for (var i = 0; i < community.members.length; i++) {
    var memberEntry = community.members[i];
    if (memberEntry.userId !== user.userId) continue;
    const hasRole = await memberEntry.roles.some(function (search) {
      if (search.id === role.id) {
        return true;
      }
    });
    return hasRole;
  }
  return false;
}

communitySchema.statics.joinRole = async (community, user, role) => {
  // Make a user join a role
  for (var i = 0; i < community.members.length; i++) {
    var memberEntry = community.members[i];
    if (memberEntry.userId !== user.userId) continue;
    memberEntry.roles.push({
      'id': role.id,
      'joined': new Date().getTime()
    });
  }
  community.save();
}

communitySchema.statics.leaveRole = async (community, user, role) => {
  // Make a user leave a role
  for (var i = 0; i < community.members.length; i++) {
    var memberEntry = community.members[i];
    if (memberEntry.userId !== user.userId) continue;
    memberEntry.roles.pull({ 'id': role.id });
  }
  community.save();
}

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;
