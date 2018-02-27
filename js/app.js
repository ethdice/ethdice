account="";
App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache   
      // App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      App.web3Provider = new Web3.providers.HttpProvider('http://testethapi.ksmobile.net:8545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    // 加载Adoption.json，保存了Adoption的ABI（接口说明）信息及部署后的网络(地址)信息，它在编译合约的时候生成ABI，在部署的时候追加网络信息
    $.getJSON('build/contracts/PlayDice.json?v=1', function(data) {
    // $.getJSON('PlayDice.json', function(data) {
      // 用Adoption.json数据创建一个可交互的TruffleContract合约实例。
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // 获取用户账号
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
      
        account = accounts[0];
        
        App.contracts.Adoption.deployed().then(function(instance) {
          adoptionInstance = instance;
      
        }).then(function(result) {
          // return App.markAdopted();
        }).catch(function(err) {
          console.log(err.message);
        });

        M.init();
        return App.bindEvents();
      });
      
    });

    $.getJSON('build/contracts/ExampleContract.json', function(data) {
        // 用Adoption.json数据创建一个可交互的TruffleContract合约实例。
        var AdoptionArtifact = data;
        window.App2 = {
          contracts:{}
        };
        App2.contracts.Adoption = TruffleContract(AdoptionArtifact);
  
        // Set the provider for our contract
        App2.contracts.Adoption.setProvider(App.web3Provider);

  
        // 获取用户账号
        web3.eth.getAccounts(function(error, accounts) {
          if (error) {
            console.log(error);
          }
        
          account = accounts[0];
          
          App2.contracts.Adoption.deployed().then(function(instance) {
            console.log("test222");
            
              var adoption = instance;
        
              var events = adoption.allEvents();
              events.watch(function(error, event){
                if (!error)
                  console.log(event);
              });
        
              return adoption.getEURGBP.call();    
            }).then(function(value) {
            console.log("333");
            
              // callback('1',value);
              console.log(value);
            }).catch(function(e) {
              // callback('0',e); 
              console.log(e);
            });
  
          // M.init();
          // return App.bindEvents();
        });
        
      });
  },

  bindEvents: function() {

    //测试事件 
    $("#creatRoom").click(function(){
      App.creatRoom( '2', '0.7', function(r, data){
        console.log(data)
      } )
    });
    $("#joinRoom").click(function(){
      App.joinRoom( '2', '0.7', function(r, data){
        console.log(data)
      } )
    });
    $("#getMoney").click(function(){
      App.getMoney( '2', function(r, data){
        console.log(data)
      } )
    });
    $("#getRoomData").click(function(){
      App.getRoomData( '1', function(r, data){
        console.log(data)
      } )
    });
    $("#getUnfinishedRoomIDs").click(function(){
      App.getUnfinishedRoomIDs( 0, function(r, data){  //startId 从0开始
        console.log(data)
      } )
    });
    $("#getFinishedRoomIDs").click(function(){
      App.getFinishedRoomIDs( 0, function(r, data){  //startId 从0开始
        console.log(data)
      } )
    });
    $("#getHotWinRoomIDs").click(function(){
      App.getHotWinRoomIDs( function(r, data){
        console.log(data)
      } )
    });
    $("#test").click(function(){
      console.log("test");
      App.test( function(r, data){
        console.log(data)
      } )
    });

    
  
  },

  //create room
  creatRoom: function( playNum, playMoney, callback ) {
    var self = this;

    var adoption;
    App.contracts.Adoption.deployed().then(function(instance) {
      adoption = instance;

      return adoption.createRoom(playNum, {from: account,value:web3.toWei(playMoney, 'ether')});
    }).then(function(value) {
      console.log(value);
      callback( '1' ,value );
    }).catch(function(e) {
      callback( '0' ,e );
      console.log(e);
    });

  },

  // other player join room
  joinRoom: function(roomId, playMoney, callback) {
    var self = this;
    var adoption;
    App.contracts.Adoption.deployed().then(function(instance) {
      adoption = instance;

      var events = adoption.allEvents();
      events.watch(function(error, event){
        if (!error)
          console.log(event);
      });

      return adoption.joinRoom(roomId,{from: account,value:web3.toWei(playMoney, 'ether')});
    }).then(function(value) {
      console.log(value);
      callback('1', value); 
      return value;
    }).catch(function(e) {      
      callback('0', e);      
      console.log(e);
    });
  }, 

  //getMoney
  getMoney: function( roomId, callback ) {
    var self = this;

    var adoption;
    App.contracts.Adoption.deployed().then(function(instance) {
      adoption = instance;

      var events = adoption.allEvents();
      events.watch(function(error, event){
        if (!error)
          console.log(event);
      });

      return adoption.getMoney(roomId,{from: account,gas: 3141592});    
    }).then(function(value) {
      callback('1',value);
      return value;
    }).catch(function(e) {
      callback('0',e); 
      console.log(e);
    });
  },
  
  //get room data
  getRoomData: function( roomId, callback ) {
    var self = this;

    var adoption;
    App.contracts.Adoption.deployed().then(function(instance) {
      adoption = instance;

      var events = adoption.allEvents();
      events.watch(function(error, event){
        if (!error)
          console.log(event);
      });
            
      return adoption.getRoomData.call( roomId );
            
    }).then(function(value) {
      callback('1',value);
      console.log(value);
      return value;      
    }).catch(function(e) {
      callback('0',e);
      console.log(e);
    });
  },
  
  getUnfinishedRoomIDs: function( startId, callback ) {
    var self = this;

    var adoption;
    App.contracts.Adoption.deployed().then(function(instance) {
      adoption = instance;

      var events = adoption.allEvents();
      events.watch(function(error, event){
        if (!error)
          console.log(event);
      });

      return adoption.getUnfinishedRoomIDs.call( startId );
    }).then(function(value) {
      console.log(value);      
      callback('1',value);
      return value;
    }).catch(function(e) {
      callback('0',e);
      console.log(e);
    });
  },

  getFinishedRoomIDs: function( startId, callback ) {
    var self = this;

    var adoption;
    App.contracts.Adoption.deployed().then(function(instance) {
      adoption = instance;

      var events = adoption.allEvents();
      events.watch(function(error, event){
        if (!error)
          console.log(event);
      });

      return adoption.getFinishedRoomIDs.call( startId );
    }).then(function(value) {
      console.log(value);      
      callback('1',value);
      return value;
    }).catch(function(e) {
      callback('0',e);
      console.log(e);
    });
  },

  getHotWinRoomIDs: function( callback ) {
    var self = this;

    var adoption;
    App.contracts.Adoption.deployed().then(function(instance) {
      adoption = instance;

      var events = adoption.allEvents();
      events.watch(function(error, event){
        if (!error)
          console.log(event);
      });

      return adoption.getHotWinRoomIDs.call();
    }).then(function(value) {
      console.log(value);      
      callback('1',value);      
      return value;
    }).catch(function(e) {
      callback('0',e);      
      console.log(e);
    });
  },

  //test
  test: function( callback ) {
    var self = this;

    var adoption;
    App2.contracts.Adoption.deployed().then(function(instance) {
    console.log("test222");
    
      adoption = instance;

      var events = adoption.allEvents();
      events.watch(function(error, event){
        if (!error)
          console.log(event);
      });

      return adoption.updatePrice({from: account,value:web3.toWei(0.1, 'ether')});;    
    }).then(function(value) {
      console.log("333");
      // callback('1',value);
      console.log(value);
    }).catch(function(e) {
      // callback('0',e); 
      console.log(e);
    });
  },

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
