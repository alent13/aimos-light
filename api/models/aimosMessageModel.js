'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
  sender : String,
  text : String,
  time: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model('Message', MessageSchema, "Message");