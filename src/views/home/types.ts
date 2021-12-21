export enum Tabs {
  Sign = 'Sign',
  CreateAddress = 'CreateAddress',
  CreateTx = 'CreateTx'
}

interface AddressItem {
  Ethereum: string;
  NULS: string;
  NERVE: string;
}

export interface MultiAddress {
  address: string;
  minSignCount: number;
  pubList: string[];
}

export interface AccountItem {
  pub: string;
  address: AddressItem;
  multi_NERVE: MultiAddress[];
  multi_NULS: MultiAddress[];
}
