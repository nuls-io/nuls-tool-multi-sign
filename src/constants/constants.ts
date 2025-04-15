import { isBeta } from '@/utils/util';

export const NKey = isBeta ? '2-1' : '1-1';
export const NSymbol = 'NAI';
export const NDecimals = 4;
export const NULSDecimals = 8;
export const NDiffDeciamsl = NULSDecimals - NDecimals;

export function calDecimalsAndSymbol(item: any) {
  const { depositSymbol, depositAssetAddress, depositDecimals } = item;
  const isNULS = depositSymbol == 'NULS' || depositAssetAddress === NKey;
  const originDecimal = depositDecimals;
  const newDecimals = isNULS ? NDecimals : originDecimal;
  return {
    decimals: newDecimals,
    symbol: isNULS ? NSymbol : depositSymbol
  };
}
