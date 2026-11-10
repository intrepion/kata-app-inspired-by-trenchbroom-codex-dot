export const LIMIT = 4096;
export const MAX_OBJECTS = 400;
export const MATERIALS = {
  limestone: {name:'Limestone',color:'#bcb39c',texture:'bk_stone'},
  basalt: {name:'Basalt',color:'#667a81',texture:'bk_basalt'},
  clay: {name:'Terracotta',color:'#c88568',texture:'bk_clay'},
  moss: {name:'Moss',color:'#7b9980',texture:'bk_moss'},
  teal: {name:'Signal teal',color:'#52adad',texture:'bk_teal'},
  amber: {name:'Amber',color:'#d3ac60',texture:'bk_amber'}
};
export const clone = value => JSON.parse(JSON.stringify(value));
export const snap = (n, grid=16) => Math.round(n/grid)*grid;
export const uid = () => globalThis.crypto?.randomUUID?.() || `b-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function brush(name='New brush', values={}) {return {id:uid(),type:'brush',name,x:0,y:0,z:0,w:96,d:96,h:96,material:'limestone',...values};}
export function entity(type='spawn', values={}) {return {id:uid(),type,name:type==='spawn'?'Player start':'Point light',x:0,y:0,z:48,...values};}
export function emptyProject() {return {format:'brushkeep',version:1,name:'Untitled blockout',objects:[]};}
export function starter() {
 const project = emptyProject(); project.name='The quiet courtyard';
 project.objects=[
  brush('Courtyard floor',{x:-256,y:-192,z:-16,w:512,d:384,h:16,material:'basalt'}),
  brush('West wall',{x:-256,y:-192,z:0,w:32,d:384,h:144,material:'limestone'}),
  brush('North wall · left',{x:-224,y:-192,z:0,w:160,d:32,h:176}),
  brush('North wall · right',{x:64,y:-192,z:0,w:192,d:32,h:176}),
  brush('Gate lintel',{x:-64,y:-192,z:128,w:128,d:32,h:48}),
  brush('Portal',{x:-56,y:-188,z:0,w:112,d:12,h:128,material:'teal'}),
  brush('East terrace',{x:144,y:-96,z:0,w:112,d:192,h:32,material:'clay'}),
  brush('Step 01',{x:80,y:32,z:0,w:64,d:64,h:16,material:'clay'}),
  brush('Step 02',{x:112,y:32,z:16,w:32,d:64,h:16,material:'clay'}),
  brush('West plinth',{x:-176,y:-96,z:0,w:64,d:64,h:64,material:'basalt'}),
  brush('West marker',{x:-160,y:-80,z:64,w:32,d:32,h:96,material:'amber'}),
  brush('Study block',{x:-48,y:0,z:0,w:96,d:96,h:64,material:'limestone'}),
  entity('spawn',{x:0,y:144,z:32}),entity('light',{x:0,y:-112,z:160})
 ];return project;
}
const finite = (n,label) => {if(typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>LIMIT) throw Error(`${label} must be a finite number between -${LIMIT} and ${LIMIT}.`);return n;};
export function validateProject(input) {
 if(!input||input.format!=='brushkeep'||input.version!==1)throw Error('Choose a Brushkeep version 1 project. TrenchBroom MAP files are not supported for import.');
 if(typeof input.name!=='string'||!input.name.trim()||input.name.length>80)throw Error('Project name must be 1–80 characters.');
 if(!Array.isArray(input.objects)||input.objects.length>MAX_OBJECTS)throw Error(`Projects may contain up to ${MAX_OBJECTS} objects.`);
 const ids=new Set();const objects=input.objects.map((o,i)=>{
  if(!o||!['brush','spawn','light'].includes(o.type))throw Error(`Object ${i+1} has an unsupported type.`);
  if(typeof o.id!=='string'||!o.id||o.id.length>100||ids.has(o.id))throw Error('Every object needs a unique ID.');ids.add(o.id);
  if(typeof o.name!=='string'||!o.name.trim()||o.name.length>80)throw Error('Object names must be 1–80 characters.');
  const out={id:o.id,type:o.type,name:o.name,x:finite(o.x,'X'),y:finite(o.y,'Y'),z:finite(o.z,'Z')};
  if(o.type==='brush'){
   for(const dim of ['w','d','h']){if(finite(o[dim],dim)<1)throw Error('Brush dimensions must be at least 1 unit.');out[dim]=o[dim];}
   if(typeof o.material!=='string'||!Object.hasOwn(MATERIALS,o.material))throw Error('Unknown brush material.');out.material=o.material;
   for(const [axis,dim] of [['x','w'],['y','d'],['z','h']])if(out[axis]+out[dim]>LIMIT)throw Error('Brush exceeds the world boundary.');
  }return out;
 });return {format:'brushkeep',version:1,name:input.name.trim(),objects};
}
export function parseProject(text){if(typeof text!=='string'||text.length>2_000_000)throw Error('Choose a JSON project smaller than 2 MB.');let value;try{value=JSON.parse(text);}catch{throw Error('This is not valid JSON. Your scene has not changed.');}return validateProject(value);}
export function serialize(project){return JSON.stringify(validateProject(project),null,2)+'\n';}
export function vertices(o){const {x,y,z,w,d,h}=o;return [[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];}
// Counterclockwise faces viewed from outside; normals point out of the solid.
export const FACES=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
export function toOBJ(project){
 const p=validateProject(project);let n=1;const lines=['# Brushkeep blockout OBJ. Z-up. Separate untextured cuboids.'];
 for(const o of p.objects.filter(o=>o.type==='brush')){lines.push(`o ${o.name.replace(/[^a-zA-Z0-9_-]/g,'_')}`);for(const v of vertices(o))lines.push(`v ${v.join(' ')}`);for(const f of FACES)lines.push(`f ${f.map(i=>i+n).join(' ')}`);n+=8;}
 return lines.join('\n')+'\n';
}
export function toMAP(project){
 const p=validateProject(project);const lines=['// Brushkeep experimental Quake standard MAP export. Z-up.','// Placeholder bk_* textures require user-supplied textures. No compilation/engine validation.','{','"classname" "worldspawn"','"message" "Brushkeep blockout"'];
 for(const o of p.objects.filter(o=>o.type==='brush')){const vs=vertices(o);lines.push('{');for(const f of FACES){/* Quake plane normal uses (p3-p1) cross (p2-p1), opposite OBJ winding. */const indices=[f[0],f[2],f[1]];lines.push(indices.map(i=>`( ${vs[i].join(' ')} )`).join(' ')+` ${MATERIALS[o.material].texture} 0 0 0 1 1`);}lines.push('}');}lines.push('}');
 for(const o of p.objects.filter(o=>o.type!=='brush'))lines.push('{',`"classname" "${o.type==='spawn'?'info_player_start':'light'}"`,`"origin" "${o.x} ${o.y} ${o.z}"`,...(o.type==='light'?['"light" "300"']:['"angle" "90"']),'}');
 return lines.join('\n')+'\n';
}
export class History {
 constructor(project){this.current=validateProject(project);this.past=[];this.future=[];}
 commit(project){const next=validateProject(project);if(JSON.stringify(next)===JSON.stringify(this.current))return false;this.past.push(clone(this.current));if(this.past.length>80)this.past.shift();this.current=next;this.future=[];return true;}
 undo(){if(!this.past.length)return false;this.future.push(clone(this.current));this.current=this.past.pop();return true;}
 redo(){if(!this.future.length)return false;this.past.push(clone(this.current));this.current=this.future.pop();return true;}
}
export function rectangleBrush(a,b,grid=16,height=96,material='limestone'){
 const x=snap(Math.min(a.x,b.x),grid),y=snap(Math.min(a.y,b.y),grid);
 return brush('Drawn brush',{x,y,w:Math.max(grid,snap(Math.abs(b.x-a.x),grid)),d:Math.max(grid,snap(Math.abs(b.y-a.y),grid)),h:height,material});
}
