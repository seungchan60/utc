const config = require('../config.js');
const log = require('./log.js');
const crp = require('./crypto.js');
const fun = require('./fun.js');

const mysql = require('mysql').createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.dbname,
    charset: config.db.charset,
    dateStrings: 'date',
    multipleStatements: true
});
mysql.connect(err => {
    if (!err) {
        log.info('Database Connected');
    } else {
        log.err('Database Connect Error!', err);
    }
});

exports.chkUserData = (userData) => { //그누보드와 계정 연동
    return new Promise((res) => {
        const selectQuery = `SELECT mb_no FROM ${config.db.table_prefix}member WHERE mb_id = ${mysql.escape(userData.userId)} AND mb_nick = ${mysql.escape(userData.userNick)} AND mb_level = ${mysql.escape(userData.userLevel)};`;
        mysql.query(selectQuery, (err, rows) => {
            if (!err) {
                if (rows.length > 0) {
                    const selectQuery_2 = `SELECT userSM FROM ${config.db.chat_table_prefix}user WHERE userId = ${mysql.escape(userData.userId)};`;
                    mysql.query(selectQuery_2, (err_2, rows_2) => {
                        if (!err_2) {
                            res({
                                result: true,
                                userNo: rows[0].mb_no,
                                userSM: rows_2.length > 0 ? rows_2[0].userSM : ""
                            });
                        } else {
                            log.err("chkUserData - err_2", err_2);
                            res({
                                result: false,
                                msg: "데이터베이스 오류",
                                replace: "/"
                            });
                        }
                    });
                } else {
                    res({
                        result: false,
                        msg: "데이터 오류",
                        replace: "/"
                    });
                }
            } else {
                log.err("chkUserData - err", err);
                res({
                    result: false,
                    msg: "데이터베이스 오류",
                    replace: "/"
                });
            }
        });
    });
}

exports.chkUser = (userData) => { //채팅 DB에 유저데이터 체크
    return new Promise((res) => {
        const selectQuery = `SELECT userSM FROM ${config.db.chat_table_prefix}user WHERE userId = ${mysql.escape(userData.userId)};`;
        mysql.query(selectQuery, (err, rows) => {
            if (!err) {
                if (rows.length > 0) {
                    res({
                        result: true,
                        userSM: rows[0].userSM
                    });
                } else { //채팅 계정이 없을때 생성
                    const insertQuery = `INSERT INTO ${config.db.chat_table_prefix}user (userId, datetime) VALUES (${mysql.escape(userData.userId)}, now());`;
                    mysql.query(insertQuery, (err_2) => {
                        if (!err_2) {
                            res({
                                result: true,
                                userSM: ""
                            });
                        } else {
                            log.err("chkUser - err_2", err_2);
                            res({
                                result: false,
                                msg: "데이터베이스 오류",
                                replace: "/"
                            });
                        }
                    });
                }
            } else {
                log.err("chkUser - err", err);
                res({
                    result: false,
                    msg: "데이터베이스 오류",
                    replace: "/"
                });
            }
        });
    });
}

exports.get_listPage = (userData) => {
    return new Promise((res) => {
        const selectQuery = `
        WITH FriendData AS (
            SELECT
                fl.*,
                m.mb_id AS opposite_id,
                m.mb_nick AS opposite_nick,
                u.userSM AS opposite_sm
            FROM
                ${config.db.chat_table_prefix}friend_list fl
            JOIN
                ${config.db.table_prefix}member m
            ON
                m.mb_id = CASE
                    WHEN fl.req_userId = ? THEN fl.res_userId
                    ELSE fl.req_userId
                END
            JOIN
                ${config.db.chat_table_prefix}user u
            ON
                u.userId = m.mb_id
            WHERE
                (fl.req_userId = ? OR fl.res_userId = ?)
                AND fl.isAccept = 1
        ),
        RoomData AS (
            SELECT
                jru.roomId,
                CAST(JSON_EXTRACT(jru.roomData, '$.isFavorites') AS UNSIGNED) AS isFavorites,
                CAST(JSON_EXTRACT(jru.roomData, '$.isHide') AS UNSIGNED) AS isRoomHide,
                CAST(JSON_EXTRACT(jru.roomData, '$.isBlock') AS UNSIGNED) AS isRoomBlock
            FROM
                ${config.db.chat_table_prefix}join_room_user jru
            WHERE
                jru.userId = ?
        )
        SELECT
            fd.req_userId,
            fd.res_userId,
            fd.isAccept,
            fd.isblock,
            fd.ishide,
            fd.roomId,
            fd.datetime,
            fd.opposite_id,
            fd.opposite_nick,
            fd.opposite_sm,
            COALESCE(rd.isFavorites, 0) AS isFavorites,
            COALESCE(rd.isRoomHide, 0) AS isRoomHide,
            COALESCE(rd.isRoomBlock, 0) AS isRoomBlock
        FROM
            FriendData fd
        LEFT JOIN
            RoomData rd
        ON
            fd.roomId = rd.roomId
        `;

        const queryValues = [userData.userId, userData.userId, userData.userId, userData.userId];


        mysql.query(selectQuery, queryValues, (err, rows) => {
            if (!err) {
                const list = {
                    favorites: [],
                    all: [],
                    hide: [],
                    block: [],
                    myData: {
                        userNick: userData.userNick,
                        userProfile: fun.getProfileImg(userData.userId),
                        userSM: userData.userSM ? userData.userSM : ""
                    }
                }
                for (let i = 0; i < rows.length; i++) {
                    if ((rows[i].isFavorites === 1) && (rows[i].isblock !== userData.userId && rows[i].isblock !== "all") && (rows[i].ishide !== userData.userId && rows[i].ishide !== "all")) {
                        list.favorites.push({
                            roomId: crp.encrypto(`user_${rows[i].opposite_id}`).data,
                            userNick: rows[i].opposite_nick,
                            userProfile: fun.getProfileImg(rows[i].opposite_id),
                            userSM: rows[i].opposite_sm ? rows[i].opposite_sm : ""
                        });
                    }
                    if ((rows[i].isblock !== userData.userId && rows[i].isblock !== "all") && (rows[i].ishide !== userData.userId && rows[i].ishide !== "all")) {
                        list.all.push({
                            roomId: crp.encrypto(`user_${rows[i].opposite_id}`).data,
                            userNick: rows[i].opposite_nick,
                            userProfile: fun.getProfileImg(rows[i].opposite_id),
                            userSM: rows[i].opposite_sm ? rows[i].opposite_sm : ""
                        });
                    }
                    if ((rows[i].isblock === userData.userId || rows[i].isblock === "all")) {
                        list.block.push({
                            roomId: crp.encrypto(`user_${rows[i].opposite_id}`).data,
                            userNick: rows[i].opposite_nick,
                            userProfile: fun.getProfileImg(rows[i].opposite_id),
                            userSM: rows[i].opposite_sm ? rows[i].opposite_sm : ""
                        });
                    }
                    if ((rows[i].ishide === userData.userId || rows[i].ishide === "all")) {
                        list.hide.push({
                            roomId: crp.encrypto(`user_${rows[i].opposite_id}`).data,
                            userNick: rows[i].opposite_nick,
                            userProfile: fun.getProfileImg(rows[i].opposite_id),
                            userSM: rows[i].opposite_sm ? rows[i].opposite_sm : ""
                        });
                    }
                }
                res({
                    result: true,
                    list: list
                });
            } else {
                log.err("get_listPage - err", err);
                res({
                    result: false,
                    msg: "데이터베이스 오류"
                });
            }
        });
    });
}

exports.get_friendPage = (userData) => {
    return new Promise((res) => {
        const selectQuery = `
        SELECT
            fl.*,
            m.mb_nick AS opposite_nick
        FROM
            ${config.db.chat_table_prefix}friend_list fl
        JOIN
            ${config.db.table_prefix}member m
        ON
            m.mb_id = CASE
            WHEN fl.req_userId = ? THEN fl.res_userId
            ELSE fl.req_userId
            END
        WHERE
            (fl.req_userId = ? OR fl.res_userId = ?)
        AND fl.isAccept = 0;
        `;
        const queryValues = [userData.userId, userData.userId, userData.userId];

        mysql.query(selectQuery, queryValues, (err, rows) => {
            if (!err) {
                const list = {
                    req: [],
                    res: []
                }
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i].req_userId === userData.userId) {
                        list.req.push({
                            userSid: crp.encrypto(rows[i].res_userId).data,
                            userNick: rows[i].opposite_nick,
                            userProfile: fun.getProfileImg(rows[i].res_userId)
                        });
                    }
                    if (rows[i].res_userId === userData.userId) {
                        list.res.push({
                            userSid: crp.encrypto(rows[i].req_userId).data,
                            userNick: rows[i].opposite_nick,
                            userProfile: fun.getProfileImg(rows[i].req_userId)
                        });
                    }
                }
                res({
                    result: true,
                    list: list
                });
            } else {
                log.err("get_friend - err", err);
                res({
                    result: false,
                    msg: "데이터베이스 오류",
                    replace: "/"
                });
            }
        });
    });
}

