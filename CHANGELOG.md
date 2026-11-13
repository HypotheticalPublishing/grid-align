# Grid Align changelog

## 1.0.3 – 2026-11-12

First public release. No behaviour change since 1.0.2: the code that runs in Foundry is the same, apart from source comments.

- The manifest now has the public install links: project page, manifest URL, versioned download, licence, readme, issues and changelog. The author is listed as Hypothetical Publishing.
- `compatibility.verified` is now 14.369, the Foundry build the grid adjustments were checked against. The `maximum` of 14 is removed, so Foundry no longer blocks installing on a later version; it shows its usual unverified warning instead.
- Licence: MIT (`LICENSE`). The Alegreya Sans and Alegreya Sans SC fonts now ship with their own SIL Open Font License notice (`assets/fonts/OFL-AlegreyaSans.txt`); before, only Alegreya's copyright line was included.
- The README is rewritten for people installing the module. Its per-version check notes moved into this changelog.
- Source comments and test fixtures no longer refer to private notes or other projects. The browser check's comparison against the kit's master copy now runs only when `KIT_MASTER` is set.
- Checks: 40 unit tests and 31 browser checks (simulated Foundry scene, not a live Foundry world) pass; the kit check reports 0 errors and 0 warnings. The author tested 1.0.2 live in Foundry V14.

## 1.0.2 – 2026-11-11

From the author's note on the orange outline.

- Foundry's orange focus outline and glow no longer stay on a control you click. Buttons, the step choice, the preview switch and the arrow pad keep their resting look after a click, and fields show the kit's blue ring while you type, never Foundry's orange. Keyboard focus still shows the kit's blue ring. This replaces the 0.6.0 rule, which covered buttons only.
- Tested live by the author in Foundry V14.

## 1.0.1 – 2026-11-11

From the author's notes.

- The two descriptor lines at the bottom of the window are gone: "Only you see the pink grid. Off shows the saved grid." under the Preview changes on map switch, and "Only the grid moves. Artwork and placed objects stay put." The switch now ends the window body, with no gap left behind.
- The switch keeps its explanation as a tooltip, and screen readers still hear it as the switch's description. The "only the grid moves" point is still made by the hint beside Align grid on map in Scene Configuration and in the README.

## 1.0.0

Confirmed by the author in live Foundry testing of 0.6.4 and marked complete. No code changes from 0.6.4.

## 0.6.4

From the author's notes. This release replaced 0.6.3 for testing.

- The map is named once. The level line under the scene name only appears when it adds something: it's hidden when the level's name matches the scene's (as on most single-level scenes) or the scene has one level.
- The window opens beside the map instead of over its middle: its right edge sits just left of the map's left edge. When the map reaches the left of the screen, it opens as far left as the scene controls allow, near the top. It never opens under the right-hand sidebar.
- Less explanation, more room. The arrow-pad hint is gone (the arrows explain themselves; Shift + arrows stays in the footer). The other hints are one short line each: "50 to 10,000 px, on every level.", "Drag across 3 map cells to set size and position.", "Square grids only." (hex), "Only you see the pink grid. Off shows the saved grid.", "Only the grid moves. Artwork and placed objects stay put."
- A review of 0.6.4 before release added two fixes: the sidebar limit and the fuller box hint.
- A little more space around and between the panels, and the Nudge by choice sits level with the bottom of the arrow pad. At 420 px wide the window no longer scrolls on open in the test scene.

Checks (simulated Foundry scene, not a live Foundry world): the kit check reports 0 errors and 0 warnings; 39 unit tests; 30 browser checks, adding the single map name and the opening position. Not verified at the time: the opening position against a real V14 canvas and scene controls, and `Scene#levels` in V14 (the level line also hides whenever its name matches the scene name).

## 0.6.3

- The Cell size hint states the scene's range: "Changes grid spacing across all levels (50 to 10,000 px). Map dimensions stay the same." The minimum is the scene's own, so a scene that allows a larger minimum shows that number. This gives the greyed-out − and + buttons a visible reason (a review follow-up to 0.6.2, approved by the author). This release replaced 0.6.2 for testing.
- Editing a value back to the saved one (nudge right then left, or type 101 then 100) now reads "No changes yet…" again instead of "Unsaved changes". Apply and Revert were already correctly disabled. Found in review before release.

Checks (simulated Foundry scene, not a live Foundry world): the kit check reports 0 errors and 0 warnings; 37 unit tests; 28 browser checks, adding the status returning to "No changes yet" when values are edited back. The live-Foundry limits listed for 0.6.2 still applied.

## 0.6.2

