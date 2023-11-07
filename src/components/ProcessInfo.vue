<script lang="ts" setup>
import type { ProcessEntry } from "@/utils/ProcessManager";

const props = defineProps<{
    process: ProcessEntry;
    showVirtualMem?: boolean;
}>();
</script>
<template>
    <div class="process-info">
        <span>PID: {{ process.pid }}</span>
        <span>Alocado em: {{ process.allocationTime }}</span>
        <span>Burst Time: {{ process.burstTime }}</span>
        <span>Tamanho: {{ process.size }} Bytes</span>
        <span 
            >estado:
            <span :class="'state ' + process.state">{{ process.state }}</span></span
        >
        <span v-if="process.state != 'finished'"
            >Tempo Restante: {{ process.remainingTime }}</span
        >
    </div>
</template>
<style lang="scss" scoped>
.process-info{
    margin-bottom: 4px;
    border: 1px solid black;
    padding: 5px;

    .state{
        padding: 1px 5px;
        font-weight: bold;
    }
    .finished{
        background-color: green;
        color: white;
    }
    .waiting{
        background-color: yellow;
        color: black;
    }
    .executing{
        background-color: blue;
        color: white;
    }
    .killed{
        background-color: red;
        color: white;
    }
}
</style>
