var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var crypto = require('crypto')

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io').listen(server);

var cors = require('cors')

server.listen(3000);

var corsOptions = {
  origin: 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));




// ROOMS
let rooms = ['test'];
function newRoom() {
  // There is currently no function for removing rooms after they are created!
  let newRoomId;
  do {
    newRoomId = crypto.randomBytes(3).toString('hex');
  } while ( rooms.filter( r => r.rid === newRoomId ).length > 0 )
  rooms.push(newRoomId)
  return newRoomId;
}



// ROUTES
app.get('/api/rooms/:id', (req,res) => {
  let roomMatch = rooms.filter(rid => rid === req.params.id)[0]

  if (roomMatch) {
    console.log('Found requested room '+roomMatch)			
    res.json({ok: true, rid: roomMatch})
  }
  else res.json({ok: false})
})
app.get('/api/newroom', (req,res) => {
  let newRoomId = newRoom();
  console.log("Created new room: "+newRoomId)
  res.json({ok: true, rid: newRoomId})
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
  res.send('error');
});




// SOCKETS
socketio.on('connection', (socket) => {
  console.log("New socket connected: "+socket.id)
  socket.emit('msg','Hi')

  socket.on('joinRoom', (roomId, cb) => {
    let roomMatch = rooms.filter(rid => rid === roomId)[0]

    if (roomMatch) {
      console.log('Found requested room '+roomMatch)			
      socket.join(roomMatch)
      cb();
    }
    else console.log("Could not find room: "+roomId)
  })

  socket.on('disconnect', () => {
    console.log("Lost socket: "+socket.id)
  })
})