import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

/** Cache for generated canvas textures to avoid regenerating identical textures. */
const textureCache = new Map<string, CanvasTexture>();

function createBaseCanvas(width = 256, height = 256): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
  return { canvas, ctx };
}

function finalizeTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Realistic Procedural Textures for Characters, Buildings, Weapons, and Terrain.
 * Generated purely in-memory via HTML5 Canvas for zero network overhead and maximum crispness.
 */
export class ProceduralTextures {
  /** Realistic skin texture with warm tones, natural shading, and subtle subsurface tones. */
  static getSkinTexture(tone: 'fair' | 'tan' | 'warm' | 'dark' = 'warm'): CanvasTexture {
    const key = `skin_${tone}`;
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(128, 128);
    const baseColors = {
      fair: ['#fce2c8', '#f8d2b2', '#eec2a0'],
      warm: ['#f4be8c', '#e6ab75', '#d6975d'],
      tan: ['#d99c62', '#c78a4f', '#b0753b'],
      dark: ['#8c5a32', '#764923', '#5e3717'],
    }[tone];

    // Base gradient
    const grad = ctx.createLinearGradient(0, 0, 128, 128);
    grad.addColorStop(0, baseColors[0]);
    grad.addColorStop(0.5, baseColors[1]);
    grad.addColorStop(1, baseColors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    // Subtle micro-pore and subsurface blush noise
    const imgData = ctx.getImageData(0, 0, 128, 128);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 12;
      data[i] = Math.min(255, Math.max(0, data[i] + noise + 2)); // warmer red
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.8));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.6));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = finalizeTexture(canvas, 1, 1);
    textureCache.set(key, tex);
    return tex;
  }

  /** Realistic steel and iron armor texture with brushed grain, edge highlights, and rivet accents. */
  static getMetalTexture(variant: 'steel' | 'iron' | 'dark' = 'steel'): CanvasTexture {
    const key = `metal_${variant}`;
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(256, 256);
    const baseColor = variant === 'steel' ? '#95a5a6' : variant === 'iron' ? '#7f8c8d' : '#3d444a';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    // Brushed metal streaks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 60; i++) {
      const y = Math.random() * 256;
      const h = Math.random() * 3 + 1;
      ctx.fillRect(0, y, 256, h);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
    for (let i = 0; i < 60; i++) {
      const y = Math.random() * 256;
      const h = Math.random() * 2 + 1;
      ctx.fillRect(0, y, 256, h);
    }

    // Plate border bevels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 250, 250);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 244, 244);

    // Corner rivets on larger plates
    const rivets = [[24, 24], [232, 24], [24, 232], [232, 232], [128, 24], [128, 232]];
    for (const [rx, ry] of rivets) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.arc(rx + 1, ry + 1, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = variant === 'dark' ? '#5a626a' : '#dcdde1';
      ctx.beginPath();
      ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx - 1, ry - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = finalizeTexture(canvas, 2, 2);
    textureCache.set(key, tex);
    return tex;
  }

  /** Burnished royal gold metal texture with rich highlights and engraving. */
  static getGoldTexture(): CanvasTexture {
    const key = 'metal_gold';
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(256, 256);
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#f9ca24');
    grad.addColorStop(0.3, '#f0932b');
    grad.addColorStop(0.7, '#f6e58d');
    grad.addColorStop(1, '#b78103');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Decorative filigree borders
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 244, 244);

    ctx.strokeStyle = 'rgba(110, 68, 0, 0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 232, 232);

    // Center emblem accent
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(128, 128, 36, 0, Math.PI * 2);
    ctx.fill();

    const tex = finalizeTexture(canvas, 2, 2);
    textureCache.set(key, tex);
    return tex;
  }

  /** Realistic leather texture with organic grain and perimeter stitching. */
  static getLeatherTexture(color: 'brown' | 'dark' | 'tan' = 'brown'): CanvasTexture {
    const key = `leather_${color}`;
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(256, 256);
    const baseColor = color === 'brown' ? '#6e3c1b' : color === 'dark' ? '#3d2010' : '#a0683a';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    // Organic leather pores & grain
    const imgData = ctx.getImageData(0, 0, 256, 256);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 30;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n * 0.7));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n * 0.5));
    }
    ctx.putImageData(imgData, 0, 0);

    // Stitching pattern
    ctx.strokeStyle = '#e6c896';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(8, 8, 240, 240);
    ctx.setLineDash([]);

    const tex = finalizeTexture(canvas, 2, 2);
    textureCache.set(key, tex);
    return tex;
  }

  /** Realistic woven fabric cloth texture for tunics, robes, cloaks, and flags. */
  static getFabricTexture(colorHex = '#3a7bd5'): CanvasTexture {
    const key = `fabric_${colorHex}`;
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(128, 128);
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 128, 128);

    // Cross-weave thread pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    for (let x = 0; x < 128; x += 4) {
      ctx.fillRect(x, 0, 1.5, 128);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let y = 0; y < 128; y += 4) {
      ctx.fillRect(0, y, 128, 1.5);
    }

    const tex = finalizeTexture(canvas, 3, 3);
    textureCache.set(key, tex);
    return tex;
  }

  /** Realistic wood plank texture with timber grain, knots, and plank joints. */
  static getWoodTexture(variant: 'plank' | 'dark' | 'beam' = 'plank'): CanvasTexture {
    const key = `wood_${variant}`;
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(256, 256);
    const baseColor = variant === 'plank' ? '#8a5a36' : variant === 'dark' ? '#54341b' : '#a26d42';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    // Wood fiber lines
    for (let i = 0; i < 90; i++) {
      const y = Math.random() * 256;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, y, 256, Math.random() * 3 + 1);
    }

    // Plank seams (horizontal planks)
    const plankHeight = 64;
    for (let y = plankHeight; y < 256; y += plankHeight) {
      // Dark groove
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, y - 2, 256, 3);
      // Highlight bottom edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(0, y + 1, 256, 1.5);

      // Plank nail rivets
      for (const nx of [32, 128, 224]) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.beginPath();
        ctx.arc(nx, y - 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8395a7';
        ctx.beginPath();
        ctx.arc(nx - 0.5, y - 8.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = finalizeTexture(canvas, 2, 2);
    textureCache.set(key, tex);
    return tex;
  }

  /** Realistic stone brick masonry texture with mortar joints and chiseled stone variation. */
  static getStoneBrickTexture(variant: 'castle' | 'dark' | 'obsidian' = 'castle'): CanvasTexture {
    const key = `stone_brick_${variant}`;
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(256, 256);
    const mortarColor = variant === 'castle' ? '#2f3542' : variant === 'dark' ? '#1e272e' : '#111116';
    ctx.fillStyle = mortarColor;
    ctx.fillRect(0, 0, 256, 256);

    const stoneColors = variant === 'castle'
      ? ['#747d8c', '#8a95a5', '#606a78', '#6c7787']
      : variant === 'dark'
      ? ['#4b5563', '#374151', '#333b47', '#424c5a']
      : ['#23272e', '#1f2329', '#2a2f38', '#1a1d23'];

    const rowH = 32;
    const brickW = 64;

    for (let row = 0; row < 256 / rowH; row++) {
      const y = row * rowH;
      const offset = (row % 2) * (brickW / 2);
      for (let col = -1; col < 256 / brickW + 1; col++) {
        const x = col * brickW + offset;
        const color = stoneColors[(row * 3 + col + 10) % stoneColors.length];

        // Brick body
        ctx.fillStyle = color;
        ctx.fillRect(x + 2, y + 2, brickW - 4, rowH - 4);

        // Brick top/left highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(x + 2, y + 2, brickW - 4, 2);
        ctx.fillRect(x + 2, y + 2, 2, rowH - 4);

        // Brick bottom/right shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(x + 2, y + rowH - 4, brickW - 4, 2);
        ctx.fillRect(x + brickW - 4, y + 2, 2, rowH - 4);
      }
    }

    const tex = finalizeTexture(canvas, 2, 2);
    textureCache.set(key, tex);
    return tex;
  }

  /** Realistic cobblestone ground texture for village walkways and plaza areas. */
  static getCobblestoneTexture(): CanvasTexture {
    const key = 'cobblestone';
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(256, 256);
    // Dark packed dirt mortar
    ctx.fillStyle = '#3a271d';
    ctx.fillRect(0, 0, 256, 256);

    const stoneColors = ['#838c94', '#6c757d', '#9aa2a9', '#5c646c', '#79828a'];

    // Draw rounded irregular stones
    const gridSize = 32;
    for (let y = 8; y < 256; y += gridSize) {
      for (let x = 8; x < 256; x += gridSize) {
        const ox = x + (Math.sin(y * 3) * 6);
        const oy = y + (Math.cos(x * 3) * 6);
        const rx = 11 + Math.sin(x + y) * 3;
        const ry = 9 + Math.cos(x * 2) * 2;
        const c = stoneColors[Math.abs(Math.floor(x * 7 + y * 13)) % stoneColors.length];

        // Stone shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(ox + 2, oy + 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone surface
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(ox, oy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        // Top specular highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.ellipse(ox - 3, oy - 2, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = finalizeTexture(canvas, 3, 3);
    textureCache.set(key, tex);
    return tex;
  }

  /** Realistic natural grass texture with blade patterns, clods, and organic depth. */
  static getGrassTexture(tintHex = '#3d7e35'): CanvasTexture {
    const key = `grass_${tintHex}`;
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(256, 256);
    ctx.fillStyle = tintHex;
    ctx.fillRect(0, 0, 256, 256);

    // Natural multi-shade blades
    const shades = [
      'rgba(60, 140, 50, 0.4)',
      'rgba(85, 175, 70, 0.35)',
      'rgba(35, 95, 30, 0.45)',
      'rgba(120, 200, 80, 0.25)',
      'rgba(45, 60, 25, 0.3)',
    ];

    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const len = Math.random() * 12 + 6;
      const angle = (Math.random() - 0.5) * 0.8 - Math.PI / 2;
      const shade = shades[Math.floor(Math.random() * shades.length)];

      ctx.strokeStyle = shade;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    // Occasional tiny wild pebbles / clods
    ctx.fillStyle = 'rgba(100, 80, 60, 0.35)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 2.5 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = finalizeTexture(canvas, 16, 16);
    textureCache.set(key, tex);
    return tex;
  }

  /** Realistic village plot ground texture (packed soil and trampled grass). */
  static getVillagePlotTexture(tintHex = '#6e8b4e'): CanvasTexture {
    const key = `plot_${tintHex}`;
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(256, 256);
    ctx.fillStyle = tintHex;
    ctx.fillRect(0, 0, 256, 256);

    // Dirt patches & organic soil speckles
    const imgData = ctx.getImageData(0, 0, 256, 256);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 26;
      data[i] = Math.min(255, Math.max(0, data[i] + n + 4)); // earthy warm tint
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n * 0.9));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n * 0.6));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = finalizeTexture(canvas, 6, 6);
    textureCache.set(key, tex);
    return tex;
  }

  /** Realistic overlapping roof tiles (clay terracotta, castle blue slate, imperial crimson, thatch). */
  static getRoofTileTexture(variant: 'terracotta' | 'slate' | 'crimson' | 'thatch' = 'terracotta'): CanvasTexture {
    const key = `roof_${variant}`;
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(256, 256);
    const colors = {
      terracotta: { bg: '#962d1c', tile: '#c0392b', hi: '#e74c3c', sh: '#5c170d' },
      slate: { bg: '#1c2833', tile: '#2471a3', hi: '#5499c7', sh: '#154360' },
      crimson: { bg: '#641e16', tile: '#922b21', hi: '#c0392b', sh: '#44140e' },
      thatch: { bg: '#8d6e3f', tile: '#c99b4a', hi: '#e0b86a', sh: '#5d401e' },
    }[variant];

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, 256, 256);

    const rowH = 24;
    const tileW = 32;

    for (let y = 0; y < 256; y += rowH) {
      const isShifted = Math.floor(y / rowH) % 2 === 1;
      const xOffset = isShifted ? tileW / 2 : 0;

      for (let x = -tileW; x < 256 + tileW; x += tileW) {
        const curX = x + xOffset;

        // Tile shadow
        ctx.fillStyle = colors.sh;
        ctx.beginPath();
        ctx.roundRect(curX + 2, y + 2, tileW - 3, rowH + 6, [0, 0, 8, 8]);
        ctx.fill();

        // Tile body
        ctx.fillStyle = colors.tile;
        ctx.beginPath();
        ctx.roundRect(curX, y, tileW - 4, rowH + 4, [0, 0, 7, 7]);
        ctx.fill();

        // Top highlight
        ctx.fillStyle = colors.hi;
        ctx.fillRect(curX + 2, y + 1, tileW - 8, 3);

        // Vertical curve shade
        const grad = ctx.createLinearGradient(curX, y, curX + tileW - 4, y);
        grad.addColorStop(0, 'rgba(0,0,0,0.2)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
        grad.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = grad;
        ctx.fillRect(curX, y, tileW - 4, rowH + 4);
      }
    }

    const tex = finalizeTexture(canvas, 4, 4);
    textureCache.set(key, tex);
    return tex;
  }

  /** Rich glistening ore texture with metallic veins and crystal facets. */
  static getOreTexture(type: 'gold' | 'iron' | 'gem' = 'gold'): CanvasTexture {
    const key = `ore_${type}`;
    if (textureCache.has(key)) return textureCache.get(key)!;

    const { canvas, ctx } = createBaseCanvas(128, 128);
    // Dark rock matrix
    ctx.fillStyle = '#2c3437';
    ctx.fillRect(0, 0, 128, 128);

    const veinColor = type === 'gold' ? '#f1c40f' : type === 'iron' ? '#bdc3c7' : '#00d2d3';
    const hiColor = type === 'gold' ? '#fff5cc' : type === 'iron' ? '#ffffff' : '#e0ffff';

    for (let i = 0; i < 35; i++) {
      const cx = Math.random() * 128;
      const cy = Math.random() * 128;
      const r = Math.random() * 9 + 4;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(cx + 2, cy + 2, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = veinColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = hiColor;
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = finalizeTexture(canvas, 2, 2);
    textureCache.set(key, tex);
    return tex;
  }
}

