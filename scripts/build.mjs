import {mkdir,copyFile,cp,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','icon.svg','app.json'])await copyFile(file,`dist/${file}`);
await cp('src','dist/src',{recursive:true});
await cp('screenshots','dist/screenshots',{recursive:true});
console.log('Built static Brushkeep in dist/.');
