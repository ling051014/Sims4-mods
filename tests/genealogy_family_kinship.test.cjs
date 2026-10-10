const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'../L1nG/GenealogyExporter');
const rule=require(path.join(root,'genealogy_kinship.js'));
const sim=(id,gender='女',parents=[],spouses=[],other={})=>({id,gender,parentIds:parents,spouseIds:spouses,...other});
const build=(...sims)=>Object.fromEntries(sims.map(s=>[s.id,s]));
test('沒有既有關係的共同親生父母，只在顯示層推定「情人」與私生女',()=>{
 const sims=build(sim('a','男'),sim('b'),sim('c','女',['a','b']));
 assert.equal(rule.coParentKind(sims.c,sims,[])?.type,'情人');
 assert.equal(rule.childKinshipLabel(sims.c,sims,[]),'私生女');
 assert.equal(sims.c.parentIds.length,2);
});
test('雙方已婚或前任關係不自動推定私生子',()=>{
 let sims=build(sim('a','男',[],['b']),sim('b'),sim('c','男',['a','b']));
 assert.equal(rule.childKinshipLabel(sims.c,sims,[]),'');
 sims.a.spouseIds=[]; sims.a.exSpouseIds=['b'];
 assert.equal(rule.childKinshipLabel(sims.c,sims,[]),'');
});
test('既有秘密情人保留，普通其他關係不得強行改成情人',()=>{
 const sims=build(sim('a','男'),sim('b'),sim('c','男',['a','b']));
 assert.equal(rule.coParentKind(sims.c,sims,[{from:'a',to:'b',type:'秘密情人'}])?.type,'秘密情人');
 assert.equal(rule.coParentKind(sims.c,sims,[{from:'a',to:'b',type:'室友'}]),null);
});
test('領養與單親都不能推定私生子',()=>{
 const sims=build(sim('a','男'),sim('b'),sim('c','男',['a','b'],[],{gameData:{adoptedParentIds:['b']}}));
 assert.equal(rule.childKinshipLabel(sims.c,sims,[]),'');
 sims.c.parentIds=['a'];
 assert.equal(rule.childKinshipLabel(sims.c,sims,[]),'');
});
test('繼父母只從現任配偶及既有子女推導，絕不寫入 parentIds',()=>{
 const sims=build(sim('a','女',[],['step']),sim('step','男',[],['a']),sim('child','女',['a']));
 assert.deepEqual(rule.stepParentIds(sims.child,sims),['step']);
 assert.deepEqual(rule.stepChildIds(sims.step,sims),['child']);
 assert.deepEqual(sims.child.parentIds,['a']);
 sims.child.parentIds.push('step');
 assert.deepEqual(rule.stepParentIds(sims.child,sims),[]);
 assert.deepEqual(rule.stepChildIds(sims.step,sims),[]);
});
test('三語系均有新稱謂，且不存在後爸／後媽',()=>{
 for(const lang of ['zh-TW','zh-CN','en']){
   const j=JSON.parse(fs.readFileSync(path.join(root,'locales',lang+'.json'),'utf8'));
   for(const key of ['繼父','繼母','繼親','繼子','繼女','繼子女','私生子','私生女','私生子女']){
     assert.ok(j.messages[key],lang+': '+key);
   }
   assert.equal(j.messages['後爸'],undefined);
   assert.equal(j.messages['後媽'],undefined);
 }
});
test('畫布由 getRelInfoByKey 共用推定標籤且保留自訂覆寫',()=>{
 const app=fs.readFileSync(path.join(root,'genealogy_app.js'),'utf8');
 assert.match(app,/function familyDerivedChildTitle\(/);
 assert.match(app,/String\(key\)\.startsWith\('parent:'\)/);
 assert.match(app,/customText\s*\|\|\s*descriptor\.label/);
 const editor=fs.readFileSync(path.join(root,'genealogy_personEditor.js'),'utf8');
 assert.match(editor,/appendDerivedStepFamilyRows\(/);
 assert.match(editor,/derived\.stepParents/);
});
test('新模組載入順序與語系快取版本正確',()=>{
 const html=fs.readFileSync(path.join(root,'genealogy.html'),'utf8');
 assert.ok(html.indexOf('genealogy_kinship.js')<html.indexOf('genealogy_personEditor.js'));
 assert.ok(html.indexOf('genealogy_kinship.js')<html.indexOf('genealogy_app.js'));
});
