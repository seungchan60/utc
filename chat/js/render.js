function msgUpdate_later(listData) {
    for (let i = 0; i < listData.length; i++) {
        if (i === 0) lastMsgId = listData[listData.length - 1].msgId;

        listData[i].datetime = listData[i].datetime.replace(/[- :]/g, '');
        const allList = document.querySelectorAll("#chatSection .content .content_main .chat_msg ul.list li.msgData");
        const ulList = allList[allList.length - 1];

        const li_className = ulList ? Array.from(ulList.classList)[1] : null; //마지막 데이터의 타입
        const liDateD_recent = ulList ? ulList.getAttribute('data-msgdate') : null;
        const liDateP_recent = ulList ? { //마지막 데이터의 날짜
            all: liDateD_recent,
            date: liDateD_recent.slice(0, 12),
            md: liDateD_recent.substring(0, 8),
            hm: `${liDateD_recent.slice(8, 10)}:${liDateD_recent.slice(10, 12)}`,
            datetime: `${liDateD_recent.slice(0, 4)}년 ${liDateD_recent.slice(4, 6)}월 ${liDateD_recent.slice(6, 8)}일`
        } : null
        let ul = "";
        let li = "";

        if (i !== 0 && i < listData.length - 1) {
            const previously = listData[i].datetime.substring(0, 8);
            const recent = listData[i + 1].datetime.replace(/[- :]/g, '').substring(0, 8);
            if (previously !== recent) {
                document.querySelector("#chatSection .content .content_main .chat_msg ul.list").insertAdjacentHTML("beforeend", msgHTML.datetime(`${listData[i].datetime.slice(0, 4)}년 ${listData[i].datetime.slice(4, 6)}월 ${listData[i].datetime.slice(6, 8)}일`));
            }
        }

        const ulElement = document.querySelector("#chatSection .content .content_main .chat_msg ul.list");
        const allChildElements = ulElement.children;
        const lastChildElement = allChildElements[allChildElements.length - 1];
        const lastChildTagName = lastChildElement.tagName.toLowerCase();

        if (i === 0 && lastChildTagName === "span") {
            if (lastChildElement.getAttribute('data-datetime') === listData[i].datetime.slice(0, 8)) lastChildElement.remove();
        }

        if (listData[i].type === li_className) { //최신 데이터가 타입이 같을때
            if (liDateP_recent.date === listData[i].datetime.slice(0, 12)) { //날짜가 같을때 생성된 li태그에 추가
                if (listData[i].type === "mine") {
                    li = msgHTML.mine_li({
                        msgId: listData[i].msgId,
                        date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                        msg: listData[i].msg
                    });
                    ulList.querySelector(".msgList ul").insertAdjacentHTML("afterbegin", li);
                } else {
                    li = msgHTML.other_li({
                        msgId: listData[i].msgId,
                        date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                        msg: listData[i].msg
                    });
                    ulList.querySelector(".msgList ul").insertAdjacentHTML("afterbegin", li);
                }
            } else { //날짜가 다를때 새로운 li태그 생성
                if (listData[i].type === "mine") { //타입이 다를때 mine 메시지타입으로 새로운 li생성
                    li = msgHTML.mine_li({
                        msgId: listData[i].msgId,
                        date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                        msg: listData[i].msg
                    });
                    ul = msgHTML.mine_ul({
                        date_all: listData[i].datetime,
                        liHTML: li
                    });
                } else { //타입이 다를때 other 메시지타입으로 새로운 li생성
                    li = msgHTML.other_li({
                        msgId: listData[i].msgId,
                        date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                        msg: listData[i].msg
                    });
                    ul = msgHTML.other_ul({
                        date_all: listData[i].datetime,
                        userProfile: listData[i].sender.senderProfile,
                        userNick: listData[i].sender.senderNick,
                        liHTML: li
                    });
                }
                document.querySelector("#chatSection .content .content_main .chat_msg ul.list").insertAdjacentHTML("beforeend", ul);
            }
        } else { //최신 데이터가 타입이 다를때
            if (listData[i].type === "mine") { //타입이 다를때 mine 메시지타입으로 새로운 li생성
                li = msgHTML.mine_li({
                    msgId: listData[i].msgId,
                    date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                    msg: listData[i].msg
                });
                ul = msgHTML.mine_ul({
                    date_all: listData[i].datetime,
                    liHTML: li
                });
            } else { //타입이 다를때 other 메시지타입으로 새로운 li생성
                li = msgHTML.other_li({
                    msgId: listData[i].msgId,
                    date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                    msg: listData[i].msg
                });
                ul = msgHTML.other_ul({
                    date_all: listData[i].datetime,
                    userProfile: listData[i].sender.senderProfile,
                    userNick: listData[i].sender.senderNick,
                    liHTML: li
                });
            }
            document.querySelector("#chatSection .content .content_main .chat_msg ul.list").insertAdjacentHTML("beforeend", ul);
        }

        if ((i + 1) === listData.length) {
            document.querySelector("#chatSection .content .content_main .chat_msg ul.list").insertAdjacentHTML("beforeend", msgHTML.datetime(`${listData[i].datetime.slice(0, 4)}년 ${listData[i].datetime.slice(4, 6)}월 ${listData[i].datetime.slice(6, 8)}일`));
            scrollableDiv = document.querySelector('#chatSection .content .content_main .chat_msg ul.list');
        }
    }
}

