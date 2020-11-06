const express = require('express');
const socketIO = require('socket.io');
const {createServer} = require('http');
const path = require('path');
class server{
    constructor() {
        this.httpServer = null;
        this.app = null;
        this.io = null;
        this.activeSockets = [];
        this.DEFAULT_PORT = 3000;
        this.initialize();
    }

    // 页面初始化
    initialize(){
        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = socketIO(this.httpServer);
        this.configureApp(); // 初始化静态页面
        this.configureRoutes(); // 初始化路由
        this.handleSocketConnection(); // 初始化连接
    }

    // 初始化静态页面
    configureApp(){
        this.app.use(express.static(path.join(__dirname, "../publics")));
    }

    // 初始化路由
    configureRoutes(){
        this.app.get('/', (req, res) => {
            res.sendFile('index.html');
        })
    }

    // socket相关事件
    handleSocketConnection(){
        // 初始化连接
        this.io.on('connection', socket => {
            const existingSocket = this.activeSockets.find(item => {
                return item === socket.id
            })
            if(!existingSocket){
                this.activeSockets.push(socket.id);
                // 更新用户列表
                socket.emit("update-user-list", {
                    users: this.activeSockets.filter(
                        item => item !== socket.id
                    )
                })
                socket.broadcast.emit("update-user-list", {
                    users: this.activeSockets.filter(
                        item => item !== socket.id
                    )
                })
            }

            // 呼叫
            socket.on("call-user", (data) => {
                socket.to(data.to).emit("call-made", {
                    offer: data.offer,
                    socket: socket.id
                })
            })

            // 应答
            socket.on("make-answer", data => {
                socket.to(data.to).emit("answer-made", {
                    socket: socket.id,
                    answer: data.answer
                });
            })

            // 拒绝接听
            socket.on("reject-call", data => {
                socket.to(data.from).emit("call-rejected", {
                    socket: socket.id
                });
            })

            // 没有连线（掉线）
            socket.on('disconnect', () => {
                this.activeSockets = this.activeSockets.filter(
                    item => item !== socket.id
                );
                socket.broadcast.emit("remove-user", {
                    socketId: socket.id
                });
            })
        })
    }

    // 服务启动
    listen(callback){
        this.httpServer.listen(this.DEFAULT_PORT, () => {
            callback(this.DEFAULT_PORT)
        })
    }
}
module.exports = server;
