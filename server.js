var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var mongoose = require('mongoose');
var User = require('./api/models/aimosUserModel');
var Message = require('./api/models/aimosMessageModel');
var bodyParser = require('body-parser');

MessageModel = mongoose.model('Message');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://api:toor@ds159676.mlab.com:59676/heroku_8wqpw17m', { useMongoClient: true });


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var routes = require('./api/routes/aimosRoutes');
routes(app);

app.use(function(req, res) {
	res.status(404).send({url: req.originalUrl + ' not found'})
});

/*io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });
});*/

http.listen(port, function(){
  console.log('listening on *:3000');
});

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {

  socket.isUserAuth = false;

  socket.on('user auth', function (data) {
    if (socket.isUserAuth) {
      socket.emit('auth success', "success");
    } else {
      if (!token) {
        socket.emit('auth failed', "Token required");
      }
      User.find({token : data.token}, function (err, docs) {
        if (err) {
          socket.emit('auth failed', err);
        }
        numUsers++;
        socket.isUserAuth = true;
        socket.username = docs[0].username;
        socket.emit('auth success', "success");
        socket.broadcast.emit('user joined', {
          username: socket.username,
          numUsers: numUsers
        });
      });
    }
  });

  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

  socket.on('new message', function (data) {
    var message = new MessageModel(
    {
      sender: socket.username,
      text: data,
    });
    message.save(function(err){
      if (err) {
        socket.broadcast.emit('new message failed');
      } else {
        socket.broadcast.emit('new message', {
          username: socket.username,
          message: data
        });
        socket.emit('new message success', {
          username: socket.username,
          message: data
        });
      }
    });
  });

});