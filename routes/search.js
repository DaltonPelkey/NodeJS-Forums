const router = require('express').Router();
const search = require('../modules/search');
const logger = require('../modules/logger');

exports.baseRoute = '/search';

router.get('/', async (req, res) => {
    let q = req.query.q;
    if (q.length > 100) q = q.substring(0,100);
    let returnObj = {results: []};

    if (q && q.length > 0) {
        returnObj.results = await search.queryUsers(q);
    }

    returnObj.title = 'Search';
    returnObj.q = q;
    res.render('search/search', returnObj);
});

exports.router = router;
