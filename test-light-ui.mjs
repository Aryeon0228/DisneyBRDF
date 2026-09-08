// Exercise the actual UI event handlers without a browser dependency.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
class Element {
 constructor(){this.style={};this.dataset={};this.handlers={};this.attrs={};this.children=[];this.textContent='';this.value='';this.hidden=false;const classes=new Set();this.classList={add:(...c)=>c.forEach(v=>classes.add(v)),remove:(...c)=>c.forEach(v=>classes.delete(v)),contains:c=>classes.has(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)};}
 addEventListener(t,fn){this.handlers[t]=fn;}
 setAttribute(k,v){this.attrs[k]=v;}
 querySelector(){return this.child??=new Element();}
 replaceChildren(){this.children=[];this.textContent='';}
 append(...values){this.children.push(...values);this.textContent+=values.map(v=>typeof v==='string'?v:v.textContent).join('');}
 focus(){this.focused=true;}
 scrollIntoView(){this.scrolled=true;}
 contains(v){return v===this;}
}
const html=await readFile(new URL('lighting-lab.html',import.meta.url),'utf8'),nodes=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const ids=['moon','candle','incandescent','fluorescent','sun'];
const cards=ids.map(source=>Object.assign(new Element(),{dataset:{source}}));
const assign=ids.flatMap(source=>['left','right'].map(side=>Object.assign(new Element(),{dataset:{source,assign:side}})));
const presets=['left','right'].flatMap(side=>[100000,10000,5000,1000,100,10].map(lux=>Object.assign(new Element(),{dataset:{side,lux:String(lux)}})));
const zones=['left','right'].map(side=>Object.assign(nodes.get(side+'-drop'),{dataset:{dropSide:side}}));
const selectors={'.source-card':cards,'[data-assign]':assign,'[data-lux]':presets,'[data-drop-side]':zones};
globalThis.document={getElementById:id=>{assert.ok(nodes.has(id),'Unknown DOM id '+id);return nodes.get(id);},querySelectorAll:s=>{assert.ok(selectors[s],'Unknown selector '+s);return selectors[s];},createElement:()=>new Element(),addEventListener(){}};
globalThis.requestAnimationFrame=()=>0;
await import('./lighting-lab.js');
const node=id=>nodes.get(id);
const drag=source=>{const data=new Map(),e={dataTransfer:{setData:(k,v)=>data.set(k,v),getData:k=>data.get(k)||''},preventDefault(){this.prevented=true;}};cards.find(c=>c.dataset.source===source).handlers.dragstart(e);return e;};
assert.equal(node('left-name').textContent,'촛불');assert.equal(node('right-name').textContent,'햇빛');
let event=drag('moon');zones[1].handlers.dragover(event);assert.ok(event.prevented);zones[1].handlers.drop(event);assert.equal(node('right-name').textContent,'달빛');assert.equal(node('right-lux').textContent,'0.20');assert.ok(node('right-point').hidden);
assign.find(x=>x.dataset.source==='incandescent'&&x.dataset.assign==='left').onclick();
assign.find(x=>x.dataset.source==='fluorescent'&&x.dataset.assign==='right').onclick();
assert.equal(node('left-lux').textContent,'63.66');assert.equal(node('right-lux').textContent,'63.66');assert.equal(node('stops').textContent,'0.00');assert.equal(node('ratio-text').textContent,'두 측정면의 조도가 같습니다.');
node('left-distance').oninput({target:{value:Math.log10(2)}});assert.equal(node('left-lux').textContent,'15.92');
event=drag('sun');cards.find(x=>x.dataset.source==='sun').handlers.dragend();zones[0].handlers.drop(event);assert.equal(node('left-name').textContent,'백열등');
event=drag('moon');event.dataTransfer.setData('application/x-penumbra-source','invalid');zones[0].handlers.drop(event);assert.equal(node('left-name').textContent,'백열등');
event=drag('candle');zones[0].handlers.drop(event);assert.equal(node('left-lux').textContent,'1.00');assert.equal(node('left-distance').value,0);
node('individual').onclick();assert.equal(node('exposure').disabled,false);assert.equal(node('individual').attrs['aria-pressed'],true);
node('reset').onclick();assert.equal(node('left-name').textContent,'촛불');assert.equal(node('right-name').textContent,'햇빛');assert.equal(node('stops').textContent,'16.61');assert.equal(node('exposure').disabled,false);
console.log('UI handler checks passed: drop, click assignment, distance, cancel, invalid payload, per-source reset, exposure and full reset.');

node('wb-left').onclick();assert.equal(node('wb-left').attrs['aria-pressed'],true);assert.equal(node('left-lux').textContent,'1.00');assert.equal(node('stops').textContent,'16.61');
node('warm').onchange({target:{checked:false}});assert.ok(node('wb-left').disabled);assert.match(node('color-status').textContent,/밝기만/);
node('tab-guide').onclick();assert.equal(node('guide').hidden,false);assert.equal(node('experiment-panel').hidden,true);assert.equal(node('tab-guide').attrs['aria-selected'],true);
node('tab-guide').handlers.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(node('guide').hidden,true);assert.ok(node('tab-experiment').focused);
node('color-help').onclick();assert.ok(node('color-guide').scrolled);assert.equal(node('guide').hidden,false);
node('back-experiment').onclick();assert.equal(node('guide').hidden,true);
node('reset').onclick();assert.equal(node('wb-neutral').attrs['aria-pressed'],true);assert.equal(node('wb-left').disabled,false);
console.log('White balance controls, disabled color state, explanation tabs, keyboard navigation, help and reset verified.');

