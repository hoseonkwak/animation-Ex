// Build terrain geometry and retain dry vertex colors for later rain tinting.
export function buildTerrain({ THREE, sun, HALF, N, STEP, BOTTOM, WATER, center, sample, rand, biomeAt, height, river, riverWidth, grassColors, sandColors, alpineColors, wetlandColors, shoreColor, stoneColor, groundPositions, groundColors, groundBaseColors, terrainGeometry, sidePositions, sideColors, sideGeometry, fall, fallStreak }) {
  let pointer = 0;
  const color = new THREE.Color();
  const lightDirection = sun.position.clone().normalize();
  const triangle = (points) => {
    for (const p of points) {
      const wx = p[0] + center.x;
      const wz = p[2] + center.y;
      const kind = biomeAt(wx, wz);
      const colorIndex = Math.floor(rand(Math.floor(wx * 1.1), Math.floor(wz * 1.1), 5) * (kind === 'desert' ? sandColors.length : kind === 'alpine' ? alpineColors.length : kind === 'wetland' ? wetlandColors.length : grassColors.length));
      if (kind === 'desert') color.copy(sandColors[colorIndex]);
      else if (kind === 'alpine') color.copy(alpineColors[colorIndex]);
      else if (kind === 'wetland') color.copy(wetlandColors[colorIndex]);
      else color.copy(grassColors[colorIndex]);
      if (p[1] < .95) color.lerp(shoreColor, 1 - THREE.MathUtils.smoothstep(p[1], .3, .95));
      if (kind === 'alpine' && p[1] > 5) color.lerp(stoneColor, Math.min(.82, (p[1] - 5) * .1));
      else if (p[1] > 7) color.lerp(stoneColor, Math.min(.65, (p[1] - 7) * .13));
      const variation = .96 + rand(Math.floor(wx * 1.1), Math.floor(wz * 1.1), 4) * .08;
      const epsilon = .35;
      const slopeX = (height(wx + epsilon, wz) - height(wx - epsilon, wz)) / (2 * epsilon);
      const slopeZ = (height(wx, wz + epsilon) - height(wx, wz - epsilon)) / (2 * epsilon);
      const normal = new THREE.Vector3(-slopeX, 1, -slopeZ).normalize();
      color.multiplyScalar(variation * (.76 + Math.max(0, normal.dot(lightDirection)) * .24));
      groundPositions[pointer] = p[0]; groundColors[pointer] = color.r; groundBaseColors[pointer++] = color.r;
      groundPositions[pointer] = p[1]; groundColors[pointer] = color.g; groundBaseColors[pointer++] = color.g;
      groundPositions[pointer] = p[2]; groundColors[pointer] = color.b; groundBaseColors[pointer++] = color.b;
    }
  };
  const heights = new Float32Array((N + 1) * (N + 1));
  for (let z = 0; z <= N; z++) for (let x = 0; x <= N; x++) heights[z * (N + 1) + x] = height(x * STEP - HALF + center.x, z * STEP - HALF + center.y);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const xx = x * STEP - HALF, zz = z * STEP - HALF;
    const a = [xx, heights[z * (N + 1) + x], zz];
    const b = [xx, heights[(z + 1) * (N + 1) + x], zz + STEP];
    const c = [xx + STEP, heights[z * (N + 1) + x + 1], zz];
    const d = [xx + STEP, heights[(z + 1) * (N + 1) + x + 1], zz + STEP];
    triangle([a, b, c]);
    triangle([c, b, d]);
  }
  terrainGeometry.attributes.position.needsUpdate = true;
  terrainGeometry.attributes.color.needsUpdate = true;
  terrainGeometry.computeVertexNormals();
  terrainGeometry.computeBoundingSphere();

  let sidePointer = 0;
  const strata = [new THREE.Color(0x938366), new THREE.Color(0xa08b70), new THREE.Color(0x7c7060)];
  for (let edge = 0; edge < 4; edge++) for (let i = 0; i < N; i++) {
    const a = -HALF + i * STEP, b = a + STEP;
    const x1 = edge < 2 ? a : (edge === 2 ? -HALF : HALF);
    const x2 = edge < 2 ? b : x1;
    const z1 = edge < 2 ? (edge === 0 ? -HALF : HALF) : a;
    const z2 = edge < 2 ? z1 : b;
    const h1 = height(x1 + center.x, z1 + center.y), h2 = height(x2 + center.x, z2 + center.y);
    const wiggle1 = sample(x1 + center.x, z1 + center.y, .12) * .4;
    const wiggle2 = sample(x2 + center.x, z2 + center.y, .12) * .4;
    const levels1 = [h1, -1.3 + wiggle1, -3.7 + wiggle1, BOTTOM];
    const levels2 = [h2, -1.3 + wiggle2, -3.7 + wiggle2, BOTTOM];
    for (let layer = 0; layer < 3; layer++) {
      color.copy(strata[layer]).multiplyScalar(.94 + rand(i + Math.floor(center.x), edge + Math.floor(center.y), layer) * .12);
      const vertices = [[x1, levels1[layer], z1], [x1, levels1[layer + 1], z1], [x2, levels2[layer], z2], [x2, levels2[layer], z2], [x1, levels1[layer + 1], z1], [x2, levels2[layer + 1], z2]];
      for (const v of vertices) {
        sidePositions[sidePointer] = v[0]; sideColors[sidePointer++] = color.r;
        sidePositions[sidePointer] = v[1]; sideColors[sidePointer++] = color.g;
        sidePositions[sidePointer] = v[2]; sideColors[sidePointer++] = color.b;
      }
    }
  }
  sideGeometry.setDrawRange(0, sidePointer / 3);
  sideGeometry.attributes.position.needsUpdate = true;
  sideGeometry.attributes.color.needsUpdate = true;
  sideGeometry.computeVertexNormals();
  sideGeometry.computeBoundingSphere();
  const riverExit = river(center.y + HALF) - center.x;
  fall.visible = Math.abs(riverExit) < HALF - 2;
  fall.position.set(riverExit, (WATER + BOTTOM) / 2, HALF + .025);
  fall.scale.set(riverWidth(center.y + HALF) * 1.65, WATER - BOTTOM, 1);
  fallStreak.visible = fall.visible;
  fallStreak.position.set(riverExit + .35, -3.2, HALF + .045);
}
