const fs = require('fs');
const multer = require('multer');
const path = require('path');
const fun = require('./fun.js');
const mysqlHandler = require('./mysql.js');
const certificationHandler = require('./certification.js');

const FILE_TYPES = {
    'img': {
        extensions: ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'],
        maxSize: 10 * 1024 * 1024
    }, // 10MB
    'audio': {
        extensions: ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma'],
        maxSize: 20 * 1024 * 1024
    }, // 20MB
    'video': {
        extensions: ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm'],
        maxSize: 100 * 1024 * 1024
    }, // 100MB
    'document': {
        extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.hwpx', '.hwp'],
        maxSize: 10 * 1024 * 1024
    }, // 10MB
    'archive': {
        extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
        maxSize: 50 * 1024 * 1024
    }, // 50MB
};

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    let fileTypeValid = false;

    for (const key in FILE_TYPES) {
        const {
            extensions
        } = FILE_TYPES[key];
        if (extensions.includes(ext)) {
            fileTypeValid = true;
            break;
        }
    }

    if (!fileTypeValid) {
        return cb(new Error('지원되지 않은 확장명입니다.'));
    }

    cb(null, true);
}

function getMaxFileSize(ext) {
    for (const key in FILE_TYPES) {
        const {
            extensions,
            maxSize
        } = FILE_TYPES[key];
        if (extensions.includes(ext)) {
            return maxSize;
        }
    }
    return 0;
}

function getFileType(ext) {
    for (const key in FILE_TYPES) {
        const {
            extensions
        } = FILE_TYPES[key];
        if (extensions.includes(ext)) {
            return key; // 'img', 'audio', 'video', 'document', 'archive'
        }
    }
    return 'unknown';
}

const upload = multer({
    storage: multer.diskStorage({
        filename(req, file, done) {
            const randomID = fun.generateRandomString();
            const ext = path.extname(file.originalname);
            const filename = randomID + ext;
            done(null, filename);
        },
        destination(req, file, done) {
            done(null, path.join(__dirname, "../data/uploads"));
        },
    }),
    fileFilter,
    limits: {
        fileSize: Infinity
    },
}).single('myFile');

function uploadMiddleware(req, res) {
    const userData = req.get('UserData');

    certificationHandler.chkData(userData).then(promiseRes => {
        if (!promiseRes.result) return res.json(promiseRes);

        upload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                return res.json({
                    result: false,
                    msg: `파일의 최대크기(${getMaxFileSize(path.extname(req.file.originalname)) / (1024 * 1024)}MB)를 초과하였습니다.`
                });
            } else if (err) {
                return res.json({
                    result: false,
                    msg: err.message
                });
            }

            const ext = path.extname(req.file.originalname).toLowerCase();
            const fileType = getFileType(ext);
            const maxSize = getMaxFileSize(ext);

            if (req.file.size > maxSize) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`파일 삭제 오류: ${unlinkErr}`);
                    }
                    return res.json({
                        result: false,
                        msg: `파일의 최대크기(${maxSize / (1024 * 1024)}MB)를 초과하였습니다.`
                    });
                });
            } else {
                const fileData = {
                    filename: req.file.filename,
                    originalname: decodeURIComponent(req.file.originalname).replace(/\s+/g, ''),
                    fileSize: req.file.size,
                    fileType: fileType // 'img', 'audio', 'video', 'document', 'archive'
                }
                const originalUrl = req.get('userURL');

                mysqlHandler.fileUpload(promiseRes.userData, fileData, originalUrl).then(dbRes => {
                    if (dbRes.result) {
                        res.json({
                            result: true,
                            data: {
                                msgData: dbRes.msgData,
                                fileData: dbRes.fileData
                            }
                        });
                    } else {
                        res.json({
                            result: false,
                            msg: dbRes.msg
                        });
                    }
                });
            }
        });
    }).catch(err => {
        res.json({
            result: false,
            msg: "인증 오류"
        });
    });
}

module.exports = {
    uploadMiddleware
};