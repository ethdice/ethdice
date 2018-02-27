var M = {
    roomDetail: {}
    , getParameter: function(name) {  
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");  
        var r = window.location.search.substr(1).match(reg);  
        if (r != null)  
            return unescape(r[2]);  
        return null;  
    }
    , undoList: []
    , curHotListLength: 0 //当前取得房间数的总和
    , loading: true //是否正在取数据
    , rate: 0
    , isAnim: true//是否动画 
    , isRandomOverFirst: false //第一次加载页面时random是否over
    , scroll: null
    , animNum: 0 //定时器计数
    , room: null
    , getRate: function(callback){
        $.get('https://blockchain.ijinshan.com/price/single?from=ETH&to=USD', function(rate){
            callback(rate.data.rate);
        })
    }
    , animDice: function(room){
        var i = 0
            , timer = null
            , room = M.roomDetail
            ;
        function startAnim(){
            i++;
            if(i == 7){
                i = 1;
                M.animNum++;
            }
            $('.dice-play').css('backgroundImage', 'url(images/'+ i +'.png?v=1)');
            room = M.roomDetail;
            if(!M.isAnim && M.isRandomOverFirst){//动画结束 
                clearTimeout(timer);
                timer = null;
                $('.btn-roll').removeClass('disabled').hide();
                $('.wrap').addClass('result');
                $('.gameover-box').show()
                M.renderRoom(room);
            }else{//正在动画
                // console.log('animation')
                timer = setTimeout(startAnim, 100);
                if(M.animNum >= 5){
                    console.log('animNum:' + M.animNum)
                    M.animNum = 0;
                    console.log(room)
                    //waiting random
                    if(room.diceList.length < room.numAllow){
                        M.getRoomDetail(room.roomId);
                    //random is over
                    }else{
                        M.isAnim = false;
                    }
                }
            }


        }
        startAnim();
    }

    , formateRoomList: function(data){
        var list = [];
        $.each(data, function(i, ele){
            if(ele.c[0] != 0){
                list.push(ele.c[0])
            }
        })
        return list;
        
    }
    , formateRoomData: function(data, roomId){
        var room = {};
        room.roomId = roomId;//应有人数
        room.numAllow = data[0]['c'][0];//应有人数
        room.chip = parseFloat(web3.fromWei((data[1]).toNumber(), 'ether')); //赌注
        room.numReal = data[2]['c'][0];//实际人数 
        room.diceList = M.formateRoomList(data[3]);//dice的值
        room.playerList = data[4];//player id list
        room.playerWinPrice = [];//player win price
        room.playerPerWin = parseFloat(web3.fromWei((data[6]).toNumber(), 'ether')); // per player win 

        for (var i = 0; i < data[5].length; i++) {
            room.playerWinPrice.push(parseFloat(web3.fromWei(data[5][i].toNumber(), 'ether')))
        }


        return room;        
    }
    , sortList : function(list){
        list.sort(function(x, y){
            return y.roomId - x.roomId;
        })
        return list;

    }
    , getList: function(num){
        App.getUnfinishedRoomIDs( num, function(r, roomIdList){  //startId 从0开始
            var roomId = 0
                , list = []
                ;
            if(r == 1){
                roomIdList = M.formateRoomList(roomIdList);
                // console.log(roomIdList)
                M.undoList = list;
                 
                $.each(roomIdList, function(i, roomId){
                    //获取房间详细数据
                    App.getRoomData(roomId, function(r, d){
                        if(r == 1){
                            list.push(M.formateRoomData(d, roomId));
                            if(list.length == roomIdList.length){

                                M.renderUndoList(M.sortList(list));
                                console.log(list)
                            }
                        }
                    })
                })
            }
           
        })
    }
    , getHotList: function(index, callback){
        //index 起始id的索引 
        App.getFinishedRoomIDs(index, function(r, roomIdList){
            var roomId = 0
                , list = []
                ;
            if(r == 1){
                roomIdList = M.formateRoomList(roomIdList);
                
                M.curHotListLength += roomIdList.length;

                console.log(roomIdList)
                
                callback();
                
                $.each(roomIdList, function(i, roomId){
                    //获取房间详细数据
                    App.getRoomData(roomId, function(r, d){
                        if(r == 1){
                            // console.log(M.formateRoomData(d, roomId));

                            list.push(M.formateRoomData(d, roomId));
                            if(list.length == roomIdList.length){
                                M.renderHotList(M.sortList(list));
                                
                                M.loading = false;

                            }
                        }
                    })
                })
                
            }
           
        })
       
    }
    , bottomDistance: function() {
        var pageHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight);
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0;
        var scrollHeight = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        return pageHeight - viewportHeight - scrollHeight < 20;
    }
    , scrollLoad: function(){
        if (M.bottomDistance()) {
            if (!M.loading) {
                M.loading = true;
                M.getHotList(M.curHotListLength, function(){
                    // console.log('getHotlist:' + M.curHotListLength)
                })
            }
        }
    }
    , renderUndoList: function(list){
        var html = ''
            , imgList = []
            , imgSrc = ''
            , strIcon = ''
            ;
        for(var i=0; i<list.length; i++){
            imgList = [];
            for(var j=0; j<list[i]['numAllow']; j++){
                imgSrc = M.generateAdva(list[i].playerList[j]);
                if(j <= list[i]['numReal']-1){
                    if(account == list[i].playerList[j]){
                        strIcon = '<i class="icon-me">me</i>'
                    }else{
                        strIcon = ''
                    }
                    imgList.push('<span class="item"><span class="img-wrap"><img src="'+ imgSrc +'" /></span>'+ strIcon +'</span>');
                }else{
                    imgList.push('<span class="item item-def"><span class="img-wrap default"><img src="images/default.png" /></span></span>');
                }

            }
            html += '<li>'+
                '<div class="game-top clear"><span class="game-number">NO. '+ list[i]["roomId"] +'</span><span class="game-count">'+ list[i]["numReal"] +'/'+ list[i]["numAllow"] +'</span></div>'+
                '<div class="game-adva clear">'+ imgList.join('') + '</div>'+
                '<div class="game-btm clear">'+
                    '<span class="game-money"><span class="eth">'+ list[i]["chip"].toFixed(5) +'</span> ETH/ $<span class="usd"></span></span>'+
                    '<a href="play.html?roomid='+ list[i]["roomId"] +'" class="btn btn-join">JOIN</a>'+
                '</div>'+
            '</li>';
        }
        $('.list-undone').html(html);

    }
    , renderHotList: function(list){
        var html = ''
            , imgList = []
            , maxDice = 0
            , strIcon = ''
            , strTrangleList = []
            , imgSrc = ''
            , winChip = ''
            , numWin = 0
            ;
        for(var i=0; i<list.length; i++){
            list[i].diceList = list[i].diceList.splice(0, list[i].numAllow)
            maxDice = M.getMaxDice(list[i].diceList);
            imgList = [];
            strTrangleList = [];
            numWin = 0;
            for(var j=0; j<list[i]['numAllow']; j++){
                imgSrc = M.generateAdva(list[i].playerList[j]);
                if(maxDice == list[i]['diceList'][j]){
                    numWin ++;
                    strIcon = '<i class="icon-crown"></i>';
                    strTrangleList.push('<i class="icon icon'+ (j+1) +'"></i>');
                }else{
                    strIcon = '';
                }
                if(account == list[i]['playerList'][j]){
                    strIcon += '<i class="icon-me">me</i>'
                }
                imgList.push('<span class="item"><span class="img-wrap"><img src="'+ imgSrc +'" /></span>'+ strIcon +'</span>');
            }
            winChip = (list[i].chip*list[i].numAllow/numWin - list[i].chip).toFixed(5);
            html += '<li><a href="play.html?roomid='+ list[i].roomId +'">'+
                '<div class="game-top clear"><span class="game-number">NO. '+ list[i]["roomId"] +'</span><span class="game-count">'+ list[i]["numAllow"] +'</span></div>'+
                '<div class="game-adva clear">'+ imgList.join('') + '</div>'+
                '<div class="game-btm clear">'+
                    '<span class="game-money">win <span class="eth">'+ winChip +'</span> ETH/ $<span class="usd"></span>'+ strTrangleList.join('') +  '</span>'+
                '</div>'+
            '</li>';
        }
        $('.list-hot').append(html);
        M.getRate(function(rate){
            $.each($('.list li'), function(i, ele){
                var usd = (parseFloat($(ele).find('.game-money .eth').html())*rate).toFixed(5);
                if(usd == 0.00000){
                    usd = 0;
                    $(ele).find('.game-money .eth').html(0);                
                }
                $(ele).find('.game-money .usd').html(usd);                
            })
        })
    }
    , getMaxDice: function(arr){
        var temp = arr[0];
        for(var i=1; i<arr.length; i++){
            if(temp < arr[i]){
                temp = arr[i];
            }
        }
        return temp;
    }
    , getRoomDetail: function(roomId){
        App.getRoomData(roomId, function(r, room){
            if(r == 1){
                room = M.formateRoomData(room, roomId);
                console.log(room)
                console.log(account)

                M.roomDetail = room;
                // M.room = room;
                M.renderRoom(room);
            }
        })
    }
    , renderRoom: function(room){
        var strAdvaBtm = []
            , strAdvaWin = [] 
            , strIconDice = '' //win icon dice
            , strIconMe = '' //icon me
            , player = ''
            , dice = 0
            , maxDice = 0
            , numWin = 0 //the number of people who win
            , imgSrc = ''
            , flagDraw = true//是否为平局
            , flagMe = false//当前用户是否参加过游戏 
            , curUserIndex = -1
            ;
        if(room.numAllow == room.numReal){
            room.diceList = room.diceList.splice(0,room.numAllow)
        }
        maxDice = M.getMaxDice(room.diceList);

       
        for(var i = 0; i < room.numAllow-1; i++){
            for(var j = 1; j < room.numAllow; j++){
                if(room.diceList[i] != room.diceList[j]){
                    flagDraw = false;
                }
            }
        }

        if(flagDraw){
            $('.gameover-box').hide();
        }else{
            $('.gameover-no').hide();
        }

        for(var i = 0; i < room.numAllow; i++){

            player = room.playerList[i];
            //game icon
            if(player == account){
                strIconMe = '<i class="icon-me">me</i>';
                flagMe = true;
                curUserIndex = i;
            }else{
                strIconMe = '';
            }
            imgSrc = M.generateAdva(player);

            //game over

            if(room.numReal == room.numAllow){
               
                dice = room.diceList[i];
                strIconDice = '<i class="icon-dice icon-dice'+dice +'"></i>';

                //the player who win
                if(dice == maxDice){
                    numWin ++;
                    strAdvaWin.push('<div class="item"><span class="img-wrap"><img src="'+ imgSrc +'" /></span>'+ strIconMe +'<i class="icon-crown"></i>'+ strIconDice +'<a href="https://etherscan.io/address/'+ player +'" class="user">'+ player.substr(0,5) +'...<i class="next"></i></a></div>');
                }

            }


            if(player != '0x0000000000000000000000000000000000000000'){
                strAdvaBtm.push('<div class="item"><span class="img-wrap"><img src="'+ imgSrc +'" /></span>'+ strIconMe + strIconDice +'<a href="https://etherscan.io/address/'+ player +'" class="user">'+ player.substr(0, 5) +'...<i class="next"></i></a></div>');
            }else{
                strAdvaBtm.push('<div class="item item-def"><span class="img-wrap default"><img src="images/default.png" /></span><a href="javascript:void(0);" class="user">waiting</a></div>');
            }
        }

        $('.header .game-number').html('No. '+room.roomId);
        $('.header .game-money').find('.eth').html(room.chip.toFixed(5));
        
        M.getRate(function(rate){
            $('.header .game-money .usd').html((room.chip*rate).toFixed(5));
            var maxPrice = (room.chip*room.numAllow/numWin - room.chip).toFixed(5);
            $('.gameover-box .t-win span .eth').html(maxPrice);
            $('.gameover-box .t-win span .usd').html((maxPrice*rate).toFixed(5));
        })

        if(strAdvaWin.length == 1){
            $('.gameover-box').addClass('gameover-1');
        }else if(strAdvaWin.length > 1){
            $('.gameover-box').addClass('gameover-multi');
        }else{
            $('.gameover-box').hide();
        }
        $('.game-win-adva').html(strAdvaWin.join(''));
        $('.game-play-adva').html(strAdvaBtm.join(''));

        //game not start, need player join
        if(room.numAllow > room.numReal){
            // $('.btn-roll').hide();
            if(flagMe){
                $('.btn-roll').hide();
                $('.roll-before').show()
            }
        //game start and random is over
        }else{
        // }else if(room.numAllow == room.diceList.length) {
            $('.btn-roll').hide();
            if(!flagMe){
                $('body').addClass('result');
                $('.roll-box').hide();
            }else{//player = me

                //show: 当前用户是否参加过游戏且其账户有钱;
                if(room.playerWinPrice[curUserIndex] > 0 && $('.wrap').hasClass('result')){
                    $('.btn-money').css('display', 'inline-block');

                }else if(room.playerWinPrice[curUserIndex] == 0 && room.diceList[curUserIndex] == maxDice && $('.wrap').hasClass('result')){
                    $('.roll-after').show();
                }

                //if random is over and is first, 执行animDice
                if(!M.isRandomOverFirst){
                    M.animDice(room);
                }

                if(!M.isRandomOverFirst){
                    setTimeout(function(){
                        M.isRandomOverFirst = true;
                    }, 2000)
                }

                M.isAnim = false;
            }

            
        // game start but wait random
        // }else if(room.numAllow == room.numReal && room.numAllow > room.diceList.length){
        //     console.log("game start but random isn't over");
        //     M.animDice(room);
        //     $('.btn-roll').hide();
        }
    }

    , setStorage: function(room){
        //old localstory
        var str = localStorage.getItem('roomList')
            , list = []
            ;
        if(null == str){
            list.push(room);
        }else{
            list = JSON.parse(str).push(room);
        }

        localStorage.setItem('roomList', JSON.stringify(list))

        var roomList = [{roomId:1, transation:""}]; 
    }

    , getStorage: function(){
        var str = localStorage.getItem('roomList');
        var list = JSON.parse(str);
        return list==null?[]:list;
    }
    
    , bind: function(){
        $(document).on('scroll', function() {
            M.scrollLoad();
        });

        $('body').on('click', '.btn-money', function(){
            console.log(M.roomDetail)
            $('.loading').show();
            App.getMoney( M.roomDetail.roomId, function(r, data){
                console.log(data);
                if(r == 1){
                    console.log('money')
                    $('.loading').hide();
                    $('.btn-money').hide();
                    $('.roll-after').show();
                }else if(r == 2){
                        // localStorage.mm1 = JSON.parse(data);
                }else if(r == 3){
                        // localStorage.mm2 = JSON.parse(data);
                }else{
                    $('.loading span').html('Transition Failed!');
                    console.log('err')
                    console.log(data)
                }

                // console.log(data)
            })
        })

        $('.loading').click(function(){
            if($('.wrap').hasClass('index')){
                $(this).hide();
                $('.pop-btn-create').removeClass('disabled')
            }else{
                $(this).hide();
            }
        })

        $('.btn-roll').click(function(){
            //join
            var flagJoin = true
                , room = M.roomDetail
                , player
                ;
            if(room.numAllow > room.numReal){
                for(var i = 0; i < room.numAllow; i++){
                    player = room.playerList[i];
                    if(player == account){
                        flagJoin = false;
                        break;
                    }
                }
            }else{
                flagJoin = false;
            }
            if(flagJoin) {
                $('.loading').show();
                $('.loading span').html('loading...');
                App.joinRoom( room.roomId, room.chip , function(r, joinData){
                    console.log(joinData)
                    if(r == 1){
                        var index = joinData['logs'][0]['args']['playerEnterdCount']['c'][0] //playerEnterdCount
                            , playerNum = joinData['logs'][0]['args']['playerNum']['c'][0] //playerNum
                            , imgSrc = M.generateAdva(account)
                            ;
                        $('.game-play-adva .item').eq(index-1).html('<span class="img-wrap"><img src="'+ imgSrc +'" /></span><i class="icon-me">me</i></span><a href="https://etherscan.io/address/'+ account +'" class="user">'+ account.substr(0, 5) +'...<i class="next"></i></a>');
                        if(index == playerNum){
                            $('.roll-box .roll-before').hide();
                            $('.roll-box .btn-roll').show();
                        }

                        $('.btn-roll').hide();

                        //最后一个加入
                        if(index == room.numAllow){
                            M.animDice(room);
                        }else{
                            $('.roll-before').show();
                        }

                        $('.loading').hide();

                    }else{
                        $('.loading span').html('Join Failed');

                    }

                })
            }
        })

        

        if($('.invite').length == 1){
            $('.invite').attr('data-clipboard-text', location.href);
            var clipboard = new Clipboard('.invite');
            clipboard.on('success', function(e) {
                $('.clip').show();
                setTimeout(function(){
                    $('.clip').hide();
                }, 1000)
                e.clearSelection();
            });

        }
        $('.shadow, .icon-close').click(function(){
            $(this).parents('.pop').hide();
        })
        $('.btn-create').click(function(){
            //reset
            $('.pop-create .loading').hide();
            $('.pop-create .pop-btn-create').removeClass('disabled')
            $('.pop-create input[name=room-num]').val(2).siblings('i').removeClass('disabled');
            $('.pop-create .icon-minus').addClass('disabled');
            $('.pop-create input[name=eth]').val('0.10000').siblings('i').removeClass('disabled');

            $('.pop-create').show();
        })
        $('.pop-btn-create').click(function(){
            var playerNum = parseInt($('.pop-create input[name=room-num]').val())
                , betNum = parseFloat(parseFloat($('.pop-create input[name=eth]').val()).toFixed(5))
                , shareUrl = ''
                ;
            if($(this).hasClass('disabled')){
                return;
            }
            $('.pop-create .err').html('');

            console.log(playerNum == 'NaN')
            if(playerNum+"" == 'NaN'){
                $('.pop-create input[name=room-num]').siblings('.err').html('游戏人数必须为数字')
                return;
            }else if(betNum+"" == 'NaN'){
                $('.pop-create input[name=eth]').siblings('.err').html('赌注必须为数字')
                return;
            }

            if(playerNum >= 2 && playerNum <= 6){

            }else if(playerNum < 2 || playerNum > 6){
                $('.pop-create input[name=room-num]').siblings('.err').html('游戏人数的2到6之间')
                return;
            }
            console.log(betNum)
            if(betNum >= 0.01 && betNum <= 10000){

            }else if(betNum < 0.01){
                $('.pop-create input[name=eth]').siblings('.err').html('赌注最小为0.01')
                return;
            }else if(betNum > 10000){
                $('.pop-create input[name=eth]').siblings('.err').html('赌注最大为10000')
                return;
            }

            $(this).addClass('disabled');
            $('.pop-create .loading').show();
            $('.pop-create .loading span').html('loading...');
            console.log(betNum);
            App.creatRoom( playerNum, betNum, function(r, data){
                if(r == 1){
                   
                    $('.pop-create .loading').hide();
                    $('.pop-create').hide();
                    var roomId = data['logs'][0]['args']['roomID']['c'][0];
                    $('.pop-suc .room-num').find('span').html(roomId)
                    $('.pop-suc').show().find('.pop-btn-suc').attr('href', 'play.html?roomid='+roomId);

                    console.log(M.undoList)
                    console.log(data)
                    var room = {
                        roomId: roomId
                        , chip : betNum
                        , diceList: []
                        , numAllow: playerNum
                        , numReal: 1
                        , playerList: [account, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"]
                        , playerWinPrice :[0, 0, 0, 0, 0, 0]
                    }
                    console.log(room)
                    M.undoList.push(room);
                    M.renderUndoList(M.sortList(M.undoList));
                    M.getRate(function(rate){
                        $.each($('.list li'), function(i, ele){
                            $(ele).find('.game-money .usd').html((parseFloat($(ele).find('.game-money .eth').html())*rate).toFixed(5));                
                        })
                    })

                    //share url
                    shareUrl = location.origin+location.pathname.substr(0, location.pathname.lastIndexOf('/'))+'/play.html?roomid='+roomId;
                    $('.pop-suc .pop-btn-share').attr('data-clipboard-text', shareUrl);
                    var clipboard = new Clipboard('.pop-suc .pop-btn-share');
                    clipboard.on('success', function(e) {
                        $('.clip').show();
                        setTimeout(function(){
                            $('.clip').hide();
                        }, 1000)
                        e.clearSelection();
                    });
                }else{
                    $('.pop-create .loading span').html('Create Failed');
                    console.log('err');
                }
                $('.pop-btn-create').removeClass('disabled');
            })           
        })

        $('.icon-add, .icon-minus').click(function(){
            var ipt = $(this).siblings('input')
                , num = parseInt(ipt.val())
                , unit = 1
                , max = 6 
                , min = 2
                , errMsg = ''
            ;
            if($(this).hasClass('disabled')){
                return;
            }
            if(ipt.val() == ''){

                if(ipt.attr('name') == 'eth'){
                    ipt.val('0.01000');
                }else{
                    ipt.val(2);
                }
                ipt.siblings('.icon-minus').addClass('disabled')
                return;

            }


            if(ipt.attr('name') == 'eth'){
                max = 10000;
                min = 0.01;
                unit = 0.1;
                var value = parseFloat(ipt.val());
                num = parseFloat(value.toFixed(5));
            }
          
            //减
            if($(this).hasClass('icon-minus')){
                num = num - unit;
                if(num > min && num <= max){
                    $(this).siblings('.icon-add').removeClass('disabled')
                }else if(num <= min) {
                    num = min;
                    $(this).addClass('disabled')
                    $(this).siblings('.icon-add').removeClass('disabled')
                }
            //加
            }else {
                num = num+unit;
                if(num >= min && num < max){
                    $(this).siblings('.icon-minus').removeClass('disabled')
                }else if(num >= max){
                    $(this).addClass('disabled');
                    $(this).siblings('.icon-minus').removeClass('disabled')
                    num = max;
                }
            }
            if(ipt.attr('name') == 'eth'){
                if(num < min){
                    num = 0.01;
                }
                num = num.toFixed(5);
            }
            ipt.val(num);
        })   

        $('#btnDownloadApp').click(function(){
            console.log(333)
            var GPUrl = 'https://play.google.com/store/apps/details?id=com.blockchain.dapp.browser&referrer=utm_source%3Dins_d_ethdice'
                , marketUrl = 'market://details?id=com.blockchain.dapp.browser&referrer=utm_source%3Dins_d_ethdice'
                ;
            if (typeof cm_web_app != 'undefined' && cm_web_app.hasOwnProperty('go2Google')) {
                cm_web_app.go2Google(GPUrl);
            } else if (typeof cm_web_app != 'undefined' && cm_web_app.hasOwnProperty('openMarket')) {
                cm_web_app.openMarket(GPUrl);
            } else if (typeof android != 'undefined' && android.hasOwnProperty('openMarket')) {
                android.openMarket(GPUrl);
            } else if (typeof ijinshan != 'undefined' && ijinshan.hasOwnProperty('go2Google')) {
                ijinshan.go2Google(GPUrl);
            } else {
                M.androidTryOpenAppOrDownload({
                    market: marketUrl,
                    fail: function() {
                        window.location.href = GPUrl;
                    }
                })
            }

        })
     
    }
    , tryOpen: function(url) {
        if (!url && url !== '') {
            return;
        }
        var frame = window.document.createElement("iframe");
        frame.style.cssText = "width:1px;height:1px;position:fixed;top:0;left:0;";
        frame.src = url;
        window.document.body.appendChild(frame);
        setTimeout(function() {
            window.document.body.removeChild(frame);
        }, 10);
    }

    , androidTryOpenAppOrDownload: function(obj) {
        var self = this;

        setTimeout(function() {
            var startTime = (new Date).valueOf();
            if (!!obj && !!obj.market) {
                self.tryOpen(obj.market);
            }

            startTime = (new Date).valueOf();

            setTimeout(function() {
                var endTime = (new Date).valueOf();
                if (550 > endTime - startTime && !!obj && typeof obj.fail == 'function') {
                    obj.fail();
                } else {
                    obj.success();
                }
            }, 500);
        }, 100);
    }
    , generateAdva: function(str){
        var hash = $.md5(str);
        var imgData = new Identicon(hash).toString();
        var imgUrl = 'data:image/png;base64,'+imgData // 这就是头像的base64码
        return imgUrl;
    }
    , init:function(){
        
        // 0xfe07fdb24356a28a555ba8fc9ee77b8aa19af45386e06616bf88cb1efb625f84
        // 0x9fc4236b60a2305e9a834a977153b71c74521ccc3dec8d525d2d64e1f4fb5925
        // web3.eth.getTransactionReceipt(
        //     "0x84f330bdf46094dea02e1f60b3d7373544dfaca748b2785921aa193f080dd1df "
        //     , function(e){
        //         // console.log(e)
        //     })


        if(!$('.wrap').hasClass('download')){
            if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
                // metamask is running.

                if(undefined == account || account == ""){
                    location.href = 'download.html';
                    console.log('metamask is not existed')
                    return;
                }
                console.log('metamask is running')
              
            } else {
                location.href = 'download.html';
                console.log('metamask is not existed')
            }
        }
      

        if($('.wrap').hasClass('index')){
            M.getList(0);
            M.getHotList(0, function(){});
        }else if($('.wrap').hasClass('play')){
            M.getRoomDetail(M.getParameter('roomid'));
            // if($('.wrap').hasClass('result'))
            var interval = 30000;
            setTimeout(function(){
                window.location.href = location.href;
                // setTimeout(arguments.callee,interval);
            }, interval)
        }

        this.bind();

        

        
       
    }

}
$(function () { 
    if($('.wrap').hasClass('download')){
        M.init();
    }
});
