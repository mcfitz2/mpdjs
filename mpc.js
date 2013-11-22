
module.exports.MPC = MPC = function(host, port) {
    var io = require('socket.io-client');
    var socket = io.connect("http://localhost:6600");
    socket.once("hello", function(data) {
	console.log("Connected");
    });
    socket.emit("add", {files:["music/sample.mp3", "music/sample.mp3"]});
    socket.on("addfinished", function() {
	socket.emit("play");
	setTimeout(function() {
	    socket.emit("pause");
	}, 5000);
    });
}
if(require.main === module) {
    var mpc = new MPC("localhost", 6600);
    
}