import {useState, useMemo, useRef, useEffect} from "react";
import {Sprite, useTick} from "@pixi/react";
import { Texture } from "pixi.js";
import car1 from '../../assets/s15-v60.png';
import car2 from '../../assets/Supra-F.png';
import car3 from '../../assets/E36-F.png';
import p2 from 'p2'
import {useControls} from "../../hooks/useControls.ts";
// import smokeTexturePath from "../../assets/fumée4.png";
import { Graphics as PixiGraphics } from 'pixi.js'; // pour le typage
import { Graphics } from '@pixi/react'; // pour le composant React
import engineSound from '../../assets/car-drifting-sound-effect.mp3';

type SmokeParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  alpha: number;
  life: number;
  maxLife: number;
};

const carTextures = {
  s15: car1,
  supra: car2,
  E36: car3,
};

type CarProps = {
  selectedCar: 's15' | 'supra' | 'E36';
  resetSignal: number;  // nouveau prop
};


const PHYSICS_SETTINGS = {
  s15: {
    width: 100, height: 40, mass: 3,
    steer: 70 * (Math.PI / 180),
    wheel: 100,
    engine: 280, brake: -600,
    grip: { drift: 0.6, normal: 3, lateral: 2 },
    drag: { factor: 0.5, max: 1000 },
    drift: { factor: 0.3, min: 300 },
    step: 1 / 60,
  },
  supra: {
    width: 105, height: 45, mass: 3.5,
    steer: 65 * (Math.PI / 180),       // angle un peu plus lent
    wheel: 50,                        // rayon un peu plus grand
    engine: 360, brake: -550,          // plus de puissance, freinage moins brutal
    grip: { drift: 0.5, normal: 2.8, lateral: 1.8 },  // un peu moins de grip latéral = glisse plus stable
    drag: { factor: 0.55, max: 1000 },
    drift: { factor: 0.30, min: 320 }, // drift plus progressif, déclenchement plus doux
    step: 1 / 60,
  },
  E36: {
    width: 95, height: 38, mass: 2.8,
    steer: 70 * (Math.PI / 180),       // direction plus vive
    wheel: 120,                         // rayon de braquage plus court
    engine: 280, brake: -650,          // moteur moins puissant que Supra, frein plus agressif
    grip: { drift: 0.7, normal: 3.1, lateral: 2.2 },  // plus de grip latéral = transitions plus rapides
    drag: { factor: 0.45, max: 1000 },
    drift: { factor: 0.35, min: 280 }, // drift rapide à déclencher
    step: 1 / 60,
  },
};






