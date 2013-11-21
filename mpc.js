
module.exports.MPC = MPC = function(host, port) {
    var io = require('socket.io-client');
    var socket = io.connect("http://localhost:6600");
    socket.once("hello", function(data) {
	console.log("Connected");
    });
    switch (process.argv[2]) {
    case "add":
	socket.emit("add", {files:["sample.mp3", "sample.mp3"]});
	break;
    default:
	socket.emit(process.argv[2]);
	break;
    } 
//    socket.disconnect();
}
if(require.main === module) {
    var mpc = new MPC("localhost", 6600);
    
}