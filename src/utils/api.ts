import nerve from 'nerve-sdk-js';
import nuls from 'nuls-sdk-js';
import { Minus, Plus, timesDecimals } from './util';
// @ts-ignore
import Signature from 'elliptic/lib/elliptic/ec/signature';
// @ts-ignore
import txsignatures from 'nerve-sdk-js/lib/model/txsignatures';
// @ts-ignore
import BufferReader from 'nerve-sdk-js/lib/utils/bufferreader';
// @ts-ignore
import txs from 'nerve-sdk-js/lib/model/txs';
import config from '@/config';
import { getProvider } from '@/hooks/useEthereum';
// @ts-ignore
import Serializers from 'nerve-sdk-js/lib/api/serializers';
// @ts-ignore
import sdk from 'nerve-sdk-js/lib/api/sdk';
const multi = require('nerve-sdk-js/lib/model/mutilsigntxsignatures');
const CoinData = require('nerve-sdk-js/lib/model/coindata');
const ContractData = require('nuls-sdk-js/lib/model/contractdata');

import { getAssetBalance } from '@/service/api';

// import { broadcastHex, getAssetBalance } from "@/service/api";

interface NProps {
  chain: string;
  type?: number;
}

export class NTransfer {
  chain: string;
  chainInfo: any;
  type?: number;
  sdk = nerve;
  provider: any;

  constructor(props: NProps) {
    if (!props.chain) {
      throw '未获取到交易网络，组装交易失败';
    }
    this.chain = props.chain; //链网络
    this.chainInfo = config[props.chain];
    this.type = props.type; //交易类型
    this.sdk = props.chain === 'NULS' ? nuls : nerve;
    this.provider = getProvider();
  }

  validateAddress(address: string) {
    try {
      const res = this.sdk.verifyAddress(address);
      return res.right;
    } catch (e) {
      return false;
    }
  }

  async getTxHex(data: any) {
    const { inputs, outputs, txData, remarks = '', pub, signAddress } = data;
    let tAssemble = data.tAssemble;
    let hash;
    if (!tAssemble) {
      // 组装交易
      tAssemble = this.sdk.transactionAssemble(
        inputs,
        outputs,
        '',
        this.type,
        txData
      );
      // 调用metamask签名hash，然后拼接公钥完成交易签名
    }
    hash = '0x' + tAssemble.getHash().toString('hex');
    const signature = await this.signHash(hash, signAddress);
    tAssemble.signatures = this.sdk.appSplicingPub(signature, pub);
    return tAssemble.txSerialize().toString('hex');
  }

  // 补充签名
  async appendSignature(data: any) {
    const { pub, signAddress, txHexForSign } = data;
    const bufferReader = new BufferReader(Buffer.from(txHexForSign, 'hex'), 0);
    // 反序列回交易对象
    const tAssemble = new txs.Transaction();
    tAssemble.parse(bufferReader);
    const hash = '0x' + tAssemble.getHash().toString('hex');
    // const signData = this.sdk.appSplicingPub(signature, pub);
    const signature = await this.signHash(hash, signAddress);
    //初始化签名对象
    const txSignData = new txsignatures.TransactionSignatures();
    // // 反序列化签名对象
    const reader = new BufferReader(tAssemble.signatures, 0);
    txSignData.parse(reader);
    // 追加签名到对象中
    txSignData.addSign(Buffer.from(pub, 'hex'), Buffer.from(signature, 'hex'));

    tAssemble.signatures = txSignData.serialize();
    // tAssemble.signatures = signData;
    return tAssemble.txSerialize().toString('hex');
  }

  /**
   * @desc 利用metamask签名hash
   * @param hash 待签名交易hash
   * @param signAddress 签名账户地址
   */
  async signHash(hash: string, signAddress: string) {
    hash = hash.startsWith('0x') ? hash : '0x' + hash;
    let flat = await this.provider.request({
      method: 'eth_sign',
      params: [signAddress, hash]
    });
    // console.log(flat, 66, signAddress)
    flat = flat.slice(2); // 去掉0x
    const r = flat.slice(0, 64);
    const s = flat.slice(64, 128);
    // const recoveryParam = flat.slice(128)
    // signature = signature.slice(2)
    return new Signature({ r, s }).toDER('hex');
  }

