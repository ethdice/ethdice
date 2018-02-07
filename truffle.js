module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "http://10.60.198.94",
      port: 8545,
      network_id: "*" // Match any network id
    }
  }
};
