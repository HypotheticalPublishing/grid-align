export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

// Numbers in messages: thousands separators and a true minus sign, matching the language file.
const formatNumber=n=>(n<0?'−':'')+Math.abs(n).toLocaleString('en-US');

/** Plain-language range message that names the field, e.g. "Cell size must be a whole number from 50 to 10,000." */
export function fieldMessage(template,label,min,max){
 return String(template).replace('{field}',label).replace('{min}',formatNumber(min)).replace('{max}',formatNumber(max));
}

export const STEPS=[1,5,10];

export function markup(t,scene,level,minSize,{square=true}={}) {
 const icon=name=>`<i class="fa-solid fa-${name} fk-icon" aria-hidden="true"></i>`;
 const button=(id,label,{glyph='',kind='',describedby=''}={})=>`<button type="button" class="fk-btn${kind?` fk-btn-${kind}`:''}" data-ga="${id}"${describedby?` aria-describedby="${describedby}"`:''}>${glyph?icon(glyph):''}<span>${t(label)}</span></button>`;
 // Steppers and the arrow pad are icon-only kit buttons; the name lives in aria-label and Foundry's tooltip.
 const iconButton=(id,label,glyph)=>`<button type="button" class="fk-btn fk-btn-icon" data-ga="${id}" aria-label="${t(label)}" data-tooltip="${t(label)}">${icon(glyph)}</button>`;
 // A single on/off tool is a kit button with aria-pressed: teal, glowing and bold while on.
 const toggle=(id,label,glyph,help='')=>`<button type="button" class="fk-btn" data-ga="${id}" aria-pressed="false"${help?` aria-describedby="${help}"`:''}>${icon(glyph)}<span>${t(label)}</span></button>`;
 // Units sit inside the field; the error line under it is filled in when the value is out of range.
 // Cell size puts its error line under the whole stepper row, so Smaller and Larger stay level with the field.
 const errorLine=name=>`<span class="fk-error" id="ga-${name}-error" hidden></span>`;
 const number=(name,label,min,max,{help='',error=true}={})=>`<div class="fk-field"><label class="fk-label" for="ga-${name}">${t(label)}</label>
   <div class="fk-input-affix"><input class="fk-input ga-number" id="ga-${name}" name="${name}" type="number" inputmode="numeric" step="1" min="${min}" max="${max}" required${help?` aria-describedby="${help}"`:''}><span class="fk-affix" aria-hidden="true">px</span></div>
   ${error?errorLine(name):''}</div>`;
 // On square grids the one-gesture 3×3 box leads; on hex grids its unavailable note goes last.
 const box=`<div class="ga-tool">${toggle('box','Box','vector-square','ga-box-help')}<p class="fk-hint" id="ga-box-help">${t(square?'BoxHint':'BoxUnavailable')}</p></div>`;
 // No descriptor lines under the preview switch or after it (1.0.1). The switch's explanation is its tooltip and stays
 // its accessible description (a hidden span); Scene Configuration's hint says that only the grid moves.
 // No task title or module eyebrow (the person knows which tool they opened), so the header names the map.
 return `<div class="fk-app ga">
 <header class="fk-app-header">
  <div class="fk-app-titles">
   <h2 class="fk-app-title ga-scene">${escapeHTML(scene)}</h2>
   ${level?`<p class="fk-app-context ga-level">${escapeHTML(level)}</p>`:''}
  </div>
 </header>

 <div class="fk-app-body">
  <section class="fk-panel" aria-labelledby="ga-scale-heading">
   <div class="fk-panel-head"><h3 class="fk-panel-title" id="ga-scale-heading">${t('Scale')}</h3></div>
   <div class="fk-panel-body fk-stack">
    ${square?box:''}
    <div class="ga-size-wrap"><div class="ga-size">${iconButton('smaller','Smaller','minus')}${number('size','GridSize',minSize,10000,{help:'ga-size-help',error:false})}${iconButton('larger','Larger','plus')}</div>${errorLine('size')}</div>
    <p class="fk-hint" id="ga-size-help">${t('SizeHelp').replace('{min}',formatNumber(minSize)).replace('{max}',formatNumber(10000))}</p>
    ${square?'':box}
   </div>
  </section>

  <section class="fk-panel" aria-labelledby="ga-move-heading">
   <div class="fk-panel-head"><h3 class="fk-panel-title" id="ga-move-heading">${t('Move')}</h3></div>
   <div class="fk-panel-body fk-stack">
    <div class="ga-move-row"><div class="ga-pad" tabindex="0" role="group" aria-label="${t('NudgeKeys')}">${iconButton('up','Up','arrow-up')}${iconButton('left','Left','arrow-left')}${iconButton('down','Down','arrow-down')}${iconButton('right','Right','arrow-right')}</div>
     <div class="fk-field"><span class="fk-label" id="ga-step-label">${t('Step')}</span>
      <div class="fk-segmented ga-step" role="radiogroup" aria-labelledby="ga-step-label">${STEPS.map(n=>`<button type="button" role="radio" data-step="${n}" aria-checked="false" tabindex="-1">${n} px</button>`).join('')}</div></div></div>
    <div class="ga-offsets">${number('x','X',-1000000,1000000)}${number('y','Y',-1000000,1000000)}</div>
    <div class="ga-tool ga-tool-row">${toggle('drag','Drag','arrows-up-down-left-right')}${button('origin','Origin',{kind:'quiet'})}</div>
   </div>
  </section>

  <label class="fk-toggle ga-preview" data-tooltip="${t('PreviewTip')}"><input type="checkbox" role="switch" name="preview" checked aria-describedby="ga-preview-tip"><span class="fk-toggle-state">${t('On')}</span><span>${t('Preview')}</span><span id="ga-preview-tip" hidden>${t('PreviewTip')}</span></label>
 </div>

 <footer class="fk-app-footer">
  <span id="ga-status" class="fk-app-status ga-status" role="status" aria-live="polite"></span>
  <span class="fk-hints ga-keys"><span><kbd>Shift</kbd><kbd>${t('Arrows')}</kbd> ${t('NudgeTen')}</span><span><kbd>Esc</kbd> ${t('StopTool')}</span></span>
  <div class="fk-app-actions">${button('reset','Reset',{kind:'quiet'})}${button('cancel','Cancel',{kind:'quiet'})}${button('apply','Apply',{glyph:'check',kind:'primary',describedby:'ga-status'})}</div>
 </footer>
</div>`;
}
