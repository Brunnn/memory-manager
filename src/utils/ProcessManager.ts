import { PID } from "../@types/common";

class ProcessManager{


    private _quantum: number = 0;

    private _timePassed = 0;

    private _queue: Array<{
        pid: PID,
        arrivedAt: number,
        burstTime: number,
    }>

    private _lastGeneratedPID: PID = 0;
    private processes: Array<{
        pid: PID,
        
    }>

    constructor(){

    }



}