export type SpaceAudio = {
  unlock: () => void;
  setWarp: (amount: number) => void;
  dispose: () => void;
};

export function createAudio(): SpaceAudio {
  let ctx: AudioContext | null = null;
  let filter: BiquadFilterNode | null = null;
  let gain: GainNode | null = null;
  let boostGain: GainNode | null = null;
  let oscA: OscillatorNode | null = null;
  let oscB: OscillatorNode | null = null;
  let noise: AudioBufferSourceNode | null = null;
  let unlocked = false;

  function unlock() {
    if (unlocked && ctx && ctx.state !== "closed") {
      void ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const n = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = n.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    noise = ctx.createBufferSource();
    noise.buffer = n;
    noise.loop = true;

    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180;
    filter.Q.value = 0.7;

    gain = ctx.createGain();
    gain.gain.value = 0.028;

    boostGain = ctx.createGain();
    boostGain.gain.value = 0;

    oscA = ctx.createOscillator();
    oscA.type = "sine";
    oscA.frequency.value = 46;
    oscB = ctx.createOscillator();
    oscB.type = "sine";
    oscB.frequency.value = 92.5;

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.012;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    oscA.connect(oscGain);
    oscB.connect(oscGain);
    oscGain.connect(ctx.destination);
    boostGain.connect(ctx.destination);

    const boostFilter = ctx.createBiquadFilter();
    boostFilter.type = "bandpass";
    boostFilter.frequency.value = 420;
    boostFilter.Q.value = 0.6;
    noise.connect(boostFilter);
    boostFilter.connect(boostGain);

    noise.start();
    oscA.start();
    oscB.start();
    unlocked = true;
  }

  function setWarp(amount: number) {
    if (!ctx || !filter || !gain || !boostGain || !oscA || !oscB) return;
    if (ctx.state === "suspended") return;
    const t = ctx.currentTime;
    const a = Math.max(0, Math.min(1, amount));
    filter.frequency.setTargetAtTime(160 + a * 1400, t, 0.08);
    gain.gain.setTargetAtTime(0.022 + a * 0.04, t, 0.1);
    boostGain.gain.setTargetAtTime(a * 0.045, t, 0.06);
    oscA.frequency.setTargetAtTime(42 + a * 28, t, 0.12);
    oscB.frequency.setTargetAtTime(88 + a * 70, t, 0.12);
  }

  function dispose() {
    try {
      noise?.stop();
      oscA?.stop();
      oscB?.stop();
      void ctx?.close();
    } catch {
      /* ignore */
    }
    ctx = null;
  }

  return { unlock, setWarp, dispose };
}
