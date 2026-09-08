import assert from 'node:assert/strict';
import {roomDefaults,configureRoom,roomContributions} from './room-physics.mjs';
import {renderRoomPair} from './room-renderer.mjs';
import {linearDisplay,srgb,fitExposure} from './lighting-physics.mjs';
const base=roomDefaults(),r=roomContributions(base);
assert.equal(r.windowLux,1000);assert.equal(r.lampLux,1);assert.equal(r.totalLux,1001);assert.equal(r.increasePercent,.1);
const dark=configureRoom(base,{reach:.00001});assert.equal(roomContributions(dark).increasePercent,100);assert.equal(dark.exposure,base.exposure);
assert.equal(roomContributions(configureRoom(dark,{count:30,distance:2})).lampLux,7.5);
assert.equal(configureRoom(base,{outside:'moon'}).outdoorLux,.2);
assert.equal(configureRoom(base,{outside:'moon',outdoorLux:1}).outdoorLux,1);
for(const bad of [{distance:0},{count:101},{count:1.5},{reach:0},{outdoorLux:NaN},{outside:'candle'},{lamp:'sun'},{exposure:Infinity},{color:1},{bogus:true}])assert.throws(()=>configureRoom(base,bad));
assert.deepEqual(base,roomDefaults());
const zero=roomContributions(configureRoom(base,{windowOn:false,lampOn:false}));assert.equal(zero.totalLux,0);assert.equal(zero.increasePercent,null);assert.equal(zero.stopsAdded,null);
// Pixel data at the marked receiving surface agrees with the displayed photometry.
function canvas(){const ctx={frame:null,createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(f){this.frame=f.data;},strokeRect(){},fillRect(){},fillText(){}};return {ctx,getContext:()=>ctx};}
const left=canvas(),right=canvas(),pixel=(167*480+240)*4;
const cases=[configureRoom(base,{color:false}),configureRoom(dark,{color:false,exposure:fitExposure(1)}),configureRoom(base,{color:false,lampOn:false}),configureRoom(base,{color:false,windowOn:false,lampOn:false})];
for(const settings of cases){renderRoomPair(left,right,settings);const c=roomContributions(settings);for(const [view,lux] of [[left,c.windowLux],[right,c.totalLux]]){const expected=Math.round(255*srgb(linearDisplay(lux,.18,settings.exposure)));assert.equal(view.ctx.frame[pixel],expected);assert.equal(view.ctx.frame[pixel+1],expected);assert.equal(view.ctx.frame[pixel+2],expected);}}
assert.deepEqual(left.ctx.frame,right.ctx.frame);
renderRoomPair(left,right,configureRoom(base,{lampOn:false}));assert.deepEqual(left.ctx.frame,right.ctx.frame);
renderRoomPair(left,right,configureRoom(dark,{color:true,exposure:fitExposure(1)}));assert.ok(right.ctx.frame[pixel]>right.ctx.frame[pixel+2],'Warm candle color only in the added light');
console.log('Room photometry, validation, fixed exposure, zero-light states and renderer receiving-patch pixels verified.');
