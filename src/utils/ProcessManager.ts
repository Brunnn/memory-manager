import { computed, ref } from "vue";
import type { Bytes, PID } from "../@types/common";
import type { PhysicalMemory } from "./PhysicalMemory";
import type { VirtualMemory } from "./VirtualMemory";

interface QueueEntry {
    processPID: PID;
    arrivedAt: number;
    leftAt: number | null;
}

interface QueueHistoryEntry extends QueueEntry {
    remainingTime: number;
}

export interface ProcessEntry {
    pid: PID;
    size: number;
    burstTime: number;
    allocationTime: number;
    remainingTime: number;
    virtualMemory: VirtualMemory;
    fresh: boolean;
    state: "executing" | "finished" | "waiting" | "killed";
}

export class ProcessManager {
    private _quantum: number = 0;
    public timePassed = 0;

    public errorMessage: string = "";

    private _physicalMemory: PhysicalMemory;
    private _virtualMemoryDefinition: VirtualMemory;

    private _aptQueue: Array<QueueEntry> = [];
    private _queueHistory: Array<QueueHistoryEntry> = [];

    private _lastGeneratedPID: number | null = null;

    protected newPID(): PID {
        this._lastGeneratedPID =
            this._lastGeneratedPID === null ? 0 : this._lastGeneratedPID + 1;
        return "p" + this._lastGeneratedPID;
    }

    /**
     * List of all the processes that have been generated
     */
    private _processes: Array<ProcessEntry>;

    constructor(
        physicalMemory: PhysicalMemory,
        virtualMemory: VirtualMemory,
        quantum: number
    ) {
        this._quantum = quantum;
        this._aptQueue = [];
        this._processes = [];
        this._physicalMemory = physicalMemory;
        this._virtualMemoryDefinition = virtualMemory;
    }

    private _systemSpeedMultiplier: number = 1;
    private _paused = true;
    public setSystemSpeed(speedMultiplier: number) {
        this._systemSpeedMultiplier = speedMultiplier;
    }
    public resumeSystem() {
        this._paused = false;
        this.processQueue();
    }
    public pauseSystem() {
        this._paused = true;
    }

    private _currentExecutingProcess: {
        process: ProcessEntry;
        processedTime: number;
    } | null = null;

    /**
     * Puts a process in the apt queue
     */
    private allocateInQueue(process: ProcessEntry) {
        this._aptQueue.push({
            processPID: process.pid,
            arrivedAt: this.timePassed,
            leftAt: null,
        });

        this._queueHistory.push({
            arrivedAt: this.timePassed,
            processPID: process.pid,
            leftAt: null,
            remainingTime: process.remainingTime,
        });
        process.fresh = false;

    }

    /**
     * Executes the next process in the queue
     */
    private executeQueueProcess() {
        let queueEntry = this._aptQueue.shift();
        if (!queueEntry){
            this.errorMessage = "Não há processos na fila de aptos, porém o escalonador tentou executar um processo";
            return;
        };
        var process = this._processes.find(
            (p) => p.pid === queueEntry?.processPID
        );
        if (!process) {
            this.errorMessage = `Escalonador tentou executar um processo que não existe: ${queueEntry?.processPID}`;
            return;
        }

        var queueHistoryEntry = this._queueHistory.find(
            (a) => a.processPID === queueEntry?.processPID && a.leftAt === null
        );
        queueHistoryEntry!.leftAt = this.timePassed;

        this._currentExecutingProcess = {
            process: process,
            processedTime: 0,
        };

        process.state = "executing";
        this._physicalMemory.allocateMemory(
            process,
            this._processes.filter((p) => p.state !== "killed" && p.state !== "finished" && p.remainingTime != p.burstTime),
            process.remainingTime == process.burstTime ? "partial" : "full"
        );
    }

    public terminateProcess(pid: PID) {
        var process = this._processes.find((p) => p.pid === pid);
        if (!process) return false;

        if (
            this._currentExecutingProcess &&
            this._currentExecutingProcess.process.pid === pid
        )
            this._currentExecutingProcess = null;

        this._aptQueue = this._aptQueue.filter((p) => p.processPID !== pid);

        var queueEntry = this._queueHistory.find(
            (a) => a.processPID === pid && a.leftAt === null
        );
        if (queueEntry) queueEntry.leftAt = this.timePassed;

        process.state = process.remainingTime === 0 ? "finished" : "killed";
        this._physicalMemory.deallocateMemory(process, "full");
        return true;
    }

    /**
     * Terminates the current process
     */
    private terminateCurrentProcess() {
        var process = this._currentExecutingProcess?.process;
        if (!process) return;
        this._currentExecutingProcess = null;
        return this.terminateProcess(process.pid);
    }

    /**
     * Preempts the current process
     */
    private preemptCurrentProcess() {
        var process = this._currentExecutingProcess?.process;
        if (!process) return;
        this._currentExecutingProcess = null;

        process.state = "waiting";
        this._physicalMemory.deallocateMemory(process, "partial");
        this.allocateInQueue(process);
    }

    /**
     * Main function that deals with the process queue
     */
    protected processQueue() {
        //Check if any new processes have arrived
        var processesToPutInQueue = this._processes.filter(
            (p) => p.allocationTime <= this.timePassed && p.fresh
        );
        if (processesToPutInQueue.length > 0) {
            processesToPutInQueue.forEach((p) => this.allocateInQueue(p));
        }

        //Check if there's a process executing
        if (this._currentExecutingProcess) {
            this._currentExecutingProcess.processedTime++;
            this._currentExecutingProcess.process.remainingTime--;

            //If the process has finished, terminate it
            if (this._currentExecutingProcess.process.remainingTime === 0)
                this.terminateCurrentProcess();
            //If the process has reached the quantum, preempt it
            else if (
                this._currentExecutingProcess.processedTime === this._quantum &&
                this._aptQueue.length > 0
            )
                this.preemptCurrentProcess();
        }

        //If there is no process executing, execute the next one in the queue
        if (!this._currentExecutingProcess && this._aptQueue.length > 0)
            this.executeQueueProcess();

        this.timePassed++;

        if (!this._paused)
            setTimeout(() => {
                this.processQueue();
            }, 1000 / this._systemSpeedMultiplier);
    }

    public killProcess(pid: PID) {
        var process = this._processes.find((p) => p.pid === pid);
        if (!process) {
            this.errorMessage = `Processo ${pid} não encontrado`;
            return false;
        }
        return this.terminateProcess(pid);
    }

    public killAll(){
        var pids: PID[] = []
        this._processes.forEach((p) => {
            if (p.state == "killed" || p.state == "finished") return;
            pids.push(p.pid)
            this.terminateProcess(p.pid);
        })
        return pids;
    }

    public generateProcess(
        size: Bytes,
        burstTime: number,
        arrival: number | null = null
    ): PID | null {
        if (size > this._virtualMemoryDefinition.totalSize) {
            console.log("Process size is bigger than the virtual memory size");
            this.errorMessage = 
                "Processo com tamanho maior que o tamanho da memória virtual"
            ;
            return null;
        }
        let pid = this.newPID();
        this._processes.push({
            pid: pid,
            size,
            burstTime,
            allocationTime: arrival ?? this.timePassed,
            remainingTime: burstTime,
            fresh: true,
            virtualMemory: this._virtualMemoryDefinition.clone(size),
            state: "waiting",
        });
        return pid;
    }
}
