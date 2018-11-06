const { querydb } = require('./utils');
const logger = require('./logger');

exports.getProfile = async (term, type) => {
    const query = "SELECT id,username,avatar,cover,bio,reputation,forum_role FROM accounts WHERE LOWER(??) = LOWER(?)";
    const profile = await querydb(query, [type, term]).catch(logger.error);
    if (profile.length > 1) return [profile[0]];
    return profile;
};
