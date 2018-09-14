'use strict';
let camera, cameraTarget, scene, renderer;

function threejsInit() {
    let container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 15);
    camera.position.set(3, 0.15, 3);
    cameraTarget = new THREE.Vector3(0, 0, 0);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x72645b, 2, 15);

    // Ground
    const plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(40, 40),
        new THREE.MeshPhongMaterial({color: 0x999999, specular: 0x101010}));
    plane.rotation.x = -Math.PI/2;
    plane.position.y = -0.5;
    scene.add(plane);
    plane.receiveShadow = true;

    // Lights
    scene.add(new THREE.HemisphereLight(0x443333, 0x111122));
    addShadowedLight(1, 1, 1, 0xffffff, 1.35);
    addShadowedLight(0.5, 1, -1, 0xffaa00, 1);

    // renderer
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);
}

function addShadowedLight(x, y, z, color, intensity) {
    const directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.set(x, y, z);
    scene.add(directionalLight);
}

function resizeGeometry(bufferGeometry, material) {
    let geometry;
    // Point cloud does not have face indices.
    if (bufferGeometry.index == null) {
        geometry = new THREE.Points(bufferGeometry, material);
    } else {
        bufferGeometry.computeVertexNormals();
        geometry = new THREE.Mesh(bufferGeometry, material);
    }
    // Compute range of the geometry coordinates for proper rendering.
    bufferGeometry.computeBoundingBox();
    const sizeX = bufferGeometry.boundingBox.max.x - bufferGeometry.boundingBox.min.x;
    const sizeY = bufferGeometry.boundingBox.max.y - bufferGeometry.boundingBox.min.y;
    const sizeZ = bufferGeometry.boundingBox.max.z - bufferGeometry.boundingBox.min.z;
    const diagonalSize = Math.sqrt(sizeX * sizeX + sizeY * sizeY + sizeZ * sizeZ);
    const scale = 1.0 / diagonalSize;
    const midX =
        (bufferGeometry.boundingBox.min.x + bufferGeometry.boundingBox.max.x) / 2;
    const midY =
        (bufferGeometry.boundingBox.min.y + bufferGeometry.boundingBox.max.y) / 2;
    const midZ =
        (bufferGeometry.boundingBox.min.z + bufferGeometry.boundingBox.max.z) / 2;

    geometry.scale.multiplyScalar(scale);
    geometry.position.x = -midX * scale;
    geometry.position.y = -midY * scale;
    geometry.position.z = -midZ * scale;
    geometry.castShadow = true;
    geometry.receiveShadow = true;
    return geometry;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function threejsAnimate() {
    requestAnimationFrame(threejsAnimate);
    render();
}

function render() {
    const timer = Date.now() * 0.0005;
    camera.position.x = Math.sin(timer) * 2.5;
    camera.position.z = Math.cos(timer) * 2.5;
    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
}



// Global Draco decoder type.
let dracoDecoderType = {};
let dracoLoader;
let currentDecoder;

function createDracoDecoder() {
    dracoLoader = new THREE.DRACOLoader();
    // dracoLoader.setDracoDecoderType(dracoDecoderType);
}

// bufferGeometry is a geometry decoded by DRACOLoader.js
function onDecode(bufferGeometry) {
    const material = new THREE.MeshStandardMaterial({vertexColors: THREE.VertexColors});

    const geometry = resizeGeometry(bufferGeometry, material);

    const selectedObject = scene.getObjectByName("my_mesh");
    scene.remove(selectedObject);
    geometry.name = "my_mesh";
    scene.add(geometry);
}

createDracoDecoder();



window.onload = function() {

    threejsInit();
    threejsAnimate();

    // Load the 3d model asynchronously
    // dracoLoader.loadAjax('/models/spider/Only_Spider_with_Animations_Export.drc', onDecode);
    var url = new URL(window.location.href);
    var objFile = url.searchParams.get('file');
    dracoLoader.loadAjax('/public/uploads/' + objFile + '.drc', onDecode);

};
