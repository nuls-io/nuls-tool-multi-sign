export interface RpcRes<T> {
  code: number;
  result?: T;
  error?: ErrorInfo;
}
interface ErrorInfo {
  code: string;
}
export interface AssetItem {
  totalBalance: number;
  available: string;
  balanceStr: string;
  decimals: number;
  assetKey: string;
  chainId: number;
  assetId: number;
  symbol: string;
  balance: string;
}

export interface NULSInfo {
  address: string;
  balance: string;
  symbol: string;
}

export interface BroadCast {
  value: boolean;
  hash: string;
}
