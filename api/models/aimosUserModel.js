'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: {
    type: String,
    Required: 'Username is required',
    unique: true,
  },
  firstName : String,
  lastName : String,
  token: {
    type: String,
    default: ""
  },
  isAdmin: Boolean,
  passwordHash : String,
  createdDate: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model('User', UserSchema, "User");