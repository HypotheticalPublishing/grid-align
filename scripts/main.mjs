import {BoxGuide} from './box-guide.mjs';
import {installRuntime} from './runtime.mjs';
import {ID,MAX_SIZE,AlignmentSession,nudge,drag,boxAlignment} from './core.mjs';
import {GridPreview} from './preview.mjs';
import {markup,fieldMessage,escapeHTML} from './ui.mjs';
Hooks.once('init',installRuntime);
Hooks.once('init',()=>{
 // Solid windows: the frosted glass off, for this player only.
 game.settings.register('grid-align','solidWindows',{name:'GA.SolidWindows',hint:'GA.SolidWindowsHint',scope:'client',config:true,type:Boolean,default:false,
  onChange:value=>active?.element?.classList.toggle('fk-opaque',!!value)});
});
const t=key=>game.i18n.localize(`GA.${key}`);
const FIELD_LABEL={size:'GridSize',x:'X',y:'Y'};
const ARROWS={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
// Held Smaller/Larger and arrow-pad buttons repeat after a short pause, about 12 steps a second.
const REPEAT={delay:400,every:80,actions:['smaller','larger','up','down','left','right']};
const solidWindows=()=>{try{return !!game.settings.get(ID,'solidWindows');}catch{return false;}};
const editable=el=>!!el?.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"]');
// The kit's @font-face rules use font-display: swap, so the first open drew fallback type and then
// swapped to Alegreya. Load the faces the window uses before its first render (capped, so a slow
// font never holds the window back).
const KIT_FACES=['400 15px "Alegreya Sans"','500 15px "Alegreya Sans"','700 15px "Alegreya Sans"','600 26px Alegreya'];
let fontsReady;
const loadFonts=()=>fontsReady??=Promise.race([Promise.all(KIT_FACES.map(f=>document.fonts?.load(f))).catch(()=>{}),new Promise(r=>setTimeout(r,1500))]);
let active;
function checkAccess(scene,level) {
 if(!game.user.isGM||!scene.canUserModify(game.user,'update')||!level.canUserModify(game.user,'update'))throw Error('GMOnly');
 if(!canvas.ready||canvas.scene?.id!==scene.id||canvas.level?.id!==level.id)throw Error('SceneChanged');
}
function showError(error){if(error.text)return error.text;console.error(`${ID} |`,error);const key=`GA.${error.message}`;return game.i18n.has(key)?game.i18n.localize(key):t('Failed');}
export class GridAlignApp extends foundry.applications.api.ApplicationV2 {
 static DEFAULT_OPTIONS={id:ID,tag:'div',classes:['fvtt-kit','fk-window','grid-align-window'],window:{title:'GA.Title',icon:'fa-solid fa-border-all',resizable:true},position:{width:420,height:'auto'}};
 constructor(options={}) {
  super(options);
  const scene=canvas.scene,level=canvas.level;
  if(!scene||!level)throw Error('SceneChanged');checkAccess(scene,level);
  if(typeof foundry.documents.modifyBatch!=='function')throw Error('Unsupported');
  const field=scene.getFieldForProperty('grid.size');
  const minSize=Math.max(50,Number(field?.options?.min)||50);
  this.session=new AlignmentSession({scene,level,minSize,guard:()=>checkAccess(scene,level),save:ops=>foundry.documents.modifyBatch(ops)});
  this.step=1;this.dragMode=false;this.boxMode=false;this.statusKey='Ready';this.previewEnabled=true;this.closed=false;
 }
 get square(){return this.session.scene._source.grid.type===1;}
 /** The level line only appears when it adds something: a single-level scene's level usually repeats the scene name. */
 get levelLabel(){
  const {scene,level}=this.session,same=(a,b)=>String(a??'').trim().toLowerCase()===String(b??'').trim().toLowerCase();
  // Relies on V14 Scene#levels being an embedded collection with a size.
  if(!level.name||same(level.name,scene.name)||scene.levels?.size===1)return '';
  return level.name;
 }
 async _renderHTML(){return markup(t,this.session.scene.name,this.levelLabel,this.session.minSize,{square:this.square});}
 _replaceHTML(result,content){content.innerHTML=result;}
 _onRender(context,options){
  super._onRender(context,options);
  this.uiAbort?.abort();this.uiAbort=new AbortController();const signal=this.uiAbort.signal;
  const root=this.element;
  // Kit 2.0 "Solid windows": turn the glass off for this player.
  root.classList.toggle('fk-opaque',solidWindows());
  root.querySelector('[name="preview"]').checked=this.previewEnabled;this.syncPreview();
  // Nudge step is a radiogroup of buttons: click or arrow keys select; only the checked one is in the tab order.
  const steps=[...root.querySelectorAll('[data-step]')];
  const pickStep=(b,focus=false)=>{this.step=Number(b.dataset.step);for(const x of steps){x.setAttribute('aria-checked',String(x===b));x.tabIndex=x===b?0:-1;}if(focus)b.focus();};
  pickStep(steps.find(b=>Number(b.dataset.step)===this.step)??steps[0]);
  steps.forEach((b,i)=>{
   b.addEventListener('click',()=>pickStep(b),{signal});
   b.addEventListener('keydown',e=>{const step={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(!step)return;e.preventDefault();e.stopPropagation();pickStep(steps[(i+step+steps.length)%steps.length],true);},{signal});
  });
  root.addEventListener('click',e=>{
   const button=e.target.closest('[data-ga]');if(!button||button.disabled)return;
   e.preventDefault();
   // A mouse press on Smaller/Larger or an arrow-pad button already stepped on pointerdown; keyboard clicks (detail 0) still step here.
   if(REPEAT.actions.includes(button.dataset.ga)&&e.detail>0)return;
   void this.action(button.dataset.ga).catch(error=>this.fail(error));
  },{signal});
  // Press and hold Smaller/Larger or an arrow-pad button: one step at once, then repeat until released.
  root.addEventListener('pointerdown',e=>{
   const button=e.target.closest('[data-ga]');
   if(e.button!==0||!button||button.disabled||!REPEAT.actions.includes(button.dataset.ga))return;
   this.stopRepeat();
   const step=()=>{if(button.disabled||this.session.busy)return this.stopRepeat();void this.action(button.dataset.ga).catch(error=>{this.stopRepeat();this.fail(error);});};
   step();this.repeat=setTimeout(()=>{this.repeat=setInterval(step,REPEAT.every);},REPEAT.delay);
   button.addEventListener('pointerleave',()=>this.stopRepeat(),{once:true,signal});
  },{signal});
  // Released anywhere, even outside the window, stops the repeat.
  for(const type of ['pointerup','pointercancel','blur'])window.addEventListener(type,()=>this.stopRepeat(),{signal});
  // Typing a usable number clears that field's error at once and previews it; an unusable one waits for change.
  root.addEventListener('input',e=>{
   if(!['size','x','y'].includes(e.target.name)||!e.target.checkValidity())return;
   this.fieldError(e.target,null);
   if(![...root.querySelectorAll('.ga-number')].every(input=>input.checkValidity()))return;
   try{this.readInputs();this.changed();}catch(error){this.fail(error,e.target);}
  },{signal});
  root.addEventListener('change',e=>{
   try {
    if(e.target.name==='preview'){this.previewEnabled=e.target.checked;this.syncPreview();this.draw();return;}
    if(['size','x','y'].includes(e.target.name)){this.readInputs();this.changed();}
   }catch(error){this.fail(error,e.target);}
  },{signal});
  // Plain arrows nudge only while the pad has focus; Shift + arrows are handled window-wide in installCanvasInput.
  root.querySelector('.ga-pad').addEventListener('keydown',e=>{
   const direction=ARROWS[e.key];
   if(!direction)return;e.preventDefault();e.stopPropagation();
   this.keyNudge(direction,e.shiftKey?10:this.step);
  },{signal});
  this.installCanvasInput();
  try{this.draw();this.sync();}catch(error){this.fail(error);void this.close({discard:true});}
 }
 keyNudge(direction,step){try{this.readInputs();this.session.set(nudge(this.session.draft,...direction,step));this.changed();}catch(error){this.fail(error);}}
 stopRepeat(){clearTimeout(this.repeat);clearInterval(this.repeat);this.repeat=null;}
 readInputs(){
  const values={};for(const name of ['size','x','y']){
   const input=this.element.querySelector(`[name="${name}"]`);
   if(!input.checkValidity()){
    // Name the field and its range in plain language, then mark and focus it.
    const error=Error('Numbers');error.text=fieldMessage(t('FieldRange'),t(FIELD_LABEL[name]),Number(input.min),Number(input.max));
    this.fieldError(input,error.text);input.focus();throw error;
   }
   this.fieldError(input,null);values[name]=input.value;
  }
  this.session.set(values);
 }
 /** Show or clear the error line under a number field, linked for screen readers. */
 fieldError(input,message){
  const error=this.element.querySelector(`#${input.id}-error`),help=(input.getAttribute('aria-describedby')??'').split(' ').filter(id=>id&&id!==error.id);
  error.textContent=message??'';error.hidden=!message;
  if(message){input.setAttribute('aria-invalid','true');help.push(error.id);}else input.removeAttribute('aria-invalid');
  if(help.length)input.setAttribute('aria-describedby',help.join(' '));else input.removeAttribute('aria-describedby');
 }
 syncPreview(){const input=this.element.querySelector('[name="preview"]');input.parentElement.querySelector('.fk-toggle-state').textContent=t(input.checked?'On':'Off');}
 sync(){
  if(!this.element)return;
  const draft=this.session.draft;
  for(const name of ['size','x','y']){
   const input=this.element.querySelector(`[name="${name}"]`);
   // Leave the field being typed in alone when it already holds the draft, so the caret doesn't jump.
   if(!(input===document.activeElement&&Number(input.value)===draft[name]))input.value=draft[name];
   this.fieldError(input,null);
  }
  // Only rewrite the live region when the message changes, so it isn't re-announced on every redraw.
  const status=this.element.querySelector('#ga-status'),message=t(this.statusKey);if(status.textContent!==message)status.textContent=message;
  status.dataset.state=this.session.dirty?'dirty':'clean';
  this.element.querySelector('[data-ga="apply"]').disabled=this.session.busy||!this.session.dirty;
  this.element.querySelector('[data-ga="reset"]').disabled=this.session.busy||!this.session.dirty;
  this.element.querySelector('[data-ga="drag"]').setAttribute('aria-pressed',String(this.dragMode));
  const box=this.element.querySelector('[data-ga="box"]');box.setAttribute('aria-pressed',String(this.boxMode));box.disabled=this.session.busy||!this.square;
  // Steppers stop at the bounds instead of stepping into an error; the field beside them shows why.
  this.element.querySelector('[data-ga="smaller"]').disabled=this.session.busy||draft.size<=this.session.minSize;
  this.element.querySelector('[data-ga="larger"]').disabled=this.session.busy||draft.size>=MAX_SIZE;
  if(this.view)this.view.style.cursor=this.boxMode?'crosshair':this.dragMode?'grab':this.originalCursor;
 }
 fail(error,input){
  // Name the field and the real range, matching the typed-field message.
  if(!error.text&&error.message==='SizeRange')error.text=fieldMessage(t('FieldRange'),t('GridSize'),this.session.minSize,MAX_SIZE);
  const message=showError(error),status=this.element?.querySelector('#ga-status');
  if(status){status.textContent=message;status.dataset.state='error';}else ui.notifications.error(message);
  if(input?.id&&this.element?.querySelector(`#${input.id}-error`))this.fieldError(input,message);else input?.setAttribute('aria-invalid','true');
 }
 // Status follows the draft: a value edited back to the saved one reads "No changes yet" again.
 changed(){this.statusKey=this.session.dirty?'Unsaved':'Ready';this.draw();this.sync();}
 draw(){
  this.session.check();this.preview??=new GridPreview(this.session.scene);
  this.preview.enabled=this.previewEnabled;this.preview.draw(this.session.base.value,this.session.draft);
 }
 async action(action){
  if(this.session.busy)return;
  if(action==='cancel'){await this.close();return;}
  if(action==='reset'){this.stopDrag();this.dragMode=false;this.boxMode=false;this.session.reset();this.statusKey='Ready';this.draw();this.sync();return;}
  this.readInputs();
  if(action==='apply'){
   this.stopDrag();this.dragMode=false;this.boxMode=false;this.applying=true;
   this.element.querySelectorAll('button,input,select').forEach(e=>e.disabled=true);
   const applyButton=this.element.querySelector('[data-ga="apply"]');applyButton.setAttribute('aria-busy','true');
   const label=applyButton.querySelector('span');label.textContent=t('Applying');
   this.statusKey='Saving';this.element.querySelector('#ga-status').textContent=t('Saving');
   // Restore the native layer before Foundry redraws it during the batch.
   this.preview?.destroy();this.preview=null;
   try{await this.session.apply();ui.notifications.info(t('Saved'));await this.close({discard:true});}
   catch(error){
    // Unknown failures keep the draft, so say it can be retried rather than "reopen the tool".
    if(!error.text&&!game.i18n.has(`GA.${error.message}`)){console.error(`${ID} |`,error);error.text=t('SaveFailed');}
    label.textContent=t('Apply');applyButton.setAttribute('aria-busy','false');
    this.element?.querySelectorAll('button,input,select').forEach(e=>e.disabled=false);
    try{this.draw();this.sync();}catch(contextError){
     this.element.querySelector('[data-ga="apply"]').disabled=true;
     this.element.querySelector('[data-ga="drag"]').setAttribute('aria-pressed','false');
     error=contextError;
    }
    this.fail(error);
   }
   finally{this.applying=false;}
   return;
  }
  const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  if(directions[action])this.session.set(nudge(this.session.draft,...directions[action],this.step));
  if(action==='smaller'||action==='larger')this.session.set({...this.session.draft,size:this.session.draft.size+(action==='larger'?1:-1)});
  if(action==='origin')this.session.set({...this.session.draft,x:0,y:0});
  if(action==='drag'||action==='box'){this.cancelGesture();if(action==='box'&&this.session.scene._source.grid.type!==1)throw Error('SquareOnly');const on=action==='drag'?!this.dragMode:!this.boxMode;this.dragMode=action==='drag'&&on;this.boxMode=action==='box'&&on;this.statusKey=this.boxMode?'BoxHelp':this.dragMode?'DragHelp':this.session.dirty?'Unsaved':'Ready';this.sync();return;}
  this.changed();
 }
 installCanvasInput(){
  if(this.canvasAbort)return;
  this.canvasAbort=new AbortController();const signal=this.canvasAbort.signal,options={capture:true,signal};
  this.view=canvas.app.view;this.originalCursor=this.view.style.cursor;
  const point=e=>canvas.canvasCoordinatesFromClient({x:e.clientX,y:e.clientY}),consume=e=>{e.preventDefault();e.stopImmediatePropagation();},onView=e=>e.composedPath().includes(this.view);
  // Window capture precedes document/Pixi listeners, including compatibility mouse events.
  window.addEventListener('pointerdown',e=>{
   if(!this.dragStart)this.suppressClick=false;
   if(e.button!==0||!onView(e)||(!this.dragMode&&!this.boxMode)||this.session.busy)return;
   consume(e);if(this.dragStart)return;
   try{this.readInputs();this.session.check();this.suppressClick=true;this.dragStart={point:point(e),value:{...this.session.draft},id:e.pointerId,box:this.boxMode};this.view.setPointerCapture(e.pointerId);}
   catch(error){this.stopDrag();this.fail(error);}
  },options);
  window.addEventListener('pointermove',e=>{
   if(!this.dragStart||e.pointerId!==this.dragStart.id)return;consume(e);
   try{const end=point(e);this.session.check();if(this.dragStart.box){this.boxGuide??=new BoxGuide();this.boxGuide.draw(this.dragStart.point,end,point);try{this.session.set(boxAlignment(this.dragStart.point,end,this.session.minSize));this.draw();this.sync();}catch(error){if(error.message!=='SizeRange')throw error;}}else{this.session.set(drag(this.dragStart.value,this.dragStart.point,end));this.changed();}}
   catch(error){this.cancelGesture();this.fail(error);}
  },options);
  window.addEventListener('pointerup',e=>{
   if(this.dragStart?.id!==e.pointerId)return;consume(e);const gesture=this.dragStart;
   try{this.session.check();if(gesture.box){this.session.set(boxAlignment(gesture.point,point(e),this.session.minSize));this.boxMode=false;}else this.session.set(drag(gesture.value,gesture.point,point(e)));this.stopDrag();this.changed();}
   catch(error){
    // A box narrower than three minimum cells says so; the box tool stays on for another try.
    const min=this.session.minSize;
    if(gesture.box&&error.message==='SizeRange'&&Math.abs(point(e).x-gesture.point.x)/3<min)error.text=t('BoxTooSmall').replace('{min}',min).replace('{width}',(min*3).toLocaleString('en-US'));
    this.cancelGesture();this.fail(error);
   }
  },options);
  window.addEventListener('pointercancel',e=>{if(this.dragStart?.id===e.pointerId){consume(e);this.cancelGesture();}},options);
  this.view.addEventListener('lostpointercapture',()=>{if(this.dragStart)this.cancelGesture();},{signal});
  for(const type of ['mousedown','mousemove','mouseup','click','dblclick'])window.addEventListener(type,e=>{
   if(e.button>0)return;if(this.dragStart||onView(e)&&(this.dragMode||this.boxMode||this.suppressClick)){consume(e);if(type==='click')this.suppressClick=false;}
  },options);
  // Do not zoom midway through a measured gesture; zoom/pan remain native when idle.
  window.addEventListener('wheel',e=>{if(this.dragStart&&onView(e))consume(e);},{...options,passive:false});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(this.dragStart||this.dragMode||this.boxMode)){consume(e);this.cancelGesture();this.stopTools();this.sync();}},options);
  // Shift + arrows nudge 10 px anywhere while the window is open, ahead of Foundry's canvas panning.
  // Text fields (ours and other windows') keep their own arrow keys.
  window.addEventListener('keydown',e=>{
   const direction=ARROWS[e.key];
   if(!direction||!e.shiftKey||e.ctrlKey||e.altKey||e.metaKey||editable(e.target)||this.session.busy||this.closed)return;
   consume(e);this.keyNudge(direction,10);
  },options);
  window.addEventListener('blur',()=>{this.cancelGesture();this.stopTools();if(!this.closed)this.sync();},{signal});
 }
 /** Turn Drag and Box off; if one was on, its help status gives way to the session's state. */
 stopTools(){if(this.dragMode||this.boxMode)this.statusKey=this.session.dirty?'Unsaved':'Ready';this.dragMode=false;this.boxMode=false;}
 cancelGesture(){const value=this.dragStart?.value;this.stopDrag();if(value){try{this.session.set(value);this.statusKey=this.session.dirty?'Unsaved':'Ready';this.draw();this.sync();}catch(error){this.fail(error);}}}
 stopDrag(){const id=this.dragStart?.id;this.dragStart=null;this.boxGuide?.destroy();this.boxGuide=null;if(id!==undefined&&this.view?.hasPointerCapture(id))this.view.releasePointerCapture(id);}
 /** Closing with unapplied adjustments asks first. Pass {discard:true} to skip the question. */
 async close(options={}){
  if(this.session?.busy||this.confirming)return this;
  if(!options.discard&&!this.closed&&this.session?.dirty&&this.element?.isConnected){
   this.confirming=true;let discard=false;
   try{
    discard=await foundry.applications.api.DialogV2.confirm({
     window:{title:t('DiscardTitle')},content:`<p>${t('DiscardBody')}</p>`,
     yes:{label:t('Discard'),icon:'fa-solid fa-trash'},no:{label:t('Keep'),default:true},
     rejectClose:false,modal:true
    });
   }finally{this.confirming=false;}
   if(!discard){this.bringToFront();this.element?.querySelector('[data-ga="apply"]')?.focus();return this;}
  }
  this.closed=true;this.stopRepeat();this.stopDrag();if(this.view)this.view.style.cursor=this.originalCursor;this.uiAbort?.abort();this.canvasAbort?.abort();this.preview?.destroy();this.preview=null;
  if(active===this)active=null;
  return super.close(options);
 }
}
/**
 * Open beside the map rather than over its middle: the window's right edge sits just left of the map's
 * left edge on screen. When the map reaches the left of the screen, the window sits as far left as the
 * scene controls allow. Near the top either way, since the window is tall.
 * Relies on V14's canvas.dimensions.sceneRect, canvas.clientCoordinatesFromCanvas, #scene-controls and #ui-right.
 */
