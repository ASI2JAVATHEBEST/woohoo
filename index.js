const express = require('express')
const app = express()
const http = require('http').createServer(app);
const io = require('socket.io')(http, { origins: '*:*'});
const port = 3001

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('chatMessage', (msg) => {
    io.emit('chatMessage', msg);
  });
});

http.listen(port)
