var mm = require("musicmetadata");
var findit = require('findit');
var fs = require("fs");
var MongoClient = require('mongodb').MongoClient
var path = require("path");
var async = require("async");
var hashstream = require("./hashstream");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

module.exports = Library = function(config) {
    EventEmitter.call(this);
    this.musicdir = config.musicdir;
    this.config = config;
    this.db = null;
    

}
util.inherits(Library, EventEmitter);
Library.prototype.connect = function() {
    var url =  "mongodb://"+this.config.dbuser+":"+this.config.dbpassword+"@"+this.config.dburl;
    var self = this;
    MongoClient.connect(url, function(err, db) {
	if (err) throw err;	
	self.db = db;
	self.coll = db.collection("songs");
	self.emit("dbconnect");
    });
}
Library.prototype.update = function(callback) {
    if (this.db == null) {
	callback(new Error("DB not connected"));
    } else {
	var self = this;
	var finder = findit(this.musicdir);
	var allFiles = [];
	var queue = async.queue(function(file, cb) {
	    var fStream = fs.createReadStream(file);
	    var hs = new hashstream("md5");
	    var doc = {filename:file};
	    var parser = new mm(fStream.pipe(hs));
	    parser.on('metadata', function (result) {
		for (var key in result) {
		    if (result.hasOwnProperty(key) && key != "picture") {
			doc[key] = result[key];
		    }
		}
	    });
	    hs.on("hash", function(hash) {
		doc.md5 = hash;
	    });
	    hs.on("end", function() {
		console.log(doc.filename);
		self.coll.update(doc, doc, {upsert:true}, function(err, docs) {
		    cb(err);
		}); 
	    });
	}, 10);
	queue.drain = function() {
	    self.coll.find()
		.toArray(function(err, docs) {
		    callback(err);
		    async.each(docs, function(item, callback) {
			if (allFiles.indexOf(item.filename) < 0) {
			    console.log("Removing", item);
			    collection.remove(item, function (err, result) {
				callback(err);
			    });
			} else {
			    callback(null);
			}
		    }, function(err) {
			callback(err);
		    });
		});
	    
	}
	finder.on("file", function(file) {
	    var fullPath = path.resolve(process.cwd(), file);
	    var ext = path.extname(file);
	    if (self.config.extensions.indexOf(ext) > -1) {   
		queue.push(fullPath, function(err) {});
		allFiles.push(fullPath);
	    }
	});	    
    }
}
Library.prototype.find = function(query, callback) {
    var collection = this.db.collection("songs");
    collection.find(query).toArray(callback);
}
Library.prototype.close = function() {
    this.db.close();
}
if (require.main == module) {
    var config = require("../config.json");
    var l = new Library(config);
    l.once("dbconnect", function() {
	l.update(function(err) {
	    l.find({artist:"JEFF the Brotherhood"}, function(err, docs) {
		console.log(docs);
		l.close();
	    });
	    
	});
    });
    l.connect();
}