exports.get_settingPage = (userData) => {
    return new Promise((res) => {
        const selectQuery = `SELECT * FROM ${config.db.chat_table_prefix}user WHERE userId = ${mysql.escape(userData.userId)};`;
        mysql.query(selectQuery, (err, rows) => {
            if (!err) {
                if (rows.length > 0) {
                    res({
                        result: true,
                        data: {
                            backupCount: rows[0].backup_count,
                            backupDate: rows[0].backup_date,
                            userNick: userData.userNick,
                            userSM: rows[0].userSM
                        }
                    });
                } else {
                    res({
                        result: false,
                        msg: "유저 정보가 없습니다.",
                        replace: "/"
                    });
                }
            } else {
                log.err("get_settingPage - err", err);
                res({
                    result: false,
                    msg: "데이터베이스 오류",
                    replace: "/"
                });
            }
        });
    });
}

exports.get_roomlistPage = (userData) => {
    return new Promise((res) => {
        const selectQuery = `
        WITH FilteredRooms AS ( 
            SELECT
                j.roomId,
                j.userId,
                j.roomData,
                r.roomName,
                r.roomImg,
                r.roomType,
                r.roomUser,
                JSON_UNQUOTE(JSON_EXTRACT(j.roomData, '$.isHide')) AS isHide,
                JSON_UNQUOTE(JSON_EXTRACT(j.roomData, '$.isBlock')) AS isBlock
            FROM
                ${config.db.chat_table_prefix}join_room_user j
            JOIN
                ${config.db.chat_table_prefix}room r ON j.roomId = r.roomId
            WHERE
                j.userId = ${mysql.escape(userData.userId)}
                AND (JSON_UNQUOTE(JSON_EXTRACT(j.roomData, '$.isHide')) = 0)
                AND (JSON_UNQUOTE(JSON_EXTRACT(j.roomData, '$.isBlock')) = 0)
        ),
        
        LatestMessages AS (
            SELECT
                m.roomId,
                m.msg AS latestMsg,
                m.msgData AS latestMsgData,
                m.datetime AS latestDatetime
            FROM
                ${config.db.chat_table_prefix}msg m
            WHERE
                m.isGhost = 0
                AND m.msgId = (
                    SELECT MAX(msgId)
                    FROM ${config.db.chat_table_prefix}msg
                    WHERE roomId = m.roomId
                    AND datetime = (
                        SELECT MAX(datetime)
                        FROM ${config.db.chat_table_prefix}msg
                        WHERE roomId = m.roomId
                        AND isGhost = 0
                    )
                )
        ),
        
        UnreadMessageCounts AS (
            SELECT
                u.roomId,
                COUNT(m.msgId) AS unreadCount
            FROM
                ${config.db.chat_table_prefix}unread_msg u
            JOIN
                ${config.db.chat_table_prefix}msg m ON u.roomId = m.roomId 
                AND m.datetime > (
                    SELECT MAX(datetime)
                    FROM ${config.db.chat_table_prefix}msg
                    WHERE msgId = u.lastMsgId
                )
            WHERE
                u.userId = ${mysql.escape(userData.userId)}
            GROUP BY
                u.roomId
        )
        
        SELECT
            f.roomId,
            f.userId,
            f.roomData,
            f.roomName,
            f.roomImg,
            f.roomType,
            f.roomUser,
            lm.latestMsg,
            lm.latestMsgData,
            lm.latestDatetime,
            COALESCE(uc.unreadCount, 0) AS unreadCount
        FROM
            FilteredRooms f
        LEFT JOIN
            LatestMessages lm ON f.roomId = lm.roomId
        LEFT JOIN
            UnreadMessageCounts uc ON f.roomId = uc.roomId;
        `;

        mysql.query(selectQuery, (err, rows) => {
            if (!err) {
                const roomList = [];
                for (let i = 0; i < rows.length; i++) {
                    const msgData = JSON.parse(rows[i].latestMsgData);
                    if (msgData)
                        if (msgData.msgDelUser.includes(userData.userId)) rows[i].latestMsg = "삭제된 메시지입니다.";

                    let roomName = rows[i].roomName;
                    let roomImg = rows[i].roomImg;
                    if (rows[i].roomType === "private") {
                        if (rows[i].roomName.indexOf(",") !== -1) {
                            const [id1, id2] = rows[i].roomName.split(",");
                            if (id1 === userData.userNick) roomName = id2;
                            else roomName = id1;
                        }
                        if (rows[i].roomImg.indexOf(",") !== -1) {
                            const [img1, img2] = rows[i].roomImg.split(",");
                            if (img1 === fun.getProfileImg(userData.userId)) roomImg = img2;
                            else roomImg = img1;
                        }
                    }

                    roomList.push({
                        roomId_c: crp.encrypto(`${rows[i].roomType}_${rows[i].roomId}`).data,
                        roomId: rows[i].roomId,
                        roomType: rows[i].roomType,
                        roomUser: rows[i].roomUser,
                        recentMsg: rows[i].latestMsg,
                        unreadCount: rows[i].unreadCount,
                        roomName: roomName,
                        roomImg: roomImg,
                        recentMsgDatetime: rows[i].latestDatetime
                    });
                }
                res({
                    result: true,
                    list: roomList
                });
            } else {
                log.err("get_roomlistPage - err", err);
                res({
                    result: false,
                    msg: "데이터베이스 오류"
                });
            }
        });
    });
}

exports.get_badgeFriend = (userData, dbData) => {
    return new Promise((res) => {
        const selectQuery = `SELECT res_userId FROM ${config.db.chat_table_prefix}friend_list WHERE res_userId = ${mysql.escape(userData.userId)} AND isAccept = 0;`;
        mysql.query(selectQuery, (err, rows) => {
            if (!err) {
                if (rows.length > 0) dbData.isFriendBadge = true;
                else dbData.isFriendBadge = false;
                res(dbData);
            } else {
                log.err("get_badgeFriend(user) - err", err);
                res({
                    result: false,
                    msg: "데이터베이스 오류",
                    replace: "/"
                });
            }
        });
    });
}

