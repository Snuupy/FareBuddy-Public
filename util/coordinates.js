var wgs84 = require('wgs84-util');
var config = require('../config.js')



function generate(latitude, longitude) { //coordinates to avoid uber surge/lyft primetime

	var bearing = {
		north: 0,
		northeast: 45,
		east: 90,
		southeast: 135,
		south: 180,
		southwest: 225,
		west: 270,
		northwest: 315
	};


	var distances = {
		close: 350,
		far: 750
	}

	var point = {
		"type": "Point",
		"coordinates": [longitude, latitude]
	};

	var coordinateArray = [];
	coordinateArray.push(point);

	for (distance in distances) {
		for (direction in bearing) {
			coordinateArray.push(wgs84.destination(point, bearing[direction], distances[distance]));
		}
	}

	return coordinateArray;
}


module.exports = {
	generate: generate
};
