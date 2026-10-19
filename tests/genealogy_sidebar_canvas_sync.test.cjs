'use strict';
// 側邊欄顯示族譜完整範圍，頂部篩選只影響畫布，不能改動原始 Household。
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_app.js'),'utf8');
function between(a,b){
 const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
 assert.ok(start>=0&&end>start,'找不到受測流程 '+a);
 return source.slice(start,end);
}
const viewCode=between('function familyVisibleIds(','// ========【圖片預熱】');
const household={id:'familyA',memberIds:['A'],name:'家族 A'};
const data={currentFamilyId:'familyA',sims:{
 A:{id:'A',status:'在世',gender:'女',spouseIds:['B'],exSpouseIds:['C']},
 B:{id:'B',status:'在世',gender:'男'},
 C:{id:'C',status:'已故',gender:'男'}
}};
const state={filtered:false};
const recorded=[];
const view=vm.runInNewContext(viewCode+'\n({familyVisibleIds,getVisibleIds,currentDisplayedFamily});',{
 currentGenealogyData:()=>data,
 currentFamily:()=>household,
 currentTreeFamily:()=>({...household,primaryMemberIds:['A']}),
 familyTreeViewMode:'household',
 simMatchesTopbarFilters:sim=>!state.filtered||sim.status!=='已故',
 genealogyStore:{
   getFamily:()=>household,
   getVisibleFamilyIds:(family,options)=>{
     recorded.push({family,hasFilter:typeof options.matchesSim==='function'});
     return new Set(['A','B','C'].filter(id=>!options.matchesSim||options.matchesSim(data.sims[id])));
   }
 }
});
test('側邊欄包含目前族譜的關聯配偶與前任，但不改動原始 Household',()=>{
 assert.deepEqual([...view.currentDisplayedFamily().memberIds],['A','B','C']);
 assert.deepEqual(household.memberIds,['A']);
});
test('套用頂部篩選只減少畫布卡片，側邊欄仍完整顯示族譜成員',()=>{
 state.filtered=true;
 assert.deepEqual([...view.getVisibleIds('familyA')],['A','B']);
 assert.deepEqual([...view.currentDisplayedFamily().memberIds],['A','B','C']);
 state.filtered=false;
 assert.equal(recorded.at(-2).hasFilter,true);
 assert.equal(recorded.at(-1).hasFilter,false);
});
test('側欄世代排序、選取、統計均採用同一份成員清單',()=>{
 assert.match(source,/renderFamilyMemberList\(currentDisplayedFamily\(\)\)/);
 const section=between('function refreshFamilyProfilePanel()','function refreshFamilyUI()');
 assert.match(section,/const viewFamily = currentDisplayedFamily\(\) \|\| fam/);
 assert.match(section,/renderFamilyMemberList\(viewFamily\)/);
});
test('外部關聯人物不能被當作 Household 成員批次移除',()=>{
 const list=between('function renderFamilyMemberList(fam)','function refreshFamilyProfilePanel()');
 assert.match(list,/editableIds\.has\(String\(sim\.id\)\)/);
 const controller=between('const familyMemberController = {','function renderFamilyMemberList(fam)');
 assert.match(controller,/editableIds\.has\(String\(id\)\)/);
});