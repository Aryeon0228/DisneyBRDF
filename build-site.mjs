import {mkdir,copyFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {SOURCES,preset,illuminance,comparison,validateSettings,balancedColor,comparisonColors} from './light-sources.mjs';
import {candleLux,stopDifference,fitExposure,linearDisplay} from './lighting-physics.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} ≠ ${b}`);
near(candleLux(1,1),1);near(candleLux(1,2),.25);near(candleLux(4,2),1);
near(stopDifference(1,100000),16.609640474436812);
near(stopDifference(100000,1),-16.609640474436812);
near(linearDisplay(100000,.18,0),.18);
for(const lux of [.01,.25,1,10,100,10000,100000]) near(linearDisplay(lux,.18,fitExposure(lux)),.18);
assert.ok(linearDisplay(1,.18,0)<.000003);
assert.ok(linearDisplay(100000,.18,fitExposure(1))>.999);
near(illuminance(preset('moon')),.2);
near(illuminance(preset('incandescent')),800/(4*Math.PI));
near(illuminance(preset('incandescent')),illuminance(preset('fluorescent')));
near(illuminance({...preset('incandescent'),distance:2}),800/(16*Math.PI));
for (const a of Object.keys(SOURCES)) for (const b of Object.keys(SOURCES)) {
 const fixed=comparison(preset(a),preset(b),'shared',3);
 near(fixed.left.exposure,3);near(fixed.right.exposure,3);
 const auto=comparison(preset(a),preset(b),'individual',0);
 near(linearDisplay(auto.left.lux,.18,auto.left.exposure),.18);
 near(linearDisplay(auto.right.lux,.18,auto.right.exposure),.18);
}
for (const bad of [{leftSource:'invalid'},{rightDistance:0},{leftCount:1.5},{rightLux:NaN},{leftSource:['sun']},{extra:true},{leftExposureOffset:25},{rightExposureOffset:NaN}]) assert.throws(()=>validateSettings(bad));
validateSettings({leftSource:'moon',rightSource:'fluorescent',mode:'individual'});
const adjusted=comparison(preset('candle'),preset('sun'),'individual',2,{left:-1,right:3});
near(adjusted.left.exposure,fitExposure(1)+1);near(adjusted.right.exposure,5);near(adjusted.left.lux,1);
validateSettings({leftExposureOffset:-24,rightExposureOffset:24});
const Y=color=>.2126*color[0]+.7152*color[1]+.0722*color[2];
for(const id of Object.keys(SOURCES)){
 const neutralized=balancedColor(SOURCES[id].color,SOURCES[id].color);
 for(const channel of neutralized)near(channel,1);
 for(const wb of ['neutral','left','right']){
  const colors=comparisonColors(preset(id),preset('sun'),wb,true);
  near(Y(colors.left),1);near(Y(colors.right),1);
 }
}
const candleWhite=comparisonColors(preset('candle'),preset('sun'),'left',true);
assert.ok(candleWhite.right[2]>candleWhite.right[1]&&candleWhite.right[1]>candleWhite.right[0]);
const moonNeutral=comparisonColors(preset('moon'),preset('sun'),'neutral',true);
assert.ok(moonNeutral.left[2]>moonNeutral.left[0]);
assert.deepEqual(comparisonColors(preset('candle'),preset('moon'),'left',false),{left:[1,1,1],right:[1,1,1]});
assert.throws(()=>validateSettings({whiteBalance:'unknown'}));
const html=await readFile('lighting-lab.html','utf8');
const js=(await Promise.all(['lighting-lab.js','room-lab.mjs'].map(f=>readFile(f,'utf8')))).join('\n');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate element ids');
for(const match of js.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(match[1]),`Missing #${match[1]}`);
const files=['room-lab.mjs','room-physics.mjs','room-renderer.mjs','light-sources.mjs','lighting-lab.html','lighting-lab.css','lighting-lab.js','lighting-physics.mjs','brdf-viewer.html'];
await mkdir('dist/assets',{recursive:true});
for (const name of ['candle','sun','moon','incandescent','fluorescent']) {
 const bytes=await readFile(`assets/${name}.png`);
 assert.equal(bytes.subarray(1,4).toString(),'PNG',`Invalid ${name} asset`);
 await copyFile(`assets/${name}.png`,`dist/assets/${name}.png`);
}
for(const file of files)await copyFile(file,`dist/${file}`);
await copyFile('lighting-lab.html','dist/index.html');
console.log('Built static site. Physics, exposure calibration, and page references verified.');
