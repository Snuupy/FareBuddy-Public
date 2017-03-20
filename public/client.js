function start() {
  var response;
  var priceData;

  var trueAddressSwitch = false;

  function initialize() {
    var input = document.getElementById('searchTextFieldFromAddress');
    var autocomplete = new google.maps.places.Autocomplete(input);
    var input = document.getElementById('searchTextFieldToAddress');
    var autocomplete = new google.maps.places.Autocomplete(input);
  }
  google.maps.event.addDomListener(window, 'load', initialize);

  function doGeocode(elementId){
    var addr = document.getElementById(elementId);
    // Get geocoder instance
    var geocoder = new google.maps.Geocoder();

    // Geocode the address
    geocoder.geocode({'address': addr.value}, function(results, status){
      if (status === google.maps.GeocoderStatus.OK && results.length > 0) {

        // set it to the correct, formatted address if it's valid
        trueAddressSwitch = true;

        // set trueAddressSwitch to false
      }else trueAddressSwitch = false;;
    });
  };

  $('#lookup').attr('disabled',true);
  $('#searchTextFieldFromAddress').keyup(function(){
    trueAddressSwitch = false;
    doGeocode("searchTextFieldToAddress")
    doGeocode("searchTextFieldFromAddress")
    if( ($('#searchTextFieldFromAddress').val().length !=0) && ($('#searchTextFieldToAddress').val().length !=0) && (trueAddressSwitch = true))
    $('#lookup').attr('disabled', false);
    else
    $('#lookup').attr('disabled',true);
  })
  $('#searchTextFieldToAddress').keyup(function(){
    trueAddressSwitch = false;
    doGeocode("searchTextFieldToAddress")
    doGeocode("searchTextFieldFromAddress")
    if( ($('#searchTextFieldToAddress').val().length !=0) && ($('#searchTextFieldFromAddress').val().length !=0) && (trueAddressSwitch = true))
    $('#lookup').attr('disabled', false);
    else
    $('#lookup').attr('disabled',true);
  })

  $("#lookup:not(.disabled)").click(function() {
    $.ajax({
      type: "POST",
      url: "/api/v1/price",
      data: {
        from: $('input[name="from"]').val(),
        to: $('input[name="to"').val()
      },
      success: function(data) {
        response = data;
        priceData = data.uberData;

        $("#map").show()
        $("#uberDropdown").show();
        createUberDropdown(data.uberProducts);
        console.log(data);
        createMap(data, null);

      },
      error: function(error) {
        console.log(error);
      }
    });
  });


  $("#debug").click(function() {
    console.log(response);
  })

  function createUberDropdown(uberProducts) {
    var dropdown = $('#uberDropdown');
    dropdown.empty();

    uberProducts.products.forEach(function(product) {
      var opt = document.createElement("option");
      opt.text = product.display_name;
      opt.value = product.display_name;
      dropdown.append(opt);
    });

    $("#uberDropdown").change(function(e) {
      var selected = $("select option:selected").text(); //gets selected option from user
      createMap(response, selected);
    });
  }



  var createMap = function(data, selectedProduct) {

    if (!selectedProduct) {
      selectedProduct = data.uberProducts.products[0].display_name;
    }

    console.log("creating map with", selectedProduct);


    var locations = data.uberData;
    var infoWindowContent = [];

    console.log(locations);
    //create markers for each location

    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 15,
      center: new google.maps.LatLng(locations[0].latitude, locations[0].longitude),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    createMarkers(locations, selectedProduct, map);

    function createMarkers(locations, selectedProduct) {
      locations.forEach(function(location) { //in each location, create a marker that contains the price and surge multiplier of that product
        // var marker = new google.maps.Marker({ //create a new marker, add it to the array

        //   position:
        //   map: map,
        //   label: getMarkerLabel(location, selectedProduct)
        // });

        var newAvg
        var compareAvg

        var myMarker = new google.maps.Marker({
          map: map,
          position: {
            lat: location.latitude,
            lng: location.longitude
          },
          label: getMarkerLabel(location, selectedProduct),
        });

        console.log('xxxx')
        for (var i = 0; i < locations[0].prices.length; i++) {
          console.log(locations[0].prices[i].display_name)
          if (locations[0].prices[i].display_name === selectedProduct) {
            compareAvg = (locations[0].prices[i].low_estimate + locations[0].prices[i].high_estimate)/2
          }
        }
        console.log('yyyy')

        console.log(compareAvg)
        console.log(newAvg)

        if (compareAvg > newAvg) {
          myMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png')
        } else {
          myMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
        }

        function getMarkerLabel(location, selectedProduct) { //should be something like: "POOL: $6 - 5 min - 1.0x"
          var str = "$";
          var surgeMultiplier;

          location.prices.forEach(function(price) {
            if (selectedProduct === price.display_name) { //get price from prices array
              var avg = (price.low_estimate + price.high_estimate) / 2;
              surgeMultiplier = price.surge_multiplier;
              str += avg;
              newAvg = avg;
            }
          });


          str += "<br/>";

          location.times.forEach(function(time) {
            if (selectedProduct === time.display_name) { //get time from times array
              var minutes = time.estimate / 60;
              str += minutes + " min";
            }
          });
          str += "<br/>" + surgeMultiplier + "x";
          console.log(str);
          return str;
        }

      });
    }
  }


  function getGeolocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(saveLocation);
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  var markerSize = {
    x: 22,
    y: 40
  };

  google.maps.Marker.prototype.setLabel = function(label) {
    this.label = new MarkerLabel({
      map: this.map,
      marker: this,
      text: label
    });
    this.label.bindTo('position', this, 'position');
  };

  var MarkerLabel = function(options) {
    this.setValues(options);
    this.span = document.createElement('span');
    this.span.className = 'map-marker-label';
  };

  MarkerLabel.prototype = $.extend(new google.maps.OverlayView(), {
    onAdd: function() {
      this.getPanes().overlayImage.appendChild(this.span);
      var self = this;
      this.listeners = [
        google.maps.event.addListener(this, 'position_changed', function() {
          self.draw();
        })
      ];
    },
    draw: function() {
      var text = String(this.get('text'));
      var position = this.getProjection().fromLatLngToDivPixel(this.get('position'));
      this.span.innerHTML = text;
      // this.span.style.left = (position.x - (markerSize.x / 2)) - (text.length * 3) + 10 + 'px';
      // this.span.style.top = (position.y - markerSize.y - 10) + 'px';
      this.span.style.left = (position.x - (markerSize.x / 2)) - (text.length * 3) + 65 + 'px';
      this.span.style.top = (position.y - markerSize.y - 38) + 'px';
    }
  });
}
