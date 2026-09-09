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
 setPointerCapture(id){this.pointer=id;}
 hasPointerCapture(id){return this.pointer===id;}
 releasePointerCapture(){this.pointer=null;}
 getBoundingClientRect(){return {width:480};}
 scrollIntoView(){this.scrolled=true;}
 contains(v){return v===this;}
}
const html=await readFile(new URL('lighting-lab.html',import.meta.url),'utf8'),nodes=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const ids=['moon','candle','incandescent','fluorescent','sun'];
const cards=ids.map(source=>Object.assign(new Element(),{dataset:{source}}));
const assign=ids.flatMap(source=>['left','right'].map(side=>Object.assign(new Element(),{dataset:{source,assign:side}})));
const presets=['left','right'].flatMap(side=>[100000,10000,5000,1000,100,10].map(lux=>Object.assign(new Element(),{dataset:{side,lux:String(lux)}})));
const countPresets=['left','right'].flatMap(side=>[1,3,10,30,50,100].map(count=>Object.assign(new Element(),{dataset:{side,count:String(count)}})));
const zones=['left','right'].map(side=>Object.assign(nodes.get(side+'-drop'),{dataset:{dropSide:side}}));
const roomCounts=[1,3,30,50,100].map(n=>Object.assign(new Element(),{dataset:{roomCount:String(n)}}));
const reaches=[.01,.00001].map(n=>Object.assign(new Element(),{dataset:{reach:String(n)}}));
const selectors={'[data-room-count]':roomCounts,'[data-reach]':reaches,'.source-card':cards,'[data-assign]':assign,'[data-lux]':presets,'[data-count]':countPresets,'[data-drop-side]':zones};
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
node('tab-guide').handlers.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(node('room-panel').hidden,false);node('tab-room').handlers.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(node('guide').hidden,true);assert.ok(node('tab-experiment').focused);
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

// Quick count actions update the same slider, illustrations, lux and render state.
for(const count of [1,3,10,30,50,100]){
 const button=countPresets.find(x=>x.dataset.side==='left'&&+x.dataset.count===count);button.onclick();
 assert.equal(node('left-count').value,count);assert.equal(node('left-count-icons').children.length,count);
 assert.equal(node('left-lux').textContent,count.toFixed(2));assert.equal(button.attrs['aria-pressed'],true);
 assert.equal(countPresets.filter(x=>x.dataset.side==='left'&&x.attrs['aria-pressed']).length,1);
 assert.equal(node('right-lux').textContent,'100,000');
}
node('left-count').oninput({target:{value:4}});assert.equal(countPresets.filter(x=>x.dataset.side==='left'&&x.attrs['aria-pressed']).length,0);
node('left-offset').oninput({target:{value:2}});assert.equal(node('left-offset-summary').value,'+2.0 stops');
node('reset').onclick();assert.equal(node('left-offset-summary').value,'+0.0 stops');
console.log('Quick count presets, slider synchronization, other-pane isolation and collapsed exposure summaries verified.');

// Window-room UI is independent of the original source experiment.
node('tab-room').onclick();assert.equal(node('room-panel').hidden,false);assert.equal(node('experiment-panel').hidden,true);
assert.equal(node('room-left-lux').textContent,'1,000 lx');assert.equal(node('room-right-lux').textContent,'1,001 lx');
const initialExposure=node('room-exposure').value;
reaches[1].onclick();assert.equal(node('room-left-lux').textContent,'1 lx');assert.equal(node('room-right-lux').textContent,'2 lx');assert.equal(node('room-exposure').value,initialExposure);
roomCounts[2].onclick();assert.equal(node('room-count').value,30);assert.equal(node('room-right-lux').textContent,'31 lx');
node('room-distance').oninput({target:{value:Math.log10(2)}});assert.equal(node('room-lamp-value').textContent,'7.5 lx');
node('room-window-on').onchange({target:{checked:false}});assert.ok(node('room-fit-window').disabled);assert.equal(node('room-left-lux').textContent,'0 lx');
node('room-lamp-on').onchange({target:{checked:false}});assert.ok(node('room-fit-total').disabled);assert.equal(node('room-change').textContent,'두 빛 모두 꺼짐');
node('room-reset').onclick();node('room-reach').oninput({target:{value:-5}});assert.equal(node('room-left-lux').textContent,'1 lx');
node('room-outside').onchange({target:{value:'moon'}});assert.equal(node('room-outdoor-out').value,'0.2 lx');node('room-fit-window').onclick();assert.ok(node('room-exposure').value>30&&node('room-exposure').value<=42);
assert.equal(node('left-name').textContent,'촛불');node('room-reset').onclick();node('tab-experiment').onclick();
console.log('Room controls, fixed shared exposure, additive lux, extreme slider values, independent tabs and zero-light behavior verified.');

