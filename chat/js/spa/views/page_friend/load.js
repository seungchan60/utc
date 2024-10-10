const load = {
  page: (callback) => {
    api.post('get/page/friend', (result) => {
      if (result.result) {
        callback({
          html: rendering(result.list),
          title_ko: "친구 요청",
          title_en: "friend",
          send_data: null
        });
      } else {
        callback({
          html: "",
          title_ko: "친구 요청",
          title_en: "friend",
          send_data: null
        });
        alert(result.msg);
        if (result.replace) result.replace === "/" ? location.replace(result.replace) : history.back();
      }
    });
  },
}

const rendering = (pageData) => {
  return `
                <div class="friend_section drag_protection">
                  <div class="friend_section_search">
                    <input placeholder="닉네임 검색">
                    <ul class="scrollhide"></ul>
                    <button data-click="friend|search">검색</button>
                  </div>
                  <div class="friend_section_req">
                    <subtitle>보낸 요청</subtitle>
                    <ul class="scrollhide">
        				${pageData.req.map(value => `<li><div class="left_section"><img src="${value.userProfile}" alt="프로필 이미지" onerror="this.onerror=null; this.src='/img/no_profile.gif';"><span class="left_section_nick">${value.userNick}</span></div><div class="right_section"><span data-click="cancle_friend|${value.userSid}">취소</span></div></li>`).join('')}
					          </ul>
                  </div>
                  <div class="friend_section_res">
                    <subtitle>받은 요청</subtitle>
                    <ul class="scrollhide">
						${pageData.res.map(value => `<li><div class="left_section"><img src="${value.userProfile}" alt="프로필 이미지" onerror="this.onerror=null; this.src='/img/no_profile.gif';"><span class="left_section_nick">${value.userNick}</span></div><div class="right_section"><span data-click="accept_friend|${value.userSid}">수락</span></div></li>`).join('')}
					          </ul>
                  </div>
                </div>
	`;
}

export default load;