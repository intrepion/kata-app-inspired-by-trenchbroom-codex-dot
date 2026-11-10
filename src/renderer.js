import {vertices,FACES,MATERIALS} from './model.js';
import {SolidRenderer} from './solid-renderer.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rgb=(color,m=1)=>{const n=parseInt(color.slice(1),16);return `rgb(${clamp((n>>16)*m,0,255)},${clamp(((n>>8)&255)*m,0,255)},${clamp((n&255)*m,0,255)})`;};
export class Viewport {
 constructor(canvas,mode='3d'){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.mode=mode;this.solid=null;if(mode==='3d'){try{this.solid=new SolidRenderer();}catch{this.solid=null;}}this.zoom=1;this.yaw=-0.64;this.pitch=.61;this.pan={x:0,y:0};this.polygons=[];this.preview=null;this.resizeObserver=new ResizeObserver(()=>this.draw());this.resizeObserver.observe(canvas);}
 project([x,y,z=0]){const scale=this.scale*this.zoom;const cx=this.width/2+this.pan.x,cy=this.height/2+this.pan.y;
 if(this.mode==='top')return {x:cx+x*scale,y:cy+y*scale,depth:z};
 const a=x*Math.cos(this.yaw)-y*Math.sin(this.yaw),b=x*Math.sin(this.yaw)+y*Math.cos(this.yaw);
 return {x:cx+a*scale,y:cy+(b*Math.sin(this.pitch)-z*Math.cos(this.pitch)+72)*scale,depth:b*Math.cos(this.pitch)+z*Math.sin(this.pitch)};}
 unproject(x,y){const s=this.scale*this.zoom;return {x:(x-this.width/2-this.pan.x)/s,y:(y-this.height/2-this.pan.y)/s};}
 set(scene,selected,grid=16){this.scene=scene;this.selected=selected;this.grid=grid;this.draw();}
 focus(o){const point=this.project([o.x+(o.w||0)/2,o.y+(o.d||0)/2,o.z+(o.h||0)/2]);this.pan.x+=this.width/2-point.x;this.pan.y+=this.height/2-point.y;this.draw();}
 home(){this.zoom=1;this.yaw=-.64;this.pitch=.61;this.pan={x:0,y:0};this.draw();}
 draw(){
 if(!this.scene)return;const c=this.canvas.getBoundingClientRect();this.width=c.width;this.height=c.height;if(!c.width||!c.height)return;
 const dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(c.width*dpr);this.canvas.height=Math.round(c.height*dpr);const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);this.scale=Math.min(this.width/(this.mode==='top'?680:760),this.height/(this.mode==='top'?500:560));
 ctx.fillStyle=this.mode==='top'?'#1d2427':'#20282a';ctx.fillRect(0,0,this.width,this.height);
 this.polygons=[];
 // Ground grid and main axes, rendered beneath solid objects.
 for(let n=-512;n<=512;n+=this.mode==='top'?this.grid:32){for(const points of [[[n,-512,0],[n,512,0]],[[-512,n,0],[512,n,0]]]){this.line(points,n===0?'#52615f':n%128===0?'#354340':'#2a3634',n===0?1.2:.6);}}
 if(this.mode==='top')this.drawTop();else this.draw3D();
 if(this.preview&&this.mode==='top'){const a=this.project([this.preview.x,this.preview.y]);const b=this.project([this.preview.x+this.preview.w,this.preview.y+this.preview.d]);ctx.fillStyle='#e6bb6533';ctx.strokeStyle='#edc678';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.setLineDash([]);}
 this.drawCompass();
 }
 line(points,color,width=1,dash=[]){const ctx=this.ctx;ctx.beginPath();points.forEach((p,i)=>{const v=this.project(p);i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
 polygon(points,fill,stroke,width=1){const ctx=this.ctx;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
 draw3D(){const faces=[];const view=[Math.sin(this.yaw)*Math.cos(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch)];
 for(const o of this.scene.objects){if(o.type!=='brush')continue;const vs=vertices(o);FACES.forEach((f,index)=>{const ns=[[0,0,-1],[0,0,1],[0,-1,0],[1,0,0],[0,1,0],[-1,0,0]][index];if(ns.reduce((s,n,i)=>s+n*view[i],0)<=0)return;
 const points=f.map(i=>this.project(vs[i]));faces.push({o,index,points,depth:points.reduce((s,p)=>s+p.depth,0)/4});});}
 if(this.solid){this.ctx.drawImage(this.solid.draw(faces,this.width,this.height,Math.min(window.devicePixelRatio||1,2),this.selected,MATERIALS),0,0,this.width,this.height);this.polygons=faces.map(f=>({id:f.o.id,points:f.points}));for(const o of this.scene.objects.filter(o=>o.type!=='brush'))this.drawEntity(o);return;}
 faces.sort((a,b)=>a.o.z+a.o.h<=b.o.z?-1:b.o.z+b.o.h<=a.o.z?1:a.depth-b.depth);for(const face of faces){const {o,index,points}=face;const selected=o.id===this.selected;const color=MATERIALS[o.material].color;this.polygon(points,rgb(color,[.5,1.04,.65,.77,.84,.63][index]),selected?'#ffcf76':'#142022',selected?2:1);this.polygons.push({id:o.id,points});
 // Subtle face inset, readable material form without external textures.
 if(index===1&&o.w>=64&&o.d>=64){const mid={x:points.reduce((s,p)=>s+p.x,0)/4,y:points.reduce((s,p)=>s+p.y,0)/4};const inner=points.map(p=>({x:mid.x+(p.x-mid.x)*.88,y:mid.y+(p.y-mid.y)*.88}));this.ctx.beginPath();inner.forEach((p,i)=>i?this.ctx.lineTo(p.x,p.y):this.ctx.moveTo(p.x,p.y));this.ctx.closePath();this.ctx.strokeStyle=selected?'#ffe0a255':'#ffffff14';this.ctx.stroke();}}
 for(const o of this.scene.objects.filter(o=>o.type!=='brush'))this.drawEntity(o);
 }
 drawTop(){const objects=[...this.scene.objects].sort((a,b)=>(a.z+(a.h||0))-(b.z+(b.h||0)));
 for(const o of objects){if(o.type!=='brush'){this.drawEntity(o);continue;}const p=[[o.x,o.y],[o.x+o.w,o.y],[o.x+o.w,o.y+o.d],[o.x,o.y+o.d]].map(v=>this.project(v));const sel=o.id===this.selected;this.polygon(p,rgb(MATERIALS[o.material].color,.37),sel?'#edc678':rgb(MATERIALS[o.material].color,.8),sel?2:1);this.polygons.push({id:o.id,points:p});if(sel){this.ctx.fillStyle='#f6ce89';this.ctx.font='10px monospace';this.ctx.fillText(`${o.w} × ${o.d}`,p[0].x+5,p[0].y+15);}}
 }
 drawEntity(o){const p=this.project([o.x,o.y,o.z]);const ctx=this.ctx;const s=o.id===this.selected;const color=o.type==='spawn'?'#87c7ad':'#e7c576';ctx.beginPath();ctx.moveTo(p.x,p.y-8);ctx.lineTo(p.x+7,p.y);ctx.lineTo(p.x,p.y+8);ctx.lineTo(p.x-7,p.y);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=s?'#fff0bb':'#23352e';ctx.lineWidth=s?2:1;ctx.stroke();ctx.font='10px sans-serif';ctx.fillStyle=color;ctx.fillText(o.type==='spawn'?'P':'L',p.x+12,p.y+4);this.polygons.push({id:o.id,points:[{x:p.x-10,y:p.y-10},{x:p.x+10,y:p.y-10},{x:p.x+10,y:p.y+10},{x:p.x-10,y:p.y+10}]});}
 drawCompass(){const ctx=this.ctx;const x=26,y=this.height-28;ctx.font='10px monospace';ctx.fillStyle='#dc8a78';ctx.fillText('X',x+21,y+3);ctx.fillStyle='#9fb890';ctx.fillText('Y',x-3,y-20);ctx.strokeStyle='#dc8a78';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+17,y);ctx.stroke();ctx.strokeStyle='#9fb890';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-15);ctx.stroke();}
 hit(x,y){if(this.mode==='3d'){let best=null,depth=-Infinity;for(const poly of this.polygons){for(let i=1;i<poly.points.length-1;i++){const [a,b,c]=[poly.points[0],poly.points[i],poly.points[i+1]],den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<.00001)continue;const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den,v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,t=1-u-v;if(u<0||v<0||t<0)continue;const z=a.depth===undefined?Infinity:u*a.depth+v*b.depth+t*c.depth;if(z>=depth){depth=z;best=poly.id;}}}return best;}for(let i=this.polygons.length-1;i>=0;i--){const poly=this.polygons[i];let inside=false;const points=poly.points;for(let j=0,k=points.length-1;j<points.length;k=j++){const a=points[j],b=points[k];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}if(inside)return poly.id;}return null;}
}
