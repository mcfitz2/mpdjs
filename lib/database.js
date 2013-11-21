var mm = require("musicmetadata");
var findit = require('findit');
var fs = require("fs");
var MongoClient = require('mongodb').MongoClient
var path = require("path");
var async = require("async");
module.exports = Library = function(db, musicdir) {
    this.musicdir = musicdir;
}
Library.prototype.update = function(callback) {
	var collection = db.collection('songs');
	var finder = findit(this.musicdir);
	var queue = async.queue(function(file, cb) {
//	    console.log(file);
	    var ext = path.extname(file);
	    if ([".mp3", ".flac"].indexOf(ext) > -1) {
		var parser = new mm(fs.createReadStream(file));
		parser.on('metadata', function (result) {
		    console.log(result);
		    collection.update(result, result, {upsert:true}, function(err, docs) {
			if (err) throw err;
			cb();
		    }); 
		});
	    }
	}, 10);
	queue.drain = function() {
	    db.close();
	    callback();
	}
	finder.on("file", function(file) {
	    queue.push(file, function(err) {
		console.log("processed song");
	    });
	});
    });
}
Library.find = function(query) {
}


if (require.main == module) {
    MongoClient.connect(url, function(err, db) {
	var l = new Library(db, "music/");
	l.update();
   });
}