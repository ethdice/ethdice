account="";
App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    M.checkMetamask();
    return App.initWeb3();
  },

  initWeb3: function() {
    // setTimeout(function(){
    //   M.checkMetamask();
    // },2000)

    
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
    $.getJSON('build/contracts/PlayDice.json?v=5', function(data) {
    // $.getJSON('PlayDice.json', function(data) {
      // 用Adoption.json数据创建一个可交互的TruffleContract合约实例。
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);
      

      // 获取用户账号
      var d = web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          // console.log(error);
        }

        // alert(accounts);

        if(undefined == accounts){
          account = "";
          M.init();
        }

        account = accounts[0];

        // alert('account'+account)
        M.init();
        
        App.contracts.Adoption.deployed().then(function(instance) {
          adoptionInstance = instance;
      
        }).then(function(result) {
          // return App.markAdopted();
        }).catch(function(err) {
          // console.log(err.message);
        });

        return App.bindEvents();
      });




      });
      

  },

  bindEvents: function() {

  
  },

  //create room
  creatRoom: function( playNum, playMoney, callback ) {
    var self = this;
    var adoption;
    App.contracts.Adoption.deployed().then(function(instance) {
      adoption = instance;
      // alert('createRoom deployed'+playNum+'money:'+playMoney)

      // alert(adoption)

      return adoption.createRoom(playNum, {from: account,value:web3.toWei(playMoney, 'ether')});
    }).then(function(value) {
      // console.log(value);
      callback( '1' ,value );
    }).catch(function(e) {
      // alert(e)

      callback( '0' ,e );
      // console.log(e);
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
        // if (!error)
          // console.log(event);
      });

      return adoption.joinRoom(roomId,{from: account,value:web3.toWei(playMoney, 'ether')});
    }).then(function(value) {
      // console.log(value);
      callback('1', value); 
      return value;
    }).catch(function(e) {      
      callback('0', e);      
      // console.log(e);
    });
  }, 

  //getMoney
  getMoney: function( roomId, index, callback ) {
    var self = this;

    var adoption;
    App.contracts.Adoption.deployed().then(function(instance) {
      adoption = instance;

      var events = adoption.allEvents();
      events.watch(function(error, event){
        // if (!error)
        //   console.log(event);
      });
      return adoption.getMoney(roomId,index,{from: account,gas: 3141592});
      
    }).then(function(value) {
      callback('1',value);
      // console.log(value)
      return value;
    }).catch(function(e) {
      callback('0',e); 
      // console.log(e);
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
        // if (!error)
        //   console.log(event);
      });
      return adoption.getRoomData.call( roomId );
            
    }).then(function(value) {
      callback('1',value);
      // console.log(value);
      return value;      
    }).catch(function(e) {
      callback('0',e);
      // console.log(e);
    });
  },
  
  getUnfinishedRoomIDs: function( startId, callback ) {
    var self = this;
    var adoption;
    App.contracts.Adoption.deployed().then(function(instance) {
      adoption = instance;

      var events = adoption.allEvents();
      events.watch(function(error, event){
        // if (!error)
        //   console.log(event);
      });

      return adoption.getUnfinishedRoomIDs.call( startId );
    }).then(function(value) {
      // console.log(value);      
      callback('1',value);
      return value;
    }).catch(function(e) {
      callback('0',e);
      // console.log(e);
    });
  },

  getFinishedRoomIDs: function( startId, callback ) {
    var self = this;

    var adoption;
    App.contracts.Adoption.deployed().then(function(instance) {
      adoption = instance;

      var events = adoption.allEvents();
      events.watch(function(error, event){
        // if (!error)
          // console.log(event);
      });

      return adoption.getFinishedRoomIDs.call( startId );
    }).then(function(value) {
      // console.log(value);      
      callback('1',value);
      return value;
    }).catch(function(e) {
      callback('0',e);
      // console.log(e);
    });
  },

  //test
  test: function( callback ) {
    var self = this;

    var adoption;
    App2.contracts.Adoption.deployed().then(function(instance) {
    // console.log("test222");
    
      adoption = instance;

      var events = adoption.allEvents();
      events.watch(function(error, event){
        // if (!error)
          // console.log(event);
      });

      return adoption.updatePrice({from: account,value:web3.toWei(0.1, 'ether')});;    
    }).then(function(value) {
      // console.log("333");
      callback('1',value);
      // console.log(value);
    }).catch(function(e) {
      // callback('0',e); 
      // console.log(e);
    });
  },

};

// $(function() {
//   $(window).load(function() {
//     App.init();
//   });
// });
