import type { Bits, Bytes, GB, KB, MB } from "@/@types/common";
import { Memory } from "./Memory";
import type { VirtualMemory } from "./VirtualMemory";
import type { OS, ProcessEntry } from "./ProcessManager";

interface PhysicalMemoryFrameBlockAddress {
    address: string;
    data: string;
}
interface PhysicalMemoryFrameBlock {
    id: number;
    size: Bytes;
    active: boolean;
    adresses: PhysicalMemoryFrameBlockAddress[];
}

export class PhysicalMemory extends Memory {
    /**
     * The physical memory table
     */
    public _frameTable: Array<PhysicalMemoryFrameBlock> = [];

    /**
     * **All values in bytes**
     * @param totalSize
     * @param pageSize
     */
    constructor(totalSize: Bytes, pageSize: Bytes) {
        super(totalSize, pageSize);

        this._frameTable = Array.apply(null, Array(this._pageQuantity)).map(
            (_, i) => ({
                id: i,
                size: this._pageSize,
                active: false,
                adresses: Array.apply(null, Array(this._pageSize)).map(
                    (_, k) => ({
                        address:
                            "0x" +
                            ((i * pageSize + k) >>> 0)
                                .toString(2)
                                .padStart(this._addresses, "0"),
                        data: "0",
                    })
                ),
            })
        );
    }

    protected findFreeFrame(): PhysicalMemoryFrameBlock | null {
        return this._frameTable.find((frame) => !frame.active) ?? null;
    }

    public allocateOSMemory(OS: OS) {
        var osLastPageSize =
            OS.virtualMemory._pageSize -
            (OS.virtualMemory.pageTable.length * this._pageSize -
                OS.virtualMemory.processSize);
        OS.virtualMemory.pageTable.forEach((pageBlock, i) => {
            //If the page is already mapped we skip it (occurs when the process is prempted and some pages are left in memory)
            if (pageBlock.mappedFrame != null) return;

            var frame = this.findFreeFrame();
            if (frame == null) {
                console.log("No free memory to load the full OS");
                return;
            }

            //Put the data on each physical address and map it in the page table
            if (i == OS.virtualMemory.pageTable.length - 1) {
                frame.adresses.forEach((address, i) => {
                    if (i > osLastPageSize - 1) return;
                    address.data = "OS";
                });
                pageBlock.addresses.forEach((address, i) => {
                    if (i > osLastPageSize - 1) return;
                    address.valid = 1;
                });
            } else {
                frame.adresses.forEach((address, i) => {
                    address.data = "OS";
                });
                pageBlock.addresses.forEach((address, i) => {
                    address.valid = 1;
                });
            }
            frame.active = true;
            pageBlock.mappedFrame = frame.id;
        });
    }

    public allocateMemory(
        process: ProcessEntry,
        activeProcesses: ProcessEntry[],
        allocationType: "partial" | "full"
    ) {
        var processLastPageSize =
            process.virtualMemory._pageSize -
            (process.virtualMemory.pageTable.length * this._pageSize -
                process.virtualMemory.processSize);

        var freedMemory = false;
        process.virtualMemory.pageTable.forEach((pageBlock, i) => {
            //If the page is already mapped we skip it (occurs when the process is prempted and some pages are left in memory)
            if (pageBlock.mappedFrame != null) return;

            var toss: "allocate" | "ignore" = "allocate";
            if (i != 0) toss = this.tossCoin();
            if (allocationType == "partial" && toss == "ignore") return;
            var frame = this.findFreeFrame();

            //If there is no free memory to use, we need to deallocate some memory from other processes
            if (frame == null && !freedMemory) {
                var neededFrames = Math.ceil(
                    process.size - (i * this._pageSize) / this._pageSize
                );
                activeProcesses.forEach((p, x) => {
                    //We don't deallocate memory from the process that is being allocated
                    if (process.pid == p.pid) return;
                    //If we already deallocated enough memory we stop
                    if (x > neededFrames - 1) return;
                    this.deallocateMemory(p, "full");
                });
                freedMemory = true;
                frame = this.findFreeFrame();
            }

            if (frame == null) {
                console.log("No free memory to load the full process");
                return;
            }

            //Put the data on each physical address and map it in the page table
            if (i == process.virtualMemory.pageTable.length - 1) {
                frame.adresses.forEach((address, i) => {
                    if (i > processLastPageSize - 1) return;
                    address.data = process.pid.toString();
                });
                pageBlock.addresses.forEach((address, i) => {
                    if (i > processLastPageSize - 1) return;
                    address.valid = 1;
                });
            } else {
                frame.adresses.forEach((address, i) => {
                    address.data = process.pid.toString();
                });
                pageBlock.addresses.forEach((address, i) => {
                    address.valid = 1;
                });
            }
            frame.active = true;
            pageBlock.mappedFrame = frame.id;
        });
    }

    //33% chance of allocating a frame
    protected tossCoin(): "allocate" | "ignore" {
        return Math.random() <= 0.33 ? "allocate" : "ignore";
    }

    /**
     *
     * Deallocates the memory of a process
     */
    public deallocateMemory(
        process: ProcessEntry,
        deallocationType: "partial" | "full"
    ) {
        process.virtualMemory.pageTable.forEach((pageBlock, i) => {
            if (pageBlock.mappedFrame == null) return;

            //Partial deallocation we leave some part of the process in memory (in this case the first loaded page)
            if (i == 0 && deallocationType == "partial") return;

            var frame = this._frameTable[pageBlock.mappedFrame];
            frame.active = false;
            frame.adresses.forEach((address) => {
                address.data = "0";
            });

            pageBlock.mappedFrame = null;
            pageBlock.addresses.forEach((address) => {
                address.valid = 0;
            });
        });
    }

    public showInfo() {
        console.log(`Total size: ${this.totalSize} bytes`);
        console.log(`Page size: ${this._pageSize} bytes`);
        console.log(`Offset: ${this._offset} bits`);
        console.log(`Physical addresses: ${this._addresses} bits`);
        console.log(`Physical page addresses: ${this._pageAddresses} bits`);
        console.log(`Physical page quantity: ${this._pageQuantity}`);
        console.log(`Physical page frames: ${this._frameTable}`);
    }
}
