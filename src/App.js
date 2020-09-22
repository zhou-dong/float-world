import React from 'react';

import * as THREE from 'three/build/three.module.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import filePath from "jellyfish"

const publicPath = "http://localhost:3000";

console.log(filePath);

var container, stats;
var camera, scene, renderer;
var controls, water, sun, mesh;

// function loadJellyfish() {
//     var loader = new GLTFLoader();

//     // Optional: Provide a DRACOLoader instance to decode compressed mesh data
//     // var dracoLoader = new DRACOLoader();
//     // dracoLoader.setDecoderPath('/examples/js/libs/draco/');
//     // loader.setDRACOLoader(dracoLoader);

//     // Load a glTF resource

//     console.log(`${publicPath}/jellyfish/scene.gltf`);

//     loader.load(
//         // resource URL
//         `${publicPath}/jellyfish/scene.gltf`,
//         // called when the resource is loaded
//         function (gltf) {

//             scene.add(gltf.scene);

//             // gltf.animations; // Array<THREE.AnimationClip>
//             // gltf.scene; // THREE.Group
//             // gltf.scenes; // Array<THREE.Group>
//             // gltf.cameras; // Array<THREE.Camera>
//             // gltf.asset; // Object

//         },
//         // called while loading is progressing
//         function (xhr) {

    
//             console.log((xhr.loaded / xhr.total * 100) + '% loaded');

//         },
//         // called when loading has errors
//         function (error) {

//             console.log('An error happened', error);

//         }
//     );
// }

function init() {

    container = document.getElementById('root');

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    //

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(30, 30, 100);

    //

    sun = new THREE.Vector3();

    // 
    // const j = loadJellyfish();

    // Water

    var waterGeometry = new THREE.PlaneBufferGeometry(10000, 10000);

    // var waterNormals = new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
    //     texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    // })

    var waterNormals = new THREE.TextureLoader().load(`${publicPath}/waternormals.jpg`, function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    });

    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: waterNormals,
            alpha: 1.0,
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
    );

    water.rotation.x = - Math.PI / 2;

    scene.add(water);

    // Skybox

    var sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    var uniforms = sky.material.uniforms;

    uniforms['turbidity'].value = 10;
    uniforms['rayleigh'].value = 2;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.8;

    var parameters = {
        inclination: 0.49,
        azimuth: 0.205
    };

    var pmremGenerator = new THREE.PMREMGenerator(renderer);

    function updateSun() {

        var theta = Math.PI * (parameters.inclination - 0.5);
        var phi = 2 * Math.PI * (parameters.azimuth - 0.5);

        sun.x = Math.cos(phi);
        sun.y = Math.sin(phi) * Math.sin(theta);
        sun.z = Math.sin(phi) * Math.cos(theta);

        sky.material.uniforms['sunPosition'].value.copy(sun);
        water.material.uniforms['sunDirection'].value.copy(sun).normalize();

        scene.environment = pmremGenerator.fromScene(sky).texture;

    }

    updateSun();

    //

    var geometry = new THREE.BoxBufferGeometry(30, 30, 30);
    var material = new THREE.MeshStandardMaterial({ roughness: 0 });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    //

    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 10, 0);
    controls.minDistance = 40.0;
    controls.maxDistance = 200.0;
    controls.update();

    //

    stats = new Stats();
    container.appendChild(stats.dom);

    // GUI

    var gui = new GUI();

    var folder = gui.addFolder('Sky');
    folder.add(parameters, 'inclination', 0, 0.5, 0.0001).onChange(updateSun);
    folder.add(parameters, 'azimuth', 0, 1, 0.0001).onChange(updateSun);
    folder.open();

    var uniforms = water.material.uniforms;

    var folder = gui.addFolder('Water');
    folder.add(uniforms.distortionScale, 'value', 0, 8, 0.1).name('distortionScale');
    folder.add(uniforms.size, 'value', 0.1, 10, 0.1).name('size');
    folder.add(uniforms.alpha, 'value', 0.9, 1, .001).name('alpha');
    folder.open();

    //

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);
    render();
    stats.update();

}

function render() {

    var time = performance.now() * 0.001;

    mesh.position.y = Math.sin(time) * 20 + 5;
    mesh.rotation.x = time * 0.5;
    mesh.rotation.z = time * 0.51;

    water.material.uniforms['time'].value += 1.0 / 60.0;

    // console.log(water.material.uniforms['time'].value);

    renderer.render(scene, camera);

}

function App() {
    init();
    animate();

    return <React.Fragment />;
}

export default App;
