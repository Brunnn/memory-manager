<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import VueCommand, { createStdout } from "vue-command";
import "vue-command/dist/vue-command.css";
import { PhysicalMemory } from "@/utils/PhysicalMemory";
import { VirtualMemory } from "@/utils/VirtualMemory";
import {
    ProcessManager,
    type AptQueueSnapshot,
    type ProcessEntry,
} from "@/utils/ProcessManager";
import ProcessInfo from "@/components/ProcessInfo.vue";

const physicalMemorySize = ref<number>(32);
const pageSize = ref<number>(4);
const virtualMemorySize = ref<number>(64);
const OSSize = ref<number>(4);
const quantum = ref<number>(5);

const commands = {
    help: () => {
        var text = `
            alloc <size> <burst> - Cria um processo com o tamanho e burst informados\n
            kill <pid|all>  - Finaliza o processo com o pid informado\n
            mem - Mostra a tabela de memória física\n
            shutdown | exit - Desliga o sistema\n
            fa - Tira um snapshot da fila de aptos\n
            fah - Mostra o histórico da fila de aptos\n
            tp <pid?> - Mostra a tabela de páginas do processo com o pid informado ou do SO caso omitido\n
            ps <pid?> - Mostra informações do processo com o pid informado ou dos processos ativos caso omitido\n
            psh - Mostra informações dos processos inativos\n
            pse - Mostra informações do processo em execução\n
        `
        return createStdout(text);
    },

    alloc: (args: any) => {
        var size = parseInt(args[1]);
        var burst = parseInt(args[2]);

        if (isNaN(size) || isNaN(burst)) {
            return createStdout("Tamanho e burst devem ser números");
        }
        var pid = processManager.value?.generateProcess(size, burst);

        return createStdout(`Processo ${pid} Criado`);
    },
    kill: (args: any) => {
        var killArg = args[1];
        if (killArg == undefined) {
            return createStdout("Informe o PID ou all");
        }

        if (killArg == "all") {
            var pids = processManager.value?.killAll();
            return createStdout(
                "Todos os processos finalizados\n" + pids?.join("\n")
            );
        }

        var killed = processManager.value?.killProcess(killArg);
        if (killed) {
            return createStdout("Processo finalizado");
        } else return createStdout(processManager.value?.errorMessage);
    },
    mem: () => {
        closeOtherSections();
        showMemInfo.value = true;

        return createStdout("Mostrando Tabela de Memória");
    },
    shutdown: () => {
        closeOtherSections();

        processManager.value?.pauseSystem();
        var pids = processManager.value?.killAll();
        shutdown.value = true;
        return createStdout(
            `Os processos ativos (${pids?.join(
                ", "
            )}) foram finalizados prematuramente. O sistema será desligado`
        );
    },
    exit: () => {
        closeOtherSections();

        processManager.value?.pauseSystem();
        var pids = processManager.value?.killAll();
        shutdown.value = true;
        return createStdout(
            `Os processos ativos (${pids?.join(
                ", "
            )}) foram finalizados prematuramente. O sistema será desligado`
        );
    },
    fa: () => {
        closeOtherSections();

        aptQueueSnapshot.value = processManager.value?.getAptQueueSnapshot();
        showAptQueueSnapshot.value = true;
        return createStdout("Tirando snapshot da fila de aptos");
    },
    fah: () => {
        closeOtherSections();
        showAptQueueHistory.value = true;
        return createStdout("Mostrando histórico da fila de aptos");
    },
    tp: (args: any) => {
        closeOtherSections();
        var pid = args[1];
        if (pid == undefined) {
            virtualMemoryInfo.value = {
                about: "Tabela de Páginas do SO",
                vm: processManager.value?.OS.virtualMemory!,
            };
            showVirtualMemoryInfo.value = true;

            return createStdout("Mostrando Tabela de Páginas do SO");
        }

        var process = processManager.value?.getProcessInfo(pid);
        if (!process) {
            return createStdout(processManager.value?.errorMessage);
        }
        virtualMemoryInfo.value = {
            about: "Mostrando Tabela de Páginas do Processo " + process.pid,
            vm: process.virtualMemory!,
        };
        showVirtualMemoryInfo.value = true;

        return createStdout(
            "Mostrando Tabela de Páginas do Processo " + process.pid
        );
    },
    ps: (args: any) => {
        closeOtherSections();
        var pid = args[1];
        if (pid == undefined) {
            showActiveProcesses.value = true;
            return createStdout("Mostrando Informações dos Processos Ativos");
        }

        var process = processManager.value?.getProcessInfo(pid);
        if (!process) {
            return createStdout(processManager.value?.errorMessage);
        }
        processInfo.value = process;
        showProcessInfo.value = true;
        return createStdout("Mostrando informações do processo " + process.pid);
    },
    psh: () => {
        closeOtherSections();

        showInactiveProcesses.value = true;
        return createStdout("Mostrando Informações dos Processos Inativos");
    },
    pse: () => {
        closeOtherSections();
        showCurrentProcess.value = true;
        return createStdout("Mostrando Informações do Processo em Execução");
    },
};

