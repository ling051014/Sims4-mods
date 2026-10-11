/* ========【浮動調色板】 設定 - HEX／RGB／HSL 同步與圖片吸色 ======== */
(() => {
  'use strict';
  const ids = ['customColor1','customColor2','customColor3','relationshipEditorColor'];
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const validHex = value => /^#[\da-f]{6}$/i.test(String(value));
  const rgbFromHex = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16));
  const hexFromRgb = rgb => '#' + rgb.map(v => Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('').toUpperCase();
  function rgbToHsv([r,g,b]) {
    r/=255;g/=255;b/=255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    let h=0;
    if(d) { if(max===r) h=((g-b)/d)%6; else if(max===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; }
    return {h:(h+360)%360,s:max?d/max:0,v:max};
  }
  function hsvToRgb({h,s,v}) {
    return [5,3,1].map(n => {
      const k=(n+h/60)%6;
      return Math.round(255*(v-v*s*Math.max(Math.min(k,4-k,1),0)));
    });
  }
  function rgbToHsl([r,g,b]) {
    r/=255;g/=255;b/=255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
    let h=0,s=0;
    if(d) {
      s=d/(1-Math.abs(2*l-1));
      if(max===r) h=((g-b)/d)%6; else if(max===g) h=(b-r)/d+2; else h=(r-g)/d+4;
      h*=60;
    }
    return [Math.round((h+360)%360),Math.round(s*100),Math.round(l*100)];
  }
  function hslToRgb(h,s,l) {
    h=(h%360+360)%360;s/=100;l/=100;
    const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
    const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
    return rgb.map(v => Math.round((v+m)*255));
  }
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 19 8.5-8.5"/><path d="M3 21h4l8-8"/><path d="M13.5 6.5 17.5 10.5"/><path d="M15 5l2-2a3 3 0 0 1 4 4l-2 2"/><path d="m13 9 2-2 4 4-2 2"/></svg>';
  const refs = new Map();
  let active=null, panel=null, selectedHex='#55ACEE', hsv=rgbToHsv([85,172,238]), syncFields=null, animationFrame=0;
  const html = `
    <div class="l1ng-color-picker-head">
      <strong class="l1ng-color-picker-title">調整顏色</strong>
      <button type="button" class="l1ng-color-picker-close" aria-label="關閉調色板">×</button>
    </div>
    <div class="l1ng-color-picker-sv" role="slider" tabindex="0" aria-label="飽和度與明暗" aria-valuemin="0" aria-valuemax="100" aria-valuenow="70">
      <span class="l1ng-color-picker-dot" aria-hidden="true"></span>
    </div>
    <input class="l1ng-color-picker-hue" type="range" min="0" max="360" step="1" value="200" aria-label="色相">
    <div class="l1ng-color-picker-fields">
      <div class="l1ng-color-picker-field-row" data-group="HEX"><span>HEX</span><div class="l1ng-color-picker-inputs single"><input data-hex type="text" maxlength="7" spellcheck="false" autocapitalize="characters" aria-label="HEX 色碼"></div></div>
      <div class="l1ng-color-picker-field-row" data-group="RGB"><span>RGB</span><div class="l1ng-color-picker-inputs">
        <label>R<input data-r type="number" inputmode="numeric" min="0" max="255" aria-label="紅色 R"></label>
        <label>G<input data-g type="number" inputmode="numeric" min="0" max="255" aria-label="綠色 G"></label>
        <label>B<input data-b type="number" inputmode="numeric" min="0" max="255" aria-label="藍色 B"></label></div></div>
      <div class="l1ng-color-picker-field-row" data-group="HSL"><span>HSL</span><div class="l1ng-color-picker-inputs">
        <label>H<input data-h type="number" inputmode="numeric" min="0" max="360" aria-label="色相 H"></label>
        <label>S<input data-s type="number" inputmode="numeric" min="0" max="100" aria-label="飽和度 S"></label>
        <label>L<input data-l type="number" inputmode="numeric" min="0" max="100" aria-label="明度 L"></label></div></div>
    </div>
    <div class="l1ng-color-picker-tools">
      <button type="button" data-image-pick>${icon}<span>從圖片吸色</span></button>
      <button type="button" data-screen-pick>${icon}<span>螢幕吸色</span></button>
    </div>
    <div class="l1ng-color-picker-sampler" hidden>
      <canvas width="420" height="210" aria-label="在圖片上點擊吸色"></canvas>
      <div class="l1ng-color-picker-sampler-note">點擊圖片取色；沒有背景圖片時可選擇圖片。</div>
      <button type="button" data-choose-image>選擇圖片</button>
      <input data-image-file type="file" accept="image/*" hidden>
    </div>
  `;
  function position() {
    if(!active || !panel || panel.hidden) return;
    const rect=active.button.getBoundingClientRect();
    const vv=window.visualViewport;
    const leftLimit=vv?.offsetLeft || 0, topLimit=vv?.offsetTop || 0;
    const viewportWidth=vv?.width || innerWidth,viewportHeight=vv?.height || innerHeight;
    const width=Math.min(304,viewportWidth-24);
    panel.style.width=width+'px';
    panel.style.maxHeight=Math.max(180,viewportHeight-24)+'px';
    const height=panel.offsetHeight;
    const left=clamp(rect.left,leftLimit+12,leftLimit+viewportWidth-width-12);
    let top=rect.bottom+8;
    if(top+height>topLimit+viewportHeight-12 && rect.top-height-8>=topLimit+12) top=rect.top-height-8;
    top=clamp(top,topLimit+12,Math.max(topLimit+12,topLimit+viewportHeight-height-12));
    panel.style.left=left+'px';panel.style.top=top+'px';
  }
  function schedulePosition() {
    if(animationFrame)cancelAnimationFrame(animationFrame);
    animationFrame=requestAnimationFrame(() => {animationFrame=0;position();});
  }
  function draw(skipGroup=null) {
    if(!panel || !active) return;
    panel.querySelector('.l1ng-color-picker-sv').style.setProperty('--picker-hue',`hsl(${hsv.h} 100% 50%)`);
    const sv=panel.querySelector('.l1ng-color-picker-sv');
    const dot=panel.querySelector('.l1ng-color-picker-dot');
    dot.style.left=(hsv.s*100)+'%';dot.style.top=((1-hsv.v)*100)+'%';
    sv.setAttribute('aria-valuenow',String(Math.round(hsv.s*100)));
    panel.querySelector('.l1ng-color-picker-hue').value=String(Math.round(hsv.h));
    const values={hex:selectedHex,rgb:rgbFromHex(selectedHex),hsl:rgbToHsl(rgbFromHex(selectedHex))};
    if(skipGroup!=='HEX')panel.querySelector('[data-hex]').value=values.hex;
    if(skipGroup!=='RGB') ['r','g','b'].forEach((k,i)=>panel.querySelector('[data-'+k+']').value=values.rgb[i]);
    if(skipGroup!=='HSL') ['h','s','l'].forEach((k,i)=>panel.querySelector('[data-'+k+']').value=values.hsl[i]);
    panel.querySelectorAll('[aria-invalid="true"]').forEach(el => {
      if(el.closest('[data-group]')?.dataset.group!==skipGroup)el.removeAttribute('aria-invalid');
    });
  }
  function setHex(hex, skipGroup=null) {
    if(!active || !validHex(hex))return;
    selectedHex=hex.toUpperCase();hsv=rgbToHsv(rgbFromHex(selectedHex));
    const source=active.input;
    source.value=selectedHex;
    source.dispatchEvent(new Event('input',{bubbles:true}));
    refreshButton(source);
    draw(skipGroup);
  }
  function refreshButton(input) {
    const button=refs.get(input);
    if(button && validHex(input.value))button.style.setProperty('--color-value',input.value);
  }
  function sync() {ids.forEach(id=>{const input=document.getElementById(id);if(input)refreshButton(input);});if(active && active.input.value.toUpperCase()!==selectedHex){selectedHex=active.input.value.toUpperCase();hsv=rgbToHsv(rgbFromHex(selectedHex));draw();}}
  function close() {
    if(!active)return;
    active.button.setAttribute('aria-expanded','false');
    active=null;
    panel.hidden=true;
    panel.querySelector('.l1ng-color-picker-sampler').hidden=true;
  }
  function sampleAt(e,ctx,canvas) {
    if(!active||!ctx)return;
    const r=canvas.getBoundingClientRect();
    if(!r.width||!r.height)return;
    const x=Math.floor(clamp((e.clientX-r.left)/r.width,0,.99999)*canvas.width);
    const y=Math.floor(clamp((e.clientY-r.top)/r.height,0,.99999)*canvas.height);
    try{const pixels=ctx.getImageData(x,y,1,1).data;setHex(hexFromRgb([pixels[0],pixels[1],pixels[2]]));}catch(_){panel.querySelector('.l1ng-color-picker-sampler-note').textContent='無法讀取該圖片，請選擇本機圖片。';}
  }
  function paintImage(source) {
    const canvas=panel.querySelector('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)return;
    const img=new Image();if(typeof source==='string' && /^https?:/.test(source))img.crossOrigin='anonymous';
    img.onload=()=>{
      const ratio=Math.min(canvas.width/img.width,canvas.height/img.height);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#f5f7fa';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,(canvas.width-img.width*ratio)/2,(canvas.height-img.height*ratio)/2,img.width*ratio,img.height*ratio);
      panel.querySelector('.l1ng-color-picker-sampler-note').textContent='在圖片上點擊或拖曳即可吸色。';
      schedulePosition();
    };
    img.onerror=()=>{panel.querySelector('.l1ng-color-picker-sampler-note').textContent='無法載入背景圖片，請選擇本機圖片。';};
    img.src=source;
  }
  function backgroundImageUrl(){
    const bg=document.getElementById('appearanceBackgroundPreview');
    const v=bg?.style.backgroundImage || '';
    const match=v.match(/^url\(["']?(.*?)["']?\)$/);
    return match?match[1]:null;
  }
  function open(input,button) {
    if(active?.input===input){close();return;}
    close();
    if(!validHex(input.value))return;
    active={input,button};
    selectedHex=input.value.toUpperCase();hsv=rgbToHsv(rgbFromHex(selectedHex));
    panel.querySelector('.l1ng-color-picker-title').textContent='調整'+(button.getAttribute('aria-label') || '顏色').replace(/^調整/,'');
    button.setAttribute('aria-expanded','true');
    panel.hidden=false;draw();position();
  }
  function bindPanel() {
    panel=document.createElement('div');
    panel.className='l1ng-color-picker-popover';
    panel.hidden=true;panel.innerHTML=html;
    document.body.appendChild(panel);
    panel.querySelector('.l1ng-color-picker-close').addEventListener('click',close);
    const sv=panel.querySelector('.l1ng-color-picker-sv'),hue=panel.querySelector('.l1ng-color-picker-hue');
    const updatePoint=e=>{
      const b=sv.getBoundingClientRect();if(!b.width||!b.height)return;
      hsv.s=clamp((e.clientX-b.left)/b.width,0,1);
      hsv.v=1-clamp((e.clientY-b.top)/b.height,0,1);
      setHex(hexFromRgb(hsvToRgb(hsv)));
    };
    sv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;sv.setPointerCapture(e.pointerId);updatePoint(e);});
    sv.addEventListener('pointermove',e=>{if(sv.hasPointerCapture(e.pointerId))updatePoint(e);});
    sv.addEventListener('keydown',e=>{
      const delta=e.shiftKey?.1:.02;
      if(e.key==='ArrowLeft')hsv.s=clamp(hsv.s-delta,0,1);
      else if(e.key==='ArrowRight')hsv.s=clamp(hsv.s+delta,0,1);
      else if(e.key==='ArrowUp')hsv.v=clamp(hsv.v+delta,0,1);
      else if(e.key==='ArrowDown')hsv.v=clamp(hsv.v-delta,0,1);
      else return;
      e.preventDefault();setHex(hexFromRgb(hsvToRgb(hsv)));
    });
    hue.addEventListener('input',()=>{hsv.h=Number(hue.value);setHex(hexFromRgb(hsvToRgb(hsv)));});
    const parseGroup=group=>{
      if(group==='HEX'){const field=panel.querySelector('[data-hex]');const text=field.value.trim();const hex=text.startsWith('#')?text:'#'+text;field.setAttribute('aria-invalid',String(!validHex(hex)));return validHex(hex)?hex:null;}
      const keys=group==='RGB'?['r','g','b']:['h','s','l'];
      const values=keys.map(k=>{const field=panel.querySelector('[data-'+k+']');const v=Number(field.value),valid=field.value.trim()!==''&&Number.isInteger(v)&&v>=Number(field.min)&&v<=Number(field.max);field.setAttribute('aria-invalid',String(!valid));return valid?v:null;});
      if(values.some(v=>v===null))return null;
      return hexFromRgb(group==='RGB'?values:hslToRgb(...values));
    };
    panel.querySelectorAll('.l1ng-color-picker-fields input').forEach(field=>{
      const group=field.closest('[data-group]').dataset.group;
      field.addEventListener('input',()=>{const value=parseGroup(group);if(value)setHex(value,group);});
      field.addEventListener('blur',()=>{if(field.closest('[data-group]').querySelector('[aria-invalid="true"]'))draw();});
    });
    const sampler=panel.querySelector('.l1ng-color-picker-sampler');
    panel.querySelector('[data-image-pick]').addEventListener('click',()=>{
      sampler.hidden=!sampler.hidden;
      if(!sampler.hidden){const url=backgroundImageUrl();if(url)paintImage(url);else{sampler.querySelector('.l1ng-color-picker-sampler-note').textContent='尚未設定族譜背景圖片，請選擇圖片取色。';}}
      schedulePosition();
    });
    const inputFile=panel.querySelector('[data-image-file]');
    panel.querySelector('[data-choose-image]').addEventListener('click',()=>inputFile.click());
    inputFile.addEventListener('change',()=>{
      const file=inputFile.files?.[0];if(!file)return;
      const url=URL.createObjectURL(file);
      paintImage(url);
      inputFile.value='';
      window.setTimeout(()=>URL.revokeObjectURL(url),30000);
    });
    const canvas=sampler.querySelector('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
    canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;canvas.setPointerCapture(e.pointerId);sampleAt(e,ctx,canvas);});
    canvas.addEventListener('pointermove',e=>{if(canvas.hasPointerCapture(e.pointerId))sampleAt(e,ctx,canvas);});
    const screen=panel.querySelector('[data-screen-pick]');
    if(!('EyeDropper' in window) || !window.isSecureContext)screen.hidden=true;
    else screen.addEventListener('click',async()=>{try{const value=await new window.EyeDropper().open();setHex(value.sRGBHex);}catch(_){}});
    document.addEventListener('pointerdown',e=>{if(active && !panel.contains(e.target) && !active.button.contains(e.target))close();},true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.stopPropagation();close();}},true);
    window.addEventListener('resize',schedulePosition,{passive:true});
    document.addEventListener('scroll',schedulePosition,{capture:true,passive:true});
    window.visualViewport?.addEventListener('resize',schedulePosition,{passive:true});
    window.visualViewport?.addEventListener('scroll',schedulePosition,{passive:true});
  }
  function init() {
    bindPanel();
    ids.forEach(id=>{
      const input=document.getElementById(id);
      const button=document.querySelector('[data-color-for="'+id+'"]');
      if(!input || !button)return;
      refs.set(input,button);
      input.addEventListener('input',()=>refreshButton(input));
      button.addEventListener('click',()=>open(input,button));
      refreshButton(input);
    });
  }
  window.L1nGColorPicker={sync,close};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
