const config = require("./config.js");
const log = require('./modules/log.js');
const certificationHandler = require('./modules/certification.js');
const mysqlHandler = require('./modules/mysql.js');
const crp = require('./modules/crypto.js');
const fun = require('./modules/fun.js');
const fileUploadHandler = require('./modules/fileUpload');

const path = require('path');
const fs = require('fs');
const bodyParser = require("body-parser");
const express = require("express");
const cors = require('cors');
const options = {
    key: config.ssl.ssl === true ? fs.readFileSync(`./ssl/${config.ssl.key}`) : "",
    cert: config.ssl.ssl === true ? fs.readFileSync(`./ssl/${config.ssl.cert}`) : "",
    ca: config.ssl.ssl === true ? fs.readFileSync(`./ssl/${config.ssl.ca}`) : "",
    minVersion: "TLSv1.2"
};
const app = express();
const Server = config.ssl.ssl === true ? require('https').createServer(options, app) : require('http').createServer(app);
const io = require('socket.io')(Server, {
    pingTimeout: 10000,
    cors: {
        origin: config.cors.domain,
        methods: ["GET", "POST"]
    }
});
app.use('/image', express.static(path.join(__dirname, 'data/image')));
app.use('/file', express.static(path.join(__dirname, 'data/uploads')));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cors({
    origin: config.cors.domain
}));

/* ============================================= */
app.post("/upload", fileUploadHandler.uploadMiddleware); //파일 업로드

