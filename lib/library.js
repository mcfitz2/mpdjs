var mm = require("musicmetadata");
var findit = require('findit');
var fs = require("fs");
var MongoClient = require('mongodb').MongoClient
var path = require("path");
var async = require("async");
var hashstream = require("./hashstream");
module.exports = Library = function(db, musicdir) {
    this.musicdir = musicdir;
    this.db = db;
}
Library.prototype.update = function(callback) {
    var collection = this.db.collection('songs');
    var finder = findit(this.musicdir);
    var allFiles = [];
    var queue = async.queue(function(file, cb) {
	var fStream = fs.createReadStream(file);
	var hs = new hashstream("md5");
	var doc = {filename:file};
	var parser = new mm(fStream.pipe(hs));
	parser.on('metadata', function (result) {
	    for (var key in result) {
		if (result.hasOwnProperty(key)) {
		    doc[key] = result[key];
		}
	    }
	});
	hs.on("hash", function(hash) {
	    doc.md5 = hash;
	});
	hs.on("end", function() {
	    console.log(doc.filename);
	    collection.update(doc, doc, {upsert:true}, function(err, docs) {
		if (err) throw err;
		cb();
	    }); 
	});
    }, 10);
    queue.drain = function() {
	callback();
    }
    finder.on("file", function(file) {
	var fullPath = path.resolve(process.cwd(), file);
	var ext = path.extname(file);
	if ([".mp3", ".flac"].indexOf(ext) > -1) {   
	    queue.push(fullPath, function(err) {
		
	    });
	    
	}
	
    });
}
Library.prototype.find = function(query, callback) {
    var collection = this.db.collection("songs");
    collection.find(query).toArray(callback);
}


if (require.main == module) {
    var url =  "mongodb://micah:cl0ser2g0d@ds053778.mongolab.com:53778/mpdjs"
    MongoClient.connect(url, function(err, db) {
	var l = new Library(db, "music/");
	l.update(function() {
	    db.close();
	});
   });
}