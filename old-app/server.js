var express = require('express');
var app = express();

app.use(express.static('frontend/dist'));

app.listen(3001, () => console.log("Test Express running on 3001"))