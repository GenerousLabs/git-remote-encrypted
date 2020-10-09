import baseConvertIntArray from 'base-convert-int-array';

export const uint8ArrayToBase36 = (input: Uint8Array): number[] => {
  return baseConvertIntArray(Array.from(input), { from: 256, to: 36 });
};
