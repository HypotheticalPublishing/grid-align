import {positionMesh} from './runtime.mjs';
export class GridPreview {
 constructor(scene) {
  this.scene=scene;this.layer=foundry.canvas.layers.GridLayer.instance;
  this.native=this.layer?.mesh;
  if(!this.native?.data)throw Error('Unsupported');
  this.wasRenderable=this.native.renderable;
  this.mesh=new foundry.canvas.containers.GridMesh();this.mesh.eventMode='none';
  this.layer.addChild(this.mesh);this.enabled=true;
 }
 draw(base,draft){
  if(this.mesh.destroyed||this.native.destroyed)throw Error('SceneChanged');
  this.mesh.initialize({...this.native.data,color:0xff66cc,alpha:0.85,thickness:2});
  positionMesh(this.mesh,this.scene.grid,this.scene.getDimensions(),{x:draft.x,y:draft.y},draft.size);
  this.native.renderable=this.enabled?false:this.wasRenderable;
  this.mesh.visible=this.enabled;
 }
 destroy(){
  if(this.native&&!this.native.destroyed)this.native.renderable=this.wasRenderable;
  if(this.mesh&&!this.mesh.destroyed){this.mesh.parent?.removeChild(this.mesh);this.mesh.destroy();}
 }
}