exports.get_chatviewPage = (userData, croomId, msgId) => {
    return new Promise((res) => {
        const crypto_roomId = crp.decrypto(croomId);
        if (crypto_roomId.result) {
            const [roomType, roomId] = crypto_roomId.data.split("_");
            if (roomType === "user") {
                if (roomId !== userData.userId) {
                    const selectQuery = `SELECT roomId FROM ${config.db.chat_table_prefix}friend_list WHERE (req_userId = ${mysql.escape(roomId)} AND res_userId = ${mysql.escape(userData.userId)}) OR (res_userId = ${mysql.escape(roomId)} AND req_userId = ${mysql.escape(userData.userId)}) AND isAccept = 1;`;
                    mysql.query(selectQuery, (err, rows) => {
                        if (!err) {
                            if (rows.length > 0) {
                                if (rows[0].roomId) {
                                    const selectQuery_2 = `SELECT roomId, roomData FROM ${config.db.chat_table_prefix}join_room_user WHERE roomId = ${mysql.escape(rows[0].roomId)} AND userId = ${mysql.escape(userData.userId)};`;
                                    mysql.query(selectQuery_2, (err_2, rows_2) => {
                                        if (!err) {
                                            if (rows_2.length > 0) {
                                                const roomData = JSON.parse(rows_2[0].roomData);
                                                if (roomData.isBan === 1) {
                                                    res({
                                                        result: false,
                                                        msg: "관리자에 의하여 해당 채팅방에서 차단당하였습니다.",
                                                        replace: "/"
                                                    });
                                                } else if (roomData.isBlock === 1) {
                                                    res({
                                                        result: false,
                                                        msg: "해당 채팅방은 차단한 채팅방입니다.",
                                                        replace: "/"
                                                    });
                                                } else {
                                                    next_getData(rows[0].roomId);
                                                }
                                            } else {
                                                res({
                                                    result: false,
                                                    msg: "알 수 없는 오류",
                                                    replace: "/"
                                                });
                                            }
                                        } else {
                                            log.err("get_chatviewPage(group) - err_2", err_2);
                                            res({
                                                result: false,
                                                msg: "데이터베이스 오류",
                                                replace: "/"
                                            });
                                        }
                                    });
                                } else {
                                    next_create();
                                }
                            } else {
                                next_create();
                            }
                        } else {
                            log.err("get_chatviewPage(user) - err", err);
                            res({
                                result: false,
                                msg: "데이터베이스 오류",
                                replace: "/"
                            });
                        }
                    });
                } else {
                    res({
                        result: false,
                        msg: "올바르지 않은 주소 접근",
                        replace: "/"
                    });
                }
            } else if (roomType === "group" || roomType === "private" || roomType === "open") {
                const selectQuery = `SELECT roomId FROM ${config.db.chat_table_prefix}room WHERE roomId = ${mysql.escape(roomId)};`;
                mysql.query(selectQuery, (err, rows) => {
                    if (!err) {
                        if (rows.length > 0) {
                            const selectQuery_2 = `SELECT roomId, roomData FROM ${config.db.chat_table_prefix}join_room_user WHERE roomId = ${mysql.escape(roomId)} AND userId = ${mysql.escape(userData.userId)};`;
                            mysql.query(selectQuery_2, (err_2, rows_2) => {
                                if (!err) {
                                    if (rows_2.length > 0) {
                                        const roomData = JSON.parse(rows_2[0].roomData);
                                        if (roomData.isBan === 1) {
                                            res({
                                                result: false,
                                                msg: "관리자에 의하여 해당 채팅방에서 차단당하였습니다.",
                                                replace: "/"
                                            });
                                        } else if (roomData.isBlock === 1) {
                                            res({
                                                result: false,
                                                msg: "해당 채팅방은 차단한 채팅방입니다.",
                                                replace: "/"
                                            });
                                        } else {
                                            next_getData(roomId);
                                        }
                                    } else {
                                        if (roomType !== "private" && roomType !== "group") {
                                            next_join(roomType, roomId);
                                        } else {
                                            res({
                                                result: false,
                                                msg: "해당 채팅방은 입장할 수 없습니다.",
                                                replace: "/"
                                            });
                                        }
                                    }
                                } else {
                                    log.err("get_chatviewPage(group) - err_2", err_2);
                                    res({
                                        result: false,
                                        msg: "데이터베이스 오류",
                                        replace: "/"
                                    });
                                }
                            });
                        } else {
                            res({
                                result: false,
                                msg: "해당 방은 존재하지 않습니다.",
                                replace: "/?page=list"
                            });
                        }
                    } else {
                        log.err("get_chatviewPage(group) - err", err);
                        res({
                            result: false,
                            msg: "데이터베이스 오류",
                            replace: "/"
                        });
                    }
                });
            }

            function next_create() {
                const randRoomId = fun.generateRandomString();
                const randMsgId = fun.generateRandomString();
                const jsonData = {
                    mine: {
                        isBan: 0,
                        isHide: 0,
                        isBlock: 0,
                        isFavorites: 0,
                        blockUser: []
                    },
                    other: {
                        isBan: 0,
                        isHide: 1,
                        isBlock: 0,
                        isFavorites: 0,
                        blockUser: []
                    },
                    msgData: {
                        isBlock: 0,
                        msgDelUser: [],
                        readMsgUser: [],
                        hiddenUser: [],
                        isHidden: 0,
                        isFile: false,
                        fileName: "",
                        filePath: "",
                        fileType: "",
                        isSystemMsg: 0
                    }
                }
                const selectQuery = `SELECT mb_nick FROM ${config.db.table_prefix}member WHERE mb_id = ${mysql.escape(roomId)};`;
                mysql.query(selectQuery, (err, rows) => {
                    if (!err) {
                        if (rows.length > 0) {
                            const insertQuery = `
                            INSERT INTO ${config.db.chat_table_prefix}room (roomId, roomType, roomName, roomImg, datetime) VALUES (${mysql.escape(randRoomId)}, ${mysql.escape("private")}, ${mysql.escape(`${userData.userNick},${rows[0].mb_nick}`)}, ${mysql.escape(`${fun.getProfileImg(userData.userId)},${fun.getProfileImg(roomId)}`)}, now());
                            INSERT INTO ${config.db.chat_table_prefix}unread_msg (roomId, userId, lastMsgId) VALUES (${mysql.escape(randRoomId)}, ${mysql.escape(userData.userId)}, ${mysql.escape(randMsgId)});
                            INSERT INTO ${config.db.chat_table_prefix}unread_msg (roomId, userId, lastMsgId) VALUES (${mysql.escape(randRoomId)}, ${mysql.escape(roomId)}, ${mysql.escape(randMsgId)});
                            INSERT INTO ${config.db.chat_table_prefix}join_room_user (roomId, userId, last_connect, roomData) VALUES (${mysql.escape(randRoomId)}, ${mysql.escape(userData.userId)}, now(), ${mysql.escape(JSON.stringify(jsonData.mine))});
                            INSERT INTO ${config.db.chat_table_prefix}join_room_user (roomId, userId, last_connect, roomData) VALUES (${mysql.escape(randRoomId)}, ${mysql.escape(roomId)}, now(), ${mysql.escape(JSON.stringify(jsonData.other))});
                            INSERT INTO ${config.db.chat_table_prefix}msg (roomId, msgId, senderId, msg, msgData, datetime, isGhost) VALUES (${mysql.escape(randRoomId)}, ${mysql.escape(randMsgId)}, ${mysql.escape("%system%")}, ${mysql.escape("")}, ${mysql.escape(JSON.stringify(jsonData.msgData))}, now(), 1);
                            UPDATE ${config.db.chat_table_prefix}friend_list SET roomId = ${mysql.escape(randRoomId)} WHERE (req_userId = ${mysql.escape(roomId)} AND res_userId = ${mysql.escape(userData.userId)}) OR (res_userId = ${mysql.escape(roomId)} AND req_userId = ${mysql.escape(userData.userId)}) AND isAccept = 1;
                            `;
                            mysql.query(insertQuery, (err_2) => {
                                if (!err_2) {
                                    next_getData(randRoomId, roomId);
                                } else {
                                    log.err("get_chatviewPage(next_create) - err_2", err_2);
                                    res({
                                        result: false,
                                        msg: "데이터베이스 오류",
                                        replace: "/"
                                    });
                                }
                            });
                        } else {
                            res({
                                result: false,
                                msg: "상대방 데이터가 존재하지 않습니다.",
                                replace: "/?page=list"
                            });
                        }
                    } else {
                        log.err("get_chatviewPage(next_create) - err", err);
                        res({
                            result: false,
                            msg: "데이터베이스 오류",
                            replace: "/"
                        });
                    }
                });
            }

            function next_join(rt, ri) {
                const jsonData = {
                    isBan: 0,
                    isHide: 0,
                    isBlock: 0,
                    isFavorites: 0,
                    blockUser: []
                }

                const selectQuery = `SELECT roomId FROM ${config.db.chat_table_prefix}room WHERE roomId = ${mysql.escape(ri)} AND roomType = ${mysql.escape(rt)};`;
                mysql.query(selectQuery, (err, rows) => {
                    if (!err) {
                        if (rows.length > 0) {
                            const insertQuery = `
                                INSERT INTO ${config.db.chat_table_prefix}join_room_user (roomId, userId, last_connect, roomData) VALUES (${mysql.escape(ri)}, ${mysql.escape(userData.userId)}, now(), ${mysql.escape(JSON.stringify(jsonData))});
                                INSERT INTO ${config.db.chat_table_prefix}unread_msg (roomId, userId, lastMsgId) VALUES (${mysql.escape(ri)}, ${mysql.escape(userData.userId)}, (SELECT msgId FROM ${config.db.chat_table_prefix}msg WHERE roomId = ${mysql.escape(ri)} ORDER BY datetime DESC LIMIT 1));
                                UPDATE ${config.db.chat_table_prefix}room SET roomUser = roomUser + 1 WHERE roomId = ${mysql.escape(ri)};
                                `;
                            mysql.query(insertQuery, (err_2) => {
                                if (!err_2) {
                                    next_getData(ri);
                                } else {
                                    log.err("get_chatviewPage(next_join) - err_2", err_2);
                                    res({
                                        result: false,
                                        msg: "데이터베이스 오류",
                                        replace: "/"
                                    });
                                }
                            });
                        } else {
                            res({
                                result: false,
                                msg: "해당 방은 존재하지 않습니다.",
                                replace: "/?page=list"
                            });
                        }
                    } else {
                        log.err("get_chatviewPage(next_join) - err", err);
                        res({
                            result: false,
                            msg: "데이터베이스 오류",
                            replace: "/"
                        });
                    }
                });
            }

            function next_getData(ri, otherId) {

                const selectQuery = `SELECT * FROM ${config.db.chat_table_prefix}room WHERE roomId = ${mysql.escape(ri)};`;
                mysql.query(selectQuery, (err, rows) => {
                    if (!err) {
                        if (rows.length > 0) {
                            const limit = 50;
                            let selectQuery_2 = "";

                            const updateQuery = `
                            UPDATE ${config.db.chat_table_prefix}unread_msg
                            SET lastMsgId = (
                                SELECT msgId
                                FROM ${config.db.chat_table_prefix}msg
                                WHERE roomId = ${mysql.escape(ri)}
                                ORDER BY datetime DESC
                                LIMIT 1
                            )
                            WHERE roomId = ${mysql.escape(ri)} AND userId = ${mysql.escape(userData.userId)};
                            `;
                            mysql.query(updateQuery, (err_3) => {
                                if (!err_3) {
                                    if (msgId) {
                                        selectQuery_2 = `
                                        SELECT ${config.db.chat_table_prefix}msg.*, ${config.db.table_prefix}member.mb_nick AS other_nick
                                        FROM ${config.db.chat_table_prefix}msg
                                        JOIN ${config.db.table_prefix}member
                                            ON ${config.db.chat_table_prefix}msg.senderId = ${config.db.table_prefix}member.mb_id
                                        WHERE 
                                            roomId = ${mysql.escape(ri)}
                                            AND ${config.db.chat_table_prefix}msg.isGhost = 0
                                            AND ${config.db.chat_table_prefix}msg.datetime < (
                                                SELECT datetime
                                                FROM ${config.db.chat_table_prefix}msg
                                                WHERE msgId = ${mysql.escape(msgId)}
                                            )
                                        ORDER BY ${config.db.chat_table_prefix}msg.datetime DESC
                                        LIMIT 50;
                                        `;
                                    } else {
                                        selectQuery_2 = `
                                        SELECT ${config.db.chat_table_prefix}msg.*, ${config.db.table_prefix}member.mb_nick AS other_nick
                                        FROM ${config.db.chat_table_prefix}msg
                                        JOIN ${config.db.table_prefix}member
                                            ON ${config.db.chat_table_prefix}msg.senderId = ${config.db.table_prefix}member.mb_id
                                        WHERE 
                                            roomId = ${mysql.escape(ri)}
                                            AND ${config.db.chat_table_prefix}msg.isGhost = 0
                                        ORDER BY ${config.db.chat_table_prefix}msg.datetime DESC
                                        LIMIT ${limit};
                                        `;
                                    }

                                    mysql.query(selectQuery_2, (err_2, rows_2) => {
                                        if (!err_2) {
                                            let msgList = [];
                                            let roomName = rows[0].roomName;
                                            let roomImg = rows[0].roomImg;
                                            if (rows[0].roomType === "private") {
                                                if (rows[0].roomName.indexOf(",") !== -1) {
                                                    const [id1, id2] = rows[0].roomName.split(",");
                                                    if (id1 === userData.userNick) roomName = id2;
                                                    else roomName = id1;
                                                }
                                                if (rows[0].roomImg.indexOf(",") !== -1) {
                                                    const [img1, img2] = rows[0].roomImg.split(",");
                                                    if (img1 === fun.getProfileImg(userData.userId)) roomImg = img2;
                                                    else roomImg = img1;
                                                }
                                            }

                                            for (let i = 0; i < rows_2.length; i++) {
                                                const roomData = JSON.parse(rows_2[i].msgData);

                                                if (!roomData.hiddenUser.includes(userData.userId)) {
                                                    msgList.push({
                                                        roomId: rows[0].roomId,
                                                        msgId: rows_2[i].msgId,
                                                        msg: roomData.msgDelUser.includes(userData.userId) ? "삭제된 메시지입니다." : rows_2[i].msg,
                                                        datetime: rows_2[i].datetime,
                                                        type: rows_2[i].senderId === userData.userId ? "mine" : "other",
                                                        msgType: roomData.isFile === true ? "file" : "",
                                                        fileData: {
                                                            filePath: roomData.filePath,
                                                            fileType: roomData.fileType,
                                                            fileName: roomData.fileName
                                                        },
                                                        sender: {
                                                            senderId: crp.encrypto(rows_2[i].senderId).data,
                                                            senderNick: rows_2[i].other_nick,
                                                            senderProfile: fun.getProfileImg(rows_2[i].senderId)
                                                        },
                                                        isNotice: roomData.isSystemMsg
                                                    });
                                                }
                                            }

                                            res({
                                                result: true,
                                                roomData: {
                                                    roomId_crypto: crp.encrypto(`${rows[0].roomType}_${rows[0].roomId}`).data,
                                                    roomId: rows[0].roomId,
                                                    roomType: rows[0].roomType,
                                                    roomName: roomName,
                                                    roomImg: roomImg,
                                                    roomUser: rows[0].roomUser
                                                },
                                                msgList: msgList,
                                                otherId: otherId
                                            });
                                        } else {
                                            log.err("get_chatviewPage(next_getData) - err_2", err_2);
                                            res({
                                                result: false,
                                                msg: "데이터베이스 오류",
                                                replace: "/"
                                            });
                                        }
                                    });
                                } else {
                                    log.err("get_chatviewPage(next_getData) - err_3", err_3);
                                    res({
                                        result: false,
                                        msg: "데이터베이스 오류",
                                        replace: "/"
                                    });
                                }
                            });
                        } else {
                            res({
                                result: false,
                                msg: "해당 방은 존재하지 않습니다.",
                                replace: "/?page=list"
                            });
                        }
                    } else {
                        log.err("get_chatviewPage(next_getData) - err", err);
                        res({
                            result: false,
                            msg: "데이터베이스 오류",
                            replace: "/"
                        });
                    }
                });
            }

        } else {
            res({
                result: false,
                msg: crypto_roomId.msg
            });
        }
    });
}

