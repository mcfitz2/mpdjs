var fs = require("fs");
var path = require("path");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
module.exports = Walker = function(options) {
    var options = options || {};
    function walk(root) {
	var self = this;
	fs.readdir(root, function(err, files) {
	    for (var i = 0; i < files.length; i++) {
		self.emit("pathname", path.join(root, files[i]));
	    }
	});
    }
    function filter(pathname) {
	var self = this;
	fs.stat(pathname, function(err, stat) {
	    if (err) {
//		console.log("ERROR", err, pathname);
	    } else {
		if (stat.isDirectory()) {
		    self.emit("directory", pathname);
		} else if (stat.isFile()) {
		    if (!options.extensions || (options.extensions && options.extensions.indexOf(path.extname(pathname)) >= 0)) {
			self.emit("file", pathname);					
		    }
		}
	    }
	});
    }
    this.on("directory", walk);
    this.on("pathname", filter);

}
util.inherits(Walker, EventEmitter);
Walker.prototype.walk = function(root) {
    this.emit("directory", root);
}

if (require.main == module) {
    var w = new Walker({extensions:[".mp3", ".flac", ".ogg", ".m4a"]});
    console.log(process.argv[2]);
    w.on("file", function(file) {console.log(file)});
    w.walk(process.argv[2]);
}