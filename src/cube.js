import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useEffect, useRef, useState } from "react";

function MyThree() {
  const refContainer = useRef(null);
  const [uiOpen, setUiOpen] = useState(false);
  const isOpenRef = useRef(false);

  useEffect(() => {
    if (!refContainer.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    refContainer.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- 1. PROCEDURAL GOLD PATTERN ---
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 512; patternCanvas.height = 512;
    const pCtx = patternCanvas.getContext('2d');
    pCtx.fillStyle = '#ffd700'; 
    pCtx.fillRect(0, 0, 512, 512);
    pCtx.strokeStyle = '#b8860b';
    pCtx.lineWidth = 5;
    for(let i=0; i<8; i++) {
        pCtx.beginPath();
        pCtx.moveTo(i * 64, 0); pCtx.lineTo(512, 512 - (i*64));
        pCtx.moveTo(0, i * 64); pCtx.lineTo(512 - (i*64), 512);
        pCtx.stroke();
    }
    const boxTexture = new THREE.CanvasTexture(patternCanvas);

    // --- 2. GLOWING PREMIUM MATERIAL ---
    const sideMat = new THREE.MeshPhysicalMaterial({ 
        map: boxTexture,
        bumpMap: boxTexture,
        bumpScale: 0.05,
        color: 0xffd700, 
        metalness: 1.0, 
        roughness: 0.15,
        clearcoat: 1.0,
        // ADDED: Emissive properties to make the box "glow"
        emissive: 0xffaa00, 
        emissiveIntensity: 0.2 // Base glow so it's visible even when closed
    });

    // --- 3. STARS & DUST ---
    const starGeo = new THREE.BufferGeometry();
    const starPoints = [];
    for (let i = 0; i < 5000; i++) starPoints.push((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000);
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPoints, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 })));

    const dustCount = 1000;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustVel = new Float32Array(dustCount * 3);
    for(let i=0; i<dustCount; i++) {
        dustPos[i*3] = 0; dustPos[i*3+1] = 0; dustPos[i*3+2] = 0;
        dustVel[i*3] = (Math.random() - 0.5) * 0.25;
        dustVel[i*3+1] = (Math.random() - 0.5) * 0.25;
        dustVel[i*3+2] = (Math.random() - 0.5) * 0.25;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xffe066, size: 0.06, transparent: true, opacity: 0 });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // --- 4. THE CUBE ---
    const sides = [];
    const mainGroup = new THREE.Group(); 
    const faceConfigs = [
      { pos: [0, 0, 1], dir: [0, 0, 1] }, { pos: [0, 0, -1], dir: [0, 0, -1] },
      { pos: [1, 0, 0], dir: [1, 0, 0] }, { pos: [-1, 0, 0], dir: [-1, 0, 0] },
      { pos: [0, 1, 0], dir: [0, 1, 0] }, { pos: [0, -1, 0], dir: [0, -1, 0] },
    ];
    faceConfigs.forEach((config) => {
      const geo = (config.dir[2] !== 0) ? new THREE.BoxGeometry(2, 2, 0.1) :
                  (config.dir[0] !== 0) ? new THREE.BoxGeometry(0.1, 2, 2) :
                  new THREE.BoxGeometry(2, 0.1, 2);
      const mesh = new THREE.Mesh(geo, sideMat);
      mesh.position.set(...config.pos);
      mainGroup.add(mesh);
      sides.push({ mesh, originalPos: new THREE.Vector3(...config.pos), direction: new THREE.Vector3(...config.dir), spin: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(0.15) });
    });
    scene.add(mainGroup);

    // --- 5. LANTERNS ---
    const createLantern = (xPos) => {
      const lanternGroup = new THREE.Group();
      const glowMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, emissive: 0xffaa00, emissiveIntensity: 0 });
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 20), glowMat);
      string.position.y = 10.5;
      const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.4, 0.4, 6), glowMat);
      topCap.position.y = 0.7;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 6), glowMat);
      const bottomBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.1, 0.3, 6), glowMat);
      bottomBase.position.y = -0.6;
      const lampLight = new THREE.PointLight(0xffaa00, 0, 15);
      lanternGroup.add(string, body, topCap, bottomBase, lampLight);
      lanternGroup.position.set(xPos, 15, -2);
      return { group: lanternGroup, material: glowMat, light: lampLight };
    };
    const leftL = createLantern(-8.5); const rightL = createLantern(8.5);
    scene.add(leftL.group, rightL.group);

    // --- 6. MESSAGE ---
    const msgCanvas = document.createElement('canvas');
    const mCtx = msgCanvas.getContext('2d');
    msgCanvas.width = 1200; msgCanvas.height = 1024;
    mCtx.textAlign = 'center'; mCtx.fillStyle = '#ffd700';
    mCtx.font = 'bold 120px serif'; mCtx.fillText('عيد مبارك', 600, 300);
    mCtx.font = '300 75px "Segoe UI", sans-serif'; mCtx.letterSpacing = "15px"; mCtx.fillText('EID MUBARAK', 600, 420);
    mCtx.letterSpacing = "1px"; mCtx.font = 'italic 32px "Segoe UI", sans-serif';
    mCtx.fillText('Wishing you and your family an Eid full of', 600, 520);
    mCtx.fillText('Happiness, Peace & Spiritual Joy', 600, 570);
    mCtx.font = 'bold 30px sans-serif'; mCtx.fillText('by Abdullah Mufeez', 600, 660);
    mCtx.font = '24px sans-serif'; mCtx.fillText('(B23110006080)', 600, 700);
    const msgSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(msgCanvas), transparent: true, opacity: 0 }));
    msgSprite.scale.set(0.1, 0.1, 1);
    scene.add(msgSprite);

    // --- 7. LIGHTING ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pointLight1 = new THREE.PointLight(0xffffff, 100); pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    camera.position.z = 15;

    // --- 8. ANIMATION ---
    const handleAction = () => { isOpenRef.current = !isOpenRef.current; setUiOpen(isOpenRef.current); };
    window.addEventListener('mousedown', handleAction);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      const opened = isOpenRef.current;

      // BOX ROTATION
      mainGroup.rotation.y += opened ? 0.005 : 0.015;
      mainGroup.rotation.x += opened ? 0.003 : 0.01;
      mainGroup.rotation.z += opened ? 0.002 : 0.005;

      // DYNAMIC BOX GLOW
      // It glows brighter when closed to be visible, then softens when opened
      sideMat.emissiveIntensity = THREE.MathUtils.lerp(sideMat.emissiveIntensity, opened ? 0.1 : 0.5, 0.05);

      sides.forEach((side) => {
        const targetPos = opened ? side.originalPos.clone().add(side.direction.clone().multiplyScalar(4.5)) : side.originalPos;
        side.mesh.position.lerp(targetPos, 0.07);
        if(opened) { side.mesh.rotation.x += side.spin.x; side.mesh.rotation.y += side.spin.y; }
        else { side.mesh.rotation.set(0,0,0); }
      });

      // Dust & Lanterns...
      const posAttr = dustPoints.geometry.attributes.position;
      if (opened) {
        dustMat.opacity = THREE.MathUtils.lerp(dustMat.opacity, 1, 0.05);
        for(let i=0; i<dustCount; i++) {
            posAttr.array[i*3] += dustVel[i*3];
            posAttr.array[i*3+1] += dustVel[i*3+1] - 0.003; 
            posAttr.array[i*3+2] += dustVel[i*3+2];
        }
      } else {
          dustMat.opacity = 0;
          for(let i=0; i<dustCount*3; i++) posAttr.array[i] = 0;
      }
      posAttr.needsUpdate = true;

      [leftL, rightL].forEach((l, i) => {
        l.group.position.y = THREE.MathUtils.lerp(l.group.position.y, opened ? 4.5 : 15, 0.05);
        l.material.emissiveIntensity = THREE.MathUtils.lerp(l.material.emissiveIntensity, opened ? 3.5 : 0, 0.05);
        l.light.intensity = THREE.MathUtils.lerp(l.light.intensity, opened ? 50 : 0, 0.05);
        l.group.rotation.z = Math.sin(Date.now()*0.001 + i) * 0.12;
      });

      if (opened) {
        msgSprite.material.opacity = THREE.MathUtils.lerp(msgSprite.material.opacity, 1, 0.1);
        const s = THREE.MathUtils.lerp(msgSprite.scale.x, 10, 0.1);
        msgSprite.scale.set(s, s * 0.85, 1);
      } else {
        msgSprite.material.opacity = 0; msgSprite.scale.set(0.1, 0.1, 1);
      }

      renderer.render(scene, camera);
    };
    animate();
    return () => window.removeEventListener('mousedown', handleAction);
  }, []);

  return <div ref={refContainer} style={{ width: '100vw', height: '100vh', background: '#000' }} />;
}

export default MyThree;