function msgUpdate(listData, isGetList) { //메시지 추가
    listData = listData.reverse();

    for (let i = 0; i < listData.length; i++) {
        if (i === 0 && isGetList) lastMsgId = listData[0].msgId;

        listData[i].datetime = listData[i].datetime.replace(/[- :]/g, '');
        const ulList = document.querySelector("#chatSection .content .content_main .chat_msg ul.list li"); //가장 최신 데이터 추출
        const li_className = ulList ? Array.from(ulList.classList)[1] : null; //최신 데이터의 타입
        const liDateD_recent = ulList ? ulList.getAttribute('data-msgdate') : null;
        const liDateP_recent = ulList ? { //최신데이터의 날짜
            all: liDateD_recent,
            date: liDateD_recent.slice(0, 12),
            md: liDateD_recent.substring(0, 8),
            hm: `${liDateD_recent.slice(8, 10)}:${liDateD_recent.slice(10, 12)}`,
            datetime: `${liDateD_recent.slice(0, 4)}년 ${liDateD_recent.slice(4, 6)}월 ${liDateD_recent.slice(6, 8)}일`
        } : null
        let ul = "";
        let li = "";

        if (i === 0 && !ulList) {
            document.querySelector("#chatSection .content .content_main .chat_msg ul.list").insertAdjacentHTML("afterbegin", msgHTML.datetime(`${listData[0].datetime.slice(0, 4)}년 ${listData[0].datetime.slice(4, 6)}월 ${listData[0].datetime.slice(6, 8)}일`));
        } else {
            if (i !== 0) {
                const previously = listData[i - 1].datetime.substring(0, 8);
                const recent = listData[i].datetime.substring(0, 8);
                if (previously !== recent) {
                    document.querySelector("#chatSection .content .content_main .chat_msg ul.list").insertAdjacentHTML("afterbegin", msgHTML.datetime(`${listData[i].datetime.slice(0, 4)}년 ${listData[i].datetime.slice(4, 6)}월 ${listData[i].datetime.slice(6, 8)}일`));
                }
            }
        }

        if (listData[i].type === li_className) { //최신 데이터가 타입이 같을때
            if (liDateP_recent.date === listData[i].datetime.slice(0, 12)) { //날짜가 같을때 생성된 li태그에 추가
                if (listData[i].type === "mine") {
                    li = msgHTML.mine_li({
                        msgId: listData[i].msgId,
                        date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                        msg: listData[i].msg,
                        msgType: listData[i].msgType,
                        fileData: listData[i].fileData
                    });
                    ulList.querySelector(".msgList ul").insertAdjacentHTML("beforeend", li);
                } else {
                    li = msgHTML.other_li({
                        msgId: listData[i].msgId,
                        date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                        msg: listData[i].msg,
                        msgType: listData[i].msgType,
                        fileData: listData[i].fileData
                    });
                    ulList.querySelector(".msgList ul").insertAdjacentHTML("beforeend", li);
                }
            } else { //날짜가 다를때 새로운 li태그 생성
                if (listData[i].type === "mine") { //타입이 다를때 mine 메시지타입으로 새로운 li생성
                    li = msgHTML.mine_li({
                        msgId: listData[i].msgId,
                        date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                        msg: listData[i].msg,
                        msgType: listData[i].msgType,
                        fileData: listData[i].fileData
                    });
                    ul = msgHTML.mine_ul({
                        date_all: listData[i].datetime,
                        liHTML: li
                    });
                } else { //타입이 다를때 other 메시지타입으로 새로운 li생성
                    li = msgHTML.other_li({
                        msgId: listData[i].msgId,
                        date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                        msg: listData[i].msg,
                        msgType: listData[i].msgType,
                        fileData: listData[i].fileData
                    });
                    ul = msgHTML.other_ul({
                        date_all: listData[i].datetime,
                        userProfile: listData[i].sender.senderProfile,
                        userNick: listData[i].sender.senderNick,
                        liHTML: li
                    });
                }
                document.querySelector("#chatSection .content .content_main .chat_msg ul.list").insertAdjacentHTML("afterbegin", ul);
            }
        } else { //최신 데이터가 타입이 다를때
            if (listData[i].type === "mine") { //타입이 다를때 mine 메시지타입으로 새로운 li생성
                li = msgHTML.mine_li({
                    msgId: listData[i].msgId,
                    date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                    msg: listData[i].msg,
                    msgType: listData[i].msgType,
                    fileData: listData[i].fileData
                });
                ul = msgHTML.mine_ul({
                    date_all: listData[i].datetime,
                    liHTML: li
                });
            } else { //타입이 다를때 other 메시지타입으로 새로운 li생성
                li = msgHTML.other_li({
                    msgId: listData[i].msgId,
                    date_hm: `${listData[i].datetime.slice(8, 10)}:${listData[i].datetime.slice(10, 12)}`,
                    msg: listData[i].msg,
                    msgType: listData[i].msgType,
                    fileData: listData[i].fileData
                });
                ul = msgHTML.other_ul({
                    date_all: listData[i].datetime,
                    userProfile: listData[i].sender.senderProfile,
                    userNick: listData[i].sender.senderNick,
                    liHTML: li
                });
            }
            document.querySelector("#chatSection .content .content_main .chat_msg ul.list").insertAdjacentHTML("afterbegin", ul);
        }

        if ((i + 1) === listData.length) {
            scrollableDiv = document.querySelector('#chatSection .content .content_main .chat_msg ul.list');
        }
    }

}

