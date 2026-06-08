import { useState, useEffect } from "react";
import { Car } from "./components/Car/Car";
import Level from "./components/Level/Level";
import logo from './assets/DS_LOGO.png';



const App = () => {
    const [selectedCar, setSelectedCar] = useState<'s15' | 'supra' | 'E36'>('s15')
    const [selectedCircuit, setSelectedCircuit] = useState("circuit");
    // compteur pour forcer reset
    const [resetCounter, setResetCounter] = useState(0);

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

  return (
      <>
          <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignContent: 'center',
              gap: '25px',
              backgroundColor: "black",
              paddingTop: '10px'
          }}>
              <button onClick={() => setSelectedCar('E36')} className="bouton"> BMW E36</button>
              <button onClick={() => setSelectedCar('supra')} className='bouton'> Supra MK4</button>
              <button onClick={() => setSelectedCar('s15')} className='bouton'> Nissan S15</button>
              <div style={{display: 'flex', justifyContent: 'center', alignContent: 'center', gap: '15px'}}>
                  <img src={logo} alt="Logo DriftShop" style={{width: 'auto', height: '95px',}}/> <h1
                  style={{fontSize: '30px', color: 'white'}}>The Game</h1>
              </div>
              <button onClick={() => setSelectedCircuit("circuit")} className='bouton'>Circuit 1</button>
              <button onClick={() => setSelectedCircuit("circuit2")} className='bouton'>Circuit 2</button>
              <button onClick={() => setSelectedCircuit("circuit3")} className='bouton'>Circuit 3</button>
              <button onClick={handleReset} className='bouton'>Reset voiture</button>
          </div>
          <Level selectedCircuit={selectedCircuit} >
          <Car selectedCar={selectedCar} resetSignal={resetCounter}/>
          </Level>
      </>
  )
}


export default App;

