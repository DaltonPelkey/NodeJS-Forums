const router = require('express').Router();
const forum = require('../modules/forum');
const { uniqueArray } = require('../modules/utils');
const logger = require('../modules/logger');
const roles = require('../modules/perms');
const perms = require('../configs/permissions');

exports.baseRoute = '/forums/threads';



exports.router = router;
