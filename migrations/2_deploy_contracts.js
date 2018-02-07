// var RoomList = artifacts.require("RoomList");
var PlayDice = artifacts.require("PlayDice");


module.exports = function(deployer) {
  deployer.deploy(PlayDice);
  // deployer.link(PlayDice, RoomList);
  // deployer.deploy(RoomList);
};