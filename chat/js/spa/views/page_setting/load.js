const load = {
  page: (callback) => {
    api.post('get/page/setting', (result) => {
      if (result.result) {
        callback({
          html: rendering(result.data),
          title_ko: "설정",
          title_en: "setting",
          send_data: null
        });
      } else {
        callback({
          html: "",
          title_ko: "설정",
          title_en: "setting",
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
	      <div class="setting_section">
        <div class="setting_info drag_protection">
          <div data-click="setting|userinfo" class="myinfo">
            <div class="myinfo_left">
              <span class="myinfo_nick">${pageData.userNick}</span>
              <span class="myinfo_sm">${pageData.userSM}</span>
            </div>
            <div class="myinfo_right">
              <span>></span>
            </div>
          </div>
          <div data-click="setting|lockmode" class="lockmode">
            <span class="lockmode_title">잠금모드</span>
            <span class="lockmode_btn">></span>
          </div>
        </div>

        <div class="setting_savemsg">
          <subtitle>대화 저장</subtitle>
          <span class="subtitle_sm">대화 내용을 불러와 사용자의 로컬에 저장할 수 있습니다. 대화 내용은 텍스트만 저장됩니다.</span>
          <button data-click="setting|savemsg" class="drag_protection">저장 하기</button>
          <div class="setting_savemsg_info">
            <span class="setting_savemsg_info_title">최신 저장 정보</span>
            <div class="setting_savemsg_info_date">
              <span class="setting_savemsg_info_date_title">저장 일시</span>
              <span class="setting_savemsg_info_date_data">${pageData.backupDate ? pageData.backupDate : "-"}</span>
            </div>
            <div class="setting_savemsg_info_size">
              <span class="setting_savemsg_info_size_title">저장 개수</span>
              <span class="setting_savemsg_info_size_data">${pageData.backupCount ? pageData.backupCount : "-"}</span>
            </div>
          </div>
        </div>

        <div class="setting_displaymode">
          <subtitle>화면 모드</subtitle>
          <div class="displaymode_flex drag_protection">
            <div data-click="displaymode|light" class="lightmode">
              <div class="lightmode_view">
                <div class="lightmode_view_left"></div>
                <div class="lightmode_view_right"></div>
              </div>
              <span class="mode_text">라이트</span>
            </div>
            <div data-click="displaymode|dark" class="darkmode">
              <div class="darkmode_view">
                <div class="darkmode_view_left"></div>
                <div class="darkmode_view_right"></div>
              </div>
              <span class="mode_text">다크</span>
            </div>
          </div>
        </div>
      </div>
	`;
}

export default load;