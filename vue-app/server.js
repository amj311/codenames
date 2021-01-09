var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var lt = require ("localtunnel");
var open = require ("open");

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io').listen(server);

var cors = require('cors')

let port = 3000;
server.listen(port);

let dev = require("./env.json").dev;
process.env.DEV = dev;
console.log("Running dev:"+process.env.DEV)

if (!dev) {
  (async () => {
    const tunnel = await lt({
      port,
      subdomain: "bom-codenames"
    });
  
    // the assigned public url for your tunnel
    console.log("App on network: "+tunnel.url);
    open(tunnel.url)
  
    tunnel.on('close', () => {
      // tunnels are closed
      console.log(`Network tunnel to port ${port} was closed.`)
    });
  })();
}


var corsOptions = {
  origin: 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));


function randomString(length) {
  let string = "";
  while (string.length < length) {
    let char;
    do {
      char = String.fromCharCode(97+Math.floor(Math.random()*26))
    } while ('aeiou'.lastIndexOf(char) >= 0) 
    string += char;
  }
  return string;
}

// ROOMS
const RoomManager = require('../model/server/GameRoomManager.js')
let rooms = new Map(); //Map<roomId,RoomManager>

function newRoom(mode) {
  let newRoomId;
  do {
    newRoomId = randomString(5);
  } while ( rooms.has(newRoomId))

  rooms.set(newRoomId, new RoomManager(newRoomId, mode))

  return newRoomId;
}



// ROUTES
app.get('/api/rooms/:id', (req,res) => {
  if (req.params.id == "all") return res.json(rooms.values())

  let roomMatch = rooms.get(req.params.id)

  if (roomMatch) {
    console.log('Found requested room '+roomMatch.id)			
    res.json({ok: true, rid: roomMatch.id})
  }
  else res.json({ok: false})
})

app.get('/api/newroom/:mode', (req,res) => {
  console.log("new room requested")
  let newRoomId = newRoom(req.params.mode);
  console.log("Created new room: "+newRoomId)
  res.json({ok: true, rid: newRoomId})
})

app.delete('/api/closeroom/:id', (req,res) => {
  let roomMatch = rooms.get(req.params.id)

  if (roomMatch) {
    console.log('Found requested room '+roomMatch.id)			
    roomMatch.beforeClose();
    rooms.delete(roomMatch.id)
    res.sendStatus(200)
  }
  else {
    console.log("Could not find room: "+roomMatch.id)
    res.sendStatus(404)
  }
})

app.get('/api/canrejoin/:roomId/:socketId', (req,res) => {
  let roomId = req.params.roomId;
  let socketId = req.params.socketId;
  let canReconnect = false;
  console.log("trying to reconnect: ",socketId)

  let roomMatch = rooms.get(roomId)

  if (roomMatch) {
    console.log('Found requested room '+roomMatch.id)			
    canReconnect = roomMatch.canReconnect(socketId);
  }

  res.json({ok: canReconnect})
})




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});




// SOCKETS
socketio.on('connection', (socket) => {
  console.log("New socket connected: "+socket.id)
  socket.emit('msg','Message from server: Hi!')

  socket.on('joinRoom', (roomId, userData, cb) => {
    console.log("requesting room id: "+roomId)

    let roomMatch = rooms.get(roomId)

    if (roomMatch) {
      console.log('Found requested room '+roomMatch.id)			
      roomMatch.addPlayer(socket, userData)
      cb();
    }
    else {
      console.log("Could not find room: "+roomId)
      socket.emit('err',"Could not find room: "+roomId)
    }
  })


  socket.on('rejoinRoom', (roomId, socketId, cb) => {
    let roomMatch = rooms.get(roomId)
    let success = false;
    if (roomMatch) {
      console.log('Found requested room '+roomMatch.id)			
      success = roomMatch.handleReturningPlayer(socket, socketId, cb)
    }
    if (!success) socket.emit('err',"Could not reconnect to room: "+roomId)
  })

})