const msgHTML = {
    mine_ul: (data) => {
        const html = `
        <li class="msgData mine" data-msgdate="${data.date_all}">
            <div class="msgList">
                <ul>${data.liHTML}</ul>
            </div>
        </li>
        `;
        return html;
    },
    mine_li: (data) => {
        const html = `
        <li data-msgid="${data.msgId}" data-rclick="msgf|${data.msgId}">
            <span class="datetime">${data.date_hm}</span>
            ${data.msgType === "file"
            ? data.fileData.fileType === "img"
                ? "<pre><img src=\""+serverInfo.host+":"+String(serverInfo.port)+"/file/"+data.fileData.filePath+"\"></img></pre>"
                : '<pre><svg class="msgFile drag_protection" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 288c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128z"/></svg><span data-click="downloadFile|'+data.msgId+'" class="msgFile_span drag_protection" data-file="'+data.fileData.filePath+'">'+data.fileData.fileName+'</span></pre>'
            : "<pre>" + data.msg + "</pre>"}
            <svg class="msg_right_r" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" style="display: inline; pointer-events: auto;">
                <path d="M310.6 246.6l-127.1 128C176.4 380.9 168.2 384 160 384s-16.38-3.125-22.63-9.375l-127.1-128C.2244 237.5-2.516 223.7 2.438 211.8S19.07 192 32 192h255.1c12.94 0 24.62 7.781 29.58 19.75S319.8 237.5 310.6 246.6z" style="pointer-events: auto;"></path>
            </svg>
        </li>
        `;
        return html;
    },
    other_ul: (data) => {
        const html = `
        <li class="msgData other" data-msgdate="${data.date_all}">
            <div class="user_info_1">
                <img src="${data.userProfile}" alt="유저 프로필" onerror="this.onerror=null; this.src='/img/no_profile.gif';">
            </div>
            <div class="user_info_2">
                <span class="user_nick">${data.userNick}</span>
                <div class="msgList">
                    <ul>${data.liHTML}</ul>
                </div>
            </div>
        </li>
        `;
        return html;
    },
    other_li: (data) => {
        const html = `
        <li data-msgid="${data.msgId}" data-rclick="msgf|${data.msgId}">
            <svg class="msg_right_r" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" style="display: inline; pointer-events: auto;">
                <path d="M310.6 246.6l-127.1 128C176.4 380.9 168.2 384 160 384s-16.38-3.125-22.63-9.375l-127.1-128C.2244 237.5-2.516 223.7 2.438 211.8S19.07 192 32 192h255.1c12.94 0 24.62 7.781 29.58 19.75S319.8 237.5 310.6 246.6z" style="pointer-events: auto;"></path>
            </svg>
            ${data.msgType === "file"
            ? data.fileData.fileType === "img"
                ? "<pre><img src=\""+serverInfo.host+":"+String(serverInfo.port)+"/file/"+data.fileData.filePath+"\"></img></pre>"
                : '<pre><svg class="msgFile drag_protection" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 288c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128z"/></svg><span data-click="downloadFile|'+data.msgId+'" class="msgFile_span drag_protection" data-file="'+data.fileData.filePath+'">'+data.fileData.fileName+'</span></pre>'
            : "<pre>" + data.msg + "</pre>"}
            <span class="datetime">${data.date_hm}</span>
        </li>
        `;
        return html;
    },
    datetime: (data) => {
        const html = `
        <span class="showDate" data-datetime="${data.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|\s]/g, '')}">${data}</span>
        `;
        return html;
    }
}

