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

var usersData = {};
var userList = [];
io.on('connection', function (socket) {
  console.log('on connection')

  usersData[socket.id] = {username: "", isUserAuth: false, isAdmin: false};

  socket.isUserAuth = false;

  userList = Object.keys(usersData).map(function(key, index) {
    return usersData[key]['username'];
  });

  socket.on('user auth', function (data) {
    console.log('on user auth - ' + JSON.stringify(data))
    if (socket.isUserAuth) {
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
        if (userRecord) {
          numUsers++;
          socket.isUserAuth = true;
          usersData[socket.id].username = userRecord.username;
          usersData[socket.id].isAdmin = userRecord.isAdmin;
          console.log('on user auth find username - ' + userRecord.username)
          console.log('on user auth find set username - ' + usersData[socket.id].username)
          MessageModel.find({}).sort('-date').limit(10).exec(function (err, messages) {
            userList = Object.keys(usersData).map(function(key, index) {
              return usersData[key]['username'];
            });

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
              userList: userList,
            });
            socket.broadcast.emit('user joined', {
              username: usersData[socket.id].username,
              numUsers: numUsers,
              userList: userList,
            });
          });
        }
      });
    }
  });

  socket.on('disconnect', function () {
    console.log('on disconnect')
    if (socket.isUserAuth) {
      var tmpUsername = usersData[socket.id].username;

      delete usersData[socket.id];
      --numUsers;

      userList = Object.keys(usersData).map(function(key, index) {
        return usersData[key]['username'];
      });

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: tmpUsername,
        numUsers: numUsers,
        userList: userList,
      });
    }
  });

  socket.on('new message', function (data) {
    console.log('on new message user - ' + usersData[socket.id].username)
    console.log('on new message - ' + JSON.stringify(data))
    var message = new MessageModel(
    {
      sender: usersData[socket.id].username,
      text: data,
    });
    message.save(function(err){
      if (err) {
        socket.broadcast.emit('new message failed');
      } else {
        socket.broadcast.emit('new message', {
          text: message.text,
          sender: usersData[socket.id].username,
          datetime: message.datetime,
        });
        socket.emit('new message success', {
          sender: message.sender,
          text: message.text,
          datetime: message.datetime,
        });
      }
    });
  });

});