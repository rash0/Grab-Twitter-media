const port = process.env.PORT || 5000;
const puppeteer = require('puppeteer');
var fs = require('fs');
const cheerio = require('cheerio');
const video_editLink = require('./EditLink')
const pageScroll = require('./PageScroll')
const noTimeout = require('./NoTimeout')

const username = process.env.USER_NAME || 'jack'

async function getContent(username) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox']
  });
  await process.stdout.write('\n')

  // Initiate
  const page = await browser.newPage();

  // Navigate to the account
  await page.goto(`https://www.twitter.com/${username}`)

  // Get the media count
  const tweets_number = await page.evaluate(() => document.querySelector('.PhotoRail-headingWithCount.js-nav').innerText.trim().replace(/[^\d]/g, ''))

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

  // Full Page Content
  var allContent = await getContent(username)

  // Initiate cheerio
  const $ = await cheerio.load(allContent, { normalizeWhitespace: true })

  // The final json tweet api array
  const tweet_json = []

  // For each tweet, if contains image, get the src, if video, get it from the inline-styles and modify it
  var tweets = await $('li.js-stream-item.stream-item.stream-item').each((i, e) => {

    var imageArray = [];

    // If the tweet doesnt have video, iterate through the images
    if(!$(e).find('div.AdaptiveMedia-container').next().hasClass('AdaptiveMedia-video')){
      $(e).find('div.AdaptiveMedia-container').find('img').each((ii, el) => {
        // and then push the image link to imageArray
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

filterContent(username)
.then(r => fs.writeFileSync('./NOWW.json', JSON.stringify(r)))
