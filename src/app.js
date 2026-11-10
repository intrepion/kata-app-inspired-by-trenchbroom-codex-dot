import {MATERIALS,MAX_OBJECTS,brush,entity,emptyProject,starter,clone,snap,uid,parseProject,serialize,validateProject,toOBJ,toMAP,History,rectangleBrush} from './model.js';
import {Viewport} from './renderer.js';
const $=id=>document.getElementById(id);
const STORAGE='brushkeep.project.v1';
let initial=starter(),restoreMessage='',preserveExisting=false;
try{const raw=localStorage.getItem(STORAGE);if(raw){initial=parseProject(raw);restoreMessage='Restored your last local scene.';}}catch{preserveExisting=true;restoreMessage='Existing autosave could not be opened and has been preserved. Open a JSON backup or start a new scene.';}
const history=new History(initial);
let selected=initial.objects.find(o=>o.name==='Study block')?.id||initial.objects[0]?.id||null;
let material='limestone',grid=16,mode='select',pendingReplacement=null,autosaveAvailable=true,activeGesture=false,cancelActiveGesture=null;
const view3d=new Viewport($('view3d'),'3d'),viewtop=new Viewport($('viewtop'),'top');
const scene=()=>history.current;
const current=()=>scene().objects.find(o=>o.id===selected);
const say=text=>{$('status').textContent=text;$('status').title=text;};
function saveLocal(){if(preserveExisting){autosaveAvailable=false;$('save-state').textContent='Existing autosave preserved · export a backup';return;}try{localStorage.setItem(STORAGE,serialize(scene()));autosaveAvailable=true;$('save-state').textContent='Saved in this browser';}catch{autosaveAvailable=false;$('save-state').textContent='Autosave unavailable · export a backup';}}
function redraw(project=scene()){view3d.set(project,selected,grid);viewtop.set(project,selected,grid);}
function render(){
 if(selected&&!current())selected=scene().objects.at(-1)?.id||null;
 $('project-label').textContent=scene().name;$('project-name').value=scene().name;
 $('undo-button').disabled=!history.past.length;$('redo-button').disabled=!history.future.length;
 const count=scene().objects.length,brushes=scene().objects.filter(o=>o.type==='brush').length;
 $('scene-count').textContent=`${count} object${count===1?'':'s'}`;$('object-stats').textContent=`${brushes} brushes · ${count-brushes} entities`;
 const list=$('object-list');const scroll=list.scrollTop;list.replaceChildren();
 for(const o of scene().objects){const btn=document.createElement('button');btn.className=`scene-object${o.id===selected?' selected':''}`;btn.setAttribute('aria-pressed',String(o.id===selected));btn.dataset.id=o.id;btn.title=o.name;const swatch=document.createElement('span');swatch.style.background=o.type==='brush'?MATERIALS[o.material].color:o.type==='spawn'?'#87c7ad':'#e7c576';if(o.type!=='brush')swatch.style.transform='rotate(45deg)';btn.append(swatch,document.createTextNode(o.name));btn.onclick=()=>{selected=o.id;render();say(`Selected ${o.name}.`);};list.append(btn);}list.scrollTop=scroll;
 const o=current();$('inspector').hidden=!o;$('no-selection').hidden=!!o;$('selection-type').textContent=o?o.type.toUpperCase():'NONE';
 if(o){$('object-name').value=o.name;for(const axis of ['x','y','z']){$(`pos-${axis}`).value=o[axis];$(`pos-${axis}`).step=grid;}$('dimensions').hidden=o.type!=='brush';if(o.type==='brush'){for(const dim of ['w','d','h']){$(`dim-${dim}`).value=o[dim];$(`dim-${dim}`).step=grid;}$('selected-material').firstElementChild.style.background=MATERIALS[o.material].color;$('selected-material').lastElementChild.replaceChildren(document.createTextNode(MATERIALS[o.material].name));const small=document.createElement('small');small.textContent='Whole brush material';$('selected-material').lastElementChild.append(small);}$('object-note').textContent=o.type==='brush'?'Solid cuboid · axis aligned':o.type==='spawn'?'Player spawn marker · no collision preview':'Light marker · preview is not baked lighting';}
 for(const b of $('materials').children){const active=b.dataset.material===(o?.type==='brush'?o.material:material);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
 $('material-name').textContent=MATERIALS[o?.type==='brush'?o.material:material].name;
 $('select-tool').classList.toggle('active',mode==='select');$('draw-tool').classList.toggle('active',mode==='draw');$('select-tool').setAttribute('aria-pressed',String(mode==='select'));$('draw-tool').setAttribute('aria-pressed',String(mode==='draw'));
 $('top-mode').textContent=`XY / ${mode.toUpperCase()}`;$('top-help').textContent=mode==='draw'?'Drag to create a brush · Uses selected height and material':'Drag a brush to move · Shift + drag to pan';$('viewtop').style.cursor=mode==='draw'?'crosshair':'default';redraw();
}
function commit(project,message){try{const changed=history.commit(project);if(changed)saveLocal();render();if(message)say(`${message}${autosaveAvailable?'':' Autosave unavailable; save a JSON backup.'}`);return true;}catch(error){say(error.message);render();return false;}}
function mutate(fn,message){const next=clone(scene());fn(next);return commit(next,message);}
function add(o){if(scene().objects.length>=MAX_OBJECTS){say(`This scene is limited to ${MAX_OBJECTS} objects.`);return;}const prev=selected;selected=o.id;if(!mutate(p=>p.objects.push(o),`${o.name} added.`))selected=prev;render();}
function height(){const n=Number($('brush-height').value);return Number.isFinite(n)&&n>=16&&n<=1024?snap(n,grid):96;}
function setMode(value){mode=value;render();say(value==='draw'?'Drag in the top view to draw a solid brush.':'Select an object in either view or the scene list.');}
function duplicate(){const o=current();if(!o)return;const copy={...clone(o),id:uid(),name:`${o.name.slice(0,72)} copy`,x:o.x+grid,y:o.y+grid};add(copy);}
function remove(){const o=current();if(!o)return;mutate(p=>p.objects=p.objects.filter(v=>v.id!==o.id),`${o.name} removed. Undo is available.`);}
function undo(){if(history.undo()){saveLocal();render();say('Undid the last edit.');}}
function redo(){if(history.redo()){saveLocal();render();say('Redid the edit.');}}
function download(text,extension,mime='text/plain'){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=scene().name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.'+extension;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);say(`${extension.toUpperCase()} download requested. Keep a JSON backup for future editing.`);}
function openDialog(id){$(id).showModal();}
function requestReplacement(project,title){pendingReplacement=validateProject(project);$('confirm-title').textContent=title;openDialog('confirm-dialog');}
for(const [key,value] of Object.entries(MATERIALS)){const btn=document.createElement('button');btn.className='swatch';btn.style.backgroundColor=value.color;btn.dataset.material=key;btn.setAttribute('aria-label',`${value.name} material`);btn.title=value.name;btn.onclick=()=>{material=key;const o=current();if(o?.type==='brush')mutate(p=>p.objects.find(v=>v.id===o.id).material=key,`${value.name} applied to ${o.name}.`);else{render();say(`New brushes will use ${value.name}.`);}};$('materials').append(btn);}
$('select-tool').onclick=()=>setMode('select');$('draw-tool').onclick=()=>setMode('draw');
function addBlock(){add(brush(`Block ${scene().objects.filter(o=>o.type==='brush').length+1}`,{h:height(),material}));}
$('add-brush').onclick=addBlock;
$('add-spawn').onclick=()=>add(entity('spawn'));$('add-light').onclick=()=>add(entity('light',{z:128}));
$('duplicate-button').onclick=duplicate;$('delete-button').onclick=remove;$('undo-button').onclick=undo;$('redo-button').onclick=redo;
$('home-button').onclick=()=>{view3d.home();viewtop.home();say('Both views reset.');};
function focusSelected(){const o=current();if(o){view3d.focus(o);viewtop.focus(o);say(`Centered both views on ${o.name}.`);}}
$('focus-button').onclick=focusSelected;
$('grid-select').onchange=e=>{grid=Number(e.target.value);render();say(`Grid snap set to ${grid} units. Existing geometry is unchanged.`);};
$('brush-height').onchange=()=>{const n=Number($('brush-height').value);if(!Number.isFinite(n)||n<16||n>1024){$('brush-height').value=96;say('Brush height must be between 16 and 1024 units. Reset to 96.');}else $('brush-height').value=snap(n,grid)||grid;};
$('object-name').onchange=e=>{const o=current();if(o)mutate(p=>p.objects.find(v=>v.id===o.id).name=e.target.value.trim(),'Object renamed.');};
for(const key of ['x','y','z','w','d','h']){const field=$(`${['x','y','z'].includes(key)?'pos':'dim'}-${key}`);field.onchange=()=>{const o=current();if(!o)return;const n=field.value.trim()===''?NaN:Number(field.value);mutate(p=>p.objects.find(v=>v.id===o.id)[key]=n,'Object geometry updated.');};}
$('project-name').onchange=e=>mutate(p=>p.name=e.target.value.trim(),'Project renamed.');
$('save-button').onclick=()=>download(serialize(scene()),'brushkeep.json','application/json');$('export-button').onclick=()=>openDialog('export-dialog');
$('download-json').onclick=()=>download(serialize(scene()),'brushkeep.json','application/json');$('download-obj').onclick=()=>download(toOBJ(scene()),'obj');$('download-map').onclick=()=>download(toMAP(scene()),'map');
$('new-button').onclick=()=>requestReplacement(emptyProject(),'Start an empty scene?');$('demo-button').onclick=()=>requestReplacement(starter(),'Load the quiet courtyard?');
$('confirm-replace').onclick=()=>{if(!pendingReplacement)return;const next=pendingReplacement;pendingReplacement=null;preserveExisting=false;$('confirm-dialog').close();selected=next.objects.find(o=>o.name==='Study block')?.id||next.objects[0]?.id||null;commit(next,'Scene replaced. Your previous scene is available with Undo.');view3d.home();viewtop.home();};
$('confirm-dialog').addEventListener('close',()=>{pendingReplacement=null;});
$('help-button').onclick=()=>openDialog('help-dialog');$('about-button').onclick=()=>openDialog('about-dialog');
for(const btn of document.querySelectorAll('[data-close]'))btn.onclick=()=>btn.closest('dialog').close();
$('open-button').onclick=()=>{$('import-error').textContent='';openDialog('open-dialog');};$('choose-file').onclick=()=>$('file-input').click();
function importText(text){try{const project=parseProject(text);$('open-dialog').close();$('import-error').textContent='';requestReplacement(project,`Open “${project.name}”?`);}catch(error){$('import-error').textContent=error.message;say(error.message);}}
$('paste-import').onclick=()=>importText($('import-text').value);
$('file-input').onchange=async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;if(file.size>2_000_000){$('import-error').textContent='Choose a JSON project smaller than 2 MB.';return;}try{importText(await file.text());}catch{$('import-error').textContent='Could not read the selected file.';}};
function localPoint(event,view){const rect=view.canvas.getBoundingClientRect();return {x:event.clientX-rect.left,y:event.clientY-rect.top};}
function bindViewport(view){let drag=null;const c=view.canvas;
 c.addEventListener('pointerdown',e=>{if(activeGesture||(e.button!==0&&e.button!==1))return;e.preventDefault();c.focus();const point=localPoint(e,view),hit=view.hit(point.x,point.y);const pan=e.shiftKey||e.button===1;
 drag={gestureMode:mode,pointerId:e.pointerId,start:point,last:point,world:view.unproject(point.x,point.y),hit,pan,moved:false,original:clone(scene()),originalSelected:selected};
 activeGesture=true;cancelActiveGesture=()=>finish({pointerId:drag?.pointerId},true);
 if(view.mode==='top'&&!pan&&mode==='select'){selected=hit;render();}c.setPointerCapture(e.pointerId);});
 c.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointerId)return;const point=localPoint(e,view);const dx=point.x-drag.last.x,dy=point.y-drag.last.y;if(Math.hypot(point.x-drag.start.x,point.y-drag.start.y)>3)drag.moved=true;
 if(drag.pan){view.pan.x+=dx;view.pan.y+=dy;view.draw();}
 else if(view.mode==='3d'){if(drag.moved){view.yaw+=dx*.008;view.pitch=Math.max(.12,Math.min(1.4,view.pitch+dy*.006));view.draw();}}
 else if(drag.gestureMode==='draw'){const p=view.unproject(point.x,point.y);view.preview=rectangleBrush(drag.world,p,grid,height(),material);view.draw();}
 else if(drag.hit&&drag.moved){const next=clone(drag.original);const o=next.objects.find(o=>o.id===drag.hit);const p=view.unproject(point.x,point.y);o.x+=snap(p.x-drag.world.x,grid);o.y+=snap(p.y-drag.world.y,grid);drag.next=next;redraw(next);}
 drag.last=point;
 });
 const finish=(e,cancel=false)=>{if(!drag||e.pointerId!==drag.pointerId)return;const d=drag;drag=null;activeGesture=false;cancelActiveGesture=null;view.preview=null;
 if(cancel){selected=d.originalSelected;render();say('Gesture cancelled.');return;}
 if(!d.pan){if(view.mode==='3d'&&!d.moved){selected=d.hit;render();say(current()?`Selected ${current().name}.`:'Selection cleared.');}
 else if(view.mode==='top'&&d.gestureMode==='draw'&&d.moved){const p=view.unproject(d.last.x,d.last.y);add(rectangleBrush(d.world,p,grid,height(),material));}
 else if(d.next)commit(d.next,'Object moved on the grid.');}redraw();};
 c.addEventListener('pointerup',e=>finish(e));c.addEventListener('pointercancel',e=>finish(e,true));c.addEventListener('lostpointercapture',e=>{if(drag)finish(e,true);});
 c.addEventListener('wheel',e=>{e.preventDefault();view.zoom=Math.max(.3,Math.min(4,view.zoom*Math.exp(-e.deltaY*.001)));view.draw();},{passive:false});
}
bindViewport(view3d);bindViewport(viewtop);
document.addEventListener('pointerdown',e=>{if(activeGesture&&!e.target.closest('canvas'))cancelActiveGesture?.();},true);
document.addEventListener('keydown',e=>{
 if(activeGesture){if(e.key==='Escape'){e.preventDefault();cancelActiveGesture?.();}return;}
 if(document.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)return;
 const mod=e.ctrlKey||e.metaKey;const key=e.key.toLowerCase();
 if(mod&&key==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if(mod&&key==='y'){e.preventDefault();redo();}else if(mod&&key==='d'){e.preventDefault();duplicate();}else if(mod&&key==='s'){e.preventDefault();download(serialize(scene()),'brushkeep.json','application/json');}
 else if(!mod&&(key==='+'||key==='='))addBlock();else if(!mod&&key==='f')focusSelected();else if(!mod&&key==='v')setMode('select');else if(!mod&&key==='b')setMode('draw');else if(!mod&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();remove();}
 else if(!mod&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&current()){e.preventDefault();const id=selected;mutate(p=>{const o=p.objects.find(v=>v.id===id);if(e.key==='ArrowLeft')o.x-=grid;if(e.key==='ArrowRight')o.x+=grid;if(e.key==='ArrowUp')o.y-=grid;if(e.key==='ArrowDown')o.y+=grid;},'Object nudged on the grid.');}
});
render();saveLocal();if(restoreMessage)say(restoreMessage);
