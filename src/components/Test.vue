<template>
  <div id="main">
    <canvas ref="domRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { addBVHExtension, initThree, animate, updateCamera } from "@/utils/index.ts";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import gridVert from "./shader/grid.vert.glsl";
import gridFrag from "./shader/grid.frag.glsl";

const domRef = ref<HTMLCanvasElement>();
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let controller: TrackballControls;
let labelRenderer: CSS2DRenderer;

// -----------------------------初始化------------------------------
addBVHExtension();
onMounted(() => {
  init();
  animate({
    camera,
    controller,
    labelRenderer,
    renderer,
    scene,
  });
});
/** 场景初始化 */
function init() {
  const initReturn = initThree({
    width: innerWidth,
    height: innerHeight,
    canvas: domRef.value!,
  });
  camera = initReturn.camera;
  controller = initReturn.controller;
  labelRenderer = initReturn.labelRenderer;
  renderer = initReturn.renderer;
  scene = initReturn.scene;
  // 初始化完毕触发主函数
  main();
}
/** 主函数 */
function main() {
  const plane = new THREE.PlaneGeometry(100, 100, 100);
  const material = new THREE.MeshMatcapMaterial({
    side: THREE.DoubleSide,
    color: 0xffffff, // 红色hex 0xff0000
  });
  const customMaterial = new CustomShaderMaterial({
    baseMaterial: material,
    vertexShader: gridVert,
    fragmentShader: gridFrag,
  });

  const mesh = new THREE.Mesh(plane, customMaterial);
  scene.add(mesh);
  updateCamera(camera, controller, [scene], innerWidth, innerHeight);
}
</script>

<style>
#main {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
canvas {
  width: 100%;
  height: 100%;
}
</style>
