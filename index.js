const { log } = require('console');
const express = require('express')
const app = express()
const http = require('http').createServer(app);
const io = require('socket.io')(http, { origins: '*:*'});
const port = 3001
const stompit = require("stompit")

const stompitConnectOptions = {
  'host': 'localhost',
  'port': 61616
}
const stompitHeaders = {'destination':'nodeToSpringBoot'}

function currentRoom(rooms, msg) {
  return rooms.find((room) => room.user1.id === msg.id || room.user2.id === msg.id)
}

let rooms = []

io.on('connection', (socket) => {
  let newId

  let cartLists = [{
    id: 1,
    energy: 3,
    currentEnergy: 3,
    hp: 100,
    currentHp: 100,
    defence: 15,
    attack: 20,
    price: 100,
    description: 'test',
    cardReference: {
      name: 'Pikachu',
      imgUrl: 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/025.png'
    }
  }
  ]

  if((typeof rooms[rooms.length - 1] !== 'undefined') &&  (typeof rooms[rooms.length - 1].user2.id === 'undefined')) {
    newId = rooms[rooms.length - 1].id
    rooms[rooms.length - 1].user2 = { id: socket.id, cards: cartLists }
    rooms[rooms.length - 1].current = 'user1'
  } else {
    newId = rooms.length + 1
    rooms.push({id: newId, current: '', user1: { id: socket.id, cards: cartLists }, user2: {}, chat: []})
  }
  socket.join('room' + newId);

  setTimeout(() => {
    io.to('room' + newId).emit('setRoom', rooms[rooms.length - 1])
  }, 100)

  console.log(newId)
  console.log(rooms)

  socket.on('endTurn', (msg) => {
    room = currentRoom(rooms, msg)
    room[room.current].cards.forEach((card) => card.currentEnergy = card.energy)
    room.current = room.current === 'user1' ? 'user2' : 'user1'
    io.to('room' + room.id).emit('setRoom', room)
  });

  socket.on('setCards', (msg) => {
    room = currentRoom(rooms, msg)
    console.log(msg)
    room[room.user1.id === msg.id ? 'user1' : 'user2'].cards = msg.cards
    io.to('room' + room.id).emit('setRoom', room)
  });

  socket.on('setUser', (msg) => {
    room = currentRoom(rooms, msg)
    console.log(msg)
    room[room.user1.id === msg.id ? 'user1' : 'user2'].userId = msg.user
    io.to('room' + room.id).emit('setRoom', room)
  });

  socket.on('attack', (msg) => {
    room = currentRoom(rooms, msg)
    let from = room[room.current].cards.find((card) => card.id === msg.from)
    let to = room[room.current === 'user1' ? 'user2' : 'user1'].cards.find((card) => card.id === msg.to)

    to.currentHp -= from.attack + to.defence
    from.currentEnergy -= 1

    if(to.currentHp <= 0) {
      room[room.current === 'user1' ? 'user2' : 'user1'].cards.splice(room[room.current === 'user1' ? 'user2' : 'user1'].cards.findIndex((card) => card.id === to.id), 1)
    }

    io.to('room' + room.id).emit('setRoom', room)

    const array = ['user1', 'user2']

    array.forEach((user) => {
      if (room[user].cards.length === 0) {
        io.to('room' + room.id).emit('end', user === 'user1' ? 'user2' : 'user1')
        try{
          stompSend(JSON.stringify({winner: room[user === 'user1' ? 'user2' : 'user1'].userId,loser: room[user].userId,chat: room.chat}))
        }catch(e){
          console.error(e);
        }
      }
    })
  });

  socket.on('chatMessage', (msg) => {
    console.log(msg);
    room = currentRoom(rooms, msg)
    room.chat.push({username: msg.username, message: msg.message})
    io.to('room' + room.id).emit('chatMessage', msg);
  });
});

function stompSend (stringMsg) {

  return new Promise((resolve, reject) => {
    stompit.connect(
      stompitConnectOptions, (error, client) => {
        if (error) {
          reject(e)
        }
        console.log(stringMsg)
        const frame = client.send(stompitHeaders)
        frame.write(stringMsg)
        frame.end()
        client.disconnect()
        resolve(true)
      });
  })
  
}


http.listen(port)
