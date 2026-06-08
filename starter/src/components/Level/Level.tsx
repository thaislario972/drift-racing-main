import {Sprite, Stage, Container } from "@pixi/react";
import useDimensions from "../../hooks/useDimensions";
import { PropsWithChildren } from "react";
import circuit from "../../assets/circuit.png";
import circuit2 from "../../assets/circuit2.png";
import circuit3 from "../../assets/circuit3.png";
import { Texture, SCALE_MODES } from "pixi.js";

const circuitTextures: Record<string, string> = {
    circuit,
    circuit2,
    circuit3,
};

interface LevelProps extends PropsWithChildren {
    selectedCircuit: string;
}

const Level = ({ children, selectedCircuit }: LevelProps) => {
    const { width, height } = useDimensions();

    const selectedTexture = Texture.from(circuitTextures[selectedCircuit], {
        scaleMode: SCALE_MODES.NEAREST,
    });

  return (
      <Stage width={width} height={height} options={{}}>
          <Container>
              <Sprite
                  texture={selectedTexture}
                  x={0}
                  y={0}
                  width={width}
                  height={height}
              />

              {children}
          </Container>
      </Stage>
  )
}


export default Level;