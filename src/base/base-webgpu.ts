import * as THREE from "three/webgpu";
import type { EffectComposer } from "three-stdlib";
import {
  Animator,
  Clock,
  Physics,
  Resizer,
  IMouse,
  Keyboard,
} from "../components";
import { downloadBlob } from "../utils";

export interface BaseWebGPUConfig {
  hello: boolean;
  gpu: THREE.WebGPURendererParameters;
  autoAdaptMobile: boolean;
  autoRender: boolean;
}

class BaseWebGPU {
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGPURenderer;
  container: HTMLElement;
  animator: Animator;
  composer: EffectComposer | null;
  clock: Clock;
  iMouse: IMouse;
  physics: Physics;
  resizer: Resizer;
  keyboard: Keyboard;

  constructor(sel = "#sketch", config: Partial<BaseWebGPUConfig> = {}) {
    const {
      hello = true,
      gpu = {},
      autoAdaptMobile = false,
      autoRender = true,
    } = config;

    if (hello) {
      console.log(
        `%c- powered by kokomi.js (WebGPU) -`,
        `padding: 5px 10px; background: #030A8C; font-size: 11px`,
      );
    }

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      100,
    );

    this.camera.position.z = 1;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGPURenderer({
      antialias: true,
      alpha: true,
      ...gpu,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    this.container = document.querySelector(sel) as HTMLElement;

    this.composer = null;

    this.animator = new Animator(this, {
      autoRender,
    });

    this.clock = new Clock(this);
    this.iMouse = new IMouse(this);
    this.physics = new Physics(this);

    this.resizer = new Resizer(this, {
      autoAdaptMobile,
    });

    this.keyboard = new Keyboard();
  }

  async init() {
    await this.renderer.init();

    this.container?.appendChild(this.renderer.domElement);

    this.addEventListeners();

    this.animator.update();
  }

  addEventListeners() {
    this.resizer.listenForResize();
    this.iMouse.listenForMouse();
    this.keyboard.listenForKey();
  }

  update(fn: any) {
    this.animator.add(fn);
  }

  render() {
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  async saveScreenshot(name = "screenshot.png") {
    this.render();

    const blob = await new Promise<Blob | null>((resolve) => {
      this.renderer.domElement.toBlob(resolve, "image/png");
    });

    if (blob) {
      downloadBlob(blob, name);
    }
  }

  destroy() {
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();

        const material = child.material;

        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material.dispose();
        }
      }
    });

    this.renderer.dispose();
  }
}

export { BaseWebGPU };
