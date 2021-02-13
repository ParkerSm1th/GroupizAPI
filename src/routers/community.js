const express = require('express');
const router = express.Router();

const randomUtil = require('../utils/randomUtil');
const communityUtil = require('../utils/communityUtil');
const logger = require('../utils/loggerUtil');

const User = require('../models/user');
const Community = require('../models/community');
const auth = require('../middleware/auth');

/* ------------------ Community Creation/Deletion  ------------------ */

router.post('/communities/create', auth, async (req, res) => {
  // Create a new community
  try {

    const user = req.user;

    if (req.body.communityName == null || req.body.communityName == "") {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      })
    }
    const community = new Community();
    community.displayName = req.body.communityName;
    community.owner = user.userId;

    const communityId = await randomUtil.getNewCommunityId();

    community.communityId = communityId;

    const channelId = await randomUtil.getNewChannelId(communityId);
    community.channels.push({
      channelId: channelId,
      name: "default"
    });

    community.roles.push({
      id: 0,
      position: 0,
      name: "New Member",
      color: "#0AA",
      description: "This is the default role for new community members",
      permissions: {
        chat: true
      }
    }, {
      id: 1,
      position: 1,
      inherit: 0,
      name: "Admin",
      color: "#F00",
      description: "This is the default Admin role",
      permissions: {
        everything: true
      }
    });

    await community.save();
    User.joinCommunity(user.userId, community.communityId);
    res.status(201).send({
      success: true,
      code: 201,
      communityId: communityId
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

router.post('/communities/:communityId/delete', auth, async (req, res) => {
  // Delete a community
  try {

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const validPerms = await communityUtil.checkPermissions(req);
    if (validPerms !== null) return res.status(500).send(validPerms);

    const community = await Community.findByCommunityId(req.params.communityId);

    Community.delete(community);

    res.status(201).send({
      success: true,
      code: 1004,
      message: "Successfully deleted community."
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


/* ------------------ Editing Community  ------------------ */

router.post('/communities/:communityId/info/edit/displayName', auth, async (req, res) => {
  // Edit's display name of community.
  try {
    if (req.body.displayName == null || req.body.displayName == "") {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      })
    }

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const validPerms = await communityUtil.checkPermissions(req);
    if (validPerms !== null) return res.status(500).send(validPerms);

    const community = await Community.findByCommunityId(req.params.communityId);

    Community.updateDisplayName(community, req.body.displayName);

    res.status(201).send({
      success: true,
      code: 1004,
      message: "Successfully updated: Display Name"
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

router.post('/communities/:communityId/info/roles', auth, async (req, res) => {
  // Edit's display name of community.
  try {
    if (req.body == null || req.body == "") {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      })
    }

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const validPerms = await communityUtil.checkPermissions(req);
    if (validPerms !== null) return res.status(500).send(validPerms);

    const community = await Community.findByCommunityId(req.params.communityId);

    const roles = req.body;
    let error = false;
    for (var i = 0; i < roles.length; i++) {
      const com = new Object(roles[i]);
      if (com.id == undefined || typeof com.id !== 'number') error = true;
      if (com.position == undefined || typeof com.position !== 'number') error = true;
      if (com.name == null || com.name == '' || typeof com.name !== 'string') error = true;
      if (com.color == null || com.color == '') error = true;
      if (com.description == null || com.description == '' || typeof com.description !== 'string') error = true;
      if (com.permissions == null || com.permissions == '') error = true;
    }
    if (error == true) {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      });
    }
    community.roles = roles;
    community.save();
    res.status(201).send({
      success: true,
      code: 1004,
      message: "Successfully updated: Roles"
    });

  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

/* ------------------ Community Data  ------------------ */
router.get('/communities/:communityId/info', auth, async (req, res) => {
  // Edits a channel
  try {
    const channelId = req.body.channelId;

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const community = await Community.findByCommunityId(req.params.communityId);

    let roles = [];
    for (var i = 0; i < community.roles.length; i++) {
      let role = community.roles[i];
      if (role !== null) {
        let newRole = {
          id: role.id,
          position: role.position,
          name: role.name,
          color: role.color,
          description: role.description
        }
        roles.push(newRole);
      }
    }
    res.status(201).send({
      success: true,
      communityId: community.communityId,
      name: community.displayName,
      channels: community.channels,
      roles: roles
    });

  } catch (error) {
    logger.error(new Error(error));
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

router.get('/communities/:communityId/info/roles', auth, async (req, res) => {
  // Edit's display name of community.
  try {
    const user = req.user;

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const community = await Community.findByCommunityId(req.params.communityId);

    if (!User.inCommunity(user.userId, community.communityId)) {
      return res.status(500).send({
        success: false,
        code: 1003,
        message: "Invalid permissions, you are not a member of that community."
      });
    }

    if (community.roles === null) {
      res.status(201).send({
        success: false,
        code: 1005,
        message: "Data not found, that community has no roles."
      });
    }

    const validPerms = await communityUtil.checkPermissions(req);
    if (validPerms !== null) {
      let roles = [];
      for (var i = 0; i < community.roles.length; i++) {
        let role = community.roles[i];
        if (role !== null) {
          let newRole = {
            id: role.id,
            position: role.position,
            name: role.name,
            color: role.color,
            description: role.description
          }
          roles.push(newRole);
        }
      }
      return res.status(201).send({
        success: true,
        code: 1006,
        roles: roles
      });
    }

    res.status(201).send({
      success: true,
      code: 1006,
      roles: community.roles
    });

  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      code: 1000,
      message: "Unknown error"
    });
  }
})

/* ------------------ Editing Channels  ------------------ */
router.post('/communities/:communityId/channels/create', auth, async (req, res) => {
  // Create a new channel
  try {
    if (req.body.channelName == null || req.body.channelName == "") {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      })
    }

    const channelName = req.body.channelName;

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const validPerms = await communityUtil.checkPermissions(req);
    if (validPerms !== null) return res.status(500).send(validPerms);

    const validName = await communityUtil.checkChannelName(channelName);
    if (validName !== null) return res.status(400).send(validName);

    const community = await Community.findByCommunityId(req.params.communityId);

    const channelId = await randomUtil.getNewChannelId(community.communityId);

    Community.createChannel(community.communityId, channelName, channelId);

    res.status(201).send({
      success: true,
      channelName: channelName,
      channelId: channelId
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

router.post('/communities/:communityId/channels/:channelId/delete', auth, async (req, res) => {
  // Deletes a channel
  try {
    if (req.params.channelId == null || req.params.channelId == "") {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      })
    }

    const channelId = req.params.channelId;

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const validPerms = await communityUtil.checkPermissions(req);
    if (validPerms !== null) return res.status(500).send(validPerms);

    const validChannel = await communityUtil.validChannel(req);
    if (validChannel !== null) return res.status(400).send(validChannel);

    const community = await Community.findByCommunityId(req.params.communityId);

    Community.deleteChannel(community.communityId, channelId);

    res.status(201).send({
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
})

router.post('/communities/:communityId/channels/:channelId/edit', auth, async (req, res) => {
  // Edits a channel
  try {
    if (req.body.channelName == null || req.body.channelName == "") {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      })
    }

    const channelName = req.body.channelName;
    const channelId = req.params.channelId;

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const validPerms = await communityUtil.checkPermissions(req);
    if (validPerms !== null) return res.status(500).send(validPerms);

    const validChannel = await communityUtil.validChannel(req);
    if (validChannel !== null) return res.status(400).send(validChannel);

    const validName = await communityUtil.checkChannelName(channelName);
    if (validName !== null) return res.status(400).send(validName);

    const community = await Community.findByCommunityId(req.params.communityId);

    Community.editChannelName(community.communityId, channelId, channelName);

    res.status(201).send({
      success: true,
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

/* ------------------ Joining/Leaving Communities  ------------------ */

router.post('/communities/:communityId/join', auth, async (req, res) => {
  // Join a community
  try {
    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    var community = await Community.findByCommunityId(req.params.communityId);

    const user = req.user;

    const isInCommunity = await User.inCommunity(user.userId, community.communityId);

    if (isInCommunity == true) {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "You are already a member of that community."
      })
    }

    User.joinCommunity(user.userId, community.communityId);

    res.status(201).send({
      success: true,
      code: 1004,
      message: "Successfully joined the community."
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

router.post('/communities/:communityId/leave', auth, async (req, res) => {
  // Leave a community
  try {
    if (req.params.communityId == null || req.params.communityId == "") {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      })
    }

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    var community = await Community.findByCommunityId(req.params.communityId);

    const user = req.user;

    const isInCommunity = await User.inCommunity(user.userId, community.communityId);

    if (isInCommunity == false) {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "You are not a member of that community."
      })
    }

    User.leaveCommunity(user.userId, community.communityId);

    res.status(201).send({
      success: true,
      code: 1004,
      message: "Successfully left that community."
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

/* ------------------ Joining/Leaving Roles  ------------------ */

router.post('/communities/:communityId/roles/join', auth, async (req, res) => {
  // Have a user join a role
  try {
    if (req.params.communityId == null || req.params.communityId == ""
      || req.body.roleId == null || req.body.roleId == "") {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      });
    }

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const validPerms = await communityUtil.checkPermissions(req);
    if (validPerms !== null) return res.status(500).send(validPerms);

    var community = await Community.findByCommunityId(req.params.communityId);
    const user = req.user;

    const validRole = await communityUtil.validRole(req);
    if (validRole !== null) return res.status(500).send(validRole);
    var role = await Community.findRole(community, req.body.roleId);
    if (role == null) return res.status(500).send({
      success: false,
      code: 1000,
      message: "Invalid role"
    });

    if (await Community.hasRole(community, user, role)) {
      return res.status(500).send({
        success: false,
        code: 1000,
        message: "User already has that role."
      });
    }

    Community.joinRole(community, user, role);

    res.status(201).send({
      success: true,
      code: 1004,
      message: "Successfully added user to role."
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

router.post('/communities/:communityId/roles/leave', auth, async (req, res) => {
  // Have a user leave a role
  try {
    if (req.params.communityId == null || req.params.communityId == ""
      || req.body.roleId == null || req.body.roleId == "") {
      return res.status(400).send({
        success: false,
        code: 1001,
        message: "Invalid format"
      });
    }

    const validCommunity = await communityUtil.validCommunity(req);
    if (validCommunity !== null) return res.status(400).send(validCommunity);

    const validPerms = await communityUtil.checkPermissions(req);
    if (validPerms !== null) return res.status(500).send(validPerms);

    var community = await Community.findByCommunityId(req.params.communityId);
    const user = req.user;

    const validRole = await communityUtil.validRole(req);
    if (validRole !== null) return res.status(500).send(validRole);
    var role = await Community.findRole(community, req.body.roleId);
    if (role == null) return res.status(500).send({
      success: false,
      code: 1000,
      message: "Invalid role"
    });

    if (!await Community.hasRole(community, user, role)) {
      return res.status(500).send({
        success: false,
        code: 1000,
        message: "User doesn't have that role."
      });
    }

    Community.leaveRole(community, user, role);

    res.status(201).send({
      success: true,
      code: 1004,
      message: "Successfully removed user from role."
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

module.exports = router
