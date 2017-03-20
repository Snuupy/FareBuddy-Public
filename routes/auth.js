// Add Passport-related auth routes here.
var express = require('express');
var router = express.Router();
var models = require('../models');
var Uber = require('node-uber');
var config = require('../config')

var uber = new Uber({
  client_id: config.uberClientId,
  client_secret: config.uberClientSecret,
  server_token: config.uberServerToken,
  redirect_uri: 'REDIRECT URL',
  name: 'Test',
  language: 'en_US', // optional, defaults to en_US
  sandbox: true // optional, defaults to false
});

module.exports = function(passport) {

  // Uber Passport
  router.get('/auth/uber',
    passport.authenticate('uber', { scope: ['profile'] }
  ));

  router.get('/callback', passport.authenticate('uber', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

  // GET registration page
  router.get('/signup', function(req, res) {
    res.render('signup');
  });

  router.post('/signup', function(req, res) {
    // validation step
    if (req.body.password!==req.body.passwordRepeat) {
      return res.render('signup', {
        error: "Passwords don't match."
      });
    }
    var u = new models.User({
      username: req.body.username,
      password: req.body.password
    });
    u.save(function(err, user) {
      if (err) {
        console.log(err);
        res.status(500).redirect('/register');
        return;
      }
      console.log(user);
      res.redirect('/login');
    });
  });

  // GET Login page
  router.get('/login', function(req, res) {
    res.render('login');
  });

  // POST Login page
  router.post('/login', passport.authenticate('local',{
    successRedirect: '/protected',
    failureRedirect: '/login'
  }));

  // GET Logout page
  router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  return router;
};
