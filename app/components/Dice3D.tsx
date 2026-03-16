import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Función de easing más dramática - elastic out con bounce
function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

// Función de easing combinada para mayor drama
function dramaticEasing(t: number): number {
  // Primeros 70% usan easing cubic para rotaciones rápidas
  if (t < 0.7) {
    const adjustedT = t / 0.7;
    return 0.7 * (1 - Math.pow(1 - adjustedT, 2));
  }
  
  // Últimos 30% usan elastic para el asentamiento dramático
  const adjustedT = (t - 0.7) / 0.3;
  return 0.7 + 0.3 * easeOutElastic(adjustedT);
}

// Orientaciones objetivo para cada cara del dado (quaternions)
// Mapeo de materiales: [derecha=3, izquierda=4, arriba=5, abajo=2, frontal=1, trasera=6]
// Para mostrar cada número, necesitamos rotar para que esa cara quede al frente
const FACE_ORIENTATIONS: Record<number, THREE.Quaternion> = {
  1: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)), // Cara 1 ya está frontal
  6: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)), // Rotar 180° en Y para mostrar cara trasera
  3: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)), // Rotar -90° en Y para traer cara derecha al frente
  4: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)), // Rotar 90° en Y para traer cara izquierda al frente
  2: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), // Rotar -90° en X para traer cara superior al frente
  5: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), // Rotar 90° en X para traer cara inferior al frente
};

