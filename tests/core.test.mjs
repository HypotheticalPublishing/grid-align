import test from 'node:test';
import assert from 'node:assert/strict';
import {AlignmentSession,validate,nudge,drag,operations} from '../scripts/core.mjs';
function fixture(){
 const s={grid:{size:100,type:1,color:'#333333',alpha:0},width:2000,height:1200,padding:.1,shiftX:0,shiftY:0};
 const l={background:{src:'https://assets.example.com/maps/map.webp?token=preserve'},foreground:{src:'canopy.webp'},textures:{offsetX:12,offsetY:-7,scaleX:1,scaleY:1}};
 const dims=(size)=>({sceneX:Math.ceil(s.padding*s.width/size)*size-s.shiftX,sceneY:Math.ceil(s.padding*s.height/size)*size-s.shiftY});
 const scene={_source:s,getDimensions:()=>dims(s.grid.size),clone:patch=>({getDimensions:()=>dims(patch['grid.size'])}),id:'scene',toObject:()=>structuredClone(s)},level={id:'level',toObject:()=>structuredClone(l)};let writes=0;
 const session=new AlignmentSession({scene,level,guard:()=>{},save:async ops=>{writes++;for(const op of ops){assert.equal(op.documentName,'Scene');for(const [key,value] of Object.entries(op.updates[0])){if(key==='_id')continue;const parts=key.split('.');let target=s;for(const part of parts.slice(0,-1))target=target[part]??={};target[parts.at(-1)]=structuredClone(value);}}}});

 return {scene,level,session,s,l,writes:()=>writes};
}
test('No writes during 1000 alternating nudges; no drift',()=>{
 const {session,writes}=fixture(),original={...session.draft};
 for(let i=0;i<1000;i++){session.set(nudge(session.draft,1,-1));session.set(nudge(session.draft,-1,1));}
 assert.deepEqual(session.draft,original);assert.equal(writes(),0);assert.equal(session.dirty,false);
});
test('Drag uses its start snapshot and rounds only the final scene displacement',()=>{
 const v={size:100,x:5,y:-10},start={x:20,y:30};
 assert.deepEqual(drag(v,start,{x:24.6,y:28.6}),{size:100,x:10,y:-11});
 assert.deepEqual(drag(v,start,start),v);
});
test('Rejects nonfinite, empty, fractional and out-of-bounds values',()=>{
 for(const v of [{size:49,x:0,y:0},{size:'',x:0,y:0},{size:Infinity,x:0,y:0},{size:100,x:1.5,y:0},{size:100,x:1000001,y:0}])assert.throws(()=>validate(v));
 assert.deepEqual(validate({size:'100',x:'-3',y:'0'}),{size:100,x:-3,y:0});
});
test('Batch contains only scene grid settings and no Level writes',async()=>{
 const f=fixture(),source=f.l.background.src;
 f.session.set({size:110,x:20,y:-10});
 const ops=operations(f.scene,f.level,f.session.base.value,f.session.draft);
 assert.equal(ops.length,1);assert.equal(ops[0].updates[0]['grid.size'],110);
 assert.deepEqual(ops[0].updates[0]['flags.grid-align.origin'],{x:20,y:-10});
 await f.session.apply();assert.equal(f.writes(),1);assert.equal(f.s.grid.alpha,0);assert.equal(f.l.background.src,source);assert.equal(f.s.width,2000);
});
test('Reset preserves original grid origin without writes',()=>{
 const f=fixture();f.session.set({size:200,x:10,y:20});f.session.reset();assert.deepEqual(f.session.draft,{size:100,x:0,y:0});assert.equal(f.writes(),0);
});
test('Unchanged apply does not write',async()=>{const f=fixture();assert.equal(await f.session.apply(),false);assert.equal(f.writes(),0);});
test('Changed geometry or image rejects stale drafts',async()=>{
 for(const mutate of [f=>f.s.grid.size++,f=>f.l.background.src='new.png',f=>f.s.padding=.2]){
  const f=fixture();f.session.set({size:120,x:0,y:0});mutate(f);await assert.rejects(f.session.apply(),/Conflict/);assert.equal(f.writes(),0);
 }
});
test('Permission checks are repeated at save',async()=>{const f=fixture();f.session.guard=()=>{throw Error('GMOnly');};await assert.rejects(f.session.apply(),/GMOnly/);assert.equal(f.writes(),0);});
test('Failed save retains draft and allows retry; silent cancellation is not success',async()=>{
 const f=fixture();f.session.set({size:120,x:0,y:0});f.session.save=async()=>{throw Error('Network');};
 await assert.rejects(f.session.apply(),/Network/);assert.equal(f.session.busy,false);assert.equal(f.session.draft.size,120);
 f.session.save=async()=>{};await assert.rejects(f.session.apply(),/NotSaved/);assert.equal(f.session.base.value.size,100);
});
test('Concurrent apply is rejected without a second save',async()=>{
 const f=fixture();f.session.set({size:120,x:0,y:0});let finish;
 f.session.save=async()=>new Promise(resolve=>{finish=()=>{f.s.grid.size=120;f.s.flags={'grid-align':{origin:{x:0,y:0}}};resolve();};});
 const first=f.session.apply();await assert.rejects(f.session.apply(),/Busy/);assert.throws(()=>f.session.set({size:130,x:0,y:0}),/Busy/);finish();await first;
});


test('Grid-only alignment does not read or write texture offsets',async()=>{
 const f=fixture(),original=structuredClone(f.l);const before=f.scene.getDimensions();
 f.session.set({size:137,x:29,y:-16});await f.session.apply();
 assert.deepEqual(f.l,original);assert.deepEqual(f.scene.getDimensions(),before);
 assert.deepEqual(f.s.flags['grid-align'].origin,{x:29,y:-16});
});
test('Saved origin reloads, remains independent of background, and detects conflicts',()=>{
 const f=fixture();f.s.flags={'grid-align':{origin:{x:37,y:-20}}};
 const session=new AlignmentSession({scene:f.scene,level:f.level,guard:()=>{},save:async()=>{}});
 assert.deepEqual(session.draft,{size:100,x:37,y:-20});
 f.s.flags['grid-align'].origin.x++;assert.throws(()=>session.check(),/Conflict/);
});
