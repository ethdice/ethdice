var M = {
    roomDetail: {}
    , msg1: 'Players should be more than 2 people and less than 6 (both inclusive)'
    , msg2: 'The minimum average bet value of each player is 0.01 ETH'
    , msg3: 'The maximum average bet value of each player is 10,000 ETH'
    , loadingMsg: '<div class="load-inner"><div class="big">loading...</div></div>'
    , msgCreateFailed: '<div class="load-inner"><div class="big">Create Failed!</div><div class="small">The failure of payment might be caused by incorrect gas price value filled. Please make sure that it is greater than 0.</div></div>'
    , msgJoinFailed: '<div class="load-inner"><div class="big">Join Failed!</div><div class="small">The failure of payment might be caused by incorrect gas price value filled. Please make sure that it is greater than 0.</div></div>'
    , msgGetMoneyFailed: '<div class="load-inner"><div class="big">Transition Failed!</div><div class="small">The failure of payment might be caused by incorrect gas price value filled. Please make sure that it is greater than 0.</div></div>'
    , undoList: []
    , curHotListLength: 0 //当前取得房间数的总和
    , loading: true //是否正在取数据
    , rate: 0
    , isAnim: true//是否动画 
    , randomIsOver: false //第一次加载页面时random是否over
    , scroll: null
    , animTimer: null
    , room: null
    , _body: $('.wrap')
    , getRate: function(callback){
        $.get('https://blockchain.ijinshan.com/price/single?from=ETH&to=USD', function(rate){
            callback(rate.data.rate);
        })
    }
    , getParameter: function(name) {  
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");  
        var r = window.location.search.substr(1).match(reg);  
        if (r != null)  
            return unescape(r[2]);  
        return null;  
    }
    , animDice: function(room){
        var i = 0
            , diceBox = $('.dice-play')
            ;
        function startAnim(){
            // console.log(i);
            i++;
            if(i == 7){
                i = 1;
            }
            diceBox.css('backgroundImage', 'url(images/'+ i +'.png?v=1)');
            if(M.randomIsOver){ 
                clearTimeout(M.animTimer);
                M.animTimer = null;
            }else{//正在动画
                M.animTimer = setTimeout(startAnim, 100);
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
        room.roomId = roomId;//当前roomid
        room.numAllow = data[0]['c'][0];//应有人数
        room.chip = parseFloat(web3.fromWei((data[1]).toNumber(), 'ether')); //赌注
        room.numReal = data[2]['c'][0];//实际人数 
        var diceValue = data[4].toString();
        room.diceList = diceValue.substr(0, diceValue.length-2).split('');//所有人的dice
        room.diceMax = parseInt(diceValue.substr(-2,1));//dice的最大值
        room.winnerNum = parseInt(diceValue.substr(-1,1));//赢家人数
        room.playerList = data[3].splice(0, room.numReal);//player address list
        room.playerWinPrice = [];//代表用户是否取出过钱的数组，1表示取出了，0表示未取出
        room.playerPerWin = parseFloat(web3.fromWei((data[6]).toNumber(), 'ether')); // 每个赢家赢得的钱 等于这个数除以（最大roll点数的人数） 

        for (var i = 0; i < data[5].length; i++) {
            room.playerWinPrice.push(data[5][i]['c'][0]);//代表用户是否取出过钱
        }

        return room;        
    }
    , sortList : function(list){
        list.sort(function(x, y){
            return y.roomId - x.roomId;
        })
        return list;

    }
    //  获取当前正在进行的game
    , getList: function(num){
        App.getUnfinishedRoomIDs( num, function(r, roomIdList){  //startId 从0开始
            var roomId = 0
                , list = []
                ;
            if(r == 1){
                roomIdList = M.formateRoomList(roomIdList);
                M.undoList = list;

                // console.log(roomIdList)
                 
                $.each(roomIdList, function(i, roomId){
                    // console.log('roomid:'+roomId+',index:'+i);
                    //获取房间详细数据
                    M.getRoomData(roomId, function(room){
                        if(null == room) return;
                        list.push(M.formateRoomData(room, roomId));
                        // console.log('roomData'+ room)
                        // console.log(list)
                        if(list.length == roomIdList.length){
                            M.renderUndoList(M.sortList(list));
                            // console.log(list)
                        }
                    })
                })
            }
           
        })
    }
    // 获取热门list
    , getHotList: function(index, callback){
        //index 起始id的索引 
        App.getFinishedRoomIDs(index, function(r, roomIdList){
            var roomId = 0
                , list = []
                ;
            if(r == 1){
                roomIdList = M.formateRoomList(roomIdList);
                
                M.curHotListLength += roomIdList.length;

                // console.log(roomIdList)
                
                callback();
                
                $.each(roomIdList, function(i, roomId){
                    //获取房间详细数据
                    M.getRoomData(roomId, function(room){
                        if(null == room) return;
                        // console.log(room)
                        list.push(M.formateRoomData(room, roomId));
                        if(list.length == roomIdList.length){
                            M.renderHotList(M.sortList(list));
                            M.loading = false;
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

    // render进行中的list
    , renderUndoList: function(list){
        var html = ''
            , imgList = []
            , imgSrc = ''
            , strIcon = ''
            , oClass=''
            ;
        for(var i=0; i<list.length; i++){
            imgList = [];
            for(var j=0; j<list[i]['numAllow']; j++){
                var playerAddr = list[i].playerList[j] || '';
                if(playerAddr) {
                    imgSrc = M.generateAdva(playerAddr);
                    oClass = '';
                } else {
                    imgSrc = 'images/default.png';
                    oClass = 'def'

                }
                // if(j <= list[i]['numReal']-1){
                if(account == playerAddr){
                    strIcon = '<i class="icon-me">ME</i>'
                }else{
                    strIcon = '';
                }
                imgList.push('<span class="item '+ oClass +'"><span class="img-wrap"><img src="'+ imgSrc +'" /></span>'+ strIcon +'</span>');
                // }else{
                //     imgList.push('<span class="item item-def"><span class="img-wrap default"><img src="images/default.png" /></span></span>');
                // }

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
    // render已完成的list
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
            numWin = list[i].winnerNum;
            for(var j=0; j<list[i]['numAllow']; j++){
                imgSrc = M.generateAdva(list[i].playerList[j]);
                if(maxDice == list[i]['diceList'][j]){
                    // numWin ++;
                    strIcon = '<i class="icon-crown"></i>';
                    strTrangleList.push('<i class="icon icon'+ (j+1) +'"></i>');
                }else{
                    strIcon = '';
                }
                if(account == list[i]['playerList'][j]){
                    strIcon += '<i class="icon-me">ME</i>'
                }
                imgList.push('<span class="item"><span class="img-wrap"><img src="'+ imgSrc +'" /></span>'+ strIcon +'</span>');
            }
            // winChip = (list[i].chip*list[i].numAllow/numWin - list[i].chip).toFixed(5);
            winChip = ((list[i].playerPerWin - list[i].chip*numWin)/numWin).toFixed(5);
            if(winChip<0) winChip = 0;
            html += '<li><a href="play.html?roomid='+ list[i].roomId +'">'+
                '<div class="game-top clear"><span class="game-number">NO. '+ list[i]["roomId"] +'</span><span class="game-count">'+ list[i]["numAllow"] +'</span></div>'+
                '<div class="game-adva clear">'+ imgList.join('') + '</div>'+
                '<div class="game-btm clear">'+
                    '<span class="game-money">win <span class="eth">'+ winChip +'</span> ETH/ $<span class="usd"></span>'+ strTrangleList.join('') +  '</span>'+
                '</div>'+
            '</li>';
        }
        $('.list-hot').append(html);

        //汇率
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
    // 获取最大的dice值
    , getMaxDice: function(arr){
        var temp = arr[0];
        for(var i=1; i<arr.length; i++){
            if(temp < arr[i]){
                temp = arr[i];
            }
        }
        return temp;
    }
    , getRoomData: function(roomId, callback){
        var roomData;
        App.getRoomData(roomId, function(r, room){
            if(r == 1){
                roomData = room;
            }else{
                roomData = null;
            }
            // console.log(roomData)
            callback(roomData)
        })
    }
    // 获取页面详情页
    , getRoomDetail: function(roomId){
        M.getRoomData(roomId, function(room){
            if(room){
                // console.log(room)
                // console.log(room[3])
                room = M.formateRoomData(room, roomId);
                M.roomDetail = room;
                // console.log(room)
                M.renderRoom(room);
            }
        });
        
    }

    //render 平局
    , renderDrawRoom: function(){
    }

    , checkRoomRandom: function(roomId, lastone){

        clearTimeout(M.checkTimer);
        M.checkTimer = null;

        function checkRoom(){
            if(M.randomIsOver){
                clearTimeout(M.checkTimer);
                M.checkTimer = null;
            }else{
                M.checkTimer = setTimeout(checkRoom, 4000);
                // console.log('check roomId:'+roomId);
                M.getRoomData(roomId, function(room){
                    var roomDetl = M.formateRoomData(room);
                    roomDetl.roomId = roomId;
                    // console.log(roomDetl);
                    // 页面人数
                    var curNum = $('.game-play-adva .item').length-$('.game-play-adva .item.item-def').length;
                    // wait others to join
                    if(roomDetl.numReal > curNum){
                        M.renderRoom(roomDetl);
                    }

                    // random is over
                    if(roomDetl.diceMax!=0 && roomDetl.winnerNum>0){
                        M.randomIsOver = true;
                        if(lastone){
                            M.renderRoom(roomDetl);
                        }
                    }
                })
            }
            
        }

        checkRoom();

        
    }

    , renderOverRoom: function(flagDraw){
        $('.dice-play').hide();
        if(flagDraw){
            M._body.addClass('res-draw').removeClass('res-play');
        // game not draw
        }else{
            M._body.addClass('res-win').removeClass('res-play');
        }
    }

    // render房间详情页
    , renderRoom: function(room){
        var strAdvaBtm = []//底部字符串
            , strAdvaWin = [] 
            , strIconDice = '' //win icon dice
            , strIconMe = '' //icon me
            , player = ''//游戏的中的一个用户地址，为变量
            , dice = 0 //游戏的中的一个值，为变量
            , maxDice = room.diceMax //游戏最大的值
            , numWin = room.winnerNum //the number of people who win
            , imgSrc = ''
            , flagDraw = false//游戏为平局
            , flagGetRandom = false //游戏结束并得到random
            , flagOver = false //游戏结束
            , flagMe = false//当前用户参加过游戏 
            , flagWin = false//当前用户是否赢钱
            , curUserIndex = -1  //当前用户的所在的位置
            , rollBox = $('.roll-box')
            , diceBox = $('.dice-play')
            ;

        if(room.numAllow == room.numReal) flagOver = true;
        if(flagOver && maxDice != 0) flagGetRandom = true;  
        if(room.winnerNum == room.numAllow) flagDraw = true;

        // render header
        $('.header .game-number').html('No. '+room.roomId);
        $('.header .game-money').find('.eth').html(room.chip.toFixed(5));

        
        for(var i = 0; i < room.numAllow; i++){
            
            player = room.playerList[i];
            
            //game icon
            if(player == account){
                strIconMe = '<i class="icon-me">ME</i>';
                flagMe = true;
                curUserIndex = i;
            }else{
                strIconMe = '';
            }
            if(player) imgSrc = M.generateAdva(player);

            //game over
            if(flagOver){

                dice = room.diceList[i];
                if(dice){
                    strIconDice = '<i class="icon-dice icon-dice'+dice +'"></i>';
                }else{
                    strIconDice = '';
                }

                //the player who win
                if(dice && dice == maxDice){
                    // numWin ++;
                    strAdvaWin.push('<div class="item"><span class="img-wrap"><img src="'+ imgSrc +'" /></span>' 
                            +strIconMe +'<i class="icon-crown"></i>'+ strIconDice 
                            +'<a href="https://etherscan.io/address/'+ player +'" class="user">'+ player.substr(0,5) 
                            +'...<i class="next"></i></a></div>');
                }
            }

            if(player){
                strAdvaBtm.push('<div class="item"><span class="img-wrap"><img src="'+ imgSrc +'" /></span>'
                        + strIconMe + strIconDice +'<a href="https://etherscan.io/address/'+ player +'" class="user">'
                        + player.substr(0, 5) +'...<i class="next"></i></a></div>');
            }else{
                strAdvaBtm.push('<div class="item item-def"><span class="img-wrap default"><img src="images/default.png" />'+
                    '</span><a href="javascript:void(0);" class="user">waiting</a></div>');
            }
        }

        if(flagMe && !flagOver){//game start, user has joined
            rollBox.addClass('roll-box-me');
        }

        if(flagOver && flagMe && room.diceList[curUserIndex]==room.diceMax){
            flagWin = true;
        }

        // 若当前用户赢钱，且其钱还未取走
        if(flagWin && room.playerWinPrice[curUserIndex]==0){
            rollBox.addClass('has-not-money').removeClass('none');
            rollBox.find('.btn-money').attr('index', curUserIndex);
        // 若当前用户赢钱，且其钱已取走        
        }else if(flagWin && room.playerWinPrice[curUserIndex] == 1){
            // console.log('若当前用户参加了游戏，且其钱已取走')
            rollBox.addClass('has-taken-money');
        }

        $('.game-win-adva').html(strAdvaWin.join(''));
        $('.game-play-adva').html(strAdvaBtm.join(''));


        // var maxPrice = (room.chip*room.numAllow/numWin - room.chip).toFixed(5);
        var maxPrice = ((room.playerPerWin-room.chip)/room.winnerNum).toFixed(5);
        $('.gameover-box .t-win span .eth').html(maxPrice);

        M.getRate(function(rate){
            $('.header .game-money .usd').html((room.chip*rate).toFixed(5));
            $('.gameover-box .t-win span .usd').html((maxPrice*rate).toFixed(5));
        })

        if(flagMe){
            M.removeStorage('roll'+room.roomId);            
        }

        // game over
        if(flagOver && flagGetRandom){
            if(flagMe && !M.animTimer){
                M.animDice();
                setTimeout(function(){
                    M.randomIsOver = true;

                    // game draw
                    M.renderOverRoom(flagDraw);
                    
                }, 1000);
                
            }else{
                M.renderOverRoom(flagDraw);
            }
            
        //game over, but waiting for random
        }else if(flagOver && !flagGetRandom){
            $('.play-box .roll-box').addClass('none');
            
            M.animDice();
            M.checkRoomRandom(room.roomId, true);

            // console.log(' waiting for random')
        //waiting user join
        }else{
            // M.renderUnfinishedRoom(room);
            M._body.addClass('res-play').removeClass('res-win res-draw');

            // 已付款，且得到结果
            if(flagMe){
                rollBox.addClass('after');
            }else{
                // 已付款，在等待返回结果
                if(M.getStorage('roll'+room.roomId) == 1){
                    rollBox.addClass('wait');
                // 未付款
                }else{
                    rollBox.removeClass('wait invite');
                }
            }

            // 轮询结果
            M.checkRoomRandom(room.roomId);

            

        }

    }

    , removeStorage: function(key){
        localStorage.removeItem(key);
    }
    , setStorage: function(key, value){
        localStorage.setItem(key,value);
    }

    , getStorage: function(key){
        return localStorage.getItem(key);
    }
    , renderWaiting: function(){
        // console.log('renderwaiting')
    }
    
    , bind: function(){
        $(document).on('scroll', function() {
            M.scrollLoad();
        });

        $('body').on('click', '.btn-money', function(){
            // console.log(M.roomDetail)
            var btn = $(this)
                , rollBox = $('.roll-box')
                , loading = $('.loading')
                ;
            
            loading.html(M.loadingMsg).show();

            // if(M.getStorage('money'+M.roomDetail.roomId) == 1){
            //     rollBox.addClass('wait');
            //     return;
            // }

            // 记录当前点击过取钱按钮
            M.setStorage('money'+M.roomDetail.roomId, 1);
            rollBox.addClass('wait')

            App.getMoney( M.roomDetail.roomId, btn.attr('index'), function(r, data){
                M.removeStorage('money'+M.roomDetail.roomId);
                rollBox.removeClass('wait')
                
                if(r == 1){
                    rollBox.addClass('after');
                    loading.hide();
                    // btn.hide();
                    // $('.roll-after').show();
                    rollBox.addClass('has-taken-money').removeClass('has-not-money');
                    
               
                }else{
                    loading.html(M.msgGetMoneyFailed);
                    // console.log('err')
                    // console.log(data)
                }

                // console.log(data)
            })
        })

        $('.loading').click(function(e){
            var btn = $(this);
            if($('.wrap').hasClass('index')){
                btn.hide();
                $('.pop-btn-create').removeClass('disabled')
            }else{
                btn.hide();
            }
        })

        $('.btn-roll').click(function(){
            //join
            var flagJoin = true//是否可加入，可加入为true
                , room = M.roomDetail
                , player
                , rollBox = $('.roll-box')
                , loading = $('.loading')
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
                loading.html(M.loadingMsg).show();
                // if(M.getStorage('roll'+room.roomId) == 1){
                //     // M.renderWaiting();
                //     return;
                // }

                // 设置1为waiting status，其它为not waiting
                M.setStorage(('roll'+room.roomId), 1);
                rollBox.addClass('wait');

                App.joinRoom( room.roomId, room.chip , function(r, joinData){
                    
                    M.removeStorage(('roll'+room.roomId), 0);  
                    rollBox.removeClass('wait');
                                  
                    if(r == 1){
                        var index = joinData['logs'][0]['args']['playerEnterdCount']['c'][0] //playerEnterdCount
                            , playerNum = joinData['logs'][0]['args']['playerNum']['c'][0] //playerNum
                            , imgSrc = M.generateAdva(account)
                            ;
                        $('.game-play-adva .item').eq(index-1).html('<span class="img-wrap"><img src="'+ imgSrc 
                                +'" /></span><i class="icon-me">ME</i></span><a href="https://etherscan.io/address/'+ account +'" class="user">'
                                + account.substr(0, 5) +'...<i class="next"></i></a>');


                        //最后一个加入
                        if(index == room.numAllow){
                            rollBox.addClass('none');
                            M.animDice();
                            M.checkRoomRandom(room.roomId, true);
                        }else{
                            rollBox.addClass('after');                            
                        }

                        loading.hide();

                    }else{
                        // rollBox.addClass('other');
                        loading.html(M.msgJoinFailed);
                    }

                })
            }
        })

        
        if($('.invite').length == 1){

            $('.invite').click(function(){
                // alert('copy')
            })

            $('.invite').attr('data-clipboard-text', location.href);
            var clipboard = new Clipboard('.invite');
            // alert(clipboard);
            clipboard.on('success', function(e) {
                // alert('success')
                $('.clip').show();
                setTimeout(function(){
                    $('.clip').hide();
                }, 1000)
                e.clearSelection();
            });

        }
        $('.shadow, .icon-close').click(function(){
            $(this).parents('.pop').hide();

            $('.pop').removeClass('has-error').find('.err').html('');
            

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
            
            web3.eth.getBalance(account,function(r, data){
                // alert(data)
                if(data == 0){
                    M.showDialog();
                    $('.pop-create').hide();
                }else{
                    M.createRoom($(this));
                }
            })
            // return;

                 
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

        // $('#btnDownloadApp').click(function(){
            // var GPUrl = 'https://play.google.com/store/apps/details?id=com.blockchain.dapp.browser&referrer=utm_source%3Dins_d_ethdice'
            //     , marketUrl = 'market://details?id=com.blockchain.dapp.browser&referrer=utm_source%3Dins_d_ethdice'
            //     ;
            // if (typeof cm_web_app != 'undefined' && cm_web_app.hasOwnProperty('go2Google')) {
            //     cm_web_app.go2Google(GPUrl);
            // } else if (typeof cm_web_app != 'undefined' && cm_web_app.hasOwnProperty('openMarket')) {
            //     cm_web_app.openMarket(GPUrl);
            // } else if (typeof android != 'undefined' && android.hasOwnProperty('openMarket')) {
            //     android.openMarket(GPUrl);
            // } else if (typeof ijinshan != 'undefined' && ijinshan.hasOwnProperty('go2Google')) {
            //     ijinshan.go2Google(GPUrl);
            // } else {
            //     M.androidTryOpenAppOrDownload({
            //         market: marketUrl,
            //         fail: function() {
            //             window.location.href = GPUrl;
            //         }
            //     })
            // }

        // })
     
    }
    , showDialog: function(){
        $('.pop-msg').show();
    }
    , isCreateRoom: function(btn, playerNum, betNum){
        var isCreate = true
            , roomErr = $('.pop-create input[name=room-num]').parents('.ipt-box').find('.err')
            , ethErr = $('.pop-create input[name=eth]').parents('.ipt-box').find('.err')
            ;
        $('.pop-create').removeClass('has-error').find('.err').html('');

        if(btn.hasClass('disabled')){
            isCreate = false;
            // return;
        }

        if(playerNum+"" == 'NaN'){
            // 游戏人数为数字
            roomErr.html(M.msg1)
            isCreate = false;
            // return;
        }else if(betNum+"" == 'NaN'){
            // 赌注必须为数字
            ethErr.html(M.msg2)
            isCreate = false;
            // return;
        }

        if(playerNum >= 2 && playerNum <= 6){

        }else if(playerNum < 2 || playerNum > 6){
            // 人数需要在2~6之间 
            roomErr.html(M.msg1)
            isCreate = false;
            // return;
        }

        if(betNum >= 0.01 && betNum <= 10000){

        }else if(betNum < 0.01){
            // 赌注最小为0.01
            ethErr.html(M.msg2)
            isCreate = false;
            // return;
        }else if(betNum > 10000){
            // 赌注最大为10000
            ethErr.html(M.msg3)
            isCreate = false;
            // return;
        }

        if(!isCreate){
            $('.pop-create').addClass('has-error');
        }
        
        return isCreate;
    }

    , createRoom: function(btnCreate){
        var playerNum = parseInt($('.pop-create input[name=room-num]').val())
                , betNum = parseFloat(parseFloat($('.pop-create input[name=eth]').val()).toFixed(5))
                , shareUrl = ''
                , btn = btnCreate
                , isCreate = true
                , loading = $('.pop-create .loading')
                ;

        isCreate = M.isCreateRoom(btn, playerNum, betNum);

        if(!isCreate) return;

        btn.addClass('disabled');
        loading.html(M.loadingMsg).show();
            
        App.creatRoom( playerNum, betNum, function(r, data){
            btn.removeClass('disabled');
            if(r == 1){
                
                loading.hide();
                $('.pop-create').hide();
                var roomId = data['logs'][0]['args']['roomID']['c'][0];
                $('.pop-suc .room-num').find('span').html(roomId)
                $('.pop-suc').show().find('.pop-btn-suc').attr('href', 'play.html?roomid='+roomId);

                // console.log(M.undoList)
                // console.log(data)
                var room = {
                    roomId: roomId
                    , chip : betNum
                    , diceList: []
                    , numAllow: playerNum
                    , numReal: 1
                    , diceMax: 0
                    , winnerNum: 0
                    , playerList: [account]
                    , playerWinPrice :[0, 0, 0, 0, 0, 0]
                }
                // console.log(room)
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
                loading.html(M.msgCreateFailed);
                // console.log('err');
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

    , checkMetamask: function(){
        if(!$('.wrap').hasClass('download')){
            // alert(M.getStorage('web3'))
            // if(M.getStorage('web3') == 1){
            //     alert('metamask is existed store2')
            //     return true;
            // }else{
                if (typeof window !== 'undefined' && typeof web3 !== 'undefined') {
                    // M.setStorage('web3', 1);
                    // alert('metamask is existed web32')
                    // metamask is running.
                    // console.log('metamask is running')
                } else {
                    // alert('metamask is not existed web32')
                    // M.setStorage('web3', 0);
                    // console.log('metamask is not existed')
                    location.href = 'download.html';
                }
            // }
            
        }
    }
    , initStorage:function(){
        // console.log(account);
        // console.log(M.getStorage('account'));
        // 切换用户了
        if(M.getStorage('account') != account){
            // console.log('clear')
            localStorage.clear();
        }
        M.setStorage('account', account);
        // }
    }
    , init:function(){
        // alert(web3.version.network);
        if($('.wrap').hasClass('index')){
            M.getList(0);
            M.getHotList(0, function(){});
        }else if($('.wrap').hasClass('play')){
            M.initStorage();
            M.getRoomDetail(M.getParameter('roomid'));
            // if($('.wrap').hasClass('result'))
            var interval = 30000;
            // setTimeout(function(){
                // window.location.href = location.href;
                // setTimeout(arguments.callee,interval);
            // }, interval)
        }

        this.bind();

        

        
       
    }

}
$(function () { 
    App.init();
    // M.checkMetamask();
    
    if($('.wrap').hasClass('download')){
        M.init();
    }
});
