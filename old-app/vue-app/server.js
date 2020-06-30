var express = require('express');
var crypto = require('crypto')
var app = express();

// app.use(express.static(__dirname + 'vue-app/dist'));
// app.use(express.static('vue-app/frontend/dist'));
app.use(express.static(__dirname + 'dist'));

app.listen(3000, () => console.log("Codenames Server running on 3000"))


var rooms = ['test']

function newRoom() {
    // THERE IS CURRENTLY NO CLEANUP OPERATION TO REMOVE IDSFROM THIS LIST!!!
    let newRoomId;
    do {
        newRoomId = crypto.randomBytes(3).toString('hex');
    } while ( rooms.filter( r => r.rid === newRoomId ).length > 0 )
    rooms.push(newRoomId)
    console.log('Created new room:' +newRoomId);
    return newRoomId;
}

app.get('/api/rooms/:id', (req, res) => {
    let matchId = rooms.filter(rid => rid === req.params.id)[0];

    if (matchId) {
        console.log('Found requested room: '+req.params.id);
        res.json({ok: true})
    }
    else {
        console.log('Could not find requested room: '+req.params.id);
        res.status(404).json({ok: false, msg: "Room not found"});
    }
})

app.get('/api/new-room', (req, res) => {
    let newId = newRoom();

    res.json({ok: true, rid: newId })
})
