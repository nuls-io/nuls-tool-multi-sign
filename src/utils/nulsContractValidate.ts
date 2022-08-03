import { Times, timesDecimals } from './util';
// @ts-ignore
import sdk from 'nerve-sdk-js/lib/api/sdk';
// @ts-ignore
import utils from 'nerve-sdk-js/lib/utils/utils';
import config from '@/config';

import {
  validateContractCall,
  imputedContractCallGas,
  getContractMethodArgsTypes
} from '@/service/api';

/**
 * @param from
 * @param to
 * @param price
 * @param contractAddress
 * @param methodName
 * @param amount  转账数量
 * @param decimals 转账资产精度
 * @param methodDesc
 * @param args
 * @param multyAssetArray
 */
export async function getContractCallData(
  from: string,
  to: string,
  price: number,
  contractAddress: string,
  methodName: string,
  amount: string,
  decimals: number,
  methodDesc = '',
  args: any[] = [],
  multyAssetArray: any[] =[]
) {
  //console.log(from, to, price, contractAddress, methodName, amount, decimals);
  const gasLimit = sdk.CONTRACT_MAX_GASLIMIT;
  price = price || sdk.CONTRACT_MINIMUM_PRICE;
  let value = timesDecimals(amount, decimals);
  if (methodName === 'transfer') {
    /// nuls 合约资产  普通token转账、向合约地址转token
    args = [to, timesDecimals(amount, decimals)];
    value = '0';
  } else if (methodName === '_payable') {
    //合约 payable 向合约地址转nuls
    value = Times(amount, 100000000).toFixed();
    contractAddress = to;
  } else if (methodName === 'transferCrossChain') {
    // token跨链转账
    args = [to, timesDecimals(amount, decimals)];
    value = timesDecimals(0.1, 8);
  } else if (methodName === '_payableMultyAsset') {
    value = '0';
    contractAddress = to;
  }
  try {
    const validateRes = await validateContractCall(from, value, gasLimit, price, contractAddress, methodName, methodDesc, args, multyAssetArray);
    if (!validateRes.result)
      return { success: false, msg: validateRes.error?.message };

    const imputedRes = await imputedContractCallGas(from, value, contractAddress, methodName, methodDesc, args, multyAssetArray);
    if (!imputedRes.result)
      return { success: false, msg: imputedRes.error?.message };

    const contractConstructorArgsTypes = await getContractMethodArgsTypes(contractAddress, methodName);
    if (!contractConstructorArgsTypes.result)
      return {
        success: false,
        msg: contractConstructorArgsTypes.error?.message
      };

    const newArgs = utils.twoDimensionalArray(args, contractConstructorArgsTypes.result);
    //console.log(config);
    const contractCallData = {
      chainId: config.NULS.chainId,
      sender: from,
      contractAddress: contractAddress,
      value,
      gasLimit: imputedRes.result.gasLimit,
      price: price,
      methodName: methodName,
      methodDesc: methodDesc,
      args: newArgs
    };
    return { success: true, data: contractCallData };
  } catch (e) {
    return { success: false, msg: e };
  }
}
