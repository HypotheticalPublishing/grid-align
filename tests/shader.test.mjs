import test from 'node:test';
import assert from 'node:assert/strict';
import {withGridOrigin,setRenderOrigin} from '../scripts/grid-shader.mjs';
const vertex='uniform float gridSize; void main(){vGridCoord = pixelCoord / gridSize; vCanvasCoord = pixelCoord / canvasDimensions;}';
test('Shader patch changes grid coordinates while preserving scene/canvas coordinates',()=>{
 const patched=withGridOrigin(vertex);
 assert.match(patched,/uniform vec2 gaGridOrigin/);
 assert.match(patched,/vGridCoord = \(pixelCoord - gaGridOrigin\) \/ gridSize/);
 assert.match(patched,/vCanvasCoord = pixelCoord \/ canvasDimensions/);
});
test('Unexpected shader layouts fail explicitly before installation',()=>{
 assert.throws(()=>withGridOrigin('void main(){}'),/ShaderUnsupported/);
 assert.throws(()=>withGridOrigin(vertex+vertex),/ShaderUnsupported/);
});
test('Successive movement updates uniforms immediately without recompiling or losing style',()=>{
 class Base {
  static get defaultUniforms(){return {style:0};}
  static _createVertexShader(){return vertex;}
  constructor(){this.uniforms=this.constructor.defaultUniforms;}
  configure(o){Object.assign(this.uniforms,o);}
 }
 let installed=0;
 const mesh={shader:new Base(),setShaderClass(C){installed++;this.shader=new C();}};
 mesh.shader.uniforms.style=2;
 for(const origin of [{x:1,y:0},{x:5,y:10},{x:37,y:22},{x:0,y:0}]){
  setRenderOrigin(mesh,origin);
  assert.deepEqual(mesh.shader.uniforms.gaGridOrigin,[origin.x,origin.y]);
  assert.equal(mesh.shader.uniforms.style,2);
 }
 assert.equal(installed,1);
});
