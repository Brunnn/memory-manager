<script setup lang="ts">
import { onMounted } from "vue";
import VueCommand, { createStdout } from "vue-command";
import "vue-command/dist/vue-command.css";
import { PhysicalMemory } from "@/utils/PhysicalMemory";
import { VirtualMemory } from "@/utils/VirtualMemory";
const commands = {
    "hello-world": () => createStdout("Hello world"),
};

function a(){
  var physical = new PhysicalMemory(32, 4);
  var virtual = new VirtualMemory(64, 4, physical)
  

}
onMounted(() => {});
</script>

<template>
    <main>
      <button @click="a">kkk</button>
        <VueCommand :commands="commands" />
    </main>
</template>
