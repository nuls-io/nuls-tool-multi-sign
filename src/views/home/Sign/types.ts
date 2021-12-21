export interface TxInfo {
  from: string;
  to: string;
  amount: string;
  symbol: string;
  type: number;
}

interface SignedInfo {
  pub: string;
  SignData: any;
}
export interface SignInfo {
  minSignCount: number;
  signedCount: number;
  signedInfo: SignedInfo[];
  pubkeyArray: string[];
}
