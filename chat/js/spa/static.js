/* =========================================================== */
import index from './views/index.js';
import page_list from './views/page_list/index.js';
import page_friend from './views/page_friend/index.js';
import page_chatting from './views/page_chatting/index.js';
import page_openchat from './views/page_openchat/index.js';
import page_setting from './views/page_setting/index.js';
import page_chatview from './views/page_chatview/index.js';
/* =========================================================== */
const navigateTo = (url) => {
  history.pushState(null, null, url);
  router();
};

const router = async () => {
  const HTMLview = new index();

  HTMLview.getHtml().then((HTML) => {
    document.querySelector('body').innerHTML = HTML;
    const getDarkModeData = cookie.get('darkmode');
    if (getDarkModeData) document.getElementById('chatSection').setAttribute('darkmode', getDarkModeData);
    const url = new URL(window.location.href);
    const queryType = String(url.searchParams.get('page'));

    const routes = [{
        type: 'page_list',
        view: page_list,
      },
      {
        type: 'page_friend',
        view: page_friend,
      },
      {
        type: 'page_chatting',
        view: page_chatting,
      },
      {
        type: 'page_openchat',
        view: page_openchat,
      },
      {
        type: 'page_setting',
        view: page_setting,
      },
      {
        type: 'page_chatview',
        view: page_chatview,
      },
    ];

    const potentialMatches = (text) => {
      for (let i = 0; i < routes.length; i++) {
        if (routes[i].type === String(text)) {
          const view = new routes[i].view();
          view.getHtml().then((htmlData) => {
            if (htmlData.page.en !== 'chatview') pageInfo.roomId = null;
            socket_leaveRoom(htmlData.sendData);
            updatePageInfo(htmlData.page.en);
            checkMobileEnvironment();
            document.querySelector('#chatSection .content .content_title .content_title_h2 h2').textContent = htmlData.page.ko;
            document.querySelector('#chatSection .content .content_main').innerHTML = htmlData.html;
            if (htmlData.page.en === 'chatview') event_chatview(htmlData.msgList, htmlData.sendData);
            else document.querySelector('#chatSection .header').style.opacity = 1; //패치 예정
          });
          return;
        }
      }
    };

    if (queryType === 'list') potentialMatches('page_list');
    else if (queryType === 'friend') potentialMatches('page_friend');
    else if (queryType === 'chatting') potentialMatches('page_chatting');
    else if (queryType === 'openchat') potentialMatches('page_openchat');
    else if (queryType === 'setting') potentialMatches('page_setting');
    else if (queryType === 'chat') potentialMatches('page_chatview');
    else {
      history.pushState(null, null, './?page=list');
      potentialMatches('page_list');
    }
  });
};

window.addEventListener('popstate', router);

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', (e) => {
    if (e.target.matches('[data-link]')) {
      e.preventDefault();
      if (e.target.localName !== 'a') navigateTo(e.target.attributes[0].nodeValue);
      else navigateTo(e.target.href);
    }
  });

  router();
});