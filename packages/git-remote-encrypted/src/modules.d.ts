declare module 'base-convert-int-array' {
  export default (
    input: number[],
    opts: { from: number; to: number }
  ): number[] => {};
}

declare module 'base36' {
  export default {
    base36encode: (input: number | string): string => {},
    base36decode: (input: string): number => {},
  };
}
