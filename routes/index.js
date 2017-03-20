var express = require('express');
var router = express.Router();
var models = require('../models');
var User = models.User;
var uber = require('./../util/uber');

var config = require('../config');

//////////////////////////////// PUBLIC ROUTES ////////////////////////////////
// Users who are not logged in can see these routes

// router.get('/', function(req, res, next) {
//   res.render('home');
// });

///////////////////////////// END OF PUBLIC ROUTES /////////////////////////////

router.use(function(req, res, next){
  if (!req.user) {
    res.redirect('/login');
  } else {
    return next();
  }
});

//////////////////////////////// PRIVATE ROUTES ////////////////////////////////
// Only logged in users can see these routes

router.get('/', function(req, res) {
	res.render('index');
});

router.get('/about', function(req, res){
  res.render('about')
})

router.post('/api/v1/price', function(req, res) {

	var fromAddress = req.body.from;
	var toAddress = req.body.to;

	uber.getUberData(fromAddress, toAddress).then(function(result) {
		console.log(result);
		res.json({
			uberData: result.savedUberData,
			uberProducts: result.products,
			googleAPI: config.googleMaps
		});
	});



});

router.get('/protected', function(req, res, next) {
  res.render('protectedRoute', {
    username: req.user.username,
  });
});

///////////////////////////// END OF PRIVATE ROUTES /////////////////////////////

module.exports = router;
