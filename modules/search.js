const { querydb } = require('./utils');
const database = require('./database');
const logger = require('./logger');

exports.queryUsers = async searchString => {
    const stringArgs = searchString.split(' ');
    let queryArgs = [], selectArgs = [];
    let query = `SELECT id,username,avatar,cover,bio FROM accounts WHERE LOWER(username) REGEXP `;

    for (let i = 0; i < stringArgs.length; i++) {
        queryArgs.push(stringArgs[i]);
    }
    query += database.escape(queryArgs.join('|'));
    query += ` AND profile_privacy = 'everyone'`;
    return await querydb(query, selectArgs).catch(logger.error);
};
