import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class Renderer3D {
  constructor(engine) {
    this.engine = engine;

    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      20000
    );
    this.camera.position.set(0, 250, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.04;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.minDistance = 10;
        this.controls.maxDistance = 15000;
    
        this.cubeCamera = new THREE.CubeCamera(1, 20000, new THREE.WebGLCubeRenderTarget(256));
        this.scene.add(this.cubeCamera);
    
        this.initParticles();
    this.initCore();

    window.addEventListener("resize", () => this.resize());
  }

  initParticles() {
    const count = this.engine.count;

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);

    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute("size", new THREE.BufferAttribute(this.sizes, 1));

    const vertexShader = `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      void main() {
        if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
        gl_FragColor = vec4(vColor, 1.0);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  initCore() {
    const geo = new THREE.SphereGeometry(15, 64, 64);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        tCube: { value: null }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        uniform samplerCube tCube;

        void main() {
          vec3 worldDirection = normalize(vWorldPosition - cameraPosition);
          vec3 reflectionVector = reflect(worldDirection, normalize(vWorldNormal));
          vec4 cubeColor = textureCube(tCube, reflectionVector);
          gl_FragColor = vec4(cubeColor.rgb, 1.0);
        }
      `
    });
    this.core = new THREE.Mesh(geo, mat);
    this.scene.add(this.core);
  }

  render() {
    const { particles, timeline } = this.engine;
    const time = Date.now() * 0.002;

    const white = new THREE.Color(0xffffff);
    const yellow = new THREE.Color(0xffff00);
    const orange = new THREE.Color(0xffa500);
    const red = new THREE.Color(0xff0000);

    particles.forEach((p, i) => {
      const idx = i * 3;

      this.positions[idx]     = p.x;
      this.positions[idx + 1] = p.y;
      this.positions[idx + 2] = p.z;

      // Color gradient
      const speed_normalized = (p.speed - 2) / 6; // speed [2,8] -> [0,1]
      let color = new THREE.Color();
      if (speed_normalized < 0.33) {
        color.copy(white).lerp(yellow, speed_normalized / 0.33);
      } else if (speed_normalized < 0.66) {
        color.copy(yellow).lerp(orange, (speed_normalized - 0.33) / 0.33);
      } else {
        color.copy(orange).lerp(red, (speed_normalized - 0.66) / 0.34);
      }

      this.colors[idx]     = color.r;
      this.colors[idx + 1] = color.g;
      this.colors[idx + 2] = color.b;
      
      // Size animation
      const baseSize = 2.4;
      const blinkSpeed = 0.5;
      const blinkAmplitude = 1.8;
      this.sizes[i] = baseSize + Math.sin(time * blinkSpeed + p.animationOffset) * blinkAmplitude;
    });

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;

    // Update CubeCamera and render reflection
    this.core.visible = false;
    this.cubeCamera.position.copy(this.core.position);
    this.cubeCamera.update(this.renderer, this.scene);
    this.core.material.uniforms.tCube.value = this.cubeCamera.renderTarget.texture;
    this.core.visible = true;

    this.core.scale.setScalar(0.6 + timeline * 2.5);
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
