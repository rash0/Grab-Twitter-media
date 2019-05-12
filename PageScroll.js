// for (var i=0; i<20; i++){
//   progrss_bar += '\u2591';
// }

async function pageScroll(page, tweets_number) {
  // Async Scroll loop
  try{
    // create percentage bar
    let progrss_bar = Array.from({length: 80}, () => '\u2591')
    let final_bar = ''

    let match = false
    while(!match){
      // Get the number of the visible tweets on the page
      twts = await page.evaluate(() => [...document.querySelectorAll('.js-stream-item.stream-item.stream-item')])
      // scroll to the bottom of the page
      await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));

      //////// Percentage Bar //////////////
      var tweet_percentage = Math.round(Number(twts.length) / Number(tweets_number) * 100)
      if(tweet_percentage !== 100){
        // Fill all the blocks under the current percentage
        for(var i=0; i <tweet_percentage; i++){
          progrss_bar[i] = '\u2589'
        }
      }
      await process.stdout.write(`[ ${progrss_bar.join("")} ] ${tweet_percentage}% Completed\r`)
      ////////////////////////////////////

      // only if the tweets/page is equall to the media count[tweets_number] on the main profile
      if(twts.length === Number(tweets_number)){
        match = true
      }
    }
    return null
  }catch (err){
    console.log(err)
  }
}

module.exports = pageScroll
