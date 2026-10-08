(function (global) {
  'use strict';

  // ========【EA 人物縮圖格式】 設定 - 只供遊戲 ZIP importer 使用，不參與一般圖片上傳 ========
  const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const MAX_PIXELS = 16 * 1024 * 1024;
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let value = n;
    for (let bit = 0; bit < 8; bit++) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    crcTable[n] = value >>> 0;
  }

  class ThumDecodeError extends Error {
    constructor(stage, reason) {
      super(`${stage}: ${reason}`);
      this.name = 'ThumDecodeError';
      this.code = 'EA_THUM_DECODE_FAILED';
      this.stage = stage;
    }
  }

  function fail(stage, reason) { throw new ThumDecodeError(stage, reason); }
  function equalAt(bytes, offset, expected) {
    return offset + expected.length <= bytes.length && expected.every((value, i) => bytes[offset + i] === value);
  }
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const value of bytes) crc = crcTable[(crc ^ value) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function inspectAlphaPng(bytes) {
    if (!equalAt(bytes, 0, PNG_SIGNATURE)) fail('ALPHA_PNG_SIGNATURE', 'PNG signature 無效');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let cursor = 8, dimensions = null, sawIdat = false, idatClosed = false;
    while (cursor < bytes.length) {
      if (cursor + 12 > bytes.length) fail('ALPHA_PNG_CHUNK', 'chunk header 截斷');
      const length = view.getUint32(cursor, false), end = cursor + 12 + length;
      if (end > bytes.length) fail('ALPHA_PNG_CHUNK', 'chunk 超出 alpha container');
      const kind = String.fromCharCode(...bytes.subarray(cursor + 4, cursor + 8));
      if (crc32(bytes.subarray(cursor + 4, end - 4)) !== view.getUint32(end - 4, false)) {
        fail('ALPHA_PNG_CRC', `${kind} CRC 不符`);
      }
      if (!dimensions && kind !== 'IHDR') fail('ALPHA_PNG_IHDR', 'IHDR 不是第一個 chunk');
      if (kind === 'IHDR') {
        if (dimensions || length !== 13) fail('ALPHA_PNG_IHDR', 'IHDR 重複或長度無效');
        const width = view.getUint32(cursor + 8, false), height = view.getUint32(cursor + 12, false);
        const depth = bytes[cursor + 16], color = bytes[cursor + 17];
        if (!width || !height || width * height > MAX_PIXELS) fail('ALPHA_DIMENSIONS', '尺寸無效或超出安全像素上限');
        if (depth !== 8 || ![0, 2, 4, 6].includes(color) || bytes[cursor + 18] || bytes[cursor + 19] || bytes[cursor + 20]) {
          fail('ALPHA_PNG_LAYOUT', '只接受已確認的 8-bit non-interlaced PNG layout');
        }
        dimensions = { width, height, colorType:color };
      } else if (kind === 'IDAT') {
        if (idatClosed) fail('ALPHA_PNG_IDAT', 'IDAT 不連續');
        sawIdat = true;
      } else if (kind === 'IEND') {
        if (length || !sawIdat || end !== bytes.length) fail('ALPHA_PNG_IEND', 'IEND 無效或有額外 bytes');
        return dimensions;
      } else {
        if (sawIdat) idatClosed = true;
        if (kind === 'tRNS' || !(bytes[cursor + 4] & 32)) fail('ALPHA_PNG_LAYOUT', `不支援 ${kind}`);
      }
      cursor = end;
    }
    fail('ALPHA_PNG_IEND', '沒有完整 IEND');
  }

  function inspectJpeg(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let cursor = 2, dimensions = null, entropy = false, sawScan = false;
    while (cursor < bytes.length) {
      if (entropy) {
        if (bytes[cursor] !== 255) { cursor++; continue; }
        const start = cursor;
        while (cursor < bytes.length && bytes[cursor] === 255) cursor++;
        if (cursor === bytes.length) fail('JPEG_ENTROPY', 'marker 截斷');
        if (bytes[cursor] === 0 || (bytes[cursor] >= 0xd0 && bytes[cursor] <= 0xd7)) { cursor++; continue; }
        cursor = start; entropy = false;
      }
      if (bytes[cursor] !== 255) fail('JPEG_MARKER', `offset ${cursor} 不是 marker`);
      while (cursor < bytes.length && bytes[cursor] === 255) cursor++;
      if (cursor === bytes.length) fail('JPEG_MARKER', 'marker 截斷');
      const marker = bytes[cursor++];
      if (marker === 0xd9) {
        if (!dimensions || !sawScan || cursor !== bytes.length) fail('JPEG_EOI', '缺少 SOF/SOS 或 EOI 後有額外 bytes');
        return dimensions;
      }
      if (marker === 0 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) fail('JPEG_MARKER', '無效 standalone marker');
      if (cursor + 2 > bytes.length) fail('JPEG_SEGMENT', 'segment length 截斷');
      const length = view.getUint16(cursor, false), end = cursor + length;
      if (length < 2 || end > bytes.length) fail('JPEG_SEGMENT', 'segment 範圍無效');
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        if (dimensions || length < 8 || bytes[cursor + 2] !== 8 || length !== 8 + 3 * bytes[cursor + 7]) fail('JPEG_SOF', 'SOF layout 無效');
        const height = view.getUint16(cursor + 3, false), width = view.getUint16(cursor + 5, false);
        if (!width || !height || width * height > MAX_PIXELS) fail('JPEG_DIMENSIONS', '尺寸無效或超出安全像素上限');
        dimensions = { width, height };
      }
      if (marker === 0xda) { sawScan = true; entropy = true; }
      cursor = end;
    }
    fail('JPEG_EOI', 'JPEG 截斷，沒有 EOI');
  }

  function inspect(bytes) {
    if (!(bytes instanceof Uint8Array)) throw new TypeError('THUM input 必須為 Uint8Array');
    // 普通圖片不走 pixel decoder；ALFA tag 必須位於已確認的 exact offset。
    if (!equalAt(bytes, 24, [65, 76, 70, 65])) return null;
    if (!equalAt(bytes, 0, [255, 216]) || !equalAt(bytes, 2, [255, 224, 0, 16]) ||
        !equalAt(bytes, 6, [74, 70, 73, 70, 0]) || !equalAt(bytes, 20, [255, 224])) {
      fail('THUM_JFIF_LAYOUT', 'ALFA 存在，但不是已確認的 JFIF／第二 APP0 layout');
    }
    if (bytes.length < 32) fail('THUM_ALFA_LENGTH', 'alpha length 截斷');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const length = view.getUint32(28, false), end = 32 + length;
    if (view.getUint16(22, false) !== length + 10 || end >= bytes.length) fail('THUM_ALFA_LENGTH', 'APP0／alpha length 不符或超出 resource');
    const alphaBytes = bytes.subarray(32, end);
    const alpha = inspectAlphaPng(alphaBytes), jpeg = inspectJpeg(bytes);
    if (alpha.width !== jpeg.width || alpha.height !== jpeg.height) fail('THUM_DIMENSIONS', 'JPEG／alpha PNG 尺寸不一致');
    return { width:jpeg.width, height:jpeg.height, alphaBytes, alphaEnd:end, alphaColorType:alpha.colorType };
  }

  async function decodePixels(blob, width, height, stage) {
    let image = null, canvas = null, url = null;
    try {
      if (typeof global.createImageBitmap === 'function') {
        image = await global.createImageBitmap(blob, { imageOrientation:'none', colorSpaceConversion:'none', premultiplyAlpha:'none' });
      } else {
        url = global.URL.createObjectURL(blob);
        image = await new Promise((resolve, reject) => {
          const element = new global.Image();
          element.onload = () => resolve(element);
          element.onerror = () => reject(new Error('browser image decode 失敗'));
          element.src = url;
        });
      }
      const actualWidth = image.naturalWidth || image.width, actualHeight = image.naturalHeight || image.height;
      if (actualWidth !== width || actualHeight !== height) fail(stage, 'browser decoded dimensions 與 header 不符');
      canvas = typeof global.OffscreenCanvas === 'function' ? new global.OffscreenCanvas(width, height) : global.document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently:true, colorSpace:'srgb' });
      if (!ctx) fail(stage, '無法取得 native decoded pixels');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, width, height).data;
    } catch (error) {
      if (error?.code === 'EA_THUM_DECODE_FAILED') throw error;
      fail(stage, error?.message || String(error));
    } finally {
      image?.close?.();
      if (url) global.URL.revokeObjectURL(url);
      if (canvas) canvas.width = canvas.height = 1;
    }
  }

  function pngChunk(kind, data) {
    const bytes = new Uint8Array(data.length + 12), view = new DataView(bytes.buffer);
    view.setUint32(0, data.length, false);
    bytes.set(Array.from(kind, letter => letter.charCodeAt(0)), 4); bytes.set(data, 8);
    view.setUint32(bytes.length - 4, crc32(bytes.subarray(4, bytes.length - 4)), false);
    return bytes;
  }

  async function encodeStraightRgbaPng(rgba, width, height) {
    if (typeof global.CompressionStream !== 'function') fail('PNG_ENCODE_UNSUPPORTED', '缺少 native CompressionStream；不以 Canvas 改寫 RGB');
    const stride = width * 4, rows = new Uint8Array(height * (stride + 1));
    for (let y = 0; y < height; y++) rows.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
    // 只寫 PNG container；DEFLATE 交給瀏覽器。禁止 RGBA 經 Canvas round-trip 的 premultiplied 損失。
    const compressed = new Uint8Array(await new global.Response(new global.Blob([rows]).stream().pipeThrough(new global.CompressionStream('deflate'))).arrayBuffer());
    const ihdr = new Uint8Array(13), view = new DataView(ihdr.buffer);
    view.setUint32(0, width, false); view.setUint32(4, height, false); ihdr[8] = 8; ihdr[9] = 6;
    return new global.Blob([PNG_SIGNATURE, pngChunk('IHDR', ihdr), pngChunk('IDAT', compressed), pngChunk('IEND', new Uint8Array())], { type:'image/png' });
  }

  async function decode(bytes) {
    const metadata = inspect(bytes);
    if (!metadata) return null;
    const { width, height, alphaEnd, alphaBytes } = metadata;
    // 精確移除第二 APP0，只供 native JPEG decode；原 input 與 JPEG coding bytes 完全不變。
    const colorBlob = new global.Blob([bytes.subarray(0, 20), bytes.subarray(alphaEnd)], { type:'image/jpeg' });
    const rgb = await decodePixels(colorBlob, width, height, 'JPEG_DECODE');
    const alpha = await decodePixels(new global.Blob([alphaBytes], { type:'image/png' }), width, height, 'ALPHA_DECODE');
    let transparent = 0, semitransparent = 0, opaque = 0;
    for (let i = 0; i < rgb.length; i += 4) {
      // alpha container 必須不透明，否則 Canvas 無法保證原 red channel 未被 premultiply 量化。
      if (alpha[i + 3] !== 255) fail('ALPHA_CONTAINER_TRANSPARENCY', 'alpha PNG 自身含透明度，尚未驗證 native red-channel 保真');
      const value = alpha[i]; rgb[i + 3] = value;
      if (value === 0) transparent++; else if (value === 255) opaque++; else semitransparent++;
    }
    let blob;
    try { blob = await encodeStraightRgbaPng(rgb, width, height); }
    catch (error) {
      if (error?.code === 'EA_THUM_DECODE_FAILED') throw error;
      fail('PNG_ENCODE', error?.message || String(error));
    }
    return { blob, width, height, format:'EA_ALFA_THUM', transparent, semitransparent, opaque };
  }

  global.L1nGThumDecoder = Object.freeze({ inspect, decode, ThumDecodeError });
})(typeof window !== 'undefined' ? window : globalThis);
