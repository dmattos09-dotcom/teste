import { Composition } from 'remotion';
import { Reel, REEL_DURATION } from './Reel';

export const Root: React.FC = () => (
  <Composition
    id="AchadinhosReel"
    component={Reel}
    durationInFrames={REEL_DURATION}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ bgm: true }}
  />
);
