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
 contains(v){return v===this;}
}
const html=await readFile(new URL('lighting-lab.html',import.meta.url),'utf8'),nodes=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const ids=['moon','candle','incandescent','fluorescent','sun'];
const cards=ids.map(source=>Object.assign(new Element(),{dataset:{source}}));
const assign=ids.flatMap(source=>['left','right'].map(side=>Object.assign(new Element(),{dataset:{source,assign:side}})));
const presets=['left','right'].flatMap(side=>[100000,10000,100].map(lux=>Object.assign(new Element(),{dataset:{side,lux:String(lux)}})));
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
node('individual').onclick();assert.ok(node('exposure').disabled);assert.equal(node('individual').attrs['aria-pressed'],true);
node('reset').onclick();assert.equal(node('left-name').textContent,'촛불');assert.equal(node('right-name').textContent,'햇빛');assert.equal(node('stops').textContent,'16.61');assert.equal(node('exposure').disabled,false);
console.log('UI handler checks passed: drop, click assignment, distance, cancel, invalid payload, per-source reset, exposure and full reset.');
