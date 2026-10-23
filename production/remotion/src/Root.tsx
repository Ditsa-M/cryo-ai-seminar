import { Composition } from "remotion";
import { MotionAlign } from "./MotionAlign";
import { TomoScan } from "./TomoScan";
import { Opening } from "./Opening";
import { DeckBackup, type BackupProps } from "./DeckBackup";

// Deterministic compositions: every frame is a pure function of the frame number and the
// (real or simulated) input images in ./public. No randomness, no generative imagery.
export const Root = () => (
  <>
    <Composition id="motion-align" component={MotionAlign} durationInFrames={300} fps={30} width={1280} height={720} />
    <Composition id="opening" component={Opening} durationInFrames={420} fps={30} width={1920} height={1080} />
    <Composition id="tomo-scan" component={TomoScan} durationInFrames={240} fps={30} width={720} height={720} />
    <Composition id="deck-backup" component={DeckBackup} durationInFrames={27000} fps={30} width={1920} height={1080}
      defaultProps={{ segments: [] } as BackupProps}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, (props as BackupProps).segments.reduce((a, s) => a + s.frames, 0)) })} />
  </>
);
