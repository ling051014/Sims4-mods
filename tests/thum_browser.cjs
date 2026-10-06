// 真正的 browser integration；不 fake JPEG/PNG decoder。private ZIP/golden 只寫本地 reportDir。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {spawnSync}=require('node:child_process');
const {decodePng,comparePixels}=require('./png_reference.cjs');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),args=process.argv.slice(2);
function option(name){const i=args.indexOf(name);return i>=0?args[i+1]:null;}
const zipPath=option('--zip'), referenceExe=option('--reference-exe'),reportDir=path.resolve(option('--report-dir')||path.join(ROOT,'../thum-browser-validation'));
const executablePath=option('--browser')||'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(reportDir,{recursive:true});
const sha=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
let checks=0;const report={status:'RUNNING',checks:[],head:'0d3396d32cad9dc08a054905ce8e3fa696cb0447'};
function pass(name){checks++;report.checks.push(name);console.log('PASS',name);}
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const file=path.resolve(ROOT,'.'+pathname);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404);response.end();return;}
  const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
  response.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});fs.createReadStream(file).pipe(response);
});

async function decode(page,raw){
  return page.evaluate(async values=>{
    const input=new Uint8Array(values), before=input.slice(), result=await L1nGThumDecoder.decode(input);
    if(!result)return null;
    return {png:Array.from(new Uint8Array(await result.blob.arrayBuffer())),width:result.width,height:result.height,mime:result.blob.type,
            alphaCounts:[result.transparent,result.semitransparent,result.opaque],inputUnchanged:input.every((v,i)=>v===before[i])};
  },Array.from(raw));
}
async function assetRecord(page,id){
  return page.evaluate(async id=>{
    const db=await L1nGGenealogyAssets.openDb();
    const record=await new Promise((resolve,reject)=>{const req=db.transaction('assets','readonly').objectStore('assets').get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    return record?{id:record.id,mime:record.mime,width:record.width,height:record.height,png:Array.from(new Uint8Array(await record.blob.arrayBuffer()))}:null;
  },id);
}

async function main(){
  await new Promise(resolve=>server.listen(args.includes('--serve')?Number(option('--port')||8787):0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  if(args.includes('--serve')){console.log('Branch preview: '+base+'/L1nG/GenealogyExporter/genealogy.html\nVisual harness: '+base+'/tests/thum-browser.html');return;}
  const browser=await chromium.launch({executablePath,headless:true});
  report.browser=browser.version();
  try{
    const context=await browser.newContext();
    // 計數 instrumentation 僅在隔離 test profile，production 不包裝或 monkey-patch native API。
    await context.addInitScript(()=>{
      const urls=new Set(),bitmaps=new Set();window.__thumTestResources={urls,bitmaps,created:0,closed:0};
      const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
      URL.createObjectURL=blob=>{const url=create(blob);urls.add(url);return url;};
      URL.revokeObjectURL=url=>{urls.delete(url);return revoke(url);};
      const native=createImageBitmap;
      window.createImageBitmap=async(...args)=>{const bitmap=await native(...args),close=bitmap.close.bind(bitmap);bitmaps.add(bitmap);window.__thumTestResources.created++;
        bitmap.close=()=>{if(bitmaps.delete(bitmap))window.__thumTestResources.closed++;return close();};return bitmap;};
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'/tests/thum-browser.html');
    const fixture=fs.readFileSync(path.join(__dirname,'fixtures/thum/synthetic_alfa.thum'));
    const golden=decodePng(fs.readFileSync(path.join(__dirname,'fixtures/thum/s4pe_reference.png')));
    const decoded=await decode(page,fixture),png=Buffer.from(decoded.png),pixels=decodePng(png);
    assert.equal(decoded.mime,'image/png');assert.equal(pixels.colorType,6);assert.deepEqual(pixels.rgba,golden.rgba);
    assert.equal(decoded.width,4);assert.equal(decoded.height,4);assert.ok(decoded.inputUnchanged);
    pass('synthetic browser decode -> actual PNG color type6 -> exact s4pe RGBA, dimensions/raw bytes preserved');
    const alpha=Array.from({length:16},(_,i)=>pixels.rgba[i*4+3]);
    assert.ok(alpha.includes(0)&&alpha.includes(128)&&alpha.includes(255));assert.deepEqual(decoded.alphaCounts,[4,8,4]);
    pass('alpha0/64/128/255 preserved; RGB including alpha0 remains golden-exact, no premultiply/unpremultiply');
    assert.equal(sha(png),sha(Buffer.from((await decode(page,fixture)).png)));pass('async conversion deterministic SHA-256');
    await page.evaluate(()=>{window.__nativeBitmap=window.createImageBitmap;window.createImageBitmap=undefined;});
    assert.deepEqual(decodePng(Buffer.from((await decode(page,fixture)).png)).rgba,golden.rgba);
    await page.evaluate(()=>{window.createImageBitmap=window.__nativeBitmap;delete window.__nativeBitmap;});
    pass('native Image/ObjectURL path also golden-equivalent; URL cleanup');
    const pixelFailures=await page.evaluate(async values=>{
      const input=new Uint8Array(values),save=CompressionStream;window.CompressionStream=undefined;
      try{await L1nGThumDecoder.decode(input);return 'UNEXPECTED_SUCCESS';}catch(error){return error.stage;}finally{window.CompressionStream=save;}
    },Array.from(fixture));
    assert.equal(pixelFailures,'PNG_ENCODE_UNSUPPORTED');pass('no CompressionStream -> fail closed, never lossy Canvas fallback');
    let resources=await page.evaluate(()=>({urls:__thumTestResources.urls.size,bitmaps:__thumTestResources.bitmaps.size}));
    assert.deepEqual(resources,{urls:0,bitmaps:0});pass('all standalone native ImageBitmaps/ObjectURLs released');

    // 使用實際 asset store，不造第二套 IndexedDB。
    await page.addScriptTag({url:base+'/L1nG/GenealogyExporter/genealogy_assets.js'});
    const ids=await page.evaluate(async values=>{
      const decoded=await L1nGThumDecoder.decode(new Uint8Array(values));
      const id=await L1nGGenealogyAssets.importBlob(decoded.blob,{width:decoded.width,height:decoded.height});
      const again=await L1nGGenealogyAssets.importBlob(decoded.blob,{width:decoded.width,height:decoded.height});
      return [id,again];
    },Array.from(fixture));
    assert.equal(ids[0],ids[1]);assert.equal(ids[0],'asset_'+sha(png));
    assert.deepEqual(decodePng(Buffer.from((await assetRecord(page,ids[0])).png)).rgba,golden.rgba);pass('canonical IndexedDB / SHA-256 dedupe saves only decoded PNG Blob');
    await page.reload();await page.addScriptTag({url:base+'/L1nG/GenealogyExporter/genealogy_assets.js'});
    const persisted=await assetRecord(page,ids[0]);assert.equal(persisted.mime,'image/png');assert.deepEqual(decodePng(Buffer.from(persisted.png)).rgba,golden.rgba);
    pass('F5 IndexedDB persistence preserves exact transparent PNG');

    if(zipPath){
      await page.goto(base+'/L1nG/GenealogyExporter/genealogy.html');
      await page.waitForFunction(()=>typeof currentGenealogyData==='function'&&document.querySelector('#appSkeleton')?.getAttribute('aria-hidden')==='true');
      await page.locator('#gameImportInput').setInputFiles(zipPath);
      await page.waitForFunction(()=>document.querySelector('#confirmationDialog.show')?.textContent.includes('遊戲族譜匯入完成'),{},{timeout:60000});
      report.importDialog=await page.locator('#confirmationDialog').innerText();
      assert.ok(!report.importDialog.includes('失敗'));
      pass('real Runtime6 ZIP canonical UI import promise completes');
      const state=await page.evaluate(async()=>{
        const file=document.querySelector('#gameImportInput').files[0],bundle=await L1nGGameImport.parseFile(file),data=currentGenealogyData();
        const entries=[];
        for(const [id,source]of Object.entries(bundle.genealogy.sims)){
          const asset=L1nGGameImport.getSimAvatarAsset(bundle,id,source);if(!asset)continue;
          const target=data.sims[id];if(!target)continue;
          entries.push({simId:id,path:asset.path,source:source.portrait?.source,avatar:target.avatar,gameData:target.gameData,raw:Array.from(asset.bytes)});
        }
        const baseline=L1nGGameImport.convertBundle(bundle),copy=JSON.parse(JSON.stringify(baseline));
        const avatarStats=await persistGameImportAvatars(bundle,baseline);
        for(const sim of Object.values(baseline.sims))sim.avatar=copy.sims[sim.gameData.simId]?.avatar||null;
        return {entries,simCount:Object.keys(data.sims).length,petCount:data.meta?.gameImportStats?.petCount,familyCount:data.families.length,
                avatarStats,nonAvatarDataUnchanged:JSON.stringify(baseline)===JSON.stringify(copy),originalSourceCount:Object.keys(bundle.genealogy.sims).length};
      });
      assert.equal(state.entries.length,22);assert.equal(state.avatarStats.saved,22);assert.equal(state.avatarStats.thumDecoded,22);assert.equal(state.avatarStats.decodeFailed,0);
      for(const entry of state.entries){assert.equal(entry.gameData.portrait.source,entry.source);assert.equal(entry.gameData.portrait.path,entry.path);}
      assert.ok(state.nonAvatarDataUnchanged);pass('22 matching Sim avatars, non-avatar relationships/family/preferences/pet payload unchanged');
      pass('game portrait source/path provenance unchanged after PNG conversion');
      const dimensions={},results=[];
      for(let i=0;i<state.entries.length;i++){
        const entry=state.entries[i],stored=await assetRecord(page,entry.avatar);assert.equal(stored.mime,'image/png');
        const converted=decodePng(Buffer.from(stored.png)),direct=await decode(page,Buffer.from(entry.raw));
        assert.deepEqual(Buffer.from(stored.png),Buffer.from(direct.png));
        const key=converted.width+'x'+converted.height;dimensions[key]=(dimensions[key]||0)+1;
        const record={index:i,dimensions:key,rawSha256:sha(Buffer.from(entry.raw)),pngSha256:sha(Buffer.from(stored.png)),mime:stored.mime,alphaCounts:direct.alphaCounts};
        if(referenceExe){
          const rawFile=path.join(reportDir,'private-'+i+'.thum'),referenceFile=path.join(reportDir,'private-'+i+'-s4pe.png'),rgbFile=path.join(reportDir,'private-'+i+'-rgb.bin');
          fs.writeFileSync(rawFile,Buffer.from(entry.raw));
          const reference=spawnSync(referenceExe,[rawFile,referenceFile,rgbFile],{encoding:'utf8'});assert.equal(reference.status,0,reference.stdout+reference.stderr);
          const golden=decodePng(fs.readFileSync(referenceFile)),comparison=comparePixels(converted.rgba,golden.rgba,converted.width);
          record.golden=comparison;
          assert.equal(comparison.changedPixels,0,JSON.stringify(comparison));
        }
        results.push(record);
      }
      assert.deepEqual(dimensions,{'48x48':17,'128x128':3,'70x70':1,'256x256':1});
      report.realZip={avatars:22,simCount:state.simCount,originalSourceCount:state.originalSourceCount,families:state.familyCount,dimensions,stats:state.avatarStats,results};
      pass('22 original sizes, no 384px manual pipeline; all actual PNG pixels golden-equivalent');
      const manual=await page.evaluate(async values=>{
        const results=[];
        for(const kind of ['sim','pet']){
          const result=await compressImage(new File([new Uint8Array(values)],'manual.jpg',{type:'image/jpeg'}),kind);
          const bitmap=await createImageBitmap(result.blob),canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d');
          try{ctx.drawImage(bitmap,0,0);const pixels=ctx.getImageData(0,0,bitmap.width,bitmap.height).data;
            results.push({kind,opaque:pixels.every((v,i)=>i%4!==3||v===255)});
          }finally{bitmap.close();canvas.width=canvas.height=1;}
        }return results;
      },Array.from(fixture));
      assert.ok(manual.every(result=>result.opaque));pass('actual manual Human/Pet upload pipeline remains ordinary JPEG, not EA alpha conversion');
      const serialized=await page.evaluate(ids=>L1nGGenealogyAssets.serializeAssets(ids),state.entries.map(entry=>entry.avatar));
      const restoreContext=await browser.newContext(),restorePage=await restoreContext.newPage();await restorePage.goto(base+'/tests/thum-browser.html');
      await restorePage.addScriptTag({url:base+'/L1nG/GenealogyExporter/genealogy_assets.js'});
      await restorePage.evaluate(data=>L1nGGenealogyAssets.importSerializedAssets(data),serialized);
      for(const entry of state.entries)assert.deepEqual((await assetRecord(restorePage,entry.avatar)).png,(await assetRecord(page,entry.avatar)).png);
      await restoreContext.close();pass('canonical JSON asset backup/restore into empty IndexedDB retains exact Blob/hash, no THUM reconversion');
      resources=await page.evaluate(()=>{const counts={beforeDisposeUrls:__thumTestResources.urls.size,bitmaps:__thumTestResources.bitmaps.size,created:__thumTestResources.created,closed:__thumTestResources.closed};
        L1nGGenealogyAssets.dispose();return {...counts,afterDisposeUrls:__thumTestResources.urls.size};});
      assert.ok(resources.created>=88);assert.equal(resources.bitmaps,0);assert.equal(resources.created,resources.closed);assert.equal(resources.afterDisposeUrls,0);
      report.preReloadResourceCleanup=resources;pass('all real-ZIP conversion ImageBitmaps closed; bounded display URLs released by existing asset store');
      const snapshot=await page.evaluate(()=>JSON.stringify(currentGenealogyData()));
      await page.reload();await page.waitForFunction(()=>typeof currentGenealogyData==='function'&&Object.keys(currentGenealogyData().sims).length>600);
      assert.equal(await page.evaluate(()=>JSON.stringify(currentGenealogyData())),snapshot);
      for(const entry of state.entries){const again=await assetRecord(page,entry.avatar);assert.ok(again&&again.mime==='image/png');}
      pass('F5 full genealogy + all 22 avatar references + IndexedDB assets persist');
      // 一張 malformed THUM 不取消族譜，stage diagnostic 與其餘資料照常存在。
      const failure=await page.evaluate(async values=>{
        const bytes=new Uint8Array(values);bytes[32]=0;
        const data={sims:{'test-human':{avatar:null,name:'Synthetic'}},meta:{},families:[]};
        const bundle={genealogy:{sims:{'test-human':{portrait:{path:'avatars/test-human.jpg'}}}},files:new Map([['avatars/test-human.jpg',bytes]])};
        const stats=await persistGameImportAvatars(bundle,data);return {stats,name:data.sims['test-human'].name,avatar:data.sims['test-human'].avatar};
      },Array.from(fixture));
      assert.equal(failure.stats.decodeFailed,1);assert.equal(failure.stats.saved,0);assert.equal(failure.name,'Synthetic');assert.equal(failure.avatar,null);
      pass('per-avatar conversion failure skips only image, preserves genealogy');
      resources=await page.evaluate(()=>{L1nGGenealogyAssets.dispose();return {urls:__thumTestResources.urls.size,bitmaps:__thumTestResources.bitmaps.size,created:__thumTestResources.created,closed:__thumTestResources.closed};});
      assert.equal(resources.urls,0);assert.equal(resources.bitmaps,0);assert.equal(resources.created,resources.closed);
      report.resourceCleanup=resources;pass('asset store dispose + converter release all tracked URLs/bitmaps');
      if(referenceExe){
        const index=results.find(result=>result.dimensions==='256x256').index;
        const visual=await context.newPage();await visual.goto(base+'/tests/thum-browser.html');
        await visual.locator('#rawInput').setInputFiles(path.join(reportDir,'private-'+index+'.thum'));
        await visual.waitForFunction(()=>document.querySelector('#result').textContent.includes('EA_ALFA_THUM'));
        await visual.locator('#referenceInput').setInputFiles(path.join(reportDir,'private-'+index+'-s4pe.png'));
        await visual.waitForFunction(()=>[...document.querySelectorAll('.tile img')].every(img=>img.complete&&img.naturalWidth===256));
        for(const background of ['checker','white','dark']){
          await visual.locator('#background').selectOption(background);
          await visual.screenshot({path:path.join(reportDir,'private-256-'+background+'.png'),fullPage:true});
        }
        await visual.close();pass('actual 256px raw/decoded/s4pe visual harness on checkerboard/white/dark');
      }
    }
    assert.deepEqual(errors,[]);pass('no browser unhandled page exceptions');
    await context.close();report.status='PASS';report.passed=checks;
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{report.status='FAIL';report.failure=error.stack;console.error(error);process.exitCode=1;server.close();}).finally(()=>{if(!args.includes('--serve'))fs.writeFileSync(path.join(reportDir,'validation.json'),JSON.stringify(report,null,2));});
