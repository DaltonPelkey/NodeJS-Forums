require('dotenv').config();

const { querydb } = require('./utils');
const logger = require('./logger');
const constants = require('./constants');

exports.checkSession = (req, res, next) => {
    if (!req.session || !req.session.user_id) return res.status(403).send('You must be logged in to do that!');
    return next();
};
