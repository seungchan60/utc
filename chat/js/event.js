/* =========== 전역 =========== */
const pageInfo = {
    prePage: null,
    pastPage: null,
    roomId: null
}
let scrollableDiv;
let lastMsgId = "";
let isThrottled_keydown_2 = false;
let isChatViewFriendList = false;
let rclickData = "";
let rclickData_2 = "";
/* =========================== */

function updatePageInfo(pageData) {
    const chatSection = document.getElementById("chatSection");
    if (pageInfo.prePage) pageInfo.pastPage = pageInfo.prePage;
    if (pageData) pageInfo.prePage = pageData;
    if (pageData === "chatview") chatSection.setAttribute("viewmode", "chatview");
    if (pageData !== "chatview") chatSection.setAttribute("viewmode", "listview");
}

function socket_leaveRoom(data) {
    socket.emit("room_management", data);
}

function event_chatview(data, roomId) {
    isChatViewFriendList = false;
    msgUpdate(data, true);

    let isThrottled = false;
    let isScrollData = false;

    if (data.length > 0) {
        scrollableDiv.addEventListener('scroll', () => {
            const scrollTop = scrollableDiv.scrollTop;
            const bottomScrollPosition = -(scrollableDiv.scrollHeight - scrollableDiv.clientHeight);
            const threshold = 50;

            if (scrollTop <= (bottomScrollPosition + threshold) && !isThrottled) {
                if (lastMsgId) {
                    if (!isScrollData) {
                        api.post('get/page/chatview', (result) => {
                            msgUpdate_later(result.msgList);
                            if (result.msgList >= 0) isScrollData = true;
                        }, Object.freeze({
                            roomId: roomId,
                            msgId: lastMsgId
                        }));
                    }
                }
                isThrottled = true;

                setTimeout(() => {
                    isThrottled = false;
                }, 100);
            }
        });
    }

    const inputField = document.querySelector("#chatSection .content .content_main .chat_input textarea");
    let isThrottled_keydown = false;
    inputField.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isThrottled_keydown) return;
            const msg = document.querySelector("#chatSection .content .content_main .chat_input textarea").value;
            if (msg) {
                const roomId = document.querySelector("#chatSection .content .content_main .chat_menu").dataset.roomid;
                if (roomId) {
                    socket.emit("req_chatMsg", {
                        roomId: roomId,
                        msg: msg
                    });
                }
            }
            isThrottled_keydown = true;
            setTimeout(() => {
                isThrottled_keydown = false;
            }, 200);
        }
    });

    document.getElementById("fileInput").addEventListener("change", function () {
        const fileInput = document.getElementById("fileInput");
        const file = fileInput.files[0];

        if (file) {
            document.querySelector(".loader-container span").innerText = "파일 업로드 중...";
            document.querySelector(".loader-container").style.display = "flex";
            const formData = new FormData();
            const encodedFileName = encodeURIComponent(file.name);
            formData.append("myFile", file, encodedFileName);

            api.img(formData, (result) => {
                document.querySelector(".loader-container span").innerText = result.result ? "업로드 완료" : "업로드 실패";
                if (!result.result) alert(result.msg);
                if (result.result) socket.emit("req_fileMsg", result.data);

                setTimeout(() => {
                    document.querySelector(".loader-container").style.display = "none";
                }, 1000);
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => { //좌클릭 이벤트
        const chatMenuSlide = document.querySelectorAll(".meunslide"); //메뉴리스트 제거
        for (const v of chatMenuSlide) {
            if (v.classList.contains('on')) {
                v.style.display = 'none';
                v.classList.toggle('on');
            }
        }

        if (e.target.matches("[data-click]")) {
            const [type, data] = e.target.dataset.click ? e.target.dataset.click.split("|") : [undefined, undefined];

            if (type === "listmenu" && data === "search") { //리스트 -> 검색
                click.search();
            }
            if (type === "listmenu" && data === "search_text") { //리스트 -> 검색
                click.search_text();
            }
            if (type === "setting" && data === "userinfo") { //설정 -> 상태메시지 변경
                click.setting_userinfo();
            }
            if (type === "setting" && data === "lockmode") { //설정 -> 잠금 모드
                click.setting_lockmode();
            }
            if (type === "setting" && data === "savemsg") { //설정 -> 메시지 저장
                click.setting_savemsg();
            }
            if (type === "friend" && data === "search") { //친구 요청 -> 검색
                const searchText = document.querySelector("#chatSection .content .content_main .friend_section .friend_section_search input").value;
                if (searchText) {
                    api.post("friend/search", (res) => {
                        renderFriend.search(res.list);
                    }, Object.freeze({
                        text: searchText
                    }));
                } else {
                    alert("검색할 닉네임을 입력해주세요");
                }
            }
            if (type === "request_friend") { //친구 요청 -> 요청
                if (data) {
                    socket.emit("request_friend", Object.freeze({
                        cid: data
                    }));
                }
            }
            if (type === "cancle_friend") { //친구 요청 -> 취소
                if (data) {
                    api.post("friend/cancle", (res) => {
                        alert(res.msg);
                        if (res.result || (!res.result && res.msg === "이미 상대방이 수락하였습니다.")) {
                            e.target.parentElement.parentElement.remove();
                        }
                    }, Object.freeze({
                        cid: data
                    }));
                }
            }
            if (type === "accept_friend") { //친구 요청 -> 수락
                if (data) {
                    api.post("friend/accept", (res) => {
                        alert(res.msg);
                        if (res.result) {
                            e.target.parentElement.parentElement.remove();
                            chkFriendNotification();
                        }
                    }, Object.freeze({
                        cid: data
                    }));
                }
            }
            if (type === "displaymode" && (data === "light" || data === "dark")) { //설정 -> 다크모드 설정
                const chatSection = document.getElementById("chatSection");
                const chkDarkmode = data === "light" ? "false" : "true";
                chatSection.setAttribute("darkmode", chkDarkmode);
                cookie.set("darkmode", chkDarkmode);
            }
            if (type === "chatmenu" && data === "open") { //채팅방 -> 메뉴 실행
                e.stopPropagation();
                const chatMenuSlide = document.getElementById('chatMenuSlide');

                const winWidth = window.innerWidth;
                const winHeight = window.innerHeight;
                const posX = e.pageX;
                const posY = e.pageY;
                const menuWidth = chatMenuSlide.offsetWidth;
                const menuHeight = chatMenuSlide.offsetHeight;
                const secMargin = 10;
                let posLeft;
                let posTop;

                if (posX - menuWidth - secMargin < 0) {
                    posLeft = posX + secMargin;
                } else {
                    posLeft = posX - menuWidth - secMargin;
                }

                if (posY + menuHeight + secMargin > winHeight) {
                    posTop = posY - menuHeight - secMargin;
                    if (posTop < secMargin) {
                        posTop = secMargin;
                    }
                } else {
                    posTop = posY + secMargin;
                }

                chatMenuSlide.style.left = (posLeft - 100) + 'px';
                chatMenuSlide.style.top = posTop + 'px';
                chatMenuSlide.style.display = 'block';
                if (!chatMenuSlide.classList.contains('on')) {
                    chatMenuSlide.classList.toggle('on');
                }
            }
            if (type === "chatmenu" && data === "favorits") { //채팅방 메뉴 -> 즐겨찾기
                api.post("chg/chatmenu/favorits", (result) => {
                    alert(result.msg);
                }, Object.freeze({
                    roomId: document.querySelector("#chatSection .content .content_main .chat_menu").dataset.roomid
                }));
            }
            if (type === "chatmenu" && data === "invite") { //채팅방 메뉴 -> 초대하기
                api.post("get/chatmenu/invite", (res) => {
                    if (res.result) {
                        popup.invite_room(res.inviteData, (popupRes) => {
                            if (popupRes.confirmed) {
                                api.post("set/chatmenu/invite", (res_2) => {
                                    alert(res_2.msg);
                                    if (res_2.result) {
                                        socket.emit("otherUser_join_room", res_2.badge);
                                        setTimeout(() => {
                                            socket.emit("chatroom_update", res_2.roomData);
                                        }, 2000);
                                    }
                                }, Object.freeze({
                                    cid: document.querySelector("#chatSection .content .content_main .chat_menu").dataset.roomid,
                                    inviteData: popupRes.invited
                                }));
                            }
                        }, Object.freeze({
                            cid: document.querySelector("#chatSection .content .content_main .chat_menu").dataset.roomid
                        }));
                    }
                }, Object.freeze({
                    cid: document.querySelector("#chatSection .content .content_main .chat_menu").dataset.roomid
                }));
            }
            if (type === "chatmenu" && data === "save") { //채팅방 메뉴 -> 메시지 저장
                popup.confirm({
                    title: "메시지 저장",
                    msg: "현재 채팅방의 메시지를 모두 로컬에 저장합니다.",
                    btn_confirm: "저장",
                    btn_cancel: "취소"
                }, (popupRes) => {
                    if (popupRes.confirmed) {
                        const preElements = document.querySelectorAll('pre');
                        const preData = Array.from(preElements).map(pre => {
                            const dateElement = pre.closest('div').querySelector('.datetime');

                            return {
                                msgId: "채팅방",
                                msg: pre.textContent,
                                datetime: dateElement ? dateElement.textContent : null
                            }
                        });

                        saveMsg("채팅방 메시지 Log", preData);
                    }
                });
            }
            if (type === "chatmenu" && data === "msgdel") { //채팅방 메뉴 -> 메시지 삭제
                click.chatmenu_msgdel();
            }
            if (type === "chatmenu" && data === "exit") { //채팅방 메뉴 -> 채팅방 나가기
                click.chatmenu_roomout();
            }
            if (type === "chatmenu" && data === "search") { //채팅방 메뉴 -> 검색
                click.search_view();
            }
            if (type === "chatmenu" && data === "search_text") { //채팅방 메뉴 -> 검색
                click.search_view_text();
            }
            if (type === "chatmenu" && data === "connectuser") { //채팅방 메뉴 -> 인원 검색
                click.connectuser();
            }
            // if (type === "chatmenu" && data === "send_1") { //채팅방 메뉴 -> 이모지 메시지 전송 (TODO)

            // }
            if (type === "chatmenu" && data === "send_2") { //채팅방 메뉴 -> 파일 메시지 전송
                document.getElementById("fileInput").click();
            }
            if (type === "downloadFile") { //채팅방 메시지 -> 파일 다운로드
                const allItems = document.querySelectorAll('#chatSection .content .content_main .chat_msg li.msgData .msgList ul li');
                for (let i = 0; i < allItems.length; i++) {
                    if (allItems[i].getAttribute('data-msgid') === data) {
                        Next(allItems[i]);
                        return;
                    }

                }

                function Next(d) {
                    const filePath = `${serverInfo.host}:${String(serverInfo.port)}/file/${d.querySelector("pre span.msgFile_span").getAttribute('data-file')}`;
                    const fileName = d.querySelector("pre span.msgFile_span").innerText;
                    const link = document.createElement('a');
                    link.href = filePath;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
            if (type === "chat" && data === "send") { //채팅방 -> 메시지 전송
                const msg = document.querySelector("#chatSection .content .content_main .chat_input textarea").value;
                if (msg) {
                    const roomId = document.querySelector("#chatSection .content .content_main .chat_menu").dataset.roomid;
                    if (roomId) {
                        if (isThrottled_keydown_2) return;

                        socket.emit("req_chatMsg", {
                            roomId: roomId,
                            msg: msg
                        });

                        isThrottled_keydown_2 = true;
                        setTimeout(() => {
                            isThrottled_keydown_2 = false;
                        }, 200);
                    }
                }
            }

            if (type === "rmenu" && data === "msgdel") { //우클릭 -> 메시지 삭제
                api.post("del/rmenu/msg", (res) => {
                    if (res.result) {
                        const item = document.querySelector(`#chatSection .content .content_main .chat_msg li.msgData .msgList ul li[data-msgid="${res.msgId}"]`);
                        item.remove();
                    } else {
                        alert(res.msg);
                    }
                }, Object.freeze({
                    roomId: document.querySelector("#chatSection .content .content_main .chat_menu").dataset.roomid,
                    msgId: rclickData
                }));
            }
            if (type === "rmenu" && data === "reqfriend") { //우클릭 -> 친구 요청
                api.post("req/rmenu/friend", (res) => {
                    if (res.result) socket.emit("req_rmenufriend", res.userId);
                    alert(res.msg);
                    const chatMenuSlide = document.getElementById('chatMenuSlide3');
                    if (chatMenuSlide.classList.contains('on')) {
                        chatMenuSlide.classList.toggle('on');
                    }
                }, Object.freeze({
                    userId: rclickData_2
                }));
            }
        }
    });

    document.body.addEventListener("contextmenu", e => { //우클릭 이벤트
        let target = e.target;
        e.preventDefault();
        while (target && !target.matches("[data-rclick]")) {
            target = target.parentElement;
        }

        if (target && target.matches("[data-rclick]")) {
            const [type, data] = target.dataset.rclick ? target.dataset.rclick.split("|") : [undefined, undefined];
            if (type === "msgf") {
                rclickData = data;
                e.stopPropagation();
                const chatMenuSlide = document.getElementById('chatMenuSlide2');

                const winWidth = window.innerWidth;
                const winHeight = window.innerHeight;
                const posX = e.pageX;
                const posY = e.pageY;
                const menuWidth = chatMenuSlide.offsetWidth;
                const menuHeight = chatMenuSlide.offsetHeight;
                const secMargin = 10;
                let posLeft;
                let posTop;

                if (posX - menuWidth - secMargin < 0) {
                    posLeft = posX + secMargin;
                } else {
                    posLeft = posX - menuWidth - secMargin;
                }

                if (posY + menuHeight + secMargin > winHeight) {
                    posTop = posY - menuHeight - secMargin;
                    if (posTop < secMargin) {
                        posTop = secMargin;
                    }
                } else {
                    posTop = posY + secMargin;
                }

                chatMenuSlide.style.left = (posLeft - 0) + 'px';
                chatMenuSlide.style.top = posTop + 'px';
                chatMenuSlide.style.display = 'block';
                if (!chatMenuSlide.classList.contains('on')) {
                    chatMenuSlide.classList.toggle('on');
                }
            }
            if (type === "friend") {
                rclickData_2 = data;
                e.stopPropagation();
                const chatMenuSlide = document.getElementById('chatMenuSlide3');

                const winWidth = window.innerWidth;
                const winHeight = window.innerHeight;
                const posX = e.pageX;
                const posY = e.pageY;
                const menuWidth = chatMenuSlide.offsetWidth;
                const menuHeight = chatMenuSlide.offsetHeight;
                const secMargin = 10;
                let posLeft;
                let posTop;

                if (posX - menuWidth - secMargin < 0) {
                    posLeft = posX + secMargin;
                } else {
                    posLeft = posX - menuWidth - secMargin;
                }

                if (posY + menuHeight + secMargin > winHeight) {
                    posTop = posY - menuHeight - secMargin;
                    if (posTop < secMargin) {
                        posTop = secMargin;
                    }
                } else {
                    posTop = posY + secMargin;
                }

                chatMenuSlide.style.left = (posLeft - 0) + 'px';
                chatMenuSlide.style.top = posTop + 'px';
                chatMenuSlide.style.display = 'block';
                if (!chatMenuSlide.classList.contains('on')) {
                    chatMenuSlide.classList.toggle('on');
                }
            }
        }
    });

    const click = { //클릭 이벤트 내부 처리
        search: () => {
            const cotentBox = document.querySelector("#chatSection .content .content_title");
            const searchBox = document.querySelector("#chatSection .searchBox");
            if (!cotentBox || !searchBox) return;
            if (searchBox) searchBox.classList.toggle('search_box');
            if (cotentBox) cotentBox.classList.toggle('search_box');
            if (!searchBox.classList.contains('search_box')) {
                if (pageInfo.prePage === "list") {
                    const listItems = document.querySelectorAll('#chatSection .content .content_main ul.userList li');
                    document.querySelector("#chatSection .searchBox input").value = "";
                    listItems.forEach((item) => {
                        if (item.classList.contains('search_none')) item.classList.remove('search_none');
                    });
                }
                if (pageInfo.prePage === "chatting") {
                    const listItems = document.querySelectorAll('#chatSection .content .content_main ul.msgList li');
                    document.querySelector("#chatSection .searchBox input").value = "";
                    listItems.forEach((item) => {
                        if (item.classList.contains('search_none')) item.classList.remove('search_none');
                    });
                }
            } else {
                document.querySelector("#chatSection .searchBox input").focus();
            }
        },
        search_text: () => {
            const searchBox = document.querySelector("#chatSection .searchBox");
            const searchBoxValue = document.querySelector("#chatSection .searchBox input").value;
            if (pageInfo.prePage === "list") {
                if (searchBox.classList.contains('search_box')) {
                    const listItems = document.querySelectorAll('#chatSection .content .content_main ul.userList li');
                    listItems.forEach((item) => {
                        const nickSpan = item.querySelector('.user_info .nick');
                        if (nickSpan) {
                            const nickText = nickSpan.textContent || nickSpan.innerText;
                            if (nickText.indexOf(searchBoxValue) === -1) {
                                item.classList.add('search_none');
                            }
                        }
                    });
                }
            }
            if (pageInfo.prePage === "chatting") {
                if (searchBox.classList.contains('search_box')) {
                    const listItems = document.querySelectorAll('#chatSection .content .content_main ul.msgList li');
                    listItems.forEach((item) => {
                        const nickSpan = item.querySelector('.user_info .nick');
                        if (nickSpan) {
                            const nickText = nickSpan.textContent || nickSpan.innerText;
                            if (nickText.indexOf(searchBoxValue) === -1) {
                                item.classList.add('search_none');
                            }
                        }
                    });
                }
            }
        },
        search_view: () => {
            const searchBox = document.querySelector("#chatSection .searchBox_view");
            if (!searchBox) return;
            if (searchBox) searchBox.classList.toggle('search_box');
            if (!searchBox.classList.contains('search_box')) {
                const listItems = document.querySelectorAll('#chatSection .content .content_main .chat_msg li.msgData li pre');
                document.querySelector("#chatSection .searchBox_view input").value = "";
                listItems.forEach((item) => {
                    const spanElement = item.querySelector("span");
                    if (spanElement) {
                        const beforeSpan = item.innerHTML.split(spanElement.outerHTML)[0];
                        const afterSpan = item.innerHTML.split(spanElement.outerHTML)[1];
                        item.innerHTML = beforeSpan + spanElement.textContent + afterSpan;
                    }
                });
            } else {
                document.querySelector("#chatSection .searchBox_view input").focus();
            }
        },
        search_view_text: () => {
            let firstTag = null;
            const searchBox = document.querySelector("#chatSection .searchBox_view");
            const searchBoxValue = document.querySelector("#chatSection .searchBox_view input").value;

            if (searchBox.classList.contains('search_box')) {
                const listItems = document.querySelectorAll('#chatSection .content .content_main .chat_msg li.msgData li pre');
                listItems.forEach((item) => {
                    const msgIndex = item.innerText.indexOf(searchBoxValue);
                    if (msgIndex !== -1) {
                        firstTag = item;
                        const part1 = item.innerText.slice(0, msgIndex);
                        const part2 = searchBoxValue;
                        const part3 = item.innerText.slice(msgIndex + searchBoxValue.length)
                        item.innerHTML = `${part1}<span class="msghighlight">${part2}</span>${part3}`;
                    }
                });

                if (firstTag) firstTag.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        },
        connectuser: () => {
            const searchBox = document.querySelector("#chatSection .content .content_main .chat_view_connect_user");
            if (searchBox) searchBox.classList.toggle('connect_box');
            // if (!isChatViewFriendList) {
            //     isChatViewFriendList = true;
            api.post("get/connect/user", (data) => {
                document.querySelector("#chatSection .content .content_main .chat_view_connect_user ul").innerHTML = "";
                for (v of data.userList) {
                    const html = `<li data-rclick="friend|${v.userId}" data-userid="${v.userId}"><img src="${v.userProfile}" alt="유저 프로필" onerror="this.onerror=null; this.src='/img/no_profile.gif';"><span>${v.userNick}</span></li>`;
                    document.querySelector("#chatSection .content .content_main .chat_view_connect_user ul").insertAdjacentHTML("beforeend", html);

                    document.querySelector("#chatSection .content .content_main .chat_view_connect_user .connect_user_info .connect_user_info_num").innerText = data.userList.length;
                }
            }, Object.freeze({
                roomId: document.querySelector("#chatSection .content .content_main .chat_menu").dataset.roomid
            }));
            // }
        },
        // emoji_section: () => {

        // },
        setting_userinfo: () => {
            popup.input({
                title: "상태메시지",
                msg: "변경할 상태메시지를 입력해주세요",
                placehorder: "상태메시지",
                btn_confirm: "변경",
                btn_cancel: "취소"
            }, (p_res) => {
                if (p_res.confirmed) {
                    if (p_res.msg) {
                        api.post("chg/setting/sm", (res) => {
                            if (res.result) {
                                document.querySelector("#chatSection .content .content_main .setting_section .setting_info .myinfo .myinfo_left .myinfo_sm").textContent = res.SM;
                            } else {
                                alert(res.msg);
                            }
                        }, {
                            sm: p_res.msg
                        });
                    } else {
                        alert("변경할 상태메시지를 입력해주세요");
                    }
                }
            });
        },
        setting_lockmode: () => {
            popup.input({
                title: "잠금모드",
                msg: "설정할 비밀번호를 입력해주세요",
                placehorder: "신중하게!",
                btn_confirm: "잠금",
                btn_cancel: "취소"
            }, (p_res) => {
                if (p_res.confirmed) {
                    if (p_res.msg) {
                        if (Number.isFinite(Number(p_res.msg))) {
                            if (String(p_res.msg).length === 4) {
                                api.post("chg/setting/lockmode", (res) => {
                                    if (res.result) {
                                        location.reload();
                                    } else {
                                        alert(res.msg);
                                    }
                                }, {
                                    pass: p_res.msg
                                });
                            } else {
                                alert("잠금 비밀번호는 4개의 숫자를 입력해야 합니다.");
                            }
                        } else {
                            alert("잠금 비밀번호는 숫자만 가능합니다.");
                        }
                    } else {
                        alert("잠금 비밀번호를 입력해주세요");
                    }
                }
            });
        },
        setting_savemsg: () => {
            popup.confirm({
                title: "메시지 저장",
                msg: "가장 최신 500개 이하의 메시지만 저장이 가능합니다.",
                btn_confirm: "저장",
                btn_cancel: "취소"
            }, (p_res) => {
                if (p_res.confirmed) {
                    api.post("get/setting/savemsg", (res) => {
                        if (res.result) {
                            saveMsg(res.datetime, res.msgList);
                        } else {
                            alert(res.msg);
                        }
                    });
                }
            });
        },
        chatmenu_msgdel: () => {
            popup.confirm({
                title: "메시지 삭제",
                msg: "모든 메시지를 삭제하시겠습니까?",
                btn_confirm: "삭제",
                btn_cancel: "취소"
            }, (p_res) => {
                if (p_res.confirmed) {
                    api.post("del/chatmenu/msgdel", (res) => {
                        if (res.result) {
                            alert(res.msg);

                            if (res.delMsgArr.length > 0) {
                                for (let i = 0; i < res.delMsgArr.length; i++) {
                                    const item = document.querySelector(`#chatSection .content .content_main .chat_msg li.msgData .msgList ul li[data-msgid="${res.delMsgArr[i]}"]`);
                                    item.remove();
                                }
                            } else {
                                const allItem = document.querySelectorAll(`#chatSection .content .content_main .chat_msg ul li.msgData`);
                                const allItem_2 = document.querySelectorAll(`#chatSection .content .content_main .chat_msg ul.list span.showDate`);
                                allItem.forEach((item) => {
                                    item.remove();
                                });
                                allItem_2.forEach((item) => {
                                    item.remove();
                                });
                            }
                        }
                    }, Object.freeze({
                        roomId: document.querySelector("#chatSection .content .content_main .chat_menu").dataset.roomid,
                        msgIdArr: []
                    }));
                }
            });
        },
        chatmenu_roomout: () => {
            popup.confirm({
                title: "채팅방 나가기",
                msg: "채팅방을 나가시면 채팅내용과 채팅방이 삭제됩니다.",
                btn_confirm: "나가기",
                btn_cancel: "취소"
            }, (p_res) => {
                if (p_res.confirmed) {
                    api.post("out/chatmenu/room", (res) => {
                        if (res.result) {
                            history.back();
                        } else {
                            alert(res.msg);
                        }
                    }, Object.freeze({
                        cid: document.querySelector("#chatSection .content .content_main .chat_menu").dataset.roomid
                    }));
                }
            });
        }
    }
    /* ==================== Socket ==================== */
    const socketConnect = setInterval(() => {
        if (socket) {
            clearInterval(socketConnect);
            socketStart();
        }
    }, 300);

    function socketStart() {
        socket.on("error", (msg) => {
            alert(msg);
        });
        socket.on("alert", (msg) => {
            alert(msg);
        });
        socket.on("res_chatMsg", (data) => {

            const privateList_badge = document.querySelector("#chatSection .header li.header_menu.header_menu_chatting span.badge");
            const privateMsgList_badge = document.querySelector("#chatSection .content .content_main .msglist_section ul.msgList");
            if (privateList_badge && pageInfo.roomId !== data.roomId) {
                privateList_badge.textContent = Number(privateList_badge.textContent) + 1;
                if (!privateList_badge.classList.contains('on')) privateList_badge.classList.add('on');
            }
            if (privateMsgList_badge && pageInfo.roomId !== data.roomId) {
                const privateMsgList_badge_span_1 = privateMsgList_badge.querySelector(`li.${data.roomId} .right_section span.msg_unread`);
                const privateMsgList_badge_span_2 = privateMsgList_badge.querySelector(`li.${data.roomId} .left_section span.msg_parts`);
                const privateMsgList_badge_span_3 = privateMsgList_badge.querySelector(`li.${data.roomId} .right_section span.msg_date`);
                if (privateMsgList_badge_span_1) {
                    privateMsgList_badge_span_1.textContent = Number(privateMsgList_badge_span_1.textContent) + 1;
                    if (!privateMsgList_badge_span_1.classList.contains('on')) privateMsgList_badge_span_1.classList.add('on');
                }
                if (privateMsgList_badge_span_2 && privateMsgList_badge_span_3) {
                    privateMsgList_badge_span_2.textContent = String(data.msg);
                    privateMsgList_badge_span_3.textContent = formatDateTime(data.datetime);

                    const liElement = privateMsgList_badge.querySelector(`li[data-roomid="${data.roomId}"]`);
                    if (liElement) {
                        privateMsgList_badge.prepend(liElement);
                    }

                }
                const privateMsgList_badge_span_4 = privateMsgList_badge.querySelector(`li.${data.roomId}`);
                if (!privateMsgList_badge_span_4) location.reload();
            }

            if (pageInfo.roomId === data.roomId) {
                msgUpdate([data], false);
                document.querySelector("#chatSection .content .content_main .chat_input textarea").value = "";
                document.querySelector("#chatSection .content .content_main .chat_input textarea").focus();
                api.post("set/chatview/unread", (res) => {
                    if (!res.result) alert(res.msg);
                }, Object.freeze({
                    roomId: data.roomId,
                    msgId: data.msgId
                }));
            }
        });
        socket.on("res_friend_request", (data) => {
            if (data.type === "mine") {
                alert(data.msg);
                renderFriend.request(data.list_1);
            } else {
                document.querySelector("#chatSection .content .content_title .content_title_menu div.content_title_menu_friend").classList.add('on');
                if (pageInfo.prePage === "friend") renderFriend.accept(data.list_2);
            }
        });
        socket.on("chatroom_update_res", (roomData) => {
            if (pageInfo.prePage === "chatview") {
                document.querySelector("#chatSection .content .content_main .chat_menu .left_menu .user_info .user_info_2 .user_info_nick").innerText = roomData.name;
                document.querySelector("#chatSection .content .content_main .chat_menu .left_menu .user_info .user_info_2 .user_info_2_1 .user_info_sm").innerText = Number(document.querySelector("#chatSection .content .content_main .chat_menu .left_menu .user_info .user_info_2 .user_info_2_1 .user_info_sm").innerText) + roomData.userCount;

                const existingImgElement = document.querySelector("#chatSection .content .content_main .chat_menu .left_menu .user_info .user_info_profile img");
                const parentElement = existingImgElement.parentElement;
                parentElement.removeChild(existingImgElement);
                const newImgElement = document.createElement('img');
                newImgElement.src = roomData.profile;
                newImgElement.alt = 'User Profile';

                newImgElement.onerror = function () {
                    this.onerror = null;
                    this.src = '/img/no_profile.gif';
                };

                parentElement.appendChild(newImgElement);
            } else if (pageInfo.prePage === "chatting") {
                location.reload();
            }
        });
        socket.on("join_room_req", (roomId) => {
            socket.emit("join_room_res", roomId);
        });

    }
});