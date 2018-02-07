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
    , rate: 0
    , animNum: false
    , getRate: function(callback){
        $.get('https://blockchain.ijinshan.com/price/single?from=ETH&to=USD', function(rate){
            callback(rate.data.rate);
        })
    }
    , animDice: function(room){
        var i = 2
            , time = 100
            , num = 100
            , timer = null
            ;
        if(null != timer){
            return;
        }
        function startAnim(){
            clearTimeout(timer);
            timer = null;
            if(i == 6){
                i = 1;
                num ++;
            }else{
                i ++;
            }
            num += time;
            if(num >= 2000){
                if(!$('.btn-roll').hasClass('disabled')){
                    M.animNum = true;
                }
                clearTimeout(timer);
                timer = null;
                $('.btn-roll').removeClass('disabled').hide();
                $('.wrap').addClass('result');
                M.renderRoom(room);
                return false;
            }else{
                if(!M.animNum){
                    timer = setTimeout(startAnim, time);
                }

            }
            $('.dice-play').css('backgroundImage', 'url(images/'+ i +'.png?v=1)');
            

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
        room.chip = data[1]['c'][0]/10000; //赌注
        room.numReal = data[2]['c'][0];//实际人数 
        room.diceList = M.formateRoomList(data[3]);//dice的值
        room.playerList = data[4];//player id list
        room.playerWinPrice = [];//player win price


        for (var i = 0; i < data[5].length; i++) {
            room.playerWinPrice.push(data[5][i].c[0]/10000)
        }

        return room;        
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
                            if(i == roomIdList.length-1){
                                M.renderUndoList(list);
                            }
                        }
                    })
                })
            }
           
        })
    }
    , getHotList: function(){
        App.getHotWinRoomIDs(function(r, roomIdList){
            var roomId = 0
                , list = []
                ;
            if(r == 1){
                roomIdList = M.formateRoomList(roomIdList);
                // console.log(roomIdList)
                 
                $.each(roomIdList, function(i, roomId){
                    //获取房间详细数据
                    App.getRoomData(roomId, function(r, d){
                        if(r == 1){
                            // console.log(M.formateRoomData(d, roomId));

                            list.push(M.formateRoomData(d, roomId));
                            if(i == roomIdList.length-1){
                                M.renderHotList(list);
                            }
                        }
                    })
                })
            }
           
        })
    }
    , renderUndoList: function(list){
        var html = ''
            , imgList = []
            , imgSrc = ''
            ;
        for(var i=0; i<list.length; i++){
            imgList = [];
            for(var j=0; j<list[i]['numAllow']; j++){
                imgSrc = M.generateAdva(list[i].playerList[j]);
                if(j <= list[i]['numReal']-1){
                    imgList.push('<span class="item"><img src="'+ imgSrc +'" /></span>');
                }else{
                    imgList.push('<span class="item"><img src="images/default.png" /></span>');
                }

            }
            html += '<li>'+
                '<div class="game-top clear"><span class="game-number">NO. '+ list[i]["roomId"] +'</span><span class="game-count">'+ list[i]["numReal"] +'/'+ list[i]["numAllow"] +'</span></div>'+
                '<div class="game-adva clear">'+ imgList.join('') + '</div>'+
                '<div class="game-btm clear">'+
                    '<span class="game-money"><span class="eth">'+ list[i]["chip"] +'</span> ETH/ $<span class="usd"></span></span>'+
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
                imgList.push('<span class="item"><img src="'+ imgSrc +'" />'+ strIcon +'</span>');
            }
            winChip = (list[i].chip*list[i].numAllow/numWin - list[i].chip).toFixed(2);
            html += '<li><a href="play.html?roomid='+ list[i].roomId +'">'+
                '<div class="game-top clear"><span class="game-number">NO. '+ list[i]["roomId"] +'</span><span class="game-count">'+ list[i]["numReal"] +'/'+ list[i]["numAllow"] +'</span></div>'+
                '<div class="game-adva clear">'+ imgList.join('') + '</div>'+
                '<div class="game-btm clear">'+
                    '<span class="game-money">win <span class="eth">'+ winChip +'</span> ETH/ $<span class="usd"></span>'+ strTrangleList.join('') +  '</span>'+
                '</div>'+
            '</li>';
        }
        $('.list-hot').html(html);
        M.getRate(function(rate){
            $.each($('.list li'), function(i, ele){
                $(ele).find('.game-money .usd').html((parseFloat($(ele).find('.game-money .eth').html())*rate).toFixed(2));                
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
            , maxDice = M.getMaxDice(room.diceList)
            , numWin = 0 //the number of people who win
            , imgSrc = ''
            , flagDraw = true//是否为平局
            , flagMe = false//当前用户是否参加过游戏 
            , curUserIndex = -1
            ;
       
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
            if(room.diceList.length == room.numAllow){
               
                dice = room.diceList[i];
                strIconDice = '<i class="icon-dice icon-dice'+dice +'"></i>';

                //the player who win
                if(dice == maxDice){
                    numWin ++;
                    strAdvaWin.push('<div class="item"><img src="'+ imgSrc +'" />'+ strIconMe +'<i class="icon-crown"></i>'+ strIconDice +'<a href="https://etherscan.io/address/'+ player +'" class="user">'+ player.substr(0,5) +'...<i class="next"></i></a></div>');
                }

            }


            if(player != '0x0000000000000000000000000000000000000000'){
                strAdvaBtm.push('<div class="item"><img src="'+ imgSrc +'" />'+ strIconMe + strIconDice +'<a href="https://etherscan.io/address/'+ player +'" class="user">'+ player.substr(0, 5) +'...<i class="next"></i></a></div>');
            }else{
                strAdvaBtm.push('<div class="item"><img src="images/default.png" /><a href="javascript:void(0);" class="user">waiting</a></div>');
            }
        }

        $('.header .game-number').html('No. '+room.roomId);
        $('.header .game-money').find('.eth').html(room.chip);
        
        M.getRate(function(rate){
            $('.header .game-money .usd').html((room.chip*rate).toFixed(2));
            var maxPrice = (room.chip*room.numAllow/numWin - room.chip).toFixed(2);
            $('.gameover-box .t-win span .eth').html(maxPrice);
            $('.gameover-box .t-win span .usd').html((maxPrice*rate).toFixed(2));
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

        //game not start
        if(room.numAllow > room.numReal){
            // $('.btn-roll').hide();
            if(flagMe){
                $('.btn-roll').hide();
                $('.roll-before').show()
            }
        //game start
        }else{
            $('.btn-roll').hide();
            if(!flagMe){
                $('body').addClass('result');
                $('.roll-box').hide();
            }else{
                // if($('.btn-roll').hasClass('disabled')){

                // }
                M.animDice(room);
                //show: 当前用户是否参加过游戏且其账户有钱;
                console.log($('.wrap').hasClass('result'))
                if(room.playerWinPrice[curUserIndex] > 0 && $('.wrap').hasClass('result')){
                    console.log('result')
                    $('.btn-money').css('display', 'inline-block');
                }else if(room.playerWinPrice[curUserIndex] == 0 && $('.wrap').hasClass('result')){
                    $('.roll-after').hide();
                }
            }
        }
    }
    
    , bind: function(){

        $('body').on('click', '.btn-money', function(){
            console.log(M.roomDetail)
            App.getMoney( M.roomDetail.roomId, function(r, data){
                if(r == 1){
                    console.log('money')
                    $('.btn-money').hide();
                    $('.roll-after').show();
                }
                console.log(data)
            })
        })

        $('.btn-roll').click(function(){
            //join
            var flagJoin = true
                , room = M.roomDetail
                , player
                ;
            // console.log(room)
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
            console.log(flagJoin)
            if(flagJoin) {
                App.joinRoom( room.roomId, room.chip , function(r, joinData){
                    console.log(joinData)
                    if(r == 1){
                        var index = joinData['logs'][0]['args']['playerEnterdCount']['c'][0] //playerEnterdCount
                            , playerNum = joinData['logs'][0]['args']['playerNum']['c'][0] //playerNum
                            , imgSrc = M.generateAdva(account)
                            ;
                        $('.game-play-adva .item').eq(index-1).html('<img src="'+ imgSrc +'" /><i class="icon-me">me</i><a href="https://etherscan.io/address/'+ account +'" class="user">'+ account.substr(0, 5) +'...<i class="next"></i></a>');
                        if(index == playerNum){
                            $('.roll-box .roll-before').hide();
                            $('.roll-box .btn-roll').show();
                        }

                        $('.btn-roll').hide();

                        //最后一个加入
                        if(index == room.numAllow){
                            // location.href = location.href;

                            // console.log(3333)
                            // console.log(room)
                            M.animDice(room);
                        }else{
                            $('.roll-before').show();
                        }

                        

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
            $('.pop-create input[name=eth]').val(0.1).siblings('i').removeClass('disabled');

            $('.pop-create').show();
        })
        $('.pop-btn-create').click(function(){
            var playerNum = parseInt($('.pop-create input[name=room-num]').val())
                , betNum = parseFloat(parseFloat($('.pop-create input[name=eth]').val()).toFixed(2))
                , shareUrl = ''
                ;
            if($(this).hasClass('disabled')){
                return;
            }
            if(playerNum >= 2 && playerNum <= 6){

            }else{
                return;
            }
            console.log(betNum)
            if(betNum >= 0.01 && betNum <= 10000){

            }else{
                return;
            }

            $(this).addClass('disabled');
            $('.pop-create .loading').show();
            
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
                    M.renderUndoList(M.undoList);
                    M.getRate(function(rate){
                        $.each($('.list li'), function(i, ele){
                            $(ele).find('.game-money .usd').html((parseFloat($(ele).find('.game-money .eth').html())*rate).toFixed(2));                
                        })
                    })

                    //share url
                    shareUrl = location.href+location.pathname.substr(0, location.pathname.lastIndexOf('/'))+'/play.html?roomid='+roomId;
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
                    $('.pop-create .loading').html()
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
            ;
            if(ipt.attr('name') == 'eth'){
                max = 10000;
                min = 0.01;
                unit = 0.1;
                var value = parseFloat(ipt.val());
                num = parseFloat(value.toFixed(2));
            }
          
            //减
            if($(this).hasClass('icon-minus')){
                num = num - unit;
                if(num > min && num <= max){
                    $(this).siblings('.icon-add').removeClass('disabled')
                }else if(num <= min) {
                    num = min;
                    $(this).addClass('disabled')
                }
            //加
            }else {
                num = num+unit;
                if(num >= min && num < max){
                    $(this).siblings('.icon-minus').removeClass('disabled')
                }else if(num >= max){
                    $(this).addClass('disabled')
                    num = max;
                }
            }
            console.log('name')
            if(ipt.attr('name') == 'eth'){
                if(num < min){
                    num = 0.01;
                }
                num = num.toFixed(2);
            }
            ipt.val(num);
        })   

     
    }
    , generateAdva: function(str){
        var hash = $.md5(str);
        var imgData = new Identicon(hash).toString();
        var imgUrl = 'data:image/png;base64,'+imgData // 这就是头像的base64码
        return imgUrl;
    }
    , init:function(){
        if($('.wrap').hasClass('index')){
            M.getList(0);
            M.getHotList();
        }else if($('.wrap').hasClass('play')){
            M.getRoomDetail(M.getParameter('roomid'));
        }
        this.bind();
       
    }

}
$(function () {

   

    
});
