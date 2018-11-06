const router = require('express').Router();
const files = require('../modules/files');
const middlewares = require('../modules/middlewares');

exports.baseRoute = '/uploads';

router.post('/validateImage', middlewares.checkSession, async (req, res) => {
    if (!req.body || !req.body.url) return res.sendStatus(403);
    try {
        await files.validateImage(req.body.url);
    } catch(err) {
        return res.send(err);
    }
    return res.send(true);
});

exports.router = router;
