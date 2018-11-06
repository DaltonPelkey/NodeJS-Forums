require('dotenv').config();

const { querydb, randomBytes } = require('./utils');
const bcrypt = require('bcrypt');
const path = require('path');
const logger = require('./logger');
const constants = require('./constants');
const { mkdir } = require('./files');
const request = require('request');
const mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_PRIVATEKEY, domain: process.env.MAILGUN_APP_URL});

exports.validateRegistration = async user => {
    const b = user;
    const fname = b.fname;
    const lname = b.lname;
    const username = b.username;
    const email = b.email;
    const password = b.password;
    const cpassword = b.cpassword;
    const errors = [];

    if (!validateName(fname)) errors.push("First name must be between 2-20 characters.");
	if (!validateName(lname)) errors.push("Last name must be between 2-20 characters.");
	if (!validateUsername(username)) errors.push("Username must be between 2-20 characters, must be alphanumeric, and may only contain underscores and periods.");
	if (!validatePassword(password)) errors.push("Password must be between 8-60 characters.");
	if (password !== cpassword) errors.push("Passwords do not match.");

    try {
        await validateEmail(email);
    } catch(err) {
        errors.push(err);
    }

    if (errors.length > 0) return Promise.reject(errors);
    return Promise.resolve();
};

exports.validatePassword = async password => {
    if (!password || !validatePassword(password) || password == '') return false;
    return true;
};

exports.register = async user => {
    let errors;
    try {
        errors = await this.validateRegistration(user);
    } catch(err) {
        return Promise.reject(err);
    }

    const query = `INSERT INTO accounts (first_name, last_name, username, email, password) VALUES (?,?,?,?,?)`;
    const queryArr = [];

    let hash;
    try {
        hash = await hashPassword(user.password);
    } catch(err) {
        logger.error(err);
        return Promise.reject([constants.SERVER_ERROR]);
    }

    queryArr.push(user.fname);
    queryArr.push(user.lname);
    queryArr.push(user.username);
    queryArr.push(user.email);
    queryArr.push(hash);

    try {
        await querydb(query, queryArr);
        mkdir(path.join(__dirname, '..', 'public', 'assets', 'profiles', user.username.toLowerCase()));
        sendWelcomeEmail(user.email);
        return Promise.resolve();
    } catch(err) {
        logger.error(err);
        return Promise.reject([constants.SERVER_ERROR]);
    }
};

exports.login = async user => {
    let errors, account, valid;

    const query = `SELECT * FROM accounts WHERE LOWER(email) = LOWER(?);`;

    try {
        account = await querydb(query, [user.email]);
    } catch(err) {
        logger.error(err);
        return Promise.reject({error: true, errors: [constants.SERVER_ERROR]});
    }

    try {
        valid = await checkPassword(account[0].password, user.password);
    } catch(err) {
        logger.error(err);
        return Promise.reject([constants.SERVER_ERROR]);
    }

    if (!valid) return Promise.reject([constants.INCORRECT_PASSWORD]);
    return Promise.resolve(account);
};

exports.forgotPassword = async (email) => {
    const token = randomBytes(50);
    const query = `INSERT INTO password_reset_tokens (user_id, token) VALUES(?,?)`;
    const user = await this.idFromEmail(email).catch(logger.error);

    if (user.length < 1) return Promise.reject([constants.SERVER_ERROR]);

    await querydb(query, [user[0].id, token]).catch(logger.error);
    sendPasswordResetEmail(email, token, user[0].id);
};

exports.validatePasswordResetToken = async (user_id, token) => {
    const query = `SELECT * FROM password_reset_tokens WHERE user_id = ? AND token = ? ORDER BY date_created DESC LIMIT 1`;
    const entry = await querydb(query, [user_id, token]).catch(logger.error);
    if (entry.length < 1) return Promise.reject(['The link you followed is invalid.']);
    if (!entry[0].valid) return Promise.reject(['The link you followed is invalid.']);
    const expires_in = entry[0].expires_in;
    const date_created = new Date(entry[0].date_created).getMilliseconds();
    const date_expired = date_created + expires_in;
    if (date_expired > Date.now()) return Promise.reject(['The link you followed has expired.']);
    return Promise.resolve();
};

