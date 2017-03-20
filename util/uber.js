var coordinatesUtil = require('./coordinates.js');
var NodeGeocoder = require('node-geocoder');
var config = require('../config');
var Uber = require('node-uber');

var uber = new Uber({
	client_id: 'CLIENT_ID',
	client_secret: 'CLIENT_SECRET',
	server_token: 'YOUR SERVER TOKEN HERE',
	redirect_uri: 'REDIRECT URL',
	name: 'Test',
	language: 'en_US', // optional, defaults to en_US
	sandbox: false // optional, defaults to false
});

var options = {
	provider: 'google',
	apiKey: config.googleMaps,
};
var geocoder = NodeGeocoder(options);

//get coordinates of fromAddress

function getUberData(fromAddress, toAddress) {
	var savedUberCoordinates;
	var savedUberPrices;
	var savedUberTimes;
	var savedUberProducts;
	var savedUberData;
	var uberProducts;

	return Promise.all([geocoder.geocode(fromAddress), geocoder.geocode(toAddress)]) //get coordinates from addresses
		.then(function(coordinates) { //make an array for the circle around the coordinates
			var fromCoordinate = coordinates[0][0];
			var toCoordinate = coordinates[1][0];

			var coordinateArray = coordinatesUtil.generate(fromCoordinate.latitude, fromCoordinate.longitude);

			var uberDataArray = []
			uberDataArray[0] = {
				name: 'spot0',
				latitude: coordinateArray[0].coordinates[1],
				longitude: coordinateArray[0].coordinates[0],
				toLatitude: toCoordinate.latitude,
				toLongitude: toCoordinate.longitude
			};
			for (var i = 1; i < coordinateArray.length; i++) {
				uberDataArray[i] = {
					name: 'spot' + [i],
					latitude: coordinateArray[i].point.coordinates[1],
					longitude: coordinateArray[i].point.coordinates[0],
					toLatitude: toCoordinate.latitude,
					toLongitude: toCoordinate.longitude
				}
			};

			return uberDataArray;

		}).then(function(uberDataArray) { //make arrays for the promises for all the prices and ETAs
			savedUberCoordinates = uberDataArray;
			var uberPricePromiseArray = [];
			savedUberCoordinates.forEach(function(uberRoute) {
				var uberEstimatesPromised = new Promise(function(resolve, reject) {
					uber.estimates.getPriceForRoute(uberRoute.latitude, uberRoute.longitude, uberRoute.toLatitude, uberRoute.toLongitude, function(err, data) {
						if (err) {
							reject(err);
						}

						if (data) {
							resolve(data);
						}
					});
				});
				uberPricePromiseArray.push(uberEstimatesPromised);
			});

			var uberTimePromiseArray = [];
			savedUberPrices = uberPricePromiseArray;
			savedUberCoordinates.forEach(function(uberRoute) {
				var uberEstimatesPromised = new Promise(function(resolve, reject) {
					uber.estimates.getETAForLocation(uberRoute.latitude, uberRoute.longitude, function(err, data) {
						if (err) {
							reject(err);
						}

						if (data) {
							resolve(data);
						}
					});
				});
				uberTimePromiseArray.push(uberEstimatesPromised);
			});


			//get products based on geocoordinates
			var products = new Promise(function(resolve, reject) {
				uber.products.getAllForLocation(savedUberCoordinates[0].latitude, savedUberCoordinates[0].longitude, function(err, data) {
					if (err) {
						reject(err);
					}
					if (data) {
						resolve(data);
					}
				});
			});

			return {
				pricesPromise: Promise.all(uberPricePromiseArray),
				etaPromise: Promise.all(uberTimePromiseArray),
				productsPromise: products
			};

		}).then(function(uberObj) { //resolve promises, returns savedUberData to index.js, which renders to client

			return Promise.all([uberObj.pricesPromise, uberObj.etaPromise, uberObj.productsPromise])
			.then(function(uberData) {
				var prices = uberData[0];
				var etas = uberData[1];
				var products = uberData[2];

				savedUberPrices = prices;
				savedUberTimes = etas;

				var combinedUberData = savedUberCoordinates;
				for (var i = 0; i < combinedUberData.length; i++) {
					combinedUberData[i].prices = savedUberPrices[i].prices;
					combinedUberData[i].times = savedUberTimes[i].times;
				}
				savedUberData = combinedUberData;


				return {
				savedUberData: savedUberData,
				products: products
				};


			}).catch(function(error){
				console.log(error);
			});

		}).catch(function(error) {
			console.log(error);
		});
}



module.exports = {
	getUberData,
};