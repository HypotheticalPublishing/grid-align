import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {markup, fieldMessage, escapeHTML, STEPS} from '../scripts/ui.mjs';

const lang = JSON.parse(fs.readFileSync(new URL('../lang/en.json', import.meta.url), 'utf8')).GA;
const t = key => lang[key] ?? `GA.${key}`;

test('fieldMessage names the field and formats its range', () => {
  assert.equal(fieldMessage(lang.FieldRange, lang.GridSize, 50, 10000), 'Cell size must be a whole number from 50 to 10,000.');
  assert.equal(fieldMessage(lang.FieldRange, lang.X, -1000000, 1000000), 'Grid shift X must be a whole number from −1,000,000 to 1,000,000.');
});

test('range errors use the field names shown in the window; generic failure doesn\'t say to reopen', () => {
  assert.match(lang.SizeRange, new RegExp(`^${lang.GridSize} `));
  assert.match(lang.OffsetRange, new RegExp(`^${lang.X} and Y `));
  assert.doesNotMatch(lang.Failed, /reopen/i);
});

test('every key the interface uses exists in the language file', () => {
  const html = markup(t, 'S', 'L', 50) + markup(t, 'S', 'L', 50, {square:false});
  assert.doesNotMatch(html, /GA\.\w+/);
  for (const key of ['FieldRange', 'Applying', 'DiscardTitle', 'DiscardBody', 'Discard', 'Keep', 'BoxUnavailable', 'Off', 'SolidWindows', 'SolidWindowsHint', 'ConfigOpen', 'ConfigNotViewed', 'Title']) assert.ok(lang[key], key);
});

