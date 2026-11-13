// Translate only the public coordinate boundary. Original methods keep their real
// receiver (including private fields); nested calls must not translate twice.
const installed=new WeakMap();
const pointOutput=new Set(['getTopLeftPoint','getCenterPoint','getSnappedPoint','getShiftedPoint','getTranslatedPoint','cubeToPoint']);
const polygonOutput=new Set(['getVertices','getCircle','getCone','getEllipse','getRectangle','getLine','getRing']);
const firstInput=new Set([...pointOutput,...polygonOutput,'getOffset','getOffsetRange','getAdjacentOffsets','getShiftedOffset','getCube','pointToCube','getAdjacentCubes','getShiftedCube']);
export function originOf(grid){return installed.get(grid)?.origin??{x:0,y:0};}
export function localCenter(grid,cell){
 const state=installed.get(grid);if(!state)return grid.getCenterPoint(cell);
 state.depth++;try{return grid.getCenterPoint(cell);}finally{state.depth--;}
}
export function offsetGrid(grid,origin) {
 if(!grid||grid.isGridless)return grid;
 const previous=installed.get(grid);if(previous){previous.origin={...origin};return grid;}
 const state={origin:{...origin},depth:0};installed.set(grid,state);
 const point=(p,sign)=>p&&p.x!==undefined&&p.y!==undefined?{...p,x:p.x+sign*state.origin.x,y:p.y+sign*state.origin.y}:p;
 const output=p=>Array.isArray(p)?p.map(output):point(p,1);
 const cost=fn=>typeof fn==='function'?(a,b,d,w)=>{
  // Caller callbacks operate in world coordinates and may call grid APIs again.
  const depth=state.depth;state.depth=0;
  try{return fn(a,b,d,point(w,1));}finally{state.depth=depth;}
 }:fn;
 const waypoint=p=>{const v=point(p,-1);return v?.cost?{...v,cost:cost(v.cost)}:v;};
 for(const name of new Set([...firstInput,'getDirectPath','measurePath','testAdjacency'])) {
  const original=grid[name];if(typeof original!=='function')continue;
  Object.defineProperty(grid,name,{configurable:true,writable:true,value:function(...args){
   if(state.depth)return original.apply(this,args);
   const shifted=state.origin.x!==0||state.origin.y!==0;
   if(!shifted)return original.apply(this,args);
   if(name==='getDirectPath'||name==='measurePath'){
    args[0]=args[0].map(waypoint);
    if(name==='measurePath'&&args[1])args[1]={...args[1],cost:cost(args[1].cost)};
   }else if(name==='testAdjacency'){args[0]=point(args[0],-1);args[1]=point(args[1],-1);}
   else if(firstInput.has(name))args[0]=point(args[0],-1);
   state.depth++;
   try{const result=original.apply(this,args);return pointOutput.has(name)||polygonOutput.has(name)?output(result):result;}
   finally{state.depth--;}
  }});
 }
 return grid;
}