const renderFriend = {
    search: (data) => {
        const adHTML = document.querySelector("#chatSection .content .content_main .friend_section .friend_section_search ul");
        adHTML.innerHTML = '';
        for (let i = 0; i < data.length; i++) {
            const html = `<li><div class="left_section"><img src="${data[i].userProfile}" alt="프로필 이미지" onerror="this.onerror=null; this.src='/img/no_profile.gif';"><span class="left_section_nick">${data[i].userNick}</span></div><div class="right_section"><span data-click="request_friend|${data[i].userSid}">요청</span></div></li>`;
            adHTML.insertAdjacentHTML("beforeend", html);
        }
        if (data.length <= 0) adHTML.innerHTML = '<span class="nonedata">검색 목록이 없습니다.</span>';
    },
    request: (data) => {
        const adHTML = document.querySelector("#chatSection .content .content_main .friend_section .friend_section_req ul");
        const html = `<li><div class="left_section"><img src="${data[0].userProfile}" alt="프로필 이미지" onerror="this.onerror=null; this.src='/img/no_profile.gif';"><span class="left_section_nick">${data[0].userNick}</span></div><div class="right_section"><span data-click="cancle_friend|${data[0].userSid}">취소</span></div></li>`;
        adHTML.insertAdjacentHTML("beforeend", html);
    },
    accept: (data) => {
        const adHTML = document.querySelector("#chatSection .content .content_main .friend_section .friend_section_res ul");
        const html = `<li><div class="left_section"><img src="${data[0].userProfile}" alt="프로필 이미지" onerror="this.onerror=null; this.src='/img/no_profile.gif';"><span class="left_section_nick">${data[0].userNick}</span></div><div class="right_section"><span data-click="accept_friend|${data[0].userSid}">수락</span></div></li>`;
        adHTML.insertAdjacentHTML("beforeend", html);
    }
}