exports.resetPassword = async (user_id, token, password) => {
    try {
        await this.validatePasswordResetToken(user_id, token);
    } catch(err) {
        return Promise.reject(err);
    }
    let hash;
    try {
        hash = await hashPassword(password);
    } catch(err) {
        logger.error(err);
        return Promise.reject([constants.SERVER_ERROR]);
    }
    const query = `UPDATE accounts SET password = ? WHERE id = ?`;
    await querydb(query, [hash, user_id]).catch(logger.error);
    await invalidatePasswordResetToken(user_id);
    const user = await this.emailFromId(user_id).catch(logger.error);
    sendPasswordResetSuccessEmail(user[0].email);
    return Promise.resolve();
};

exports.checkExisting = async (value, type = 'username') => {
    if (type.toLowerCase() !== 'username' && type.toLowerCase() !== 'email') return false;

    const query = `SELECT * FROM accounts WHERE LOWER(${type}) = ?`;
    const rows = await querydb(query, [value.toLowerCase()]);

    if (rows.length < 1) {
        return false;
    } else {
        return true;
    }
};

exports.updateLastSeen = async id => {
    const query = `UPDATE accounts SET last_seen = CURRENT_TIMESTAMP WHERE id = ?`;
    await querydb(query, [id]).catch(logger.error);
}

exports.idFromEmail = async email => {
    const query = `SELECT id FROM accounts WHERE LOWER(email) = LOWER(?)`;
    let account;
    try {
        account = await querydb(query, email);
    } catch(err) {
        return Promise.reject(err);
    }
    return Promise.resolve(account);
}

exports.emailFromId = async id => {
    const query = `SELECT email FROM accounts WHERE id = ?`;
    let account;
    try {
        account = await querydb(query, id);
    } catch(err) {
        return Promise.reject(err);
    }
    return Promise.resolve(account);
}

exports.idFromUsername = async email => {
    const query = `SELECT id FROM accounts WHERE LOWER(username) = LOWER(?)`;
    let account;
    try {
        account = await querydb(query, email);
    } catch(err) {
        return Promise.reject(err);
    }
    return Promise.resolve(account);
}

async function confirmEmail(email) {
    return new Promise((resolve, reject) => {
        const options = {
            url: process.env.MAILGUN_BASE_URL + '/address/validate',
            method: 'GET',
            qs: {address: email.toLowerCase()},
            encoding: 'ASCII',
            auth: {
                username: "api",
                password: process.env.MAILGUN_PUBKEY
            }
        };

        request(options, function (err, result){
            if (err) {
                logger.error(err);
                return reject([constants.SERVER_ERROR]);
            } else {
                let body;
                try {
                    body = JSON.parse(result.body);
                } catch(err) {
                    logger.error(err);
                    return reject([constants.SERVER_ERROR]);
                }
                if (body.mailbox_verification.toLowerCase() !== 'true') return reject(['Email is invalid.'])
                return resolve();
            }
        });
    });
}

async function invalidatePasswordResetToken(user_id) {
    const query = `UPDATE password_reset_tokens SET valid = 0 WHERE user_id = ?`;
    await querydb(query, user_id).catch(logger.error);
    return Promise.resolve();
}

async function hashPassword(password) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS), function(err, hash) {
            if (err) return reject(new Error(err));
            return resolve(hash);
        });
    });
}

async function checkPassword(hash, password) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, function(err, res) {
            if (err) return reject(new Error(err));
            return resolve(res);
        });
    });
}

