import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TeamMember } from '../../types';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Sparkles, Box, Volume2 } from 'lucide-react';

interface NpcAvatar3DCanvasProps {
  member: TeamMember;
  isSpeaking?: boolean;
  className?: string;
  enableControls?: boolean;
  autoRotate?: boolean;
  interactive?: boolean;
}

// Procedurally generate a stylish 3-12 part Three.js composite avatar model
// per the Three.js skill specification when no external GLB is uploaded
function createProceduralAvatarGroup(presetType: string, memberId: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `avatar-${memberId}`;

  // Palette based on archetype
  let primaryColor = 0x6366f1; // Indigo default
  let accentColor = 0xa855f7;  // Purple
  let emissiveColor = 0x818cf8;
  let visorColor = 0x38bdf8;

  if (memberId === 'ceo') {
    primaryColor = 0x3b82f6; // Blue executive
    accentColor = 0x60a5fa;
    visorColor = 0x93c5fd;
  } else if (memberId === 'orchestrator') {
    primaryColor = 0x8b5cf6; // Violet
    accentColor = 0xd946ef;
    visorColor = 0x06b6d4;
  } else if (memberId === 'architect') {
    primaryColor = 0x0284c7; // Cyan Sky
    accentColor = 0x06b6d4;
    visorColor = 0x38bdf8;
  } else if (memberId === 'uiux') {
    primaryColor = 0xec4899; // Pink
    accentColor = 0xf43f5e;
    visorColor = 0xfbcfe8;
  } else if (memberId === 'dev') {
    primaryColor = 0x10b981; // Emerald
    accentColor = 0x14b8a6;
    visorColor = 0x34d399;
  } else if (memberId === 'qa') {
    primaryColor = 0xf43f5e; // Rose Red
    accentColor = 0xe11d48;
    visorColor = 0xfecdd3;
  } else if (memberId === 'devops') {
    primaryColor = 0x0ea5e9; // Sky
    accentColor = 0x38bdf8;
    visorColor = 0x7dd3fc;
  } else if (memberId === 'support') {
    primaryColor = 0x8b5cf6; // Warm Purple
    accentColor = 0xa855f7;
    visorColor = 0xc084fc;
  }

  // 1. Pedestal / Base ring (Ground anchor)
  const baseGeo = new THREE.CylinderGeometry(1.3, 1.45, 0.12, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.85,
    roughness: 0.25,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.06;
  group.add(baseMesh);

  // Floating energy halo ring on base
  const ringGeo = new THREE.TorusGeometry(1.2, 0.03, 16, 64);
  const ringMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    emissive: primaryColor,
    emissiveIntensity: 0.8,
    metalness: 0.2,
    roughness: 0.2,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = 0.15;
  group.add(ringMesh);

  // 2. Torso (Chiseled cyber chestplate)
  const torsoGeo = new THREE.CylinderGeometry(0.55, 0.42, 1.1, 8);
  const torsoMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.7,
    roughness: 0.3,
  });
  const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
  torsoMesh.position.y = 1.35;
  group.add(torsoMesh);

  // Core Reactor (Glowing chest emblem)
  const coreGeo = new THREE.SphereGeometry(0.18, 16, 16);
  const coreMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    emissive: emissiveColor,
    emissiveIntensity: 1.4,
    roughness: 0.1,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.set(0, 1.45, 0.42);
  group.add(coreMesh);

  // 3. Shoulder Pauldrons (Left & Right)
  const shoulderGeo = new THREE.BoxGeometry(0.35, 0.25, 0.45);
  const shoulderMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness: 0.8,
    roughness: 0.2,
  });
  const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
  leftShoulder.position.set(-0.72, 1.75, 0);
  leftShoulder.rotation.z = 0.15;
  group.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
  rightShoulder.position.set(0.72, 1.75, 0);
  rightShoulder.rotation.z = -0.15;
  group.add(rightShoulder);

  // 4. Arms
  const armGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.75, 12);
  const armMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.6,
    roughness: 0.4,
  });
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.72, 1.25, 0);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.72, 1.25, 0);
  group.add(rightArm);

  // 5. Neck
  const neckGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 12);
  const neckMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
  const neckMesh = new THREE.Mesh(neckGeo, neckMat);
  neckMesh.position.y = 2.0;
  group.add(neckMesh);

  // 6. Cyber Head / Visor unit
  const headGeo = new THREE.BoxGeometry(0.6, 0.68, 0.62);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.75,
    roughness: 0.25,
  });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  headMesh.position.y = 2.45;
  group.add(headMesh);

  // Holographic Visor
  const visorGeo = new THREE.BoxGeometry(0.55, 0.2, 0.18);
  const visorMat = new THREE.MeshStandardMaterial({
    color: visorColor,
    emissive: visorColor,
    emissiveIntensity: 1.2,
    metalness: 0.1,
    roughness: 0.1,
    transparent: true,
    opacity: 0.92,
  });
  const visorMesh = new THREE.Mesh(visorGeo, visorMat);
  visorMesh.position.set(0, 2.5, 0.32);
  group.add(visorMesh);

  // 7. Neural Antenna / Crown Fin
  const finGeo = new THREE.ConeGeometry(0.1, 0.4, 4);
  const finMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    metalness: 0.9,
    roughness: 0.1,
    emissive: accentColor,
    emissiveIntensity: 0.6,
  });
  const finMesh = new THREE.Mesh(finGeo, finMat);
  finMesh.position.set(0, 2.95, -0.05);
  group.add(finMesh);

  // 8. Orbiting Hologram Data Nodes (3 satellites)
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const nodeGeo = new THREE.OctahedronGeometry(0.08);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      emissive: emissiveColor,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
    nodeMesh.position.set(Math.cos(angle) * 0.95, 2.45, Math.sin(angle) * 0.95);
    nodeMesh.userData = { orbitSpeed: 0.8 + i * 0.3, orbitRadius: 0.95, initialAngle: angle };
    group.add(nodeMesh);
  }

  // Adjust center pivot so bottom sits at ground (y=0)
  group.position.y = -1.2;

  return group;
}

