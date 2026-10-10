// 共同父母衍生關係與整組後代位置回歸測試；不修改玩家資料。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_scene.js'),'utf8');
const pick = (from,to) => {
  const a = source.indexOf(from), b = source.indexOf(to,a+from.length);
  assert.ok(a>=0 && b>a, '找不到受測函式：'+from);
  return source.slice(a,b);
};
const functionText = pick('function inferCoParentRelationshipLinks(','function parentConnectorSource(');
function infer(groups,sims,links=[]) {
 const env = {genealogyData:{links},pairKey:(a,b)=>[a,b].sort().join('|')};
 return vm.runInNewContext(functionText+'\ninferCoParentRelationshipLinks;',env)(
   groups,new Map(sims.map(s=>[s.id,s])),links
 );
}
const sim = (id,props={}) => ({id,spouseIds:[],exSpouseIds:[],gameData:{},...props});
const group=(parents,kind='parent-child')=>({
 parentIds:parents,children:['child'],
 childKinds:new Map([['child',kind]])
});
test('沒有既有關係的共同親生父母只在畫布推定情人',()=>{
 const links=[];
 const result=infer([group(['A','C'])],[sim('A'),sim('C')],links);
 assert.equal(result.length,1);
 assert.equal(result[0].label,'情人');
 assert.equal(result[0].inferred,true);
 assert.equal(links.length,0);
});
test('有原配但另一組共同親生父母仍可推定情人',()=>{
 const result=infer([group(['A','B']),group(['A','C'])],
 [sim('A',{spouseIds:['B']}),sim('B'),sim('C')]);
 assert.equal(result.length,1);
 assert.equal(result[0].from,'A');
 assert.equal(result[0].to,'C');
});
test('明確的情人、秘密情人、前任與配偶不得被推定覆蓋',()=>{
 const actual=[{id:'1',from:'A',to:'C',label:'秘密情人'}];
 assert.equal(infer([group(['A','C'])],[sim('A'),sim('C')],actual).length,0);
 assert.equal(infer([group(['A','C'])],[sim('A',{exSpouseIds:['C']}),sim('C')]).length,0);
 assert.equal(infer([group(['A','C'])],[sim('A',{spouseIds:['C']}),sim('C')]).length,0);
});
test('只有領養關係不能推定情人，雙方都必須可見',()=>{
 assert.equal(infer([group(['A','C'],'adoptive')],[sim('A'),sim('C')]).length,0);
 assert.equal(infer([group(['A','C'])],[sim('A')]).length,0);
});
test('同一組共同父母有多名子女只建立一段推定關係',()=>{
 const g=group(['A','C']);g.children=['child','child2'];
 g.childKinds.set('child2','parent-child');
 assert.equal(infer([g],[sim('A'),sim('C')]).length,1);
});
test('子代子樹平移不能撞到同世代其他家庭，且要保留跨世代整組',()=>{
 const body=pick('function translateFamilyDescendants(','function alignFamilyBranchParentAxes(');
 const run=vm.runInNewContext(body+'\ntranslateFamilyDescendants;');
 const parent={id:'p',x:100,width:100,generation:0};
 const child={id:'c',x:400,width:100,generation:1};
 const grand={id:'g',x:400,width:100,generation:2};
 const other={id:'o',x:700,width:100,generation:1};
 const layers=new Map([[0,[parent]],[1,[child,other]],[2,[grand]]]);
 const model={unitBySim:new Map([['child',child]]),unitById:new Map([['c',child],['g',grand]])};
 const ownership={primaryChildren:new Map([['c',['g']]]),ownerParentByUnit:new Map([['g','c']])};
 assert.equal(run(layers,model,ownership,{children:['child']},-200,0,30),true);
 assert.equal(child.x,200);assert.equal(grand.x,200);
 assert.equal(run(layers,model,ownership,{children:['child']},440,0,30),false);
 assert.equal(child.x,200);assert.equal(grand.x,200);
});