app.post('/chkConnect', (req, res) => { //socket 연결 정의
    const host = req.get('host');

    res.json({
        result: true,
        sslType: config.ssl.ssl,
        serverDomain: host
    });
});
app.post('/getindex', (req, res) => { //스켈레톤 데이터
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.chkUser(promiseRes.userData).then(dbRes => {
                if (dbRes.result) {
                    mysqlHandler.get_roomlistPage(promiseRes.userData).then(dbRes_2 => {
                        mysqlHandler.get_badgeFriend(promiseRes.userData, dbRes_2).then(dbRes_3 => {
                            res.json(dbRes_3);
                        });
                    });
                } else {
                    res.json(dbRes);
                }
            });
        } else {
            res.json(promiseRes);
        }
    });
});
/* =================페이지 데이터================== */
app.post('/get/page/list', (req, res) => { //친구 목록
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.get_listPage(promiseRes.userData).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/get/page/friend', (req, res) => { //친구 요청
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.get_friendPage(promiseRes.userData).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/get/page/setting', (req, res) => { //설정
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.get_settingPage(promiseRes.userData).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/get/page/roomlist', (req, res) => { //1:1,group 대화방 리스트
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.get_roomlistPage(promiseRes.userData).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/get/page/chatview', (req, res) => { //대화방 View
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.get_chatviewPage(promiseRes.userData, req.body.roomId, req.body.msgId).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
/* ============================================= */
app.post('/friend/search', (req, res) => { //친구 요청 검색
    mysqlHandler.friend_search(req.body).then(dbRes => {
        res.json(dbRes);
    });
});
app.post('/friend/cancle', (req, res) => { //친구 요청 취소
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.friend_cancle(req.body, promiseRes.userData).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/friend/accept', (req, res) => { //친구 요청 수락
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.friend_accept(req.body, promiseRes.userData).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/set/chatview/unread', (req, res) => { //읽은 메시지 업데이트
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.set_unread(promiseRes.userData, req.body).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/chg/setting/sm', (req, res) => { //상태메시지 변경
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.chg_sm(promiseRes.userData, req.body.sm).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/chg/setting/lockmode', (req, res) => { //잠금모드 설정
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.chg_lockmode(promiseRes.userData, req.body.pass).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/get/setting/savemsg', (req, res) => { //메시지 저장
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.get_savemsg(promiseRes.userData).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/get/connect/user', (req, res) => { //채팅방 유저 정보
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.connectUser(promiseRes.userData, req.body.roomId).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/chk/lockmode', (req, res) => { //잠금모드 비밀번호 체크
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.chk_lockmode(promiseRes.userData, req.body.pass).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/chg/chatmenu/favorits', (req, res) => { //채팅방 메뉴 -> 즐겨찾기
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.chg_favorits(promiseRes.userData, req.body.roomId).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/del/chatmenu/msgdel', (req, res) => { //채팅방 메뉴 -> 메시지 삭제
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.del_msgdel(promiseRes.userData, req.body).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/get/chatmenu/invite', (req, res) => { //채팅방 메뉴 -> 초대
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.get_inviteUsers(promiseRes.userData, req.body.cid).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/set/chatmenu/invite', (req, res) => { //채팅방 메뉴 -> 초대
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.set_inviteUsers(promiseRes.userData, req.body.cid, req.body.inviteData).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/out/chatmenu/room', (req, res) => { //채팅방 메뉴 -> 채팅방 나가기
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.out_room(promiseRes.userData, req.body.cid).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/del/rmenu/msg', (req, res) => { //우클릭 -> 메시지 삭제
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.delMsg_r(promiseRes.userData, req.body).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
app.post('/req/rmenu/friend', (req, res) => { //우클릭 -> 친구 요청
    certificationHandler.chkData(req.get('UserData')).then(promiseRes => {
        if (promiseRes.result) {
            mysqlHandler.reqFriend(promiseRes.userData, req.body.userId).then(dbRes => {
                res.json(dbRes);
            });
        } else {
            res.json(promiseRes);
        }
    });
});
/* ============================================= */
io.on('connection', (socket) => {
    certificationHandler.chkData(socket.handshake.query.hash).then(promiseRes => {
        if (promiseRes.result) {
            socket.userData = promiseRes.userData;
            mysqlHandler.socket_getRoomData(promiseRes.userData).then(dbRes => {
                if (dbRes.result) {
                    for (let i = 0; i < dbRes.list.length; i++) {
                        socket.join(`fixed_${dbRes.list[i].roomId}`);
                    }
                } else {
                    socket.emit("error", dbRes.msg);
                    socket.disconnect();
                }
            });

            socket.on("otherUser_join_room", (data) => {
                for (const value of data.userId) {
                    fun.findSocketUser(io, value).then(promiseRes => {
                        for (const v of promiseRes) {
                            socket.to(v.socketId).emit("join_room_req", data.roomId);
                        }
                    });
                }

            });
            socket.on("join_room_res", (roomId) => {
                const c_roomId = crp.decrypto(roomId);
                if (c_roomId.result) {
                    const roomId = c_roomId.data.split("_");

                    socket.join(`fixed_${roomId[1]}`);
                    socket.join(`room_${roomId[1]}`);
                }
            });
            socket.on("room_management", (roomId) => {
                const rooms = Array.from(socket.rooms);
                if (roomId) {
                    const c_roomId = crp.decrypto(roomId);
                    if (c_roomId.result) {
                        const roomId = c_roomId.data.split("_");
                        rooms.forEach((room) => {
                            if (room !== socket.id && !room.startsWith('fixed_')) {
                                socket.leave(room);
                            }

                            if (room === `fixed_${roomId[1]}`) {
                                socket.leave(room);
                            }
                        });
                        socket.join(`fixed_${roomId[1]}`);
                        socket.join(`room_${roomId[1]}`);
                    } else {
                        socket.emit("error", c_roomId.msg);
                    }
                }
            });
            socket.on("req_chatMsg", (data) => {
                if (data.msg) {
                    mysqlHandler.socket_saveMsg(promiseRes.userData, data).then(dbRes => {
                        if (dbRes.result) {
                            dbRes.msgData.msgType = "";
                            socket.broadcast.to(`fixed_${dbRes.msgData.roomId}`).emit('res_chatMsg', dbRes.msgData);
                            dbRes.msgData.type = "mine";
                            socket.emit("res_chatMsg", dbRes.msgData);
                        } else {
                            socket.emit("error", dbRes.msg);
                        }
                    });
                } else {
                    socket.emit("error", "메시지를 입력해주세요")
                }
            });
            socket.on("req_fileMsg", (data) => {
                data.msgData.msgType = "file";
                socket.broadcast.to(`fixed_${data.msgData.roomId}`).emit('res_chatMsg', data.msgData);
                data.msgData.type = "mine";
                socket.emit("res_chatMsg", data.msgData);
            });

            socket.on("request_friend", (data) => {
                if (data.cid) {
                    mysqlHandler.friend_request(data, promiseRes.userData).then(dbRes => {
                        if (dbRes.result) {
                            socket.emit("res_friend_request", dbRes.clientData);
                            dbRes.clientData.type = "other"
                            fun.findSocketUser(io, dbRes.otherId).then(socket_res => {
                                for (let i = 0; i < socket_res.length; i++) {
                                    io.to(socket_res[i].socketId).emit('res_friend_request', dbRes.clientData);
                                }
                            });
                        } else {
                            socket.emit("error", dbRes.msg);
                        }
                    });
                }
            });

            socket.on("chatroom_update", (roomData) => {
                io.to(`fixed_${roomData.id}`).emit("chatroom_update_res", roomData);
            });

            socket.on("req_rmenufriend", (c_userId) => {
                const userId = crp.decrypto(c_userId);
                if (userId.result) {
                    const userData = [{
                        userNick: promiseRes.userData.userNick,
                        userProfile: fun.getProfileImg(promiseRes.userData.userId),
                        userSid: crp.encrypto(promiseRes.userData.userId).data
                    }];

                    fun.findSocketUser(io, userId.data).then(socket_res => {
                        for (let i = 0; i < socket_res.length; i++) {
                            io.to(socket_res[i].socketId).emit('res_friend_request', {
                                list_2: userData
                            });
                        }
                    });
                }
            });

        } else {
            socket.disconnect();
        }
    });
});
/* ============================================= */

Server.listen(config.port.port, () => {
    log.connect(`Chatting Plugin Server Start! (port: ${config.port.port})`);
});