// Common brightness remains additive in auto mode; individual controls affect only their pane.
node('individual').onclick();
assert.equal(node('left-exposure').textContent,'+16.6 stops');
assert.equal(node('right-exposure').textContent,'+0.0 stops');
node('exposure').oninput({target:{value:2}});
assert.equal(node('left-exposure').textContent,'+18.6 stops');
assert.equal(node('right-exposure').textContent,'+2.0 stops');
node('left-offset').oninput({target:{value:-1}});
assert.equal(node('left-exposure').textContent,'+17.6 stops');
assert.equal(node('right-exposure').textContent,'+2.0 stops');
assert.equal(node('left-lux').textContent,'1.00');assert.equal(node('stops').textContent,'16.61');
node('left-offset-reset').onclick();assert.equal(node('left-exposure').textContent,'+18.6 stops');
node('right-offset').oninput({target:{value:3}});
node('shared').onclick();assert.equal(node('left-exposure').textContent,'+2.0 stops');assert.equal(node('right-exposure').textContent,'+2.0 stops');
node('left-offset').oninput({target:{value:16.6}});assert.equal(node('shared').attrs['aria-pressed'],false);
node('fit-left').onclick();assert.equal(node('left-exposure').textContent,'+16.6 stops');assert.equal(node('right-exposure').textContent,'+16.6 stops');assert.equal(node('left-offset').value,0);
node('reset').onclick();assert.equal(node('left-offset').value,0);assert.equal(node('right-offset').value,0);assert.equal(node('exposure').value,0);
console.log('Additive common brightness, isolated per-pane adjustments, unchanged lux, fit and resets verified.');

// Icon counts follow the actual source count, including maximum and source reset.
for(const count of [3,100,1]){
 node('left-count').oninput({target:{value:count}});
 assert.equal(node('left-count-icons').children.length,count);
 assert.equal(node('left-count-icons').attrs['aria-label'],'촛불 '+count+'개');
 assert.equal(node('left-lux').textContent,count.toFixed(2));
}
assign.find(x=>x.dataset.source==='fluorescent'&&x.dataset.assign==='left').onclick();
assert.equal(node('left-count-icons').children.length,1);
assert.equal(node('left-count-icons').children[0].src,'assets/fluorescent.png');
assert.equal(node('left-settings-art').src,'assets/fluorescent.png');
assert.equal(node('wb-left-art').src,'assets/fluorescent.png');
for(const lux of [100000,10000,5000,1000,100,10]){
 const button=presets.find(x=>x.dataset.side==='right'&&+x.dataset.lux===lux);button.onclick();
 assert.equal(button.attrs['aria-pressed'],true);
 assert.equal(presets.filter(x=>x.dataset.side==='right'&&x.attrs['aria-pressed']).length,1);
 assert.equal(node('right-illuminance').value,Math.log10(lux));
}
assert.match(node('right-condition').textContent,/어두운 실내/);
node('right-illuminance').oninput({target:{value:Math.log10(250)}});
assert.equal(presets.filter(x=>x.dataset.side==='right'&&x.attrs['aria-pressed']).length,0);
assert.match(node('right-condition').textContent,/직접 설정/);
assign.find(x=>x.dataset.source==='sun'&&x.dataset.assign==='left').onclick();
assert.equal(node('left-count-icons').children.length,0);assert.equal(node('left-point').hidden,true);
presets.find(x=>x.dataset.side==='left'&&+x.dataset.lux===5000).onclick();assert.match(node('left-condition').textContent,/구름/);
assign.find(x=>x.dataset.source==='moon'&&x.dataset.assign==='right').onclick();
presets.find(x=>x.dataset.side==='right'&&+x.dataset.lux===100000).onclick();assert.equal(node('right-lux').textContent,'0.20');
node('reset').onclick();assert.equal(node('left-count-icons').children.length,1);assert.equal(node('right-sun-presets').hidden,false);
console.log('Source icons, exact 1–100 counts, all six daylight choices on either side, custom lux and source switching verified.');

// Physical ruler endpoints remain linear while the distance input is logarithmic.
for(const distance of [.1,1,1.7,10]){
 node('left-distance').oninput({target:{value:Math.log10(distance)}});
 const endpoint=Number(node('left-distance-ray').attrs.x2);
 assert.ok(Math.abs((endpoint-80)/68-distance/1.7)<1e-10,'Distance relative to the 170 cm person');
 assert.match(node('left-distance-diagram').attrs['aria-label'],new RegExp(distance.toFixed(2)+'미터'));
 assert.equal(node('left-distance-value').textContent,distance.toFixed(2)+' m');
}
node('left-count').oninput({target:{value:3}});assert.equal(node('left-distance-source-label').textContent,'촛불 × 3');
assign.find(x=>x.dataset.source==='incandescent'&&x.dataset.assign==='right').onclick();
node('right-distance').oninput({target:{value:Math.log10(2)}});
assert.equal(node('right-distance-art').attrs.href,'assets/incandescent.png');
assert.equal(node('right-distance-ray').attrs.x2,160);
assign.find(x=>x.dataset.source==='moon'&&x.dataset.assign==='right').onclick();assert.ok(node('right-point').hidden);
node('reset').onclick();assert.equal(node('left-distance-ray').attrs.x2,120);assert.equal(node('left-distance-art').attrs.href,'assets/candle.png');
assert.equal(node('left-distance-value').textContent,'1.00 m');
console.log('Distance ruler scale, limits, per-side source artwork, count caption and reset verified.');
