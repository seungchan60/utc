const load = {
	page: (callback) => {
		// api.post('getpage', (result) => {
			callback({
				html: rendering(),
				title_ko: "오픈채팅",
				title_en: "openchat",
        send_data: null
			});
		// }, Object.freeze({
		// 	page: "openchat"
		// }));
	},
}

const rendering = (pageData) => {
	return `
	    <div class="msglist_section drag_protection">
        <ul class="msgList">
          <li data-cid="">
            <div class="left_section">
              <div class="user_profile">
                <img src="/img/no_profile.gif" alt="profile">
              </div>
              <div class="user_info">
                <span class="nick">테스트닉네임 <p class="connectnum">399</p></span>
                <span class="msg_parts">테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~테스트 메시지입니다~</span>
              </div>
            </div>
            <div class="right_section">
              <span class="msg_date">03월 06일</span>
              <span class="msg_unread">0</span>
            </div>
          </li>
        </ul>
      </div>
	`;
}

export default load;