export const NpcAvatar3DCanvas: React.FC<NpcAvatar3DCanvasProps> = ({
  member,
  isSpeaking = false,
  className = 'w-full h-full min-h-[260px]',
  enableControls = true,
  autoRotate = true,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [modelType, setModelType] = useState<'custom_glb' | 'procedural'>('procedural');
  const [hasControlsLoaded, setHasControlsLoaded] = useState(false);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 4.2);

    // 3. Renderer with ACESFilmicToneMapping & studio color space
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Procedural Studio Reflection Environment
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    } catch (e) {
      // Fallback if RoomEnvironment is not supported
    }

    // 5. Studio PBR Lighting Rig
    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xfff1e6, 2.4);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    // Cool fill light
    const fillLight = new THREE.DirectionalLight(0x818cf8, 1.2);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    // Soft rim light
    const rimLight = new THREE.DirectionalLight(0xc084fc, 1.8);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Subtle hemisphere ambient
    const hemiLight = new THREE.HemisphereLight(0x1e1b4b, 0x020617, 0.8);
    scene.add(hemiLight);

    // Reactive Speaking Spotlight
    const speakingLight = new THREE.PointLight(0xa855f7, isSpeaking ? 3.5 : 0.4, 6);
    speakingLight.position.set(0, 1.5, 1.8);
    scene.add(speakingLight);

    // 6. OrbitControls
    let controls: OrbitControls | null = null;
    if (enableControls) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.minDistance = 2.0;
      controls.maxDistance = 7.0;
      controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't flip under pedestal
      controls.minPolarAngle = Math.PI / 6;
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 1.4;
      controlsRef.current = controls;
      setHasControlsLoaded(true);
    }

    // 7. Load GLB or Build Procedural Model
    let currentModelGroup: THREE.Group | THREE.Object3D | null = null;
    let isMounted = true;

    const loadModel = () => {
      // Check if custom GLB is available (either via glbModelData base64 or glbModelUrl)
      const glbSource = member.glbModelData || member.glbModelUrl;

      if (glbSource) {
        setLoadingModel(true);
        const loader = new GLTFLoader();

        // If base64 data URL
        if (glbSource.startsWith('data:')) {
          loader.load(
            glbSource,
            (gltf) => {
              if (!isMounted) return;
              const model = gltf.scene;

              // Compute bounding box to normalize scale and center model
              const box = new THREE.Box3().setFromObject(model);
              const size = box.getSize(new THREE.Vector3());
              const center = box.getCenter(new THREE.Vector3());

              const maxDim = Math.max(size.x, size.y, size.z);
              const scale = 2.4 / (maxDim || 1);
              model.scale.setScalar(scale);

              // Center model at bottom-center
              model.position.x = -center.x * scale;
              model.position.y = -box.min.y * scale - 1.2;
              model.position.z = -center.z * scale;

              scene.add(model);
              currentModelGroup = model;
              setModelType('custom_glb');
              setLoadingModel(false);
            },
            undefined,
            (err) => {
              console.warn('Failed to load custom GLB model, falling back to procedural avatar:', err);
              if (!isMounted) return;
              // Fallback to procedural model
              const procedural = createProceduralAvatarGroup(member.preset3DType || 'android', member.id);
              scene.add(procedural);
              currentModelGroup = procedural;
              setModelType('procedural');
              setLoadingModel(false);
            }
          );
          return;
        }
      }

      // Default: High-fidelity procedural 3-12 part composite model
      const procedural = createProceduralAvatarGroup(member.preset3DType || 'android', member.id);
      scene.add(procedural);
      currentModelGroup = procedural;
      setModelType('procedural');
    };

    loadModel();

    // 8. Animation & Render Loop with Clock
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Controls damping update
      if (controls) {
        controls.update();
      }

      // Idle breathing and speaking reactive animations
      if (currentModelGroup) {
        // Idle gentle breathing scale
        const breath = Math.sin(elapsedTime * 2) * 0.02;
        currentModelGroup.position.y = -1.2 + Math.sin(elapsedTime * 1.5) * 0.03;

        // When speaking, pulse and slightly gesture
        if (isSpeaking) {
          speakingLight.intensity = 2.8 + Math.sin(elapsedTime * 10) * 1.2;
          currentModelGroup.rotation.y += Math.sin(elapsedTime * 4) * 0.005;
        } else {
          speakingLight.intensity = 0.5;
        }

        // Animate orbiting satellites if present
        currentModelGroup.traverse((child) => {
          if (child.userData && child.userData.orbitSpeed) {
            const angle = child.userData.initialAngle + elapsedTime * child.userData.orbitSpeed;
            child.position.x = Math.cos(angle) * child.userData.orbitRadius;
            child.position.z = Math.sin(angle) * child.userData.orbitRadius;
            child.rotation.y += 0.03;
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });

    resizeObserver.observe(container);

    // 10. Cleanup
    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      if (controls) {
        controls.dispose();
      }

      // Dispose geometries, materials
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [member.id, member.glbModelData, member.glbModelUrl, isSpeaking, enableControls, autoRotate]);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800/80 ${className}`}>
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Model Loading Spinner */}
      {loadingModel && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm z-20">
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="text-[11px] font-mono text-indigo-200">Parsing 3D GLB Model...</span>
          </div>
        </div>
      )}

      {/* Interactive Controls Overlay */}
      {interactive && (
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 z-10 bg-slate-900/80 p-1 rounded-lg border border-slate-800 backdrop-blur-md">
          <button
            onClick={resetCamera}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Reset 3D View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="h-3 w-px bg-slate-800" />
          <span className="text-[9px] font-mono uppercase px-1 text-slate-400 flex items-center gap-1">
            <Box className="w-3 h-3 text-indigo-400" />
            {modelType === 'custom_glb' ? 'Custom GLB' : '3D Procedural'}
          </span>
        </div>
      )}

      {/* Speaking Indicator Badge */}
      {isSpeaking && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/90 border border-indigo-500/60 text-indigo-200 text-[10px] font-mono font-bold shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse z-10">
          <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
          <span>VOICE ACTIVE</span>
        </div>
      )}
    </div>
  );
};
