'use strict';

// ========【圖片處理 Worker】 設定 - 解碼 / 縮放 / 編碼全部離開主執行緒 ========
async function optimizeImage(blob, options = {}) {
  if (!(blob instanceof Blob) || !String(blob.type || '').startsWith('image/')) {
    throw new Error('請選擇圖片檔案。');
  }

  if (
    typeof createImageBitmap !== 'function' ||
    typeof OffscreenCanvas !== 'function'
  ) {
    const error = new Error('目前瀏覽器不支援背景圖片處理。');
    error.code = 'WORKER_IMAGE_PIPELINE_UNSUPPORTED';
    throw error;
  }

  const maxDimension =
    Number.isFinite(Number(options.maxDimension)) &&
    Number(options.maxDimension) > 0
      ? Number(options.maxDimension)
      : null;

  const keepOriginal = !!options.keepOriginal;
  const webpQuality =
    Number.isFinite(Number(options.webpQuality))
      ? Number(options.webpQuality)
      : 0.86;
  const jpegQuality =
    Number.isFinite(Number(options.jpegQuality))
      ? Number(options.jpegQuality)
      : 0.84;
  const preserveAlpha =
    options.preserveAlpha === true ||
    (
      options.preserveAlpha !== false &&
      /image\/(png|webp)/i.test(blob.type || '')
    );

  let bitmap = null;

  try {
    try {
      bitmap = await createImageBitmap(blob, {
        imageOrientation:'from-image'
      });
    } catch (_) {
      bitmap = await createImageBitmap(blob);
    }

    const sourceWidth = bitmap.width || 0;
    const sourceHeight = bitmap.height || 0;

    if (
      !sourceWidth ||
      !sourceHeight ||
      keepOriginal ||
      !maxDimension
    ) {
      return {
        blob,
        width:sourceWidth,
        height:sourceHeight,
        byteSize:blob.size,
        usedOriginal:true,
        wasResized:false
      };
    }

    const ratio = Math.min(
      maxDimension / sourceWidth,
      maxDimension / sourceHeight,
      1
    );

    const width =
      Math.max(1, Math.round(sourceWidth * ratio));
    const height =
      Math.max(1, Math.round(sourceHeight * ratio));
    const wasResized = ratio < 1;

    const canvas =
      new OffscreenCanvas(width, height);

    const ctx =
      canvas.getContext('2d', {
        alpha:preserveAlpha,
        desynchronized:true
      });

    if (!ctx) {
      throw new Error('目前瀏覽器無法建立背景圖片處理畫布。');
    }

    if (!preserveAlpha) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    let candidate = null;

    try {
      candidate = await canvas.convertToBlob({
        type:'image/webp',
        quality:webpQuality
      });
    } catch (_) {}

    if (
      !candidate ||
      candidate.type !== 'image/webp'
    ) {
      candidate = await canvas.convertToBlob({
        type:
          preserveAlpha
            ? 'image/png'
            : 'image/jpeg',
        quality:
          preserveAlpha
            ? undefined
            : jpegQuality
      });
    }

    if (!candidate) {
      return {
        blob,
        width:sourceWidth,
        height:sourceHeight,
        byteSize:blob.size,
        usedOriginal:true,
        wasResized:false
      };
    }

    if (
      !wasResized &&
      blob.size <= candidate.size
    ) {
      return {
        blob,
        width:sourceWidth,
        height:sourceHeight,
        byteSize:blob.size,
        usedOriginal:true,
        wasResized:false
      };
    }

    return {
      blob:candidate,
      width,
      height,
      byteSize:candidate.size,
      usedOriginal:false,
      wasResized
    };
  } finally {
    try { bitmap?.close?.(); } catch (_) {}
  }
}

self.addEventListener('message', async event => {
  const message = event.data || {};

  if (
    message.type !== 'optimize-image' ||
    !message.jobId
  ) {
    return;
  }

  try {
    const result =
      await optimizeImage(
        message.blob,
        message.options || {}
      );

    self.postMessage({
      type:'optimize-image-result',
      jobId:message.jobId,
      ok:true,
      result
    });
  } catch (error) {
    self.postMessage({
      type:'optimize-image-result',
      jobId:message.jobId,
      ok:false,
      error:{
        message:
          error?.message ||
          '圖片處理失敗。',
        code:
          error?.code ||
          ''
      }
    });
  }
});
