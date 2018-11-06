const router = require('express').Router();
const accounts = require('../modules/accounts');
const constants = require('../modules/constants');
const logger = require('../modules/logger');

exports.baseRoute = '/account';

router.get('/login', (req, res) => {
    res.render('auth/login', {title: "Login"});
});

router.post('/login', async (req, res) => {
    const user = req.body;
    let account;

    try {
        account = await accounts.login(user);
    } catch(err) {
        return res.send(err);
    }

    let s = req.session, a = account[0];
    s.user_id = a.id;
    s.username = a.username;
    s.email = a.email;
    s.email_verified = a.email_verified;
    s.first_name = a.first_name;
    s.last_name = a.last_name;
    s.birthday = a.birthday;
    s.bio = a.bio;
    s.avatar = a.avatar;
    s.minecraft_username = a.minecraft_username;
    s.reputation = a.reputation;
    s.forum_role = a.forum_role;
    s.site_role = a.site_role;
    s.profile_privacy = a.profile_privacy;
    s.last_seen = a.last_seen;
    req.session = s;

    return res.send(true);
});

router.get('/logout', (req, res) => {
    if (req.session && req.session.user_id) {
        req.session.destroy();
    }
    res.redirect('back');
});

router.get('/register', (req, res) => {
    res.render('auth/register', {title: "Register"});
});

router.post('/register', async (req, res) => {
    try {
        await accounts.register(req.body);
    } catch(err) {
        return res.send(err);
    }

    return res.send(true);
});

router.get('/forgot', (req, res) => {
    res.render('auth/forgotPassword', {title: "Recover Account"})
});

router.post('/forgot', async (req, res) => {
    if (!req.body || !req.body.email || req.body.email == '') return res.send(['Email is invalid.']);
    try {
        await accounts.forgotPassword(req.body.email);
    } catch(err) {
        return res.send(err);
    }
    return res.send(true);
});

router.get('/resetPassword', async (req, res) => {
    if (!req.query || !req.query.token || !req.query.user_id) return res.sendStatus(403);
    try {
        await accounts.validatePasswordResetToken(req.query.user_id, req.query.token);
    } catch(err) {
        return res.send(err[0]);
    }
    return res.render('auth/resetPassword', {title: "Reset Password", user_id: req.query.user_id, token: req.query.token});
});

router.post('/resetPassword', async (req, res) => {
    if (!req.body || !req.body.user_id || !req.body.token || !req.body.password) return res.sendStatus(403);
    if (!accounts.validatePassword(req.body.password)) return res.send(['Password must be between 8-60 characters.']);
    try {
        await accounts.resetPassword(req.body.user_id, req.body.token, req.body.password);
    } catch(err) {
        return res.send(err);
    }
    return res.send(true);
});

router.post('/checkExisting', async (req, res) => {
    let exists;
    if (req.body.username) {
        exists = await accounts.checkExisting(req.body.username);
    } else if (req.body.email) {
        exists = await accounts.checkExisting(req.body.email, 'email');
    } else {
        exists = true;
    }

    res.send(exists);
});

exports.router = router;
