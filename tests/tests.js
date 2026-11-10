import {starter,emptyProject,brush,entity,clone,validateProject,serialize,parseProject,toOBJ,toMAP,vertices,FACES,History,snap,rectangleBrush,MAX_OBJECTS} from '../src/model.js';
import {Viewport} from '../src/renderer.js';
let passed=0,failed=0;
const assert=(condition,msg='Assertion failed')=>{if(!condition)throw Error(msg);};
const equal=(a,b)=>assert(JSON.stringify(a)===JSON.stringify(b),`${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const throws=fn=>{let did=false;try{fn();}catch{did=true;}assert(did,'Expected rejection');};
function test(name,fn,list='results'){const li=document.createElement('li');try{fn();li.className='pass';li.textContent=`PASS · ${name}`;passed++;}catch(error){li.className='fail';li.textContent=`FAIL · ${name}: ${error.message}`;failed++;}document.getElementById(list).append(li);update();}
function update(){document.getElementById('summary').textContent=`${passed} passed · ${failed} failed`;document.getElementById('summary').dataset.failed=String(failed);}
const one=()=>({...emptyProject(),objects:[brush()]});
test('Courtyard starter validates and contains 12 cuboids, player and light',()=>{const p=validateProject(starter());equal(p.objects.filter(o=>o.type==='brush').length,12);equal(p.objects.length,14);});
test('JSON serialization round-trips every project field',()=>{const p=starter();equal(parseProject(serialize(p)),p);});
test('Empty scenes are valid',()=>equal(validateProject(emptyProject()).objects,[]));
test('Unknown project formats rejected',()=>throws(()=>parseProject('{"format":"trenchbroom","version":1}')));
test('Unknown project versions rejected',()=>throws(()=>validateProject({...one(),version:2})));
test('Malformed JSON rejected without mutation',()=>{const p=one(),before=serialize(p);throws(()=>parseProject('{not json'));equal(serialize(p),before);});
test('Oversized JSON rejected',()=>throws(()=>parseProject(' '.repeat(2_000_001))));
test('Empty project name rejected',()=>throws(()=>validateProject({...one(),name:''})));
test('Long project name rejected',()=>throws(()=>validateProject({...one(),name:'x'.repeat(81)})));
test('Duplicate object IDs rejected',()=>{const p=one();p.objects.push(clone(p.objects[0]));throws(()=>validateProject(p));});
test('Unsupported object types rejected',()=>{const p=one();p.objects[0].type='mesh';throws(()=>validateProject(p));});
test('Unknown material rejected',()=>{const p=one();p.objects[0].material='missing';throws(()=>validateProject(p));});
test('Inherited object keys cannot be used as materials',()=>{const p=one();p.objects[0].material='__proto__';throws(()=>validateProject(p));});
test('NaN and infinity rejected',()=>{for(const v of [NaN,Infinity,-Infinity]){const p=one();p.objects[0].x=v;throws(()=>validateProject(p));}});
test('Numeric strings rejected',()=>{const p=one();p.objects[0].x='12';throws(()=>validateProject(p));});
test('Negative and zero dimensions rejected',()=>{for(const v of [0,-1]){const p=one();p.objects[0].h=v;throws(()=>validateProject(p));}});
test('World bounds validate full extents, not just origins',()=>{const p=one();p.objects[0].x=4080;throws(()=>validateProject(p));});
test('Negative world bounds rejected',()=>{const p=one();p.objects[0].y=-4097;throws(()=>validateProject(p));});
test('400-object limit enforced',()=>{const p=emptyProject();p.objects=Array.from({length:MAX_OBJECTS+1},()=>brush());throws(()=>validateProject(p));});
test('Unknown properties stripped on import',()=>{const p=one();p.secret='ignored';p.objects[0].extra='ignored';const clean=validateProject(p);assert(!('secret'in clean));assert(!('extra'in clean.objects[0]));});
test('Validated result is independent of source',()=>{const p=one(),clean=validateProject(p);p.objects[0].x=500;equal(clean.objects[0].x,0);});
test('Grid snapping positive and negative coordinates',()=>{equal(snap(31,16),32);equal(snap(-31,16),-32);});
test('Draw gestures normalize reverse rectangle direction',()=>{const b=rectangleBrush({x:112,y:96},{x:16,y:32},16,64,'clay');equal([b.x,b.y,b.w,b.d,b.h,b.material],[16,32,96,64,64,'clay']);});
test('Thin draw gestures create at least one grid cell',()=>{const b=rectangleBrush({x:0,y:0},{x:1,y:1},16);equal([b.w,b.d],[16,16]);});
test('Brush geometry has eight distinct corners',()=>equal(new Set(vertices(brush()).map(v=>v.join(','))).size,8));
test('OBJ output has eight vertices and six faces per brush',()=>{const obj=toOBJ(starter());equal(obj.split('\n').filter(x=>x.startsWith('v ')).length,96);equal(obj.split('\n').filter(x=>x.startsWith('f ')).length,72);});
test('OBJ faces point outward',()=>{const vs=vertices(brush());const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];for(const f of FACES){const [a,b,c]=f.map(i=>vs[i]);const normal=cross(b.map((v,i)=>v-a[i]),c.map((v,i)=>v-a[i]));const center=f.map(i=>vs[i]).reduce((acc,v)=>acc.map((n,j)=>n+v[j]/4),[0,0,0]);assert(normal.reduce((s,n,i)=>s+n*(center[i]-48),0)>0);}});
test('OBJ skips entities',()=>{const p=emptyProject();p.objects=[entity()];assert(!toOBJ(p).includes('\nv '));});
test('OBJ object names cannot inject directives',()=>{const p=one();p.objects[0].name='name\nf 999 999 999';assert(toOBJ(p).includes('o name_f_999_999_999'));});
test('MAP includes worldspawn and marker entity classes',()=>{const map=toMAP(starter());assert(map.includes('"classname" "worldspawn"'));assert(map.includes('"classname" "info_player_start"'));assert(map.includes('"classname" "light"'));});
test('MAP emits six standard planes per brush',()=>equal(toMAP(starter()).split('\n').filter(x=>x.startsWith('( ')).length,72));
test('MAP plane normals use Quake winding and enclose brush',()=>{const p=one();const lines=toMAP(p).split('\n').filter(x=>x.startsWith('( '));for(const line of lines){const points=[...line.matchAll(/\( ([^)]+) \)/g)].map(m=>m[1].split(' ').map(Number));const [a,b,c]=points;const v1=c.map((v,i)=>v-a[i]),v2=b.map((v,i)=>v-a[i]);const n=[v1[1]*v2[2]-v1[2]*v2[1],v1[2]*v2[0]-v1[0]*v2[2],v1[0]*v2[1]-v1[1]*v2[0]];assert(n.reduce((s,v,i)=>s+v*(48-a[i]),0)<0);}});
test('MAP uses explicitly named placeholder textures',()=>assert(toMAP(one()).includes('bk_stone 0 0 0 1 1')));
test('History undo and redo round-trip edits',()=>{const h=new History(one());const p=clone(h.current);p.objects[0].x=32;h.commit(p);h.undo();equal(h.current.objects[0].x,0);h.redo();equal(h.current.objects[0].x,32);});
test('New edits clear redo history',()=>{const h=new History(one());const p=clone(h.current);p.name='Second';h.commit(p);h.undo();const q=clone(h.current);q.name='Third';h.commit(q);assert(!h.redo());});
test('No-op edits do not add history',()=>{const h=new History(one());assert(!h.commit(clone(h.current)));equal(h.past.length,0);});
test('Invalid edits leave history untouched',()=>{const h=new History(one());const p=clone(h.current);p.objects[0].h=-10;throws(()=>h.commit(p));equal(h.past.length,0);equal(h.current.objects[0].h,96);});
test('History retains a maximum of 80 edits',()=>{const h=new History(one());for(let i=0;i<100;i++){const p=clone(h.current);p.name=`Project ${i}`;h.commit(p);}equal(h.past.length,80);});
test('History can undo scene replacement',()=>{const h=new History(starter());h.commit(emptyProject());equal(h.current.objects.length,0);h.undo();equal(h.current.objects.length,14);});


const renderCanvas=document.createElement('canvas');renderCanvas.style.cssText='width:320px;height:240px;display:block';renderCanvas.setAttribute('aria-label','Depth rendering regression fixture');document.body.append(renderCanvas);const viewport=new Viewport(renderCanvas,'3d');const renderScene=emptyProject();const floor=brush('Floor',{x:-256,y:-192,z:-16,w:512,d:384,h:16,material:'basalt'}),terrace=brush('Raised terrace',{x:144,y:-96,z:0,w:112,d:192,h:32,material:'clay'});renderScene.objects=[floor,terrace];viewport.set(renderScene,terrace.id,16);
test('Depth-aware viewport picking selects raised terrace above large floor',()=>{const p=viewport.project([200,0,32]);equal(viewport.hit(p.x,p.y),terrace.id);});
test('Raised terrace remains visible above large floor',()=>{const p=viewport.project([200,0,32]),dpr=Math.min(devicePixelRatio||1,2);const rgb=viewport.ctx.getImageData(Math.round(p.x*dpr),Math.round(p.y*dpr),1,1).data;assert(rgb[0]>rgb[1]&&rgb[1]>rgb[2],`Expected terracotta surface; received ${[...rgb]}`);});
test('Focus and home reset view transforms without mutating geometry',()=>{const before=serialize(renderScene);viewport.focus(terrace);assert(viewport.pan.x!==0);viewport.home();equal(viewport.pan,{x:0,y:0});equal(serialize(renderScene),before);});

document.getElementById('run-ui').onclick=async()=>{
 document.getElementById('run-ui').disabled=true;const saved=localStorage.getItem('brushkeep.project.v1');localStorage.removeItem('brushkeep.project.v1');const iframe=document.createElement('iframe');iframe.title='Brushkeep UI integration test';iframe.src='../?test-run';document.getElementById('frame-holder').append(iframe);await new Promise(resolve=>iframe.onload=resolve);const d=iframe.contentDocument;const get=id=>d.getElementById(id);const click=id=>get(id).click();const change=(id,value)=>{get(id).value=value;get(id).dispatchEvent(new Event('change',{bubbles:true}));};const ui=(name,fn)=>test(name,fn,'ui-results');const pause=()=>new Promise(resolve=>setTimeout(resolve,40));
 try{
 ui('Initial scene renders with 14 selectable objects',()=>equal(d.querySelectorAll('.scene-object').length,14));
 ui('Inspector opens on Study block',()=>equal(get('object-name').value,'Study block'));
 ui('Add block updates scene and selection',()=>{click('add-brush');equal(d.querySelectorAll('.scene-object').length,15);equal(get('dim-h').value,'96');});
 ui('Inspector position edit is saved',()=>{change('pos-x','64');equal(get('pos-x').value,'64');equal(JSON.parse(localStorage.getItem('brushkeep.project.v1')).objects.at(-1).x,64);});
 ui('Invalid dimensions are rejected with existing scene intact',()=>{change('dim-h','-1');equal(get('dim-h').value,'96');assert(get('status').textContent.includes('at least 1'));});
 ui('Material buttons change the selected brush',()=>{d.querySelector('[data-material="clay"]').click();assert(get('selected-material').textContent.includes('Terracotta'));});
 ui('Duplicate and undo/redo update scene count',()=>{click('duplicate-button');equal(d.querySelectorAll('.scene-object').length,16);click('undo-button');equal(d.querySelectorAll('.scene-object').length,15);click('redo-button');equal(d.querySelectorAll('.scene-object').length,16);});
 ui('Delete selected object is reversible',()=>{click('delete-button');equal(d.querySelectorAll('.scene-object').length,15);click('undo-button');equal(d.querySelectorAll('.scene-object').length,16);});
 ui('Entity creation switches inspector without dimensions',()=>{click('add-light');equal(get('selection-type').textContent,'LIGHT');assert(get('dimensions').hidden);});
 ui('Rename project persists exact text safely',()=>{change('project-name','<b>Courtyard</b>');equal(get('project-label').textContent,'<b>Courtyard</b>');equal(get('project-label').children.length,0);});
 ui('Draw tool changes top-view controls',()=>{click('draw-tool');equal(get('top-mode').textContent,'XY / DRAW');});
 ui('New scene requires replacement confirmation',()=>{click('new-button');assert(get('confirm-dialog').open);equal(d.querySelectorAll('.scene-object').length,17);});
 ui('Cancel replacement preserves current scene',()=>{get('confirm-dialog').querySelector('[data-close]').click();equal(d.querySelectorAll('.scene-object').length,17);});await pause();
 click('new-button');click('confirm-replace');await pause();
 ui('Confirmed empty scene renders safely',()=>{equal(d.querySelectorAll('.scene-object').length,0);assert(get('inspector').hidden);});
 ui('Undo restores a replaced scene',()=>{click('undo-button');equal(d.querySelectorAll('.scene-object').length,17);});
 click('open-button');get('import-text').value='bad json';click('paste-import');
 ui('Invalid pasted JSON stays in import dialog without replacement',()=>{assert(get('open-dialog').open);assert(get('import-error').textContent.includes('not valid JSON'));equal(d.querySelectorAll('.scene-object').length,17);});
 const project=one();project.name='Imported test';get('import-text').value=serialize(project);click('paste-import');await pause();
 ui('Valid JSON requests confirmation before replacement',()=>{assert(get('confirm-dialog').open);equal(d.querySelectorAll('.scene-object').length,17);});
 click('confirm-replace');await pause();
 ui('Confirmed JSON import loads name and geometry',()=>{equal(d.querySelectorAll('.scene-object').length,1);equal(get('project-name').value,'Imported test');equal(get('dim-w').value,'96');});
 ui('Export dialog states experimental compatibility clearly',()=>{click('export-button');assert(get('export-dialog').open);assert(get('export-dialog').textContent.includes('Not tested in TrenchBroom'));get('export-dialog').querySelector('[data-close]').click();});
 await pause();ui('Close/escape leaves no modal behind',()=>equal(d.querySelectorAll('dialog[open]').length,0));
 const unreadable='{"format":"brushkeep","version":99}';localStorage.setItem('brushkeep.project.v1',unreadable);iframe.src='../?test-invalid-autosave';await new Promise(resolve=>iframe.onload=resolve);const restored=iframe.contentDocument;
 ui('Unreadable or newer-version autosave is preserved on startup',()=>{equal(localStorage.getItem('brushkeep.project.v1'),unreadable);assert(restored.getElementById('save-state').textContent.includes('preserved'));});
 ui('Ordinary edits do not destroy the unreadable recovery payload',()=>{restored.getElementById('add-brush').click();equal(localStorage.getItem('brushkeep.project.v1'),unreadable);});
 restored.getElementById('new-button').click();restored.getElementById('confirm-replace').click();await pause();
 ui('Explicit replacement resumes autosave safely',()=>equal(JSON.parse(localStorage.getItem('brushkeep.project.v1')).objects.length,0));
 }finally{if(saved===null)localStorage.removeItem('brushkeep.project.v1');else localStorage.setItem('brushkeep.project.v1',saved);iframe.remove();document.getElementById('run-ui').textContent='UI checks completed; previous autosave restored';}
};
