import type { Bits, Bytes } from "@/@types/common";

export abstract class Memory {
    /**
     * The total size of the memory in bytes
     */
    public totalSize: Bytes;

    /**
     * Each page block size in bytes
     */
    public _pageSize: Bytes;

    /**
     * The number of bits that are used to represent the offset
     */
    public _offset: Bits;

    /**
     * The number of bits that are used to represent the physical addresses
     */
    protected _addresses: Bits;

    /**
     * The number of bits that are used to represent the physical page addresses
     */
    protected _pageAddresses: Bits;

    /**
     * The number of pages in the memory
     */
    protected _pageQuantity: number;

    /**
     * **All values in bytes**
     * @param totalSize
     * @param pageSize
     */
    constructor(totalSize: Bytes, pageSize: Bytes) {
        this.totalSize = totalSize;
        this._pageSize = pageSize;

        this._offset = Math.log2(this._pageSize);
        this._addresses = Math.log2(this.totalSize);
        this._pageAddresses = this._addresses - this._offset;
        this._pageQuantity = Math.pow(2, this._pageAddresses);
    }
}
