const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');
config.resolver.mainFields = ['react-native', 'browser', 'module', 'main'];
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    stream: require.resolve('stream-browserify'),
    events: require.resolve('events'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    crypto: require.resolve('crypto-browserify'),
    url: require.resolve('url'),
    net: require.resolve('./src/mocks/empty.js'),
    tls: require.resolve('./src/mocks/empty.js'),
    fs: require.resolve('./src/mocks/empty.js'),
    path: require.resolve('./src/mocks/empty.js'),
    child_process: require.resolve('./src/mocks/empty.js'),
    zlib: require.resolve('browserify-zlib'),
};

module.exports = config;
