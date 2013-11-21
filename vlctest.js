var vlc = require('vlc')([
    '-I', 'dummy',
    '-V', 'dummy',
    '--verbose', '1',
    '--no-video-title-show',
    '--no-disable-screensaver',
    '--no-snapshot-preview',
]);

var media = vlc.mediaFromFile(process.argv[2]);
media.parseSync();

media.track_info.forEach(function (info) {
    console.log(info);
});

console.log(media.artist, '--', media.album, '--', media.title);

var player = vlc.mediaplayer;
player.media = media;
console.log('Media duration:', media.duration);

player.play();
var POS = 0.5
player.position = POS;

var poller = setInterval(function () {
    console.log('Poll:', player.position);
    if (player.position < POS)
	return;

	clearInterval(poller);
   
}, 500);
