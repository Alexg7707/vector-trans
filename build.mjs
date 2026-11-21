import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('public',{recursive:true});
for(const file of ['index.html','style.css','favicon.svg','app.js','cargo-clean.jpg','truck-clean.jpg']) await copyFile(file,'public/'+file);
