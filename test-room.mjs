import {bloomLinear} from './room-bloom.mjs';
import assert from 'node:assert/strict';
import {roomDefaults,configureRoom,roomContributions} from './room-physics.mjs';
import {renderRoomPair,roomCamera} from './room-renderer.mjs';
import {linearDisplay,srgb,fitExposure} from './lighting-physics.mjs';
const base={...roomDefaults(),reach:.01,exposure:Math.log2(100),bloom:false},r=roomContributions(base);
assert.equal(r.windowLux,1000);assert.equal(r.lampLux,1);assert.equal(r.totalLux,1001);assert.equal(r.increasePercent,.1);
const dark=configureRoom(base,{reach:.00001});assert.equal(roomContributions(dark).increasePercent,100);assert.equal(dark.exposure,base.exposure);
assert.equal(roomContributions(configureRoom(dark,{count:30,distance:2})).lampLux,7.5);
assert.equal(configureRoom(base,{outside:'moon'}).outdoorLux,.2);
assert.equal(configureRoom(base,{outside:'moon',outdoorLux:1}).outdoorLux,1);
for(const bad of [{distance:0},{count:101},{count:1.5},{reach:0},{outdoorLux:NaN},{outside:'candle'},{lamp:'sun'},{exposure:Infinity},{color:1},{bogus:true}])assert.throws(()=>configureRoom(base,bad));
assert.equal(base.reach,.01);assert.equal(base.bloom,false);
const zero=roomContributions(configureRoom(base,{windowOn:false,lampOn:false}));assert.equal(zero.totalLux,0);assert.equal(zero.increasePercent,null);assert.equal(zero.stopsAdded,null);
// Pixel data at the marked receiving surface agrees with the displayed photometry.
function canvas(){const ctx={frame:null,createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(f){this.frame=f.data;},strokeRect(){},setLineDash(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fillRect(){},fillText(){}};return {ctx,getContext:()=>ctx};}
const left=canvas(),right=canvas(),pixel=(167*480+240)*4;
const cases=[configureRoom(base,{color:false}),configureRoom(dark,{color:false,exposure:fitExposure(1)}),configureRoom(base,{color:false,lampOn:false}),configureRoom(base,{color:false,windowOn:false,lampOn:false})];
for(const settings of cases){renderRoomPair(left,right,settings);const c=roomContributions(settings);for(const [view,lux] of [[left,c.windowLux],[right,c.totalLux]]){const expected=Math.round(255*srgb(linearDisplay(lux,.18,settings.exposure)));assert.equal(view.ctx.frame[pixel],expected);assert.equal(view.ctx.frame[pixel+1],expected);assert.equal(view.ctx.frame[pixel+2],expected);}}
assert.deepEqual(left.ctx.frame,right.ctx.frame);
renderRoomPair(left,right,configureRoom(base,{lampOn:false}));assert.deepEqual(left.ctx.frame,right.ctx.frame);
renderRoomPair(left,right,configureRoom(dark,{color:true,exposure:fitExposure(1)}));assert.ok(right.ctx.frame[pixel]>right.ctx.frame[pixel+2],'Warm candle color only in the added light');
console.log('Room photometry, validation, fixed exposure, zero-light states and renderer receiving-patch pixels verified.');

// Camera rotations preserve photometry, change geometry, and remain shared across panes.
const initialCamera=roomCamera(base);assert.ok(Math.abs(initialCamera.cam[1]-2.8)<1e-10);assert.ok(Math.abs(initialCamera.cam[2]+5)<1e-10);
renderRoomPair(left,right,base);const initialFrame=left.ctx.frame.slice();
for(const viewYaw of [-180,-90,90,180]){
 const settings=configureRoom(base,{viewYaw,viewPitch:35,lampOn:false});
 assert.deepEqual(roomContributions({...settings,lampOn:true}),r);
 renderRoomPair(left,right,settings);assert.deepEqual(left.ctx.frame,right.ctx.frame);
 assert.notDeepEqual(left.ctx.frame,initialFrame);
}
renderRoomPair(left,right,base,true);assert.equal(left.width,240);assert.equal(right.height,160);
renderRoomPair(left,right,base);assert.equal(left.width,480);assert.deepEqual(left.ctx.frame,initialFrame);
for(const bad of [{viewYaw:NaN},{viewYaw:181},{viewPitch:0},{viewPitch:76}])assert.throws(()=>configureRoom(base,bad));
console.log('Shared orbit, camera reset, adaptive resolution and view-independent illuminance verified.');

const starting=roomDefaults(),startLux=roomContributions(starting);
assert.equal(startLux.windowLux,3);assert.equal(startLux.totalLux,4);assert.equal(starting.exposure,fitExposure(4));
renderRoomPair(left,right,{...starting,bloom:false,color:false});assert.ok(right.ctx.frame[pixel]-left.ctx.frame[pixel]>=10,'Starting patch shows a visible change');
renderRoomPair(left,right,{...starting,bloom:false});const noBloom=left.ctx.frame.slice(),noBloomRight=right.ctx.frame.slice();
renderRoomPair(left,right,starting);assert.notDeepEqual(left.ctx.frame,noBloom);assert.notDeepEqual(right.ctx.frame,noBloomRight);
assert.deepEqual(roomContributions({...starting,bloom:false}),startLux);
renderRoomPair(left,right,{...starting,lampOn:false});assert.deepEqual(left.ctx.frame,right.ctx.frame);
renderRoomPair(left,right,{...starting,lampOn:false,windowOn:false});assert.deepEqual(left.ctx.frame,right.ctx.frame);const darkBloom=left.ctx.frame.slice();renderRoomPair(left,right,{...starting,lampOn:false,windowOn:false,bloom:false});assert.deepEqual(left.ctx.frame,darkBloom);
renderRoomPair(left,right,{...starting,bloom:false});assert.deepEqual(left.ctx.frame,noBloom);
assert.throws(()=>configureRoom(starting,{bloom:1}));
console.log('Candle-readable default, optional bloom, unchanged lux, equal lighting and zero-light output verified.');

const low=new Float32Array(15*15*3).fill(.2);assert.deepEqual(bloomLinear(low,15,15),low);
const highlight=new Float32Array(15*15*3);highlight.set([20,10,5],(7*15+7)*3);
const glow=bloomLinear(highlight,15,15),adjacent=(7*15+8)*3;
assert.ok(glow[adjacent]>glow[adjacent+1]&&glow[adjacent+1]>glow[adjacent+2]);assert.equal(glow[0],0);
assert.equal(highlight[adjacent],0);assert.ok(glow.every(Number.isFinite));
console.log('Bloom threshold, bounded spatial spread and highlight color verified.');
