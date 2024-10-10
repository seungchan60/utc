const crypto = require('crypto');
const config = require("../config.js");

exports.encrypto = (data) => {
    if (!data) {
        return ({
            result: false,
            msg: '암호화할 데이터가 유효하지 않습니다.'
        });
    } else {
        const iv = crypto.randomBytes(config.crypto.length);
        const cipher = crypto.createCipheriv(config.crypto.algorithm, Buffer.from(config.crypto.salt), iv);
        const encrypted = cipher.update(data);
        return ({
            result: true,
            data: iv.toString('hex') + ':' + Buffer.concat([encrypted, cipher.final()]).toString('hex')
        });
    }
}

exports.decrypto = (data) => {
    if (data) {
        const textParts = data.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        if (iv.length < 16) {
            return {
                result: false,
                msg: '데이터 변조가 발생하였습니다.'
            };
        } else {
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv(config.crypto.algorithm, Buffer.from(config.crypto.salt), iv);
            decipher.on('error', (err) => {
                return {
                    result: false,
                    msg: '데이터 변조가 발생하였습니다.'
                };
            });
            const decrypted = decipher.update(encryptedText);

            return {
                result: true,
                data: Buffer.concat([decrypted, decipher.final()]).toString()
            };
        }
    } else {
        return {
            result: false,
            msg: '복호화할 데이터가 유효하지 않습니다.'
        };
    }
}