import type { Bytes } from "@/@types/common";
import { Memory } from "./Memory";
import type { PhysicalMemory } from "./PhysicalMemory";

export class VirtualMemory extends Memory{

    /**
     * The Physical Memory this Virtual Memory is using
     */
    private _physicalMemory: PhysicalMemory;

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
    constructor(totalSize: Bytes, pageSize: Bytes, physicalMemory: PhysicalMemory){
        super(totalSize, pageSize);
        this._physicalMemory = physicalMemory;

    }


    public showInfo(){
        console.log(`Total size: ${this._totalSize} bytes`);
        console.log(`Page size: ${this._pageSize} bytes`);
        console.log(`Offset: ${this._offset} bits`);
        console.log(`Virtual addresses: ${this._addresses} bits`);
        console.log(`Virtual page addresses: ${this._pageAddresses} bits`);
        console.log(`Virtual page quantity: ${this._pageQuantity}`);
    }

}