exports.friend_search = (data) => {
    return new Promise((res) => {
        if (data.text) {
            const selectQuery = `SELECT mb_id, mb_nick FROM ${config.db.table_prefix}member WHERE mb_nick LIKE ${mysql.escape('%' + data.text + '%')};`;
            mysql.query(selectQuery, (err, rows) => {
                if (!err) {
                    let userList = [];
                    for (let i = 0; i < rows.length; i++) {
                        userList.push({
                            userSid: crp.encrypto(rows[i].mb_id).data,
                            userNick: rows[i].mb_nick,
                            userProfile: fun.getProfileImg(rows[i].mb_id)
                        });
                    }
                    res({
                        result: true,
                        list: userList
                    });
                } else {
                    log.err("friend_search - err", err);
                    res({
                        result: false,
                        msg: "데이터베이스 오류"
                    });
                }
            });
        } else {
            res({
                result: false,
                msg: "검색할 닉네임을 입력해주세요"
            });
        }
    });
}

exports.friend_request = (data, userData) => {
    return new Promise((res) => {
        const otherId = crp.decrypto(data.cid);
        if (otherId.result) {
            if (otherId.data !== userData.userId) {
                const selectQuery = `SELECT isAccept, isBlock FROM ${config.db.chat_table_prefix}friend_list WHERE (req_userId = ${mysql.escape(otherId.data)} AND res_userId = ${mysql.escape(userData.userId)}) OR (res_userId = ${mysql.escape(otherId.data)} AND req_userId = ${mysql.escape(userData.userId)});`;
                mysql.query(selectQuery, (err, rows) => {
                    if (!err) {
                        if (rows.length <= 0) {
                            const insertQuery = `INSERT INTO ${config.db.chat_table_prefix}friend_list (req_userId, res_userId, datetime) VALUES (${mysql.escape(userData.userId)}, ${mysql.escape(otherId.data)}, now());`;
                            mysql.query(insertQuery, (err_2) => {
                                if (!err_2) {
                                    const selectQuery_2 = `SELECT mb_id, mb_nick FROM ${config.db.table_prefix}member WHERE mb_id = ${mysql.escape(otherId.data)};`;
                                    mysql.query(selectQuery_2, (err_3, rows_3) => {
                                        if (!err_3) {
                                            if (rows_3.length > 0) {
                                                const selectQuery_3 = `SELECT userId FROM ${config.db.chat_table_prefix}user WHERE userId = ${mysql.escape(otherId.data)};`;
                                                mysql.query(selectQuery_3, (err_4, rows_4) => { //FIXME: 해당 예외처리시 INSERT쿼리가 실행된 후 예외처리 됨 -> INSERT 전으로 수정!
                                                    if (!err_4) {
                                                        if (rows_4.length > 0) {
                                                            res({
                                                                result: true,
                                                                clientData: {
                                                                    result: true,
                                                                    type: "mine",
                                                                    msg: `"${rows_3[0].mb_nick}"님에게 친구 요청을 보냈습니다.`,
                                                                    list_1: [{
                                                                        userNick: rows_3[0].mb_nick,
                                                                        userProfile: fun.getProfileImg(otherId.data),
                                                                        userSid: crp.encrypto(otherId.data).data
                                                                    }],
                                                                    list_2: [{
                                                                        userNick: userData.userNick,
                                                                        userProfile: fun.getProfileImg(userData.userId),
                                                                        userSid: crp.encrypto(userData.userId).data
                                                                    }]
                                                                },
                                                                otherId: otherId.data
                                                            });
                                                        } else {
                                                            res({
                                                                result: false,
                                                                msg: `"${rows_3[0].mb_nick}"님은 채팅 계정이 존재하지 않아 친구 요청이 불가능합니다.\n(한번이라도 접속한 유저에게만 친구 요청이 가능합니다.)`
                                                            });
                                                        }
                                                    } else {
                                                        log.err("friend_request - err_4", err_4);
                                                        res({
                                                            result: false,
                                                            msg: "데이터베이스 오류"
                                                        });
                                                    }
                                                });
                                            } else {
                                                res({
                                                    result: false,
                                                    msg: "회원데이터가 존재하지 않습니다."
                                                });
                                            }
                                        } else {
                                            log.err("friend_request - err_3", err_3);
                                            res({
                                                result: false,
                                                msg: "데이터베이스 오류"
                                            });
                                        }
                                    });
                                } else {
                                    log.err("friend_request - err_2", err_2);
                                    res({
                                        result: false,
                                        msg: "데이터베이스 오류"
                                    });
                                }
                            });
                        } else {
                            res({
                                result: false,
                                msg: rows[0].isAccept.readUInt8(0) === 0 ? "이미 친구 요청 상태입니다." : "이미 친구 추가 상태입니다."
                            });
                        }
                    } else {
                        log.err("friend_request - err", err);
                        res({
                            result: false,
                            msg: "데이터베이스 오류"
                        });
                    }
                });
            } else {
                res({
                    result: false,
                    msg: "본인에게 친구 요청을 보낼 수 없습니다."
                });
            }
        } else {
            res({
                result: false,
                msg: otherId.msg
            });
        }
    });
}

