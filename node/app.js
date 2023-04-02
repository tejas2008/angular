const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const geohash = require('ngeohash');

var SpotifyWebApi = require('spotify-web-api-node');
const apikey = 'tq0h0AxKNGzhMAXGGc11qhF2MixMR3Z0';
var spotifyApi = new SpotifyWebApi({
  clientId: '2d71a36ce01e4910b40655c166f89b4d',
  clientSecret: '31db8f9fef4642599aa7be5227c71482',
  redirectUri: 'http://localhost/'
});
spotifyApi.clientCredentialsGrant().then(
  function(data) {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
  },
  function(err) {
    console.log('Something went wrong when retrieving an access token', err);
  }
);

app.use(express.json());
app.use(cors());

const port = process.env.PORT || 4000;

app.set('view engine','ejs');

app.listen(port,()=>{
    console.log("Running on port: " + port)
});

app.get("/autocomplete",async (req,res)=>{
    
    const keyword = req.query.keyword;
    console.log(keyword)
    const apikey = "tq0h0AxKNGzhMAXGGc11qhF2MixMR3Z0";
    const autocomplete_res = await axios({
        url: `https://app.ticketmaster.com/discovery/v2/suggest?apikey=${apikey}&keyword=${keyword}`
    })
    console.log(autocomplete_res.data);
    const autocomplete_res_status = autocomplete_res.status;
    if(autocomplete_res_status == 200){
        console.log(autocomplete_res.data)
        res.status(200).json({
            data: autocomplete_res.data
        })
    }
})

