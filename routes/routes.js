/**
 * Routes for page rendering and user/login/register, ...
 */
var Account = require('../models/account');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

// mongoose models
var Study = require('../models/study');

// error handling
function handleError(err, res, status, message) {
    if (err) console.error(err);
    return res.status(status).end(message);
}

module.exports = function (app) {
    var afterLogin = null;

    app.get('/', function (req, res) {
        res.render('index', { user : req.user });
    });

    app.get('/user', function(req, res) {
        if (req.user) {
            res.render('user', { user : req.user});
        } else {
            afterLogin = '/user';
            res.redirect('/login');
        }
    });

    app.get('/login', function(req, res) {
        if (req.user) {
            res.redirect('/');
        } else {
            res.render('login', { mail: global.sendGridApiKey !== undefined });
        }
    });

    app.post('/register', function(req, res) {
        if (req.body.username.length < 1)
            return res.render("register", {info: "Please enter a valid email address!"});
        if (req.body.password.length < 6)
            return res.render("register", {info: "Passwords must have at least 6 characters!"});
        Account.register(new Account({ username : req.body.username }), req.body.password, function(err) {
            if (err) {
                return res.render("register", {info: "Sorry. That username already exists. Try again."});
            }

            passport.authenticate('local')(req, res, function () {
                res.redirect('/');
            });
        });
    });

    app.post('/login', function(req, res, next) {
        passport.authenticate('local', function(err, user) {
            if (err) { return next(err); }
            if (!user) { return res.render("login", {info: "Wrong username/password!"}); }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                if (afterLogin != null) {
                    res.redirect(afterLogin);
                    afterLogin = null;
                    return;
                }
                req.flash('success', "Login successful! Welcome " + user.username+ "!");
                return res.redirect('/');
            });
        })(req, res, next);
    });

    app.post('/forgot', function(req, res, next) {
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {
                Account.findOne({ username: req.body.email }, function(err, user) {
                    if (!user) {
                        req.flash('error', 'No account with that email address exists.');
                        return res.redirect('/forgot');
                    }

                    user.resetPasswordToken = token;

                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                    user.save(function(err) {
                        done(err, token, user);
                    });
                });
            },
            function(token, user, done) {
                var options = {
                    auth: {
                        api_key: global.sendGridApiKey
                    }
                };
                var mailer = nodemailer.createTransport(sgTransport(options));
                
                var mailOptions = {
                    to: user.username,
                    from: global.resetMailSender,
                    subject: 'MarcarViz Password Reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                mailer.sendMail(mailOptions, function(err) {
                    req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions.');
                    done(err, 'done');
                });
            }
        ], function(err) {
            if (err) return next(err);
            res.redirect('/');
        });
    });

    app.get('/reset/:token', function(req, res) {
        Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/forgot');
            }
            res.render('reset', {
                user: req.user
            });
        });
    });

    app.post('/reset', function(req, res) {
        if (!req.user) {
            async.waterfall([
                function(done) {
                    var token = req.headers.referer.substr(req.headers.referer.lastIndexOf('/') + 1);
                    Account.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                        if (!user) {
                            req.flash('error', 'Password reset token is invalid or has expired.');
                            return res.redirect('back');
                        }
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        user.setPassword(req.body.password, function() {
                            user.save(function() {
                                req.logIn(user, function(err) {
                                    done(err);
                                });
                            });
                        });
                    });
                }
            ], function() {
                res.redirect('/');
            });
        } else {
            req.user.setPassword(req.body.password, function() {
                req.user.save(function(err) {
                    if (err) next(err);
                    req.flash('success', 'Password has been changed!');
                    res.redirect('/');
                });
            });
        }
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/analysis/diff-expr', function(req, res) {
        res.render('tools/diff-expr', { user : req.user });
    });

    app.get('/analysis/pathway-enrichment', function(req, res) {
        res.render('tools/pathway-enrichment', { user : req.user });
    });

    app.get('/visualization/heatmaps', function(req, res) {
        res.render('tools/heatmaps', { user : req.user });
    });

    app.get('/visualization/pathway-heatmaps', function(req, res) {
        res.render('tools/pathway-heatmaps', { user : req.user });
    });

    app.get('/visualization/volcano', function(req, res) {
        res.render('tools/volcano', { user : req.user });
    });

    app.get('/visualization/scatter', function(req, res) {
        res.render('tools/scatter', { user : req.user });
    });

    app.get('/visualization/venn', function(req, res) {
        res.render('tools/venn', { user : req.user });
    });

    app.get('/visualization/pca', function(req, res) {
        res.render('tools/pca', { user : req.user });
    });

    app.get('/study', function(req, res) {
        if (req.query.id === undefined) return res.redirect('/studies');
        Study.findOne({name: req.query.id}, function(err, study) {
            if (err) return handleError(null, res, 500, 'Internal server error');
            if (study === null) return res.render('404');
            return res.render('study_overview', { study: study, user : req.user });
        });
    });

    app.get('*', function(req, res) {
        res.render(req.url.substr(1), { user : req.user }, function(err, html) {
            if (err) return res.render('404');
            res.end(html);
        });
    });
};
