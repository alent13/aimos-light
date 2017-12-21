'use strict';
var path = require('path');

module.exports = function(app) {
	var aimos = require('../controllers/aimosController');

	app.route('/helloworld')
	.get(function(req, res) {
		var html = '<!DOCTYPE html><html><body><h1>Hello, World!</h1></body></html>';

		res.writeHead(200, {
			'Content-Type': 'text/html',
			'Content-Length': html.length,
			'Expires': new Date().toUTCString()
		});
		res.end(html);
	});

	// user Routes
	app.route('/user/auth')
	.post(aimos.user_auth);

	app.route('/user')
	.post(aimos.user_registration);

	// message Routes
	app.route('/message/:messageId')
	.get(aimos.message_get)
	.delete(aimos.message_remove);

	app.route('/chat').get(function(req, res){
		res.sendFile(path.resolve('./public/chat.html'));
	});
};
