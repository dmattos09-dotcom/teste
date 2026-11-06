import { Composition } from 'remotion';
import { Reel, REEL_DURATION } from './Reel';
import { Ofertas, OFERTAS_DURATION } from './Ofertas';

export const Root: React.FC = () => (
  <>
  <Composition
    id="AchadinhosOfertas"
    component={Ofertas}
    durationInFrames={OFERTAS_DURATION}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ bgm: true }}
  />
  <Composition
    id="AchadinhosReel"
    component={Reel}
    durationInFrames={REEL_DURATION}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ bgm: true }}
  />
  </>
);
