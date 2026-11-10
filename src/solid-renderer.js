// A tiny original depth-buffered renderer. Projects are still plain cuboid data.
export class SolidRenderer {
 constructor(){
  this.canvas=document.createElement('canvas');const gl=this.canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL unavailable');this.gl=gl;
  const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader compilation failed');return s;};
  const vertex=compile(gl.VERTEX_SHADER,'attribute vec3 position;attribute vec3 color;varying vec3 surface;void main(){gl_Position=vec4(position,1.0);surface=color;}');
  const fragment=compile(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 surface;void main(){gl_FragColor=vec4(surface,1.0);}');
  this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error('Shader linking failed');gl.deleteShader(vertex);gl.deleteShader(fragment);
  this.position=gl.getAttribLocation(this.program,'position');this.color=gl.getAttribLocation(this.program,'color');this.buffer=gl.createBuffer();
 }
 draw(faces,width,height,dpr,selected,materials){
  const gl=this.gl;const w=Math.round(width*dpr),h=Math.round(height*dpr);if(this.canvas.width!==w)this.canvas.width=w;if(this.canvas.height!==h)this.canvas.height=h;
  gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
  gl.enableVertexAttribArray(this.position);gl.vertexAttribPointer(this.position,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(this.color);gl.vertexAttribPointer(this.color,3,gl.FLOAT,false,24,12);
  const vertices=[],edges=[];
  const color=(hex,m=1)=>{const n=parseInt(hex.slice(1),16);return [(n>>16)/255*m,((n>>8)&255)/255*m,(n&255)/255*m].map(v=>Math.min(1,v));};
  const push=(arr,p,c,bias=0)=>arr.push(p.x/width*2-1,1-p.y/height*2,-p.depth/8192-bias,...c);
  for(const f of faces){const c=color(materials[f.o.material].color,[.5,1.04,.65,.77,.84,.63][f.index]);for(const i of [0,1,2,0,2,3])push(vertices,f.points[i],c);
   const edge=color(f.o.id===selected?'#ffcf76':'#263437');for(let i=0;i<4;i++){push(edges,f.points[i],edge,.00001);push(edges,f.points[(i+1)%4],edge,.00001);}
   if(f.index===1&&f.o.w>=64&&f.o.d>=64){const middle={x:0,y:0,depth:0};for(const p of f.points)for(const key of ['x','y','depth'])middle[key]+=p[key]/4;const inner=f.points.map(p=>Object.fromEntries(['x','y','depth'].map(key=>[key,middle[key]+(p[key]-middle[key])*.88])));const subtle=c.map(v=>Math.min(1,v+.045));for(let i=0;i<4;i++){push(edges,inner[i],subtle,.00001);push(edges,inner[(i+1)%4],subtle,.00001);}}
  }
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/6);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(edges),gl.DYNAMIC_DRAW);gl.drawArrays(gl.LINES,0,edges.length/6);return this.canvas;
 }
}
