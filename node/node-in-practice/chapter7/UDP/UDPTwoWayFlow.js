
var dgram = require('dgram');
var port = 41234;

function Client(remoteIP) {
  var socket = dgram.createSocket('udp4');
  var readline = require('readline');
  var rl = readline.createInterface(process.stdin, process.stdout);

  socket.send(new Buffer('<JOIN>'), 0, 6, port, remoteIP);

  rl.setPrompt('message>');
  rl.prompt();

  rl.on('line',function(line){
    sendData(line);
  }).on('close', function(){
    process.exit();
  });

  socket.on('message', function(msg, rinfo){
    console.log('\n<' + rinfo.address + '>', msg.toString());
    rl.prompt();
  });

  function sendData(message){
    socket.send(new Buffer(message), 0, message.length, port, remoteIP, function(err, bytes){
      console.log('sent:', message);
      rl.prompt();
    });
  }
}

function Server() {
  var clients = [];
  var server = dgram.createSocket('udp4');

  server.on('message', function(msg, rinfo){
    var clientId = rinfo.address + ':' + rinfo.port;
    
    msg = msg.toString();
    if(!clients[clientId]){
      clients[clientId] = rinfo;
    }
    
    if(msg.match(/^</)){
      console.log('Control message:', msg);
      return;
    }

    for(var client in clients){
      if(client !== clientId){
        client = clients[client];
        server.send(
          new Buffer(msg),
          0,
          msg.length,
          client.port,
          client.address,
          function(err, bytes){
            if(err) {
              console.error(err);
            }
            console.log('Bytes sent:', bytes);
          }
        );
      }
    }
  });
  server.on('listening', function(){
    console.log('server ready:', server.address());
  });

  server.bind(port);
}

module.exports = {
  Client: Client,
  Server: Server
};

if(!module.parent) {
  switch(process.argv[2]){
    case 'client':
      new Client(process.argv[3]);
      break;
    case 'server':
      new Server();
      break;
    default: 
      console.log('Unknown option');
  }
}
