const cookie = {
    set: (name, value, days) => {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    },
    get: (name) => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            const c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },
    del: (name) => {
        document.cookie = name + '=; Max-Age=-99999999;';
    }
}

function chkFriendNotification() {
    const liTag = document.querySelectorAll("#chatSection .content .content_main .friend_section .friend_section_res ul li").length;
    if (liTag <= 0) {
        const chkDot = document.querySelector("#chatSection .content .content_title .content_title_menu .content_title_menu_friend");
        if (chkDot.classList.contains('on')) {
            chkDot.classList.remove('on');
        }
    }
}

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${month}월 ${day}일`;
}

function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 날짜 비교 및 포맷팅
function getFormattedTime(givenDateS) {
    if (!givenDateS) return "-";
    const givenDate = new Date(givenDateS.replace(/-/g, '/'));
    const now = new Date();

    const givenDateOnly = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (givenDateOnly.getTime() === nowDateOnly.getTime()) {
        return formatTime(givenDate);
    } else {
        return formatDate(givenDate);
    }
}

function formatDateTime(dateTimeStr) {
    const year = dateTimeStr.substring(0, 4);
    const month = dateTimeStr.substring(4, 6);
    const day = dateTimeStr.substring(6, 8);
    const hour = dateTimeStr.substring(8, 10);
    const minute = dateTimeStr.substring(10, 12);
    const second = dateTimeStr.substring(12, 14);

    return getFormattedTime(`${year}-${month}-${day} ${hour}:${minute}:${second}`);
}

function saveToFile_Chrome(fileName, content) {
    const blob = new Blob([content], {
        type: 'text/plain'
    });
    objURL = window.URL.createObjectURL(blob);

    if (window.__Xr_objURL_forCreatingFile__) {
        window.URL.revokeObjectURL(window.__Xr_objURL_forCreatingFile__);
    }
    window.__Xr_objURL_forCreatingFile__ = objURL;
    var a = document.createElement('a');
    a.download = `chat_msg_${fileName}`;
    a.href = objURL;
    a.click();
}

function saveToFile_IE(fileName, content) {
    const blob = new Blob([content], {
        type: "text/plain",
        endings: "native"
    });
    window.navigator.msSaveBlob(blob, `chat_msg_${fileName}`);
}

function isIE() {
    return (navigator.appName === 'Netscape' && navigator.userAgent.search('Trident') !== -1) ||
        navigator.userAgent.toLowerCase().indexOf("msie") !== -1;
}

function saveMsg(fileName, content) {
    let msg = ``;
    for (let i = 0; i < content.length; i++) {
        msg += `msgId: ${content[i].msgId} | msg: ${content[i].msg} | date: ${content[i].datetime}\n`;
        if ((i + 1) === content.length) {
            if (isIE()) {
                saveToFile_IE(fileName, msg);
            } else {
                saveToFile_Chrome(fileName, msg);
            }
        }
    }
}