function validatePassword(password) {
    if (password.checkLength(8, 60)) return true;
    return false;
}
async function validateEmail(email) {
    if (email.indexOf('@') > -1 && email.checkLength(8, 255)) {
        try {
            await confirmEmail(email);
            return Promise.resolve();
        } catch(err) {
            return Promise.reject(err);
        }
    }
}
function validateUsername(username) {
    if (/^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/.test(username) && username.checkLength(3, 20) && !/\s/.test(username)) return true;
    return false;
}
function validateName(name) {
    if (name.checkLength(2, 20)) return true;
    return false;
}
String.prototype.checkLength = function (min, max) {
    if (this.length < min || this.length > max) return false;
    return true;
}

function sendWelcomeEmail(email) {
    const data = {
        from: `${process.env.APP_NAME} <${process.env.NOREPLY_EMAIL}>`,
        to: email,
        subject: 'Welcome to ' + process.env.APP_NAME,
        html: `
            <html>
            <body style="
                background-color: #454951;
                padding: 40px;
                box-sizing: border-box;
            ">
                <div style="
                    display: block;
                    width: 90%;
                    max-width: 600px;
                    min-height: 300px;
                    background: #fff;
                    margin: 50px auto;
                    box-sizing: border-box;
                    padding: 20px 60px;
                    border-radius: 10px;
                ">
                    <div style="
                        width: 100%;
                        display: block;
                    ">
                        <img src="${process.env.APP_URL}/assets/defaults/logo-green.svg" style="
                            width: 200px;
                            height: auto;
                            margin: 0 auto;
                            display: block;
                        ">
                    </div>
                    <div style="
                        width: 100%;
                        display: block;
                    ">
                        <p style="
                        font-family: arial, sans-serif, serif;
                        font-size: 20px;
                        line-height: 30px;
                        ">Hey there!</p>
                        <p style="
                        font-family: arial, sans-serif, serif;
                        font-size: 20px;
                        line-height: 30px;
                        ">This email is to confirm that you are successfully registered with ${process.env.APP_NAME}. Email verification is done automatically on our servers so no further action is required on your end.</p>
                        <p style="
                        font-family: arial, sans-serif, serif;
                        font-size: 20px;
                        line-height: 30px;
                        ">That's right! We've taken the hard part out of making accounts. So sit back, relax, and enjoy this handy link back to our site :^)</p>

                        <div style="
                            display: block;
                            width: 100%;
                        ">
                            <a href="${process.env.APP_URL}/account/login" style="
                                display: block;
                                margin: 40px auto;
                                width: 50%;
                                max-width: 150px;
                                min-width: 80px;
                                font-family: Arial, Sans-serif, Serif;
                                font-size: 25px;
                                border: 2px solid #1FEFA4;
                                border-radius: 6px;
                                padding: 15px 20px;
                                color: #454951;
                                cursor: pointer;
                                text-align: center;
                                box-sizing: border-box;
                                text-decoration: none;
                            ">login</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Hey there!\n\n
            This email is to confirm that you are successfully registered with ${process.env.APP_NAME}. Email verification is done automatically on our servers so no further action is required on your end.\n\n
            That's right! We've taken the hard part out of making accounts. So sit back, relax, and enjoy this handy link back to our site :^)\n\n\n
            ${process.env.APP_URL}/account/login
        `
    };

    mailgun.messages().send(data, function (err, body) {
        if (err) logger.error(err);
    });
}