export const Car = ({  selectedCar, resetSignal }: CarProps) => {
  console.log("Car rendu avec selectedCar =", selectedCar);
  const [pos, setPos] = useState({x: 300, y: 200, rotation: 0});
  const [tireTracks, setTireTracks] = useState<{ x: number, y: number, rotation: number, alpha: number }[]>([]);
  const drawTireTracks = (g: PixiGraphics) => {
    g.clear();
    g.beginFill(0x000000, 0.5);
    tireTracks.forEach(track => {
      g.drawRect(track.x - 1.5, track.y - 1.5, 3, 3);
    });
    g.endFill();
  };
// Dans ton composant Car
  const engineAudioRef = useRef<HTMLAudioElement | null>(null);
  const isAccelerating = useRef(false); // pour savoir si on garde UP appuyé




  // Utiliser la texture correspondant à la voiture sélectionnée
  const texture = useMemo(() => Texture.from(carTextures[selectedCar]), [selectedCar]);
  const phys = useMemo(() => PHYSICS_SETTINGS[selectedCar], [selectedCar]);
  const [smokeParticles, setSmokeParticles] = useState<SmokeParticle[]>([]);


  // const fadeInterval = useRef<NodeJS.Timeout | null>(null);
  const world = useRef(new p2.World({gravity: [0, 0]}))
  const carBody = useRef<p2.Body | null>(null)
  const {getControlsDirection} = useControls()
// Ref pour mémoriser la dernière force latérale (glisse)
  const lastLateralForce = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    const car = new p2.Body({mass: phys.mass, position: [300, 200]});
    car.addShape(new p2.Box({width: phys.width, height: phys.height}));
    world.current.addBody(car);
    carBody.current = car;
    //cleanup
    return () => world.current.removeBody(car);
  }, [selectedCar, phys.mass, phys.width, phys.height]);

  useEffect(() => {
    console.log("RESET SIGNAL CHANGED !");
    if (carBody.current) {
      carBody.current.position[0] = 300;
      carBody.current.position[1] = 200;
      carBody.current.angle = 0;
      carBody.current.velocity[0] = 0;
      carBody.current.velocity[1] = 0;
      carBody.current.angularVelocity = 0;
    }
  }, [resetSignal]);

  useEffect(() => {
    const audio = new Audio(engineSound);
    audio.volume = 0.5;
    audio.loop = true;

    // Empêche le spam du son quand il est en train d'être joué
    audio.onended = () => {
      isAccelerating.current = false;
    };

    engineAudioRef.current = audio;
  }, []);

  useTick((delta) => {
    if (!carBody.current) return;
    const car = carBody.current;
    const {pressedKeys} = getControlsDirection();
    const isUp = pressedKeys.includes("UP");
    const isDown = pressedKeys.includes("DOWN");
    const isLeft = pressedKeys.includes("LEFT");
    const isRight = pressedKeys.includes("RIGHT");
    const isSpace = pressedKeys.includes("SPACE");


    // vecteurs avant / droite
    const forward: [number, number] = [Math.cos(car.angle), Math.sin(car.angle)];
    const right: [number, number] = [-forward[1], forward[0]];
    const vel = car.velocity;
    // input direction
    const steerInput = (isRight ? 1 : 0) - (isLeft ? 1 : 0);
    // vitesse latérale (pour la force de glisse)
    const lateralSpeed = p2.vec2.dot(vel, right);
    // Coefficient de réduction latérale selon si la voiture drifte ou non
    const driftFactor = isUp && Math.abs(steerInput) > 0 ? phys.grip.drift : phys.grip.normal;

    // Force latérale à appliquer (opposée à la vitesse latérale)
    const lateralFrictionForce: [number, number] = [
      -right[0] * lateralSpeed * driftFactor,
      -right[1] * lateralSpeed * driftFactor,
    ];



    /*if (isUp) {
      const audio = engineAudioRef.current;
      if (audio && audio.paused) {
        audio.currentTime = 0;
        audio.volume = 0; // ← commence à 0
        audio.play();

        // Fondu d'entrée sur 0.5s
        fadeInterval.current = setInterval(() => {
          if (audio.volume < 0.5) {
            audio.volume = Math.min(0.5, audio.volume + 0.02);
          } else {
            clearInterval(fadeInterval.current!);
          }
        }, 100); // toutes les 100 ms
      }
    } else {
      // Optionnel : fade-out
      const audio = engineAudioRef.current;
      if (audio && !audio.paused) {
        if (fadeInterval.current) clearInterval(fadeInterval.current);
        fadeInterval.current = setInterval(() => {
          if (audio.volume > 0.01) {
            audio.volume = Math.max(0, audio.volume - 0.02);
          } else {
            audio.pause();
            clearInterval(fadeInterval.current!);
          }
        }, 100);
      }
    }*/



// Si on tourne ET qu'on accélère, on applique et mémorise la force latérale
    if (steerInput !== 0 && isUp) {
      lastLateralForce.current = lateralFrictionForce;
      car.applyForce(lateralFrictionForce);
    }
// Si on accélère mais qu'on ne tourne plus, on continue d'appliquer la dernière force
    else if (isUp) {
      // Amortissement progressif pour simuler la dissipation du drift
      lastLateralForce.current[0] *= 0.98;
      lastLateralForce.current[1] *= 0.98;
      car.applyForce(lastLateralForce.current);
    }
// Si on n'accélère plus, on coupe la glisse (freinage ou neutre)
    else {
      lastLateralForce.current = [0, 0];
    }

  /*  // Logique de glisse
    if (Math.abs(lateralSpeed) > 0.5) {
      // Mémoriser la dernière glisse significative
      lastLateralForce.current = lateralFrictionForce;
    }

// Toujours appliquer la glisse mémorisée, mais la faire diminuer petit à petit
    lastLateralForce.current[0] *= 0.97; // amortissement
    lastLateralForce.current[1] *= 0.97;
    car.applyForce(lastLateralForce.current);*/

    // Force moteur avant/arrière
    let engine = 0;
    if (isUp) engine = phys.engine;
    else if (isDown) engine = phys.brake;
    if (engine) car.applyForce([forward[0] * engine, forward[1] * engine]);


    // Steering
    const fwdSpeed = p2.vec2.dot(vel, forward);
    const steerFactor = Math.max(0.8, 1.2 - Math.abs(fwdSpeed) / 800); // entre 0.3 et 1

    const targetSteer = steerInput * phys.steer * steerFactor;

    let wheel = phys.wheel;
    if (isUp && Math.abs(steerInput) > 0 && Math.abs(fwdSpeed) < 300) {
      wheel *= 0.7; // Réduit le rayon de braquage à faible vitesse pour permettre les donuts
    }

    if (isSpace) {
      const lateralBrakeForce: [number, number] = [
        -right[0] * lateralSpeed * 10, // Augmente le glissement latéral d’un coup
        -right[1] * lateralSpeed * 10,
      ];
      car.applyForce(lateralBrakeForce);
    }

    if (steerInput !== 0 && Math.abs(fwdSpeed) > 0.1) {
      const turnRadius = wheel / Math.tan(Math.abs(targetSteer) || 0.0001);
      car.angularVelocity = (fwdSpeed / turnRadius) * targetSteer;
    } else {
      car.angularVelocity *= 0.9;
    }


    // ralentir la rotation si pas de direction
    if (!isLeft && !isRight) {
      car.angularVelocity *= 0.95;
    }

    // drag si pas d'accélération
    if (!engine) {
      car.applyForce([
        -forward[0] * fwdSpeed * phys.drag.factor,
        -forward[1] * fwdSpeed * phys.drag.factor,
      ]);
    }

    // Mise à jour du monde physique
    world.current.step(phys.step, Math.min(delta, 0.016));

    // Empêche la voiture de sortir de l'écran (murs invisibles)
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const margin = 0; // Tu peux le passer à 5 ou 10 si tu veux une petite marge

// Clamp position
    car.position[0] = Math.max(margin, Math.min(screenWidth, car.position[0]));
    car.position[1] = Math.max(margin, Math.min(screenHeight, car.position[1]));

// Si on touche un bord, on freine/arrête tout
    if (
        car.position[0] <= margin || car.position[0] >= screenWidth ||
        car.position[1] <= margin || car.position[1] >= screenHeight
    ) {
      car.velocity[0] = 0;
      car.velocity[1] = 0;
      car.angularVelocity = 0;
    }



    //"🔥 Ajout des particules de fumée"
const isDrifting = isUp && Math.abs(steerInput) > 0;
    setSmokeParticles(prev => {
      const newParticles = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx * delta,
            y: p.y + p.vy * delta,
            life: p.life + delta,
            alpha: 1 - p.life / p.maxLife,
            scale: p.scale + 0.002 * delta,
          }))
          .filter(p => p.life < p.maxLife);

      const drifting = Math.abs(carBody.current!.angularVelocity) > 1 || Math.abs(carBody.current!.velocity[0]) > 2;

      if (drifting && carBody.current) {
        const angle = carBody.current.angle;
        const offset = 35;
        const baseX = carBody.current.position[0] - Math.cos(angle) * offset;
        const baseY = carBody.current.position[1] - Math.sin(angle) * offset;

        for (let i = 0; i < 60; i++) {  // ← 5 petites particules par frame
          newParticles.push({
            x: baseX + (Math.random() - 0.5) * 5,
            y: baseY + (Math.random() - 0.5) * 5,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            scale: 0.015 + Math.random() * 0.01,  // ← petites particules
            alpha: 1,
            life: 0,
            maxLife: 40 + Math.random() * 20,
          });
        }
      }

      return newParticles;
    });



    // Traces de pneus
    if (isDrifting) {
      const baseTireSpacing = 20;       // écart normal quand pas de drift
      const driftTireSpacing = 20;      // écart plus large quand drift

      const tireSpacing = isDrifting ? driftTireSpacing : baseTireSpacing;

      const offsetDistance = 30;
      const backAngle = car.angle + Math.PI;

      const leftX = car.position[0] + Math.cos(backAngle) * offsetDistance + Math.sin(car.angle) * tireSpacing;
      const leftY = car.position[1] + Math.sin(backAngle) * offsetDistance - Math.cos(car.angle) * tireSpacing;

      const rightX = car.position[0] + Math.cos(backAngle) * offsetDistance - Math.sin(car.angle) * tireSpacing;
      const rightY = car.position[1] + Math.sin(backAngle) * offsetDistance + Math.cos(car.angle) * tireSpacing;

      setTireTracks(prev =>
          [
            ...prev
                .map(track => ({ ...track, alpha: track.alpha - 0.001 * delta }))
                .filter(track => track.alpha > 0),
            { x: leftX, y: leftY, rotation: car.angle, alpha: 0.3 },
            { x: rightX, y: rightY, rotation: car.angle, alpha: 0.3 },
          ]
      );
    } else {
      setTireTracks(prev =>
          prev
              .map(track => ({ ...track, alpha: track.alpha - 0.0001 * delta }))
              .filter(track => track.alpha > 0)
      );
    }

    // Mise à jour du state React (affichage de la voiture)
    setPos({x: car.position[0], y: car.position[1], rotation: car.angle});
  });

    return (
        <>

          <Graphics draw={drawTireTracks} />

          {smokeParticles.map((p, i) => (
              <Graphics
                  key={i}
                  draw={g => {
                    g.clear();
                    g.beginFill(0x999999, p.alpha); // gris clair et fumée fine
                    g.drawCircle(0, 0, 20 * p.scale); // ← cercle plus petit
                    g.endFill();
                  }}
                  x={p.x}
                  y={p.y}
              />
          ))}

          <Sprite
              texture={texture}
              x={pos.x}
              y={pos.y}
              rotation={pos.rotation + Math.PI / 2}
              anchor={0.5}
              scale={0.5}
          />
        </>
    );
  };