const rc=node('room-right-canvas'),lc=node('room-left-canvas');
const beforeOrbit={lux:node('room-right-lux').textContent,exposure:node('room-exposure').value,count:node('room-count').value};
const pointer={pointerId:7,pointerType:'touch',isPrimary:true,button:0,clientX:100,clientY:100,preventDefault(){}};
rc.handlers.pointerdown(pointer);assert.equal(rc.pointer,7);assert.ok(lc.classList.contains('is-orbiting'));
rc.handlers.pointermove({...pointer,clientX:900,clientY:1000});
rc.handlers.pointercancel(pointer);assert.equal(rc.pointer,null);assert.ok(!lc.classList.contains('is-orbiting'));
assert.deepEqual({lux:node('room-right-lux').textContent,exposure:node('room-exposure').value,count:node('room-count').value},beforeOrbit);
lc.handlers.keydown({key:'ArrowLeft',preventDefault(){}});node('room-view-reset').onclick();assert.equal(node('room-right-lux').textContent,beforeOrbit.lux);
assert.ok(html.indexOf('<section class="room-exposure">')<html.indexOf('<div class="room-controls">'));
console.log('Pointer capture/cancel, shared drag feedback, keyboard orbit, lighting preservation and exposure placement verified.');

// Fit to the local contribution alone, while retaining both lights and one shared exposure.
node('room-reset').onclick();
node('room-fit-lamp').onclick();assert.equal(node('room-exposure').value,Math.log2(100000));
assert.equal(node('room-left-lux').textContent,'1,000 lx');assert.equal(node('room-right-lux').textContent,'1,001 lx');
node('room-count').oninput({target:{value:30}});node('room-distance').oninput({target:{value:Math.log10(2)}});
node('room-fit-lamp').onclick();assert.ok(Math.abs(node('room-exposure').value-Math.log2(100000/7.5))<1e-10);
const fittedLocal=node('room-exposure').value;node('room-window-on').onchange({target:{checked:false}});
assert.equal(node('room-exposure').value,fittedLocal);assert.equal(node('room-right-lux').textContent,'7.5 lx');
node('room-lamp-on').onchange({target:{checked:false}});assert.ok(node('room-fit-lamp').disabled);
node('room-fit-lamp').onclick();assert.equal(node('room-exposure').value,fittedLocal);
node('room-reset').onclick();assert.equal(node('room-fit-lamp').disabled,false);
console.log('Local-only exposure fitting, shared lighting preservation, count/distance calibration and disabled zero-light fit verified.');

// Small receiving fractions stay readable as decimals, including the reported 9.99e-3% case.
for(const [fraction,label] of [[0.0000999,'0.00999%'],[0.00001,'0.001%'],[0.0001,'0.01%'],[0.01,'1%'],[1,'100%']]){
 node('room-reach').oninput({target:{value:Math.log10(fraction)}});
 assert.equal(node('room-reach-out').value,label);assert.equal(node('room-reach').attrs['aria-valuetext'],label);
}
node('room-outdoor-lux').oninput({target:{value:-2}});node('room-reach').oninput({target:{value:-5}});
assert.equal(node('room-left-lux').textContent,'0.0000001 lx');
node('room-window-on').onchange({target:{checked:false}});assert.equal(node('room-left-lux').textContent,'0 lx');
console.log('Small percentages and minimum nonzero illuminance use decimal notation; zero remains distinct.');
