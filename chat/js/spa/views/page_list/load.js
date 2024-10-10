const load = {
  page: (callback) => {
    api.post('get/page/list', (result) => {
      if (result.result) {
        callback({
          html: rendering(result.list),
          title_ko: "친구",
          title_en: "list",
          send_data: null
        });
      } else {
        callback({
          html: "",
          title_ko: "친구",
          title_en: "list",
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
    <div class="searchBox">
      <input placeholder="닉네임 검색">
      <button data-click="listmenu|search_text">검색</button>
    </div>
		<div class="list_myinfo drag_protection">
        <div class="head_profile">
          <img src="${pageData.myData.userProfile}" alt="profile" onerror="this.onerror=null; this.src='/img/no_profile.gif';">
        </div>
        <div class="head_user">
          <span class="nick">${pageData.myData.userNick}</span>
          <span class="sm">${pageData.myData.userSM}</span>
        </div>
      </div>
      <border class="border_bottom drag_protection"></border>

      <div class="list_favorites drag_protection">
        <h3>즐겨찾기</h3>
        <ul class="userList">
        ${pageData.favorites.length > 0
        ? pageData.favorites.map(value => `<li href="./?page=chat&room=${value.roomId}" data-link><div class="user_profile"><img src="${value.userProfile}" alt="profile" onerror="this.onerror=null; this.src='/img/no_profile.gif';"></div><div class="user_info"><span class="nick">${value.userNick}</span><span class="sm">${value.userSM}</span></div></li>`).join('')
        : '<span class="nonedata">목록 없음</span>'}
        </ul>
      </div>
      <border class="border_bottom drag_protection"></border>
      <div class="list_friend drag_protection">
        <h3>친구 ${pageData.all.length}</h3>
        <ul class="userList">
        ${pageData.all.length > 0
        ? pageData.all.map(value => `<li href="./?page=chat&room=${value.roomId}" data-link><div class="user_profile"><img src="${value.userProfile}" alt="profile" onerror="this.onerror=null; this.src='/img/no_profile.gif';"></div><div class="user_info"><span class="nick">${value.userNick}</span><span class="sm">${value.userSM}</span></div></li>`).join('')
        : '<span class="nonedata">목록 없음</span>'}
        </ul>
      </div>
	`;
}

export default load;