async function sendPasswordResetEmail(email, token, user_id) {
    const data = {
        from: `${process.env.APP_NAME} <${process.env.NOREPLY_EMAIL}>`,
        to: email,
        subject: 'Reset your password',
        html: `
            <html>
            <body style="
                background-color: #454951;
                padding: 40px;
                box-sizing: border-box;
            ">
                <div style="
                    display: block;
                    width: 90%;
                    max-width: 600px;
                    min-height: 300px;
                    background: #fff;
                    margin: 50px auto;
                    box-sizing: border-box;
                    padding: 20px 60px;
                    border-radius: 10px;
                ">
                    <div style="
                        width: 100%;
                        display: block;
                    ">
                        <img src="${process.env.APP_URL}/assets/defaults/logo-green.svg" style="
                            width: 200px;
                            height: auto;
                            margin: 0 auto;
                            display: block;
                        ">
                    </div>
                    <div style="
                        width: 100%;
                        display: block;
                    ">
                        <p style="
                        font-family: arial, sans-serif, serif;
                        font-size: 20px;
                        line-height: 30px;
                        ">Hey there!</p>
                        <p style="
                        font-family: arial, sans-serif, serif;
                        font-size: 20px;
                        line-height: 30px;
                        ">This email is to notify you that a password change request was made on your account.</p>
                        <p style="
                        font-family: arial, sans-serif, serif;
                        font-size: 20px;
                        line-height: 30px;
                        ">If you did not initiate a password change request you can ignore this email. If you did request to change your password you may follow the link below:</p>

                        <div style="
                            display: block;
                            width: 100%;
                        ">
                            <a href="${process.env.APP_URL}/account/resetPassword?token=${token}&user_id=${user_id}" style="
                                display: block;
                                margin: 40px auto;
                                width: 50%;
                                max-width: 250px;
                                min-width: 80px;
                                font-family: Arial, Sans-serif, Serif;
                                font-size: 25px;
                                border: 2px solid #1FEFA4;
                                border-radius: 6px;
                                padding: 15px 20px;
                                color: #454951;
                                cursor: pointer;
                                text-align: center;
                                box-sizing: border-box;
                                text-decoration: none;
                            ">reset password</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Hey there!\n\n
            This email is to notify you that a password change request was made on your account.\n\n
            If you did not initiate a password change request you can ignore this email. If you did request to change your password you may follow the link below:\n\n\n
            ${process.env.APP_URL}/account/resetPassword?token=${token}&user_id=${user_id}
        `
    };

    mailgun.messages().send(data, function (err, body) {
        if (err) logger.error(err);
    });
}

async function sendPasswordResetSuccessEmail(email) {
    const data = {
        from: `${process.env.APP_NAME} <${process.env.NOREPLY_EMAIL}>`,
        to: email,
        subject: 'Your password has been changed',
        html: `
            <html>
            <body style="
                background-color: #454951;
                padding: 40px;
                box-sizing: border-box;
            ">
                <div style="
                    display: block;
                    width: 90%;
                    max-width: 600px;
                    min-height: 300px;
                    background: #fff;
                    margin: 50px auto;
                    box-sizing: border-box;
                    padding: 20px 60px;
                    border-radius: 10px;
                ">
                    <div style="
                        width: 100%;
                        display: block;
                    ">
                        <img src="${process.env.APP_URL}/assets/defaults/logo-green.svg" style="
                            width: 200px;
                            height: auto;
                            margin: 0 auto;
                            display: block;
                        ">
                    </div>
                    <div style="
                        width: 100%;
                        display: block;
                    ">
                        <p style="
                        font-family: arial, sans-serif, serif;
                        font-size: 20px;
                        line-height: 30px;
                        ">Hey there!</p>
                        <p style="
                        font-family: arial, sans-serif, serif;
                        font-size: 20px;
                        line-height: 30px;
                        ">This is a courtesy email notifying you that your password on ${process.env.APP_NAME} has been changed.</p>
                        <p style="
                        font-family: arial, sans-serif, serif;
                        font-size: 20px;
                        line-height: 30px;
                        ">If you made this change then you can ignore this email. If not, you can contact us at ${process.env.ADMIN_EMAIL} to open a support ticket, and begin the process of recovering your account.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Hey there!\n\n
            This is a courtesy email notifying you that your password on ${process.env.APP_NAME} has been changed.\n\n
            If you made this change then you can ignore this email. If not, you can contact us at ${process.env.ADMIN_EMAIL} to open a support ticket, and begin the process of recovering your account.
        `
    };

    mailgun.messages().send(data, function (err, body) {
        if (err) logger.error(err);
    });
}
