const serverInfo = Object.freeze({
    host: `${location.protocol}//${location.hostname}`,
    port: 8032
});

const api = {
    post: async (url, callback, data) => {
        try {
            const response = await fetch(`${serverInfo.host}:${String(serverInfo.port)}/${String(url)}`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "UserData": mbData.hash
                },
                body: JSON.stringify(data)
            });

            const json = await response.json();
            json.connect = true;

            if (response.ok) {
                callback(json);
            } else {
                console.log(response);
            }
        } catch (error) {
            console.error('Error:', error);
            callback({
                connect: false
            });
        }
    },
    get: async (url, callback, data) => {
        try {
            const response = await fetch(`${serverInfo.host}:${String(serverInfo.port)}/${String(url)}${data ? data : ''}`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "UserData": mbData.hash
                }
            });

            const json = await response.json();
            json.connect = true;

            if (response.ok) {
                callback(json);
            } else {
                console.log(response);
            }
        } catch (error) {
            console.error('Error:', error);
            callback({
                connect: false
            });
        }
    },
    img: async (formData, callback) => {
        try {
            const response = await fetch(`${serverInfo.host}:${String(serverInfo.port)}/upload`, {
                method: 'POST',
                headers: {
                    "UserData": mbData.hash,
                    "userURL": document.querySelector("#chatSection .content .content_main .chat_menu").dataset.roomid
                },
                body: formData
            });

            const json = await response.json();
            json.connect = true;

            if (response.ok) {
                callback(json);
            } else {
                console.log(response);
            }
        } catch (error) {
            console.error('Error:', error);
            callback({
                connect: false
            });
        }
    }
};