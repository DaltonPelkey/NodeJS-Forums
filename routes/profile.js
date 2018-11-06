const router = require('express').Router();
const profiles = require('../modules/profiles');
const middlewares = require('../modules/middlewares');
const files = require('../modules/files');
const logger = require('../modules/logger');
const path = require('path');
const { randomBytes } = require('../modules/utils');

exports.baseRoute = '/profile';

router.get('/:username', async (req, res) => {
    if (!req.params.username) return res.status(404).render('404');
    const user = await profiles.getUser(req.params.username);
    if (user.length < 1) return res.status(404).render('404');
    user.followCounts = await profiles.getFollowCounts(user.id);
    let doesFollow = false;
    if (req.session && req.session.user_id) {
        doesFollow = await profiles.doesFollow(user.id, req.session.user_id);
    }

    res.render('profile/profile.ejs', {title: user.username, profile: user, doesFollow: doesFollow});
});

router.post('/updateSettings', middlewares.checkSession, async (req, res) => {
    const errors = await profiles.updateSettings(req.body, req.session.username, req.session.user_id, req).catch(logger.error);
    res.send(errors);
});

router.post('/follow', middlewares.checkSession, (req, res) => {
    if (!req.body || !req.body.to || !req.body.from) return res.status(405).send('Invalid parameters');
    if (req.body.to == req.body.from) return res.sendStatus(200);
    profiles.addFollow(req.body.to, req.body.from);
    res.sendStatus(200);
});

router.post('/unfollow', middlewares.checkSession, (req, res) => {
    if (!req.body || !req.body.to || !req.body.from) return res.status(405).send('Invalid parameters');
    if (req.body.to == req.body.from) return res.sendStatus(200);
    profiles.removeFollow(req.body.to, req.body.from);
    res.sendStatus(200);
});

exports.router = router;