  /**
   * @desc 创建多签地址
   * @param minSignCount 最小签名数
   * @param pubKeyArray 生成多签地址的公钥数组
   */
  createMultiAddress(minSignCount: number | string, pubKeyArray: string[]) {
    Buffer.from('0145614a', 'hex');
    const chainId = this.chainInfo.chainId;
    const addressPrefix = this.chainInfo.prefix;
    if (!minSignCount || minSignCount < 2 || minSignCount > 15) {
      throw 'minSignCount invalid';
    }
    if (
      !pubKeyArray ||
      pubKeyArray.length < minSignCount ||
      pubKeyArray.length > 15
    ) {
      throw 'pubKey array invalid';
    }
    // 公钥排序
    pubKeyArray = pubKeyArray.sort(function (s, t) {
      if (s < t) return -1;
      if (s > t) return 1;
      return 0;
    });

    let pubSeria = new Serializers();
    pubSeria.getBufWriter().writeUInt8(chainId);
    pubSeria.getBufWriter().writeUInt8(minSignCount);
    for (let i = 0; i < pubKeyArray.length; i++) {
      let pubKeyHex = pubKeyArray[i];
      let pub = Buffer.from(pubKeyHex, 'hex');
      pubSeria.getBufWriter().write(pub);
    }
    const multiPub = pubSeria.getBufWriter().toBuffer();

    return nerve.getAddressByPub(chainId, 3, multiPub, addressPrefix);
  }

  // 创建多签交易, 只支持跨链资产和主资产
  createMultiTransaction(
    tAssemble: any,
    minSignCount: number,
    pubKeyArray: string[]
  ) {
    const pubKeyBufferArray = [];
    for (let pub of pubKeyArray) {
      pubKeyBufferArray.push(Buffer.from(pub, 'hex'));
    }
    const sign = new multi.MultiTransactionSignatures(
      minSignCount,
      pubKeyBufferArray
    );
    tAssemble.signatures = sign.serialize();
    // console.log(tAssemble.txSerialize().toString("hex"))
    return tAssemble.txSerialize().toString('hex');
  }

  /**
   * @desc 多签交易签名
   * @param txHex 交易hex
   * @param signAddress 签名地址
   * @param pub 签名地址公钥
   */
  async multiSign(txHex: string, signAddress: string, pub: string) {
    const bufferReader = new BufferReader(Buffer.from(txHex, 'hex'), 0);
    // 反序列回交易对象
    const tAssemble = new txs.Transaction();
    tAssemble.parse(bufferReader);
    const hash = '0x' + tAssemble.getHash().toString('hex');
    const signature = await this.signHash(hash, signAddress);

    //初始化签名对象
    const sign = new multi.MultiTransactionSignatures(0, null);
    // 反序列化签名对象
    const signReader = new BufferReader(tAssemble.signatures, 0);
    sign.parse(signReader);
    // 追加签名到对象中
    sign.addSign(Buffer.from(pub, 'hex'), Buffer.from(signature, 'hex'));
    //组装到交易中
    tAssemble.signatures = sign.serialize();
    console.log('txHash: ' + hash);
    //序列化交易，并返回
    return tAssemble.txSerialize().toString('hex');
  }

  async signTx(
    txHex: string,
    signAddress: string,
    pub: string,
    isNULSLedger = false
  ) {
    if (isNULSLedger) {
      return await window.nabox.signNULSTransaction({ txHex: txHex });
    } else {
      const tAssemble = nerve.deserializationTx(txHex);
      const hash = '0x' + tAssemble.getHash().toString('hex');
      const signature = await this.signHash(hash, signAddress);
      tAssemble.signatures = nerve.appSplicingPub(signature, pub);
      return tAssemble.txSerialize().toString('hex');
    }
  }