const popup = {
    input: (data, callback) => {
        if (document.querySelector('.popup-overlay')) return;
        if (!data.title || !data.msg || !data.placehorder || !data.btn_confirm || !data.btn_cancel) return;

        const overlay = document.createElement('div');
        overlay.className = 'popup-overlay';
        const popup = document.createElement('div');
        popup.className = 'popup-content';
        const title = document.createElement('h2');
        title.textContent = data.title;
        const text = document.createElement('p');
        text.textContent = data.msg;
        const input = document.createElement('input');
        input.placeholder = data.placehorder;
        const buttons = document.createElement('div');
        buttons.className = 'popup-buttons';
        const confirmButton = document.createElement('button');
        confirmButton.className = 'confirm';
        confirmButton.textContent = data.btn_confirm;
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel';
        cancelButton.textContent = data.btn_cancel;

        confirmButton.addEventListener('click', () => {
            callback({
                confirmed: true,
                msg: input.value
            });
            document.querySelector("#chatSection").removeChild(overlay);
        });
        cancelButton.addEventListener('click', () => {
            callback({
                confirmed: false
            });
            document.querySelector("#chatSection").removeChild(overlay);
        });

        buttons.appendChild(cancelButton);
        buttons.appendChild(confirmButton);
        popup.appendChild(title);
        popup.appendChild(text);
        popup.appendChild(input);
        popup.appendChild(buttons);
        overlay.appendChild(popup);
        document.querySelector("#chatSection").appendChild(overlay);
    },
    confirm: (data, callback) => {
        if (document.querySelector('.popup-overlay')) return;
        if (!data.title || !data.msg || !data.btn_confirm || !data.btn_cancel) return;

        const overlay = document.createElement('div');
        overlay.className = 'popup-overlay';
        const popup = document.createElement('div');
        popup.className = 'popup-content';
        const title = document.createElement('h2');
        title.textContent = data.title;
        const text = document.createElement('p');
        text.textContent = data.msg;
        const buttons = document.createElement('div');
        buttons.className = 'popup-buttons';
        const confirmButton = document.createElement('button');
        confirmButton.className = 'confirm';
        confirmButton.textContent = data.btn_confirm;
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel';
        cancelButton.textContent = data.btn_cancel;

        confirmButton.addEventListener('click', () => {
            callback({
                confirmed: true
            });
            document.querySelector("#chatSection").removeChild(overlay);
        });
        cancelButton.addEventListener('click', () => {
            callback({
                confirmed: false
            });
            document.querySelector("#chatSection").removeChild(overlay);
        });

        buttons.appendChild(cancelButton);
        buttons.appendChild(confirmButton);
        popup.appendChild(title);
        popup.appendChild(text);
        popup.appendChild(buttons);
        overlay.appendChild(popup);
        document.querySelector("#chatSection").appendChild(overlay);
    },
    invite_room: (data, callback) => {
        if (document.querySelector('.popup-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'popup-overlay';
        const popup = document.createElement('div');
        popup.className = 'popup-content popup-invite drag_protection';
        const title = document.createElement('h2');
        title.textContent = '사용자 초대';
        const userList = document.createElement('ul');
        userList.className = 'user-list';

        data.forEach(user => {
            const div_1 = document.createElement('div');
            div_1.className = 'se_1';
            const div_2 = document.createElement('div');
            div_2.className = 'se_2';
            const listItem = document.createElement('li');
            listItem.className = 'user-item';

            const imgElement = document.createElement('img');
            imgElement.src = user.userProfile;
            imgElement.alt = 'User Profile';
            imgElement.onerror = function() {
                this.onerror = null;
                this.src = '/img/no_profile.gif';
            };

            const label = document.createElement('label');
            label.textContent = user.userNick;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = user.userId;
            checkbox.className = 'user-checkbox';

            const text = document.createElement('span');
            text.textContent = "참가 중";
            text.className = 'chk-joinroom';

            
            div_1.appendChild(imgElement);
            div_1.appendChild(label);
            user.isJoinRoom === false ? div_2.appendChild(checkbox) : div_2.appendChild(text);
            listItem.appendChild(div_1);
            listItem.appendChild(div_2);
            userList.appendChild(listItem);
        });

        const buttons = document.createElement('div');
        buttons.className = 'popup-buttons';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel';
        cancelButton.textContent = '취소';

        const inviteButton = document.createElement('button');
        inviteButton.className = 'invite';
        inviteButton.textContent = '초대';

        cancelButton.addEventListener('click', () => {
            callback({
                confirmed: false
            });

            document.querySelector("#chatSection").removeChild(overlay);
        });

        inviteButton.addEventListener('click', () => {
            const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
            const selectedUserIds = Array.from(checkedBoxes).map(box => box.value);

            callback({
                confirmed: true,
                invited: selectedUserIds
            });

            document.querySelector("#chatSection").removeChild(overlay);
        });

        buttons.appendChild(cancelButton);
        buttons.appendChild(inviteButton);
        popup.appendChild(title);
        popup.appendChild(userList);
        popup.appendChild(buttons);
        overlay.appendChild(popup);

        document.querySelector("#chatSection").appendChild(overlay);
    }
}