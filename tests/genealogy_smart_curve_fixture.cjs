'use strict';
// 執行正式 scene 的智慧曲線函式；測試使用完整卡片幾何，不再使用舊弧度滑桿。
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const scene=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_scene.js'),'utf8');
function extract(start,end){
  const a=scene.indexOf(start),b=scene.indexOf(end,a+start.length);
  if(a<0||b<=a)throw new Error('找不到實作區段: '+start);
  return scene.slice(a,b);
}
const geometrySource=extract('function relationshipRouteRects(','function drawPerspectiveKinshipLabels(');
const context={
  cardOuterRect:card=>card.rect,
  cardHorizontalConnectionRect:card=>card.rect,
  cardAvatarRect:card=>({centerY:card.avatarY}),
  avatarBoundaryAnchor:(card,target)=>({
    x:target.rect.centerX>=card.rect.centerX?card.rect.right:card.rect.left,y:card.avatarY
  }),
  relationshipSegmentIntersectsRect:(x1,y1,x2,y2,r,padding=9)=>{
    for(let i=0;i<=100;i++){
      const t=i/100,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
      if(x>=r.left-padding&&x<=r.right+padding&&y>=r.top-padding&&y<=r.bottom+padding)return true;
    }
    return false;
  }
};
const api=vm.runInNewContext(geometrySource+'\n({relationshipOtherRenderGeometry,relationshipCubicAt,relationshipCubicClear,relationshipSmartUpperCurveGeometry,relationshipVerticalCurveGeometry,relationshipOrthogonalRoute,relationshipStraightRoute,relationshipUpperArcSegment})',context);
function rect(left,top,right,bottom){
  return {left,top,right,bottom,centerX:(left+right)/2,centerY:(top+bottom)/2};
}
function card(left,top,width=100,height=110){
  return {rect:rect(left,top,left+width,top+height),avatarY:top+32};
}
function blocker(r){return {rect:r,avatarY:(r.top+r.bottom)/2};}
function routeContext(rectangles=[],options={}){
  return {pos:new Map(rectangles.map((r,i)=>['block:'+i,blocker(r)])),fromId:'A',toId:'B',...options};
}
function curve(a,b,rectangles=[],options={}){
  return api.relationshipOtherRenderGeometry(a,b,{curved:true},routeContext(rectangles,options));
}
function clearResult(result,obstacles){
  if(!result.segments?.length)return false;
  return api.relationshipCubicClear(result.segments,obstacles);
}
module.exports={scene,extract,api,rect,card,blocker,routeContext,curve,clearResult};