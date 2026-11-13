// Screen-space guide only. It never creates a Foundry Drawing document.
export class BoxGuide {
 draw(start,end,convert){
  this.element??=document.body.appendChild(document.createElementNS('http://www.w3.org/2000/svg','svg'));
  this.element.classList.add('ga-box-guide');this.element.setAttribute('aria-hidden','true');
  const zero=convert({clientX:0,clientY:0}),unit=convert({clientX:1,clientY:1}),scaleX=unit.x-zero.x,scaleY=unit.y-zero.y;
  const side=Math.round(Math.abs(end.x-start.x)/3)*3,left=start.x-(end.x<start.x?side:0),top=start.y-(end.y<start.y?side:0),x=(left-zero.x)/scaleX,y=(top-zero.y)/scaleY,w=side/scaleX,h=side/scaleY;
  if(![x,y,w,h].every(Number.isFinite))return;
  const line=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  this.element.innerHTML=`<rect x="${x}" y="${y}" width="${w}" height="${h}"/>${[1,2].map(n=>line(x+w*n/3,y,x+w*n/3,y+h)+line(x,y+h*n/3,x+w,y+h*n/3)).join('')}`;
 }
 destroy(){this.element?.remove();this.element=null;}
}
