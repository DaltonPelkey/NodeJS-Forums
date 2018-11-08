require("dotenv").config()

const express = require("express");
const app = express();
const session = require("express-session");
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require("body-parser");
const fs = require('fs');
const https = require('https').createServer({ key: fs.readFileSync('./certs/indicacorp_net.key'), cert: fs.readFileSync('./certs/indicacorp_net.crt'), ca: [fs.readFileSync('./certs/indicacorp_net.ca-bundle')]}, app);
const io = require('socket.io').listen(https);
const socketRedis = require('socket.io-redis');
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const logger = require('./modules/logger');
const { updateLastSeen } = require('./modules/accounts');
const cookieParser = require('cookie-parser');
const perms = require('./configs/permissions');

// Session Config and Setup
const cookie = { path: '/', httpOnly: false, secure: true, maxAge: parseInt(process.env.COOKIE_EXPIRATION) };
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    schema: {
	    tableName: 'sessions',
	    columnNames: {
		    session_id: 'sid',
		    expires: 'expires',
		    data: 'session'
	    }
    },
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: parseInt(process.env.SESSION_EXPIRATION)
});
const sessionObj = {
    key: process.env.SESSION_KEY,
    secret: process.env.SESSION_SECRET,
    cookie: cookie,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    unset: 'destroy'
};
const sessionMiddleware = session(sessionObj);

const init = async () => {

    // App Configuration
    app.use(sessionMiddleware);
    app.use(cookieParser());
    app.use(bodyParser.json({limit: '5mb'}));
    app.use(bodyParser.urlencoded({extended: true, limit: '10mb'}));
    app.set("view engine", "ejs");
    app.use(express.static(__dirname + "/public"));
    app.use(function( req, res, next ) {
        res.locals.user = req.session;
        res.locals.perms = perms;
        res.locals.app_name = process.env.APP_NAME;
        if (req.session && req.session.user_id) {
            res.locals.hasPermission = (key) => {
                return perms.levels[req.session.forum_role] >= perms.levels[perms.forums[key]]
            };
        }
        if (req.session && req.session.user_id) updateLastSeen(req.session.user_id);
        next();
    });


    //Load all route files
    const routeFiles = await readdir("./routes/");
    logger.info(`Loading a total of ${routeFiles.length} routes.`);
    routeFiles.forEach(f => {
        if (!f.endsWith(".js")) return;
        try {
            logger.info(`Loading Route File: ${f}`);
            const route = require(`./routes/${f}`);
            app.use(route.baseRoute, route.router);
            return false;
        } catch (e) {
            logger.error(`Unable to load route file '${f}': ${e}`);
        }
    });

    //Handle non-existing routes (404)
    app.use(function( req, res ) {
        res.render('404.ejs');
    });

    //Listen to incoming connections
    https.listen(process.env.HTTPS_PORT, () => logger.log("Server has successfully started.", "ready"));


    //Configure socket io
    io.adapter(socketRedis({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT }));
    io.use(function( socket, next ) {
        sessionMiddleware(socket.request, {}, next);
    });

    //Define socket connection routes
    io.on('connection', function(socket){
        if(socket.request.session.username && socket.request.session.username != undefined){
            socket.join(socket.request.session.user_id);
        }

        socket.on('disconnect', function(){
            if(socket.request.session.username && socket.request.session.username != undefined){
                socket.leave(socket.request.session.user_id);
            }
        });
    });

}

init();