exports.friend_cancle = (data, userData) => {
    return new Promise((res) => {
        const otherId = crp.decrypto(data.cid);
        if (otherId.result) {
            const selectQuery = `SELECT isAccept FROM ${config.db.chat_table_prefix}friend_list WHERE req_userId = ${mysql.escape(userData.userId)} AND res_userId = ${mysql.escape(otherId.data)};`;
            mysql.query(selectQuery, (err, rows) => {
                if (!err) {
                    if (rows.length > 0) {
                        if (rows[0].isAccept.readUInt8(0) === 0) {
                            const deleteQuery = `DELETE FROM ${config.db.chat_table_prefix}friend_list WHERE req_userId = ${mysql.escape(userData.userId)} AND res_userId = ${mysql.escape(otherId.data)};`
                            mysql.query(deleteQuery, (err_2) => {
                                if (!err_2) {
                                    res({
                                        result: true,
                                        msg: "해당 요청을 취소하였습니다."
                                    });
                                } else {
                                    log.err("friend_cancle - err_2", err_2);
                                    res({
                                        result: false,
                                        msg: "데이터베이스 오류"
                                    });
                                }
                            });
                        } else {
                            res({
                                result: false,
                                msg: "이미 상대방이 수락하였습니다."
                            });
                        }
                    } else {
                        res({
                            result: false,
                            msg: "해당 요청의 데이터가 없습니다."
                        });
                    }
                } else {
                    log.err("friend_cancle - err", err);
                    res({
                        result: false,
                        msg: "데이터베이스 오류"
                    });
                }
            });
        } else {
            res({
                result: false,
                msg: otherId.msg
            });
        }
    });
}

exports.friend_accept = (data, userData) => {
    return new Promise((res) => {
        const otherId = crp.decrypto(data.cid);
        if (otherId.result) {
            const updateQuery = `UPDATE ${config.db.chat_table_prefix}friend_list SET isAccept = 1 WHERE req_userId = ${mysql.escape(otherId.data)} AND res_userId = ${mysql.escape(userData.userId)};`;
            mysql.query(updateQuery, (err) => {
                if (!err) {
                    res({
                        result: true,
                        msg: "해당 요청을 수락하였습니다."
                    });
                } else {
                    log.err("friend_accept - err", err);
                    res({
                        result: false,
                        msg: "데이터베이스 오류"
                    });
                }
            });
        } else {
            res({
                result: false,
                msg: otherId.msg
            });
        }
    });
}

/* =============================================== */
exports.socket_getRoomData = (userData) => {
    return new Promise((res) => {
        const selectQuery = `SELECT roomId FROM ${config.db.chat_table_prefix}join_room_user WHERE userId = ${mysql.escape(userData.userId)};`;
        mysql.query(selectQuery, (err, rows) => {
            if (!err) {
                res({
                    result: true,
                    list: rows
                });
            } else {
                log.err("socket_getRoomData - err", err);
                res({
                    result: false,
                    msg: "데이터베이스 오류"
                });
            }
        });
    });
}

exports.socket_saveMsg = (userData, msgData) => {
    return new Promise((res) => {
        const msg = fun.escapeHtml(msgData.msg);
        const c_roomId = crp.decrypto(msgData.roomId);
        if (c_roomId.result) {
            const jsonData = {
                isBlock: 0,
                msgDelUser: [],
                readMsgUser: [],
                hiddenUser: [],
                isHidden: 0,
                isFile: false,
                fileName: "",
                filePath: "",
                fileType: "",
                isSystemMsg: 0
            }
            const [roomType, roomId] = c_roomId.data.split("_");
            const msgId = fun.generateRandomString();
            const selectQuery = `SELECT roomType FROM ${config.db.chat_table_prefix}room WHERE roomId = ${mysql.escape(roomId)};`;
            mysql.query(selectQuery, (err_2, rows_2) => {
                if (!err_2) {
                    const updateQuery = rows_2[0].roomType === "private" ? ` UPDATE ${config.db.chat_table_prefix}join_room_user SET roomData = JSON_SET(roomData, '$.isHide', 0) WHERE roomId = ${mysql.escape(roomId)};` : "";
                    const insertQuery = `INSERT INTO ${config.db.chat_table_prefix}msg (roomId, msgId, senderId, msg, datetime, msgData) VALUES (${mysql.escape(roomId)}, ${mysql.escape(msgId)}, ${mysql.escape(userData.userId)}, ${mysql.escape(msg)}, now(), ${mysql.escape(JSON.stringify(jsonData))}); ${updateQuery}`;
                    mysql.query(insertQuery, (err) => {
                        if (!err) {
                            res({
                                result: true,
                                msgData: {
                                    roomId: roomId,
                                    msgId: msgId,
                                    msg: msg,
                                    type: "other",
                                    datetime: fun.getCurrentFormattedTime(),
                                    msgType: "",
                                    fileData: {
                                        filePath: "",
                                        fileType: "",
                                        fileName: ""
                                    },
                                    sender: {
                                        senderId: crp.encrypto(userData.userId).data,
                                        senderNick: userData.userNick,
                                        senderProfile: fun.getProfileImg(userData.userId)
                                    },
                                },
                                data: jsonData
                            })
                        } else {
                            log.err("socket_saveMsg - err", err);
                            res({
                                result: false,
                                msg: "데이터베이스 오류"
                            });
                        }
                    });
                } else {
                    log.err("socket_saveMsg - err_2", err_2);
                    res({
                        result: false,
                        msg: "데이터베이스 오류"
                    });
                }
            });
        } else {
            res({
                result: false,
                msg: c_roomId.msg
            });
        }
    });
}