  // 查询多签已签名次数
  getSignedCount(txHex: string) {
    try {
      const bufferReader = new BufferReader(Buffer.from(txHex, 'hex'), 0);
      // 反序列回交易对象
      const tx = new txs.Transaction();
      tx.parse(bufferReader);
      const sign = new multi.MultiTransactionSignatures(0, null);
      const signReader = new BufferReader(tx.signatures, 0);
      sign.parse(signReader);
      const signedRes: any = [];
      sign.signatures.map((v: any) => {
        // console.log(v.pubkey, v.signData, 11)
        const pub = v.pubkey.toString('hex');
        const signData = v.signData.toString('hex');
        signedRes.push({
          pub,
          signData
        });
      });
      return {
        minSignCount: sign.m,
        signedInfo: signedRes,
        pubkeyArray: sign.pubkeyArray.map((v: any) => v.toString('hex'))
      };
    } catch (e) {
      return false;
    }
  }

  //通过txHex反序列化交易得到coinData
  deSerialize(txHex: string) {
    const reader = new BufferReader(Buffer.from(txHex, 'hex'), 0);
    const tx = new txs.Transaction();
    tx.parse(reader);
    const hash = tx.getHash().toString('hex');
    console.log(tx.signatures.toString("hex"), "signatures", tx, hash)
    const coinData = new CoinData(new BufferReader(tx.coinData, 0));
    for (let item in coinData) {
      // eslint-disable-next-line no-prototype-builtins
      if (coinData.hasOwnProperty(item)) {
        coinData[item].map((v: any) => {
          v.address = this.getStringAddressByBytes(v.address);
        });
      }
    }
    let txData: any = null;
    if (tx.type === 16) {
      txData = new ContractData(new BufferReader(tx.txData, 0));
    }
    return {
      type: tx.type,
      coinData,
      hash,
      txData
    };
  }

  // 通过公钥推出地址
  getAddressByPub(pub: string) {
    const chainId = this.chainInfo.chainId;
    const addressPrefix = this.chainInfo.prefix;
    return this.sdk.getAddressByPub(chainId, 1, pub, addressPrefix);
  }

  // 根据byte[] 获取 地址字符串
  getStringAddressByBytes(bytes: string) {
    return sdk.getStringAddressByBytes(bytes);
  }

  async inputsOrOutputs(data: any) {
    if (!this.type) {
      throw '获取交易类型失败';
    }
    if (this.type === 2) {
      //链内交易
      return this.transferTransaction(data);
    } else if (this.type === 10) {
      //跨链交易
    } else if (this.type === 16) {
      //调用合约
      return this.callContractTransaction(data);
    } else if (this.type === 43) {
      // nerve 网络提现到eth bsc
      return this.WithdrawalTransaction(data);
    }
  }

  //nuls nerve普通转账input output
  async transferTransaction(transferInfo: any) {
    const { from, to, assetsChainId, assetsId, amount, fee } = transferInfo;
    const inputs = [],
      outputs = [];
    //转账资产nonce
    const nonce: any = await this.getNonce(from, assetsChainId, assetsId);
    const { chainId, assetId } = this.chainInfo;
    if (chainId === assetsChainId && assetId === assetsId) {
      // 转账资产为本链主资产, 将手续费和转账金额合成一个input
      const newAmount = Plus(amount, fee).toFixed();
      inputs.push({
        address: from,
        assetsChainId,
        assetsId,
        amount: newAmount,
        locked: 0,
        nonce: nonce
      });
    } else {
      const mainAssetNonce = await this.getNonce(from, chainId, assetId);
      inputs.push({
        address: from,
        assetsChainId,
        assetsId,
        amount,
        locked: 0,
        nonce: transferInfo.nonce || nonce // 闪兑资产和跨链资产一样，闪兑后nonce值使用hash后16位
      });
      inputs.push({
        address: from,
        assetsChainId: chainId,
        assetsId: assetId,
        amount: fee,
        locked: 0,
        nonce: mainAssetNonce
      });
    }
    outputs.push({
      address: to,
      assetsChainId,
      assetsId,
      amount,
      lockTime: 0
    });
    return { inputs, outputs };
  }

