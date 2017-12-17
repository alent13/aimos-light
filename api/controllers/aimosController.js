'use strict';

var bcrypt = require('bcrypt');
const saltRounds = 10;
var mongoose = require('mongoose'),
User = mongoose.model('User'),
Message = mongoose.model('Message');

exports.user_auth = function(req, res) {
  if (!req.body.username) {
    res.send('Username required')
  }
  if (!req.body.password) {
    res.send('Password required')
  }
  User.find({username : req.body.username}, function (err, docs) {
    if (err) {
      res.send(err);
    }
    if (docs.length){
      bcrypt.compare(req.body.password, docs[0].passwordHash, function(err, isPasswordCorrect) {
        if (isPasswordCorrect == true) {
          var user = {
            username: docs[0].username,
            firstName: docs[0].firstName,
            lastName: docs[0].lastName,
          }
          res.send(user)
        } else {
          res.send("Password is not correct")
        }
      });
    }else{
      res.send('Username does not exist');
    }
  });
};

exports.user_registration = function(req, res) {
  if (!req.body.username) {
    res.send('Username required')
  }
  if (!req.body.password) {
    res.send('Password required')
  }

  User.find({username : req.body.username}, function (err, docs) {
    if (err) {
      res.send(err);
    }
    if (docs.length){
      res.send('Username already exists');
    }else{
      bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        var newUser = new User(
        {
          username: req.body.username, 
          passwordHash: hash,
          firstName : req.body.firstName,
          lastName : req.body.lastName,
        });
        newUser.save(function(err){
          if (err) {
            res.send(err);
          } else {
            delete newUser['passwordHash']
            var user = {
              username: newUser.username,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
            }
            res.json(user);
          }
        });
      });
    }
  });
};

exports.message_get = function(req, res) {

};

exports.message_remove = function(req, res) {

};