app.get('/events', async (req, res) => {
    console.log("enter bnackend");
    
    const cat = {
      'Music': "KZFzniwnSyZfZ7v7nJ",
      'Sports': "KZFzniwnSyZfZ7v7nE",
      'Arts': "KZFzniwnSyZfZ7v7na",
      'Film': "KZFzniwnSyZfZ7v7nn",
      'Default': '',
      'Miscellaneous' : 'KZFzniwnSyZfZ7v7n1'
    };
    const args = req.query;
    console.log(args);
    const { keyword, category, distance: radius, lat, lng } = args;
    const geo = geohash.encode(lat, lng, 7);
    const unit = 'miles';
  
    // Call the Ticketmaster API
    const results = [];
    const params = {
      apikey,
      geoPoint: geo,
      radius,
      segmentId: cat[category],
      unit,
      keyword
    };
    try {
      const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { params });
      const data = response.data;
      console.log(data);
      console.log(data.page.totalElements);
      if (data.page.totalElements > 0) {
        console.log("else entered");
        console.log(data._embedded.events[0]);
        for (var i=0; i<data.page.totalElements;i++){
            results.push(data._embedded.events[i]);
            console.log(results);
      } 
      }
      res.send(results);
    } catch (error) {
        console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/event-details', async (req, res) => {
    console.log('details api entered');
    const id = req.query.id;
    console.log(id);
    const j = {};
    const results = [];
    const params = {
      apikey,
      id
    };
      const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events', {
        params
      });
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).send('An error occurred');
    //   }
      const data = response.data;
      console.log(data);
      
      
      j['date'] = data._embedded.events[0].dates.start.localDate + " " + data._embedded.events[0].dates.start.localTime;
      if(j['date'] != 'Undefined' || j['date'] != 'Undfined Undefined'){
        j['date_stat'] = true;
      }
      else{
        j['date_stat'] = false;
      }

      j['name'] = data._embedded.events[0].name;
      if(j['name'] != ' '){
        j['name_stat'] = true;
      }
      else{
        j['name_stat'] = false;
      }

      try{
      j['seatmap'] = data._embedded.events[0].seatmap.staticUrl;
      }
      catch(err){
        console.log(err);
      }
      if(j['seatmap'] != ' '){
        j['seatmap_stat'] = true;
      }
      else{
        j['seatmap_stat'] = false;
      }

      var art = '';
      const artists = [];
      if(data._embedded.events[0]._embedded.attractions.length > 1){
        for(var i=0; i < data._embedded.events[0]._embedded.attractions.length; i++){
            if (i === 0){
                artists.push(data._embedded.events[0]._embedded.attractions[i].name);
                art += data._embedded.events[0]._embedded.attractions[i].name;
            }
            else{
                artists.push(data._embedded.events[0]._embedded.attractions[i].name);
                art += " | " + data._embedded.events[0]._embedded.attractions[i].name;
            }
            console.log(artists);
        }
      }
      else{
        art = data._embedded.events[0]._embedded.attractions[0].name;
        artists.push(art)
      }
      j['artist'] = art;
      console.log(art);
      if(j['artist'] != ' '){
        j['artist_stat'] = true;
      }
      else{
        j['artist_stat'] = false;
      }

      try{
      j['venue'] = data._embedded.events[0]._embedded.venues[0].name;
    }
    catch(err){
      console.log(err);
    }
      if(j['venue'] != ' '){
        j['venue_stat'] = true;
      }
      else{
        j['venue_stat'] = false;
      }

      try{
      j['price'] = data._embedded.events[0].priceRanges[0].min + " - " + data._embedded.events[0].priceRanges[0].max ;
    }
    catch(err){
      console.log(err);
    }
      if(j['price'] != ' '){
        j['price_stat'] = true;
      }
      else{
        j['price_stat'] = false;
      }

      try{
      j['ticket'] = data._embedded.events[0].dates.status.code ;
    }
    catch(err){
      console.log(err);
    }
      if(j['ticket'] != ' '){
        j['ticket_stat'] = true;
        if(j['ticket'] === 'onsale'){
            j['ticket_color'] = 'green';
        }
        else if(j['ticket'] === 'offsale'){
            j['ticket_color'] = 'red';
        }
        else if(j['ticket'] === 'cancelled'){
            j['ticket_color'] = 'black';
        }
        else{
            j['ticket_color'] = 'orange';
        }
      }
      else{
        j['ticket_stat'] = false;
      }

      var segment = "";
                var genre = "";
                var sub_genre = "";
                var type = "";
                var sub_type = "";
                console.log(data._embedded.events[0].classifications[0].segment.name);
                try{
                segment = data._embedded.events[0].classifications[0].segment.name;
                }
                catch(err){
                    console.log(err);
                }
                try{
                    genre = data._embedded.events[0].classifications[0].genre.name;
                }
                catch(err){
                    console.log(err);
                }
                try{
                sub_genre = data._embedded.events[0].classifications[0].subGenre.name;
                }
                catch(err){
                    console.log(err);
                }
                try{
                type = data._embedded.events[0].classifications[0].type.name;
                }
                catch(err){
                    console.log(err);
                }
                try{
                sub_type = data._embedded.events[0].classifications[0].subType.name;
                }
                catch(err){
                    console.log(err);
                }
                var text = "";
                console.log(segment, genre, sub_genre, type, sub_type);
                if (segment != 'Undefined' && segment){
                    text += segment;
                }
                if (genre != 'Undefined' && genre){
                    text += " | " + genre;
                }
                if (sub_genre != 'Undefined' && sub_genre){
                    text += " | " + sub_genre;
                }
                if (type != 'Undefined' && type){
                    text += " | " + type ;
                }
                if (sub_type != 'Undefined' && sub_type){
                    text += " | " + sub_type ;
                }

      if(text != ''){
      j['genre'] = text;
      console.log(text);
        j['genre_stat'] = true;
      }
      else{
        j['genre_stat'] = false;
      }

      j['url'] = data._embedded.events[0].url;
      results.push([j]);
      
      
      console.log("artdtyt6y",artists);
      const temp = [];
      for (var i=0; i<artists.length; i++){

      await spotifyApi.searchArtists(artists[i])
        .then(function(data) {
            const t ={};
            t['name'] = data.body.artists.items[0].name;
            t['images'] = data.body.artists.items[0].images[0];
            t['followers'] = new Intl.NumberFormat().format(data.body.artists.items[0].followers.total);
            console.log(t['followers']);
            t['popularity'] = data.body.artists.items[0].popularity;
            t['spotifylink'] = data.body.artists.items[0].external_urls.spotify;
            t['id'] = data.body.artists.items[0].id;
            console.log(t);
            temp.push(t);
            
        // console.log('Search artists by "Love"', data.body.artists.items[0].name);
        }, function(err) {
        console.error(err);
        });

        
    }

    results.push(temp);

    console.log(1);
    // console.log(results);

    var temp1 = [];
    // console.log("672356487",artists);
    for (var i=0; i<results[1].length; i++){
        await spotifyApi.getArtistAlbums(results[1][i].id)
            .then(function(data) {
                var temp2 = [];
                // console.log('Artist albums', data.body);
                console.log(data.body.items[0]);
                temp2.push(data.body.items[0]);
                results[1][i]['image1'] = data.body.items[0].images[0].url;
                temp2.push(data.body.items[1]);
                results[1][i]['image2'] = data.body.items[1].images[0].url;
                temp2.push(data.body.items[2]);
                results[1][i]['image3'] = data.body.items[2].images[0].url;
                temp1.push(temp2);
            }, function(err) {
                console.error(err);
            });
    }

    results.push(temp1);

    console.log(2);
    console.log(results);
    res.send(results);
    //   res.json(data._embedded);
    
});
  
