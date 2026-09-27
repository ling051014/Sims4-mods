(function (global) {
  'use strict';

  // ========【圖片資產儲存】 設定 - Blob 為唯一圖片本體；SHA-256 作為資產識別 ========
  const DB_NAME = 'sims4_images_db';
  const DB_VERSION = 2;
  const STORE_NAME = 'assets';
  const LEGACY_STORE_NAME = 'images';
  const ASSET_PREFIX = 'asset_';
  const URL_CACHE_LIMIT = 256;

  let dbPromise = null;
  const objectUrlCache = new Map();
  const pendingUrlLoads = new Map();

  function isAssetId(value) {
    return typeof value === 'string' && /^asset_[0-9a-f]{64}$/i.test(value);
  }

  function openDb() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = event => {
        const db = event.target.result;

        // 網站尚未正式發布：v2 直接淘汰舊 dataURL 圖片庫，不保留雙格式相容層。
        if (db.objectStoreNames.contains(LEGACY_STORE_NAME)) {
          db.deleteObjectStore(LEGACY_STORE_NAME);
        }

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = event => resolve(event.target.result);
      request.onerror = () => reject(request.error || new Error('圖片資產資料庫開啟失敗。'));
      request.onblocked = () => reject(new Error('圖片資產資料庫正在被其他分頁使用，無法升級。'));
    });

    dbPromise.catch(() => {
      dbPromise = null;
    });

    return dbPromise;
  }

  async function getRecord(id) {
    if (!isAssetId(id)) return null;
    const db = await openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('讀取圖片資產失敗。'));
    });
  }

  async function hasAsset(id) {
    return !!(await getRecord(id));
  }

  async function putRecord(record) {
    const db = await openDb();

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('儲存圖片資產失敗。'));
      tx.onabort = () => reject(tx.error || new Error('儲存圖片資產已取消。'));
    });
  }

  function revokeCachedUrl(id) {
    const cached = objectUrlCache.get(id);
    if (!cached) return;
    URL.revokeObjectURL(cached);
    objectUrlCache.delete(id);
  }

  function rememberUrl(id, blob) {
    revokeCachedUrl(id);
    const url = URL.createObjectURL(blob);
    objectUrlCache.set(id, url);

    while (objectUrlCache.size > URL_CACHE_LIMIT) {
      const oldest = objectUrlCache.entries().next().value;
      if (!oldest) break;
      URL.revokeObjectURL(oldest[1]);
      objectUrlCache.delete(oldest[0]);
    }

    return url;
  }

  function peekUrl(id) {
    const url = objectUrlCache.get(id);
    if (!url) return '';

    objectUrlCache.delete(id);
    objectUrlCache.set(id, url);
    return url;
  }

  async function getUrl(id) {
    if (!isAssetId(id)) return '';

    const cached = peekUrl(id);
    if (cached) return cached;

    if (pendingUrlLoads.has(id)) {
      return pendingUrlLoads.get(id);
    }

    const pending = (async () => {
      const record = await getRecord(id);
      if (!record || !(record.blob instanceof Blob)) return '';
      return rememberUrl(id, record.blob);
    })();

    pendingUrlLoads.set(id, pending);

    try {
      return await pending;
    } finally {
      pendingUrlLoads.delete(id);
    }
  }

  async function preloadUrls(ids, { concurrency = 12 } = {}) {
    const queue = [...new Set(ids || [])].filter(isAssetId);
    if (!queue.length) return { requested:0, loaded:0 };

    const workerCount = Math.max(1, Math.min(Number(concurrency) || 1, queue.length));
    let cursor = 0;
    let loaded = 0;

    const worker = async () => {
      while (cursor < queue.length) {
        const index = cursor++;
        const id = queue[index];

        try {
          const url = await getUrl(id);
          if (url) loaded++;
        } catch (_) {}
      }
    };

    await Promise.all(
      Array.from({ length:workerCount }, () => worker())
    );

    return {
      requested:queue.length,
      loaded
    };
  }

  async function deleteAsset(id) {
    if (!isAssetId(id)) return false;

    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('刪除圖片資產失敗。'));
    });

    revokeCachedUrl(id);
    return true;
  }

  async function clearAll() {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('清空圖片資產失敗。'));
    });

    for (const id of [...objectUrlCache.keys()]) {
      revokeCachedUrl(id);
    }
  }

  function bytesToHex(bytes) {
    return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  async function hashBlob(blob) {
    if (!(blob instanceof Blob)) throw new TypeError('hashBlob 需要 Blob。');
    if (!global.crypto || !global.crypto.subtle) {
      throw new Error('目前瀏覽器不支援 SHA-256 圖片去重。');
    }

    const digest = await global.crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return bytesToHex(new Uint8Array(digest));
  }

  function imageElementFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('圖片解碼失敗。'));
      };

      image.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), type, quality);
    });
  }

  async function optimizeImage(blob, options = {}) {
    if (!(blob instanceof Blob) || !String(blob.type || '').startsWith('image/')) {
      throw new Error('請選擇圖片檔案。');
    }

    const maxDimension =
      Number.isFinite(Number(options.maxDimension)) && Number(options.maxDimension) > 0
        ? Number(options.maxDimension)
        : null;

    const keepOriginal = !!options.keepOriginal;
    const webpQuality = Number.isFinite(Number(options.webpQuality)) ? Number(options.webpQuality) : 0.86;
    const jpegQuality = Number.isFinite(Number(options.jpegQuality)) ? Number(options.jpegQuality) : 0.84;
    const preserveAlpha =
      options.preserveAlpha === true ||
      (options.preserveAlpha !== false && /image\/(png|webp)/i.test(blob.type || ''));

    const image = await imageElementFromBlob(blob);
    const sourceWidth = image.naturalWidth || image.width || 0;
    const sourceHeight = image.naturalHeight || image.height || 0;

    if (!sourceWidth || !sourceHeight || keepOriginal || !maxDimension) {
      return {
        blob,
        width:sourceWidth,
        height:sourceHeight,
        byteSize:blob.size,
        usedOriginal:true,
        wasResized:false
      };
    }

    const ratio = Math.min(maxDimension / sourceWidth, maxDimension / sourceHeight, 1);
    const width = Math.max(1, Math.round(sourceWidth * ratio));
    const height = Math.max(1, Math.round(sourceHeight * ratio));
    const wasResized = ratio < 1;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: preserveAlpha });

    if (!ctx) throw new Error('目前瀏覽器無法建立圖片處理畫布。');

    if (!preserveAlpha) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(image, 0, 0, width, height);

    let candidate = await canvasToBlob(canvas, 'image/webp', webpQuality);

    if (!candidate || candidate.type !== 'image/webp') {
      candidate = preserveAlpha
        ? await canvasToBlob(canvas, 'image/png')
        : await canvasToBlob(canvas, 'image/jpeg', jpegQuality);
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

    if (!wasResized && blob.size <= candidate.size) {
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
  }

  async function importBlob(blob, metadata = {}) {
    if (!(blob instanceof Blob)) throw new TypeError('圖片資產必須以 Blob 儲存。');

    const hash = await hashBlob(blob);
    const id = ASSET_PREFIX + hash;
    const existing = await getRecord(id);

    if (existing) {
      if (!peekUrl(id) && existing.blob instanceof Blob) {
        rememberUrl(id, existing.blob);
      }
      return id;
    }

    let width = Number(metadata.width) || 0;
    let height = Number(metadata.height) || 0;

    if ((!width || !height) && String(blob.type || '').startsWith('image/')) {
      try {
        const image = await imageElementFromBlob(blob);
        width = image.naturalWidth || image.width || 0;
        height = image.naturalHeight || image.height || 0;
      } catch (_) {}
    }

    const record = {
      id,
      hash,
      blob,
      mime:blob.type || metadata.mime || 'application/octet-stream',
      width,
      height,
      byteSize:blob.size,
      createdAt:Date.now()
    };

    await putRecord(record);
    rememberUrl(id, blob);
    return id;
  }

  async function getStats() {
    const db = await openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).openCursor();
      let count = 0;
      let byteSize = 0;

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        const value = cursor.value || {};
        count++;
        byteSize += Number(value.byteSize) || (value.blob instanceof Blob ? value.blob.size : 0);
        cursor.continue();
      };

      request.onerror = () => reject(request.error || new Error('讀取圖片儲存統計失敗。'));
      tx.oncomplete = () => resolve({ count, byteSize });
      tx.onerror = () => reject(tx.error || new Error('讀取圖片儲存統計失敗。'));
    });
  }

  async function garbageCollect(usedIds) {
    const used = usedIds instanceof Set ? usedIds : new Set(usedIds || []);
    const db = await openDb();
    const orphanIds = [];

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).openKeyCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        const id = String(cursor.key || '');
        if (!used.has(id)) orphanIds.push(id);
        cursor.continue();
      };

      request.onerror = () => reject(request.error || new Error('掃描未使用圖片失敗。'));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('掃描未使用圖片失敗。'));
    });

    for (const id of orphanIds) {
      await deleteAsset(id);
    }

    return orphanIds.length;
  }

  async function blobToBase64(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const chunkSize = 0x8000;
    let binary = '';

    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, chunk);
    }

    return btoa(binary);
  }

  function base64ToBlob(data, mime) {
    const binary = atob(String(data || ''));
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type:mime || 'application/octet-stream' });
  }

  async function serializeAssets(ids) {
    const uniqueIds = [...new Set(ids || [])].filter(isAssetId);
    const assets = {};

    for (const id of uniqueIds) {
      const record = await getRecord(id);
      if (!record || !(record.blob instanceof Blob)) {
        throw new Error(`備份缺少圖片資產：${id}`);
      }

      assets[id] = {
        mime:record.mime || record.blob.type || 'application/octet-stream',
        width:Number(record.width) || 0,
        height:Number(record.height) || 0,
        byteSize:Number(record.byteSize) || record.blob.size,
        data:await blobToBase64(record.blob)
      };
    }

    return assets;
  }

  async function importSerializedAssets(serializedAssets) {
    if (!serializedAssets || typeof serializedAssets !== 'object' || Array.isArray(serializedAssets)) {
      throw new Error('備份中的圖片資產表格式不正確。');
    }

    const addedIds = [];

    try {
      for (const [id, item] of Object.entries(serializedAssets)) {
        if (!isAssetId(id)) throw new Error(`無效的圖片資產 ID：${id}`);
        if (!item || typeof item !== 'object' || typeof item.data !== 'string') {
          throw new Error(`圖片資產資料不完整：${id}`);
        }

        const blob = base64ToBlob(item.data, item.mime);
        const hash = await hashBlob(blob);
        const expectedId = ASSET_PREFIX + hash;

        if (expectedId !== id) {
          throw new Error(`圖片資產校驗失敗：${id}`);
        }

        if (await hasAsset(id)) continue;

        await putRecord({
          id,
          hash,
          blob,
          mime:item.mime || blob.type || 'application/octet-stream',
          width:Number(item.width) || 0,
          height:Number(item.height) || 0,
          byteSize:blob.size,
          createdAt:Date.now()
        });

        addedIds.push(id);
      }
    } catch (error) {
      for (const id of addedIds) {
        try { await deleteAsset(id); } catch (_) {}
      }
      throw error;
    }

    return { addedIds, importedCount:addedIds.length };
  }

  function dispose() {
    for (const id of [...objectUrlCache.keys()]) {
      revokeCachedUrl(id);
    }
  }

  global.addEventListener('beforeunload', dispose);

  global.L1nGGenealogyAssets = {
    openDb,
    isAssetId,
    optimizeImage,
    importBlob,
    getUrl,
    preloadUrls,
    peekUrl,
    hasAsset,
    deleteAsset,
    clearAll,
    getStats,
    garbageCollect,
    serializeAssets,
    importSerializedAssets,
    dispose
  };
})(window);
