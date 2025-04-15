import { divisionAndFix, genId, Plus, Times } from '@/utils/util';
import config from '@/config';
import http from '@/service';
import { NDecimals, NKey, NSymbol } from '@/constants/constants';

import type {
  RpcRes,
  AssetItem,
  NULSInfo,
  BroadCast,
  NRC20Asset
} from './types';

function createRPCParams(method: string, data: any): any {
  return {
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1000),
    method,
    params: data
  };
}

// 查询nerve链上资产列表
export async function getNERVEAssets(address: string, all = false) {
  const chainInfo = config.NERVE;
  const params = createRPCParams('getAccountLedgerListV2', [
    chainInfo.chainId,
    address
  ]);
  const result = await http.post<RpcRes<AssetItem[]>>({
    url: chainInfo.apiUrl,
    data: params
  });
  const assetList: AssetItem[] = [];
  if (result.result) {
    if (all) {
      return [...result.result];
    }
    result.result.map(v => {
      v.assetKey = v.chainId + '-' + v.assetId;
      if (v.assetKey === NKey) {
        v.decimals = NDecimals;
        v.symbol = NSymbol;
      }
      v.balanceStr = v.balance;
      if (v.balanceStr && v.balanceStr !== '0') {
        v.available = divisionAndFix(v.balanceStr, v.decimals, v.decimals);
        assetList.push(v);
      }
    });
  }
  return assetList;
}

// 获取资产详情、nonce值
export async function getAssetBalance(
  chain: string,
  address: string,
  assetsChainId: number,
  assetsId: number
) {
  const chainInfo = config[chain];
  const params = createRPCParams('getAccountBalance', [
    chainInfo.chainId,
    assetsChainId,
    assetsId,
    address
  ]);
  const result = await http.post<RpcRes<{ nonce: string }>>({
    url: chainInfo.apiUrl,
    data: params
  });
  return result.result || result.error;
}

export async function getNULSAssets(address: string) {
  const NULS = await getNULSInfo(address);
  const crossAssets = await getCrossAssets(address);
  const nrc20Assets = await getNRC20Tokens(address);
  const totalList = [NULS].concat(crossAssets).concat(nrc20Assets);
  return totalList.filter(v => +v.available);
}

// 获取NULS资产详情
export async function getNULSInfo(address: string): Promise<AssetItem> {
  const chainInfo = config.NULS;
  const { apiUrl, chainId, assetId } = chainInfo;
  const params = createRPCParams('getAccount', [chainId, address]);
  const result = await http.post<RpcRes<NULSInfo>>({
    url: apiUrl,
    data: params
  });
  const res = {} as AssetItem;
  if (result.result) {
    res.available = divisionAndFix(result.result.balance, NDecimals, NDecimals);
    res.chainId = chainId;
    res.assetId = assetId;
    res.decimals = NDecimals;
    res.assetKey = chainId + '-' + assetId;
    res.symbol = NSymbol;
  }
  return res;
}

// 获取NULS链跨链资产资产列表
export async function getCrossAssets(address: string): Promise<AssetItem[]> {
  const chainInfo = config.NULS;
  const params = createRPCParams('getAccountCrossLedgerList', [
    chainInfo.chainId,
    address
  ]);
  const result = await http.post<RpcRes<AssetItem[]>>({
    url: chainInfo.apiUrl,
    data: params
  });
  const res = result.result || [];
  res.map(v => {
    v.available = divisionAndFix(v.balance, v.decimals, v.decimals);
  });
  return res;
}

export async function getNRC20Tokens(address: string): Promise<AssetItem[]> {
  const chainInfo = config.NULS;
  const params = createRPCParams('getAccountTokens', [
    chainInfo.chainId,
    1,
    100,
    address
  ]);
  const result = await http.post<RpcRes<{ list: NRC20Asset[] }>>({
    url: chainInfo.apiUrl,
    data: params
  });
  const res = result.result?.list || [];
  res.map(v => {
    v.symbol = v.tokenSymbol;
    v.assetKey = v.key;
    v.available = divisionAndFix(v.balance, v.decimals, v.decimals);
  });
  return res;
}

export async function getTxInfo(chain: string, hash: string) {
  const chainInfo = config[chain];
  const params = createRPCParams('getTx', [chainInfo.chainId, hash]);
  return await http.post<RpcRes<BroadCast>>({
    url: chainInfo.apiUrl,
    data: params
  });
}

// 广播交易
export async function broadcastTx(chain: string, txHex: string) {
  const chainInfo = config[chain];
  const params = createRPCParams('broadcastTx', [chainInfo.chainId, txHex]);
  return await http.post<RpcRes<BroadCast>>({
    url: chainInfo.apiUrl,
    data: params
  });
  // return result.result || result.error;
}

// nuls链 验证调用合约交易
export async function validateContractCall(
  from: string,
  value: string,
  gasLimit: number,
  price: number,
  contractAddress: string,
  methodName: string,
  methodDesc: string,
  args: any[],
  multyAssets?: any[]
) {
  let multyAssetArray = [];
  if (multyAssets) {
    let length = multyAssets.length;
    multyAssetArray = new Array(length);
    for (let i = 0; i < length; i++) {
      let multyAsset = multyAssets[i];
      multyAssetArray[i] = [
        multyAsset.value,
        multyAsset.assetChainId,
        multyAsset.assetId
      ];
    }
  }
  const chainInfo = config.NULS;
  const params = createRPCParams('validateContractCall', [
    chainInfo.chainId,
    from,
    value,
    gasLimit,
    price,
    contractAddress,
    methodName,
    methodDesc,
    args,
    multyAssetArray
  ]);
  return await http.post<RpcRes<{ gasLimit: number }>>({
    url: chainInfo.apiUrl,
    data: params
  });
}

// nuls链预估调用合约交易的gas
export async function imputedContractCallGas(
  from: string,
  value: string,
  contractAddress: string,
  methodName: string,
  methodDesc: string,
  args: any[],
  multyAssets?: any[]
) {
  const chainInfo = config.NULS;
  const params = createRPCParams('imputedContractCallGas', [
    chainInfo.chainId,
    from,
    value,
    contractAddress,
    methodName,
    methodDesc,
    args,
    multyAssets
  ]);
  return await http.post<RpcRes<{ gasLimit: number }>>({
    url: chainInfo.apiUrl,
    data: params
  });
}

// nuls链 获取合约指定函数的参数类型
export async function getContractMethodArgsTypes(
  contractAddress: string,
  methodName: string
) {
  const chainInfo = config.NULS;
  const params = createRPCParams('getContractMethodArgsTypes', [
    chainInfo.chainId,
    contractAddress,
    methodName
  ]);
  return await http.post<RpcRes>({
    url: chainInfo.apiUrl,
    data: params
  });
}

// nuls链 查询合约详情
export async function getContract(contractAddress: string) {
  const chainInfo = config.NULS;
  const params = createRPCParams('getContract', [
    chainInfo.chainId,
    contractAddress
  ]);
  return await http.post<RpcRes>({
    url: chainInfo.apiUrl,
    data: params
  });
}
