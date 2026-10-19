'use strict';
// 預設肖像現行資料契約：唯一來源是 sample preset 與 assets/sample-portraits。
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../L1nG/GenealogyExporter');
const app=fs.readFileSync(path.join(ROOT,'genealogy_app.js'),'utf8');
const html=fs.readFileSync(path.join(ROOT,'genealogy.html'),'utf8');
const env={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,'genealogy_sample_preset.js'),'utf8'),env);
const sample=env.window.L1nGGenealogySamplePack;
assert.ok(sample && sample.sims && sample.meta,'目前預設族譜資料必須能載入');
const unknownIds=Object.values(sample.sims).filter(sim=>sim.gameData?.recordState==='family_tree_only').map(sim=>String(sim.id));
const fullIds=Object.values(sample.sims).filter(sim=>sim.gameData?.recordState!=='family_tree_only').map(sim=>String(sim.id));
const pets=[...Object.values(sample.sims).flatMap(sim=>sim.pets||[]),...(sample.meta.unassignedPets||[])];
const petIds=pets.map(pet=>String(pet.gameData?.simId||pet.id));
const portraitDir=path.join(ROOT,'assets/sample-portraits');
const expected=new Set([...fullIds,...petIds].map(id=>id+'.png'));
expected.add('shared_unknown.png');
function inspectPng(bytes,name,size){
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',name+' signature');
  assert.equal(bytes.subarray(12,16).toString('ascii'),'IHDR',name+' header');
  assert.equal(bytes.readUInt32BE(16),size,name+' width');
  assert.equal(bytes.readUInt32BE(20),size,name+' height');
  assert.equal(bytes[24],8,name+' bit depth');
  assert.equal(bytes[25],6,name+' RGBA');
}
test('82 位市民和 6 隻寵物的預設肖像以 60 張 PNG 資產提供',()=>{
  assert.equal(Object.keys(sample.sims).length,82);
  assert.equal(petIds.length,6);
  assert.equal(new Set(petIds).size,6);
  assert.equal(fullIds.length+unknownIds.length,82);
  assert.equal(sample.meta.sampleVersion,11);
  const assets=fs.readdirSync(portraitDir).filter(name=>name.endsWith('.png'));
  assert.deepEqual(assets.sort(),[...expected].sort(),'預設 PNG 資產必須與市民、寵物名單一致');
  for(const file of expected)inspectPng(fs.readFileSync(path.join(portraitDir,file)),file,file==='shared_unknown.png'?128:512);
  assert.ok(html.includes('genealogy_sample_preset.js'));
  assert.ok(!html.includes('genealogy_sample_portraits.js'),'不得要求已移除的圖片 JS 包');
});
test('首次存入原始 PNG、共用未知肖像去重，再次載入不重複匯入',async()=>{
  const first=app.indexOf('async function ensureSamplePortraitAssets(');
  const last=app.indexOf('async function prepareInitialWorkspaceDatabase(',first);
  assert.ok(first>=0&&last>first,'預設圖片匯入函式必須存在');
  const bytesRead=[];
  const saved=[];
  const database=JSON.parse(JSON.stringify(sample));
  const scope={
    buildDefaultGenealogyData:()=>JSON.parse(JSON.stringify(sample)),
    assetStore:{
      isAssetId:id=>typeof id==='string'&&id.startsWith('asset:'),
      hasAsset:async id=>saved.some(x=>x.id===id),
      importBlob:async(blob,dimensions)=>{
        assert.equal(blob.type,'image/png');
        assert.ok(dimensions.width>0&&dimensions.height>0);
        const id='asset:'+String(saved.length+1);
        saved.push({id,dimensions,size:blob.size});
        return id;
      }
    },
    DEFAULT_AVATAR_FRAME:{x:0,y:0,scale:1},
    normalizeAvatarFrame:frame=>frame,
    Blob,Uint8Array,DataView,
    fetch:async file=>{
      const name=path.basename(file);
      assert.ok(expected.has(name),'不得下載非預設肖像：'+file);
      bytesRead.push(name);
      const bytes=fs.readFileSync(path.join(portraitDir,name));
      return {ok:true,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};
    }
  };
  const ensure=vm.runInNewContext(app.slice(first,last)+'\nensureSamplePortraitAssets;',scope);
  const progress=[];
  assert.equal(await ensure(database,{onProgress:(done,total)=>progress.push([done,total])}),true);
  assert.equal(saved.length,60,'59 個個別肖像加上一個共用未知肖像');
  assert.equal(bytesRead.length,60,'同一份未知 PNG 不重複下載');
  assert.equal(new Set(bytesRead).size,60);
  assert.equal(database.meta.samplePortraitVersion,11);
  assert.equal(progress[0][0],0);
  assert.equal(progress.at(-1)[0],82+6);
  assert.equal(progress.at(-1)[1],82+6);
  for(const sim of Object.values(database.sims)){
    assert.ok(scope.assetStore.isAssetId(sim.avatar),'市民肖像需保存為資產 ID: '+sim.id);
  }
  for(const pet of [...Object.values(database.sims).flatMap(sim=>sim.pets||[]),...(database.meta.unassignedPets||[])]){
    assert.ok(scope.assetStore.isAssetId(pet.gameAvatar),'寵物遊戲肖像需保存為資產 ID: '+pet.id);
  }
  assert.equal(await ensure(database),false,'第二次載入不應重寫正常的已保存圖片');
  assert.equal(saved.length,60);
  assert.equal(bytesRead.length,60);
});