const processInfo = ref<ProcessEntry>();
const activeProcesses = computed(() => {
    return processManager.value?._processes.filter(
        (p) => p.state !== "killed" && p.state !== "finished"
    );
});
const inactiveProcesses = computed(() => {
    return processManager.value?._processes.filter(
        (p) => p.state === "killed" || p.state === "finished"
    );
});

function closeOtherSections() {
    showMemInfo.value = false;
    shutdown.value = false;
    showAptQueueSnapshot.value = false;
    showAptQueueHistory.value = false;
    showVirtualMemoryInfo.value = false;
    showActiveProcesses.value = false;
    showInactiveProcesses.value = false;
    showCurrentProcess.value = false;
    showProcessInfo.value = false;
}

const processManager = ref<ProcessManager>();
function initialize() {
    if (
        !physicalMemorySize.value ||
        !pageSize.value ||
        !virtualMemorySize.value ||
        !quantum.value ||
        !OSSize.value
    ) {
        alert("Preencha todos os campos");
        return;
    }
    var physical = new PhysicalMemory(physicalMemorySize.value, pageSize.value);
    var virtual = new VirtualMemory(virtualMemorySize.value, pageSize.value);
    processManager.value = new ProcessManager(
        physical,
        virtual,
        quantum.value,
        OSSize.value
    );
    showTerminal.value = true;
}

const showTerminal = ref<boolean>(false);
const showMemInfo = ref<boolean>(false);
const shutdown = ref<boolean>(false);
const showAptQueueSnapshot = ref<boolean>(false);
const showAptQueueHistory = ref<boolean>(false);
const showVirtualMemoryInfo = ref<boolean>(false);
const showActiveProcesses = ref<boolean>(false);
const showInactiveProcesses = ref<boolean>(false);
const showCurrentProcess = ref<boolean>(false);
const showProcessInfo = ref<boolean>(false);

const physicalMemoryUsedPercentage = computed(() => {
    const addressesFlatMapped =
        processManager.value?._physicalMemory?._frameTable.flatMap(
            (frame) => frame.adresses
        );

    if (!addressesFlatMapped) return 0;
    //Calculate the used percentage of the used address
    return (
        (addressesFlatMapped?.filter((address) => address.data != "0").length /
            addressesFlatMapped?.length) *
        100
    );
});

function restart() {
    showTerminal.value = false;
    showMemInfo.value = false;
    shutdown.value = false;
    showAptQueueSnapshot.value = false;

    processManager.value = undefined;
    speed.value = 1;
}

const speed = ref<number>(1);
onMounted(() => {
    watch(
        () => speed.value,
        (newVal) => {
            processManager.value?.setSystemSpeed(newVal);
        }
    );
});
const processesInfo = ref<ProcessEntry[]>([]);
const virtualMemoryInfo = ref<{
    about: string;
    vm: VirtualMemory;
}>();
const aptQueueSnapshot = ref<AptQueueSnapshot>();
</script>

