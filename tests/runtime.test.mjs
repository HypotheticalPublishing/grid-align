import test from 'node:test';
import assert from 'node:assert/strict';
import {installRuntime} from '../scripts/runtime.mjs';
import {offsetGrid} from '../scripts/offset-grid.mjs';
class Shader {static _createVertexShader(){return 'uniform float gridSize; void main(){vGridCoord = pixelCoord / gridSize;}';}static get defaultUniforms(){return {style:0};}constructor(){this.uniforms=this.constructor.defaultUniforms;}configure(o){Object.assign(this.uniforms,o);}}
class Grid {
 size=100;isGridless=false;
 #center(p){return {x:(Math.floor(p.x/this.size)+.5)*this.size,y:(Math.floor(p.y/this.size)+.5)*this.size};}
 getCenterPoint(p){return p.i===undefined?this.#center(p):{x:(p.j+.5)*this.size,y:(p.i+.5)*this.size};}
 getOffset(p){return {i:Math.floor(p.y/this.size),j:Math.floor(p.x/this.size)};}
 getVertices(p){const c=this.getCenterPoint(p);return [{x:c.x-50,y:c.y-50}];}
 getSnappedPoint(p){return this.#center(p);}
 getShape(){return [{x:-50,y:-50}];}
 measurePath(points,{cost}={}){return cost?.({}, {},5,points[1]);}
}
test('Translation preserves private receivers, avoids nested double shifts and leaves shape vectors local',()=>{
 const grid=offsetGrid(new Grid(),{x:29,y:-16});
 assert.deepEqual(grid.getSnappedPoint({x:80,y:20}),{x:79,y:34});
 assert.deepEqual(grid.getVertices({x:80,y:20}),[{x:29,y:-16}]);
 assert.deepEqual(grid.getShape(),[{x:-50,y:-50}]);
 assert.deepEqual(grid.getOffset({x:80,y:20}),{i:0,j:0});
 offsetGrid(grid,{x:10,y:20});assert.deepEqual(grid.getSnappedPoint({x:30,y:30}),{x:60,y:70});
});
test('Measurement callbacks receive world coordinates and original waypoint metadata',()=>{
 const grid=offsetGrid(new Grid(),{x:29,y:-16}),p={x:150,y:200,teleport:true};
 assert.deepEqual(grid.measurePath([{x:0,y:0},p],{cost:(a,b,d,w)=>w}),p);
 assert.deepEqual(grid.measurePath([{x:0,y:0},p],{cost:()=>grid.getCenterPoint({i:0,j:0})}),{x:79,y:34});
});
test('Prepared scenes and remote flag updates restore snapping and full mesh coverage',()=>{
 const callbacks=new Map();globalThis.Hooks={on:(name,fn)=>callbacks.set(name,fn),once:(name,fn)=>callbacks.set(name,fn)};
 class Scene {constructor(){this._source={flags:{'grid-align':{origin:{x:29,y:-16}}}};}prepareBaseData(){this.grid=new Grid();}}
 class Layer {constructor(){this.mesh={shader:new Shader(),setShaderClass(C){this.shader=new C();},data:{size:100},position:{set:(x,y)=>Object.assign(this.mesh,{x,y})},initialize(d){this.data=d;}};}initializeMesh(){this.mesh.initialize({size:100,width:4620,height:6440});}}
 const scene=new Scene(),layer=new Layer();Layer.instance=layer;
 globalThis.CONFIG={Scene:{documentClass:Scene}};globalThis.foundry={canvas:{layers:{GridLayer:Layer}}};
 globalThis.canvas={scene,ready:true,dimensions:{width:4620,height:6440}};globalThis.game={scenes:[scene]};
 installRuntime();scene.prepareBaseData();callbacks.get('ready')();layer.initializeMesh(scene.grid);
 assert.deepEqual(scene.grid.getSnappedPoint({x:80,y:20}),{x:79,y:34});
 assert.ok(layer.mesh.x<=0&&layer.mesh.y<=0);
 assert.ok(layer.mesh.x+layer.mesh.data.width>=4620&&layer.mesh.y+layer.mesh.data.height>=6440);
 scene._source.flags['grid-align'].origin={x:-1000000,y:1000000};scene.prepareBaseData();callbacks.get('updateScene')(scene,{flags:{'grid-align':{origin:{x:-1000000,y:1000000}}}});
 assert.ok(layer.mesh.data.width<5220);assert.ok(layer.mesh.data.height<7040);
 delete scene._source.flags['grid-align'];scene.prepareBaseData();callbacks.get('updateScene')(scene,{flags:{'grid-align':{'-=origin':null}}});
 assert.equal(layer.mesh.x,0);assert.equal(layer.mesh.y,0);
 assert.deepEqual(scene.grid.getSnappedPoint({x:80,y:20}),{x:50,y:50});
});
