const uuid4 = require("uuid4");

exports.getProfileImg = (userId) => {
    const firstTwoChars = userId.substring(0, 2);
    return `/data/member_image/${firstTwoChars}/${userId}.gif`
}

exports.generateRandomString = () => {
    let uuid;
    do {
        uuid = uuid4();
    } while (/^\d/.test(uuid));

    return uuid;
}

exports.escapeHtml = (msg) => {
    const entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;",
    };
    return String(msg).replace(/[&<>"'`=\/]/g, s => {
        return entityMap[s];
    });
}

exports.getCurrentFormattedTime = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

exports.findSocketUser = (io, id) => {
    return new Promise((res) => {
        let userData = [];

        io.sockets.sockets.forEach((socket, socketId) => {
            if (socket.userData && socket.userData.userId === id) {
                userData.push({
                    socketData: socket,
                    socketId: socketId
                });
            }
        });

        res(userData);
    });
}