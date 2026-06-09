const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Puerto fijo (evita conflictos con 8081/8082 u otros procesos)
config.server = {
  ...config.server,
  port: 8092,
};

module.exports = config;
