//********** DEPENDENCIES *************//
var http = require('http');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var uuid = require('node-uuid');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var fs = require('fs');
var flash = require('express-flash');
var extend = require('extend');

/* GLOBAL VARIABLES */
global.appRoot = __dirname;
var defaultConfig = {
    httpPort: '3000',
    db_host: '127.0.0.1',
    db: 'tea_dev',
    useHttps: false,
    forceHttps: false,
    httpsPort: '8000',
    sslKeyFile: 'sslcert/server.key',
    sslCertFile: 'sslcert/server.crt',
    resourceDir: __dirname + '/res/',
    debug: false
};
extend(global, defaultConfig);
var config = {};
try {
    var configFile = appRoot + '/config.json';
    if (fs.existsSync(configFile)) {
        config = require(configFile);
        extend(global, config);
    } else {
        console.log('No config file found! Using default values...');
    }
}
catch (e) {
    console.log('Error parsing config file:');
    console.log(e);
}
if (global.db_user) {
    global.mongoDB = 'mongodb://' + global.db_user + ':' + global.db_pass + '@' + global.db_host + '/' + global.db;    
} else {
    global.mongoDB = 'mongodb://' + global.db_host + '/' + global.db;
}
//********* STATIC SERVER ***********//
var app = express();
//* robots.txt and favicon.ico *//
app.use(function (req, res, next) {
    if ('/robots.txt' == req.url) {
        res.type('text/plain');
        res.send("User-agent: *\nDisallow: /");
    } else if ('/favicon.ico' == req.url) {
        res.status(404).end();    
    } else {
        next();
    }
});

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.locals.ucfirst = function(value){
    return value.charAt(0).toUpperCase() + value.slice(1);
};
app.use(express.static(__dirname));
app.use(morgan('combined'));
app.use(cookieParser());
app.use(session({
    name: 'sessionid',
    secret: uuid.v4(),
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
app.use(bodyParser.urlencoded({ extended: true, parameterLimit: 10000, limit: 1024 * 1024 * 10 }));
app.use(passport.initialize());
app.use(passport.session());

// passport config
var Account = require('./models/account');

// mongoose
mongoose.connect(mongoDB);

// API
require('./routes/api/norm-data.js')(app);
require('./routes/api/job-handler.js')(app);
require('./routes/api')(app);

// routes
require('./routes/routes')(app);

// Start server
var useHttps = config.useHttps || defaultConfig.useHttps;
var forceHttps = useHttps && (config.forceHttps || defaultConfig.forceHttps);

if (useHttps) {
    var httpsPort = config.httpsPort || defaultConfig.httpsPort;
    var privateKey = fs.readFileSync(config.sslKeyFile || defaultConfig.sslKeyFile);
    var certificate = fs.readFileSync(config.sslCertFile || defaultConfig.sslCertFile);
    var credentials = {key: privateKey, cert: certificate};
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(httpsPort);
    console.log("HTTPS server listening on port " + httpsPort);
}

var httpPort = config.httpPort || defaultConfig.httpPort;
if (forceHttps) {
    redirectApp = express();
    redirectApp.use(function(req, res) {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    });
    http.createServer(redirectApp).listen(httpPort);
    console.log("HTTP server listening on port " + httpPort);
} else {
    http.createServer(app).listen(httpPort);
    console.log("HTTP server listening on port " + httpPort);
}

