import { divisionAndFix, genId, Plus, Times } from '@/utils/util';
import config from '@/config';
import http from '@/service';

import type { RpcRes, AssetItem, NULSInfo, BroadCast } from './types';

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
  const params = createRPCParams('getAccountLedgerList', [
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
      if (v.totalBalance) {
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
  return result.result || {};
}

export async function getNULSAssets(address: string) {
  const NULS = await getNULSInfo(address);
  const crossAssets = await getCrossAssets(address);
  const totalList = [NULS].concat(crossAssets);
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
    res.available = divisionAndFix(result.result.balance, 8, 8);
    res.chainId = chainId;
    res.assetId = assetId;
    res.decimals = 8;
    res.assetKey = chainId + '-' + assetId;
    res.symbol = result.result.symbol;
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
