import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import botkit from 'botkit';
import dotenv from 'dotenv';


dotenv.config({ silent: true });

// initialize
const app = express();

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
app.listen(port);

console.log(`listening on: ${port}`);

// example hello response
 controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
   bot.reply(message, 'Hello there!');

   bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
 });

controller.hears(['hungry', 'food','starving'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {

  // start a conversation to handle this response.

    bot.startConversation(message,function(err,convo) {
      convo.say('I am here to help you!');
      convo.addQuestion('I got you? Wanna know any restaurant around you?',[
      {
        pattern: bot.utterances.yes,
        callback: function(response,convo) {
          // convo.say('Cool, you said: ' + response.text);
          // convo.say('Great! I will continue...');
          convo.next();
        }
      },

      {
        pattern: bot.utterances.no,
        callback: function(response,convo) {
          convo.say('Cool, you said: ' + response.text);
          convo.say('Cool.Nex time then. This app is only for searching for food now.');
          convo.next();
        }
      }
    ],{},'default');

    let food_choice = '';


    convo.addQuestion('What type of food would you like?',[
    {
      pattern: '(.*?)',
      callback: function(response,convo) {
        convo.say('Cool, you said: ' + response.text);
        food_choice = response.text;
        console.log('Your food choice is: ', food_choice);
        convo.next();
      }
    }
  ],{},'default');

  let place_choice = '';
  convo.addQuestion('Where are you at?',[
  {
    pattern: '(.*?)',
    callback: function(response,convo) {
      convo.say('Cool, you said: ' + response.text);
      place_choice = response.text;
      console.log('Your place choice is: ', place_choice);

      bot.reply(message, 'One sec! Pulling out the data...');
      'use strict';

      const yelp = require('yelp-fusion');

      // const client = yelp.client(process.env.YELP_CLIENT_SECRET);
      let yelpClient;
      // yelp.accessToken(process.env.YELP_CLIENT_ID, process.env.YELP_CLIENT_SECRET).then((res) => {
      // console.log("Get herer?");
        yelpClient = yelp.client(process.env.YELP_CLIENT_SECRET);
        // });
        // console.log("The api key is: ", process.env.YELP_CLIENT_SECRET);
        let restaurantName = '';
        let restaurantNumb = '';
        let restaurantImg = '';
        let restaurantRating= '';
        yelpClient.search({
        term:food_choice,
        location: place_choice

      }).then(response => {
        // restaurantName = response.jsonBody.businesses;
        restaurantName = response.jsonBody.businesses[0].name;
        restaurantNumb = response.jsonBody.businesses[0].display_phone;
        restaurantImg = response.jsonBody.businesses[0].image_url;
        // restaurantRating = response.jsonBody.businesses[0].rating;

        // console.log(restaurantName);
        // console.log(restaurantNumb);
        // console.log( restaurantImg );
        convo.say('Bravo!');
        convo.say(restaurantName);
        // convo.say(restaurantRating);
        convo.say(restaurantNumb);
        convo.say(restaurantImg);

      }).catch(e => {
        console.log(e);
      });


      convo.next();
    }
  }
],{},'default');



    })


});

controller.hears(['help'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Help? This app is designed for finding good food near you. Please type keywords such as food or restaurant to start.');
});

controller.hears(['(.*?)'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'What are you even talking about?');
});