From a review of 0.6.1; the author approved every proposal. This release replaced 0.6.0 and 0.6.1 for testing.

Fixes
- Turning Drag or Draw a 3×3 box off with Esc, or by switching away from Foundry, now clears its "Drag on the map…" help from the footer. Before, the button turned off but the status still said the tool was on.
- A Cell size error no longer pushes the − and + buttons down: the error line now sits under the whole row.
- The − and + buttons stop at the scene's minimum and at 10,000 px instead of stepping into a red error.
- A 3×3 box narrower than 3 minimum cells says so: "Box too small. Drag across 3 cells of at least 50 px each (at least 150 px wide), then try again." The box tool stays on.

Window
- Draw a 3×3 box is the first control in Grid Spacing on square grids. On hex grids its unavailable note moves to the end of the panel.
- Smaller, Larger and the arrow pad are icon-only buttons named by tooltip and screen-reader label ("Smaller cells (−1 px)", "Nudge up"…). The pad is a compact 3×2 of squares.
- Shorter text, so the window opens with less scrolling: the arrow hint drops the Shift tip the footer already shows; the scope note drops "Keep Grid Align enabled to retain the custom grid origin" (it stays in the README); statuses name a state ("Unsaved changes", "No changes yet. Nothing is saved until you apply.", "Drag on the map to move the grid. Esc stops.").
- "High-contrast preview" is now **Preview changes on map**, with the hint "Pink grid shows your adjustments; only you see it. Off shows the saved grid for comparison." (Off never showed a quieter preview; it shows the saved grid.)
- "Reset origin" is now **Clear grid shift**, matching the Grid shift X and Y fields and no longer echoing "Revert to saved".

Errors
- A cell size out of range from the steppers or a box gives the same message as typing one, with the real minimum: "Cell size must be a whole number from 50 to 10,000."
- Plainer wording for rare errors: the scene changing elsewhere, Foundry not confirming the save, and an unsupported grid shader (which no longer says "report this error" without saying to whom).

Scene Configuration
- **Align grid on map** sits right after the grid size field, with a hint: "Moves the grid, not the map image. Artwork, walls and tokens stay where they are." Foundry's own grid tool in that tab moves the map image instead.

Checks (simulated Foundry scene, not a live Foundry world): the kit check reports 0 errors and 0 warnings; 36 unit tests; 27 browser checks, adding Esc and window-blur status resets, stepper bounds, the size error keeping the steppers level, icon-only buttons with names, the too-small box message, and the Scene Configuration hint and placement. The live-Foundry limits listed for 0.6.0 still applied, plus the real width of the icon buttons with Font Awesome loaded.

## 0.6.1

Follow-ups recommended with 0.6.0, approved by the author. 0.6.0 was not tested on its own; this release was tested for both.

- The Move and Nudge header no longer shows "X 0 · Y 0". It repeated the two Grid shift fields, as the cell size readout did.
- Holding an arrow-pad button keeps nudging by the chosen step, like Smaller and Larger. A click or Enter still nudges once.
- Range errors use the field names shown in the window: "Cell size must be at least…" and "Grid shift X and Y must be between…" (they said "Grid size" and "Offsets").
- The fallback error no longer says to reopen the tool, since your adjustments are kept: "Something went wrong, and nothing was saved. Your adjustments are still here. If it keeps happening, check the browser console."

Checks (simulated Foundry scene, not a live Foundry world): the kit check reports 0 errors and 0 warnings; 33 unit tests; 23 browser checks, adding press-and-hold on the arrow pad and the absence of panel readouts. The live-Foundry limits listed for 0.6.0 still applied.

## 0.6.0

From the author's 0.5.0 testing notes.