<template>
    <main>
        <div class="initia-form" v-show="!showTerminal">
            <label>Memória Física em Bytes </label>
            <input v-model="physicalMemorySize" type="number" />
            <br />
            <label>Memória Virtual em Bytes </label>
            <input v-model="virtualMemorySize" type="number" />
            <br />
            <label>Tamanho da Página Bytes </label>
            <input v-model="pageSize" type="number" />
            <br />
            <label>Quantum em segundos </label>
            <input v-model="quantum" type="number" />
            <br />
            <label>Tamanho do SO em Bytes</label>
            <input v-model="OSSize" type="number" />
            <br />
            <button @click="initialize">Inicializar</button>
        </div>
        <div v-show="showTerminal" class="process-info">
            <VueCommand :commands="commands" v-show="!shutdown" />
            <div class="actions">
                <button
                    v-show="!shutdown"
                    @click="
                        () => {
                            processManager?.pauseSystem();
                        }
                    "
                >
                    Pausar
                </button>
                <button
                    v-show="!shutdown"
                    @click="
                        () => {
                            processManager?.resumeSystem();
                        }
                    "
                >
                    Continuar
                </button>
                <button v-show="shutdown" @click="restart">Reiniciar</button>

                <div class="actions-right">
                    <div class="speed-changer">
                        {{ speed }}x
                        <input
                            type="range"
                            min="0.25"
                            max="5"
                            step="0.25"
                            v-model="speed"
                        />
                    </div>
                    <span class="timer">{{ processManager?.timePassed }}</span>
                </div>
            </div>
        </div>

        <div class="mem-info" v-if="!shutdown && showMemInfo">
            <h4>Informações da Memória Física</h4>
            <span>% Utilizada: {{ physicalMemoryUsedPercentage }}</span>

            <table class="physical-memory-table">
                <thead>
                    <tr>
                        <th colspan="1">Frame</th>
                        <th colspan="1">Address</th>
                        <th colspan="1">Data</th>
                        <th colspan="1">Offset</th>
                    </tr>
                </thead>
                <tbody>
                    <template
                        v-for="(frame, idx) in processManager?._physicalMemory
                            ?._frameTable"
                    >
                        <tr class="frame-block">
                            <td :rowspan="frame.size + 1">{{ frame.id }}</td>
                        </tr>

                        <tr v-for="(address, idx) in frame.adresses" class="">
                            <td>{{ address.address }}</td>
                            <td class="data">{{ address.data }}</td>
                            <td class="offset">
                                {{
                                    (idx >>> 0)
                                        .toString(2)
                                        .padStart(
                                            processManager?._physicalMemory
                                                ._offset!,
                                            "0"
                                        )
                                }}
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <div class="shutdown-info" v-if="shutdown">
            <h2>Sistema Desligado</h2>
            <h4>Lista de Processos</h4>
            <ProcessInfo
                v-for="process in processManager?._processes"
                :process="process"
            ></ProcessInfo>
        </div>

        <div class="apt-queue" v-if="!shutdown && showAptQueueSnapshot">
            <h4>
                Snapshot da Fila de Aptos no momento:
                {{ aptQueueSnapshot?.moment }}
            </h4>
            <table>
                <thead>
                    <tr>
                        <th>PID</th>
                        <th>Chegada</th>
                        <th>Espera</th>
                        <th>Restante</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="snapItem in aptQueueSnapshot?.queue"
                        style="text-align: center"
                    >
                        <td>{{ snapItem.processPID }}</td>
                        <td>{{ snapItem.arrivedAt }}</td>
                        <td>{{ snapItem.waitingTime }}</td>
                        <td>{{ snapItem.remainingTime }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="apt-queue-history" v-if="!shutdown && showAptQueueHistory">
            <h4>Historico de Fila de Aptos</h4>
            <table>
                <thead>
                    <tr>
                        <th>PID</th>
                        <th>Chegada</th>
                        <th>Saída</th>
                        <th>Restante</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="historyItem in processManager?._queueHistory"
                        style="text-align: center"
                    >
                        <td>{{ historyItem.processPID }}</td>
                        <td>{{ historyItem.arrivedAt }}</td>
                        <td>{{ historyItem.leftAt }}</td>
                        <td>{{ historyItem.remainingTime }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div
            class="virtual-memory-info"
            v-if="!shutdown && showVirtualMemoryInfo"
        >
            <h4>{{ virtualMemoryInfo?.about }}</h4>
            <table class="virtual-memory-table">
                <thead>
                    <tr>
                        <th colspan="1">Page</th>
                        <th colspan="1">Frame</th>
                        <th colspan="1">Address</th>
                        <th colspan="1">Valid</th>
                        <th colspan="1">Offset</th>
                    </tr>
                </thead>
                <tbody>
                    <template
                        v-for="(page, idx) in virtualMemoryInfo?.vm.pageTable"
                    >
                        <tr class="page-block">
                            <td :rowspan="page.size + 1">{{ page.id }}</td>
                            <td
                                :rowspan="page.size + 1"
                                style="text-align: center"
                            >
                                {{ page.mappedFrame }}
                            </td>
                        </tr>

                        <tr v-for="(address, idx) in page.addresses">
                            <td>{{ address.address }}</td>
                            <td class="valid">{{ address.valid }}</td>
                            <td class="offset">
                                {{
                                    (idx >>> 0)
                                        .toString(2)
                                        .padStart(
                                            virtualMemoryInfo?.vm._offset!,
                                            "0"
                                        )
                                }}
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <div
            class="process-info"
            v-if="
                (!shutdown && showProcessInfo) ||
                showActiveProcesses ||
                showInactiveProcesses ||
                showCurrentProcess
            "
        >
            <h4 v-if="showProcessInfo">
                Mostrando informações do processo {{ processInfo?.pid }}
            </h4>
            <h4 v-if="showActiveProcesses">
                Mostrando informações dos Processos Ativos
            </h4>
            <h4 v-if="showInactiveProcesses">
                Mostrando informações dos Processos Inativos
            </h4>
            <h4 v-if="showCurrentProcess">
                Mostrando informações do processo em execução
            </h4>
            <ProcessInfo
                v-if="showProcessInfo"
                :process="processInfo!"
            ></ProcessInfo>
            <ProcessInfo
                v-if="showActiveProcesses"
                v-for="active in activeProcesses"
                :process="active"
            ></ProcessInfo>
            <ProcessInfo
                v-if="showInactiveProcesses"
                v-for="inactive in inactiveProcesses"
                :process="inactive"
            ></ProcessInfo>
            <ProcessInfo
                v-if="
                    showCurrentProcess &&
                    processManager?._currentExecutingProcess
                "
                :process="processManager._currentExecutingProcess.process"
            ></ProcessInfo>
        </div>
    </main>
</template>

<style lang="scss">
.physical-memory-table {
    position: relative;
    .frame-block {
        position: relative;
    }
    .frame-block td {
        border-right-width: 0;
        &::after {
            display: block;
            position: absolute;
            content: "";
            width: 100%;
            height: 1px;
            background-color: black;
            top: 0;
        }
    }
    .data,
    .offset {
        text-align: center;
    }
}

.virtual-memory-table {
    position: relative;
    .page-block {
        position: relative;
    }
    .page-block td {
        border-right-width: 0;
        &::after {
            display: block;
            position: absolute;
            content: "";
            width: 100%;
            height: 1px;
            background-color: black;
            top: 0;
        }
    }
    .valid,
    .offset {
        text-align: center;
    }
}

.process-info {
    display: flex;
    flex-flow: column nowrap;
    .actions {
        display: flex;
        flex-flow: row nowrap;

        .actions-right {
            flex: 1;
            justify-content: flex-end;
            align-items: center;
            display: flex;
            gap: 5px;
        }
        .timer {
            font-size: 20px;

            font-weight: bold;
            color: #fff;
            background-color: #000;
            padding: 6px;
            border-radius: 3px;
        }
    }
}

.vue-command,
.vue-command--invert {
    width: 100%;

    ::-webkit-scrollbar {
        width: 6px;
    }

    .vue-command__bar,
    .vue-command__bar--invert {
        border-top-right-radius: 6px;
        border-top-left-radius: 6px;
    }

    .vue-command__history,
    .vue-command__history--invert {
        height: 300px;
        border-bottom-right-radius: 6px;
        border-bottom-left-radius: 6px;
    }
}

.vue-command {
    ::-webkit-scrollbar-track {
        background: #252525;
    }

    ::-webkit-scrollbar-thumb {
        background: #f1f1f1;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #333;
    }
}

.vue-command--invert {
    ::-webkit-scrollbar-track {
        background: #dadada;
    }

    ::-webkit-scrollbar-thumb {
        background: #0e0e0e;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #cccccc;
    }
}
</style>
