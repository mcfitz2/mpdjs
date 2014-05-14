VERSION = "0.0.1";
PLAYING = 0;
PAUSED = 1;
STOPPED = 2;
var async = require("async");
var Player = require("./player.js");
var Library = require("./lib/library.js");
var lame = require("lame"), 
IO = require('socket.io'), 
fs = require('fs'),
util = require("util"),
EventEmitter = require("events").EventEmitter;
var config = require("./config.json");
module.exports.MPD = MPD = function(host, port) {
    var io = IO.listen(port);
    this.playlist = [];
    this.lib = new Library(config);
    this.lib.once("dbconnect", function() {
	this.lib.update(function(err) {
	    if (err) console.log(err);
	});
	this.player = new Player();
	this.player.on("statechange", function(state) {
	    this.state.player = state;
	});
	this.state = {player:STOPPED, song:{filename:""}, pl_index:0};
	this.player.on("position", function(event) {
	    console.log(event);
	});
	io.sockets.on('connection', function (socket) {	
	    var self = this;
	    socket.emit("hello", VERSION);	
	    socket.on("play", function(data) {
		if (self.state.player != PLAYING && self.playlist.length > 0) {
		    console.log("Playing", self.playlist[self.state.pl_index].title+" by "+self.playlist[self.state.pl_index].artist);
		    self.player.play(self.playlist[self.state.pl_index].filename);
		    self.state.song.filename = self.playlist[self.state.pl_index].filename;
		}
	    });
	    socket.on("add", function(data) {
		async.each(data.files, function(track, callback) {

		    self.lib.coll.find({filename:track}).limit(1).toArray(function(err, doc) {
			if (doc.length > 0) {
			    console.log("Adding track", track);
			    self.playlist.push(doc[0]);
			}
			callback();
		    });
		}, function() {
		    socket.emit("addfinished")
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
    }.bind(this));
    this.lib.connect();
}  
util.inherits(MPD, EventEmitter);

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
