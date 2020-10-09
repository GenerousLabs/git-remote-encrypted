import baseConvertIntArray from 'base-convert-int-array';
import base36 from 'base36';

export const uint8ArrayToBase36 = (input: Uint8Array): number[] => {
  return baseConvertIntArray(Array.from(input), { from: 256, to: 36 });
};

export const base36ToString = (input: number[]) => {
  return input.map(base36.base36encode).join('');
};
