# Grid Align

Easy and lightweight moving and scaling of the map grid in Foundry. Designed to be simple and fast with no fuss. I made this because there weren't any other grid alignment mods I could find which didn't move the walls and lights when aligning the grid.

<!-- SCREENSHOT: the Grid Align window beside a map, with the pink preview grid lined up on the map's own grid. Save it as docs/grid-align.png and link it here. -->

## What It Does

- Draw a 3×3 box on a square grid: drag across three of the map's cells and Grid Align sets the cell size and position in one go.
- Change the cell size by typing it, or step it by one pixel with the − and + buttons. Hold a button to keep stepping.
- Move the grid by dragging it on the map, by typing Grid shift X and Y, or with the arrow pad in steps of 1, 5 or 10 px. Shift + arrow keys nudge 10 px from anywhere while the window is open.
- Preview before you save. The adjusted grid shows in bright pink on the map, and only you see it. 
- No artwork, wall, token, tile or light positions are written. If a new cell size changes how the scene's padding rounds, Grid Align shifts the scene to make up for it, so the map stays at the same place on the canvas.
- A **Solid windows** setting turns off the frosted glass behind the window, per player, if it is hard to read or slows your game.

## Install

In Foundry's setup screen, open **Add-on Modules**, choose **Install Module**, paste this manifest URL into the **Manifest URL** field and choose **Install**:

```text
https://github.com/HypotheticalPublishing/grid-align/releases/latest/download/module.json
```

Then launch your world and turn on Grid Align in **Game Settings → Manage Modules**.

## How to Use

Grid Align works on the scene you are viewing. Open it in any of three ways:

- **Token controls → Grid Align** in the scene controls.
- **Scene Configuration → Grid → Align grid on map**, just after the grid size field. Foundry's own grid tool in that tab moves the map image; this button moves the grid instead. It is turned off for a scene you aren't viewing.
- A Script macro:

  ```js
  await game.modules.get('grid-align').api.open();
  ```

The window opens beside the map, with the scene's name at the top (and the level's name when the scene has more than one level and the names differ).

**Grid Spacing**

- **Draw a 3×3 box** (square grids): turn the tool on, then left-drag from a corner where the map's grid lines cross, across three cells. The width of the box sets the cell size, and the guide stays square with nine cells. Any corner and direction works. Release to keep the result as a draft; the tool turns off after a good fit. A box narrower than three cells of the minimum size is refused with a message saying how wide to draw it, and the tool stays on so you can try again.
- **Cell size** sets the grid spacing, from the scene's minimum (50 px or more) to 10,000 px. The − and + buttons stop at those limits.

**Move and Nudge**

- The arrow pad nudges the grid by the step chosen in **Nudge by** (1, 5 or 10 px). With the pad focused, the keyboard arrows nudge too.
- **Grid shift X** and **Grid shift Y** set the shift directly.
- **Drag grid on map** lets you left-drag the grid in scene pixels, whatever the zoom. While it is on, dragging on the map won't start Foundry's selection box. Normal map controls return when you turn it off.
- **Clear grid shift** sets both shifts back to zero in the draft. Apply saves that.

**Saving**

- **Preview changes on map** is on by default. Tokens keep snapping to the saved grid until you apply.
- An out-of-range number marks its field in red, with the allowed range under it. Typing a usable number clears it.
- **Apply alignment** saves and closes. **Revert to saved** discards the draft and keeps the window open. **Cancel** or closing the window asks "Discard changes?" when there is something unsaved, and defaults to Keep editing.
- **Esc** stops the drag or box tool and cancels a gesture in progress. Leaving the scene closes Grid Align without asking.

## Requirements and Compatibility

- Foundry VTT V14 (minimum 14, verified on 14.369).
- Any game system. Grid Align uses only Foundry's own scene and grid data and needs no other module. Its interface styles and fonts are bundled.
- GM only. The GM needs permission to update the scene and its level.
- Square grids and all four of Foundry's hex grid types.

Testing: the author tested version 1.0.2 live in Foundry V14; 1.0.3 changes only the release metadata. Each release is also checked headless: unit tests, and a browser check that drives the window in a simulated Foundry scene. The grid adjustments were checked against the square and hex grid classes and the grid shaders from Foundry 14.369.

## Limits

- Gridless scenes aren't supported.
- The 3×3 box is for square grids only. Hex grids still get cell size, drag and nudge.
- Out of scope: aligning tiles, rotating or rescaling the map image, fractional cell sizes, and cell sizes under 50 px.
- The level needs a background image.
- Cell size and grid shift apply to every level of the scene.
- Changing the cell size can change token footprints, as it does in Foundry itself.
- Only one GM should align a scene at a time. If the scene's grid, size or background changes elsewhere while the window is open, close it and open it again.
- Modules that bypass Foundry's grid API, or replace its grid methods after Grid Align loads, may need compatibility work.
- Keep Grid Align turned on while a scene uses a shifted grid. Turning it off puts the grid back in Foundry's default position; the saved shift returns when you turn it on again. To remove Grid Align for good and keep the grid where Foundry puts it, use **Clear grid shift**, then **Apply alignment**, before turning it off.

## For Developers

- API: `game.modules.get('grid-align').api.open()` opens the window for the scene being viewed (GM only) and resolves to the window.
- The alignment is stored on the scene as `flags.grid-align.origin`, an `{x, y}` shift in pixels. Cell size is the scene's own `grid.size`.

Unit tests need Node.js 22 or later and nothing else:

```sh
node --test tests/*.test.mjs
```

The browser check is a local check, not part of the unit tests. It needs [Playwright](https://playwright.dev/) and Google Chrome installed:

```sh
npm install --no-save playwright
node tests/browser-check.mjs
```

If Playwright is installed somewhere else, set `PLAYWRIGHT` to its package folder. Screenshots go to `SHOT_DIR` (default: your system's temp folder).

Release zips are built by `tools/build-release.mjs` (`node tools/build-release.mjs --dry-run` lists what ships). Publishing a GitHub release runs `.github/workflows/release.yml`, which checks the tag against `module.json`, runs the tests, and attaches `module.json` and `module.zip` to the release.

## Licence and Credits

Grid Align is released under the MIT License. See [LICENSE](LICENSE). Made by Hypothetical Publishing.

The interface uses Hypothetical Foundry Kit 2.0, Hypothetical Publishing's own styles, included under the same MIT License. Icons are Font Awesome, supplied by Foundry itself; none are bundled.

Grid Align is not affiliated with or endorsed by Foundry Gaming LLC.

### Third-Party Notices

The bundled fonts in `assets/fonts` are licensed under the SIL Open Font License, Version 1.1, not the MIT License:

- Alegreya: Copyright 2011 The Alegreya Project Authors (https://github.com/huertatipografica/Alegreya). Licence: `assets/fonts/OFL-Alegreya.txt`.
- Alegreya Sans and Alegreya Sans SC: Copyright 2013 The Alegreya Sans Project Authors (https://github.com/huertatipografica/Alegreya-Sans). Licence: `assets/fonts/OFL-AlegreyaSans.txt`.
