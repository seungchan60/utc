const config = require('../config.js');
const crypto = require('crypto');
const mysqlHandler = require('./mysql.js');

exports.chkData = (userData) => {
    return new Promise((res) => {
        if (userData) {
            const encodeData = decodeURIComponent(escape(atob(userData)));
            if (encodeData.indexOf("_") !== -1) {
                const [userList, userHash] = encodeData.split("_");
                if (userList.indexOf("|") !== -1) {
                    if ((userList.split("|").length - 1) === 2) {
                        const [userId, userNick, userLevel] = userList.split("|");
                        if (userId && userNick && userLevel) {
                            let jsonData = {
                                userId: userId,
                                userNick: userNick,
                                userLevel: Number(userLevel)
                            }
                            mysqlHandler.chkUserData(jsonData).then(mysqlRes => {
                                if (mysqlRes.result) {
                                    const hash = crypto.createHash('sha256').update(`${mysqlRes.userNo},${userId},${userNick},${userLevel},${config.salt.hashkey}`).digest('hex');
                                    if (hash === userHash) {
                                        jsonData.userSM = mysqlRes.userSM;
                                        res({
                                            result: true,
                                            userData: jsonData
                                        });
                                    } else {
                                        res({
                                            result: false,
                                            msg: "데이터 변조 감지",
                                            replace: "/"
                                        });
                                    }
                                } else {
                                    res(mysqlRes);
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
                        res({
                            result: false,
                            msg: "데이터 오류",
                            replace: "/"
                        });
                    }
                } else {
                    res({
                        result: false,
                        msg: "데이터 오류",
                        replace: "/"
                    });
                }
            } else {
                res({
                    result: false,
                    msg: "데이터 오류",
                    replace: "/"
                });
            }
        } else {
            res({
                result: false,
                msg: "데이터 오류",
                replace: "/"
            });
        }
    });
}