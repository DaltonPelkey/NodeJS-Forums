const router = require('express').Router();
const api = require('../modules/api');
const logger = require('../modules/logger');
const roles = require('../modules/perms');
const perms = require('../configs/permissions');
const codes = require('../configs/codes');

exports.baseRoute = '/api/v1';

// Response format: { [data: Array] [, error: { code: Integer, message: String }] }

router.get('/user/profile', roles.minApiRole(perms.api.get_profile), async (req, res) => {
    if (!req.query.username && !req.query.user_id) return res.send({ error: { code: codes.api.invalid_parameters, message: "Required prameters: username, or user_id" }});
    let param, type;
    if (req.query.username) {
        param = req.query.username;
        type = 'username';
    } else {
        param = req.query.user_id;
        type = 'id';
    }
    const profile = await api.getProfile(param, type);
    return res.send({ data: profile });
});

exports.router = router;
