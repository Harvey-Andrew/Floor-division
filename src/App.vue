<template>
  <div id="cesiumContainer"></div>
  <router-view></router-view>
</template>
<script setup>
import * as Cesium from "cesium";
import { onMounted, getCurrentInstance } from "vue";
import { load3dtiles, update3dtiles } from "./tool/load3D";
const { appContext } = getCurrentInstance();
const global = appContext.config.globalProperties;
let viewer;
Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNjMTg5Zi02ZjBkLTQyOGItOWUzMS1iYmU0OTdjMWJlZTUiLCJpZCI6MTk2NDAxLCJpYXQiOjE3MDgzMzI4MzJ9.Ig6iAuXmLNdwcJlSmvSHhaR6xsmKCRhAkEkjAo7PYPM";

onMounted(() => {
  // viewer是操控地图api的开始
  viewer = new Cesium.Viewer("cesiumContainer", {
    selectionIndicator: false, //隐藏选中框
    infoBox: false, //隐藏右上角信息框
    timeline: false,
    animation: false,
  });
  load3dtiles(viewer, "/src/assets/b3dm/tileset.json", (tileset) => {
    global.$viewer = viewer;
    // 贴地
    update3dtiles(tileset);
    viewer.zoomTo(tileset);
  });
});
</script>
<style scoped>
#cesiumContainer {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
