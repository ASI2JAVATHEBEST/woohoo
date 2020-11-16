const express = require('express')
const app = express()
const http = require('http').createServer(app);
const io = require('socket.io')(http, { origins: '*:*'});
const port = 3001

function currentRoom(rooms, msg) {
  return rooms.find((room) => room.user1.id === msg.id || room.user2.id === msg.id)
}

let rooms = []

io.on('connection', (socket) => {
  let newId

  let cartLists = [{
    id: 1,
    name: 'Pikachu',
    image: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/025.png',
    energy: 40,
    currentEnergy: 100,
    hp: 100,
    currentHp: 100,
    defence: 20,
    attack: 10,
    price: 100,
    description: 'test',
  },
    {
      id: 2,
      name: 'Dracaufeu',
      image: 'https://www.pokepedia.fr/images/thumb/1/17/Dracaufeu-RFVF.png/1200px-Dracaufeu-RFVF.png',
      energy: 40,
      currentEnergy: 100,
      hp: 200,
      currentHp: 100,
      defence: 20,
      attack: 10,
      price: 50,
      description: 'test',
    }
  ]

  if((typeof rooms[rooms.length - 1] !== 'undefined') &&  (typeof rooms[rooms.length - 1].user2.id === 'undefined')) {
    newId = rooms[rooms.length - 1].id
    rooms[rooms.length - 1].user2 = { id: socket.id, cards: cartLists }
    rooms[rooms.length - 1].current = 'user1'
  } else {
    newId = rooms.length + 1
    rooms.push({id: newId, current: '', user1: { id: socket.id, cards: cartLists }, user2: {}})
  }
  socket.join('room' + newId);

  setTimeout(() => {
    io.to('room' + newId).emit('setRoom', rooms[rooms.length - 1])
  }, 100)

  console.log(newId)
  console.log(rooms)

  socket.on('endTurn', (msg) => {
    room = currentRoom(rooms, msg)
    room.current = room.current === 'user1' ? 'user2' : 'user1'
    io.to('room' + newId).emit('setRoom', room)
  });

  socket.on('chatMessage', (msg) => {
    room = currentRoom(rooms, msg)
    io.to('room' + room.id).emit('chatMessage', msg);
  });
});

http.listen(port)