test('kit 2.0 AppShell: header names the map, one primary placed last, status in the footer', () => {
  const html = markup(t, 'Scene', 'Level', 50);
  assert.match(html, /^<div class="fk-app ga">/);
  assert.match(html, /<h2 class="fk-app-title ga-scene">Scene<\/h2>\s*<p class="fk-app-context ga-level">Level<\/p>/);
  assert.doesNotMatch(html, /fk-eyebrow/);
  assert.doesNotMatch(html, /ga-scale-meta|ga-move-meta|fk-panel-meta/);
  assert.equal(html.match(/fk-btn-primary/g).length, 1);
  assert.match(html, /fk-btn fk-btn-primary" data-ga="apply"[^>]*><i[^>]*><\/i><span>[^<]+<\/span><\/button><\/div>\s*<\/footer>/);
  assert.match(html, /<footer class="fk-app-footer">\s*<span id="ga-status" class="fk-app-status/);
});

test('Drag and Box are pressed buttons; nudge step is a radiogroup; preview is a switch', () => {
  const html = markup(t, 'Scene', 'Level', 50);
  assert.match(html, /class="fk-btn" data-ga="box" aria-pressed="false"/);
  assert.match(html, /class="fk-btn" data-ga="drag" aria-pressed="false"/);
  assert.match(html, /class="fk-segmented ga-step" role="radiogroup"/);
  assert.equal(html.match(/role="radio" data-step=/g).length, STEPS.length);
  assert.match(html, /role="switch" name="preview"/);
});

test('number fields carry a px unit and an error line', () => {
  const html = markup(t, 'Scene', 'Level', 50);
  for (const name of ['size', 'x', 'y']) {
    assert.match(html, new RegExp(`id="ga-${name}"[^>]*><span class="fk-affix" aria-hidden="true">px</span>`));
    assert.match(html, new RegExp(`<span class="fk-error" id="ga-${name}-error" hidden></span>`));
  }
});

test('section headers use title case; the arrow pad carries no hint text', () => {
  const html = markup(t, 'Scene', 'Level', 50);
  for (const key of ['Scale', 'Move']) {
    assert.match(html, new RegExp(`class="fk-panel-title"[^>]*>${lang[key]}</h3>`));
    for (const word of lang[key].split(' ').filter(w => !['and', 'or', 'of', 'the'].includes(w))) assert.match(word, /^[A-Z]/, `${key}: ${word}`);
  }
  assert.doesNotMatch(html, /ga-move-help|ga-pad-wrap/);
  assert.equal(lang.MoveHelp, undefined);
  assert.match(html, /<div class="ga-pad" tabindex="0" role="group" aria-label="[^"]+">/);
});

test('hex scenes explain why the 3×3 box is unavailable, in visible text', () => {
  assert.match(markup(t, 'S', 'L', 50, {square:false}), new RegExp(`id="ga-box-help">${lang.BoxUnavailable}`));
  assert.match(markup(t, 'S', 'L', 50), new RegExp(`id="ga-box-help">${lang.BoxHint}`));
});

test('square grids lead with the 3×3 box; hex grids put its note last', () => {
  const square = markup(t, 'S', 'L', 50), hex = markup(t, 'S', 'L', 50, {square:false});
  assert.ok(square.indexOf('data-ga="box"') < square.indexOf('class="ga-size"'));
  assert.ok(hex.indexOf('data-ga="box"') > hex.indexOf('id="ga-size-help"'));
});

test('the Cell size hint states the scene\'s real range, so a greyed-out stepper has a visible reason', () => {
  assert.match(markup(t, 'S', 'L', 50), /id="ga-size-help">50 to 10,000 px, on every level\.</);
  assert.match(markup(t, 'S', 'L', 64), /id="ga-size-help">64 to 10,000 px,/);
});

test('cell size error sits under the stepper row, not inside it', () => {
  assert.match(markup(t, 'S', 'L', 50), /<div class="ga-size-wrap"><div class="ga-size">(?:(?!ga-size-error).)*<\/div><span class="fk-error" id="ga-size-error" hidden><\/span><\/div>/s);
});

test('no copy left behind: status states, preview name, Clear grid shift, no scope line', () => {
  assert.equal(lang.Unsaved, 'Unsaved changes');
  assert.doesNotMatch(lang.Preview, /High-contrast/);
  assert.equal(lang.Origin, 'Clear grid shift');
  assert.equal(lang.Scope, undefined);
  assert.equal(lang.PreviewHelp, undefined);
  assert.doesNotMatch(lang.ShaderUnsupported, /report/);
  for (const key of ['BoxTooSmall', 'ConfigHint']) assert.ok(lang[key], key);
});

test('the level line appears only when it adds something', () => {
  assert.match(markup(t, 'Scene', 'Level', 50), /<p class="fk-app-context ga-level">Level<\/p>/);
  assert.doesNotMatch(markup(t, 'Scene', '', 50), /ga-level/);
});

test('window text stays short: each hint is one short sentence', () => {
  for (const key of ['SizeHelp', 'BoxHint', 'BoxUnavailable', 'PreviewTip']) assert.ok(lang[key].length <= 60, `${key} is ${lang[key].length} characters`);
});

test('1.0.1: no descriptor lines under the preview switch; its explanation is the tooltip and its description', () => {
  const html = markup(t, 'Scene', 'Level', 50);
  assert.doesNotMatch(html, /<p[^>]*>Only you see|Only the grid moves|ga-warning|<p class="fk-hint" id="ga-preview/);
  assert.match(html, new RegExp(`<label class="fk-toggle ga-preview" data-tooltip="${lang.PreviewTip}"><input [^>]*aria-describedby="ga-preview-tip"`));
  assert.match(html, new RegExp(`<span id="ga-preview-tip" hidden>${lang.PreviewTip}</span></label>\\s*</div>`), 'the switch is the last thing in the body');
});

test('scene and level names are escaped', () => {
  const html = markup(t, '<img src=x onerror=1>', 'A & B', 50);
  assert.match(html, /&lt;img src=x onerror=1&gt;/);
  assert.match(html, /A &amp; B/);
  assert.equal(escapeHTML(null), '');
});
