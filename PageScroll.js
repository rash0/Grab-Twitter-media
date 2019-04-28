async function pageScroll(page, tweets_number) {
  // Async Scroll loop
  try{
    let match = false
    while(!match){
      // Get the number of the visible tweets on the page
      twts = await page.evaluate(() => [...document.querySelectorAll('.js-stream-item.stream-item.stream-item')])
      // scroll to the bottom of the page
      await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));

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
