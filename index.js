const express = require('express')
const app = express()
const io = require('socket.io')(http);
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('chatMessage', (msg) => {
    io.emit('chatMessage', msg);
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
