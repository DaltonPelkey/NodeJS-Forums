const chalk = require("chalk");
const moment = require("moment");

exports.log = (content, type = "log") => {
    const timestamp = `[${moment().format("YYYY-MM-DD HH:mm:ss")}]:`;
    switch (type) {
        case "log":
            {
                return console.log(`${timestamp} ${chalk.white.bgBlue(type.toUpperCase())} ${content} `);
            }
        case "warn":
            {
                return console.log(`${timestamp} ${chalk.white.bgYellow(type.toUpperCase())} ${content} `);
            }
        case "error":
            {
                return console.log(`${timestamp} ${chalk.white.bgRed(type.toUpperCase())} ${content} `);
            }
        case "debug":
            {
                return console.log(`${timestamp} ${chalk.white.bgGreen(type.toUpperCase())} ${content} `);
            }
        case "info":
            {
                return console.log(`${timestamp} ${chalk.white.bgBlack(type.toUpperCase())} ${content}`);
            }
        case "ready":
            {
                return console.log(`${timestamp} ${chalk.white.bgGreen(type.toUpperCase())} ${content}`);
            }
        default:
            throw new TypeError("Logger type must be either warn, debug, log, ready, info, or error.");
    }
};

exports.error = (...args) => this.log(...args, "error");

exports.warn = (...args) => this.log(...args, "warn");

exports.debug = (...args) => this.log(...args, "debug");

exports.info = (...args) => this.log(...args, "info");
