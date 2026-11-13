// V14.369 runtime source: mesh translation changes coverage, while vGridCoord
// remains world-anchored. Offset only grid coordinates, preserving scene masks.
const classes=new WeakMap();
export function withGridOrigin(source){
 const uniform=/uniform\s+float\s+gridSize\s*;/g;
 const coordinate=/vGridCoord\s*=\s*pixelCoord\s*\/\s*gridSize\s*;/g;
 if([...source.matchAll(uniform)].length!==1||[...source.matchAll(coordinate)].length!==1)throw Error('ShaderUnsupported');
 return source.replace(uniform,'uniform float gridSize;\nuniform vec2 gaGridOrigin;')
  .replace(coordinate,'vGridCoord = (pixelCoord - gaGridOrigin) / gridSize;');
}
export function setRenderOrigin(mesh,origin){
 let Base=mesh.shader?.constructor;
 if(typeof Base?._createVertexShader!=='function'||typeof mesh.setShaderClass!=='function')throw Error('ShaderUnsupported');
 if(!classes.has(Base)){
  // Validate before changing the mesh, so incompatible shaders fail explicitly.
  withGridOrigin(Base._createVertexShader());
  class OffsetShader extends Base {
   static get defaultUniforms(){return {...super.defaultUniforms,gaGridOrigin:[0,0]};}
   static _createVertexShader(){return withGridOrigin(super._createVertexShader());}
  }
  classes.set(Base,OffsetShader);classes.set(OffsetShader,OffsetShader);
 }
 const Shader=classes.get(Base);
 if(Base!==Shader){
  const style=mesh.shader.uniforms.style;
  mesh.setShaderClass(Shader);
  if(style!==undefined)mesh.shader.configure({style});
 }
 mesh.shader.uniforms.gaGridOrigin=[origin.x,origin.y];
}