exports.set_unread = (userData, data) => {
    return new Promise((res) => {
        const updateQuery = `UPDATE ${config.db.chat_table_prefix}unread_msg SET lastMsgId = ${mysql.escape(data.msgId)} WHERE roomId = ${mysql.escape(data.roomId)} AND userId = ${mysql.escape(userData.userId)};`
        mysql.query(updateQuery, (err) => {
            if (!err) {
                res({
                    result: true
                });
            } else {
                res({
                    result: false
                });
            }
        });
    });
}

exports.chg_sm = (userData, sm) => {
    return new Promise((res) => {
        if (sm) {
            const msg = fun.escapeHtml(sm);
            if (msg.length <= 20) {
                const updateQuery = `UPDATE ${config.db.chat_table_prefix}user SET userSM = ${mysql.escape(msg)} WHERE userId = ${mysql.escape(userData.userId)};`
                mysql.query(updateQuery, (err) => {
                    if (!err) {
                        res({
                            result: true,
                            SM: msg
                        });
                    } else {
                        log.err("chg_sm - err", err);
                        res({
                            result: false,
                            msg: "데이터베이스 오류"
                        });
                    }
                });
            } else {
                res({
                    result: false,
                    msg: "상태메시지 길이는 20자 이내로 설정해주세요"
                });
            }
        } else {
            res({
                result: false,
                msg: "변경할 상태메시지를 입력해주세요"
            });
        }
    });
}

exports.chg_lockmode = (userData, pass) => {
    return new Promise((res) => {
        if (pass) {
            if (Number.isFinite(Number(pass))) {
                if (String(pass).length === 4) {
                    const updateQuery = `UPDATE ${config.db.chat_table_prefix}user SET lockmode = ${mysql.escape(pass)} WHERE userId = ${mysql.escape(userData.userId)};`
                    mysql.query(updateQuery, (err) => {
                        if (!err) {
                            res({
                                result: true
                            });
                        } else {
                            log.err("chg_lockmode - err", err);
                            res({
                                result: false,
                                msg: "데이터베이스 오류"
                            });
                        }
                    });
                } else {
                    res({
                        result: false,
                        msg: "잠금 비밀번호는 4개의 숫자를 입력해야 합니다."
                    });
                }
            } else {
                res({
                    result: false,
                    msg: "잠금 비밀번호는 숫자만 가능합니다."
                });
            }
        } else {
            res({
                result: false,
                msg: "잠금 비밀번호를 입력해주세요"
            });
        }
    });
}

exports.get_savemsg = (userData) => {
    return new Promise((res) => {
        const selectQuery = `SELECT msgId, msg, datetime FROM ${config.db.chat_table_prefix}msg WHERE senderId = ${mysql.escape(userData.userId)} ORDER BY datetime DESC LIMIT 500;`;
        mysql.query(selectQuery, (err, rows) => {
            if (!err) {
                const updateQuery = `UPDATE ${config.db.chat_table_prefix}user SET backup_count = ${mysql.escape(rows.length)}, backup_date = now() WHERE userId = ${mysql.escape(userData.userId)};`
                mysql.query(updateQuery, (err_2) => {
                    if (!err_2) {
                        res({
                            result: true,
                            msgList: rows,
                            datetime: fun.getCurrentFormattedTime()
                        });
                    } else {
                        log.err("get_savemsg - err_2", err_2);
                        res({
                            result: false,
                            msg: "데이터베이스 오류"
                        });
                    }
                });
            } else {
                log.err("get_savemsg - err", err);
                res({
                    result: false,
                    msg: "데이터베이스 오류"
                });
            }
        });
    });
}

exports.chk_lockmode = (userData, pass) => {
    return new Promise((res) => {
        const selectQuery = `SELECT userId FROM ${config.db.chat_table_prefix}user WHERE userId = ${mysql.escape(userData.userId)} AND lockmode = ${mysql.escape(pass)};`;
        mysql.query(selectQuery, (err, rows) => {
            if (!err) {
                if (rows.length > 0) {
                    const updateQuery = `UPDATE ${config.db.chat_table_prefix}user SET lockmode = 0 WHERE userId = ${mysql.escape(userData.userId)};`
                    mysql.query(updateQuery, (err_2) => {
                        if (!err_2) {
                            res({
                                result: true
                            });
                        } else {
                            log.err("chk_lockmode - err_2", err_2);
                            res({
                                result: false,
                                msg: "데이터베이스 오류"
                            });
                        }
                    });
                } else {
                    res({
                        result: false,
                        msg: "비밀번호가 일치하지 않습니다."
                    });
                }
            } else {
                log.err("chk_lockmode - err", err);
                res({
                    result: false,
                    msg: "데이터베이스 오류"
                });
            }
        });
    });
}

exports.chg_favorits = (userData, croomId) => {
    return new Promise((res) => {
        const c_roomId = crp.decrypto(croomId);
        if (c_roomId.result) {
            const [roomType, roomId] = c_roomId.data.split("_");

            const selectQuery = `SELECT roomData FROM ${config.db.chat_table_prefix}join_room_user WHERE roomId = ${mysql.escape(roomId)} AND userId = ${mysql.escape(userData.userId)};`;
            mysql.query(selectQuery, (err, rows) => {
                if (!err) {
                    if (rows.length > 0) {
                        const roomData = JSON.parse(rows[0].roomData);

                        let queryData = "";
                        let resMsg = "";
                        if (roomData.isFavorites === 0) {
                            queryData = 1;
                            resMsg = "즐겨찾기를 하였습니다.";
                        }
                        if (roomData.isFavorites === 1) {
                            queryData = 0;
                            resMsg = "즐겨찾기를 삭제하였습니다."
                        }
                        const updateQuery = `UPDATE ${config.db.chat_table_prefix}join_room_user SET roomData = JSON_SET(roomData, '$.isFavorites', ${queryData}) WHERE roomId = ${mysql.escape(roomId)} AND userId = ${mysql.escape(userData.userId)};`;
                        mysql.query(updateQuery, (err_2) => {
                            if (!err_2) {
                                res({
                                    result: true,
                                    msg: resMsg
                                });
                            } else {
                                log.err("chg_favorits - err_2", err_2);
                                res({
                                    result: false,
                                    msg: "데이터베이스 오류"
                                });
                            }
                        });
                    } else {
                        res({
                            result: false,
                            msg: "해당 방은 존재하지 않습니다."
                        });
                    }
                } else {
                    log.err("chk_lockmode - err", err);
                    res({
                        result: false,
                        msg: "데이터베이스 오류"
                    });
                }
            });
        } else {
            res({
                result: false,
                msg: c_roomId.msg
            });
        }
    });
}

exports.del_msgdel = (userData, data) => {
    return new Promise((res) => {
        const c_roomId = crp.decrypto(data.roomId);
        if (c_roomId.result) {
            const [roomType, roomId] = c_roomId.data.split("_");
            let updateQuery = `UPDATE ${config.db.chat_table_prefix}msg SET msgData = JSON_ARRAY_APPEND(msgData, '$.msgDelUser', ${mysql.escape(userData.userId)}), msgData = JSON_ARRAY_APPEND(msgData, '$.hiddenUser', ${mysql.escape(userData.userId)}) WHERE roomId = ${mysql.escape(roomId)};`;
            let delMsg = [];

            for (let i = 0; i < data.msgIdArr.length; i++) {
                if (i === 0) {
                    updateQuery = ``;
                }
                delMsg.push(data.msgIdArr[i]);
                updateQuery += `UPDATE ${config.db.chat_table_prefix}msg SET msgData = JSON_ARRAY_APPEND(msgData, '$.msgDelUser', ${mysql.escape(userData.userId)}), msgData = JSON_ARRAY_APPEND(msgData, '$.hiddenUser', ${mysql.escape(userData.userId)}) WHERE roomId = ${mysql.escape(roomId)} AND msgId = ${mysql.escape(data.msgIdArr[i])}; `;
            }

            mysql.query(updateQuery, (err) => {
                if (!err) {
                    res({
                        result: true,
                        msg: `${data.msgIdArr.length > 0 ? data.msgIdArr.length + "개의 " : "모든 "}메시지를 삭제하였습니다.`,
                        delMsgArr: delMsg
                    });
                } else {
                    log.err("del_msgdel - err", err);
                    res({
                        result: false,
                        msg: "데이터베이스 오류"
                    });
                }
            });
        } else {
            res({
                result: false,
                msg: c_roomId.msg
            });
        }
    });
}

