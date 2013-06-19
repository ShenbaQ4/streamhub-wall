({
  paths: {
    'streamhub-zepto': 'lib/streamhub-zepto/build/zepto.min',
    almond: 'lib/almond/almond',
    'streamhub-sdk': 'http://cdn.livefyre.com/libs/sdk/v1.0.0/streamhub-sdk.min.gz.js'
  },
  packages: [{
     name: "streamhub-wall",
     location: "src"
  }],
  shim: {},
  baseUrl: '.',
  name: "streamhub-wall",
  include: ['almond'],
  stubModules: ['text', 'hgn'],
  exclude: ['almond', 'streamhub-zepto'],

  //todo: make this streamhub-sdk-$SDK_VERSION+build.$BUILD_NUMBER.min.js
  out: "streamhub-wall.min.js",
  namespace: "Livefyre",
  pragmasOnSave: {
    excludeHogan: true
  },
  optimize: "none",
  uglify2: {
    compress: {
      unsafe: true
    },
    mangle: true
  }
})
