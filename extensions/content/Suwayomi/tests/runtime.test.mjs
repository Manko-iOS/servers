import test from "node:test";
import assert from "node:assert/strict";
import {resolve} from "node:path";
import {loadContentExtension,runtimeResponse} from "../../test-runtime.mjs";
const path=resolve(import.meta.dirname,"../main.wasm");
const args=(operation,extra={})=>({operation,baseURL:"https://server.test/suwayomi/",options:{sourceID:"42"},...extra});
test("Suwayomi compiled metadata and bounded page routes never update reading progress",async()=>{
 const manga={id:3,title:"Fixture",author:"Writer",genre:["manga"]};
 const {extension,calls}=await loadContentExtension(path,request=>{
  if(new URL(request.url).pathname==="/suwayomi/api/v1/manga/3/chapter/2")return runtimeResponse({text:JSON.stringify({pageCount:3})});
  assert.equal(new URL(request.url).pathname,"/suwayomi/api/graphql");
  const {query,variables}=request.body;let data;
  if(query.includes("MankoDiscovery"))data={serverSettings:{ip:"localhost"}};
  else if(query.includes("MankoChapters"))data={chapters:{nodes:[{id:8,name:"Chapter",sourceOrder:2,pageCount:3}]}};
  else if(query.includes("MankoSearch")){assert.equal(variables.source,42);assert.equal(variables.page,2);data={searchSourceManga:{mangas:[manga],hasNextPage:true}};}
  else data={manga};
  return runtimeResponse({text:JSON.stringify({data})});
 });
 assert.ok((await extension.connector(args("capabilities"))).includes("imageSequence"));
 const page=await extension.connector(args("search",{query:{text:"Fixture",page:2}}));assert.equal(page.nextPage,3);
 assert.equal((await extension.connector(args("details",{remoteID:"3"}))).coverURL,null);
 const chapter=(await extension.connector(args("installments",{remoteID:"3",page:1}))).items[0];assert.equal(chapter.remoteID,"3:2:8");
 assert.equal(chapter.format,"remoteImageSequence");
 const count=calls.length;
 const pages=await extension.connector(args("imagePages",{remoteID:chapter.remoteID,pageCount:3,query:{page:1,pageSize:2}}));assert.equal(pages.nextPage,2);assert.deepEqual(pages.items.map(v=>v.index),[0,1]);
 assert.ok(pages.items.every(v=>v.resourceURL.endsWith("updateProgress=false")));
 assert.ok((await extension.connector(args("acquisition",{remoteID:chapter.remoteID}))).endsWith("markAsRead=false"));assert.equal(calls.length,count+1);
 await assert.rejects(extension.connector(args("imagePages",{remoteID:chapter.remoteID,pageCount:50001})));
 await assert.rejects(extension.connector(args("details",{remoteID:"18446744073709551616"})));
});

test('Suwayomi negotiates the current Relay API and refreshes actual manga and chapter data',async()=>{
 const manga={id:3,title:'Original Local Comic',thumbnailUrl:'/api/v1/manga/3/thumbnail',genre:['manga'],sourceId:'0'};
 const chapter={id:8,name:'Chapter 1',chapterNumber:1,sourceOrder:0,pageCount:-1,uploadDate:'1767225600000'};
 const loaded=await loadContentExtension(path,request=>{
  const {query,variables}=request.body;
  if(query.includes('serverSettings {'))return runtimeResponse({text:JSON.stringify({errors:[{message:"Validation error (FieldUndefined@[serverSettings])"}]})});
  let data;
  if(query.includes('MankoDiscovery'))data={serverSettings:{ip:'127.0.0.1'}};
  else if(query.includes('MankoSearch')||query.includes('MankoBrowse')){
   assert.ok(query.startsWith('mutation '));assert.equal(variables.input.source,'0');
   assert.equal(variables.input.type,query.includes('MankoSearch')?'SEARCH':'POPULAR');
   data={[query.includes('MankoSearch')?'searchSourceManga':'fetchSourceManga']:{mangas:[manga],hasNextPage:false}};
  } else if(query.includes('MankoDetails')){
   assert.equal(variables.input.fetchManga,true);assert.equal(variables.input.fetchChapters,false);data={fetchMangaAndChapters:{manga}};
  } else if(query.includes('MankoChapters')){
   assert.equal(variables.input.fetchManga,false);assert.equal(variables.input.fetchChapters,true);assert.ok(!query.includes('volumeNumber'));data={fetchMangaAndChapters:{chapters:[chapter]}};
  } else throw new Error('Unexpected GraphQL request');
  return runtimeResponse({text:JSON.stringify({data})});
 });
 const config=(operation,extra={})=>args(operation,{options:{sourceID:'0'},...extra});
 await loaded.extension.connector(config('capabilities'));
 await loaded.extension.connector(config('browse',{query:{page:1}}));
 await loaded.extension.connector(config('search',{query:{text:'Original',page:1}}));
 assert.equal((await loaded.extension.connector(config('details',{remoteID:'3'}))).title,manga.title);
 const chapters=(await loaded.extension.connector(config('installments',{remoteID:'3'}))).items;
 assert.equal(chapters[0].remoteID,'3:0:8');assert.equal(chapters[0].pageCount,null);assert.equal(chapters[0].publishedAt,'2026-01-01T00:00:00Z');
 assert.equal(loaded.calls.filter(r=>r.body.query.includes('serverSettings {')).length,1,'remember negotiated API per connection');
});

test('Suwayomi does not retry authorization or execution errors as another API version',async()=>{
 const loaded=await loadContentExtension(path,()=>runtimeResponse({text:JSON.stringify({errors:[{message:'Permission denied'}]})}));
 await assert.rejects(loaded.extension.connector(args('capabilities')),{type:'serviceError'});
 assert.equal(loaded.calls.length,1);
});


test('Suwayomi prepares page resources even when a previous session supplied a count',async()=>{
 const loaded=await loadContentExtension(path,request=>{
  assert.equal(new URL(request.url).pathname,'/suwayomi/api/v1/manga/3/chapter/2');
  return runtimeResponse({text:JSON.stringify({pageCount:3})});
 });
 const pages=await loaded.extension.connector(args('imagePages',{remoteID:'3:2:8',pageCount:2,query:{page:1,pageSize:2}}));
 assert.equal(loaded.calls.length,1,'prepare the server page cache before returning image URLs');
 assert.equal(pages.totalCount,3,'use the current server count');
 assert.equal(pages.nextPage,2);
 assert.deepEqual(pages.items.map(item=>item.index),[0,1]);
 const failed=await loadContentExtension(path,()=>runtimeResponse({status:404}));
 await assert.rejects(failed.extension.connector(args('imagePages',{remoteID:'3:2:8',pageCount:2})),{type:'notFound'});
});
