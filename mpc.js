
module.exports.MPC = MPC = function(host, port) {
    var io = require('socket.io-client');
    var socket = io.connect("http://localhost:6600");
    socket.once("hello", function(data) {
	console.log("Connected");
    });
    socket.emit("add", {files:["/nfs/nfs4/home/mifitzge/dev/mpdjs/music/JEFF the Brotherhood - Castle Storm [Album] [eb51111b-6f64-419e-8bbc-01e55c5f43d3]/13. Hot Gloo.mp3"]});
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