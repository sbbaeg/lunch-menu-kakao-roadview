declare module 'react-confetti' {
  import { FC } from 'react';

  interface ConfettiProps {
    width?: number;
    height?: number;
    numberOfPieces?: number;
    recycle?: boolean;
    run?: boolean;
    gravity?: number;
    wind?: number;
    tweenDuration?: number;
    onConfettiComplete?: () => void;
    [key: string]: any;
  }

  const ReactConfetti: FC<ConfettiProps>;
  export default ReactConfetti;
}
