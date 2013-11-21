VERSION = "0.0.1";
PLAYING = 0;
PAUSED = 1;
STOPPED = 2;
var Player = require("./player.js");
var lame = require("lame"), 
IO = require('socket.io'), 
fs = require('fs');
module.exports.MPD = MPD = function(host, port) {
    var io = IO.listen(port);
    this.playlist = [];

    this.player = new Player();
    this.state = {player:STOPPED, song:{filename:""}, pl_index:0};
    this.player.on("position", function(event) {
	console.log(event);
    });
    io.sockets.on('connection', function (socket) {
	
	var self = this;
	socket.on("anything", function() {
	    console.log(self.state);
	    console.log(self.player.state);
	});
//	console.log(this.player);
	socket.emit("hello", VERSION);	
	socket.on("play", function(data) {
	    //if (! self.player.loaded) {
	    if (self.playlist.length > 0) {
		console.log("Playing", self.playlist[self.state.pl_index]);
		self.player.play(self.playlist[self.state.pl_index]);
		self.state.song.filename = self.playlist[self.state.pl_index];
	    }
	    //}
	
	});
	socket.on("add", function(data) {
	    data.files.forEach(function(track) {
		console.log("Adding track", track);
		self.playlist.push(track);
	    });
	});
	socket.on("pause", function(data) {
	    self.player.pause();
	});
	socket.on("stop", function(data) {
	    self.player.stop();
	});
	socket.on("next", function(data) {
	    self.next();
	});
	socket.on("state", function(data) {
	    socket.emit("state", self.state);
	});
	socket.on("playlist", function() { 
	    console.log(self.playlist);
	    socket.emit("playlist", self.playlist);
	});
    }.bind(this));
}
MPD.prototype.next = function() {
    this.state.pl_index++;
    if (this.state.pl_index >= this.playlist.length) {
	this.state.pl_index = 0;
    } else {
	this.player.stop();
	//	    this.player.load(playlist[this.state.pl_index]);
	this.player.play(this.playlist[this.state.pl_index]);
    }
}
if(require.main === module) {
    var mpd = new MPD("localhost", 6600);
}
