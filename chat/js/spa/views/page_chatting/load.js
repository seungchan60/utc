const load = {
  page: (callback) => {
    api.post('get/page/roomlist', (result) => {
      if (result.result) {
        callback({
          html: rendering(result.list),
          title_ko: "대화방",
          title_en: "chatting",
          send_data: null
        });
      } else {
        callback({
          html: "",
          title_ko: "대화방",
          title_en: "chatting",
          send_data: null
        });
        alert(result.msg);
        if (result.replace) result.replace === "/" ? location.replace(result.replace) : history.back();
      }
    });
  },
}

const rendering = (pageData) => {
  const sortedPageData = pageData.sort((a, b) => {
    return new Date(b.recentMsgDatetime) - new Date(a.recentMsgDatetime);
  });

  return `
    <div class="searchBox">
      <input placeholder="채팅방 검색">
      <button data-click="listmenu|search_text">검색</button>
    </div>
    <div class="msglist_section drag_protection">
        <ul class="msgList">
        ${sortedPageData.length > 0
        ? sortedPageData.map(value => `
          <li href="./?page=chat&room=${value.roomId_c}" data-link data-roomid="${value.roomId}" class="${value.roomId}"><div class="left_section"><div class="user_profile"><img src="${value.roomImg}" alt="profile" onerror="this.onerror=null; this.src='/img/no_profile.gif';"></div><div class="user_info"><div class="user_info_1"><span class="nick">${value.roomName}</span>${value.roomType === "group" ? "<span class=\"connect_user\">"+value.roomUser+"</span>" : ""}</div><span class="msg_parts">${value.recentMsg ? value.recentMsg : "전송된 메시지가 없습니다."}</span></div></div><div class="right_section"><span class="msg_date">${getFormattedTime(value.recentMsgDatetime)}</span><span class="msg_unread ${value.unreadCount > 0 ? "on" : ""}">${value.unreadCount > 99 ? "+99" : value.unreadCount}</span></div></li>`).join('')
        : '<span class="nonedata">목록 없음</span>'}
        </ul>
      </div>
	`;
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

export default load;