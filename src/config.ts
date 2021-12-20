type EnvType = 'beta' | 'prod';

const env = process.env.BUILD_ENV as EnvType;

const timeout = 15000;

const config = {
  beta: {
    isBeta: true,
    NERVE: {
      chainId: 5,
      assetId: 1,
      prefix: 'TNVT',
      symbol: 'NVT',
      apiUrl: 'http://beta.public.nerve.network',
      exploreUrl: 'http://beta.scan.nerve.network'
    },
    NULS: {
      chainId: 2,
      assetId: 1,
      prefix: 'tNULS',
      symbol: 'NULS',
      apiUrl: 'http://beta.public1.nuls.io',
      exploreUrl: 'http://beta.nulscan.io'
    },
    timeout
  },
  prod: {
    isBeta: true,
    NERVE: {
      chainId: 9,
      assetId: 1,
      prefix: 'NERVE',
      symbol: 'NVT',
      apiUrl: 'https://public.nerve.network',
      exploreUrl: 'https://scan.nerve.network'
    },
    NULS: {
      chainId: 1,
      assetId: 1,
      prefix: 'NULS',
      symbol: 'NULS',
      apiUrl: 'https://public1.nuls.io',
      exploreUrl: 'https://nulscan.io'
    },
    timeout
  }
};

export default config[env];
