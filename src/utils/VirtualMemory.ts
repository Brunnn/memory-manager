import type { Binary, Bytes } from "@/@types/common";
import { Memory } from "./Memory";
import type { PhysicalMemory } from "./PhysicalMemory";

interface VirtualMemoryPageBlockAddress {
    address: string;
    valid: Binary;
}

interface VirtualMemoryPageBlock {
    id: number;
    size: Bytes;
    addresses: Array<VirtualMemoryPageBlockAddress>;
    mappedFrame: number | null;
}
export class VirtualMemory extends Memory {
    /**
     * The physical memory table
     */
    public pageTable: Array<VirtualMemoryPageBlock> = [];

    public processSize: Bytes = 0;

    /**
     * **All values in bytes**
     * @param totalSize
     * @param pageSize
     */
    constructor(totalSize: Bytes, pageSize: Bytes) {
        super(totalSize, pageSize);
    }

    clone(processSize: Bytes): VirtualMemory {
        const clone = new VirtualMemory(this.totalSize, this._pageSize);
        clone.processSize = processSize;

        var pageBlockCount = Math.ceil(processSize / this._pageSize);

        clone.pageTable = Array.apply(null, Array(pageBlockCount)).map(
            (_, i) => ({
                id: i,
                mappedFrame: null,
                size: this._pageSize,
                //One address per byte
                addresses: Array.apply(null, Array(this._pageSize)).map(
                    (_, k) => ({
                        address:
                            "0x" +
                            (this._pageSize * i + k >>> 0)
                                .toString(2)
                                .padStart(this._addresses, "0"),
                        valid: 0,
                    })
                ),
            })
        );

        return clone;
    }

    public showInfo() {
        console.log(`Total size: ${this.totalSize} bytes`);
        console.log(`Page size: ${this._pageSize} bytes`);
        console.log(`Offset: ${this._offset} bits`);
        console.log(`Virtual addresses: ${this._addresses} bits`);
        console.log(`Virtual page addresses: ${this._pageAddresses} bits`);
        console.log(`Virtual page quantity: ${this._pageQuantity}`);
    }
}
