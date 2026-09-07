import {candleLux,stopDifference,fitExposure,linearDisplay,srgb} from './lighting-physics.mjs';
const $=id=>document.getElementById(id);
const inputs=['candles','distance','daylight','reflectance','exposure','warm'];
let mode='shared';
const fmt=x=>x>=1000?Math.round(x).toLocaleString('en-US'):x>=10?x.toFixed(1):x.toFixed(2);
const signed=x=>(x>=0?'+':'')+x.toFixed(1);
function read(){return {count:+$('candles').value,distance:10**+$('distance').value,sun:10**+$('daylight').value,rho:+$('reflectance').value/100,exposure:+$('exposure').value,warm:$('warm').checked,mode};}
// Analytic ray / sphere and plane intersection. Both panes share the same irradiance field.
// The distance control changes reference illuminance, not the direction field across the sphere.
const W=520,H=390,normal=[-.5,.7,.5099019513592785];
const geometry=new Float32Array(W*H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const px=(x/W-.5)*4.5, py=(.53-y/H)*3.375, z2=1-px*px-py*py;
 let shade=0;
 if(z2>=0){shade=Math.max(0,px*normal[0]+py*normal[1]+Math.sqrt(z2)*normal[2]);}
 else if(py<-.99){
  // Ground-plane study; projected contact shadow is a diagrammatic approximation.
  const depth=(-py-1)*2.6, sx=px-.5*depth, shadow=Math.exp(-(sx*sx*2.5+depth*depth*1.7));
  shade=normal[1]*(1-.92*shadow)*Math.max(0,1-depth*.35);
 }
 geometry[y*W+x]=shade;
}
function render(id,lux,rho,stops,warm){
 const canvas=$(id),ctx=canvas.getContext('2d'); if(!ctx)return;
 const frame=ctx.createImageData(W,H),raw=warm?[1,.47,.16]:[1,1,1];
 const luminance=.2126*raw[0]+.7152*raw[1]+.0722*raw[2],rgb=raw.map(c=>c/luminance);
 for(let i=0;i<W*H;i++){
  const E=lux*geometry[i],k=i*4;
  for(let c=0;c<3;c++)frame.data[k+c]=Math.round(255*Math.min(1,srgb(linearDisplay(E*rgb[c],rho,stops))));
  frame.data[k+3]=255;
 }
 ctx.putImageData(frame,0,0);
 // Reference chips are calculated receiving surfaces, not a decorative brightness gradient.
 const chipRho=[.04,.18,.8],chipWidth=42,start=W/2-75;
 chipRho.forEach((r,i)=>{
 const color=rgb.map(c=>Math.round(255*Math.min(1,srgb(linearDisplay(lux*c,r,stops)))));
 ctx.fillStyle=`rgb(${color.join(',')})`;ctx.fillRect(start+i*54,H-42,chipWidth,15);
 });
}
let queued=false;
function update(){
 const s=read(),c=candleLux(s.count,s.distance),diff=stopDifference(c,s.sun),cExp=mode==='individual'?fitExposure(c):s.exposure,sExp=mode==='individual'?fitExposure(s.sun):s.exposure;
 $('candles-out').value=s.count+'개';$('distance-out').value=s.distance.toFixed(2)+' m';$('daylight-out').value=fmt(s.sun)+' lx';$('reflectance-out').value=Math.round(s.rho*100)+'%';$('exposure-out').value=mode==='individual'?'각각 자동 조정':signed(s.exposure)+' stops';
 $('distance').setAttribute('aria-valuetext',s.distance.toFixed(2)+'미터');$('daylight').setAttribute('aria-valuetext',fmt(s.sun)+'럭스');
 $('candle-lux').textContent=fmt(c);$('sun-lux').textContent=fmt(s.sun);
 $('shared').setAttribute('aria-pressed',mode==='shared');$('individual').setAttribute('aria-pressed',mode==='individual');$('exposure').disabled=mode==='individual';
 $('candle-exposure').textContent=signed(cExp)+' stops';$('sun-exposure').textContent=signed(sExp)+' stops';
 $('stops').textContent=Math.abs(diff).toFixed(2);
 const ratio=2**Math.abs(diff),source=diff>=0?'햇빛':'촛불';
 $('ratio-text').replaceChildren();
 if(Math.abs(diff)<.000001){$('ratio-text').textContent='두 측정면의 조도가 같습니다.';}
 else {const strong=document.createElement('strong');strong.textContent=fmt(ratio)+'배';$('ratio-text').append(source+'이 ',strong,' 강합니다.');}
 $('takeaway').textContent=mode==='individual'?'비슷하게 보여도 조도는 다릅니다. 각 그림 위의 노출 보정값을 비교해보세요.':'노출을 올려도 두 빛의 물리적인 비율은 바뀌지 않습니다.';
 const status=(lux,ev)=>{const l=linearDisplay(lux,s.rho,ev);return l<.001?'현재 노출에서 반사광이 거의 보이지 않습니다.':l>.95?'하이라이트가 흰색에 가까워집니다.':mode==='individual'?'조명별 18% 회색 기준으로 노출을 맞췄습니다.':'동일한 노출과 반사율로 비교 중입니다.';};
 $('candle-status').textContent=status(c,cExp);$('sun-status').textContent=status(s.sun,sExp);
 $('exposure-note').textContent=mode==='individual'?'독립 노출 · 물리적 조도는 그대로 유지':'기준: 100,000 lx / 반사율 18%';
 $('candle-marker').style.left=((Math.log10(c)+2)/7*100)+'%';$('sun-marker').style.left=((Math.log10(s.sun)+2)/7*100)+'%';
 document.querySelectorAll('[data-lux]').forEach(b=>b.classList.toggle('selected',Math.abs(Math.log10(+b.dataset.lux)-Math.log10(s.sun))<.001));
 if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;const v=read(),cl=candleLux(v.count,v.distance);render('candle-canvas',cl,v.rho,mode==='individual'?fitExposure(cl):v.exposure,v.warm);render('sun-canvas',v.sun,v.rho,mode==='individual'?fitExposure(v.sun):v.exposure,false);});}
 return {candleLux:c,sunLux:s.sun,stopsDifference:diff,candleExposure:cExp,sunExposure:sExp,mode};
}
inputs.forEach(id=>$(id).addEventListener('input',update));
$('shared').onclick=()=>{mode='shared';update();};$('individual').onclick=()=>{mode='individual';update();};
$('fit-sun').onclick=()=>{mode='shared';$('exposure').value=fitExposure(read().sun);update();};
$('fit-candle').onclick=()=>{mode='shared';const s=read();$('exposure').value=fitExposure(candleLux(s.count,s.distance));update();};
document.querySelectorAll('[data-lux]').forEach(b=>b.onclick=()=>{$('daylight').value=Math.log10(+b.dataset.lux);update();});
$('reset').onclick=()=>{mode='shared';Object.entries({candles:1,distance:0,daylight:5,reflectance:18,exposure:0}).forEach(([id,v])=>$(id).value=v);$('warm').checked=true;update();};
update();
// Optional WebMCP entry point, using the same controls and update path as the page.
const context=document.modelContext;
if(context?.registerTool){
 const lifecycle=new AbortController();
 const limits={candles:[1,100],distanceMeters:[.1,10],sunLux:[1,100000],reflectancePercent:[4,80],exposureStops:[-6,24]};
 try{Promise.resolve(context.registerTool({name:'configure_light_comparison',description:'Configure candle and daylight illuminance and exposure in the visible Light Lab.',inputSchema:{type:'object',properties:{candles:{type:'integer',minimum:1,maximum:100},distanceMeters:{type:'number',minimum:.1,maximum:10},sunLux:{type:'number',minimum:1,maximum:100000},reflectancePercent:{type:'number',minimum:4,maximum:80},exposureStops:{type:'number',minimum:-6,maximum:24},mode:{type:'string',enum:['shared','individual']}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Expected an object');
 for(const [key,value] of Object.entries(input)){
 if(key==='mode'){if(!['shared','individual'].includes(value))throw new Error('Invalid exposure mode');}
 else{const range=limits[key];if(!range||typeof value!=='number'||!Number.isFinite(value)||value<range[0]||value>range[1]||(key==='candles'&&!Number.isInteger(value)))throw new Error('Invalid '+key);}
 }
 const mapping={candles:'candles',distanceMeters:'distance',sunLux:'daylight',reflectancePercent:'reflectance',exposureStops:'exposure'};
 for(const [key,value] of Object.entries(input)){if(key==='mode')mode=value;else $(mapping[key]).value=['distanceMeters','sunLux'].includes(key)?Math.log10(value):value;}
 const result=update();await new Promise(requestAnimationFrame);return result;
 }},{signal:lifecycle.signal})).catch(()=>{});}catch{}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