  // nuls 调用合约
  async callContractTransaction(transferInfo: any) {
    const { from, assetsChainId, assetsId } = transferInfo;
    const nonce = await this.getNonce(from, assetsChainId, assetsId);
    const defaultFee = timesDecimals(0.001, 8); // 交易打包手续费
    const inputs = [
      {
        address: transferInfo.from,
        assetsChainId: transferInfo.assetsChainId,
        assetsId: transferInfo.assetsId,
        amount: Plus(transferInfo.amount, defaultFee).toFixed(),
        locked: 0,
        nonce: nonce
      }
    ];
    const outputs = [];
    if (transferInfo.toContractValue) {
      // 向合约地址转nuls
      outputs.push({
        address: transferInfo.to,
        assetsChainId: transferInfo.assetsChainId,
        assetsId: transferInfo.assetsId,
        amount: transferInfo.toContractValue,
        lockTime: 0
      });
    }

    const multyAssets = transferInfo.multyAssets;
    if (multyAssets && multyAssets.length) {
      // 向合约地址转平行链资产
      let length = multyAssets.length;
      for (let i = 0; i < length; i++) {
        let multyAsset = multyAssets[i];
        const nonce = await this.getNonce(
          from,
          multyAsset.assetChainId,
          multyAsset.assetId
        );

        inputs.push({
          address: transferInfo.from,
          assetsChainId: multyAsset.assetChainId,
          assetsId: multyAsset.assetId,
          amount: multyAsset.value,
          locked: 0,
          nonce: nonce
        });
        outputs.push({
          address: transferInfo.to,
          assetsChainId: multyAsset.assetChainId,
          assetsId: multyAsset.assetId,
          amount: multyAsset.value,
          lockTime: 0
        });
      }
    }
    return { inputs, outputs };
  }

  // nerve 提现
  async WithdrawalTransaction(transferInfo: any) {
    // const {
    //   from,
    //   assetsChainId,
    //   assetsId,
    //   amount,
    //   withdrawalFee,
    //   fee_asset,
    //   fee
    // } = transferInfo;
    // let nonce;
    // if (transferInfo.nonce) {
    //   nonce = transferInfo.nonce;
    // } else {
    //   nonce = await this.getNonce(from, assetsChainId, assetsId);
    // }
    // let inputs = [];
    // const totalFee = Plus(withdrawalFee, fee).toFixed();
    // if (fee_asset.chainId === assetsChainId && fee_asset.assetId === assetsId) {
    //   const newAmount = Plus(amount, totalFee).toFixed();
    //   inputs.push({
    //     address: from,
    //     amount: newAmount,
    //     assetsChainId,
    //     assetsId,
    //     nonce,
    //     locked: 0
    //   });
    // } else {
    //   const mainAssetNonce = await this.getNonce(
    //     from,
    //     fee_asset.chainId,
    //     fee_asset.assetId
    //   );
    //   inputs = [
    //     {
    //       address: from,
    //       amount: amount,
    //       assetsChainId,
    //       assetsId,
    //       nonce,
    //       locked: 0
    //     },
    //     {
    //       address: from,
    //       amount: totalFee,
    //       assetsChainId: fee_asset.chainId,
    //       assetsId: fee_asset.assetId,
    //       nonce: mainAssetNonce,
    //       locked: 0
    //     }
    //   ];
    // }
    // // 系统补贴手续费地址
    // const feeAddress = config.feeAddress;
    // const blockHoleAddress = config.destroyAddress;
    // let outputs = [
    //   {
    //     address: blockHoleAddress, //黑洞地址
    //     amount: amount,
    //     assetsChainId,
    //     assetsId,
    //     locked: 0
    //   },
    //   {
    //     address: feeAddress, //提现费用地址
    //     amount: withdrawalFee,
    //     assetsChainId: fee_asset.chainId,
    //     assetsId: fee_asset.assetId,
    //     locked: 0
    //   }
    // ];
    // return { inputs, outputs };
  }

  async getNonce(from: string, assetsChainId: number, assetsId: number) {
    const res: any = await getAssetBalance(
      this.chain,
      from,
      assetsChainId,
      assetsId
    );
    if (res.nonce) {
      return res.nonce;
    }
    throw 'Get nonce error: ' + res.message;
  }

  async broadcastHex(txHex: string) {
    // return await broadcastHex(txHex);
  }
}
