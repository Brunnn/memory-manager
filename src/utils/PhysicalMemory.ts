import type { Bits, Bytes, GB, KB, MB } from "@/@types/common";
import { Memory } from "./Memory";

export class PhysicalMemory extends Memory{

    /**
     * The physical memory table
     */
    private _pageTable: Array<{
        id: number,
        size: Bytes,
        active: boolean,
    }> = []

    /**
     * **All values in bytes**
     * @param totalSize 
     * @param pageSize 
     */
    constructor(totalSize: Bytes, pageSize: Bytes){
        super(totalSize, pageSize);
    }


    public showInfo(){
        console.log(`Total size: ${this._totalSize} bytes`);
        console.log(`Page size: ${this._pageSize} bytes`);
        console.log(`Offset: ${this._offset} bits`);
        console.log(`Physical addresses: ${this._addresses} bits`);
        console.log(`Physical page addresses: ${this._pageAddresses} bits`);
        console.log(`Physical page quantity: ${this._pageQuantity}`);
    }

}