// Función para crear textura con puntos para cada cara del dado
function createDiceTexture(faceNumber: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  // Fondo beige suave
  ctx.fillStyle = '#f5e6d3';
  ctx.fillRect(0, 0, 256, 256);
  
  // Añadir sutil gradiente para dar profundidad
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(245, 230, 211, 1)');
  gradient.addColorStop(1, 'rgba(230, 210, 190, 1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  
  // Puntos marrón oscuro
  ctx.fillStyle = '#3e2723';
  const dotRadius = 14;
  const positions: Record<number, number[][]> = {
    1: [[128, 128]], // Centro
    2: [[76, 76], [180, 180]], // Diagonal
    3: [[76, 76], [128, 128], [180, 180]], // Diagonal con centro
    4: [[76, 76], [180, 76], [76, 180], [180, 180]], // Esquinas
    5: [[76, 76], [180, 76], [128, 128], [76, 180], [180, 180]], // Esquinas + centro
    6: [[76, 76], [180, 76], [76, 128], [180, 128], [76, 180], [180, 180]] // Dos columnas
  };
  
  positions[faceNumber].forEach(([x, y]) => {
    // Sombra del punto
    ctx.fillStyle = 'rgba(62, 39, 35, 0.3)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Punto principal
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Brillo sutil en el punto
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, dotRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
  
  return new THREE.CanvasTexture(canvas);
}

interface Dice3DProps {
  onResult?: (result: number) => void;
  onRollRequest?: () => Promise<number>; // Función async que obtiene el resultado de la API
  onRollStart?: () => void;
}

export function Dice3D({ onResult, onRollRequest, onRollStart }: Dice3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const diceRef = useRef<THREE.Mesh | null>(null);
  const frameRef = useRef<number | null>(null);
  
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const isRollingRef = useRef(false);
  
  const animationRef = useRef<{
    startTime: number;
    duration: number;
    startQuaternion: THREE.Quaternion;
    targetQuaternion: THREE.Quaternion;
    targetResult: number;
    randomSpins: THREE.Quaternion;
  } | null>(null);

  // Función para generar número aleatorio como fallback
  const getRandomDiceNumber = (): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % 6) + 1;
  };

  // Función para lanzar el dado
  const rollDice = async () => {
    if (isRollingRef.current || !diceRef.current) return;

    isRollingRef.current = true;
    setIsRolling(true);
    setResult(null);
    onRollStart?.();

    let targetResult: number;

    // Si hay una función de API, usarla; si no, generar localmente
    if (onRollRequest) {
      try {
        targetResult = await onRollRequest();
      } catch (error) {
        console.error('[Dice3D] Error obteniendo resultado de API:', error);
        isRollingRef.current = false;
        setIsRolling(false);
        return; // No lanzar si hay error en la API
      }
    } else {
      targetResult = getRandomDiceNumber();
    }

    const targetQuaternion = FACE_ORIENTATIONS[targetResult].clone();
    
    // Generar múltiples rotaciones aleatorias espectaculares (muchos más giros)
    const randomSpins = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        (Math.random() * 15 + 20) * Math.PI, // 20-35 giros en X
        (Math.random() * 15 + 20) * Math.PI, // 20-35 giros en Y  
        (Math.random() * 15 + 20) * Math.PI  // 20-35 giros en Z
      )
    );
    
    // Usar la rotación actual como punto de partida
    const startQuaternion = diceRef.current.quaternion.clone();
    
    animationRef.current = {
      startTime: performance.now(),
      duration: 3500, // 3.5 segundos para la desaceleración
      startQuaternion,
      targetQuaternion,
      targetResult,
      randomSpins, // Guardar los giros aleatorios para la animación
    };
  };

  // Loop de animación
  const animate = () => {
    const now = performance.now();
    
    if (animationRef.current && diceRef.current) {
      const { startTime, duration, startQuaternion, targetQuaternion, targetResult, randomSpins } = animationRef.current;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Función de desaceleración exponencial - empieza rápido y termina en 0
      const spinSpeed = Math.pow(1 - progress, 3); // Desaceleración cúbica
      
      // Función para la interpolación hacia el resultado final
      const finalPositionProgress = dramaticEasing(progress);
      
      // Crear rotación continua basada en velocidad decreciente
      const currentSpinAngle = spinSpeed * 20; // Multiplicador para muchos giros
      
      // Extraer los ángulos de rotación del quaternion randomSpins
      const euler = new THREE.Euler().setFromQuaternion(randomSpins);
      const currentSpins = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          euler.x * currentSpinAngle,
          euler.y * currentSpinAngle,
          euler.z * currentSpinAngle
        )
      );
      
      // Interpolar hacia la posición final
      const finalQuaternion = new THREE.Quaternion().slerpQuaternions(
        startQuaternion,
        targetQuaternion,
        finalPositionProgress
      );
      
      // Combinar giros con interpolación hacia el resultado final
      const combinedQuaternion = finalQuaternion.clone().multiply(currentSpins);
      
      diceRef.current.quaternion.copy(combinedQuaternion);
      
      // Añadir movimiento vertical más dramático
      const bounceHeight = Math.sin(progress * Math.PI) * (0.3 * (1 - progress * 0.7));
      diceRef.current.position.y = bounceHeight;
      
      if (progress >= 1) {
        // Animación completada - asegurar orientación exacta
        diceRef.current.quaternion.copy(targetQuaternion);
        diceRef.current.position.y = 0;
        setResult(targetResult);
        isRollingRef.current = false;
        setIsRolling(false);
        animationRef.current = null;
        onResult?.(targetResult);
      }
    }
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    frameRef.current = requestAnimationFrame(animate);
  };

  // Manejo de redimensionamiento
  const handleResize = () => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };

  // Manejo de interacciones
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      rollDice();
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Crear escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // Fondo blanco
    sceneRef.current = scene;

    
    // Crear cámara
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.set(0, 0, 6);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

    // Crear renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Sin sombras
    rendererRef.current = renderer;

    mount.appendChild(renderer.domElement);

    // Crear luces mejoradas para resaltar el material
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Luz adicional desde otro ángulo para mejor definición
    const directionalLight2 = new THREE.DirectionalLight(0xfff5e6, 1);
    directionalLight2.position.set(-3, 2, -3);
    scene.add(directionalLight2);

    // Crear materiales para cada cara del dado con acabado más realista
    // Mapeo correcto donde caras opuestas suman 7: 1↔6, 2↔5, 3↔4
    const materials = [
      new THREE.MeshPhongMaterial({ 
        map: createDiceTexture(3),
        shininess: 30,
        specular: new THREE.Color(0x444444)
      }), // Cara derecha (+X) = 3
      new THREE.MeshPhongMaterial({ 
        map: createDiceTexture(4),
        shininess: 30,
        specular: new THREE.Color(0x444444)
      }), // Cara izquierda (-X) = 4
      new THREE.MeshPhongMaterial({ 
        map: createDiceTexture(5),
        shininess: 30,
        specular: new THREE.Color(0x444444)
      }), // Cara superior (+Y) = 5
      new THREE.MeshPhongMaterial({ 
        map: createDiceTexture(2),
        shininess: 30,
        specular: new THREE.Color(0x444444)
      }), // Cara inferior (-Y) = 2
      new THREE.MeshPhongMaterial({ 
        map: createDiceTexture(1),
        shininess: 30,
        specular: new THREE.Color(0x444444)
      }), // Cara frontal (+Z) = 1
      new THREE.MeshPhongMaterial({ 
        map: createDiceTexture(6),
        shininess: 30,
        specular: new THREE.Color(0x444444)
      }), // Cara trasera (-Z) = 6
    ];

    // Crear dado con bordes redondeados
    const diceGeometry = new RoundedBoxGeometry(1, 1, 1, 4, 0.1);
    const dice = new THREE.Mesh(diceGeometry, materials);
    dice.position.y = 0;
    diceRef.current = dice;
    scene.add(dice);

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    
    // Añadir listener de click al canvas
    renderer.domElement.addEventListener('pointerdown', rollDice);

    // Iniciar loop de animación
    frameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      renderer.domElement.removeEventListener('pointerdown', rollDice);
      
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      
      // Limpiar recursos Three.js
      scene.clear();
      renderer.dispose();
      diceGeometry.dispose();
      
      // Limpiar texturas y materiales
      materials.forEach(material => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="dice-container"
      tabIndex={0}
    >
      {result !== null && (
        <div className="dice-result">
          {result}
        </div>
      )}
    </div>
  );
}
