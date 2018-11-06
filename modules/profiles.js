require('dotenv').config();

const { querydb, randomBytes } = require('./utils');
const logger = require('./logger');
const constants = require('./constants');
const files = require('./files');
const path = require('path');
const { idFromUsername } = require('./accounts');

exports.getUser = async username => {
    const query = `SELECT
                    id,
                    username,
                    email,
                    email_verified,
                    date_created,
                    first_name,
                    last_name,
                    birthday,
                    bio,
                    avatar,
                    cover,
                    minecraft_username,
                    reputation,
                    forum_role,
                    site_role,
                    profile_privacy,
                    last_seen
                    FROM accounts WHERE LOWER(username) = LOWER(?)`;
    const user = await querydb(query, username).catch(logger.error);
    if (user.length > 0) return user[0];
    return [];
};

exports.getFollowCounts = async id => {
    const query = `SELECT SUM(to_id = ?) as followerCount, SUM(from_id = ?) as followingCount FROM follows WHERE to_id = ? OR from_id = ?`;
    const counts = await querydb(query, [id,id,id,id]).catch(logger.error);
    const followCounts = {
        follower: counts[0].followerCount ? counts[0].followerCount : 0,
        following: counts[0].followingCount ? counts[0].followingCount : 0
    }
    return Promise.resolve(followCounts);
};

exports.addFollow = async (to, from) => {
    let query = `SELECT * FROM follows WHERE to_id = ? AND from_id = ?`;
    let row = await querydb(query, [to, from]).catch(logger.error);
    if (row.length > 0) return true;
    query = `INSERT INTO follows (to_id, from_id) VALUES(?,?)`;
    await querydb(query, [to, from]).catch(logger.error);
    return true;
};

exports.removeFollow = async (to, from) => {
    const query = `DELETE FROM follows WHERE to_id = ? AND from_id = ?;`;
    await querydb(query, [to, from]).catch(logger.error);
    return true;
};

exports.doesFollow = async (to, from) => {
    const query = `SELECT * FROM follows WHERE to_id = ? AND from_id = ?`;
    const row = await querydb(query, [to, from]).catch(logger.error);
    if (row.length > 0) return true;
    return false;
};

exports.saveImageToDatabase = async (type, path, user_id) => {
    let query = `UPDATE accounts SET `
    if (type == 'avatar') {
        query += `avatar = ? `;
    } else if (type == 'cover') {
        query += `cover = ? `;
    } else {
        return Promise.reject('Invalid type');
    }
    query += `WHERE id = ?`;

    await querydb(query, [path, user_id]).catch(console.error);
    return Promise.resolve();
};

exports.deleteOldImage = async (type, username) => {
    const updateQuery = `UPDATE accounts SET ${type} = ? WHERE LOWER(username) = LOWER(?)`;
    const selectQuery = `SELECT ${type} FROM accounts WHERE LOWER(username) = LOWER(?)`;
    const user = await querydb(selectQuery, [username]).catch(logger.error);
    const filePath = user[0][type];
    const filePathArr = filePath.split('/');
    const filename = filePathArr[filePathArr.length - 1];
    if (filename == 'cover.jpg' || filename == 'avatar.png') return Promise.resolve();
    files.rm(path.join(__dirname, '..', 'public', filePath));
    let typePath;
    if (type == 'avatar') {
        typePath = '/assets/defaults/avatar.png';
    } else if (type == 'cover') {
        typePath = '/assets/defaults/cover.jpg';
    }
    await querydb(updateQuery, [typePath, username]).catch(logger.error);
    return Promise.resolve();
};

exports.updateSettings = async (b, username, user_id, req) => {
    let query = `UPDATE accounts SET `;
    let queryArr = [], argArr = [], errors = [];

    if (b.avatar && b.avatar.length > 0) {
        let validated = false;
        try {
            await files.validateImage(b.avatar);
            validated = true;
        } catch(err) {
            validated = false;
            errors.push(err);
        }
        let filename = randomBytes(25) + '.png';
        if (validated) {
            await this.deleteOldImage('avatar', username).catch(logger.error);
            files.uploadFromURL(b.avatar, path.join(__dirname, '..', 'public', 'assets', 'profiles', username.toLowerCase(), filename)).catch(logger.error);
            this.saveImageToDatabase('avatar', '/assets/profiles/' + username.toLowerCase() + '/' + filename, user_id).catch(logger.error);
            req.session.avatar = '/assets/profiles/' + username.toLowerCase() + '/' + filename;
        }
    }

    if (b.cover && b.cover.length > 0) {
        let validated = false;
        try {
            await files.validateImage(b.cover);
            validated = true;
        } catch(err) {
            validated = false;
            errors.push(err);
        }
        let filename = randomBytes(25) + '.png';
        if (validated) {
            await this.deleteOldImage('cover', username).catch(logger.error);
            files.uploadFromURL(b.cover, path.join(__dirname, '..', 'public', 'assets', 'profiles', username.toLowerCase(), filename)).catch(logger.error);
            this.saveImageToDatabase('cover', '/assets/profiles/' + username.toLowerCase() + '/' + filename, user_id).catch(logger.error);
            req.session.cover = '/assets/profiles/' + username.toLowerCase() + '/' + filename;
        }
    }

    if (b.bio && b.bio.length > 0) {
        if (b.bio.length > 200) b.bio = b.bio.substring(0, 200);
        queryArr.push(`bio = ?`);
        argArr.push(b.bio);
        req.session.bio = b.bio;
    } else {
        queryArr.push(`bio = 'This user has not set their bio yet.'`);
        req.session.bio = 'This user has not set their bio yet.';
    }

    if (b.minecraft_username && b.minecraft_username.length > 0) {
        if (b.minecraft_username.length < 3 || b.minecraft_username.length > 16) {
            errors.push('Minecraft username was not saved.');
        } else {
            queryArr.push(`minecraft_username = ?`);
            argArr.push(b.minecraft_username);
            req.session.minecraft_username = b.minecraft_username;
        }
    } else {
        queryArr.push(`minecraft_username = null`);
        req.session.minecraft_username = null;
    }

    if (b.birthday && b.birthday.length > 0) {
        let provided = new Date(b.birthday);
        let today = new Date().getMilliseconds();
        if (provided == 'Invalid Date') {
            errors.push('Birthday was not saved.');
        } else if(provided.getMilliseconds() > today) {
            errors.push('Birthday was not saved. You weren\'t born tomorrow :^)');
        } else {
            queryArr.push(`birthday = ?`);
            argArr.push(new Date(b.birthday).toISOString().substring(0,10));
            req.session.birthday = b.birthday;
        }
    } else {
        queryArr.push(`birthday = null`);
        req.session.birthday = null;
    }

    if (queryArr.length > 0) {
        query += queryArr.join(',');
        query += ` WHERE id = ${user_id}`;
        await querydb(query, argArr).catch(logger.error);
    }
    return Promise.resolve(errors);
};
