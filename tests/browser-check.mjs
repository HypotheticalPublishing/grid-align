// Browser check with a simulated Foundry scene. Not part of `node --test`.
// Run: node tests/browser-check.mjs   (needs Playwright and Chrome; set PLAYWRIGHT to its path if not resolvable)
// Screenshots go to SHOT_DIR (default: the OS temp folder). Set KIT_MASTER to a Foundry Kit 2.0 `kit` folder to
// also check that the bundled kit stylesheet and fonts match it; without it that comparison is skipped.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT ?? 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shots = process.env.SHOT_DIR ?? os.tmpdir();
const lang = JSON.parse(await fs.readFile(path.join(root, 'lang/en.json'), 'utf8'));
const results = [];
const check = async (name, fn) => { await fn(); results.push(name); };

const fixture = (gridType = 1) => `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/styles/foundry-kit.css"><link rel="stylesheet" href="/styles/app.css"><style>body{margin:0;background:#10151a;color:#eee;font:14px Arial}#map{position:fixed;inset:0;width:100%;height:100%}.application{position:absolute;right:8px;top:8px;width:420px;max-height:calc(100vh - 56px);display:flex;flex-direction:column;border:1px solid #748190;border-radius:8px;background:#0b1114}.window-header{padding:10px 16px;background:#22272e}.window-content{flex:1;min-height:0}.application button:focus{box-shadow:0 0 5px #ff0000}.application input[type="number"]{font-size:11px;font-family:monospace}</style><canvas id="map"></canvas><script type="module">
const labels=${JSON.stringify(lang.GA)};
const hooks=new Map();globalThis.Hooks={on:(k,f)=>{const a=hooks.get(k)||[];a.push(f);hooks.set(k,a);},once:(k,f)=>{const a=hooks.get(k)||[];a.push(f);hooks.set(k,a);}};
globalThis.fire=(k,...args)=>(hooks.get(k)||[]).forEach(f=>f(...args));
const state={grid:{size:100,type:${gridType},alpha:0,color:'#333'},width:2000,height:1200,padding:.1,shiftX:0,shiftY:0};
const bg={background:{src:'https://example.invalid/map.webp'},textures:{offsetX:12,offsetY:-7}};
const dims=size=>({sceneX:Math.ceil(200/size)*size,sceneY:Math.ceil(120/size)*size,width:2400,height:1600});
const scene={get grid(){return {size:state.grid.size,getCenterPoint:({i,j})=>({x:(j+.5)*state.grid.size,y:(i+.5)*state.grid.size})};},id:'scene',name:'Imported scene background',_source:state,canUserModify:()=>true,toObject:()=>structuredClone(state),getFieldForProperty:()=>({options:{min:50}}),getDimensions:()=>dims(state.grid.size),clone:patch=>({getDimensions:()=>dims(patch['grid.size'])})};
const level={id:'ground',name:'Ground level',_source:bg,canUserModify:()=>true,toObject:()=>structuredClone(bg)};
const native={data:{size:100,type:${gridType},width:2400,height:1600,alpha:0},renderable:true,position:{x:0,y:0},scale:{x:1,y:1},x:0,y:0};
const layer={mesh:native,children:[],addChild(m){this.children.push(m);m.parent=this;},removeChild(m){this.children=this.children.filter(x=>x!==m);}};
class Shader{static _createVertexShader(){return 'uniform float gridSize; void main(){vGridCoord = pixelCoord / gridSize;}';}static get defaultUniforms(){return {style:0};}constructor(){this.uniforms=this.constructor.defaultUniforms;}configure(o){Object.assign(this.uniforms,o);}}
class Mesh{setShaderClass(C){this.shader=new C();}constructor(){this.shader=new Shader();this.position={copyFrom:()=>{},set:(x,y)=>{this.x=x;this.y=y;}};this.scale={copyFrom:()=>{}};}initialize(data){this.data=data;}destroy(){this.destroyed=true;}}
class App{constructor(){this.id='grid-align';}async render(){if(!this.element){this.element=document.createElement('div');this.element.id=this.id;this.element.className=['application',...(this.constructor.DEFAULT_OPTIONS.classes??[])].join(' ');this.element.innerHTML='<header class="window-header">Grid Align</header><div class="window-content"></div>';document.body.append(this.element);}this._replaceHTML(await this._renderHTML(),this.element.querySelector('.window-content'));this._onRender({},{});return this;}_onRender(){}async close(){this.element?.remove();this.element=null;return this;}bringToFront(){}}
globalThis.saved=0;globalThis.failSave=false;globalThis.holdSave=null;globalThis.notifications=[];globalThis.confirmCalls=0;globalThis.confirmAnswer=false;
globalThis.foundry={applications:{api:{ApplicationV2:App,DialogV2:{confirm:async()=>{confirmCalls++;return confirmAnswer;}}}},canvas:{layers:{GridLayer:{instance:layer}},containers:{GridMesh:Mesh}},documents:{modifyBatch:async ops=>{if(holdSave)await holdSave;if(failSave)throw Error('Simulated rejection');saved++;for(const op of ops){const u=op.updates[0];if(op.documentName!=='Scene')throw Error('Unexpected Level write');for(const [key,value]of Object.entries(u)){if(key==='_id')continue;const parts=key.split('.');let target=state;for(const part of parts.slice(0,-1))target=target[part]??={};target[parts.at(-1)]=value;}}}}};
const stored=new Map();globalThis.game={settings:{register:(m,k,d)=>stored.set(k,d.default),get:(m,k)=>stored.get(k),set:async(m,k,v)=>stored.set(k,v)},user:{isGM:true},i18n:{localize:k=>labels[k.slice(3)]??k,has:k=>k.slice(3)in labels},modules:new Map([['grid-align',{}]])};
globalThis.ui={notifications:{info:m=>notifications.push(m),error:m=>notifications.push(m)}};
globalThis.canvas={ready:true,scene,level,app:{view:document.querySelector('#map')},canvasCoordinatesFromClient:p=>({x:p.x/.7,y:p.y/.7})};
globalThis.fixture={state,bg,layer,native};
globalThis.nativeInputs=[];for(const type of ['pointerdown','pointermove','pointerup','mousedown','mousemove','mouseup','click'])document.addEventListener(type,e=>{if(e.target===document.querySelector('#map'))nativeInputs.push(type);},{capture:true});
stored.set('solidWindows',false);const module=await import('/scripts/main.mjs');globalThis.openTool=module.openGridAlign;globalThis.app=await openTool();
</script>`;

