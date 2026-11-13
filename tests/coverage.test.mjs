import test from 'node:test';
import assert from 'node:assert/strict';
import {coverGrid,periods} from '../scripts/coverage.mjs';
test('Coverage remains complete with million-pixel offsets and extreme cell sizes',()=>{
 const bounds={x:0,y:0,width:5000,height:3000};
 for(const size of [50,100,317,10000])for(const dx of [-1000000,-5000,-1,0,17,5000,1000000])for(const dy of [-1000000,0,1000000]){
  const period={x:2*size,y:2*size},origin={x:dx,y:dy};
  const rect=coverGrid(bounds,origin,period);
  assert.ok(rect.x<=0&&rect.y<=0);
  assert.ok(rect.x+rect.width>=5000&&rect.y+rect.height>=3000);
  assert.ok(Number.isInteger((rect.x-dx)/period.x));
  assert.ok(Number.isInteger((rect.y-dy)/period.y));
  assert.ok(rect.width<=bounds.width+3*period.x);
  assert.ok(rect.height<=bounds.height+3*period.y);
 }
});
test('Periods scale from native center coordinates without assuming hex geometry',()=>{
 const grid={size:100,getCenterPoint:({i,j})=>({x:j*75+50,y:i*100+(j%2)*50+50})};
 assert.deepEqual(periods(grid,200),{x:300,y:400});
});
