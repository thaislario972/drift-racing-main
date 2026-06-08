import { useState, useEffect } from "react";
import { Car } from "./components/Car/Car";
import Level from "./components/Level/Level";
import logo from './assets/DS_LOGO.png';
import e36Img from "./assets/E36-F.png";
import supraImg from "./assets/Supra-F.png";
import s15Img from "./assets/S15-good.png";

import circuit1Img from "./assets/circuit.png";
import circuit2Img from "./assets/circuit2.png";
import circuit3Img from "./assets/circuit3.png";

type ModalType = "cars" | "circuits" | null;

const cars = [
    {
        id: "E36",
        name: "BMW E36 M3",
        image: e36Img,
        stats: [

            {
                label:"Puissance",
                value:78,
                real:"190 ch"
            },

            {
                label:"Poids",
                value:75,
                real:"1460 kg"
            },

            {
                label:"Maniabilité",
                value:95,
                real:"Empattement court"
            },

            {
                label:"Drift",
                value:90,
                real:"Propulsion"
            },

            {
                label:"Grip",
                value:85,
                real:"Stable"
            }

        ]
    },

    {
        id: "supra",
        name: "Toyota Supra MK4",
        image: supraImg,
        stats: [

            {
                label:"Puissance",
                value:100,
                real:"324 ch"
            },

            {
                label:"Poids",
                value:45,
                real:"1560 kg"
            },

            {
                label:"Maniabilité",
                value:60,
                real:"Empattement long"
            },

            {
                label:"Drift",
                value:80,
                real:"Propulsion"
            },

            {
                label:"Grip",
                value:70,
                real:"Moyen"
            }

        ]
    },

    {
        id: "s15",
        name: "Nissan S15",
        image: s15Img,
        stats: [

            {
                label:"Puissance",
                value:78,
                real:"250 ch"
            },

            {
                label:"Poids",
                value:92,
                real:"1240 kg"
            },

            {
                label:"Maniabilité",
                value:88,
                real:"Compacte"
            },

            {
                label:"Drift",
                value:95,
                real:"Propulsion"
            },

            {
                label:"Grip",
                value:90,
                real:"Excellent"
            }

        ]
    }
];

const circuits = [

    {
        id:"circuit",
        name:"Sunset Circuit",
        description:"Circuit polyvalent • Idéal pour débuter",
        image:circuit1Img
    },

    {
        id:"circuit2",
        name:"Snake Pass",
        description:"Circuit technique • Entraînement requis",
        image:circuit2Img
    },

    {
        id:"circuit3",
        name:"High Speed Ring",
        description:"Circuit rapide • Maîtrise recommandée",
        image:circuit3Img
    }

]

const App = () => {
    const [selectedCar, setSelectedCar] = useState<'s15' | 'supra' | 'E36'>('s15')
    const [selectedCircuit, setSelectedCircuit] = useState("circuit");
    // compteur pour forcer reset
    const [resetCounter, setResetCounter] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);

    const [activeModal, setActiveModal] =
        useState<ModalType>(null);

    const handleReset = () => {
        setResetCounter(prev => prev + 1);
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleReset();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const currentCar = cars.find((car) => car.id === selectedCar);
    const currentCircuit = circuits.find((circuit) => circuit.id === selectedCircuit);

    const renderStatBar = (
        label:string,
        value:number,
        real:string
    ) => (

        <div className="stat-line">

            <div className="stat-header">

                <span>{label}</span>

                <span className="real-stat">
{real}
</span>

            </div>

            <div className="stat-bar">

                <div
                    className="stat-fill"
                    style={{width:`${value}%`}}
                />

            </div>

        </div>

    )

  return (
      <>
          <header className="game-header">
              <button
                  className="burger-button"
                  onClick={() => setMenuOpen(prev => !prev)}
              >
                  ☰
              </button>

              <div className="logo-zone">
                  <img src={logo} alt="Logo DriftShop"/>

                  <div className="logo-text">
                      <h1>The Game</h1>
                      <p>
                          {currentCar?.name} • {currentCircuit?.name}
                      </p>
                  </div>
              </div>
          </header>

          {menuOpen && (
              <div className="side-menu">
                  <button onClick={() => setActiveModal("cars")}>
                      Sélection voiture
                  </button>

                  <button onClick={() => setActiveModal("circuits")}>
                      Sélection circuit
                  </button>

                  <button onClick={handleReset}>
                      Reset voiture
                  </button>
              </div>
          )}
          {activeModal === "cars" && (
              <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <button className="modal-close" onClick={() => setActiveModal(null)}>
                          ×
                      </button>

                      <h2>Choisis ta voiture</h2>

                      <div className="selection-grid">
                          {cars.map((car) => (
                              <button
                                  key={car.id}
                                  className="selection-card"
                                  onClick={() => {
                                      setSelectedCar(car.id as 's15' | 'supra' | 'E36');
                                      setActiveModal(null);
                                      setMenuOpen(false);
                                  }}
                              >
                                  <img src={car.image} alt={car.name}/>
                                  <h3>{car.name}</h3>

                                  <div className="stats-list">
                                      {car.stats.map((stat) => (
                                          <div key={stat.label}>
                                              {renderStatBar(stat.label, stat.value, stat.real)}
                                          </div>
                                      ))}
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activeModal === "circuits" && (
              <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <button className="modal-close" onClick={() => setActiveModal(null)}>
                          ×
                      </button>

                      <h2>Choisis ton circuit</h2>

                      <div className="selection-grid">
                          {circuits.map((circuit) => (
                              <button
                                  key={circuit.id}
                                  className="selection-card"
                                  onClick={() => {
                                      setSelectedCircuit(circuit.id);
                                      setActiveModal(null);
                                      setMenuOpen(false);
                                  }}
                              >
                                  <img src={circuit.image} alt={circuit.name}/>
                                  <h3>{circuit.name}</h3>
                                  <p className="circuit-description">
                                      {circuit.description}
                                  </p>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          )}
          <Level selectedCircuit={selectedCircuit} >
          <Car selectedCar={selectedCar} resetSignal={resetCounter}/>
          </Level>
      </>
  )
}


export default App;

