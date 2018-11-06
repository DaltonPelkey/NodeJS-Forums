const fs = require('fs');
const request = require('request');
const constants = require('./constants');
const logger = require('./logger');
const { randomBytes } = require('./utils');
const magic = {
    jpg: 'ffd8ff',
    png: '89504e47'
};

exports.validateImage = async url => {
    const options = {
        method: 'GET',
        url: url,
        encoding: null
    };

    return new Promise((resolve, reject) => {
        request(options, function (err, res, body) {
            if (err) return reject(constants.INVALID_URL);
            if (res.statusCode !== 200) return reject(constants.INVALID_URL);

            const magicNumbers = body.toString('hex', 0, 4);

            if (!magicNumbers.startsWith(magic.jpg) && !magicNumbers.startsWith(magic.png)) return reject(constants.INVALID_IMAGE);

            const type = res.headers['content-type'];
            const size = parseInt(res.headers['content-length']);

            if (type !== 'image/png' && type !== 'image/jpeg') return reject(constants.INVALID_IMAGE);
            if (size > 5242880) return reject(constants.SIZE_EXCEED);

            return resolve();
        });
    });
};

exports.uploadFromURL = async (url, path) => {
    return new Promise((resolve, reject) => {
        request(url).pipe(fs.createWriteStream(path, {highWaterMark: Math.pow(2,16)})).on('close', () => {
            return resolve();
        });
    });
};

exports.rm = async path => {
    fs.unlink(path, function (err) {
        if (err) return logger.error(err);
    });
};

exports.mkdir = async path => {
    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
};