exports.connectUser = (userData, croomid) => {
    return new Promise((res) => {
        const c_roomId = crp.decrypto(croomid);
        if (c_roomId.result) {
            const [roomType, roomId] = c_roomId.data.split("_");
            const selectQuery = `
            SELECT 
                ${config.db.table_prefix}member.mb_id, 
                ${config.db.table_prefix}member.mb_nick
            FROM 
                ${config.db.chat_table_prefix}join_room_user
            JOIN 
                ${config.db.table_prefix}member
            ON 
                ${config.db.chat_table_prefix}join_room_user.userId = ${config.db.table_prefix}member.mb_id
            WHERE 
                ${config.db.chat_table_prefix}join_room_user.roomId = ${mysql.escape(roomId)};
            `;

            mysql.query(selectQuery, (err, rows) => {
                let connectUser = [];
                if (!err) {
                    for (let i = 0; i < rows.length; i++) {
                        connectUser.push({
                            userId: crp.encrypto(rows[i].mb_id).data,
                            userNick: rows[i].mb_nick,
                            userProfile: fun.getProfileImg(rows[i].mb_id),
                            type: userData.userId === rows[i].mb_id ? "mine" : "other"
                        });
                    }
                    res({
                        result: true,
                        userList: connectUser
                    });
                } else {
                    log.err("connectUser - err", err);
                    res({
                        result: false,
                        msg: "데이터베이스 오류"
                    });
                }
            });
        }
    });
}

exports.fileUpload = (userData, fileData, croomid) => {
    return new Promise((res) => {
        const msg = fun.escapeHtml(fileData.originalname);
        const c_roomId = crp.decrypto(croomid);
        if (c_roomId.result) {
            const jsonData = {
                isBlock: 0,
                msgDelUser: [],
                readMsgUser: [],
                hiddenUser: [],
                isHidden: 0,
                isFile: true,
                fileName: fileData.originalname,
                filePath: fileData.filename,
                fileType: fileData.fileType,
                isSystemMsg: 0
            }
            const [roomType, roomId] = c_roomId.data.split("_");
            const msgId = fun.generateRandomString();
            const selectQuery = `SELECT roomType FROM ${config.db.chat_table_prefix}room WHERE roomId = ${mysql.escape(roomId)};`;
            mysql.query(selectQuery, (err_2, rows_2) => {
                if (!err_2) {
                    const updateQuery = rows_2[0].roomType === "private" ? ` UPDATE ${config.db.chat_table_prefix}join_room_user SET roomData = JSON_SET(roomData, '$.isHide', 0) WHERE roomId = ${mysql.escape(roomId)};` : "";
                    const insertQuery = `INSERT INTO ${config.db.chat_table_prefix}msg (roomId, msgId, senderId, msg, datetime, msgData) VALUES (${mysql.escape(roomId)}, ${mysql.escape(msgId)}, ${mysql.escape(userData.userId)}, ${mysql.escape(msg)}, now(), ${mysql.escape(JSON.stringify(jsonData))}); ${updateQuery}`;
                    mysql.query(insertQuery, (err) => {
                        if (!err) {
                            res({
                                result: true,
                                msgData: {
                                    roomId: roomId,
                                    msgId: msgId,
                                    msg: msg,
                                    type: "other",
                                    datetime: fun.getCurrentFormattedTime(),
                                    msgType: "file",
                                    fileData: {
                                        filePath: fileData.filename,
                                        fileType: fileData.fileType,
                                        fileName: fileData.originalname
                                    },
                                    sender: {
                                        senderId: crp.encrypto(userData.userId).data,
                                        senderNick: userData.userNick,
                                        senderProfile: fun.getProfileImg(userData.userId)
                                    },
                                },
                                fileData: {
                                    fileName: fileData.originalname,
                                    filePath: fileData.filename,
                                    fileType: fileData.fileType
                                }
                            })
                        } else {
                            log.err("socket_saveMsg - err", err);
                            res({
                                result: false,
                                msg: "데이터베이스 오류"
                            });
                        }
                    });
                } else {
                    log.err("socket_saveMsg - err_2", err_2);
                    res({
                        result: false,
                        msg: "데이터베이스 오류"
                    });
                }
            });
        } else {
            res({
                result: false,
                msg: c_roomId.msg
            });
        }
    });
}

exports.get_inviteUsers = (userData, croomid) => {
    return new Promise((res) => {
        const c_roomId = crp.decrypto(croomid);
        if (c_roomId.result) {
            const [roomType, roomId] = c_roomId.data.split("_");
            const selectQuery = `
            SELECT 
                u.*,
                gm.mb_nick AS userNick,
            CASE 
                WHEN jru.userId IS NOT NULL THEN TRUE
                ELSE FALSE
            END AS isJoinRoom
            FROM 
                ${config.db.chat_table_prefix}friend_list fl
            JOIN 
                ${config.db.chat_table_prefix}user u 
                ON (fl.req_userId = u.userId AND fl.req_userId != ${mysql.escape(userData.userId)})
                OR (fl.res_userId = u.userId AND fl.res_userId != ${mysql.escape(userData.userId)})
            LEFT JOIN 
                g5_member gm 
            ON gm.mb_id = u.userId
            LEFT JOIN 
                ${config.db.chat_table_prefix}join_room_user jru 
            ON jru.userId = u.userId AND jru.roomId = ${mysql.escape(roomId)}
            WHERE 
                (fl.req_userId = ${mysql.escape(userData.userId)} OR fl.res_userId = ${mysql.escape(userData.userId)})
            AND fl.isAccept = 1;
            `;

            mysql.query(selectQuery, (err, rows) => {
                if (!err) {
                    let inviteArr = [];
                    for (const v of rows) {
                        inviteArr.push({
                            userId: crp.encrypto(v.userId).data,
                            userNick: v.userNick,
                            userProfile: fun.getProfileImg(v.userId),
                            userSM: v.userSM,
                            isJoinRoom: v.isJoinRoom === 1 ? true : false
                        });
                    }
                    res({
                        result: true,
                        inviteData: inviteArr
                    });
                } else {
                    log.err("get_inviteUsers - err", err);
                    res({
                        result: false,
                        msg: "데이터베이스 오류"
                    });
                }
            });
        } else {
            res({
                result: false,
                msg: c_roomId.msg
            });
        }
    });
}

exports.set_inviteUsers = (userData, c_roomid, c_inviteUser) => {
    return new Promise((res) => {
        const c_roomId = crp.decrypto(c_roomid);
        if (c_roomId.result) {
            if (c_inviteUser.length <= 10) {
                if (c_inviteUser.length !== 0) {
                    const [roomType, roomId] = c_roomId.data.split("_");
                    let chkErr = false;
                    let inviteUser = [];
                    for (const v of c_inviteUser) {
                        const c_user = crp.decrypto(v);
                        if (c_user.result) inviteUser.push(c_user.data);
                        else chkErr = true;
                    }

                    if (chkErr) {
                        res({
                            result: false,
                            msg: "유저 데이터에 오류가 발생하였습니다."
                        });
                    } else {
                        let query = ``;
                        if (roomType === "private") { //1:1채팅일 경우 그룹채팅으로 변경
                            query += `
                            UPDATE ${config.db.chat_table_prefix}room SET roomType = ${mysql.escape("group")}, roomName = ${mysql.escape(userData.userNick + "님의 단체 채팅방")}, roomImg = ${mysql.escape(fun.getProfileImg(userData.userId))} WHERE roomId = ${mysql.escape(roomId)};
                            UPDATE ${config.db.chat_table_prefix}friend_list SET roomId = NULL WHERE roomId = ${mysql.escape(roomId)};
                            UPDATE ${config.db.chat_table_prefix}join_room_user SET roomData = JSON_SET(roomData, '$.isHide', 0) WHERE roomId = ${mysql.escape(roomId)};
                            `;
                        }

                        const jsonData = {
                            isBan: 0,
                            isHide: 0,
                            isBlock: 0,
                            isFavorites: 0,
                            blockUser: []
                        }
                        for (const v of inviteUser) { //채팅방 초대
                            query += `
                            INSERT INTO ${config.db.chat_table_prefix}join_room_user (roomId, userId, last_connect, roomData) VALUES (${mysql.escape(roomId)}, ${mysql.escape(v)}, now(), ${mysql.escape(JSON.stringify(jsonData))});
                            INSERT INTO ${config.db.chat_table_prefix}unread_msg (roomId, userId, lastMsgId) VALUES (${mysql.escape(roomId)}, ${mysql.escape(v)}, (SELECT msgId FROM ${config.db.chat_table_prefix}msg WHERE roomId = ${mysql.escape(roomId)} ORDER BY datetime DESC LIMIT 1));
                            `;
                        }
                        query += `UPDATE ${config.db.chat_table_prefix}room SET roomUser = roomUser + ${Number(inviteUser.length)} WHERE roomId = ${mysql.escape(roomId)};`;

                        const jsonArray = inviteUser.map(value => `'$.readMsgUser', '${value}'`).join(', '); //채팅방 정보 업데이트
                        const jsonArray_2 = inviteUser.map(value => `'$.hiddenUser', '${value}'`).join(', '); //채팅방 정보 업데이트
                        query += `
                        UPDATE ${config.db.chat_table_prefix}msg SET msgData = JSON_ARRAY_APPEND(msgData, ${jsonArray}) WHERE roomId = ${mysql.escape(roomId)};
                        UPDATE ${config.db.chat_table_prefix}msg SET msgData = JSON_ARRAY_APPEND(msgData, ${jsonArray_2}) WHERE roomId = ${mysql.escape(roomId)};
                        `;

                        mysql.query(query, (err) => {
                            if (!err) {
                                res({
                                    result: true,
                                    msg: `${inviteUser.length}명의 유저를 초대하였습니다.`,
                                    roomData: {
                                        id: roomId,
                                        name: `${userData.userNick}님의 단체 채팅방`,
                                        userCount: inviteUser.length,
                                        profile: fun.getProfileImg(userData.userId)
                                    },
                                    badge: {
                                        roomId: crp.encrypto(`group_${roomId}`).data,
                                        userId: inviteUser
                                    }
                                });
                            } else {
                                log.err("set_inviteUsers - err", err);
                                res({
                                    result: false,
                                    msg: "데이터베이스 오류"
                                });
                            }
                        });
                    }
                } else {
                    res({
                        result: false,
                        msg: "초대할 유저가 없습니다."
                    });
                }
            } else {
                res({
                    result: false,
                    msg: "최대 초대 인원은 10명까지 가능합니다."
                });
            }
        } else {
            res({
                result: false,
                msg: c_roomId.msg
            });
        }
    });
}

