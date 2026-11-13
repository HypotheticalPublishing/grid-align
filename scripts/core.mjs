import {savedOrigin} from './runtime.mjs';
export const ID='grid-align';
export const MAX_SIZE=10000;
export function validate(value,minSize=50) {
 const v={size:Number(value.size),x:Number(value.x),y:Number(value.y)};
 if(Object.values(value).some(x=>typeof x==='string'&&!x.trim()))throw Error('Numbers');
 if(!Object.values(v).every(Number.isSafeInteger))throw Error('Numbers');
 if(v.size<minSize||v.size>MAX_SIZE)throw Error('SizeRange');
 if(Math.abs(v.x)>1000000||Math.abs(v.y)>1000000)throw Error('OffsetRange');
 return v;
}
export const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function readState(scene,level) {
 // Read source fields without serializing every wall, token and tile on each nudge.
 const s=scene._source??scene.toObject(),l=level._source??level.toObject();
 if(!l.background?.src)throw Error('NoBackground');
 if(![1,2,3,4,5].includes(s.grid?.type))throw Error('NoGrid');
 return {value:{size:s.grid.size,...savedOrigin(scene)},
  signature:structuredClone({sceneId:scene.id,levelId:level.id,origin:s.flags?.[ID]?.origin,grid:s.grid,width:s.width,height:s.height,padding:s.padding,shiftX:s.shiftX,shiftY:s.shiftY,background:l.background,textures:l.textures})};
}
export function nudge(value,dx,dy,step=1) {
 if(![1,5,10].includes(step))throw Error('Step');
 return {...value,x:value.x+dx*step,y:value.y+dy*step};
}
// A drag is always measured from its starting point, in scene pixels, not zoomed screen pixels.
export function drag(value,start,end) {
 return {...value,x:value.x+Math.round(end.x-start.x),y:value.y+Math.round(end.y-start.y)};
}
export function operations(scene,level,base,draft) {
 if(equal(base,draft))return [];
 const update={_id:scene.id,'flags.grid-align.origin':{x:draft.x,y:draft.y}};
 if(base.size!==draft.size){
  update['grid.size']=draft.size;
  // Keep the scene rect and artwork at the same world coordinates when padding
  // rounding changes with grid size. No Level or embedded-object updates.
  const old=scene.getDimensions(),next=scene.clone({'grid.size':draft.size},{keepId:true}).getDimensions();
  if(next.sceneX!==old.sceneX)update.shiftX=(scene._source.shiftX??0)+next.sceneX-old.sceneX;
  if(next.sceneY!==old.sceneY)update.shiftY=(scene._source.shiftY??0)+next.sceneY-old.sceneY;
 }
 return [{action:'update',documentName:'Scene',updates:[update]}];
}
export class AlignmentSession {
 constructor({scene,level,guard,save,minSize=50}) {
  Object.assign(this,{scene,level,guard,save,minSize});this.base=readState(scene,level);this.draft={...this.base.value};this.busy=false;
 }
 set(value){if(this.busy)throw Error('Busy');this.draft=validate(value,this.minSize);return this.draft;}
 reset(){return this.set(this.base.value);}
 get dirty(){return !equal(this.base.value,this.draft);}
 check(){this.guard();if(!equal(readState(this.scene,this.level).signature,this.base.signature))throw Error('Conflict');}
 async apply(){
  if(this.busy)throw Error('Busy');this.check();const draft=validate(this.draft,this.minSize);
  const ops=operations(this.scene,this.level,this.base.value,draft);if(!ops.length)return false;
  this.busy=true;
  try {
   await this.save(ops);
   if(!equal(readState(this.scene,this.level).value,draft))throw Error('NotSaved');
   this.base=readState(this.scene,this.level);return true;
  }finally{this.busy=false;}
 }
}
// A square measured across three cells. Horizontal width controls size; either corner may be used.
export function boxAlignment(start,end,minSize=50){
 if(![start.x,start.y,end.x,end.y].every(Number.isFinite))throw Error('Numbers');
 const size=Math.round(Math.abs(end.x-start.x)/3),side=size*3;
 return validate({size,x:Math.round(start.x-(end.x<start.x?side:0)),y:Math.round(start.y-(end.y<start.y?side:0))},minSize);
}
