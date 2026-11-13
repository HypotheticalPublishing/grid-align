import test from 'node:test';import assert from 'node:assert/strict';
import {boxAlignment} from '../scripts/core.mjs';
test('3x3 fit calculates one cell and anchors the chosen corner',()=>{assert.deepEqual(boxAlignment({x:120,y:150},{x:420,y:450}),{size:100,x:120,y:150});assert.deepEqual(boxAlignment({x:420,y:450},{x:120,y:150}),{size:100,x:120,y:150});});
test('3x3 uses horizontal span and preserves square cells in both vertical directions',()=>{assert.deepEqual(boxAlignment({x:120,y:450},{x:420,y:300}),{size:100,x:120,y:150});assert.deepEqual(boxAlignment({x:420,y:150},{x:120,y:155}),{size:100,x:120,y:150});});
test('3x3 rounds cell size before anchoring, avoiding accumulated thirds',()=>{assert.deepEqual(boxAlignment({x:500.2,y:500.2},{x:198.1,y:198.1}),{size:101,x:197,y:197});});
test('3x3 rejects tiny, invalid and out-of-range boxes',()=>{assert.throws(()=>boxAlignment({x:0,y:0},{x:3,y:3}),/SizeRange/);assert.throws(()=>boxAlignment({x:0,y:0},{x:150,y:150},75),/SizeRange/);assert.throws(()=>boxAlignment({x:0,y:0},{x:Infinity,y:0}),/Numbers/);assert.throws(()=>boxAlignment({x:0,y:0},{x:30003,y:30003}),/SizeRange/);});
