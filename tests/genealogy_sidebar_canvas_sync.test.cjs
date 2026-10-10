// 畫布與側欄共用可見成員集合；保護外部關聯人物與真正 Household 成員資料。
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
const viewCode=between('function currentDisplayedFamily()','// ========【圖片預熱】');
const household={id:'familyA',memberIds:['A'],name:'家族 A'};
const data={currentFamilyId:'familyA',sims:{
 A:{id:'A',status:'在世',gender:'女',spouseIds:['B'],exSpouseIds:['C']},
 B:{id:'B',status:'在世',gender:'男'},C:{id:'C',status:'已故',gender:'男'}
}};
const state={filtered:false};
const view=vm.runInNewContext(viewCode+'\ncurrentDisplayedFamily;',{
 currentFamily:()=>household,
 currentTreeFamily:()=>({...household,memberIds:['A']}),
 getVisibleIds:()=>new Set(state.filtered?['A','B']:['A','B','C'])
});
test('成員顯示與畫布採用同一份範圍，包含配偶與前任',()=>{
 assert.deepEqual([...view().memberIds],['A','B','C']);
 assert.deepEqual(household.memberIds,['A'],'不應把外部人物寫進原本家庭');
});
test('篩選畫布後，側欄的成員範圍同步縮減',()=>{
 state.filtered=true;
 assert.deepEqual([...view().memberIds],['A','B']);
 state.filtered=false;
});
test('側欄世代排序、選取、統計均採用同一份可見清單',()=>{
 assert.match(source,/renderFamilyMemberList\(currentDisplayedFamily\(\)\)/);
 const section=between('function refreshFamilyProfilePanel()','function refreshFamilyUI()');
 assert.match(section,/const viewFamily = currentDisplayedFamily\(\) \|\| fam/);
 assert.match(section,/renderFamilyMemberList\(viewFamily\)/);
 const filters=between('function applyTopbarFilters()','const zoomCenter');
 assert.match(filters,/refreshFamilyProfilePanel\(\)/);
});
test('外部關聯人物沒有家族移除操作，且批量選取不可包含外部人物',()=>{
 const memberList=between('function renderFamilyMemberList(fam)','function refreshFamilyProfilePanel()');
 assert.match(memberList,/editableIds\.has\(String\(sim\.id\)\)/);
 assert.match(memberList,/\$\{editable \? \x60<button/);
 assert.match(memberList,/\$\{editable \? \x60<div class="ui-menu-divider"/);
 const controller=between('const familyMemberController = {','function renderFamilyMemberList(fam)');
 assert.match(controller,/editableIds\.has\(String\(id\)\)/);
 assert.match(controller,/currentDisplayedFamily\(\)/);
 assert.match(controller,/memberIds \|\| \[\]\)\.map\(String\)\.includes\(String\(simId\)\)/);
});
