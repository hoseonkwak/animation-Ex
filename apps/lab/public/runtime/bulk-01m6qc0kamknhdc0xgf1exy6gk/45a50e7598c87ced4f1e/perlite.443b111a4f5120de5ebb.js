export function createPerlite(noise) {
  let texture = null;
  let samplingEnabled = false;

  const interpolate = (a, b, amount) => a + (b - a) * amount;
  function sampledNoise(x, y, z) {
    if (!texture || !samplingEnabled) return noise.noise(x, y, z);

    const { resolution, period, data } = texture;
    const wrap = value => ((value % period) + period) % period;
    const gridX = wrap(x) / period * resolution;
    const gridY = wrap(y) / period * resolution;
    const gridZ = wrap(z) / period * resolution;
    const x0 = Math.floor(gridX), y0 = Math.floor(gridY), z0 = Math.floor(gridZ);
    const x1 = (x0 + 1) % resolution;
    const y1 = (y0 + 1) % resolution;
    const z1 = (z0 + 1) % resolution;
    const tx = gridX - x0, ty = gridY - y0, tz = gridZ - z0;
    const at = (px, py, pz) => data[(pz * resolution + py) * resolution + px];

    const lower = interpolate(
      interpolate(at(x0, y0, z0), at(x1, y0, z0), tx),
      interpolate(at(x0, y1, z0), at(x1, y1, z0), tx),
      ty
    );
    const upper = interpolate(
      interpolate(at(x0, y0, z1), at(x1, y0, z1), tx),
      interpolate(at(x0, y1, z1), at(x1, y1, z1), tx),
      ty
    );
    return interpolate(lower, upper, tz);
  }

  const api = {
    sample: sampledNoise,
    terrain(x, z, scale, noiseOffset, offset = 0) {
      const octaves = [
        [sampledNoise(x * scale + noiseOffset + offset, z * scale - noiseOffset, 17.31), 1],
        [sampledNoise(x * scale * 2 + noiseOffset + offset + 31.4, z * scale * 2 - noiseOffset + 17.8, 23.6), 0.5],
        [sampledNoise(x * scale * 4 + noiseOffset + offset - 12.7, z * scale * 4 - noiseOffset + 43.2, 8.9), 0.25],
        [sampledNoise(x * scale * 8 + noiseOffset + offset + 67.1, z * scale * 8 - noiseOffset - 28.3, 41.2), 0.125]
      ];
      return octaves.reduce((sum, [value, amplitude]) => sum + value * amplitude, 0) / 1.875;
    },
    setSamplingEnabled(enabled) {
      samplingEnabled = Boolean(enabled);
    },
    async generateMap(resolution) {
      if (!Number.isInteger(resolution) || resolution < 2 || resolution > 128) {
        throw new RangeError('Noise-map resolution must be an integer from 2 to 128.');
      }

      const data = new Float32Array(resolution ** 3);
      const step = 0.1;
      const yieldEvery = 4096;

      for (let index = 0; index < data.length; index++) {
        const x = index % resolution;
        const y = Math.floor(index / resolution) % resolution;
        const z = Math.floor(index / (resolution * resolution));
        data[index] = noise.noise(x * step, y * step, z * step);

        if ((index + 1) % yieldEvery === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      texture = { resolution, period: resolution, data };
      return {
        resolution,
        dimensions: { width: resolution, height: resolution, depth: resolution },
        period: resolution,
        sampleCount: data.length,
        byteLength: data.byteLength
      };
    }
  };
  api.generateNoiseMap = api.generateMap;
  return api;
}
