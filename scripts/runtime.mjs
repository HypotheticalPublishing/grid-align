import {offsetGrid,originOf} from './offset-grid.mjs';
import {periods,coverGrid} from './coverage.mjs';
import {setRenderOrigin} from './grid-shader.mjs';
const ID='grid-align';
const positioned=new WeakSet();
export function savedOrigin(scene){
 const o=scene?._source?.flags?.[ID]?.origin;
 return o&&Number.isSafeInteger(o.x)&&Number.isSafeInteger(o.y)?{x:o.x,y:o.y}:{x:0,y:0};
}
function prepare(scene){offsetGrid(scene.grid,savedOrigin(scene));}
export function positionMesh(mesh,grid,bounds,origin=originOf(grid),size=grid.size){
 const x=Math.min(0,bounds.sceneX??0),y=Math.min(0,bounds.sceneY??0);
 const width=Math.max(bounds.width,(bounds.sceneX??0)+(bounds.sceneWidth??0))-x;
 const height=Math.max(bounds.height,(bounds.sceneY??0)+(bounds.sceneHeight??0))-y;
 const period=periods(grid,size);
 const rect=coverGrid({x,y,width,height},origin,period);
 // Reduce to a whole-cell cycle for shader precision at very large offsets.
 setRenderOrigin(mesh,{x:((origin.x%period.x)+period.x)%period.x,y:((origin.y%period.y)+period.y)%period.y});
 mesh.initialize({...mesh.data,size,width:rect.width,height:rect.height});
 mesh.position.set(rect.x,rect.y);
 positioned.add(mesh);
}
export function installRuntime(){
 const proto=CONFIG.Scene.documentClass.prototype,prepareBase=proto.prepareBaseData;
 proto.prepareBaseData=function(...args){const result=prepareBase.apply(this,args);prepare(this);return result;};
 const layerProto=foundry.canvas.layers.GridLayer.prototype,initialize=layerProto.initializeMesh;
 layerProto.initializeMesh=function(grid,...args){
  const result=initialize.call(this,grid,...args);
  if(canvas.scene?._source.flags?.[ID]?.origin&&this.mesh&&!grid.isGridless)positionMesh(this.mesh,grid,canvas.dimensions);
  else if(this.mesh&&positioned.has(this.mesh)){this.mesh.position.set(0,0);setRenderOrigin(this.mesh,{x:0,y:0});positioned.delete(this.mesh);}
  return result;
 };
 Hooks.on('updateScene',(scene,change)=>{
  if(scene!==canvas.scene||!canvas.ready)return;
  if(change.flags?.[ID]&&!change.grid&&!('shiftX' in change)&&!('shiftY' in change)){
   prepare(scene);foundry.canvas.layers.GridLayer.instance.initializeMesh(scene.grid);
  }
 });
 Hooks.once('ready',()=>{for(const scene of game.scenes)prepare(scene);});
}
