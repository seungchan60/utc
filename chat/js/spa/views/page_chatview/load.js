const load = {
    page: (callback) => {
        const url = new URL(window.location.href);
        const queryType = String(url.searchParams.get('room'));
        if (!queryType) history.back();

        api.post('get/page/chatview', (result) => {
            if (result.result) {
                pageInfo.roomId = result.roomData.roomId;
                callback({
                    html: rendering(result),
                    title_ko: "채팅방",
                    title_en: "chatview",
                    send_data: result.roomData.roomId_crypto,
                    msg_list: result.msgList
                });
            } else {
                callback({
                    html: "",
                    title_ko: "채팅방",
                    title_en: "chatview"
                });
                alert(result.msg);
                if (result.replace) result.replace === "/" ? location.replace(result.replace) : history.back();
            }
        }, Object.freeze({
            roomId: queryType,
            msgId: null
        }));
    },
}

const rendering = (pageData) => {
    history.replaceState(null, '', `?page=chat&room=${pageData.roomData.roomId_crypto}`);

    if (pageData.otherId) {
        socket.emit("otherUser_join_room", {
            userId: [pageData.otherId],
            roomId: pageData.roomData.roomId_crypto
        });
    }
    return `
              <div class="chat_menu drag_protection" data-roomId="${pageData.roomData.roomId_crypto}">
                <div class="left_menu">
                    <div class="back_btn" href="./?page=${pageInfo.prePage ? pageInfo.prePage : "list"}" data-link>
                        <svg href="./?page=${pageInfo.prePage ? pageInfo.prePage : "list"}" data-link xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" style="display: inline; pointer-events: auto;">
                            <path href="./?page=${pageInfo.prePage ? pageInfo.prePage : "list"}" data-link d="M192 448c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l137.4 137.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448z" style="pointer-events: auto;"></path>
                        </svg>
                    </div>
                    <div class="user_info">
                        <div class="user_info_profile">
                            <img src="${pageData.roomData.roomImg}" alt="유저 프로필" onerror="this.onerror=null; this.src='/img/no_profile.gif';">
                        </div>
                        <div class="user_info_2">
                            <span class="user_info_nick">${pageData.roomData.roomName}</span>
                            <div data-click="chatmenu|connectuser" class="user_info_2_1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM609.3 512l-137.8 0c5.4-9.4 8.6-20.3 8.6-32l0-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2l61.4 0C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"/></svg>
                                <span data-click="chatmenu|connectuser" class="user_info_sm">${pageData.roomData.roomUser}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="right_menu">
                    <div class="menu_btn" data-click="chatmenu|search">
                        <svg class="chatMenu" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                        </svg>
                    </div>
                    <div class="menu_btn" data-click="chatmenu|open">
                        <svg class="chatMenu" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                            <path d="M0 96C0 78.33 14.33 64 32 64H416C433.7 64 448 78.33 448 96C448 113.7 433.7 128 416 128H32C14.33 128 0 113.7 0 96zM0 256C0 238.3 14.33 224 32 224H416C433.7 224 448 238.3 448 256C448 273.7 433.7 288 416 288H32C14.33 288 0 273.7 0 256zM416 448H32C14.33 448 0 433.7 0 416C0 398.3 14.33 384 32 384H416C433.7 384 448 398.3 448 416C448 433.7 433.7 448 416 448z" style="pointer-events: none;"></path>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="chat_msg">
                <ul class="list"></ul>
            </div>
            <div class="chat_view_msgDetail">
                <div class="chat_view_msgDetail_2" data-click="chatmenu|send_2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>
                </div>
            </div>
            <div class="chat_input">
                <textarea></textarea>
                <button class="send_btn on drag_protection" data-click="chat|send">전송</button>
            </div>

            <div class="searchBox_view">
                <input placeholder="메시지 검색">
                <button data-click="chatmenu|search_text">검색</button>
            </div>

            <div class="chat_view_connect_user drag_protection">
                <div class="connect_user_info">
                    <span class="connect_user_info_title">참여자</span>
                    <span class="connect_user_info_num">0</span>
                </div>
                <ul></ul>
            </div>

            <input type="file" id="fileInput" name="myFile" style="display: none;" />

            <div class="loader-container">
                <div class="loader"></div>
                <span>파일 업로드 중...</span>
            </div>
	`;
}
// {
//     <div class="chat_view_msgDetail_1" data-click="chatmenu|send_1">
//      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM164.1 325.5C182 346.2 212.6 368 256 368s74-21.8 91.9-42.5c5.8-6.7 15.9-7.4 22.6-1.6s7.4 15.9 1.6 22.6C349.8 372.1 311.1 400 256 400s-93.8-27.9-116.1-53.5c-5.8-6.7-5.1-16.8 1.6-22.6s16.8-5.1 22.6 1.6zM144.4 208a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>
//     </div>
// }
export default load;