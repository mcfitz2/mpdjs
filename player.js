PLAYING = 0;
PAUSED = 1;
STOPPED = 2;
var lame = require("lame"), 
spkr = require("speaker"),
fs = require('fs'),
util = require("util"),
EventEmitter = require("events").EventEmitter;
module.exports = Player = function() {
    this.decoderOpts = {
	channels: 2,        // 2 channels (left and right)
	bitDepth: 16,       // 16-bit samples
	sampleRate: 44100   // 44,100 Hz sample rate
    };
    this.state = {loaded:false, player:STOPPED, filename:"", position:0};
    this.decoder = new lame.Decoder(this.decoderOpts);
    this.speaker = null;
    this.fileStream = null;
    this.on("paused", function() {
	this.fileStream.pause();
	this.decoder.pause();
    });
}
util.inherits(Player, EventEmitter);
Player.prototype.pause = function() {
    this.state.player = PAUSED;
    this.emit("paused");
    this.emit("statechange", PAUSED);
}
Player.prototype.play  = function(filename) {
    if (filename) {
	var self = this;
	this.state.player = PLAYING;
	this.emit("statechange", PLAYING);
	this.fileStream = fs.createReadStream(filename);
	this.fileStream.on("data", function(chunk) {
	    if (!self.state.player == PAUSED) {
//		console.log("Writing to decoder", self.state.player);
		var ready = self.decoder.write(chunk);
		if (!ready) {
		    self.fileStream.pause();
		    self.decoder.once("drain", self.fileStream.resume.bind(self));
		}
	    } else {
		self.fileStream.pause();
	    }
	});
	this.fileStream.on("end", function() {
	    self.decoder.end();
	});
	this.decoder = new lame.Decoder(this.decoderOpts);
	this.decoder.on("format", function(format) {
	    self.speaker = new spkr(format);
	});
	this.decoder.on("data", function(chunk) {
	    if (self.speaker != null) {
		if (!self.state.player == PAUSED) {
//		    console.log("Writing to speaker");
		    var ready = self.speaker.write(chunk);
		    if (!ready) {
			self.decoder.pause();
			self.speaker.once("drain", self.decoder.resume.bind(self));
		    }
		} else {
		    self.decoder.pause();
		}
	    }
	});
	this.decoder.on("end", function() {
	    try {
		self.speaker.end();
	    } catch (err) {
		console.log(err);
	    }
	    self.emit("songend");
	});
	this.fileStream.resume();
	this.decoder.resume();
    } else {
	if (this.state.player == PAUSED && this.fileStream != null) {
	    this.fileStream.resume();
	    this.decoder.resume();
	    this.state.player = PLAYING;
	    this.emit("playing");
	} else if (this.state.player == STOPPED) {
	    console.log("You must supply a filename to play");
	}
    }
}
Player.prototype.stop = function() {
    try {
	this.fileStream.end();
    } catch (e) {
	console.log(e);
    }
    try {
	this.decoder.end();
    } catch (e) {
	console.log(e);
    }
    try {
	this.speaker.end();
    } catch (e) {
	console.log(e);
    }
    this.emit("statechange", STOPPED);
    this.state = STOPPED;
    this.emit("stopped");
}
Player.prototype.close = function() {
}    

if (require.main == module) {
    var player = new Player();
    player.on("playing", function() {
	console.log("Playing");
    });
    player.on("paused", function() {
	console.log("Paused");
    });
    player.play("music/sample.mp3");
    setTimeout(function() {
	player.pause();
    }, 3000);
    setTimeout(function() {
	player.play();
    }, 7000);

}