Window
- The header names the map: the scene name sits in the title slot, with the level beneath at body size. The "Align the grid" title and the small "grid align" label above it are gone (Foundry's title bar still says Grid Align).
- Section headers use title case: "Grid Spacing", "Move and Nudge". This departs from the kit's sentence-case rule at the author's direction.
- The cell size no longer repeats in the Grid Spacing header.
- The arrow-pad hint sits directly under the arrows instead of at the bottom of the panel.
- The 3×3 box hint reads "Square grids: Drag from one corner across 3 map cells."
- Numbers in the fields, the px units and the nudge steps use lining figures at 15px, so they match the rest of the window. Alegreya Sans draws old-style figures by default, and Foundry's own number-input font could also outrank the kit's.
- The footer status ("Unsaved adjustments…") is larger: 15px, in full ink with a bigger gold dot while there are unsaved changes.
- The interface fonts load before the window first opens, so the type no longer jumps from a fallback face to Alegreya.

Fixes
- Drag grid on map and Draw a 3×3 box no longer keep a red glow after they turn off. Foundry's own button focus style outranked the kit's resting shadow after a mouse click; mouse focus now shows the kit's look, and keyboard focus keeps the kit's blue ring.
- Typing a usable number into a field marked red clears the error straight away and previews it, without leaving the field.
- Shift + arrow keys nudge the grid 10 px from anywhere while the window is open, instead of panning the map. Text fields keep their own arrow keys.

New
- Holding Smaller or Larger keeps stepping (after 0.4 s, about 12 steps a second) until released. A click or Enter still steps once.
- Scene Configuration → Grid has an **Align grid on map** button (Foundry's native style) that opens Grid Align. For a scene you aren't viewing, it's disabled and says to view the scene first.

Cleanup
- Removed the stale 0.3.x notes files `VERIFICATION.md` and `UI-REFRESH.md` (README.md and this changelog cover them), an unused import, and a duplicated arrow-key map.

Unchanged: module ID, the `flags.grid-align.origin` format, scene writes, grid runtime adapters, shader, permissions and conflict checks.

Checks (simulated Foundry scene, not a live Foundry world): the kit check reports 0 errors and 0 warnings; 32 unit tests; 22 browser checks, now including a simulated Foundry red `:focus` glow and a smaller Foundry number-input font, typing a usable number to clear a field error, Shift + arrow nudges from outside the window, press-and-hold on Larger, and the Scene Configuration button. Not verified at the time: Foundry's real focus style, the V14 Scene Configuration grid tab's markup (the button looks for the `grid` part or tab, then the grid size field), and rendering inside a live Foundry 14 world.

## 0.5.0

Interface (Hypothetical Foundry Kit 2.0)
- Adopts Foundry Kit 2.0 (`styles/foundry-kit.css`, built from the design system and identical in every module). The window is frosted glass over the scene, covering Foundry's title bar too; Foundry's title, close button and resize handle are unchanged.
- New header names the task ("Align the grid") and the scene and level. Grid spacing and Move and nudge are panels whose headers show the current values ("100 px cells", "X 0 · Y 0").
- Drag grid on map and Draw a 3×3 box are kit buttons with a pressed state: teal, glowing and bold while on.
- Nudge by is a segmented 1 / 5 / 10 px group with arrow-key movement, instead of a dropdown.
- High-contrast preview is a switch that says On or Off.
- Units sit inside the fields (px); number spinners are removed (arrow keys still step). Labels are shorter: "Cell size", "Grid shift X", "Grid shift Y".
- Keyboard hints moved into the footer. The status shows a gold dot for unsaved changes and turns red for errors. Apply alignment shows a spinner while saving.
- Interface type is Alegreya / Alegreya Sans, bundled in `assets/fonts` (SIL Open Font License).
- New client setting **Solid windows** turns the glass off for that player.

Experience fixes
- Validation errors also appear under the field they belong to, linked for screen readers, and clear when the value is fixed or reverted.
- Apply alignment is linked to the status line, which says why it is unavailable before anything changes.

Removed
- The in-window Dark/Light theme choice. Kit windows have one theme and stay dark even when Foundry's interface is light.
- `assets/ZTNature-Regular.otf`. It was only used as the interface font, which Alegreya now replaces, and its distribution rights were never confirmed.

Unchanged: module ID, the `flags.grid-align.origin` format, scene writes, grid runtime adapters, shader, permissions and conflict checks.

Checks (simulated Foundry scene, not a live Foundry world): the kit check reports 0 errors and 0 warnings; 31 unit tests; 17 browser checks at 420px, 340px and 320px wide, covering kit files identical to the master, the AppShell, Solid windows, the nudge-step radiogroup by keyboard, the preview switch, field errors under the field, drag and box capture, discard confirmation, save failure and recovery, and the hex explanation. Not verified at the time: rendering inside a live Foundry 14 world (Font Awesome icons are absent in the test host). The WebGL shader regression was not rerun because the shader and grid code were unchanged.

## 0.4.0

Interface (Hypothetical Foundry Kit 1.0.0)
- Adopts Foundry Kit 1.0.0 (`styles/foundry-kit.css`, identical to the master copy).
- Drag grid on map and Draw a 3×3 box are kit toggle buttons: when on, they use the selected teal with an inset bar instead of the action color. The module's own accent overrides are removed.
- The window has a scrolling body and a footer that stays visible, with the status line, Revert to saved, Cancel and one gold action (Apply alignment). Reset origin is a quiet button.
- The narrow layout responds to the tool window's width, not the browser's.
- The window uses the ZT Nature font.

Experience fixes
- Unapplied changes: closing by Cancel, Esc or the window's close button asks "Discard changes?", defaulting to Keep editing. Closing with no changes, applying, and leaving the scene don't ask.
- Validation names the field and its range ("Grid shift X (px) must be a whole number from −1,000,000 to 1,000,000."), marks the field and focuses it.
- On hex scenes, the 3×3 box explains in visible text why it is unavailable.
- The opening status explains why Apply is unavailable: "No changes yet. Adjust the grid to preview it; nothing is saved until you apply."
- A failed save says your adjustments are kept and Apply can be retried, instead of telling you to reopen the tool.
- Apply alignment reads "Applying…" while saving.
- "Reset" is now "Revert to saved" and is only available once something has changed.
- The status line is only rewritten when its message changes, so screen readers don't re-announce it on every redraw.
- Number fields are described by their help text instead of the live status line. Buttons no longer repeat their visible label as an aria-label.

Tests
- New `tests/ui.test.mjs`: field messages, language keys, one primary action, toggles, the hex explanation and name escaping. 29 unit tests pass.
- New `tests/browser-check.mjs`: 14 checks in a simulated Foundry scene.

Unchanged: module ID, the `flags.grid-align.origin` format, scene writes, grid runtime adapters, shader, permissions and conflict checks.

Checks (simulated Foundry scene, not a live Foundry world): 29 unit tests (`node --test tests/*.test.mjs`) and 14 browser checks (`node tests/browser-check.mjs`) at 420px and 320px wide, dark and light. The WebGL shader regression was not rerun because the shader and grid code were unchanged. The window bundled the ZT Nature font; its distribution rights had to be confirmed before any public release (0.5.0 removed it).

## 0.3.0

- Restore square-grid 3×3 fitting with a temporary nine-cell guide and live size/origin preview. It creates no Drawing documents and writes nothing until Apply.
- Move gesture interception from the canvas element to window capture; also consume compatibility mouse events so document/Pixi handlers do not receive a second drag.
- Clean up guide, capture, listeners and cursor on close; cancel unfinished gestures on Escape, pointer cancellation/capture loss or window blur. Zoom is paused only during an active gesture.
- Hex grids retain manual size, drag and nudge; the square 3×3 tool is disabled for hexes.
- Verified locally with 24 unit tests, an offline browser workflow including earlier-registered document listeners, and the existing V14.369 WebGL regression (35 frames across five grid orientations). Not verified in a live Foundry world.

## 0.2.1

Rendering correction. Nudge and drag now update an explicit shader grid-origin uniform on every movement. Earlier versions repositioned the mesh, but the native shader kept drawing world-anchored lines. This correction applies to both the local preview and saved alignment. Grid size, native line style and scene/canvas coordinates retain their existing behavior.

Verified using the actual vertex and fragment shaders exported from V14.369 in a WebGL2 browser: reproduced the old failure, then checked 35 consecutive movement frames across square and four hex orientations, exact 10-pixel line displacement, reset and scaling. No full live Foundry session was available.

## Earlier versions

- After 0.1.x, alignment is stored in the scene's `flags.grid-align.origin` and runtime coordinate adapters keep Foundry's grid snapping, cell conversion, path measurement and grid drawing on that origin. Original grid methods run on their original instance, preserving private fields and preventing nested coordinate conversions. No Level texture offsets, asset URLs, foregrounds, wall coordinates or token positions are written. The repeating grid is rebased by whole cell cycles, keeping hex row/column parity, and its mesh covers the scene and padded canvas even after large shifts.
- 0.1.x saved texture offsets instead. Later versions do not undo those offsets automatically, because that would move existing artwork; they use the current map position as it is.
- Checks recorded before 0.3.0: 20 automated tests, plus 90 cell scenarios against the actual SquareGrid and HexagonalGrid class implementations exported from Foundry 14.369, and browser interaction tests in a simulated Foundry host. Not a live Foundry integration test.
- Sources: a runtime report from Foundry 14.369 with D&D 5e 6.0.6, used to verify public method boundaries and scene dimensions (no Foundry code is redistributed in this module), and the Foundry V14 API pages for [grid data](https://foundryvtt.com/api/v14/interfaces/foundry.documents.types.GridData.html), the [square grid](https://foundryvtt.com/api/v14/classes/foundry.grid.SquareGrid.html), the [hex grid](https://foundryvtt.com/api/v14/classes/foundry.grid.HexagonalGrid.html) and the [grid mesh](https://foundryvtt.com/api/v14/interfaces/foundry.canvas.containers.types.GridMeshData.html).
