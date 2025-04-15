type EnvType = 'beta' | 'prod';

const env = process.env.BUILD_ENV as EnvType;

const timeout = 15000;

const config = {
  beta: {
    isBeta: true,
    NERVE: {
      chainName: 'NERVE',
      chainId: 5,
      assetId: 1,
      prefix: 'TNVT',
      symbol: 'NVT',
      apiUrl: 'https://beta.public.nerve.network',
      exploreUrl: 'http://beta.scan.nerve.network',
      logo: 'https://files.nabox.io/icon/NERVE.png'
    },
    NULS: {
      chainName: 'NULS AI',
      chainId: 2,
      assetId: 1,
      prefix: 'tNULS',
      symbol: 'NULS',
      apiUrl: 'https://beta.public1.nuls.io',
      exploreUrl: 'https://beta.nulscan.io',
      logo: 'https://files.nabox.io/icon/NAI.png'
    },
    timeout
  },
  prod: {
    isBeta: true,
    NERVE: {
      chainName: 'NERVE',
      chainId: 9,
      assetId: 1,
      prefix: 'NERVE',
      symbol: 'NVT',
      apiUrl: 'https://public.nerve.network',
      exploreUrl: 'https://scan.nerve.network',
      logo: 'https://files.nabox.io/icon/NERVE.png'
    },
    NULS: {
      chainName: 'NULS AI',
      chainId: 1,
      assetId: 1,
      prefix: 'NULS',
      symbol: 'NULS',
      apiUrl: 'https://public1.nuls.io',
      exploreUrl: 'https://nulscan.io',
      logo: 'https://files.nabox.io/icon/NAI.png'
    },
    timeout
  }
};

const envConfig = config[env];
export default envConfig;

export const chainList = [envConfig.NULS, envConfig.NERVE];

export type IChain = typeof chainList[0];
