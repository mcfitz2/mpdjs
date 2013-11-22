var stream = require("stream"), crypto = require("crypto"), util = require("util");
module.exports = HashStream = function(algo) {
    stream.Transform.call(this);
    this.writable = true;
    this.readable = true;
    this.src = null;
    this.hash = crypto.createHash(algo);
    this.once("pipe", function(src) {
	this.src = src;
	this.src.once("end", function() {
	    this.emit("hash", this.hash.digest('hex'));
	}.bind(this));
    });
}
util.inherits(HashStream, stream.Transform);
HashStream.prototype._transform = function(chunk, encoding, callback) {
    this.push(chunk);
    this.hash.update(chunk);
    callback();
}



