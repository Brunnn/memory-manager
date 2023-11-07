<script setup lang="ts">
import { onMounted, ref } from "vue";
import VueCommand, { createStdout } from "vue-command";
import "vue-command/dist/vue-command.css";
import { PhysicalMemory } from "@/utils/PhysicalMemory";
import { VirtualMemory } from "@/utils/VirtualMemory";
import { ProcessManager } from "@/utils/ProcessManager";
const commands = {
    "hello-world": () => {
        console.log("aaaa");
        return createStdout("Hello world");
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
        return createStdout("Hello world");
    },
    shutdown: () => {
        return createStdout("Hello world");
    },
    exit: () => {
        return createStdout("Hello world");
    },
    fa: () => {
        return createStdout("Hello world");
    },
    fah: () => {
        return createStdout("Hello world");
    },
    tp: (args: any) => {
        return createStdout("Hello world");
    },
    ps: (args: any) => {
        return createStdout("Hello world");
    },
    psh: () => {
        return createStdout("Hello world");
    },
    pse: () => {
        return createStdout("Hello world");
    },
};

const processManager = ref<ProcessManager>();
function initialize() {
    if (
        !physicalMemorySize.value ||
        !pageSize.value ||
        !virtualMemorySize.value ||
        !quantum.value
    ) {
        alert("Preencha todos os campos");
        return;
    }
    var physical = new PhysicalMemory(physicalMemorySize.value, pageSize.value);
    var virtual = new VirtualMemory(virtualMemorySize.value, pageSize.value);
    processManager.value = new ProcessManager(physical, virtual, quantum.value);
    showTerminal.value = true;
}
const physicalMemorySize = ref<number>(32);
const pageSize = ref<number>(4);
const virtualMemorySize = ref<number>(64);
const quantum = ref<number>(5);
const showTerminal = ref<boolean>(false);
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
            <button @click="initialize">Inicializar</button>
        </div>
        <div v-show="showTerminal" class="process-info">
            <VueCommand :commands="commands" />
            <div class="actions">
                <button
                    @click="
                        () => {
                            processManager?.pauseSystem();
                        }
                    "
                >
                    Pausar
                </button>
                <button
                    @click="
                        () => {
                            processManager?.resumeSystem();
                        }
                    "
                >
                    Continuar
                </button>

                <span class="timer">{{ processManager?.timePassed }}</span>
            </div>
        </div>
    </main>
</template>

<style lang="scss">
.process-info {
    display: flex;
    flex-flow: column nowrap;
    .actions {
        display: flex;
        flex-flow: row nowrap;

        .timer {
            margin-left: auto;
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
