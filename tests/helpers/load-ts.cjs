const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
module.exports=function createLoader({mocks={},env={},globals={}}={}){
 const cache=new Map();
 function load(filename){
  let absolute=path.resolve(filename);if(!fs.existsSync(absolute)&&absolute.endsWith('.ts')&&fs.existsSync(absolute+'x'))absolute+='x';if(cache.has(absolute))return cache.get(absolute);
  const out={};cache.set(absolute,out);
  const code=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{exports:out,Buffer,Date,URL,URLSearchParams,AbortSignal,Request,Response,FormData,process:{env},fetch:()=>{throw Error('Unexpected network request');},...globals,require(name){
   if(name==='server-only')return{};
   if(Object.hasOwn(mocks,name))return mocks[name];
   if(name.startsWith('@/'))return load(path.join(process.cwd(),'src',name.slice(2))+'.ts');
   if(name.startsWith('.'))return load(path.resolve(path.dirname(absolute),name)+'.ts');
   return require(name);
  }},{filename:absolute});return out;
 }
 return load;
};
