document.addEventListener("DOMContentLoaded", () => {
    const style = `
    <style>
        input[type=text],input[type=password], textarea, select {border: 0px !important; outline: none;}
        input[type=text]:focus,input[type=password]:focus,textarea:focus,select:focus {-webkit-box-shadow:none !important; box-shadow: none !important; border: 0 !important;}
        .pop_unlock {display: flex; position: fixed; top: 0; width: 100%; height: 100%; z-index: 1000; flex-direction: column; justify-content: center; align-items: center; background: #ffe20c;}
        .pop_unlock img {width: 100px; height: 100px; border-radius: 30px; margin-bottom: 15px;}
        .pop_unlock .span_1 {font-size: 17px; margin-bottom: 15px;}
        .pop_unlock .span_2 {font-weight: bold; font-size: 20px; margin-bottom: 15px;}
        .pop_unlock .pass {display: block; padding: 10px 15px; width: 150px;}
        .pop_unlock .b {width: 150px; background: #f4f4f4; border: 1px solid #e2c90c; text-align: center; padding: 10px 0px; margin-top: 5px; border-radius: 4px; color: #a9a9a9;}
        .pop_unlock.on > .b {background: #322924; color: white; border: 1px solid #1f1817; cursor: pointer;}
    </style>
    `;
    const HTML = `
    <div class="pop_unlock">
        <img src="/data/member_image/${mbData.userId.substring(0, 2)}/${mbData.userId}.gif" onerror="this.onerror=null; this.src='/img/no_profile.gif';"/ alt="profile_image">
        <span class="span_1">${mbData.userNick}</span>
        <span class="span_2">잠금모드 상태입니다.</span>
        <input class="pass" type="password" name="pass" placeholder="비밀번호">
        <span class="b no_drag">확인</span>
    </div>
    `;
    document.querySelector('body').innerHTML = style + HTML;

    $(".pop_unlock input").on("propertychange change keyup paste input", function () {
        const msg = $(this).val();
        if (msg.length > 4) {
            $(this).val(msg.slice(0, 4))
        }
        if (msg.length === 4) {
            $('.pop_unlock').addClass('on');
        } else {
            $(".pop_unlock").removeClass('on');
        }
    });

    $(".pop_unlock input").keydown(function (key) {
        if (key.keyCode == 13) {
            if ($('.pop_unlock input').val().length === 4) {
                const msg = $('.pop_unlock input').val();
                api.post("chk/lockmode", (data) => {
                    if (data.result) {
                        location.reload();
                    } else {
                        alert(data.msg);
                    }
                }, Object.freeze({
                    pass: msg
                }));
            }
        }
    });
    $(".pop_unlock .b").click(function () {
        if ($('.pop_unlock input').val().length === 4) {
            const msg = $('.pop_unlock input').val();
            api.post("chk/lockmode", (data) => {
                if (data.result) {
                    location.reload();
                } else {
                    alert(data.msg);
                }
            }, Object.freeze({
                pass: msg
            }));
        }
    });
});