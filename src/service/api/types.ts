export interface RpcRes<T = any> {
  code: number;
  result?: T;
  error?: ErrorInfo;
}
interface ErrorInfo {
  code: string;
  message: string;
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
  contractAddress?: string;
}

export interface NRC20Asset extends AssetItem {
  tokenSymbol: string;
  key: string;
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
