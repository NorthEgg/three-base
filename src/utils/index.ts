import * as THREE from "three";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";

/** 添加bvh */
export function addBVHExtension() {
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
}

/**将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
 * @param mouseEvent 鼠标事件
 * @param width canvas宽度
 * @param height canvas高度
 */
export function getPointNDCPosition(mouseEvent: PointerEvent, width: number, height: number) {
  return new THREE.Vector2(
    (mouseEvent.clientX / width) * 2 - 1,
    -(mouseEvent.clientY / height) * 2 + 1,
  );
}

/**初始化three
 * @param width canvas宽度
 * @param height canvas高度
 * @param domRef canvas容器
 */
export function initThree({
  width,
  height,
  canvas,
  addLight = true,
  addAxesHelper = true,
}: {
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  addLight?: boolean;
  addAxesHelper?: boolean;
}) {
  const aspect = width / height;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    (width * aspect) / -2, // 左侧界限
    (width * aspect) / 2, // 右侧界限
    (height * aspect) / 2, // 顶部界限
    (height * aspect) / -2, // 底部界限
    0.1, // 近裁剪面
    100000, // 远裁剪面
  );
  camera.position.set(30, 30, 30);
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setClearColor(0x000000, 1);
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = 1;

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width, height);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  document.getElementById("main")?.appendChild(labelRenderer.domElement);

  const controller = new TrackballControls(camera, labelRenderer.domElement);
  controller.rotateSpeed = 15;
  controller.zoomSpeed = 2;
  controller.panSpeed = 2.4;
  controller.staticMoving = true;

  if (addLight) {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
    scene.add(hemiLight);

    const ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);

    const directLight = new THREE.DirectionalLight(new THREE.Color(0xf4f4f4), 2);
    directLight.position.set(0.5, 0, 0.866); // ~60º
    scene.add(directLight);
  }

  if (addAxesHelper) {
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);
  }

  return { scene, camera, renderer, labelRenderer, controller };
}

/**开启渲染 */
export function animate({
  scene,
  camera,
  renderer,
  labelRenderer,
  controller,
}: {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
  controller: TrackballControls;
}) {
  const tick = () => {
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    controller.update();
  };
  renderer.setAnimationLoop(tick);
}

/**相机自适应
 * @param camera 相机
 * @param controls 轨迹球
 * @param objects 模型对象列表
 * @param width 画布宽度
 * @param height 画布高度
 */
export function updateCamera(
  camera: THREE.OrthographicCamera,
  controls: TrackballControls,
  objects: THREE.Object3D[],
  width: number,
  height: number,
) {
  const lockViewMeshBox = new THREE.Box3();
  objects.forEach((object) => {
    object.updateMatrixWorld();
    const meshBox = new THREE.Box3().setFromObject(object);
    lockViewMeshBox.union(meshBox);
  });
  const lockViewMeshCenter = lockViewMeshBox.getCenter(new THREE.Vector3());
  const size = new THREE.Vector3();
  lockViewMeshBox.getSize(size);
  const sizeLength = size.length();
  const boxMax = Math.max(size.x, size.y, size.z);

  const widthZoom = width / boxMax;
  const heightZoom = height / boxMax;
  // 选择较小的缩放比例确保整个包围盒都能完整地显示在画布内
  if (widthZoom >= heightZoom) {
    camera.zoom = heightZoom;
  } else {
    camera.zoom = widthZoom;
  }
  camera.near = sizeLength / 100;
  camera.far = sizeLength * 100;
  camera.updateProjectionMatrix();
  camera.position.copy(lockViewMeshCenter);
  camera.position.x += sizeLength / 2.0;
  camera.position.y += sizeLength / 5.0;
  camera.position.z += sizeLength / 2.0;
  camera.lookAt(lockViewMeshCenter);

  // 设置控制器的焦点, 控制器的轨道围绕它运行
  controls.target = lockViewMeshCenter;
}
