import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler,{validate,message} from './request.js';
const sample={name:'Тест',phone:'+7 (999) 123-45-67',from:'Москва',to:'Казань',cargo:'6 паллет, 2 т',date:'2099-01-01',comment:'Нужна боковая погрузка',consent:true};
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}};}
const request=body=>({method:'POST',headers:{'content-type':'application/json',host:'example.vercel.app',origin:'https://example.vercel.app'},body});
test('validation rejects missing fields, invalid phones, impossible dates and absent consent',()=>{
  assert.equal(validate(sample).from,'Москва');
  for(const change of [{name:''},{phone:'123'},{date:'2099-02-31'},{date:'2000-01-01'},{consent:false},{cargo:'x'.repeat(351)}]) assert.throws(()=>validate({...sample,...change}));
});
test('Telegram text includes every field and does not enable formatting',()=>{const text=message(validate(sample),'TEST');for(const key of ['name','phone','from','to','cargo','date','comment'])assert.ok(text.includes(sample[key]));});
test('endpoint only acknowledges a successful Telegram response',async()=>{
  const originalFetch=globalThis.fetch;
  process.env.TELEGRAM_BOT_TOKEN='test-token';process.env.TELEGRAM_CHAT_ID='test-chat';
  try{
    let payload;
    globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({ok:true})};};
    let res=response();await handler(request(sample),res);assert.equal(res.statusCode,200);assert.equal(res.body.ok,true);assert.equal(payload.chat_id,'test-chat');assert.ok(payload.text.includes('Нужна боковая погрузка'));
    globalThis.fetch=async()=>({ok:false,json:async()=>({ok:false})});
    res=response();await handler(request(sample),res);assert.equal(res.statusCode,502);assert.equal(res.body.ok,undefined);
    delete process.env.TELEGRAM_BOT_TOKEN;
    res=response();await handler(request(sample),res);assert.equal(res.statusCode,503);
    res=response();await handler(request({...sample,website:'spam'}),res);assert.equal(res.statusCode,400);
    res=response();await handler({...request(sample),headers:{...request(sample).headers,origin:'https://other.example'}},res);assert.equal(res.statusCode,403);
  }finally{globalThis.fetch=originalFetch;delete process.env.TELEGRAM_BOT_TOKEN;delete process.env.TELEGRAM_CHAT_ID;}
});

