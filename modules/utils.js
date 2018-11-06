const logger = require('./logger.js');
const db = require('./database');
const base64url = require('base64url');
const crypto = require('crypto');

exports.querydb = async (query, args) => {
    return new Promise((resolve, reject) => {
        db.query(query, args, (err, rows) => {
            if (err) return reject(new Error(err));
            return resolve(rows);
        });
    });
};

exports.randomBytes = size => {
    return base64url(crypto.randomBytes(size));
};
