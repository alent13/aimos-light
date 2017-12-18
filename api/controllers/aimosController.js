'use strict';

var bcrypt = require('bcrypt');
const saltRounds = 10;
var mongoose = require('mongoose'),
User = mongoose.model('User'),
Message = mongoose.model('Message');
const uuidv4 = require('uuid/v4');

/*
  200 - success request

  401 - not enought info
  402 - user already exist
  403 - incorrect password
  404 - user does not exist
  405 - server runtime error
  */

  exports.user_auth = function(req, res) {
    if (!req.body.username) {
      res.status(401);
      res.send('Username required')
    }
    if (!req.body.password) {
      res.status(401);
      res.send('Password required')
    }
    User.findOne({username : req.body.username}, function (err, userRecord) {
      if (err) {
        res.status(405);
        res.send(err);
      }
      if (userRecord){
        bcrypt.compare(req.body.password, userRecord.passwordHash, function(err, isPasswordCorrect) {
          if (isPasswordCorrect == true) {
            userRecord.token = uuidv4();
            userRecord.save(function (err) {
              if(err) {
                res.status(405);
                res.send(err);
              }
              var user = {
                username: userRecord.username,
                firstName: userRecord.firstName,
                lastName: userRecord.lastName,
                token: userRecord.token,
              }
              res.status(200).json(user);
            });
          } else {
            res.status(403);
            res.send("Password is not correct")
          }
        });
      }else{
        res.status(404);
        res.send('Username does not exist');
      }
    });
  };

  exports.user_registration = function(req, res) {
    if (!req.body.username) {
      res.status(401);
      res.send('Username required')
    }
    if (!req.body.password) {
      res.status(401);
      res.send('Password required')
    }

    User.find({username : req.body.username}, function (err, docs) {
      if (err) {
        res.status(405);
        res.send(err);
      }
      if (docs.length){
        res.status(402);
        res.send('Username already exists');
      }else{
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
          var newUser = new User(
          {
            username: req.body.username, 
            passwordHash: hash,
            firstName : req.body.firstName,
            token : uuidv4(),
            lastName : req.body.lastName,
          });
          newUser.save(function(err){
            if (err) {
              res.status(405).send(err);
            } else {
              delete newUser['passwordHash']
              var user = {
                username: newUser.username,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                token: token,
              }
              res.status(200).json(user);
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
