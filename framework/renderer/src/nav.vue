<template>
  <ul class="nav">
    <li :class="{ active: active === '403' }" @click="to('403')">403</li>
    <li :class="{ active: active === '404' }" @click="to('404')">404</li>
  </ul>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const active = ref('403')

function to(path) {
  active.value = path

  //   @ts-ignore typo
  window.ipcRenderer.callMain('path-change', path)
}
</script>
<style>
.nav {
  list-style: none;
  display: flex;
  align-items: center;
  padding: 0;
  margin: 0;
  height: 31px;
  border-bottom: 1px solid #ddd;
}
.nav li {
  cursor: pointer;
  color: #333;
  margin: 0 6px;
}
.nav li.active {
  color: green;
}
</style>
