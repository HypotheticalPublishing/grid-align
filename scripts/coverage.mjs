// Rebase by whole repeating cells, keeping the same grid phase at any offset.
// Two rows/columns preserve hex parity as well as square-grid alignment.
import {localCenter} from './offset-grid.mjs';
export function periods(grid, size) {
 const origin=localCenter(grid,{i:0,j:0});
 const column=localCenter(grid,{i:0,j:2});
 const row=localCenter(grid,{i:2,j:0});
 const ratio=size/grid.size;
 const x=(column.x-origin.x)*ratio,y=(row.y-origin.y)*ratio;
 if(!(x>0&&y>0&&Number.isFinite(x)&&Number.isFinite(y)))throw Error('Invalid grid period');
 return {x,y};
}
export function coverGrid(bounds,origin,period) {
 const x=origin.x+Math.floor((bounds.x-origin.x)/period.x)*period.x-period.x;
 const y=origin.y+Math.floor((bounds.y-origin.y)/period.y)*period.y-period.y;
 return {x,y,width:bounds.x+bounds.width-x+period.x,height:bounds.y+bounds.height-y+period.y};
}