exports.out_room = (userData, c_roomid) => {
    return new Promise((res) => {
        const c_roomId = crp.decrypto(c_roomid);
        if (c_roomId.result) {
            const [roomType, roomId] = c_roomId.data.split("_");

            const selectQuery = `SELECT roomType FROM ${config.db.chat_table_prefix}room WHERE roomId = ${mysql.escape(roomId)};`;
            mysql.query(selectQuery, (err, rows) => {
                if (!err) {
                    let updateQuery = "";

                    if (rows.length > 0) {
                        if (rows[0].roomType === "private") {
                            updateQuery = `
                            UPDATE ${config.db.chat_table_prefix}msg SET msgData = JSON_ARRAY_APPEND(msgData, '$.msgDelUser', ${mysql.escape(userData.userId)}), msgData = JSON_ARRAY_APPEND(msgData, '$.hiddenUser', ${mysql.escape(userData.userId)}) WHERE roomId = ${mysql.escape(roomId)};
                            UPDATE ${config.db.chat_table_prefix}join_room_user SET roomData = JSON_SET(roomData, '$.isHide', 1) WHERE roomId = ${mysql.escape(roomId)} AND userId = ${mysql.escape(userData.userId)};
                            `;
                        } else {
                            updateQuery = `
                            UPDATE ${config.db.chat_table_prefix}msg SET msgData = JSON_ARRAY_APPEND(msgData, '$.msgDelUser', ${mysql.escape(userData.userId)}), msgData = JSON_ARRAY_APPEND(msgData, '$.hiddenUser', ${mysql.escape(userData.userId)}) WHERE roomId = ${mysql.escape(roomId)};
                            UPDATE ${config.db.chat_table_prefix}room SET roomUser = roomUser - 1 WHERE roomId = ${mysql.escape(roomId)};
                            DELETE FROM ${config.db.chat_table_prefix}join_room_user WHERE userId = ${mysql.escape(userData.userId)} AND roomId = ${mysql.escape(roomId)};
                            DELETE FROM ${config.db.chat_table_prefix}unread_msg WHERE userId = ${mysql.escape(userData.userId)} AND roomId = ${mysql.escape(roomId)};
                            `;
                        }

                        mysql.query(updateQuery, (err_2) => {
                            if (!err_2) {
                                res({
                                    result: true
                                });
                            } else {
                                log.err("out_room - err_2", err_2);
                                res({
                                    result: false,
                                    msg: "데이터베이스 오류"
                                });
                            }
                        });
                    } else {
                        res({
                            result: false,
                            msg: "해당 채팅방이 존재하지 않습니다."
                        });
                    }
                } else {
                    log.err("out_room - err", err);
                    res({
                        result: false,
                        msg: "데이터베이스 오류"
                    });
                }
            });
        } else {
            res({
                result: false,
                msg: c_roomId.msg
            });
        }
    });
}

exports.delMsg_r = (userData, data) => {
    return new Promise((res) => {
        const c_roomId = crp.decrypto(data.roomId);
        if (c_roomId.result) {
            const [roomType, roomId] = c_roomId.data.split("_");
            const updateQuery = `UPDATE ${config.db.chat_table_prefix}msg SET msgData = JSON_ARRAY_APPEND(msgData, '$.msgDelUser', ${mysql.escape(userData.userId)}), msgData = JSON_ARRAY_APPEND(msgData, '$.hiddenUser', ${mysql.escape(userData.userId)}) WHERE roomId = ${mysql.escape(roomId)} AND msgId = ${mysql.escape(data.msgId)};`;
            mysql.query(updateQuery, (err) => {
                if (!err) {
                    res({
                        result: true,
                        msgId: data.msgId
                    });
                } else {
                    log.err("delMsg_r - err", err);
                    res({
                        result: false,
                        msg: "데이터베이스 오류"
                    });
                }
            });
        } else {
            res({
                result: false,
                msg: c_roomId.msg
            });
        }
    });
}

exports.reqFriend = (userData, c_userId) => {
    return new Promise((res) => {
        const userId = crp.decrypto(c_userId);
        if (userId.result) {
            if (userData.userId !== userId.data) {
                const selectQuery = `SELECT userId FROM ${config.db.chat_table_prefix}user WHERE userId = ${mysql.escape(userId.data)};`;
                mysql.query(selectQuery, (err, rows) => {
                    if (!err) {
                        if (rows.length > 0) {
                            const selectQuer_2 = `SELECT isAccept FROM ${config.db.chat_table_prefix}friend_list WHERE (req_userId = ${mysql.escape(userId.data)} AND res_userId = ${mysql.escape(userData.userId)}) OR (res_userId = ${mysql.escape(userId.data)} AND req_userId = ${mysql.escape(userData.userId)});`;
                            mysql.query(selectQuer_2, (err_2, rows_2) => {
                                if (!err_2) {
                                    if (rows_2.length <= 0) {
                                        const insertQuery = `INSERT INTO ${config.db.chat_table_prefix}friend_list (req_userId, res_userId, datetime) VALUES (${mysql.escape(userData.userId)}, ${mysql.escape(userId.data)}, now());`;
                                        mysql.query(insertQuery, (err_3) => {
                                            if (!err_3) {
                                                res({
                                                    result: true,
                                                    msg: "친구요청을 하였습니다.",
                                                    userId: c_userId
                                                });
                                            } else {
                                                log.err("reqFriend - err_3", err_3);
                                                res({
                                                    result: false,
                                                    msg: "데이터베이스 오류"
                                                });
                                            }
                                        });
                                    } else {
                                        if (rows_2[0].isAccept.readUInt8(0) === 1) {
                                            res({
                                                result: false,
                                                msg: "이미 친구상태입니다."
                                            });
                                        } else {
                                            res({
                                                result: false,
                                                msg: "이미 친구요청 상태입니다."
                                            });
                                        }
                                    }
                                } else {
                                    log.err("reqFriend - err_2", err_2);
                                    res({
                                        result: false,
                                        msg: "데이터베이스 오류"
                                    });
                                }
                            });
                        } else {
                            res({
                                result: false,
                                msg: "해당 유저가 존재하지 않습니다."
                            });
                        }
                    } else {
                        log.err("reqFriend - err", err);
                        res({
                            result: false,
                            msg: "데이터베이스 오류"
                        });
                    }
                });
            } else {
                res({
                    result: false,
                    msg: "본인에게 친구요청을 보낼 수 없습니다."
                });
            }
        } else {
            res({
                result: false,
                msg: c_roomId.msg
            });
        }
    });
}