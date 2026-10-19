'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {scene,extract,api,rect,card,curve,clearResult}=require('./genealogy_smart_curve_fixture.cjs');
const A=card(0,0),B=card(440,0);
test('單一智慧弧線自動選擇最小安全弧度，不依賴手動百分比',()=>{
  const first=curve(A,B,[],{sameGeneration:true});
  const manual=api.relationshipOtherRenderGeometry(A,B,{curved:true,curveAmount:100,curveAmountManual:true},{pos:new Map(),sameGeneration:true});
  assert.equal(first.segments?.length,1);
  assert.equal(first.d,manual.d,'過時的 slider 欄位不可左右智慧曲線');
  assert.match(first.d,/\bC/);
  const segment=first.segments[0];
  const midpoint=api.relationshipCubicAt(segment,0.5);
  assert.ok(midpoint.y<segment.from.y,'同代弧線向上凸');
  assert.equal(segment.from.x,A.rect.right);
  assert.equal(segment.from.y,A.avatarY);
  assert.equal(segment.to.x,B.rect.left);
  assert.equal(segment.to.y,B.avatarY);
});
test('跨世代接近垂直時維持單段曲線且不穿越其他世代',()=>{
  const upper=card(0,0),lower=card(0,350);
  const result=curve(upper,lower,[]);
  assert.equal(result.segments?.length,1,'垂直族譜關係線應使用單段曲線');
  assert.match(result.d,/\bC/);
  const segment=result.segments[0];
  let previous=segment.from.y;
  for(let i=1;i<=50;i++){
    const y=api.relationshipCubicAt(segment,i/50).y;
    assert.ok(y>=previous-0.001,'跨世代曲線不應有反向迴圈');
    previous=y;
  }
});
test('當祖先阻擋單段弧線時，不允許輸出穿卡片的假安全曲線',()=>{
  const huge=rect(120,-1000,320,300);
  const result=curve(A,B,[huge]);
  assert.ok(result.blocked||clearResult(result,[huge]),'只能安全連線或回報阻擋');
  if(result.blocked)assert.equal(result.d,'');
});
test('現行 scene 不再要求舊弧度滑桿與已移除的 arcCandidate API',()=>{
  assert.match(scene,/function relationshipSmartUpperCurveGeometry\(/);
  assert.match(scene,/function relationshipVerticalCurveGeometry\(/);
  assert.doesNotMatch(scene,/function relationshipArcCandidate\(/);
  const render=extract('function relationshipOtherRenderGeometry(','function perspectiveOtherLinkEndpoints(');
  assert.doesNotMatch(render,/curveAmountManual|curveAmount/);
});