export function startPosition(width=GridAlignApp.DEFAULT_OPTIONS.position.width){
 try{
  const rect=canvas.dimensions.sceneRect,edge=canvas.clientCoordinatesFromCanvas({x:rect.x,y:rect.y});
  // Keep clear of the scene controls on the left and the sidebar on the right (72 px is a safe guess if the controls aren't found).
  const controls=document.querySelector('#scene-controls')?.getBoundingClientRect().right??72,sidebar=document.querySelector('#ui-right')?.getBoundingClientRect().left??window.innerWidth;
  const minLeft=Math.round(controls+8),maxLeft=Math.max(minLeft,Math.round(sidebar-width-8));
  const left=Math.min(maxLeft,Math.max(minLeft,Math.round(edge.x-width-16)));
  const top=Math.max(8,Math.min(Math.round(edge.y),Math.round(window.innerHeight*0.12)));
  return Number.isFinite(left)&&Number.isFinite(top)?{left,top}:{};
 }catch{return {};}
}
export async function openGridAlign(){
 try{
  if(active&&!active.closed){active.bringToFront();return active;}
  active=new GridAlignApp({position:startPosition()});await loadFonts();await active.render({force:true});return active;
 }catch(error){if(active)await active.close({discard:true});ui.notifications.error(showError(error));}
}
Hooks.once('ready',()=>{game.modules.get(ID).api={open:openGridAlign};if(game.user.isGM)void loadFonts();});
// Scene Configuration → Grid: a native Foundry button (not the kit) that opens Grid Align.
// It sits right after the grid size field it affects, and its hint says how it differs from Foundry's own
// grid tool in that tab (which moves the map image).
// Relies on V14 SceneConfig's grid part/tab names and where the grid size field sits in it.
function decorateSceneConfig(app,element){
 const scene=app.document,root=element instanceof HTMLElement?element:app.element;
 if(!game.user.isGM||scene?.documentName!=='Scene'||!root||root.querySelector('.ga-config'))return;
 const tab=root.querySelector('[data-application-part="grid"]')??root.querySelector('.tab[data-tab="grid"]');
 const sizeGroup=(tab??root).querySelector('[name="grid.size"]')?.closest('.form-group');
 if(!tab&&!sizeGroup)return;
 const viewed=canvas.ready&&canvas.scene?.id===scene.id,id=`${app.id}-grid-align`;
 const group=document.createElement('div');group.className='form-group ga-config';
 group.innerHTML=`<label for="${escapeHTML(id)}">${escapeHTML(t('Title'))}</label>
  <div class="form-fields"><button type="button" id="${escapeHTML(id)}" aria-describedby="${escapeHTML(id)}-hint"${viewed?'':' disabled'}><i class="fa-solid fa-border-all" aria-hidden="true"></i> ${escapeHTML(t('ConfigOpen'))}</button></div>
  <p class="hint" id="${escapeHTML(id)}-hint">${escapeHTML(viewed?t('ConfigHint'):`${t('ConfigNotViewed')} ${t('ConfigHint')}`)}</p>`;
 group.querySelector('button').addEventListener('click',()=>{void openGridAlign();});
 if(sizeGroup)sizeGroup.after(group);else tab.prepend(group);
}
Hooks.on('renderSceneConfig',decorateSceneConfig);
Hooks.on('getSceneControlButtons',controls=>{
 if(!controls.tokens)return;
 controls.tokens.tools.gridAlign={name:'gridAlign',title:'GA.Title',icon:'fa-solid fa-border-all',order:Object.keys(controls.tokens.tools).length,button:true,visible:game.user.isGM,onChange:()=>{void openGridAlign();}};
});
// The scene is going away: the draft can't be applied, so close without asking.
Hooks.on('canvasTearDown',()=>{if(active&&!active.applying)void active.close({discard:true});});
Hooks.on('canvasReady',()=>{if(active&&!active.applying){try{active.draw();}catch{void active.close({discard:true});}}});
Hooks.on('updateScene',scene=>{if(active?.session.scene.id===scene.id&&!active.applying){try{active.session.check();}catch(error){active.fail(error);active.preview?.destroy();active.preview=null;}}});
Hooks.on('updateLevel',level=>{if(active?.session.level.id===level.id&&!active.applying){try{active.session.check();}catch(error){active.fail(error);active.preview?.destroy();active.preview=null;}}});
