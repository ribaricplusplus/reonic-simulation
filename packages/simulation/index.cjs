const path = require('path');

// Load the native addon
const addon = require(path.join(__dirname, 'build', 'addon.node'));

module.exports = addon;