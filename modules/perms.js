const { querydb } = require("./utils");
const logger = require('./logger');

const levels = {
    site: {
        member: 0,
        moderator: 1,
        administrator: 2
    },
    forum: {
        banned: -1,
        member: 0,
        moderator: 1,
        administrator: 2
    },
    api: {
        banned: -1,
        member: 0,
        premium: 1,
        administrator: 2
    }
};

exports.minSiteRole = (role = 'member') => {
    return (req, res, next) => {
        if (role.toLowerCase() == 'everyone') return next();
        if (!req.session || !req.session.user_id) return res.render('perms/denied');
        role = role.toLowerCase();
        querydb("SELECT site_role FROM accounts WHERE id = ?", req.session.user_id)
        .then(user => {
            const userSiteRole = user[0].site_role.toLowerCase();

            if (levels.site[userSiteRole] < levels.site[role]) return res.render('perms/denied');
            return next();
        }).catch(logger.error);
    };
};

exports.minApiRole = (role = 'member') => {
    return (req, res, next) => {
        role = role.toLowerCase();
        if (role == 'everyone') return next();
        if (!req.session || !req.session.user_id) return res.render('perms/denied');
        querydb("SELECT api_role FROM accounts WHERE id = ?", req.session.user_id)
        .then(user => {
            const userApiRole = user[0].api_role.toLowerCase();

            if (levels.api[userApiRole] < levels.api[role]) return res.render('perms/denied');
            return next();
        }).catch(logger.error);
    };
};

exports.minForumRole = (role = 'member') => {
    return (req, res, next) => {
        if (role.toLowerCase() == 'everyone') return next();
        if (!req.session || !req.session.user_id) return res.render('perms/denied');
        if (req.session.forum_role.toLowerCase() == 'banned') return res.render('perms/banned');
        role = role.toLowerCase();
        querydb("SELECT forum_role FROM accounts WHERE id = ?", req.session.user_id)
        .then(user => {
            const userForumRole = user[0].forum_role.toLowerCase();

            if (userForumRole == 'banned') return res.render('perms/banned');
            if (levels.forum[userForumRole] < levels.forum[role]) return res.render('perms/denied');
            return next();
        }).catch(logger.error);
    };
};
