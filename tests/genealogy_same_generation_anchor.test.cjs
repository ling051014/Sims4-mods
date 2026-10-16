const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const scene=fs.readFileSync(path.join(__dirname,'../L1nG/GenealogyExporter/genealogy_scene.js'),'utf8');
const part=(a,b)=>{
 const i=scene.indexOf(a),j=scene.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'Missing scene source section');
 return scene.slice(i,j);
};
test('同代直線端點位於頭像中心高度，而非整個卡片高度中心',()=>{
 const anchor=vm.runInNewContext(
  part('function avatarBoundaryAnchor(','function getPairConnectionGeometry(')+
  '\navatarBoundaryAnchor;',{
    cardOuterRect:p=>({centerX:p.x+50,centerY:p.y+80}),
    cardHorizontalConnectionRect:p=>({left:p.x,right:p.x+100,centerY:p.y+80}),
    cardAvatarRect:p=>({centerY:p.y+30}),
    cardVerticalConnectionRect:p=>({centerX:p.x+50,top:p.y,bottom:p.y+160})
  });
 const left=anchor({x:0,y:0},{x:300,y:0});
 const right=anchor({x:300,y:0},{x:0,y:0});
 assert.equal(left.x,100);assert.equal(left.y,30);
 assert.equal(right.x,300);assert.equal(right.y,30);
});
test('同代關係拖曳造成上下錯位也一律由側邊頭像中線出入',()=>{
 const line=vm.runInNewContext(
  part('function relationshipOtherRenderGeometry(','function relationshipBubbleWidth(')+
  '\nrelationshipOtherRenderGeometry;',{
    relationshipIsNearVertical:()=>true,
    relationshipVerticalCurveGeometry:()=>{throw Error('Must not use vertical arc');},
    relationshipCurveSideAnchor:(a,b)=>({x:a.x+(b.x>=a.x?100:0),y:a.y+30}),
    avatarBoundaryAnchor:()=>{throw Error('Must not use vertical port');},
    relationshipRouteRects:()=>[],
    relationshipOrthogonalRoute:()=>null,
    relationshipStraightRoute:points=>({points}),
    relationshipSmartUpperCurveGeometry:(start,end)=>({segments:[{from:start,to:end}]})
  });
 const a={x:0,y:0},b={x:200,y:240};
 const straight=line(a,b,{curved:false},{sameGeneration:true});
 const curved=line(a,b,{curved:true},{sameGeneration:true});
 assert.equal(straight.points[0].x,100);assert.equal(straight.points[0].y,30);
 assert.equal(straight.points[1].x,200);assert.equal(straight.points[1].y,270);
 assert.equal(curved.segments[0].from.y,30);
 assert.equal(curved.segments[0].to.y,270);
});
