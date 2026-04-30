declare module "@stellar/js-xdr" {
  export class XdrReader {
    constructor(buffer: Buffer | Uint8Array);
    readonly eof: boolean;
    readonly length: number;
    readonly cursor: number;
  }
}
