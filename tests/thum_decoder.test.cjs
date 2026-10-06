const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname,'../L1nG/GenealogyExporter');
const raw = new Uint8Array(fs.readFileSync(path.join(__dirname,'fixtures/thum/synthetic_alfa.thum')));
const window = {Uint8Array, Uint32Array, DataView, Blob};
vm.runInNewContext(fs.readFileSync(path.join(root,'genealogy_thumDecoder.js'),'utf8'),{window,Uint8Array,Uint32Array,DataView,Blob});
vm.runInNewContext(fs.readFileSync(path.join(root,'genealogy_gameImport.js'),'utf8'),{window,Uint8Array,DataView,Blob,TextDecoder,Map});
const codec = window.L1nGThumDecoder;
function changed(action) { const copy = new Uint8Array(raw); action(copy,new DataView(copy.buffer)); return copy; }
function crc32(bytes) { let value=0xffffffff; for(const byte of bytes){value ^= byte;for(let i=0;i<8;i++)value = (value&1)?0xedb88320^(value>>>1):value>>>1;}return (value^0xffffffff)>>>0; }

test('普通 JPEG 不進 native THUM decoder', async()=>{
  const meta=codec.inspect(raw);
  const jpeg=new Uint8Array([...raw.subarray(0,20),...raw.subarray(meta.alphaEnd)]);
  assert.equal(codec.inspect(jpeg),null);
  assert.equal(await codec.decode(jpeg),null);
  const asset=await window.L1nGGameImport.prepareGameAvatarAsset({bytes:jpeg,mimeType:'image/jpeg'});
  assert.equal(asset.converted,false);
  assert.deepEqual(new Uint8Array(await asset.blob.arrayBuffer()),jpeg);
});
test('合法 ALFA 與 dimensions 能嚴格識別',()=>{
  const result=codec.inspect(raw);assert.equal(result.width,4);assert.equal(result.height,4);
  assert.equal(result.alphaEnd,32+new DataView(raw.buffer).getUint32(28,false));
});
test('錯誤 ALFA offset 不當作 THUM',()=>assert.equal(codec.inspect(changed(b=>b[24]=0)),null));
test('alpha length out of range fail closed',()=>assert.throws(()=>codec.inspect(changed((b,v)=>v.setUint32(28,0xffffffff,false))),e=>e.stage==='THUM_ALFA_LENGTH'));
test('APP0 length 不符 fail closed',()=>assert.throws(()=>codec.inspect(changed((b,v)=>v.setUint16(22,10,false))),e=>e.stage==='THUM_ALFA_LENGTH'));
test('PNG signature 無效 fail closed',()=>assert.throws(()=>codec.inspect(changed(b=>b[32]=0)),e=>e.stage==='ALPHA_PNG_SIGNATURE'));
test('PNG CRC 錯誤 fail closed',()=>assert.throws(()=>codec.inspect(changed(b=>b[60]^=1)),e=>e.stage==='ALPHA_PNG_CRC'));
test('truncated ALFA length fail closed',()=>assert.throws(()=>codec.inspect(raw.subarray(0,30)),e=>e.stage==='THUM_ALFA_LENGTH'));
test('truncated JPEG EOI fail closed',()=>assert.throws(()=>codec.inspect(raw.subarray(0,raw.length-2)),e=>e.stage==='JPEG_EOI'));
test('EOI 後 bytes 不猜 alpha',()=>assert.throws(()=>codec.inspect(new Uint8Array([...raw,0])),e=>e.stage==='JPEG_EOI'));
test('JPEG 與 alpha PNG dimensions 不符 fail closed',()=>{
  const bytes=changed((b,v)=>{v.setUint32(48,5,false);v.setUint32(61,crc32(b.subarray(44,61)),false);});
  assert.throws(()=>codec.inspect(bytes),e=>e.stage==='THUM_DIMENSIONS');
});
test('JPEG/JFIF layout 不符 fail closed',()=>assert.throws(()=>codec.inspect(changed(b=>b[20]=0)),e=>e.stage==='THUM_JFIF_LAYOUT'));
test('普通 PNG 保留原 bytes',async()=>{
  const bytes=new Uint8Array(fs.readFileSync(path.join(__dirname,'fixtures/thum/s4pe_reference.png')));
  const asset=await window.L1nGGameImport.prepareGameAvatarAsset({bytes,mimeType:'image/png'});
  assert.equal(asset.converted,false);assert.deepEqual(new Uint8Array(await asset.blob.arrayBuffer()),bytes);
});
test('遊戲 ZIP pet 不進人物 THUM codec',async()=>{
  const asset=await window.L1nGGameImport.prepareGameAvatarAsset({bytes:raw,mimeType:'image/jpeg'},'pet');
  assert.equal(asset.converted,false);assert.deepEqual(new Uint8Array(await asset.blob.arrayBuffer()),raw);
});
test('EA codec 只接 canonical 遊戲 avatar import，不接 generic asset store 或 manual pipeline',()=>{
  const app=fs.readFileSync(path.join(root,'genealogy_app.js'),'utf8');
  assert.equal((app.match(/prepareGameAvatarAsset\(/g)||[]).length,1);
  assert.ok(app.includes('saveImageAsset(prepared.blob, prepared.metadata)'));
  assert.ok(!fs.readFileSync(path.join(root,'genealogy_assets.js'),'utf8').includes('L1nGThumDecoder'));
  assert.ok(!fs.readFileSync(path.join(root,'genealogy_image_worker.js'),'utf8').includes('L1nGThumDecoder'));
});
test('fixture 是 tiny synthetic，不是玩家圖',()=>{
  const metadata=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/thum/fixture_metadata.json'),'utf8'));
  assert.equal(metadata.playerData,false);assert.ok(raw.length<1024);
});
