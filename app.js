const express = require('express')
const app = express()
const http = require('http')
const path = require('path')
const getRoutes = require('./routes/getRoutes')
const server = http.createServer(app)
const { Server } = require("socket.io")
const {v4} = require("uuid")  
const { connect } = require('http2')

const io = new Server(server)
const data = []

app.use(express.json())

app.set('view engine', 'ejs')
app.use('/bootstrap', express.static(path.join(__dirname, "node_modules", "bootstrap", "dist")))
app.use('/peerjs', express.static(path.join(__dirname, "node_modules", "peerjs", "dist")))
app.use('/socket', express.static(path.join(__dirname, "node_modules", "socket.io", "client-dist")))
app.use('/', express.static(path.join(__dirname, "public")))

server.listen(5000, () => console.log(`server running`))

app.use(getRoutes.path, getRoutes.router)

io.on('connection', (socket) => {
    let user = data.find(e=> e.socket_id == socket.id)
    if(!user){
        const id = v4()
        user = {
            id: id,
            socket_id: socket.id
        }
        data.push(user)
        socket.emit ('forConnection', id)
    }
    socket.on('peer', id => {
        let userIndex = data.findIndex(e => e.socket_id == socket.id)
        data[userIndex]["peer_id"] = id
        user = data[userIndex]
    })

    socket.on('call', id => {
        if(id == user.id){
            socket.emit('error', 'you can not call yourself')
        }else if(data.findIndex(e => e.id == id) == -1 ){
            socket.emit('error', `there is no person with this ${id} `)
        }else {
            let friendId = data.find(e => e.id == id)
            let user = data.find(e => e.socket_id = socket.id)
            socket.to(friendId.socket_id).emit('call', user.peer_id) 
        }
    })


    socket.on('disconnect', event => {
        let d = data.findIndex(e => e.socket_id == socket.id)
        if(d > -1){
            data.splice(d , 1)
        }
    })
} )