const router = require('express').Router();

exports.baseRoute = '/';

router.get('/', (req, res) => {
    res.render('index', {title: "Home"});
});

router.get('/policies', (req, res) => {
    res.render('terms', {title: "Policies"});
});

exports.router = router;
