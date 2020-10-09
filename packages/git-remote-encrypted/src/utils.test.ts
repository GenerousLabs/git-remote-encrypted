import { uint8ArrayToBase36 } from './utils';

describe('utils', () => {
  describe('uint8ArrayToBase32()', () => {
    it.each([
      [
        [255, 39],
        [1, 14, 14, 15],
      ],
      [
        [1, 0, 0, 9],
        [9, 35, 21, 14, 1],
      ],
      [
        [255, 0, 0, 0, 9, 4, 8, 7, 1],
        [27, 20, 26, 6, 13, 10, 18, 31, 8, 11, 33, 2, 25, 29],
      ],
    ])('Covnerts a series of known values #GQrFkj', (input, output) => {
      expect(uint8ArrayToBase36(Uint8Array.from(input))).toEqual(output);
    });
  });
});
