const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const puppeteer = require('puppeteer');
var fs = require('fs');
var start = new Date()
const cheerio = require('cheerio');
const video_editLink = require('./EditLink')
const pageScroll = require('./PageScroll')


// TODOOOOOOOO:
//
//
// modularize more
// find a solution for the 30 sec timeout window, by elongating the timeout duration
//
// Useful Links:
// https://github.com/extrabacon/http-delayed-response
// https://spin.atomicobject.com/2018/05/15/extending-heroku-timeout-node/




// // app.get('*', function (req, res) {
// //     res.sendFile(__dirname + '/client/build/index.html')
// // });

// async function heart(page) {
//   let content = await page.waitForFunction(() => {
//     let tweets = [...document.querySelectorAll('.js-stream-item.stream-item.stream-item')]
//     let img_array = [];
//     //Map the tweets which is <li> elements, and push the one which have image only
//     for (var i = 0; i < tweets.length; i++) {
//       // var tweet_parent = tweets[i].getElementsByClassName('AdaptiveMedia-photoContainer js-adaptive-photo ')
//       let tweet_Id = tweets[i].attributes[1].value
//       let tweeted_At = tweets[i].getElementsByClassName('_timestamp js-short-timestamp')[0].attributes[2].value
//       let img_parent = tweets[i].getElementsByClassName('AdaptiveMedia-photoContainer js-adaptive-photo ')
//       let video = tweets[i].getElementsByClassName('PlayableMedia-player')
//
//       let temp_img_array = []
//
//       if (img_parent.length !== 0) {
//         [...img_parent].map((im, ind) => temp_img_array.push(im.lastElementChild['src']))
//
//         img_array.push({
//           'tweet_Id': tweet_Id,
//           'image_Link': temp_img_array,
//           'video': null,
//           'tweeted_At': tweeted_At
//         })
//       }
//       if (video.length !== 0) {
//         let video_link = video[0].attributes[9].value
//
//         const video_edit_link = (link) => {
//           // extract the link
//           var a = link.match(/https[\s\S]*.jpg/g)[0]
//           // Replace the word 'thumb' with nothing
//           var b = a.replace(/((_thum))\w+/gi, '')
//           // Replace the word 'jpg' with 'mp4'
//           var c = b.replace(/((jp))\w+/gi, 'mp4')
//
//           return c
//         }
//
//         img_array.push({
//           'tweet_Id': tweet_Id,
//           'image_Links': null,
//           'video_Link': video_edit_link(video_link),
//           'tweeted_At': tweeted_At
//         })
//       }
//     }
//     return JSON.stringify(img_array, null, 4)
//   })
//   return content
// }

// async function pageScroll(page, tweets_number) {
//   // Async Scroll loop
//   try{
//     var twts = []
//     let match = false
//     while(!match){
//       // Get the number of the visible tweets on the page
//       twts = await page.evaluate(() => [...document.querySelectorAll('.js-stream-item.stream-item.stream-item')])
//       // scroll to the bottom of the page
//       await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
//       if(twts.length === Number(tweets_number)){
//         match = true
//       }
//       // await console.log(twts.length)
//     }
//     return twts
//   }catch (err){
//     console.log(err)
//   }
// }

async function get_media(username) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  // open twitter
  // await page.goto('https://twitter.com/login');

  // Login
  // await page.$eval('.js-username-field.email-input.js-initial-focus', e => e.value = "injeel.twi@gmail.com")
  // await page.$eval('.js-password-field', e => e.value = "Injeel1991$")
  // await page.click('.submit.EdgeButton.EdgeButton--primary.EdgeButtom--medium')

  //  wait till page load
  // await page.waitForNavigation()

  // Navigate to the account
  await page.goto(`https://www.twitter.com/${username}`)

  // Get the media count
  const tweets_number = await page.evaluate(() => document.querySelector('.PhotoRail-headingWithCount.js-nav').innerText.trim().match(/\d+/)[0])
  // await console.log(tweets_number)

  // Navigate to media
  await page.goto(`https://www.twitter.com/${username}/media`)

  // Scroll till the bottom of the page
  await pageScroll(page, tweets_number)
  // then, Get full page content
  const page_content = await page.content()
  // Close browser
  await browser.close();
  return page_content
}

async function filterContent(username){
  var allContent = await get_media(username)

  const $ = await cheerio.load(allContent, { normalizeWhitespace: true })

  // the final json tweet api array
  const tweet_json = []

  // For each tweet, if contains image, get the src, if video, get it from the inline-styles and modify it
  var tweets = await $('li.js-stream-item.stream-item.stream-item').each((i, e) => {

    var imageArray = [];

    // If the tweet doesnt have video, iterate through the images
    if(!$(e).find('div.AdaptiveMedia-container').next().hasClass('AdaptiveMedia-video')){
      $(e).find('div.AdaptiveMedia-container').find('img').each((ii, el) => {
        imageArray.push($(el).attr('src'))
      })
    }

    // extract the video parent inline-style
    const video_string = $(e).find('div.AdaptiveMedia-container').find('div.PlayableMedia-player').attr('style')

    const tweetData = {
      'tweet_Id': $(e).data('item-id'),
      'image_Link': imageArray,
      'video': video_editLink(video_string),
      'tweeted_At': $(e).find('span._timestamp.js-short-timestamp').data('time')
    }

    tweet_json.push(tweetData)
  })

  return tweet_json
}

const extendTimeoutMiddleware = (req, res, next) => {
  const space = ' ';
  let isFinished = false;
  let isDataSent = false;

  // Only extend the timeout for API requests
  // if (!req.url.includes('*')) {
  //   next();
  //   return;
  // }

  res.once('finish', () => {
    isFinished = true;
  });

  res.once('end', () => {
    isFinished = true;
  });

  res.once('close', () => {
    isFinished = true;
  });

  res.on('data', (data) => {
    // Look for something other than our blank space to indicate that real
    // data is now being sent back to the client.
    if (data !== space) {
      isDataSent = true;
    }
  });

  const waitAndSend = () => {
    setTimeout(() => {
      // If the response hasn't finished and hasn't sent any data back....
      if (!isFinished && !isDataSent) {
        // Need to write the status code/headers if they haven't been sent yet.
        if (!res.headersSent) {
          res.writeHead(202);
        }

        res.write(space);
        console.log('written a space')
        // Wait another 15 seconds
        waitAndSend();
      }
    }, 15000);
  };

  waitAndSend();
  next();
};

app.use('/:username', extendTimeoutMiddleware);

app.get('/:username', function(req, res) {
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  const username = req.params.username
  // console.log(req.params.username)
  filterContent(username)
  .then(r => res.status(200).send(r).end())
  // .then(() => console.info('Execution time: %dms',  new Date() - start))
  .catch(err => console.log(err))
});
//

app.listen(port)
