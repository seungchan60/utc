let socket; //소켓 전역

api.post("chkConnect", (resData) => {
    if (!resData.connect) alert("채팅 서버에 연결할 수 없습니다.");
    if (resData.result) {
        socket = io.connect(`${resData.sslType ? "wss" : "ws"}://${resData.serverDomain}`, {
            query: {
                hash: mbData.hash
            }
        });
    } else {
        location.replace("/");
    }
});