// ---- Focus sweep ----
// Foundry's own :focus style, simulated as an orange outline and glow, must not stay on a control focused by the
// mouse: each control keeps its resting look.
// Keyboard focus still shows the kit's blue ring. Transitions are off so a lost rule can't hide behind a fade.
const FOCUS_ORANGE = 'rgb(255, 102, 0)', KIT_RING = 'rgb(140, 207, 255)';
const FOUNDRY_FOCUS = `button:focus, .application button:focus, .application .window-content button:focus { outline: 2px solid ${FOCUS_ORANGE}; box-shadow: 0 0 6px ${FOCUS_ORANGE}; }
  :is(input, select, textarea):focus, .application :is(input, select, textarea):focus, .application .window-content :is(input, select, textarea):focus { outline: 1px solid ${FOCUS_ORANGE}; box-shadow: 0 0 6px ${FOCUS_ORANGE}; }
  *, *::before, *::after { transition: none !important; }`;
async function focusSweep(page, root, {neutral, kit = '/styles/foundry-kit.css'} = {}) {
  // A second kit copy after the module's CSS, as another module's copy loads in a real world, then Foundry's rule.
  const tags = [];
  if (kit) tags.push(await page.addStyleTag({url:kit}));
  tags.push(await page.addStyleTag({content:FOUNDRY_FOCUS}));
  // A mouse click on a plain spot sets mouse modality; script focus then matches :focus but not :focus-visible.
  const spot = neutral ?? `${root} .fk-app-title, ${root} .window-title, ${root} h1, ${root} h2`;
  await page.locator(spot).first().click({position:{x:2, y:2}}).catch(() => page.mouse.click(2, 2));
  const out = await page.evaluate(root => {
    const host = document.querySelector(root), bad = [], seen = {buttons:0, checks:0, fields:0, selects:0, other:0};
    const name = el => `${el.tagName.toLowerCase()}${el.type ? `[${el.type}]` : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} "${(el.getAttribute('aria-label') ?? el.textContent ?? el.name ?? '').trim().slice(0, 30)}"`;
    const look = el => { const s = getComputedStyle(el); return {outline:s.outlineStyle === 'none' ? 'none' : `${s.outlineStyle} ${s.outlineColor}`, shadow:s.boxShadow}; };
    const typing = el => el.matches('textarea, input:not([type]), input:is([type="text"], [type="search"], [type="number"], [type="email"], [type="url"], [type="password"])');
    const controls = [...host.querySelectorAll('button, input, select, textarea, summary')].filter(el => !el.disabled && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    for (const el of controls) {
      if (el.tagName === 'SELECT') continue; // a real click below: Chrome rings a mouse-picked select as if by keyboard
      document.activeElement?.blur?.();
      const rest = look(el);
      el.focus({preventScroll:true, focusVisible:false});
      if (el.matches(":focus-visible") && !typing(el)) { bad.push(`${name(el)}: script focus with focusVisible:false still matches :focus-visible`); continue; }
      if (document.activeElement !== el) continue;
      if (!host.querySelector('[data-focus-sweep-key]') && el.matches('button') && el.tabIndex >= 0) el.dataset.focusSweepKey = '1'; // the keyboard check starts here
      const now = look(el);
      const orange = `${now.outline} ${now.shadow}`.includes('255, 102, 0');
      if (typing(el)) { seen.fields++; if (orange) bad.push(`${name(el)}: Foundry focus on a field (${now.outline}; ${now.shadow})`); continue; }
      el.matches('button, summary') ? seen.buttons++ : el.type === 'checkbox' || el.type === 'radio' ? seen.checks++ : seen.other++;
      if (orange || now.outline !== rest.outline || now.shadow !== rest.shadow) bad.push(`${name(el)}: rest ${rest.outline}; ${rest.shadow} / mouse focus ${now.outline}; ${now.shadow}`);
    }
    document.activeElement?.blur?.();
    return {bad, seen, selects:controls.filter(el => el.tagName === 'SELECT').map((el, i) => { el.dataset.focusSweep = String(i); return {i, rest:look(el), label:name(el)}; })};
  }, root);
  for (const s of out.selects) {
    const sel = `${root} select[data-focus-sweep="${s.i}"]`;
    if (await page.locator(sel).click({timeout:3000}).then(() => false, () => true)) { out.seen.unclickable = (out.seen.unclickable ?? 0) + 1; continue; } // hidden in a closed section
    await page.keyboard.up('Shift'); // no key press: Escape would count as keyboard use
    const now = await page.evaluate(sel => { const el = document.querySelector(sel), st = getComputedStyle(el); return {focused:document.activeElement === el, outline:st.outlineStyle === 'none' ? 'none' : `${st.outlineStyle} ${st.outlineColor}`, shadow:st.boxShadow}; }, sel);
    out.seen.selects++;
    if (now.focused && (now.outline !== 'none' || now.shadow !== s.rest.shadow)) out.bad.push(`${s.label}: clicked select keeps ${now.outline}; ${now.shadow}`);
    await page.locator(spot).first().click({position:{x:2, y:2}}).catch(() => page.mouse.click(2, 2));
  }
  // Keyboard: Tab onto the first button shows the kit ring and no orange.
  const first = await page.evaluate(root => !!document.querySelector(`${root} [data-focus-sweep-key]`), root);
  if (first) {
    // Tab away and Shift+Tab back: the button now has keyboard focus, whatever comes next in the tab order.
    await page.evaluate(root => document.querySelector(`${root} [data-focus-sweep-key]`).focus({focusVisible:false}), root);
    await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    const k = await page.evaluate(root => { const el = document.activeElement, s = getComputedStyle(el); return {inside:document.querySelector(root).contains(el), what:`${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`, inner:el.matches('.fk-choice > input, .fk-range'), outline:`${s.outlineStyle} ${s.outlineColor}`, shadow:s.boxShadow}; }, root);
    out.seen.keyboard = k.what;
    if (!k.inside) out.bad.push(`Shift+Tab left the window (${k.what})`);
    else { if (!k.inner && k.outline !== `solid ${KIT_RING}`) out.bad.push(`keyboard focus on ${k.what} shows ${k.outline}, not the kit ring`); if (k.shadow.includes('255, 102, 0')) out.bad.push(`keyboard focus on ${k.what} keeps Foundry's glow: ${k.shadow}`); }
    await page.locator(spot).first().click({position:{x:2, y:2}}).catch(() => page.mouse.click(2, 2));
  }
  for (const t of tags) await t.evaluate(el => el.remove()); // later checks see the page as before
  return out;
}

const browser = await chromium.launch({channel:'chrome', headless:true});
try {
  const page = await browser.newPage({viewport:{width:1200, height:1000}}), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let gridType = 1;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/') return route.fulfill({contentType:'text/html', body:fixture(gridType)});
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(root + path.sep)) return route.abort();
    try { await route.fulfill({contentType:file.endsWith('.mjs') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.woff2') ? 'font/woff2' : 'text/plain', body:await fs.readFile(file)}); }
    catch { await route.fulfill({status:404, body:'Missing fixture asset'}); }
  });
  const load = async type => { gridType = type; await page.goto('http://grid-align.test/'); await page.waitForSelector('#ga-size'); };
  const status = () => page.textContent('#ga-status');
  await load(1);

  if (process.env.KIT_MASTER) await check('kit 2.0 stylesheet and fonts are identical to the master', async () => {
    const master = path.resolve(process.env.KIT_MASTER);
    const files = ['styles/foundry-kit.css', ...(await fs.readdir(path.join(master, 'assets/fonts')).catch(() => [])).map(f => `assets/fonts/${f}`)];
    for (const f of files) {
      const b = await fs.readFile(path.join(master, f)).catch(() => null);
      if (b) assert.ok((await fs.readFile(path.join(root, f))).equals(b), `${f} differs from the kit master`);
    }
  });
  await check('window is a kit 2.0 AppShell named for the map; fonts load first; Solid windows toggles fk-opaque', async () => {
    const r = await page.evaluate(() => { const w = document.querySelector('#grid-align'); return {cls:[...w.classList], title:w.querySelector('.fk-app-title').textContent, eyebrow:w.querySelectorAll('.fk-eyebrow').length, fonts:document.fonts.check('500 15px "Alegreya Sans"'), font:getComputedStyle(w.querySelector('.fk-app-body')).fontFamily}; });
    assert.ok(r.cls.includes('fvtt-kit') && r.cls.includes('fk-window') && !r.cls.includes('fk-opaque'));
    assert.equal(r.title, 'Imported scene background'); assert.equal(r.eyebrow, 0); assert.match(r.font, /Alegreya Sans/); assert.equal(r.fonts, true, 'Alegreya Sans loaded before the first render');
    await page.evaluate(async () => { await game.settings.set('grid-align', 'solidWindows', true); await app.render(); });
    assert.equal(await page.evaluate(() => document.querySelector('#grid-align').classList.contains('fk-opaque')), true);
    await page.evaluate(async () => { await game.settings.set('grid-align', 'solidWindows', false); await app.render(); });
  });
  await check('opens clean: Apply and Revert disabled, status explains why', async () => {
    assert.equal(await page.inputValue('#ga-x'), '0');
    assert.equal(await page.locator('[data-ga="apply"]').isDisabled(), true);
    assert.equal(await page.locator('[data-ga="reset"]').isDisabled(), true);
    assert.equal(await status(), lang.GA.Ready);
    assert.equal(await page.getAttribute('#ga-status', 'data-state'), 'clean');
  });
  await check('one gold action placed last; Drag and Box are pressed buttons', async () => {
    assert.equal(await page.locator('.fk-btn-primary').count(), 1);
    assert.equal(await page.locator('.fk-app-actions > :last-child').getAttribute('data-ga'), 'apply');
    assert.equal(await page.locator('[data-ga][aria-pressed]').count(), 2);
  });
  await check('nudge step is a radiogroup: arrow keys move the choice and the step', async () => {
    assert.equal(await page.getAttribute('[data-step="1"]', 'aria-checked'), 'true');
    await page.locator('[data-step="1"]').focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.getAttribute('[data-step="5"]', 'aria-checked'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.step), '5');
    await page.click('[data-ga="right"]'); assert.equal(await page.inputValue('#ga-x'), '5');
    assert.equal(await page.getAttribute('#ga-status', 'data-state'), 'dirty');
    assert.equal(await page.locator('.fk-panel-meta').count(), 0);
    await page.click('[data-step="1"]'); await page.click('[data-ga="reset"]');
  });
  await check('preview switch says On and Off in words', async () => {
    assert.equal(await page.textContent('.fk-toggle-state'), 'On');
    await page.click('.fk-toggle'); assert.equal(await page.textContent('.fk-toggle-state'), 'Off');
    await page.click('.fk-toggle'); assert.equal(await page.textContent('.fk-toggle-state'), 'On');
    // 1.0.1: no descriptor lines; the switch closes the body with only the body's own padding under it.
    const r = await page.evaluate(() => { const b = document.querySelector('.ga .fk-app-body'), s = b.querySelector('.ga-preview'), last = [...b.children].filter(e => e.getClientRects().length).at(-1);
      return {last:last === s, gap:Math.round(b.getBoundingClientRect().bottom - s.getBoundingClientRect().bottom - parseFloat(getComputedStyle(b).paddingBottom)), hints:[...b.querySelectorAll('.fk-hint')].map(h => h.textContent), tip:s.dataset.tooltip, desc:document.getElementById(s.querySelector('input').getAttribute('aria-describedby'))?.textContent}; });
    assert.equal(r.last, true); assert.ok(Math.abs(r.gap) <= 1, `leftover gap under the switch: ${r.gap}px`);
    assert.ok(r.hints.every(h => !/Only you see|Only the grid moves/.test(h)), r.hints.join(' | '));
    assert.equal(r.tip, lang.GA.PreviewTip); assert.equal(r.desc, lang.GA.PreviewTip);
    await page.locator('#grid-align').screenshot({path:path.join(shots, 'grid-align-clean.png')});
  });
  await check('nudge, keyboard nudge and revert', async () => {
    await page.click('[data-ga="right"]'); assert.equal(await page.inputValue('#ga-x'), '1'); assert.equal(await page.evaluate(() => saved), 0);
    await page.locator('.ga-pad').focus(); await page.keyboard.press('Shift+ArrowDown'); assert.equal(await page.inputValue('#ga-y'), '10');
    await page.click('[data-ga="reset"]'); assert.equal(await page.inputValue('#ga-y'), '0');
  });
  await check('status is not rewritten on every redraw', async () => {
    await page.click('[data-ga="larger"]');
    const writes = await page.evaluate(() => { let n = 0; new MutationObserver(m => { n += m.length; }).observe(document.querySelector('#ga-status'), {childList:true, characterData:true, subtree:true}); window.statusWrites = () => n; return 0; });
    await page.click('[data-ga="larger"]'); await page.click('[data-ga="larger"]');
    assert.equal(await page.evaluate(() => statusWrites()), writes);
    assert.equal(await page.inputValue('#ga-size'), '103');
  });
  await check('invalid number names the field and its range, then marks and focuses it', async () => {
    await page.locator('#ga-x').fill(''); await page.locator('#ga-x').blur();
    const message = 'Grid shift X must be a whole number from −1,000,000 to 1,000,000.';
    assert.equal(await status(), message);
    assert.equal(await page.getAttribute('#ga-x', 'aria-invalid'), 'true');
    assert.equal(await page.textContent('#ga-x-error'), message);
    assert.equal(await page.locator('#ga-x-error').isVisible(), true);
    assert.match(await page.getAttribute('#ga-x', 'aria-describedby'), /ga-x-error/);
    await page.click('[data-ga="apply"]');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'ga-x');
    await page.click('[data-ga="reset"]'); assert.equal(await page.inputValue('#ga-size'), '100');
    assert.equal(await page.locator('#ga-x-error').isVisible(), false);
    assert.equal(await page.getAttribute('#ga-x', 'aria-describedby'), null);
  });
  await check('typing a usable number clears the red field at once, without leaving it', async () => {
    await page.locator('#ga-x').fill(''); await page.locator('#ga-x').blur();
    assert.equal(await page.getAttribute('#ga-x', 'aria-invalid'), 'true');
    await page.locator('#ga-x').fill('7');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'ga-x');
    assert.equal(await page.getAttribute('#ga-x', 'aria-invalid'), null);
    assert.equal(await page.locator('#ga-x-error').isVisible(), false);
    assert.notEqual(await page.getAttribute('#ga-status', 'data-state'), 'error');
    assert.equal(await page.evaluate(() => app.session.draft.x), 7);
    await page.click('[data-ga="reset"]');
  });
  await check('numbers use lining figures at body size, over Foundry\'s number-input font', async () => {
    const r = await page.evaluate(() => { const s = getComputedStyle(document.querySelector('#ga-size')), a = getComputedStyle(document.querySelector('.fk-affix')); return {size:s.fontSize, family:s.fontFamily, nums:s.fontVariantNumeric, affix:a.fontSize}; });
    assert.equal(r.size, '15px'); assert.match(r.family, /Alegreya Sans/); assert.match(r.nums, /lining-nums/); assert.equal(r.affix, '15px');
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#ga-status')).fontSize), '15px');
  });
  await check('Shift + arrows nudge 10 px from anywhere; text fields keep their arrows', async () => {
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press('Shift+ArrowRight'); assert.equal(await page.inputValue('#ga-x'), '10');
    await page.keyboard.press('Shift+ArrowUp'); assert.equal(await page.inputValue('#ga-y'), '-10');
    await page.evaluate(() => { const i = document.createElement('input'); i.id = 'other'; document.body.append(i); i.focus(); });
    await page.keyboard.press('Shift+ArrowRight'); assert.equal(await page.inputValue('#ga-x'), '10');
    await page.evaluate(() => document.querySelector('#other').remove());
    await page.click('[data-ga="reset"]');
  });
  await check('holding Larger repeats; one click or Enter steps once', async () => {
    const larger = await page.locator('[data-ga="larger"]').boundingBox();
    await page.mouse.move(larger.x + larger.width / 2, larger.y + larger.height / 2);
    await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up();
    const held = Number(await page.inputValue('#ga-size'));
    assert.ok(held >= 104, `held press reached only ${held}`);
    await page.waitForTimeout(200); assert.equal(Number(await page.inputValue('#ga-size')), held, 'repeat stopped on release');
    await page.click('[data-ga="reset"]');
    await page.click('[data-ga="smaller"]'); assert.equal(await page.inputValue('#ga-size'), '99');
    await page.locator('[data-ga="larger"]').focus(); await page.keyboard.press('Enter'); assert.equal(await page.inputValue('#ga-size'), '100');
    await page.click('[data-ga="larger"]'); await page.click('[data-ga="reset"]');
  });
  await check('editing back to the saved values reads "No changes yet" again', async () => {
    await page.click('[data-ga="right"]'); assert.equal(await status(), lang.GA.Unsaved);
    await page.click('[data-ga="left"]'); assert.equal(await status(), lang.GA.Ready);
    assert.equal(await page.getAttribute('#ga-status', 'data-state'), 'clean');
    await page.locator('#ga-size').fill('101'); await page.locator('#ga-size').blur(); assert.equal(await status(), lang.GA.Unsaved);
    await page.locator('#ga-size').fill('100'); await page.locator('#ga-size').blur(); assert.equal(await status(), lang.GA.Ready);
  });
  await check('Esc or leaving the window turns a tool off and its help leaves the status', async () => {
    await page.click('[data-ga="drag"]'); assert.equal(await status(), lang.GA.DragHelp);
    await page.keyboard.press('Escape');
    assert.equal(await page.getAttribute('[data-ga="drag"]', 'aria-pressed'), 'false'); assert.equal(await status(), lang.GA.Ready);
    await page.click('[data-ga="box"]'); assert.equal(await status(), lang.GA.BoxHelp);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal(await page.getAttribute('[data-ga="box"]', 'aria-pressed'), 'false'); assert.equal(await status(), lang.GA.Ready);
  });
  await check('steppers stop at the bounds; a field error keeps them level with the field', async () => {
    await page.locator('#ga-size').fill('50'); await page.locator('#ga-size').blur();
    assert.equal(await page.locator('[data-ga="smaller"]').isDisabled(), true); assert.equal(await page.locator('[data-ga="larger"]').isDisabled(), false);
    assert.notEqual(await page.getAttribute('#ga-status', 'data-state'), 'error');
    await page.locator('#ga-size').fill('10000'); await page.locator('#ga-size').blur();
    assert.equal(await page.locator('[data-ga="larger"]').isDisabled(), true); assert.equal(await page.locator('[data-ga="smaller"]').isDisabled(), false);
    await page.click('[data-ga="reset"]');
    await page.locator('#ga-size').fill(''); await page.locator('#ga-size').blur();
    assert.equal(await page.locator('#ga-size-error').isVisible(), true);
    const r = await page.evaluate(() => { const b = s => document.querySelector(s).getBoundingClientRect(); return {input:b('#ga-size').bottom, smaller:b('[data-ga="smaller"]').bottom, larger:b('[data-ga="larger"]').bottom}; });
    assert.ok(Math.abs(r.smaller - r.input) < 2 && Math.abs(r.larger - r.input) < 2, `steppers ${r.smaller}/${r.larger} vs field ${r.input}`);
    await page.locator('#ga-size').fill('100'); await page.locator('#ga-size').blur(); assert.equal(await page.locator('#ga-size-error').isVisible(), false);
  });
  await check('steppers and arrow pad are icon-only, named by aria-label and tooltip', async () => {
    const r = await page.evaluate(() => [...document.querySelectorAll('.ga-size .fk-btn, .ga-pad .fk-btn')].map(b => ({icon:b.classList.contains('fk-btn-icon'), text:b.textContent.trim(), label:b.getAttribute('aria-label'), tip:b.dataset.tooltip})));
    assert.equal(r.length, 6);
    for (const b of r) { assert.equal(b.icon, true); assert.equal(b.text, ''); assert.ok(b.label); assert.equal(b.tip, b.label); }
  });
  await check('a 3×3 box narrower than 3 minimum cells says so and stays on', async () => {
    await page.click('[data-ga="box"]'); await page.mouse.move(100, 100); await page.mouse.down(); await page.mouse.move(130, 130, {steps:4}); await page.mouse.up();
    assert.equal(await status(), lang.GA.BoxTooSmall.replace('{min}', '50').replace('{width}', '150'));
    assert.equal(await page.getAttribute('[data-ga="box"]', 'aria-pressed'), 'true');
    await page.keyboard.press('Escape'); await page.click('[data-ga="reset"]').catch(() => {});
  });
  await check('holding an arrow-pad button repeats the nudge; one click nudges once', async () => {
    const right = await page.locator('[data-ga="right"]').boundingBox();
    await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2);
    await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up();
    const held = Number(await page.inputValue('#ga-x'));
    assert.ok(held >= 4, `held press reached only ${held}`);
    await page.waitForTimeout(200); assert.equal(Number(await page.inputValue('#ga-x')), held, 'repeat stopped on release');
    await page.click('[data-ga="reset"]');
    await page.click('[data-ga="down"]'); assert.equal(await page.inputValue('#ga-y'), '1');
    await page.click('[data-ga="reset"]');
  });
  await check('drag at zoom does not reach native listeners', async () => {
    await page.click('[data-ga="drag"]'); assert.equal(await page.getAttribute('[data-ga="drag"]', 'aria-pressed'), 'true');
    await page.mouse.move(120, 200); await page.evaluate(() => { nativeInputs = []; }); await page.mouse.down(); await page.mouse.move(190, 235, {steps:10}); await page.mouse.up();
    assert.equal(await page.inputValue('#ga-x'), '100'); assert.equal(await page.inputValue('#ga-y'), '50'); assert.deepEqual(await page.evaluate(() => nativeInputs), []);
    await page.click('[data-ga="drag"]');
    assert.equal(await page.getAttribute('[data-ga="drag"]', 'aria-pressed'), 'false');
    assert.doesNotMatch(await page.evaluate(() => getComputedStyle(document.querySelector('[data-ga="drag"]')).boxShadow), /255, 0, 0/);
  });
  await check('3×3 box fits, shows the guide, then returns normal input', async () => {
    await page.click('[data-ga="box"]'); await page.mouse.move(70, 70); await page.evaluate(() => { nativeInputs = []; }); await page.mouse.down(); await page.mouse.move(280, 280, {steps:8});
    assert.equal(await page.inputValue('#ga-size'), '100'); assert.equal(await page.locator('.ga-box-guide line').count(), 4);
    await page.mouse.up(); assert.equal(await page.locator('.ga-box-guide').count(), 0); assert.equal(await page.getAttribute('[data-ga="box"]', 'aria-pressed'), 'false');
    // Box still has mouse focus: Foundry's red :focus glow (simulated in the fixture) must not show.
    const shadow = await page.evaluate(() => { const b = document.querySelector('[data-ga="box"]'); return {focused:document.activeElement === b, shadow:getComputedStyle(b).boxShadow, outline:getComputedStyle(b).outlineStyle}; });
    assert.equal(shadow.focused, true); assert.doesNotMatch(shadow.shadow, /255, 0, 0/); assert.equal(shadow.outline, 'none');
    await page.mouse.click(300, 300); assert.ok((await page.evaluate(() => nativeInputs)).includes('mousedown'));
    await page.locator('#ga-y').fill('50'); await page.locator('#ga-y').blur();
  });
  await check('Cancel with unapplied changes asks; Keep editing stays open', async () => {
    await page.click('[data-ga="cancel"]');
    assert.equal(await page.evaluate(() => confirmCalls), 1);
    assert.equal(await page.locator('#grid-align').count(), 1);
    assert.equal(await page.inputValue('#ga-x'), '100');
  });
  await check('rejected save recovers with a message and keeps the draft', async () => {
    await page.evaluate(() => { failSave = true; }); await page.click('[data-ga="apply"]'); await page.waitForFunction(() => !app.session.busy);
    assert.equal(await page.getAttribute('#ga-status', 'data-state'), 'error');
    assert.equal(await page.getAttribute('[data-ga="apply"]', 'aria-busy'), 'false');
    assert.equal(await page.textContent('[data-ga="apply"] span'), lang.GA.Apply);
    assert.equal(await page.locator('[data-ga="apply"]').isDisabled(), false);
    await page.evaluate(() => { failSave = false; });
  });
  await check('narrow window: no sideways overflow, footer visible at 340px and 320px', async () => {
    assert.equal(await status(), lang.GA.SaveFailed);
    await page.waitForTimeout(300);
    await page.screenshot({path:path.join(shots, 'grid-align-normal.png')});
    for (const width of [340, 320]) {
      await page.evaluate(w => { document.querySelector('#grid-align').style.width = `${w}px`; }, width); await page.waitForTimeout(300);
      const m = await page.evaluate(() => { const b = document.querySelector('.ga .fk-app-body'); const f = document.querySelector('.ga .fk-app-footer').getBoundingClientRect(); return {over:b.scrollWidth - b.clientWidth, bottom:f.bottom, vh:innerHeight}; });
      assert.ok(m.over <= 1, `body overflows by ${m.over}px at ${width}px`); assert.ok(m.bottom <= m.vh, `footer off screen at ${width}px`);
      await page.screenshot({path:path.join(shots, `grid-align-narrow-${width}.png`)});
    }
    await page.evaluate(() => { document.querySelector('#grid-align').style.width = '420px'; });
  });
  await check('Apply shows "Applying…", saves once, closes without asking', async () => {
    await page.evaluate(() => { globalThis.release = null; holdSave = new Promise(r => { globalThis.release = r; }); });
    await page.click('[data-ga="apply"]');
    assert.equal(await page.textContent('[data-ga="apply"] span'), lang.GA.Applying);
    await page.evaluate(() => { holdSave = null; release(); });
    await page.waitForSelector('#grid-align', {state:'detached'});
    assert.equal(await page.evaluate(() => saved), 1); assert.equal(await page.evaluate(() => confirmCalls), 1);
    assert.deepEqual(await page.evaluate(() => fixture.state.flags['grid-align'].origin), {x:100, y:50});
    assert.equal(await page.evaluate(() => fixture.bg.textures.offsetX), 12);
  });
  await check('Cancel with no changes closes without asking; Discard closes with changes', async () => {
    await page.evaluate(async () => { app = await openTool(); });
    await page.click('[data-ga="cancel"]'); await page.waitForSelector('#grid-align', {state:'detached'});
    assert.equal(await page.evaluate(() => confirmCalls), 1);
    await page.evaluate(async () => { app = await openTool(); confirmAnswer = true; });
    await page.click('[data-ga="origin"]'); await page.click('[data-ga="cancel"]');
    await page.waitForSelector('#grid-align', {state:'detached'});
    assert.equal(await page.evaluate(() => confirmCalls), 2); assert.equal(await page.evaluate(() => saved), 1);
    assert.equal(await page.evaluate(() => fixture.layer.children.length), 0);
  });
  await check('the map is named once: no level line when the level repeats the scene name', async () => {
    const r = await page.evaluate(async () => {
      app = await openTool(); const before = document.querySelectorAll('.ga-level').length;
      await app.close({discard:true}); const original = canvas.level.name; canvas.level.name = ` ${canvas.scene.name.toUpperCase()} `;
      app = await openTool(); const after = document.querySelectorAll('.ga-level').length, title = document.querySelector('.ga-scene').textContent;
      await app.close({discard:true}); canvas.level.name = original; return {before, after, title};
    });
    assert.equal(r.before, 1); assert.equal(r.after, 0); assert.equal(r.title, 'Imported scene background');
  });
  await check('opens just left of the map\'s left edge, or as far left as the controls allow', async () => {
    const r = await page.evaluate(async () => {
      const m = await import('/scripts/main.mjs'), saved = canvas.clientCoordinatesFromCanvas;
      canvas.dimensions = {sceneRect:{x:0, y:0}};
      canvas.clientCoordinatesFromCanvas = () => ({x:700, y:60}); const beside = m.startPosition();
      canvas.clientCoordinatesFromCanvas = () => ({x:-200, y:-40}); const noControls = m.startPosition();
      const controls = Object.assign(document.createElement('div'), {id:'scene-controls'}), sidebar = Object.assign(document.createElement('div'), {id:'ui-right'});
      controls.style.cssText = 'position:fixed;left:0;top:0;width:60px;height:10px'; sidebar.style.cssText = 'position:fixed;right:0;top:0;width:320px;height:10px'; document.body.append(controls, sidebar);
      const offscreen = m.startPosition();
      canvas.clientCoordinatesFromCanvas = () => ({x:2000, y:60}); const farRight = m.startPosition();
      controls.remove(); sidebar.remove();
      delete canvas.dimensions; const none = m.startPosition();
      canvas.clientCoordinatesFromCanvas = saved; return {beside, noControls, offscreen, farRight, none, sidebarLeft:innerWidth - 320};
    });
    assert.deepEqual(r.beside, {left:700 - 420 - 16, top:60});
    assert.deepEqual(r.noControls, {left:80, top:8}, 'assumes a 72 px controls column when it can\'t find one');
    assert.deepEqual(r.offscreen, {left:68, top:8}, 'just right of the scene controls');
    assert.deepEqual(r.farRight, {left:r.sidebarLeft - 420 - 8, top:60}, 'never under the right-hand sidebar');
    assert.deepEqual(r.none, {}, 'falls back to Foundry\'s own placement');
  });
  await check('hex scene: Box disabled with a visible reason', async () => {
    await load(2);
    assert.equal(await page.locator('[data-ga="box"]').isDisabled(), true);
    assert.equal(await page.textContent('#ga-box-help'), lang.GA.BoxUnavailable);
    await page.screenshot({path:path.join(shots, 'grid-align-hex.png')});
  });
  await check('Scene Configuration grid tab gets a native Open button; other scenes say why it is off', async () => {
    const r = await page.evaluate(async () => {
      await app.close({discard:true});
      const sheet = (doc, id) => { const el = document.createElement('div'); el.innerHTML = '<section class="tab" data-tab="grid" data-application-part="grid"><div class="form-group"><input name="grid.size"></div></section>'; document.body.append(el); fire('renderSceneConfig', {id, document:doc, element:el}, el); return el; };
      const here = sheet(canvas.scene, 'sc-here'), other = sheet({...canvas.scene, id:'other', documentName:'Scene'}, 'sc-other');
      canvas.scene.documentName = 'Scene';
      const here2 = sheet(canvas.scene, 'sc-here2');
      const button = here2.querySelector('.ga-config button'), afterSize = !!here2.querySelector('.ga-config').previousElementSibling?.querySelector('[name="grid.size"]');
      const out = {skippedWithoutType:!here.querySelector('.ga-config'), afterSize, kit:!!here2.querySelector('.ga-config [class*="fk-"]'), label:button.textContent.trim(), hint:here2.querySelector('.ga-config .hint')?.textContent, described:button.getAttribute('aria-describedby') === here2.querySelector('.ga-config .hint').id, otherDisabled:other.querySelector('.ga-config button').disabled, otherHint:other.querySelector('.ga-config .hint')?.textContent};
      fire('renderSceneConfig', {id:'sc-here2', document:canvas.scene, element:here2}, here2);
      out.once = here2.querySelectorAll('.ga-config').length;
      button.click(); await new Promise(r => setTimeout(r, 50)); out.opened = !!document.querySelector('#grid-align');
      return out;
    });
    assert.equal(r.skippedWithoutType, true); assert.equal(r.afterSize, true, 'sits right after the grid size field'); assert.equal(r.kit, false);
    assert.equal(r.label, lang.GA.ConfigOpen); assert.equal(r.hint, lang.GA.ConfigHint); assert.equal(r.described, true);
    assert.equal(r.otherDisabled, true); assert.equal(r.otherHint, `${lang.GA.ConfigNotViewed} ${lang.GA.ConfigHint}`);
    assert.equal(r.once, 1); assert.equal(r.opened, true);
  });
  assert.deepEqual(errors, []);
  await check('1.0.2: no Foundry focus outline or glow stays on a clicked control; Tab shows the kit ring', async () => {
    await load(1);
    const r = await focusSweep(page, '#grid-align');
    assert.deepEqual(r.bad, []);
    assert.ok(r.seen.buttons >= 8 && r.seen.checks >= 1 && r.seen.fields >= 3, JSON.stringify(r.seen));
  });
  console.log(`Grid Align browser check: ${results.length} passed`);
  for (const r of results) console.log(`  ✓ ${r}`);
} finally { await browser.close(); }
