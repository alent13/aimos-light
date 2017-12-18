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
UserModel = mongoose.model('User');

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
  console.log('on connection')

  isUserAuth = false;
  username = "";

  socket.on('user auth', function (data) {
    console.log('on user auth - ' + JSON.stringify(data))
    if (isUserAuth) {
      MessageModel.find({}).sort({date: 'asc'}).limit(10).exec(function (err, messages) {
        var messageList = messages.map(function(messageRecord) {
          return {
            text: messageRecord.text,
            sender: messageRecord.sender,
            datetime: messageRecord.datetime,
          };
        });
        socket.emit('auth success', {
          numUsers: numUsers,
          messageList,
        });
      });
    } else {
      UserModel.findOne({token : data}, function (err, userRecord) {
        if (err) {
          console.log('on user auth find error - ' + err)
          socket.emit('auth failed', err);
        }
        console.log('on user auth find - ' + JSON.stringify(userRecord))
        numUsers++;
        isUserAuth = true;
        username = userRecord.username;
        console.log('on user auth find username - ' + userRecord.username)
        MessageModel.find({}).sort('-date').limit(10).exec(function (err, messages) {
          console.log('on user auth message err - ' + err)
          console.log('on user auth message find - ' + JSON.stringify(messages))
          var messageList = messages.map(function(messageRecord) {
            return {
              text: messageRecord.text,
              sender: messageRecord.sender,
              datetime: messageRecord.datetime,
            };
          });
          console.log('on user auth message find list - ' + JSON.stringify(messageList))
          socket.emit('auth success', {
            numUsers: numUsers,
            messageList: messageList,
          });
        });
        socket.broadcast.emit('user joined', {
          username: username,
          numUsers: numUsers
        });
      });
    }
  });

  socket.on('disconnect', function () {
    console.log('on disconnect')
    if (isUserAuth) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: username,
        numUsers: numUsers
      });
    }
  });

  socket.on('new message', function (data) {
    console.log('on new message - ' + JSON.stringify(data))
    var message = new MessageModel(
    {
      sender: username,
      text: data,
    });
    message.save(function(err){
      if (err) {
        socket.broadcast.emit('new message failed');
      } else {
        socket.broadcast.emit('new message', {
          text: message.text,
          sender: username,
          datetime: message.datetime,
        });
        socket.emit('new message success', {
          sender: message.username,
          text: message.text,
          datetime: message.datetime,
        });
      }
    });
  });

});