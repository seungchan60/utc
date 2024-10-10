<?php
include_once './_common.php';
if (!$is_member) {
  alert("로그인이 필요합니다.", G5_URL.'/bbs/login.php');
}
include_once G5_PATH.'/head.sub.php';

$userId = $member['mb_id'];

$sql = "SELECT userId, lockmode FROM chat_user WHERE userId = '".sql_real_escape_string($userId)."'";
$row = sql_fetch($sql);

if (!$row) {
  $currentDatetime = date('Y-m-d H:i:s');
  $insert_sql = "INSERT INTO chat_user (userId, datetime) VALUES ('".sql_real_escape_string($userId)."', '{$currentDatetime}')";
  sql_query($insert_sql);

  $row = sql_fetch($sql);
}

$hash_data = "asdwagasgasgahwawsaxczgzdgasegewgewrqweqweqweqwdasd"; //server폴더 config.js -> salt - hashkey값과 똑같아야 합니다!!!

$hash = hash('sha256', $member['mb_no'].",".$member['mb_id'].",".$member['mb_nick'].",".$member['mb_level'].",".$hash_data);
$var = 'const mbData = Object.freeze({userId: "'.$member['mb_id'].'", userNick: "'.$member['mb_nick'].'", userLevel: "'.$member['mb_level'].'", hash: btoa(unescape(encodeURIComponent("'.$member['mb_id'].'|'.$member['mb_nick'].'|'.$member['mb_level'].'_'.$hash.'")))})';
add_javascript('<script>'.$var.'</script>');
add_javascript('<script src="'.G5_URL.'/chat/js/restApi.js?ver=0.1"></script>');

if ($row['lockmode'] != 0) {
  add_javascript('<script src="'.G5_URL.'/chat/js/lockmode.js?ver=0.1"></script>');
} else {
  add_javascript('<script src="https://cdn.socket.io/4.7.1/socket.io.js"></script>');
  add_javascript('<script src="'.G5_URL.'/chat/js/connect.js?ver=0.1"></script>');
  add_javascript('<script src="'.G5_URL.'/chat/js/emoji.js?ver=0.1"></script>');
  add_javascript('<script src="'.G5_URL.'/chat/js/func.js?ver=0.1"></script>');
  add_javascript('<script src="'.G5_URL.'/chat/js/render.js?ver=0.1"></script>');
  add_javascript('<script src="'.G5_URL.'/chat/js/event.js?ver=0.1"></script>');
  add_javascript('<script type="module" src="'.G5_URL.'/chat/js/spa/static.js?ver=0.1"></script>');
  add_stylesheet('<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">');
  add_stylesheet('<link rel="stylesheet" href="'.G5_URL.'/chat/css/main.css?ver=0.1">');
}
?>

<script>
  function checkMobileEnvironment() {
    const chatSection = document.getElementById('chatSection');
    if(chatSection) {
      if (window.innerWidth <= 800) {
        if (chatSection.classList.contains('pc')) {
          chatSection.classList.remove('pc');
        }
        if (!chatSection.classList.contains('mobile')) {
          chatSection.classList.add('mobile');
        }
      } else {
        if (chatSection.classList.contains('mobile')) {
          chatSection.classList.remove('mobile');
        }
        if (!chatSection.classList.contains('pc')) {
          chatSection.classList.add('pc');
        }
      }
    }
  }

window.addEventListener('resize', checkMobileEnvironment);

  $(document).ready(function() {
    setInterval(function(){
        $.ajax({
            type: "POST",
            url: "/",
            dataType:"html"
        });
    }, 300000);
});
</script>

<?php
include_once G5_PATH.'/tail.sub.php';