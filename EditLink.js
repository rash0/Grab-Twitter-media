// This Function is responsible of extracting and manipulating the video/gid link
// It takes a string similar to This
//
// padding-bottom: 81.48148148148148%; background-image:url('https://pbs.twimg.com/tweet_video_thumb/D3-UnOuW0AAY9zv.jpg')
//
// and return this video/gif link
//
// https://pbs.twimg.com/tweet_video/D3-UnOuW0AAY9zv.mp4

const video_editLink = link => {
  // extract the link
  var a = link.match(/https[\s\S]*.jpg/g)[0]
  // Replace the word 'thumb' with nothing
  var b = a.replace(/((_thum))\w+/gi, '')
  // Replace the word 'jpg' with 'mp4'
  var c = b.replace(/((jp))\w+/gi, 'mp4')

  return c
}

const video_final = video_string => {
  // if undefined
  if(!video_string){
    return null
  }else{
    return video_editLink(video_string)
  }
}

module.exports = video_final
