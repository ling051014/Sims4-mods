// 僅測試用 golden PNG reader；production 的 JPEG/PNG 解碼全部交給 browser native decoder。
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
function paeth(a,b,c){const p=a+b-c, distances=[Math.abs(p-a),Math.abs(p-b),Math.abs(p-c)];return [a,b,c][distances.indexOf(Math.min(...distances))];}
function decodePng(buffer){
  assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  let offset=8,width,height,channels,color,idat=[],chunks=[];
  while(offset<buffer.length){
    const length=buffer.readUInt32BE(offset),kind=buffer.subarray(offset+4,offset+8).toString('ascii');
    const data=buffer.subarray(offset+8,offset+8+length); chunks.push(kind);
    if(kind==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);color=data[9];channels={0:1,2:3,4:2,6:4}[color];assert.equal(data[8],8);assert.equal(data[12],0);assert.ok(channels);}
    if(kind==='IDAT') idat.push(data);
    offset+=length+12;if(kind==='IEND')break;
  }
  const filtered=zlib.inflateSync(Buffer.concat(idat)),stride=width*channels, pixels=Buffer.alloc(width*height*channels),rgba=Buffer.alloc(width*height*4);
  assert.equal(filtered.length,(stride+1)*height);
  for(let y=0;y<height;y++){
    const mode=filtered[y*(stride+1)];assert.ok(mode<=4);
    for(let x=0;x<stride;x++){
      const i=y*stride+x,a=x>=channels?pixels[i-channels]:0,b=y?pixels[i-stride]:0,c=y&&x>=channels?pixels[i-stride-channels]:0;
      pixels[i]=(filtered[y*(stride+1)+1+x]+[0,a,b,(a+b)>>1,paeth(a,b,c)][mode])&255;
    }
  }
  for(let i=0;i<width*height;i++){
    const from=i*channels,to=i*4;
    if(color===0||color===4){rgba[to]=rgba[to+1]=rgba[to+2]=pixels[from];rgba[to+3]=color===4?pixels[from+1]:255;}
    else{pixels.copy(rgba,to,from,from+3);rgba[to+3]=color===6?pixels[from+3]:255;}
  }
  return {width,height,colorType:color,rgba,chunks};
}
function comparePixels(actual,expected,width){
  assert.equal(actual.length,expected.length);const counts=[0,0,0,0],max=[0,0,0,0],examples=[];let pixels=0;
  for(let i=0;i<actual.length;i+=4){let changed=false;for(let c=0;c<4;c++){const d=Math.abs(actual[i+c]-expected[i+c]);if(d){counts[c]++;changed=true;}max[c]=Math.max(max[c],d);}if(changed){pixels++;if(examples.length<5)examples.push({x:(i/4)%width,y:Math.floor(i/4/width),actual:Array.from(actual.subarray(i,i+4)),expected:Array.from(expected.subarray(i,i+4))});}}
  return {changedPixels:pixels,channelDifferenceCount:counts,maxDifferencePerChannel:max,examples};
}
module.exports={decodePng,comparePixels};