app.get('/venue', async (req, res) => {
    const name = req.query.name;
    console.log(name);
    const params = {
      apikey,
      keyword: name
    };
    try {
      const response = await axios.get('https://app.ticketmaster.com/discovery/v2/venues', {
        params
      });
      const data = response.data;
      console.log(data._embedded);
      var temp = {};
      temp['name'] = '';
      temp['address'] = '';
      temp['phone'] = '';
      temp['child'] = '';
      temp['open'] = '';
      temp['general'] = '';
      temp['lat'] = '';
      temp['lng'] = '';


      temp['name'] = data._embedded.venues[0].name;

      var street = '';
      var city = '';
      var state = '';
      try{
      street = data._embedded.venues[0].address.line1;
      }
      catch(err){
        console.log(err);
      }
      try{
      city = data._embedded.venues[0].city.name;
      }
      catch(err){
        console.log(err);
      }

      try{
      state = data._embedded.venues[0].state.name;
      }
      catch(err){
        console.log(err);
      }
      temp['address'] = street + "," + city + "," + state;
      if(city === '' && city === '' && state === ''){
        temp['address_stat'] = false;
        temp['address'] = '';
      }
      else{
        temp['address_stat'] = true;
      }

      try{
      temp['phone'] = data._embedded.venues[0].boxOfficeInfo.phoneNumberDetail;
      }
      catch(err){
        console.log(err);
      }
      if(temp['phone'] != ''){
        temp['phone_stat'] = true;
      }
      else{
        temp['phone_stat'] = false;
      }

      try{
        temp['open'] = data._embedded.venues[0].boxOfficeInfo.openHoursDetail;
      }
      catch(err){
        console.log(err);
      }
      if(temp['open'] != ''){
        temp['open_stat'] = true;
      }
      else{
        temp['open_stat'] = false;
      }

      try{
        temp['general'] = data._embedded.venues[0].generalInfo.generalRule;
      }
      catch(err){
        console.log(err);
      }
      if(temp['general'] != ''){
        temp['general_stat'] = true;
      }
      else{
        temp['general_stat'] = false;
      }

      try{
        temp['child'] = data._embedded.venues[0].generalInfo.childlRule;
      }
      catch(err){
        console.log(err);
      }
      if(temp['child'] != ''){
        temp['child_stat'] = true;
      }
      else{
        temp['child_stat'] = false;
      }

      temp['lng'] = data._embedded.venues[0].location.longitude;
      temp['lat'] = data._embedded.venues[0].location.latitude;
      temp['loc'] = {'lat': temp['lat'], lng: temp['lng']};

      const results = [];
      console.log(temp);
      results.push(temp);
      console.log(results);

      res.send(results);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    }
});
