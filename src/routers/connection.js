const express = require('express');
const version = process.env.npm_package_version;
var url = require('url');
const logger = require('../utils/loggerUtil');

const router = express.Router();

router.get('/ping', async (req, res) => {
  const finalUrl = url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });
  res.status(201).send({
    success: true,
    version: version,
    url: finalUrl
  });
  logger.debug('Server pinged');
});

module.exports = router;