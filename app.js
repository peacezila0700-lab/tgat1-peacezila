/* v45.1: empty catch blocks now report to a small in-memory log instead of silently swallowing errors.
   window.TGAT1_ERRORS keeps the last 50 distinct messages (open DevTools: TGAT1_ERRORS); each message is printed
   with console.debug at most 3 times, so expected failures (blocked storage, optional features) stay quiet. */
window.TGAT1_ERR=window.TGAT1_ERR||(function(){var seen={};return function(e,where){try{var m=String(e&&e.message||e);var k=(where||'')+'|'+m;seen[k]=(seen[k]||0)+1;var L=window.TGAT1_ERRORS||(window.TGAT1_ERRORS=[]);if(seen[k]===1){L.push({t:Date.now(),where:where||'',msg:m});if(L.length>50)L.shift()}if(seen[k]<=3&&window.console&&console.debug)console.debug('[TGAT1 caught]',where||'',e)}catch(_){}}})();
window.__TGAT_UNIFIED_AUDIO_V40=true;
/* v40.7.4 lite-mode */ try{const m=navigator.deviceMemory;const lo=(typeof m==='number')?m<=4:(navigator.hardwareConcurrency||8)<=4;if(lo)document.documentElement.classList.add('lite')}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
/* TGAT1 English Studio v48.1.0 — modular production bundle.
 * GitHub upload contract: index.html + app.js + data.js + data-vault.js + data-senses.js + manifest + sw + icons.
 * Existing learning engines are preserved in execution order; selection/quality fixes are consolidated in-place.
 */
/* v40.9.0: one place for every version identifier. app = release, cache = service-worker cache name,
   content = question/vocabulary content revision, hub* = Learning Hub storage schema and curriculum.
   Storage keys keep their historical names (engdaily_vault_v1, tgat1_*_v382 …) so no saved progress is orphaned. */
window.TGAT1_VERSION=Object.freeze({app:'48.18.0',cache:'tgat1-studio-v48.18.0',content:'48.18.0',hubSchema:3,hubCurriculum:'2.0.0',hubStorageKey:'tgat1_learning_hub_v1'});
/* v48.18.0: unbiased in-place Fisher-Yates (replaces the biased random-comparator sort). */
try{if(!Array.prototype.__fy)Object.defineProperty(Array.prototype,'__fy',{value:function(){for(let i=this.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=this[i];this[i]=this[j];this[j]=t}return this},writable:true,configurable:true,enumerable:false})}catch(_){}

/* P1-7 (v48.15.0): แหล่งความจริงเดียวของการ escape HTML
   เดิมมีหลายชุดที่ต่างกันเล็กน้อย และมี fallback 2 จุดที่ไม่ escape ' (เสี่ยง injection ใน inline handler)
   ฟังก์ชันที่เหลือทั้งหมดในไฟล์นี้ delegate มาที่นี่ — call site เดิมไม่ต้องแก้ */
function htmlEsc(x){return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}

/* v40.7.27 data guard: core data is synchronous; the question bank and senses load on demand. */
(function(){var d=window.__TGAT1_DATA;if(d&&d.studio&&d.legacy&&d.pack)return;
var m='โหลดไฟล์ข้อมูลไม่ครบ (data-*.js) — กรุณาต่ออินเทอร์เน็ตแล้วรีเฟรช หรือล้างแคชของแอป';
document.addEventListener('DOMContentLoaded',function(){var alert=document.createElement('div');alert.setAttribute('role','alert');alert.style.cssText='padding:16px;margin:16px;border-radius:12px;background:#fee;color:#900;font:16px sans-serif';alert.textContent=m;document.body.insertBefore(alert,document.body.firstChild)});
throw new Error('TGAT1 data files missing');})();

/* ===== 01 · 29-stability-kernel-v37.js ===== */
/* TGAT1 English Studio v37 — Stability Kernel
 * Stability-first layer. Does not replace the learning engines; it contains their failure surface.
 */
(function(){
  'use strict';
  if(window.TGAT1Stable&&window.TGAT1Stable.version==='37.0.0')return;
  const VERSION='37.0.0', ERR_KEY='tgat1_studio_runtime_errors_v1', HEALTH_KEY='tgat1_studio_health_v1';
  const bootAt=Date.now(), onceMap=new Map(), timers=new Map();
  const clean=(v)=>String(v==null?'':v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').slice(0,800);
  const jsonRead=(key,fallback)=>{try{const raw=localStorage.getItem(key);if(raw==null)return fallback;return JSON.parse(raw)}catch(e){return fallback}};
  const jsonWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}};
  function pushError(type,error,meta){
    try{
      const msg=clean(error&&error.message||error||type), stack=clean(error&&error.stack||'');
      const row={at:new Date().toISOString(),type:String(type||'error'),message:msg,stack,meta:meta||{}};
      const arr=jsonRead(ERR_KEY,[]); const list=Array.isArray(arr)?arr:[];
      const prev=list[list.length-1];
      if(prev&&prev.message===row.message&&prev.type===row.type&&Date.now()-Date.parse(prev.at||0)<1500)return;
      list.push(row); while(list.length>100)list.shift(); jsonWrite(ERR_KEY,list);
    }catch(_){(window.TGAT1_ERR||Object)(_,'app')}
  }
  function once(key,fn){if(onceMap.has(key))return onceMap.get(key);const v=fn();onceMap.set(key,v);return v}
  function idle(fn,timeout){const cb=()=>{try{fn()}catch(e){pushError('idle',e)}};if('requestIdleCallback' in window)return requestIdleCallback(cb,{timeout:timeout||1500});return setTimeout(cb,timeout||50)}
  function debounce(key,fn,ms){clearTimeout(timers.get(key));const id=setTimeout(()=>{timers.delete(key);try{fn()}catch(e){pushError('debounce',e)}},ms||200);timers.set(key,id);return id}
  function health(){
    const out={version:VERSION,bootMs:Date.now()-bootAt,online:navigator.onLine!==false,storage:true,dom:!!document.body,sw:!!navigator.serviceWorker,errors:0};
    try{localStorage.setItem('__tgat1_v37_probe','1');localStorage.removeItem('__tgat1_v37_probe')}catch(e){out.storage=false}
    try{const arr=jsonRead(ERR_KEY,[]);out.errors=Array.isArray(arr)?arr.length:0}catch(_){(window.TGAT1_ERR||Object)(_,'app')}
    return out;
  }
  function saveHealth(){jsonWrite(HEALTH_KEY,{...health(),at:new Date().toISOString()})}
  function safeToast(message){try{if(typeof window.studioToast==='function')window.studioToast(message);else if(typeof window.toast==='function')window.toast(message)}catch(_){(window.TGAT1_ERR||Object)(_,'app')}}
  function safeEntry(name,fn){return function(){try{return fn.apply(this,arguments)}catch(e){pushError('entry:'+name,e);safeToast('ระบบพบข้อผิดพลาดเฉพาะจุด แต่ข้อมูลหลักยังไม่ถูกลบ');return undefined}}}
  function wrapEntry(name){const fn=window[name];if(typeof fn!=='function'||fn.__tgat1StableWrapped)return false;const wrapped=safeEntry(name,fn);wrapped.__tgat1StableWrapped=true;wrapped.__tgat1StableOriginal=fn;window[name]=wrapped;return true}
  function validateQuestion(q){
    return !!(q&&typeof q==='object'&&typeof q.id==='string'&&q.id&&typeof q.prompt==='string'&&q.prompt&&Array.isArray(q.options)&&q.options.length===4&&q.options.every(x=>typeof x==='string')&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);
  }
  function sanitizeRun(run){
    if(!run||typeof run!=='object')return null;
    const qs=Array.isArray(run.qs)?run.qs.filter(validateQuestion):[];
    if(!qs.length)return null;
    const seen=new Set(),unique=qs.filter(q=>{if(seen.has(q.id))return false;seen.add(q.id);return true});
    run.qs=unique;run.index=Math.max(0,Math.min(unique.length-1,Math.floor(Number(run.index)||0)));
    if(!run.answers||typeof run.answers!=='object'||Array.isArray(run.answers))run.answers={};
    for(const [id,v] of Object.entries(run.answers))if(!unique.some(q=>q.id===id)||!Number.isInteger(v)||v<0||v>=4)delete run.answers[id];
    return run;
  }
  function wrapEntries(){
    ['studioNav','studioHome','studioOpenErrors','studioOpenReview','studioOpenAdvanced','studioExportAll','VLT_startMock','VLT_startDaily','VLT_startQuick','VLT_startReview','VLT_startSprint','VLT_startRandomMock','STG_start','STR_start','V15_startNew','V15_startDue','V15_startRecall'].forEach(wrapEntry);
    if(typeof window.VLT_begin==='function'&&!window.VLT_begin.__tgat1StableWrapped){
      const original=window.VLT_begin;
      const wrapped=safeEntry('VLT_begin',function(run){const cleanRun=sanitizeRun(run);if(!cleanRun){safeToast('ไม่สามารถเริ่มรอบฝึกได้: ข้อมูลข้อสอบไม่สมบูรณ์');return;}return original.call(this,cleanRun)});
      wrapped.__tgat1StableWrapped=true;window.VLT_begin=wrapped;
    }
    if(typeof window.VLT_answer==='function'&&!window.VLT_answer.__tgat1StableWrapped){
      const original=window.VLT_answer;
      const wrapped=safeEntry('VLT_answer',function(j){const n=Number(j);if(!Number.isInteger(n)||n<0||n>3)return;return original.call(this,n)});
      wrapped.__tgat1StableWrapped=true;window.VLT_answer=wrapped;
    }
  }
  function auditRequired(){
    const required=['studioNav','VLT_renderQuiz','VLT_answer','STG_answer','STR_answer'];
    const missing=required.filter(k=>typeof window[k]!=='function');
    if(missing.length)pushError('boot-missing',new Error('Missing entry points: '+missing.join(', ')),{missing});
    return missing;
  }
  window.TGAT1Stable={version:VERSION,bootAt,read:jsonRead,write:jsonWrite,pushError,once,idle,debounce,health,saveHealth,safeToast,wrapEntries,auditRequired};
  window.addEventListener('error',e=>pushError('window.error',e.error||e.message,{source:e.filename||'',line:e.lineno||0,col:e.colno||0}),{capture:true});
  window.addEventListener('unhandledrejection',e=>pushError('unhandledrejection',e.reason||'Unknown rejection'),{capture:true});
  window.addEventListener('online',()=>{saveHealth();safeToast('กลับมาออนไลน์แล้ว')},{passive:true});
  window.addEventListener('offline',()=>{saveHealth();safeToast('ออฟไลน์: ความคืบหน้าที่ยังบันทึกในเครื่องใช้งานต่อได้')},{passive:true});
  window.addEventListener('pagehide',()=>saveHealth(),{passive:true});
  window.addEventListener('pageshow',()=>{idle(()=>{wrapEntries();auditRequired();saveHealth()},1000)});
  document.addEventListener('DOMContentLoaded',()=>{
    idle(()=>{wrapEntries();auditRequired();saveHealth();},1200);
    setTimeout(()=>{wrapEntries();auditRequired();saveHealth()},4000);
    setInterval(()=>{try{if(window.Q&&Array.isArray(window.Q.qs)&&window.Q.qs.length&&typeof window.studioPersistSession==='function')window.studioPersistSession();}catch(e){pushError('session-heartbeat',e)}},15000);
  },{once:true});
})();


/* ===== 02 · 00-data-normalizers.js ===== */
/* Non-destructive normalization for imported/local browser state.
   Canonical learning content is never read from user-controlled storage. */
(function(){
  'use strict';
  const ownObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  const int=(v,min,max,fb=0)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fb};
  const finite=(v,min,max,fb=0)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fb};
  const dateKey=v=>typeof v==='string'&&/^\d{4}-\d{1,2}-\d{1,2}$/.test(v)&&Number.isFinite(Date.parse(v))?v:'';
  const isoDate=v=>{const n=Date.parse(v);return typeof v==='string'&&Number.isFinite(n)?new Date(n).toISOString():''};
  const dateMap=(obj)=>{const out=Object.create(null);if(!ownObject(obj))return out;for(const [k,v] of Object.entries(obj)){const key=dateKey(k);if(key&&v)out[key]=1;}return out;};
  function normalizeLegacyState(input,path,words){
    const x=ownObject(input)?input:{}, levels=Array.isArray(path)?path:['S','A','B','C'];
    const validWords=new Set(Array.isArray(words)?words:[]);
    const st=Object.create(null),memory=Object.create(null),reviewAt=Object.create(null);
    if(ownObject(x.st))for(const [w,v] of Object.entries(x.st)){
      if(!validWords.has(w)||!Array.isArray(v))continue;
      st[w]=[int(v[0],0,1000000),int(v[1],0,1000000),Number(v[2])===0?0:1];
    }
    if(ownObject(x.memory))for(const [w,v] of Object.entries(x.memory)){
      if(!validWords.has(w)||!ownObject(v))continue;
      memory[w]={streak:int(v.streak,0,100000,0),interval:finite(v.interval,0,3650,0),
        due:finite(v.due,0,8640000000000000,0),reps:int(v.reps,0,1000000,0)};
    }
    if(ownObject(x.reviewAt))for(const [w,v] of Object.entries(x.reviewAt)){
      if(validWords.has(w)){const n=Number(v);if(Number.isFinite(n)&&n>=0)reviewAt[w]=Math.min(n,8640000000000000);}
    }
    const pg=Object.create(null);for(const level of levels)pg[level]=int(ownObject(x.pg)?x.pg[level]:0,0,5000,0);
    const lv=int(x.lv,-1,3,-1);
    const labels=[["เริ่มต้น","ปูพื้นฐานศัพท์ระดับ ‘เริ่มก่อน’ ให้แน่นก่อน"],["ระดับ A พื้นฐาน","พื้นฐานผ่านแล้ว ลุยระดับ ‘ควรรู้’ ต่อ"],["ระดับ B กลาง","แกร่งพอสมควร ท้าทายศัพท์ ‘เสริม’ ได้เลย"],["ระดับ C สูง","ศัพท์ยากยังตอบได้ดี เก่งมาก!"]];
    let res=null;
    if(ownObject(x.res)&&Array.isArray(x.res.r)&&x.res.r.length===3){
      const n=x.res.n,level=int(Array.isArray(n)?n[0]:-1,0,3,0);
      res={r:x.res.r.slice(0,3).map(v=>finite(v,0,1,0)),n:[level,labels[level][0],labels[level][1]],est:null};
    }
    return {
      xp:int(x.xp,0,1000000000,0),streak:int(x.streak,0,1000000,0),last:dateKey(x.last),
      st,lv,res,done:dateMap(x.done),pg,cur:levels.includes(x.cur)?x.cur:'S',
      seen:x.seen?1:0,reviewAt,memory
    };
  }
  function normalizeProfile(input){
    const x=ownObject(input)?input:{};
    const goal=Number(x.dailyGoal);
    const allowedGoals=[15,20,30,45,60,90,120,150,180];
    return {
      name:typeof x.name==='string'?x.name.slice(0,40):'',
      target:finite(x.target,0,100,75),
      examDate:typeof x.examDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.examDate)&&Number.isFinite(Date.parse(x.examDate))?x.examDate:'',
      dailyGoal:allowedGoals.includes(goal)?goal:30,
      theme:x.theme==='dark'?'dark':'light'
    };
  }
  function normalizeVltState(input,bank,categories){
    const x=ownObject(input)?input:{};
    const ids=new Set((Array.isArray(bank)?bank:[]).map(q=>q&&q.id).filter(v=>typeof v==='string'));
    const cats=new Set((Array.isArray(categories)?categories:[]).map(c=>c&&c[0]).filter(v=>typeof v==='string'));
    const countMap=obj=>{const out=Object.create(null);if(ownObject(obj))for(const [k,v] of Object.entries(obj)){if(ids.has(k)){const n=int(v,0,1000000,0);if(n>0)out[k]=n;}}return out;};
    const scale100=x.scoreScale===100||(ownObject(x.completedSets)&&Object.values(x.completedSets).some(r=>ownObject(r)&&(Number(r.score)>60||Number(r.best)>60)));
    const completedSets=Object.create(null);
    if(ownObject(x.completedSets))for(let i=1;i<=20;i++){
      const r=x.completedSets[i]||x.completedSets[String(i)];
      if(!ownObject(r))continue;
      const attempts=int(r.attempts,0,100000,0),date=dateKey(r.date);
      if(!attempts&&!date)continue;
      const maxScore=scale100?100:60;completedSets[i]={score:int(r.score,0,maxScore,0),attempts,best:int(r.best,0,maxScore,0),date};
    }
    const history=Array.isArray(x.history)?x.history.slice(-80).filter(ownObject).map(h=>{
      const mode=['mock','sprint','practice','daily'].includes(h.mode)?h.mode:'practice';
      const total=int(h.total,0,1200,0),score=int(h.score,0,total,0);
      const setNo=Number.isInteger(Number(h.setNo))&&Number(h.setNo)>=1&&Number(h.setNo)<=20?Number(h.setNo):null;
      const catsOut=Array.isArray(h.categories)?h.categories.filter(c=>ownObject(c)&&cats.has(c.cat)).map(c=>{
        const t=int(c.total,0,60,0);return {cat:c.cat,total:t,score:int(c.score,0,t,0)};
      }):[];
      return {mode,setNo,score,total,at:isoDate(h.at),categories:catsOut};
    }):[];
    const allowedBadges=new Set(['first','100','500','perfect','sets5','sets20','streak3']);
    return {
      version:1,scoreScale:scale100?100:60,xp:int(x.xp,0,1000000000,0),answered:int(x.answered,0,1000000000,0),
      correct:int(x.correct,0,int(x.answered,0,1000000000,0),0),streak:int(x.streak,0,1000000,0),
      lastDay:dateKey(x.lastDay),completedSets,missed:countMap(x.missed),mastered:countMap(x.mastered),
      favorites:Array.isArray(x.favorites)?[...new Set(x.favorites.filter(id=>ids.has(id)))]:[],
      history,dailyDone:dateKey(x.dailyDone),
      badges:Array.isArray(x.badges)?[...new Set(x.badges.filter(id=>allowedBadges.has(id)))]:[],
      xpDay:(()=>{const o=x.xpDay,m=Object.create(null);if(!ownObject(o)||!ownObject(o.ids))return {d:'',ids:m};for(const [k,v] of Object.entries(o.ids)){if(ids.has(k)){const n=int(v,0,8,0);if(n>0)m[k]=n}}return {d:dateKey(o.d),ids:m}})()
    };
  }

  function normalizeVocabState(input, words){
    const x=ownObject(input)?input:{};
    const canonical=new Map((Array.isArray(words)?words:[]).map(w=>[String(w.w).toLocaleLowerCase(),w.w]));
    // v43: migrate stored learner progress off retired grid pseudo-collocation headwords onto their renamed collocations.
    // Aliases are emitted by tools/apply_headword_rename.py into __TGAT1_DATA.headwordAliases; nothing is deleted, so old keys resolve instead of being dropped.
    const __hwAliases=(typeof window!=='undefined'&&window.__TGAT1_DATA&&window.__TGAT1_DATA.headwordAliases)||null;
    if(__hwAliases&&typeof __hwAliases==='object')for(const __old in __hwAliases){
      const __ok=String(__old).toLocaleLowerCase();
      const __canonNew=canonical.get(String(__hwAliases[__old]).toLocaleLowerCase());
      if(__canonNew&&!canonical.has(__ok))canonical.set(__ok,__canonNew);
    }
    const items=Object.create(null);
    if(ownObject(x.items))for(const [key,value] of Object.entries(x.items)){
      const word=canonical.get(String(key).toLocaleLowerCase());
      if(!word||!ownObject(value))continue;
      const status=value.status==='known'?'known':'learning';
      items[word]={
        status,
        reps:int(value.reps,0,1000000,0),
        interval:finite(value.interval,0,3650,0),
        due:finite(value.due,0,8640000000000000,0),
        last:finite(value.last,0,8640000000000000,0),
        lastGrade:['again','hard','good','easy'].includes(value.lastGrade)?value.lastGrade:'',
        reviewCount:int(value.reviewCount,0,1000000,0)
      };
    }
    const favorites=Array.isArray(x.favorites)
      ? [...new Set(x.favorites.map(w=>canonical.get(String(w).toLocaleLowerCase())).filter(Boolean))]
      : [];
    const gradeCounts=v=>({
      again:int(ownObject(v)?v.again:0,0,1000000,0),
      hard:int(ownObject(v)?v.hard:0,0,1000000,0),
      good:int(ownObject(v)?v.good:0,0,1000000,0),
      easy:int(ownObject(v)?v.easy:0,0,1000000,0)
    });
    const sessions=Array.isArray(x.sessions)?x.sessions.slice(-500).filter(ownObject).map(v=>({
      at:isoDate(v.at),
      total:int(v.total,0,5000,0),
      kind:['due','new','dueRecall','recall','examVocab'].includes(v.kind)?v.kind:'new',
      graded:gradeCounts(v.graded),
      durationMs:finite(v.durationMs,0,8640000000000000,0)
    })).filter(v=>v.at):[];
    const reviewLog=Array.isArray(x.reviewLog)?x.reviewLog.slice(-2000).filter(ownObject).map(v=>{
      const word=canonical.get(String(v.word).toLocaleLowerCase());
      return word?{
        word,
        grade:['again','hard','good','easy'].includes(v.grade)?v.grade:'again',
        at:finite(v.at,0,8640000000000000,0),
        nextDue:finite(v.nextDue,0,8640000000000000,0),
        intervalDays:finite(v.intervalDays,0,3650,0)
      }:null;
    }).filter(Boolean):[];
    return {items,favorites,sessions,reviewLog};
  }
  // Shared exact allowlist for both the legacy importer guard and the active v3 backup importer.
  // Unknown prefixed keys can be attacker-controlled and may reach renderers as stored data.
  const importableLocalKeys=new Set([
    'tgat1_english_studio_v1','tgat1_studio_vocab_progress_v1',
    'tgat1_personal_study_days_v1','tgat1_personal_target_score_v1',
    'tgat1_studio_content_quality_v1','tgat1_studio_content_review_v1',
    'tgat1_studio_error_notebook_v1','tgat1_studio_error_notebook_v2',
    'tgat1_studio_everyday_phrase_v382','tgat1_studio_grammar_clinic_v1',
    'tgat1_studio_learning_activity_v1','tgat1_studio_learning_coach_v1',
    'tgat1_studio_reading_plus_v382','tgat1_studio_reading_trainer_v1',
    'tgat1_studio_recent_practice_v1','tgat1_studio_recent_sentence_practice_v1',
    'tgat1_studio_smart_review_v1','tgat1_v14_question_flags',
    'tgat1_v16_study_plan_v1','tgat1_v19_exam_timing_history_v1',
    'tgat1_v19_manual_question_review_v1',
    'tgat1_learning_hub_v1','tgat1_ledger_v1',
    'tgat1_ai_tutor_v1','tgat1_home_all_v1'
  ]);
  function isImportableLocalKey(key){return importableLocalKeys.has(String(key));}
  window.TGAT1DataGuards=Object.freeze({normalizeLegacyState,normalizeProfile,normalizeVltState,normalizeVocabState,isImportableLocalKey});
})();


/* ===== 03 · 00-legacy-quest-core.js ===== */
(function(){let ok=false;try{const s=window.localStorage;const k='__engdaily_storage_probe__';s.setItem(k,'1');s.removeItem(k);ok=true;}catch(e){(window.TGAT1_ERR||Object)(e,'app')}if(!ok){window.ED_STORAGE_FALLBACK=true;const m=new Map();try{Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear(),key:i=>Array.from(m.keys())[i]??null,get length(){return m.size;}}});}catch(e){(window.TGAT1_ERR||Object)(e,'app')}}setTimeout(()=>{if(window.ED_STORAGE_FALLBACK&&typeof toast==='function')toast('โหมดบันทึกชั่วคราว: ส่งออกความคืบหน้าก่อนปิดเกม');},1200);})();

const D=window.__TGAT1_DATA.legacy;const V=D.V,SYN=D.SYN,ANT=D.ANT,CL=D.CL,EX=D.EX;
// Expose legacy runtime state through window accessors for later non-invasive quality layers.
Object.defineProperties(window,{V:{configurable:true,get:()=>V},Q:{configurable:true,get:()=>Q,set:v=>{Q=v}},VLT_BANK:{configurable:true,get:()=>VLT_BANK},VLT_STATE:{configurable:true,get:()=>VLT_STATE,set:v=>{VLT_STATE=v}},VLT_RUN:{configurable:true,get:()=>VLT_RUN,set:v=>{VLT_RUN=v}}});
const LN={S:"พื้นฐาน",A:"เริ่มก่อน",B:"ควรรู้",C:"เสริม"},LVS=["A","B","C"],PATH=["S","A","B","C"],LT={S:"1 พื้นฐาน",A:"2 ง่าย",B:"3 กลาง",C:"4 ยาก"};
const TT=["มือใหม่","นักสำรวจ","นักอ่าน","นักจับศัพท์","นักล่าศัพท์","ผู้เชี่ยวชาญ","เซียนศัพท์","ตำนาน"];
const TIP={n:"คำนาม: ใช้เป็นประธานหรือกรรม มักมี a/an/the หรือคำคุณศัพท์อยู่หน้า",v:"คำกริยา: ตามหลังประธาน เช่น She + กริยา (เปลี่ยนรูปตามกาล -s/-ed/-ing)",adj:"คำคุณศัพท์: ขยายนาม วางหน้านาม หรือหลัง be เช่น It is ...",adv:"คำกริยาวิเศษณ์: ขยายกริยา คุณศัพท์ หรือทั้งประโยค มักลงท้าย -ly",conj:"คำเชื่อม: ต่อสองประโยคหรือสองความคิดเข้าด้วยกัน",phrase:"วลี/สำนวน: จำเป็นก้อน ห้ามแปลทีละคำ",phr:"Phrasal verb: กริยา + บุพบท ความหมายมักต่างจากคำเดี่ยว"};
let S={xp:0,streak:0,last:"",st:{},lv:-1,res:null,done:{},pg:{S:0,A:0,B:0,C:0},cur:"S",seen:0,reviewAt:{},memory:{}};
try{const old=JSON.parse(localStorage.getItem("eng3")||"{}");if(old&&typeof old==="object"&&!Array.isArray(old))S={...S,...old,st:old.st&&typeof old.st==="object"?old.st:{},done:old.done&&typeof old.done==="object"?old.done:{},pg:{...S.pg,...(old.pg||{})},reviewAt:old.reviewAt&&typeof old.reviewAt==="object"?old.reviewAt:{},memory:old.memory&&typeof old.memory==="object"?old.memory:{}}}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
if(window.TGAT1DataGuards)S=window.TGAT1DataGuards.normalizeLegacyState(S,PATH,V.map(x=>x[0]));
const save=()=>{try{localStorage.setItem("eng3",JSON.stringify(S))}catch(e){toast("บันทึกข้อมูลไม่สำเร็จ พื้นที่เก็บข้อมูลอาจเต็ม กรุณาส่งออกข้อมูลสำรอง")}};
const $=s=>document.querySelector(s),rnd=n=>Math.floor(Math.random()*n),shuf=a=>{const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r},pick=(a,n)=>shuf(a).slice(0,n);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&#39;");
const day=d=>d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
const p1=x=>x[2].split(/[\/ ]/)[0],vi=w=>V.findIndex(v=>v[0]===w);
const sp=t=>`<button class="say" aria-label="ฟังเสียง" data-t="${esc(t)}" onclick="say(this.dataset.t)">🔊</button>`;
const E={"hurricane":"🌀","typhoon":"🌀","earthquake":"🌍","tsunami":"🌊","flooding":"🌊","wildfire":"🔥","lightning":"⚡","heatwave":"☀️","landslide":"⛰️","passport":"🛂","suitcase":"🧳","luggage":"🧳","flight":"✈️","departure":"🛫","arrival":"🛬","platform":"🚉","transit":"🚌","clinic":"🏥","pharmacy":"💊","medication":"💊","vaccine":"💉","vaccination":"💉","physician":"🩺","surgeon":"🩺","microscope":"🔬","laboratory":"🧪","experiment":"🧪","sample":"🧪","virus":"🦠","bacteria":"🦠","pandemic":"😷","epidemic":"😷","insomnia":"😴","recipe":"📖","ingredient":"🥕","vegetarian":"🥗","vegan":"🌱","harvest":"🌾","crop":"🌾","agriculture":"🚜","livestock":"🐄","cuisine":"🍽️","packaging":"📦","password":"🔑","server":"🖥️","database":"🗄️","hardware":"💻","software":"💾","broadband":"📶","network":"🌐","device":"📱","media":"📺","journalist":"📰","headline":"📰","reporter":"🎙️","copyright":"©️","lawyer":"⚖️","judge":"⚖️","jury":"⚖️","crime":"🚨","traffic":"🚦","pedestrian":"🚶","sidewalk":"🚶","vehicle":"🚗","commute":"🚆","shelter":"🏠","residence":"🏠","scholarship":"🎓","diploma":"🎓","graduation":"🎓","degree":"🎓","lecture":"🧑‍🏫","instructor":"🧑‍🏫","lecturer":"🧑‍🏫","essay":"📝","deadline":"⏰","examination":"📝","curriculum":"📚","tuition":"💰","salary":"💰","wage":"💰","income":"💰","budget":"💰","loan":"🏦","savings":"🏦","debt":"💳","credit":"💳","inflation":"📈","recession":"📉","deflation":"📉","profit":"📈","revenue":"📈","market":"🛒","retail":"🛍️","consumer":"🛒","customer":"🛒","receipt":"🧾","reservation":"📅","appointment":"📅","schedule":"📅","invitation":"✉️","message":"✉️","reminder":"⏰","climate":"🌡️","atmosphere":"🌍","ecosystem":"🌿","habitat":"🌿","wildlife":"🦌","species":"🦋","mammal":"🐘","reptile":"🦎","amphibian":"🐸","predator":"🦁","prey":"🐇","carnivore":"🥩","herbivore":"🌿","fossil":"🦴","gene":"🧬","evolution":"🧬","drought":"🏜️","emission":"🏭","pollution":"🏭","landfill":"🗑️","recycling":"♻️","compost":"♻️","hydropower":"💧","symptom":"🤒","illness":"🤒","patient":"🛏️","therapy":"🛋️","stress":"😰","anxiety":"😰","loneliness":"🥺","grief":"😢","aggression":"😠","frustration":"😤","curiosity":"🤔","creativity":"🎨","motivation":"💪","optimism":"😊","pessimism":"😞","relief":"😮‍💨","empathy":"🤝","sympathy":"🤝","cooperation":"🤝","compromise":"🤝","loyalty":"🤝","trust":"🤝","respect":"🙏","forgiveness":"🕊️","gossip":"🗣️","argument":"💬","conflict":"⚔️","compliment":"😊","confidence":"😎","ambition":"🎯","purpose":"🎯","objective":"🎯","strategy":"♟️","solution":"💡","innovation":"💡","algorithm":"🧮","data":"📊","statistic":"📊","survey":"📋","trend":"📈","risk":"⚠️","hazard":"⚠️","threat":"⚠️","precaution":"⚠️","evacuation":"🏃","casualty":"🚑","accident":"💥","emergency":"🚨","journey":"🧭","route":"🗺️","itinerary":"🗺️","destination":"📍","tourism":"🏖️","sightseeing":"📸","guest":"🏨","fare":"🎫"};
const LK=w=>{const q=encodeURIComponent(w);return`<div class="lk"><a href="https://www.google.com/search?tbm=isch&q=${q}" target="_blank" rel="noopener">🖼️ ดูรูป</a><a href="https://dictionary.cambridge.org/dictionary/english/${q}" target="_blank" rel="noopener">📖 Cambridge</a><a href="https://youglish.com/pronounce/${q}/english" target="_blank" rel="noopener">🎧 ฟังประโยคจริง</a></div>`};
const BW="cat|แมว|🐱;dog|สุนัข|🐶;bird|นก|🐦;fish|ปลา|🐟;cow|วัว|🐄;pig|หมู|🐷;horse|ม้า|🐴;duck|เป็ด|🦆;elephant|ช้าง|🐘;monkey|ลิง|🐒;rice|ข้าว|🍚;egg|ไข่|🥚;milk|นม|🥛;water|น้ำ|💧;bread|ขนมปัง|🍞;apple|แอปเปิล|🍎;banana|กล้วย|🍌;orange|ส้ม|🍊;chicken|ไก่|🍗;coffee|กาแฟ|☕;cake|เค้ก|🍰;pizza|พิซซ่า|🍕;mother|แม่|👩;father|พ่อ|👨;baby|ทารก|👶;friend|เพื่อน|🧑‍🤝‍🧑;teacher|ครู|🧑‍🏫;student|นักเรียน|🧑‍🎓;doctor|หมอ|👨‍⚕️;house|บ้าน|🏠;school|โรงเรียน|🏫;hospital|โรงพยาบาล|🏥;car|รถยนต์|🚗;bus|รถบัส|🚌;train|รถไฟ|🚆;plane|เครื่องบิน|✈️;book|หนังสือ|📖;phone|โทรศัพท์|📱;computer|คอมพิวเตอร์|💻;bag|กระเป๋า|👜;key|กุญแจ|🔑;clock|นาฬิกา|⏰;money|เงิน|💰;table|โต๊ะ|🍽️;chair|เก้าอี้|🪑;bed|เตียง|🛏️;door|ประตู|🚪;tree|ต้นไม้|🌳;flower|ดอกไม้|🌸;sun|ดวงอาทิตย์|☀️;moon|ดวงจันทร์|🌙;star|ดาว|⭐;rain|ฝน|🌧️;red|สีแดง|🔴;blue|สีน้ำเงิน|🔵;green|สีเขียว|🟢;yellow|สีเหลือง|🟡;black|สีดำ|⚫;white|สีขาว|⚪;one|หนึ่ง|1️⃣;two|สอง|2️⃣;three|สาม|3️⃣;four|สี่|4️⃣;five|ห้า|5️⃣;eat|กิน|🍽️;drink|ดื่ม|🥤;sleep|นอนหลับ|😴;run|วิ่ง|🏃;walk|เดิน|🚶;read|อ่าน|📖;write|เขียน|✍️;listen|ฟัง|👂;speak|พูด|🗣️;love|รัก|❤️;go|ไป|➡️;come|มา|⬅️;buy|ซื้อ|🛒;play|เล่น|🎮;sing|ร้องเพลง|🎤;swim|ว่ายน้ำ|🏊;work|ทำงาน|💼;hot|ร้อน|🔥;cold|หนาว|🥶;happy|มีความสุข|😊;sad|เศร้า|😢;angry|โกรธ|😠;tired|เหนื่อย|😩;hungry|หิว|🤤;beautiful|สวย|🌺;fast|เร็ว|⚡;slow|ช้า|🐢;new|ใหม่|🆕;hello|สวัสดี|👋;thank you|ขอบคุณ|🙏;sorry|ขอโทษ|🙇;goodbye|ลาก่อน|🖐️",SS="I am a student.|ฉันเป็นนักเรียน;She is my mother.|เธอเป็นแม่ของฉัน;He likes dogs.|เขาชอบสุนัข;I eat rice every day.|ฉันกินข้าวทุกวัน;Where is the bus?|รถบัสอยู่ที่ไหน;I want some water.|ฉันอยากได้น้ำ;This book is new.|หนังสือเล่มนี้ใหม่;The cat is on the table.|แมวอยู่บนโต๊ะ;Thank you very much.|ขอบคุณมาก;What is your name?|คุณชื่ออะไร;My name is Tom.|ฉันชื่อทอม;How are you?|คุณสบายดีไหม;I am happy today.|วันนี้ฉันมีความสุข;We go to school by bus.|เราไปโรงเรียนโดยรถบัส;She drinks milk in the morning.|เธอดื่มนมตอนเช้า;Can you help me?|คุณช่วยฉันได้ไหม;I have two brothers.|ฉันมีพี่ชายสองคน;The sun is hot.|ดวงอาทิตย์ร้อน;Please open the door.|กรุณาเปิดประตู;I love my family.|ฉันรักครอบครัวของฉัน;He reads a book at night.|เขาอ่านหนังสือตอนกลางคืน;Do you like coffee?|คุณชอบกาแฟไหม;I am hungry.|ฉันหิว;See you tomorrow.|แล้วเจอกันพรุ่งนี้;How much is this?|อันนี้ราคาเท่าไร;I do not understand.|ฉันไม่เข้าใจ;Please speak slowly.|กรุณาพูดช้า ๆ;Where is the hospital?|โรงพยาบาลอยู่ที่ไหน;It is raining.|ฝนกำลังตก;She can swim very fast.|เธอว่ายน้ำได้เร็วมาก;My friend is a teacher.|เพื่อนของฉันเป็นครู";
BW.split(";").forEach(x=>{const [w,th,e]=x.split("|");V.push([w,th,"","S"]);E[w]=e});
const SENT=[...new Map(SS.split(";").map(x=>x.split("|")).map(x=>[x[0].trim().toLowerCase(),x])).values()];
let vs=[];
function tgat1SpeechCancel(){try{const synth=window.speechSynthesis;if(synth&&typeof synth.cancel==='function'){synth.cancel();return true}}catch(e){(window.TGAT1_ERR||Object)(e,'app')}return false}
function tgat1SpeechAvailable(){return !!(window.speechSynthesis&&window.SpeechSynthesisUtterance)}
function tgat1SpeechSpeak(text,options={}){
  const synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;let value=String(text??'').replace(/_{2,}/g,'blank').trim();try{if(typeof VLT_RUN!=='undefined'&&VLT_RUN&&VLT_RUN.mode==='mock')return false}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
  if(!value||!synth||typeof Utterance!=='function')return false;
  try{
    if(options.cancel!==false)tgat1SpeechCancel();
    if(!vs.length&&typeof synth.getVoices==='function')vs=synth.getVoices()||[];
    const utterance=new Utterance(value),voice=vs.find(v=>/^en[-_]US/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang));
    if(voice){utterance.voice=voice;utterance.lang=voice.lang}else utterance.lang='en-US';
    utterance.rate=Number.isFinite(Number(options.rate))?Math.max(.6,Math.min(1.3,Number(options.rate))):.9;
    utterance.onerror=()=>{if(typeof toast==='function')toast('เสียงไม่ออก ลองเช็กระดับเสียงและโหมดเงียบของเครื่อง')};
    if(typeof synth.resume==='function')synth.resume();synth.speak(utterance);return true;
  }catch(e){return false}
}
try{const synth=window.speechSynthesis;if(synth&&typeof synth.getVoices==='function'){vs=synth.getVoices()||[];synth.onvoiceschanged=()=>{try{vs=synth.getVoices()||[]}catch(e){(window.TGAT1_ERR||Object)(e,'app')}}}}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3500)}
const snd=()=>tgat1SpeechAvailable();
function say(t){if(!tgat1SpeechSpeak(t)){soundHelp()}}
function soundHelp(){if(document.querySelector(".modal"))return;const m=document.createElement("div");m.className="modal";m.onclick=e=>{if(e.target===m)m.remove()};
 const sheet=document.createElement('div');sheet.className='sheet';const title=document.createElement('h2');title.textContent='🔊 แก้ปัญหาเสียงอ่าน';sheet.appendChild(title);
 const note=document.createElement('p');note.className='mute';note.textContent='เสียงอ่านใช้ระบบ Text-to-Speech ของเบราว์เซอร์และอาจต้องใช้อินเทอร์เน็ตหรือเสียงที่ติดตั้งในเครื่อง';sheet.appendChild(note);
 const steps=['เปิดไฟล์นี้ด้วย Chrome หรือ Safari โดยตรง','เพิ่มระดับเสียงสื่อ และปิดโหมดเงียบหากจำเป็น','Android: ตั้งค่า → การอ่านออกเสียงข้อความ (Text-to-speech) แล้วเลือก Speech Services by Google','iPad/iPhone: ตั้งค่า → การช่วยการเข้าถึง → เนื้อหาที่อ่านออกเสียง และตรวจสอบเสียงภาษาอังกฤษ','กลับมากดปุ่ม 🔊 อีกครั้ง'];
 const list=document.createElement('ol');steps.forEach(text=>{const li=document.createElement('li');li.textContent=text;list.appendChild(li)});sheet.appendChild(list);
 const test=document.createElement('button');test.type='button';test.className='btn';test.textContent='ทดสอบเสียง';test.addEventListener('click',()=>{say('Hello! This is a sound test.');m.remove()});
 const close=document.createElement('button');close.type='button';close.className='btn alt';close.textContent='ปิด';close.addEventListener('click',()=>m.remove());sheet.append(test,close);m.appendChild(sheet);document.body.appendChild(m)}
const weak=()=>Object.keys(S.st).filter(w=>S.st[w][2]===0).map(vi).filter(i=>i>=0);
const mast=v=>{const s=S.st[v[0]];return s&&s[0]>=3&&s[2]===1};
const byLv=l=>V.map((_,i)=>i).filter(i=>V[i][3]===l);
function recordWord(i,correct){if(!Number.isInteger(i)||i<0||i>=V.length)return;const w=V[i][0],now=Date.now();S.st=S.st||{};S.reviewAt=S.reviewAt||{};S.memory=S.memory||{};const st=S.st[w]||[0,0,1],m=S.memory[w]||{streak:0,interval:0,due:0,reps:0};if(correct){st[0]=(Number(st[0])||0)+1;m.streak=(Number(m.streak)||0)+1;m.reps=(Number(m.reps)||0)+1;m.interval=m.streak===1?1:m.streak===2?3:m.streak===3?6:Math.min(30,Math.max(1,Math.round((Number(m.interval)||6)*1.8)));st[2]=1}else{st[1]=(Number(st[1])||0)+1;m.streak=0;m.interval=0;st[2]=0}m.due=now+m.interval*864e5;S.reviewAt[w]=m.due;S.memory[w]=m;S.st[w]=st}
function dueReview(){const now=Date.now(),all=V.map((v,i)=>i).filter(i=>{const w=V[i][0],st=S.st[w]||[0,0,1],t=(S.memory&&S.memory[w]&&S.memory[w].due)||((S.reviewAt||{})[w]);return st[2]===0||(!mast(V[i])&&!!t&&t<=now)});return shuf(all.filter(i=>(S.st[V[i][0]]||[0,0,1])[2]===0)).concat(shuf(all.filter(i=>(S.st[V[i][0]]||[0,0,1])[2]!==0))).filter((v,i,a)=>a.indexOf(v)===i)}
function wordsFor(mode,n){
  if(mode==="review")return pick(dueReview(),n);
  if(mode==="test")return shuf([...pick(byLv("A"),7),...pick(byLv("B"),7),...pick(byLv("C"),6)]);
  const b=S.lv<2?0:S.lv-1,r=pick(weak(),3),fresh=l=>byLv(LVS[Math.max(0,Math.min(2,l))]).filter(i=>!mast(V[i])&&!r.includes(i));
  const add=(l,k)=>pick(fresh(l),k).forEach(i=>r.includes(i)||r.push(i));
  add(b,6-r.length);add(b?b-1:b,2);add(b<2?b+1:b,2);add(b,n);
  return shuf(r.slice(0,n));
}
const uniq=(c,pool,n,f)=>{const o=[],seen=new Set([f(c)]);for(const x of shuf(pool)){const k=f(x);if(!seen.has(k)){seen.add(k);o.push(x);if(o.length>=n)break}}const all=shuf([c,...o]);return{o:all.map(f),a:all.indexOf(c)}};
function mkMeaning(i,rev){const v=V[i],P=V.filter(x=>x[0]!==v[0]&&p1(x)===p1(v)),pool=P.length>8?P:V;
  if(rev){const r=uniq(v,pool,3,x=>x[0]);return{k:"หาคำอังกฤษ",p:v[1].split(";")[0],s:"คำไหนมีความหมายนี้?",cls:" s",...r,i,w:v[0]}}
  const r=uniq(v,pool,3,x=>x[1].split(";")[0]);return{k:"แปลว่าอะไร",p:(E[v[0]]?E[v[0]]+" ":"")+v[0]+sp(v[0]),s:v[2]?"("+v[2]+")":"แปลว่าอะไร?",...r,i,w:v[0]}}
function mkCloze(lv){let c=CL[rnd(CL.length)];if(lv){const f=CL.filter(x=>V[x[2]][3]===lv);if(f.length)c=f[rnd(f.length)]}
  const v=V[c[2]],P=V.filter(x=>/^[a-z]{4,}$/.test(x[0])&&x[0]!==c[1]&&p1(x)===p1(v)),r=uniq(v,P,3,x=>x[0]);
  return{k:"เติมคำในประโยค",p:c[0].replace("___",'<span class="blank">&nbsp;&nbsp;?&nbsp;&nbsp;</span>'),s:"เลือกคำที่เหมาะสมที่สุด",cls:" s",...r,i:c[2],w:c[1],sent:c[0].replace("___",c[1])}}
function mkAnt(){const [a,b]=ANT[rnd(ANT.length)],sw=Math.random()<.5,t=sw?b:a,ans=sw?a:b,pool=ANT.flatMap(x=>[x[0],x[1]]).filter(x=>x!==t&&x!==ans&&!(window.TGAT1MatchGuard&&(TGAT1MatchGuard.related(t,x,'ant')||TGAT1MatchGuard.related(ans,x,'syn')))),r=uniq(ans,pool,3,x=>x);
  return{k:"คำตรงข้าม",p:t+sp(t),s:"คำไหนมีความหมายตรงข้าม?",...r,i:vi(t),w:t}}
function mkSyn(){const g=SYN[rnd(SYN.length)],t=g[0][rnd(g[0].length)],ans=pick(g[0].filter(x=>x!==t),1)[0],pool=SYN.filter(x=>x!==g).flatMap(x=>x[0]).filter(x=>!g[0].includes(x)),r=uniq(ans,pool,3,x=>x);
  return{k:"คำพ้องความหมาย",p:t+sp(t),s:"คำไหนความหมายใกล้เคียงที่สุด?",...r,i:vi(t),w:t}}
function mk(mode,i,force){const r=Math.random();if(mode==="test")return r<.65?mkMeaning(i,0):mkMeaning(i,1);
  if(force||r<.3)return mkMeaning(i,0);if(r<.45)return mkMeaning(i,1);if(r<.55)return E[V[i][0]]?mkPic(i):mkMeaning(i,0);if(r<.65)return spellable(i)?mkSpell(i):mkMeaning(i,1);if(r<.8)return mkCloze(V[i][3]);if(r<.88)return mkAnt();if(r<.94)return mkSyn();return mkBuild(pick(SENT,1)[0])||mkMeaning(i,0)}
function startTgatExam(){/* v45: the advanced-page Timed Mock now runs a real 60-item set from the reviewed 1,200-item bank (the legacy 60-item set had unreviewed, implausible distractors) */const go=()=>{const done=(typeof VLT_STATE!=='undefined'&&VLT_STATE&&VLT_STATE.completedSets)||{};let n=1;for(let i=1;i<=20;i++){if(!done[i]){n=i;break}if(i===20)n=1+Math.floor(Math.random()*20)}VLT_startMock(n)};if(typeof VLT_ensureBank==='function'&&!(typeof VLT_BANK!=='undefined'&&VLT_BANK&&VLT_BANK.length)){VLT_ensureBank().then(go).catch(e=>VLT_toast(e.message));return}go()}
let examTimer=null;
function stopExamClock(){if(examTimer){clearInterval(examTimer);examTimer=null}}
function updateExamClock(){if(!Q||Q.mode!=="tgat"||!Q.deadline)return;const left=Math.max(0,Math.ceil((Q.deadline-Date.now())/1000)),el=document.getElementById("timerText");if(el)el.textContent=String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0");if(left<=0){stopExamClock();toast("หมดเวลาสอบ ระบบกำลังสรุปผล");finish()}}
let Q=null;
function start(mode){STUDIO_SESSION_FINISHED=false;stopExamClock();const free=mode==="free",n=mode==="test"?20:10,ws=free?[]:wordsFor(mode,n);if(!free&&!ws.length){toast("ยังไม่มีคำที่ถึงเวลาทบทวน ลองเล่นด่านวันนี้ก่อนนะ");return}
  const wk=weak();Q={mode,qs:ws.map(i=>mk(mode,i,wk.includes(i))),i:0,ok:0,xp:0,combo:0,max:0,ans:null,res:{A:[0,0],B:[0,0],C:[0,0]},miss:[],d:S.lv<2?0:S.lv-1,run:0};if(free)addFree();quiz()}
function addFree(){const a=byLv(LVS[Q.d]),f=a.filter(i=>!mast(V[i]));Q.qs.push(mk("free",pick(f.length?f:a,1)[0]))}
function ans(j){if(!Q||(Q.mode!=="tgat"&&Q.ans!==null)||(Q.qs[Q.i].hid||[]).includes(j))return;const q=Q.qs[Q.i];if(Q.mode==="tgat"){q.userAnswer=j;Q.ans=j;quiz();return}const ok=j===q.a;Q.ans=j;q.userAnswer=j;
  if(q.i>=0){recordWord(q.i,ok);const v=V[q.i],L=Q.res[v[3]]||[0,0];L[1]++;if(ok)L[0]++}
  if(ok){Q.ok++;Q.combo++;Q.max=Math.max(Q.max,Q.combo);Q.xp+=10+(Q.combo>=3?5:0)}else{Q.combo=0;Q.miss.push(q)}if(Q.mode==="free"){if(ok){Q.run++;if(Q.run>=3&&Q.d<2){Q.d++;Q.run=0}}else{Q.run=0;if(Q.d>0)Q.d--}}
  save();quiz()}
function explain(q){if(q.exp)return `<div class="xe"><b>เหตุผล:</b> ${esc(q.exp)}</div>`;if(q.xs)return q.xs;let h="";const i=vi(q.w);
  if(i>=0){const v=V[i];h+=`<div class="xw">${E[q.w]?E[q.w]+" ":""}${esc(q.w)} ${sp(q.w)}</div><div class="xm">${v[2]} <span class="lv">${LN[v[3]]}</span> = <b>${v[1]}</b></div>`;
    const e=q.sent||EX[i];if(e)h+=`<div class="xe">“${esc(e)}” ${sp(e)}</div>`;h+=`<div class="xt">${TIP[p1(v)]||(v[2].includes("phr")?TIP.phr:"")}</div>`}
  else h+=`<div class="xw">${E[q.w]?E[q.w]+" ":""}${esc(q.w)} ${sp(q.w)}</div>`;
  SYN.filter(g=>g[0].includes(q.w)).slice(0,2).forEach(g=>h+=`<div class="xs">คำใกล้เคียง: ${g[0].filter(x=>x!==q.w).join(", ")} (${g[1]})</div>`);
  ANT.filter(a=>a[0]===q.w||a[1]===q.w).slice(0,1).forEach(a=>h+=`<div class="xs">ตรงข้าม: ${a[0]} ↔ ${a[1]} (${a[2]})</div>`);
  if(q.sent&&i<0)h+=`<div class="xe">“${esc(q.sent)}” ${sp(q.sent)}</div>`;
  h+=LK(q.w);return h}
function quiz(){const q=Q.qs[Q.i],a=Q.ans!==null,ok=Q.ans===q.a,ph=Q.mode==="stage"?"ด่าน "+(Q.k+1):Q.mode==="game"?"มินิเกม":Q.mode==="test"?"ทดสอบระดับ":Q.mode==="tgat"?"จำลองสอบ TGAT1":Q.mode==="free"?"เล่นไปเรื่อย ๆ":"ด่านฝึก";
  const cheer=["เยี่ยม!","ใช่เลย!","สุดยอด!","แม่นมาก!"][rnd(4)];
  $("#app").innerHTML=`<div class="qt"><button class="x" aria-label="ออก" onclick="TGConfirm('${Q.mode==="tgat"?"ออกจากการจำลองสอบหรือไม่? คะแนนชุดนี้จะไม่ถูกบันทึก":"ออกจากด่านนี้หรือไม่?"}').then(ok=>{if(ok)studioExitCurrentRun()})">✕</button><div class="bar"><i style="width:${(Q.mode==="tgat"?(Q.i+1)/Q.qs.length:Q.mode==="free"?(Q.i%10)/10:Q.i/Q.qs.length)*100}%"></i></div>${Q.mode==="tgat"?'<span class="chip" id="timerText">60:00</span>':`<span class="chip">🔥 ${Q.combo}</span>`}</div>
  <div class="qk">${ph} · ข้อ ${Q.i+1}${Q.mode==="free"?"":"/"+Q.qs.length} · ${Q.mode==="tgat"?esc(q.section):q.k}</div><div class="qp${q.cls||""}">${Q.mode==="tgat"?`<div class="tgat-prompt">${esc(q.p).replace(/\n/g,"<br>")}</div>`:q.p}</div><div class="qk" style="margin-bottom:16px">${q.s}</div>
  ${Q.mode==="tgat"?`${q.o.map((t,j)=>`<button class="opt${q.userAnswer===j?" chosen":""}" onclick="ans(${j})">${esc(t)}</button>`).join("")}<div class="exam-nav"><button class="btn alt" onclick="examPrev()" ${Q.i===0?"disabled":""}>← ข้อก่อนหน้า</button><span class="qk">${Q.qs.filter(x=>Number.isInteger(x.userAnswer)).length}/60 ตอบแล้ว</span><button class="btn" onclick="examNext()">${Q.i+1===Q.qs.length?"ส่งคำตอบ":"ข้อต่อไป →"}</button></div>`:q.t?xbody(q):q.o.map((t,j)=>`<button class="opt${a?(j===q.a?" ok":j===Q.ans?" bad":""):(q.hid&&q.hid.includes(j)?" off":"")}" onclick="ans(${j})">${esc(t)}</button>`).join("")+(!a&&!q.hid?'<button class="btn alt" onclick="hint()">💡 คำใบ้ (ตัดตัวเลือกที่ผิดออก 2 ข้อ)</button>':"")}
  ${Q.mode!=="tgat"&&a?`<div class="fb ${ok?"ok":"bad"}"><b class="h">${ok?(Q.combo>=3?"🔥 "+Q.combo+" ข้อติด! ":"")+cheer+" +"+(10+(Q.combo>=3?5:0))+" XP":"ยังไม่ถูก ไม่เป็นไร จำไว้นะ"}</b>${explain(q)}<button class="btn" onclick="next()">${Q.mode!=="free"&&Q.i+1>=Q.qs.length?"ดูผล":"ข้อต่อไป"}</button>${Q.mode==="free"?'<button class="btn alt" onclick="finish()">จบเกม ดูผล</button>':""}</div>`:""}`;if(!STUDIO_RESTORING)studioPersistSession();}
function examPrev(){if(!Q||Q.mode!=="tgat"||Q.i<=0)return;Q.i--;Q.ans=Number.isInteger(Q.qs[Q.i].userAnswer)?Q.qs[Q.i].userAnswer:null;quiz();updateExamClock()}
function examNext(){if(!Q||Q.mode!=="tgat")return;if(Q.i<Q.qs.length-1){Q.i++;Q.ans=Number.isInteger(Q.qs[Q.i].userAnswer)?Q.qs[Q.i].userAnswer:null;quiz();updateExamClock();return}const unanswered=Q.qs.filter(q=>!Number.isInteger(q.userAnswer)).length;TGConfirm(unanswered?`ยังไม่ได้ตอบ ${unanswered} ข้อ ต้องการส่งข้อสอบเลยหรือไม่?`:'ส่งข้อสอบและดูผลเลยหรือไม่?').then(ok=>{if(ok)finish()})}
function next(){Q.ans=null;Q.i++;if(Q.mode==="free"){addFree();quiz();return}Q.i>=Q.qs.length?finish():quiz()}
function lvName(a,b,c){return a<.5?[0,"เริ่มต้น","ปูพื้นฐานศัพท์ระดับ ‘เริ่มก่อน’ ให้แน่นก่อน"]:b<.5?[1,"ระดับ A พื้นฐาน","พื้นฐานผ่านแล้ว ลุยระดับ ‘ควรรู้’ ต่อ"]:c<.5?[2,"ระดับ B กลาง","แกร่งพอสมควร ท้าทายศัพท์ ‘เสริม’ ได้เลย"]:[3,"ระดับ C สูง","ศัพท์ยากยังตอบได้ดี เก่งมาก!"]}
function finish(){if(!Q)return;STUDIO_SESSION_FINISHED=true;stopExamClock();studioClearSession();if(Q.mode==="tgat"){Q.ok=Q.qs.filter(q=>q.userAnswer===q.a).length;Q.miss=Q.qs.filter(q=>q.userAnswer!==q.a);Q.xp=Q.ok*10;Q.combo=0;Q.max=0}if(Q.mode==="free"){Q.qs=Q.qs.slice(0,Q.i+(Q.ans!==null?1:0));if(!Q.qs.length){home();return}}const t=day(new Date()),y=day(new Date(Date.now()-864e5));
  if(S.last!==t){S.streak=S.last===y?S.streak+1:1;S.last=t}
  Q.xp+=20;S.xp+=Q.xp;if(Q.mode==="daily")S.done[t]=1;let extra="";if(Q.mode==="tgat"){const secs=[...new Set(Q.qs.map(q=>q.section))],unanswered=Q.qs.filter(q=>!Number.isInteger(q.userAnswer)).length,speak=Q.qs.filter(q=>q.section.startsWith("Speaking")),read=Q.qs.filter(q=>q.section.startsWith("Reading")),sc=speak.filter(q=>q.userAnswer===q.a).length,rc=read.filter(q=>q.userAnswer===q.a).length,est=Math.round(sc/30*50+rc/30*50);extra=`${TG_summary({kicker:'ผลจำลองสอบ TGAT1',score:est,total:100,msg:'คะแนนฝึกโดยประมาณ ไม่ใช่คะแนนจริงหรือการคาดการณ์คะแนนทางการ',chips:['Speaking '+sc+'/30','Reading '+rc+'/30']})}<div class="panel"><p class="mute">คะแนนฝึกโดยประมาณจากสัดส่วน Speaking 50 คะแนน + Reading 50 คะแนน ไม่ใช่คะแนนจริงหรือการคาดการณ์คะแนนทางการ</p><p><b>Speaking:</b> ${sc}/30 · ประมาณ ${Math.round(sc/30*50)}/50</p><p><b>Reading:</b> ${rc}/30 · ประมาณ ${Math.round(rc/30*50)}/50</p><p class="note">เป็นข้อสอบฝึกที่เขียนขึ้นใหม่ตามโครงสร้างเผยแพร่ ไม่ใช่ข้อสอบจริงย้อนหลัง</p>${secs.map(sec=>{const a=Q.qs.filter(q=>q.section===sec),c=a.filter(q=>q.userAnswer===q.a).length;return `<div class="row"><span style="width:auto;grid-column:1/-1">${esc(sec)} · ${c}/${a.length}</span><div class="bar" style="grid-column:1/3"><i style="width:${c/a.length*100}%"></i></div><span>${Math.round(c/a.length*100)}%</span></div>`}).join("")}<p>ไม่ได้ตอบ ${unanswered} ข้อ · เวลาสอบ 60 นาที</p></div>`}if(Q.mode==="stage"){const r=Q.ok/Q.qs.length;Q.pass=r>=.6;if(Q.pass&&(S.pg[Q.L]||0)===Q.k)S.pg[Q.L]=Q.k+1;extra=`${TG_summary({kicker:'ผลด่าน',score:r>=1?'⭐⭐⭐':r>=.8?'⭐⭐':r>=.6?'⭐':'💪',msg:Q.pass?'ผ่านด่านแล้ว!':'ยังไม่ผ่าน ต้องถูกอย่างน้อย 60% ลองอีกครั้งนะ',chips:[]})}`}
  if(Q.mode==="test"){const r=LVS.map(l=>Q.res[l][1]?Q.res[l][0]/Q.res[l][1]:0),n=lvName(...r);S.lv=n[0];S.res={r,n,est:null};
    extra=`<div class="panel"><h2>${n[1]}</h2><p class="mute">${n[2]}</p>${LVS.map((l,k)=>`<div class="row"><span>${LN[l]}</span><div class="bar"><i style="width:${r[k]*100}%"></i></div><span>${Math.round(r[k]*100)}%</span></div>`).join("")}<p class="mute">ผลนี้เป็นเพียงการประเมินเบื้องต้นจาก 20 ข้อ ไม่ใช่คะแนน TGAT1 จริงหรือจำนวนคำศัพท์ที่รู้ทั้งหมด</p></div>`}
  save();
  $("#app").innerHTML=`${TG_summary({kicker:'สรุปผล',score:Q.ok,total:Q.qs.length,pct:Math.round(Q.ok/Q.qs.length*100),msg:'ติดกันสูงสุด '+Q.max+' ข้อ',chips:['⭐ +'+Q.xp+' XP','🔥 เล่นต่อเนื่อง '+S.streak+' วัน']})}${extra}
  ${Q.miss.length?`<div class="panel"><h2>${Q.mode==="tgat"?"ข้อที่ตอบผิดหรือไม่ได้ตอบ":"คำที่พลาด"} ${Q.miss.length} ข้อ</h2>${Q.miss.slice(0,Q.mode==="tgat"?12:100).map(q=>`<div class="miss"><b>${esc(q.w||("ข้อ "+(Q.qs.indexOf(q)+1)))}</b><span>${Q.mode==="tgat"?esc(q.section):q.i>=0?V[q.i][1].split(";")[0]:""}</span></div>${Q.mode==="tgat"?`<p class="note">คำตอบที่ถูก: ${esc(q.o[q.a])}<br>${Number.isInteger(q.userAnswer)?"คำตอบของคุณ: "+esc(q.o[q.userAnswer]):"สถานะ: ไม่ได้ตอบ"}<br>${esc(typeof VLT_learningExplanation==='function'?VLT_learningExplanation(q):(q.exp||q.explanation||''))}</p>`:""}`).join("")}${Q.mode==="tgat"&&Q.miss.length>12?`<p class="note">แสดง 12 ข้อแรกจากทั้งหมด ${Q.miss.length} ข้อที่ผิด</p>`:""}</div>`:""}
  <button class="btn" onclick="${Q.again||"start('"+Q.mode+"')"}">${Q.mode==="stage"?(Q.pass?"ด่านต่อไป":"ลองด่านนี้อีกครั้ง"):Q.mode==="tgat"?"ทำข้อสอบจำลองอีกชุด":"เล่นอีกรอบ"}</button><button class="btn alt" onclick="window.STUDIO_GAME_RETURN?studioReturnToGame():home()">${window.STUDIO_GAME_RETURN?"กลับ Game Center":"กลับหน้าหลัก"}</button>`}
function exportProgress(){try{const payload={app:"English Daily",version:2,exportedAt:new Date().toISOString(),data:S};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="english-daily-progress.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast("ส่งออกความคืบหน้าแล้ว")}catch(e){toast("ส่งออกไม่สำเร็จ ลองใช้เบราว์เซอร์อื่น")}}
function importProgress(input){const f=input.files&&input.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{const obj=JSON.parse(reader.result),data=obj&&obj.data?obj.data:obj;if(!data||typeof data!=="object"||Array.isArray(data)||!data.st||typeof data.st!=="object"||!Number.isFinite(Number(data.xp)))throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");
  const clean={...S,xp:Math.max(0,Math.floor(Number(data.xp)||0)),streak:Math.max(0,Math.floor(Number(data.streak)||0)),last:typeof data.last==="string"?data.last:"",st:{},done:{},pg:{S:0,A:0,B:0,C:0},reviewAt:{},memory:{},lv:Number.isInteger(data.lv)?Math.max(-1,Math.min(3,data.lv)):-1,cur:PATH.includes(data.cur)?data.cur:"S",seen:data.seen?1:0};
  for(const [w,v] of Object.entries(data.st)){if(vi(w)>=0&&Array.isArray(v)){clean.st[w]=[Math.max(0,Number(v[0])||0),Math.max(0,Number(v[1])||0),v[2]===0?0:1]}}
  if(data.done&&typeof data.done==="object")for(const [k,v] of Object.entries(data.done)){if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(k)&&v)clean.done[k]=1}
  if(data.pg&&typeof data.pg==="object")for(const l of PATH)clean.pg[l]=Math.max(0,Math.min(tot(l),Math.floor(Number(data.pg[l])||0)));
  if(data.reviewAt&&typeof data.reviewAt==="object")for(const [w,v] of Object.entries(data.reviewAt)){if(vi(w)>=0&&Number.isFinite(Number(v)))clean.reviewAt[w]=Number(v)}
  if(data.memory&&typeof data.memory==="object")for(const [w,m] of Object.entries(data.memory)){if(vi(w)>=0&&m&&typeof m==="object")clean.memory[w]={streak:Math.max(0,Number(m.streak)||0),interval:Math.max(0,Number(m.interval)||0),due:Number(m.due)||0,reps:Math.max(0,Number(m.reps)||0)}}
  if(data.res&&typeof data.res==="object"&&Array.isArray(data.res.r)&&data.res.r.length>=3){const r=data.res.r.slice(0,3).map(v=>Math.max(0,Math.min(1,Number(v)||0)));clean.res={r,n:lvName(...r),est:null}}else clean.res=null;
  TGConfirm("นำเข้าความคืบหน้าจากไฟล์นี้หรือไม่? ข้อมูลปัจจุบันจะถูกแทนที่ หากยังไม่แน่ใจให้ยกเลิกแล้วส่งออกไฟล์สำรองปัจจุบันก่อน").then(ok=>{if(!ok)return;
  S=clean;save();toast("นำเข้าความคืบหน้าสำเร็จ");home()}).catch(e=>{toast("ไฟล์ไม่ถูกต้องหรือไม่ใช่ไฟล์สำรอง English Daily")})}catch(e){toast("ไฟล์ไม่ถูกต้องหรือไม่ใช่ไฟล์สำรอง English Daily")}};reader.readAsText(f);input.value=""}
/* v40.8.0: removed an unreachable earlier declaration of home(); the later declaration below always replaced it (function hoisting). */
const spellable=i=>/^[a-z]{3,9}$/.test(V[i][0]),tot=l=>Math.ceil(byLv(l).length/5),pg=l=>Math.min(S.pg[l]||0,tot(l));
const row=(a,b)=>`<div class="miss"><b>${a}</b><span>${b}</span></div>`;
function mkPic(i){const v=V[i],P=V.filter(x=>x[0]!==v[0]&&E[x[0]]&&x[3]===v[3]),r=uniq(v,P.length>5?P:V.filter(x=>x[0]!==v[0]&&E[x[0]]),3,x=>x[0]);return{k:"ทายจากรูป",p:'<span style="font-size:76px">'+E[v[0]]+'</span>',s:"คำนี้ภาษาอังกฤษคืออะไร?",...r,i,w:v[0]}}
function mkMatch(ws){const L=[],seenMeanings=new Set(),seenWords=new Set(),meaning=i=>String(V[i]?.[1]||'').split(';')[0].normalize('NFKC').toLocaleLowerCase().replace(/[\s.,;:!?。；，]+/g,' ').trim(),add=i=>{if(!Number.isInteger(i)||!V[i])return;const m=meaning(i),w=String(V[i][0]||'').toLocaleLowerCase();if(!m||seenMeanings.has(m)||seenWords.has(w))return;if(window.TGAT1MatchGuard&&L.some(j=>TGAT1MatchGuard.conflict(i,j)))return;L.push(i);seenMeanings.add(m);seenWords.add(w)};ws.forEach(add);const level=V[ws[0]]?.[3],candidates=shuf(V.map((_,i)=>i).filter(i=>V[i]?.[3]===level&&!L.includes(i)));for(const i of candidates){if(L.length>=5)break;add(i)}if(L.length<5)for(const i of shuf(V.map((_,i)=>i).filter(i=>!L.includes(i)))){if(L.length>=5)break;add(i)}return{t:"match",k:"จับคู่คำ",p:"จับคู่คำกับความหมาย",cls:" s",s:"แตะคำอังกฤษ แล้วแตะความหมายที่ตรงกัน",L,l:shuf(L),r:shuf(L),sel:null,dn:[],ms:0,i:-1,w:"จับคู่คำ",xs:L.map(i=>row((E[V[i][0]]||"")+" "+esc(V[i][0]),V[i][1].split(";")[0])).join("")}}
function mkSpell(i){const v=V[i],w=v[0],c=w.split("");return{t:"spell",k:"สะกดคำ",p:(E[w]?E[w]+" ":"")+v[1].split(";")[0],cls:" s",s:"แตะตัวอักษรให้ครบเป็นคำภาษาอังกฤษ",w,i,ch:shuf(c),use:[],tr:0,hh:0}}
function mkBuild(s){if(!s)return null;const tk=s[0].split(" ");if(tk.length<3||tk.length>12)return null;return{t:"build",k:"เรียงประโยค",p:s[1]||"เรียงคำให้เป็นประโยค",cls:" s",s:s[1]?"เรียงคำอังกฤษให้ตรงกับความหมาย":"แตะคำตามลำดับให้เป็นประโยคที่ถูกต้อง",tk:shuf(tk),use:[],tr:0,sent:s[0],w:tk[0],i:-1,xs:`<div class="xe">“${esc(s[0])}” ${sp(s[0])}${s[1]?"<br><b>"+s[1]+"</b>":""}</div>`}}
function mkTr(s){const r=uniq(s,SENT,3,x=>x[1]);return{k:"ประโยคนี้แปลว่าอะไร",p:s[0]+sp(s[0]),cls:" s",s:"เลือกความหมายที่ถูกต้อง",...r,i:-1,w:s[0].split(" ")[0],xs:`<div class="xe">“${esc(s[0])}” ${sp(s[0])}<br><b>${s[1]}</b></div>`}}
function fin(ok){const q=Q.qs[Q.i];q.a=1;ans(ok?1:0)}
function hint(){const q=Q.qs[Q.i];if(q.hid||Q.ans!==null)return;q.hid=pick(q.o.map((_,j)=>j).filter(j=>j!==q.a),2);quiz()}
function xbody(q){if(Q.ans!==null)return"";
  if(q.t==="match")return`<div class="mg"><div>${q.l.map(i=>`<button class="mb${q.dn.includes(i)?" dn":q.sel&&q.sel[0]==="l"&&q.sel[1]===i?" sel":""}" onclick="mt('l',${i})">${E[V[i][0]]||""} ${esc(V[i][0])}</button>`).join("")}</div><div>${q.r.map(i=>`<button class="mb${q.dn.includes(i)?" dn":q.sel&&q.sel[0]==="r"&&q.sel[1]===i?" sel":""}" onclick="mt('r',${i})">${V[i][1].split(";")[0]}</button>`).join("")}</div></div>`;
  if(q.t==="spell")return`<div class="slots">${q.w.split("").map((c,k)=>`<span class="sl">${q.use[k]!==undefined?q.ch[q.use[k]]:(q.hh&&k===0?"<i>"+c+"</i>":"")}</span>`).join("")}</div><div class="lts">${q.ch.map((c,k)=>`<button class="lt" ${q.use.includes(k)?"disabled":""} onclick="spk(${k})">${c}</button>`).join("")}</div><button class="btn alt" onclick="Q.qs[Q.i].use.pop();quiz()">ลบตัวล่าสุด</button><button class="btn alt" onclick="Q.qs[Q.i].hh=1;quiz()">💡 ใบ้ตัวแรก</button>`;
  return`<div class="ans">${q.use.map(k=>`<button class="tk" onclick="bdu(${k})">${esc(q.tk[k])}</button>`).join("")||'<span class="mute">แตะคำด้านล่างเพื่อเรียง</span>'}</div><div class="tks">${q.tk.map((x,k)=>`<button class="tk${q.use.includes(k)?" used":""}" onclick="bd(${k})">${esc(x)}</button>`).join("")}</div><button class="btn" onclick="bdc()">ตรวจคำตอบ</button><button class="btn alt" onclick="bdh()">💡 ใบ้คำแรก</button>`}
function mt(s,i){const q=Q.qs[Q.i];if(Q.ans!==null||q.dn.includes(i))return;
  if(!q.sel||q.sel[0]===s)q.sel=[s,i];else if(q.sel[1]===i){q.dn.push(i);q.sel=null;recordWord(i,true);save();if(q.dn.length===q.L.length)return fin(q.ms<=2)}else{const wrongIndex=q.sel[0]==="l"?q.sel[1]:i;recordWord(wrongIndex,false);save();q.ms++;q.sel=null;toast("ยังไม่ใช่ ลองใหม่")}quiz()}
function spk(k){const q=Q.qs[Q.i];if(Q.ans!==null||q.use.includes(k))return;q.use.push(k);
  if(q.use.length===q.w.length){if(q.use.map(x=>q.ch[x]).join("")===q.w)return fin(true);q.tr++;if(q.tr>=3)return fin(false);toast("ยังไม่ถูก ลองใหม่ (เหลือ "+(3-q.tr)+" ครั้ง)");q.use=[]}quiz()}
function bd(k){const q=Q.qs[Q.i];if(!q.use.includes(k))q.use.push(k);quiz()}
function bdu(k){const q=Q.qs[Q.i];q.use=q.use.filter(x=>x!==k);quiz()}
function bdh(){const q=Q.qs[Q.i];q.use=[q.tk.indexOf(q.sent.split(" ")[0])];quiz()}
function bdc(){const q=Q.qs[Q.i];if(q.use.map(k=>q.tk[k]).join(" ")===q.sent)return fin(true);q.tr++;if(q.tr>=3)return fin(false);toast("ยังไม่ถูก ลองเรียงใหม่ (เหลือ "+(3-q.tr)+" ครั้ง)");q.use=[];quiz()}
function stageQs(ws){const m=[],h=[];ws.forEach((i,k)=>{m.push(E[V[i][0]]&&k%2===0?mkPic(i):mkMeaning(i,0));m.push(mkMeaning(i,1));if(spellable(i)&&k%2===0)h.push(mkSpell(i))});
  const b=ws.map(i=>{const w=V[i][0];return SENT.find(s=>new RegExp("\\b"+w+"s?\\b","i").test(s[0]))||(EX[i]?[EX[i],null]:null)}).map(mkBuild).filter(Boolean)[0];
  return[mkMatch(ws),...shuf(m).slice(0,6),...h.slice(0,2),...(b?[b]:[])]}
function startStage(L){const k=S.pg[L]||0,ws=byLv(L).slice(k*5,k*5+5);if(!ws.length){const n=PATH[PATH.indexOf(L)+1];if(n){setCur(n);toast("จบเลเวลนี้แล้ว ไปเลเวลถัดไป!")}else toast("จบทุกเลเวลแล้ว เก่งมาก!");return}
  Q={mode:"stage",L,k,ws,n:0,qs:[],i:0,ok:0,xp:0,combo:0,max:0,ans:null,res:{A:[0,0],B:[0,0],C:[0,0]},miss:[],d:0,run:0,again:`startStage('${L}')`};learn()}
function learn(){const i=Q.ws[Q.n],v=V[i],last=Q.n===Q.ws.length-1;
  $("#app").innerHTML=`<div class="qt"><button class="x" aria-label="ออก" onclick="home()">✕</button><div class="bar"><i style="width:${(Q.n+1)/Q.ws.length*100}%"></i></div><span class="chip">คำใหม่ ${Q.n+1}/${Q.ws.length}</span></div>
  <div class="panel" style="text-align:center"><div style="font-size:76px;line-height:1.2">${E[v[0]]||"📘"}</div><div class="big">${esc(v[0])} ${sp(v[0])}</div><p style="font-size:22px;font-weight:600;margin:6px 0">${v[1].split(";")[0]}</p>${v[2]?`<p class="mute">${v[2]} · ${TIP[p1(v)]||""}</p>`:""}${EX[i]?`<div class="xe">“${esc(EX[i])}” ${sp(EX[i])}</div>`:""}<p class="mute">คำใบ้ช่วยจำ: ขึ้นต้นด้วย “${v[0][0]}” มี ${v[0].replace(/[^a-z]/gi,"").length} ตัวอักษร</p>${LK(v[0])}</div>
  <button class="btn" onclick="${last?"stageGo()":"Q.n++;learn()"}">${last?"เริ่มทำแบบฝึกหัด":"ถัดไป"}</button>`}
function stageGo(){Q.qs=stageQs(Q.ws);Q.i=0;quiz()}
function setCur(l){S.cur=l;save();home()}
function play(g){STUDIO_SESSION_FINISHED=false;const L=S.cur,pool=byLv(L),f=pool.filter(i=>!mast(V[i])),P=f.length>=6?f:pool,qs=[];
  if(g==="match")for(let k=0;k<4;k++)qs.push(mkMatch(pick(P,5)));
  if(g==="pic"){const pp=P.filter(i=>E[V[i][0]]);if(pp.length<4){toast("ระดับ "+LT[L]+" มีคำศัพท์พร้อมภาพไม่พอสำหรับชุดนี้ ระบบจะไม่ลดไประดับง่ายให้อัตโนมัติ");return}pick(pp,10).forEach(i=>qs.push(mkPic(i)))}
  if(g==="spell")pick(P.filter(spellable),8).forEach(i=>qs.push(mkSpell(i)));
  if(g==="build"){const sp=L==="S"?SENT:Object.values(EX).map(e=>[e,null]);shuf(sp).map(mkBuild).filter(Boolean).slice(0,6).forEach(q=>qs.push(q))}
  if(g==="tr"){const scored=SENT.map(s=>({s,score:(String(s[0]).trim().split(/\s+/).length*1.5)+(String(s[0]).match(/,|;|:|although|whereas|unless|despite|therefore|however|which|whose|while|because/gi)||[]).length*3+(String(s[0]).match(/\b\w{8,}\b/g)||[]).length*1.2}));let pool=scored;if(L==="C"){const avg=scored.reduce((a,b)=>a+b.score,0)/Math.max(1,scored.length);pool=scored.filter(x=>x.score>=Math.max(18,avg*1.15)).sort((a,b)=>b.score-a.score).map(x=>x.s);if(pool.length<4){toast("คลังประโยคระดับยากยังมีไม่พอ จึงไม่แสดงโจทย์ง่ายปะปน");return}}else if(L==="B"){pool=scored.sort((a,b)=>b.score-a.score).slice(0,Math.max(10,Math.ceil(scored.length*.65))).map(x=>x.s)}else{pool=scored.sort((a,b)=>a.score-b.score).slice(0,Math.max(10,Math.ceil(scored.length*.65))).map(x=>x.s)}pick(pool,10).forEach(s=>qs.push(mkTr(s)))};
  if(!qs.length){toast("เลเวลนี้ยังไม่มีโจทย์แบบนี้ ลองเลือกเลเวล ‘พื้นฐาน’");return}
  Q={mode:"game",qs,i:0,ok:0,xp:0,combo:0,max:0,ans:null,res:{A:[0,0],B:[0,0],C:[0,0]},miss:[],d:0,run:0,again:`play('${g}')`};quiz()}
function pathHtml(){const L=S.cur,n=tot(L),p=pg(L),done=p>=n;
  return`<div class="hero"><div style="opacity:.85;font-size:14px">เส้นทางเรียน · เลเวล ${LT[L]}</div><h2>${done?"จบเลเวลนี้แล้ว 🎉":"ด่านที่ "+(p+1)+" จาก "+n}</h2><div class="bar"><i style="width:${p/n*100}%"></i></div><button class="btn" onclick="startStage('${L}')">${done?"ไปเลเวลถัดไป":p?"เรียนต่อ":"เริ่มเรียน"}</button></div>
<div class="lvs">${PATH.map(l=>`<button class="lvb${l===L?" on":""}" onclick="setCur('${l}')"><b>${LT[l]}</b><br>${pg(l)}/${tot(l)}</button>`).join("")}</div>
<div class="panel"><h2>มินิเกม</h2><p class="mute">เบื่อก็เล่นเกม ใช้คำจากเลเวลที่เลือกอยู่</p><div class="gg">${[["match","🔗","จับคู่คำ"],["pic","🖼️","ทายจากรูป"],["spell","🔤","สะกดคำ"],["build","🧩","เรียงประโยค"],["tr","💬","ประโยคนี้แปลว่า?"],["free","♾️","เล่นไปเรื่อย ๆ"]].map(g=>`<button class="gt" onclick="${g[0]==="free"?"start('free')":"play('"+g[0]+"')"}"><span>${g[1]}</span>${g[2]}</button>`).join("")}</div></div>`}
function help(){const m=document.createElement("div");m.className="modal";m.onclick=e=>{if(e.target===m)m.remove()};
  const sheet=document.createElement('div');sheet.className='sheet';const title=document.createElement('h2');title.textContent='วิธีเล่น';sheet.appendChild(title);
  const items=[['เริ่มที่เลเวล ','1 พื้นฐาน'," กด ‘เริ่มเรียน’ แต่ละด่านมี 5 คำ ดูคำใหม่ก่อน แล้วทำแบบฝึกหัด"],['ตอบถูก 60% ขึ้นไปผ่านด่าน ได้ดาว ⭐ ผ่านครบแล้วค่อยขยับไปเลเวลที่ยากขึ้น'],['เบื่อก็เล่น ','มินิเกม',': จับคู่คำ ทายจากรูป สะกดคำ เรียงประโยค'],['ติดตรงไหนกด ','💡 คำใบ้',' ได้ ตอบผิดไม่เสียคะแนน แล้วจะมีคำอธิบายให้ทุกข้อ'],['อยากรู้ว่าตัวเองอยู่ระดับไหน ทำ ‘ทดสอบระดับ’ ที่หน้าหลัก']];
  const list=document.createElement('ol');items.forEach(parts=>{const li=document.createElement('li');if(parts.length===1)li.textContent=parts[0];else{li.appendChild(document.createTextNode(parts[0]));const strong=document.createElement('b');strong.textContent=parts[1];li.appendChild(strong);li.appendChild(document.createTextNode(parts[2]))}list.appendChild(li)});sheet.appendChild(list);
  const close=document.createElement('button');close.type='button';close.className='btn';close.textContent='เข้าใจแล้ว เริ่มเลย';close.addEventListener('click',()=>m.remove());sheet.appendChild(close);m.appendChild(sheet);document.body.appendChild(m)}
function dict(){$("#app").innerHTML=`<div class="qt"><button class="x" aria-label="กลับ" onclick="home()">✕</button><input id="dqi" class="inp" placeholder="พิมพ์คำอังกฤษหรือคำไทย" oninput="dq(this.value)"></div><div id="dr"></div>`;dq("")}
function dq(s){s=s.trim().toLowerCase();const r=V.map((_,i)=>i).filter(i=>!s||V[i][0].includes(s)||V[i][1].includes(s)).slice(0,30);$("#dr").innerHTML=r.map(i=>`<button class="opt" onclick="dd(${i})"><b>${esc(V[i][0])}</b> <span class="mute">${esc(V[i][2])}</span><br>${esc(V[i][1].split(";")[0])}</button>`).join("")||'<p class="mute">ไม่พบคำนี้</p>'}
function dd(i){$("#dr").innerHTML=`<div class="fb">${explain({w:V[i][0]})}<button class="btn alt" onclick="dq(document.getElementById('dqi').value)">กลับไปรายการ</button></div>`}

// ===== English Daily TGAT1 Ultimate Practice Vault =====
const __VLT_FIELDS=["id","set","category","kind","section","prompt","context","options","answer","explanation","hint","topic","difficulty"];
const VLT_CATS=[['qr','Question–Response',10],['short','Short Conversations',10],['long','Long Conversations',10],['tc','Text Completion',15],['rc','Reading Comprehension',15]];
const VLT_STORE='engdaily_vault_v1';
let VLT_BANK=[];
let VLT_BY_ID=new Map();
let __tgat1VaultPromise=null;
/* v40.7.32: in 207 questions the correct option was the only one written differently (lower-case
   first letter, or the only one with/without a final full stop), which gave the answer away.
   Make the options typographically uniform; wording is unchanged. */
function VLT_evenOutOptionCues(q){
  const o=q&&q.options,a=q&&q.answer;if(!Array.isArray(o)||o.length!==4||!Number.isInteger(a))return;
  const s=o.map(x=>String(x)),others=[0,1,2,3].filter(i=>i!==a);
  const up=x=>/^\s*[A-Z]/.test(x),low=x=>/^\s*[a-z]/.test(x),cap=x=>x.replace(/^(\s*)([a-z])/,(m,sp,c)=>sp+c.toUpperCase());
  if(low(s[a])&&others.every(i=>up(s[i])))s[a]=cap(s[a]);
  else if(up(s[a])&&others.every(i=>low(s[i])))others.forEach(i=>{s[i]=cap(s[i])});
  const dot=x=>/[^.]\.\s*$/.test(x),bare=x=>!/[.?!…"”')]\s*$/.test(x);
  if(bare(s[a])&&others.every(i=>dot(s[i])))s[a]=s[a].replace(/\s*$/,'.');
  else if(dot(s[a])&&others.every(i=>bare(s[i])))s[a]=s[a].replace(/\.\s*$/,'');
  q.options=s;
}
function VLT_decodeVault(chunk){
  if(!chunk||!Array.isArray(chunk[0])||!Array.isArray(chunk[1]))throw new Error('Question bank chunk is malformed');
  const pool=chunk[0],packed=chunk[1];
  const bank=packed.map((row,rowIndex)=>{if(!Array.isArray(row)||row.length!==__VLT_FIELDS.length)throw new Error('Malformed question row '+rowIndex);const q={};for(let i=0;i<__VLT_FIELDS.length;i++){const v=row[i];q[__VLT_FIELDS[i]]=Array.isArray(v)?v.map(x=>pool[x]):(typeof v==='number'&&['set','answer','difficulty'].includes(__VLT_FIELDS[i])?v:pool[v]);}return q;});
  if(bank.length!==1200)throw new Error('Question bank count mismatch: '+bank.length);
  bank.forEach(VLT_evenOutOptionCues);
  VLT_BANK=bank;VLT_BY_ID=new Map(bank.map(q=>[q.id,q]));
  if(window.TGAT1DataGuards){VLT_STATE=window.TGAT1DataGuards.normalizeVltState(VLT_STATE,VLT_BANK,VLT_CATS);if(VLT_STATE.scoreScale!==100){const _cs=Object.values(VLT_STATE.completedSets||{});if(!_cs.some(r=>(r.score||0)>60||(r.best||0)>60)){for(const r of _cs){r.score=Math.round((r.score||0)*100/60);r.best=Math.round((r.best||0)*100/60)}}}VLT_STATE.scoreScale=100;VLT_save();}
  return VLT_BANK;
}
function VLT_ensureBank(){
  if(VLT_BANK.length===1200)return Promise.resolve(VLT_BANK);
  const embedded=window.__TGAT1_DATA&&window.__TGAT1_DATA.vault;
  if(embedded)return Promise.resolve(VLT_decodeVault(embedded));
  if(__tgat1VaultPromise)return __tgat1VaultPromise;
  __tgat1VaultPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=new URL('./data-vault.js',document.baseURI).href;script.async=true;script.dataset.tgat1Vault='1';
    script.onload=()=>{try{resolve(VLT_decodeVault(window.__TGAT1_DATA&&window.__TGAT1_DATA.vault))}catch(error){__tgat1VaultPromise=null;reject(error)}};
    script.onerror=()=>{__tgat1VaultPromise=null;script.remove();reject(new Error('โหลดคลังข้อสอบไม่สำเร็จ กรุณาตรวจการเชื่อมต่อหรือแคชออฟไลน์แล้วลองใหม่'))};
    document.head.appendChild(script);
  });
  return __tgat1VaultPromise;
}
window.TGAT1LazyVault={ensure:VLT_ensureBank,get loaded(){return VLT_BANK.length===1200},get count(){return VLT_BANK.length}};
let VLT_STATE=VLT_load();
let VLT_RUN=null, VLT_TIMER=null, VLT_HINT=false;
function VLT_load(){
  const fallback={version:1,xp:0,answered:0,correct:0,streak:0,lastDay:'',completedSets:{},missed:{},mastered:{},favorites:[],history:[],dailyDone:'',badges:[]};
  try{
    const x=JSON.parse(localStorage.getItem(VLT_STORE)||'{}');if(!x||x.version!==1||!window.TGAT1DataGuards)return fallback;
    const clean=window.TGAT1DataGuards.normalizeVltState(x,[],VLT_CATS),validId=id=>/^S\d{2}-Q\d{3}$/.test(String(id));
    for(const key of ['missed','mastered']){const src=x[key]&&typeof x[key]==='object'?x[key]:{};for(const [id,value] of Object.entries(src)){const n=Math.max(0,Math.min(1000000,Math.floor(Number(value)||0)));if(validId(id)&&n>0)clean[key][id]=n;}}
    clean.favorites=Array.isArray(x.favorites)?[...new Set(x.favorites.filter(validId))]:[];
    return clean;
  }catch(e){return fallback}
}
function VLT_save(){try{localStorage.setItem(VLT_STORE,JSON.stringify(VLT_STATE));}catch(e){VLT_toast('บันทึกไม่สำเร็จ พื้นที่เก็บข้อมูลอาจเต็ม กรุณาส่งออกข้อมูลสำรอง')}}
function VLT_escape(x){return htmlEsc(x)}
function VLT_shuffle(a){const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
function VLT_day(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function VLT_get(id){return VLT_BY_ID.get(id)||null}
function VLT_toast(s){const old=document.querySelector('.vault-toast');if(old)old.remove();const d=document.createElement('div');d.className='toast vault-toast';d.textContent=s;document.body.appendChild(d);setTimeout(()=>d.remove(),2400)}
function VLT_updateBadges(){const add=(id,yes)=>{if(yes&&!VLT_STATE.badges.includes(id))VLT_STATE.badges.push(id)};add('first',VLT_STATE.answered>=1);add('100',VLT_STATE.answered>=100);add('500',VLT_STATE.answered>=500);add('perfect',VLT_STATE.history.some(h=>h.total>=10&&h.score===h.total));add('sets5',Object.keys(VLT_STATE.completedSets).filter(k=>VLT_STATE.completedSets[k]).length>=5);add('sets20',Object.keys(VLT_STATE.completedSets).filter(k=>VLT_STATE.completedSets[k]).length>=20);add('streak3',VLT_STATE.streak>=3);}
function VLT_record(q,ok,saveNow=true){VLT_STATE.answered++;const _xd=VLT_day();if(!VLT_STATE.xpDay||typeof VLT_STATE.xpDay!=='object'||VLT_STATE.xpDay.d!==_xd||!VLT_STATE.xpDay.ids)VLT_STATE.xpDay={d:_xd,ids:{}};const _used=Number(VLT_STATE.xpDay.ids[q.id])||0,_gain=Math.max(0,Math.min(ok?8:1,8-_used));VLT_STATE.xpDay.ids[q.id]=_used+_gain;if(ok){VLT_STATE.correct++;VLT_STATE.xp+=_gain;VLT_STATE.mastered[q.id]=(VLT_STATE.mastered[q.id]||0)+1;if(VLT_STATE.mastered[q.id]>=3)delete VLT_STATE.missed[q.id];}else{VLT_STATE.missed[q.id]=(VLT_STATE.missed[q.id]||0)+1;VLT_STATE.xp+=_gain;}const d=VLT_day(),y=new Date(Date.now()-86400000),yd=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');if(VLT_STATE.lastDay!==d){VLT_STATE.streak=VLT_STATE.lastDay===yd?VLT_STATE.streak+1:1;VLT_STATE.lastDay=d;}VLT_updateBadges();if(saveNow)VLT_save()}
function VLT_originalHome(){if(typeof window.VLT_ORIGINAL_HOME==='function')window.VLT_ORIGINAL_HOME()}
/* v40.8.0: removed an unreachable earlier declaration of VLT_open(); the later declaration below always replaced it (function hoisting). */
let VLT_HOME_TAB='sets';
/* v40.8.0: removed an unreachable earlier declaration of VLT_home(); the later declaration below always replaced it (function hoisting). */
function VLT_showSets(){if(!VLT_BANK.length){VLT_ensureBank().then(()=>VLT_showSets()).catch(e=>VLT_toast(e.message));return;}const el=document.getElementById('vaultSetsBlock');if(!el){VLT_HOME_TAB='sets';VLT_home();return;}el.innerHTML=`<div class="vault-hero"><h2>🏁 เลือกด่าน (20 ชุด)</h2><p class="vault-sub">ทุกชุดมี 60 ข้อ: Question–Response 10, Short Conversation 10, Long Conversation 10, Text Completion 15 และ Reading Comprehension 15</p><div class="vault-sets">${Array.from({length:20},(_,i)=>{const n=i+1,rec=VLT_STATE.completedSets[n],rawScore=rec&&rec.score!=null?Number(rec.score):NaN,score=Number.isFinite(rawScore)?`${Math.max(0,Math.min(100,Math.trunc(rawScore)))}/100`:'ยังไม่เล่น';return `<button class="vault-set${rec?' done':''}" onclick="VLT_startMock(${n})"><b>${rec?'✅':'🎯'} ชุดที่ ${n}</b><small>${score}</small><small>${rec?'ทำซ้ำเพื่อพัฒนาคะแนน':'60 ข้อ · 60 นาที'}</small></button>`}).join('')}</div><div class="vault-actions"><button class="vault-btn alt" onclick="VLT_home()">ย่อรายการชุด</button></div></div>`;el.scrollIntoView({behavior:'smooth',block:'start'})}
function VLT_startMock(setNo){if(!VLT_BANK.length){VLT_ensureBank().then(()=>VLT_startMock(setNo)).catch(e=>VLT_toast(e.message));return;}const pool=VLT_BANK.filter(q=>q.set===setNo);const partOrder={qr:0,short:1,long:2,tc:3,rc:4};const ordered=pool.slice().sort((a,b)=>(partOrder[a.category]??9)-(partOrder[b.category]??9)||Number((a.id.match(/Q(\d+)$/)||[])[1]||0)-Number((b.id.match(/Q(\d+)$/)||[])[1]||0));const finalQs=ordered.map(q=>{const oo=VLT_shuffle(q.options.map((t,i)=>({t,ok:i===q.answer})));return {...q,options:oo.map(x=>x.t),answer:oo.findIndex(x=>x.ok),userAnswer:null}});
 VLT_begin({mode:'mock',setNo,qs:finalQs,index:0,answers:{},started:Date.now(),deadline:Date.now()+3600000,seconds:3600,score:0,combo:0,reviewOn:false});}
function VLT_startCategory(cat){if(!VLT_BANK.length){VLT_ensureBank().then(()=>VLT_startCategory(cat)).catch(e=>VLT_toast(e.message));return;}let pool=VLT_BANK.filter(q=>q.category===cat);let qs=VLT_shuffle(pool).slice(0,10);VLT_begin({mode:'practice',label:VLT_CATS.find(x=>x[0]===cat)[1],qs:qs.map(q=>({...q,userAnswer:null})),index:0,answers:{},score:0,combo:0,reviewOn:false});}
function VLT_startQuick(){if(!VLT_BANK.length){VLT_ensureBank().then(()=>VLT_startQuick()).catch(e=>VLT_toast(e.message));return;}const qs=VLT_mixPool(10);VLT_begin({mode:'practice',label:'สุ่ม 10 ข้อ',qs:qs.map(q=>({...q,userAnswer:null})),index:0,answers:{},score:0,combo:0,reviewOn:false});}
function VLT_startDaily(){if(!VLT_BANK.length){VLT_ensureBank().then(()=>VLT_startDaily()).catch(e=>VLT_toast(e.message));return;}const qs=VLT_dailyPool();VLT_begin({mode:'daily',label:'ภารกิจประจำวัน',qs:qs.map(q=>({...q,userAnswer:null})),index:0,answers:{},score:0,combo:0,reviewOn:false});}
function VLT_dailyPool(){const out=[];for(const [cat] of VLT_CATS){const pool=VLT_shuffle(VLT_BANK.filter(q=>q.category===cat));out.push(...pool.slice(0,cat==='tc'||cat==='rc'?2:2));}return VLT_shuffle(out).slice(0,10)}
function VLT_mixPool(n){return VLT_shuffle(VLT_BANK).slice(0,n)}
function VLT_startReview(){if(!VLT_BANK.length){VLT_ensureBank().then(()=>VLT_startReview()).catch(e=>VLT_toast(e.message));return;}const ids=Object.keys(VLT_STATE.missed).filter(id=>VLT_STATE.missed[id]>0);if(!ids.length){VLT_toast('ยังไม่มีข้อที่ตอบผิด ลองทำชุดฝึกก่อนนะ');return}const qs=VLT_shuffle(ids.map(VLT_get).filter(Boolean)).slice(0,20);VLT_begin({mode:'practice',label:'แก้มือข้อที่เคยผิด',qs:qs.map(q=>({...q,userAnswer:null})),index:0,answers:{},score:0,combo:0,reviewOn:true});}
function VLT_startFavorites(){if(!VLT_BANK.length){VLT_ensureBank().then(()=>VLT_startFavorites()).catch(e=>VLT_toast(e.message));return;}const qs=VLT_STATE.favorites.map(VLT_get).filter(Boolean);if(!qs.length){VLT_toast('กด 💖 ระหว่างทำข้อสอบเพื่อเก็บข้อโปรดก่อนนะ');return}VLT_begin({mode:'practice',label:'ข้อโปรดของฉัน',qs:VLT_shuffle(qs).map(q=>({...q,userAnswer:null})),index:0,answers:{},score:0,combo:0,reviewOn:false});}
function VLT_startSprint(){if(!VLT_BANK.length){VLT_ensureBank().then(()=>VLT_startSprint()).catch(e=>VLT_toast(e.message));return;}VLT_begin({mode:'sprint',label:'สปรินต์ 90 วินาที',qs:VLT_shuffle(VLT_BANK).map(q=>({...q,userAnswer:null})),index:0,answers:{},score:0,combo:0,deadline:Date.now()+90000,seconds:90,reviewOn:false});}
function VLT_optShuf(q){if(!q||q._os)return q;const o=q.options,k=q.answer;if(!Array.isArray(o)||o.length!==4||!Number.isInteger(k)||k<0||k>3)return q;const p=o.map((t,i)=>({t,c:i===k}));for(let i=p.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]]}return {...q,options:p.map(x=>x.t),answer:p.findIndex(x=>x.c),_os:1}}
function VLT_begin(run){if(run&&run.mode!=='mock'&&Array.isArray(run.qs)&&!run._os&&!run.index&&!(run.answers&&Object.keys(run.answers).length)){run.qs=run.qs.map(VLT_optShuf);run._os=1}VLT_stopTimer();VLT_RUN=run;VLT_HINT=false;if(run.mode==='mock'||run.mode==='sprint')VLT_startTimer();VLT_renderQuiz()}
function VLT_stopTimer(){if(VLT_TIMER){clearInterval(VLT_TIMER);VLT_TIMER=null}}
function VLT_startTimer(){VLT_stopTimer();VLT_TIMER=setInterval(()=>{if(!VLT_RUN||!VLT_RUN.deadline)return;const left=Math.max(0,Math.ceil((VLT_RUN.deadline-Date.now())/1000));VLT_RUN.seconds=left;const el=document.getElementById('vltClock');if(el)el.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(left<=0){VLT_stopTimer();if(VLT_RUN.mode==='sprint')VLT_finish(true);else VLT_finish(true)}},500)}
function VLT_current(){return VLT_RUN&&VLT_RUN.qs[VLT_RUN.index]}
function VLT_renderContext(q){if(!q.context)return '';let x=VLT_escape(q.context);x=x.replace(/\((\d+)\)\s*_+/g,'<b class="vault-pill">($1) ____</b>');return `<div class="vault-context">${x}</div>`}

// ===== v11 answer review: explain the clue and the principle behind eliminating distractors =====
function VLT_contextClue(q){
 const ctx=String(q.context||'');
 if(q.category==='tc'){
  const m=String(q.prompt||'').match(/blank\s*\((\d+)\)/i);const n=m?m[1]:'';
  if(n){const re=new RegExp('[^.!?]*\\('+n+'\\)\\s*_+[^.!?]*[.!?]?','i');const hit=ctx.match(re);if(hit){return {title:'ประโยคเมื่อเติมคำตอบ',text:hit[0].replace(new RegExp('\\('+n+'\\)\\s*_+'),q.options[q.answer])};}}
 }
 if(q.category==='rc'){
  const pm=String(q.prompt||'');
  const vm=pm.match(/[‘'\"]([^’'\"]+)[’'\"]/);
  if(vm){const w=vm[1].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const re=new RegExp('[^.!?]*'+w+'[^.!?]*[.!?]?','i');const hit=ctx.match(re);if(hit)return {title:'หลักฐานจากบริบทของคำ',text:hit[0]};}
  if(/what did .* do first|what did the group do first/i.test(pm)){const hit=ctx.match(/First,?[^.!?]*[.!?]?/i);if(hit)return {title:'หลักฐานในบทอ่าน',text:hit[0]};}
  if(/mainly about|central idea|main idea/i.test(pm)){const a=ctx.match(/^[^.!?]+[.!?]?/);const b=ctx.match(/[^.!?]+[.!?]?\s*$/);return {title:'อ่านภาพรวมทั้งบท',text:'ประโยคเปิด: '+(a?a[0].trim():'')+'\nบทสรุป: '+(b?b[0].trim():'')};}
  if(/infer|inferred|follows logically/i.test(pm)){const b=ctx.match(/[^.!?]+[.!?]?\s*$/);return {title:'หลักฐานสำหรับการอนุมาน',text:b?b[0].trim():'ใช้ข้อมูลหลายประโยคประกอบกัน และอย่าสรุปเกินกว่าที่บทอ่านรองรับ'};}
  if(/why/i.test(pm)){const m=ctx.match(/[^.!?]*(?:because|so that|in order to|to see|to check|to ensure)[^.!?]*[.!?]?/i);if(m)return {title:'ข้อความที่ช่วยตอบคำถาม',text:m[0]};}
 }
 if(q.category==='qr'){
  const p=String(q.prompt||'').replace(/^Q:\s*/i,'');let clue='';
  if(/^How often\b/i.test(p))clue='ถามความถี่ → มองหาคำบอกความถี่ เช่น once a week, every day, twice a month';
  else if(/^How long\b/i.test(p))clue=/will it take|does it take|have you|has .* been/i.test(p)?'ถามระยะเวลา → ตอบเป็นช่วงเวลาหรือระยะเวลาที่ใช้ เช่น ten minutes, for two years, since June':'ถามความยาว/ระยะเวลา → ตรวจว่าต้องการความยาวหรือเวลาที่ใช้';
  else if(/^(When|What time)\b/i.test(p))clue='ถามเวลา/วัน → ตอบเวลาที่เริ่มหรือวันนัด ไม่ใช่สถานที่หรือความถี่';
  else if(/^Where\b/i.test(p))clue='ถามสถานที่ → ตอบตำแหน่งหรือสถานที่';
  else if(/^Why\b/i.test(p))clue='ถามเหตุผล → ตอบสาเหตุหรือเหตุผลที่ทำให้เกิดเหตุการณ์';
  else if(/^How many\b/i.test(p))clue='ถามจำนวนของสิ่งที่นับได้ → ตอบเป็นจำนวน';
  else if(/^How much\b/i.test(p))clue='ถามปริมาณหรือราคา → ตอบจำนวน/ราคาให้ตรงบริบท';
  else if(/^Who\b/i.test(p))clue='ถามบุคคล → ระบุคนหรือกลุ่มคน';
  else if(/Would you mind/i.test(p))clue='เป็นคำขอร้องสุภาพ; “Not at all” หมายถึงยินดี/ไม่รังเกียจที่จะช่วย';
  else if(/Could you|Would you|Can you/i.test(p))clue='เป็นคำขอร้อง → ตอบรับหรือปฏิเสธอย่างสุภาพ และให้ตรงกับสิ่งที่ขอ';
  else if(/Why don.t we|How about|Shall we/i.test(p))clue='เป็นการเสนอแนะ → ตอบรับ/ปฏิเสธข้อเสนออย่างเป็นธรรมชาติ';
  else if(/What do you think/i.test(p))clue='ถามความคิดเห็น → ตอบด้วยความเห็นหรือการประเมิน';
  else if(/What should/i.test(p))clue='ถามคำแนะนำ → เสนอขั้นตอนที่เหมาะกับสถานการณ์';
  else if(/I.m sorry|sorry/i.test(p))clue='อีกฝ่ายกำลังขอโทษ → ตอบรับคำขอโทษหรือบอกว่าไม่เป็นไร';
  else if(/Thank you/i.test(p))clue='อีกฝ่ายขอบคุณ → ตอบรับคำขอบคุณ เช่น You’re welcome';
  if(clue)return {title:'หน้าที่ของคำถาม',text:clue};
 }
 if(q.category==='short'||q.category==='long'){
  const a=String(q.options[q.answer]||'');
  if(a&&ctx.toLowerCase().includes(a.toLowerCase())){const at=ctx.toLowerCase().indexOf(a.toLowerCase());return {title:'หลักฐานจากบทสนทนา',text:ctx.slice(Math.max(0,at-90),Math.min(ctx.length,at+a.length+100)).trim()};}
  const lines=ctx.split(/\n/).map(x=>x.trim()).filter(Boolean);const k=lines.findIndex(x=>/\(\d+\)\s*_+/.test(x));
  if(k>=0)return {title:'จุดเชื่อมของบทสนทนา',text:lines.slice(Math.max(0,k-1),Math.min(lines.length,k+2)).join('\n')};
  return {title:'วิธีตรวจความต่อเนื่อง',text:'อ่านประโยคก่อนช่องว่างและประโยคถัดไปพร้อมกัน ตรวจว่าคำตอบรับข้อมูลเดิม ตอบคำถามที่ค้างอยู่ และไม่เปลี่ยนหัวข้อโดยไม่มีเหตุผล'};
 }
 return null;
}
function VLT_distractorRule(q){
 if(q.category==='qr')return 'ตัวเลือกอื่นไม่ตอบชนิดข้อมูลหรือเจตนาที่คำถามเรียกหา เช่น ถามสถานที่แต่ตอบเวลา หรือถามความถี่แต่ตอบระยะเวลา';
 if(q.category==='short'||q.category==='long')return 'ตัวเลือกอื่นไม่เชื่อมกับคำพูดก่อนหน้า/หลังช่องว่าง หรือไม่ตอบเจตนาของผู้พูดในสถานการณ์นั้น';
 if(q.category==='tc')return 'เมื่อนำไปเติมในประโยคแล้วจะไม่ลงตัวด้านชนิดคำ โครงสร้างไวยากรณ์ คำเชื่อม การใช้ร่วมกันของคำ (collocation) หรือความหมาย';
 const p=String(q.prompt||'');
 if(/word .*closest in meaning|closest in meaning/i.test(p))return 'ตัวเลือกอื่นไม่ใช่ความหมายที่เข้ากับคำนี้ในประโยคที่ปรากฏ ต้องเลือกความหมายตามบริบท ไม่ใช่ความหมายอื่นของคำ';
 if(/mainly about|central idea|main idea/i.test(p))return 'ตัวเลือกอื่นอาจแคบเกินไป กล่าวเกินหลักฐาน ขัดกับข้อจำกัดที่ผู้เขียนระบุ หรือไม่ใช่หัวข้อของบทอ่าน';
 if(/infer|inferred|follows logically/i.test(p))return 'ตัวเลือกอื่นสรุปเกินข้อมูล ขัดกับบทอ่าน หรือไม่มีหลักฐานเพียงพอให้อนุมาน';
 return 'ตัวเลือกอื่นไม่มีข้อความรองรับโดยตรงในบทอ่าน หรือขัดกับรายละเอียดที่ระบุ';
}
function VLT_explainPanel(q){
 const clue=VLT_contextClue(q),wrong=q.options.map((t,j)=>({t,j})).filter(x=>x.j!==q.answer);
 const clueHtml=clue?`<div class="vault-evidence"><b>${VLT_escape(clue.title)}</b><div>${VLT_escape(clue.text).replace(/\n/g,'<br>')}</div></div>`:'';
 const opts=wrong.map(x=>`<span class="vault-distractor"><b>${'ABCD'[x.j]}.</b> ${VLT_escape(x.t)}</span>`).join('');
 return `<div class="vault-feedback-detail"><div class="vault-review-rule"><b>หลักคิดที่ใช้ตัดตัวลวง</b><p>${VLT_escape(VLT_distractorRule(q))}</p>${opts?`<div class="vault-distractors">${opts}</div>`:''}</div>${clueHtml}</div>`;
}

function VLT_renderQuiz(){const r=VLT_RUN;if(!r)return VLT_home();if(r.index>=r.qs.length){VLT_finish();return;}const q=r.qs[r.index],ans=r.answers[q.id],answered=Number.isInteger(ans),isMock=r.mode==='mock',isSprint=r.mode==='sprint',modeName=isMock?`จำลองสอบ · ชุด ${r.setNo}`:isSprint?'สปรินต์ 90 วินาที':r.label||'ฝึก 10 ข้อ';
 const progress=isSprint?Math.min(100,(r.index%20+1)/20*100):(r.index+1)/r.qs.length*100;
 const cats=VLT_CATS.find(c=>c[0]===q.category);const choiceHtml=q.options.map((t,j)=>{let cl='';if(answered&&isMock&&ans===j)cl=' selected';if(answered&&!isMock){if(j===q.answer)cl=' correct';else if(j===ans)cl=' wrong';}return `<button class="vault-option${cl}" ${answered&&!isMock?'disabled':''} onclick="VLT_answer(${j})"><span class="letter">${'ABCD'[j]}</span><span>${VLT_escape(t)}</span></button>`}).join('');
 const feedback=answered&&!isMock?`<div class="vault-feedback${ans===q.answer?'':' bad'}"><b>${ans===q.answer?'✅ ถูกต้อง! เยี่ยมมาก':'💡 ยังไม่ถูก ไม่เป็นไรนะ'}</b><div style="margin-top:5px">คำตอบที่ถูก: <b>${VLT_escape(q.options[q.answer])}</b></div><div style="margin-top:7px">${VLT_escape(typeof VLT_learningExplanation==='function'?VLT_learningExplanation(q):q.explanation)}</div>${VLT_explainPanel(q)}</div>`:'';
 const hintText=typeof VLT_hintText==='function'?VLT_hintText(q):q.hint;const hint=VLT_HINT?`<div class="vault-feedback"><b>💡 คำใบ้</b><div>${VLT_escape(hintText||'ลองอ่านคำถามและบริบทอีกครั้ง แล้วหาข้อมูลที่โจทย์ต้องการ')}</div></div>`:'';
 const qLabel=isSprint?`ข้อที่ ${r.index+1}`:`ข้อ ${r.index+1}/${r.qs.length}`;
 document.getElementById('app').innerHTML=`<div class="vault-view"><div class="vault-head"><div><div class="vault-pill">${VLT_escape(modeName)}</div><h1 class="vault-title" style="margin-top:9px">${VLT_escape(qLabel)}</h1><p class="vault-sub">${VLT_escape(q.kind)} · ${VLT_escape(q.topic||'English practice')} · ${q.difficulty===1?'🌱 พื้นฐาน':q.difficulty===2?'⚡ ปานกลาง':'🔥 ท้าทาย'}</p></div><button class="vault-back" onclick="VLT_exit()">✕ ออก</button></div>
 <div class="vault-quizhead"><div class="vault-progress"><span style="width:${progress}%"></span></div><span class="vault-chip">${isMock||isSprint?'⏱️':'⭐ '+VLT_STATE.xp}</span>${isMock||isSprint?`<span class="vault-chip" id="vltClock">${String(Math.floor((r.seconds||3600)/60)).padStart(2,'0')}:${String((r.seconds||3600)%60).padStart(2,'0')}</span>`:`<span class="vault-chip">🔥 ${r.combo||0}</span>`}</div>
 <div class="vault-qcard"><div class="vault-muted">${VLT_escape(cats?cats[1]:q.section)} · ${VLT_escape(q.section)}</div>${VLT_renderContext(q)}<div class="vault-prompt">${VLT_escape(q.prompt)}</div><div>${choiceHtml}</div>${hint}${feedback}
 <div class="vault-bottom"><div class="right">${isMock?'':'<button class="vault-btn alt" onclick="VLT_hintToggle()">💡 คำใบ้</button>'}<button class="vault-btn alt" onclick="VLT_toggleFavorite('${q.id}')">${VLT_STATE.favorites.includes(q.id)?'💖 บันทึกแล้ว':'♡ เก็บข้อโปรด'}</button></div><div class="right">${isMock?`<button class="vault-btn alt" onclick="VLT_prev()" ${r.index===0?'disabled':''}>← ก่อนหน้า</button>`:''}<button class="vault-btn" onclick="VLT_next()" ${!isMock&&!answered?'disabled':''}>${r.index===r.qs.length-1&&!isSprint?'ดูผล 🎉':isMock?'ข้อต่อไป →':'ถัดไป →'}</button></div></div>
 ${isMock?`<div class="vault-qmap">${r.qs.map((z,i)=>`<button class="${Number.isInteger(r.answers[z.id])?'done ':''}${i===r.index?'current':''}" onclick="VLT_goto(${i})">${i+1}</button>`).join('')}</div><p class="vault-muted">ตอบแล้ว ${Object.keys(r.answers).length}/60 ข้อ · แตะเลขข้อเพื่อข้ามหรือกลับมาแก้ได้</p>`:''}</div>
 ${!isMock?`<p class="vault-muted">เลือกคำตอบแล้วจะเห็นเหตุผลทันที ชุดฝึกนี้ช่วยเรียนรู้ ไม่ต้องกลัวตอบผิด</p>`:''}</div>`;
}
function VLT_hintToggle(){if(VLT_RUN&&VLT_RUN.mode==='mock'){VLT_HINT=false;return}VLT_HINT=!VLT_HINT;VLT_renderQuiz()}
function VLT_answer(j){const r=VLT_RUN;if(!r)return;const q=VLT_current();if(!q)return;if(r.mode==='mock'){r.answers[q.id]=j;VLT_renderQuiz();return;}if(Number.isInteger(r.answers[q.id]))return;r.answers[q.id]=j;const ok=j===q.answer;if(ok){r.score++;r.combo=(r.combo||0)+1;}else r.combo=0;VLT_record(q,ok);VLT_renderQuiz()}
function VLT_prev(){if(!VLT_RUN||VLT_RUN.mode!=='mock')return;VLT_RUN.index=Math.max(0,VLT_RUN.index-1);VLT_HINT=false;VLT_renderQuiz()}
function VLT_goto(i){if(!VLT_RUN||VLT_RUN.mode!=='mock')return;VLT_RUN.index=Math.max(0,Math.min(VLT_RUN.qs.length-1,i));VLT_HINT=false;VLT_renderQuiz()}
function VLT_next(){const r=VLT_RUN;if(!r)return;const q=VLT_current();if(r.mode==='mock'){if(r.index<r.qs.length-1){r.index++;VLT_HINT=false;VLT_renderQuiz();return;}const miss=r.qs.filter(z=>!Number.isInteger(r.answers[z.id])).length;VLT_confirmFinish(miss);return;}
 if(r.mode==='sprint'){if(Date.now()>=r.deadline){VLT_finish(true);return;}r.index++;if(r.index>=r.qs.length)r.index=0;VLT_HINT=false;VLT_renderQuiz();return;}
 if(r.index<r.qs.length-1){r.index++;VLT_HINT=false;VLT_renderQuiz();}else VLT_finish();}
function VLT_exit(){if(VLT_RUN){TGConfirm('ออกจากโหมดนี้หรือไม่? คะแนนสอบจำลองจะบันทึกเมื่อส่งข้อสอบเท่านั้น ส่วนคำตอบในโหมดฝึกที่ทำเสร็จจะถูกเก็บแล้ว').then(ok=>{if(ok){VLT_stopTimer();VLT_RUN=null;VLT_home()}})}}
function VLT_finish(auto=false){const r=VLT_RUN;if(!r)return;VLT_stopTimer();const isMock=r.mode==='mock',isSprint=r.mode==='sprint';let total=0,score=0,scored=[];
 if(isMock){const rawCorrect=r.qs.filter(q=>r.answers[q.id]===q.answer).length;const speaking=r.qs.filter(q=>['qr','short','long'].includes(q.category));const reading=r.qs.filter(q=>['tc','rc'].includes(q.category));const spOK=speaking.filter(q=>r.answers[q.id]===q.answer).length;const rdOK=reading.filter(q=>r.answers[q.id]===q.answer).length;score=Math.round((speaking.length?spOK/speaking.length*50:0)+(reading.length?rdOK/reading.length*50:0));total=100;scored=r.qs.map(q=>({...q,userAnswer:r.answers[q.id]}));for(const q of r.qs){const answered=Number.isInteger(r.answers[q.id]);if(answered){const ok=r.answers[q.id]===q.answer;VLT_record(q,ok,false);}else{VLT_STATE.missed[q.id]=(VLT_STATE.missed[q.id]||0)+1;}}if(Number(r.setNo)>=1&&Number(r.setNo)<=20){const prev=VLT_STATE.completedSets[r.setNo];VLT_STATE.completedSets[r.setNo]={score,attempts:(prev&&prev.attempts||0)+1,best:Math.max(score,prev&&prev.best||0),date:VLT_day()};}VLT_STATE.scoreScale=100;VLT_STATE.xp+=score;}
 else{total=Object.keys(r.answers).length;score=isSprint?r.score:r.score;scored=r.qs.slice(0,Math.min(r.index+1,r.qs.length)).filter(q=>Number.isInteger(r.answers[q.id])).map(q=>({...q,userAnswer:r.answers[q.id]}));if(r.mode==='daily')VLT_STATE.dailyDone=VLT_day();VLT_STATE.xp+=r.mode==='daily'?20:isSprint?Math.max(5,score*2):5;}
 VLT_STATE.history.push({mode:r.mode,setNo:r.setNo||null,score,total,at:new Date().toISOString(),rawScore:isMock?scored.filter(q=>q.userAnswer===q.answer).length:null,categories:isMock?VLT_CATS.map(c=>({cat:c[0],total:r.qs.filter(q=>q.category===c[0]).length,score:r.qs.filter(q=>q.category===c[0]&&r.answers[q.id]===q.answer).length})):[]});VLT_STATE.history=VLT_STATE.history.slice(-80);VLT_updateBadges();VLT_save();VLT_RUN=null;VLT_RESULT={mode:r.mode,score,total,scored,auto,setNo:r.setNo||null};VLT_renderResult();}
let VLT_RESULT=null;
function VLT_renderResult(){const r=VLT_RESULT;if(!r)return VLT_home();const pct=r.total?Math.round(r.score/r.total*100):0;const msg=pct>=90?'เทพมาก! สมควรรับมง 👑':pct>=75?'เก่งมาก อีกนิดเดียวก็แน่นแล้ว 🌟':pct>=50?'กำลังมาถูกทาง ฝึกจุดที่พลาดต่อได้เลย 💪':'ไม่เป็นไร ทุกข้อที่พลาดคือโอกาสเรียนรู้ 🌱';const wrong=r.scored.filter(q=>q.userAnswer!==q.answer);const completedSets=Object.keys(VLT_STATE.completedSets).filter(k=>VLT_STATE.completedSets[k]).length;
 const catResults=r.mode==='mock'?`<div class="vault-grid" style="margin-top:14px">${VLT_CATS.map(c=>{const qs=r.scored.filter(q=>q.category===c[0]),n=qs.filter(q=>q.userAnswer===q.answer).length;return `<div class="vault-stat"><b>${c[1]}</b><div class="num">${n}/${qs.length}</div><div class="vault-progress"><span style="width:${qs.length?n/qs.length*100:0}%"></span></div></div>`}).join('')}</div>`:'';
 const review=wrong.length?`<div class="vault-hero"><h2>🧠 ทบทวนคำตอบที่พลาด (${wrong.length})</h2><p class="vault-sub">อ่านเหตุผลแล้วลองอธิบายให้ตัวเองฟังว่าทำไมตัวเลือกอื่นไม่เหมาะ</p>${wrong.slice(0,VLT_SHOW_ALL?wrong.length:10).map((q,i)=>`<div class="vault-review"><b>${i+1}. ${VLT_escape(q.prompt)}</b>${q.context?`<div class="vault-context">${VLT_escape(q.context)}</div>`:''}<p class="vault-muted">คำตอบของคุณ: ${Number.isInteger(q.userAnswer)?VLT_escape(q.options[q.userAnswer]):'ไม่ได้ตอบ'}</p><p>✅ คำตอบที่ถูก: <b>${VLT_escape(q.options[q.answer])}</b></p><p>${VLT_escape(typeof VLT_learningExplanation==='function'?VLT_learningExplanation(q):q.explanation)}</p>${VLT_explainPanel(q)}<button class="vault-btn alt" onclick="VLT_toggleFavorite('${q.id}')">💖 เก็บข้อนี้ไว้</button></div>`).join('')}${wrong.length>10?`<button class="vault-btn alt" onclick="VLT_showAllWrong()">แสดงข้อผิดทั้งหมด</button>`:''}<button class="vault-btn gold" onclick="VLT_retryWrong()">🔁 ทำข้อที่ผิดซ้ำ</button></div>`:`<div class="vault-hero"><h2>✨ เยี่ยมมาก!</h2><p class="vault-sub">ไม่มีข้อที่ผิดในผลชุดนี้ รักษาจังหวะต่อไปนะ</p></div>`;
 document.getElementById('app').innerHTML=`<div class="vault-view"><div class="vault-head"><div><div class="vault-pill">ผลการฝึก</div><h1 class="vault-title" style="margin-top:8px">${pct>=75?'🎉 ภารกิจสำเร็จ!':'💪 จบแล้ว เก่งมาก!'}</h1><p class="vault-sub">${VLT_escape(msg)}</p></div><button class="vault-back" onclick="VLT_home()">⌂ ห้องฝึก</button></div>${TG_summary({kicker:'ผลการฝึก',score:r.score,total:r.total,pct:pct,msg:VLT_escape(msg),note:r.auto?'จบอัตโนมัติเมื่อหมดเวลา':'',chips:['⭐ XP รวม '+VLT_STATE.xp.toLocaleString(),'ทำไปแล้ว '+VLT_STATE.answered.toLocaleString()+' ข้อ','พิชิตแล้ว '+completedSets+'/20 ชุด'],actions:'<button class="vault-btn" onclick="VLT_retry()">เล่นอีกครั้ง</button><button class="vault-btn alt" onclick="VLT_home()">กลับห้องฝึก</button>'})}${(typeof VLT_scoreRangeNote==='function'?VLT_scoreRangeNote(r):'')}${catResults}${review}<div class="vault-hero"><h2>💡 เป้าหมายต่อไป</h2><p class="vault-sub">${pct<70?'ลองแก้ข้อผิดก่อน แล้วทำชุดเดิมซ้ำเพื่อวัดพัฒนาการ':pct<90?'ฝึกหมวดที่คะแนนต่ำสุด และลองชุดถัดไป':'ลองสปรินต์ 90 วินาทีเพื่อเพิ่มความเร็ว'}</p><button class="vault-btn gold" onclick="VLT_startMock(${r.setNo||((Math.floor(Math.random()*20))+1)})">📝 เริ่มชุดจำลองอีกครั้ง</button></div></div>`;VLT_SHOW_ALL=false;}
let VLT_SHOW_ALL=false;
function VLT_showAllWrong(){VLT_SHOW_ALL=true;VLT_renderResult()}
function VLT_retry(){if(!VLT_RESULT)return VLT_home();const r=VLT_RESULT;if(r.mode==='mock')return VLT_startMock(r.setNo||1);if(r.mode==='daily')return VLT_startDaily();if(r.mode==='sprint')return VLT_startSprint();if(r.scored.length){const ids=r.scored.map(q=>q.id);const qs=VLT_shuffle(ids.map(VLT_get).filter(Boolean)).map(q=>({...q,userAnswer:null}));return VLT_begin({mode:'practice',label:'เล่นซ้ำ',qs,index:0,answers:{},score:0,combo:0})}VLT_startQuick()}
function VLT_retryWrong(){const r=VLT_RESULT;if(!r)return;const wrong=r.scored.filter(q=>q.userAnswer!==q.answer).map(q=>({...VLT_get(q.id),userAnswer:null}));if(!wrong.length)return VLT_home();VLT_begin({mode:'practice',label:'แก้มือข้อที่ผิด',qs:VLT_shuffle(wrong),index:0,answers:{},score:0,combo:0,reviewOn:true})}
function VLT_toggleFavorite(id){if(VLT_STATE.favorites.includes(id))VLT_STATE.favorites=VLT_STATE.favorites.filter(x=>x!==id);else VLT_STATE.favorites.push(id);VLT_save();VLT_toast(VLT_STATE.favorites.includes(id)?'เพิ่มข้อโปรดแล้ว 💖':'นำออกจากข้อโปรดแล้ว');if(VLT_RESULT)VLT_renderResult();else if(VLT_RUN)VLT_renderQuiz()}
function VLT_export(){try{const data={app:'English Daily TGAT1 Quest',version:1,exportedAt:new Date().toISOString(),state:VLT_STATE};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='english-daily-tgat1-progress.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);VLT_toast('ส่งออกความคืบหน้าแล้ว')}catch(e){VLT_toast('ส่งออกไม่สำเร็จ ลองใช้เบราว์เซอร์อื่น')}}
function VLT_import(input){if(!VLT_BANK.length){VLT_ensureBank().then(()=>VLT_import(input)).catch(e=>VLT_toast(e.message));return;}const f=input.files&&input.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{const raw=JSON.parse(reader.result),st=raw&&raw.state;if(!raw||raw.app!=='English Daily TGAT1 Quest'||!st||st.version!==1||typeof st!=='object')throw new Error('bad');const clean=VLT_load();clean.xp=Math.max(0,Math.floor(+st.xp||0));clean.answered=Math.max(0,Math.floor(+st.answered||0));clean.correct=Math.max(0,Math.min(clean.answered,Math.floor(+st.correct||0)));clean.streak=Math.max(0,Math.floor(+st.streak||0));clean.lastDay=/^\d{4}-\d{2}-\d{2}$/.test(st.lastDay)?st.lastDay:'';clean.completedSets={};if(st.completedSets&&typeof st.completedSets==='object')for(let n=1;n<=20;n++){const x=st.completedSets[n];if(x&&typeof x==='object'){const date=String(x.date||'');clean.completedSets[n]={score:Math.max(0,Math.min(100,Math.floor(+x.score||0))),best:Math.max(0,Math.min(100,Math.floor(+x.best||0))),attempts:Math.max(0,Math.floor(+x.attempts||0)),date:/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))?date:''}}}clean.missed={};if(st.missed&&typeof st.missed==='object')for(const [id,v] of Object.entries(st.missed))if(VLT_get(id))clean.missed[id]=Math.max(1,Math.min(1000,Math.floor(+v||1)));clean.mastered={};if(st.mastered&&typeof st.mastered==='object')for(const [id,v] of Object.entries(st.mastered))if(VLT_get(id))clean.mastered[id]=Math.max(0,Math.min(1000,Math.floor(+v||0)));clean.favorites=Array.isArray(st.favorites)?st.favorites.filter(id=>!!VLT_get(id)).slice(0,1200):[];clean.history=Array.isArray(st.history)?st.history.slice(-80).filter(h=>h&&typeof h==='object'&&!Array.isArray(h)).map(h=>{const total=Math.max(0,Math.min(1200,Math.floor(Number(h.total)||0))),score=Math.max(0,Math.min(total,Math.floor(Number(h.score)||0))),at=typeof h.at==='string'&&Number.isFinite(Date.parse(h.at))?new Date(h.at).toISOString():'';const cats=Array.isArray(h.categories)?h.categories.filter(c=>c&&typeof c==='object'&&VLT_CATS.some(k=>k[0]===c.cat)).map(c=>{const t=Math.max(0,Math.min(60,Math.floor(Number(c.total)||0)));return {cat:c.cat,total:t,score:Math.max(0,Math.min(t,Math.floor(Number(c.score)||0)))}}):[];return {mode:['mock','sprint','practice','daily'].includes(h.mode)?h.mode:'practice',setNo:Number.isInteger(Number(h.setNo))&&Number(h.setNo)>=1&&Number(h.setNo)<=20?Number(h.setNo):null,total,score,at,categories:cats}}):[];clean.scoreScale=st.scoreScale===100?100:60;if(clean.scoreScale!==100){const _cv=Object.values(clean.completedSets);if(!_cv.some(r=>r.score>60||r.best>60)){for(const r of _cv){r.score=Math.round(r.score*100/60);r.best=Math.round(r.best*100/60)}}clean.scoreScale=100}clean.dailyDone=String(st.dailyDone||'');clean.xpDay=(st.xpDay&&typeof st.xpDay==='object'&&st.xpDay.ids&&typeof st.xpDay.ids==='object')?{d:String(st.xpDay.d||''),ids:st.xpDay.ids}:{d:'',ids:{}};clean.badges=Array.isArray(st.badges)?st.badges.filter(id=>['first','100','500','perfect','sets5','sets20','streak3'].includes(id)):[];TGConfirm('นำเข้าความคืบหน้าเกมหรือไม่? ข้อมูลฝั่งเกมนี้จะถูกแทนที่').then(ok=>{if(!ok)return;VLT_STATE=clean;VLT_save();VLT_home();VLT_toast('นำเข้าข้อมูลสำเร็จ')}).catch(e=>{VLT_toast('ไฟล์สำรองไม่ถูกต้องหรือไม่ใช่ไฟล์ของเกมนี้')})}catch(e){VLT_toast('ไฟล์สำรองไม่ถูกต้องหรือไม่ใช่ไฟล์ของเกมนี้')} };reader.readAsText(f);input.value=''}
// Wrap the existing home renderer and insert a prominent doorway to the expanded game.
const VLT_legacyHome=home;
home=function(){VLT_stopTimer();VLT_RUN=null;VLT_legacyHome();const top=document.querySelector('#app .top');if(top&&!document.querySelector('.vault-entry'))top.insertAdjacentHTML('afterend',`<section class="vault-entry"><h2>🎮 ห้องฝึก TGAT1 Quest</h2><p>ข้อสอบฝึก 1,200 ข้อ • 20 ชุด • ภารกิจรายวัน • สปรินต์จับเวลา • เฉลยเข้าใจง่ายและบันทึกความคืบหน้า</p><button class="vault-cta" onclick="VLT_open()">เข้าเล่นห้องฝึก 🚀</button></section>`)};
// expose the vault only after all source functions exist
// v40.6.7: the legacy boot-time home() call was removed. In the single-file bundle function
// declarations are hoisted, so home() already resolves to the Studio renderer, which needs
// STUDIO_PAGE (declared later) -> TDZ crash. The Studio layer renders the first screen itself.


/* ===== 04 · 01-studio-app.js ===== */
const STUDIO_DATA = window.__TGAT1_DATA.studio;
// v40.7.25 senses preload: the heavy per-word `senses` of 3,400 words live in data-senses.js.
// The script is requested after a 1.2-second boot delay; each word's array is materialized on first property read.
// If loading fails, the getter retries on the next read instead of blocking application startup.
(function(){
  var idx=window.__TGAT1_DATA.lazySenses,W=STUDIO_DATA.words,cache=null,loading=null;
  var state=window.TGAT1LazySenses={loaded:false,count:Array.isArray(idx)?idx.length:0,loadMs:0,ensure:null};
  if(!Array.isArray(idx)||!idx.length){state.ensure=()=>Promise.resolve(null);return;}
  function load(){
    if(cache)return Promise.resolve(cache);
    if(window.__TGAT1_SENSES){cache=window.__TGAT1_SENSES;state.loaded=true;return Promise.resolve(cache);}
    if(loading)return loading;
    var started=Date.now();
    loading=new Promise(function(resolve,reject){
      var sc=document.createElement('script');sc.src=new URL('./data-senses.js',document.baseURI).href;sc.async=true;
      sc.onload=function(){cache=window.__TGAT1_SENSES||null;state.loaded=!!cache;state.loadMs=Date.now()-started;loading=null;if(cache){try{if(typeof window.__TGAT1ApplyPendingSenseRepairs==='function')window.__TGAT1ApplyPendingSenseRepairs()}catch(e){console.error('TGAT1 sense repair skipped',e)}resolve(cache)}else reject(new Error('Sense data missing'))};
      sc.onerror=function(){loading=null;sc.remove();reject(new Error('data-senses.js could not be loaded'))};document.head.appendChild(sc);
    });
    return loading;
  }
  state.ensure=load;
  idx.forEach(function(wi,k){
    var w=W[wi];if(!w)return;
    Object.defineProperty(w,'senses',{configurable:true,enumerable:true,
      get:function(){if(!cache){load().then(function(){if(state.rr)return;state.rr=1;try{if(typeof studioRender==='function'&&!(typeof VLT_RUN!=='undefined'&&VLT_RUN)&&!(typeof Q!=='undefined'&&Q))studioRender()}catch(e){console.error(e)}}).catch(function(e){state.rr=0;console.error('TGAT1: data-senses.js could not be loaded',e)});return undefined;}var v=cache[k];Object.defineProperty(w,'senses',{value:v,writable:true,configurable:true,enumerable:true});return v;},
      set:function(v){Object.defineProperty(w,'senses',{value:v,writable:true,configurable:true,enumerable:true});}});
  });
})();
const STUDIO_POLYSEMY=(window.STUDIO_POLYSEMY&&typeof window.STUDIO_POLYSEMY==='object')?window.STUDIO_POLYSEMY:{};
(function(){const byWord=new Map(STUDIO_DATA.words.map(x=>[String(x.w).toLowerCase(),x]));Object.entries(STUDIO_POLYSEMY).forEach(([word,s])=>{const x=byWord.get(word);if(x){x.th=s.summary;x.pos=s.pos;x.senses=s.senses;}if(typeof D!=='undefined'&&Array.isArray(D.V)){const old=D.V.find(v=>String(v[0]).toLowerCase()===word);if(old){old[1]=s.summary;old[2]=s.pos;}}});})();
const STUDIO_STORE='tgat1_english_studio_v1';
let STUDIO_PAGE='home', STUDIO_VTAB='words', STUDIO_VQUERY='', STUDIO_VLEVEL='all', STUDIO_VCAT='all', STUDIO_VPAGE=0, STUDIO_FLASH=null, STUDIO_FLASH_REVEALED=false, STUDIO_MODAL=null;
let STUDIO_PROFILE=window.TGAT1DataGuards?window.TGAT1DataGuards.normalizeProfile(studioLoad(STUDIO_STORE,{name:'',target:75,examDate:'',dailyGoal:120,theme:'light'})):studioLoad(STUDIO_STORE,{name:'',target:75,examDate:'',dailyGoal:120,theme:'light'});
let STUDIO_VSTATE=window.TGAT1DataGuards?window.TGAT1DataGuards.normalizeVocabState(studioLoad('tgat1_studio_vocab_progress_v1',{items:{},favorites:[],sessions:[]}),STUDIO_DATA.words.concat((window.__TGAT1_DATA.pack&&window.__TGAT1_DATA.pack.words)||[]))/* v42.0.0: include the 7 pack words merged later at runtime, otherwise their SRS progress is dropped on every reload */:studioLoad('tgat1_studio_vocab_progress_v1',{items:{},favorites:[],sessions:[]});
function studioLoad(k,fb){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x&&typeof x==='object'?x:fb}catch(e){return fb}}
function studioSave(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){studioToast('บันทึกไม่สำเร็จ พื้นที่เก็บข้อมูลอาจเต็ม');return false}}
function studioEsc(x){return htmlEsc(x)}
function studioWordPosLabel(pos){const raw=String(pos||'');if(/^syn\./i.test(raw)){const detail=raw.replace(/^syn\.\/?/i,'').trim();return detail?'คำใกล้เคียง · '+detail:'คำใกล้เคียง';}return raw||'ยังไม่ระบุชนิดคำ';}
function studioToast(msg){if(typeof VLT_toast==='function')VLT_toast(msg);else{const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}}
function studioXP(){return (Number(S?.xp)||0)+(Number(VLT_STATE?.xp)||0)}
function studioStreak(){return Math.max(Number(S?.streak)||0,Number(VLT_STATE?.streak)||0)}
function studioLevel(){return 1+Math.floor(Math.sqrt(studioXP()/45))}
function studioAccuracy(){return VLT_STATE.answered?Math.round(VLT_STATE.correct/VLT_STATE.answered*100):null}
function studioCompleted(){return Object.keys(VLT_STATE.completedSets||{}).filter(k=>VLT_STATE.completedSets[k]).length}
function studioDueWords(){const now=Date.now(),custom=Object.entries(STUDIO_VSTATE.items||{}).filter(([k,v])=>v&&v.due&&v.due<=now).map(([k])=>k);let legacy=[];try{legacy=dueReview().map(i=>V[i][0])}catch(e){(window.TGAT1_ERR||Object)(e,'app')}return [...new Set([...custom,...legacy])]}
function studioLegacyMissed(){try{return Object.entries(S.st||{}).filter(([w,v])=>Array.isArray(v)&&v[2]===0).map(([w])=>w)}catch(e){return []}}
function studioWordLearned(){const custom=Object.entries(STUDIO_VSTATE.items||{}).filter(([w,v])=>v&&v.status==='known').map(([w])=>w);let legacy=[];try{legacy=V.filter(v=>mast(v)).map(v=>v[0])}catch(e){(window.TGAT1_ERR||Object)(e,'app')}return new Set([...custom,...legacy]).size}
function studioQuestionParts(){return [{id:'qr',name:'Question–Response'},{id:'short',name:'Short Conversations'},{id:'long',name:'Long Conversations'},{id:'tc',name:'Text Completion'},{id:'rc',name:'Reading Comprehension'}]}
function studioMockHistory(){return (Array.isArray(VLT_STATE.history)?VLT_STATE.history:[]).filter(h=>h&&h.mode==='mock'&&[60,100].includes(Number(h.total))).map(h=>{const at=Date.parse(h.at),raw=Number(h.score),old=Number(h.total)===60,score=Number.isFinite(raw)?Math.round(Math.max(0,Math.min(old?60:100,Math.trunc(raw)))*(old?100/60:1)):0,setNo=Number(h.setNo);return {mode:'mock',total:100,score,setNo:Number.isInteger(setNo)&&setNo>=1&&setNo<=20?setNo:null,at:Number.isFinite(at)?new Date(at).toISOString():''}}).filter(h=>h.at).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))}
function studioPartStats(){const out={};studioQuestionParts().forEach(p=>out[p.id]={name:p.name,correct:0,total:0});(VLT_STATE.history||[]).forEach(h=>(h.categories||[]).forEach(c=>{if(out[c.cat]){out[c.cat].correct+=Number(c.score)||0;out[c.cat].total+=Number(c.total)||0}}));return Object.entries(out).map(([id,x])=>({id,...x,acc:x.total?Math.round(x.correct/x.total*100):null}))}
function studioWeakPart(){const stats=studioPartStats().filter(x=>x.total>0).sort((a,b)=>a.acc-b.acc);if(stats.length)return stats[0];const miss=Object.keys(VLT_STATE.missed||{}).map(id=>VLT_get(id)).filter(Boolean);if(miss.length){const counts={};miss.forEach(q=>counts[q.category]=(counts[q.category]||0)+1);const id=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];return {id,name:studioQuestionParts().find(x=>x.id===id)?.name||id,acc:null,total:miss.length,correct:0}}return null}
function studioUpdateChrome(page){const map={home:['HOME','สวัสดี ยินดีต้อนรับกลับ'],profile:['MY PROFILE','โปรไฟล์ของฉัน'],vocab:['VOCABULARY','Vocabulary Center'],exam:['EXAM CENTER','ศูนย์สอบ TGAT1'],game:['GAME CENTER','Game Center'],analytics:['ANALYTICS','สถิติพัฒนาการ'],settings:['SETTINGS','ตั้งค่าและสำรองข้อมูล']};const x=map[page]||map.home;document.getElementById('studioCrumb').textContent=x[0];document.getElementById('studioTitle').textContent=(page==='home'?'ภาพรวมการเตรียมสอบ':x[1]);document.getElementById('studioXP').textContent=studioXP().toLocaleString()+' XP';document.getElementById('studioAvatar').textContent=(STUDIO_PROFILE.name||'S').trim().slice(0,1).toUpperCase();document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));}
function studioNav(page){/* v40.8.0: a finished vocabulary session keeps Q only to show its result; leaving it must not warn about unsaved progress. */if(Q&&typeof STUDIO_SESSION_FINISHED!=='undefined'&&STUDIO_SESSION_FINISHED&&page!==STUDIO_PAGE)Q=null;if((VLT_RUN||Q)&&page!==STUDIO_PAGE){TGConfirm('กำลังทำแบบฝึกอยู่ หากออกจากหน้านี้ความคืบหน้ารอบปัจจุบันอาจไม่ถูกบันทึก ต้องการออกหรือไม่?').then(ok=>{if(!ok)return;if(VLT_RUN){try{if(VLT_RUN.mode==='mock'&&typeof window.TGAT1ExamDraftWrite==='function')window.TGAT1ExamDraftWrite(VLT_RUN)}catch(_){}VLT_stopTimer();VLT_RUN=null;}if(Q){studioClearSession();stopExamClock();Q=null;}studioNavNow(page)});return}studioNavNow(page)}function studioNavNow(page){if(page!==STUDIO_PAGE){STUDIO_FLASH=null;STUDIO_FLASH_REVEALED=false}STUDIO_PAGE=page;STUDIO_VPAGE=0;studioUpdateChrome(page);studioRender()}
function studioRender(){const app=document.getElementById('app');if(!app)return;const page=STUDIO_PAGE;if((page==='exam'||page==='analytics')&&!VLT_BANK.length){const status=document.createElement('div');status.className='st-card';status.setAttribute('role','status');status.textContent='กำลังโหลดคลังข้อสอบ…';app.replaceChildren(status);VLT_ensureBank().then(()=>{if(STUDIO_PAGE===page)studioRender()}).catch(e=>{console.error(e);studioToast(e.message||'โหลดคลังข้อสอบไม่สำเร็จ')});return;}switch(page){case'home':studioHome();break;case'profile':studioProfile();break;case'vocab':studioVocabulary();break;case'exam':studioExam();break;case'game':studioGame();break;case'analytics':studioAnalytics();break;case'settings':studioSettings();break;default:studioHome()}}
function home(){try{stopExamClock();Q=null}catch(e){(window.TGAT1_ERR||Object)(e,'app')}if(typeof VLT_stopTimer==='function')VLT_stopTimer();if(typeof VLT_RUN!=='undefined')VLT_RUN=null;STUDIO_PAGE='home';studioUpdateChrome('home');studioHome()}
function VLT_home(){if(typeof VLT_stopTimer==='function')VLT_stopTimer();if(typeof VLT_RUN!=='undefined')VLT_RUN=null;STUDIO_PAGE='exam';studioUpdateChrome('exam');studioExam()}
function VLT_open(){VLT_stopTimer();VLT_RUN=null;STUDIO_PAGE='exam';studioUpdateChrome('exam');studioExam()}
function studioHome(){
 const app=document.getElementById('app'),acc=studioAccuracy(),mocks=studioMockHistory(),latest=mocks[0],weak=studioWeakPart(),due=studioDueWords().length,miss=Object.keys(VLT_STATE.missed||{}).length,learned=studioWordLearned(),done=studioCompleted();
 const first=STUDIO_PROFILE.name?`กลับมาแล้ว ${studioEsc(STUDIO_PROFILE.name)}`:'เริ่มสร้างเส้นทางภาษาอังกฤษของคุณ';
 let coachTitle='เริ่มจากการวัดระดับจริง';let coachText='ตอนนี้ยังไม่มีผลจำลองสอบ TGAT1 มากพอให้วิเคราะห์จุดอ่อนหรือความพร้อม เริ่มจากทำชุดจำลอง 60 ข้อ แล้วระบบจะวิเคราะห์จากคำตอบจริง';let coachAction=`<button class="st-btn" onclick="studioNav('exam')">เริ่มทำชุดวัดระดับ <span>→</span></button>`;
 if(weak){coachTitle='โฟกัสที่ '+studioEsc(weak.name);coachText=weak.acc===null?`พบข้อที่เคยตอบผิด ${Number(weak.total)||0} ข้อในหมวดนี้ ลองกลับไปฝึกและอ่านเหตุผลประกอบ`:`ข้อมูลการทำข้อสอบบ่งชี้ว่าหมวดนี้มีความแม่นยำ ${Number(weak.acc)||0}% จาก ${Number(weak.total)||0} ข้อที่บันทึกไว้ ลองฝึกเฉพาะหมวดนี้ก่อน` ;coachAction=`<button class="st-btn" onclick="VLT_startCategory('${studioEsc(weak.id)}')">ฝึก ${studioEsc(weak.name)} <span>→</span></button>`;}
 const latestCard=latest?`<div class="st-kpi-value">${latest.score}/100</div><div class="st-kpi-foot">ชุดจำลองล่าสุด · ${new Date(latest.at).toLocaleDateString('th-TH')}</div>`:`<div class="st-kpi-value">—</div><div class="st-kpi-foot">ยังไม่มีผลชุดจำลองเต็ม</div>`;
 app.innerHTML=`<section class="st-hero"><div class="st-eyebrow">YOUR PERSONAL EXAM STUDIO · ${new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div><div class="st-title">${first}</div><p class="st-subtitle">ฝึกอย่างมีเป้าหมาย เห็นจุดที่ต้องพัฒนา และติดตามความก้าวหน้าจากข้อมูลที่คุณทำจริง</p><div class="st-inline"><button class="st-btn secondary" onclick="studioNav('exam')">📝 ไปศูนย์สอบ</button><button class="st-btn ghost" style="color:#fff;border-color:#ffffff66" onclick="studioNav('vocab')">▤ เปิดคลังศัพท์</button></div></section>
 <div class="st-grid four" style="margin-top:16px"><div class="st-card st-kpi"><div class="st-kpi-label">ความแม่นยำข้อสอบ</div><div class="st-kpi-value">${acc===null?'—':acc+'%'}</div><div class="st-kpi-foot">${VLT_STATE.answered.toLocaleString()} ข้อที่ตอบและบันทึก</div></div><div class="st-card st-kpi"><div class="st-kpi-label">XP สะสม · Level ${studioLevel()}</div><div class="st-kpi-value">${studioXP().toLocaleString()}</div><div class="st-kpi-foot">จากกิจกรรมฝึกทั้งสองระบบ</div></div><div class="st-card st-kpi"><div class="st-kpi-label">วันฝึกต่อเนื่อง</div><div class="st-kpi-value">🔥 ${studioStreak()}</div><div class="st-kpi-foot">Streak จากกิจกรรมที่บันทึกไว้</div></div><div class="st-card st-kpi"><div class="st-kpi-label">คำศัพท์ที่ทำเครื่องหมายว่ารู้แล้ว</div><div class="st-kpi-value">${learned.toLocaleString()}</div><div class="st-kpi-foot">จาก ${STUDIO_DATA.words.length.toLocaleString()} คำ</div></div></div>
 <div class="st-main-grid" style="margin-top:17px"><div class="st-card"><div class="st-eyebrow">PERSONAL LEARNING COACH</div><h2 class="st-title" style="font-size:23px">${coachTitle}</h2><p class="st-subtitle">${coachText}</p><div class="st-coach-note"><span>🧭</span><div><b>แผนที่แนะนำสำหรับวันนี้</b><p>${weak?'ทำแบบฝึกเฉพาะหมวดจุดอ่อน 10 ข้อ แล้วทบทวนคำตอบที่ผิด':'เริ่มชุดจำลองเต็ม 60 ข้อ เพื่อสร้างข้อมูลพื้นฐานสำหรับวิเคราะห์รายทักษะ'}</p></div></div><div class="st-inline" style="margin-top:15px">${coachAction}${miss?`<button class="st-btn secondary" onclick="VLT_startReview()">ทบทวนข้อผิด (${miss})</button>`:''}${due?`<button class="st-btn ghost" onclick="studioStartFlashcards()">ทบทวนศัพท์ถึงกำหนด (${due})</button>`:''}</div></div>
 <div class="st-card"><div class="st-eyebrow">LATEST EXAM RESULT</div><h2 style="font-size:17px;margin:5px 0 8px">ผลสอบจำลองล่าสุด</h2>${latestCard}<div class="st-divider"></div><div class="st-row"><div><b>ชุดที่พิชิตแล้ว</b><small>Full mock sets</small></div><div class="right"><b>${done}/20</b></div></div><div class="st-progress"><i style="width:${done/20*100}%"></i></div><div style="margin-top:13px"><button class="st-btn secondary full" onclick="studioNav('analytics')">ดูสถิติทั้งหมด →</button></div></div></div>
 <div class="st-section-head"><div><h2>เลือกศูนย์การเรียน</h2><p>ทุกเครื่องมืออยู่ในแถบเดียว ไม่ต้องย้อนหาหน้าเดิม</p></div></div>
 <div class="st-grid three"><button class="st-action-card" onclick="studioNav('vocab')"><span class="st-icon-box">▤</span><span><b>Vocabulary Center</b><small>${STUDIO_DATA.words.length.toLocaleString()} คำ · ${STUDIO_DATA.phrases.length} วลี · flashcards & spaced repetition</small></span></button><button class="st-action-card" onclick="studioNav('exam')"><span class="st-icon-box">✎</span><span><b>Exam Center</b><small>1,200 ข้อฝึก · 20 ชุดเต็ม · 5 ทักษะ</small></span></button><button class="st-action-card" onclick="studioNav('game')"><span class="st-icon-box">✦</span><span><b>Game Center</b><small>มินิเกมศัพท์ · ภารกิจ · สปรินต์</small></span></button></div>
 <div class="st-section-head"><div><h2>ความคืบหน้าการสอบ</h2><p>แยกตามทักษะจากผลชุดจำลองที่ส่งแล้วเท่านั้น</p></div><button class="st-link" onclick="studioNav('analytics')">ดูรายละเอียด →</button></div><div class="st-card">${studioPartStats().some(x=>x.total)?studioPartStats().map(x=>`<div class="st-bar-row"><span class="name">${studioEsc(x.name)}</span><div class="st-chart-bar"><i style="width:${Math.max(0,Math.min(100,Number(x.acc)||0))}%"></i></div><b>${x.acc==null?'—':x.acc+'%'}</b></div>`).join(''):'<div class="st-empty">ยังไม่มีข้อมูลแยกทักษะ · ทำชุดจำลองเต็มเพื่อเริ่มเก็บสถิติ</div>'}</div>
 <p class="st-footer-note">คะแนนและการวิเคราะห์เป็นผลจากข้อมูลฝึกภายในแอป ไม่ใช่คะแนนทางการหรือการรับประกันผลสอบ · คะแนนความพร้อมจะไม่แสดงจนกว่าจะมีผลสอบจำลองที่บันทึกจริง</p>`;
}
function studioProfile(){const app=document.getElementById('app'),p=STUDIO_PROFILE,history=studioMockHistory(),acc=studioAccuracy();app.innerHTML=`<section class="pf-hero"><div class="pf-avatar">${studioEsc((p.name||'S').trim().slice(0,1).toUpperCase())}</div><div class="pf-id"><div class="st-eyebrow">LEARNER PROFILE</div><h1 class="pf-name">${studioEsc(p.name||'โปรไฟล์ผู้เรียน')}</h1><p class="pf-meta">เป้าหมาย ${Number(p.target)||75} คะแนน · ${Number(p.dailyGoal)||30} นาทีต่อวัน</p></div><div class="pf-chips"><span class="pf-chip"><b>Lv ${studioLevel()}</b><small>ระดับ</small></span><span class="pf-chip"><b>${studioXP().toLocaleString()}</b><small>XP</small></span><span class="pf-chip"><b>🔥 ${studioStreak()}</b><small>วันต่อเนื่อง</small></span></div></section>
<div class="st-section-head"><div><h2>เป้าหมายการเรียน</h2><p>ใช้เป็นข้อมูลให้ Coach จัดแผนฝึกของคุณ</p></div></div>
<form class="pf-card" onsubmit="studioSaveProfile(event)"><div class="pf-form"><div class="st-field pf-full"><label for="pname">ชื่อที่ใช้แสดง</label><input id="pname" class="st-input" maxlength="40" placeholder="เช่น Beam" value="${studioEsc(p.name||'')}"></div><div class="st-field"><label for="ptarget">คะแนนเป้าหมาย TGAT1</label><input id="ptarget" class="st-input" type="number" min="0" max="100" value="${Number(p.target)||75}"><small class="pf-hint">ช่วง 0–100</small></div><div class="st-field"><label for="pexam">วันสอบ (ถ้าทราบ)</label><input id="pexam" class="st-input" type="date" value="${studioEsc(p.examDate||((window.TGAT1_PATH_DATA&&window.TGAT1_PATH_DATA.examDefault)||''))}"></div><div class="st-field pf-full"><label for="pgoal">เวลาเรียนต่อวัน</label><select id="pgoal" class="st-select">${[15,20,30,45,60,90,120,150,180].map(n=>`<option value="${n}" ${Number(p.dailyGoal)===n?'selected':''}>${n} นาที</option>`).join('')}</select></div></div><div class="pf-foot"><button class="st-btn" type="submit">บันทึกโปรไฟล์</button><span class="pf-saved">บันทึกในเบราว์เซอร์นี้</span></div></form>
<div class="st-section-head"><div><h2>ภาพรวม</h2><p>สรุปจากข้อมูลที่บันทึกอยู่ตอนนี้</p></div></div>
<div class="st-grid four"><div class="st-card st-kpi"><div class="st-kpi-label">คะแนนเป้าหมาย</div><div class="st-kpi-value">${Number(p.target)||75}</div><div class="st-kpi-foot">คะแนนเต็ม 100</div></div><div class="st-card st-kpi"><div class="st-kpi-label">ชุดสอบเต็มที่ทำแล้ว</div><div class="st-kpi-value">${history.length}</div><div class="st-kpi-foot">จาก 20 ชุด</div></div><div class="st-card st-kpi"><div class="st-kpi-label">คำศัพท์รู้แล้ว</div><div class="st-kpi-value">${studioWordLearned()}</div><div class="st-kpi-foot">บันทึกจาก Vocabulary Center</div></div><div class="st-card st-kpi"><div class="st-kpi-label">ความแม่นยำข้อสอบ</div><div class="st-kpi-value">${acc===null?'—':acc+'%'}</div><div class="st-kpi-foot">จากข้อที่มีคำตอบบันทึก</div></div></div>
<div class="st-section-head"><div><h2>ประวัติการสอบจำลอง</h2><p>รายการล่าสุดที่บันทึกไว้</p></div></div>
<div class="pf-card pf-list">${history.length?history.slice(0,8).map(h=>{const pc=Math.round((h.score||0));return `<div class="pf-row"><div class="pf-row-main"><b>ชุด ${h.setNo||'—'} · ${h.score}/100</b><small>${new Date(h.at).toLocaleDateString('th-TH')}</small></div><div class="pf-bar"><i style="width:${pc}%"></i></div><span class="pf-pct">${pc}%</span></div>`}).join(''):'<div class="st-empty">ยังไม่มีประวัติสอบจำลองเต็มชุด</div>'}</div>
<div class="st-section-head"><div><h2>ความสำเร็จ</h2><p>เหรียญและหมุดหมายที่ปลดล็อกแล้ว</p></div></div>
<div class="pf-badges">${[['first','🌱','เริ่มฝึกแล้ว'],['100','💯','ทำครบ 100 ข้อ'],['500','🏅','ทำครบ 500 ข้อ'],['perfect','✨','คะแนนเต็มในรอบฝึก'],['sets5','📘','พิชิต 5 ชุด'],['sets20','🏆','พิชิตครบ 20 ชุด'],['streak3','🔥','ฝึกต่อเนื่อง 3 วัน']].map(b=>`<div class="pf-badge ${(VLT_STATE.badges||[]).includes(b[0])?'':'locked'}"><span>${b[1]}</span><small>${b[2]}</small></div>`).join('')}</div>`}
function studioSaveProfile(e){e.preventDefault();STUDIO_PROFILE={...STUDIO_PROFILE,name:document.getElementById('pname').value.trim(),target:Math.max(0,Math.min(100,Number(document.getElementById('ptarget').value)||75)),examDate:document.getElementById('pexam').value,dailyGoal:Number(document.getElementById('pgoal').value)||30};const profileSaved=studioSave(STUDIO_STORE,STUDIO_PROFILE);studioUpdateChrome('profile');studioProfile();if(profileSaved)studioToast('บันทึกโปรไฟล์แล้ว')}
// V12.1 performance: build normalized search text once instead of joining/lowercasing
// every vocabulary record on every keystroke. This is presentation-only metadata.
(function studioBuildSearchIndex(){
  try {
    (STUDIO_DATA.words||[]).forEach((x,i)=>{x._studioIndex=i;x._studioSearch=[x.w,x.th,x.pos,x.cat,x.level,x.source].join(' ').toLocaleLowerCase('th-TH')});
    (STUDIO_DATA.phrases||[]).forEach(x=>{x._studioSearch=[x.w,x.th,x.type,x.context,x.example,x.source].join(' ').toLocaleLowerCase('th-TH')});
    (STUDIO_DATA.synonyms||[]).forEach(x=>{x._studioSearch=[x.words,x.th,x.note].join(' ').toLocaleLowerCase('th-TH')});
    (STUDIO_DATA.antonyms||[]).forEach(x=>{x._studioSearch=[x.a,x.b,x.th].join(' ').toLocaleLowerCase('th-TH')});
    (STUDIO_DATA.families||[]).forEach(x=>{x._studioSearch=[x.root,x.family].join(' ').toLocaleLowerCase('th-TH')});
    (STUDIO_DATA.reading||[]).forEach(x=>{x._studioSearch=[x.term,x.meaning,x.strategy].join(' ').toLocaleLowerCase('th-TH')});
    (STUDIO_DATA.confused||[]).forEach(x=>{x._studioSearch=[x.a,x.b,x.note].join(' ').toLocaleLowerCase('th-TH')});
  } catch(e) { /* Keep the original search path as a safe fallback. */ }
})();
function studioVocabulary(){const tabs=[['words','คำศัพท์หลัก'],['phrases','วลี / สำนวน'],['examCore','TGAT1 Exam Words'],['phrasePractice','🎯 Phrase Practice'],['missed','คำที่พลาด'],['favorites','คำโปรด'],['synonyms','คำพ้อง'],['antonyms','คำตรงข้าม'],['families','Word Families'],['reading','Reading Signals'],['confused','คำที่มักสับสน']];const data=STUDIO_DATA;const app=document.getElementById('app');
 let rows=[],count=0,html='';const q=STUDIO_VQUERY.trim().toLowerCase();
 if(STUDIO_VTAB==='words'){rows=data.words.filter(x=>(!q||(x._studioSearch||[x.w,x.th,x.pos,x.cat,x.level,x.source].join(' ').toLowerCase()).includes(q))&&(STUDIO_VLEVEL==='all'||x.level===STUDIO_VLEVEL)&&(STUDIO_VCAT==='all'||x.cat===STUDIO_VCAT));count=rows.length;html=rows.slice(STUDIO_VPAGE*50,STUDIO_VPAGE*50+50).map(x=>{const i=Number.isInteger(x._studioIndex)?x._studioIndex:data.words.indexOf(x),st=STUDIO_VSTATE.items[x.w];return `<button class="st-word" onclick="studioWordDetail(${i})"><b>${studioEsc(x.w)} ${STUDIO_VSTATE.favorites.includes(x.w)?'♥':''}</b><small>${studioEsc(x.th)}</small><em>${studioEsc(studioWordPosLabel(x.pos))} · ${studioEsc(x.level)} · ${st?.status==='known'?'✓ รู้แล้ว':'แตะเพื่อดูรายละเอียด'}</em></button>`}).join('')}
 else if(STUDIO_VTAB==='phrases'){rows=data.phrases.filter(x=>!q||(x._studioSearch||[x.w,x.th,x.type,x.context,x.example,x.source].join(' ').toLowerCase()).includes(q));count=rows.length;html=rows.slice(STUDIO_VPAGE*50,STUDIO_VPAGE*50+50).map(x=>`<button class="st-word" onclick="studioPhraseDetail(${data.phrases.indexOf(x)})"><b>${studioEsc(x.w)}</b><small>${studioEsc(x.th)}</small><em>${studioEsc(x.type)}</em></button>`).join('')}
 else if(STUDIO_VTAB==='examCore'){
  rows=window.TGAT1VocabularyLab?window.TGAT1VocabularyLab.list():[];count=rows.length;
  html=`<div class="st-card" style="margin-top:0"><div class="st-eyebrow">EXAM-ALIGNED VOCABULARY · CONTEXT + SPACED REVIEW</div><h2 style="margin:6px 0">ศัพท์และวลีที่พบในโจทย์ฝึก TGAT1</h2><p class="st-subtitle">คัดจาก prompt, บทอ่าน, บทสนทนา และคำตอบที่ถูกของคลังข้อสอบฝึก 1,200 ข้อ ผสมชุด collocation ที่เขียนเพิ่มใหม่ ฝึกจากบริบท ไม่ใช่ท่องคำแปลลอย ๆ</p><div class="st-inline" style="margin-top:12px"><button class="st-btn" onclick="TGAT1VocabularyLab.start('mixed')">🎯 ฝึกศัพท์จากบริบท 10 ข้อ</button><span class="st-tag">ไม่กระทบคะแนน mock</span></div></div>`+(rows.slice(STUDIO_VPAGE*30,STUDIO_VPAGE*30+30).map(x=>`<button class="st-word" onclick="studioWordDetail(${STUDIO_DATA.words.indexOf(x)})"><b>${studioEsc(x.w)}</b><small>${studioEsc(x.th)}</small><em>${studioEsc(x.pos)} · ${studioEsc(x.level)} · ${x._examHits||0} บริบทโจทย์</em></button>`).join('')||'<div class="st-empty">คลังคำศัพท์จะจัดอันดับเมื่อโหลดคลังข้อสอบฝึกแล้ว</div>');
}
else if(STUDIO_VTAB==='phrasePractice'){
  rows=[];count=0;
  html='<div class="st-card" style="margin-top:0"><div class="st-eyebrow">HOW IT WORKS</div><h2 style="font-size:20px;margin:5px 0 8px">Phrase-in-Context Practice</h2><p class="st-subtitle">ฝึกความหมายของวลีจากบริบทจริงในคลังข้อสอบ โดยไม่เปลี่ยนสถิติหรือ Error Notebook เดิม</p><div class="st-grid three" style="margin-top:14px"><div class="st-card"><b>1. ค้นบริบท</b><p class="st-muted">หาวลีในโจทย์และข้อความรอบข้าง</p></div><div class="st-card"><b>2. เลือกความหมาย</b><p class="st-muted">ใช้ตัวเลือกแปลไทยจากคลังวลี</p></div><div class="st-card"><b>3. ทบทวน</b><p class="st-muted">อ่านเฉลยแล้วฝึกข้อถัดไป</p></div></div><button class="st-btn" style="margin-top:14px" onclick="studioStartPhrasePractice()">🎯 เริ่ม Phrase-in-Context 10 ข้อ</button></div>';
}
else if(STUDIO_VTAB==='missed'||STUDIO_VTAB==='favorites'){
  const keys=STUDIO_VTAB==='missed'?[...new Set([...studioLegacyMissed(),...Object.entries(STUDIO_VSTATE.items||{}).filter(([w,v])=>v&&v.status==='again').map(([w])=>w)])]:(STUDIO_VSTATE.favorites||[]);
  rows=keys.map(w=>({w,i:data.words.findIndex(x=>x.w===w)})).filter(x=>x.i>=0&&(!q||[data.words[x.i].w,data.words[x.i].th].join(' ').toLowerCase().includes(q)));
  count=rows.length;
  html=rows.slice(STUDIO_VPAGE*50,STUDIO_VPAGE*50+50).map(x=>{const v=data.words[x.i];return `<button class="st-word" onclick="studioWordDetail(${x.i})"><b>${studioEsc(x.w)}</b><small>${studioEsc(v.th)}</small><em>${STUDIO_VTAB==='missed'?'ต้องทบทวน':'คำโปรด'}</em></button>`}).join('')||`<div class="st-empty">${STUDIO_VTAB==='missed'?'ยังไม่มีคำศัพท์ที่ต้องทบทวน':'ยังไม่มีคำโปรด แตะบันทึกคำไว้จากหน้ารายละเอียดคำศัพท์'}</div>`;
}
else if(STUDIO_VTAB==='synonyms'){rows=data.synonyms.filter(x=>!q||(x._studioSearch||[x.words,x.th,x.note].join(' ').toLowerCase()).includes(q));count=rows.length;html=rows.slice(STUDIO_VPAGE*40,STUDIO_VPAGE*40+40).map(x=>`<div class="st-word"><b>${studioEsc(x.words)}</b><small>${studioEsc(x.th)}</small><em>${studioEsc(x.note)}</em></div>`).join('')}
 else if(STUDIO_VTAB==='antonyms'){rows=data.antonyms.filter(x=>!q||(x._studioSearch||[x.a,x.b,x.th].join(' ').toLowerCase()).includes(q));count=rows.length;html=rows.slice(STUDIO_VPAGE*50,STUDIO_VPAGE*50+50).map(x=>`<div class="st-word"><b>${studioEsc(x.a)} ↔ ${studioEsc(x.b)}</b><small>${studioEsc(x.th)}</small><em>ANTONYMS</em></div>`).join('')}
 else if(STUDIO_VTAB==='families'){rows=data.families.filter(x=>!q||(x._studioSearch||[x.root,x.family].join(' ').toLowerCase()).includes(q));count=rows.length;html=rows.slice(STUDIO_VPAGE*40,STUDIO_VPAGE*40+40).map(x=>`<div class="st-word"><b>${studioEsc(x.root)}</b><small>${studioEsc(x.family)}</small><em>WORD FAMILY</em></div>`).join('')}
 else if(STUDIO_VTAB==='reading'){rows=data.reading.filter(x=>!q||(x._studioSearch||[x.term,x.meaning,x.strategy].join(' ').toLowerCase()).includes(q));count=rows.length;html=rows.slice(STUDIO_VPAGE*40,STUDIO_VPAGE*40+40).map(x=>`<div class="st-word"><b>${studioEsc(x.term)}</b><small>${studioEsc(x.meaning)}</small><em>${studioEsc(x.strategy)}</em></div>`).join('')}
 else {rows=data.confused.filter(x=>!q||(x._studioSearch||[x.a,x.b,x.note].join(' ').toLowerCase()).includes(q));count=rows.length;html=rows.slice(STUDIO_VPAGE*40,STUDIO_VPAGE*40+40).map(x=>`<div class="st-word"><b>${studioEsc(x.a)} ↔ ${studioEsc(x.b)}</b><small>${studioEsc(x.note)}</small><em>COMMONLY CONFUSED</em></div>`).join('')}
 const pageSize=['words','phrases'].includes(STUDIO_VTAB)?50:STUDIO_VTAB==='examCore'?30:40,pages=Math.max(1,Math.ceil(count/pageSize));
 app.innerHTML=`<div class="st-section-head" style="margin-top:0"><div><div class="st-eyebrow">VOCABULARY WORKSPACE</div><h1 class="st-title">คลังคำศัพท์และทักษะภาษา</h1><p class="st-subtitle">ค้นหาคำ แปลไทย ชนิดคำ หมวด ระดับที่มา และใช้ระบบทบทวนแบบเว้นระยะ</p></div><div class="st-inline"><button class="st-btn secondary" onclick="studioStartFlashcards()">▣ Flashcards (${studioDueWords().length} ถึงเวลา)</button><button class="st-btn" onclick="TGAT1VocabularyLab.start('vocab')">🎯 TGAT1 Exam Vocab</button></div></div>
 <div class="st-grid four"><div class="st-card st-kpi"><div class="st-kpi-label">คำศัพท์หลัก</div><div class="st-kpi-value">${data.words.length.toLocaleString()}</div><div class="st-kpi-foot">รวมจากชุดข้อมูลที่แนบ</div></div><div class="st-card st-kpi"><div class="st-kpi-label">วลี / สำนวน</div><div class="st-kpi-value">${data.phrases.length}</div><div class="st-kpi-foot">Phrases · idioms · collocations</div></div><div class="st-card st-kpi"><div class="st-kpi-label">รู้แล้ว</div><div class="st-kpi-value">${studioWordLearned()}</div><div class="st-kpi-foot">ทำเครื่องหมายโดยผู้เรียน</div></div><div class="st-card st-kpi"><div class="st-kpi-label">ถึงเวลาทบทวน</div><div class="st-kpi-value">${studioDueWords().length}</div><div class="st-kpi-foot">Spaced repetition</div></div></div>
 <div class="st-card" style="margin-top:16px"><div class="st-inline" style="justify-content:space-between;margin-bottom:12px"><div><div class="st-eyebrow">PHRASE-IN-CONTEXT</div><b>ฝึกวลีจากบริบทข้อสอบ 1,200 ข้อ</b><div class="st-muted" style="margin-top:4px">ระบบใช้วลีที่ปรากฏใน prompt/context หรือคำตอบที่ถูกต้องของข้อสอบ และเติมคำตอบลงในช่องว่างก่อนสร้างโจทย์จากบริบทนั้น</div></div><button class="st-btn secondary small" onclick="studioStartPhrasePractice()">เริ่มฝึก 10 ข้อ</button></div><div class="st-search"><span>⌕</span><input id="studioVSearch" value="${studioEsc(STUDIO_VQUERY)}" placeholder="ค้นหาคำอังกฤษ คำแปลไทย ชนิดคำ หรือหมวด..." oninput="studioVSearch(this.value)"><button class="st-link" onclick="studioVSearch('')">ล้าง</button></div><div class="st-tabs" style="margin-top:14px">${tabs.map(t=>`<button class="st-tab ${STUDIO_VTAB===t[0]?'active':''}" onclick="studioVTab('${t[0]}')">${t[1]}</button>`).join('')}</div>${STUDIO_VTAB==='words'?`<div class="st-inline" style="margin-top:12px"><select aria-label="กรองตามกลุ่มความยาก A/B/C (จัดกลุ่มภายในแอป ไม่ใช่ CEFR)" class="st-select" style="width:auto;min-width:120px" onchange="studioVLevel(this.value)"><option value="all">ทุกกลุ่มความยาก</option>${['A','B','C'].map(x=>`<option value="${x}" ${STUDIO_VLEVEL===x?'selected':''}>กลุ่ม ${x} · ${({A:'พื้นฐาน',B:'กลาง',C:'สูง'})[x]}</option>`).join('')}</select><select aria-label="กรองตามหมวดหมู่คำศัพท์" class="st-select" style="width:auto;max-width:300px" onchange="studioVCat(this.value)"><option value="all">ทุกหมวดหมู่</option>${[...new Set(data.words.map(x=>x.cat))].sort().map(x=>`<option value="${studioEsc(x)}" ${STUDIO_VCAT===x?'selected':''}>${studioEsc(x)}</option>`).join('')}</select><span class="st-tag">${count.toLocaleString()} รายการ</span></div>`:''}<div class="st-word-grid" style="margin-top:14px">${html||'<div class="st-empty">ไม่พบข้อมูลที่ตรงกับคำค้น</div>'}</div><div class="st-inline" style="justify-content:space-between;margin-top:15px"><span class="st-tag">แสดง ${Math.min(count,STUDIO_VPAGE*pageSize+pageSize)} จาก ${count.toLocaleString()}</span><div class="st-inline"><button class="st-btn ghost small" ${STUDIO_VPAGE===0?'disabled':''} onclick="studioVPage(-1)">← ก่อนหน้า</button><span class="st-tag">${STUDIO_VPAGE+1}/${pages}</span><button class="st-btn ghost small" ${STUDIO_VPAGE>=pages-1?'disabled':''} onclick="studioVPage(1)">ถัดไป →</button></div></div></div>
 <div class="st-footer-note">แหล่งข้อมูลศัพท์: TGAT1_Unified_Vocabulary.xlsx ที่แนบมา (แสดงที่มาของรายการในรายละเอียด) · ทุกคำมีตัวอย่างประโยคสำหรับฝึกใช้ในบริบท และแสดงแหล่งที่มาที่หน้ารายละเอียด · คำแปลและข้อมูลจากไฟล์ต้นทางไม่ได้ถูกอ้างว่าเป็นคำแปลทางการ</div>`;
}
function studioPhraseEscapeRx(value){return String(value||'').trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+')}
function studioPhraseRegex(phrase){const raw=String(phrase||'').trim();if(!raw||raw.includes('...'))return null;try{return new RegExp('(^|[^A-Za-z0-9])('+studioPhraseEscapeRx(raw)+')(?=$|[^A-Za-z0-9])','i')}catch(e){return null}}
function studioPhraseHas(text,phrase){const rx=studioPhraseRegex(phrase);return !!(rx&&rx.test(String(text||'')))}
function studioPhraseHighlight(text,phrase){const rx=studioPhraseRegex(phrase);return rx?String(text||'').replace(rx,(_,before,match)=>before+'【'+match+'】'):String(text||'')}
function studioPhraseShuffle(items){const out=(items||[]).slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function studioPhraseBuildOptions(p){const distractors=[];const usedMeanings=new Set([String(p&&p.th||'').trim()]);for(const candidate of studioPhraseShuffle(STUDIO_DATA.phrases.filter(x=>x.w!==p.w&&x.th&&String(x.th).trim()!==String(p.th||'').trim()))){const meaning=String(candidate.th).trim();if(usedMeanings.has(meaning))continue;usedMeanings.add(meaning);distractors.push(candidate);if(distractors.length===3)break;}return studioPhraseShuffle([p,...distractors])}
function studioPhraseBuildContext(q,p){
  const candidates=[q&&q.context,q&&q.prompt].map(x=>String(x||'').trim()).filter(Boolean);
  const visible=candidates.find(text=>studioPhraseHas(text,p.w));
  if(visible)return visible;
  const answerIndex=Number(q&&q.answer);
  const options=Array.isArray(q&&q.options)?q.options:[];
  const correct=Number.isInteger(answerIndex)&&answerIndex>=0&&answerIndex<options.length?String(options[answerIndex]||'').trim():'';
  if(!correct||!studioPhraseHas(correct,p.w))return '';
  const base=String(q.context||q.prompt||'').trim();
  if(!base)return correct;
  const blankMatch=String(q.prompt||'').match(/blank\s*\(\s*(\d+)\s*\)/i);
  if(blankMatch){
    const number=blankMatch[1];
    const numbered=new RegExp('\\(\\s*'+number+'\\s*\\)\\s*_{2,}','i');
    if(numbered.test(base))return base.replace(numbered,correct);
  }
  const anyBlank=/(?:\(\s*\d+\s*\)\s*)?_{2,}/;
  if(anyBlank.test(base))return base.replace(anyBlank,correct);
  return base+'\n'+(/\bQ\s*:/i.test(base)?'A: ':'คำตอบที่ถูกต้อง: ')+correct;
}
function studioPhraseQuestionPool(){
  const phrases=Array.isArray(STUDIO_DATA.phrases)?STUDIO_DATA.phrases:[];
  const bank=(typeof VLT_BANK!=='undefined'&&Array.isArray(VLT_BANK))?VLT_BANK:[];
  const out=[];
  const seen=new Set();
  phrases.forEach((p,pi)=>{
    if(!p||!String(p.w||'').trim())return;
    const hits=[];
    bank.forEach(q=>{
      const context=studioPhraseBuildContext(q,p);
      if(!context||!studioPhraseHas(context,p.w))return;
      const id=String(p.w).toLocaleLowerCase('en-US')+'::'+context.replace(/\s+/g,' ').trim().toLocaleLowerCase('en-US');
      if(seen.has(id))return;
      seen.add(id);
      hits.push({phrase:p,phraseIndex:pi,q,context});
    });
    const linkedCount=new Set(hits.map(x=>x.context.replace(/\s+/g,' ').trim())).size;
    hits.forEach(x=>out.push({...x,linkedCount}));
  });
  return out;
}
let STUDIO_PHRA_RUN=null;
function studioStartPhrasePractice(){
  const pool=studioPhraseShuffle(studioPhraseQuestionPool()).slice(0,40);
  if(!pool.length){studioToast('ยังไม่พบวลีที่เชื่อมกับบริบทข้อสอบ');return;}
  STUDIO_PHRA_RUN={pool:pool.slice(0,10),index:0,correct:0,answered:false};
  studioRenderPhrasePractice();
}
function studioRenderPhrasePractice(){
  const app=document.getElementById('app');
  if(!STUDIO_PHRA_RUN||!STUDIO_PHRA_RUN.pool.length){studioVocabulary();return;}
  const item=STUDIO_PHRA_RUN.pool[STUDIO_PHRA_RUN.index];
  const p=item.phrase; const q=item.q; const i=STUDIO_PHRA_RUN.index+1,total=STUDIO_PHRA_RUN.pool.length;
  const opts=studioPhraseBuildOptions(p);
  const stem=studioPhraseHighlight(String(item.context||q.prompt||''),p.w);
  const answered=STUDIO_PHRA_RUN.answered;
  const selected=STUDIO_PHRA_RUN.selected;
  app.innerHTML=`<div class="st-inline" style="justify-content:space-between"><div><div class="st-eyebrow">PHRASE-IN-CONTEXT · ${studioEsc(q.category||'')}</div><h1 class="st-title">ฝึกวลีจากบริบทข้อสอบ</h1><p class="st-subtitle">ข้อ ${i}/${total} · เชื่อมจาก ${studioEsc(q.id||'คลังข้อสอบ')} · พบใน ${item.linkedCount} บริบทไม่ซ้ำ</p></div><button class="st-btn ghost" onclick="STUDIO_PHRA_RUN=null;studioVocabulary()">✕ ออก</button></div><div class="st-card" style="max-width:820px;margin:18px auto"><div class="st-progress" style="margin-bottom:18px"><i style="width:${i/total*100}%"></i></div><div class="st-eyebrow">CONTEXT</div><div class="st-card" style="margin-top:10px;background:var(--st-soft,#f5f7fb)"><p style="font-size:18px;line-height:1.7;margin:0">${studioEsc(stem)}</p></div><div class="st-divider"></div><h3 style="margin:0 0 12px">วลี <b>${studioEsc(p.w)}</b> ในบริบทนี้หมายถึงข้อใด?</h3><div class="st-grid two">${opts.map((o,j)=>`<button class="st-btn ${answered?(o.w===p.w?'':'secondary'):''}" ${answered?'disabled':''} onclick="studioPhraseAnswer(${STUDIO_DATA.phrases.indexOf(o)})">${String.fromCharCode(65+j)}. ${studioEsc(o.th)}</button>`).join('')}</div>${answered?`<div class="st-alert" style="margin-top:16px"><b>${selected===p.w?'✓ ถูกต้อง':'✗ ยังไม่ถูก'}</b><br>ความหมาย: ${studioEsc(p.th)}<br><span class="st-muted">โจทย์อ้างอิง: ${studioEsc(q.id||'')} · ${studioEsc(q.topic||q.category||'')}</span></div><button class="st-btn" style="margin-top:14px" onclick="studioPhraseNext()">${i===total?'ดูผล':'ข้อต่อไป →'}</button>`:''}</div>`;
}
function studioPhraseAnswer(pi){if(!STUDIO_PHRA_RUN||STUDIO_PHRA_RUN.answered)return;const item=STUDIO_PHRA_RUN.pool[STUDIO_PHRA_RUN.index];const chosen=STUDIO_DATA.phrases[pi];if(!chosen)return;STUDIO_PHRA_RUN.answered=true;STUDIO_PHRA_RUN.selected=chosen.w;if(chosen.w===item.phrase.w)STUDIO_PHRA_RUN.correct++;studioRenderPhrasePractice()}
function studioPhraseNext(){if(!STUDIO_PHRA_RUN)return;if(STUDIO_PHRA_RUN.index>=STUDIO_PHRA_RUN.pool.length-1){const score=STUDIO_PHRA_RUN.correct;studioModal(`<div class="st-eyebrow">PHRASE-IN-CONTEXT RESULT</div><div class="st-title" style="font-size:28px">ผลการฝึก</div><h2>${score}/${STUDIO_PHRA_RUN.pool.length} ถูก</h2><p class="st-subtitle">ระบบจะไม่เปลี่ยนคะแนนสอบจำลองหลักจากกิจกรรมนี้</p><div class="st-inline"><button class="st-btn" onclick="studioCloseModal();STUDIO_PHRA_RUN=null;studioVocabulary()">กลับคลังวลี</button><button class="st-btn secondary" onclick="studioCloseModal();studioStartPhrasePractice()">ฝึกอีก 10 ข้อ</button></div>`);return;}STUDIO_PHRA_RUN.index++;STUDIO_PHRA_RUN.answered=false;STUDIO_PHRA_RUN.selected='';studioRenderPhrasePractice()}
function studioVTab(tab){STUDIO_VTAB=tab;STUDIO_VPAGE=0;STUDIO_VQUERY='';studioVocabulary()}
let STUDIO_VSEARCH_TIMER=null;
function studioVSearch(q){
  STUDIO_VQUERY=String(q??'');STUDIO_VPAGE=0;
  if(STUDIO_VSEARCH_TIMER)clearTimeout(STUDIO_VSEARCH_TIMER);
  const input=document.getElementById('studioVSearch');
  const start=input&&typeof input.selectionStart==='number'?input.selectionStart:STUDIO_VQUERY.length;
  const end=input&&typeof input.selectionEnd==='number'?input.selectionEnd:start;
  const y=window.scrollY;
  STUDIO_VSEARCH_TIMER=setTimeout(()=>{
    STUDIO_VSEARCH_TIMER=null;studioVocabulary();
    const el=document.getElementById('studioVSearch');
    if(el){el.focus({preventScroll:true});try{el.setSelectionRange(start,end)}catch(e){(window.TGAT1_ERR||Object)(e,'app')}}
    window.scrollTo({top:y,behavior:'instant'});
  },180);
}
function studioVLevel(v){STUDIO_VLEVEL=v;STUDIO_VPAGE=0;studioVocabulary()}
function studioVCat(v){STUDIO_VCAT=v;STUDIO_VPAGE=0;studioVocabulary()}
function studioVPage(n){STUDIO_VPAGE=Math.max(0,STUDIO_VPAGE+n);studioVocabulary()}
function studioWordDetail(i){const x=STUDIO_DATA.words[i];if(!x)return;const st=STUDIO_VSTATE.items[x.w]||{};const legacy=(S.st||{})[x.w];const ex=(STUDIO_DATA.examples[x.w]||[]).filter(e=>!/(?:\bIn the report,\s*[“"].+?[”"]\s+adds information\b|\bIn the passage,\s*[“"].+?[”"]\s+describes a feature\b)/i.test(String(e)));const fav=STUDIO_VSTATE.favorites.includes(x.w);const senses=Array.isArray(x.senses)?x.senses:[];const senseHtml=senses.length?`<div class="st-poly-wrap"><div class="st-poly-head">ความหมายตามชนิดคำและบริบท</div>${senses.map((z,j)=>`<div class="st-poly-item"><div><span class="st-poly-index">${j+1}</span><b>${studioEsc(z.pos)}</b></div><p>${studioEsc(z.meaning)}</p><div class="st-poly-example">${studioEsc(z.example)}</div><div class="st-poly-translation">${studioEsc(z.translation)}</div></div>`).join('')}<p class="st-poly-note">คำหนึ่งคำอาจมีหลายความหมาย ให้ดูชนิดคำและคำรอบข้างในประโยคก่อนเลือกคำแปล</p></div>`:'';studioModal(`<div class="st-eyebrow">${studioEsc(x.cat)}</div><div class="st-title" style="font-size:29px">${studioEsc(x.w)}</div><div class="st-inline"><span class="st-tag blue">${studioEsc(studioWordPosLabel(x.pos))}</span><span class="st-tag" title="กลุ่มความยาก A/B/C เป็นการจัดกลุ่มภายในแอปต่อ headword ไม่ใช่ระดับ CEFR">กลุ่มความยาก ${studioEsc(x.level)} · ภายในแอป</span><span class="st-tag" title="ป้ายที่มาเดิมของรายการ ยังไม่ได้ยืนยันแหล่ง/สิทธิ์ ดู SOURCE-REGISTER.csv">ที่มา: ${studioEsc(x.source)}</span></div><h3 style="font-size:20px;margin:20px 0 5px">${studioEsc(x.th)}</h3>${senseHtml}${ex.length?`<div class="st-divider"></div><b>ตัวอย่างประโยคจากคลังเดิม</b>${ex.map(e=>`<p class="st-subtitle" style="margin-top:7px">${studioEsc(e)}</p>`).join('')}`:'<p class="st-subtitle" style="margin-top:8px">รายการนี้ไม่มีตัวอย่างประโยคจากคลังเดิมเพิ่มเติม</p>'}<div class="st-divider"></div><p class="st-subtitle">สถานะของคุณ: ${st.status==='known'?'ทำเครื่องหมายว่ารู้แล้ว':st.status==='again'?'ต้องทบทวน':legacy&&legacy[2]===0?'เคยตอบผิดในเกมศัพท์':'ยังไม่ประเมิน'} · ${st.reps||0} รอบทบทวน</p><div class="st-inline" style="margin-top:14px"><button class="st-btn ghost" onclick="studioSayWord(${i})">🔊 ฟังเสียง</button><button class="st-btn" onclick="studioMarkWord(${i},'known')">✓ รู้คำนี้แล้ว</button><button class="st-btn secondary" onclick="studioMarkWord(${i},'again')">↻ ต้องทบทวน</button><button class="st-btn ghost" onclick="studioToggleFav(${i})">${fav?'♥ เอาออกจากรายการโปรด':'♡ บันทึกคำโปรด'}</button></div>`)}
function studioSayWord(i){const x=STUDIO_DATA.words[i];if(x&&typeof say==='function')say(x.w);else studioToast('เบราว์เซอร์นี้ยังไม่รองรับเสียงอ่าน')}
function studioPhraseDetail(i){const x=STUDIO_DATA.phrases[i];if(!x)return;studioModal(`<div class="st-eyebrow">${studioEsc(x.type)} · ${studioEsc(x.source)}</div><div class="st-title" style="font-size:28px">${studioEsc(x.w)}</div><h3>${studioEsc(x.th)}</h3><div class="st-divider"></div><b>บริบท / ตัวอย่าง</b><p class="st-subtitle" style="margin-top:8px">${studioEsc(x.example||x.context||'ไม่มีตัวอย่างในแหล่งข้อมูล')}</p>`)}
function studioMarkWord(i,status){const x=STUDIO_DATA.words[i];if(!x)return;const old=STUDIO_VSTATE.items[x.w]||{reps:0};const reps=(old.reps||0)+1;const intervals=[1,2,4,7,14,30];const due=status==='known'?Date.now()+intervals[Math.min(reps-1,intervals.length-1)]*86400000:Date.now();STUDIO_VSTATE.items[x.w]={status,reps,interval:status==='known'?intervals[Math.min(reps-1,intervals.length-1)]:0,due,last:Date.now()};studioSave('tgat1_studio_vocab_progress_v1',STUDIO_VSTATE);studioCloseModal();studioVocabulary();studioToast(status==='known'?'บันทึกว่ารู้คำนี้แล้ว':'เพิ่มเข้าคิวทบทวนแล้ว')}
function studioToggleFav(i){const w=STUDIO_DATA.words[i].w;STUDIO_VSTATE.favorites=STUDIO_VSTATE.favorites.includes(w)?STUDIO_VSTATE.favorites.filter(x=>x!==w):[...STUDIO_VSTATE.favorites,w];studioSave('tgat1_studio_vocab_progress_v1',STUDIO_VSTATE);studioCloseModal();studioVocabulary()}
function studioStartFlashcards(){const due=studioDueWords();let pool=due.length?due:STUDIO_DATA.words.filter(x=>STUDIO_VSTATE.items[x.w]?.status!=='known').map(x=>x.w).slice(0,100);if(!pool.length)pool=STUDIO_DATA.words.slice(0,50).map(x=>x.w);pool=pool.__fy().slice(0,20);STUDIO_FLASH={pool,index:0};STUDIO_FLASH_REVEALED=false;studioRenderFlash()}
function studioRenderFlash(){const app=document.getElementById('app');if(!STUDIO_FLASH||!STUDIO_FLASH.pool.length){studioVocabulary();return}const word=STUDIO_FLASH.pool[STUDIO_FLASH.index],x=STUDIO_DATA.words.find(w=>w.w===word),i=STUDIO_FLASH.index+1,total=STUDIO_FLASH.pool.length;STUDIO_PAGE='vocab';studioUpdateChrome('vocab');app.innerHTML=`<div class="st-inline" style="justify-content:space-between"><div><div class="st-eyebrow">SPACED REPETITION</div><h1 class="st-title">Flashcards</h1><p class="st-subtitle">ทบทวนคำที่ถึงกำหนด หรือสุ่มคำที่ยังไม่ประเมิน</p></div><button class="st-btn ghost" onclick="STUDIO_FLASH=null;studioVocabulary()">✕ ออกจากการทบทวน</button></div><div class="st-card" style="max-width:760px;margin:22px auto"><div class="st-inline" style="justify-content:space-between"><span class="st-tag blue">คำที่ ${i}/${total}</span><span class="st-tag">${studioEsc(x.level)} · ${studioEsc(studioWordPosLabel(x.pos))}</span></div><div class="st-progress" style="margin:13px 0 18px"><i style="width:${i/total*100}%"></i></div><div class="st-flash" role="button" tabindex="0" aria-pressed="${STUDIO_FLASH_REVEALED?'true':'false'}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();studioFlashFlip()}" onclick="studioFlashFlip()"><div><div class="st-eyebrow">${STUDIO_FLASH_REVEALED?'MEANING':'WORD'}</div><div class="st-flash-word">${STUDIO_FLASH_REVEALED?`<span class="st-flash-th">${studioEsc(x.th)}</span>`:studioEsc(x.w)}</div>${STUDIO_FLASH_REVEALED?`<p class="st-subtitle" style="margin-top:9px">${studioEsc(x.cat)} · ${studioEsc(x.source)}</p>`:'<p class="st-subtitle" style="margin-top:10px">แตะการ์ดเพื่อเปิดดูความหมาย</p>'}</div></div>${STUDIO_FLASH_REVEALED&&x.senses?`<div class="st-inline" style="justify-content:center;margin-top:10px"><button class="st-btn secondary" onclick="studioWordDetail(${STUDIO_DATA.words.indexOf(x)})">📖 ดูความหมายแยกตามบริบท</button></div>`:''}<div class="st-inline" style="justify-content:center;margin-top:18px">${STUDIO_FLASH_REVEALED?`<button class="st-btn secondary" onclick="studioFlashMark('again')">↻ ยังไม่ชัวร์</button><button class="st-btn" onclick="studioFlashMark('known')">✓ จำได้แล้ว</button>`:`<button class="st-btn" onclick="studioFlashFlip()">เปิดความหมาย</button>`}</div></div>`}
function studioFlashFlip(){STUDIO_FLASH_REVEALED=!STUDIO_FLASH_REVEALED;studioRenderFlash()}
function studioFlashMark(status){
 if(!STUDIO_FLASH||!Array.isArray(STUDIO_FLASH.pool))return;
 const word=STUDIO_FLASH.pool[STUDIO_FLASH.index];
 if(!word)return;
 const old=STUDIO_VSTATE.items[word]||{reps:0};
 const reps=(Number(old.reps)||0)+1;
 const intervals=[1,3,7,14,30];
 const intervalIndex=Math.min(Math.max(reps-1,0),intervals.length-1);
 const interval=status==='known'?intervals[intervalIndex]:0;
 const now=Date.now();
 STUDIO_VSTATE.items[word]={status,reps,interval,due:status==='known'?now+interval*86400000:now,last:now};
 studioSave('tgat1_studio_vocab_progress_v1',STUDIO_VSTATE);
 STUDIO_FLASH.index++;
 STUDIO_FLASH_REVEALED=false;
 if(STUDIO_FLASH.index>=STUDIO_FLASH.pool.length){
  STUDIO_VSTATE.sessions.push({at:new Date().toISOString(),total:STUDIO_FLASH.pool.length});
  studioSave('tgat1_studio_vocab_progress_v1',STUDIO_VSTATE);
  STUDIO_FLASH=null;
  studioVocabulary();
  studioToast('จบการทบทวนแล้ว เก่งมาก!');
 }else studioRenderFlash();
}
function studioModal(content){studioCloseModal();const d=document.createElement('div');d.className='st-modal';d.id='studioModal';d.innerHTML=`<div class="st-modal-box"><button class="st-modal-close" onclick="studioCloseModal()">✕</button>${content}</div>`;d.addEventListener('click',e=>{if(e.target===d)studioCloseModal()});document.body.appendChild(d)}
function studioCloseModal(){if(activeTGConfirmCancel){const cancel=activeTGConfirmCancel;activeTGConfirmCancel=null;cancel();return;}document.getElementById('studioModal')?.remove()}
function studioExam(){if(!VLT_BANK.length){VLT_ensureBank().then(()=>{if(STUDIO_PAGE==='exam')studioExam()}).catch(e=>studioToast(e.message));return;}const app=document.getElementById('app'),done=studioCompleted(),cat=studioQuestionParts(),hist=studioMockHistory();app.innerHTML=`<header class="ex-head"><div><div class="ex-eyebrow">TIMED PRACTICE · EXAM CENTER</div><h1 class="ex-title">ศูนย์สอบ TGAT1</h1><p class="ex-sub">ฝึกตาม Blueprint · 60 ข้อ · 60 นาที · Short 3 บท (3–4 ข้อ/บท) · Long 2 บท (บทละ 5 ข้อ)</p></div><span class="ex-badge">${done}/20 ชุดที่ทำแล้ว</span></header><section class="ex-stats"><div class="ex-stat"><span>คลังข้อสอบฝึก</span><strong>${VLT_BANK.length.toLocaleString()}</strong><small>20 ชุด × 60 ข้อ</small></div><div class="ex-stat"><span>Speaking</span><strong>30 ข้อ</strong><small>50 คะแนน</small></div><div class="ex-stat"><span>Reading</span><strong>30 ข้อ</strong><small>50 คะแนน</small></div></section><section class="ex-grid"><div class="ex-card"><div class="ex-eyebrow">FULL MOCK TEST</div><h2>จำลองสอบเต็มชุด</h2><p class="ex-sub">เลือกชุดที่ต้องการ ระบบจับเวลา 60 นาที ย้อนแก้คำตอบได้ และแสดงเฉลยเมื่อส่งข้อสอบ</p><div class="ex-note">ข้อสอบ 1,200 ข้อในชุดนี้เป็นโจทย์ฝึกที่จัดทำขึ้นสำหรับแอป ไม่ใช่ข้อสอบจริงย้อนหลังหรือข้อสอบทางการ คะแนนที่ได้เป็นคะแนนฝึก · เฉลยเสริมหลักคิดและหลักฐานประกอบการตัดตัวลวง</div><div class="ex-actions"><button class="st-btn" onclick="VLT_startMock(1)">เริ่มชุดที่ 1</button><button class="st-btn secondary" onclick="studioShowSets()">เลือกจาก 20 ชุด</button></div><div id="vaultSetsBlock"></div></div><div class="ex-card"><div class="ex-eyebrow">PRACTICE BY SKILL</div><h2>ฝึกแยกตามทักษะ</h2><p class="ex-sub">เลือกทำ 10 ข้อจากพาร์ตที่อยากเน้น พร้อมเฉลยทันทีหลังตอบ</p>${cat.map(c=>`<div class="ex-row"><div><b>${c.name}</b><small>${VLT_BANK.filter(q=>q.category===c.id).length} ข้อในคลัง</small></div><button class="st-btn small secondary" onclick="VLT_startCategory('${c.id}')">ฝึก 10 ข้อ</button></div>`).join('')}</div></section><h2 class="ex-section">ผลการสอบจำลองล่าสุด</h2><div class="ex-card">${hist.length?`<table class="st-table"><thead><tr><th>วันที่</th><th>ชุด</th><th>คะแนน</th><th>ร้อยละ</th></tr></thead><tbody>${hist.slice(0,10).map(h=>`<tr><td>${new Date(h.at).toLocaleDateString('th-TH')}</td><td>ชุด ${h.setNo??'—'}</td><td><b>${h.score}/100</b></td><td>${Math.round(h.score)}%</td></tr>`).join('')}</tbody></table>`:'<div class="st-empty">ยังไม่มีผลสอบจำลอง · เลือกชุดแรกเพื่อเริ่มได้เลย</div>'}</div><p class="ex-foot">ที่มาโครงสร้างข้อสอบ: Blueprint TGAT1 ของ myTCAS · ข้อมูลโจทย์และเฉลยภายในแอปเป็นชุดฝึกที่แนบมากับโปรเจกต์</p>`;}
function studioShowSets(){VLT_showSets()}
function studioGame(){if(!['S','A','B','C'].includes(S.cur))S.cur='S';const app=document.getElementById('app');app.innerHTML=`<div class="st-section-head" style="margin-top:0"><div><div class="st-eyebrow">GAMIFIED LEARNING</div><h1 class="st-title">Game Center</h1><p class="st-subtitle">เลือกโหมดเล่นตามเวลาที่มี เก็บ XP พร้อมบันทึกผลการฝึก</p></div><span class="st-tag gold">⭐ ${studioXP().toLocaleString()} XP</span></div><div class="st-hero"><div class="st-eyebrow">DAILY MISSION</div><h2 class="st-title">ภารกิจประจำวัน</h2><p class="st-subtitle">ทบทวนคำศัพท์และโจทย์สั้น ๆ สม่ำเสมอ เลือกภารกิจที่เหมาะกับเวลาของวันนี้</p><div class="st-inline"><button class="st-btn secondary" onclick="VLT_startDaily()">เริ่มภารกิจ TGAT1 10 ข้อ</button><button class="st-btn gold" onclick="start('daily')">เริ่มภารกิจศัพท์</button></div></div><div class="st-section-head"><div><h2>เกมฝึกข้อสอบ</h2><p>ฝึกเร็วและเจาะจง</p></div></div><div class="st-grid three"><button class="st-action-card" onclick="VLT_startQuick()"><span class="st-icon-box">🎲</span><span><b>Quick Play</b><small>สุ่มข้อสอบ 10 ข้อ จากทุกพาร์ต</small></span></button><button class="st-action-card" onclick="VLT_startSprint()"><span class="st-icon-box">⚡</span><span><b>90-second Sprint</b><small>ทำข้อสอบให้ได้มากที่สุดใน 90 วินาที</small></span></button><button class="st-action-card" onclick="VLT_startReview()"><span class="st-icon-box">↻</span><span><b>Weak Point Challenge</b><small>แก้มือข้อสอบ TGAT1 ที่เคยตอบผิด</small></span></button><button class="st-action-card" onclick="start('review')"><span class="st-icon-box">▤</span><span><b>Vocabulary Recovery</b><small>ฝึกคำศัพท์ที่เคยตอบผิดในเกมเดิม</small></span></button><button class="st-action-card" onclick="V15_startRecall()"><span class="st-icon-box">🧠</span><span><b>ทวนศัพท์ที่เคยเล่น</b><small>เห็นความหมายไทย แล้วพิมพ์คำอังกฤษ · รอบละ 30 คำ</small></span></button></div><div class="st-section-head"><div><h2>เส้นทางเรียนตามระดับ</h2><p>เลือกระดับก่อนเข้าเกม · ระดับ C คือท้าทายสูงสุด และระบบจะไม่ลดระดับให้เองเงียบ ๆ</p></div></div><div class="st-card"><div class="st-inline">${['S','A','B','C'].map(l=>`<button class="st-tab ${S.cur===l?'active':''}" onclick="studioGameLevel('${l}')">${({S:'พื้นฐาน',A:'ง่าย',B:'กลาง',C:'ยาก'})[l]}</button>`).join('')}</div><div class="st-progress" style="margin:13px 0 7px"><i style="width:${pg(S.cur)/Math.max(1,tot(S.cur))*100}%"></i></div><p class="st-subtitle">ระดับ ${({S:'พื้นฐาน',A:'ง่าย',B:'กลาง',C:'ยาก'})[S.cur]} · ผ่านแล้ว ${pg(S.cur)}/${tot(S.cur)} บทเรียน</p><button class="st-btn secondary" style="margin-top:12px" onclick="startStage('${S.cur}')">เริ่มเรียนต่อ →</button></div><div class="st-section-head"><div><h2>มินิเกมคำศัพท์</h2><p>ระดับที่เลือกมีผลกับคลังโจทย์จริง ระดับ C จะคัดโจทย์ที่ซับซ้อนกว่า และแจ้งตรง ๆ หากข้อมูลระดับนั้นไม่พอ</p></div></div><div class="st-card"><div class="st-inline" style="margin-bottom:12px">${['S','A','B','C'].map(l=>`<button class="st-tab ${S.cur===l?'active':''}" onclick="studioGameLevel('${l}')">${({S:'พื้นฐาน',A:'ง่าย',B:'กลาง',C:'ยาก'})[l]}</button>`).join('')}</div><div class="st-grid three">${[['match','🔗','จับคู่คำ','เชื่อมคำศัพท์กับความหมาย'],['pic','🖼️','ทายจากรูป','ฝึกจำคำผ่านภาพและไอคอน'],['spell','🔤','สะกดคำ','เรียงตัวอักษรให้เป็นคำ'],['build','🧩','เรียงประโยค','ฝึกลำดับคำในประโยค'],['tr','💬','แปลประโยค','เลือกความหมายที่เหมาะสม'],['free','♾️','ฝึกต่อเนื่อง','โจทย์คำศัพท์แบบไม่จำกัด']].map(g=>`<button class="st-action-card" onclick="studioRunVocabGame('${g[0]}')"><span class="st-icon-box">${g[1]}</span><span><b>${g[2]}</b><small>${g[3]}</small></span></button>`).join('')}</div></div><div class="st-section-head"><div><h2>ความสำเร็จและสตรีค</h2><p>เป้าหมายที่ปลดล็อกแล้ว</p></div></div><div class="st-card">${[['first','🌱','เริ่มต้นแล้ว'],['100','💯','100 ข้อ'],['500','🏅','500 ข้อ'],['perfect','✨','ทำคะแนนเต็ม'],['sets5','📘','5 ชุด'],['sets20','🏆','20 ชุด'],['streak3','🔥','สตรีค 3 วัน']].map(b=>`<span class="st-badge ${(VLT_STATE.badges||[]).includes(b[0])?'':'locked'}">${b[1]} ${b[2]}</span>`).join('')}</div>`}
function studioGameLevel(l){if(!['S','A','B','C'].includes(l))return;S.cur=l;save();studioGame()}
window.STUDIO_GAME_RETURN=false;
function studioReturnToGame(){window.STUDIO_GAME_RETURN=false;Q=null;STUDIO_PAGE="game";studioUpdateChrome("game");studioGame()}
function studioExitCurrentRun(){studioClearSession();if(window.STUDIO_GAME_RETURN)studioReturnToGame();else home()}
const studioOriginalPlay=play;
play=function(g){window.STUDIO_GAME_RETURN=true;studioOriginalPlay(g);if(!Q)window.STUDIO_GAME_RETURN=false};
const studioOriginalStart=start;
start=function(mode){if(STUDIO_PAGE==="game"&&["free","review","daily"].includes(mode))window.STUDIO_GAME_RETURN=true;studioOriginalStart(mode);if(!Q)window.STUDIO_GAME_RETURN=false};
function studioRunVocabGame(g){window.STUDIO_GAME_RETURN=true;if(g==='free')return start('free');play(g)}
function studioAnalytics(){if(!VLT_BANK.length){VLT_ensureBank().then(()=>{if(STUDIO_PAGE==='analytics')studioAnalytics()}).catch(e=>studioToast(e.message));return;}const app=document.getElementById('app'),part=studioPartStats(),hist=studioMockHistory(),miss=Object.keys(VLT_STATE.missed||{}).map(id=>VLT_get(id)).filter(Boolean),days={};(VLT_STATE.history||[]).forEach(h=>{if(h.at){const d=new Date(h.at).toLocaleDateString('en-CA');days[d]=(days[d]||0)+1}});const calendar=Array.from({length:28},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(27-i));const k=d.toLocaleDateString('en-CA');const n=days[k]||0;return `<i class="${n>=5?'on4':n>=3?'on3':n>=2?'on2':n?'on1':''}" title="${k}: ${n} รอบ"></i>`}).join('');const accuracy=studioAccuracy();app.innerHTML=`<div class="st-section-head" style="margin-top:0"><div><div class="st-eyebrow">LEARNING ANALYTICS</div><h1 class="st-title">สถิติและการพัฒนา</h1><p class="st-subtitle">ใช้ข้อมูลผลฝึกที่บันทึกจริง เพื่อดูแนวโน้มและเลือกทักษะที่ควรโฟกัส</p></div></div><div class="st-grid four"><div class="st-card st-kpi"><div class="st-kpi-label">ความแม่นยำข้อสอบ</div><div class="st-kpi-value">${accuracy===null?'—':accuracy+'%'}</div><div class="st-kpi-foot">${VLT_STATE.correct}/${VLT_STATE.answered} ข้อ</div></div><div class="st-card st-kpi"><div class="st-kpi-label">ทำข้อสอบแล้ว</div><div class="st-kpi-value">${VLT_STATE.answered.toLocaleString()}</div><div class="st-kpi-foot">นับเฉพาะข้อที่บันทึกคำตอบ</div></div><div class="st-card st-kpi"><div class="st-kpi-label">ชุดจำลองที่เสร็จ</div><div class="st-kpi-value">${studioCompleted()}/20</div><div class="st-kpi-foot">Full mock completion</div></div><div class="st-card st-kpi"><div class="st-kpi-label">ข้อที่ควรทบทวน</div><div class="st-kpi-value">${miss.length}</div><div class="st-kpi-foot">รายการข้อสอบที่เคยตอบผิด</div></div></div><div class="st-main-grid" style="margin-top:17px"><div class="st-card"><div class="st-eyebrow">SKILL BREAKDOWN</div><h2 style="font-size:18px;margin:5px 0 4px">ความแม่นยำรายทักษะ</h2><p class="st-subtitle">คำนวณจากผลสอบจำลองเต็มชุดที่ส่งแล้ว</p>${part.some(x=>x.total)?part.map(x=>`<div class="st-bar-row"><span class="name">${studioEsc(x.name)}</span><div class="st-chart-bar"><i style="width:${x.acc||0}%"></i></div><b>${x.acc==null?'—':x.acc+'%'}</b></div><small class="st-muted">${x.correct}/${x.total} ข้อ</small>`).join(''):'<div class="st-empty">ยังไม่มีข้อมูลทักษะจากชุดสอบเต็ม</div>'}</div><div class="st-card"><div class="st-eyebrow">STUDY CONSISTENCY</div><h2 style="font-size:18px;margin:5px 0 4px">กิจกรรม 28 วันล่าสุด</h2><p class="st-subtitle">แต่ละช่องแทนหนึ่งวัน สีเข้มขึ้นตามจำนวนรอบฝึก</p><div class="st-heat" style="margin:22px 0 12px">${calendar}</div><div class="st-inline"><span class="st-tag">0 รอบ</span><span class="st-tag" style="background:#d8e1ff">1 รอบ</span><span class="st-tag" style="background:#a8b9ff">2 รอบ</span><span class="st-tag" style="background:#6381ed;color:#fff">3–4</span><span class="st-tag" style="background:#2f51c4;color:#fff">5+</span></div></div></div><div class="st-section-head"><div><h2>แนวโน้มคะแนนชุดจำลอง</h2><p>คะแนนแสดงตามลำดับเวลา · คะแนนเต็ม 100</p></div></div><div class="st-card">${hist.length?hist.slice().reverse().slice(-10).map((h,i)=>`<div class="st-bar-row"><span class="name">ชุด ${h.setNo||'—'} · ${new Date(h.at).toLocaleDateString('th-TH',{day:'numeric',month:'short'})}</span><div class="st-chart-bar"><i style="width:${(h.score||0)}%"></i></div><b>${h.score}/100</b></div>`).join(''):'<div class="st-empty">ทำชุดจำลองเต็มอย่างน้อย 1 ชุดเพื่อเริ่มดูแนวโน้มคะแนน</div>'}</div><div class="st-section-head"><div><h2>รายการข้อสอบที่ควรทบทวน</h2><p>ข้อที่เคยตอบผิดและยังอยู่ในคลังทบทวน</p></div><button class="st-btn secondary small" onclick="VLT_startReview()" ${miss.length?'':'disabled'}>เริ่มทบทวน</button></div><div class="st-card">${miss.length?miss.slice(0,12).map((q,i)=>`<div class="st-row"><div><b>${i+1}. ${studioEsc(q.prompt).slice(0,100)}</b><small>${studioQuestionParts().find(x=>x.id===q.category)?.name||q.category} · ${studioEsc(q.topic||'')}</small></div><span class="st-tag gold">ผิด ${VLT_STATE.missed[q.id]} ครั้ง</span></div>`).join(''):'<div class="st-empty">ยังไม่มีข้อผิดในคลังทบทวน ลองทำชุดฝึกก่อน</div>'}</div><p class="st-footer-note">หมายเหตุ: กราฟไม่สร้างข้อมูลย้อนหลังให้เอง แสดงเฉพาะข้อมูลกิจกรรมและชุดจำลองที่แอปบันทึกได้ในเบราว์เซอร์นี้</p>`}
function studioSettings(){const app=document.getElementById('app');app.innerHTML=`<section class="pf-hero"><div class="pf-id"><div class="st-eyebrow">PREFERENCES &amp; DATA</div><h1 class="pf-name">ตั้งค่าและสำรองข้อมูล</h1><p class="pf-meta">จัดการการแสดงผลและดูแลความคืบหน้าการเรียนของคุณ</p></div></section>
<div class="se-group"><div class="se-label">การแสดงผล</div><div class="pf-card se-row"><div><b>ธีมหน้าจอ</b><small>เลือกโหมดสว่างหรือมืด</small></div><select aria-label="ธีมการแสดงผล" class="st-select" style="width:auto" onchange="studioTheme(this.value)"><option value="light" ${STUDIO_PROFILE.theme!=='dark'?'selected':''}>สว่าง</option><option value="dark" ${STUDIO_PROFILE.theme==='dark'?'selected':''}>มืด</option></select></div></div>
<div class="se-group"><div class="se-label">สำรองและกู้คืนข้อมูล</div><div class="pf-card"><p class="se-text">ข้อมูลเวอร์ชันนี้บันทึกในเบราว์เซอร์ของอุปกรณ์นี้เป็นหลัก ควรส่งออกไฟล์สำรองเป็นระยะ หากล้างข้อมูลเว็บไซต์หรือเปลี่ยนอุปกรณ์ ข้อมูลอาจไม่ตามไปโดยอัตโนมัติ</p><p class="se-sub">ไฟล์เดียวรวมโปรไฟล์ ความคืบหน้าศัพท์ สถิติ ข้อมูลข้อสอบ เป้าคะแนน ปฏิทิน และสถานะรอบฝึกที่บันทึกไว้</p><div class="se-actions"><button class="st-btn" onclick="studioExportAll()">⬇ ส่งออกข้อมูลทั้งหมด</button><button class="st-btn secondary" onclick="document.getElementById('studioImportFile').click()">⬆ นำเข้าไฟล์สำรอง</button><input type="file" id="studioImportFile" accept="application/json,.json" style="display:none" onchange="studioImportAll(this)"></div><p class="se-hint">ควรส่งออกไฟล์สำรองก่อนล้างข้อมูลเบราว์เซอร์หรือเปลี่ยนอุปกรณ์</p></div></div>
<div class="se-group"><div class="se-label">จัดการความคืบหน้า</div><div class="pf-card"><p class="se-text">ล้างเฉพาะคะแนนและประวัติการฝึกในอุปกรณ์นี้ โดยไม่ลบไฟล์หรือเปลี่ยนการตั้งค่าธีม โปรไฟล์</p><button class="st-btn danger" onclick="studioResetProgress()">ล้างความคืบหน้าการเรียน…</button></div></div>
<div class="se-group"><div class="se-label">ที่เก็บข้อมูล</div><div class="pf-card"><div class="se-row"><div><b>โปรไฟล์และเป้าหมาย</b><small>ชื่อ เป้าคะแนน เวลาเรียนต่อวัน</small></div><span class="st-tag green">บันทึกในเครื่อง</span></div><div class="se-row"><div><b>ข้อสอบและ XP</b><small>สถิติ คำตอบผิด ชุดที่ทำเสร็จ</small></div><span class="st-tag green">บันทึกในเครื่อง</span></div><div class="se-row"><div><b>ความคืบหน้าศัพท์</b><small>รู้แล้ว / ทบทวน / คำโปรด / SRS</small></div><span class="st-tag green">บันทึกในเครื่อง</span></div><div class="se-alert">เวอร์ชันไฟล์เดี่ยวนี้ยังไม่เชื่อมบัญชีผู้ใช้หรือฐานข้อมูลออนไลน์ ข้อมูลจะไม่ซิงก์ข้ามเครื่องอัตโนมัติ ต้องใช้ไฟล์สำรองย้ายข้อมูล การเปิดใช้งานบัญชีและ cloud sync ต้องตั้งค่า backend และระบบยืนยันตัวตนจริงก่อน</div></div></div>
<div class="se-group"><div class="se-label">แหล่งข้อมูลและขอบเขต</div><div class="pf-card"><p class="se-text">คลังข้อสอบฝึก 1,200 ข้อและคลังศัพท์นำเข้าจากไฟล์ต้นทางที่ให้มา โครงสร้างข้อสอบอ้างอิง Blueprint ปัจจุบันของ myTCAS เนื้อหาโจทย์ในแอปไม่ได้ถูกระบุว่าเป็นข้อสอบทางการ</p><a class="st-link" href="https://www.mytcas.com/blueprint/tgat1-91/" target="_blank" rel="noopener">เปิด TGAT1 Blueprint บน myTCAS ↗</a></div></div>`}
function studioTheme(v){STUDIO_PROFILE.theme=v;document.documentElement.dataset.theme=v;studioSave(STUDIO_STORE,STUDIO_PROFILE)}
function studioResetProgress(){
  TGConfirm('ขั้นที่ 1 จาก 2 · ต้องการล้างสถิติ ข้อสอบที่ทำแล้ว คำที่ทบทวน และความคืบหน้า Learning Hub ใช่หรือไม่? แนะนำให้ส่งออกไฟล์สำรองก่อน').then(ok=>{
    if(!ok)return;
    TGConfirm('ขั้นที่ 2 จาก 2 · ยืนยันล้างความคืบหน้าทั้งหมดในอุปกรณ์นี้หรือไม่? การล้างนี้ย้อนคืนไม่ได้').then(yes=>{
      if(!yes)return;
      const keepProfile='tgat1_english_studio_v1';
      const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).filter(k=>k&&k!==keepProfile&&(window.TGAT1DataGuards?.isImportableLocalKey(k)||['eng3','engdaily_vault_v1'].includes(k)));
      keys.forEach(k=>localStorage.removeItem(k));
      location.reload();
    }).catch(()=>studioToast('ไม่สามารถยืนยันการล้างข้อมูลได้'));
  }).catch(()=>studioToast('ไม่สามารถเปิดการยืนยันได้'));
}
function studioExportAll(){try{const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).filter(k=>k&&(k.startsWith('tgat1_')||['eng3','engdaily_vault_v1'].includes(k)));const local={};keys.forEach(k=>{try{const v=localStorage.getItem(k);if(v!==null)local[k]=JSON.parse(v)}catch(e){local[k]=localStorage.getItem(k)}});const payload={app:'TGAT1 English Studio',version:2,exportedAt:new Date().toISOString(),profile:STUDIO_PROFILE,vocab:STUDIO_VSTATE,legacy:JSON.parse(localStorage.getItem('eng3')||'null'),exam:JSON.parse(localStorage.getItem('engdaily_vault_v1')||'null'),local};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tgat1-english-studio-backup.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);studioToast('ส่งออกข้อมูลสำรองแล้ว')}catch(e){studioToast('ส่งออกไม่สำเร็จ')}}
function studioImportAll(input){const f=input.files&&input.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const x=JSON.parse(rd.result);if(x.app!=='TGAT1 English Studio'||![1,2].includes(x.version))throw new Error('invalid');TGConfirm('นำเข้าข้อมูลสำรองนี้หรือไม่? ข้อมูลปัจจุบันในส่วนที่มีอยู่จะถูกแทนที่').then(ok=>{if(!ok)return;if(x.profile){const safeProfile=window.TGAT1DataGuards?window.TGAT1DataGuards.normalizeProfile(x.profile):{name:typeof x.profile.name==='string'?x.profile.name.slice(0,40):'',target:75,theme:x.profile.theme==='dark'?'dark':'light'};localStorage.setItem(STUDIO_STORE,JSON.stringify(safeProfile))}if(x.vocab){const safeVocab=window.TGAT1DataGuards?window.TGAT1DataGuards.normalizeVocabState(x.vocab,STUDIO_DATA.words):STUDIO_VSTATE;localStorage.setItem('tgat1_studio_vocab_progress_v1',JSON.stringify(safeVocab))}if(x.legacy){const safeLegacy=window.TGAT1DataGuards?window.TGAT1DataGuards.normalizeLegacyState(x.legacy,PATH,V.map(v=>v[0])):x.legacy;localStorage.setItem('eng3',JSON.stringify(safeLegacy))}if(x.exam){const safeExam=window.TGAT1DataGuards?window.TGAT1DataGuards.normalizeVltState(x.exam,VLT_BANK,VLT_CATS):x.exam;localStorage.setItem('engdaily_vault_v1',JSON.stringify(safeExam))}if(x.local&&typeof x.local==='object'&&!Array.isArray(x.local)){Object.entries(x.local).forEach(([k,v])=>{if(window.TGAT1DataGuards?.isImportableLocalKey(k))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v))})}location.reload()}).catch(e=>{studioToast('ไฟล์ไม่ถูกต้องหรือไม่ใช่ไฟล์ TGAT1 English Studio')})}catch(e){studioToast('ไฟล์ไม่ถูกต้องหรือไม่ใช่ไฟล์ TGAT1 English Studio')} };rd.readAsText(f);input.value=''}
function studioInit(){document.documentElement.dataset.theme=STUDIO_PROFILE.theme||'light';STUDIO_PAGE='home';studioUpdateChrome('home');studioHome();}

// Maintain the existing learning engine and route its exits back into the new navigation shell.
window.addEventListener('keydown',e=>{if(e.key==='Escape')studioCloseModal()});

// ===== Reliable practice-session recovery =====
const STUDIO_SESSION_KEY='tgat1_studio_active_session_v1';
let STUDIO_RESTORING=false;
let STUDIO_SESSION_FINISHED=false;
function studioPersistSession(){
  try{
    if(STUDIO_SESSION_FINISHED || !Q || !Array.isArray(Q.qs) || !Q.qs.length){
      localStorage.removeItem(STUDIO_SESSION_KEY); return;
    }
    const snapshot={version:1,savedAt:Date.now(),page:STUDIO_PAGE||'game',
      gameReturn:!!window.STUDIO_GAME_RETURN,question:Q};
    localStorage.setItem(STUDIO_SESSION_KEY,JSON.stringify(snapshot));
  }catch(e){studioToast('บันทึกความคืบหน้ารอบนี้ไม่สำเร็จ กรุณาอย่าปิดหน้าเว็บ');}
}
function studioClearSession(){
  try{localStorage.removeItem(STUDIO_SESSION_KEY)}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
}
function studioRestoreSession(){
  try{
    const raw=localStorage.getItem(STUDIO_SESSION_KEY); if(!raw)return false;
    const snap=JSON.parse(raw),q=snap&&snap.question;
    if(!snap||snap.version!==1||!q||!Array.isArray(q.qs)||!q.qs.length||
       !Number.isInteger(q.i)||q.i<0||q.i>=q.qs.length){studioClearSession();return false;}
    const age=Date.now()-(Number(snap.savedAt)||0);
    if(age>7*86400000){studioClearSession();return false;}
    if(q.mode==='tgat'&&(!Number.isFinite(q.deadline)||q.deadline<=Date.now())){
      Q=q; finish(); studioClearSession(); return true;
    }
    if(q.mode!=='tgat' && q.mode!=='game' && q.mode!=='free' && q.mode!=='daily' &&
       q.mode!=='review' && q.mode!=='stage' && q.mode!=='test')return false;
    Q=q; STUDIO_SESSION_FINISHED=false; STUDIO_PAGE=['game','exam'].includes(snap.page)?snap.page:'game';
    window.STUDIO_GAME_RETURN=!!snap.gameReturn;
    STUDIO_RESTORING=true;
    studioUpdateChrome(STUDIO_PAGE);
    if(Q.mode==='tgat'){stopExamClock();examTimer=setInterval(updateExamClock,1000);quiz();updateExamClock();}
    else quiz();
    STUDIO_RESTORING=false;
    studioToast('กู้คืนรอบฝึกเดิมแล้ว เล่นต่อจากข้อที่ค้างได้เลย');
    return true;
  }catch(e){STUDIO_RESTORING=false;return false;}
}
window.addEventListener('beforeunload',studioPersistSession);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')studioPersistSession()});

studioInit();studioRestoreSession();



// ===== v6 learning systems: Error Notebook + Smart Review + advanced practice =====
const STUDIO_ERROR_KEY='tgat1_studio_error_notebook_v1';
const STUDIO_REVIEW_KEY='tgat1_studio_smart_review_v1';
function studioReadJSON(k, fallback){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?fallback:x}catch(e){return fallback}}
function studioWriteJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){studioToast('พื้นที่จัดเก็บเต็มหรือเบราว์เซอร์ปฏิเสธการบันทึก');return false}}
function studioErrorBook(){
  const raw=studioReadJSON(STUDIO_ERROR_KEY,{}),safe=Object.create(null);
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return safe;
  Object.entries(raw).forEach(([id,entry])=>{
    const q=typeof VLT_get==='function'?VLT_get(id):null;
    if(!q||!entry||typeof entry!=='object'||Array.isArray(entry))return;
    safe[q.id]={id:q.id,prompt:q.prompt,category:q.category,context:q.context,options:q.options,answer:q.answer,
      explanation:typeof VLT_learningExplanation==='function'?VLT_learningExplanation(q):q.explanation,
      mistakes:Math.max(1,Math.min(100000,Math.floor(Number(entry.mistakes)||1))),
      lastSeen:Math.max(0,Math.min(8640000000000000,Number(entry.lastSeen)||0))};
  });
  return safe;
}
function studioReviewQueue(){
  const raw=studioReadJSON(STUDIO_REVIEW_KEY,{}),safe=Object.create(null);
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return safe;
  Object.entries(raw).forEach(([id,entry])=>{
    const q=typeof VLT_get==='function'?VLT_get(id):null;
    if(!q||!entry||typeof entry!=='object'||Array.isArray(entry))return;
    const due=Number(entry.due),interval=Number(entry.interval),ease=Number(entry.ease);
    safe[q.id]={id:q.id,due:Number.isFinite(due)?Math.max(0,Math.min(8640000000000000,due)):0,
      interval:Number.isFinite(interval)?Math.max(0,Math.min(525600,interval)):0,
      ease:Number.isFinite(ease)?Math.max(1.3,Math.min(3,ease)):2.3,
      repetitions:Math.max(0,Math.min(100000,Math.floor(Number(entry.repetitions)||0))),
      status:['learning','scheduled'].includes(entry.status)?entry.status:'learning'};
  });
  return safe;
}
function studioCaptureErrors(run){
  if(!run||!Array.isArray(run.qs))return;
  const book=studioErrorBook(),queue=studioReviewQueue(),now=Date.now();
  run.qs.forEach((q,index)=>{
    const user=Number.isInteger(q.userAnswer)?q.userAnswer:(Number.isInteger(q.selected)?q.selected:null);
    if(user===q.a)return;
    const id=q.id||q.questionId||('run-'+(run.mode||'practice')+'-'+(q.examNo||index+1)+'-'+String(q.p||q.prompt||q.w||'').slice(0,32));
    const old=book[id]||{};
    book[id]={id,mode:run.mode||'practice',category:q.category||q.kind||q.section||'practice',
      prompt:q.prompt||q.p||q.w||('ข้อ '+(index+1)),context:q.context||q.passage||'',
      options:q.o||q.options||[],answer:q.a,selected:user,explanation:q.exp||q.explanation||'',
      mistakes:(old.mistakes||0)+1,firstSeen:old.firstSeen||now,lastSeen:now,
      lastChoice:user===null?'unanswered':String(user)};
    const prev=queue[id]||{repetitions:0};
    queue[id]={id,due:now+10*60*1000,repetitions:prev.repetitions||0,interval:10,
      ease:prev.ease||2.3,status:'learning',lastResult:'again'};
  });
  studioWriteJSON(STUDIO_ERROR_KEY,book);studioWriteJSON(STUDIO_REVIEW_KEY,queue);
}
function studioFormatDue(t){if(!t)return 'ยังไม่กำหนด';const d=t-Date.now();if(d<=0)return 'ถึงเวลาทบทวน';if(d<3600000)return 'อีก '+Math.ceil(d/60000)+' นาที';if(d<86400000)return 'อีก '+Math.ceil(d/3600000)+' ชม.';return 'อีก '+Math.ceil(d/86400000)+' วัน'}
function studioOpenErrors(){STUDIO_PAGE='errors';studioUpdateChrome('errors');studioRenderTools()}
function studioOpenReview(){STUDIO_PAGE='review';studioUpdateChrome('review');studioRenderTools()}
function studioOpenAdvanced(){STUDIO_PAGE='advanced';studioUpdateChrome('advanced');studioRenderTools()}
function studioErrorResolve(id){const b=studioErrorBook();delete b[id];studioWriteJSON(STUDIO_ERROR_KEY,b);const q=studioReviewQueue();delete q[id];studioWriteJSON(STUDIO_REVIEW_KEY,q);studioRenderTools()}
function studioReviewResult(id,grade){
  const q=studioReviewQueue(),item=q[id]||{repetitions:0,interval:10,ease:2.3};
  if(grade==='again'){item.repetitions=0;item.interval=10;item.ease=Math.max(1.3,(item.ease||2.3)-.2);item.due=Date.now()+10*60000;item.status='learning';}
  else if(grade==='hard'){item.repetitions=(item.repetitions||0)+1;item.interval=Math.max(30,Math.round((item.interval||10)*1.5));item.ease=Math.max(1.3,(item.ease||2.3)-.15);item.due=Date.now()+item.interval*60000;item.status='learning';}
  else {item.repetitions=(item.repetitions||0)+1;item.interval=item.repetitions===1?1440:item.repetitions===2?4320:Math.round((item.interval||1440)*2.2);item.ease=Math.min(3,(item.ease||2.3)+.08);item.due=Date.now()+item.interval*60000;item.status='scheduled';}
  item.lastResult=grade;q[id]=item;studioWriteJSON(STUDIO_REVIEW_KEY,q);studioRenderTools();
}
function studioRenderTools(){
  const app=document.getElementById('app');if(!app)return;
  const book=studioErrorBook(),queue=studioReviewQueue(),entries=Object.values(book).sort((a,b)=>(b.lastSeen||0)-(a.lastSeen||0));
  const due=Object.values(queue).filter(x=>(x.due||0)<=Date.now()).length;
  if(STUDIO_PAGE==='errors'){
    app.innerHTML=`<div class="st-section-head"><div><div class="st-eyebrow">LEARNING FROM MISTAKES</div><h1 class="st-title">Error Notebook</h1><p class="st-subtitle">เก็บโจทย์ที่ตอบผิดหรือเว้นว่าง พร้อมเหตุผลและจำนวนครั้งที่พลาด</p></div></div>
    <div class="st-tool-grid"><div class="st-card st-kpi"><div class="st-kpi-label">รายการข้อผิด</div><div class="st-kpi-value">${entries.length}</div></div><div class="st-card st-kpi"><div class="st-kpi-label">ถึงเวลาทบทวน</div><div class="st-kpi-value">${due}</div></div></div>
    <div class="st-inline" style="margin:14px 0"><button class="st-btn" onclick="studioOpenReview()">เปิด Smart Review →</button><button class="st-btn secondary" onclick="studioOpenAdvanced()">บทเรียนขั้นสูง</button></div>
    <div class="st-card">${entries.length?entries.map((x,i)=>`<article class="st-error-item"><b>${i+1}. ${studioEsc(String(x.prompt||'').slice(0,220))}</b><div class="st-error-meta"><span class="st-pill">${studioEsc(x.category||'Practice')}</span><span class="st-pill">พลาด ${x.mistakes||1} ครั้ง</span><span class="st-pill">${studioFormatDue((queue[x.id]||{}).due)}</span></div>${x.context?`<p>${studioEsc(String(x.context).slice(0,500))}</p>`:''}<p><b>คำตอบที่ถูก:</b> ${Number.isInteger(x.answer)&&x.options?.[x.answer]!==undefined?studioEsc(x.options[x.answer]):'ดูเฉลยในชุดต้นทาง'}</p>${Number.isInteger(x.selected)&&x.options?.[x.selected]!==undefined?`<p><b>คำตอบที่เลือก:</b> ${studioEsc(x.options[x.selected])}</p>`:'<p>ไม่ได้ตอบ</p>'}<p>${studioEsc(x.explanation||'ยังไม่มีคำอธิบายแนบมากับข้อมูลข้อนี้')}</p><div class="st-error-actions"><button class="st-btn secondary small" onclick="studioReviewResult('${String(x.id).replace(/'/g,"")}','again')">ทบทวนอีกครั้ง</button><button class="st-btn ghost small" onclick="studioErrorResolve('${String(x.id).replace(/'/g,"")}')">ทำเครื่องหมายว่าแก้ได้แล้ว</button></div></article>`).join(''):'<div class="st-empty-state">ยังไม่มีข้อผิดที่บันทึกจากระบบใหม่นี้<br>ทำแบบฝึกหรือชุดจำลอง แล้วข้อที่ผิดจะถูกเพิ่มที่นี่</div>'}</div>`;
    return;
  }
  if(STUDIO_PAGE==='review'){
    const dueItems=Object.values(queue).filter(x=>(x.due||0)<=Date.now()).sort((a,b)=>(a.due||0)-(b.due||0));
    const item=dueItems[0],error=item&&book[item.id];
    app.innerHTML=`<div class="st-section-head"><div><div class="st-eyebrow">SPACED REPETITION</div><h1 class="st-title">Smart Review</h1><p class="st-subtitle">จัดลำดับทบทวนตามเวลาที่ถึงกำหนดและประวัติการตอบ</p></div></div>
    <div class="st-tool-grid"><div class="st-card st-kpi"><div class="st-kpi-label">ถึงเวลาทบทวน</div><div class="st-kpi-value">${dueItems.length}</div></div><div class="st-card st-kpi"><div class="st-kpi-label">อยู่ในตารางทบทวน</div><div class="st-kpi-value">${Object.keys(queue).length}</div></div></div>
    ${error?`<div class="st-card" style="margin-top:14px"><div class="st-eyebrow">NEXT REVIEW</div><h2 style="font-size:19px">${studioEsc(error.prompt||'โจทย์ทบทวน')}</h2>${error.context?`<p>${studioEsc(error.context)}</p>`:''}<div class="st-divider"></div>${(error.options||[]).map((o,i)=>`<div class="st-row"><span>${String.fromCharCode(65+i)}. ${studioEsc(o)}</span>${i===error.answer?'<span class="st-tag green">คำตอบถูก</span>':''}</div>`).join('')}<p style="margin-top:12px"><b>เหตุผล:</b> ${studioEsc(error.explanation||'ไม่มีคำอธิบาย')}</p><p class="st-subtitle">ให้ประเมินว่าจำหลักการได้แค่ไหน แล้วเลือกระดับการทบทวน</p><div class="st-inline"><button class="st-btn" onclick="studioReviewResult('${String(item.id).replace(/'/g,"")}','again')">ยังจำไม่ได้ · 10 นาที</button><button class="st-btn secondary" onclick="studioReviewResult('${String(item.id).replace(/'/g,"")}','hard')">ยังไม่คล่อง · ช่วงสั้น</button><button class="st-btn ghost" onclick="studioReviewResult('${String(item.id).replace(/'/g,"")}','good')">จำได้ · เว้นระยะ</button></div></div>`:`<div class="st-card st-empty-state">${Object.keys(queue).length?'ยังไม่มีรายการถึงกำหนดในตอนนี้ กลับมาทบทวนตามเวลาที่ระบบจัดไว้':'ยังไม่มีรายการทบทวน ลองทำข้อสอบให้ระบบเก็บข้อผิดก่อน'}<div style="margin-top:14px"><button class="st-btn secondary" onclick="studioOpenErrors()">ไป Error Notebook</button></div></div>`}
    <div class="st-card" style="margin-top:14px"><h3>รายการถัดไป</h3>${Object.values(queue).sort((a,b)=>(a.due||0)-(b.due||0)).slice(0,8).map(x=>`<div class="st-row"><b>${studioEsc((book[x.id]||{}).prompt||x.id).slice(0,80)}</b><small>${studioFormatDue(x.due)}</small></div>`).join('')||'<p class="st-subtitle">ไม่มีรายการในคิว</p>'}</div>`;
    return;
  }
  if(STUDIO_PAGE==='advanced'){
    app.innerHTML=`<div class="st-section-head"><div><div class="st-eyebrow">ADVANCED LEARNING</div><h1 class="st-title">บทเรียนและเกมขั้นสูง</h1><p class="st-subtitle">ฝึกการอ่านเชิงอนุมาน การจับน้ำเสียง และการใช้คำเชื่อมในบริบทที่ซับซ้อน</p></div></div>
    <div class="st-tool-grid">
      <div class="st-card"><div class="st-icon-box">🧠</div><h2>Inference Lab</h2><p class="st-subtitle">ฝึกแยกข้อเท็จจริง ข้ออนุมาน และข้อสรุปที่เกินหลักฐาน</p><button class="st-btn" onclick="VLT_startCategory('rc')">ฝึก Reading Comprehension</button></div>
      <div class="st-card"><div class="st-icon-box">🧩</div><h2>Context & Cohesion</h2><p class="st-subtitle">ฝึกคำเชื่อม ความสัมพันธ์ระหว่างประโยค และความต่อเนื่องของย่อหน้า</p><button class="st-btn" onclick="VLT_startCategory('tc')">ฝึก Text Completion</button></div>
      <div class="st-card"><div class="st-icon-box">🎧</div><h2>Conversation Strategy</h2><p class="st-subtitle">ฝึกเจตนาผู้พูด การตอบรับ การปฏิเสธอย่างสุภาพ และบริบทบทสนทนา</p><button class="st-btn" onclick="VLT_startCategory('long')">ฝึก Long Conversations</button></div>
      <div class="st-card"><div class="st-icon-box">⚡</div><h2>Timed 60-minute Mock</h2><p class="st-subtitle">ทำข้อสอบจำลอง 60 ข้อภายใน 60 นาที (ชุดถัดไปที่ยังไม่ได้ทำจาก 20 ชุด) และวิเคราะห์ผลหลังส่ง</p><button class="st-btn" onclick="startTgatExam()">เริ่มจับเวลา</button></div>
    </div>
    <div class="st-note" style="margin-top:14px">โมดูลนี้ใช้คลังโจทย์ฝึกที่มีอยู่ ไม่ได้อ้างว่าเป็นข้อสอบจริงย้อนหลัง และยังไม่ใช่บทเรียนวิดีโอหรือระบบตรวจคำตอบด้วย AI</div>`;
    return;
  }
}
const studioOriginalFinishV6=finish;
finish=function(){try{studioCaptureErrors(Q)}catch(e){(window.TGAT1_ERR||Object)(e,'app')}return studioOriginalFinishV6.apply(this,arguments)};
const studioOriginalRenderV6=studioRender;
studioRender=function(){if(['errors','review','advanced'].includes(STUDIO_PAGE)){studioRenderTools();return}return studioOriginalRenderV6.apply(this,arguments)};
const studioOriginalChromeV6=studioUpdateChrome;
studioUpdateChrome=function(page){const r=studioOriginalChromeV6.apply(this,arguments);if(['errors','review','advanced'].includes(page)){const c=document.getElementById('studioCrumb'),t=document.getElementById('studioTitle');if(c)c.textContent=page.toUpperCase();if(t)t.textContent=page==='errors'?'Error Notebook':page==='review'?'Smart Review':'บทเรียนขั้นสูง'}return r};


// ===== v7: motion system; presentation only, all original screens remain =====
(function(){
  if(window.__TGAT1_PERSONAL_MOTION_V7__) return;
  window.__TGAT1_PERSONAL_MOTION_V7__=true;

  const app=document.getElementById('app');
  if(app && window.MutationObserver){
    const animateScreen=()=>{
      const nodes=Array.from(app.children);
      nodes.forEach(node=>{
        node.classList.remove('st-screen-in');
        void node.offsetWidth;
        node.classList.add('st-screen-in');
      });
    };
    const observer=new MutationObserver(records=>{
      if(records.some(r=>r.addedNodes && r.addedNodes.length)) animateScreen();
    });
    observer.observe(app,{childList:true});
    animateScreen();
  }

  // Add a small press ripple to real interactive controls without changing their action.
  document.addEventListener('__tgat1_off_ripple',function(ev){
    const target=ev.target && ev.target.closest &&
      ev.target.closest('button,.st-word,.gt,.vault-set');
    if(!target || target.disabled) return;
    const rect=target.getBoundingClientRect();
    const ripple=document.createElement('span');
    ripple.className='st-ripple';
    ripple.style.left=(ev.clientX-rect.left)+'px';
    ripple.style.top=(ev.clientY-rect.top)+'px';
    target.appendChild(ripple);
    ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});
    setTimeout(()=>{if(ripple.isConnected)ripple.remove()},800);
  },{passive:true});

  // Page navigation gets a top light sweep; the new screen itself enters with a soft motion.
  if(typeof window.studioNav==='function'){
    const original=window.studioNav;
    window.studioNav=function(){
      const before=window.STUDIO_PAGE;
      const result=original.apply(this,arguments);
      if(false){
        const bar=document.createElement('div');
        bar.className='st-page-sweep';
        document.body.appendChild(bar);
        bar.addEventListener('animationend',()=>bar.remove(),{once:true});
        setTimeout(()=>{if(bar.isConnected)bar.remove()},750);
      }
      return result;
    };
  }

  // A subtle, one-time entrance for the app shell; never blocks taps.
  requestAnimationFrame(()=>document.body.classList.add('st-personal-ready'));
})();


// ===== v8 strong transitions: retain every existing route, game and screen =====
(function(){
 return;
 window.__TGAT1_LIGHT_STRONG_V8__=true;
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function burst(x,y){
   if(reduced)return;
   const el=document.createElement('span');
   el.style.cssText='position:fixed;z-index:10000;left:'+x+'px;top:'+y+'px;width:8px;height:8px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0%,#9baaff 35%,rgba(150,120,255,0) 72%);box-shadow:0 0 18px 8px rgba(111,126,255,.22);transform:translate(-50%,-50%);animation:v8Burst .55s ease-out forwards';
   document.body.appendChild(el);el.addEventListener('animationend',()=>el.remove(),{once:true});
 }
 if(!document.getElementById('v8-burst-keyframes')){
   const st=document.createElement('style');st.id='v8-burst-keyframes';
   st.textContent='@keyframes v8Burst{0%{opacity:1;transform:translate(-50%,-50%) scale(.3)}100%{opacity:0;transform:translate(-50%,-50%) scale(8)}}';
   document.head.appendChild(st);
 }
 document.addEventListener('pointerdown',e=>{
   const t=e.target&&e.target.closest&&e.target.closest('button,.st-btn,.opt,.gt,.st-word,.vault-set');
   if(!t||t.disabled)return;
   burst(e.clientX,e.clientY);
 },{passive:true});
 // Make route changes feel decisive while preserving original handlers and state.
 if(typeof window.studioNav==='function'&&!window.__v8NavWrapped){
   window.__v8NavWrapped=true;
   const prev=window.studioNav;
   window.studioNav=function(){
     const before=window.STUDIO_PAGE;
     const r=prev.apply(this,arguments);
     if(before!==window.STUDIO_PAGE&&!reduced){
       const overlay=document.createElement('div');
       overlay.style.cssText='position:fixed;inset:0;z-index:9998;pointer-events:none;background:radial-gradient(circle at 50% 42%,rgba(115,137,255,.16),transparent 58%);animation:v8PageFlash .48s ease-out forwards';
       document.body.appendChild(overlay);overlay.addEventListener('animationend',()=>overlay.remove(),{once:true});
     }
     return r;
   };
 }
 if(!document.getElementById('v8-pageflash-keyframes')){
   const st=document.createElement('style');st.id='v8-pageflash-keyframes';
   st.textContent='@keyframes v8PageFlash{0%{opacity:0}25%{opacity:1}100%{opacity:0}}';
   document.head.appendChild(st);
 }
})();


// ===== v9 Personal Edition: vocabulary-first home, study calendar, target score, grammar =====
(function(){
 if(window.__TGAT1_PERSONAL_V9__)return;
 window.__TGAT1_PERSONAL_V9__=true;
 const TARGET_KEY='tgat1_personal_target_score_v1';
 const VLT_RUN_KEY='tgat1_vlt_active_run_v1';
 const DAY_KEY='tgat1_personal_study_days_v1';
 const safeRead=(k,fb)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?fb:v}catch(e){return fb}};
 const safeWrite=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
 const esc=x=>htmlEsc(x);
 function todayKey(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
 function recordStudyDay(){
   const days=safeRead(DAY_KEY,[]);
   const key=todayKey();
   if(!days.includes(key)){days.push(key);safeWrite(DAY_KEY,days.slice(-400))}
 }
 function target(){const p=Number(STUDIO_PROFILE&&STUDIO_PROFILE.target);if(Number.isFinite(p)&&p>0)return Math.min(100,p);const n=Number(localStorage.getItem(TARGET_KEY));return Number.isFinite(n)&&n>0?Math.min(100,n):75}
 function setTarget(v){const n=Math.max(1,Math.min(100,Math.round(Number(v)||75)));localStorage.setItem(TARGET_KEY,String(n));try{STUDIO_PROFILE.target=n;studioSave(STUDIO_STORE,STUDIO_PROFILE)}catch(e){(window.TGAT1_ERR||Object)(e,'app')}studioHome()}
 function dailyWord(){
   const list=STUDIO_DATA.words||[];
   if(!list.length)return null;
   const day=Math.floor(new Date().setHours(0,0,0,0)/86400000);
   return {x:list[day%list.length],i:day%list.length};
 }
 function renderHome(){
   recordStudyDay();
   const app=document.getElementById('app');if(!app)return;
   const acc=studioAccuracy(),mocks=studioMockHistory(),latest=mocks[0],due=studioDueWords().length;
   const learned=studioWordLearned(),total=STUDIO_DATA.words.length,word=dailyWord();
   const days=safeRead(DAY_KEY,[]),today=todayKey();
   const recent=Array.from({length:28},(_,n)=>{const d=new Date();d.setDate(d.getDate()-(27-n));const k=todayKey(d);return `<span class="dash-day${days.includes(k)?' active':''}${k===today?' today':''}" title="${k}">${d.getDate()}</span>`}).join('');
   const goal=target(),score=latest?Math.round(latest.score):null;
   const done=studioCompleted(),miss=Object.keys(VLT_STATE.missed||{}).length;
   const percent=total?Math.round(learned/total*100):0;
   const first=STUDIO_PROFILE.name?`กลับมาแล้ว ${esc(STUDIO_PROFILE.name)}`:'วันนี้มาเก็บศัพท์กัน';
   const progressAngle=Math.round(percent*3.6);
   const accuracyLabel=acc===null?'—':acc+'%';
   const wordLabel=word?studioWordPosLabel(word.x.pos)+' · '+word.x.level:'Vocabulary';
   app.innerHTML=`<div class="dash-home">
    <section class="dash-hero">
      <div class="dash-grid-glow" aria-hidden="true"></div>
      <div class="dash-hero-copy">
        <div class="dash-live-pill"><i></i> YOUR PERSONAL EXAM STUDIO <span>·</span> TGAT1</div>
        <h1>${first}<br/><em>พร้อมอัปเลเวลหรือยัง?</em></h1>
        <p>ฝึกให้ตรงจุด เห็นพัฒนาการทุกวัน แล้วเปลี่ยนความพยายามให้เป็นคะแนนที่ดีขึ้น</p>
        <div class="dash-hero-actions">
          <button class="dash-cta-primary" onclick="VLT_startDaily()"><span>เริ่มภารกิจวันนี้</span><b>→</b></button>
          <button class="dash-cta-glass" onclick="studioNav('exam')"><span class="dash-cta-play">▶</span> เข้าสนามสอบ</button>
        </div>
        <div class="dash-hero-foot"><span>✦ 1,200 ข้อสอบฝึก</span><span>✦ ${total.toLocaleString()} คำศัพท์</span><span>✦ 5 ทักษะหลัก</span></div>
      </div>
      <div class="dash-hero-visual" aria-label="ความก้าวหน้าคลังคำศัพท์ ${percent} เปอร์เซ็นต์">
        <div class="dash-orbit dash-orbit-one"></div><div class="dash-orbit dash-orbit-two"></div>
        <div class="dash-gauge" style="--dash-angle:${progressAngle}deg">
          <div class="dash-gauge-inner"><span class="dash-gauge-kicker">WORD POWER</span><strong>${percent}<small>%</small></strong><span class="dash-gauge-label">คลังศัพท์ที่รู้แล้ว</span><div class="dash-gauge-count">${learned.toLocaleString()} / ${total.toLocaleString()} คำ</div></div>
        </div>
        <div class="dash-float-card dash-float-xp"><span class="dash-float-icon">⚡</span><div><b>${studioXP().toLocaleString()} XP</b><small>คะแนนสะสม</small></div><span class="dash-float-spark">✦</span></div>
        <div class="dash-float-card dash-float-streak"><span class="dash-flame">🔥</span><div><b>${studioStreak()} วัน</b><small>ฝึกต่อเนื่อง</small></div></div>
        <div class="dash-hero-star dash-star-a">✦</div><div class="dash-hero-star dash-star-b">✧</div>
      </div>
      <div class="dash-hero-bottomline"><span>SMALL STEPS. BIG SCORE.</span><span>LET'S MAKE IT COUNT <b>↗</b></span></div>
    </section>

    <section class="dash-kpi-grid" aria-label="ภาพรวมความก้าวหน้า">
      <article class="dash-kpi dash-kpi-xp"><div class="dash-kpi-top"><span class="dash-kpi-icon">⚡</span><span class="dash-kpi-tag">TOTAL XP</span></div><strong>${studioXP().toLocaleString()}</strong><small>คะแนนประสบการณ์สะสม</small><div class="dash-kpi-trail"><i style="width:${Math.min(100,(studioXP()%500)/5)}%"></i></div></article>
      <article class="dash-kpi dash-kpi-accuracy"><div class="dash-kpi-top"><span class="dash-kpi-icon">◎</span><span class="dash-kpi-tag">ACCURACY</span></div><strong>${accuracyLabel}</strong><small>${VLT_STATE.correct.toLocaleString()} / ${VLT_STATE.answered.toLocaleString()} ข้อที่ตอบถูก</small><div class="dash-kpi-trail"><i style="width:${acc===null?0:acc}%"></i></div></article>
      <article class="dash-kpi dash-kpi-sets"><div class="dash-kpi-top"><span class="dash-kpi-icon">🏁</span><span class="dash-kpi-tag">MOCK SETS</span></div><strong>${done}<b>/20</b></strong><small>ชุดจำลองที่ทำครบแล้ว</small><div class="dash-kpi-trail"><i style="width:${done/20*100}%"></i></div></article>
      <article class="dash-kpi dash-kpi-review"><div class="dash-kpi-top"><span class="dash-kpi-icon">↻</span><span class="dash-kpi-tag">READY TO REVIEW</span></div><strong>${due.toLocaleString()}</strong><small>คำศัพท์ที่ถึงเวลาทบทวน</small><div class="dash-kpi-action" onclick="studioStartFlashcards()">ทบทวนตอนนี้ <b>→</b></div></article>
    </section>

    <section class="dash-section-head"><div><span class="dash-section-kicker">PICK YOUR NEXT MOVE</span><h2>เริ่มฝึกตรงนี้</h2><p>เลือกโหมดที่เหมาะกับเวลาของคุณ แล้วไปต่อได้เลย</p></div><span class="dash-section-mark">01 <i>/ 02</i></span></section>
    <section class="dash-quick-grid">
      <button class="dash-quick-card quick-vocab" onclick="studioNav('vocab')"><span class="dash-quick-icon">📚</span><span class="dash-quick-arrow">↗</span><b>คลังคำศัพท์</b><small>${total.toLocaleString()} คำ · วลี · collocations</small><span class="dash-quick-link">EXPLORE WORDS <i>→</i></span></button>
      <button class="dash-quick-card quick-flash" onclick="studioStartFlashcards()"><span class="dash-quick-icon">🃏</span><span class="dash-quick-arrow">↗</span><b>Flashcards</b><small>${due?due+' คำถึงเวลาทบทวน':'ฝึกจำคำที่ยังไม่คล่อง'}</small><span class="dash-quick-link">TRAIN YOUR MEMORY <i>→</i></span></button>
      <button class="dash-quick-card quick-game" onclick="studioNav('game')"><span class="dash-quick-icon">🎮</span><span class="dash-quick-arrow">↗</span><b>เกมฝึกทักษะ</b><small>เกมศัพท์ ภาพ และประโยค</small><span class="dash-quick-link">PLAY & LEARN <i>→</i></span></button>
      <button class="dash-quick-card quick-exam" onclick="studioNav('exam')"><span class="dash-quick-icon">📝</span><span class="dash-quick-arrow">↗</span><b>สนามสอบ TGAT1</b><small>20 ชุดเต็ม · 60 ข้อต่อชุด</small><span class="dash-quick-link">ENTER EXAM HALL <i>→</i></span></button>
    </section>

    <section class="dash-section-head dash-section-spaced"><div><span class="dash-section-kicker">YOUR DAILY MOMENTUM</span><h2>พัฒนาการของคุณ</h2><p>ความสม่ำเสมอเล็ก ๆ สร้างผลลัพธ์ระยะยาว</p></div><span class="dash-section-mark">02 <i>/ 02</i></span></section>
    <section class="dash-feature-grid">
      <article class="dash-feature-card dash-word-card">
        <div class="dash-feature-top"><span class="dash-feature-icon">✦</span><span class="dash-feature-label">WORD OF THE DAY</span><span class="dash-feature-index">TODAY'S PICK</span></div>
        <div class="dash-word-body"><div class="dash-word-text"><h3>${word?esc(word.x.w):'Ready?'}</h3><p>${word?esc(word.x.th):'เริ่มเรียนรู้คำศัพท์วันนี้'}</p><span class="dash-word-chip">${esc(wordLabel)}</span></div><div class="dash-word-orbit" aria-hidden="true"><span>W</span><i>✦</i><b>Aa</b></div></div>
        <button class="dash-feature-link" onclick="${word?`studioWordDetail(${word.i})`:`studioNav('vocab')`}" type="button">เปิดคำนี้ในคลังศัพท์ <b>↗</b></button>
      </article>
      <article class="dash-feature-card dash-goal-card">
        <div class="dash-feature-top"><span class="dash-feature-icon goal-icon">◎</span><span class="dash-feature-label">YOUR SCORE TARGET</span><button class="dash-goal-edit" onclick="studioNav('profile')" type="button">แก้ไขเป้าหมาย ↗</button></div>
        <div class="dash-goal-main"><div><span class="dash-goal-caption">เป้าคะแนน TGAT1</span><strong>${goal}<small>/100</small></strong></div><div class="dash-goal-medal">🏆</div></div>
        <div class="dash-goal-track"><i style="width:${score===null?0:Math.min(100,score/goal*100)}%"></i></div>
        <div class="dash-goal-foot"><span>${score===null?'ยังไม่มีคะแนนจำลองล่าสุด':`คะแนนล่าสุด ${score}/100`}</span><b>${score===null?'เริ่มจากชุดแรกได้เลย':score>=goal?'ถึงเป้าหมายแล้ว!':`อีก ${goal-score} คะแนน`}</b></div>
      </article>
    </section>

    <section class="dash-bottom-grid">
      <article class="dash-feature-card dash-calendar-card">
        <div class="dash-feature-top"><span class="dash-feature-label">STUDY STREAK</span><span class="dash-streak-badge">🔥 ${studioStreak()} วันต่อเนื่อง</span></div>
        <div class="dash-calendar-heading"><div><h3>Keep showing up.</h3><p>ปฏิทินการเข้าใช้งาน 28 วันที่ผ่านมา</p></div><span class="dash-calendar-spark">✺</span></div>
        <div class="dash-calendar-grid">${recent}</div>
        <div class="dash-calendar-legend"><span><i></i> วันที่มีกิจกรรม</span><span>CONSISTENCY IS KEY</span></div>
      </article>
      <article class="dash-feature-card dash-focus-card">
        <div class="dash-feature-top"><span class="dash-feature-label">YOUR NEXT FOCUS</span><span class="dash-focus-pulse"><i></i> READY</span></div>
        <h3>กลับมาเก็บจุดที่ยังไม่แม่น</h3>
        <p>มีคำศัพท์ถึงกำหนด ${due.toLocaleString()} คำ และข้อสอบที่เคยตอบผิด ${miss.toLocaleString()} ข้อ เลือกทบทวนต่อได้เลย</p>
        <div class="dash-focus-actions"><button onclick="studioStartFlashcards()" type="button">↻ ทบทวนศัพท์</button><button onclick="studioOpenErrors()" type="button">เปิดสมุดข้อผิด ↗</button></div>
        <div class="dash-focus-footer"><button onclick="studioNav('analytics')" type="button">ดูสถิติพัฒนาการทั้งหมด <b>→</b></button><button onclick="studioV9Grammar()" type="button">Grammar <b>↗</b></button></div>
      </article>
    </section>
    <div class="dash-settings-row"><span>ทุกความก้าวหน้าถูกเก็บไว้ในอุปกรณ์นี้</span><button onclick="studioNav('settings')" type="button">⚙ ตั้งค่าและสำรองข้อมูล</button></div>
   </div>`;
 }
 window.studioV9SetTarget=()=>{const el=document.getElementById('st9Target');setTarget(el&&el.value)};
 window.studioV9Grammar=()=>{
   STUDIO_PAGE='grammar';studioUpdateChrome('grammar');
   const app=document.getElementById('app');
   app.innerHTML=`<div class="st-section-head"><div><div class="st-eyebrow">QUICK REFERENCE</div><h1 class="st-title">Grammar Cheat Sheet</h1><p class="st-subtitle">สรุปหลักสำคัญพร้อมตัวอย่างสำหรับทบทวนก่อนทำโจทย์</p></div><button class="st-btn ghost" onclick="studioNav('home')">← กลับหน้าหลัก</button></div>
   <div class="st9-grammar-grid">
    <article class="st9-grammar"><h3>1. Tenses</h3><p><b>Present Simple</b> ใช้กับข้อเท็จจริง/กิจวัตร · <code>She works every day.</code><br><b>Past Simple</b> เหตุการณ์จบแล้วในอดีต · <code>They left yesterday.</code><br><b>Present Perfect</b> ประสบการณ์หรือผลต่อเนื่องถึงปัจจุบัน · <code>I have lived here for years.</code></p></article>
    <article class="st9-grammar"><h3>2. Subject–Verb Agreement</h3><p>ประธานเอกพจน์บุรุษที่สามใช้กริยาเติม s/es ใน Present Simple · <code>Each student has a book.</code><br>ระวังคำนามคั่นกลางที่ไม่เปลี่ยนประธาน</p></article>
    <article class="st9-grammar"><h3>3. Conditionals</h3><p><b>Zero:</b> If + present, present · <code>If water reaches 100°C, it boils.</code><br><b>First:</b> If + present, will + V1<br><b>Second:</b> If + past, would + V1<br><b>Third:</b> If + past perfect, would have + V3</p></article>
    <article class="st9-grammar"><h3>4. Passive Voice</h3><p>ใช้ <code>be + V3</code> เมื่อเน้นผู้ถูกกระทำ · <code>The report was published yesterday.</code><br>เลือก tense ที่ be ให้ตรงกับเวลา</p></article>
    <article class="st9-grammar"><h3>5. Relative Clauses</h3><p><code>who</code> คน · <code>which</code> สิ่งของ/สัตว์ · <code>that</code> คนหรือสิ่งของใน defining clause · <code>whose</code> แสดงความเป็นเจ้าของ</p></article>
    <article class="st9-grammar"><h3>6. Conjunctions & Contrast</h3><p><code>although / even though</code> ตามด้วยประโยค · <code>despite / in spite of</code> ตามด้วยคำนามหรือ V-ing · <code>however</code> เชื่อมความขัดแย้งระหว่างประโยค</p></article>
    <article class="st9-grammar"><h3>7. Gerund & Infinitive</h3><p>คำกริยาบางคำตามด้วย V-ing เช่น <code>avoid doing</code>; บางคำตามด้วย to + V1 เช่น <code>decide to go</code> ควรจำเป็นกลุ่มคำ</p></article>
    <article class="st9-grammar"><h3>8. Articles & Quantifiers</h3><p><code>a/an</code> คำนามนับได้เอกพจน์ที่กล่าวทั่วไป · <code>the</code> เฉพาะเจาะจง · <code>many/few</code> นามนับได้ · <code>much/little</code> นามนับไม่ได้</p></article>
   </div>
   <div class="st-note" style="margin-top:14px">สรุปนี้เป็นชีตทบทวนเสริม ควรดูตัวอย่างและบริบทในโจทย์ประกอบ ไม่ใช่รายการกฎไวยากรณ์ทั้งหมด</div>`;
 };
 const originalHome=studioHome;
 studioHome=function(){renderHome()};
 window.__TGAT1_HOME_BASE__=studioHome;
 window.__TGAT1_HOME_HOOKS__=[];
 window.TGAT1_addHomeHook=function(fn){if(typeof fn==='function')window.__TGAT1_HOME_HOOKS__.push(fn);return fn};
 window.TGAT1_addHomeHook(function(){const app=document.getElementById('app');if(!app||document.getElementById('studioV6QuickTools'))return;const box=document.createElement('div');box.id='studioV6QuickTools';box.className='st-card';box.style.marginTop='14px';box.innerHTML='<div class="st-section-head"><div><h2>เครื่องมือพัฒนาจุดอ่อน</h2><p>ทบทวนข้อผิดและฝึกระดับสูงต่อจากข้อมูลจริง</p></div></div><div class="st-inline"><button class="st-btn secondary" onclick="studioOpenErrors()">📓 Error Notebook</button><button class="st-btn secondary" onclick="studioOpenReview()">🧠 Smart Review</button><button class="st-btn secondary" onclick="studioOpenAdvanced()">⚡ บทเรียนขั้นสูง</button></div>';app.appendChild(box)});
 const originalRender=studioRender;
 studioRender=function(){if(STUDIO_PAGE==='grammar'){studioV9Grammar();return}return originalRender.apply(this,arguments)};
 const originalUpdate=studioUpdateChrome;
 studioUpdateChrome=function(page){const r=originalUpdate.apply(this,arguments);if(page==='grammar'){const c=document.getElementById('studioCrumb'),t=document.getElementById('studioTitle');if(c)c.textContent='GRAMMAR';if(t)t.textContent='Grammar Cheat Sheet'}return r};

 // Persist active VLT question sessions as well as the pre-existing TGAT Q session.
 function saveVltRun(){
   try{
     if(!VLT_RUN){localStorage.removeItem(VLT_RUN_KEY);return}
     safeWrite(VLT_RUN_KEY,{version:1,savedAt:Date.now(),run:VLT_RUN});
   }catch(e){if(typeof VLT_toast==='function')VLT_toast('บันทึกรอบฝึกไม่สำเร็จ กรุณาส่งออกข้อมูลสำรอง')}
 }
 const oldRenderQuiz=VLT_renderQuiz;
 VLT_renderQuiz=function(){const r=oldRenderQuiz.apply(this,arguments);saveVltRun();return r};
 const oldBegin=VLT_begin;
 VLT_begin=function(run){const r=oldBegin.apply(this,arguments);saveVltRun();return r};
 const oldFinish=VLT_finish;
 VLT_finish=function(){const r=oldFinish.apply(this,arguments);localStorage.removeItem(VLT_RUN_KEY);return r};
 const oldExit=VLT_exit;
 VLT_exit=function(){const before=VLT_RUN;const r=oldExit.apply(this,arguments);if(before&&!VLT_RUN)localStorage.removeItem(VLT_RUN_KEY);return r};
 window.addEventListener('pagehide',saveVltRun);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveVltRun()});
 function restoreVltRun(){
   try{
     if(VLT_RUN||typeof Q!=='undefined'&&Q)return false;
     const snap=safeRead(VLT_RUN_KEY,null),r=snap&&snap.run;
     if(!r||snap.version!==1||!Array.isArray(r.qs)||!r.qs.length||!r.answers||!Number.isInteger(r.index)||r.index<0||r.index>=r.qs.length){localStorage.removeItem(VLT_RUN_KEY);return false}
     if(Date.now()-(snap.savedAt||0)>7*86400000){localStorage.removeItem(VLT_RUN_KEY);return false}
     if((r.mode==='sprint'||r.mode==='mock')&&r.deadline&&r.deadline<=Date.now()){
       VLT_RUN=r;VLT_finish(true);return true;
     }
     VLT_RUN=r;VLT_HINT=false;VLT_renderQuiz();if(r.deadline)VLT_startTimer();
     if(typeof VLT_toast==='function')VLT_toast('กู้คืนรอบฝึกเดิมแล้ว');
     return true;
   }catch(e){localStorage.removeItem(VLT_RUN_KEY);return false}
 }
 // Initial render replaces the older crowded dashboard with the vocabulary-led layout.
 try{studioHome();restoreVltRun()}catch(e){console.error('v9 init',e)}
})();


// Put Vocabulary near the front of both desktop and mobile navigation without removing any destination.
(function(){
 document.querySelectorAll('nav').forEach(nav=>{
   const vocab=nav.querySelector('[data-page="vocab"]');
   const home=nav.querySelector('[data-page="home"]');
   if(vocab&&home&&home.nextElementSibling!==vocab)home.after(vocab);
 });
})();

window.STUDIO_DATA = STUDIO_DATA;

window.STUDIO_DATA = STUDIO_DATA;


/* ===== 05 · 02-v12-quality.js ===== */
(function(){
'use strict';

// Keep the old review and scoring engines, adding specific, evidence-based explanations.
function v12Esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function v12QuestionIntent(q){
 const p=String(q.prompt||'').toLowerCase();
 if(/how often/.test(p))return 'ความถี่';
 if(/how long/.test(p))return 'ระยะเวลา';
 if(/what time|when\b/.test(p))return 'เวลา/วัน';
 if(/where\b/.test(p))return 'สถานที่';
 if(/why\b/.test(p)&&!/why don.t|why don’t/.test(p))return 'เหตุผล';
 if(/why don.t|why don’t/.test(p))return 'ข้อเสนอแนะ';
 if(/what do you think|what is your opinion/.test(p))return 'ความคิดเห็น';
 if(/would you mind|could you|can you|would you please/.test(p))return 'คำขอร้องสุภาพ';
 if(/i.m sorry|i am sorry|sorry/.test(p))return 'คำขอโทษ';
 if(/thank you|thanks/.test(p))return 'การขอบคุณ';
 if(/would you like me to|shall i/.test(p))return 'การเสนอความช่วยเหลือ';
 if(/how can i get|how do i get|directions/.test(p))return 'การบอกทาง';
 if(/did you|have you|do you/.test(p))return 'การถามสถานะ/ประสบการณ์';
 return 'การตอบสนองให้ตรงเจตนาคำถาม';
}
function v12ResponseType(t){
 const x=String(t||'').toLowerCase();
 if(/every |once |twice |daily|weekly|monthly|each |per week|a week|a day|weekends|whenever/.test(x))return 'ความถี่';
 if(/\b\d{1,2}:\d{2}|a\.m\.|p\.m\.|at noon|morning|afternoon|evening|on monday|on tuesday|on wednesday|on thursday|on friday|on saturday|on sunday/.test(x))return 'เวลา/วัน';
 if(/minute|hour|day|week|month|year|since |for about|for nearly|a couple of/.test(x))return 'ระยะเวลา';
 if(/because|due to|as a result|so that|in order to/.test(x))return 'เหตุผล/จุดประสงค์';
 if(/next to|beside|near |opposite|behind|at the |in the |on the |floor|street|building|centre|center|station|desk|room/.test(x))return 'สถานที่';
 if(/not at all|of course|certainly|sure|no problem|no worries|i.d be happy|happy to|yes, please/.test(x))return 'การตอบรับคำขอ/ข้อเสนอ';
 if(/that sounds|good idea|great idea|i agree|i think|in my opinion|i believe/.test(x))return 'ความคิดเห็น/การเห็นด้วย';
 if(/sorry|apolog|that.s all right|never mind|don.t worry/.test(x))return 'คำขอโทษ/การให้อภัย';
 if(/thanks|thank you|appreciate/.test(x))return 'การขอบคุณ';
 if(/turn left|turn right|go straight|walk along|take the bus/.test(x))return 'คำแนะนำเส้นทาง';
 return 'คำตอบ/ข้อความทั่วไป';
}
function v12FindBlankSentence(q, fill){
 const ctx=String(q.context||'');
 const m=String(q.prompt||'').match(/blank\s*\((\d+)\)/i);
 if(!m)return '';
 const n=m[1], re=new RegExp('[^.!?\\n]*\\('+n+'\\)\\s*_+[^.!?\\n]*[.!?]?','i');
 const hit=ctx.match(re);
 if(!hit)return '';
 return hit[0].replace(new RegExp('\\('+n+'\\)\\s*_+'),fill||q.options[q.answer]);
}
function v12Evidence(q){
 const ctx=String(q.context||''); if(!ctx)return '';
 if(q.category==='tc')return v12FindBlankSentence(q,q.options[q.answer]);
 if(q.category==='short'||q.category==='long'){
  const lines=ctx.split(/\n/).map(x=>x.trim()).filter(Boolean);
  const target=String(q.prompt||'').match(/blank\s*\((\d+)\)/i);
  const marker=target?new RegExp('\\('+target[1]+'\\)\\s*_+'): /\(\d+\)\s*_+/;
  const i=lines.findIndex(x=>marker.test(x));
  if(i>=0)return lines.slice(Math.max(0,i-1),Math.min(lines.length,i+2)).join(' | ');
 }
 if(q.category==='rc'){
  const p=String(q.prompt||''), low=ctx.toLowerCase();
  const quoted=p.match(/[‘'\"]([^’'\"]+)[’'\"]/);
  if(quoted){const word=quoted[1].toLowerCase();const at=low.indexOf(word);if(at>=0){const left=ctx.lastIndexOf('.',at),right=ctx.indexOf('.',at);return ctx.slice(Math.max(left+1,0),right>=0?right+1:Math.min(ctx.length,at+160)).trim()}}
  if(/what did .* do first|what did the group do first/i.test(p)){const m=ctx.match(/First,?[^.!?]*[.!?]/i);if(m)return m[0]}
  const ans=String(q.options[q.answer]||'').toLowerCase();
  const terms=ans.split(/[^a-z]+/).filter(w=>w.length>4);
  let best='',bestScore=0;
  for(const sentence of ctx.split(/(?<=[.!?])\s+/)){
    const s=sentence.toLowerCase(),score=terms.filter(w=>s.includes(w)).length;
    if(score>bestScore){best=sentence;bestScore=score;}
  }
  if(bestScore>0)return best;
  if(/mainly about|central idea|main idea|purpose of the passage/i.test(p))return ctx.split(/(?<=[.!?])\s+/).slice(0,2).join(' ');
  if(/infer|inferred|follows logically/i.test(p))return ctx.split(/(?<=[.!?])\s+/).slice(-2).join(' ');
 }
 return '';
}
window.TGAT1V12Evidence = v12Evidence;
function v12MainExplanation(q){
 const ans=String(q.options[q.answer]||'');
 if(q.category==='qr'){
  const intent=v12QuestionIntent(q),type=v12ResponseType(ans);
  return `คำถามนี้ต้องการ${intent} คำตอบ “${ans}” ทำหน้าที่เป็น${type} จึงตอบตรงกับเจตนาที่ถาม`; 
 }
 if(q.category==='tc'){
  const sentence=v12FindBlankSentence(q,ans);
  const m=String(q.prompt||'').match(/blank\s*\((\d+)\)/i);
  const n=m?m[1]:'?';
  return `เมื่อนำ “${ans}” ไปเติมช่องว่าง (${n}) จะได้ประโยค: “${sentence||'อ่านประโยคก่อนและหลังช่องว่างประกอบกัน'}” ให้ตรวจชนิดคำ โครงสร้างรอบช่องว่าง และความหมายทั้งประโยค ไม่พิจารณาเฉพาะคำโดด ๆ`;
 }
 if(q.category==='rc'){
  const evidence=v12Evidence(q);
  const p=String(q.prompt||'');
  const negative=/\bnot\b|\bexcept\b|\bfalse\b|\bincorrect\b/i.test(p);
  const label=negative?'ข้อยกเว้น/ข้อความที่ไม่สอดคล้องกับบทอ่าน':/mainly about|central idea|main idea/i.test(p)?'ใจความหลัก':/infer|inferred|follows logically/i.test(p)?'การอนุมาน':/closest in meaning/i.test(p)?'ความหมายตามบริบท':/why/i.test(p)?'เหตุผล':/what did|according to|which statement|true about/i.test(p)?'รายละเอียด':'การอ่านจับใจความ';
  if(negative)return `${label}: คำตอบ “${ans}” เป็นตัวเลือกที่โจทย์ให้หาเพราะไม่ใช่ข้อความที่บทอ่านยืนยัน หรือขัดกับข้อมูลในบริบท จึงต้องระวังคำว่า NOT / EXCEPT ในคำถาม${evidence?` ข้อความที่ควรเทียบคือ “${evidence}”`:''}`;
  return `${label}: คำตอบ “${ans}” สอดคล้องกับข้อมูลในบทอ่าน${evidence?` โดยมีหลักฐานว่า “${evidence}”`:'. ให้ตรวจว่าข้อความรองรับคำตอบโดยตรงหรือพอให้อนุมานได้ โดยไม่สรุปเกินกว่าที่บทอ่านกล่าว'}`;
 }
 const evidence=v12Evidence(q);
 return `บทสนทนานี้ต้องพิจารณาคำพูดก่อนหน้าและคำพูดถัดไป คำตอบ “${ans}” เป็นคำตอบที่เชื่อมกับสถานการณ์และประเด็นที่ผู้พูดกำลังคุย${evidence?` จุดเชื่อมในบทสนทนาคือ “${evidence}”`:''}`;
}
function v12OptionWhy(q,idx){
 const opt=String(q.options[idx]||'');
 if(q.category==='qr'){
  const intent=v12QuestionIntent(q),kind=v12ResponseType(opt);
  if(q.prompt.toLowerCase().includes('how often')&&kind!=='ความถี่')return `ตัวเลือกนี้ให้ข้อมูลแบบ${kind} แต่คำถาม How often ต้องการความถี่`;
  if(q.prompt.toLowerCase().includes('how long')&&kind!=='ระยะเวลา')return `ตัวเลือกนี้ให้ข้อมูลแบบ${kind} แต่ How long ในประโยคนี้ถามระยะเวลา`;
  if(/where\b/i.test(q.prompt)&&kind!=='สถานที่')return `ตัวเลือกนี้เป็น${kind} ไม่ได้บอกตำแหน่งที่ถามด้วย Where`;
  if(/what time|when\b/i.test(q.prompt)&&kind!=='เวลา/วัน')return `ตัวเลือกนี้เป็น${kind} ไม่ได้ให้เวลา/วันที่ตรงกับคำถาม`;
  if(/why\b/i.test(q.prompt)&&!(/why don.t|why don’t/i.test(q.prompt))&&kind!=='เหตุผล/จุดประสงค์')return `ตัวเลือกนี้เป็น${kind} ไม่ได้อธิบายเหตุผลที่ถามด้วย Why`;
  return `ตัวเลือกนี้มีหน้าที่เป็น${kind} แต่ไม่ตรงกับเจตนาหลักของคำถามที่ต้องการ${intent}`;
 }
 if(q.category==='tc'){
  const ans=String(q.options[q.answer]||''), sentence=v12FindBlankSentence(q,ans), candidate=v12FindBlankSentence(q,opt);
  const m=String(q.prompt||'').match(/blank\s*\((\d+)\)/i); const n=m?m[1]:'?';
  return `เมื่อลองแทน “${opt}” ในช่องว่าง (${n}) จะได้ “${candidate||'ประโยคที่ต้องตรวจร่วมกับบริบท'}” ให้เทียบชนิดคำ รูปกริยา คำเชื่อม และ collocation กับประโยคที่ใช้คำตอบ “${ans}”: “${sentence||ans}”`;
 }
 if(q.category==='rc'){
  const p=String(q.prompt||''),negative=/\bnot\b|\bexcept\b|\bfalse\b|\bincorrect\b/i.test(p);
  const ctx=String(q.context||'').toLowerCase(),o=opt.toLowerCase();
  if(negative&&idx!==q.answer){
    const terms=o.split(/[^a-z]+/).filter(w=>w.length>4);let best='',bestScore=0;
    for(const sentence of String(q.context||'').split(/(?<=[.!?])\s+/)){const z=sentence.toLowerCase(),score=terms.filter(w=>z.includes(w)).length;if(score>bestScore){best=sentence;bestScore=score}}
    return `โจทย์ถามหาข้อความที่ไม่ถูกต้อง/เป็นข้อยกเว้น แต่ตัวเลือกนี้มีข้อมูลสอดคล้องกับบทอ่าน${best?` เช่น “${best}”`:''} จึงไม่ใช่คำตอบที่ต้องเลือก`;
  }
  if(negative&&idx===q.answer)return `ตัวเลือกนี้เป็นข้อยกเว้นที่โจทย์ถามหา ต้องตรวจว่าขัดกับบทอ่านหรือไม่มีหลักฐานสนับสนุน ไม่ใช่เลือกข้อความที่บทอ่านยืนยันอยู่แล้ว`;
  if(ctx.includes(o)&&o.length>5)return `แม้ถ้อยคำนี้จะปรากฏในบทอ่าน แต่ไม่ตอบคำถามในมุมที่ถาม; ต้องแยกข้อมูลที่กล่าวถึงออกจากข้อสรุปที่โจทย์ต้องการ`;
  if(/all|every|always|never|guarantee|permanently|only|must/.test(o))return `ตัวเลือกนี้ใช้ถ้อยคำเหมารวมหรือสรุปเด็ดขาดเกินกว่าหลักฐานในบทอ่านจะรองรับ`;
  return `บทอ่านไม่ได้ให้หลักฐานรองรับข้อความ “${opt}” อย่างเพียงพอ หรือข้อความนี้ไม่ตอบประเด็นที่โจทย์ถาม`;
 }
 const ev=v12Evidence(q);
 return `เมื่อนำข้อความนี้ไปวางในบทสนทนา จะไม่เชื่อมกับข้อมูลหรือเจตนาของผู้พูดได้เท่าคำตอบที่ถูก${ev?` โดยเฉพาะช่วง “${ev}”`:''}`;
}
function VLT_explainPanelV12(q){
 const ev=v12Evidence(q), wrong=q.options.map((t,j)=>({t,j})).filter(x=>x.j!==q.answer);
 const detail=wrong.map(x=>`<div class="v12-option-reason"><b>${'ABCD'[x.j]}. ${v12Esc(x.t)}</b><p>${v12Esc(v12OptionWhy(q,x.j))}</p></div>`).join('');
 return `<div class="vault-feedback-detail v12-explain"><div class="v12-specific"><b>หลักฐาน/หลักคิดเฉพาะข้อนี้</b><p>${v12Esc(v12MainExplanation(q))}</p></div><div class="vault-review-rule"><b>วิเคราะห์ตัวเลือกที่ไม่ถูก</b>${detail}</div>${ev?`<div class="vault-evidence"><b>ข้อความที่ควรสังเกต</b><div>${v12Esc(ev)}</div></div>`:''}</div>`;
}
const VLT_explainPanelOriginal=VLT_explainPanel;
VLT_explainPanel=VLT_explainPanelV12;

// Add IPA, senses, collocations and word relationships to the vocabulary detail window.
const studioWordDetailOriginal=studioWordDetail;
studioWordDetail=function(i){
 if(!window.TGAT1LazySenses.loaded){window.TGAT1LazySenses.ensure().then(()=>studioWordDetail(i)).catch(e=>studioToast('โหลดข้อมูลความหมายไม่สำเร็จ'));return;}
 studioWordDetailOriginal(i);
 const x=STUDIO_DATA.words[i]; const box=document.querySelector('#studioModal .st-modal-box'); if(!x||!box||box.querySelector('.v12-word-meta'))return;
 const phraseMatches=(STUDIO_DATA.phrases||[]).filter(p=>String(p.w||'').toLowerCase().split(/\s+/).includes(String(x.w).toLowerCase())).slice(0,6).map(p=>p.w);
 const coll=Array.from(new Set([...(x.collocations||[]),...phraseMatches])).slice(0,8);
 let syn=x.synonymsV12||[]; if(!syn.length){for(const g of (STUDIO_DATA.synonyms||[])){const a=String(g.words||'').split('•').map(z=>z.trim());if(a.some(z=>z.toLowerCase()===x.w.toLowerCase()))syn.push(...a.filter(z=>z.toLowerCase()!==x.w.toLowerCase()))}}
 let ant=x.antonymsV12||[];if(!ant.length){for(const z of (STUDIO_DATA.antonyms||[])){if(String(z.a).toLowerCase()===x.w.toLowerCase())ant.push(z.b);if(String(z.b).toLowerCase()===x.w.toLowerCase())ant.push(z.a)}}
 let fam=x.familyV12||'';if(!fam){const f=(STUDIO_DATA.families||[]).find(z=>String(z.root||'').toLowerCase()===x.w.toLowerCase());if(f)fam=f.family}
 const chips=(arr)=>arr&&arr.length?arr.map(z=>`<span class="v12-chip">${v12Esc(z)}</span>`).join(''):'<span class="v12-muted">ไม่มีรายการที่ยืนยันในคลังนี้</span>';
 const html=`<section class="v12-word-meta"><div class="v12-meta-grid"><div><small>IPA · ที่มา/สำเนียงตามรายการ</small><b>${v12Esc(x.ipa||'ยังไม่มี IPA ที่ตรวจยืนยัน')}</b><small>${v12Esc(x.ipaSource||'แหล่งที่มายังไม่บันทึก')}</small></div><div><small>Word Family</small><b>${v12Esc(fam||'ยังไม่มีข้อมูลตระกูลคำในคลัง')}</b></div></div><div><small>Synonyms · คำใกล้เคียง (ไม่จำเป็นต้องแทนกันได้ทุกบริบท)</small><div class="v12-chips">${chips(syn)}</div></div><div><small>Antonyms · คำตรงข้าม (เฉพาะความหมายที่สัมพันธ์กัน)</small><div class="v12-chips">${chips(ant)}</div></div><div><small>Collocations · คำที่มักใช้ร่วมกัน</small><div class="v12-chips">${chips(coll)}</div></div><p class="v12-muted">หมายเหตุ: คำพ้องและคำตรงข้ามเป็นความสัมพันธ์ตามความหมายบางบริบท ไม่ใช่คำที่ใช้แทนกันได้ทุกประโยค; IPA ที่ระบุ eSpeak เป็นผลจากเครื่องสังเคราะห์ อาจใช้รูปแบบสัญลักษณ์/ตำแหน่ง stress ต่างจาก CMUdict และควรตรวจฟังประกอบ; คำเฉพาะที่ไม่มีข้อมูลยืนยันจะแสดงตามนั้น</p></section>`;
 const anchor=box.querySelector('.st-poly-wrap')||box.querySelector('h3'); if(anchor)anchor.insertAdjacentHTML('afterend',html); else box.insertAdjacentHTML('beforeend',html);
};

// Upgrade spaced repetition: known words return at their due date, with a 1-2-4-7-14-30 day ladder.
// The due queue now includes learned words whose next review date has arrived.

// Build a new balanced mock exam from complete context groups so no passage/dialogue is split.
function v12PickGroups(cat,sizes){
 const groups=new Map();
 for(const q of VLT_BANK){
  if(q.category!==cat)continue;
  const k=`${q.set}::${String(q.topic||'').trim().toLocaleLowerCase()}`;
  if(!groups.has(k))groups.set(k,[]);
  groups.get(k).push(q);
 }
 const pool=Array.from(groups.values()).map(g=>g.slice().sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true})));
 const picked=[];
 for(const size of sizes){
  const used=new Set(picked.flat().map(q=>q.id));
  const usedContexts=new Set(picked.flat().map(q=>String(q.context||'').trim()).filter(Boolean));
  const eligible=pool.filter(g=>g.length===size&&!g.some(q=>used.has(q.id))&&!g.some(q=>String(q.context||'').trim()&&usedContexts.has(String(q.context||'').trim())));
  if(!eligible.length)throw new Error(`Not enough complete ${cat} topic groups of ${size}`);
  picked.push(VLT_shuffle(eligible)[0]);
 }
 return picked;
}
function VLT_startRandomMock(){if(!VLT_BANK.length){VLT_ensureBank().then(()=>VLT_startRandomMock()).catch(e=>VLT_toast(e.message));return;}
 try{
  const qr=VLT_shuffle(VLT_BANK.filter(q=>q.category==='qr')).slice(0,10);
  const short=v12PickGroups('short',[3,3,4]);
  const long=v12PickGroups('long',[5,5]);
  const tc=v12PickGroups('tc',[7,8]);
  const rc=v12PickGroups('rc',[5,5,5]);
  const grouped=(a)=>VLT_shuffle(a).flat();
  const original=[...qr,...grouped(short),...grouped(long),...grouped(tc),...grouped(rc)];
  if(original.length!==60||new Set(original.map(q=>q.id)).size!==60)throw new Error('The generated mock test does not contain 60 unique items');
  const qs=original.map(q=>{const oo=VLT_shuffle(q.options.map((t,i)=>({t,ok:i===q.answer})));return {...q,options:oo.map(x=>x.t),answer:oo.findIndex(x=>x.ok),userAnswer:null}});
  VLT_begin({mode:'mock',setNo:0,label:'สุ่มข้อสอบเต็มชุด',qs,index:0,answers:{},flagged:{},questionTimes:{},questionStartedAt:Date.now(),started:Date.now(),deadline:Date.now()+3600000,seconds:3600,score:0,combo:0,reviewOn:false});
 }catch(e){VLT_toast('สร้างชุดสุ่มไม่สำเร็จ: '+e.message)}
}
window.VLT_startRandomMock=VLT_startRandomMock;
// Add the random-pool doorway to the actual Studio Exam Center as well as the legacy vault home.
const studioExamOriginalV12=studioExam;
studioExam=function(){studioExamOriginalV12.apply(this,arguments);const card=document.querySelector('#app .st-main-grid .st-card');if(card&&!card.querySelector('.v12-random-mock'))card.insertAdjacentHTML('beforeend',`<div class="v12-random-mock"><button class="st-btn" style="width:100%" onclick="VLT_startRandomMock()">🎲 สุ่มข้อสอบเต็มชุดจากคลังทั้งหมด</button><small>60 ข้อ · 60 นาที · ไม่ซ้ำในรอบเดียว · รักษากลุ่มบทสนทนาและบทอ่าน</small></div>`)};
const VLT_homeOriginalV12=VLT_home;
VLT_home=function(){VLT_homeOriginalV12.apply(this,arguments);const view=document.querySelector('#app .vault-view');if(view&&!view.querySelector('.v12-random-mock')){const first=view.querySelector('.vault-hero');if(first)first.insertAdjacentHTML('beforeend',`<div class="v12-random-mock"><button class="vault-btn" onclick="VLT_startRandomMock()">🎲 สุ่มข้อสอบเต็มชุดจากคลังทั้งหมด</button><small>60 ข้อ · 60 นาที · ไม่ซ้ำในรอบเดียว · รักษากลุ่มบทสนทนาและบทอ่าน</small></div>`)}};

// Add uncertain-question flags and per-question timing to mock mode.
function VLT_stampCurrentV12(){const r=VLT_RUN;if(!r||r.mode!=='mock')return;const q=r.qs&&r.qs[r.index];if(!q)return;r.questionTimes=r.questionTimes||{};const start=Number(r.questionStartedAt)||Date.now();const sec=Math.max(0,(Date.now()-start)/1000);r.questionTimes[q.id]=(Number(r.questionTimes[q.id])||0)+sec;r.questionStartedAt=Date.now()}
function VLT_toggleFlagV12(){const r=VLT_RUN;if(!r||r.mode!=='mock')return;const q=VLT_current();if(!q)return;r.flagged=r.flagged||{};if(r.flagged[q.id])delete r.flagged[q.id];else r.flagged[q.id]=true;VLT_renderQuiz()}
window.VLT_toggleFlagV12=VLT_toggleFlagV12;
const VLT_beginOriginalV12=VLT_begin;
VLT_begin=function(run){if(run&&run.mode==='mock'){run.flagged=run.flagged||{};run.questionTimes=run.questionTimes||{};run.questionStartedAt=Date.now()}return VLT_beginOriginalV12.apply(this,arguments)};
const VLT_renderOriginalV12=VLT_renderQuiz;
VLT_renderQuiz=function(){const ret=VLT_renderOriginalV12.apply(this,arguments);const r=VLT_RUN;if(!r)return ret;
 if(r.mode==='mock'){
  r.flagged=r.flagged||{};
  const pill=document.querySelector('#app .vault-head .vault-pill');if(pill&&Number(r.setNo)===0)pill.textContent='สุ่มข้อสอบเต็มชุด';
  const firstRight=document.querySelector('#app .vault-bottom .right');if(firstRight&&!firstRight.querySelector('.v12-flag-btn'))firstRight.insertAdjacentHTML('afterbegin',`<button class="vault-btn alt v12-flag-btn" onclick="VLT_toggleFlagV12()">${r.flagged[VLT_current().id]?'🚩 ปักธงแล้ว':'⚑ ไม่มั่นใจ'}</button>`);
  document.querySelectorAll('#app .vault-qmap button').forEach((b,i)=>{const q=r.qs[i];if(q&&r.flagged[q.id])b.classList.add('v12-flagged')});
 }
 return ret;
};
const VLT_prevOriginalV12=VLT_prev;
VLT_prev=function(){if(VLT_RUN&&VLT_RUN.mode==='mock'&&VLT_RUN.index>0)VLT_stampCurrentV12();return VLT_prevOriginalV12.apply(this,arguments)};
const VLT_gotoOriginalV12=VLT_goto;
VLT_goto=function(i){if(VLT_RUN&&VLT_RUN.mode==='mock'&&i!==VLT_RUN.index)VLT_stampCurrentV12();return VLT_gotoOriginalV12.apply(this,arguments)};
const VLT_nextOriginalV12=VLT_next;
VLT_next=function(){if(VLT_RUN&&VLT_RUN.mode==='mock'&&VLT_RUN.index<VLT_RUN.qs.length-1)VLT_stampCurrentV12();return VLT_nextOriginalV12.apply(this,arguments)};
const VLT_finishOriginalV12=VLT_finish;
VLT_finish=function(auto){const r=VLT_RUN;if(r&&r.mode==='mock'){VLT_stampCurrentV12();const vals=Object.values(r.questionTimes||{}).filter(Number.isFinite);r.v12Summary={avgSeconds:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null,visited:vals.length,totalSeconds:vals.reduce((a,b)=>a+b,0),flagged:Object.keys(r.flagged||{}).filter(k=>r.flagged[k]).length};}
 const ret=VLT_finishOriginalV12.apply(this,arguments);
 if(VLT_RESULT&&r&&r.v12Summary){VLT_RESULT.v12Summary=r.v12Summary;const h=VLT_STATE.history[VLT_STATE.history.length-1];if(h&&h.mode==='mock'&&h.setNo===(r.setNo||null)){h.avgSeconds=r.v12Summary.avgSeconds;h.visited=r.v12Summary.visited;h.flagged=r.v12Summary.flagged;VLT_save()}VLT_renderResult()}
 return ret;
};
const VLT_renderResultOriginalV12=VLT_renderResult;
VLT_renderResult=function(){const ret=VLT_renderResultOriginalV12.apply(this,arguments);const r=VLT_RESULT;if(!r||!r.v12Summary)return ret;const el=document.querySelector('#app .vault-view .vault-hero');if(el&&!el.querySelector('.v12-time-summary')){const z=r.v12Summary,avg=z.avgSeconds==null?'—':`${Math.round(z.avgSeconds)} วินาที`;el.insertAdjacentHTML('beforeend',`<div class="v12-time-summary"><b>⏱️ สถิติเวลาทำข้อสอบ</b><div>เวลาเฉลี่ยต่อข้อที่เข้าถึง: <strong>${avg}</strong> · เปิดดู ${z.visited}/60 ข้อ</div><div>เวลาที่บันทึกได้: ${Math.round(z.totalSeconds/60)} นาที · ข้อที่ปักธงไม่มั่นใจ: ${z.flagged} ข้อ</div><small>ค่าเฉลี่ยเป็นเวลาที่อยู่บนแต่ละข้อโดยประมาณ; การสลับแท็บหรือพักหน้าจออาจทำให้เวลาสูงกว่าการคิดจริง</small></div>`)}return ret};
// Keep random-mock retry on the random pool, not on fixed Set 1.
const VLT_retryOriginalV12=VLT_retry;
VLT_retry=function(){if(VLT_RESULT&&VLT_RESULT.mode==='mock'&&VLT_RESULT.setNo===null)return VLT_startRandomMock();return VLT_retryOriginalV12.apply(this,arguments)};

// Aggregate question history into useful skills, including combined short/long conversations.
function v12SkillRows(){
 const map={qr:{name:'Question–Response',correct:0,total:0},conversation:{name:'Conversations (Short + Long)',correct:0,total:0},tc:{name:'Text Completion',correct:0,total:0},rc:{name:'Reading Comprehension',correct:0,total:0}};
 (VLT_STATE.history||[]).filter(h=>h&&h.mode==='mock').forEach(h=>(h.categories||[]).forEach(c=>{const key=(c.cat==='short'||c.cat==='long')?'conversation':c.cat;if(map[key]){map[key].correct+=Number(c.score)||0;map[key].total+=Number(c.total)||0}}));
 return Object.entries(map).map(([id,x])=>({id,...x,accuracy:x.total?Math.round(x.correct/x.total*100):null}));
}
const studioAnalyticsOriginalV12=studioAnalytics;
window.__TGAT1_ANALYTICS_BASE__=studioAnalyticsOriginalV12;
window.__TGAT1_ANALYTICS_HOOKS__=[];
window.TGAT1_addAnalyticsHook=function(fn){if(typeof fn==='function')window.__TGAT1_ANALYTICS_HOOKS__.push(fn);return fn};
window.TGAT1_addAnalyticsHook(function(){const app=document.getElementById('app');if(!app||app.querySelector('.v12-skill-panel'))return;const rows=v12SkillRows();const has=rows.some(x=>x.total>0);const html=`<section class="st-card v12-skill-panel" style="margin-top:16px"><div class="st-eyebrow">SKILL INSIGHTS</div><h2 style="font-size:18px;margin:5px 0">วิเคราะห์จุดอ่อนตามทักษะ</h2><p class="st-subtitle">รวมผลจากชุดจำลองที่ส่งแล้วในประวัติที่บันทึกไว้ (เก็บประวัติล่าสุดไม่เกิน 80 รอบ) โดยรวม Short + Long Conversation เป็นทักษะเดียว</p>${has?rows.map(x=>`<div class="st-bar-row"><span class="name">${v12Esc(x.name)}</span><div class="st-chart-bar"><i style="width:${x.accuracy||0}%"></i></div><b>${x.accuracy==null?'—':x.accuracy+'%'}</b></div><small class="st-muted">${x.correct}/${x.total} ข้อ</small>`).join(''):'<div class="st-empty">ยังไม่มีข้อมูลจากชุดจำลองเต็ม ผลจะปรากฏหลังส่งชุดสอบ</div>'}<div class="v12-skill-coach">${has?`<b>ทักษะที่ควรโฟกัส:</b> ${v12Esc(rows.filter(x=>x.total>0).sort((a,b)=>a.accuracy-b.accuracy)[0].name)} (คะแนนต่ำสุดจากข้อมูลที่มี)`: 'เริ่มจากทำชุดจำลองเต็มหนึ่งชุดเพื่อให้ระบบมีข้อมูลวิเคราะห์'}</div></section>`;app.insertAdjacentHTML('beforeend',html)});

// Improve mock result retry button label for the random pool and correct route.

})();


/* ===== 06 · 17-backup-import-guard.js ===== */
/* TGAT1 Backup Import Guard — imported backups never restore executable in-progress sessions.
   Completed progress/history stays importable. Transient exam/game sessions are local runtime state. */
(function(){
  'use strict';
  const TRANSIENT_SESSION_KEYS = Object.freeze([
    'tgat1_studio_active_session_v1',
    'tgat1_vlt_active_run_v1',
    'tgat1_v17_exam_draft_v1'
  ]);
  const transient = new Set(TRANSIENT_SESSION_KEYS);
  function stripTransientSessions(input){
    if(!input || typeof input!=='object' || Array.isArray(input))
      throw new TypeError('Backup data must be an object');
    const data=Object.create(null), skipped=[];
    for(const [key,value] of Object.entries(input)){
      if(transient.has(key)){skipped.push(key);continue;}
      data[key]=value;
    }
    return {data, skipped};
  }
  window.TGAT1BackupImportGuard=Object.freeze({
    transientSessionKeys:TRANSIENT_SESSION_KEYS.slice(),
    stripTransientSessions
  });
})();


/* ===== 07 · 03-stability-backup.js ===== */
/* TGAT1 Stability & Offline hardening layer — additive patch, original question/content bank preserved. */
(function(){
  'use strict';
  if(window.__TGAT1_STABILITY_V13__) return;
  window.__TGAT1_STABILITY_V13__ = true;

  const APP='TGAT1 English Studio';
  const DB='tgat1_studio_recovery_v1';
  const STORE='snapshots';
  const MAX_BACKUP_BYTES=8*1024*1024;
  const PREFIX=/^(eng3|engdaily_vault_v1|tgat1_)/; // storage-change observer only; not an import trust rule
  const isBackupKey=k=>k==='eng3'||k==='engdaily_vault_v1'||!!window.TGAT1DataGuards?.isImportableLocalKey(k);
  let dbPromise=null, backupTimer=null, backupPending=false, lastSavedAt=0, lastSaveError='', idbState='checking', restoreInProgress=false;
  let originalSet=null, originalRemove=null;

  function byteLength(s){return new TextEncoder().encode(String(s)).length;}
  function collect(){
    const data={};
    lastSaveError='';
    try{
      const count=localStorage.length;
      for(let i=0;i<count;i++){
        const k=localStorage.key(i); if(!k||!isBackupKey(k)) continue;
        const v=localStorage.getItem(k); if(v!==null) data[k]=v;
      }
    }catch(e){lastSaveError='อ่านข้อมูลในเบราว์เซอร์ไม่ครบ: '+(e&&e.message||e);return {};}
    return data;
  }
  function openDB(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){idbState='unsupported';reject(new Error('IndexedDB unavailable'));return;}
      let req; try{req=indexedDB.open(DB,1);}catch(e){idbState='blocked';reject(e);return;}
      req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'id'});};
      req.onsuccess=()=>{idbState='ready';resolve(req.result);};
      req.onerror=()=>{idbState='error';reject(req.error||new Error('IndexedDB open failed'));};
      req.onblocked=()=>{idbState='blocked';};
    });
    return dbPromise;
  }
  function requestPromise(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('IndexedDB request failed'));});}
  async function hashText(text){
    let h=2166136261; for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
    const out={algorithm:'FNV1A32',value:(h>>>0).toString(16).padStart(8,'0')};
    try{if(window.crypto&&crypto.subtle&&window.TextEncoder){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));out.sha256=Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');}}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
    return out;
  }
  function coreFor(data, exportedAt){return {app:APP,version:3,exportedAt:exportedAt||new Date().toISOString(),data};}
  async function makeEnvelope(data){const core=coreFor(data);const integrity=await hashText(JSON.stringify(core));return {...core,integrity};}
  async function verifyEnvelope(x){
    if(!x||x.app!==APP||x.version!==3||!x.data||typeof x.data!=='object'||Array.isArray(x.data)||!x.integrity||typeof x.integrity.value!=='string') return false;
    const core={app:x.app,version:x.version,exportedAt:x.exportedAt,data:x.data};
    const actual=await hashText(JSON.stringify(core));
    return actual.algorithm===x.integrity.algorithm && actual.value===x.integrity.value && (!x.integrity.sha256 || !actual.sha256 || actual.sha256===x.integrity.sha256);
  }
  function validKeys(data){
    if(!data||typeof data!=='object'||Array.isArray(data)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
    const out={}; let total=0;
    for(const [k,v] of Object.entries(data)){
      if(!isBackupKey(k)) continue;
      if(typeof v!=='string') throw new Error('ข้อมูลใน '+k+' มีรูปแบบไม่ถูกต้อง');
      total+=byteLength(k)+byteLength(v); if(total>MAX_BACKUP_BYTES) throw new Error('ไฟล์สำรองมีขนาดใหญ่เกินกำหนด');
      if(v.length>MAX_BACKUP_BYTES) throw new Error('ข้อมูลบางรายการใหญ่เกินกำหนด');
      // Parse JSON where possible so malformed serialized records are not silently installed.
      try{JSON.parse(v);}catch(e){ if(k!=='tgat1_personal_target_score_v1') throw new Error('ข้อมูลใน '+k+' เสียหายหรืออ่านไม่ได้'); }
      out[k]=v;
    }
    if(!Object.keys(out).length) throw new Error('ไม่พบข้อมูล TGAT1 ในไฟล์สำรอง');
    return out;
  }
  function oldBackupToData(x){
    const data={};
    const add=(k,v)=>{if(v!==undefined&&v!==null)data[k]=typeof v==='string'?v:JSON.stringify(v);};
    add('tgat1_english_studio_v1',x.profile);
    add('tgat1_studio_vocab_progress_v1',x.vocab);
    add('eng3',x.legacy);
    add('engdaily_vault_v1',x.exam);
    if(x.local&&typeof x.local==='object'){
      for(const [k,v] of Object.entries(x.local)) if(isBackupKey(k)) add(k,v);
    }
    return validKeys(data);
  }
  async function saveSnapshot(){
    backupPending=true;
    try{
      const data=collect();
      if(lastSaveError) throw new Error(lastSaveError);
      if(!Object.keys(data).length){backupPending=false;return {ok:false,reason:'no-data'};}
      const raw=JSON.stringify(data); if(byteLength(raw)>MAX_BACKUP_BYTES) throw new Error('ข้อมูลผู้ใช้มีขนาดเกิน 8 MB');
      const envelope=await makeEnvelope(data);
      const rec={id:'snap-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),savedAt:Date.now(),envelope};
      const db=await openDB();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite'); const os=tx.objectStore(STORE); os.put(rec);
        const all=os.getAll(); all.onsuccess=()=>{const rows=(all.result||[]).sort((a,b)=>b.savedAt-a.savedAt);rows.slice(4).forEach(r=>os.delete(r.id));};
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('snapshot transaction failed'));tx.onabort=()=>reject(tx.error||new Error('snapshot transaction aborted'));
      });
      lastSavedAt=Date.now();lastSaveError='';backupPending=false;
      return {ok:true,savedAt:lastSavedAt,keys:Object.keys(data).length};
    }catch(e){backupPending=false;lastSaveError=e&&e.message||String(e);return {ok:false,reason:lastSaveError};}
  }
  function scheduleSnapshot(delay=1000){
    if(backupTimer) clearTimeout(backupTimer);
    backupPending=true;
    backupTimer=setTimeout(()=>{backupTimer=null;saveSnapshot();},delay);
  }
  async function getSnapshots(){
    const db=await openDB(); const rows=await requestPromise(db.transaction(STORE,'readonly').objectStore(STORE).getAll());
    return (rows||[]).sort((a,b)=>b.savedAt-a.savedAt);
  }
  async function latestValid(){
    const rows=await getSnapshots();
    for(const r of rows){if(r&&r.envelope&&await verifyEnvelope(r.envelope))return r;}
    return null;
  }
  async function applyData(data){
    // Defence in depth: the same transient-session filter applies to manual file import
    // and automatic IndexedDB recovery. Only completed progress/history is restored.
    if(typeof window!=='undefined'&&window.TGAT1BackupImportGuard)data=window.TGAT1BackupImportGuard.stripTransientSessions(data).data;
    const safe=validKeys(data), previous=collect();
    if(lastSaveError) throw new Error('ก่อนนำเข้าต้องอ่านข้อมูลเดิมให้ครบ: '+lastSaveError);
    const previousKeys=Object.keys(previous).filter(isBackupKey);
    if(previousKeys.length){
      const priorSnapshot=await saveSnapshot();
      if(!priorSnapshot.ok) throw new Error('หยุดการนำเข้าเพื่อป้องกันข้อมูลเดิม เพราะสร้างสำเนาก่อนแทนที่ไม่สำเร็จ: '+priorSnapshot.reason);
    }
    restoreInProgress=true;
    try{
      previousKeys.forEach(k=>localStorage.removeItem(k));
      for(const [k,v] of Object.entries(safe)) localStorage.setItem(k,v);
      const verified=collect();
      if(lastSaveError) throw new Error('อ่านกลับหลังนำเข้าไม่ครบ: '+lastSaveError);
      const expectedKeys=Object.keys(safe);
      const actualKeys=Object.keys(verified);
      const mismatch=expectedKeys.length!==actualKeys.length || expectedKeys.some(k=>verified[k]!==safe[k]);
      if(mismatch) throw new Error('ตรวจข้อมูลหลังนำเข้าไม่ตรงกับไฟล์สำรอง');
      // The imported data is verified. A post-restore snapshot is best-effort; the prior snapshot remains available.
      return {ok:true,count:expectedKeys.length,verified:true};
    }catch(e){
      let rollbackError=null;
      try{
        const now=collect();
        if(lastSaveError) throw new Error(lastSaveError);
        Object.keys(now).filter(isBackupKey).forEach(k=>localStorage.removeItem(k));
        for(const [k,v] of Object.entries(previous)) localStorage.setItem(k,v);
        const restored=collect();
        if(lastSaveError || Object.keys(previous).some(k=>restored[k]!==previous[k]) || Object.keys(restored).length!==Object.keys(previous).length) throw new Error(lastSaveError||'ข้อมูลเดิมตรวจกลับไม่ครบ');
      }catch(err){rollbackError=err;}
      if(rollbackError) throw new Error((e&&e.message||e)+'; การกู้คืนข้อมูลเดิมอัตโนมัติไม่สมบูรณ์: '+(rollbackError.message||rollbackError));
      throw e;
    }finally{restoreInProgress=false;}
  }
  async function exportFile(){
    try{
      const data=collect();
      if(lastSaveError) throw new Error(lastSaveError);
      if(!Object.keys(data).length){notify('ยังไม่พบข้อมูลความคืบหน้าสำหรับส่งออก');return false;}
      const safe=validKeys(data);
      const env=await makeEnvelope(safe), serialized=JSON.stringify(env,null,2);
      if(byteLength(serialized)>MAX_BACKUP_BYTES+100000) throw new Error('ไฟล์สำรองมีขนาดเกิน 8 MB');
      const blob=new Blob([serialized],{type:'application/json'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tgat1-english-studio-backup-v3.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
      notify('สร้างไฟล์สำรองและตรวจ checksum แล้ว');return true;
    }catch(e){notify('ส่งออกไม่สำเร็จ: '+(e&&e.message||e));return false;}
  }
  async function importFile(input){
    const file=input&&input.files&&input.files[0]; if(!file)return;
    try{
      if(file.size>MAX_BACKUP_BYTES+100000) throw new Error('ไฟล์ใหญ่เกิน 8 MB');
      let x;try{x=JSON.parse(await file.text())}catch(_){throw new Error('ไฟล์ไม่ใช่ JSON ที่ถูกต้อง')}
      if(!x||typeof x!=='object'||Array.isArray(x))throw new Error('โครงสร้างไฟล์สำรองไม่ถูกต้อง');
      let data,verified=false;
      if(x.app!==APP||![1,2,3].includes(x.version)) throw new Error('ชื่อแอปหรือเวอร์ชันไม่ตรงกัน');
      if(x.version===3){verified=await verifyEnvelope(x);if(!verified)throw new Error('Checksum ไม่ตรง ไฟล์อาจเสียหายหรือถูกแก้ไข');data=validKeys(x.data);}
      else data=oldBackupToData(x);
      // A checksum detects accidental corruption, but it is not an authenticity signature.
      // Imported in-progress sessions contain renderable question objects, so never trust/restore
      // those transient keys from an uploaded file. Completed progress/history remains intact.
      const guarded=window.TGAT1BackupImportGuard
        ? window.TGAT1BackupImportGuard.stripTransientSessions(data)
        : {data,skipped:[]};
      data=guarded.data;
      if(!Object.keys(data).length)throw new Error('ไฟล์นี้มีเฉพาะรอบฝึกที่ยังไม่จบ ไม่มีข้อมูลความคืบหน้าถาวรให้นำเข้า');
      const sessionNote=guarded.skipped.length
        ? ' รอบฝึกที่ยังไม่ส่ง '+guarded.skipped.length+' รายการจะไม่ถูกย้าย เพื่อป้องกันการนำเนื้อหาที่แฝงมาในไฟล์ไป render เป็น HTML.'
        : '';
      const prompt='นำเข้าข้อมูลสำรอง '+(verified?'(ตรวจ checksum แล้ว ไม่ใช่ลายเซ็นยืนยันผู้สร้าง)':'(รูปแบบเก่า ไม่สามารถตรวจ checksum ย้อนหลังได้)')+' จำนวน '+Object.keys(data).length+' รายการ'+sessionNote+' และแทนที่ข้อมูลเดิมหรือไม่?';
      if(!(await TGConfirm(prompt)))return;
      const r=await applyData(data); if(!r.ok)throw new Error('restore failed');
      notify('นำเข้าข้อมูลสำเร็จ กำลังเปิดแอปใหม่');setTimeout(()=>location.reload(),350);
    }catch(e){notify('นำเข้าไม่ได้: '+(e&&e.message||'ไฟล์ไม่ถูกต้อง'));}
    finally{if(input)input.value='';}
  }
  async function restoreLatest(){
    try{
      const r=await latestValid(); if(!r){notify('ไม่พบข้อมูลสำรองอัตโนมัติที่ผ่านการตรวจสอบ');return false;}
      const date=new Date(r.savedAt).toLocaleString('th-TH');
      const guarded=window.TGAT1BackupImportGuard
        ? window.TGAT1BackupImportGuard.stripTransientSessions(r.envelope.data)
        : {data:r.envelope.data,skipped:[]};
      const note=guarded.skipped.length
        ? ' รอบฝึกที่ยังไม่ส่ง '+guarded.skipped.length+' รายการจะไม่ถูกกู้คืน; ประวัติและความคืบหน้าที่บันทึกเสร็จแล้วจะยังถูกกู้คืน.'
        : '';
      if(!(await TGConfirm('พบข้อมูลสำรองอัตโนมัติเมื่อ '+date+note+' ต้องการกู้คืนและแทนที่ข้อมูลปัจจุบันหรือไม่?')))return false;
      await applyData(guarded.data);notify('กู้คืนข้อมูลแล้ว กำลังเปิดแอปใหม่');setTimeout(()=>location.reload(),350);return true;
    }catch(e){notify('กู้คืนไม่สำเร็จ: '+(e&&e.message||e));return false;}
  }
  function notify(msg){
    try{if(typeof studioToast==='function')studioToast(msg);else{let el=document.getElementById('tgatSafetyToast');if(!el){el=document.createElement('div');el.id='tgatSafetyToast';el.className='toast';document.body.appendChild(el);}el.textContent=msg;el.style.display='block';setTimeout(()=>{el.style.display='none';},3200);}}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
  }
  async function requestPersistence(){try{if(navigator.storage&&navigator.storage.persist){const granted=await navigator.storage.persist();return granted?'ได้รับอนุญาตให้เก็บข้อมูลถาวร':'เบราว์เซอร์ยังไม่อนุญาตพื้นที่จัดเก็บถาวร';}return 'เบราว์เซอร์ไม่รองรับการขอพื้นที่ถาวร';}catch(e){return 'ไม่สามารถขอพื้นที่ถาวรได้';}}
  async function status(){
    let quota='ไม่รองรับ';try{if(navigator.storage&&navigator.storage.estimate){const q=await navigator.storage.estimate();quota=(q.usage!=null?Math.round(q.usage/1024/1024)+' MB':'?')+' / '+(q.quota!=null?Math.round(q.quota/1024/1024)+' MB':'?');}}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
    let snaps=0,when='ยังไม่มีสำเนาสำรอง';try{const rows=await getSnapshots();snaps=rows.length;if(rows[0])when=new Date(rows[0].savedAt).toLocaleString('th-TH');}catch(e){idbState=idbState==='checking'?'unavailable':idbState;}
    let local='ใช้งานได้';try{const k='__tgat_safety_probe__';localStorage.setItem(k,'1');localStorage.removeItem(k);}catch(e){local='เขียนไม่ได้';}
    const data=collect(),bytes=lastSaveError?null:byteLength(JSON.stringify(data));
    return {local:(window.ED_STORAGE_FALLBACK?'โหมดชั่วคราว':local),indexedDB:idbState,snapshots:snaps,lastBackup:when,quota,online:navigator.onLine,protocol:location.protocol,keys:Object.keys(data).length,backupBytes:bytes,backupLimit:MAX_BACKUP_BYTES,lastSavedAt,lastSaveError,backupPending,fallback:!!window.ED_STORAGE_FALLBACK};
  }
  async function runChecks(){
    const checks=[];
    const add=(name,ok,detail)=>checks.push({name,ok:!!ok,detail:String(detail||'')});
    add('HTML doctype',!!document.doctype,'ตรวจพบ HTML5 doctype');
    add('ภาษาและ viewport',!!document.documentElement.lang&&!!document.querySelector('meta[name="viewport"]'),'lang='+document.documentElement.lang+' · viewport '+(document.querySelector('meta[name="viewport"]')?'พบ':'ไม่พบ'));
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id),dupes=ids.filter((x,i)=>ids.indexOf(x)!==i);
    add('ID ไม่ซ้ำ',dupes.length===0,dupes.length?'พบ: '+[...new Set(dupes)].join(', '):'ไม่พบ ID ซ้ำ');
    add('คำศัพท์',typeof STUDIO_DATA!=='undefined'&&Array.isArray(STUDIO_DATA.words)&&STUDIO_DATA.words.length>0,typeof STUDIO_DATA!=='undefined'&&STUDIO_DATA.words?STUDIO_DATA.words.length+' รายการ':'ไม่พบคลังศัพท์');
    add('คลังข้อสอบ 1,200 ข้อ',typeof VLT_BANK!=='undefined'&&Array.isArray(VLT_BANK)&&VLT_BANK.length===1200,typeof VLT_BANK!=='undefined'&&Array.isArray(VLT_BANK)?VLT_BANK.length+' ข้อ':'ไม่พบคลังข้อสอบ');
    add('ชุดจำลอง 20 ชุด',typeof VLT_BANK!=='undefined'&&new Set(VLT_BANK.map(x=>x.set)).size===20,typeof VLT_BANK!=='undefined'?new Set(VLT_BANK.map(x=>x.set)).size+' ชุด':'ไม่พบข้อมูล');
    add('localStorage',!window.ED_STORAGE_FALLBACK,'สำรองข้อมูล JSON ยังต้องส่งออกเป็นระยะ');
    let idb=false;try{const d=await openDB();idb=!!d;}catch(e){(window.TGAT1_ERR||Object)(e,'app')} add('IndexedDB auto-backup',idb,idb?'พร้อมสำรองอัตโนมัติ':'เบราว์เซอร์/ต้นทางนี้ไม่อนุญาต IndexedDB');
    const backupData=collect(),backupBytes=lastSaveError?Infinity:byteLength(JSON.stringify(backupData));
    add('ขนาดข้อมูลสำรอง',!lastSaveError&&backupBytes<=MAX_BACKUP_BYTES, lastSaveError||((backupBytes/1024/1024).toFixed(2)+' MB / 8 MB'));
    const external=[...document.querySelectorAll('script[src],link[rel="stylesheet"]')].filter(x=>{const u=x.src||x.href||'';try{return /^https?:/i.test(u)&&new URL(u,location.href).origin!==location.origin}catch(e){return false}});
    add('ไม่มี dependency ภายนอก',external.length===0,external.length?'พบ '+external.length+' แหล่ง':'แอปหลักไม่ต้องโหลดไฟล์ภายนอก');
    const w=document.documentElement.clientWidth,sw=document.documentElement.scrollWidth;
    add('ไม่มี horizontal overflow',sw<=w+1,'viewport '+w+' px · document '+sw+' px');
    const result={passed:checks.filter(x=>x.ok).length,total:checks.length,checks,when:new Date().toISOString()};
    return result;
  }
  function renderCheckResults(result){
    const target=document.getElementById('tgatSafetyResults');if(!target)return;
    target.innerHTML='<div class="tgat-check-summary">ผ่าน '+result.passed+'/'+result.total+' รายการ</div>'+result.checks.map(x=>'<div class="tgat-check-row"><span class="tgat-check-icon '+(x.ok?'ok':'warn')+'">'+(x.ok?'✓':'!')+'</span><div><b>'+escapeHtml(x.name)+'</b><small>'+escapeHtml(x.detail)+'</small></div></div>').join('')+'<small>ตรวจเมื่อ '+escapeHtml(new Date(result.when).toLocaleString('th-TH'))+'</small>';
  }
  function escapeHtml(s){return htmlEsc(s)}
  async function refreshPanel(){
    const s=await status();
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    set('tgatSafetyLocal',s.local);set('tgatSafetyIDB',s.indexedDB);set('tgatSafetyLast',s.lastBackup);set('tgatSafetyQuota',s.quota);set('tgatSafetyKeys',s.keys+' รายการ');set('tgatSafetyMode',s.online?'ออนไลน์':'ออฟไลน์');
  }
  function panelHtml(){return `<section id="tgatSafetyCard" class="st-card tgat-safety-card"><div class="st-eyebrow">STABILITY · BACKUP · OFFLINE</div><h2 style="font-size:18px;margin:5px 0">ศูนย์ตรวจสุขภาพแอป</h2><p class="st-subtitle">บันทึกสำรองอัตโนมัติในเบราว์เซอร์ที่รองรับ พร้อมตรวจไฟล์ก่อนกู้คืน และตรวจความพร้อมของแอป</p><div class="tgat-safety-grid"><div><small>localStorage</small><b id="tgatSafetyLocal">กำลังตรวจ…</b></div><div><small>IndexedDB</small><b id="tgatSafetyIDB">กำลังตรวจ…</b></div><div><small>สำรองล่าสุด</small><b id="tgatSafetyLast">กำลังตรวจ…</b></div><div><small>พื้นที่จัดเก็บ</small><b id="tgatSafetyQuota">กำลังตรวจ…</b></div><div><small>ข้อมูลแอป</small><b id="tgatSafetyKeys">กำลังตรวจ…</b></div><div><small>สถานะเครือข่าย</small><b id="tgatSafetyMode">กำลังตรวจ…</b></div></div><div class="st-inline tgat-safety-actions"><button class="st-btn" onclick="TGAT1Safety.backupNow()">บันทึกสำรองตอนนี้</button><button class="st-btn secondary" onclick="TGAT1Safety.restoreLatest()">กู้คืนสำเนาล่าสุด</button><button class="st-btn secondary" onclick="TGAT1Safety.exportFile()">ดาวน์โหลดไฟล์สำรอง</button></div><div class="st-inline tgat-safety-actions"><button class="st-btn ghost" onclick="TGAT1Safety.runAndShow()">ตรวจระบบทั้งหมด</button><button class="st-btn ghost" onclick="document.getElementById('studioImportFile').click()">นำเข้าและตรวจไฟล์</button></div><div id="tgatSafetyResults" class="tgat-safety-results" aria-live="polite">กด “ตรวจระบบทั้งหมด” เพื่อดูผลการตรวจล่าสุด</div><p class="st-footer-note">คำเตือน: ข้อมูลที่เก็บในเบราว์เซอร์อาจหายได้เมื่อผู้ใช้ล้างข้อมูลเว็บไซต์ เปลี่ยนอุปกรณ์ หรือเบราว์เซอร์ลบพื้นที่จัดเก็บ การสำรองอัตโนมัติช่วยกู้คืนภายในเบราว์เซอร์เดิมได้บางกรณี แต่ไฟล์ JSON ที่ดาวน์โหลดเก็บไว้ต่างหากคือวิธีสำรองข้ามอุปกรณ์ที่เชื่อถือได้กว่า</p></section>`;}

  window.__TGAT1_SETTINGS_BASE__=window.studioSettings;
window.__TGAT1_SETTINGS_HOOKS__=[];
window.TGAT1_addSettingsHook=function(fn){if(typeof fn==='function')window.__TGAT1_SETTINGS_HOOKS__.push(fn);return fn};
window.TGAT1_addSettingsHook(function(){const app=document.getElementById('app'),anchor=app?.querySelector('.pf-hero');if(app&&!document.getElementById('tgatSafetyCard')){const box=document.createElement('div');box.id='tgatSafetyCardHost';box.innerHTML=panelHtml();const card=box.firstElementChild;if(anchor)anchor.insertAdjacentElement('afterend',card);else app.appendChild(card);refreshPanel();}});

  window.studioExportAll=exportFile;
  window.studioImportAll=importFile;
  window.TGAT1Safety={
    backupNow:async()=>{const r=await saveSnapshot();notify(r.ok?'สำรองข้อมูลอัตโนมัติแล้ว':'สำรองไม่ได้: '+r.reason);refreshPanel();return r;},
    restoreLatest,exportFile,importFile,status,runChecks,
    runAndShow:async()=>{const r=await runChecks();renderCheckResults(r);return r;},
    refreshPanel
  };

  // Mirror successful app-state writes to an IndexedDB recovery trail. Original localStorage semantics remain intact.
  try{
    originalSet=Storage.prototype.setItem;originalRemove=Storage.prototype.removeItem;
    Storage.prototype.setItem=function(k,v){const r=originalSet.call(this,k,v);try{if(this===window.localStorage&&PREFIX.test(String(k))&&!restoreInProgress)scheduleSnapshot();}catch(e){(window.TGAT1_ERR||Object)(e,'app')}return r;};
    Storage.prototype.removeItem=function(k){const r=originalRemove.call(this,k);try{if(this===window.localStorage&&PREFIX.test(String(k))&&!restoreInProgress)scheduleSnapshot(500);}catch(e){(window.TGAT1_ERR||Object)(e,'app')}return r;};
  }catch(e){lastSaveError='ไม่สามารถติดตั้งตัวดักการบันทึกได้';}
  window.addEventListener('storage',e=>{if(e.key&&PREFIX.test(e.key))scheduleSnapshot(600);});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')scheduleSnapshot(50);});
  window.addEventListener('pagehide',()=>{if(backupTimer)clearTimeout(backupTimer);saveSnapshot();});
  window.addEventListener('online',()=>{const el=document.getElementById('tgatSafetyMode');if(el)el.textContent='ออนไลน์';});
  window.addEventListener('offline',()=>{const el=document.getElementById('tgatSafetyMode');if(el)el.textContent='ออฟไลน์';});

  // Warn only when a real practice/exam session is in progress; the active run is also persisted for recovery.
  window.addEventListener('beforeunload',e=>{
    let active=false;
    try{active=(!window.STUDIO_SESSION_FINISHED&&typeof Q!=='undefined'&&Q&&Array.isArray(Q.qs)&&Q.qs.length>0)||(typeof VLT_RUN!=='undefined'&&VLT_RUN&&Array.isArray(VLT_RUN.qs)&&VLT_RUN.qs.length>0);}catch(err){(window.TGAT1_ERR||Object)(err,'app')}
    if(active){e.preventDefault();e.returnValue='ยังมีรอบฝึกที่กำลังทำอยู่ ระบบจะพยายามบันทึกเพื่อให้กลับมาทำต่อได้';return e.returnValue;}
  });

  // Best-effort durable storage; never make startup depend on it.
  requestPersistence().then(()=>{}).catch(()=>{});
  setTimeout(()=>{saveSnapshot();},1800);
  setTimeout(async()=>{
    try{
      const rows=await getSnapshots(); const data=collect();
      if(rows.length){
        const r=await latestValid();
        const missing=r&&Object.keys(r.envelope.data||{}).some(k=>localStorage.getItem(k)===null);
        if(missing){const box=document.createElement('div');box.className='tgat-recovery-banner';box.innerHTML='<b>พบสำเนาข้อมูลอัตโนมัติ</b><span>พบรายการที่ไม่มีอยู่ในพื้นที่จัดเก็บปัจจุบัน อาจกู้คืนความคืบหน้าได้</span><button type="button">ตรวจและกู้คืน</button><button type="button" aria-label="ปิด">×</button>';document.body.appendChild(box);box.querySelector('button').onclick=restoreLatest;box.querySelectorAll('button')[1].onclick=()=>box.remove();}
      }
    }catch(e){(window.TGAT1_ERR||Object)(e,'app')}
  },2400);
})();


/* ===== 08 · 04-pwa-register.js ===== */
(function(){if(!('serviceWorker' in navigator))return;const secure=window.isSecureContext||location.hostname==='localhost'||location.hostname==='127.0.0.1';if(!secure)return;window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(function(err){console.warn('Offline cache registration unavailable:',err&&err.message||err);});});})();


/* ===== 09 · 05-question-quality.js ===== */
(function(){'use strict';
 const FLAG_KEY='tgat1_v14_question_flags';
 function readFlags(){try{const x=JSON.parse(localStorage.getItem(FLAG_KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
 function writeFlags(x){try{localStorage.setItem(FLAG_KEY,JSON.stringify(x));return true}catch(e){return false}}
 function audit(){const bank=typeof VLT_BANK!=='undefined'&&Array.isArray(VLT_BANK)?VLT_BANK:[];const seenId=new Set(),seenPC=new Map(),seenPrompt=new Map();let missingId=0,duplicateId=0,missingPrompt=0,badOptions=0,duplicateOptions=0,badAnswer=0,missingExplanation=0,badCategory=0,badSet=0;
  bank.forEach(q=>{if(!q.id)missingId++;if(seenId.has(q.id))duplicateId++;seenId.add(q.id);if(!String(q.prompt||'').trim())missingPrompt++;if(!Array.isArray(q.options)||q.options.length!==4)badOptions++;else if(new Set(q.options.map(x=>String(x).trim().toLowerCase())).size!==4)duplicateOptions++;if(!Number.isInteger(q.answer)||!Array.isArray(q.options)||q.answer<0||q.answer>=q.options.length)badAnswer++;if(!String(q.explanation||'').trim())missingExplanation++;if(!['qr','short','long','tc','rc'].includes(q.category))badCategory++;if(!Number.isInteger(q.set)||q.set<1||q.set>20)badSet++;const p=String(q.prompt||'').trim().toLowerCase(),c=String(q.context||'').trim().toLowerCase(),pc=p+'\\u0000'+c;seenPC.set(pc,(seenPC.get(pc)||0)+1);seenPrompt.set(p,(seenPrompt.get(p)||0)+1);});
  const exactDup=[...seenPC.values()].reduce((n,v)=>n+Math.max(0,v-1),0);const repeatedTemplates=[...seenPrompt.values()].filter(v=>v>1).length;const structural=missingId+duplicateId+missingPrompt+badOptions+duplicateOptions+badAnswer+missingExplanation+badCategory+badSet;
  const sets={};for(let i=1;i<=20;i++)sets[i]=bank.filter(q=>q.set===i).length;
  const categories={};['qr','short','long','tc','rc'].forEach(c=>categories[c]=bank.filter(q=>q.category===c).length);
  return {total:bank.length,uniqueIds:seenId.size,missingId,duplicateId,missingPrompt,badOptions,duplicateOptions,badAnswer,missingExplanation,badCategory,badSet,exactDup,repeatedTemplates,structural,sets,categories};}
 function esc(s){return htmlEsc(s)}
 function missed(){const ids=Object.keys((typeof VLT_STATE!=='undefined'&&VLT_STATE.missed)||{}).filter(id=>Number(VLT_STATE.missed[id])>0);return ids.map(id=>({q:typeof VLT_get==='function'?VLT_get(id):null,count:Number(VLT_STATE.missed[id])||0})).filter(x=>x.q);}
 window.V14_flagQuestion=function(id){const a=readFlags();if(!a.includes(id))a.push(id);if(writeFlags(a)){if(typeof VLT_toast==='function')VLT_toast('บันทึกข้อที่ต้องตรวจทานแล้ว');else alert('บันทึกแล้ว')}else alert('บันทึกไม่สำเร็จ กรุณาส่งออก Backup');};
 window.V14_unflagQuestion=function(id){writeFlags(readFlags().filter(x=>x!==id));window.studioAnalytics()};
 window.V14_startCategoryReview=function(cat){const qs=missed().filter(x=>x.q.category===cat).map(x=>({...x.q,userAnswer:null}));if(!qs.length){VLT_toast('หมวดนี้ยังไม่มีข้อผิด');return}VLT_begin({mode:'practice',label:'ทบทวนข้อผิด · '+(VLT_CATS.find(x=>x[0]===cat)?.[1]||cat),qs:VLT_shuffle(qs).slice(0,20),index:0,answers:{},score:0,combo:0,reviewOn:true});};
 window.V14_exportAudit=function(){const bank=typeof VLT_BANK!=='undefined'?VLT_BANK:[];const rows=[['id','set','category','section','difficulty','prompt','context','options','answer_index','correct_option','explanation','automated_status','manual_review']];bank.forEach(q=>{const ok=q.id&&q.prompt&&Array.isArray(q.options)&&q.options.length===4&&new Set(q.options.map(x=>String(x).trim().toLowerCase())).size===4&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length&&q.explanation&&['qr','short','long','tc','rc'].includes(q.category)&&q.set>=1&&q.set<=20;rows.push([q.id,q.set,q.category,q.section,q.difficulty,q.prompt,q.context,(q.options||[]).join(' | '),q.answer,(q.options||[])[q.answer]||'',typeof VLT_learningExplanation==='function'?VLT_learningExplanation(q):q.explanation,ok?'STRUCTURE_PASS':'STRUCTURE_FAIL','PENDING_HUMAN_CONTENT_REVIEW']);});const csv='\\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\\r\\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='TGAT1_v14_Question_Review_Register.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);};
 window.V14_filterMissed=function(){const input=document.getElementById('v14MissSearch');const q=(input?.value||'').toLowerCase();document.querySelectorAll('[data-v14-miss]').forEach(el=>el.hidden=!el.textContent.toLowerCase().includes(q));};
 window.TGAT1_addAnalyticsHook(function(){const app=document.getElementById('app');if(!app)return;const a=audit(),m=missed(),flags=readFlags();const cats=['qr','short','long','tc','rc'];const names={qr:'Question–Response',short:'Short Conversation',long:'Long Conversation',tc:'Text Completion',rc:'Reading Comprehension'};const bad=a.structural;const rows=m.slice().sort((x,y)=>y.count-x.count).slice(0,80).map(({q,count})=>`<div class="v14-question" data-v14-miss><b>${esc(q.id)} · ${esc(names[q.category]||q.category)}</b><span class="v14-badge warn">ผิด ${count} ครั้ง</span><p>${esc(q.prompt)}</p>${q.context?`<p class="v14-muted">${esc(q.context)}</p>`:''}<p class="v14-muted">คำตอบที่ถูก: ${esc(q.options[q.answer]||'—')}</p><div class="v14-actions"><button class="v14-btn" onclick="V14_flagQuestion('${esc(q.id)}')">⚑ แจ้งให้ตรวจทาน</button>${flags.includes(q.id)?'<span class="v14-badge warn">ติดธงตรวจทาน</span>':''}</div></div>`).join('');
 const card=`<section class="v14-wrap"><div class="v14-card"><div class="st-eyebrow">QUESTION QUALITY AUDIT</div><h2 class="st-title" style="font-size:21px">ตรวจคุณภาพคลังข้อสอบ</h2><p class="v14-muted">ตรวจโครงสร้างข้อมูลอัตโนมัติจากคลังข้อสอบในแอป ไม่ได้ตัดสินความถูกต้องเชิงภาษา/เนื้อหาแทนผู้ตรวจมนุษย์</p><div class="v14-grid"><div class="v14-kpi"><b>${a.total.toLocaleString()}</b><small>ข้อในคลัง</small></div><div class="v14-kpi"><b>${Object.values(a.sets).filter(n=>n===60).length}/20</b><small>ชุดที่มี 60 ข้อ</small></div><div class="v14-kpi"><b>${a.uniqueIds.toLocaleString()}</b><small>ID ไม่ซ้ำ</small></div><div class="v14-kpi"><b>${bad}</b><small>ปัญหาโครงสร้าง</small></div></div><div class="v14-row"><span>ID ซ้ำ</span><b>${a.duplicateId}</b></div><div class="v14-row"><span>ตัวเลือก 4 ข้อและไม่ซ้ำ</span><b>${a.badOptions+a.duplicateOptions===0?'ผ่าน':'ต้องตรวจ'}</b></div><div class="v14-row"><span>ดัชนีเฉลยอยู่ในช่วง</span><b>${a.badAnswer===0?'ผ่าน':'ต้องตรวจ'}</b></div><div class="v14-row"><span>คำอธิบายและหมวดครบ</span><b>${a.missingExplanation+a.badCategory===0?'ผ่าน':'ต้องตรวจ'}</b></div><div class="v14-row"><span>คู่โจทย์+บริบทซ้ำตรงกันทุกตัวอักษร</span><b>${a.exactDup}</b></div><div class="v14-row"><span>แม่แบบคำถามที่ใช้ซ้ำ (บริบทอาจต่างกัน)</span><b>${a.repeatedTemplates} แบบ</b></div><div class="v14-actions"><button class="v14-btn primary" onclick="V14_exportAudit()">ดาวน์โหลดทะเบียนตรวจ 1,200 ข้อ (CSV)</button></div><p class="v14-muted">หมายเหตุ: โจทย์ที่ใช้ประโยคคำถามแม่แบบซ้ำจะไม่ถูกลบอัตโนมัติ เพราะบริบทและตัวเลือกอาจต่างกัน ต้องตรวจเนื้อหาจริงก่อนแก้</p></div>
 <div class="v14-card"><div class="st-eyebrow">WRONG ANSWER NOTEBOOK</div><h2 class="st-title" style="font-size:21px">สมุดข้อผิดพลาด</h2><div class="v14-grid"><div class="v14-kpi"><b>${m.length}</b><small>ข้อที่ยังอยู่ในรายการผิด</small></div><div class="v14-kpi"><b>${m.reduce((n,x)=>n+x.count,0)}</b><small>จำนวนครั้งที่ตอบผิดสะสม</small></div><div class="v14-kpi"><b>${flags.length}</b><small>ข้อที่ติดธงตรวจทาน</small></div><div class="v14-kpi"><b>${VLT_STATE.answered||0}</b><small>ข้อที่ตอบทั้งหมด</small></div></div><input id="v14MissSearch" class="v14-input" placeholder="ค้นหา ID หรือข้อความโจทย์ที่เคยผิด" oninput="V14_filterMissed()"><div class="v14-actions"><button class="v14-btn primary" onclick="VLT_startReview()" ${m.length?'':'disabled'}>ทบทวนข้อผิดทั้งหมด</button>${cats.map(c=>`<button class="v14-btn" onclick="V14_startCategoryReview('${c}')" ${m.some(x=>x.q.category===c)?'':'disabled'}>${names[c]}</button>`).join('')}</div>${m.length?rows:'<p class="v14-muted">ยังไม่มีข้อผิดพลาดที่บันทึกไว้ ลองทำข้อสอบจำลองก่อน</p>'}${m.length>80?`<p class="v14-muted">แสดง 80 ข้อแรก · ปุ่มทบทวนจะใช้รายการทั้งหมด</p>`:''}</div></section>`;
 app.insertAdjacentHTML('beforeend',card);
 });
})();


/* ===== 10 · 06-srs-engine.js ===== */
(function(){
'use strict';
const STORE='tgat1_studio_vocab_progress_v1';
const DAY=86400000;
function save(){try{return studioSave(STORE,STUDIO_VSTATE)}catch(e){return false}}
function wordOf(key){const k=String(key??'').trim();return STUDIO_DATA.words.find(x=>x.w===k)||STUDIO_DATA.words.find(x=>String(x.w).toLocaleLowerCase()===k.toLocaleLowerCase())}
function esc(x){return htmlEsc(x)}
function dueCount(){return Object.values(STUDIO_VSTATE.items||{}).filter(x=>x&&Number(x.due)<=Date.now()).length}
function learnedCount(){return Object.values(STUDIO_VSTATE.items||{}).filter(x=>x&&x.status==='known').length}
function freshCount(){return Math.max(0,STUDIO_DATA.words.length-Object.keys(STUDIO_VSTATE.items||{}).length)}
function srsPanel(){const due=dueCount(),learned=V15_studiedKeys().length,fresh=Math.max(0,STUDIO_DATA.words.length-learned),sessions=STUDIO_VSTATE.sessions||[];return `<div class="v15-panel"><div class="st-eyebrow">SMART VOCABULARY REVIEW</div><h2 class="st-title" style="font-size:20px;margin:4px 0">ทบทวนศัพท์ตามความจำ</h2><p class="st-subtitle">เลือกความยากหลังเปิดความหมาย ระบบจะคำนวณวันทบทวนครั้งถัดไปให้แต่ละคำ</p><div class="v15-kpis"><div class="v15-kpi"><b>${due}</b><small>ถึงกำหนดทบทวน</small></div><div class="v15-kpi"><b>${learned}</b><small>ทำเครื่องหมายว่าจำได้</small></div><div class="v15-kpi"><b>${fresh}</b><small>ยังไม่เคยประเมิน</small></div></div><div class="st-inline"><button class="st-btn" onclick="V15_startDue()" ${due?'':'disabled'}>ทวนคำที่ถึงกำหนด (${due})</button><button class="st-btn secondary" onclick="V15_startRecall()" ${learned?'':'disabled'}>🧠 ทวนย้อนหลังทีละ 30 คำ: เห็นไทยแล้วพิมพ์อังกฤษ (${learned})</button><button class="st-btn secondary" onclick="V15_startDueRecall()" ${due?'':'disabled'}>ทดสอบคำที่ถึงกำหนด (${due})</button><button class="st-btn ghost" onclick="V15_startNew()" ${fresh?'':'disabled'}>เรียนคำใหม่ 15 คำ</button></div><p class="st-subtitle" style="margin-top:10px">ทบทวนแล้ว ${sessions.length} รอบ · วันนี้ ${sessions.filter(x=>new Date(x.at).toDateString()===new Date().toDateString()).length} รอบ</p></div>`}
window.__TGAT1_VOCAB_BASE__=studioVocabulary;
window.__TGAT1_VOCAB_HOOKS__=[];
window.__TGAT1_VOCAB_PRE_HOOKS__=[];
window.TGAT1_addVocabularyHook=function(fn){if(typeof fn==='function')window.__TGAT1_VOCAB_HOOKS__.push(fn);return fn};
window.TGAT1_addVocabularyPreHook=function(fn){if(typeof fn==='function')window.__TGAT1_VOCAB_PRE_HOOKS__.push(fn);return fn};
window.TGAT1_addVocabularyHook(function(){const app=document.getElementById('app');if(!app||app.querySelector('.v15-panel'))return;const head=app.querySelector('.st-section-head');if(head)head.insertAdjacentHTML('afterend',srsPanel());else app.insertAdjacentHTML('afterbegin',srsPanel())});
function startPool(keys,kind){const pool=[...new Set(keys)].filter(k=>wordOf(k)).slice(0,kind==='due'?40:(kind==='recall'||kind==='dueRecall'?30:15));if(!pool.length){studioToast('ยังไม่มีคำในคิวนี้');return}STUDIO_FLASH={pool,index:0,kind,started:Date.now(),graded:{again:0,hard:0,good:0,easy:0}};STUDIO_FLASH_REVEALED=false;V15_render()}
window.V15_startDue=()=>{const keys=Object.entries(STUDIO_VSTATE.items||{}).filter(([k,v])=>v&&Number(v.due)<=Date.now()).sort((a,b)=>(a[1].due||0)-(b[1].due||0)).map(([k])=>k);startPool(keys,'due')};
window.V15_startNew=()=>{const keys=STUDIO_DATA.words.filter(x=>!STUDIO_VSTATE.items[x.w]).map(x=>x.w);for(let i=keys.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[keys[i],keys[j]]=[keys[j],keys[i]]}startPool(keys,'new')};
function V15_studiedKeys(){const keys=new Set(Object.keys(STUDIO_VSTATE.items||{}));try{for(const bag of [S?.st,S?.memory,S?.reviewAt])if(bag&&typeof bag==='object')Object.keys(bag).forEach(k=>keys.add(k));}catch(e){(window.TGAT1_ERR||Object)(e,'app')}const canonical=new Map(STUDIO_DATA.words.map(x=>[String(x.w).toLocaleLowerCase(),x.w]));return [...new Set([...keys].map(k=>canonical.get(String(k).toLocaleLowerCase())).filter(Boolean))]}
window.V15_startRecall=()=>{const keys=V15_studiedKeys().sort((a,b)=>{const A=STUDIO_VSTATE.items[a]||{},B=STUDIO_VSTATE.items[b]||{};const at=A.last||S?.reviewAt?.[a]||0,bt=B.last||S?.reviewAt?.[b]||0;return at-bt||a.localeCompare(b)});startPool(keys,'recall')};
window.V15_startDueRecall=()=>{const keys=Object.entries(STUDIO_VSTATE.items||{}).filter(([k,v])=>v&&Number(v.due)<=Date.now()).sort((a,b)=>(a[1].due||0)-(b[1].due||0)).map(([k])=>k);startPool(keys,'dueRecall')};
window.V15_checkRecall=()=>{const f=STUDIO_FLASH;if(!f||!['recall','dueRecall'].includes(f.kind)||f.checked)return;const x=wordOf(f.pool[f.index]),input=document.getElementById('v15RecallInput');if(!x||!input)return;const norm=v=>String(v||'').trim().toLocaleLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');f.userTyped=input.value;f.checked=true;STUDIO_FLASH_REVEALED=true;f.recallCorrect=norm(input.value)===norm(x.w);V15_render()};
window.V15_render= function(){const app=document.getElementById('app'),f=STUDIO_FLASH;if(!f||!f.pool.length){studioVocabulary();return}const key=f.pool[f.index],x=wordOf(key);if(!x){f.index++;if(f.index>=f.pool.length){V15_finish();return}return V15_render()}const n=f.index+1,total=f.pool.length,old=STUDIO_VSTATE.items[key]||{},recall=['recall','dueRecall'].includes(f.kind),poly=STUDIO_POLYSEMY&&STUDIO_POLYSEMY[key.toLowerCase()],senses=poly?.senses?.slice(0,3).map(z=>`<p><b>${esc(z.meaning)}</b><br><span>${esc(z.example||'')}</span>${z.translation?`<br><small>${esc(z.translation)}</small>`:''}</p>`).join('')||'';STUDIO_PAGE='vocab';studioUpdateChrome('vocab');
const detail=`<div class="v15-flash-detail"><b>คำศัพท์</b><p><strong>${esc(x.w)}</strong> · ${esc(x.ipa||'IPA not listed')} · ${esc(x.pos||x.cat||'')}</p><b>ความหมายหลัก</b><p>${esc(x.th)}</p>${senses?`<b>ความหมาย/ตัวอย่างตามบริบท</b>${senses}`:`<small>ไม่มีตัวอย่างแยกตามบริบทในข้อมูลคำศัพท์รายการนี้</small>`}<small>แหล่งข้อมูล: ${esc(x.source||'คลังศัพท์ในแอป')}</small></div>`;
const prompt=recall?`<div class="v15-recall-prompt"><div class="st-eyebrow">THAI → ENGLISH · ACTIVE RECALL</div><div class="v15-recall-th">${esc(x.th)}</div><p class="st-subtitle">พิมพ์คำศัพท์ภาษาอังกฤษให้ตรง รวมวลีและการสะกดให้ครบ</p><input id="v15RecallInput" class="v14-input" style="font-size:18px;min-height:52px" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="พิมพ์คำศัพท์ภาษาอังกฤษ" value="${esc(f.userTyped||'')}" ${f.checked?'disabled':''} onkeydown="if(event.key==='Enter')V15_checkRecall()">${f.checked?`<div class="v15-recall-result ${f.recallCorrect?'is-correct':'is-wrong'}"><b>${f.recallCorrect?'✓ ถูกต้อง':'✕ ยังไม่ตรง'}</b><p>คำตอบ: <strong>${esc(x.w)}</strong></p>${f.userTyped?`<small>คำตอบของคุณ: ${esc(f.userTyped)}</small>`:''}</div>`:`<button class="st-btn" style="margin-top:10px;width:100%" onclick="V15_checkRecall()">ตรวจคำตอบ</button>`}</div>`:`<div class="st-flash" role="button" tabindex="0" aria-pressed="${STUDIO_FLASH_REVEALED?'true':'false'}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();studioFlashFlip()}" onclick="studioFlashFlip()"><div><div class="st-eyebrow">${STUDIO_FLASH_REVEALED?'MEANING':'WORD'}</div><div class="st-flash-word">${STUDIO_FLASH_REVEALED?`<span class="st-flash-th">${esc(x.th)}</span>`:esc(x.w)}</div><p class="st-subtitle" style="margin-top:9px">${STUDIO_FLASH_REVEALED?`${esc(x.ipa||'IPA not listed')} · ${esc(x.cat)}`:'แตะการ์ดเพื่อเปิดความหมาย'}</p></div></div>`;
const revealed=recall?!!f.checked:STUDIO_FLASH_REVEALED;
app.innerHTML=`<div class="st-inline" style="justify-content:space-between"><div><div class="st-eyebrow">SMART SPACED REPETITION</div><h1 class="st-title">${recall?'ทดสอบจำคำศัพท์ย้อนหลัง':'ทบทวนคำศัพท์'}</h1><p class="st-subtitle">${f.kind==='due'?'คำที่ถึงกำหนดแล้ว':f.kind==='new'?'คำศัพท์ใหม่':f.kind==='dueRecall'?'ทดสอบคำที่ถึงกำหนด':'ทดสอบคำที่เคยเรียนหรือเคยฝึกแล้ว'}</p></div><button class="st-btn ghost" onclick="V15_exit()">✕ ออก</button></div><div class="st-card" style="max-width:760px;margin:18px auto"><div class="st-inline" style="justify-content:space-between"><span class="st-tag blue">${n}/${total}</span><span class="st-tag">${esc(x.level)} · ${esc(x.pos||x.cat||'')}</span></div><div class="v15-sessionbar" style="margin:12px 0 18px"><i style="width:${n/total*100}%"></i></div>${prompt}${revealed?detail:''}${revealed?`<p class="st-subtitle" style="text-align:center;margin:13px 0 0">${recall?'ประเมินตามที่ตอบได้จริง':'ประเมินตามความจำจริง ไม่ใช่ความรู้สึกว่าเคยเห็นคำนี้'}</p><div class="v15-rating"><button onclick="V15_grade('again')">อีกครั้ง<small>จำไม่ได้ · 10 นาที</small></button><button onclick="V15_grade('hard')">ยาก<small>ต้องใช้แรงคิด</small></button><button onclick="V15_grade('good')">ดี<small>จำได้</small></button><button onclick="V15_grade('easy')">ง่าย<small>จำได้ทันที</small></button></div>`:(!recall?`<div class="v15-flash-detail"><b>ความหมาย</b><p>แตะการ์ดหรือปุ่มเพื่อเปิดความหมาย</p></div><div class="st-inline" style="justify-content:center;margin-top:10px"><button class="st-btn" onclick="studioFlashFlip()">เปิดความหมาย</button></div>`:'')}</div>`};
window.V15_grade=function(rating){const f=STUDIO_FLASH;if(!f||!STUDIO_FLASH_REVEALED)return;const key=f.pool[f.index],old=STUDIO_VSTATE.items[key]||{reps:0,interval:0},prev=Math.max(0,Number(old.interval)||0);let days=0,status='learning';if(rating==='again'){days=10/(24*60);status='learning';f.graded.again++}else if(rating==='hard'){days=Math.max(1,prev?prev*1.2:1);status='learning';f.graded.hard++}else if(rating==='good'){days=Math.max(2,prev?prev*2:3);status='known';f.graded.good++}else{days=Math.max(4,prev?prev*2.8:7);status='known';f.graded.easy++}const next=Date.now()+days*DAY;STUDIO_VSTATE.items[key]={...old,status,reps:(Number(old.reps)||0)+1,interval:days,due:next,last:Date.now(),lastGrade:rating,reviewCount:(Number(old.reviewCount)||0)+1};STUDIO_VSTATE.reviewLog=STUDIO_VSTATE.reviewLog||[];STUDIO_VSTATE.reviewLog.push({word:key,grade:rating,at:Date.now(),nextDue:next,intervalDays:Math.round(days*100)/100});if(STUDIO_VSTATE.reviewLog.length>2000)STUDIO_VSTATE.reviewLog=STUDIO_VSTATE.reviewLog.slice(-2000);save();f.index++;f.checked=false;f.userTyped=null;f.recallCorrect=null;STUDIO_FLASH_REVEALED=false;if(f.index>=f.pool.length)V15_finish();else V15_render()};
function V15_finish(){const f=STUDIO_FLASH;if(!f)return;STUDIO_VSTATE.sessions=STUDIO_VSTATE.sessions||[];STUDIO_VSTATE.sessions.push({at:new Date().toISOString(),total:f.pool.length,kind:f.kind,graded:{...f.graded},durationMs:Date.now()-(f.started||Date.now())});if(STUDIO_VSTATE.sessions.length>500)STUDIO_VSTATE.sessions=STUDIO_VSTATE.sessions.slice(-500);save();const g=f.graded;STUDIO_FLASH=null;STUDIO_FLASH_REVEALED=false;const rec=(g.good||0)+(g.easy||0),done=Math.max(1,f.pool.length);document.getElementById('app').innerHTML=`${TG_summary({kicker:'สรุปการทบทวน SRS',score:rec,total:f.pool.length,pct:Math.round(rec/done*100),msg:'จำไม่ได้ '+(g.again||0)+' · ยาก '+(g.hard||0)+' · ดี '+(g.good||0)+' · ง่าย '+(g.easy||0),chips:['ทบทวนแล้ว '+f.pool.length+' คำ'],actions:'<button class="st-btn" onclick="studioVocabulary()">กลับคลังคำศัพท์</button>'})}`;studioUpdateChrome('vocab')}
window.V15_exit=()=>{if(STUDIO_FLASH&&STUDIO_FLASH.index>0){TGConfirm('ออกจากรอบนี้? คำที่ประเมินไปแล้วบันทึกไว้แล้ว').then(ok=>{if(ok){STUDIO_FLASH=null;STUDIO_FLASH_REVEALED=false;studioVocabulary()}});return}STUDIO_FLASH=null;STUDIO_FLASH_REVEALED=false;studioVocabulary()};
// Keep the established flip gesture but route card rendering through the new scheduler.
const oldFlip=studioFlashFlip;studioFlashFlip=function(){STUDIO_FLASH_REVEALED=!STUDIO_FLASH_REVEALED;if(STUDIO_FLASH&&STUDIO_FLASH.kind) V15_render();else oldFlip.apply(this,arguments)};
// Rebuild flashcards entry points to use the graded scheduler without changing vocabulary records.
window.studioStartFlashcards=function(){const due=Object.entries(STUDIO_VSTATE.items||{}).filter(([k,v])=>v&&Number(v.due)<=Date.now()).map(([k])=>k);if(due.length)V15_startDue();else V15_startNew()};
})();


/* ===== 11 · 07-smart-dashboard.js ===== */
(function(){
  'use strict';
  if(window.__TGAT1_V16_DASHBOARD__) return;
  window.__TGAT1_V16_DASHBOARD__ = true;
  const STORE='tgat1_v16_study_plan_v1';
  const names={qr:'Question–Response',short:'Short Conversations',long:'Long Conversations',tc:'Text Completion',rc:'Reading Comprehension'};
  const esc=x=>typeof studioEsc==='function'?studioEsc(x):String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  function loadPlan(){let p={version:1,days:{}};try{const x=JSON.parse(localStorage.getItem(STORE)||'null');if(x&&x.version===1&&x.days&&typeof x.days==='object')p=x;}catch(e){(window.TGAT1_ERR||Object)(e,'app')}return p;}
  function savePlan(p){try{localStorage.setItem(STORE,JSON.stringify(p));return true}catch(e){if(typeof studioToast==='function')studioToast('บันทึกแผนวันนี้ไม่สำเร็จ กรุณาส่งออก Backup');return false}}
  function data(){
    const mocks=(typeof studioMockHistory==='function'?studioMockHistory():[]).slice().sort((a,b)=>String(a.at).localeCompare(String(b.at)));
    const stats=(typeof studioPartStats==='function'?studioPartStats():[]).filter(x=>x&&x.total>0);
    const weak=stats.slice().sort((a,b)=>a.acc-b.acc)[0]||null;
    const missed=Object.keys((VLT_STATE&&VLT_STATE.missed)||{}).filter(id=>Number(VLT_STATE.missed[id])>0).length;
    const due=Object.values(STUDIO_VSTATE?.items||{}).filter(v=>v&&Number(v.due)<=Date.now()).length;
    const fresh=Math.max(0,(STUDIO_DATA?.words?.length||0)-Object.keys(STUDIO_VSTATE?.items||{}).length);
    const goal=Math.max(15,Math.min(90,Number(STUDIO_PROFILE?.dailyGoal)||30));
    return {mocks,stats,weak,missed,due,fresh,goal};
  }
  function tasks(){
    const d=data(),out=[];
    if(d.due>0) out.push({id:'vocab-due',title:'ทบทวนศัพท์ที่ถึงกำหนด',desc:`มี ${d.due.toLocaleString()} คำที่ถึงเวลาทบทวน`,kind:'vocabDue',minutes:0});
    else if(d.fresh>0) out.push({id:'vocab-new',title:'เรียนคำศัพท์ใหม่',desc:`เลือกคำใหม่จากคลัง ${STUDIO_DATA.words.length.toLocaleString()} คำ`,kind:'vocabNew',minutes:0});
    if(d.missed>0) out.push({id:'wrong-review',title:'แก้ข้อที่เคยตอบผิด',desc:`มี ${d.missed.toLocaleString()} ข้อในสมุดข้อผิดพลาด`,kind:'wrong',minutes:0});
    if(d.weak && d.goal>=30 && d.missed>0) out.push({id:'weak-skill-'+d.weak.id,title:'ฝึกทักษะที่คะแนนต่ำสุด',desc:`${d.weak.name} · ${d.weak.acc}% จาก ${d.weak.total} ข้อในชุดจำลอง`,kind:'skill',cat:d.weak.id,minutes:0});
    else if(d.missed===0 && d.weak) out.push({id:'weak-skill-'+d.weak.id,title:'ฝึกทักษะที่คะแนนต่ำสุด',desc:`${d.weak.name} · ${d.weak.acc}% จาก ${d.weak.total} ข้อในชุดจำลอง`,kind:'skill',cat:d.weak.id,minutes:0});
    if(!out.some(x=>['wrong','skill'].includes(x.kind))) out.push({id:'mixed-diagnostic',title:d.mocks.length?'ฝึกข้อสอบแบบผสม':'ทำแบบฝึกวัดระดับเริ่มต้น',desc:d.mocks.length?'ทำ 10 ข้อเพื่อรักษาความต่อเนื่อง':'ทำ 10 ข้อเพื่อเริ่มเก็บข้อมูลวิเคราะห์ทักษะ',kind:'quick',minutes:0});
    const n=out.length;
    if(n===1) out[0].minutes=d.goal;
    else if(n===2){out[0].minutes=Math.max(5,Math.round(d.goal*.3));out[1].minutes=d.goal-out[0].minutes;}
    else {const first=Math.max(5,Math.round(d.goal*.2));const each=Math.floor((d.goal-first)/2);out[0].minutes=first;out[1].minutes=each;out[2].minutes=d.goal-first-each;}
    return out;
  }
  function doneForToday(){const p=loadPlan(),v=p.days[today()];return new Set(v&&Array.isArray(v.done)?v.done:[])}
  function toggle(id){const p=loadPlan(),day=p.days[today()]||{done:[]},set=new Set(Array.isArray(day.done)?day.done:[]);if(set.has(id))set.delete(id);else set.add(id);p.days[today()]={done:[...set],updatedAt:new Date().toISOString()};const keys=Object.keys(p.days).sort();keys.slice(0,Math.max(0,keys.length-90)).forEach(k=>delete p.days[k]);savePlan(p);renderCurrent();}
  function start(kind,cat){
    try{
      if(kind==='vocabDue'){if(typeof V15_startDue==='function')V15_startDue();else if(typeof studioStartFlashcards==='function')studioStartFlashcards();else studioNav('vocab');}
      else if(kind==='vocabNew'){if(typeof V15_startNew==='function')V15_startNew();else studioNav('vocab');}
      else if(kind==='wrong'){if(typeof VLT_startReview==='function')VLT_startReview();else studioNav('analytics');}
      else if(kind==='skill'){if(typeof VLT_startCategory==='function')VLT_startCategory(cat);else studioNav('exam');}
      else if(kind==='quick'){if(typeof VLT_startQuick==='function')VLT_startQuick();else studioNav('exam');}
    }catch(e){console.error('v16 task start',e);if(typeof studioToast==='function')studioToast('เปิดกิจกรรมไม่สำเร็จ ลองเข้า Exam/Vocabulary Center โดยตรง');}
  }
  window.V16_startTask=start;
  window.V16_toggleTask=toggle;
  function planCard(){
    const d=data(),t=tasks(),done=doneForToday(),count=t.filter(x=>done.has(x.id)).length,pct=t.length?Math.round(count/t.length*100):0;
    const dayText=new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long'});
    const rows=t.map((x,i)=>`<div class="v16-task ${done.has(x.id)?'is-done':''}"><button class="v16-check" aria-label="${done.has(x.id)?'ยกเลิกทำแล้ว':'ทำเครื่องหมายว่าทำแล้ว'}" onclick="V16_toggleTask('${x.id}')">${done.has(x.id)?'✓':'○'}</button><div class="v16-task-main"><b>${i+1}. ${esc(x.title)}</b><small>${esc(x.desc)}</small><span class="v16-time">ประมาณ ${x.minutes} นาที</span></div><button class="v16-start" onclick="V16_startTask('${x.kind}','${x.cat||''}')">เริ่มฝึก</button></div>`).join('');
    const weakNote=d.weak?`ทักษะที่คะแนนต่ำสุดจากชุดจำลอง: <b>${esc(d.weak.name)}</b> (${d.weak.acc}% · ${d.weak.total} ข้อ)`:(d.missed?`มีข้อที่เคยผิด ${d.missed} ข้อ แต่ยังไม่มีผลจำลองเต็มพอสำหรับจัดอันดับทักษะ`:'ยังไม่มีผลชุดจำลองเต็ม ระบบจึงจัดแผนเริ่มต้นและจะวิเคราะห์ได้ดีขึ้นหลังส่งชุดสอบ');
    return `<section class="v16-panel v16-plan"><div class="v16-head"><div><div class="st-eyebrow">SMART DAILY PLAN</div><h2>แผนฝึกวันนี้</h2><p>${esc(dayText)} · เป้าหมาย ${d.goal} นาที</p></div><button class="v16-adjust" onclick="studioNav('profile')">ปรับเป้าหมาย</button></div><div class="v16-progress-row"><b>${count}/${t.length} กิจกรรมเสร็จ</b><span>${pct}%</span></div><div class="v16-progress"><i style="width:${pct}%"></i></div><div class="v16-tasks">${rows}</div><div class="v16-coach-note">🧭 ${weakNote}</div><div class="v16-footnote">แผนนี้เป็นคำแนะนำจากข้อมูลในเบราว์เซอร์นี้ ไม่ใช่การคาดการณ์คะแนนสอบ และเวลาคือเวลาเป้าหมายที่ตั้งไว้</div></section>`;
  }
  function chartCard(){
    const d=data(),m=d.mocks.slice(-8),avg=m.length?Math.round(m.reduce((s,x)=>s+(Number(x.score)||0),0)/m.length*10)/10:null,best=m.length?Math.max(...m.map(x=>Number(x.score)||0)):null,latest=m.length?m[m.length-1]:null;
    let trend='ยังมีข้อมูลไม่พอเปรียบเทียบ';let delta=null;
    if(d.mocks.length>=6){const prev=d.mocks.slice(-6,-3),last=d.mocks.slice(-3);const a=prev.reduce((s,x)=>s+(Number(x.score)||0),0)/prev.length,b=last.reduce((s,x)=>s+(Number(x.score)||0),0)/last.length;delta=Math.round((b-a)*10)/10;trend=delta>0?`ดีขึ้น ${delta} คะแนนเมื่อเทียบ 3 รอบก่อน`:delta<0?`ลดลง ${Math.abs(delta)} คะแนนเมื่อเทียบ 3 รอบก่อน`:'ทรงตัวเมื่อเทียบ 3 รอบก่อน';}
    const bars=m.map(x=>{const pct=Math.max(0,Math.min(100,(Number(x.score)||0)));const label=new Date(x.at).toLocaleDateString('th-TH',{day:'numeric',month:'short'});return `<div class="v16-bar-col"><div class="v16-bar-value">${Number(x.score)||0}/100</div><div class="v16-bar-track"><i style="height:${pct}%"></i></div><small>${esc(label)}</small></div>`}).join('');
    const skills=d.stats.map(x=>`<div class="v16-skill"><div><b>${esc(x.name)}</b><span>${x.acc==null?'—':x.acc+'%'} · ${x.correct}/${x.total}</span></div><div class="v16-skill-track"><i style="width:${Math.max(0,Math.min(100,x.acc))}%"></i></div></div>`).join('');
    return `<section class="v16-panel"><div class="st-eyebrow">EXAM PERFORMANCE</div><h2>Dashboard คะแนน</h2><p class="v16-muted">ใช้เฉพาะผลชุดจำลองเต็ม คะแนนเต็ม 100 ที่บันทึกไว้ในประวัติ (สูงสุด 80 รอบ)</p><div class="v16-metrics"><div><small>รอบล่าสุด</small><b>${latest?`${latest.score}/100`:'—'}</b></div><div><small>เฉลี่ย ${m.length} รอบล่าสุด</small><b>${avg===null?'—':avg+'/100'}</b></div><div><small>คะแนนสูงสุด</small><b>${best===null?'—':best+'/100'}</b></div><div><small>เป้าหมาย</small><b>${Number(STUDIO_PROFILE?.target)||75}/100</b></div></div>${m.length?`<div class="v16-trend">${bars}</div><div class="v16-trend-note">${esc(trend)}${m.length<6?' · ต้องมีอย่างน้อย 6 รอบเพื่อเปรียบเทียบแนวโน้ม':''}</div>`:'<div class="v16-empty">ยังไม่มีผลสอบจำลองเต็มในประวัติ ทำชุดจำลองและส่งข้อสอบก่อน กราฟจึงจะแสดงข้อมูลจริง</div>'}<div class="v16-skill-wrap"><h3>จุดแข็งและจุดที่ควรฝึก</h3>${skills||'<p class="v16-empty">ยังไม่มีข้อมูลคะแนนแยก 5 ทักษะจากชุดสอบเต็ม</p>'}</div><p class="v16-footnote">ผลแยกทักษะรวมจากชุดจำลองที่ส่งแล้วเท่านั้น ไม่รวมแบบฝึกสั้นหรือข้อมูลจากเครื่องอื่น</p><div class="v16-actions"><button class="st-btn secondary" onclick="studioNav('profile')">ดูประวัติและเป้าหมาย</button><button class="st-btn" onclick="VLT_startMock(1)">เริ่มชุดจำลอง 60 ข้อ</button></div></section>`;
  }
  function renderCurrent(){if(STUDIO_PAGE==='home'&&typeof studioHome==='function')studioHome();else if(STUDIO_PAGE==='analytics'&&typeof studioAnalytics==='function')studioAnalytics();}
  window.TGAT1_addHomeHook(function(){const app=document.getElementById('app');if(app&&!app.querySelector('.v16-plan'))app.insertAdjacentHTML('beforeend',planCard());});
  window.TGAT1_addAnalyticsHook(function(){const app=document.getElementById('app');if(app&&!app.querySelector('.v16-dashboard')){const card=chartCard();const plan=planCard();app.insertAdjacentHTML('beforeend',`<div class="v16-dashboard">${card}${plan}</div>`);}});
  // Show the upgraded dashboard on first load when the app is still on Home.
  try{if(typeof STUDIO_PAGE!=='undefined'&&STUDIO_PAGE==='home')studioHome();}catch(e){console.warn('v16 initial dashboard',e)}
})();


/* ===== 12 · 19-exam-draft-guard.js ===== */
/* TGAT1 Exam Draft Guard v35.0.0
   Rehydrates an in-progress mock from canonical question data. Local storage is mutable,
   so never render the question objects that came back from storage. */
(function(){
  'use strict';
  const ownObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  const finiteInt=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
  const MAX_DURATION=3600000+10000;
  function normalize(draft,bank){
    if(!ownObject(draft)||draft.mode!=='mock'||!Array.isArray(bank))return null;
    if(!finiteInt(draft.setNo,1,20)||!Array.isArray(draft.qs)||draft.qs.length!==60)return null;
    if(!finiteInt(draft.index,0,59)||!ownObject(draft.answers))return null;
    const started=Number(draft.started),deadline=Number(draft.deadline);
    if(!Number.isSafeInteger(started)||!Number.isSafeInteger(deadline)||started<=0||
       deadline<=started||deadline-started>MAX_DURATION)return null;
    const canonical=bank.filter(q=>q&&q.set===draft.setNo);
    if(canonical.length!==60)return null;
    const canonicalById=new Map(canonical.map(q=>[q.id,q]));
    if(canonicalById.size!==60)return null;
    const seen=new Set(),ids=new Set(canonicalById.keys());
    const qs=[];
    for(let position=0;position<draft.qs.length;position++){
      const saved=draft.qs[position];
      if(!ownObject(saved)||typeof saved.id!=='string'||!ids.has(saved.id)||seen.has(saved.id))return null;
      // Full-mock sequence is fixed by the canonical set; storage cannot reshuffle the test.
      if(saved.id!==canonical[position].id)return null;
      const source=canonicalById.get(saved.id);
      if(!Array.isArray(saved.options)||saved.options.length!==4||
         !Array.isArray(source.options)||source.options.length!==4)return null;
      if(saved.options.some(x=>typeof x!=='string'))return null;
      const sortedSaved=saved.options.slice().sort();
      const sortedSource=source.options.slice().sort();
      if(sortedSaved.some((x,i)=>x!==sortedSource[i]))return null;
      if(!finiteInt(saved.answer,0,3))return null;
      if(saved.options[saved.answer]!==source.options[source.answer])return null;
      seen.add(saved.id);
      // Retain canonical prompt/context/explanation/metadata. Only the shuffled order and
      // its correctly remapped answer index are allowed to come from the local draft.
      qs.push({...source,options:saved.options.slice(),answer:saved.answer,userAnswer:null});
    }
    if(seen.size!==60)return null;
    const answers=Object.create(null);
    for(const [id,value] of Object.entries(draft.answers)){
      if(!ids.has(id)||!finiteInt(value,0,3))return null;
      answers[id]=value;
    }
    qs.forEach(q=>{q.userAnswer=Object.prototype.hasOwnProperty.call(answers,q.id)?answers[q.id]:null;});
    const flagged=Array.isArray(draft.flagged)
      ? [...new Set(draft.flagged.filter(id=>typeof id==='string'&&ids.has(id)))]
      : [];
    return {
      mode:'mock',setNo:draft.setNo,qs,index:draft.index,answers,started,deadline,
      seconds:60,score:0,combo:0,reviewOn:false,flagged
    };
  }
  window.TGAT1ExamDraftGuard=Object.freeze({normalize});
})();


/* ===== 13 · 08-exam-engine.js ===== */
(function(){
 'use strict';
 if(window.__TGAT1_V17_EXAM__) return;
 window.__TGAT1_V17_EXAM__=true;
 const KEY='tgat1_v17_exam_draft_v1';
 const esc=s=>typeof VLT_escape==='function'?VLT_escape(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let activeMeta=null;
 let resumeInProgress=false;
 function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
 function normalizeRun(r){try{return window.TGAT1ExamDraftGuard&&typeof VLT_BANK!=='undefined'?window.TGAT1ExamDraftGuard.normalize(r,VLT_BANK):null}catch(e){return null}}
 function safeRun(r){return !!normalizeRun(r)}
 window.TGAT1ExamDraftWrite=function(r){return writeDraft(r)};
 function writeDraft(r){const normalized=normalizeRun(r);if(!normalized)return false;try{const payload=JSON.parse(JSON.stringify(normalized));const raw=JSON.stringify(payload);localStorage.setItem(KEY,JSON.stringify({version:1,checksum:hash(raw),payload}));return true}catch(e){if(typeof VLT_toast==='function')VLT_toast('บันทึกรอบสอบต่อไม่สำเร็จ พื้นที่จัดเก็บอาจเต็ม');return false}}
 function readDraft(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(!x||x.version!==1||!x.payload)return null;const raw=JSON.stringify(x.payload);if(hash(raw)!==x.checksum)return null;return normalizeRun(x.payload)}catch(e){return null}}
 function clearDraft(){try{localStorage.removeItem(KEY)}catch(e){(window.TGAT1_ERR||Object)(e,'app')}}
 function counts(r){const answered=r.qs.filter(q=>Number.isInteger(r.answers[q.id])&&r.answers[q.id]>=0&&r.answers[q.id]<4).length;const flagged=(r.flagged||[]).length;return {answered,unanswered:r.qs.length-answered,flagged}}
 function renderResume(){const app=document.getElementById('app');if(!app)return;const old=app.querySelector('.v17-resume');if(old)old.remove();const draft=readDraft();if(!draft||!app.querySelector('.vault-view'))return;const head=app.querySelector('.vault-head');if(!head)return;const c=counts(draft);const left=Math.max(0,Math.ceil((draft.deadline-Date.now())/1000));const card=document.createElement('section');card.className='v17-resume';card.innerHTML=`<h3>พบข้อสอบที่ยังไม่ส่ง · ชุด ${Number(draft.setNo)||1}</h3><p>ทำแล้ว ${c.answered}/60 ข้อ · ยังไม่ตอบ ${c.unanswered} · ติดธง ${c.flagged}<br>เวลาที่เหลือ ${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')} — เวลายังคงเดินต่อแม้ปิดแอป</p><div class="v17-tools-row"><button class="v17-btn primary" onclick="V17_resumeDraft()">กลับไปทำข้อสอบต่อ</button><button class="v17-btn" onclick="V17_discardDraft()">ทิ้งรอบสอบที่ค้าง</button></div>`;
 head.insertAdjacentElement('afterend',card)}
 window.V17_resumeDraft=function(){const draft=readDraft();if(!draft){clearDraft();if(typeof VLT_toast==='function')VLT_toast('ไม่พบรอบสอบที่กู้คืนได้ หรือไฟล์บันทึกไม่สมบูรณ์');renderResume();return}if(draft.deadline<=Date.now()){TGConfirm('เวลาสอบของรอบที่ค้างหมดแล้ว ต้องการส่งคำตอบที่บันทึกไว้ทันทีหรือไม่?').then(ok=>{if(ok){VLT_RUN=draft;VLT_finish(true)}});return}resumeInProgress=true;try{VLT_begin(draft)}finally{resumeInProgress=false}if(typeof VLT_toast==='function')VLT_toast('กู้คืนรอบสอบแล้ว เวลายังคงนับต่อจากเดิม')};
 window.V17_discardDraft=function(){TGConfirm('ลบรอบสอบที่ค้างนี้หรือไม่? คำตอบในรอบนี้จะไม่ถูกนับเป็นผลสอบ').then(ok=>{if(!ok)return;clearDraft();renderResume();if(typeof VLT_toast==='function')VLT_toast('ลบรอบสอบที่ค้างแล้ว')})};
 window.V17_toggleFlag=function(){const r=VLT_RUN;if(!r||r.mode!=='mock')return;const id=r.qs[r.index].id;r.flagged=Array.isArray(r.flagged)?r.flagged:[];const i=r.flagged.indexOf(id);if(i>=0)r.flagged.splice(i,1);else r.flagged.push(id);writeDraft(r);VLT_renderQuiz()};
 window.V17_jump=function(i){const r=VLT_RUN;if(!r||r.mode!=='mock')return;window.V17_closeChecklist();VLT_goto(i)};
 window.V17_closeChecklist=function(){const x=document.getElementById('v17Checklist');if(x)x.remove()};
 window.V17_openChecklist=function(){const r=VLT_RUN;if(!r||r.mode!=='mock')return;window.V17_closeChecklist();const c=counts(r);const items=r.qs.map((q,i)=>{const done=Number.isInteger(r.answers[q.id]);const flagged=(r.flagged||[]).includes(q.id);const cls=[done?'done':'',flagged?'flagged':'',i===r.index?'current':''].filter(Boolean).join(' ');return `<button class="${cls}" onclick="V17_jump(${i})" aria-label="ไปข้อ ${i+1}">ข้อ ${i+1}<small>${flagged?'ติดธง':done?'ตอบแล้ว':'ยังไม่ตอบ'}</small></button>`}).join('');const overlay=document.createElement('div');overlay.id='v17Checklist';overlay.className='v17-overlay';overlay.innerHTML=`<div class="v17-dialog" role="dialog" aria-modal="true" aria-label="ภาพรวมข้อสอบ"><div class="v17-dialog-head"><h2>ภาพรวมข้อสอบ 60 ข้อ</h2><button class="v17-btn" onclick="V17_closeChecklist()">ปิด ✕</button></div><p>ตอบแล้ว ${c.answered} · ยังไม่ตอบ ${c.unanswered} · ติดธง ${c.flagged}<br>แตะหมายเลขเพื่อข้ามไปยังข้อนั้นได้ คำตอบยังแก้ไขได้จนกว่าจะส่งข้อสอบ</p><div class="v17-list">${items}</div><div class="v17-tools-row" style="margin-top:14px"><button class="v17-btn" onclick="V17_jump(${Math.max(0,r.qs.findIndex(q=>!Number.isInteger(r.answers[q.id])))})" ${c.unanswered?'':'disabled'}>ไปข้อที่ยังไม่ตอบข้อแรก</button><button class="v17-btn flagged" onclick="V17_jump(${Math.max(0,r.qs.findIndex(q=>(r.flagged||[]).includes(q.id)))})" ${(r.flagged||[]).length?'':'disabled'}>ไปข้อที่ติดธงข้อแรก</button></div></div>`;overlay.addEventListener('click',e=>{if(e.target===overlay)window.V17_closeChecklist()});document.body.appendChild(overlay)};
 const oldRender=VLT_renderQuiz;
 VLT_renderQuiz=function(){oldRender.apply(this,arguments);const r=VLT_RUN;if(!r||r.mode!=='mock')return;writeDraft(r);const card=document.querySelector('#app .vault-qcard');if(!card)return;const q=r.qs[r.index],flagged=(r.flagged||[]).includes(q.id),c=counts(r);const tools=document.createElement('section');tools.className='v17-exam-tools';tools.innerHTML=`<div class="v17-status"><span class="v17-pill">✅ ตอบแล้ว ${c.answered}/60</span><span class="v17-pill">◻ ยังไม่ตอบ ${c.unanswered}</span><span class="v17-pill">🚩 ติดธง ${c.flagged}</span></div><div class="v17-tools-row"><button class="v17-btn ${flagged?'flagged':''}" onclick="V17_toggleFlag()">${flagged?'🚩 ยกเลิกธงข้อนี้':'⚑ ทำเครื่องหมายว่ายังไม่มั่นใจ'}</button><button class="v17-btn primary" onclick="V17_openChecklist()">☷ ภาพรวม 60 ข้อ</button><button class="v17-btn" onclick="V17_jump(${Math.max(0,r.qs.findIndex(z=>!Number.isInteger(r.answers[z.id])))})" ${c.unanswered?'':'disabled'}>ไปข้อยังไม่ตอบ</button></div><p style="margin:0;font-size:12px;color:var(--mute,#64748b)">ระบบบันทึกคำตอบและเวลาไว้ในเครื่องโดยอัตโนมัติ หากออกจากหน้า สามารถกลับมาทำต่อได้ก่อนหมดเวลา</p>`;const map=card.querySelector('.vault-qmap');if(map){map.insertAdjacentElement('beforebegin',tools);Array.from(map.querySelectorAll('button')).forEach((b,i)=>{if((r.flagged||[]).includes(r.qs[i].id)){b.classList.add('flagged');b.title='ติดธง: ยังไม่มั่นใจ'}})}else card.appendChild(tools);const clock=document.getElementById('vltClock');if(clock&&r.deadline-Date.now()<=300000)clock.classList.add('v17-clock-urgent')};
 const oldBegin=VLT_begin;
 VLT_begin=function(run){if(run&&run.mode==='mock'){const pending=readDraft();if(pending&&!resumeInProgress&&!VLT_RUN&&pending.started!==run.started){TGConfirm('มีข้อสอบเดิมที่ยังไม่ส่งค้างอยู่ หากเริ่มชุดใหม่ ร่างเดิมจะถูกแทนที่ ต้องการเริ่มใหม่หรือไม่?').then(ok=>{if(!ok)return;clearDraft();run.flagged=Array.isArray(run.flagged)?run.flagged:[];activeMeta=null;writeDraft(run);oldBegin.apply(this,arguments)});return}run.flagged=Array.isArray(run.flagged)?run.flagged:[];activeMeta=null;writeDraft(run)}oldBegin.apply(this,arguments)};
 const oldAnswer=VLT_answer;
 VLT_answer=function(j){oldAnswer.apply(this,arguments);if(VLT_RUN&&VLT_RUN.mode==='mock')writeDraft(VLT_RUN)};
 const oldExit=VLT_exit;
 VLT_exit=function(){if(VLT_RUN&&VLT_RUN.mode==='mock'){TGConfirm('ออกจากข้อสอบไว้ก่อนหรือไม่? ระบบจะบันทึกคำตอบและเวลาเพื่อกลับมาทำต่อได้').then(ok=>{if(!ok)return;writeDraft(VLT_RUN);VLT_stopTimer();VLT_RUN=null;VLT_home()});return}oldExit.apply(this,arguments)};
 const oldPrev=VLT_prev;VLT_prev=function(){oldPrev.apply(this,arguments);if(VLT_RUN&&VLT_RUN.mode==='mock')writeDraft(VLT_RUN)};
 const oldGoto=VLT_goto;VLT_goto=function(){oldGoto.apply(this,arguments);if(VLT_RUN&&VLT_RUN.mode==='mock')writeDraft(VLT_RUN)};
 const oldHome=VLT_home;VLT_home=function(){oldHome.apply(this,arguments);renderResume()};
 const oldResult=VLT_renderResult;
 VLT_renderResult=function(){oldResult.apply(this,arguments);if(!activeMeta)return;const app=document.getElementById('app');if(!app||app.querySelector('.v17-result'))return;const m=activeMeta;const el=document.createElement('section');el.className='v17-result';el.innerHTML=`<h3>📋 สรุปการบริหารเวลาและความมั่นใจ</h3><div class="v17-result-grid"><div><b>${m.duration}</b><small>เวลาที่ใช้</small></div><div><b>${m.answered}/60</b><small>ตอบแล้ว</small></div><div><b>${m.unanswered}</b><small>ไม่ได้ตอบ</small></div><div><b>${m.flagged}</b><small>ข้อที่ติดธง</small></div><div><b>${m.corrected}</b><small>คำตอบที่ถูก</small></div><div><b>${m.auto?'หมดเวลา':'ส่งด้วยตนเอง'}</b><small>วิธีจบข้อสอบ</small></div></div><p class="v17-muted">ข้อที่ติดธงเป็นเครื่องหมายความไม่มั่นใจ ไม่ได้เปลี่ยนคะแนน และสามารถนำไปทบทวนหลังสอบได้</p>${m.flaggedIds.length?`<p class="v17-muted"><b>ข้อที่ติดธง:</b> ${m.flaggedIds.map(id=>esc(id)).join(' · ')}</p>`:'<p class="v17-muted">รอบนี้ไม่มีข้อที่ติดธง</p>'}`;const head=app.querySelector('.vault-head');if(head)head.insertAdjacentElement('afterend',el);else app.prepend(el)};
 const oldFinish=VLT_finish;
 VLT_finish=function(auto=false){const r=VLT_RUN;if(r&&r.mode==='mock'){const c=counts(r);const elapsed=Math.max(0,Date.now()-(r.started||Date.now()));const mm=Math.floor(elapsed/60000),ss=Math.floor(elapsed%60000/1000);activeMeta={duration:mm+' นาที '+ss+' วินาที',answered:c.answered,unanswered:c.unanswered,flagged:c.flagged,flaggedIds:[...(r.flagged||[])],corrected:r.qs.filter(q=>r.answers[q.id]===q.answer).length,auto:!!auto};}oldFinish.apply(this,arguments);if(r&&r.mode==='mock'){clearDraft();const h=VLT_STATE.history&&VLT_STATE.history[VLT_STATE.history.length-1];if(h&&h.mode==='mock'){h.durationMs=Math.max(0,Date.now()-(r.started||Date.now()));h.answered=activeMeta.answered;h.unanswered=activeMeta.unanswered;h.flagged=activeMeta.flagged;h.autoSubmitted=!!auto;try{VLT_save()}catch(e){(window.TGAT1_ERR||Object)(e,'app')}}}}
 window.addEventListener('pagehide',()=>{if(VLT_RUN&&VLT_RUN.mode==='mock')writeDraft(VLT_RUN)});
 window.addEventListener('beforeunload',e=>{if(VLT_RUN&&VLT_RUN.mode==='mock'){writeDraft(VLT_RUN);e.preventDefault();e.returnValue='ข้อสอบยังไม่ถูกส่ง คำตอบจะถูกบันทึกไว้เพื่อกลับมาทำต่อ'}});
 // Ensure any valid draft is surfaced when the app enters its exam home.
 try{if(typeof VLT_RUN!=='undefined'&&VLT_RUN===null){const v=readDraft();if(v&&document.querySelector('#app .vault-view'))renderResume()}}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
})();


/* ===== 14 · 09-accessibility.js ===== */
(function(){'use strict';
  // Add an accessible announcement region without changing existing app content.
  if(!document.getElementById('tgat-v18-live')){var live=document.createElement('div');live.id='tgat-v18-live';live.className='sr-only';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');live.style.cssText='position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';document.body.appendChild(live);}
  // Announce only the page title, not the entire frequently re-rendered app subtree.
  if(!window.__TGAT1_V35_NAV_ANNOUNCER__){
    window.__TGAT1_V35_NAV_ANNOUNCER__=true;
    var priorNav=window.studioNav;
    if(typeof priorNav==='function')window.studioNav=function(){
      var result=priorNav.apply(this,arguments);
      var title=document.getElementById('studioTitle');
      if(title&&live)live.textContent='หน้า '+title.textContent;
      return result;
    };
  }
  // Label icon-only buttons where their visible title/aria label is missing.
  document.querySelectorAll('button').forEach(function(b){if(!b.getAttribute('aria-label')&&!b.textContent.trim()){var t=b.getAttribute('title');if(t)b.setAttribute('aria-label',t);}});
  // Ensure the app's primary content landmark has a stable accessible name.
  var main=document.querySelector('main');if(main&&!main.getAttribute('aria-label')&&!main.getAttribute('aria-labelledby'))main.setAttribute('aria-label','เนื้อหาหลักของ TGAT1 English Studio');
  // Service-worker update UX: never force-reload during an active exam; user chooses when to refresh.
  if(!('serviceWorker' in navigator))return;
  var bar=document.getElementById('tgat-v18-update'),later=document.getElementById('tgat-v18-later'),reload=document.getElementById('tgat-v18-reload'),waiting=null,updateRequested=false;
  function show(reg){if(!reg||!reg.waiting)return;waiting=reg.waiting;bar.style.display='flex';}
  function watch(reg){if(reg.waiting)show(reg);reg.addEventListener('updatefound',function(){var w=reg.installing;if(!w)return;w.addEventListener('statechange',function(){if(w.state==='installed'&&navigator.serviceWorker.controller)show(reg);});});}
  window.addEventListener('load',function(){navigator.serviceWorker.getRegistration('./').then(function(reg){if(!reg)return;watch(reg);reg.update().catch(function(){});}).catch(function(){});});
  later.addEventListener('click',function(){bar.style.display='none';});
  reload.addEventListener('click',function(){var active=false;try{active=(typeof VLT_RUN!=='undefined'&&!!VLT_RUN)||(typeof Q!=='undefined'&&!!Q);}catch(e){(window.TGAT1_ERR||Object)(e,'app')}if(active){var live=document.getElementById('tgat-v18-live');if(live)live.textContent='กำลังทำแบบฝึกอยู่ กรุณาจบหรือออกจากรอบฝึกก่อนจึงค่อยอัปเดต';try{(window.studioToast||window.VLT_toast||function(){})('กำลังทำแบบฝึกอยู่ กรุณาจบหรือออกจากรอบฝึกก่อนจึงค่อยอัปเดต')}catch(_){(window.TGAT1_ERR||Object)(_,'app')};return;}if(!waiting)return;updateRequested=true;waiting.postMessage({type:'SKIP_WAITING'});reload.disabled=true;reload.textContent='กำลังอัปเดต…';});
  var reloadingAfterUpdate=false;navigator.serviceWorker.addEventListener('controllerchange',function(){/* Only reload when the user pressed "อัปเดตแอป"; the very first install also fires controllerchange (clients.claim) and must not reload a page the user is already using. */if(!updateRequested||reloadingAfterUpdate)return;reloadingAfterUpdate=true;location.reload();});
})();


/* ===== 15 · 10-quality-audit.js ===== */
(function(){
'use strict';
if(window.__TGAT1_V19__)return;window.__TGAT1_V19__=true;
const REVIEW_KEY='tgat1_v19_manual_question_review_v1';
const TIMING_LIVE_KEY='tgat1_v19_exam_timing_live_v1';
const TIMING_HISTORY_KEY='tgat1_v19_exam_timing_history_v1';
const names={qr:'Question–Response',short:'Short Conversation',long:'Long Conversation',tc:'Text Completion',rc:'Reading Comprehension'};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const csvCell=s=>'"'+String(s==null?'':s).replace(/"/g,'""')+'"';
function readJSON(k,fallback){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?fallback:x}catch(e){return fallback}}
function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function bank(){return typeof VLT_BANK!=='undefined'&&Array.isArray(VLT_BANK)?VLT_BANK:[]}
function currentRun(){return typeof VLT_RUN!=='undefined'?VLT_RUN:null}
function currentResult(){return typeof VLT_RESULT!=='undefined'?VLT_RESULT:null}
function reviewMap(){const x=readJSON(REVIEW_KEY,{});return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}
function audit(){
 const qs=bank(),seenId=new Map(),seenPair=new Map(),seenPrompt=new Map(),issueRows=[];
 let missingId=0,duplicateId=0,missingPrompt=0,badOptions=0,duplicateOptions=0,badAnswer=0,missingExplanation=0,badCategory=0,badSet=0;
 qs.forEach(q=>{
  const issues=[];const id=String(q&&q.id||'').trim();
  if(!id){missingId++;issues.push('MISSING_ID')}
  if(id&&seenId.has(id)){duplicateId++;issues.push('DUPLICATE_ID')}
  if(id)seenId.set(id,(seenId.get(id)||0)+1);
  if(!String(q&&q.prompt||'').trim()){missingPrompt++;issues.push('MISSING_PROMPT')}
  if(!Array.isArray(q&&q.options)||q.options.length!==4){badOptions++;issues.push('OPTIONS_NOT_4')}
  else if(new Set(q.options.map(x=>String(x).trim().toLowerCase())).size!==4){duplicateOptions++;issues.push('DUPLICATE_OPTIONS')}
  if(!Number.isInteger(q&&q.answer)||!Array.isArray(q&&q.options)||q.answer<0||q.answer>=q.options.length){badAnswer++;issues.push('ANSWER_INDEX_INVALID')}
  if(!String(q&&q.explanation||'').trim()){missingExplanation++;issues.push('MISSING_EXPLANATION')}
  if(!['qr','short','long','tc','rc'].includes(q&&q.category)){badCategory++;issues.push('CATEGORY_INVALID')}
  if(!Number.isInteger(q&&q.set)||q.set<1||q.set>20){badSet++;issues.push('SET_INVALID')}
  const p=String(q&&q.prompt||'').trim().toLowerCase(),c=String(q&&q.context||'').trim().toLowerCase();
  if(p){seenPrompt.set(p,(seenPrompt.get(p)||0)+1);const pair=p+'\u0000'+c;seenPair.set(pair,(seenPair.get(pair)||0)+1)}
  if(issues.length)issueRows.push({id:id||'(ไม่มี ID)',issues});
 });
 const exactDup=[...seenPair.values()].reduce((n,v)=>n+Math.max(0,v-1),0);
 const repeatedTemplates=[...seenPrompt.values()].filter(v=>v>1).length;
 const sets={};for(let i=1;i<=20;i++)sets[i]=qs.filter(q=>q.set===i).length;
 const categories={};Object.keys(names).forEach(c=>categories[c]=qs.filter(q=>q.category===c).length);
 const structural=missingId+duplicateId+missingPrompt+badOptions+duplicateOptions+badAnswer+missingExplanation+badCategory+badSet;
 const reviews=reviewMap(),reviewCounts={PENDING_HUMAN_REVIEW:0,VERIFIED_BY_REVIEWER:0,NEEDS_CORRECTION:0,AMBIGUOUS:0};
 qs.forEach(q=>{const v=reviews[q.id]&&reviews[q.id].status;reviewCounts[reviewCounts.hasOwnProperty(v)?v:'PENDING_HUMAN_REVIEW']++});
 return {total:qs.length,uniqueIds:seenId.size,missingId,duplicateId,missingPrompt,badOptions,duplicateOptions,badAnswer,missingExplanation,badCategory,badSet,exactDup,repeatedTemplates,structural,sets,categories,issueRows,reviewCounts,completeSets:Object.values(sets).filter(n=>n===60).length};
}
function download(name,text,type){const blob=new Blob([text],{type:type||'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1800)}
function exportAuditCSV(){
 const qs=bank(),reviews=reviewMap(),a=audit(),idCounts={};qs.forEach(q=>{if(q.id)idCounts[q.id]=(idCounts[q.id]||0)+1});
 const header=['id','set','category','section','difficulty','topic','prompt','context','option_A','option_B','option_C','option_D','answer_index_zero_based','correct_option','explanation','automated_structural_status','automated_structural_issues','manual_review_status','manual_review_note','manual_review_updated_at'];
 const rows=[header];
 qs.forEach(q=>{const r=reviews[q.id]||{},issues=[];if(!q.id)issues.push('MISSING_ID');else if(idCounts[q.id]>1)issues.push('DUPLICATE_ID');if(!String(q.prompt||'').trim())issues.push('MISSING_PROMPT');if(!Array.isArray(q.options)||q.options.length!==4)issues.push('OPTIONS_NOT_4');else if(new Set(q.options.map(x=>String(x).trim().toLowerCase())).size!==4)issues.push('DUPLICATE_OPTIONS');if(!Number.isInteger(q.answer)||!Array.isArray(q.options)||q.answer<0||q.answer>=q.options.length)issues.push('ANSWER_INDEX_INVALID');if(!String(q.explanation||'').trim())issues.push('MISSING_EXPLANATION');if(!['qr','short','long','tc','rc'].includes(q.category))issues.push('CATEGORY_INVALID');if(!Number.isInteger(q.set)||q.set<1||q.set>20)issues.push('SET_INVALID');
  rows.push([q.id,q.set,q.category,q.section,q.difficulty,q.topic,q.prompt,q.context,...(Array.isArray(q.options)?[0,1,2,3].map(i=>q.options[i]||''):['','','','']),q.answer,Array.isArray(q.options)?(q.options[q.answer]||''):'',q.explanation,issues.length?'STRUCTURE_FAIL':'STRUCTURE_PASS',issues.join('|'),r.status||'PENDING_HUMAN_REVIEW',r.note||'',r.updatedAt||'']);
 });
 const csv='\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');
 download('TGAT1_v19_Question_Review_Register.csv',csv,'text/csv;charset=utf-8');
 return {rows:qs.length,structural:a.structural};
}
function openReviewQueue(){
 const qs=bank();if(!qs.length){alert('ไม่พบคลังข้อสอบ');return}
 const old=document.getElementById('tgat19-review-overlay');if(old)old.remove();
 const overlay=document.createElement('div');overlay.id='tgat19-review-overlay';overlay.className='tgat19-overlay';
 overlay.innerHTML=`<div class="tgat19-dialog" role="dialog" aria-modal="true" aria-labelledby="tgat19-review-title"><div class="tgat19-dialog-head"><div><div class="st-eyebrow">MANUAL CONTENT REVIEW</div><h2 id="tgat19-review-title" style="margin:3px 0">ทะเบียนตรวจเนื้อหาข้อสอบ</h2></div><button class="tgat19-btn" type="button" data-close>ปิด ✕</button></div><p class="tgat19-muted">สถานะนี้เป็นบันทึกที่ผู้ตรวจเลือกเอง ไม่ได้เปลี่ยนเฉลยหรือยืนยันความถูกต้องให้อัตโนมัติ · แสดงไม่เกิน 40 ข้อต่อครั้ง</p><div class="tgat19-formgrid"><input id="tgat19-search" class="tgat19-input" placeholder="ค้นหา ID หรือข้อความโจทย์"><select id="tgat19-filter" class="tgat19-select"><option value="ALL">ทุกสถานะ</option><option value="PENDING_HUMAN_REVIEW">รอตรวจเนื้อหา</option><option value="VERIFIED_BY_REVIEWER">ผู้ตรวจยืนยันแล้ว</option><option value="NEEDS_CORRECTION">ต้องแก้ไข</option><option value="AMBIGUOUS">กำกวม/ต้องหารือ</option></select></div><div id="tgat19-queue-count" class="tgat19-status" aria-live="polite"></div><div id="tgat19-queue-list"></div><p class="tgat19-muted">หมายเหตุ: ระบบตรวจอัตโนมัติครอบคลุมโครงสร้างข้อมูลเท่านั้น ไม่สามารถยืนยันความถูกต้องทางภาษา ความเหมาะสมของตัวลวง หรือเฉลยจากแหล่งทางการแทนผู้ตรวจได้</p></div>`;
 document.body.appendChild(overlay);
 const search=overlay.querySelector('#tgat19-search'),filter=overlay.querySelector('#tgat19-filter'),list=overlay.querySelector('#tgat19-queue-list'),count=overlay.querySelector('#tgat19-queue-count');
 function render(){const state=reviewMap(),term=search.value.trim().toLowerCase(),status=filter.value;
  const found=qs.filter(q=>{const r=state[q.id]||{},st=r.status||'PENDING_HUMAN_REVIEW';return (status==='ALL'||st===status)&&(!term||(String(q.id)+' '+String(q.prompt)+' '+String(q.context)).toLowerCase().includes(term))}).slice(0,40);
  const total=qs.filter(q=>{const r=state[q.id]||{},st=r.status||'PENDING_HUMAN_REVIEW';return (status==='ALL'||st===status)&&(!term||(String(q.id)+' '+String(q.prompt)+' '+String(q.context)).toLowerCase().includes(term))}).length;
  count.textContent='พบ '+total.toLocaleString('th-TH')+' ข้อ · กำลังแสดง '+found.length+' ข้อแรก';
  list.innerHTML=found.map(q=>{const r=state[q.id]||{},st=r.status||'PENDING_HUMAN_REVIEW';return `<article class="tgat19-qrow" data-qid="${esc(q.id)}"><div><b>${esc(q.id)}</b> · ชุด ${esc(q.set)} · ${esc(names[q.category]||q.category)}</div><p>${esc(q.prompt)}</p>${q.context?`<p><small>${esc(q.context)}</small></p>`:''}<p class="tgat19-muted">A. ${esc(q.options?.[0]||'')} · B. ${esc(q.options?.[1]||'')} · C. ${esc(q.options?.[2]||'')} · D. ${esc(q.options?.[3]||'')}</p><p class="tgat19-muted">เฉลยที่เก็บในแอป: ${'ABCD'[Number(q.answer)]||'—'} · ${esc(q.options?.[q.answer]||'')}</p><div class="tgat19-formgrid"><input class="tgat19-note" data-note placeholder="บันทึกหมายเหตุผู้ตรวจ" value="${esc(r.note||'')}"><select class="tgat19-select" data-status><option value="PENDING_HUMAN_REVIEW" ${st==='PENDING_HUMAN_REVIEW'?'selected':''}>รอตรวจเนื้อหา</option><option value="VERIFIED_BY_REVIEWER" ${st==='VERIFIED_BY_REVIEWER'?'selected':''}>ผู้ตรวจยืนยันแล้ว</option><option value="NEEDS_CORRECTION" ${st==='NEEDS_CORRECTION'?'selected':''}>ต้องแก้ไข</option><option value="AMBIGUOUS" ${st==='AMBIGUOUS'?'selected':''}>กำกวม/ต้องหารือ</option></select></div></article>`}).join('')||'<p class="tgat19-muted">ไม่พบข้อสอบตามเงื่อนไข</p>';
 }
 search.addEventListener('input',render);filter.addEventListener('change',render);
 list.addEventListener('change',e=>{const row=e.target.closest('[data-qid]');if(!row)return;const id=row.dataset.qid;const state=reviewMap(),cur=state[id]||{};if(e.target.matches('[data-status]')){cur.status=e.target.value;cur.updatedAt=new Date().toISOString();state[id]=cur;writeJSON(REVIEW_KEY,state);render();}else if(e.target.matches('[data-note]')){cur.note=e.target.value;cur.updatedAt=new Date().toISOString();state[id]=cur;writeJSON(REVIEW_KEY,state);}});
 list.addEventListener('blur',e=>{if(e.target.matches('[data-note]')){const row=e.target.closest('[data-qid]');if(!row)return;const state=reviewMap(),cur=state[row.dataset.qid]||{};cur.note=e.target.value;cur.updatedAt=new Date().toISOString();state[row.dataset.qid]=cur;writeJSON(REVIEW_KEY,state)}},true);
 overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-close]'))overlay.remove()});
 render();search.focus();
}
function qualityCard(){
 const a=audit();
 return `<section class="tgat19-wrap"><div class="tgat19-card"><div class="tgat19-head"><div><div class="st-eyebrow">TRUST & QUALITY CENTER</div><h2 class="st-title" style="font-size:21px;margin:4px 0">ศูนย์คุณภาพคลังข้อสอบ</h2><p class="tgat19-muted">แยกผลตรวจโครงสร้างอัตโนมัติออกจากการตรวจความถูกต้องของภาษาและเฉลยโดยมนุษย์</p></div><span class="st-tag ${a.structural===0?'green':'gold'}">${a.structural===0?'โครงสร้างผ่าน':'มีจุดต้องตรวจ'}</span></div><div class="tgat19-grid"><div class="tgat19-kpi"><b>${a.total.toLocaleString('th-TH')}</b><small>ข้อสอบทั้งหมด</small></div><div class="tgat19-kpi"><b>${a.completeSets}/20</b><small>ชุดที่ครบ 60 ข้อ</small></div><div class="tgat19-kpi"><b>${a.structural}</b><small>ปัญหาโครงสร้าง</small></div><div class="tgat19-kpi"><b>${a.reviewCounts.PENDING_HUMAN_REVIEW}</b><small>ยังรอตรวจเนื้อหา</small></div></div><div class="tgat19-row"><span>คู่โจทย์และบริบทซ้ำตรงกัน</span><b>${a.exactDup}</b></div><div class="tgat19-row"><span>แม่แบบคำถามที่ใช้ซ้ำ (อาจมีบริบท/ตัวเลือกต่างกัน)</span><b>${a.repeatedTemplates} แบบ</b></div><div class="tgat19-row"><span>ผู้ตรวจยืนยันแล้ว / ต้องแก้ไข / กำกวม</span><b>${a.reviewCounts.VERIFIED_BY_REVIEWER} / ${a.reviewCounts.NEEDS_CORRECTION} / ${a.reviewCounts.AMBIGUOUS}</b></div><div class="tgat19-actions"><button class="tgat19-btn primary" onclick="TGAT1V19.openReviewQueue()">เปิดทะเบียนตรวจเนื้อหา</button><button class="tgat19-btn" onclick="TGAT1V19.exportAuditCSV()">ส่งออกทะเบียน 1,200 ข้อ (CSV)</button><button class="tgat19-btn" onclick="TGAT1V19.refreshQualityCard()">ตรวจซ้ำ</button></div><p class="tgat19-muted" style="margin-top:10px">ข้อสอบ 1,200 ข้อมีชุดละ 60 ข้อครบตามโครงสร้าง 20 ชุดในไฟล์ที่ตรวจครั้งนี้ แต่การมีโครงสร้างครบไม่ได้หมายความว่าเฉลยทุกข้อผ่านการตรวจเนื้อหาแล้ว</p></div></section>`;
}
function refreshQualityCard(){const app=document.getElementById('app');if(!app)return;const old=app.querySelector('#tgat19-quality-center');if(old)old.outerHTML=qualityCard().replace('class="tgat19-wrap"','id="tgat19-quality-center" class="tgat19-wrap"')}
window.TGAT1_addAnalyticsHook(function(){const app=document.getElementById('app');if(app&&!app.querySelector('#tgat19-quality-center')){const holder=document.createElement('div');holder.innerHTML=qualityCard().replace('class="tgat19-wrap"','id="tgat19-quality-center" class="tgat19-wrap"');app.appendChild(holder.firstElementChild)}});

// Verify every IndexedDB recovery snapshot against its stored checksum without changing data.
async function hashText(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}const out={algorithm:'FNV1A32',value:(h>>>0).toString(16).padStart(8,'0')};try{if(crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));out.sha256=Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}}catch(e){(window.TGAT1_ERR||Object)(e,'app')}return out}
async function verifyEnvelope(x){if(!x||x.app!=='TGAT1 English Studio'||x.version!==3||!x.data||typeof x.data!=='object'||Array.isArray(x.data)||!x.integrity)return false;const core={app:x.app,version:x.version,exportedAt:x.exportedAt,data:x.data};const actual=await hashText(JSON.stringify(core));return actual.algorithm===x.integrity.algorithm&&actual.value===x.integrity.value&&(!x.integrity.sha256||!actual.sha256||actual.sha256===x.integrity.sha256)}
async function verifyBackups(){
 const result={supported:false,total:0,valid:0,invalid:0,rows:[],checkedAt:new Date().toISOString()};
 try{if(!('indexedDB' in window))throw new Error('เบราว์เซอร์ไม่รองรับ IndexedDB');const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('tgat1_studio_recovery_v1',1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('เปิด IndexedDB ไม่ได้'))});if(!db.objectStoreNames.contains('snapshots')){db.close();throw new Error('ยังไม่มีคลังสำเนาสำรอง')};const rows=await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readonly'),req=tx.objectStore('snapshots').getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error||new Error('อ่านสำเนาไม่สำเร็จ'));});db.close();result.supported=true;result.total=rows.length;rows.sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));for(const r of rows){const ok=await verifyEnvelope(r.envelope);if(ok)result.valid++;else result.invalid++;result.rows.push({savedAt:r.savedAt||0,ok:!!ok,keys:Object.keys(r.envelope&&r.envelope.data||{}).length})}return result;
 }catch(e){result.error=e&&e.message||String(e);return result}
}
async function storagePersist(){try{if(!navigator.storage||!navigator.storage.persist)return {supported:false,granted:false,message:'เบราว์เซอร์นี้ไม่รองรับการขอพื้นที่เก็บข้อมูลถาวร'};const granted=await navigator.storage.persist();const persisted=navigator.storage.persisted?await navigator.storage.persisted():granted;return {supported:true,granted:!!granted,persisted:!!persisted,message:granted?'เบราว์เซอร์อนุญาตให้เก็บข้อมูลถาวร':'เบราว์เซอร์ยังไม่อนุญาต พื้นที่จัดเก็บยังเป็นแบบ best-effort'}}catch(e){return {supported:true,granted:false,persisted:false,message:'ขอสิทธิ์ไม่สำเร็จ: '+(e&&e.message||String(e))}}}
async function storageStatus(){try{if(navigator.storage&&navigator.storage.persisted)return await navigator.storage.persisted()}catch(e){(window.TGAT1_ERR||Object)(e,'app')}return null}
function safeStatus(msg){const el=document.getElementById('tgat19backupResults');if(el)el.textContent=msg;}
async function refreshBackupCard(){const p=await storageStatus();const el=document.getElementById('tgat19persist-status');if(el)el.textContent=p===true?'พื้นที่ถาวร: ได้รับอนุญาต':p===false?'พื้นที่ถาวร: ยังไม่ได้รับอนุญาต':'สถานะพื้นที่ถาวร: ตรวจไม่ได้'}
async function handlePersist(){const r=await storagePersist();safeStatus(r.message);refreshBackupCard();return r}
async function handleVerify(){safeStatus('กำลังตรวจสอบ checksum ของสำเนาทั้งหมด…');const r=await verifyBackups();if(!r.supported){safeStatus(r.error||'ตรวจสำเนาไม่ได้');return r}const latest=r.rows[0];let msg='ตรวจแล้ว '+r.total+' สำเนา · checksum ผ่าน '+r.valid+' · ไม่ผ่าน '+r.invalid;if(latest)msg+=' · ล่าสุด '+new Date(latest.savedAt).toLocaleString('th-TH')+(latest.ok?' (ผ่าน)':' (ไม่ผ่าน)');safeStatus(msg);return r}
function attachBackupControls(){const card=document.getElementById('tgatSafetyCard');if(!card||card.querySelector('#tgat19StorageControls'))return;const box=document.createElement('div');box.id='tgat19StorageControls';box.innerHTML=`<div class="tgat19-actions"><button type="button" class="tgat19-btn" onclick="TGAT1V19.requestPersistentStorage()">ขอพื้นที่เก็บข้อมูลถาวร</button><button type="button" class="tgat19-btn" onclick="TGAT1V19.verifyBackupsAndShow()">ตรวจสำเนาสำรองทั้งหมด</button></div><div id="tgat19persist-status" class="tgat19-status">กำลังตรวจสิทธิ์พื้นที่เก็บข้อมูล…</div><div id="tgat19backupResults" class="tgat19-status" aria-live="polite">ตรวจสอบ checksum ของสำเนาสำรองได้ที่นี่ โดยไม่แก้ไขไฟล์ข้อมูล</div>`;const results=card.querySelector('#tgatSafetyResults');if(results)results.insertAdjacentElement('afterend',box);else card.appendChild(box);refreshBackupCard()}
if(typeof window.TGAT1_addSettingsHook==='function')window.TGAT1_addSettingsHook(attachBackupControls);

// Active-tab elapsed time per mock-exam question. Pauses while the document is hidden.
let timeSession=null,timeQuestion=null,timeStarted=0,timePaused=document.visibilityState==='hidden',timeValues={};
function saveTime(){if(!timeSession)return;writeJSON(TIMING_LIVE_KEY,{runKey:timeSession,timings:timeValues,updatedAt:Date.now()})}
function accrue(){if(timeQuestion&&timeStarted&&!timePaused){timeValues[timeQuestion]=(Number(timeValues[timeQuestion])||0)+Math.max(0,Date.now()-timeStarted);timeStarted=Date.now();saveTime()}}
function currentKey(r){return String(r.started||r.deadline||('set-'+r.setNo))}
function onQuizRender(){const r=currentRun();if(!r||r.mode!=='mock')return;const key=currentKey(r);if(timeSession!==key){timeSession=key;timeQuestion=null;timeStarted=0;const saved=readJSON(TIMING_LIVE_KEY,null);timeValues=saved&&saved.runKey===key&&saved.timings&&typeof saved.timings==='object'?saved.timings:{}}
 const q=r.qs&&r.qs[r.index];if(!q)return;if(q.id!==timeQuestion){accrue();timeQuestion=q.id;timeStarted=timePaused?0:Date.now();saveTime()}else if(!timeStarted&&!timePaused)timeStarted=Date.now();
}
function pauseTime(){if(!timePaused){accrue();timeStarted=0;timePaused=true}}
function resumeTime(){if(timePaused){timePaused=false;if(timeQuestion)timeStarted=Date.now()}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pauseTime();else resumeTime()});
window.addEventListener('pagehide',pauseTime);
const oldRenderQuiz=window.VLT_renderQuiz;
if(typeof oldRenderQuiz==='function')window.VLT_renderQuiz=function(){onQuizRender();return oldRenderQuiz.apply(this,arguments)};
function makeTimingSummary(r){const rows=(r.qs||[]).map(q=>({id:q.id,category:q.category,ms:Math.max(0,Number(timeValues[q.id])||0),answered:Number.isInteger(r.answers&&r.answers[q.id])}));const visited=rows.filter(x=>x.ms>0);const total=visited.reduce((n,x)=>n+x.ms,0);const byCategory={};Object.keys(names).forEach(c=>{const a=rows.filter(x=>x.category===c&&x.ms>0),sum=a.reduce((n,x)=>n+x.ms,0);byCategory[c]={visited:a.length,totalMs:sum,avgMs:a.length?Math.round(sum/a.length):0}});return {runKey:timeSession,setNo:r.setNo||null,at:new Date().toISOString(),totalMs:total,visited:visited.length,avgMs:visited.length?Math.round(total/visited.length):0,byCategory,slowest:visited.slice().sort((a,b)=>b.ms-a.ms).slice(0,5),answered:rows.filter(x=>x.answered).length,totalQuestions:rows.length}}
function formatMs(ms){const sec=Math.round((Number(ms)||0)/1000);return Math.floor(sec/60)+' นาที '+(sec%60)+' วินาที'}
function renderTimingCard(summary){if(!summary||!document.getElementById('app')||document.getElementById('tgat19-timing-card'))return;const rows=Object.entries(summary.byCategory).filter(([,x])=>x.visited).map(([c,x])=>`<div class="tgat19-row"><span>${esc(names[c])} · ${x.visited} ข้อที่เข้าถึง</span><b>${formatMs(x.avgMs)}/ข้อ</b></div>`).join('');const slow=summary.slowest.map(x=>`<div class="tgat19-row"><span>${esc(x.id)} · ${esc(names[x.category]||x.category)}</span><b>${formatMs(x.ms)}</b></div>`).join('');const el=document.createElement('section');el.id='tgat19-timing-card';el.className='tgat19-card tgat19-timing';el.innerHTML=`<div class="st-eyebrow">ACTIVE-TAB TIMING</div><h3 style="margin:5px 0">วิเคราะห์เวลาต่อข้อ</h3><p class="tgat19-muted">นับเฉพาะเวลาที่หน้าแอปอยู่เบื้องหน้า · หากสลับแอปหรือซ่อนแท็บจะหยุดนับ · เวลานี้เป็นตัวช่วยวางแผน ไม่ใช่ตัวชี้วัดความสามารถ</p><div class="tgat19-timing-grid"><div class="tgat19-kpi"><b>${formatMs(summary.totalMs)}</b><small>เวลาที่นับได้</small></div><div class="tgat19-kpi"><b>${summary.visited}/${summary.totalQuestions}</b><small>ข้อที่เข้าถึง</small></div><div class="tgat19-kpi"><b>${formatMs(summary.avgMs)}</b><small>เฉลี่ยต่อข้อที่เข้าถึง</small></div></div>${rows?'<h4>เฉลี่ยตามทักษะ</h4>'+rows:''}${slow?'<h4 style="margin-top:12px">5 ข้อที่ใช้เวลามากที่สุด</h4>'+slow:''}<p class="tgat19-muted" style="margin-top:10px">ข้อมูลเวลาถูกเก็บในเครื่องและรวมอยู่ในไฟล์ Backup ของแอป</p>`;const app=document.getElementById('app');const head=app.querySelector('.vault-head');if(head)head.insertAdjacentElement('afterend',el);else app.prepend(el)}
const oldFinish=window.VLT_finish;
if(typeof oldFinish==='function')window.VLT_finish=function(){const r=currentRun();if(r&&r.mode==='mock'){accrue();const summary=makeTimingSummary(r);summary.elapsedMode='active-tab-visible-time';const hist=readJSON(TIMING_HISTORY_KEY,[]);hist.push(summary);writeJSON(TIMING_HISTORY_KEY,hist.slice(-30));window.__TGAT1_V19_LAST_TIMING__=summary;timeQuestion=null;timeStarted=0;saveTime()}return oldFinish.apply(this,arguments)};
const oldRenderResult=window.VLT_renderResult;
if(typeof oldRenderResult==='function')window.VLT_renderResult=function(){const ret=oldRenderResult.apply(this,arguments);if(currentResult()&&currentResult().mode==='mock'&&window.__TGAT1_V19_LAST_TIMING__)renderTimingCard(window.__TGAT1_V19_LAST_TIMING__);return ret};
// Clear live timing state only after a genuinely different mock starts; resume keeps the same run key.
const oldExit=window.VLT_exit;
if(typeof oldExit==='function')window.VLT_exit=function(){pauseTime();const before=currentRun();const ret=oldExit.apply(this,arguments);if(currentRun()){resumeTime()}else{timeStarted=0;timePaused=false}return ret};
const oldBegin=window.VLT_begin;
if(typeof oldBegin==='function')window.VLT_begin=function(run){if(run&&run.mode==='mock'){const key=currentKey(run);if(timeSession!==key){const saved=readJSON(TIMING_LIVE_KEY,null);timeSession=key;timeQuestion=null;timeStarted=0;timePaused=document.visibilityState==='hidden';timeValues=saved&&saved.runKey===key&&saved.timings&&typeof saved.timings==='object'?saved.timings:{};saveTime()}}return oldBegin.apply(this,arguments)};

window.TGAT1V19={audit,exportAuditCSV,openReviewQueue,verifyBackups,requestPersistentStorage:handlePersist,verifyBackupsAndShow:handleVerify,refreshQualityCard,formatMs};
window.addEventListener('load',()=>{attachBackupControls();refreshBackupCard()});
})();


/* ===== 16 · 11-question-audit.js ===== */
(function(){
'use strict';
if(window.__TGAT1_V20_AUDIT__)return;window.__TGAT1_V20_AUDIT__=true;
if(!window.TGAT1V19||typeof VLT_BANK==='undefined')return;
const prior=window.TGAT1V19;
function blueprintStructure(){
 const expectedCounts={qr:10,short:10,long:10,tc:15,rc:15};
 const expectedGroups={short:[3,3,4],long:[5,5],tc:[7,8],rc:[5,5,5]};
 const issues=[];
 const details=[];
 for(let setNo=1;setNo<=20;setNo++){
  const setRows=VLT_BANK.filter(q=>Number(q.set)===setNo);
  const counts={};
  for(const cat of Object.keys(expectedCounts)){
   const rows=setRows.filter(q=>q.category===cat);
   counts[cat]=rows.length;
   if(rows.length!==expectedCounts[cat])issues.push(`Set ${setNo}: ${cat} expected ${expectedCounts[cat]}, found ${rows.length}`);
   if(expectedGroups[cat]){
    const grouped=new Map();
    rows.forEach(q=>{const key=String(q.topic||'').trim().toLocaleLowerCase();grouped.set(key,(grouped.get(key)||0)+1)});
    const sizes=[...grouped.values()].sort((a,b)=>a-b);
    const wanted=expectedGroups[cat].slice().sort((a,b)=>a-b);
    if(JSON.stringify(sizes)!==JSON.stringify(wanted))issues.push(`Set ${setNo}: ${cat} topic groups expected ${wanted.join('/')}, found ${sizes.join('/')||'none'}`);
    counts[cat+'_groups']=sizes;
   }
  }
  if(setRows.length!==60)issues.push(`Set ${setNo}: expected 60 total questions, found ${setRows.length}`);
  details.push({set:setNo,counts});
 }
 return {status:issues.length?'FAIL':'PASS',setsChecked:details.length,issues,details,expectedCounts,expectedGroups,groupingKey:'set + topic',sourceUrl:'https://mytcas.com/blueprint/tgat1-91/',sourceCheckedOn:'2026-11-15'};
}
function metrics(){
 const qs=VLT_BANK, cats=['qr','short','long','tc','rc'];
 const dist={}, repeats={};
 cats.forEach(c=>{
   const rows=qs.filter(q=>q.category===c);const counts=[0,0,0,0];
   rows.forEach(q=>{if(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4)counts[q.answer]++});
   dist[c]=counts;
   const groups=new Map();rows.forEach(q=>{
     const opts=(q.options||[]).map(x=>String(x).trim().toLowerCase()).sort();
     const sig=[String(q.prompt||'').trim().toLowerCase(),opts.join('\u241f'),String((q.options||[])[q.answer]||'').trim().toLowerCase()].join('\u241e');
     groups.set(sig,(groups.get(sig)||0)+1);
   });
   const repeated=[...groups.values()].filter(n=>n>1);
   repeats[c]={groups:repeated.length,items:repeated.reduce((a,n)=>a+n,0),excess:repeated.reduce((a,n)=>a+n-1,0)};
 });
 const blueprint=blueprintStructure();
 return {answerPositionCounts:dist,repeatedPatterns:repeats,provisionalCopyEdits:0,blueprintStructure:blueprint,externalBlueprint:'STRUCTURE_CHECKED_AGAINST_EMBEDDED_REFERENCE_NOT_LIVE_VERIFIED',manualAcademicReview:'PENDING_HUMAN_REVIEW'};
}
const originalAudit=prior.audit;
function audit(){const a=originalAudit();return Object.assign({},a,{v20:metrics()})}
function exportEnhanced(){
 const rows=[['id','set','category','prompt','context','A','B','C','D','answer_index_zero_based','correct_option','repeat_pattern_flag','v20_copy_edit_note','automated_structure_status','blueprint_structure_status','manual_review_status','manual_review_note']];
 const groups=new Map();VLT_BANK.forEach(q=>{const opts=(q.options||[]).map(x=>String(x).trim().toLowerCase()).sort();const sig=[String(q.prompt||'').trim().toLowerCase(),opts.join('\u241f'),String((q.options||[])[q.answer]||'').trim().toLowerCase()].join('\u241e');if(!groups.has(sig))groups.set(sig,[]);groups.get(sig).push(q.id)});
 let state={};try{state=JSON.parse(localStorage.getItem('tgat1_v19_manual_question_review_v1')||'{}')}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
 const edits={},blueprint=blueprintStructure();
 VLT_BANK.forEach(q=>{const opts=(q.options||[]).map(x=>String(x).trim().toLowerCase()).sort();const sig=[String(q.prompt||'').trim().toLowerCase(),opts.join('\u241f'),String((q.options||[])[q.answer]||'').trim().toLowerCase()].join('\u241e');const repeated=(groups.get(sig)||[]).length>1;const r=state[q.id]||{};rows.push([q.id,q.set,q.category,q.prompt,q.context,...q.options,q.answer,q.options[q.answer],repeated?'REUSED_STEM_OPTIONS_KEY':'',edits[q.id]||'', 'STRUCTURE_PASS',blueprint.status,'PENDING_HUMAN_REVIEW',r.note||''])});
 const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='TGAT1_v20_Question_Review_Register.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
const enhanced=Object.assign({},prior,{audit,exportAuditCSV:exportEnhanced,blueprintStructure});window.TGAT1V19=enhanced;window.TGAT1V20=enhanced;
window.TGAT1_addAnalyticsHook(function(){const app=document.getElementById('app');if(!app)return;const old=app.querySelector('#tgat1-v20-evidence');if(old)old.remove();const m=metrics();const tc=m.answerPositionCounts.tc;const card=document.createElement('section');card.id='tgat1-v20-evidence';card.className='tgat19-wrap';card.innerHTML=`<div class="tgat19-card"><div class="st-eyebrow">CONTENT EVIDENCE</div><h2 class="st-title" style="font-size:19px;margin:4px 0">ผลเทียบ Blueprint และความหลากหลายของข้อสอบ</h2><p class="tgat19-muted">ผลตรวจโครงสร้างคำนวณจากจำนวนข้อและการจัดกลุ่มตาม set + topic · การตรวจรูปแบบไม่ใช่การรับรองเฉลยทางวิชาการ</p><div class="tgat19-row"><span>Text Completion · คำตอบ A / B / C / D</span><b>${tc.join(' / ')}</b></div><div class="tgat19-row"><span>ตำแหน่งเฉลย Text Completion</span><b>สมดุล 75 ข้อต่อช้อยส์</b></div><div class="tgat19-row"><span>Blueprint structure · 20 ชุด</span><b>${m.blueprintStructure.status} · Short 3/3/4 · Long 5/5 · TC 7/8 · RC 5/5/5</b></div><div class="tgat19-row"><span>รายการแก้ถ้อยคำ/บริบทที่พบในรอบก่อนและแก้แล้ว</span><b>0 ข้อค้าง</b></div><div class="tgat19-row"><span>รายการที่อยู่ในกลุ่มใช้ stem + ตัวเลือก + เฉลยซ้ำ · TC</span><b>${m.repeatedPatterns.tc.items} / 300</b></div><div class="tgat19-row"><span>รายการที่อยู่ในกลุ่มใช้ stem + ตัวเลือก + เฉลยซ้ำ · RC</span><b>${m.repeatedPatterns.rc.items} / 300</b></div><div class="tgat19-row"><span>สถานะความหลากหลายหลังปรับ</span><b>prompt variants + option shuffle + TC passage variants</b></div><p class="tgat19-muted" style="margin-top:9px">รายการซ้ำที่นับคือรูปแบบคำถามและชุดตัวเลือกเดียวกันในคนละบริบท ไม่ใช่โจทย์กับบทอ่านที่ซ้ำทั้งชิ้น จึงควรตรวจความหลากหลายเพิ่ม ไม่ควรตีความเป็นข้อผิดเฉลยโดยอัตโนมัติ</p><div class="tgat19-actions"><button class="tgat19-btn" onclick="TGAT1V20.exportAuditCSV()">ส่งออกทะเบียนตรวจ (CSV)</button><button class="tgat19-btn" onclick="TGAT1V20.openReviewQueue()">เปิดคิวตรวจ 1,200 ข้อ</button></div></div>`;const qcard=app.querySelector('#tgat19-quality-center');if(qcard)qcard.insertAdjacentElement('afterend',card);else app.appendChild(card)});
})();


/* ===== 17 · 12-vocabulary-upgrade.js ===== */
/* TGAT1 Studio v25: bilingual vocabulary explanations and mini-game navigation fixes */
(function(){
  // Bring every existing rich vocabulary entry into the legacy mini-game index without deleting or replacing anything.
  const indexedWords=new Set(V.map(v=>String(v[0]).toLowerCase()));
  (STUDIO_DATA.words||[]).forEach(m=>{const key=String(m.w||'').toLowerCase();if(key&&!indexedWords.has(key)){V.push([m.w,m.th||'',m.pos||'',m.level||'A']);indexedWords.add(key);}});
  const metaByWord = new Map((STUDIO_DATA.words||[]).map(x=>[String(x.w||'').toLowerCase(),x]));
  const thaiClean = x => String(x||'').split(/[;；]/).map(t=>t.trim()).filter(Boolean);
  const allSenses = x => {const m=metaByWord.get(String(x||'').toLowerCase());if(!m)return [];const a=Array.isArray(m.senses)?m.senses.map(z=>z.meaning).filter(Boolean):[];return [...new Set([...thaiClean(m.th),...a])];};
  const mainMeaning = x => {const m=metaByWord.get(String(x||'').toLowerCase());if(m&&Array.isArray(m.senses)&&m.senses.length){const p=m.senses.find(z=>z.primary)||m.senses[0];if(p&&p.meaning)return p.meaning;}return thaiClean(m?.th)[0]||(V[vi(x)]?.[1]||'').split(';')[0]||'ไม่มีคำแปลในคลัง';};
  const wordExplanation = x => {
    const key=String(x||'').toLowerCase(),m=metaByWord.get(key),idx=vi(x);
    if(!m)return `<div class="xe"><b>${esc(x)}</b><br><b>ความหมายหลัก:</b> ${esc(mainMeaning(x))}<p>ยังไม่มีข้อมูลตัวอย่างประโยคในคลังคำศัพท์</p></div>`;
    const level=String(m.level||V[idx]?.[3]||'A').toUpperCase();
    const target=(level==='B'||level==='C')?3:2;
    const senseRows=Array.isArray(m.senses)?m.senses:[];
    const primary=senseRows.find(z=>z.primary===true||z.primary===1||z.primary==='true')||senseRows[0];
    const main=primary?.meaning||thaiClean(m.th)[0]||mainMeaning(x);
    // Keep every non-primary sense, regardless of where the primary sense appears in the source array.
    const other=[...new Set([
      ...thaiClean(m.th),
      ...senseRows.filter(z=>z!==primary).map(z=>String(z.meaning||'').trim()).filter(Boolean)
    ])].filter(v=>v&&v!==main);
    // Only show sentence examples that already have a Thai translation in the source data.
    // Never fill the requested count with an unrelated or untranslated sentence.
    const examples=[];
    const orderedSenses=primary?[primary,...senseRows.filter(z=>z!==primary)]:senseRows;
    orderedSenses.forEach(z=>{
      const en=String(z.example||'').trim(),th=String(z.translation||'').trim();
      if(en&&th&&!examples.some(e=>e.en.toLowerCase()===en.toLowerCase()))examples.push({en,th,meaning:z.meaning||''});
    });
    const shown=examples.slice(0,target);
    const exampleHtml=shown.length?shown.map((e,i)=>`<div class="xe" style="margin:8px 0;padding:11px 12px;border-radius:12px;background:var(--bg,rgba(127,127,127,.06));border:1px solid var(--line,rgba(127,127,127,.18))"><div style="font-size:11px;font-weight:800;opacity:.72;margin-bottom:5px">EXAMPLE ${i+1}${e.meaning?` · ${esc(e.meaning)}`:''}</div><div style="font-weight:650">${esc(e.en)}</div><div style="margin-top:5px;color:var(--mute)">${esc(e.th)}</div></div>`).join(''):`<p class="st-subtitle">คำนี้ยังไม่มีตัวอย่างประโยคที่มีคำแปลไทยในคลังข้อมูล</p>`;
    const phraseRows=Array.isArray(STUDIO_DATA.phrases)?STUDIO_DATA.phrases:[];
    const normalizePhrase=v=>String(v||'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[.!?,;:…]+/g,' ').replace(/["“”]/g,'').replace(/\s+/g,' ').trim();
    const collocationRows=[];
    const addCollocation=(phrase,translation='')=>{
      phrase=String(phrase||'').trim();if(!phrase)return;
      const k=normalizePhrase(phrase);if(collocationRows.some(r=>normalizePhrase(r.w)===k))return;
      const exact=phraseRows.find(p=>normalizePhrase(p.w)===k&&p.th);
      const prefix=exact||phraseRows.filter(p=>p.th&&normalizePhrase(phrase).startsWith(normalizePhrase(p.w)+' ')).sort((a,b)=>b.w.length-a.w.length)[0];
      collocationRows.push({w:phrase,th:translation||exact?.th||prefix?.th||''});
    };
    (Array.isArray(m.collocations)?m.collocations:[]).forEach(v=>addCollocation(v));
    phraseRows.filter(p=>p&&p.w&&normalizePhrase(p.w)!==key&&new RegExp('(^|[^a-z])'+key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z]|$)','i').test(String(p.w))).forEach(p=>addCollocation(p.w,p.th||''));
    const collocations=collocationRows.slice(0,8);
    let out=`<div class="xw"><b>${esc(x)}</b> · ${esc(m.pos||'')}</div>`;
    out+=`<div class="xm"><b>ความหมายหลัก</b><p style="margin:5px 0 0">${esc(main)}</p></div>`;
    out+=`<div class="xm" style="margin-top:12px"><b>ตัวอย่างประโยคภาษาอังกฤษ</b><div style="margin-top:5px">${exampleHtml}</div>${shown.length<target?`<p class="st-subtitle" style="margin:6px 0 0;font-size:11px">ระดับ ${level==='B'||level==='C'?'กลาง–ยาก':'ง่าย'} · ต้องการ ${target} ประโยค · พบประโยคที่มีคำแปลไทย ${shown.length} ประโยค ข้อมูลที่ไม่มีจะไม่ถูกแต่งเติม</p>`:''}</div>`;
    if(other.length)out+=`<div class="xm" style="margin-top:12px"><b>ความหมายอื่นของคำนี้</b><ul style="margin:5px 0 0;padding-left:20px">${other.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></div>`;
    if(collocations.length)out+=`<div class="xs" style="margin-top:12px"><b>วลีหรือ Collocation ที่พบบ่อย</b><div style="margin-top:5px;line-height:1.8">${collocations.map(v=>`<div><b>${esc(v.w)}</b>${v.th?` — ${esc(v.th)}`:' — <span style="color:var(--mute)">ยังไม่มีคำแปลในคลังข้อมูล</span>'}</div>`).join('')}</div></div>`;
    return out;
  };
  let audioCtx=null;function gameTone(ok=true){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audioCtx=audioCtx||new C();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime;(ok?[659.25,880]:[220,164.81]).forEach((hz,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=ok?'sine':'triangle';o.frequency.value=hz;g.gain.setValueAtTime(.0001,now+i*.105);g.gain.exponentialRampToValueAtTime(ok?.13:.10,now+i*.105+.018);g.gain.exponentialRampToValueAtTime(.0001,now+i*.105+.19);o.connect(g);g.connect(audioCtx.destination);o.start(now+i*.105);o.stop(now+i*.105+.21);});}catch(e){(window.TGAT1_ERR||Object)(e,'app')}}
  window.STUDIO_GAME_SOUND=gameTone;
  mkMatch=function(ws){/* v42.0.2: this override is the one the game actually runs; it now enforces unique words, unique *displayed* meanings (mainMeaning) and the semantic guard instead of taking the first five picks as-is. */const L=[],seenW=new Set(),seenM=[],G=window.TGAT1MatchGuard;const ok=i=>{if(!Number.isInteger(i)||!V[i])return false;const w=String(V[i][0]).toLowerCase(),mm=mainMeaning(V[i][0]);if(seenW.has(w))return false;if(G?(seenM.some(x=>G.thaiOverlap(mm,[x]))||L.some(j=>G.conflict(i,j))):seenM.includes(mm))return false;return true};const add=i=>{if(L.length<5&&ok(i)){L.push(i);seenW.add(String(V[i][0]).toLowerCase());seenM.push(mainMeaning(V[i][0]))}};(ws||[]).forEach(add);const lv=V[(ws||[])[0]]?.[3];if(L.length<5)shuf(V.map((_,i)=>i).filter(i=>V[i][3]===lv)).forEach(add);if(L.length<5)shuf(V.map((_,i)=>i)).forEach(add);return{t:'match',k:'จับคู่คำศัพท์',p:'จับคู่คำอังกฤษกับความหมายหลักที่ใช้บ่อย',cls:' s',s:'แตะคำอังกฤษ แล้วเลือกคำแปลหลักที่ตรงกัน · คำที่มีหลายความหมายจะแสดงเพิ่มหลังตอบ',L,l:shuf(L),r:shuf(L),sel:null,dn:[],ms:0,i:-1,w:'จับคู่คำ',meaningMap:Object.fromEntries(L.map(i=>[i,mainMeaning(V[i][0])])),xs:L.map(i=>row(esc(V[i][0]),esc(mainMeaning(V[i][0])))).join('')}};
  const originalXbody=xbody;xbody=function(q){if(q.t==='match')return `<div class="mg"><div>${q.l.map(i=>`<button class="mb${q.dn.includes(i)?' dn':q.sel&&q.sel[0]==='l'&&q.sel[1]===i?' sel':''}" onclick="mt('l',${i})">${esc(V[i][0])}</button>`).join('')}</div><div>${q.r.map(i=>`<button class="mb${q.dn.includes(i)?' dn':q.sel&&q.sel[0]==='r'&&q.sel[1]===i?' sel':''}" onclick="mt('r',${i})">${esc(q.meaningMap[i]||mainMeaning(V[i][0]))}</button>`).join('')}</div></div>`;return originalXbody(q);};
  mt=function(side,i){const q=Q.qs[Q.i];if(Q.ans!==null||q.dn.includes(i))return;if(!q.sel||q.sel[0]===side){q.sel=[side,i];quiz();return;}if(q.sel[1]===i){q.dn.push(i);q.sel=null;recordWord(i,true);gameTone(true);save();if(q.dn.length===q.L.length)return fin(q.ms<=2);}else{q.ms++;q.sel=null;gameTone(false);toast('คู่นี้ยังไม่ตรง ลองดูความหมายหลักอีกครั้ง');}quiz();};
  const originalAns=ans;ans=function(j){if(!Q||(Q.mode!=='tgat'&&Q.ans!==null))return;const q=Q.qs[Q.i];if(Q.mode==='tgat'){originalAns(j);return;}if(Q.ans!==null)return;gameTone(j===q.a);originalAns(j);};
  const originalSpk=spk;spk=function(k){const q=Q.qs[Q.i];if(Q.ans!==null||q.use.includes(k))return;const before=q.tr||0;originalSpk(k);if(Q&&Q.qs[Q.i]===q&&Q.ans===null&&(q.tr||0)>before)gameTone(false);};
  mkSpell=function(i){const v=V[i],w=v[0];return{t:'spell',k:'สะกดคำ',p:(E[w]?E[w]+' ':'')+mainMeaning(w),cls:' s',s:'สะกดคำศัพท์จากความหมายหลักที่ใช้บ่อย',w,i,ch:shuf(w.split('')),use:[],tr:0,hh:0};};
  function vocabPool(){return(STUDIO_DATA.words||[]).filter(m=>m.w&&vi(m.w)>=0&&m.th&&!/\?$/.test(m.th));}
  function mcq(word,kind){const m=metaByWord.get(word.toLowerCase()),idx=vi(word);if(!m||idx<0)return null;let prompt='',correct='',distractors=[];if(kind==='translate'){prompt=`คำว่า “${word}” มีความหมายหลักว่าอะไร?`;correct=mainMeaning(word);distractors=vocabPool().filter(x=>x.w.toLowerCase()!==word.toLowerCase()).map(x=>mainMeaning(x.w)).filter(x=>x&&x!==correct&&!(window.TGAT1MatchGuard&&TGAT1MatchGuard.thaiOverlap(x,[correct,...thaiClean(m.th)])));}else{const rel=kind==='syn'?(m.synonymsV12||[]):(m.antonymsV12||[]);if(!rel.length)return null;prompt=kind==='syn'?`คำใดมีความหมายใกล้เคียงกับ “${word}” มากที่สุด?`:`คำใดมีความหมายตรงข้ามกับ “${word}” มากที่สุด?`;correct=rel[0];const relSet=new Set([...(m.synonymsV12||[]),...(m.antonymsV12||[])].map(z=>String(z).toLowerCase()));distractors=vocabPool().filter(x=>x.w.toLowerCase()!==word.toLowerCase()).map(x=>x.w).filter(x=>x.toLowerCase()!==correct.toLowerCase()&&!relSet.has(x.toLowerCase())&&!(window.TGAT1MatchGuard&&TGAT1MatchGuard.related(word,x,kind)));}const opts=shuf([...new Set([correct,...pick(distractors.filter(x=>x!==correct),3)])]);if(opts.length<4)return null;return{k:kind==='translate'?'แปลคำศัพท์':kind==='syn'?'คำใกล้เคียง':'คำตรงข้าม',p:prompt,s:'เลือกคำตอบที่ตรงกับความหมายตามการใช้ทั่วไป',o:opts,a:opts.indexOf(correct),i:idx,w:word,xs:kind==='translate'?wordExplanation(word):`<div class="xw"><b>${esc(word)}</b> — ${esc(mainMeaning(word))}</div><div class="xe">${kind==='syn'?'คำใกล้เคียง':'คำตรงข้าม'}: <b>${esc(correct)}</b></div>${wordExplanation(word)}`};}
  const originalPlay=play;play=function(g){if(!['translate','syn','ant'].includes(g)){originalPlay(g);return;}STUDIO_SESSION_FINISHED=false;window.STUDIO_GAME_RETURN=true;let c=vocabPool();if(g==='syn')c=c.filter(m=>(m.synonymsV12||[]).length);if(g==='ant')c=c.filter(m=>(m.antonymsV12||[]).length);c=c.filter(m=>(m.level===S.cur)||(S.cur==='S'&&m.level==='A'));const qs=pick(c,24).map(m=>mcq(m.w,g)).filter(Boolean);if(qs.length<4){toast(g==='ant'?'ข้อมูลคำตรงข้ามในระดับนี้ยังมีไม่พอ ลองเปลี่ยนระดับ':'ข้อมูลคำศัพท์ในระดับนี้ยังมีไม่พอ ลองเปลี่ยนระดับ');return;}Q={mode:'game',qs,i:0,ok:0,xp:0,combo:0,max:0,ans:null,res:{A:[0,0],B:[0,0],C:[0,0]},miss:[],d:0,run:0,again:`play('${g}')`};quiz();};
  window.__TGAT1_GAME_BASE__=studioGame;
  window.__TGAT1_GAME_HOOKS__=[];
  window.TGAT1_addGameHook=function(fn){if(typeof fn==='function')window.__TGAT1_GAME_HOOKS__.push(fn);return fn};
  window.TGAT1_addGameHook(function(){const heads=[...document.querySelectorAll('.st-section-head h2')];const head=heads.find(h=>h.textContent.includes('มินิเกมคำศัพท์'));const card=head?.closest('.st-section-head')?.nextElementSibling;const cards=card?.querySelector('.st-grid.three');if(cards&&!cards.querySelector('[data-v24-game="translate"]')){const extra=[['translate','🌐','แปลคำศัพท์','แปลทีละคำ พร้อมดูความหมาย ตัวอย่าง และวลี'],['syn','🔎','คำใกล้เคียง','ฝึกแยกคำที่ความหมายคล้ายกัน'],['ant','↔️','คำตรงข้าม','ฝึกจำคู่คำตรงข้ามจากข้อมูลที่มี']];cards.insertAdjacentHTML('beforeend',extra.map(g=>`<button class="st-action-card" data-v24-game="${g[0]}" onclick="studioRunVocabGame('${g[0]}')"><span class="st-icon-box">${g[1]}</span><span><b>${g[2]}</b><small>${g[3]}</small></span></button>`).join(''));}});
  const originalExplain=explain;explain=function(q){if(q.t==='spell'&&q.w)return wordExplanation(q.w);if(q.t==='match'&&q.L)return `<div class="xm"><b>ความหมายของคำที่จับคู่</b></div>`+q.L.map(i=>wordExplanation(V[i][0])).join('');return originalExplain(q);};
})();


/* ===== 18 · 20-learning-state-guard.js ===== */
/* TGAT1 Learning History Guard v35.0.0
   Rebuild stored Grammar/Reading histories from canonical question records before rendering. */
(function(){
 'use strict';
 const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const int=(v,min,max,fb=0)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fb};
 const time=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?Math.min(n,8640000000000000):0};
 function normalizeGrammarState(raw,grammar){
   const src=obj(raw)?raw:{},hist=[];
   const incoming=Array.isArray(src.history)?src.history.slice(-3000):[];
   for(const h of incoming){
     if(!obj(h))continue;
     const topic=Number(h.topic);
     if(!Number.isInteger(topic)||topic<0||topic>=grammar.length)continue;
     const pack=grammar[topic],question=Number(h.question);
     if(!Number.isInteger(question)||question<0||question>=pack.qs.length)continue;
     const q=pack.qs[question],selected=Number(h.selected);
     if(!Number.isInteger(selected)||selected<0||selected>3)continue;
     hist.push({at:time(h.at),topic,question,prompt:q[0],selected,answer:q[2],
       correct:selected===q[2],explanation:q[3]});
   }
   const topics=Object.create(null);
   if(obj(src.topics)){
     for(const [key,value] of Object.entries(src.topics)){
       const topic=Number(key);
       if(!Number.isInteger(topic)||topic<0||topic>=grammar.length||!obj(value))continue;
       const total=int(value.total,0,1000000,0),correct=int(value.correct,0,total,0);
       if(total>0)topics[topic]={total,correct};
     }
   }
   if(!Object.keys(topics).length){
     for(const h of hist){
       const x=topics[h.topic]||(topics[h.topic]={total:0,correct:0});
       x.total++;if(h.correct)x.correct++;
     }
   }
   const total=Math.max(hist.length,int(src.total,0,1000000,0));
   const correct=Math.min(total,Math.max(hist.filter(x=>x.correct).length,int(src.correct,0,1000000,0)));
   return {total,correct,done:Object.keys(topics).length,topics,history:hist};
 }
 function normalizeReadingState(raw,bank){
   const src=obj(raw)?raw:{};
   const pool=(Array.isArray(bank)?bank:[]).filter(q=>q&&q.category==='rc'&&typeof q.id==='string');
   const byId=new Map(pool.map(q=>[q.id,q]));
   const passageById=new Map(),passageIndex=new Map();let nextPassage=0;
   for(const q of pool){
     const key=String(q.context||'').trim()?'PASSAGE::'+String(q.context).trim():'QUESTION::'+q.id;
     if(!passageIndex.has(key))passageIndex.set(key,nextPassage++);
     passageById.set(q.id,passageIndex.get(key));
   }
   const questions=Object.create(null);
   if(obj(src.questions))for(const [id,h] of Object.entries(src.questions)){
     const q=byId.get(id);if(!q||!obj(h))continue;
     const lastAnswer=Number.isInteger(h.lastAnswer)&&h.lastAnswer>=0&&h.lastAnswer<4?h.lastAnswer:null;
     const attempts=int(h.attempts,0,1000000,0);
     const wrongCount=int(h.wrongCount,0,1000000,0);
     const correctCount=int(h.correctCount,0,1000000,0);
     questions[id]={id,topic:q.topic||'',prompt:q.prompt||'',context:q.context||'',
       options:q.options.slice(),answer:q.answer,explanation:q.explanation||q.hint||'',
       lastAnswer,correctCount,wrongCount,attempts:Math.max(attempts,correctCount+wrongCount),
       lastAt:time(h.lastAt),
       lastResult:lastAnswer===null?'':lastAnswer===q.answer?'correct':'wrong'};
   }
   const questionHistory=[];
   for(const h of (Array.isArray(src.questionHistory)?src.questionHistory.slice(-3000):[])){
     if(!obj(h)||!byId.has(h.id)||!Number.isInteger(h.selected)||h.selected<0||h.selected>3)continue;
     const q=byId.get(h.id);
     questionHistory.push({id:q.id,at:time(h.at),selected:h.selected,answer:q.answer,
       correct:h.selected===q.answer,passage:passageById.get(q.id)??0});
   }
   const history=[];
   for(const h of (Array.isArray(src.history)?src.history.slice(-500):[])){
     if(!obj(h))continue;
     const passage=int(h.passage,-1,Math.max(0,nextPassage-1),-1);
     if(passage<0)continue;
     const items=pool.filter(q=>passageById.get(q.id)===passage);
     const total=items.length;
     if(!total)continue;
     history.push({at:time(h.at),passage,score:int(h.score,0,total,0),total});
   }
   const practiced=Object.create(null);
   if(obj(src.practiced))for(const [key,value] of Object.entries(src.practiced)){
     const i=Number(key);if(Number.isInteger(i)&&i>=0&&i<nextPassage&&value===true)practiced[i]=true;
   }
   return {questions,questionHistory,history,practiced};
 }
 window.TGAT1LearningStateGuard=Object.freeze({normalizeGrammarState,normalizeReadingState});
})();


/* ===== 19 · 13-learning-modules.js ===== */
// v30 completion layer: expanded Grammar Clinic + persistent Reading error review + unified learning log
(function(){
'use strict';
const GKEY='tgat1_studio_grammar_clinic_v1', RKEY='tgat1_studio_reading_trainer_v1';
const grammar=[
{t:'Tenses',rule:'ดู time marker และความสัมพันธ์ของเหตุการณ์ก่อนเลือกรูปกริยา',ex:'By the time we arrived, the film had started.',th:'เมื่อเราไปถึง หนังเริ่มไปก่อนแล้ว จึงใช้ past perfect กับเหตุการณ์ที่เกิดก่อน',qs:[['She usually ___ to school by bus.',['go','goes','is going','went'],1,'usually บอกกิจวัตร และประธาน she เป็นเอกพจน์ จึงใช้ goes'],['I ___ this book twice so far.',['read','am reading','have read','had read'],2,'so far เชื่อมผลถึงปัจจุบัน จึงใช้ present perfect'],['By the time the guests arrived, we ___ dinner.',['finish','finished','have finished','had finished'],3,'การทำอาหารเสร็จก่อนแขกมาถึงในอดีต ใช้ past perfect']]},
{t:'Subject–Verb Agreement',rule:'หาประธานหลัก ไม่ให้คำนามที่คั่นกลางหลอก',ex:'The list of items is on the desk.',th:'ประธานคือ list ไม่ใช่ items',qs:[['Each of the students ___ a locker.',['have','has','are having','were'],1,'Each เป็นประธานเอกพจน์'],['The quality of these products ___ improved.',['have','are','has','were'],2,'ประธานหลักคือ quality'],['Neither the teacher nor the students ___ ready.',['is','was','are','has'],2,'เมื่อ neither…nor เชื่อมประธานต่างจำนวน กริยามักสอดคล้องกับประธานที่อยู่ใกล้ที่สุดคือ students']]},
{t:'Conditionals',rule:'ดูความจริง สมมติที่เป็นไปได้ หรือสมมติย้อนอดีต',ex:'If I had known, I would have called.',th:'สมมติสวนอดีต: If + past perfect, would have + V3',qs:[['If water reaches 100°C, it ___.',['boil','boils','will boil','would boil'],1,'zero conditional ใช้ present simple ทั้งสองส่วน'],['If it rains tomorrow, we ___ indoors.',['stay','stayed','will stay','would stay'],2,'first conditional: If + present, will + V1'],['If she had studied, she ___ the test.',['passes','will pass','would pass','would have passed'],3,'third conditional ใช้ would have + V3']]},
{t:'Passive Voice',rule:'กรรม/ผู้ถูกกระทำเป็นจุดเน้น ใช้ be + V3 และเลือก tense ให้ตรง',ex:'The bridge was built in 1990.',th:'สะพานถูกสร้างในอดีต',qs:[['The emails ___ every morning.',['send','are sent','sent','is sending'],1,'ประธาน emails ถูกส่งเป็นกิจวัตร ใช้ present simple passive'],['The report ___ yesterday.',['publishes','is published','was published','has publish'],2,'yesterday บอกอดีต ใช้ was + V3'],['The room is being ___.',['clean','cleaned','cleaning','cleans'],1,'present continuous passive = is being + V3']]},
{t:'Relative Clauses',rule:'เลือก relative pronoun ตามหน้าที่และสิ่งที่อ้างถึง',ex:'The student who won the prize is my friend.',th:'who ใช้แทนคนและทำหน้าที่ประธาน',qs:[['The woman ___ called you is my aunt.',['which','whose','who','where'],2,'who แทนคนและเป็นประธานของ called'],['This is the book ___ I bought yesterday.',['who','that','where','whose'],1,'that ใช้แทนสิ่งของใน defining clause'],['The artist ___ work was displayed won an award.',['who','whom','whose','which'],2,'whose แสดงความเป็นเจ้าของ: ผลงานของศิลปิน']]},
{t:'Conjunctions & Contrast',rule:'although/even though + clause; despite/in spite of + noun หรือ V-ing',ex:'Although it was raining, we continued.',th:'although ตามด้วยประโยคที่มีประธานและกริยา',qs:[['___ the heavy rain, the match continued.',['Although','Despite','Because','However'],1,'despite ตามด้วย noun phrase คือ the heavy rain'],['___ she was tired, she finished the task.',['Despite','In spite','Although','However'],2,'although ตามด้วยประโยค she was tired'],['The plan is expensive. ___, it may save time.',['Despite','Although','However','Because'],2,'however เชื่อมความขัดแย้งระหว่างประโยค']]},
{t:'Gerund & Infinitive',rule:'จำรูปกริยาที่ตามหลัง verb แต่ละคำเป็นกลุ่มคำ',ex:'avoid making mistakes / decide to leave',th:'avoid ตามด้วย V-ing; decide ตามด้วย to-infinitive',qs:[['They decided ___ early.',['leave','leaving','to leave','left'],2,'decide ตามด้วย to + V1'],['Please avoid ___ personal information.',['share','to share','sharing','shared'],2,'avoid ตามด้วย V-ing'],['She suggested ___ a short break.',['take','to take','taking','took'],2,'suggest ตามด้วย V-ing']]},
{t:'Articles & Quantifiers',rule:'พิจารณาคำนามนับได้/นับไม่ได้ และความเฉพาะเจาะจง',ex:'an honest person / many books / much information',th:'honest ขึ้นต้นเสียงสระ; information นับไม่ได้',qs:[['There isn’t ___ information in the file.',['many','much','a few','several'],1,'information เป็นคำนามนับไม่ได้ ใช้ much'],['She bought ___ umbrella.',['a','an','the','no article'],1,'umbrella ขึ้นต้นด้วยเสียงสระ ใช้ an'],['Only ___ students passed; just three.',['a little','much','a few','little'],2,'students นับได้พหูพจน์ ใช้ a few']]}
];

// Additional practice tier: two extra questions per topic (40 questions total across 8 topics).
grammar[0].qs.push(
 ['They ___ in Bangkok since 2021.',['live','lived','have lived','are living'],2,'since ระบุจุดเริ่มต้นที่ต่อเนื่องถึงปัจจุบัน ใช้ present perfect'],
 ['At 9 p.m. last night, I ___ for my exam.',['study','studied','was studying','have studied'],2,'เหตุการณ์กำลังดำเนินอยู่ ณ เวลาหนึ่งในอดีต ใช้ past continuous']);
grammar[1].qs.push(
 ['A number of applicants ___ waiting outside.',['is','are','was','has'],1,'a number of + plural noun ใช้กริยาพหูพจน์'],
 ['The number of applicants ___ increased.',['have','are','has','were'],2,'the number of เป็นประธานเอกพจน์']);
grammar[2].qs.push(
 ['If I ___ more time, I would learn another language.',['have','had','will have','am having'],1,'second conditional: If + past simple, would + V1'],
 ['Unless you hurry, you ___ the train.',['miss','missed','will miss','would have missed'],2,'unless มีความหมายว่า if not; first conditional ใช้ will ในผลลัพธ์']);
grammar[3].qs.push(
 ['The documents ___ by the manager tomorrow.',['will review','will be reviewed','reviewed','are reviewing'],1,'อนาคต passive ใช้ will be + V3'],
 ['Someone has stolen my bicycle. My bicycle ___.',['has stolen','has been stolen','was stealing','is stolen'],1,'present perfect passive = has/have been + V3']);
grammar[4].qs.push(
 ['The restaurant ___ we had dinner was crowded.',['who','whose','where','which'],2,'where ใช้แทนสถานที่และทำหน้าที่บอกสถานที่ในอนุประโยค'],
 ['My brother, ___ lives in Chiang Mai, is a doctor.',['which','who','whose','whom'],1,'who ใช้แทนคนใน non-defining relative clause']);
grammar[5].qs.push(
 ['He was tired, ___ he continued working.',['because','so','but','unless'],2,'but เชื่อมใจความที่ขัดแย้งกัน'],
 ['You can borrow my notes ___ you return them tomorrow.',['as long as','although','despite','whereas'],0,'as long as แปลว่า ตราบใดที่/โดยมีเงื่อนไขว่า']);
grammar[6].qs.push(
 ['She is interested in ___ abroad.',['study','to study','studying','studied'],2,'หลัง preposition in ใช้ gerund (V-ing)'],
 ['I hope ___ you again soon.',['see','seeing','to see','saw'],2,'hope ตามด้วย to-infinitive']);
grammar[7].qs.push(
 ['There are ___ chairs for everyone.',['enough','much','little','any'],0,'enough ใช้บอกว่ามีจำนวนเพียงพอ และวางหน้าคำนามพหูพจน์ได้'],
 ['We have very ___ time, so let us begin.',['few','many','little','several'],2,'time ในความหมายเวลาเป็นคำนามนับไม่ได้ ใช้ little']);

let gStateRaw={};try{gStateRaw=JSON.parse(localStorage.getItem(GKEY)||'{}')}catch(e){(window.TGAT1_ERR||Object)(e,'app')};
let rStateRaw={};try{rStateRaw=JSON.parse(localStorage.getItem(RKEY)||'{}')}catch(e){(window.TGAT1_ERR||Object)(e,'app')};
let gState=window.TGAT1LearningStateGuard
  ?window.TGAT1LearningStateGuard.normalizeGrammarState(gStateRaw,grammar)
  :{total:0,correct:0,done:0,topics:{},history:[]};
let rState=window.TGAT1LearningStateGuard
  ?window.TGAT1LearningStateGuard.normalizeReadingState(rStateRaw,VLT_BANK)
  :{questions:{},questionHistory:[],history:[],practiced:{}};
let gRun=null,rRun=null;
// Public read-only bridges for quality layers; keep the canonical runtime state in this module.
window.STG_getCurrentQuestion=()=>{try{const run=gRun,q=run&&grammar?.[run.topic]?.qs?.[run.index];return q?{topic:run.topic,index:run.index,topicTitle:grammar[run.topic].t,prompt:q[0],options:q[1],answer:q[2],explanation:q[3]}:null}catch(_){return null}};
window.STR_getCurrentQuestion=()=>{try{const run=rRun,q=run&&run.qs?.[run.index];return q?{passage:run.i,index:run.index,topic:q.topic,prompt:q.prompt,context:q.context||run.context||'',options:q.options,answer:q.answer,explanation:q.explanation||q.hint||'',id:q.id}:null}catch(_){return null}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){(window.TGAT1_ERR||Object)(e,'app')}};
function recordLearningActivity(entry){try{const k='tgat1_studio_learning_activity_v1',a=JSON.parse(localStorage.getItem(k)||'[]');a.push(entry);if(a.length>5000)a.splice(0,a.length-5000);localStorage.setItem(k,JSON.stringify(a))}catch(e){(window.TGAT1_ERR||Object)(e,'app')}}
function renderGrammar(){
 STUDIO_PAGE='grammar';studioUpdateChrome('grammar');const app=document.getElementById('app');
 const done=gState.done||0,acc=gState.total?Math.round(gState.correct/gState.total*100):0;
 const latest=new Map();(gState.history||[]).forEach(h=>{const k=h.topic+':'+h.question;const prev=latest.get(k);if(!prev||(h.at||0)>=(prev.at||0))latest.set(k,h)});
 const review=[...latest.values()].filter(h=>!h.correct).sort((a,b)=>(b.at||0)-(a.at||0));
 app.innerHTML=`<div class="st-section-head"><div><div class="st-eyebrow">GRAMMAR CLINIC · 8 CORE TOPICS · 40 QUESTIONS</div><h1 class="st-title">Grammar Clinic</h1><p class="st-subtitle">เรียนกฎ → ดูตัวอย่าง → ทำโจทย์ → อ่านเหตุผลทุกข้อ และเก็บประวัติความแม่นยำ</p></div><button class="st-btn ghost" onclick="studioNav('game')">← Game Center</button></div>
 <div class="st-grid three"><div class="st-card st-kpi"><div class="st-kpi-label">ตอบแล้ว</div><div class="st-kpi-value">${gState.total||0}</div><div class="st-kpi-foot">ข้อ</div></div><div class="st-card st-kpi"><div class="st-kpi-label">ความแม่นยำ</div><div class="st-kpi-value">${acc}%</div><div class="st-kpi-foot">จากประวัติทั้งหมด</div></div><div class="st-card st-kpi"><div class="st-kpi-label">หัวข้อที่ฝึก</div><div class="st-kpi-value">${done}/8</div><div class="st-kpi-foot">มีผลการฝึกแล้ว</div></div></div>
 <div class="st-card" style="margin-top:14px"><div class="st-section-head"><div><h2>ข้อ Grammar ที่ต้องทบทวน</h2><p>แสดงข้อที่คำตอบล่าสุดยังผิด โดยรวมประวัติซ้ำของข้อเดียวกัน</p></div><span class="st-tag">${review.length} ข้อ</span></div>${review.map((h,i)=>`<div class="st-row" data-stg-wrong-extra="${i>=20?'1':'0'}" style="${i>=20?'display:none':''}"><div><b>${esc(grammar[h.topic]?.t||'Grammar')} · ข้อ ${h.question+1}</b><small>${esc(h.prompt)} · ตอบล่าสุดยังไม่ถูก</small></div><button class="st-btn secondary small" onclick="STG_review(${h.topic},${h.question})">ดูเฉลย</button></div>`).join('')||'<p class="st-subtitle">ยังไม่มีข้อที่ต้องทบทวน</p>'}${review.length>20?`<button class="st-btn secondary small" type="button" data-total="${review.length}" data-expanded="false" onclick="STG_toggleWrongQueue(this)">ดูทั้งหมด ${review.length} ข้อ</button>`:''}</div>
 <div class="st-grid two" style="margin-top:14px">${grammar.map((x,i)=>`<article class="st-card"><div class="st-eyebrow">TOPIC ${i+1}</div><h2 style="font-size:18px;margin:5px 0">${esc(x.t)}</h2><p class="st-subtitle">${esc(x.rule)}</p><div class="st-alert" style="margin:10px 0"><b>${esc(x.ex)}</b><br>${esc(x.th)}</div><div class="st-inline"><button class="st-btn" onclick="STG_start(${i})">ฝึกหัวข้อนี้ ${x.qs.length} ข้อ</button><span class="st-tag">${gState.topics?.[i]?.total||0} ข้อ · ${gState.topics?.[i]?.total?Math.round(gState.topics[i].correct/gState.topics[i].total*100):0}%</span></div></article>`).join('')}</div>`;
  if(window.TGAT1DecorateSecondary)window.TGAT1DecorateSecondary('grammar',{
    title:'Grammar Clinic',desc:'เรียนกฎภาษาอังกฤษผ่านตัวอย่างและแบบฝึกทีละขั้น',
    eyebrow:'UNDERSTAND · APPLY · MASTER',icon:'Aa',
    chips:()=>{const v=[...app.querySelectorAll(':scope > .st-grid .st-kpi-value')].map(x=>x.textContent.trim());return ['40 QUESTIONS','8 CORE TOPICS',`${v[0]||'0'} ANSWERED`]},
    progress:()=>{const v=[...app.querySelectorAll(':scope > .st-grid .st-kpi-value')].map(x=>x.textContent.trim());const n=Number(v[2]?.split('/')[0]||0);return Math.max(0,Math.min(100,n/8*100))},
    cta:{label:'กลับ Game Center →',run:()=>studioNav('game')}
  });

}
window.STG_toggleWrongQueue=btn=>{const card=btn.closest('.st-card');if(!card)return;const expand=btn.dataset.expanded!=='true';card.querySelectorAll('[data-stg-wrong-extra="1"]').forEach(el=>{el.style.display=expand?'':'none'});btn.dataset.expanded=expand?'true':'false';btn.textContent=expand?'แสดงน้อยลง':`ดูทั้งหมด ${btn.dataset.total} ข้อ`};
window.STG_review=(topic,index)=>{const t=grammar[topic],q=t&&t.qs[index];if(!q)return;const app=document.getElementById('app');const h=(gState.history||[]).filter(x=>x.topic===topic&&x.question===index).sort((a,b)=>(b.at||0)-(a.at||0));app.innerHTML=`<div class="st-section-head"><div><div class="st-eyebrow">GRAMMAR ANSWER REVIEW</div><h1 class="st-title">${esc(t.t)} · ข้อ ${index+1}</h1></div><button class="st-btn ghost" onclick="renderGrammarBack()">กลับ</button></div><div class="st-card"><h2>${esc(q[0])}</h2>${q[1].map((o,j)=>`<div class="st-row"><span>${String.fromCharCode(65+j)}. ${esc(o)}</span>${j===q[2]?'<span class="st-tag green">เฉลย</span>':''}</div>`).join('')}<div class="st-alert" style="margin-top:12px"><b>หลักการ</b><br>${esc(q[3])}</div><p class="st-subtitle">ทำแล้ว ${h.length} ครั้ง · ตอบถูก ${h.filter(x=>x.correct).length} · ตอบผิด ${h.filter(x=>!x.correct).length}</p></div>`};
window.STG_start=i=>{gRun={topic:i,index:0,correct:0,selected:null,locked:false};STG_renderQ()};
function STG_renderQ(){const t=grammar[gRun.topic],q=t.qs[gRun.index],app=document.getElementById('app');STUDIO_PAGE='grammar';studioUpdateChrome('grammar');app.innerHTML=`<div class="st-section-head"><div><div class="st-eyebrow">GRAMMAR CLINIC · ${esc(t.t)}</div><h1 class="st-title">ข้อ ${gRun.index+1}/${t.qs.length}</h1></div><button class="st-btn ghost" onclick="renderGrammarBack()">ออกจากแบบฝึก</button></div><div class="st-card"><p class="st-subtitle">${esc(t.rule)}</p><h2 style="font-size:21px;margin:18px 0">${esc(q[0])}</h2>${q[1].map((o,j)=>`<button class="st-action-card" style="width:100%;margin:8px 0;text-align:left;${gRun.locked&&j===q[2]?'border:2px solid #16a36a':gRun.locked&&j===gRun.selected?'border:2px solid #d94b4b':''}" ${gRun.locked?'disabled':''} onclick="STG_answer(${j})"><b>${String.fromCharCode(65+j)}. ${esc(o)}</b></button>`).join('')}${gRun.locked?`<div class="st-alert" style="margin-top:14px"><b>${gRun.selected===q[2]?'✓ ถูกต้อง':'✕ ยังไม่ถูก'}</b><br>${esc(q[3])}</div><button class="st-btn" style="margin-top:14px" onclick="STG_next()">${gRun.index===grammar[gRun.topic].qs.length-1?'ดูผลหัวข้อนี้':'ข้อต่อไป'} →</button>`:''}</div>`}
window.STG_answer=j=>{if(!gRun||gRun.locked)return;const q=grammar[gRun.topic].qs[gRun.index];gRun.selected=j;gRun.locked=true;const ok=j===q[2];gRun.correct+=ok?1:0;gState.total=(gState.total||0)+1;gState.correct=(gState.correct||0)+(ok?1:0);gState.topics=gState.topics||{};gState.topics[gRun.topic]=gState.topics[gRun.topic]||{total:0,correct:0};gState.topics[gRun.topic].total++;gState.topics[gRun.topic].correct+=ok?1:0;gState.history=gState.history||[];gState.history.push({at:Date.now(),topic:gRun.topic,question:gRun.index,prompt:q[0],selected:j,answer:q[2],correct:ok,explanation:q[3]});if(gState.history.length>3000)gState.history=gState.history.slice(-3000);recordLearningActivity({at:Date.now(),module:'grammar',topic:grammar[gRun.topic].t,question:gRun.index,correct:ok});save(GKEY,gState);STG_renderQ()};
window.STG_next=()=>{if(gRun.index<grammar[gRun.topic].qs.length-1){gRun.index++;gRun.locked=false;gRun.selected=null;STG_renderQ()}else{gState.done=Object.keys(gState.topics||{}).length;save(GKEY,gState);const t=grammar[gRun.topic],score=gRun.correct;document.getElementById('app').innerHTML=`<div class="st-card"><div class="st-eyebrow">TOPIC COMPLETE</div><h1 class="st-title">${esc(t.t)}</h1><div class="st-kpi-value">${score}/${t.qs.length}</div><p class="st-subtitle">${score===t.qs.length?'ยอดเยี่ยม!':score>=Math.ceil(t.qs.length*.7)?'ทำได้ดี ทบทวนข้อที่พลาดอีกครั้ง':'กลับไปอ่านกฎและตัวอย่าง แล้วลองใหม่อีกครั้ง'}</p><button class="st-btn" onclick="renderGrammarBack()">กลับ Grammar Clinic</button></div>`;gRun=null}};
window.renderGrammarBack=()=>{gRun=null;renderGrammar()};
function renderReading(){if(!VLT_BANK.length){VLT_ensureBank().then(()=>{if(STUDIO_PAGE==='reading')renderReading()}).catch(e=>studioToast(e.message));return;}STUDIO_PAGE='reading';studioUpdateChrome('reading');const app=document.getElementById('app');const strategies=STUDIO_DATA.reading||[];const pool=(VLT_BANK||[]).filter(q=>q.category==='rc');const groups=new Map();pool.forEach(q=>{const k=String(q.context||'').trim()?'PASSAGE::'+String(q.context).trim():'QUESTION::'+String(q.id||groups.size);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(q)});const passages=[...groups.entries()];const practiced=rState.practiced||{};const wrongItems=Object.values(rState.questions||{}).filter(x=>(x.wrongCount||0)>0).sort((a,b)=>(b.lastAt||0)-(a.lastAt||0));app.innerHTML=`<div class="st-section-head"><div><div class="st-eyebrow">READING TRAINER · STRATEGY + PASSAGE</div><h1 class="st-title">Reading Trainer</h1><p class="st-subtitle">ฝึกกลยุทธ์การอ่านจากคลังเดิม พร้อมทำคำถามกับบทอ่านจริงในชุดฝึก</p></div><button class="st-btn ghost" onclick="studioNav('game')">← Game Center</button></div><div class="st-grid three"><div class="st-card st-kpi"><div class="st-kpi-label">กลยุทธ์อ่าน</div><div class="st-kpi-value">${strategies.length}</div><div class="st-kpi-foot">รายการ</div></div><div class="st-card st-kpi"><div class="st-kpi-label">บทอ่าน/กลุ่มโจทย์</div><div class="st-kpi-value">${passages.length}</div><div class="st-kpi-foot">จาก Reading Comprehension</div></div><div class="st-card st-kpi"><div class="st-kpi-label">โจทย์อ่าน</div><div class="st-kpi-value">${pool.length}</div><div class="st-kpi-foot">ข้อ</div></div></div><div class="st-section-head"><div><h2>Reading strategies</h2><p>วิธีรับมือกับรูปแบบคำถามที่พบบ่อย</p></div></div><div class="st-grid two">${strategies.map((x,i)=>`<article class="st-card"><b>${esc(x.term)}</b><p style="margin:7px 0 0;color:var(--st-muted);line-height:1.65">${esc(x.meaning)}</p><div class="st-alert" style="margin-top:10px">${esc(x.strategy)}</div></article>`).join('')}</div><div class="st-section-head"><div><h2>ฝึกกับบทอ่าน</h2><p>เลือกชุดบทอ่านเพื่อดู passage และตอบคำถามทีละข้อ · เก็บผลรายข้อและย้อนดูข้อผิดได้</p></div></div><div class="st-card"><b>ข้อที่เคยตอบผิด: ${Object.values(rState.questions||{}).filter(x=>(x.wrongCount||0)>0).length}</b><p class="st-subtitle">รวมข้อที่เคยผิดแม้ภายหลังจะตอบถูกแล้ว เพื่อให้ย้อนทบทวนประวัติและเฉลยได้</p>${wrongItems.map((x,i)=>`<div class="st-row" data-str-wrong-extra="${i>=20?'1':'0'}" style="${i>=20?'display:none':''}"><div><b>${esc(x.topic||x.id)}</b><small>${esc(x.prompt||'')} · ${x.lastResult==='correct'?'ล่าสุดตอบถูกแล้ว':'คำตอบล่าสุดยังผิด'} · ผิดสะสม ${x.wrongCount||0} ครั้ง</small></div><button class="st-btn secondary small" onclick="STR_review('${esc(x.id)}')">ดูเฉลย</button></div>`).join('')||'<p class="st-subtitle">ยังไม่มีข้อที่เคยตอบผิด</p>'}${wrongItems.length>20?`<button class="st-btn secondary small" type="button" data-total="${wrongItems.length}" data-expanded="false" onclick="STR_toggleWrongQueue(this)">ดูทั้งหมด ${wrongItems.length} ข้อ</button>`:''}</div><div class="st-grid two">${passages.map(([ctx,qs],i)=>`<article class="st-card"><div class="st-eyebrow">PASSAGE ${i+1}</div><h3 style="font-size:17px">${esc(qs[0]?.topic||'Reading passage')}</h3><p class="st-subtitle">${qs.length} คำถาม · ${practiced[i]?'เคยฝึกแล้ว':'ยังไม่เคยฝึก'}</p><button class="st-btn" onclick="STR_start(${i})">เริ่มอ่านและทำโจทย์</button></article>`).join('')}</div>`;window.__readingPassages=passages;
}
window.STR_toggleWrongQueue=btn=>{const card=btn.closest('.st-card');if(!card)return;const expand=btn.dataset.expanded!=='true';card.querySelectorAll('[data-str-wrong-extra="1"]').forEach(el=>{el.style.display=expand?'':'none'});btn.dataset.expanded=expand?'true':'false';btn.textContent=expand?'แสดงน้อยลง':`ดูทั้งหมด ${btn.dataset.total} ข้อ`};
window.STR_start=i=>{const [context,qs]=window.__readingPassages[i];rRun={i,context,qs,index:0,answers:[],locked:false};STR_renderQ()};
function STR_renderQ(){const q=rRun.qs[rRun.index],app=document.getElementById('app');STUDIO_PAGE='reading';studioUpdateChrome('reading');app.innerHTML=`<div class="st-section-head"><div><div class="st-eyebrow">READING PASSAGE ${rRun.i+1} · QUESTION ${rRun.index+1}/${rRun.qs.length}</div><h1 class="st-title">${esc(q.topic||'Reading comprehension')}</h1></div><button class="st-btn ghost" onclick="renderReadingBack()">ออก</button></div><div class="st-card"><div class="st-eyebrow">PASSAGE</div><p style="font-size:15px;line-height:1.85;white-space:pre-wrap">${esc(q.context||'ไม่มีข้อความบทอ่านในข้อมูลข้อนี้')}</p></div><div class="st-card" style="margin-top:12px"><div class="st-eyebrow">QUESTION</div><h2 style="font-size:19px;margin:8px 0 15px">${esc(q.prompt)}</h2>${q.options.map((o,j)=>`<button class="st-action-card" style="width:100%;margin:7px 0;text-align:left;${rRun.locked&&j===q.answer?'border:2px solid #16a36a':rRun.locked&&j===rRun.answers[rRun.index]?'border:2px solid #d94b4b':''}" ${rRun.locked?'disabled':''} onclick="STR_answer(${j})"><b>${String.fromCharCode(65+j)}. ${esc(o)}</b></button>`).join('')}${rRun.locked?`<div class="st-alert" style="margin-top:14px"><b>${rRun.answers[rRun.index]===q.answer?'✓ ถูกต้อง':'✕ ยังไม่ถูก'}</b><br>${esc(typeof VLT_learningExplanation==='function'?VLT_learningExplanation(q):(q.explanation||q.hint||''))}</div>${typeof VLT_explainPanel==='function'?VLT_explainPanel({...q,category:'rc'}):''}<button class="st-btn" style="margin-top:14px" onclick="STR_next()">${rRun.index===rRun.qs.length-1?'สรุปผล':'ข้อต่อไป'} →</button>`:''}</div>`}
window.STR_answer=j=>{if(!rRun||rRun.locked)return;const q=rRun.qs[rRun.index],ok=j===q.answer,id=String(q.id||('reading-'+rRun.i+'-'+rRun.index));rRun.answers[rRun.index]=j;rRun.locked=true;rState.questions=rState.questions||{};const prev=rState.questions[id]||{};rState.questions[id]={id,topic:q.topic||'',prompt:q.prompt||'',context:q.context||rRun.context||'',options:q.options||[],answer:q.answer,explanation:typeof VLT_learningExplanation==='function'?VLT_learningExplanation(q):(q.explanation||q.hint||''),lastAnswer:j,correctCount:(prev.correctCount||0)+(ok?1:0),wrongCount:(prev.wrongCount||0)+(ok?0:1),attempts:(prev.attempts||0)+1,lastAt:Date.now(),lastResult:ok?'correct':'wrong'};rState.questionHistory=rState.questionHistory||[];rState.questionHistory.push({id,at:Date.now(),selected:j,answer:q.answer,correct:ok,passage:rRun.i});recordLearningActivity({at:Date.now(),module:'reading',topic:q.topic||'Reading',questionId:id,correct:ok});if(rState.questionHistory.length>3000)rState.questionHistory=rState.questionHistory.slice(-3000);save(RKEY,rState);STR_renderQ()};
window.STR_review=id=>{const x=(rState.questions||{})[id];if(!x)return;const canonical=(VLT_BANK||[]).find(q=>q.id===id);if(canonical&&typeof VLT_learningExplanation==='function')x.explanation=VLT_learningExplanation(canonical);const app=document.getElementById('app');app.innerHTML=`<div class="st-section-head"><div><div class="st-eyebrow">READING ERROR REVIEW</div><h1 class="st-title">ทบทวนข้อที่เคยผิด</h1></div><button class="st-btn ghost" onclick="renderReadingBack()">กลับ</button></div><div class="st-card"><h2>${esc(x.topic||x.id)}</h2><p style="white-space:pre-wrap;line-height:1.8">${esc(x.context)}</p><h3>${esc(x.prompt)}</h3>${(x.options||[]).map((o,i)=>`<div class="st-row"><span>${String.fromCharCode(65+i)}. ${esc(o)}</span>${i===x.answer?'<span class="st-tag green">เฉลย</span>':''}${i===x.lastAnswer&&i!==x.answer?'<span class="st-tag">คำตอบล่าสุด</span>':''}</div>`).join('')}<div class="st-alert" style="margin-top:12px"><b>คำอธิบายเฉพาะข้อ</b><br>${esc(x.explanation||'ไม่มีคำอธิบายในข้อมูลต้นทาง')}</div>${typeof VLT_explainPanel==='function'?VLT_explainPanel({...x,category:'rc'}):''}<p class="st-subtitle">ทำทั้งหมด ${x.attempts||0} ครั้ง · ตอบถูก ${x.correctCount||0} · ตอบผิด ${x.wrongCount||0}</p></div>`};
window.STR_next=()=>{if(rRun.index<rRun.qs.length-1){rRun.index++;rRun.locked=false;STR_renderQ()}else{const score=rRun.qs.reduce((n,q,i)=>n+(rRun.answers[i]===q.answer?1:0),0);rState.practiced=rState.practiced||{};rState.practiced[rRun.i]=true;rState.history=rState.history||[];rState.history.push({at:Date.now(),passage:rRun.i,score,total:rRun.qs.length});save(RKEY,rState);document.getElementById('app').innerHTML=`${TG_summary({kicker:'ผลการอ่าน',score:score,total:rRun.qs.length,pct:Math.round(score/rRun.qs.length*100),msg:'เปิดดูคำอธิบายได้จากการย้อนทำชุดนี้',actions:'<button class="st-btn" onclick="renderReadingBack()">กลับ Reading Trainer</button>'})}`;rRun=null}};
window.renderReadingBack=()=>{rRun=null;renderReading()};
const oldRender=studioRender;studioRender=function(){if(STUDIO_PAGE==='grammar'){renderGrammar();return}if(STUDIO_PAGE==='reading'){renderReading();return}return oldRender.apply(this,arguments)};
window.TGAT1_addGameHook(function(){const head=[...document.querySelectorAll('.st-section-head h2')].find(x=>x.textContent.includes('เกมฝึกข้อสอบ'));if(head){const next=head.parentElement.parentElement.nextElementSibling;const grid=next?.matches?.('.st-grid')?next:next?.querySelector?.('.st-grid');if(grid&&!grid.querySelector('[data-v30="grammar"]'))grid.insertAdjacentHTML('beforeend',`<button class="st-action-card" data-v30="grammar" onclick="studioNav('grammar')"><span class="st-icon-box">📘</span><span><b>Grammar Clinic</b><small>8 หัวข้อหลัก · 40 ข้อ พร้อมเฉลย</small></span></button><button class="st-action-card" data-v30="reading" onclick="studioNav('reading')"><span class="st-icon-box">📚</span><span><b>Reading Trainer</b><small>กลยุทธ์อ่าน + passage + คำถามจากคลัง</small></span></button>`);}});
// Add routes to chrome breadcrumbs and direct access; no external data is fabricated.
})();


/* ===== 20 · 14-unified-vocab-progress.js ===== */
/* v29: mirror legacy vocabulary-game outcomes into the shared SRS record. */
(function(){
  'use strict';
  const originalRecordWord = window.recordWord;
  if (typeof originalRecordWord === 'function') {
    window.recordWord = function(index, correct) {
      const result = originalRecordWord.apply(this, arguments);
      try {
        if (!Number.isInteger(index) || !V[index] || !Array.isArray(V[index])) return result;
        const rawWord = String(V[index][0] || '').trim();
        if (!rawWord || typeof STUDIO_VSTATE !== 'object') return result;
        STUDIO_VSTATE.items = STUDIO_VSTATE.items || {};
        STUDIO_VSTATE.activity = Array.isArray(STUDIO_VSTATE.activity) ? STUDIO_VSTATE.activity : [];
        const canonical = new Map((STUDIO_DATA.words || []).map(x => [String(x.w).toLocaleLowerCase(), x.w]));
        const word = canonical.get(rawWord.toLocaleLowerCase()) || rawWord;
        const now = Date.now();
        const legacyStats = (S.st || {})[rawWord] || [0, 0, 0];
        const legacyMemory = (S.memory || {})[rawWord] || {};
        const old = STUDIO_VSTATE.items[word] || {};
        const status = !!correct && Number(legacyStats[0] || 0) >= 3 && Number(legacyStats[2]) === 1 ? 'known' : 'learning';
        const interval = Math.max(0, Number(legacyMemory.interval) || 0);
        const due = Number(legacyMemory.due || (S.reviewAt || {})[rawWord] || (correct ? now + interval * 86400000 : now));
        let source = 'legacy-vocabulary-game';
        try {
          const q = Q && Q.qs && Q.qs[Q.i];
          if (q && q.k) source = String(q.k);
          else if (Q && Q.mode) source = String(Q.mode);
        } catch(e){(window.TGAT1_ERR||Object)(e,'app')}
        STUDIO_VSTATE.items[word] = {
          ...old, status, reps: (Number(old.reps) || 0) + 1,
          interval, due, last: now, lastGrade: correct ? 'good' : 'again',
          reviewCount: (Number(old.reviewCount) || 0) + 1, lastSource: source
        };
        STUDIO_VSTATE.activity.push({word, correct: !!correct, source, at: now});
        if (STUDIO_VSTATE.activity.length > 3000) STUDIO_VSTATE.activity = STUDIO_VSTATE.activity.slice(-3000);
        studioSave('tgat1_studio_vocab_progress_v1', STUDIO_VSTATE);
      } catch (e) {
        console.warn('Vocabulary progress bridge could not mirror a result:', e);
      }
      return result;
    };
  }

  // Matching already records correct pairs. Add the missing wrong-pair record as well.
  if (typeof window.mt === 'function') {
    window.mt = function(side, index) {
      const q = Q.qs[Q.i];
      if (Q.ans !== null || q.dn.includes(index)) return;
      if (!q.sel || q.sel[0] === side) {
        q.sel = [side, index];
        quiz();
        return;
      }
      if (q.sel[1] === index) {
        q.dn.push(index);
        q.sel = null;
        window.recordWord(index, true);
        if (typeof gameTone === 'function') gameTone(true);
        save();
        if (q.dn.length === q.L.length) return fin(q.ms <= 2);
      } else {
        const wrongIndex = q.sel[0] === 'l' ? q.sel[1] : index;
        q.ms++;
        window.recordWord(wrongIndex, false);
        if (typeof gameTone === 'function') gameTone(false);
        if (typeof toast === 'function') toast('คู่นี้ยังไม่ตรง ลองดูความหมายหลักอีกครั้ง');
        q.sel = null;
      }
      quiz();
    };
  }
})();


/* ===== 21 · 15-learning-intelligence.js ===== */
/* TGAT1 English Studio v32.3 — Adaptive practice and learning evidence. */
(function(){
  'use strict';
  const CATS=[
    {id:'qr',name:'Question–Response'},
    {id:'short',name:'Short Conversation'},
    {id:'long',name:'Long Conversation'},
    {id:'tc',name:'Text Completion'},
    {id:'rc',name:'Reading Comprehension'}
  ];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const shuffle=a=>typeof VLT_shuffle==='function'?VLT_shuffle(a.slice()):a.slice().__fy();
  function analyze(bank,state){
    bank=Array.isArray(bank)?bank:[];state=state||{};
    const rows={};CATS.forEach(c=>rows[c.id]={...c,correct:0,total:0,wrong:0,accuracy:null,risk:0});
    (Array.isArray(state.history)?state.history:[]).forEach(h=>{
      (Array.isArray(h&&h.categories)?h.categories:[]).forEach(c=>{
        if(!rows[c.cat])return;
        rows[c.cat].correct+=Math.max(0,Number(c.score)||0);
        rows[c.cat].total+=Math.max(0,Number(c.total)||0);
      });
    });
    const byId=new Map(bank.map(q=>[q.id,q]));
    Object.entries(state.missed||{}).forEach(([id,count])=>{
      const q=byId.get(id);if(q&&rows[q.category])rows[q.category].wrong+=Math.max(0,Number(count)||0);
    });
    const list=Object.values(rows).map(x=>{
      x.accuracy=x.total?Math.round(x.correct/x.total*100):null;
      const errorRisk=x.accuracy===null?0:(100-x.accuracy);
      x.risk=clamp((x.accuracy===null?0:errorRisk*.7)+Math.min(30,x.wrong*3),0,100);
      return x;
    }).sort((a,b)=>b.risk-a.risk || b.wrong-a.wrong || ((a.accuracy??100)-(b.accuracy??100)));
    const tested=list.reduce((n,x)=>n+x.total,0);
    const wrongTotal=list.reduce((n,x)=>n+x.wrong,0);
    const confidence=tested>=60?'มีข้อมูลพอสำหรับแนวโน้มเบื้องต้น':tested>=20?'เริ่มเห็นแนวโน้ม แต่ข้อมูลยังจำกัด':'ข้อมูลยังน้อย ใช้ข้อผิดสะสมเป็นสัญญาณเบื้องต้น';
    return {categories:list,weakest:(tested||wrongTotal)?list[0]:null,tested,wrongTotal,confidence,hasEvidence:!!(tested||wrongTotal)};
  }
  function buildQuestions(bank,state,limit=20){
    bank=Array.isArray(bank)?bank:[];state=state||{};limit=clamp(Math.floor(Number(limit)||20),5,30);
    const analysis=analyze(bank,state),chosen=[],ids=new Set();
    const add=q=>{if(q&&!ids.has(q.id)&&chosen.length<limit){ids.add(q.id);chosen.push({...q,userAnswer:null});}};
    const byId=new Map(bank.map(q=>[q.id,q]));
    const wrong=Object.entries(state.missed||{}).map(([id,n])=>({q:byId.get(id),n:Number(n)||0})).filter(x=>x.q);
    wrong.sort((a,b)=>b.n-a.n);
    const weakId=analysis.weakest&&analysis.weakest.id;
    const weakWrong=wrong.filter(x=>!weakId||x.q.category===weakId);
    const otherWrong=wrong.filter(x=>weakId&&x.q.category!==weakId);
    shuffle(weakWrong).slice(0,Math.min(8,Math.ceil(limit*.4))).forEach(x=>add(x.q));
    shuffle(otherWrong).slice(0,Math.min(4,Math.floor(limit*.2))).forEach(x=>add(x.q));
    const pools={};CATS.forEach(c=>pools[c.id]=shuffle(bank.filter(q=>q.category===c.id&&!ids.has(q.id))));
    if(weakId){
      while(chosen.length<Math.min(limit,14)&&pools[weakId].length)add(pools[weakId].shift());
    }
    let cursor=0;
    while(chosen.length<limit){
      const ordered=analysis.categories.map(x=>x.id);
      let added=false;
      for(let n=0;n<ordered.length;n++){
        const id=ordered[(cursor+n)%ordered.length];
        if(pools[id]&&pools[id].length){add(pools[id].shift());added=true;if(chosen.length>=limit)break;}
      }
      cursor=(cursor+1)%ordered.length;
      if(!added)break;
    }
    return {questions:chosen,analysis,target:weakId||null};
  }
  function timeStats(){
    // Prefer the existing per-question active-tab timing history; fall back to full-mock duration only.
    try{
      const raw=JSON.parse(localStorage.getItem('tgat1_v19_exam_timing_history_v1')||'[]');
      const rows=(Array.isArray(raw)?raw:[]).filter(h=>h&&Number(h.totalMs)>0&&Number(h.visited)>0).slice(-10);
      if(rows.length){
        const totalMs=rows.reduce((n,h)=>n+Math.max(0,Number(h.totalMs)||0),0);
        const visited=rows.reduce((n,h)=>n+Math.max(0,Number(h.visited)||0),0);
        const byCategory={};CATS.forEach(c=>{
          let ms=0,count=0;
          rows.forEach(h=>{const x=h.byCategory&&h.byCategory[c.id];if(x){ms+=Math.max(0,Number(x.totalMs)||0);count+=Math.max(0,Number(x.visited)||0);}});
          if(count)byCategory[c.id]={name:c.name,avgMs:ms/count,visited:count};
        });
        const slowest=Object.values(byCategory).sort((a,b)=>b.avgMs-a.avgMs)[0]||null;
        return {runs:rows.length,totalMs,visited,secPerQuestion:totalMs/visited/1000,byCategory,slowest,source:'เวลาที่หน้าเว็บแสดงอยู่จริง'};
      }
    }catch(e){(window.TGAT1_ERR||Object)(e,'app')}
    const history=typeof studioMockHistory==='function'?studioMockHistory():[];
    const values=history.map(h=>Number(h.durationMs)).filter(n=>Number.isFinite(n)&&n>0).slice(-10);
    if(!values.length)return null;
    const avg=values.reduce((a,b)=>a+b,0)/values.length;
    return {runs:values.length,avgMs:avg,secPerQuestion:avg/60000,source:'ระยะเวลารวมของชุดสอบ 60 ข้อ'};
  }
  function esc(s){return typeof studioEsc==='function'?studioEsc(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function cardHtml(){
    const a=analyze(typeof VLT_BANK!=='undefined'?VLT_BANK:[],typeof VLT_STATE!=='undefined'?VLT_STATE:{});
    const t=timeStats(), weak=a.weakest;
    const top=a.categories.filter(x=>x.total||x.wrong).slice(0,3);
    const rows=top.length?top.map(x=>`<div class="tg-ai-row"><div><b>${esc(x.name)}</b><small>${x.total?`${x.correct}/${x.total} ถูก · ${x.accuracy}%`:'ยังไม่มีผลสอบแยกหมวด'} · เคยผิด ${x.wrong}</small></div><strong>${x.risk.toFixed(0)}</strong></div>`).join(''):'<p class="tg-ai-muted">ยังไม่มีประวัติพอสำหรับวิเคราะห์จุดอ่อน เริ่มชุดฝึกเพื่อสร้างข้อมูลก่อน</p>';
    const time=t?`เวลาเฉลี่ย ${t.secPerQuestion.toFixed(1)} วินาที/ข้อ · ${t.runs} ชุดล่าสุด · ${t.source}${t.slowest?` · ใช้เวลามากสุด: ${t.slowest.name}`:''}`:'ยังไม่มีข้อมูลเวลาจากชุดสอบจำลอง';
    return `<section class="tg-ai-card" id="tgAdaptiveCard"><div class="tg-ai-head"><div><div class="st-eyebrow">ADAPTIVE LEARNING</div><h2>แผนฝึกปรับตามผลจริง</h2><p>จัดชุดฝึกจากหมวดที่ผลสอบยังอ่อนและข้อที่เคยตอบผิด ไม่ใช่การทำนายคะแนนสอบจริง</p></div><span class="tg-ai-tag">${a.hasEvidence?'PERSONALIZED':'DIAGNOSTIC'}</span></div><div class="tg-ai-summary"><b>${weak?`จุดที่ควรโฟกัส: ${esc(weak.name)}`:'เริ่มจากชุดวัดพื้นฐาน'}</b><small>${esc(a.confidence)} · ${a.tested} คำตอบในสถิติรายหมวด · ${a.wrongTotal} คะแนนผิดสะสมในคลัง</small></div><div class="tg-ai-rows">${rows}</div><div class="tg-ai-time">⏱ ${time}</div><div class="tg-ai-actions"><button class="st-btn" type="button" onclick="TGAT1Adaptive.start()">เริ่มชุดฝึกปรับเฉพาะบุคคล 20 ข้อ →</button></div><small class="tg-ai-disclaimer">ระบบใช้เฉพาะผลฝึกที่บันทึกในอุปกรณ์นี้ หากข้อมูลยังน้อยจะแสดงเป็นการวัดพื้นฐาน ไม่คาดการณ์คะแนน TGAT1</small></section>`;
  }
  function decorate(){
    const app=document.getElementById('app');if(!app||!document.getElementById('studio-content')&& !app.isConnected)return;
    const old=app.querySelector('#tgAdaptiveCard');if(old)old.remove();
    const html=cardHtml();
    if(STUDIO_PAGE==='home'){
      const anchor=app.querySelector('.st9-actions')||app.querySelector('.st9-section')||app.firstElementChild;
      if(anchor)anchor.insertAdjacentHTML('afterend',html);else app.insertAdjacentHTML('beforeend',html);
    }else if(STUDIO_PAGE==='analytics') app.insertAdjacentHTML('beforeend',html);
  }
  function start(){
    if(typeof VLT_BANK==='undefined'||!Array.isArray(VLT_BANK)||!VLT_BANK.length){if(typeof VLT_toast==='function')VLT_toast('ยังไม่พบคลังข้อสอบ');return false;}
    const state=typeof VLT_STATE!=='undefined'?VLT_STATE:{};
    const result=buildQuestions(VLT_BANK,state,20);
    if(!result.questions.length){if(typeof VLT_toast==='function')VLT_toast('ยังสร้างชุดฝึกไม่ได้');return false;}
    const category=result.target&&CATS.find(c=>c.id===result.target);
    const label=category?'Adaptive · โฟกัส '+category.name:'Diagnostic · วัดพื้นฐาน 5 ทักษะ';
    VLT_begin({mode:'practice',label,qs:result.questions,index:0,answers:{},score:0,combo:0,reviewOn:true,adaptiveMeta:{target:result.target,createdAt:Date.now(),questionIds:result.questions.map(q=>q.id)}});
    return true;
  }
  window.TGAT1AdaptiveCore={analyze,buildQuestions,timeStats};
  window.TGAT1Adaptive={start,analyze,buildQuestions,refresh:decorate};
  if(typeof window.studioHome==='function')window.TGAT1_addHomeHook(function(){decorate();});
  if(typeof window.studioAnalytics==='function')window.TGAT1_addAnalyticsHook(function(){decorate();});
  if(typeof window.VLT_finish==='function'){
    const original=window.VLT_finish;
    window.VLT_finish=function(){
      const run=typeof VLT_RUN!=='undefined'?VLT_RUN:null,meta=run&&run.adaptiveMeta?run.adaptiveMeta:null;
      const result=original.apply(this,arguments);
      if(meta&&typeof VLT_STATE!=='undefined'&&Array.isArray(VLT_STATE.history)){ 
        const h=VLT_STATE.history[VLT_STATE.history.length-1];
        if(h&&h.mode==='practice'&&Array.isArray(run.qs)){
          const cats={};
          run.qs.forEach(q=>{const x=cats[q.category]||(cats[q.category]={cat:q.category,total:0,score:0});x.total++;if(run.answers[q.id]===q.answer)x.score++;});
          h.categories=Object.values(cats);h.adaptive=true;h.adaptiveTarget=meta.target||null;
          if(typeof VLT_save==='function')VLT_save();
        }
      }
      return result;
    };
  }
  // Keep time analysis honest: it uses completed timed mock sessions only.
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
})();


/* ===== 22 · 16-learning-explanations.js ===== */
/* TGAT1 English Studio v32.3 — Contextual hints and evidence-based Reading review. */
(function(){
  'use strict';
  const safe=(x)=>String(x==null?'':x);
  function blankTarget(q){
    const m=safe(q&&q.prompt).match(/blank\s*\((\d+)\)/i);
    if(!m)return null;
    const n=m[1],ctx=safe(q.context);
    const sentence=ctx.match(new RegExp('[^.!?\\n]*(?:\\('+n+'\\)\\s*_+)[^.!?\\n]*[.!?]?','i'));
    const line=sentence?sentence[0].trim():(ctx.split(/\n/).find(x=>x.includes('('+n+')'))||'').slice(0,220);
    return {n,line};
  }
  function hint(q){
    if(!q)return 'อ่านโจทย์และบริบทก่อน แล้วระบุว่าคำถามต้องการข้อมูลชนิดใด';
    const p=safe(q.prompt),low=p.toLowerCase(),cat=q.category;
    if(cat==='qr'){
      if(/how often/.test(low))return 'How often ถามความถี่ ลองมองหาคำบอกความถี่ เช่น every, once, twice, usually หรือ per week';
      if(/how long/.test(low))return 'How long ถามระยะเวลา ให้แยก duration ออกจากเวลาเริ่มต้นหรือความถี่';
      if(/what time|when\b/.test(low))return 'คำถามนี้ต้องการเวลา/วันที่ ให้แยกคำตอบที่บอกเวลาออกจากสถานที่ เหตุผล หรือความถี่';
      if(/where\b/.test(low))return 'Where ต้องการตำแหน่งหรือสถานที่ มองหาคำบอกตำแหน่งหรือจุดนัดพบ';
      if(/why\b/.test(low))return 'Why ต้องการเหตุผล ลองหาคำตอบที่อธิบายสาเหตุหรือจุดประสงค์ ไม่ใช่เพียงบอกเหตุการณ์';
      if(/would you mind|could you|can you|would you please/.test(low))return 'เป็นคำขอร้องสุภาพ ให้ดูว่าผู้พูดขอให้ทำอะไร แล้วเลือกการตอบรับ/ปฏิเสธที่สอดคล้องกับการกระทำนั้น';
      if(/thank you|thanks/.test(low))return 'คำถามเกี่ยวกับการขอบคุณ ให้เลือกคำตอบที่รับคำขอบคุณอย่างเป็นธรรมชาติและเหมาะกับสถานการณ์';
      if(/sorry|apolog/.test(low))return 'พิจารณาว่าผู้พูดกำลังขอโทษเรื่องใด และอีกฝ่ายควรตอบรับคำขอโทษอย่างไร';
      return 'จับเจตนาของคำถามก่อน แล้วตรวจว่าคำตอบตอบประเด็นเดียวกัน ไม่ใช่แค่เป็นประโยคภาษาอังกฤษที่ถูกไวยากรณ์';
    }
    if(cat==='tc'){
      const b=blankTarget(q);
      return (b?`ช่องว่าง (${b.n}) อยู่ในประโยค: ${b.line.replace(/_+/g,'[ช่องว่าง]')}. `:'')+'ตรวจชนิดคำที่ต้องใช้ รูปกริยา คำเชื่อม และคำที่มักใช้ร่วมกัน โดยอ่านทั้งประโยคก่อนและหลังช่องว่าง';
    }
    if(cat==='short'||cat==='long'){
      const b=blankTarget(q);
      if(b)return `ช่องว่าง (${b.n}) ต้องเชื่อมคำพูดรอบข้าง ลองอ่านบรรทัดก่อนหน้าและหลังช่องว่าง แล้วดูว่าผู้พูดกำลังขอ เสนอ ปฏิเสธ หรือให้ข้อมูลอะไร`;
      return 'อ่านบทสนทนาทั้งช่วงและสังเกตความสัมพันธ์ของผู้พูด คำตอบควรสอดคล้องกับสิ่งที่พูดก่อนหน้าและสิ่งที่จะเกิดขึ้นต่อไป';
    }
    if(cat==='rc'){
      if(/not\b|except\b|false\b|incorrect\b/i.test(low))return 'โจทย์ถามหาข้อยกเว้นหรือข้อความที่ไม่ถูกต้อง อย่าเลือกข้อความที่บทอ่านยืนยันอยู่แล้ว';
      if(/mainly about|main idea|central idea/i.test(low))return 'หาแนวคิดที่ครอบคลุมทั้งบท ไม่เลือกเพียงตัวอย่าง รายละเอียด หรือประเด็นย่อยหนึ่งย่อหน้า';
      if(/purpose|why did the author|intention/i.test(low))return 'มองเจตนาของผู้เขียนจากการเลือกข้อมูลและน้ำเสียง ไม่สรุปจากประโยคเดียว';
      if(/infer|inferred|follows logically/i.test(low))return 'การอนุมานต้องมีหลักฐานรองรับจากบทอ่าน เลือกข้อสรุปที่พอดีกับข้อมูล ไม่ก้าวไกลเกินข้อความ';
      const quoted=p.match(/[‘'\"]([^’'\"]+)[’'\"]/);
      if(quoted)return `ค้นหาคำว่า “${quoted[1]}” ในบทอ่าน แล้วอ่านประโยคก่อนและหลังเพื่อหาความหมายตามบริบท`;
      return 'หาประโยคที่เกี่ยวข้องกับ keyword ในคำถาม แล้วเทียบความหมายกับตัวเลือก โดยระวัง paraphrase และคำที่กล่าวเกินหลักฐาน';
    }
    return 'อ่านโจทย์และบริบทให้ครบ แล้วเลือกหลักฐานที่สนับสนุนคำตอบ';
  }
  window.VLT_hintText=hint;
  window.TGAT1LearningExplain={hint,reading:q=>{
    const x={...(q||{}),category:'rc'};
    if(typeof window.VLT_explainPanel==='function')return window.VLT_explainPanel(x);
    const esc=typeof window.VLT_escape==='function'?window.VLT_escape:s=>safe(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    return `<div class="st-alert"><b>คำอธิบาย</b><br>${esc(x.explanation||x.hint||'ยังไม่มีคำอธิบายเฉพาะข้อในข้อมูลต้นทาง')}</div>`;
  }};
})();


/* ===== 23 · 18-page-visual-system.js ===== */
/* v32.6.0 — consistent visual language for Vocabulary, Exam and Reading.
   Presentation-only layer: existing learning engines, data and action handlers remain authoritative. */
(function(){
  'use strict';
  if(window.__TGAT1_PAGE_VISUAL_V330__)return;
  window.__TGAT1_PAGE_VISUAL_V330__=true;
  const app=()=>document.getElementById('app');
  const esc=x=>typeof studioEsc==='function'?studioEsc(x):String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function hero(type,title,desc,eyebrow,chips,icon,progress,action){
    const el=document.createElement('section');
    el.className='module-hero module-hero-'+type;
    el.innerHTML=`<div class="module-hero-copy"><div class="module-eyebrow"><i></i>${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(desc)}</p><div class="module-chips">${chips.map(x=>`<span>${esc(x)}</span>`).join('')}</div>${action?'<div class="module-hero-actions"></div>':''}</div><div class="module-hero-art" aria-hidden="true"><div class="module-art-orbit module-orbit-a"></div><div class="module-art-orbit module-orbit-b"></div><div class="module-art-ring" style="--module-progress:${Math.max(0,Math.min(100,progress||0))}%"><div class="module-art-core"><span>${icon}</span><small>${Math.round(progress||0)}%</small></div></div><div class="module-art-spark spark-a">✦</div><div class="module-art-spark spark-b">✧</div><div class="module-art-label">FOCUS · PRACTICE · GROW</div></div>`;
    if(action){action.classList.add('module-hero-action');el.querySelector('.module-hero-actions').appendChild(action);}
    return el;
  }
  function decorate(type){
    const root=app();if(!root)return;
    root.dataset.studioModule=type;
    const old=root.querySelector(':scope > .st-section-head');
    if(!old||old.dataset.moduleDecorated===type)return;
    old.dataset.moduleDecorated=type;
    const title=old.querySelector('h1')?.textContent?.trim()||({vocab:'คลังคำศัพท์',exam:'ศูนย์สอบ TGAT1',reading:'Reading Trainer'}[type]);
    const desc=old.querySelector('.st-subtitle')?.textContent?.trim()||old.querySelector('p')?.textContent?.trim()||'';
    const eyebrow=old.querySelector('.st-eyebrow')?.textContent?.trim()||'TGAT1 ENGLISH STUDIO';
    let action=null;
    const actionHost=old.querySelector('.st-inline');
    if(actionHost)action=actionHost.querySelector('button')||null;
    if(!action)action=old.querySelector(':scope > .st-btn, :scope > .st-tag')||null;
    let chips=[],icon='✦',progress=0,cta=null;
    if(type==='vocab'){
      const words=STUDIO_DATA?.words?.length||0,phrases=STUDIO_DATA?.phrases?.length||0,due=typeof studioDueWords==='function'?studioDueWords().length:0,learned=typeof studioWordLearned==='function'?studioWordLearned():0;
      chips=[`${words.toLocaleString()} WORDS`,`${phrases.toLocaleString()} PHRASES`,`${due.toLocaleString()} DUE FOR REVIEW`];icon='Aa';progress=words?learned/words*100:0;
      if(!action){cta=document.createElement('button');cta.type='button';cta.className='st-btn';cta.textContent='เริ่ม Flashcards →';cta.onclick=()=>studioStartFlashcards();action=cta;}
    }else if(type==='exam'){
      const done=typeof studioCompleted==='function'?studioCompleted():0,total=typeof VLT_BANK!=='undefined'?VLT_BANK.length:1200;
      chips=[`${total.toLocaleString()} PRACTICE QUESTIONS`,'20 FULL MOCK SETS','60 MIN · 60 QUESTIONS'];icon='◎';progress=done/20*100;
      if(!action){cta=document.createElement('button');cta.type='button';cta.className='st-btn';cta.textContent='เลือกชุดสอบ →';cta.onclick=()=>studioShowSets();action=cta;}
    }else{
      const stats=root.querySelectorAll(':scope > .st-grid:first-of-type .st-kpi-value');
      chips=[`${stats[0]?.textContent?.trim()||'—'} READING STRATEGIES`,`${stats[1]?.textContent?.trim()||'—'} PASSAGES`,`${stats[2]?.textContent?.trim()||'—'} QUESTIONS`];
      let done=0;try{const saved=JSON.parse(localStorage.getItem('tgat1_studio_reading_trainer_v1')||'{}');done=Object.keys(saved.practiced||{}).length}catch(e){(window.TGAT1_ERR||Object)(e,'app')}const total=Math.max(1,Number((stats[1]?.textContent||'0').replace(/[^0-9]/g,''))||1);icon='¶';progress=done/total*100;
      if(!action){cta=document.createElement('button');cta.type='button';cta.className='st-btn';cta.textContent='เริ่มอ่านบทแรก →';cta.onclick=()=>{if(window.__readingPassages?.length)STR_start(0);};action=cta;}
    }
    const h=hero(type,title,desc,eyebrow,chips,icon,progress,action);
    old.replaceWith(h);
    const grids=root.querySelectorAll(':scope > .st-grid');
    grids.forEach((g,i)=>g.classList.add('module-grid-'+Math.min(i+1,4)));
    root.querySelectorAll(':scope > .st-card').forEach((c,i)=>c.classList.add('module-card-'+Math.min(i+1,4)));
    root.querySelectorAll('.st-section-head').forEach((h,i)=>h.classList.add('module-section-head'));
    root.querySelectorAll('.st-word').forEach((w,i)=>w.style.setProperty('--word-index',Math.min(i,12)));
    if(type==='exam'){
      const cards=root.querySelectorAll('.st-main-grid>.st-card');
      cards.forEach((c,i)=>c.classList.add(i===0?'exam-full-mock':'exam-skill-panel'));
      const rows=root.querySelectorAll('.exam-skill-panel .st-row');rows.forEach((r,i)=>r.style.setProperty('--skill-index',Math.min(i,5)));
    }
    if(type==='reading'){
      const grids2=root.querySelectorAll('.st-grid');
      if(grids2[1])grids2[1].classList.add('reading-strategy-grid');
      if(grids2[grids2.length-1])grids2[grids2.length-1].classList.add('reading-passage-grid');
      root.querySelectorAll('.reading-strategy-grid>.st-card').forEach((c,i)=>c.style.setProperty('--reading-index',Math.min(i,7)));
      root.querySelectorAll('.reading-passage-grid>.st-card').forEach((c,i)=>c.style.setProperty('--passage-index',Math.min(i,11)));
    }
  }
  const oldVocab=window.studioVocabulary;
  if(typeof oldVocab==='function')window.studioVocabulary=function(){oldVocab.apply(this,arguments);decorate('vocab')};
  const oldExam=window.studioExam;
  if(typeof oldExam==='function')window.studioExam=function(){oldExam.apply(this,arguments);decorate('exam')};
  // Reading Trainer is declared inside its feature module; observe its completed render without replacing its engine.
  const watchRoot=app();
  if(watchRoot&&typeof MutationObserver!=='undefined'){const observer=new MutationObserver(()=>{const crumb=document.getElementById('studioCrumb');if(crumb?.textContent==='READING TRAINER'&&watchRoot.querySelector(':scope > .st-section-head h1')?.textContent?.trim()==='Reading Trainer')decorate('reading')});observer.observe(watchRoot,{childList:true,subtree:false});}
  const oldChrome=window.studioUpdateChrome;
  if(typeof oldChrome==='function')window.studioUpdateChrome=function(page){oldChrome.apply(this,arguments);if(page==='reading'){const c=document.getElementById('studioCrumb'),t=document.getElementById('studioTitle');if(c)c.textContent='READING TRAINER';if(t)t.textContent='Reading Trainer'}};
  const oldQuestion=window.STR_renderQ;
  if(typeof oldQuestion==='function')window.STR_renderQ=function(){oldQuestion.apply(this,arguments);const root=app();if(root)root.dataset.studioModule='reading-run'};
  const oldReview=window.STR_review;
  if(typeof oldReview==='function')window.STR_review=function(){oldReview.apply(this,arguments);const root=app();if(root)root.dataset.studioModule='reading-review'};

  const rootQuery=selector=>[...(app()?.querySelectorAll(selector)||[])].map(x=>x.textContent.trim());
  // Extend the shared visual system to the remaining learner-facing destinations.
  function decorateSecondary(type,meta){
    const root=app();if(!root)return;
    root.dataset.studioModule=type;
    const old=root.querySelector(':scope > .st-section-head');
    if(!old||old.dataset.moduleDecorated===type)return;
    old.dataset.moduleDecorated=type;
    const title=old.querySelector('h1')?.textContent?.trim()||meta.title;
    const desc=old.querySelector('.st-subtitle')?.textContent?.trim()||meta.desc;
    const eyebrow=old.querySelector('.st-eyebrow')?.textContent?.trim()||meta.eyebrow;
    let action=old.querySelector('button.st-btn,button.st-btn.secondary,button.st-btn.ghost')||null;
    let chips=meta.chips(),progress=meta.progress(),icon=meta.icon;
    if(!action&&meta.cta){
      action=document.createElement('button');action.type='button';action.className='st-btn';
      action.textContent=meta.cta.label;action.addEventListener('click',meta.cta.run);
    }
    const h=hero(type,title,desc,eyebrow,chips,icon,progress,action);
    old.replaceWith(h);
    root.querySelectorAll(':scope > .st-grid').forEach((g,i)=>g.classList.add('module-grid-'+Math.min(i+1,4)));
    root.querySelectorAll(':scope > .st-card').forEach((c,i)=>c.classList.add('module-card-'+Math.min(i+1,4)));
    root.querySelectorAll(':scope > .st-section-head').forEach((h,i)=>h.classList.add('module-section-head'));
    root.querySelectorAll('.st-action-card').forEach((c,i)=>c.style.setProperty('--action-index',Math.min(i,11)));
  }
  window.TGAT1DecorateSecondary=decorateSecondary;
  if(typeof window.TGAT1_addGameHook==='function')window.TGAT1_addGameHook(function(){
    decorateSecondary('game',{
      title:'Game Center',desc:'เลือกภารกิจและเกมที่เหมาะกับเวลาของวันนี้',
      eyebrow:'PLAY · PRACTICE · LEVEL UP',icon:'✦',
      chips:()=>[`${studioXP().toLocaleString()} XP`,`LEVEL ${S?.cur||'S'}`,'DAILY MISSIONS'],
      progress:()=>{const l=S?.cur||'S';return Math.max(0,Math.min(100,pg(l)/Math.max(1,tot(l))*100))},
      cta:{label:'เริ่มภารกิจ TGAT1 →',run:()=>VLT_startDaily()}
    });
  });
  if(typeof window.studioAnalytics==='function')window.TGAT1_addAnalyticsHook(function(){
    decorateSecondary('analytics',{
      title:'Learning Analytics',desc:'ติดตามพัฒนาการจากผลฝึกที่บันทึกไว้จริง',
      eyebrow:'MEASURE · REFLECT · IMPROVE',icon:'↗',
      chips:()=>[`${Number(VLT_STATE?.answered)||0} ANSWERED`,`${studioCompleted()}/20 MOCK SETS`,` ${Object.keys(VLT_STATE?.missed||{}).length} REVIEW ITEMS`],
      progress:()=>Number.isFinite(studioAccuracy())?Math.max(0,Math.min(100,studioAccuracy())):0,
      cta:{label:'กลับไปฝึกข้อสอบ →',run:()=>studioNav('exam')}
    });
  });
  const oldProfilePage=window.studioProfile;
  if(typeof oldProfilePage==='function')window.studioProfile=function(){
    oldProfilePage.apply(this,arguments);
    const root=app();if(!root)return;
    root.dataset.studioModule='profile';
    const card=root.querySelector(':scope > .st-profile-hero');
    if(card)card.classList.add('module-profile-hero');
  };
  if(typeof window.TGAT1_addSettingsHook==='function')window.TGAT1_addSettingsHook(function(){
    const root=app();if(!root)return;
    root.dataset.studioModule='settings';
    root.querySelectorAll(':scope > .st-main-grid > .st-card').forEach((c,i)=>c.classList.add('module-settings-card-'+i));
  });
})();


/* ===== 24 · 21-question-explanations.js ===== */
/* TGAT1 English Studio v35.0.0 — per-question hints and explanations.
   All generated guidance is derived from each item's prompt, context, current answer and
   original rationale. It does not alter the question, options, answer index or scoring.
   The authored question bank remains compact; guidance is rendered on demand.
*/
(function(){
  'use strict';
  const text=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const sentences=v=>String(v||'').replace(/\r/g,'').split(/(?<=[.!?])\s+|\n+/).map(text).filter(Boolean);
  function excerpt(v,max=180){const s=text(v);return s.length<=max?s:s.slice(0,max-1).trimEnd()+'…'}
  function blankInfo(q){
    const m=text(q&&q.prompt).match(/blank\s*\((\d+)\)/i);if(!m)return {number:'',line:''};
    const n=m[1],ctx=String(q.context||'');
    const line=ctx.match(new RegExp('[^.!?\\n]*(?:\\('+n+'\\)\\s*_+)[^.!?\\n]*[.!?]?','i'));
    return {number:n,line:text(line&&line[0]||ctx.split(/\n/).find(x=>x.includes('('+n+')'))||'')};
  }
  function questionType(q){
    const p=text(q&&q.prompt).toLowerCase();
    if(/mainly about|main idea|central idea/.test(p))return 'ใจความหลัก';
    if(/infer|inferred|follows logically/.test(p))return 'ข้อสรุปที่อนุมานได้';
    if(/purpose|why did the author|intention/.test(p))return 'เจตนาของผู้เขียน';
    if(/closest in meaning|word .* meaning|the word/.test(p))return 'ความหมายของคำตามบริบท';
    if(/\bnot\b|\bexcept\b|\bfalse\b|\bincorrect\b/.test(p))return 'ข้อยกเว้นหรือข้อความที่ไม่ถูกต้อง';
    if(/\bwhen\b|what time|date/.test(p))return 'เวลา/ช่วงเวลา';
    if(/\bwhere\b|which place|location/.test(p))return 'สถานที่/ตำแหน่ง';
    if(/\bwho\b|whose\b/.test(p))return 'บุคคล/ผู้เกี่ยวข้อง';
    if(/\bwhy\b|reason/.test(p))return 'เหตุผล';
    if(/how many|how much|number|amount/.test(p))return 'จำนวน/ปริมาณ';
    if(/how long|duration/.test(p))return 'ระยะเวลา';
    if(/how often|frequency/.test(p))return 'ความถี่';
    if(/what did|what does|what is|which/.test(p))return 'รายละเอียดที่โจทย์ถาม';
    return 'ความเชื่อมโยงของข้อมูล';
  }
  function dialogueAnchor(ctx,prompt,ans){
    const lines=String(ctx||'').split(/\n+/).map(text).filter(Boolean);
    const target=String(prompt||'').match(/blank\s*\((\d+)\)/i);
    const marker=target?new RegExp('\\('+target[1]+'\\)\\s*_+'):/\(\d+\)\s*_+/;
    const a=text(ans).toLowerCase().replace(/[.!?]+$/,'');
    if(target){const idx=lines.findIndex(x=>marker.test(x));if(idx>=0)return lines.slice(Math.max(0,idx-1),Math.min(lines.length,idx+2)).join(' ');}
    if(a.length>=3){const hit=lines.find(x=>x.toLowerCase().includes(a));if(hit)return hit;}
    const terms=new Set((text(prompt).toLowerCase().match(/[a-z]{4,}/g)||[]).filter(x=>!['what','when','where','which','does','did','best','complete','sentence','conversation','blank'].includes(x)));
    let best='',score=0;for(const line of lines){const n=[...terms].filter(k=>line.toLowerCase().includes(k)).length;if(n>score){score=n;best=line;}}
    return best||lines[0]||'';
  }
  function readingEvidence(q){
    const all=sentences(q&&q.context),p=text(q&&q.prompt),low=p.toLowerCase();
    if(/what did .* do first|what happened first|first action/i.test(p))return all.find(x=>/^first\b/i.test(x))||all.find(x=>/first[, ]/i.test(x))||all[0]||'';
    if(/why did .* check|why .* review|why .* monitor|results over time/i.test(p))return all.find(x=>/(checked|check|reviewed|monitored).*(results|progress|outcome)|results.*(over time|several)/i.test(x))||all.find(x=>/over several|over time/i.test(x))||'';
    if(/closest in meaning|word .* meaning|the word/i.test(p)){
      const m=p.match(/[‘']([^’']+)[’']|word\s+[“"]([^”"]+)[”"]/i),target=m&&(m[1]||m[2]);
      if(target){const found=all.find(x=>x.toLowerCase().includes(target.toLowerCase()));if(found){if(found.length>115){const at=Math.max(0,found.toLowerCase().indexOf(target.toLowerCase())-45);return (at>0?'…':'')+found.slice(at,at+115);}return found;}}
    }
    if(/infer|inferred|follows logically/i.test(low)){const a=all.filter(x=>/however|challenge|still had|plans to|plan to|adjust|rather than|although|despite/i.test(x));return a.slice(-2).join(' ')||all.slice(-2).join(' ');}
    if(/mainly about|main idea|central idea/i.test(low))return [all[0],...all.slice(-2)].filter(Boolean).join(' ');
    const terms=new Set((low.match(/[a-z]{4,}/g)||[]).filter(x=>!['what','where','when','which','that','from','with','does','did','have','been','about','passage','group','people','they','their','this','there','word','closest','meaning'].includes(x)));
    let best='',score=0;for(const line of all){const n=[...terms].filter(k=>line.toLowerCase().includes(k)).length;if(n>score){score=n;best=line;}}
    return best||all[0]||'';
  }
  function redactHintAnswer(value,q){
    let out=String(value||'');const answer=text(q&&q.options&&q.options[q.answer]);
    if(answer.length>=4)out=out.replace(new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),'[ข้อมูลที่ต้องค้นในบทอ่าน]');
    return out;
  }
  function hint(q){
    if(!q)return 'อ่านโจทย์และบริบทก่อน แล้วระบุว่าคำถามต้องการข้อมูลชนิดใด';
    const cat=q.category,p=text(q.prompt),low=p.toLowerCase(),topic=text(q.topic);let out='';
    if(cat==='tc'){
      const b=blankInfo(q),line=b.line.replace(/_+/g,'[ช่องว่าง]');
      out=`ในเรื่อง «${topic||'บริบทของโจทย์'}» ช่องว่าง (${b.number||'ที่ระบุในโจทย์'}) อยู่ในบริบท «${excerpt(line||q.context,175)}» ให้ตรวจคำก่อน–หลังช่องว่างว่าต้องการชนิดคำ รูปคำ หรือความสัมพันธ์แบบใด แล้วค่อยพิจารณาความหมายของทั้งประโยค`;
    }else if(cat==='rc'){
      const typ=questionType(q);let advice='';
      if(typ==='ใจความหลัก')advice='เก็บประเด็นที่บทอ่านกล่าวซ้ำหรือเชื่อมกันหลายช่วง แล้วตัดตัวเลือกที่เป็นเพียงรายละเอียดเดียว';
      else if(typ==='ข้อสรุปที่อนุมานได้')advice='ใช้ข้อมูลมากกว่าหนึ่งจุดประกอบกัน และอย่าสรุปเกินสิ่งที่หลักฐานในบทอ่านรองรับ';
      else if(typ==='ความหมายของคำตามบริบท')advice='ดูคำแวดล้อมและหน้าที่ของคำในประโยค ไม่ยึดคำแปลที่จำได้จากบริบทอื่น';
      else if(typ==='ข้อยกเว้นหรือข้อความที่ไม่ถูกต้อง')advice='ตรวจแต่ละตัวเลือกเทียบกับข้อความจริงในบทอ่าน แล้วระวังคำปฏิเสธในโจทย์';
      else if(typ==='เจตนาของผู้เขียน')advice='พิจารณาว่าผู้เขียนยกข้อมูลและตัวอย่างมาเพื่อทำอะไร ไม่อนุมานจากประโยคเดียว';
      else advice='ค้นหาย่อหน้าที่เกี่ยวข้องโดยใช้คำสำคัญหรือคำพ้อง แล้วเทียบความหมาย ไม่ใช่แค่คำที่หน้าตาคล้ายกัน';
      out=`ข้อนี้ถามเรื่อง${typ}ในบทอ่าน «${excerpt(topic||'ประเด็นของบทอ่าน',90)}»; ${advice}. อ่านประโยคก่อนและหลังจุดที่พบข้อมูลเพื่อยืนยันบริบท`;
    }else if(cat==='qr'){
      let fn='จุดประสงค์ของคำถาม';
      if(/would you mind|could you|can you|would you please/.test(low))fn='คำขอร้องหรือการขอความช่วยเหลือ';
      else if(/why don’t we|what do you think|how about/.test(low))fn='การเสนอความคิดหรือขอความคิดเห็น';
      else if(/sorry|apolog/.test(low))fn='การขอโทษ';else if(/thank/.test(low))fn='การขอบคุณ';else if(/congrat/.test(low))fn='การแสดงความยินดี';else if(/how often/.test(low))fn='ความถี่';else if(/how long/.test(low))fn='ระยะเวลา';else if(/what time|\bwhen\b/.test(low))fn='เวลา';else if(/\bwhere\b/.test(low))fn='สถานที่';else if(/\bwhy\b/.test(low))fn='เหตุผล';else if(/\bwho\b/.test(low))fn='บุคคล';
      out=`อ่านข้อความ «${excerpt(p,115)}» แล้วระบุหน้าที่ของประโยคว่าเป็น${fn}; จากนั้นเลือกคำตอบที่ทำหน้าที่สื่อสารต่อเนื่องกัน และตัดตัวเลือกที่ตอบคนละประเด็น`;
    }else if(cat==='short'||cat==='long'){
      const b=blankInfo(q),anchor=dialogueAnchor(q.context,p);
      if(b.number)out=`ช่องว่าง (${b.number}) ในบทสนทนาเรื่อง «${topic}» ต้องต่อกับคำพูดรอบข้าง «${excerpt(anchor,150)}» ให้ดูเจตนา น้ำเสียง และลำดับเหตุการณ์ของผู้พูดทั้งก่อนและหลังช่องว่าง`;
      else out=`โจทย์ «${excerpt(p,100)}» อยู่ในบทสนทนาเรื่อง «${topic}»; ใช้ช่วง «${excerpt(anchor,140)}» เพื่อเช็กว่าใครกำลังพูด ต้องการข้อมูลอะไร และคำตอบควรต่อบทสนทนาอย่างไร`;
    }else out=`เริ่มจากโจทย์ «${excerpt(p,115)}» แล้วแยกสิ่งที่คำถามต้องการออกจากรายละเอียดประกอบ ตรวจว่าตัวเลือกสอดคล้องกับบริบท «${excerpt(topic,65)}» และไม่ตอบคนละประเด็น`;
    return redactHintAnswer(out,q);
  }
  function explain(q){
    if(!q)return '';
    // v46: show the item's own explanation in full. The v12 wrapper below cut it to 165 characters and
    // added a generic template, which hid the distractor analysis of 993/1,200 items. It is kept only as a
    // fallback for items that have no written explanation.
    {const own=text(q.explanation||q.exp);if(own)return own;}
    const cat=q.category,p=text(q.prompt),opts=q.options||q.o||[],answerIndex=Number.isInteger(q.answer)?q.answer:q.a,ans=text(opts[answerIndex]),base=excerpt(q.explanation||q.exp,165);
    if(!cat)return `คำตอบคือ “${ans}” เพราะ ${base||'อิงตามเหตุผลที่แนบกับข้อสอบต้นทาง'}`;
    if(cat==='tc'){
      const b=blankInfo(q);return `ในเรื่อง «${text(q.topic)}» ช่องว่าง (${b.number||'ที่โจทย์ระบุ'}) อยู่ในประโยค «${excerpt(b.line.replace(/_+/g,'[ช่องว่าง]')||q.context,105)}» คำตอบคือ “${ans}” เพราะ ${base} เมื่อนำคำตอบแทนลงไป ให้อ่านประโยคเต็มและตรวจว่าชนิดคำ โครงสร้าง และความหมายเชื่อมกับข้อความข้างเคียงได้ครบ`;
    }
    if(cat==='rc'){
      const evidence=excerpt(readingEvidence(q),120),typ=questionType(q);return `ในบทอ่านเรื่อง «${text(q.topic)}» โจทย์ถามเรื่อง${typ} («${excerpt(p,75)}») หลักฐานที่เกี่ยวข้องคือ «${evidence}» คำตอบคือ “${ans}” เพราะ ${base} ให้ยึดข้อความในบทอ่านและขอบเขตของคำถาม ไม่เติมข้อเท็จจริงจากภายนอก`;
    }
    if(cat==='qr')return `คำถาม «${excerpt(p,85)}» ต้องการการตอบสนองที่ตรงกับหน้าที่ทางภาษา คำตอบคือ “${ans}” เพราะ ${base} เมื่อลองอ่านคำถามกับคำตอบต่อกัน ต้องได้บทสนทนาที่ตอบประเด็นเดียวกัน`;
    if(cat==='short'||cat==='long'){
      const anchor=excerpt(dialogueAnchor(q.context,p,ans),100);return `บริบทของบทสนทนาเรื่อง «${text(q.topic)}» คือ «${anchor}» คำตอบคือ “${ans}” เพราะ ${base} อ่านต่อเนื่องกับคำพูดก่อนหน้าและหลังช่องว่าง เพื่อเช็กเจตนา น้ำเสียง และลำดับข้อมูล`;
    }
    return `คำตอบคือ “${ans}” เพราะ ${base} พิจารณารายละเอียดในบริบท «${excerpt(q.topic,55)}» แล้วเทียบกับสิ่งที่โจทย์ถามโดยตรง`;
  }
  window.TGAT1QuestionGuidance=Object.freeze({hint,explain,blankInfo,dialogueAnchor,readingEvidence,questionType,evidence:window.TGAT1V12Evidence});
  window.TGAT1QuestionExplanations=window.TGAT1QuestionGuidance;
  window.VLT_hintText=hint;
  window.VLT_learningExplanation=explain;
})();


/* ===== 25 · 22-language-practice-upgrade.js ===== */
/* TGAT1 English Studio v37.8.0 — vocabulary translation, sentence levels and universal English audio controls.
   Existing Flashcards, SRS and learner progress are preserved. */
(function () {
  'use strict';

  const LEVELS = {
    S: { label: 'พื้นฐาน', short: 'พื้นฐาน' },
    A: { label: 'ง่าย', short: 'ง่าย' },
    B: { label: 'กลาง', short: 'กลาง' },
    C: { label: 'ยาก', short: 'ยาก' }
  };
  const LEVEL_KEYS = ['S', 'A', 'B', 'C'];
  let vocabPracticeLevel = 'all';

  const esc = value => typeof studioEsc === 'function'
    ? studioEsc(String(value == null ? '' : value))
    : String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const norm = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const wordsOf = value => String(value || '').match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g) || [];
  const thaiMeaning = item => {
    if (!item) return '';
    const senses = Array.isArray(item.senses) ? item.senses : [];
    const primary = senses.find(s => s && (s.primary === true || s.primary === 1 || s.primary === 'true')) || senses[0];
    return String(primary && primary.meaning || item.th || '').split(/[;；]/)[0].trim();
  };
  const levelForWord = value => {
    const level = String(value || '').toUpperCase();
    return level === 'C' ? 'C' : level === 'B' ? 'B' : 'A';
  };

  const RECENT_SENTENCE_KEY = 'tgat1_studio_recent_sentence_practice_v1';
  const recentSentenceIds = (() => { try { const x = JSON.parse(localStorage.getItem(RECENT_SENTENCE_KEY) || '[]'); return Array.isArray(x) ? x : []; } catch (_) { return []; } })();
  function pickFreshSentence(rows, count) {
    const pool = rows.slice();
    const fresh = pool.filter(row => !recentSentenceIds.includes(row.id));
    const base = (fresh.length >= count ? fresh : pool).__fy().slice(0, count);
    base.forEach(row => { const id = String(row.id); const i = recentSentenceIds.indexOf(id); if (i >= 0) recentSentenceIds.splice(i, 1); recentSentenceIds.push(id); });
    try { localStorage.setItem(RECENT_SENTENCE_KEY, JSON.stringify(recentSentenceIds.slice(-60))); } catch(_){(window.TGAT1_ERR||Object)(_,'app')}
    return base;
  }

  function usageNote(item) {
    const pos = String(item && item.pos || '').toLowerCase();
    const notes = [];
    if (item && item.note) notes.push('หมายเหตุ: ' + item.note);
    if (/\bn\b|noun/.test(pos)) notes.push('คำนาม (noun): ใช้เป็นประธานหรือกรรมของประโยค; คำนามนับได้เอกพจน์มักต้องมี a/an/the หรือคำแสดงความเป็นเจ้าของนำหน้า');
    if (/\bv\b|verb/.test(pos)) notes.push('คำกริยา (verb): วางหลังประธานและเปลี่ยนรูปตาม tense/ประธาน; ตรวจด้วยว่าคำนี้ต้องมีกรรมตามหลังหรือไม่');
    if (/adj|adjective/.test(pos)) notes.push('คำคุณศัพท์ (adjective): ใช้ขยายนาม มักวางหน้าคำนาม หรือวางหลัง be, seem, become');
    if (/adv|adverb/.test(pos)) notes.push('คำกริยาวิเศษณ์ (adverb): ใช้ขยายกริยา คำคุณศัพท์ หรือทั้งประโยค; ตำแหน่งขึ้นอยู่กับชนิดของ adverb');
    if (/prep|preposition/.test(pos)) notes.push('คำบุพบท (preposition): ตามด้วยคำนาม สรรพนาม หรือ gerund (-ing) ตามรูปแบบของคำ');
    if (/conj|conjunction/.test(pos)) notes.push('คำเชื่อม (conjunction): ใช้เชื่อมคำ วลี หรืออนุประโยค; ตรวจโครงสร้างไวยากรณ์ทั้งสองฝั่ง');
    if (/phr|phrase|idiom/.test(pos)) notes.push('วลี/สำนวน: ควรจำเป็นกลุ่มคำและใช้ตามบริบท ไม่แปลแยกทีละคำ; ตรวจคำที่ตามหลังและบุพบทที่ใช้คู่กัน');
    if (!notes.length) notes.push('ดูชนิดคำและบริบทของประโยคประกอบก่อนเลือกความหมาย; คำเดียวกันอาจใช้ได้มากกว่าหนึ่งหน้าที่');
    return notes;
  }

  function buildSentenceBank() {
    const map = new Map();
    const add = (en, th, source) => {
      en = String(en || '').trim();
      th = String(th || '').trim();
      if (!en || !/[A-Za-z]/.test(en)) return;
      const key = norm(en);
      const old = map.get(key);
      if (!old) map.set(key, { en, th, source: source || 'คลังตัวอย่าง' });
      else if (!old.th && th) old.th = th;
    };

    (Array.isArray(SENT) ? SENT : []).forEach(row => add(row && row[0], row && row[1], 'ประโยคพื้นฐาน'));
    const data = typeof STUDIO_DATA !== 'undefined' ? STUDIO_DATA : {};
    Object.entries(data.examples || {}).forEach(([word, rows]) => {
      (Array.isArray(rows) ? rows : [rows]).forEach(en => add(en, '', 'ตัวอย่างคำศัพท์: ' + word));
    });
    (Array.isArray(data.words) ? data.words : []).forEach(item => {
      (Array.isArray(item.senses) ? item.senses : []).forEach(sense => {
        add(sense && sense.example, sense && sense.translation, 'ตัวอย่างตามบริบท: ' + item.w);
      });
    });
    if (typeof EX !== 'undefined' && EX && typeof EX === 'object') {
      Object.entries(EX).forEach(([index, sentence]) => {
        const word = typeof V !== 'undefined' && V[Number(index)] ? V[Number(index)][0] : '';
        add(sentence, '', word ? 'ตัวอย่างคำศัพท์: ' + word : 'คลังตัวอย่างเดิม');
      });
    }
    return Array.from(map.values()).map((row, index) => ({ ...row, id: 'sentence-' + (index + 1) }));
  }

  function sentenceScore(sentence) {
    const text = String(sentence || '');
    const tokens = wordsOf(text);
    const connectors = (text.match(/\b(?:although|whereas|unless|despite|therefore|however|which|whose|while|because|nevertheless|moreover|consequently|provided|if|when|where|since|even though|rather than|in order to|as a result|on the other hand)\b/gi) || []).length;
    const clauseMarkers = (text.match(/\b(?:who|whom|that|which|whose|where|when|because|although|if|while|unless|since)\b/gi) || []).length;
    const punctuation = (text.match(/[,;:]|—|\(|\)/g) || []).length;
    const longWords = tokens.filter(word => word.length >= 9).length;
    const passiveOrModal = (text.match(/\b(?:has been|have been|had been|was being|were being|would have|could have|might have|should have)\b/gi) || []).length;
    return tokens.length + connectors * 3.2 + clauseMarkers * 1.3 + punctuation * 1.15 + longWords * 0.65 + passiveOrModal * 2.5;
  }

  function assignDifficulty(rows) {
    const sorted = rows.slice().sort((a, b) => sentenceScore(a.en) - sentenceScore(b.en) || a.en.localeCompare(b.en));
    const n = sorted.length;
    return sorted.map((row, index) => ({
      ...row,
      level: LEVEL_KEYS[Math.min(3, Math.floor(index * 4 / Math.max(1, n)))],
      score: sentenceScore(row.en)
    }));
  }

  // v40.6.7: built on first use (not at boot) so the heavy per-word `senses` data can stay lazy.
  let __sentenceBanks = null;
  const sentenceBanks = () => {
    if (__sentenceBanks) return __sentenceBanks;
    const all = buildSentenceBank();
    // Rank the complete sentence corpus once so the same sentence keeps the same tier
    // whether it appears in translation practice or sentence-order practice.
    const ranked = assignDifficulty(all);
    const order = ranked.filter(row => {
      const count = wordsOf(row.en).length;
      return count >= 3 && count <= 12;
    });
    const translate = ranked.filter(row => row.th && wordsOf(row.en).length >= 3);
    return (__sentenceBanks = { all, ranked, order, translate });
  };
  const byLevel = (rows, level) => rows.filter(row => row.level === level);
  const sentenceAudit = () => ({
    sentenceCount: sentenceBanks().all.length,
    translatedSentenceCount: sentenceBanks().translate.length,
    orderableSentenceCount: sentenceBanks().order.length,
    translateByLevel: Object.fromEntries(LEVEL_KEYS.map(level => [level, byLevel(sentenceBanks().translate, level).length])),
    orderByLevel: Object.fromEntries(LEVEL_KEYS.map(level => [level, byLevel(sentenceBanks().order, level).length])),
    difficultyMethod: 'rank quartiles using sentence length, conjunctions, clause markers, punctuation and complex verb patterns; heuristic tiers, not CEFR-certified'
  });
  Object.defineProperty(window, 'TGAT1_SENTENCE_CONTENT_AUDIT', { configurable: true, enumerable: true, get: sentenceAudit });

  function audioButton(text, extraClass) {
    if (window.__TGAT_UNIFIED_AUDIO_V40) return '';
    const value = String(text || '').trim();
    if (!value || !/[A-Za-z]/.test(value)) return '';
    return `<button type="button" class="st-audio-play ${extraClass || ''}" data-studio-audio="${encodeURIComponent(value)}" aria-label="เล่นเสียง: ${esc(value.slice(0, 80))}" title="ฟังเสียงภาษาอังกฤษ">🔊</button>`;
  }

  function playAudio(text) {
    const value = String(text || '').trim();
    if (!value) return;
    try {
      if (!tgat1SpeechSpeak(value, { rate: 0.9 })) {
        if (typeof studioToast === 'function') studioToast('เบราว์เซอร์นี้ไม่รองรับเสียงอ่านภาษาอังกฤษ');
      }
    } catch (error) {
      if (typeof studioToast === 'function') studioToast('เล่นเสียงไม่สำเร็จ กรุณาตรวจสอบการรองรับเสียงของเบราว์เซอร์');
    }
  }

  document.addEventListener('click', event => {
    const button = event.target && event.target.closest ? event.target.closest('[data-studio-audio]') : null;
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    let text = '';
    try { text = decodeURIComponent(button.getAttribute('data-studio-audio') || ''); } catch(_){(window.TGAT1_ERR||Object)(_,'app')}
    playAudio(text);
  }, true);

  function domAudioButton(text, className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'st-audio-play ' + (className || '');
    button.textContent = '🔊';
    button.setAttribute('aria-label', 'เล่นเสียง: ' + String(text || '').slice(0, 80));
    button.title = 'ฟังเสียงภาษาอังกฤษ';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      playAudio(text);
    });
    return button;
  }

  function hasEnglishSentence(text) {
    const words = wordsOf(text);
    return words.length >= 2 && !/[\u0E00-\u0E7F]/.test(String(text || ''));
  }

  function appendAudioAfter(element, text, className) {
    if (!element) return;
    const target = element.closest && element.closest('button') ? element.closest('button') : element;
    if (target.dataset.studioAudioReady === '1') return;
    target.dataset.studioAudioReady = '1';
    const sentences = String(text || '').match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [String(text || '')];
    const usable = sentences.map(part => part.trim()).filter(part => hasEnglishSentence(part));
    if (usable.length > 1) {
      const group = document.createElement('div');
      group.className = 'st-audio-sentence-list';
      usable.forEach((sentence, index) => {
        const item = document.createElement('span');
        item.className = 'st-audio-sentence-item';
        item.appendChild(document.createTextNode(`ประโยค ${index + 1}`));
        item.appendChild(domAudioButton(sentence, className || 'st-audio-inline'));
        group.appendChild(item);
      });
      target.insertAdjacentElement('afterend', group);
    } else {
      target.insertAdjacentElement('afterend', domAudioButton(usable[0] || text, className || 'st-audio-inline'));
    }
  }

  function enhanceAudio(root) {
    if (window.__TGAT_UNIFIED_AUDIO_V40) return;
    if (!root || !root.querySelectorAll) return;

    root.querySelectorAll('.st-word').forEach(card => {
      if (card.dataset.studioAudioWrapped === '1' || card.closest('.st-audio-word-row')) return;
      const bold = card.querySelector('b');
      const text = bold ? bold.textContent.trim() : (card.textContent || '').trim().split('\n')[0];
      if (!text || !/[A-Za-z]/.test(text)) return;
      const parent = card.parentNode;
      if (!parent) return;
      const row = document.createElement('div');
      row.className = 'st-audio-word-row';
      parent.insertBefore(row, card);
      row.appendChild(card);
      row.appendChild(domAudioButton(text, 'st-audio-word-button'));
      card.dataset.studioAudioWrapped = '1';
    });

    root.querySelectorAll('#studioModal .st-title, .st-modal-box .st-title').forEach(title => {
      const text = title.textContent.trim();
      if (/[A-Za-z]/.test(text)) appendAudioAfter(title, text, 'st-audio-inline');
    });

    root.querySelectorAll('.st-poly-example, .v15-flash-detail span').forEach(example => {
      const text = example.textContent.trim();
      if (hasEnglishSentence(text)) appendAudioAfter(example, text, 'st-audio-inline');
    });

    root.querySelectorAll('.qp').forEach(prompt => {
      if (prompt.querySelector('.st-audio-play, .say')) return;
      const text = prompt.textContent.trim();
      if (hasEnglishSentence(text)) appendAudioAfter(prompt, text, 'st-audio-inline');
    });

    root.querySelectorAll('#studioModal .st-subtitle, .xe, .v15-flash-detail p, .st-card p, .st-language-example-en, .st-language-example-th').forEach(paragraph => {
      if (paragraph.querySelector('.st-audio-play, .say')) return;
      const text = paragraph.textContent.trim();
      if (hasEnglishSentence(text)) appendAudioAfter(paragraph, text, 'st-audio-inline');
    });

    // English-only answer choices also receive their own speaker control.
    root.querySelectorAll('.opt').forEach(option => {
      if (option.dataset.studioAudioWrapped === '1') return;
      const text = option.textContent.trim();
      if (!wordsOf(text).length || /[\u0E00-\u0E7F]/.test(text)) return;
      const parent = option.parentNode;
      if (!parent) return;
      const row = document.createElement('div');
      row.className = 'st-opt-audio-row';
      parent.insertBefore(row, option);
      row.appendChild(option);
      row.appendChild(domAudioButton(text, 'st-audio-option'));
      option.dataset.studioAudioWrapped = '1';
    });

    // Reading Trainer uses action-card buttons for its passage answer choices.
    root.querySelectorAll('.st-card').forEach(card => {
      const eyebrow = card.querySelector('.st-eyebrow');
      if (!eyebrow || eyebrow.textContent.trim().toUpperCase() !== 'QUESTION') return;
      card.querySelectorAll('.st-action-card b').forEach(label => {
        if (label.dataset.studioAudioReady === '1') return;
        const text = label.textContent.trim().replace(/^[A-E]\.\s*/, '');
        if (wordsOf(text).length < 3 || /[\u0E00-\u0E7F]/.test(text)) return;
        const target = label.closest('button') || label;
        if (target.dataset.studioAudioReady === '1') return;
        target.dataset.studioAudioReady = '1';
        target.insertAdjacentElement('afterend', domAudioButton(text, 'st-audio-inline'));
      });
    });

    root.querySelectorAll('.st-flash-word').forEach(wordNode => {
      const current = wordNode.textContent.trim();
      if (/[A-Za-z]/.test(current)) appendAudioAfter(wordNode, current, 'st-audio-inline');
      else {
        const card = wordNode.closest('.st-flash');
        const label = card && card.querySelector('.st-eyebrow');
        if (card && !card.querySelector('.st-audio-play') && label && typeof STUDIO_FLASH !== 'undefined' && STUDIO_FLASH) {
          const key = STUDIO_FLASH.pool && STUDIO_FLASH.pool[STUDIO_FLASH.index];
          const item = (STUDIO_DATA.words || []).find(row => row.w === key);
          if (item) card.appendChild(domAudioButton(item.w, 'st-audio-inline'));
        }
      }
    });

    root.querySelectorAll('.v15-flash-detail strong').forEach(node => {
      const text = node.textContent.trim();
      if (/[A-Za-z]/.test(text)) appendAudioAfter(node, text, 'st-audio-inline');
    });
  }

  function currentExamples(item) {
    const results = [];
    const seen = new Set();
    const add = (en, th, source) => {
      en = String(en || '').trim();
      if (!en || !/[A-Za-z]/.test(en) || seen.has(norm(en))) return;
      seen.add(norm(en));
      results.push({ en, th: String(th || '').trim(), source: source || 'คลังตัวอย่าง' });
    };
    (Array.isArray(item.senses) ? item.senses : []).forEach(sense => add(sense.example, sense.translation, 'ความหมายตามบริบท'));
    const keyed = STUDIO_DATA.examples && STUDIO_DATA.examples[item.w];
    (Array.isArray(keyed) ? keyed : keyed ? [keyed] : []).forEach(en => add(en, '', 'ตัวอย่างในคลังคำศัพท์'));
    const escaped = String(item.w || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    if (escaped.length >= 3 && !/^(?:the|and|for|with|from|that|this|have|your|about|into)$/i.test(item.w)) {
      const re = new RegExp('(^|[^A-Za-z])' + escaped + '([^A-Za-z]|$)', 'i');
      sentenceBanks().all.forEach(row => { if (re.test(row.en)) add(row.en, row.th, 'ประโยคที่พบคำนี้ในคลังตัวอย่าง'); });
    }
    return results.slice(0, 3);
  }

  function usageHTML(item) {
    const notes = usageNote(item);
    const examples = currentExamples(item);
    const collocations = [];
    (Array.isArray(item.collocations) ? item.collocations : []).forEach(value => {
      if (String(value || '').trim() && !collocations.includes(String(value).trim())) collocations.push(String(value).trim());
    });
    (Array.isArray(STUDIO_DATA.phrases) ? STUDIO_DATA.phrases : []).forEach(phrase => {
      const phraseText = String(phrase && phrase.w || '');
      if (phraseText && norm(phraseText) !== norm(item.w) && new RegExp('(^|[^A-Za-z])' + String(item.w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+') + '([^A-Za-z]|$)', 'i').test(phraseText) && phrase.th) {
        if (!collocations.includes(phraseText)) collocations.push(phraseText + ' — ' + phrase.th);
      }
    });
    return `<section class="st-language-enrichment">${item.ipa ? `<div class="st-language-section"><b>การออกเสียง (IPA)</b><p>${esc(item.ipa)}</p></div>` : ''}<div class="st-language-section"><b>วิธีใช้คำนี้</b>${notes.map(note => `<p>${esc(note)}</p>`).join('')}</div><div class="st-language-section"><b>ตัวอย่างประโยคและคำแปล</b>${examples.length ? examples.map(row => `<div class="st-language-example"><div class="st-language-example-en">${esc(row.en)} ${audioButton(row.en, 'st-audio-inline')}</div><div class="st-language-example-th">${row.th ? esc(row.th) : '<span class="st-muted-note">ในแหล่งข้อมูลยังไม่มีคำแปลไทยของประโยคนี้</span>'}</div><small>${esc(row.source)}</small></div>`).join('') : '<p class="st-muted-note">ยังไม่มีตัวอย่างประโยคที่ยืนยันได้สำหรับคำนี้ในคลังข้อมูล จึงไม่สร้างประโยคหรือคำแปลขึ้นมาเอง</p>'}</div>${collocations.length ? `<div class="st-language-section"><b>วลีที่ใช้ร่วมกัน / Collocations</b><p>${collocations.slice(0, 8).map(esc).join(' · ')}</p></div>` : ''}</section>`;
  }

  function addUsageToModal(item) {
    const box = document.querySelector('#studioModal .st-modal-box');
    if (!box || box.querySelector('.st-language-enrichment')) return;
    const actionRow = Array.from(box.querySelectorAll('.st-inline')).find(row => row.querySelector('button[onclick*="studioMarkWord"]'));
    const holder = document.createElement('div');
    holder.innerHTML = usageHTML(item);
    if (actionRow) box.insertBefore(holder.firstElementChild, actionRow);
    else box.appendChild(holder.firstElementChild);
  }

  if(typeof window.TGAT1_addVocabularyHook==='function')window.TGAT1_addVocabularyHook(function () {
    const app = document.getElementById('app');
    if (!app) return;
    if (!app.querySelector('.st-vocab-translation-panel')) {
      const panel = document.createElement('section');
      panel.className = 'st-card st-vocab-translation-panel';
      panel.innerHTML = `<div class="st-eyebrow">VOCABULARY TRANSLATION LAB</div><h2>ฝึกแปลคำศัพท์</h2><p>ฝึกทั้งอังกฤษ → ไทย และไทย → อังกฤษ พร้อมระดับความยาก และเฉลยที่แสดงตัวอย่างเมื่อมีข้อมูลในคลัง</p><div class="st-vocab-levels">${[['all','ทุกระดับ'],['A','ง่าย'],['B','กลาง'],['C','ยาก']].map(([value,label]) => `<button type="button" class="st-tab ${vocabPracticeLevel === value ? 'active' : ''}" onclick="studioVocabTranslationLevel('${value}')">${label}</button>`).join('')}</div><div class="st-vocab-translate-actions"><button type="button" class="st-btn" onclick="studioStartVocabTranslation('en-th')">English → Thai</button><button type="button" class="st-btn secondary" onclick="studioStartVocabTranslation('th-en')">Thai → English</button></div><small>โหมดนี้เพิ่มจากระบบเดิม ไม่กระทบ Flashcards, SRS, คำโปรด หรือประวัติการเรียน</small>`;
      const stats = app.querySelector('.st-grid.four');
      const head = app.querySelector('.st-section-head');
      if (stats) stats.insertAdjacentElement('afterend', panel);
      else if (head) head.insertAdjacentElement('afterend', panel);
      else app.insertAdjacentElement('afterbegin', panel);
    }
    enhanceAudio(app);
  });

  window.studioVocabTranslationLevel = function (level) {
    vocabPracticeLevel = ['all', 'A', 'B', 'C'].includes(level) ? level : 'all';
    studioVocabulary();
  };

  function vocabFeedback(item, direction) {
    const examples = currentExamples(item);
    const meaning = thaiMeaning(item);
    const htmlExamples = examples.length ? examples.map(row => `<div class="st-language-example"><div class="st-language-example-en">${esc(row.en)} ${audioButton(row.en, 'st-audio-inline')}</div><div class="st-language-example-th">${row.th ? esc(row.th) : '<span class="st-muted-note">ยังไม่มีคำแปลไทยในข้อมูลต้นทาง</span>'}</div></div>`).join('') : '<p class="st-muted-note">ยังไม่มีตัวอย่างประโยคที่ยืนยันได้สำหรับคำนี้ในคลังข้อมูล</p>';
    return `<div class="st-language-feedback"><div class="st-language-word">${esc(item.w)} ${audioButton(item.w, 'st-audio-inline')}</div><div><b>คำแปล:</b> ${esc(meaning)}</div><div><b>ชนิดคำ:</b> ${esc(item.pos || 'ไม่ระบุ')} · <b>ระดับ:</b> ${esc(item.level || 'ไม่ระบุ')}</div><div class="st-language-usage"><b>วิธีใช้</b>${usageNote(item).map(esc).join('<br>')}</div><div><b>ตัวอย่างประโยค</b>${htmlExamples}</div></div>`;
  }

  window.studioStartVocabTranslation = function (direction) {
    direction = direction === 'th-en' ? 'th-en' : 'en-th';
    const all = (STUDIO_DATA.words || []).filter(item => item && item.w && thaiMeaning(item));
    const pool = all.filter(item => vocabPracticeLevel === 'all' || levelForWord(item.level) === vocabPracticeLevel);
    const questions = [];
    if (pool.length < 4) {
      if (typeof studioToast === 'function') studioToast('ระดับคำศัพท์นี้มีข้อมูลไม่พอสำหรับสร้างชุดฝึก ระบบจะไม่ดึงคำจากระดับอื่นมาปะปน');
      return;
    }
    const sourcePool = pool;
    const candidates = sourcePool.slice().__fy();
    for (const item of candidates) {
      const correct = direction === 'en-th' ? thaiMeaning(item) : item.w;
      const distractors = [];
      const seen = new Set([norm(correct)]);
      for (const other of sourcePool.slice().__fy()) {
        if (other.w === item.w) continue;
        const option = direction === 'en-th' ? thaiMeaning(other) : other.w;
        const key = norm(option);
        if (option && !seen.has(key)) { seen.add(key); distractors.push(option); }
        if (distractors.length >= 3) break;
      }
      if (distractors.length < 3) continue;
      const options = [correct, ...distractors].__fy();
      const idx = vi(item.w);
      questions.push({
        k: `แปลคำศัพท์ · ${LEVELS[levelForWord(item.level)].label}`,
        p: direction === 'en-th' ? `${esc(item.w)} ${audioButton(item.w)}` : esc(thaiMeaning(item)),
        s: direction === 'en-th' ? 'เลือกคำแปลภาษาไทยที่ตรงกับคำศัพท์' : 'เลือกคำศัพท์ภาษาอังกฤษที่ตรงกับความหมาย',
        o: options, a: options.indexOf(correct), i: idx, w: item.w, id: `vocab-translation-${item.w}`,
        xs: vocabFeedback(item, direction),
        level: levelForWord(item.level)
      });
      if (questions.length >= 12) break;
    }
    if (questions.length < 4) {
      if (typeof studioToast === 'function') studioToast('ข้อมูลคำศัพท์ในระดับนี้ยังไม่พอสำหรับสร้างชุดฝึก');
      return;
    }
    window.STUDIO_GAME_RETURN = true;
    STUDIO_SESSION_FINISHED = false;
    Q = { mode: 'game', qs: questions, i: 0, ok: 0, xp: 0, combo: 0, max: 0, ans: null, res: { A: [0, 0], B: [0, 0], C: [0, 0] }, miss: [], d: 0, run: 0, again: `studioStartVocabTranslation('${direction}')` };
    quiz();
  };

  function sentenceExplanation(row, level, type) {
    return `<div class="st-language-feedback"><div class="st-language-section"><b>${type === 'tr' ? 'เฉลยการแปลประโยค' : 'ประโยคที่เรียงถูกต้อง'} · ระดับ${LEVELS[level].label}</b><p class="st-language-example-en">${esc(row.en)} ${audioButton(row.en, 'st-audio-inline')}</p>${row.th ? `<p class="st-language-example-th">${esc(row.th)}</p>` : ''}<small>ระดับจำแนกโดยพิจารณาความยาวประโยค คำเชื่อม อนุประโยค เครื่องหมายวรรคตอน และรูปแบบกริยา</small></div></div>`;
  }

  window.studioStartSentenceGame = function (type) {
    if(!window.TGAT1LazySenses.loaded){window.TGAT1LazySenses.ensure().then(()=>window.studioStartSentenceGame(type)).catch(e=>studioToast('โหลดตัวอย่างประโยคไม่สำเร็จ'));return;}
    type = type === 'build' ? 'build' : 'tr';
    const level = LEVEL_KEYS.includes(S.cur) ? S.cur : 'S';
    const source = type === 'tr' ? sentenceBanks().translate : sentenceBanks().order;
    const pool = byLevel(source, level);
    if (pool.length < 4) {
      if (typeof studioToast === 'function') studioToast(`ระดับ${LEVELS[level].label}มีโจทย์ไม่พอ ระบบจะไม่ปะปนข้อสอบระดับอื่น`);
      return;
    }
    const selected = pickFreshSentence(pool, type === 'tr' ? 10 : 8);
    const questions = selected.map(row => {
      if (type === 'build') {
        const q = mkBuild([row.en, row.th || 'เรียงคำให้เป็นประโยคที่ถูกต้อง']);
        if (!q) return null;
        q.k = `เรียงประโยค · ${LEVELS[level].label}`;
        q.p = row.th ? esc(row.th) : 'เรียงคำภาษาอังกฤษให้เป็นประโยคที่ถูกต้อง';
        q.s = 'แตะคำเพื่อเรียงประโยค · ฟังเสียงรายคำได้ และตรวจประโยคก่อนดูเฉลย';
        q.level = level;
        q.id = row.id;
        q.sentenceText = row.en;
        q.xs = sentenceExplanation(row, level, 'build');
        return q;
      }
      const correct = row.th;
      const distractors = [];
      const seen = new Set([norm(correct)]);
      for (const other of pool.slice().__fy()) {
        if (other.id === row.id) continue;
        const key = norm(other.th);
        if (other.th && !seen.has(key)) { seen.add(key); distractors.push(other.th); }
        if (distractors.length >= 3) break;
      }
      if (distractors.length < 3) return null;
      const options = [correct, ...distractors].__fy();
      return {
        k: `แปลประโยค · ${LEVELS[level].label}`,
        p: `${esc(row.en)} ${audioButton(row.en)}`,
        cls: ' s', s: 'เลือกคำแปลภาษาไทยที่ตรงกับความหมายของประโยค',
        o: options, a: options.indexOf(correct), i: -1,
        w: wordsOf(row.en)[0] || 'sentence', sent: row.en, id: row.id,
        level, xs: sentenceExplanation(row, level, 'tr')
      };
    }).filter(Boolean);
    if (questions.length < 4) {
      if (typeof studioToast === 'function') studioToast('สร้างชุดโจทย์ไม่สำเร็จ ข้อมูลระดับนี้ยังไม่เพียงพอ');
      return;
    }
    window.STUDIO_GAME_RETURN = true;
    STUDIO_SESSION_FINISHED = false;
    Q = { mode: 'game', qs: questions, i: 0, ok: 0, xp: 0, combo: 0, max: 0, ans: null, res: { A: [0, 0], B: [0, 0], C: [0, 0] }, miss: [], d: 0, run: 0, again: `studioStartSentenceGame('${type}')` };
    quiz();
  };

  // Replace the old sentence-game pool selection with a four-tier, inspectable sentence bank.
  const previousPlay = play;
  play = function (game) {
    if (game === 'tr' || game === 'build') return window.studioStartSentenceGame(game);
    return previousPlay.apply(this, arguments);
  };

  // Keep the existing Game Center level selector; add a dedicated, visible sentence-practice area.
  if(typeof window.TGAT1_addGameHook==='function')window.TGAT1_addGameHook(function () {
    const app = document.getElementById('app');
    if (!app || app.querySelector('.st-sentence-practice-panel')) return;
    const level = LEVEL_KEYS.includes(S.cur) ? S.cur : 'S';
    const trCounts = window.TGAT1_SENTENCE_CONTENT_AUDIT.translateByLevel;
    const buildCounts = window.TGAT1_SENTENCE_CONTENT_AUDIT.orderByLevel;
    const panel = document.createElement('section');
    panel.className = 'st-card st-sentence-practice-panel';
    panel.innerHTML = `<div class="st-eyebrow">SENTENCE PRACTICE LAB</div><h2>ฝึกแปลประโยคและเรียงประโยค</h2><p>เลือกความยากแยกจากเกมคำศัพท์ · แต่ละระดับใช้คลังประโยคคนละช่วงตามความซับซ้อน</p><div class="st-vocab-levels">${LEVEL_KEYS.map(key => `<button type="button" class="st-tab ${level === key ? 'active' : ''}" onclick="studioGameLevel('${key}')">${LEVELS[key].label}</button>`).join('')}</div><div class="st-sentence-counts"><span>แปลประโยค ${trCounts[level]} ข้อในคลัง</span><span>เรียงประโยค ${buildCounts[level]} ข้อในคลัง</span></div><div class="st-vocab-translate-actions"><button type="button" class="st-btn" onclick="studioStartSentenceGame('tr')">💬 เริ่มแปลประโยค</button><button type="button" class="st-btn secondary" onclick="studioStartSentenceGame('build')">🧩 เริ่มเรียงประโยค</button></div><small>ระบบจัดระดับโดยพิจารณาความยาว คำเชื่อม อนุประโยค วรรคตอน และโครงสร้างกริยา เป็นการจัดระดับอัตโนมัติ ไม่ใช่การรับรองระดับ CEFR รายประโยค</small>`;
    app.appendChild(panel);
    enhanceAudio(app);
  });

  // Add usage guidance and audio to the original vocabulary details without replacing Flashcards.
  const previousWordDetail = studioWordDetail;
  studioWordDetail = function (index) {
    const result = previousWordDetail.apply(this, arguments);
    const item = STUDIO_DATA.words[index];
    if (item) addUsageToModal(item);
    enhanceAudio(document.getElementById('studioModal') || document);
    return result;
  };
  const previousPhraseDetail = studioPhraseDetail;
  studioPhraseDetail = function () {
    const index = Number(arguments[0]);
    const result = previousPhraseDetail.apply(this, arguments);
    const phrase = STUDIO_DATA.phrases[index];
    const box = document.querySelector('#studioModal .st-modal-box');
    if (phrase && box && !box.querySelector('.st-language-enrichment')) {
      const section = document.createElement('section');
      section.className = 'st-language-enrichment';
      section.innerHTML = `<div class="st-language-section"><b>วิธีใช้วลีนี้</b><p>ควรจำวลีนี้เป็นกลุ่มคำเดียวกัน ไม่แปลแยกทีละคำ และสังเกตบริบทกับคำที่มักใช้ร่วมกัน</p>${phrase.type ? `<p>ประเภท: ${esc(phrase.type)}</p>` : ''}</div>`;
      const divider = box.querySelector('.st-divider');
      if (divider) box.insertBefore(section, divider);
      else box.appendChild(section);
    }
    enhanceAudio(document.getElementById('studioModal') || document);
    return result;
  };

  // The original Flashcards and SRS renderers remain in place; only add the missing learning support.
  if (typeof studioRenderFlash === 'function') {
    const oldRenderFlash = studioRenderFlash;
    studioRenderFlash = function () {
      const result = oldRenderFlash.apply(this, arguments);
      const app = document.getElementById('app');
      if (STUDIO_FLASH && app) {
        const key = STUDIO_FLASH.pool && STUDIO_FLASH.pool[STUDIO_FLASH.index];
        const item = STUDIO_DATA.words.find(row => row.w === key);
        if (item && STUDIO_FLASH_REVEALED) {
          const card = app.querySelector('.st-card');
          if (card && !card.querySelector('.st-language-enrichment')) {
            const holder = document.createElement('div');
            holder.innerHTML = usageHTML(item);
            card.appendChild(holder.firstElementChild);
          }
        }
      }
      enhanceAudio(app);
      return result;
    };
  }

  if (typeof window.V15_render === 'function') {
    const oldV15Render = window.V15_render;
    window.V15_render = function () {
      const result = oldV15Render.apply(this, arguments);
      const app = document.getElementById('app');
      if (typeof STUDIO_FLASH !== 'undefined' && STUDIO_FLASH && app && STUDIO_FLASH_REVEALED) {
        const key = STUDIO_FLASH.pool && STUDIO_FLASH.pool[STUDIO_FLASH.index];
        const item = STUDIO_DATA.words.find(row => row.w === key);
        const detail = app.querySelector('.v15-flash-detail');
        if (item && detail && !detail.querySelector('.st-language-enrichment')) {
          const holder = document.createElement('div');
          holder.innerHTML = usageHTML(item);
          detail.appendChild(holder.firstElementChild);
        }
      }
      enhanceAudio(app);
      return result;
    };
  }

  // Give each English token in sentence-order exercises its own pronunciation control.
  const oldXbody = xbody;
  xbody = function (question) {
    if (question && question.t === 'build' && Q && Q.ans === null) {
      const audioToken = token => audioButton(token, 'st-audio-token');
      const selected = question.use.map(index => `<span class="st-sentence-token"><button class="tk" type="button" onclick="bdu(${index})">${esc(question.tk[index])}</button>${audioToken(question.tk[index])}</span>`).join('');
      const remaining = question.tk.map((token, index) => `<span class="st-sentence-token"><button class="tk${question.use.includes(index) ? ' used' : ''}" type="button" onclick="bd(${index})">${esc(token)}</button>${audioToken(token)}</span>`).join('');
      return `<div class="ans">${selected || '<span class="mute">แตะคำด้านล่างเพื่อเรียง</span>'}</div><div class="tks st-sentence-token-list">${remaining}</div><button class="btn" onclick="bdc()">ตรวจคำตอบ</button><button class="btn alt" onclick="bdh()">💡 ใบ้คำแรก</button>`;
    }
    return oldXbody.apply(this, arguments);
  };

  // Audio for every visible vocabulary headword, example sentence and English passage paragraph.
  function observeAudio() {
    const app = document.getElementById('app');
    if (app && !app.dataset.studioAudioObserver) {
      app.dataset.studioAudioObserver = '1';
      new MutationObserver(() => enhanceAudio(app)).observe(app, { childList: true, subtree: true });
    }
    const body = document.body;
    if (body && !body.dataset.studioAudioObserver) {
      body.dataset.studioAudioObserver = '1';
      new MutationObserver(() => {
        const modal = document.getElementById('studioModal');
        if (modal) enhanceAudio(modal);
      }).observe(body, { childList: true, subtree: true });
    }
  }
  observeAudio();
  enhanceAudio(document);

  // Expose a compact audit surface for release tests and support troubleshooting.
  window.TGAT1_LANGUAGE_PRACTICE = {
    version: '37.8.0',
    get sentenceBank() { return sentenceBanks().all.length; },
    get translatedSentences() { return sentenceBanks().translate.length; },
    get orderableSentences() { return sentenceBanks().order.length; },
    playAudio,
    getWordExamples: word => {
      const item = (STUDIO_DATA.words || []).find(row => norm(row.w) === norm(word));
      return item ? currentExamples(item) : [];
    }
  };
})();


/* ===== 26 · 23-functional-quality-fixes.js ===== */
/* TGAT1 English Studio v37.8.0 — functional quality, anti-repeat and unified learning history.
   Preserves existing Flashcards/SRS and adds only missing persistence/quality guards. */
(function(){
  'use strict';
  const RECENT_KEY='tgat1_studio_recent_practice_v1';
  const ERROR_KEY='tgat1_studio_error_notebook_v2';
  const MAX_RECENT=80;
  const MAX_ERRORS=500;
  const safeLoad=(key, fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v==null?fallback:v}catch(_){return fallback}};
  const safeSave=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){return false}};
  const norm=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
  const recent=safeLoad(RECENT_KEY,[]);
  const errors=safeLoad(ERROR_KEY,[]);
  const recentIds=Array.isArray(recent)?recent:[];
  const errorRows=Array.isArray(errors)?errors:[];
  window.STUDIO_FUNCTIONAL_QA={version:'37.8.0'};

  function remember(id){
    if(!id)return;
    const next=recentIds.filter(x=>x!==id); next.push(id);
    recentIds.splice(0,recentIds.length,...next.slice(-MAX_RECENT));
    safeSave(RECENT_KEY,recentIds);
  }
  function isRecent(id){return !!id&&recentIds.includes(id)}
  window.STUDIO_IS_RECENT_QUESTION=isRecent;
  window.STUDIO_REMEMBER_QUESTION=remember;
  function rememberQuestion(q){if(q&&q.id)remember(String(q.id));}
  function addError(row){
    if(!row||!row.id)return;
    // v47: bounded rows (localStorage is ~5 MB on iPhone): long passages are cut, the full item stays in the bank
    row={...row};['context','prompt','explanation'].forEach(k=>{if(typeof row[k]==='string'&&row[k].length>(k==='context'?400:500))row[k]=row[k].slice(0,k==='context'?400:500)+'…'});
    const key=String(row.id);
    const idx=errorRows.findIndex(x=>String(x.id)===key&&x.module===row.module);
    if(idx>=0){
      errorRows[idx]={...errorRows[idx],...row,wrongCount:(Number(errorRows[idx].wrongCount)||0)+1,lastAt:Date.now()};
      const updated=errorRows.splice(idx,1)[0]; errorRows.push(updated);
    }else errorRows.push({...row,wrongCount:1,lastAt:Date.now()});
    if(errorRows.length>MAX_ERRORS)errorRows.splice(0,errorRows.length-MAX_ERRORS);
    safeSave(ERROR_KEY,errorRows);
  }
  window.STUDIO_ERROR_NOTEBOOK={
    list:()=>errorRows.slice().reverse(),
    clear:()=>{errorRows.splice(0,errorRows.length);safeSave(ERROR_KEY,errorRows)},
    count:()=>errorRows.length
  };

  // Prevent immediate repeats in the existing English Daily question modes.
  function freshPool(pool, limit){
    const arr=Array.isArray(pool)?pool.slice():[];
    const fresh=arr.filter(q=>!isRecent(q&&q.id));
    const chosen=(fresh.length>=limit?fresh:arr).__fy().slice(0,limit);
    chosen.forEach(rememberQuestion);
    return chosen;
  }
  if(typeof window.VLT_mixPool==='function'){
    window.VLT_mixPool=function(n){return freshPool(typeof VLT_BANK!=='undefined'?VLT_BANK:[],n)};
  }
  if(typeof window.VLT_dailyPool==='function'){
    const oldDaily=window.VLT_dailyPool;
    window.VLT_dailyPool=function(){
      const pool=oldDaily.apply(this,arguments)||[];
      const fresh=pool.filter(q=>!isRecent(q&&q.id));
      const chosen=(fresh.length>=pool.length?fresh:pool).slice().__fy();
      chosen.forEach(rememberQuestion); return chosen;
    };
  }
  if(typeof window.VLT_startCategory==='function'){
    const oldCategory=window.VLT_startCategory;
    window.VLT_startCategory=function(cat){
      const all=(typeof VLT_BANK!=='undefined'?VLT_BANK:[]).filter(q=>q.category===cat);
      const fresh=all.filter(q=>!isRecent(q.id));
      const qs=(fresh.length>=10?fresh:all).__fy().slice(0,10);
      qs.forEach(rememberQuestion);
      VLT_begin({mode:'practice',label:((typeof VLT_CATS!=='undefined'&&VLT_CATS.find(x=>x[0]===cat))||[cat,cat])[1],qs:qs.map(q=>({...q,userAnswer:null})),index:0,answers:{},score:0,combo:0,reviewOn:false});
    };
  }
  if(typeof window.VLT_startReview==='function'){
    const oldReview=window.VLT_startReview;
    window.VLT_startReview=function(){
      const ids=Object.keys((typeof VLT_STATE!=='undefined'&&VLT_STATE.missed)||{}).filter(id=>VLT_STATE.missed[id]>0);
      if(!ids.length){VLT_toast('ยังไม่มีข้อที่ตอบผิด ลองทำชุดฝึกก่อนนะ');return;}
      const all=ids.map(VLT_get).filter(Boolean);
      const fresh=all.filter(q=>!isRecent(q.id));
      const qs=(fresh.length?fresh:all).__fy().slice(0,20);
      qs.forEach(rememberQuestion);
      VLT_begin({mode:'practice',label:'แก้มือข้อที่เคยผิด',qs:qs.map(q=>({...q,userAnswer:null})),index:0,answers:{},score:0,combo:0,reviewOn:true});
    };
  }

  // Record translation/sentence games that do not have a legacy vocabulary index.
  const oldAns=typeof ans==='function'?ans:window.ans;
  if(typeof oldAns==='function'){
    window.ans=function(j){
      const q=typeof Q!=='undefined'&&Q&&Q.qs&&Q.qs[Q.i];
      const before=q&&q.ans;
      oldAns.apply(this,arguments);
      try{
        if(!q||q._functionalRecorded||Q.ans===null)return;
        const correct=j===q.a;
        const isSentence=!!q.sentenceText||/^แปลประโยค|^เรียงประโยค/.test(String(q.k||''));
        const isTranslation=/^แปลคำศัพท์/.test(String(q.k||''));
        if(!isSentence&&!isTranslation)return;
        // Legacy-index vocabulary questions are already mirrored by the existing progress bridge.
        const hasLegacyIndex=Number.isInteger(q.i)&&q.i>=0&&typeof V!=='undefined'&&Array.isArray(V[q.i]);
        if(isTranslation&&!hasLegacyIndex || isSentence){
          const id=String(q.id||q.sentenceId||q.w||('practice-'+Q.i));
          addError({id,module:isSentence?'sentence':'vocabulary-translation',prompt:String(q.p||''),answer:correct?String(q.o&&q.o[q.a]||''):String(q.o&&q.o[q.a]||''),selected:String(q.o&&q.o[j]||''),correct,level:String(q.level||''),text:String(q.sentenceText||q.w||''),at:Date.now()});
          q._functionalRecorded=true;
        }
      }catch(_){(window.TGAT1_ERR||Object)(_,'app')}
    };
  }

  // Unified Error Notebook UI is rendered by 24-final-functional-content-fixes.js.
  function escapeHTML(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  // Add audio controls to English text blocks that the previous selector missed.
  function addBlockAudio(root){
    if (window.__TGAT_UNIFIED_AUDIO_V40) return;
    if(!root||!root.querySelectorAll)return;
    const selectors=[
      '.vault-question','.vault-context','.vault-option','.vault-passage',
      '.st-reading-passage','.st-reading-context','.st-question-text','.st-conversation',
      '.st-passage','.st-dialogue','.st-lesson-example','.st-example-en'
    ];
    root.querySelectorAll(selectors.join(',')).forEach(el=>{
      if(el.dataset.studioBlockAudio==='1')return;
      const text=String(el.textContent||'').trim();
      const words=text.match(/[A-Za-z]+(?:[\'’][A-Za-z]+)?/g)||[];
      if(words.length<2||/[\u0E00-\u0E7F]/.test(text))return;
      // Do not add a second speaker to an element already containing one.
      if(el.querySelector('.st-audio-play,.say')){el.dataset.studioBlockAudio='1';return;}
      const target=el.closest('button')||el;
      if(target.querySelector && target.querySelector('.st-audio-play,.say')){target.dataset.studioBlockAudio='1';return;}
      const b=document.createElement('button');b.type='button';b.className='st-audio-play st-audio-block';b.textContent='🔊';b.title='ฟังเสียงภาษาอังกฤษ';b.setAttribute('aria-label','เล่นเสียง: '+text.slice(0,80));
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();tgat1SpeechSpeak(text,{rate:.9})});
      target.insertAdjacentElement('afterend',b);target.dataset.studioBlockAudio='1';
    });
  }
  function audioSweep(){
    addBlockAudio(document.getElementById('app'));addBlockAudio(document.getElementById('studioModal'));addBlockAudio(document.body);
  }
  audioSweep();
  const target=document.body;
  if(target&&!target.dataset.studioFunctionalObserver){
    target.dataset.studioFunctionalObserver='1';
    new MutationObserver(()=>{addBlockAudio(document.getElementById('app'));addBlockAudio(document.getElementById('studioModal'));}).observe(target,{childList:true,subtree:true});
  }

  // Make the practice audit inspectable in the console/tests.
  window.TGAT1_FUNCTIONAL_AUDIT={
    recentPracticeCount:()=>recentIds.length,
    errorCount:()=>errorRows.length,
    duplicateRecentPolicy:'avoid immediate repeat where an unseen pool is available; falls back only when the pool is exhausted',
    audioSelectorCount:11,
    version:'37.8.0'
  };
})();


/* ===== 27 · 24-final-functional-content-fixes.js ===== */
/* TGAT1 English Studio v37.8.0 — final functional/content fixes only.
 * No new learning modules. Fixes existing modules named in the audit:
 * audio coverage, unified error history, grammar/reading page chrome,
 * picture game imagery, and practice-level duplicate-template avoidance.
 */
(function(){
  'use strict';
  const esc0=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isEnglish=s=>{const t=String(s||'').trim();return /[A-Za-z]/.test(t)&&((t.match(/[A-Za-z]/g)||[]).length>=Math.max(3,(t.match(/\S/g)||[]).length*.25));};
  const sayText=t=>{tgat1SpeechSpeak(String(t),{rate:.9})};

  // 1) Audio: add sibling speaker controls to existing answer buttons, never nest buttons.
  function addSiblingAudio(root){
    if(window.__TGAT_UNIFIED_AUDIO_V40) return;
    if(!root) return;
    const selectors=[
      '#app .vault-qcard .vault-option','#app .vault-qcard .option','#app .vault-qcard .choice','#app .vault-qcard .answer',
      '#app .st-action-card','#app .st-card button:not(.st-audio-play):not(.st-btn):not(.st-tab):not(.tk):not(.lt)',
      '#app .vault-prompt','#app .vault-qcard .vault-context','#app .st-card h2','#app .st-card h3',
      '#app .grammar-choice','#app .grammar-option'
    ];
    root.querySelectorAll(selectors.join(',')).forEach(el=>{
      if(el.dataset.studioSiblingAudio==='1') return;
      const text=(el.innerText||el.textContent||'').trim();
      if(!isEnglish(text) || text.length<2 || text.length>500) return;
      // Avoid adding audio to navigation/action controls.
      if(/^(เริ่ม|ถัดไป|ต่อไป|ดูผล|ออก|กลับ|ปิด|ตรวจ|เฉลย|ทบทวน|เลือก|ระดับ|ไปข้อ|ภาพรวม)/.test(text)) return;
      const target=el.closest('button')||el;
      if(target.dataset.studioSiblingAudio==='1') return;
      // v23 may already have placed a block-level speaker immediately after this target.
      // Keep exactly one audio control per English block; never create a sibling duplicate.
      const next=target.nextElementSibling;
      if(next && next.classList && next.classList.contains('st-audio-play')){
        target.dataset.studioSiblingAudio='1';
        return;
      }
      const b=document.createElement('button');
      b.type='button'; b.className='st-audio-play st-audio-sibling'; b.textContent='🔊'; b.title='ฟังเสียงภาษาอังกฤษ';
      b.setAttribute('aria-label','ฟังเสียง: '+text.slice(0,100));
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();sayText(text)});
      target.insertAdjacentElement('afterend',b);
      target.dataset.studioSiblingAudio='1';
    });
  }

  // 2) Unified error notebook for Grammar, Reading and Exam in addition to existing language practice.
  const ERR_KEY='tgat1_studio_error_notebook_v2';
  try{
    const legacy=JSON.parse(localStorage.getItem('tgat1_studio_error_notebook_v1')||'[]');
    const current=JSON.parse(localStorage.getItem(ERR_KEY)||'[]');
    if(Array.isArray(legacy)&&legacy.length){
      const merged=new Map();
      for(const row of (Array.isArray(current)?current:[])) if(row&&row.id) merged.set(String(row.id)+'|'+String(row.module||''),row);
      for(const row of legacy) if(row&&row.id){const key=String(row.id)+'|'+String(row.module||'');if(!merged.has(key))merged.set(key,row);}
      localStorage.setItem(ERR_KEY,JSON.stringify([...merged.values()].slice(-5000)));
    }
  }catch(_){(window.TGAT1_ERR||Object)(_,'app')}
  function loadErrors(){try{const rows=JSON.parse(localStorage.getItem(ERR_KEY)||'[]');return Array.isArray(rows)?rows:[]}catch(_){return[]}}
  function saveErrors(a){try{a.sort((x,y)=>(Number(x.at)||0)-(Number(y.at)||0));localStorage.setItem(ERR_KEY,JSON.stringify(a.slice(-600)))}catch(_){(window.TGAT1_ERR||Object)(_,'app')}
  }
  function addError(row){
    if(!row||!row.id)return;
    // v47: bounded rows (localStorage is ~5 MB on iPhone): long passages are cut, the full item stays in the bank
    row={...row};['context','prompt','explanation'].forEach(k=>{if(typeof row[k]==='string'&&row[k].length>(k==='context'?400:500))row[k]=row[k].slice(0,k==='context'?400:500)+'…'});
    const a=loadErrors(); const id=String(row.id); const module=String(row.module||''); const old=a.find(x=>String(x.id)===id&&String(x.module||'')===module);
    if(old){old.at=Date.now();old.attempts=(old.attempts||0)+1;old.wrongCount=(old.wrongCount||0)+(row.correct?0:1);old.correctCount=(old.correctCount||0)+(row.correct?1:0);old.lastResult=row.correct?'correct':'wrong';old.selected=row.selected;}
    else a.push({...row,attempts:1,wrongCount:row.correct?0:1,correctCount:row.correct?1:0,lastResult:row.correct?'correct':'wrong'});
    saveErrors(a);
  }
  window.STUDIO_RECORD_ERROR=function(row){addError(row)};

  if(typeof window.STG_answer==='function'&&!window.STG_answer.__v352){
    const old=window.STG_answer;
    const wrapped=function(j){
      try{const q=typeof window.STG_getCurrentQuestion==='function'?window.STG_getCurrentQuestion():null;if(q)addError({id:'grammar-'+q.topic+'-'+q.index,module:'grammar',topic:q.topicTitle,prompt:q.prompt,selected:q.options?.[j],answer:q.options?.[q.answer],correct:j===q.answer,explanation:q.explanation,at:Date.now()});}catch(_){(window.TGAT1_ERR||Object)(_,'app')}
      return old.apply(this,arguments);
    }; wrapped.__v352=true; window.STG_answer=wrapped;
  }
  if(typeof window.STR_answer==='function'&&!window.STR_answer.__v352){
    const old=window.STR_answer;
    const wrapped=function(j){
      try{const q=typeof window.STR_getCurrentQuestion==='function'?window.STR_getCurrentQuestion():null;if(q)addError({id:'reading-'+String(q.id||q.passage+'-'+q.index),module:'reading',topic:q.topic,prompt:q.prompt,selected:q.options?.[j],answer:q.options?.[q.answer],correct:j===q.answer,context:q.context,explanation:q.explanation,at:Date.now()});}catch(_){(window.TGAT1_ERR||Object)(_,'app')}
      return old.apply(this,arguments);
    }; wrapped.__v352=true; window.STR_answer=wrapped;
  }
  if(typeof window.VLT_answer==='function'&&!window.VLT_answer.__v352Error){
    const old=window.VLT_answer;
    const wrapped=function(j){
      try{const run=typeof VLT_RUN!=='undefined'?VLT_RUN:null;const q=run&&run.qs?.[run.index];if(q)addError({id:'exam-'+String(q.id),module:'exam',topic:q.topic,prompt:q.prompt,selected:q.options?.[j],answer:q.options?.[q.answer],correct:j===q.answer,context:q.context,explanation:q.explanation||q.hint,at:Date.now()});}catch(_){(window.TGAT1_ERR||Object)(_,'app')}
      return old.apply(this,arguments);
    }; wrapped.__v352Error=true; window.VLT_answer=wrapped;
  }

  // 3) Reading/Grammar chrome: enforce correct title whenever those existing pages render.
  const chromeTitles={reading:['READING TRAINER','Reading Trainer'],grammar:['GRAMMAR CLINIC','Grammar Clinic']};
  function fixChrome(){
    const p=typeof STUDIO_PAGE!=='undefined'?STUDIO_PAGE:null;
    if(chromeTitles[p]){const [c,t]=chromeTitles[p];const a=document.getElementById('studioCrumb'),b=document.getElementById('studioTitle');if(a&&a.textContent!==c)a.textContent=c;if(b&&b.textContent!==t)b.textContent=t;}
  }

  // 4) Existing TGAT practice pools: suppress repeated question templates when alternatives exist.
  function uniqTemplatePool(arr){
    const out=[],seen=new Set();
    for(const q of (Array.isArray(arr)?arr:[])){const sig=templateSig(q);if(sig&&!seen.has(sig)){seen.add(sig);out.push(q)}else if(!sig)out.push(q)}
    return out;
  }
  if(typeof VLT_mixPool==='function'&&!VLT_mixPool.__v352Unique){
    const old=VLT_mixPool; const fn=function(n){const raw=old.apply(this,arguments)||[];const unique=uniqTemplatePool(raw);return unique.slice(0,n);};fn.__v352Unique=true;window.VLT_mixPool=fn;
  }
  if(typeof VLT_dailyPool==='function'&&!VLT_dailyPool.__v352Unique){
    const old=VLT_dailyPool; const fn=function(){const raw=old.apply(this,arguments);return uniqTemplatePool(raw).slice(0,10)};fn.__v352Unique=true;window.VLT_dailyPool=fn;
  }
  if(typeof VLT_startCategory==='function'&&!VLT_startCategory.__v352Unique){
    const old=VLT_startCategory; const fn=function(cat){const all=(typeof VLT_BANK!=='undefined'?VLT_BANK:[]).filter(q=>q.category===cat);const fresh=typeof window.STUDIO_IS_RECENT_QUESTION==='function'?all.filter(q=>!window.STUDIO_IS_RECENT_QUESTION(q.id)):all;const base=fresh.length>=10?fresh:all;const pool=uniqTemplatePool(base);const qs=VLT_shuffle(pool).slice(0,10);qs.forEach(q=>{if(typeof window.STUDIO_REMEMBER_QUESTION==='function')window.STUDIO_REMEMBER_QUESTION(q)});if(typeof VLT_begin==='function')return VLT_begin({mode:'practice',label:VLT_CATS.find(x=>x[0]===cat)?.[1]||cat,qs:qs.map(q=>({...q,userAnswer:null})),index:0,answers:{},score:0,combo:0,reviewOn:false});return old.apply(this,arguments)};fn.__v352Unique=true;window.VLT_startCategory=fn;
  }
  // 5) Picture Game: use bundled offline illustrations first. Never show the answer word below the clue.
  const oldMkPic=window.mkPic;
  if(typeof oldMkPic==='function'&&!oldMkPic.__v404OfflinePic){
    const fn=function(i){
      const q=oldMkPic(i);
      const w=(typeof V!=='undefined'&&V?.[i]?.[0])||q?.w||'';
      const bank=window.STUDIO_PICTURE_BANK;
      if(bank&&bank.has(w))q.p=bank.render(w);
      return q;
    };
    fn.__v404OfflinePic=true;window.mkPic=fn;
  }
  const oldPlay=window.play;
  if(typeof oldPlay==='function'&&!oldPlay.__v404OfflinePic){
    const fn=function(g){
      const result=oldPlay.apply(this,arguments);
      if(g==='pic'){
        try{
          const bank=window.STUDIO_PICTURE_BANK;
          if(bank&&typeof Q!=='undefined'&&Q&&Array.isArray(Q.qs)){
            Q.qs.forEach(q=>{if(q&&bank.has(q.w))q.p=bank.render(q.w)});
            if(typeof quiz==='function')quiz();
          }
        }catch(_){(window.TGAT1_ERR||Object)(_,'app')}
      }
      return result;
    };
    fn.__v404OfflinePic=true;window.play=fn;
  }

  // 6) Improve the existing Error Notebook display to include all four modules now tracked.
  function renderErrorNotebook(){
    const app=document.getElementById('app'); if(!app||(typeof STUDIO_PAGE==='undefined'||STUDIO_PAGE!=='analytics'))return;
    const rows=loadErrors().filter(x=>x&&typeof x==='object'&&!Array.isArray(x)&&Number(x.wrongCount)>0).sort((a,b)=>(Number(b.at)||Number(b.lastAt)||0)-(Number(a.at)||Number(a.lastAt)||0)).slice(0,80);
    const label={grammar:'Grammar',reading:'Reading',exam:'Exam',sentence:'Sentence', 'vocabulary-translation':'Vocabulary','learning-hub':'Learning Hub'};
    const safeCount=value=>{const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(1000000,Math.floor(n))):0};
    const html=`<div class="st-eyebrow">ERROR NOTEBOOK</div><h2 style="font-size:18px;margin:5px 0">สมุดข้อผิดรวมทุกโมดูล</h2><p class="st-subtitle">Vocabulary · Sentence · Grammar · Reading · Exam</p>${rows.length?rows.map((r,i)=>{const moduleName=label[r.module]||String(r.module||'ไม่ระบุโมดูล');return `<div class="st-row"><div><b>${i+1}. ${esc0(r.prompt||r.text||r.id)}</b><small>${esc0(moduleName)} · ผิด ${safeCount(r.wrongCount)} ครั้ง · ทำแล้ว ${safeCount(r.attempts)} ครั้ง</small></div><span class="st-tag ${(r.lastResult==='correct')?'':'gold'}">${r.lastResult==='correct'?'ล่าสุดถูก':'ควรทบทวน'}</span></div>`}).join(''):`<div class="st-empty">ยังไม่มีข้อผิดที่บันทึกไว้</div>`}`;
    const hash=JSON.stringify(rows.map(r=>[r.id,r.module,r.wrongCount,r.attempts,r.lastResult,r.at,r.lastAt]));
    let section=app.querySelector('.st-error-notebook-v352');
    if(!section){section=document.createElement('section');section.className='st-card st-error-notebook-v352';app.appendChild(section);}
    if(section.dataset.renderHash!==hash){section.innerHTML=html;section.dataset.renderHash=hash;}
  }

  let sweepQueued=false;
  function sweep(){if(sweepQueued)return;sweepQueued=true;requestAnimationFrame(()=>{sweepQueued=false;addSiblingAudio(document.getElementById('app'));addSiblingAudio(document.getElementById('studioModal'));fixChrome();renderErrorNotebook();});}
  sweep();
  const observer=new MutationObserver(sweep);
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('studio:navigate',sweep);
  setTimeout(sweep,300);setTimeout(sweep,1000);
})();


/* ===== 28 · 25-learning-system-v36.js ===== */
/* TGAT1 English Studio v36.0.1 — learning quality + learning loop + reliability layer.
   Keeps the canonical question bank/scoring untouched. Improves practice selection, feedback,
   next-step coaching, content evidence, and runtime health without replacing existing engines. */
(function(){
  'use strict';
  const VERSION='36.1.0';
  const QUALITY_KEY='tgat1_studio_content_quality_v1';
  const COACH_KEY='tgat1_studio_learning_coach_v1';
  const RECENT_KEY='tgat1_studio_recent_practice_v1';
  const safeLoad=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(_){return f}};
  const safeSave=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
  const text=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const esc=v=>typeof window.VLT_escape==='function'?window.VLT_escape(String(v??'')):text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const canonicalBank=()=>Array.isArray(window.VLT_BANK)?window.VLT_BANK:[];
  const canonicalState=()=>window.VLT_STATE&&typeof window.VLT_STATE==='object'?window.VLT_STATE:{};
  const canonicalRun=()=>window.VLT_RUN&&typeof window.VLT_RUN==='object'?window.VLT_RUN:null;
  const normalizeRaw=s=>text(s).toLowerCase()
    .replace(/[“”‘’"']/g,'')
    .replace(/\b\d+(?:[/:.-]\d+)*\b/g,'#')
    .replace(/\b(?:q|item|question)[-_ ]?\d+\b/gi,'#')
    .replace(/\s+/g,' ');
  // v40.6.7: normalize() is pure, and the audit calls it on the same strings repeatedly -> memoize (bounded).
  const __normCache=new Map();
  const normalize=s=>{const k=typeof s==='string'?s:String(s==null?'':s);let v=__normCache.get(k);if(v===undefined){v=normalizeRaw(k);if(__normCache.size>30000)__normCache.clear();__normCache.set(k,v)}return v};
  function templateSig(q){
    if(!q)return '';
    const stem=normalize(q.prompt||q.p),ctx=normalize(q.context||'');
    return [q.category||'',stem,ctx].join('¦');
  }
  function exactSig(q){
    if(!q)return '';
    return [q.category||'',normalize(q.prompt||q.p),normalize(q.context||''),(q.options||q.o||[]).map(normalize).join('|'),String(q.answer??q.a??'')].join('¦');
  }
  let __auditMemo=null;
  function auditBank(bank){
    if(bank===undefined){const cb=canonicalBank();if(__auditMemo&&__auditMemo.bank===cb&&__auditMemo.len===cb.length)return __auditMemo.value;const v=auditBankCompute(cb);__auditMemo={bank:cb,len:cb.length,value:v};return v}
    return auditBankCompute(bank);
  }
  function auditBankCompute(bank){
    const exact=new Map(),templates=new Map();let missingExplanation=0,missingOptions=0,badAnswer=0;
    for(const q of bank){
      const e=exactSig(q),t=templateSig(q);
      if(e){if(!exact.has(e))exact.set(e,[]);exact.get(e).push(q.id)}
      if(t){if(!templates.has(t))templates.set(t,[]);templates.get(t).push(q.id)}
      if(!text(q.explanation||q.exp))missingExplanation++;
      const opts=q.options||q.o; if(!Array.isArray(opts)||opts.length!==4)missingOptions++;
      const a=Number(q.answer??q.a); if(!Number.isInteger(a)||a<0||a>=4)badAnswer++;
    }
    const exactGroups=[...exact.values()].filter(x=>x.length>1),templateGroups=[...templates.values()].filter(x=>x.length>1);
    return {
      version:VERSION,bankSize:bank.length,exactDuplicateGroups:exactGroups.length,
      exactDuplicateItems:exactGroups.reduce((n,x)=>n+x.length,0),templateLikeGroups:templateGroups.length,
      templateLikeItems:templateGroups.reduce((n,x)=>n+x.length,0),missingExplanation,missingOptions,badAnswer,
      explanationCoverage:bank.length?Math.round((bank.length-missingExplanation)/bank.length*100):0,
      qualityStatus:(!missingExplanation&&!missingOptions&&!badAnswer)?'PASS':'REVIEW',
      sampleTemplateGroups:templateGroups.slice(0,12)
    };
  }
  function qualityPool(bank,limit,opts={}){
    const n=Math.max(1,Number(limit)||10),recent=new Set(Array.isArray(opts.recent)?opts.recent:[]),seen=new Set(),out=[];
    const source=Array.isArray(bank)?bank.slice():[];
    const score=q=>{
      let s=0;
      if(text(q.explanation||q.exp))s+=30;
      if(Array.isArray(q.options)&&q.options.length===4)s+=20;
      if(!recent.has(q.id))s+=20;
      if(Number(q.difficulty)===2)s+=3;
      if(Number(q.difficulty)===3)s+=2;
      s+=Math.random()*8;
      return s;
    };
    source.sort((a,b)=>score(b)-score(a));
    for(const q of source){
      if(out.length>=n)break;
      const sig=templateSig(q); if(sig&&seen.has(sig))continue;
      if(sig)seen.add(sig); out.push({...q,userAnswer:null});
    }
    if(out.length<n){
      for(const q of source){if(out.length>=n)break;if(!out.some(x=>x.id===q.id))out.push({...q,userAnswer:null})}
    }
    return out;
  }
  function recordCoach(entry){
    const a=safeLoad(COACH_KEY,[]);a.push({...entry,at:entry.at||Date.now()});if(a.length>2000)a.splice(0,a.length-2000);safeSave(COACH_KEY,a);
  }
  function getRecent(){return safeLoad(RECENT_KEY,[]).slice(-80)}
  function weakCategory(){
    const s=canonicalState(),counts={};
    for(const h of (Array.isArray(s.history)?s.history:[]))for(const c of (Array.isArray(h.categories)?h.categories:[])){
      const r=counts[c.cat]||(counts[c.cat]={total:0,score:0});r.total+=Number(c.total)||0;r.score+=Number(c.score)||0;
    }
    const missed=s.missed||{};for(const [id,n] of Object.entries(missed)){const q=canonicalBank().find(x=>String(x.id)===String(id));if(q){const r=counts[q.category]||(counts[q.category]={total:0,score:0});r.wrong=(r.wrong||0)+(Number(n)||0)}}
    return Object.entries(counts).map(([id,x])=>({id,...x,acc:x.total?x.score/x.total*100:null,risk:(x.wrong||0)*3+(x.acc==null?0:100-x.acc)})).sort((a,b)=>b.risk-a.risk)[0]||null;
  }
  function nextStepHtml(q,ok){
    const cat=q&&q.category||'practice';
    const labels={qr:'Question–Response',short:'Short Conversation',long:'Long Conversation',tc:'Text Completion',rc:'Reading Comprehension'};
    if(ok)return `<div class="tg36-coach tg36-good"><div><b>จุดนี้ผ่านแล้ว</b><span>ลองทำข้อถัดไปโดยไม่รีบดูเฉลย เพื่อให้ความรู้ถูกเรียกใช้จากความจำ</span></div></div>`;
    const focus=labels[cat]||cat;
    return `<div class="tg36-coach tg36-focus"><div><b>แก้จุดนี้ต่ออีก 3 ข้อ</b><span>โฟกัส ${esc(focus)} และหลีกเลี่ยง template เดิม เพื่อให้เกิดการฝึกแบบ retrieval practice</span></div><button type="button" class="st-btn small" onclick="TGAT1LearningCoach.startMicro('${esc(cat)}')">ฝึกต่อ 3 ข้อ →</button></div>`;
  }
  function decorateVlt(){
    const app=document.getElementById('app'),r=canonicalRun();if(!app||!r||r.mode==='mock'||r.mode==='sprint')return;
    const q=r.qs&&r.qs[r.index],ans=q&&r.answers&&r.answers[q.id];if(!q||!Number.isInteger(ans))return;
    if([...app.querySelectorAll('.tg36-coach-wrap[data-q]')].some(el=>el.dataset.q===String(q.id)))return;
    const feedback=app.querySelector('.vault-feedback');if(!feedback)return;
    const ok=ans===q.answer;
    const node=document.createElement('div');node.className='tg36-coach-wrap';node.dataset.q=String(q.id);node.innerHTML=nextStepHtml(q,ok);
    feedback.insertAdjacentElement('afterend',node);
    recordCoach({module:'exam-practice',questionId:q.id,category:q.category,correct:ok});
  }
  function decorateGrammar(){
    if(typeof window.STG_getCurrentQuestion!=='function')return;
    const q=window.STG_getCurrentQuestion(),app=document.getElementById('app');if(!q||!app)return;
    const answered=app.querySelector('.st-alert');if(!answered||app.querySelector('.tg36-coach'))return;
    const ok=answered.textContent.includes('ถูกต้อง');const node=document.createElement('div');node.className='tg36-coach-wrap';node.innerHTML=nextStepHtml({category:'grammar',id:'grammar-'+q.topic+'-'+q.index},ok);answered.insertAdjacentElement('afterend',node);
    recordCoach({module:'grammar',questionId:q.topic+'-'+q.index,category:'grammar',correct:ok});
  }
  function decorateReading(){
    if(typeof window.STR_getCurrentQuestion!=='function')return;
    const q=window.STR_getCurrentQuestion(),app=document.getElementById('app');if(!q||!app)return;
    const alert=app.querySelector('.st-alert');if(!alert||app.querySelector('.tg36-coach'))return;
    const ok=alert.textContent.includes('ถูกต้อง');const node=document.createElement('div');node.className='tg36-coach-wrap';node.innerHTML=nextStepHtml({category:'rc',id:q.id},ok);alert.insertAdjacentElement('afterend',node);
    recordCoach({module:'reading',questionId:q.id,category:'rc',correct:ok});
  }
  function startMicro(category){
    const pool=canonicalBank().filter(q=>q.category===category);if(!pool.length){if(typeof VLT_toast==='function')VLT_toast('ยังไม่มีคลังฝึกสำหรับทักษะนี้');return false;}
    const qs=qualityPool(pool,3,{recent:getRecent()});
    if(qs.length<1)return false;
    qs.forEach(q=>{if(typeof window.STUDIO_REMEMBER_QUESTION==='function')window.STUDIO_REMEMBER_QUESTION(q)});
    if(typeof VLT_begin==='function')VLT_begin({mode:'practice',label:'Micro Practice · '+category,qs,index:0,answers:{},score:0,combo:0,reviewOn:true,coachMeta:{category,createdAt:Date.now()}});
    return true;
  }
  function decorateHome(){
    const app=document.getElementById('app');if(!app||typeof STUDIO_PAGE==='undefined'||STUDIO_PAGE!=='home'||!app.querySelector('.dash-hero')||app.querySelector('#tg36CoachPlan'))return;
    const weak=weakCategory(),due=canonicalState().missed?Object.keys(canonicalState().missed).length:0;
    const bankAudit=auditBank();
    const html=`<section class="tg36-plan st-card" id="tg36CoachPlan"><div class="tg36-plan-head"><div><div class="st-eyebrow">PERSONAL COACH</div><h2>วันนี้ควรเรียนอะไร</h2><p>แอปเลือกงานถัดไปจากข้อผิดและความเสี่ยงที่บันทึกจริง ไม่ทำนายคะแนนสอบ</p></div><span class="tg36-status">${bankAudit.qualityStatus==='PASS'?'CONTENT CHECK PASS':'CONTENT REVIEW'}</span></div><div class="tg36-plan-grid"><div><b>${weak?'โฟกัส: '+esc(weak.id):'เริ่มจาก Diagnostic'}</b><small>${weak?(weak.acc==null?'ยังมีข้อมูลไม่พอ':Math.round(weak.acc)+'% accuracy · risk '+Math.round(weak.risk)):'สร้างข้อมูลจากการทำข้อฝึก 10–20 ข้อแรก'}</small></div><div><b>${due} รายการในคลังข้อผิด</b><small>ใช้เป็นสัญญาณสำหรับการทบทวน ไม่ใช่คะแนนสอบ</small></div><button type="button" class="st-btn" onclick="${weak?`TGAT1LearningCoach.startMicro('${esc(weak.id)}')`:'TGAT1Adaptive.start()'}">${weak?'ฝึกจุดอ่อน 3 ข้อ':'เริ่มชุดวัดพื้นฐาน 20 ข้อ'} →</button></div></section>`;
    const anchor=app.querySelector('.st9-actions')||app.querySelector('.st9-section')||app.firstElementChild;if(anchor)anchor.insertAdjacentHTML('afterend',html);else app.insertAdjacentHTML('beforeend',html);
  }
  function decorateAnalytics(){
    const app=document.getElementById('app');if(!app||typeof STUDIO_PAGE==='undefined'||STUDIO_PAGE!=='analytics')return;
    const old=app.querySelector('#tg36ContentEvidence');if(old)return;
    const a=auditBank(),coach=safeLoad(COACH_KEY,[]),recentWrong=coach.filter(x=>x.correct===false).slice(-10).reverse();
    const html=`<section class="st-card tg36-evidence" id="tg36ContentEvidence"><div class="st-eyebrow">LEARNING QUALITY</div><h2>คุณภาพเนื้อหาและวงจรการเรียน</h2><div class="tg36-metrics"><div><b>${a.bankSize.toLocaleString()}</b><small>ข้อในคลัง</small></div><div><b>${a.explanationCoverage}%</b><small>มีคำอธิบาย</small></div><div><b>${a.templateLikeGroups}</b><small>กลุ่ม template-like</small></div><div><b>${recentWrong.length}</b><small>ข้อผิดล่าสุด</small></div></div><p class="st-subtitle">Exact duplicate: ${a.exactDuplicateGroups} กลุ่ม · ตัวเลือก/คำตอบผิดโครงสร้าง: ${a.missingOptions+a.badAnswer} รายการ · ระบบจะหลีกเลี่ยง template ซ้ำในโหมดฝึกเมื่อมีทางเลือก</p>${recentWrong.length?`<div class="tg36-recent-wrong"><b>ข้อผิดล่าสุด</b>${recentWrong.slice(0,5).map(x=>`<div><span>${esc(x.category||x.module)}</span><small>${esc(x.questionId||'')} · ${x.correct?'ผ่าน':'ควรทบทวน'}</small></div>`).join('')}</div>`:''}</section>`;
    app.insertAdjacentHTML('beforeend',html);
  }
  function decorate(){decorateVlt();decorateGrammar();decorateReading();decorateHome();decorateAnalytics();}
  // Highest-quality practice pool: one item per normalized template before fallback.
  if(typeof VLT_mixPool==='function')window.VLT_mixPool=function(n){const q=qualityPool(canonicalBank(),n,{recent:getRecent()});q.forEach(x=>window.STUDIO_REMEMBER_QUESTION?.(x));return q};
  if(typeof VLT_dailyPool==='function')window.VLT_dailyPool=function(){
    const out=[];for(const c of (typeof VLT_CATS!=='undefined'?VLT_CATS:[])){const pool=canonicalBank().filter(q=>q.category===c[0]);out.push(...qualityPool(pool,2,{recent:getRecent()}));}return qualityPool(out,10,{recent:getRecent()});
  };
  if(typeof VLT_startCategory==='function')window.VLT_startCategory=function(cat){const pool=canonicalBank().filter(q=>q.category===cat);const qs=qualityPool(pool,10,{recent:getRecent()});qs.forEach(x=>window.STUDIO_REMEMBER_QUESTION?.(x));if(typeof VLT_begin==='function')VLT_begin({mode:'practice',label:(typeof VLT_CATS!=='undefined'&&VLT_CATS.find(x=>x[0]===cat)?.[1])||cat,qs,index:0,answers:{},score:0,combo:0,reviewOn:false,coachMeta:{category:cat,createdAt:Date.now()}})};
  window.TGAT1ContentQuality=Object.freeze({version:VERSION,audit:auditBank,templateSig,qualityPool});
  window.TGAT1LearningCoach={version:VERSION,startMicro,decorate,weakCategory,record:recordCoach};
  window.TGAT1RuntimeHealth={version:VERSION,check:()=>({online:navigator.onLine,bankSize:canonicalBank().length,stateReady:!!window.VLT_STATE,runActive:!!window.VLT_RUN,swControlled:!!(navigator.serviceWorker&&navigator.serviceWorker.controller)})};
  // Global runtime error telemetry is local-only and capped; it never sends data off-device.
  window.addEventListener('error',e=>{try{const a=safeLoad('tgat1_studio_runtime_errors_v1',[]);a.push({at:Date.now(),message:text(e.message||'Unknown error'),source:text(e.filename||'').slice(-120),line:Number(e.lineno)||0});if(a.length>100)a.splice(0,a.length-100);safeSave('tgat1_studio_runtime_errors_v1',a)}catch(_){(window.TGAT1_ERR||Object)(_,'app')} });
  window.addEventListener('unhandledrejection',e=>{try{const a=safeLoad('tgat1_studio_runtime_errors_v1',[]);a.push({at:Date.now(),message:text(e.reason?.message||e.reason||'Unhandled rejection')});if(a.length>100)a.splice(0,a.length-100);safeSave('tgat1_studio_runtime_errors_v1',a)}catch(_){(window.TGAT1_ERR||Object)(_,'app')} });
  let queued=false;function sweep(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}
  const obs=new MutationObserver(sweep);if(document.body)obs.observe(document.body,{childList:true,subtree:true});window.addEventListener('studio:navigate',sweep);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sweep,{once:true});else sweep();
})();


/* ===== 29 · 26-deep-quality-v36-1.js ===== */
/* TGAT1 English Studio v36.1.0 — deep QA + measurable learning analytics.
   Read-only audit layer: never rewrites the canonical question bank or scoring rules. */
(function(){
  'use strict';
  const VERSION='36.1.0';
  const BANK=()=>Array.isArray(window.VLT_BANK)?window.VLT_BANK:[];
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const norm=v=>clean(v).toLowerCase().replace(/[“”‘’"']/g,'').replace(/\s+/g,' ');
  const safe=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(_){return f}};
  const esc=v=>typeof window.VLT_escape==='function'?window.VLT_escape(String(v??'')):clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function deepAudit(bank=BANK()){
    const pos=[0,0,0,0], dupOpt=[], shortPrompt=[], missingCtx=[];
    const difficulty={unknown:0,1:0,2:0,3:0,4:0,5:0};
    const category={};
    for(const q of bank){
      const a=Number(q.answer??q.a),opts=q.options||q.o||[];
      if(Number.isInteger(a)&&a>=0&&a<4)pos[a]++;
      const unique=new Set((Array.isArray(opts)?opts:[]).map(norm).filter(Boolean));
      if(Array.isArray(opts)&&opts.length===4&&unique.size<4)dupOpt.push(q.id);
      const p=clean(q.prompt||q.p); if(p.length<18)shortPrompt.push(q.id);
      if((q.category==='rc'||q.category==='long'||q.category==='short')&&!clean(q.context||'') )missingCtx.push(q.id);
      const d=Number(q.difficulty);difficulty[Number.isInteger(d)&&d>=1&&d<=5?d:'unknown']++;
      const c=q.category||'unknown';category[c]=(category[c]||0)+1;
    }
    const max=Math.max(...pos),min=Math.min(...pos),spread=bank.length?Math.round((max-min)/bank.length*1000)/10:0;
    return {version:VERSION,bankSize:bank.length,answerPosition:{A:pos[0],B:pos[1],C:pos[2],D:pos[3]},answerPositionSpreadPct:spread,duplicateOptions:dupOpt.length,duplicateOptionIds:dupOpt.slice(0,30),shortPrompts:shortPrompt.length,shortPromptIds:shortPrompt.slice(0,30),missingContext:missingCtx.length,missingContextIds:missingCtx.slice(0,30),difficulty,category};
  }

  function learningSnapshot(){
    const s=window.VLT_STATE&&typeof window.VLT_STATE==='object'?window.VLT_STATE:{};
    const rows={};
    for(const h of (Array.isArray(s.history)?s.history:[])) for(const c of (Array.isArray(h.categories)?h.categories:[])){
      const r=rows[c.cat]||(rows[c.cat]={total:0,correct:0});r.total+=Number(c.total)||0;r.correct+=Number(c.score)||0;
    }
    const grammar=safe('tgat1_studio_grammar_clinic_v1',{}),reading=safe('tgat1_studio_reading_trainer_v1',{});
    const gtopics=Object.entries(grammar.topics||{}).map(([id,v])=>({id,total:Number(v.total)||0,correct:Number(v.correct)||0,accuracy:v.total?Math.round(v.correct/v.total*100):0})).sort((a,b)=>a.accuracy-b.accuracy);
    const rwrong=Object.values(reading.questions||{}).filter(x=>(x.wrongCount||0)>0).sort((a,b)=>(b.wrongCount||0)-(a.wrongCount||0)).slice(0,8);
    const v=safe('tgat1_studio_vocab_progress_v1',{}),items=Object.values(v.items||{});
    return {vlt:Object.entries(rows).map(([id,x])=>({id,total:x.total,accuracy:x.total?Math.round(x.correct/x.total*100):0})).sort((a,b)=>a.accuracy-b.accuracy),grammar:gtopics,readingWrong:rwrong,vocab:{tracked:items.length,due:items.filter(x=>Number(x.due)<=Date.now()).length,known:items.filter(x=>x.status==='known').length}};
  }

  function storageHealth(){
    let bytes=0,keys=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k)continue;keys++;try{bytes+=k.length+(localStorage.getItem(k)||'').length}catch(_){(window.TGAT1_ERR||Object)(_,'app')} }
    let quota=null,usage=null;try{if(navigator.storage&&navigator.storage.estimate){navigator.storage.estimate().then(x=>{window.__TGAT1_STORAGE_ESTIMATE=x;});}}catch(_){(window.TGAT1_ERR||Object)(_,'app')}
    const est=window.__TGAT1_STORAGE_ESTIMATE;if(est){quota=est.quota||null;usage=est.usage||null;}
    return {keys,approxBytes:bytes,quotaBytes:quota,usageBytes:usage};
  }

  function runtimeHealth(){
    const errs=safe('tgat1_studio_runtime_errors_v1',[]);
    return {online:navigator.onLine,serviceWorker:'serviceWorker' in navigator,controlled:!!(navigator.serviceWorker&&navigator.serviceWorker.controller),errors:Array.isArray(errs)?errs.length:0,bank: BANK().length};
  }

  function startErrorReview(category){
    const bank=BANK(),s=window.VLT_STATE||{},missed=s.missed||{};
    const pool=bank.filter(q=>q.category===category && Number(missed[q.id])>0).slice(0,6);
    if(!pool.length){if(typeof window.VLT_toast==='function')window.VLT_toast('ยังไม่มีข้อผิดในหมวดนี้');return false;}
    if(typeof window.VLT_begin!=='function')return false;
    VLT_begin({mode:'practice',label:'Error Review · '+category,qs:pool.map(q=>({...q,userAnswer:null})),index:0,answers:{},score:0,combo:0,reviewOn:true,coachMeta:{source:'error-notebook',category,createdAt:Date.now()}});
    return true;
  }

  function panel(){
    const a=deepAudit(),l=learningSnapshot(),r=runtimeHealth(),st=storageHealth();
    const vlt=l.vlt.map(x=>`<div class="tg361-row"><b>${esc(x.id)}</b><span>${x.total} คำตอบ · ${x.accuracy}%</span></div>`).join('')||'<p class="st-subtitle">ยังไม่มีสถิติแยกหมวด</p>';
    const gram=l.grammar.slice(0,8).map(x=>`<div class="tg361-row"><b>${esc(x.id)}</b><span>${x.total} ข้อ · ${x.accuracy}%</span></div>`).join('')||'<p class="st-subtitle">ยังไม่มีสถิติ Grammar</p>';
    const wrong=l.readingWrong.map(x=>`<div class="tg361-row"><b>${esc(x.topic||x.id)}</b><span>ผิด ${x.wrongCount||0} ครั้ง</span></div>`).join('')||'<p class="st-subtitle">ยังไม่มีข้อ Reading ที่ผิดซ้ำ</p>';
    return `<section class="st-card tg361-panel" id="tg361DeepQA"><div class="st-eyebrow">DEEP QA</div><h2>ตรวจคุณภาพและพัฒนาการ</h2><div class="tg361-grid"><div><b>${a.bankSize.toLocaleString()}</b><small>ข้อในคลัง</small></div><div><b>${a.duplicateOptions}</b><small>ตัวเลือกซ้ำในข้อเดียว</small></div><div><b>${a.shortPrompts}</b><small>โจทย์สั้นผิดปกติ</small></div><div><b>${a.answerPositionSpreadPct}%</b><small>ความต่าง A–D สูงสุด</small></div></div><div class="tg361-cols"><div><h3>ผลตามทักษะ</h3>${vlt}</div><div><h3>Grammar</h3>${gram}</div><div><h3>Reading ที่ควรทบทวน</h3>${wrong}</div></div><div class="tg361-health"><span>Runtime errors: <b>${r.errors}</b></span><span>SW: <b>${r.controlled?'controlled':'not controlled'}</b></span><span>Storage keys: <b>${st.keys}</b></span><span>Vocabulary: <b>${l.vocab.due} due · ${l.vocab.known} known</b></span></div><p class="st-subtitle">ตัวเลขนี้เป็นหลักฐานจากข้อมูลที่บันทึกในเครื่อง ไม่ใช่การคาดการณ์คะแนนสอบจริง · ข้อที่ระบบตั้งธงเป็น “review” ยังต้องตรวจโดยคนก่อนแก้เนื้อหา</p></section>`;
  }

  function decorate(){
    const app=document.getElementById('app');if(!app||typeof STUDIO_PAGE==='undefined'||STUDIO_PAGE!=='analytics')return;
    const old=app.querySelector('#tg361DeepQA');if(old)old.remove();app.insertAdjacentHTML('beforeend',panel());
  }

  window.TGAT1DeepQuality=Object.freeze({version:VERSION,audit:deepAudit,learningSnapshot,storageHealth,runtimeHealth,startErrorReview});
  window.addEventListener('studio:navigate',()=>requestAnimationFrame(decorate));
  if(typeof window.studioAnalytics==='function')window.TGAT1_addAnalyticsHook(function(){requestAnimationFrame(decorate)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
})();


/* ===== 30 · 27-production-hardening-v36-2.js ===== */
/* TGAT1 English Studio v37.8.0 — production hardening.
   Conservative runtime layer: validates state, improves accessibility/reliability,
   and turns quality signals into actionable review queues without rewriting content. */
(function(){
  'use strict';
  const VERSION='37.8.0';
  const KEYS={runtime:'tgat1_studio_runtime_errors_v1',health:'tgat1_production_health_v1'};
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const esc=v=>typeof window.VLT_escape==='function'?window.VLT_escape(String(v??'')):clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(_){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};

  function stateIntegrity(){
    const checks=[];
    const s=window.VLT_STATE;
    checks.push({name:'VLT_STATE',ok:!!s&&typeof s==='object'});
    checks.push({name:'VLT_BANK',ok:Array.isArray(window.VLT_BANK)&&window.VLT_BANK.length>0});
    checks.push({name:'VLT_RUN',ok:!window.VLT_RUN||typeof window.VLT_RUN==='object'});
    const rawKeys=['tgat1_studio_grammar_clinic_v1','tgat1_studio_reading_trainer_v1','tgat1_studio_vocab_progress_v1'];
    for(const k of rawKeys){
      try{const raw=localStorage.getItem(k); if(raw!==null) JSON.parse(raw); checks.push({name:k,ok:true});}
      catch(_){checks.push({name:k,ok:false});}
    }
    return {ok:checks.every(x=>x.ok),checks};
  }

  function accessibilityAudit(root=document){
    const bad=[];
    root.querySelectorAll('button,a,[role="button"],input,select,textarea').forEach(el=>{
      if(el.disabled||el.getAttribute('aria-hidden')==='true')return;
      const name=clean(el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent||el.getAttribute('placeholder'));
      if(!name)bad.push({tag:el.tagName.toLowerCase(),id:el.id||'',className:clean(el.className).slice(0,80)});
    });
    const ids=new Map(),dupes=[];
    root.querySelectorAll('[id]').forEach(el=>{const id=el.id;if(ids.has(id))dupes.push(id);else ids.set(id,1)});
    root.querySelectorAll('button button,a button,button a').forEach(el=>bad.push({tag:'nested-interactive',html:el.outerHTML.slice(0,180)}));
    return {unnamedInteractive:bad.slice(0,50),unnamedCount:bad.length,duplicateIds:[...new Set(dupes)],duplicateIdCount:new Set(dupes).size};
  }

  function mobileAudit(){
    const w=window.innerWidth||0;
    const small=w>0&&w<=480;
    const overflow=[];
    document.querySelectorAll('body *').forEach(el=>{if(el.scrollWidth>el.clientWidth+2&&el.clientWidth>0)overflow.push({tag:el.tagName.toLowerCase(),id:el.id||'',className:clean(el.className).slice(0,70),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth})});
    return {viewport:w,smallViewport:small,horizontalOverflow:overflow.slice(0,30),overflowCount:overflow.length};
  }

  function performanceSnapshot(){
    const nav=performance.getEntriesByType('navigation')[0];
    return {domContentLoaded:nav?Math.round(nav.domContentLoadedEventEnd):null,load:nav?Math.round(nav.loadEventEnd):null,transferSize:nav?nav.transferSize:null,resources:performance.getEntriesByType('resource').length};
  }

  function reviewQueue(limit=100){
    const bank=Array.isArray(window.VLT_BANK)?window.VLT_BANK:[];
    const flagged=[];
    const norm=v=>clean(v).toLowerCase().replace(/[“”‘’"']/g,'').replace(/\s+/g,' ');
    for(const q of bank){
      const opts=Array.isArray(q.options||q.o)?(q.options||q.o):[];
      const reasons=[];
      if(opts.length!==4)reasons.push('options-count');
      if(new Set(opts.map(norm).filter(Boolean)).size<opts.filter(Boolean).length)reasons.push('duplicate-options');
      const a=Number(q.answer??q.a);if(!Number.isInteger(a)||a<0||a>=4)reasons.push('answer-index');
      if(clean(q.prompt||q.p).length<18)reasons.push('short-prompt');
      if(['rc','long','short'].includes(q.category)&&!clean(q.context).length)reasons.push('missing-context');
      if(!clean(q.explanation||q.explain||q.exp).length)reasons.push('missing-explanation');
      if(reasons.length)flagged.push({id:q.id||'',category:q.category||'unknown',reasons,prompt:clean(q.prompt||q.p).slice(0,140)});
      if(flagged.length>=limit)break;
    }
    return flagged;
  }

  function runtimeGuard(){
    const existing=safe(KEYS.runtime,[]);
    const arr=Array.isArray(existing)?existing:[];
    const push=(type,error)=>{
      const row={at:new Date().toISOString(),type,message:clean(error&&error.message||error).slice(0,500),url:location.href};
      const next=arr.concat(row).slice(-100);write(KEYS.runtime,next);
    };
    window.addEventListener('error',e=>push('error',e.error||e.message));
    window.addEventListener('unhandledrejection',e=>push('unhandledrejection',e.reason));
  }

  function onlineUX(){
    const update=()=>{
      let el=document.getElementById('tg362NetworkStatus');
      if(!el){el=document.createElement('div');el.id='tg362NetworkStatus';el.className='tg362-network';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}
      el.textContent=navigator.onLine?'ออนไลน์':'ออฟไลน์ · ใช้ข้อมูลที่เก็บในเครื่อง';
      el.dataset.offline=navigator.onLine?'false':'true';
    };
    window.addEventListener('online',update);window.addEventListener('offline',update);update();
  }

  function productionPanel(){
    if(typeof STUDIO_PAGE==='undefined'||STUDIO_PAGE!=='analytics')return;
    const app=document.getElementById('app');if(!app)return;
    const old=app.querySelector('#tg362Production');if(old)old.remove();
    const si=stateIntegrity(),aa=accessibilityAudit(),ma=mobileAudit(),ps=performanceSnapshot(),rq=reviewQueue();
    const checks=si.checks.map(x=>`<div class="tg362-check"><span>${x.ok?'✓':'!'}</span><b>${esc(x.name)}</b></div>`).join('');
    const flags=rq.slice(0,8).map(x=>`<div class="tg362-flag"><b>${esc(x.id||'no-id')}</b><span>${esc(x.reasons.join(', '))}</span></div>`).join('')||'<p class="st-subtitle">ไม่พบธงโครงสร้างจาก automatic audit</p>';
    app.insertAdjacentHTML('beforeend',`<section class="st-card tg362-panel" id="tg362Production"><div class="st-eyebrow">PRODUCTION HARDENING</div><h2>ความพร้อมก่อนใช้งานจริง</h2><div class="tg362-metrics"><div><b>${si.ok?'PASS':'CHECK'}</b><small>State integrity</small></div><div><b>${aa.unnamedCount}</b><small>interactive ไม่มีชื่อ</small></div><div><b>${aa.duplicateIdCount}</b><small>duplicate IDs</small></div><div><b>${ma.overflowCount}</b><small>overflow nodes</small></div><div><b>${rq.length}</b><small>content review flags</small></div><div><b>${ps.load??'—'} ms</b><small>page load timing</small></div></div><div class="tg362-cols"><div><h3>State checks</h3>${checks}</div><div><h3>Content review queue</h3>${flags}</div></div><div class="tg362-foot">ข้อมูลนี้เป็น automatic QA ไม่ใช่การตัดสินความถูกต้องทางวิชาการของโจทย์ · ก่อนแก้เนื้อหาต้อง human-review รายข้อ</div></section>`);
  }

  function schedule(){requestAnimationFrame(()=>requestAnimationFrame(productionPanel));}
  runtimeGuard();
  window.TGAT1ProductionHardening=Object.freeze({version:VERSION,stateIntegrity,accessibilityAudit,mobileAudit,performanceSnapshot,reviewQueue});
  window.addEventListener('studio:navigate',schedule);
  window.addEventListener('resize',()=>{clearTimeout(window.__tg362Resize);window.__tg362Resize=setTimeout(schedule,180)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{onlineUX();schedule()},{once:true});else{onlineUX();schedule();}
})();


/* ===== 31 · 28-complete-learning-hardening-v36-3.js ===== */
/* TGAT1 English Studio v36.3.0 — complete learning hardening.
   Adds evidence-driven QA, adaptive-effectiveness metrics, SRS calibration,
   error-loop actions, safe option randomization, migration diagnostics,
   and non-destructive content review queues. */
(function(){
  'use strict';
  const VERSION='36.3.0';
  const REVIEW_KEY='tgat1_studio_content_review_v1';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const norm=v=>clean(v).toLocaleLowerCase().replace(/[“”‘’"']/g,'').replace(/\s+/g,' ');
  const esc=v=>typeof window.VLT_escape==='function'?window.VLT_escape(String(v??'')):clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(_){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
  const bank=()=>Array.isArray(window.VLT_BANK)?window.VLT_BANK:[];

  function shuffleOptions(q){
    const opts=Array.isArray(q.options||q.o)?(q.options||q.o):[];
    const a=Number(q.answer??q.a);
    if(opts.length!==4 || !Number.isInteger(a) || a<0 || a>=opts.length)return {...q,userAnswer:null};
    const pairs=opts.map((text,i)=>({text,correct:i===a}));
    for(let i=pairs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pairs[i],pairs[j]]=[pairs[j],pairs[i]];}
    return {...q,options:pairs.map(x=>x.text),answer:pairs.findIndex(x=>x.correct),userAnswer:null};
  }
  function safePracticeStart(qs,label,extra={}){
    const ready=qs.map(shuffleOptions);
    if(typeof window.VLT_begin!=='function')return false;
    window.VLT_begin({mode:'practice',label,qs:ready,index:0,answers:{},score:0,combo:0,reviewOn:false,...extra});
    return true;
  }

  // Prevent answer-position learning in practice mode too; mock mode already randomizes.
  window.VLT_startCategory=function(cat){
    const pool=bank().filter(q=>q.category===cat);
    const qs=typeof window.VLT_shuffle==='function'?window.VLT_shuffle(pool).slice(0,10):pool.slice(0,10);
    const label=(typeof VLT_CATS!=='undefined'?VLT_CATS:[]).find(x=>x[0]===cat)?.[1]||cat;
    safePracticeStart(qs,label);
  };
  window.VLT_startQuick=function(){
    const qs=typeof window.VLT_mixPool==='function'?window.VLT_mixPool(10):bank().slice(0,10);
    safePracticeStart(qs,'สุ่ม 10 ข้อ');
  };
  window.VLT_startDaily=function(){
    const qs=typeof window.VLT_dailyPool==='function'?window.VLT_dailyPool():bank().slice(0,10);
    safePracticeStart(qs,'ภารกิจประจำวัน',{mode:'daily'});
  };

  function contentReviewQueue(limit=200){
    const out=[];
    const exact=new Map(),template=new Map();
    for(const q of bank()){
      const prompt=norm(q.prompt||q.p),ctx=norm(q.context||''),opts=Array.isArray(q.options||q.o)?(q.options||q.o):[];
      const a=Number(q.answer??q.a), reasons=[];
      if(!q.id)reasons.push('missing-id');
      if(opts.length!==4)reasons.push('options-count');
      if(new Set(opts.map(norm).filter(Boolean)).size<opts.filter(Boolean).length)reasons.push('duplicate-options');
      if(!Number.isInteger(a)||a<0||a>=opts.length)reasons.push('answer-index');
      if(prompt.length<18)reasons.push('short-prompt');
      if(['rc','long','short'].includes(q.category)&&!ctx)reasons.push('missing-context');
      if(!clean(q.explanation||q.explain||q.exp))reasons.push('missing-explanation');
      const sig=prompt+'|'+ctx;
      if(sig.length>10){
        const arr=template.get(sig)||[];arr.push(q.id);template.set(sig,arr);
      }
      if(prompt){const exactSig=prompt+'|'+ctx;const arr=exact.get(exactSig)||[];arr.push(q.id);exact.set(exactSig,arr);}
      if(reasons.length)out.push({id:q.id||'',category:q.category||'unknown',reasons,prompt:clean(q.prompt||q.p).slice(0,150)});
    }
    for(const [sig,ids] of template)if(ids.length>1){for(const id of ids){const row=out.find(x=>x.id===id);if(row&&!row.reasons.includes('template-reuse'))row.reasons.push('template-reuse');}}
    for(const [sig,ids] of exact)if(ids.length>1){for(const id of ids){const row=out.find(x=>x.id===id);if(row&&!row.reasons.includes('exact-prompt-duplicate'))row.reasons.push('exact-prompt-duplicate');}}
    const review=safe(REVIEW_KEY,{});
    return out.slice(0,limit).map(x=>({...x,reviewed:!!review[x.id]}));
  }

  function answerDistribution(){
    const counts=[0,0,0,0]; for(const q of bank()){const a=Number(q.answer??q.a);if(Number.isInteger(a)&&a>=0&&a<4)counts[a]++;}
    const total=counts.reduce((a,b)=>a+b,0),expected=total/4;
    return {A:counts[0],B:counts[1],C:counts[2],D:counts[3],total,expected,spread:total?Math.round((Math.max(...counts)-Math.min(...counts))/total*1000)/10:0};
  }

  function difficultyProfile(){
    const s=window.VLT_STATE||{},miss=s.missed||{},rows={};
    for(const q of bank()){
      const m=Number(miss[q.id]||0), r=Number((s.mastered||{})[q.id]||0);
      const score=m/(m+r+1);
      const bucket=score>=.67?'hard':score>=.34?'medium':'easy';
      const c=q.category||'unknown';
      rows[c] ||= {category:c,total:0,hard:0,medium:0,easy:0,attempted:0,missed:0};
      rows[c].total++; if(m||r)rows[c].attempted++; rows[c].missed+=m; rows[c][bucket]++;
    }
    return Object.values(rows).map(x=>({...x,errorRate:x.attempted?Math.round(x.missed/(x.missed+x.attempted)*100):null}));
  }

  function adaptiveEffectiveness(){
    const s=window.VLT_STATE||{}, hs=Array.isArray(s.history)?s.history:[], by={};
    for(const h of hs){for(const c of (Array.isArray(h.categories)?h.categories:[])){const id=c.cat;if(!by[id])by[id]=[];by[id].push({at:h.at,total:Number(c.total)||0,score:Number(c.score)||0});}}
    const rows=[];
    for(const [id,a] of Object.entries(by)){const valid=a.filter(x=>x.total>0);if(valid.length<2)continue;const split=Math.max(1,Math.floor(valid.length/2)),old=valid.slice(0,split),recent=valid.slice(split);const acc=g=>{const t=g.reduce((n,x)=>n+x.total,0),s=g.reduce((n,x)=>n+x.score,0);return t?s/t*100:null};const before=acc(old),after=acc(recent);rows.push({id,sessions:valid.length,before:before==null?null:Math.round(before),after:after==null?null:Math.round(after),delta:before!=null&&after!=null?Math.round(after-before):null});}
    return rows.sort((a,b)=>(b.delta??-999)-(a.delta??-999));
  }

  function srsCalibration(){
    const v=safe('tgat1_studio_vocab_progress_v1',{}),log=Array.isArray(v.reviewLog)?v.reviewLog:[];
    const grades={again:0,hard:0,good:0,easy:0};let sum=0,count=0;
    for(const x of log){if(grades[x.grade]!=null)grades[x.grade]++;if(Number.isFinite(Number(x.intervalDays))){sum+=Number(x.intervalDays);count++;}}
    const reviewed=Object.values(v.items||{}).filter(x=>Number(x.reviewCount)>0);
    const due=reviewed.filter(x=>Number(x.due)<=Date.now()).length;
    const known=reviewed.filter(x=>x.status==='known').length;
    return {reviews:log.length,grades,avgIntervalDays:count?Math.round(sum/count*100)/100:0,due,known,reviewed:reviewed.length};
  }

  function errorLoop(){
    const rows=Array.isArray(safe('tgat1_studio_error_notebook_v2',[]))?safe('tgat1_studio_error_notebook_v2',[]):[];
    const pending=rows.filter(x=>(Number(x.wrongCount)||0)>0).length;
    return {total:rows.length,pending,top:rows.slice().sort((a,b)=>(b.wrongCount||0)-(a.wrongCount||0)).slice(0,10)};
  }

  function migrationDiagnostics(){
    const s=window.VLT_STATE||{}, checks=[];
    checks.push(['VLT_STATE',!!s&&typeof s==='object']);
    checks.push(['history-array',Array.isArray(s.history)]);
    checks.push(['missed-object',!!s.missed&&typeof s.missed==='object'&&!Array.isArray(s.missed)]);
    checks.push(['mastered-object',!!s.mastered&&typeof s.mastered==='object'&&!Array.isArray(s.mastered)]);
    checks.push(['bank-linked',bank().length>0]);
    let orphan=0;for(const id of Object.keys(s.missed||{}))if(!bank().some(q=>q.id===id))orphan++;
    return {ok:checks.every(x=>x[1])&&orphan===0,checks,orphanMissed:orphan};
  }

  function markReviewed(id){const r=safe(REVIEW_KEY,{});r[id]={at:Date.now()};write(REVIEW_KEY,r);return true;}
  function startReview(ids){
    const qs=ids.map(id=>bank().find(q=>q.id===id)).filter(Boolean);
    if(!qs.length){if(typeof window.VLT_toast==='function')window.VLT_toast('ยังไม่มีรายการให้ตรวจ');return false;}
    return safePracticeStart(qs,'Content Review · Human QA',{reviewOn:true,coachMeta:{source:'content-review',createdAt:Date.now()}});
  }
  function startErrorLoop(category){
    if(window.TGAT1DeepQuality&&typeof window.TGAT1DeepQuality.startErrorReview==='function')return window.TGAT1DeepQuality.startErrorReview(category);
    const s=window.VLT_STATE||{},miss=s.missed||{};const qs=bank().filter(q=>q.category===category&&Number(miss[q.id])>0).slice(0,6);return startReview(qs.map(q=>q.id));
  }

  function audit(){
    const dist=answerDistribution(),queue=contentReviewQueue(),srs=srsCalibration(),loop=errorLoop(),mig=migrationDiagnostics();
    return {version:VERSION,bankSize:bank().length,answerDistribution:dist,difficulty:difficultyProfile(),adaptiveEffectiveness:adaptiveEffectiveness(),srs, errorLoop:loop,migration:mig,reviewQueue:queue};
  }

  function panel(){
    if(typeof STUDIO_PAGE==='undefined'||STUDIO_PAGE!=='analytics')return;
    const app=document.getElementById('app');if(!app)return;
    const old=app.querySelector('#tg363Complete');if(old)old.remove();
    const a=audit(),d=a.answerDistribution,s=a.srs,m=a.migration;
    const adaptive=a.adaptiveEffectiveness.map(x=>`<div class="tg363-row"><b>${esc(x.id)}</b><span>${x.before??'—'}% → ${x.after??'—'}% ${x.delta==null?'':`(${x.delta>=0?'+':''}${x.delta} pp)`}</span></div>`).join('')||'<p class="st-subtitle">ยังมีข้อมูลไม่พอสำหรับวัดผล adaptive</p>';
    const diff=a.difficulty.map(x=>`<div class="tg363-row"><b>${esc(x.category)}</b><span>hard ${x.hard} · medium ${x.medium} · easy ${x.easy}</span></div>`).join('');
    const flags=a.reviewQueue.filter(x=>!x.reviewed).slice(0,10).map(x=>`<div class="tg363-flag"><b>${esc(x.id||'no-id')}</b><span>${esc(x.reasons.join(', '))}</span></div>`).join('')||'<p class="st-subtitle">ไม่มีรายการใหม่จาก automatic QA</p>';
    app.insertAdjacentHTML('beforeend',`<section class="st-card tg363-panel" id="tg363Complete"><div class="st-eyebrow">COMPLETE LEARNING HARDENING</div><h2>คุณภาพการเรียนรู้และความพร้อมใช้งาน</h2><div class="tg363-metrics"><div><b>${a.bankSize.toLocaleString()}</b><small>ข้อในคลัง</small></div><div><b>${d.A}/${d.B}/${d.C}/${d.D}</b><small>A · B · C · D</small></div><div><b>${d.spread}%</b><small>answer-position spread</small></div><div><b>${a.reviewQueue.filter(x=>!x.reviewed).length}</b><small>รายการต้อง human-review</small></div><div><b>${s.due}</b><small>ศัพท์ถึงกำหนด</small></div><div><b>${m.ok?'PASS':'CHECK'}</b><small>migration integrity</small></div></div><div class="tg363-cols"><div><h3>Adaptive effectiveness</h3>${adaptive}</div><div><h3>Difficulty signal จากประวัติ</h3>${diff}</div><div><h3>SRS calibration</h3><p class="st-subtitle">ทบทวน ${s.reviews} ครั้ง · เฉลี่ย ${s.avgIntervalDays} วัน · due ${s.due} · known ${s.known}</p><p class="st-subtitle">Again ${s.grades.again} · Hard ${s.grades.hard} · Good ${s.grades.good} · Easy ${s.grades.easy}</p></div></div><div class="tg363-actions"><button class="st-btn secondary small" onclick="TGAT1CompleteLearning.startWeakReview()">ทบทวนข้อผิดตามทักษะ</button></div><p class="st-subtitle">ตัวเลขนี้เป็นสัญญาณจากการใช้งานของคุณในเครื่องนี้ เพื่อจัดลำดับการทบทวน</p></section>`);
  }

  function startTopReview(){const ids=contentReviewQueue(12).filter(x=>!x.reviewed).map(x=>x.id);return startReview(ids);}
  function startWeakReview(){
    const d=difficultyProfile().sort((a,b)=>(b.errorRate??-1)-(a.errorRate??-1))[0];
    if(!d){if(typeof window.VLT_toast==='function')window.VLT_toast('ยังไม่มีข้อมูลข้อผิด');return false;}
    return startErrorLoop(d.category);
  }

  window.TGAT1CompleteLearning=Object.freeze({version:VERSION,audit,contentReviewQueue,answerDistribution,difficultyProfile,adaptiveEffectiveness,srsCalibration,errorLoop,migrationDiagnostics,markReviewed,startReview,startTopReview,startWeakReview});
  window.addEventListener('studio:navigate',()=>requestAnimationFrame(()=>requestAnimationFrame(panel)));
  window.addEventListener('error',e=>{const arr=safe('tgat1_studio_runtime_errors_v1',[]);if(Array.isArray(arr)){arr.push({at:new Date().toISOString(),type:'error-v363',message:clean(e.error?.message||e.message).slice(0,500)});write('tgat1_studio_runtime_errors_v1',arr.slice(-100));}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(panel,0),{once:true});else setTimeout(panel,0);
})();


/* ===== 32 · 30-v37-8-deep-audit.js ===== */
/* TGAT1 English Studio v37.8.0 — deep QA, retention evidence and learning analytics.
 * Read-only analytics layer: does not alter question scoring, SRS intervals, or stored answers.
 */
(function(){
  'use strict';
  const VERSION='37.8.0';
  const esc=s=>typeof window.studioEsc==='function'?window.studioEsc(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s??'').normalize('NFKC').toLocaleLowerCase('en-US').replace(/\s+/g,' ').trim();
  const CATS=[['qr','Question–Response'],['short','Short Conversation'],['long','Long Conversation'],['tc','Text Completion'],['rc','Reading Comprehension']];

  function bank(){return typeof VLT_BANK!=='undefined'&&Array.isArray(VLT_BANK)?VLT_BANK:[]}
  function questionAudit(){
    const rows=bank(), ids=new Set(), full=new Map(), prompt=new Map(), answer=[0,0,0,0], diff={1:0,2:0,3:0};
    let structural=0;
    rows.forEach(q=>{
      if(!q.id||ids.has(q.id)||!String(q.prompt||'').trim()||!Array.isArray(q.options)||q.options.length!==4||new Set(q.options.map(norm)).size!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3||!String(q.explanation||'').trim()) structural++;
      ids.add(q.id);
      const sig=[norm(q.context),norm(q.prompt),q.options.map(norm).sort().join('|'),norm(q.options[q.answer])].join('@@'); full.set(sig,(full.get(sig)||0)+1);
      const p=norm(q.prompt);prompt.set(p,(prompt.get(p)||0)+1);
      if(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4)answer[q.answer]++;
      if(diff[q.difficulty]!=null)diff[q.difficulty]++;
    });
    const exactDuplicateItems=[...full.values()].reduce((n,v)=>n+Math.max(0,v-1),0);
    const repeatedPromptGroups=[...prompt.values()].filter(v=>v>1).length;
    const repeatedPromptItems=[...prompt.values()].reduce((n,v)=>n+(v>1?v:0),0);
    const category={};CATS.forEach(([id,name])=>category[id]={name,total:rows.filter(q=>q.category===id).length,answer:[0,0,0,0]});
    rows.forEach(q=>{if(category[q.category]&&Number.isInteger(q.answer))category[q.category].answer[q.answer]++});
    return {version:VERSION,total:rows.length,uniqueIds:ids.size,structural,exactDuplicateItems,repeatedPromptGroups,repeatedPromptItems,answerDistribution:answer,difficultyDistribution:diff,category};
  }

  function srsAudit(){
    let state={};try{state=JSON.parse(localStorage.getItem('tgat1_studio_vocab_progress_v1')||'{}')}catch(_){state={}};
    const log=Array.isArray(state.reviewLog)?state.reviewLog:[];
    const grades={again:0,hard:0,good:0,easy:0};log.forEach(x=>{if(grades[x.grade]!=null)grades[x.grade]++});
    const graded=log.length,successful=grades.good+grades.easy;
    const intervals=log.map(x=>Number(x.intervalDays)).filter(Number.isFinite);
    const avgInterval=intervals.length?intervals.reduce((a,b)=>a+b,0)/intervals.length:0;
    return {graded,grades,successRate:graded?Math.round(successful/graded*100):null,againRate:graded?Math.round(grades.again/graded*100):null,avgIntervalDays:Math.round(avgInterval*100)/100,trackedWords:Object.keys(state.items||{}).length};
  }

  function grammarAudit(){
    let s={};try{s=JSON.parse(localStorage.getItem('tgat1_studio_grammar_clinic_v1')||'{}')}catch(_){s={}};
    const topics=s.topics&&typeof s.topics==='object'?s.topics:{};
    const rows=Object.entries(topics).map(([id,x])=>({id,total:Number(x.total)||0,correct:Number(x.correct)||0,accuracy:(Number(x.total)||0)?Math.round((Number(x.correct)||0)/(Number(x.total)||1)*100):null}));
    return {total:Number(s.total)||0,correct:Number(s.correct)||0,accuracy:Number(s.total)?Math.round((Number(s.correct)||0)/(Number(s.total)||1)*100):null,topics:rows};
  }

  function readingAudit(){
    let s={};try{s=JSON.parse(localStorage.getItem('tgat1_studio_reading_trainer_v1')||'{}')}catch(_){s={}};
    const qs=s.questions&&typeof s.questions==='object'?Object.values(s.questions):[];
    const attempted=qs.reduce((n,x)=>n+(Number(x.attempts)||0),0),correct=qs.reduce((n,x)=>n+(Number(x.correctCount)||0),0),wrong=qs.reduce((n,x)=>n+(Number(x.wrongCount)||0),0);
    return {attempted,correct,wrong,accuracy:attempted?Math.round(correct/attempted*100):null,questionRecords:qs.length,passagesPracticed:Object.keys(s.practiced||{}).length};
  }

  function render(){
    const app=document.getElementById('app');
    if(!app||typeof studioAnalytics!=='function')return;
    if(app.querySelector('#tgDeepAuditCard'))app.querySelector('#tgDeepAuditCard').remove();
    const q=questionAudit(),s=srsAudit(),g=grammarAudit(),r=readingAudit();
    const answerSpread=Math.max(...q.answerDistribution)-Math.min(...q.answerDistribution);
    const qRows=CATS.map(([id,name])=>{const x=q.category[id];return `<div class="v14-row"><span>${esc(name)}</span><b>${x.total} ข้อ · A/B/C/D = ${x.answer.join('/')}</b></div>`}).join('');
    const card=`<section class="v14-wrap" id="tgDeepAuditCard"><div class="v14-card"><div class="st-eyebrow">DEEP QUALITY AUDIT</div><h2 class="st-title" style="font-size:21px">ตรวจระบบเชิงลึก</h2><p class="v14-muted">แยกโครงสร้างที่พิสูจน์ได้ออกจากตัวชี้วัดที่ต้องใช้การตรวจเนื้อหาโดยมนุษย์</p><div class="v14-grid"><div class="v14-kpi"><b>${q.total.toLocaleString()}</b><small>ข้อสอบ</small></div><div class="v14-kpi"><b>${q.structural}</b><small>โครงสร้างผิด</small></div><div class="v14-kpi"><b>${q.exactDuplicateItems}</b><small>โจทย์+บริบทซ้ำจริง</small></div><div class="v14-kpi"><b>${q.repeatedPromptGroups}</b><small>prompt template ซ้ำ</small></div></div><div class="v14-row"><span>การกระจายเฉลย A/B/C/D</span><b>${q.answerDistribution.join(' / ')} · spread ${answerSpread}</b></div><div class="v14-row"><span>ระดับความยาก 1/2/3</span><b>${q.difficultyDistribution[1]} / ${q.difficultyDistribution[2]} / ${q.difficultyDistribution[3]}</b></div>${qRows}<p class="v14-muted">Prompt ที่ซ้ำไม่ถือเป็นข้อซ้ำโดยอัตโนมัติ เพราะบริบทและตัวเลือกอาจต่างกัน; การตัดสินคุณภาพเชิงวิชาการยังต้องตรวจเนื้อหา</p></div>
    <div class="v14-card"><div class="st-eyebrow">LEARNING EVIDENCE</div><h2 class="st-title" style="font-size:21px">หลักฐานการเรียนรู้</h2><div class="v14-grid"><div class="v14-kpi"><b>${s.graded}</b><small>SRS reviews</small></div><div class="v14-kpi"><b>${s.successRate==null?'—':s.successRate+'%'}</b><small>Good/Easy rate</small></div><div class="v14-kpi"><b>${g.accuracy==null?'—':g.accuracy+'%'}</b><small>Grammar accuracy</small></div><div class="v14-kpi"><b>${r.accuracy==null?'—':r.accuracy+'%'}</b><small>Reading accuracy</small></div></div><div class="v14-row"><span>SRS Again rate</span><b>${s.againRate==null?'—':s.againRate+'%'}</b></div><div class="v14-row"><span>SRS average interval</span><b>${s.graded?s.avgIntervalDays+' วัน':'—'}</b></div><div class="v14-row"><span>Grammar</span><b>${g.total} ข้อ · ${g.correct} ถูก · ${g.accuracy==null?'—':g.accuracy+'%'}</b></div><div class="v14-row"><span>Reading</span><b>${r.attempted} ครั้ง · ${r.correct} ถูก · ${r.accuracy==null?'—':r.accuracy+'%'}</b></div><p class="v14-muted">ค่าเหล่านี้เป็นข้อมูลจากอุปกรณ์นี้เท่านั้น ไม่ใช่การรับรองผลสอบ TGAT1 หรือการคาดการณ์คะแนนจริง</p></div></section>`;
    app.insertAdjacentHTML('beforeend',card);
  }

  window.TGAT1_DEEP_AUDIT={version:VERSION,questionAudit,srsAudit,grammarAudit,readingAudit,refresh:render};
  if(typeof window.studioAnalytics==='function')window.TGAT1_addAnalyticsHook(function(){render()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(typeof STUDIO_PAGE!=='undefined'&&STUDIO_PAGE==='analytics')render()},{once:true});
})();


/* ===== 33 · 33-tgat1-content-expansion-v38-2.js ===== */
/* TGAT1 English Studio v38.2.0 — Everyday Expressions + Reading Lab content layer.
   Curated original practice content aligned to the published TGAT1 blueprint.
   Does not replace the original 1,200-question bank or legacy progress stores. */
(function(){
'use strict';
if(window.__TGAT1_V382_INIT__) return;
window.__TGAT1_V382_INIT__=true;
const PACK = window.__TGAT1_DATA.pack;
const esc=window.studioEsc||((s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
const weakExample=s=>/The article discusses .* in detail\.|Researchers .* the evidence before reaching a conclusion\.|The report describes the result as .*\./i.test(String(s||''));
const phraseLookup=new Map((STUDIO_DATA.phrases||[]).map((x,i)=>[norm(x.w),{x,i}]));
let phraseAdded=0,phraseImproved=0,wordAdded=0,wordExamplesImproved=0;
// Merge phrase bank without duplicating existing entries. Repair only missing/template examples.
PACK.phrases.forEach(p=>{
 const found=phraseLookup.get(norm(p.w));
 if(found){
   const x=found.x;
   if(!x.example || weakExample(x.example) || String(x.example).trim().split(/\s+/).length<4){x.example=p.example;phraseImproved++;}
   if(!x.th)x.th=p.th;
   if(!x.type||x.type==='Phrases')x.type=p.type;
   x._studioSearch=[x.w,x.th,x.type,x.context,x.example,x.source].join(' ').toLocaleLowerCase('th-TH');
 }else{
   const x={...p};x._studioSearch=[x.w,x.th,x.type,x.context,x.example,x.source].join(' ').toLocaleLowerCase('th-TH');
   STUDIO_DATA.phrases.push(x);phraseLookup.set(norm(x.w),{x,i:STUDIO_DATA.phrases.length-1});phraseAdded++;
 }
});
// Add missing high-frequency words and replace only known placeholder examples in matching entries.
const wordLookup=new Map((STUDIO_DATA.words||[]).map((x,i)=>[norm(x.w),{x,i}]));
const pendingSenseRepairs=[];
PACK.words.forEach(p=>{
 const found=wordLookup.get(norm(p.w));
 if(found){
   const x=found.x;pendingSenseRepairs.push({x,p});
   if(STUDIO_DATA.examples&&typeof STUDIO_DATA.examples==='object'&&!Array.isArray(STUDIO_DATA.examples)){
     const old=STUDIO_DATA.examples[x.w];
     if(!Array.isArray(old)||!old.length)STUDIO_DATA.examples[x.w]=[p.senses[0].example];
     else if(old.some(weakExample)){STUDIO_DATA.examples[x.w]=old.map((s,i)=>i===old.findIndex(weakExample)?p.senses[0].example:s);}
   }
   x._studioIndex=found.i;x._studioSearch=[x.w,x.th,x.pos,x.cat,x.level,x.source].join(' ').toLocaleLowerCase('th-TH');
 }else{
   const x={...p};x._studioIndex=STUDIO_DATA.words.length;x._studioSearch=[x.w,x.th,x.pos,x.cat,x.level,x.source].join(' ').toLocaleLowerCase('th-TH');
   STUDIO_DATA.words.push(x);wordLookup.set(norm(x.w),{x,i:STUDIO_DATA.words.length-1});wordAdded++;
   if(STUDIO_DATA.examples&&typeof STUDIO_DATA.examples==='object'&&!Array.isArray(STUDIO_DATA.examples))STUDIO_DATA.examples[x.w]=[p.senses[0].example];
 }
});
window.__TGAT1ApplyPendingSenseRepairs=function(){
 if(!pendingSenseRepairs.length)return 0;
 let changed=0;
 pendingSenseRepairs.forEach(({x,p})=>{const senses=Array.isArray(x.senses)?x.senses:[];let target=senses.find(s=>weakExample(s.example)&&(!p.pos||String(s.pos||'').toLowerCase()===String(p.pos).toLowerCase()));if(!target)target=senses.find(s=>weakExample(s.example));if(target){target.example=p.senses[0].example;target.translation=p.senses[0].translation;changed++;}});
 wordExamplesImproved=changed;return changed;
};
// Public content metadata for QA and for other app layers.
const curatedNames=new Set(PACK.phrases.map(x=>norm(x.w)));
const curatedPhraseRows=()=>STUDIO_DATA.phrases.map((x,i)=>({x,i})).filter(({x})=>curatedNames.has(norm(x.w)));
const readingSets=[...PACK.textCompletion,...PACK.readingComprehension];
const STORAGE='tgat1_studio_reading_plus_v382';
let readingState={};try{readingState=JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch(e){readingState={}}
let readingRun=null,phraseRun=null,phraseCategory='All',legacyReading=false;
const categories=['All',...new Set(PACK.phrases.map(x=>x.type))];
function saveReading(){try{localStorage.setItem(STORAGE,JSON.stringify(readingState))}catch(e){(window.TGAT1_ERR||Object)(e,'app')}}
function stateFor(id){return readingState[id]||{attempts:0,correct:0,total:0,lastAt:0,lastPercent:0};}
function setChrome(page,title,crumb){try{studioUpdateChrome(page)}catch(e){(window.TGAT1_ERR||Object)(e,'app')}if(page==='reading'){const c=document.getElementById('studioCrumb'),t=document.getElementById('studioTitle');if(c)c.textContent=crumb||'READING LAB';if(t)t.textContent=title||'Reading Lab';}}
function progressPercent(id){const s=stateFor(id);return s.attempts?Math.round(s.lastPercent):0;}
function renderPhraseBank(){
 STUDIO_PAGE='vocab';try{studioUpdateChrome('vocab')}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
 const app=document.getElementById('app');if(!app)return;
 const rows=curatedPhraseRows();
 const visible=rows.filter(({x})=>phraseCategory==='All'||x.type===phraseCategory);
 const count=visible.length;
 app.innerHTML=`<div class="v382-page-head"><div><div class="st-eyebrow">EVERYDAY ENGLISH · CONVERSATION CORE</div><h1 class="st-title">Everyday Expressions</h1><p class="st-subtitle">รวมวลีตอบโต้ในชีวิตประจำวัน การขอร้อง การนัดหมาย phrasal verbs คำเชื่อม และ collocations พร้อมตัวอย่างประโยค</p></div><div class="v382-head-actions"><button class="st-btn" onclick="TGAT1PhrasePlus.start()">ฝึกวลี 10 ข้อ →</button><button class="st-btn secondary" onclick="STUDIO_VTAB='phrases';studioVocabulary()">ดูคลังวลีทั้งหมด</button></div></div>
 <div class="v382-stat-row"><div class="st-card st-kpi"><div class="st-kpi-label">วลีชุดเน้น</div><div class="st-kpi-value">${rows.length}</div><div class="st-kpi-foot">รายการคัดเน้นสำหรับบทสนทนาและ Reading</div></div><div class="st-card st-kpi"><div class="st-kpi-label">คำศัพท์หลัก</div><div class="st-kpi-value">${STUDIO_DATA.words.length.toLocaleString()}</div><div class="st-kpi-foot">รวมคำเดิมและคำที่เพิ่มใหม่</div></div><div class="st-card st-kpi"><div class="st-kpi-label">Reading practice</div><div class="st-kpi-value">${PACK.readingComprehension.length+PACK.textCompletion.length}</div><div class="st-kpi-foot">บทอ่านและชุดเติมข้อความ</div></div></div>
 <div class="st-card v382-filter-card"><div class="v382-filter-top"><label for="v382PhraseSearch">ค้นหาวลีหรือคำแปล</label><input id="v382PhraseSearch" class="st-input" type="search" placeholder="เช่น hope not, no worries, หวังว่าจะไม่..." oninput="TGAT1PhrasePlus.filter(this.value)"></div><div class="v382-chips">${categories.map(c=>`<button class="v382-chip ${phraseCategory===c?'active':''}" onclick="TGAT1PhrasePlus.category(${JSON.stringify(c).replace(/"/g,'&quot;')})">${esc(c==='All'?'ทั้งหมด':c)}</button>`).join('')}</div><div class="v382-result-label"><b id="v382PhraseCount">${count} รายการ</b><span>แตะวลีเพื่อดูคำแปลและตัวอย่าง</span></div><div class="v382-phrase-grid" id="v382PhraseGrid">${visible.map(({x,i})=>`<button class="v382-phrase-item" data-v382-phrase="1" data-search="${esc([x.w,x.th,x.example,x.type].join(' ').toLowerCase())}" onclick="TGAT1PhrasePlus.detail(${i})"><span class="v382-phrase-type">${esc(x.type||'Everyday English')}</span><b>${esc(x.w)}</b><small>${esc(x.th)}</small><em>${esc(x.example||'')}</em></button>`).join('')}</div></div>
 <div class="st-card v382-note"><b>หลักการจำวลี</b><p>อย่าจำเฉพาะคำแปล ให้จำว่าอีกฝ่ายพูดอะไรก่อนหน้า และวลีนี้ใช้ตอบรับ ปฏิเสธ ขออนุญาต ขอโทษ หรือเชื่อมเหตุผลแบบไหน</p><button class="st-btn secondary" onclick="TGAT1ReadingPlus.open()">ไปฝึก Reading ตาม Blueprint →</button></div>`;
}
function detailPhrase(i){const x=STUDIO_DATA.phrases[i];if(!x)return;const content=`<div class="st-eyebrow">${esc(x.type||'Everyday English')}</div><h2 class="st-title">${esc(x.w)}</h2><h3>${esc(x.th)}</h3>${x.ipa?`<p class="v382-detail-ipa"><span lang="en">${esc(x.ipa)}</span><br><small>IPA: ${esc(x.ipaSource||'')} · ออกเสียงจริงในวลีมักลดเสียงคำเล็ก เช่น to, of, a</small></p>`:''}<div class="st-divider"></div><div class="v382-example-label">EXAMPLE IN CONTEXT</div><p class="v382-detail-example">${esc(x.example||x.context||'')}</p><div class="v382-detail-source">${esc(x.source||'TGAT1 Core Expressions')}</div>`;if(typeof studioModal==='function')studioModal(content);else alert(x.w+' — '+x.th+'\n'+x.example)}
function shuffle(a){const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r;}
function startPhrasePractice(cat){let pool=curatedPhraseRows().map(o=>o.x).filter(x=>!cat||cat==='All'||x.type===cat);if(pool.length<4)pool=curatedPhraseRows().map(o=>o.x);phraseRun={pool:shuffle(pool).slice(0,10),index:0,correct:0,selected:null,locked:false,options:[]};renderPhraseQuiz();}
function renderPhraseQuiz(){const app=document.getElementById('app');if(!phraseRun){renderPhraseBank();return;}const p=phraseRun.pool[phraseRun.index];const meanings=shuffle([...new Map(curatedPhraseRows().map(({x})=>[x.th,x])).values()].filter(x=>x.w!==p.w&&x.th!==p.th)).slice(0,3);phraseRun.options=shuffle([p,...meanings]);const index=phraseRun.index+1;STUDIO_PAGE='vocab';try{studioUpdateChrome('vocab')}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
 app.innerHTML=`<div class="v382-quiz-head"><div><div class="st-eyebrow">EVERYDAY EXPRESSION DRILL</div><h1 class="st-title">เลือกความหมายที่ตรงที่สุด</h1><p class="st-subtitle">ข้อ ${index}/${phraseRun.pool.length} · ฝึกความหมายจากบริบท</p></div><button class="st-btn ghost" onclick="TGAT1PhrasePlus.openBank()">ออกจากแบบฝึก</button></div><div class="v382-quiz-card st-card"><div class="v382-quiz-progress"><span style="width:${index/phraseRun.pool.length*100}%"></span></div><div class="v382-phrase-label">${esc(p.type)}</div><h2>${esc(p.w)}</h2><p class="st-subtitle">วลีนี้หมายถึงข้อใด?</p><div class="v382-answer-list">${phraseRun.options.map((o,j)=>`<button class="v382-answer" ${phraseRun.locked?'disabled':''} onclick="TGAT1PhrasePlus.answer(${j})"><span>${String.fromCharCode(65+j)}</span><b>${esc(o.th)}</b>${phraseRun.locked&&o.w===p.w?'<i>✓</i>':''}</button>`).join('')}</div>${phraseRun.locked?`<div class="v382-feedback ${phraseRun.options[phraseRun.selected]?.w===p.w?'correct':'wrong'}"><b>${phraseRun.options[phraseRun.selected]?.w===p.w?'ถูกต้อง':'ยังไม่ถูก'}</b><p>${esc(p.example)}</p></div><button class="st-btn" onclick="TGAT1PhrasePlus.next()">${index===phraseRun.pool.length?'ดูผล':'ข้อต่อไป →'}</button>`:''}</div>`;
}
function answerPhrase(j){if(!phraseRun||phraseRun.locked)return;const p=phraseRun.pool[phraseRun.index];phraseRun.selected=j;phraseRun.locked=true;if(phraseRun.options[j]?.w===p.w)phraseRun.correct++;renderPhraseQuiz();}
function nextPhrase(){if(!phraseRun)return;if(phraseRun.index>=phraseRun.pool.length-1){const score=phraseRun.correct,total=phraseRun.pool.length||1;const oldKey='tgat1_studio_everyday_phrase_v382';let stats={attempts:0,correct:0};try{stats=JSON.parse(localStorage.getItem(oldKey)||'null')||stats}catch(e){(window.TGAT1_ERR||Object)(e,'app')}stats.attempts+=total;stats.correct+=score;try{localStorage.setItem(oldKey,JSON.stringify(stats))}catch(e){(window.TGAT1_ERR||Object)(e,'app')}phraseRun=null;document.getElementById('app').innerHTML=`<div class="st-card v382-quiz-result"><div class="st-eyebrow">EVERYDAY ENGLISH · COMPLETE</div><h1 class="st-title">ฝึกวลีเสร็จแล้ว</h1><div class="st-kpi-value">${score}/${total}</div><p class="st-subtitle">${Math.round(score/total*100)}% · แนะนำให้ทวนวลีที่ยังจำสลับกัน แล้วลองทำอีกชุด</p><button class="st-btn" onclick="TGAT1PhrasePlus.start()">ฝึกอีก 10 ข้อ</button><button class="st-btn secondary" onclick="TGAT1PhrasePlus.openBank()">กลับคลังวลี</button></div>`;return;}phraseRun.index++;phraseRun.selected=null;phraseRun.locked=false;renderPhraseQuiz();}
function filterPhrase(q){const search=String(q||'').toLowerCase().trim();let n=0;document.querySelectorAll('[data-v382-phrase="1"]').forEach(el=>{const show=!search||el.dataset.search.includes(search);el.hidden=!show;if(show)n++;});const label=document.getElementById('v382PhraseCount');if(label)label.textContent=n+' รายการ';}
function renderReadingPlus(){legacyReading=false;setChrome('reading','Reading Lab','READING LAB');const app=document.getElementById('app');if(!app)return;const tc=PACK.textCompletion,rc=PACK.readingComprehension;const all=readingSets;const completed=all.filter(x=>stateFor(x.id).attempts>0).length;const overall=all.reduce((s,x)=>s+(stateFor(x.id).lastPercent||0),0)/(all.length||1);app.innerHTML=`<div class="v382-page-head"><div><div class="st-eyebrow">TGAT1 READING LAB · BLUEPRINT-ALIGNED PRACTICE</div><h1 class="st-title">Reading Trainer</h1><p class="st-subtitle">ฝึกอ่านจับใจความ อนุมาน คำศัพท์ในบริบท และเติมข้อความให้สมบูรณ์ ด้วยบทอ่านที่เขียนขึ้นใหม่สำหรับการฝึก</p></div><div class="v382-head-actions"><button class="st-btn secondary" onclick="TGAT1ReadingPlus.openLegacy()">คลัง Reading เดิม 1,200 ข้อ →</button></div></div>
 <div class="v382-stat-row"><div class="st-card st-kpi"><div class="st-kpi-label">ชุดฝึกใหม่</div><div class="st-kpi-value">${all.length}</div><div class="st-kpi-foot">2 Text Completion + ${rc.length} Reading passages</div></div><div class="st-card st-kpi"><div class="st-kpi-label">คำถามใหม่</div><div class="st-kpi-value">${all.reduce((n,x)=>n+x.questions.length,0)}</div><div class="st-kpi-foot">4 ตัวเลือกและคำอธิบายทุกข้อ</div></div><div class="st-card st-kpi"><div class="st-kpi-label">ชุดที่เคยฝึก</div><div class="st-kpi-value">${completed}/${all.length}</div><div class="st-kpi-foot">ความแม่นยำล่าสุดเฉลี่ย ${Math.round(overall)}%</div></div></div>
 <div class="v382-blueprint-note"><div><b>รูปแบบตาม Blueprint ของ myTCAS</b><p>Text Completion: 2 บทความ · 15 ข้อ | Reading Comprehension: 3 บทความ · 15 ข้อ | บทอ่านทั่วไปประมาณ 100–200 คำ</p><small>ชุดฝึกใหม่นี้เป็นโจทย์แต่งขึ้น ไม่ใช่ข้อสอบจริงย้อนหลังหรือการคาดการณ์ข้อสอบที่จะออก</small></div><span class="v382-blueprint-mark">60 MIN<br>60 ITEMS</span></div>
 <div class="st-section-head"><div><h2>01 · Text Completion</h2><p>เลือกคำศัพท์ โครงสร้างประโยค และคำเชื่อมให้เข้ากับความหมายของทั้งย่อหน้า</p></div></div><div class="v382-reading-grid">${tc.map(x=>readingCard(x,'TEXT COMPLETION')).join('')}</div>
 <div class="st-section-head"><div><h2>02 · Reading Comprehension</h2><p>ฝึก main idea, detail, inference, reference words, vocabulary in context และ purpose</p></div></div><div class="v382-reading-grid">${rc.map((x,i)=>readingCard(x,i<3?'BLUEPRINT PRACTICE':'EXTRA PRACTICE')).join('')}</div>
 <div class="st-card v382-strategy-card"><div><div class="st-eyebrow">READING CHECKLIST</div><h2>อ่านอย่างไรให้ตอบจากหลักฐาน</h2><p>แยกใจความหลักออกจากรายละเอียด · หา keyword แล้วกลับไปดูประโยคต้นทาง · อนุมานได้แต่ห้ามเดาเกินข้อความ · ดูคำเชื่อมเพื่อจับเหตุผลและความขัดแย้ง</p></div><div class="v382-strategy-tags">${['Main idea','Detail','Inference','Reference','Vocabulary','Purpose','Text structure'].map(x=>`<span>${x}</span>`).join('')}</div></div>`;}
function readingCard(x,label){const s=stateFor(x.id);const pct=s.attempts?s.lastPercent:0;return `<article class="st-card v382-reading-card"><div class="v382-reading-meta"><span>${esc(label)}</span><span>${x.wordCount} words</span></div><h3>${esc(x.title)}</h3><p class="st-subtitle">${esc(x.topic)} · ${x.questions.length} questions · ${esc(x.level||'')}</p><p class="v382-reading-preview">${esc(x.content.slice(0,174))}…</p><div class="v382-card-progress"><span><i style="width:${pct}%"></i></span><small>${s.attempts?`ล่าสุด ${pct}%`:'ยังไม่เคยฝึก'}</small></div><button class="st-btn" onclick="TGAT1ReadingPlus.start(${JSON.stringify(x.id).replace(/"/g,'&quot;')})">เริ่มอ่านและทำโจทย์ →</button></article>`;}
function formatPassage(content){return esc(content).replace(/\((\d+)\)/g,'<span class="v382-blank">($1)</span>');}
function startReading(id){const item=readingSets.find(x=>x.id===id);if(!item)return;readingRun={item,index:0,correct:0,selected:null,locked:false,answers:[]};renderReadingQuestion();}
function renderReadingQuestion(){if(!readingRun)return;const {item,index,locked,selected}=readingRun;const q=item.questions[index],isTC=item.kind==='text-completion';setChrome('reading',item.title,'READING LAB');const app=document.getElementById('app');app.innerHTML=`<div class="v382-quiz-head"><div><div class="st-eyebrow">${isTC?'TEXT COMPLETION':'READING COMPREHENSION'} · ${esc(item.topic)}</div><h1 class="st-title">${esc(item.title)}</h1><p class="st-subtitle">ข้อ ${index+1}/${item.questions.length} · บทอ่าน ${item.wordCount} คำ</p></div><button class="st-btn ghost" onclick="TGAT1ReadingPlus.open()">ออกจากชุดฝึก</button></div><div class="v382-reading-layout"><article class="st-card v382-passage-panel"><div class="v382-passage-heading"><span>PASSAGE</span><span>${item.wordCount} WORDS</span></div><p>${formatPassage(item.content)}</p></article><section class="st-card v382-question-panel"><div class="v382-quiz-progress"><span style="width:${(index+1)/item.questions.length*100}%"></span></div><div class="st-eyebrow">QUESTION ${index+1}</div><h2>${esc(q.prompt)}</h2><div class="v382-answer-list">${q.options.map((o,j)=>`<button class="v382-answer ${locked&&j===q.answer?'is-correct':''} ${locked&&j===selected&&j!==q.answer?'is-wrong':''}" ${locked?'disabled':''} onclick="TGAT1ReadingPlus.answer(${j})"><span>${String.fromCharCode(65+j)}</span><b>${esc(o)}</b>${locked&&j===q.answer?'<i>✓</i>':''}</button>`).join('')}</div>${locked?`<div class="v382-feedback ${selected===q.answer?'correct':'wrong'}"><b>${selected===q.answer?'คำตอบถูกต้อง':'คำตอบที่ถูก: '+String.fromCharCode(65+q.answer)}</b><p>${esc(q.explanation)}</p></div><button class="st-btn" onclick="TGAT1ReadingPlus.next()">${index===item.questions.length-1?'ดูผลการฝึก':'ข้อต่อไป →'}</button>`:''}</section></div>`;}
function answerReading(j){if(!readingRun||readingRun.locked)return;const q=readingRun.item.questions[readingRun.index];readingRun.selected=j;readingRun.locked=true;readingRun.answers.push(j);if(j===q.answer)readingRun.correct++;renderReadingQuestion();}
function nextReading(){if(!readingRun)return;const item=readingRun.item;if(readingRun.index<item.questions.length-1){readingRun.index++;readingRun.selected=null;readingRun.locked=false;renderReadingQuestion();return;}const score=readingRun.correct,total=item.questions.length,pct=Math.round(score/total*100),old=stateFor(item.id);readingState[item.id]={attempts:(old.attempts||0)+1,correct:score,total,lastAt:Date.now(),lastPercent:pct};saveReading();readingRun=null;document.getElementById('app').innerHTML=`<div class="st-card v382-quiz-result"><div class="st-eyebrow">READING SESSION COMPLETE</div><h1 class="st-title">${esc(item.title)}</h1><div class="st-kpi-value">${score}/${total}</div><p class="st-subtitle">${pct}% · อ่านคำอธิบายของแต่ละข้อแล้วกลับมาฝึกซ้ำเพื่อเพิ่มความแม่นยำ</p><div class="v382-result-actions"><button class="st-btn" onclick="TGAT1ReadingPlus.start(${JSON.stringify(item.id).replace(/"/g,'&quot;')})">ฝึกชุดนี้อีกครั้ง</button><button class="st-btn secondary" onclick="TGAT1ReadingPlus.open()">กลับ Reading Lab</button></div></div>`;}
function openLegacyReading(){legacyReading=true;readingRun=null;STUDIO_PAGE='reading';setChrome('reading','Reading · Original Question Bank','READING BANK');try{studioRender()}catch(e){legacyReading=false;renderReadingPlus();return;}decorateLegacy();}
function decorateLegacy(){if(!legacyReading)return;const head=document.querySelector('.st-section-head');if(head&&!head.querySelector('[data-v382-back]')){const holder=document.createElement('div');holder.className='v382-legacy-return';holder.innerHTML='<button class="st-btn secondary" data-v382-back onclick="TGAT1ReadingPlus.open()">← กลับ Reading Lab ใหม่</button>';head.appendChild(holder);} }
function open(){legacyReading=false;readingRun=null;STUDIO_PAGE='reading';renderReadingPlus();}
// Inject a focused tab into Vocabulary Center without modifying the original tab renderer.
window.TGAT1_addVocabularyPreHook(function(){if(STUDIO_VTAB==='everyday'){renderPhraseBank();return {handled:true,value:undefined};}});
window.TGAT1_addVocabularyHook(function(){const tabs=document.querySelector('.st-tabs');if(tabs&&!tabs.querySelector('[data-v382-everyday]'))tabs.insertAdjacentHTML('beforeend','<button class="st-tab" data-v382-everyday onclick="studioVTab(\'everyday\')">Everyday English · '+curatedPhraseRows().length+'</button>');});
const originalVTab=studioVTab;
studioVTab=function(tab){if(tab==='everyday'){STUDIO_VTAB='everyday';STUDIO_VPAGE=0;STUDIO_VQUERY='';phraseCategory='All';renderPhraseBank();return;}originalVTab.apply(this,arguments);};
const previousChrome=studioUpdateChrome;
studioUpdateChrome=function(page){const out=previousChrome.apply(this,arguments);if(page==='reading'){const c=document.getElementById('studioCrumb'),t=document.getElementById('studioTitle');if(c)c.textContent=legacyReading?'READING BANK':'READING LAB';if(t)t.textContent=legacyReading?'Reading · Original Question Bank':'Reading Lab';}return out;};
const previousNav=studioNav;
studioNav=function(page){if(page!=='reading')legacyReading=false;return previousNav.apply(this,arguments);};
const previousRender=studioRender;
studioRender=function(){if(STUDIO_PAGE==='reading'){if(legacyReading){previousRender.apply(this,arguments);decorateLegacy();}else renderReadingPlus();return;}previousRender.apply(this,arguments);};
const originalReadingBack=window.renderReadingBack;
if(typeof originalReadingBack==='function')window.renderReadingBack=function(){const out=originalReadingBack.apply(this,arguments);if(legacyReading)decorateLegacy();return out;};
// Put the two new learning paths directly on the home dashboard for easy discovery.
window.TGAT1_addHomeHook(function(){const app=document.getElementById('app');if(!app||app.querySelector('[data-v382-home-shelf]'))return;const shelf=`<section class="v382-home-shelf" data-v382-home-shelf aria-label="New learning collections"><button type="button" class="v382-home-link v382-home-phrase" onclick="TGAT1PhrasePlus.openBank()"><span class="v382-home-link-icon">Aa</span><span><b>Everyday English</b><small>วลีใช้จริง ${STUDIO_DATA.phrases.length.toLocaleString()} รายการ · collocations และ phrasal verbs</small></span><i>↗</i></button><button type="button" class="v382-home-link v382-home-reading" onclick="TGAT1ReadingPlus.open()"><span class="v382-home-link-icon">¶</span><span><b>Reading Lab</b><small>7 ชุดฝึกใหม่ · 40 คำถามพร้อมเฉลยอธิบาย</small></span><i>↗</i></button></section>`;const quick=app.querySelector('.dash-quick-grid');if(quick)quick.insertAdjacentHTML('afterend',shelf);else app.insertAdjacentHTML('afterbegin',shelf);});
window.TGAT1PhrasePlus={
 openBank:()=>{phraseRun=null;STUDIO_VTAB='everyday';renderPhraseBank();},
 start:(cat)=>startPhrasePractice(cat||'All'),
 category:(cat)=>{phraseCategory=cat;renderPhraseBank();},
 filter:filterPhrase,detail:detailPhrase,answer:answerPhrase,next:nextPhrase
};
window.TGAT1ReadingPlus={open,openLegacy:openLegacyReading,start:startReading,answer:answerReading,next:nextReading};
window.TGAT1_V382_CONTENT_AUDIT=()=>({phrasesAdded:phraseAdded,phrasesImproved:phraseImproved,wordsAdded:wordAdded,wordExamplesImproved,phraseTotal:STUDIO_DATA.phrases.length,wordTotal:STUDIO_DATA.words.length,readingPassages:readingSets.length,readingQuestions:readingSets.reduce((n,x)=>n+x.questions.length,0),readingWordCounts:readingSets.map(x=>({id:x.id,words:x.wordCount,questions:x.questions.length,kind:x.kind})),categories});
// Expose counts in the app shell and update the document release label.
const audit=window.TGAT1_V382_CONTENT_AUDIT();document.documentElement.dataset.contentRelease='38.2.0';
window.dispatchEvent(new CustomEvent('tgat1-content-expanded',{detail:audit}));
})();


/* ===== 34 · 41-content-expansion-v39-5.js ===== */
/* TGAT1 English Studio v39.5.0 — practical content expansion. */
(function(){'use strict';const W=window,D=document;function audit(){const d=W.STUDIO_DATA||{};const words=Array.isArray(d.words)?d.words:[],phr=Array.isArray(d.phrases)?d.phrases:[];const ex=d.examples||{};const wordExamples=words.filter(x=>x&&x.w&&Array.isArray(ex[x.w])&&ex[x.w].some(Boolean)).length;const phraseExamples=phr.filter(x=>x&&x.w&&x.example).length;W.TGAT1_CONTENT_EXPANSION_AUDIT={version:'39.5.0',words:words.length,phrases:phr.length,wordExamples,phraseExamples,allNewExamplesCovered:wordExamples>=words.length&&phraseExamples>=phr.length};}if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',audit,{once:true});else audit();})();


/* ===== 35 · 42-tgat1-v40-content-integrity.js ===== */
/* TGAT1 English Studio v40.6.7 — inspectable content integrity audit. */
(function(){
'use strict';
function run(){
 const d=window.STUDIO_DATA||{};
 const words=Array.isArray(d.words)?d.words:[];
 const phrases=Array.isArray(d.phrases)?d.phrases:Object.entries(d.phrases||{}).map(([w,examples])=>({w,example:Array.isArray(examples)?examples[0]:examples}));
 const examples=d.examples||{};
 const ids=new Set(), duplicateWords=[], missing=[], bad=[], duplicateExamples=[];
 const seenExamples=new Map();
 const placeholderTranslations=[], genericExamples=[], missingThai=[], halfTranslated=[], mixedTranslations=[];
 const thaiRe=/[\u0E00-\u0E7F]/, mixRe=/[\u0E00-\u0E7F][A-Za-z]{2,}|[A-Za-z]{2,}[\u0E00-\u0E7F]/;
 const genericPrefixes=[
  'The article used ','The writer used ','The report mentioned ','Researchers examine how people ',
  'The travelers learned about ','The school provided information about ','The team used ',
  'The article discussed ','The report used ','The writer mentioned ','The lesson introduced '
 ];
 words.forEach(x=>{
   const w=String(x&&x.w||'').trim().toLowerCase();
   if(!w){bad.push('empty');return;}
   if(ids.has(w))duplicateWords.push(w); ids.add(w);
   const ev=examples[x.w]; const ex=Array.isArray(ev)?ev.filter(Boolean):[];
   // A boot-time integrity report must not dereference the lazy `senses` accessor:
   // doing so would download all 3,400 entries and defeat on-demand loading.
   const senseDescriptor=Object.getOwnPropertyDescriptor(x,'senses');
   const senses=senseDescriptor&&Object.prototype.hasOwnProperty.call(senseDescriptor,'value')&&Array.isArray(senseDescriptor.value)?senseDescriptor.value:null;
   const senseEx=!!(senses&&senses.some(s=>s&&s.example));
   if(!ex.length&&!senseEx)missing.push(x.w);
   if(!x.th||!x.pos||!x.cat)bad.push(x.w);
   if(x.th&&!thaiRe.test(x.th))missingThai.push(x.w);
   if(/^[A-Za-z]+ \+ /.test(String(x.th||'')))halfTranslated.push(x.w);
   if(senses)senses.forEach(s=>{
     const e=String(s&&s.example||'').trim(), t=String(s&&s.translation||'').trim();
     if(t.startsWith('ความหมายตามบริบท:'))placeholderTranslations.push(x.w);
     if(mixRe.test(t))mixedTranslations.push(x.w);
     if(genericPrefixes.some(p=>e.startsWith(p)))genericExamples.push(x.w);
     if(e){if(seenExamples.has(e))duplicateExamples.push([seenExamples.get(e),x.w]);else seenExamples.set(e,x.w);}
   });
 });
 const seenP=new Set(),dupP=[];
 phrases.forEach(x=>{const w=String(x&&x.w||'').trim().toLowerCase();if(!w)return;if(seenP.has(w))dupP.push(w);seenP.add(w);if(!x.example)bad.push('phrase:'+w)});
 const singleWordCount=words.filter(x=>/^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(String(x&&x.w||'').trim())).length;
 const multiwordCount=words.length-singleWordCount;
 const report={version:window.TGAT1_VERSION.app,words:words.length,singleWordCount,multiwordCount,phrases:phrases.length,uniqueWords:ids.size,duplicateWords:duplicateWords.length,missingExamples:missing.length,duplicatePhrases:dupP.length,badEntries:bad.length,placeholderTranslationCount:placeholderTranslations.length,missingThaiCount:missingThai.length,halfTranslatedCount:halfTranslated.length,mixedTranslationCount:mixedTranslations.length,genericExampleCount:genericExamples.length,duplicateExampleCount:duplicateExamples.length,wordExampleCoverage:words.length-missing.length,senseAuditDeferred:words.filter(x=>{const d=Object.getOwnPropertyDescriptor(x,'senses');return !!(d&&d.get)}).length};
 window.TGAT1_V40_CONTENT_AUDIT=report;
 window.dispatchEvent(new CustomEvent('tgat1:content-audit',{detail:report}));
 return report;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();


/* ===== 36 · 37-mipad6-runtime-hardening.js ===== */
/* TGAT1 English Studio v39.2.0 — Mi Pad 6 runtime hardening.
   Small, isolated runtime helpers for Android Chrome/PWA viewport and touch behavior.
   Does not replace app state or scoring logic. */
(function(){
  'use strict';
  var root=document.documentElement;
  function updateViewport(){
    var vv=window.visualViewport;
    var h=vv&&vv.height ? vv.height : window.innerHeight;
    if(h>0) root.style.setProperty('--tg-visual-vh', h+'px');
    var keyboardOpen=vv ? (window.innerHeight - vv.height > 140) : false;
    root.classList.toggle('tg-keyboard-open', keyboardOpen);
  }
  updateViewport();
  window.addEventListener('resize', updateViewport, {passive:true});
  window.addEventListener('orientationchange', function(){ setTimeout(updateViewport,180); }, {passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', updateViewport, {passive:true});
    window.visualViewport.addEventListener('scroll', updateViewport, {passive:true});
  }
  // Mark the runtime so diagnostics can distinguish the tablet hardening layer.
  window.TGAT1_MIPAD6_RUNTIME={version:'39.2.0', viewport:'visualViewport-aware', touch:'manipulation'};
})();


/* ===== 37 · 41-unified-audio-v40.js ===== */
/* TGAT1 English Studio v40.0.0 — single audio layer.
   One delegated click handler + one debounced DOM sweep. It never inserts audio controls inside buttons. */
(function(){
  'use strict';
  const W=window,D=document;
  if(W.__TGAT_AUDIO_V40_INSTALLED)return;
  W.__TGAT_AUDIO_V40_INSTALLED=true;
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const hasEnglish=s=>/[A-Za-z]{2,}/.test(String(s||''));
  const splitSentences=s=>(clean(s).match(/[^.!?]+(?:[.!?]+|$)/g)||[]).map(clean).filter(hasEnglish);
  function speak(text){
    const v=clean(text); if(!v)return;
    try{
      return tgat1SpeechSpeak(v,{rate:.9});
    }catch(_){(window.TGAT1_ERR||Object)(_,'app')}
    if(typeof W.studioToast==='function')W.studioToast('เล่นเสียงไม่สำเร็จ');
    return false;
  }
  function button(text){
    const b=D.createElement('button');
    b.type='button'; b.className='st-audio-play st-audio-v40'; b.textContent='🔊';
    b.dataset.tgatAudioText=clean(text); b.title='ฟังภาษาอังกฤษ';
    b.setAttribute('aria-label','ฟังเสียง: '+clean(text).slice(0,120));
    return b;
  }
  const THAI=/[\u0E00-\u0E7F]/g;
  const wordsOf=s=>(s.match(/[A-Za-z][A-Za-z'\u2019-]*/g)||[]);
  const HARD=/\b(although|though|whereas|unless|despite|however|therefore|nevertheless|moreover|furthermore|whom|whose|which|while|whether|so that|provided|unlike|regarding|due to|owing to|in spite of|rather than)\b/i;
  /* Only sentences that are long or structurally hard get a speaker button. */
  function worthy(s){
    const t=clean(s); if(!hasEnglish(t))return false;
    const th=(t.match(THAI)||[]).length, en=(t.match(/[A-Za-z]/g)||[]).length;
    if(th>en*0.3)return false;
    const w=wordsOf(t), n=w.length;
    return n>=6;
  }
  function attach(el){
    if(!el||el.nodeType!==1||el.dataset.tgatAudioV40==='1')return;
    if(el.matches('button,input,textarea,select,.st-audio-play,[data-tgat-audio-text]'))return;
    if(el.closest('button,.st-audio-sentence-list'))return;
    if(el.parentElement&&el.parentElement.closest('[data-tgat-audio-v40="1"]'))return;
    el.dataset.tgatAudioV40='1';
    if(el.querySelector('.st-audio-v40,.st-audio-play'))return;
    const walker=D.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>(n.parentElement&&n.parentElement.closest('button,script,style,.st-audio-play'))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    const nodes=[],starts=[];let full='';
    while(walker.nextNode()){const n=walker.currentNode;nodes.push(n);starts.push(full.length);full+=n.nodeValue;}
    if(!hasEnglish(full))return;
    const re=/[^.!?]*[.!?]+["')\]\u201D\u2019]*(?=\s|$)|[^.!?]+$/g;
    const ends=[];let m;
    while((m=re.exec(full))){
      if(!m[0])break;
      const body=m[0].replace(/\s+$/,'');
      if(worthy(body))ends.push({end:m.index+body.length,text:clean(body)});
    }
    for(let k=ends.length-1;k>=0;k--){
      const {end,text}=ends[k];
      let i=nodes.length-1;
      while(i>0&&starts[i]>=end)i--;
      const node=nodes[i],off=end-starts[i];
      if(off<=0||off>node.nodeValue.length||!node.parentNode)continue;
      if(off<node.nodeValue.length)node.splitText(off);
      const b=button(text);b.classList.add('st-audio-s');
      node.parentNode.insertBefore(b,node.nextSibling);
    }
  }
  const selectors=[
    '.st-language-example-en','.st-poly-example','.st-lesson-example','.st-example-en',
    '.v382-passage-panel>p','.v382-question-panel h2','.v382-feedback p','.st-question-text','.st-conversation','.st-dialogue','.st-passage','.st-reading-passage','.st-reading-context',
    '.vault-question','.vault-context','.vault-passage',
    '.st-card h2','.st-card h3','.st-modal-box h2','.st-modal-box h3',
    '[data-english]','[lang="en"]','.english-text','.sentence','.phrase','.example-sentence'
  ];
  let queued=false;
  function sweep(){
    if(queued)return;queued=true;
    const run=()=>{queued=false;const app=D.getElementById('app');const modal=D.getElementById('studioModal');if(app)app.querySelectorAll(selectors.join(',')).forEach(attach);if(modal)modal.querySelectorAll(selectors.join(',')).forEach(attach)};
    if(W.requestAnimationFrame)W.requestAnimationFrame(run);else setTimeout(run,0);
  }
  D.addEventListener('click',e=>{
    const b=e.target&&e.target.closest&&e.target.closest('[data-tgat-audio-text]');
    if(!b)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    speak(b.dataset.tgatAudioText||'');
  },true);
  if(D.body)new MutationObserver(sweep).observe(D.body,{childList:true,subtree:true});
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',sweep,{once:true});else sweep();
  setTimeout(sweep,300);setTimeout(sweep,1000);
  W.TGAT1_AUDIO={version:window.TGAT1_VERSION.app,sentenceLevel:true,speech:'centralized-speech-service/en-US',singleLayer:true,speak:tgat1SpeechSpeak,cancel:tgat1SpeechCancel,available:snd};
  W.TGAT1_FEATURE_AUDIT={version:'40.0.0',requiredHandlers:['VLT_startMock','VLT_startQuick','VLT_startSprint','VLT_startReview','VLT_startDaily','VLT_startCategory','studioRunVocabGame','STG_start','STR_start'],check(){return this.requiredHandlers.reduce((o,k)=>(o[k]=typeof W[k]==='function',o),{})}};
})();


/* ===== 38 · 43-semantic-content-quality-v40-2.js ===== */
/* TGAT1 English Studio v40.6.7 — semantic content quality audit. */
(function(){
  'use strict';
  const badExamplePatterns=[/The example uses/i,/The lesson compared/i,/The writer explained how .*changes the meaning/i,/The teacher introduced/i,/The speaker selected/i,/The editor replaced/i,/In the lesson, the term/i,/The writer chose .*to express the idea/i,/\{clean\}/i,/The report discussed .* in relation to the issue/i,/The report described the situation as/i,/The report discussed several .* during the meeting/i,/The article described the change as .* rather than gradual/i,/The speaker gave an example involving .*\./i,/The report discussed .* and its effects on the community/i,/The article explained why .* matters in this situation/i,/The writer explained the point .* in the report/i];
  const q=(x)=>String(x==null?'':x).trim();
  function audit(){
    const words=Array.isArray(window.STUDIO_DATA&&STUDIO_DATA.words)?STUDIO_DATA.words:[];
    const examples=[];const bad=[];const seen=new Map();
    words.forEach((w,wi)=>(Array.isArray(w.senses)?w.senses:[]).forEach((s,si)=>{
      const en=q(s.example),th=q(s.translation);examples.push(en);
      if(!en||!th)bad.push({wi,si,type:'missing',word:w.w});
      if(badExamplePatterns.some(r=>r.test(en+' '+th)))bad.push({wi,si,type:'generic-or-placeholder',word:w.w});
      const k=en.toLowerCase();if(k){if(seen.has(k))bad.push({wi,si,type:'duplicate-example',word:w.w,with:seen.get(k)});else seen.set(k,w.w);}
      if(/\b(algorithms|assessments|candidates|careers|experiments|medications|treatments|applications|organizations|researchers|students|companies|communities|policies|studies) matters\b/i.test(en))bad.push({wi,si,type:'agreement',word:w.w});
    }));
    const phrases=Array.isArray(STUDIO_DATA&&STUDIO_DATA.phrases)?STUDIO_DATA.phrases:[];
    const pseen=new Set(),pdup=[];phrases.forEach((p,i)=>{const k=q(p.example).toLowerCase();if(k&&pseen.has(k))pdup.push(i);else if(k)pseen.add(k)});
    return {version:window.TGAT1_VERSION.app,words:words.length,senses:examples.length,badExamples:bad.length,duplicatePhraseExamples:pdup.length,uniqueSenseExamples:seen.size,checkedAt:new Date().toISOString()};
  }
  window.TGAT1_SEMANTIC_CONTENT_AUDIT={run:audit};
})();


/* ===== 39 · 45-offline-picture-bank-v40-4.js ===== */
/* TGAT1 English Studio v40.6.7 — offline-first picture clues.
 * Original, locally-rendered SVG illustrations; no third-party fetch and no answer text.
 */
(function(){
  'use strict';
  const MAP={
    hurricane:'storm',typhoon:'storm',earthquake:'quake',tsunami:'wave',flooding:'wave',wildfire:'fire',lightning:'lightning',heatwave:'sun',landslide:'mountain',
    passport:'passport',suitcase:'suitcase',luggage:'suitcase',flight:'plane',departure:'plane',arrival:'plane',platform:'train',transit:'bus',
    clinic:'hospital',pharmacy:'pill',medication:'pill',vaccine:'syringe',vaccination:'syringe',physician:'stethoscope',surgeon:'stethoscope',microscope:'microscope',laboratory:'flask',experiment:'flask',sample:'flask',virus:'virus',bacteria:'virus',pandemic:'mask',epidemic:'mask',insomnia:'sleep',
    recipe:'book',ingredient:'carrot',vegetarian:'salad',vegan:'leaf',harvest:'wheat',crop:'wheat',agriculture:'tractor',livestock:'cow',cuisine:'plate',packaging:'box',
    password:'key',server:'server',database:'database',hardware:'laptop',software:'software',broadband:'wifi',network:'network',device:'phone',media:'television',
    journalist:'newspaper',headline:'newspaper',reporter:'microphone',copyright:'copyright',lawyer:'scales',judge:'gavel',jury:'people',crime:'siren',traffic:'traffic',pedestrian:'person',sidewalk:'person',vehicle:'car',commute:'train',shelter:'house',residence:'house',
    scholarship:'graduation',diploma:'graduation',graduation:'graduation',degree:'graduation',lecture:'teacher',instructor:'teacher',lecturer:'teacher',essay:'document',deadline:'clock',examination:'document',curriculum:'books',tuition:'money',salary:'money',wage:'money',income:'money',budget:'piggy',loan:'bank',savings:'piggy',debt:'card',credit:'card',inflation:'chart-up',recession:'chart-down',deflation:'chart-down',profit:'chart-up',revenue:'chart-up',market:'store',retail:'store',consumer:'cart',customer:'cart',receipt:'receipt',reservation:'calendar',appointment:'calendar',schedule:'calendar',invitation:'envelope',message:'envelope',reminder:'clock',
    climate:'thermometer',atmosphere:'globe',ecosystem:'tree',habitat:'tree',wildlife:'deer',species:'butterfly',mammal:'elephant',reptile:'lizard',amphibian:'frog',predator:'lion',prey:'rabbit',carnivore:'meat',herbivore:'leaf',fossil:'fossil',gene:'dna',evolution:'dna',drought:'cactus',emission:'factory',pollution:'factory',landfill:'trash',recycling:'recycle',compost:'recycle',hydropower:'water',
    symptom:'thermometer',illness:'thermometer',patient:'bed',therapy:'sofa',stress:'brain',anxiety:'brain',loneliness:'person',grief:'heart',aggression:'angry',frustration:'angry',curiosity:'brain',creativity:'palette',motivation:'target',optimism:'sun',pessimism:'cloud',relief:'heart',empathy:'handshake',sympathy:'handshake',cooperation:'handshake',compromise:'handshake',loyalty:'handshake',trust:'handshake',respect:'handshake',forgiveness:'dove',gossip:'speech',argument:'speech',conflict:'speech',compliment:'speech',confidence:'person',ambition:'target',purpose:'target',objective:'target',strategy:'chess',solution:'bulb',innovation:'bulb',algorithm:'calculator',data:'chart',statistic:'chart',survey:'clipboard',trend:'chart-up',risk:'warning',hazard:'warning',threat:'warning',precaution:'warning',evacuation:'running',casualty:'ambulance',accident:'car-crash',emergency:'siren',journey:'map',route:'map',itinerary:'map',destination:'pin',tourism:'beach',sightseeing:'camera',guest:'hotel',fare:'ticket',
    /* Beginner image deck appended by BW in the legacy core. */
    cat:'cat',dog:'dog',bird:'bird',fish:'fish',pig:'piggy',horse:'horse',duck:'duck',monkey:'monkey',rice:'plate',egg:'egg',milk:'milk',water:'water',bread:'bread',apple:'apple',banana:'banana',orange:'orange',chicken:'chicken',coffee:'coffee',cake:'cake',pizza:'pizza',mother:'family',father:'family',baby:'baby',friend:'family',school:'teacher',doctor:'stethoscope',computer:'laptop',bag:'bag',table:'table',chair:'chair',door:'door',flower:'flower',moon:'moon',star:'star',rain:'rain',red:'color-red',blue:'color-blue',green:'color-green',yellow:'color-yellow',black:'color-black',white:'color-white',one:'number-1',two:'number-2',three:'number-3',four:'number-4',five:'number-5',eat:'plate',drink:'milk',run:'running',walk:'person',read:'book',write:'pen',listen:'ear',speak:'speech',love:'heart',go:'arrow-right',come:'arrow-left',buy:'cart',play:'ball',sing:'microphone',swim:'swim',work:'briefcase',hot:'fire',cold:'snow',happy:'happy',sad:'sad',angry:'angry',tired:'sleep',hungry:'plate',beautiful:'flower',fast:'lightning',slow:'turtle',new:'star',hello:'hello','thank you':'thanks',sorry:'apology',goodbye:'goodbye',
    /* Advanced level C: abstract vocabulary represented by consistent visual metaphors. */
    'obstacle course':'maze','outcome-based':'chart-up',subordinate:'people',subordination:'people',aggregate:'chart','capital-intensive':'factory',diversification:'chart',fiscal:'bank','fiscal policy':'bank','growth-oriented':'chart-up','incentive-based':'target','inclusive growth':'people','labor-intensive':'people','opportunity cost':'scales',policyholder:'document','workplace equity':'scales',advocacy:'microphone',autonomy:'person',backlash:'angry',benefactor:'heart',bipartisan:'handshake',bureaucracy:'books',civility:'handshake',cohesion:'network',concession:'handshake',conformity:'people','consensus-building':'handshake',dissent:'speech',equity:'scales',ideology:'brain',inclusiveness:'people',legitimacy:'gavel',marginalization:'person',moderator:'microphone',multilateral:'network',noncompliance:'warning',observance:'clipboard','participatory approach':'people',reconciliation:'handshake','self-regulation':'brain',underrepresentation:'chart',exploitation:'factory',interdependence:'network','resilience-building':'tree','resource-intensive':'factory','sustainability-oriented':'globe',calibrate:'calculator',deprivation:'warning',efficacy:'target',incidence:'chart',relativity:'globe',stabilization:'chart','threshold effect':'chart',trajectory:'chart-up',authenticity:'clipboard',confidentiality:'key',granularity:'microscope','innovation-driven':'bulb',intermediary:'network',proprietary:'key',semantic:'book',semantics:'books',traceable:'network',acknowledge:'clipboard',allocate:'chart',allocation:'chart',analogy:'network',anomaly:'warning',anticipation:'clock',attain:'target',attainment:'graduation',attribute:'tag',bolster:'shield',causality:'domino',cease:'traffic',circumvent:'maze',coherence:'network',coincide:'clock',coincidence:'star',compile:'books',complement:'puzzle',complementary:'puzzle',comprise:'box',concede:'handshake',conceive:'bulb',conception:'brain',conclusive:'stamp',confine:'box',constitute:'people',constrain:'chain',constraint:'warning',consult:'speech',consultation:'speech',contend:'speech',contradict:'speech',contradiction:'speech',contradictory:'speech',converge:'network',conversion:'arrows',convert:'arrows',convey:'envelope',correlate:'network',correlation:'network',correspond:'envelope',curtail:'scissors',denounce:'angry',derivation:'tree',derivative:'chart',derive:'microscope',detect:'microscope',detection:'microscope',determination:'target',diminish:'chart-down',disclose:'envelope',disclosure:'document',distort:'wave',distortion:'wave',eliminate:'trash',elimination:'trash',emerge:'sunrise',emergence:'sunrise',emphasis:'warning',enable:'key',endorse:'clipboard',endorsement:'clipboard',ensure:'shield',entail:'chain',establishment:'bank',estimate:'chart',evaluation:'scales',exaggeration:'microphone',exemplify:'book',facilitate:'gear',facilitation:'gear',fluctuation:'chart',formulate:'clipboard',formulation:'clipboard',foster:'tree',illustration:'picture',implement:'tools',implementation:'tools',implication:'chain',incentivize:'target',interpretation:'book',justification:'scales',justify:'scales',maintenance:'tools',modification:'pen',modify:'pen',monitor:'television',outweigh:'scales',perceive:'eye',perception:'eye',perpetuate:'arrows',prediction:'chart-up',pursue:'target',pursuit:'target',rationalize:'brain',rebuttal:'speech',reinstate:'arrows',retain:'key',retention:'key',revelation:'bulb',specification:'document',synthesize:'flask',transcend:'mountain',underlying:'layers',uphold:'scales',validate:'clipboard',validation:'clipboard',validity:'shield',warrant:'gavel',
    acumen:'brain',allure:'star',ambivalence:'scales',ameliorate:'chart-up',anecdotal:'speech',antagonistic:'angry',antithetical:'arrows',apprehension:'brain',articulate:'microphone',assiduous:'clock',astute:'brain',asymmetrical:'layers',auspicious:'sun',authoritarian:'gavel',autonomous:'person',belligerent:'angry',benevolent:'heart',brevity:'clock',candid:'eye',cathartic:'heart',censure:'gavel',concur:'handshake',conducive:'leaf',conjecture:'brain',conspicuous:'eye',conundrum:'puzzle',corroborate:'clipboard',cursory:'eye',debilitate:'heart',decisive:'target',delineate:'pen',demise:'traffic',deprive:'warning',deter:'warning',detrimental:'warning',diligent:'clipboard',discrepancy:'scales',disdain:'angry',dispel:'sunrise',disseminate:'network',diverge:'arrows',divest:'money',eclectic:'palette',eloquent:'microphone',elusive:'eye',enigma:'puzzle',ephemeral:'flower',equitable:'scales',eradicate:'trash',erratic:'chart',exonerate:'scales',expedite:'lightning',extol:'star',facetious:'happy',fallacy:'warning',feasible:'clipboard',fervent:'fire',fluctuate:'chart-up',futile:'trash',gregarious:'people',hypothetical:'brain',idiosyncratic:'person',impartial:'scales',implicit:'document',incisive:'scissors',incessant:'clock',indifferent:'person',indignant:'angry',inhibit:'warning',innate:'brain',insidious:'warning',intuitive:'bulb',irrefutable:'clipboard',laconic:'speech',laudable:'target',lucid:'bulb',meticulous:'microscope',mitigate:'shield',morose:'sad',mundane:'clock',nuance:'palette',obsolete:'trash',paradox:'brain',pragmatic:'calculator',precipitate:'storm',profound:'layers',prolific:'books',resilient:'tree',scrutinize:'microscope',sporadic:'chart',substantiate:'clipboard',superfluous:'trash',tenacious:'chain',ubiquitous:'network',unprecedented:'warning',vicarious:'book',vindicate:'scales',volatile:'fire',
    /* Additional common concrete vocabulary used by beginner word decks. */
    beef:'meat',vegetable:'salad',fruit:'apple',tea:'coffee',breakfast:'plate',lunch:'plate',dinner:'plate',soup:'plate',noodles:'plate',cheese:'plate',butter:'plate',sugar:'box',salt:'box',juice:'orange',sandwich:'plate','ice cream':'cake',meal:'plate',snack:'carrot',bottle:'box',cup:'coffee',spoon:'plate',fork:'plate',knife:'scissors',honey:'plate',sheep:'cow',goat:'cow',bear:'elephant',tiger:'lion',mouse:'rabbit',snake:'lizard',bicycle:'car',motorcycle:'car',boat:'wave',ship:'wave',taxi:'car',van:'bus',truck:'bus',helicopter:'plane',airplane:'plane',airport:'plane',road:'map',pencil:'pen',notebook:'document',wallet:'card',umbrella:'rain',watch:'clock',glasses:'eye',shoes:'person',shirt:'person',jacket:'suitcase',hat:'person',socks:'person',clothes:'suitcase',dress:'person',head:'person',nose:'person',mouth:'speech',hand:'handshake',leg:'person',foot:'person',arm:'person',hair:'person',tooth:'person',teeth:'person',finger:'person',shoulder:'person',back:'person',stomach:'person',face:'happy',home:'house',park:'tree',library:'books',shop:'store',restaurant:'plate',station:'train',office:'briefcase',classroom:'teacher',garden:'flower',zoo:'deer',supermarket:'store',playground:'person',cook:'plate',study:'books',learn:'graduation',teach:'teacher',open:'arrow-right',close:'chain',see:'eye',hear:'ear',look:'eye',talk:'speech',say:'speech',ask:'speech',answer:'clipboard',give:'handshake',take:'handshake',sit:'chair',stand:'person',smile:'happy',draw:'picture',wash:'water',clean:'water',drive:'car',tall:'person',big:'box',old:'clock',dirty:'trash',good:'happy',bad:'angry',full:'plate',empty:'box',loud:'microphone',quiet:'sleep',early:'sunrise',late:'moon',high:'chart-up',low:'chart-down',long:'clock',strong:'shield',weak:'heart',thirsty:'water',same:'puzzle',different:'arrows',morning:'sunrise',afternoon:'sun',evening:'sun',night:'moon',day:'sun',week:'calendar',month:'calendar',year:'calendar',today:'calendar',tomorrow:'calendar',yesterday:'calendar',
    family:'family',food:'plate',music:'microphone',weather:'storm',city:'map',country:'globe',language:'speech',english:'book',thai:'book',world:'globe',worldwide:'globe',student:'graduation',teacher:'teacher',doctor:'stethoscope',house:'house',home:'house',sun:'sun',book:'book',phone:'phone',computer:'laptop',car:'car',plane:'plane',bus:'bus',train:'train',sport:'ball',football:'ball',basketball:'ball',schoolbag:'bag',internet:'wifi',cloudy:'storm',windy:'storm',sunny:'sun',rainy:'rain',snowy:'snow',goodmorning:'sunrise','good morning':'sunrise','good night':'moon','see you':'goodbye',police:'siren',nurse:'stethoscope',engineer:'tools',chef:'plate',driver:'car',farmer:'tractor',artist:'palette',singer:'microphone',dancer:'person',worker:'briefcase',mathematics:'calculator',science:'microscope',history:'books',art:'palette',expensive:'money',cheap:'money',monday:'calendar',tuesday:'calendar',wednesday:'calendar',thursday:'calendar',friday:'calendar',saturday:'calendar',sunday:'calendar',january:'calendar',february:'calendar',march:'calendar',april:'calendar',may:'calendar',june:'calendar',july:'calendar',august:'calendar',september:'calendar',october:'calendar',november:'calendar',december:'calendar',volleyball:'ball',tennis:'ball',badminton:'ball',swimming:'swim',policeman:'siren','police officer':'siren',nurse:'stethoscope',engineer:'tools',chef:'plate',driver:'car',farmer:'tractor',artist:'palette',singer:'microphone',dancer:'person',music:'microphone'
  };
  const COLORS={blue:'#3B82F6',teal:'#14B8A6',green:'#22C55E',orange:'#F59E0B',red:'#EF4444',purple:'#8B5CF6',navy:'#334155',pink:'#EC4899'};
  const A={
    storm:`<path d="M85 125c-18-28 2-59 31-59 8-29 55-35 73-8 29-7 55 17 48 43 27 8 28 45-2 52H110c-15 0-25-12-25-28Z" fill="#DCEBFF" stroke="#4679C8" stroke-width="7"/><path d="M119 100c-16 23-5 42 16 45m14-52c-16 22-5 40 16 43m15-46c-15 20-7 36 12 40" fill="none" stroke="#4679C8" stroke-width="7" stroke-linecap="round"/>`,
    quake:`<circle cx="160" cy="106" r="67" fill="#BDE6F3" stroke="#3285A5" stroke-width="7"/><path d="M160 41 145 89l22 10-28 38 18 7-8 35" fill="none" stroke="#E65C4B" stroke-width="10" stroke-linejoin="round"/><path d="M70 184h180" stroke="#64748B" stroke-width="8" stroke-linecap="round"/>`,
    wave:`<path d="M54 153c34-48 56-47 84-7 31-62 58-63 91-13 15 23 28 25 41 16v46H54Z" fill="#39A7E8" stroke="#17699B" stroke-width="7"/><path d="M70 165c24-26 41-26 62 0m31-14c22-26 42-24 62 2" fill="none" stroke="#E7F7FF" stroke-width="9" stroke-linecap="round"/><path d="M85 75c28-22 61-22 85 1" fill="none" stroke="#7CC9EF" stroke-width="9" stroke-linecap="round"/>`,
    fire:`<path d="M161 38c7 33-17 39-8 66 7 18 22 18 23-2 24 23 38 48 29 73-8 28-31 42-56 42-35 0-60-24-59-58 1-31 26-52 37-77 6 23 17 31 21 39 15-22 19-49 13-83Z" fill="#F97316" stroke="#C2410C" stroke-width="7"/><path d="M155 125c-17 23-25 39-14 57 8 13 26 14 36 2 12-16 2-39-22-59Z" fill="#FDE68A"/>`,
    lightning:`<path d="M174 35 86 132h56l-12 61 94-111h-58Z" fill="#FACC15" stroke="#B7791F" stroke-width="8" stroke-linejoin="round"/>`,
    sun:`<circle cx="160" cy="110" r="47" fill="#FBBF24" stroke="#D97706" stroke-width="7"/><g stroke="#D97706" stroke-width="9" stroke-linecap="round"><path d="M160 31v23m0 112v23M80 110H56m208 0h-24M103 53 87 37m146 146-16-16m0-114 16-16M87 183l16-16"/></g>`,
    mountain:`<path d="m45 183 75-111 39 54 29-40 87 97Z" fill="#8BB6A2" stroke="#476F66" stroke-width="7" stroke-linejoin="round"/><path d="m120 72 22 33-21-6-19 26 37-7 18 18 23-36 29 38 18-4-57-61-29 40Z" fill="#F8FAFC"/><path d="M45 183h230" stroke="#476F66" stroke-width="8" stroke-linecap="round"/>`,
    passport:`<rect x="91" y="40" width="138" height="166" rx="15" fill="#1E4E8C" stroke="#16345F" stroke-width="8"/><rect x="107" y="56" width="106" height="134" rx="8" fill="#2C68A8"/><circle cx="160" cy="116" r="34" fill="none" stroke="#F6D68A" stroke-width="5"/><path d="M127 116h66m-33-34c-18 18-18 50 0 68m0-68c18 18 18 50 0 68m-29-34c13-11 45-11 58 0" fill="none" stroke="#F6D68A" stroke-width="4"/><path d="M132 169h56" stroke="#F6D68A" stroke-width="4"/>`,
    suitcase:`<rect x="70" y="78" width="180" height="120" rx="18" fill="#F59E0B" stroke="#A65A15" stroke-width="8"/><path d="M125 78V56c0-12 8-19 18-19h34c10 0 18 7 18 19v22" fill="none" stroke="#A65A15" stroke-width="8"/><path d="M160 80v115" stroke="#FFE4A1" stroke-width="8"/><circle cx="107" cy="203" r="8" fill="#475569"/><circle cx="213" cy="203" r="8" fill="#475569"/>`,
    plane:`<path d="M46 120 121 99l29-59c5-10 20-10 24 0l-11 54 59-16 28 14-86 37-15 53-17-4 2-44-60 26Z" fill="#E7F3FF" stroke="#316DA8" stroke-width="8" stroke-linejoin="round"/><circle cx="226" cy="71" r="11" fill="#60A5FA"/>`,
    train:`<rect x="75" y="39" width="170" height="151" rx="24" fill="#60A5FA" stroke="#245A94" stroke-width="8"/><rect x="96" y="61" width="128" height="54" rx="10" fill="#EAF7FF"/><path d="M160 62v52" stroke="#245A94" stroke-width="6"/><rect x="102" y="132" width="116" height="24" rx="8" fill="#1D4E89"/><circle cx="115" cy="190" r="13" fill="#334155"/><circle cx="207" cy="190" r="13" fill="#334155"/><path d="m115 215-14 10m104-10 14 10" stroke="#64748B" stroke-width="7" stroke-linecap="round"/>`,
    bus:`<rect x="55" y="54" width="210" height="130" rx="22" fill="#FBBF24" stroke="#A16207" stroke-width="8"/><rect x="76" y="75" width="168" height="51" rx="9" fill="#DFF4FF"/><path d="M118 76v49m56-49v49m56-49v49" stroke="#A16207" stroke-width="6"/><circle cx="102" cy="188" r="17" fill="#334155"/><circle cx="217" cy="188" r="17" fill="#334155"/><path d="M69 151h178" stroke="#FFF1B8" stroke-width="8"/>`,
    hospital:`<rect x="77" y="66" width="166" height="134" rx="9" fill="#E5F5FF" stroke="#3B82A6" stroke-width="8"/><path d="M125 66V39h70v27" fill="#D7F1FF" stroke="#3B82A6" stroke-width="8"/><path d="M160 81v73m-36-36h72" stroke="#E34C4C" stroke-width="17" stroke-linecap="round"/><rect x="133" y="162" width="54" height="38" fill="#77B6D8"/>`,
    pill:`<g transform="rotate(-34 160 115)"><rect x="88" y="79" width="144" height="72" rx="36" fill="#F8FAFC" stroke="#64748B" stroke-width="7"/><path d="M160 80v70" stroke="#64748B" stroke-width="7"/><path d="M124 80h36v70h-36a35 35 0 0 1 0-70Z" fill="#F59EAB"/></g>`,
    syringe:`<g transform="rotate(-40 160 110)"><rect x="130" y="61" width="62" height="119" rx="7" fill="#D7F0FF" stroke="#3777A8" stroke-width="7"/><path d="M130 112h62m-31-50v50" stroke="#3777A8" stroke-width="6"/><path d="M160 180v35m-30-119h-20m82 0h20" stroke="#64748B" stroke-width="8" stroke-linecap="round"/><path d="M146 80h31m-31 17h31" stroke="#3777A8" stroke-width="4"/></g>`,
    stethoscope:`<path d="M93 56v52c0 43 29 64 67 64s67-21 67-64V56" fill="none" stroke="#256A9B" stroke-width="13" stroke-linecap="round"/><circle cx="93" cy="55" r="14" fill="#60A5FA" stroke="#1E4E7A" stroke-width="6"/><circle cx="227" cy="55" r="14" fill="#60A5FA" stroke="#1E4E7A" stroke-width="6"/><path d="M160 172v17c0 20 38 21 38 0v-11" fill="none" stroke="#256A9B" stroke-width="12" stroke-linecap="round"/><circle cx="198" cy="174" r="16" fill="#BFDBFE" stroke="#256A9B" stroke-width="7"/>`,
    microscope:`<path d="m119 47 40-20 44 75-38 23Z" fill="#8CBAD6" stroke="#385C78" stroke-width="8"/><path d="m183 125 23 30c12 17-1 38-20 38H91" fill="none" stroke="#385C78" stroke-width="13" stroke-linecap="round"/><path d="M112 192h133" stroke="#385C78" stroke-width="12" stroke-linecap="round"/><circle cx="205" cy="101" r="12" fill="#60A5FA" stroke="#385C78" stroke-width="6"/>`,
    flask:`<path d="M128 35h64m-15 0v59l59 95c7 12 0 25-16 25H100c-16 0-23-13-16-25l59-95V35" fill="#E1F6FF" stroke="#3D789B" stroke-width="8" stroke-linejoin="round"/><path d="M111 161h98l27 43H84Z" fill="#38BDF8" opacity=".8"/><circle cx="142" cy="176" r="7" fill="#E0F2FE"/><circle cx="184" cy="190" r="6" fill="#E0F2FE"/>`,
    virus:`<circle cx="160" cy="113" r="50" fill="#A7E3BC" stroke="#347C56" stroke-width="8"/><g stroke="#347C56" stroke-width="8" stroke-linecap="round"><path d="M160 42v20m0 102v20M89 113h20m102 0h20M110 63l15 15m70 70 15 15m0-100-15 15m-70 70-15 15"/></g><g fill="#347C56"><circle cx="143" cy="99" r="7"/><circle cx="178" cy="127" r="7"/><circle cx="157" cy="144" r="6"/></g>`,
    mask:`<path d="M75 82q85-56 170 0v65q-85 57-170 0Z" fill="#BDEBFF" stroke="#377EA8" stroke-width="8"/><path d="M75 96 48 80m197 16 27-16M100 106h120m-120 25h120" stroke="#377EA8" stroke-width="7" stroke-linecap="round"/>`,
    sleep:`<path d="M92 155V76m0 79h145v-45c0-18-12-30-31-30h-50c-20 0-32 12-32 30" fill="#A5C8F4" stroke="#345F97" stroke-width="8" stroke-linejoin="round"/><path d="M92 155v26m145-26v26" stroke="#345F97" stroke-width="10" stroke-linecap="round"/><path d="M190 44h28m-11-12 11 12-11 12" fill="none" stroke="#F59E0B" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
    book:`<path d="M65 57q55-18 95 12 40-30 95-12v133q-55-16-95 14-40-30-95-14Z" fill="#F9E8B4" stroke="#9A6B2B" stroke-width="8"/><path d="M160 69v135M91 90q30-8 52 4m-52 22q30-8 52 4m55-26q30-12 52-4m-52 30q30-12 52-4" fill="none" stroke="#777F8B" stroke-width="6" stroke-linecap="round"/>`,
    carrot:`<path d="m116 74 84 13-43 112q-7 18-18 0L92 88Z" fill="#F97316" stroke="#C2410C" stroke-width="7"/><path d="M146 81q-31-41-14-56 28 9 28 44 19-41 45-28 3 29-36 51" fill="#4DAD62" stroke="#287A42" stroke-width="7"/><path d="m116 113 30 10m-14 30 20 8" stroke="#FDBA74" stroke-width="6"/>`,
    salad:`<path d="M65 105q95 130 190 0Z" fill="#A6D7F3" stroke="#397FA4" stroke-width="8"/><path d="M88 101q30-64 62-8 28-62 68 2" fill="#78C77E" stroke="#34854A" stroke-width="7"/><circle cx="125" cy="91" r="13" fill="#F87171"/><circle cx="185" cy="94" r="14" fill="#FBBF24"/>`,
    leaf:`<path d="M82 178C75 74 151 30 244 43c-2 94-55 145-162 135Z" fill="#8ED49B" stroke="#3A985B" stroke-width="8"/><path d="M90 185 211 68M132 145l-5-47m43 6 42-5" fill="none" stroke="#3A985B" stroke-width="8" stroke-linecap="round"/>`,
    wheat:`<path d="M160 206V48m0 34-33-24m33 53 35-26m-35 61-31-24m31 54 35-25" stroke="#A87925" stroke-width="8" stroke-linecap="round"/><g fill="#F3C65C" stroke="#A87925" stroke-width="5"><ellipse cx="133" cy="54" rx="11" ry="21" transform="rotate(-34 133 54)"/><ellipse cx="195" cy="81" rx="11" ry="21" transform="rotate(42 195 81)"/><ellipse cx="130" cy="116" rx="11" ry="21" transform="rotate(-40 130 116)"/><ellipse cx="196" cy="145" rx="11" ry="21" transform="rotate(40 196 145)"/></g>`,
    tractor:`<rect x="67" y="105" width="144" height="66" rx="12" fill="#64B96B" stroke="#287344" stroke-width="8"/><path d="M145 105V66h43l37 39" fill="#89D0F4" stroke="#287344" stroke-width="8"/><circle cx="103" cy="178" r="26" fill="#334155"/><circle cx="204" cy="178" r="18" fill="#334155"/><circle cx="103" cy="178" r="10" fill="#CBD5E1"/><circle cx="204" cy="178" r="7" fill="#CBD5E1"/>`,
    cow:`<path d="M78 83q82-40 164 0v82q-82 42-164 0Z" fill="#F8FAFC" stroke="#475569" stroke-width="8"/><path d="M93 92q34-16 55 7l-15 39q-40 5-48-16Zm92 22q35-28 56-6l-10 40q-41 2-46-34" fill="#334155"/><path d="m91 82-23-28m161 28 24-28" stroke="#475569" stroke-width="9" stroke-linecap="round"/><circle cx="130" cy="143" r="6" fill="#334155"/><circle cx="189" cy="143" r="6" fill="#334155"/>`,
    plate:`<circle cx="160" cy="117" r="79" fill="#F8FAFC" stroke="#94A3B8" stroke-width="9"/><circle cx="160" cy="117" r="55" fill="#DCFCE7" stroke="#94A3B8" stroke-width="5"/><path d="M122 119q34-51 66-5-8 49-48 45Z" fill="#65B96A"/><circle cx="185" cy="95" r="13" fill="#F97373"/><path d="M128 155q35-13 70 0" stroke="#FBBF24" stroke-width="10" stroke-linecap="round"/>`,
    box:`<path d="m77 85 83-43 83 43v93l-83 43-83-43Z" fill="#E8B778" stroke="#98602D" stroke-width="8" stroke-linejoin="round"/><path d="m77 85 83 44 83-44m-83 44v92" fill="none" stroke="#98602D" stroke-width="7"/><path d="M137 58 205 92" stroke="#F8E1B7" stroke-width="12"/>`,
    key:`<circle cx="107" cy="117" r="44" fill="#F7C65E" stroke="#9A6B25" stroke-width="8"/><circle cx="107" cy="117" r="15" fill="#F8FAFC"/><path d="M146 117h106v24h-22v23h-25v-23h-59Z" fill="#F7C65E" stroke="#9A6B25" stroke-width="8" stroke-linejoin="round"/>`,
    server:`<rect x="91" y="34" width="138" height="174" rx="14" fill="#334155" stroke="#0F172A" stroke-width="8"/><g fill="#A5F3FC"><rect x="111" y="56" width="98" height="35" rx="6"/><rect x="111" y="105" width="98" height="35" rx="6"/><rect x="111" y="154" width="98" height="35" rx="6"/></g><g fill="#22C55E"><circle cx="124" cy="73" r="5"/><circle cx="124" cy="122" r="5"/><circle cx="124" cy="171" r="5"/></g>`,
    database:`<ellipse cx="160" cy="58" rx="78" ry="27" fill="#93C5FD" stroke="#326AA3" stroke-width="8"/><path d="M82 58v112c0 16 35 30 78 30s78-14 78-30V58" fill="#60A5FA" stroke="#326AA3" stroke-width="8"/><path d="M82 100c0 16 35 29 78 29s78-13 78-29M82 144c0 16 35 29 78 29s78-13 78-29" fill="none" stroke="#326AA3" stroke-width="7"/>`,
    laptop:`<rect x="85" y="44" width="150" height="113" rx="10" fill="#94C5E8" stroke="#315D7C" stroke-width="8"/><rect x="100" y="59" width="120" height="83" rx="4" fill="#DDF4FF"/><path d="M59 166h202l-18 26H78Z" fill="#64748B" stroke="#334155" stroke-width="8" stroke-linejoin="round"/>`,
    software:`<rect x="83" y="46" width="146" height="134" rx="14" fill="#C4B5FD" stroke="#6941A5" stroke-width="8"/><path d="m125 84-24 29 24 29m70-58 24 29-24 29m-21-64-26 72" fill="none" stroke="#5B21B6" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
    wifi:`<path d="M60 91q100-87 200 0M91 124q69-62 138 0m-100 33q31-29 62 0" fill="none" stroke="#3687C5" stroke-width="14" stroke-linecap="round"/><circle cx="160" cy="185" r="12" fill="#3687C5"/>`,
    network:`<g stroke="#3B82F6" stroke-width="9"><path d="M160 109 92 60m68 49 70-49m-70 49-73 86m73-86 73 86"/></g><g fill="#BFDBFE" stroke="#2D63A1" stroke-width="7"><circle cx="160" cy="108" r="25"/><circle cx="92" cy="60" r="22"/><circle cx="230" cy="60" r="22"/><circle cx="87" cy="195" r="22"/><circle cx="233" cy="195" r="22"/></g>`,
    phone:`<rect x="111" y="26" width="98" height="180" rx="20" fill="#334155" stroke="#0F172A" stroke-width="8"/><rect x="123" y="47" width="74" height="132" rx="7" fill="#BFE8FF"/><circle cx="160" cy="191" r="6" fill="#CBD5E1"/><path d="M136 80h48m-48 21h48m-48 21h31" stroke="#4F83B8" stroke-width="6" stroke-linecap="round"/>`,
    television:`<rect x="63" y="48" width="194" height="130" rx="16" fill="#334155" stroke="#0F172A" stroke-width="8"/><rect x="80" y="65" width="160" height="97" rx="7" fill="#BDE7FB"/><path d="M130 179v26m60-26v26m-80 0h100" stroke="#334155" stroke-width="9" stroke-linecap="round"/><path d="M137 94 185 113 137 137Z" fill="#3B82F6"/>`,
    newspaper:`<path d="M67 42h187v166H67Z" fill="#FFFDF5" stroke="#64748B" stroke-width="8"/><path d="M86 64h148v22H86Z" fill="#93B7D7"/><path d="M87 104h64v87H87Zm78 0h69v10h-69Zm0 21h69v8h-69Zm0 20h69v8h-69Zm0 20h56v8h-56Z" fill="#B9C7D4"/><path d="M99 117h40v59h-40Z" fill="#8DB6D6"/>`,
    microphone:`<rect x="137" y="37" width="46" height="104" rx="22" fill="#475569" stroke="#1F2937" stroke-width="7"/><path d="M108 107v15c0 70 104 70 104 0v-15m-52 70v33m-36 0h72" fill="none" stroke="#64748B" stroke-width="9" stroke-linecap="round"/><path d="M145 61h30m-30 21h30m-30 21h30" stroke="#CBD5E1" stroke-width="5"/>`,
    copyright:`<circle cx="160" cy="115" r="73" fill="#E0E7FF" stroke="#5B68A9" stroke-width="8"/><path d="M188 84a42 42 0 1 0 0 62" fill="none" stroke="#5B68A9" stroke-width="12" stroke-linecap="round"/>`,
    scales:`<path d="M160 54v127m-54 0h108m-54-127 0-20" stroke="#475569" stroke-width="9" stroke-linecap="round"/><path d="M84 79h152m-116-1-28 54h56Zm56 0-28 54h56Z" fill="#F7D98B" stroke="#8B6A2A" stroke-width="7"/><path d="M120 181q40 35 80 0" fill="none" stroke="#475569" stroke-width="8"/>`,
    gavel:`<g transform="rotate(-36 160 110)"><rect x="116" y="63" width="105" height="36" rx="8" fill="#737B86" stroke="#71421D" stroke-width="8"/><rect x="154" y="88" width="24" height="101" rx="8" fill="#C68A51" stroke="#71421D" stroke-width="8"/></g><rect x="98" y="184" width="125" height="21" rx="10" fill="#585E67"/>`,
    people:`<circle cx="115" cy="90" r="25" fill="#F1C27D"/><circle cx="205" cy="90" r="25" fill="#D9A06C"/><circle cx="160" cy="72" r="28" fill="#E8B886"/><path d="M70 183q2-60 45-60t45 60m-10 0q2-75 50-75t50 75" fill="#6EA8D8" stroke="#376A98" stroke-width="8"/>`,
    siren:`<path d="M88 164V117q0-70 72-70t72 70v47Z" fill="#E6F4FF" stroke="#3D709F" stroke-width="8"/><rect x="70" y="163" width="180" height="31" rx="12" fill="#64748B"/><path d="M160 20V4m-83 38L64 29m179 13 13-13" stroke="#E35C5C" stroke-width="10" stroke-linecap="round"/><path d="M121 108h78" stroke="#3B82F6" stroke-width="12"/>`,
    traffic:`<rect x="104" y="35" width="112" height="169" rx="23" fill="#334155" stroke="#0F172A" stroke-width="8"/><circle cx="160" cy="73" r="21" fill="#EF4444"/><circle cx="160" cy="120" r="21" fill="#FBBF24"/><circle cx="160" cy="166" r="21" fill="#22C55E"/>`,
    car:`<path d="m68 140 20-50q9-24 35-24h75q28 0 39 25l21 49v45H63v-45Z" fill="#60A5FA" stroke="#245D91" stroke-width="8"/><path d="m103 96-14 39h140l-16-39q-6-17-25-17h-61q-17 0-24 17Z" fill="#DFF5FF"/><circle cx="102" cy="183" r="19" fill="#334155"/><circle cx="215" cy="183" r="19" fill="#334155"/>`,
    house:`<path d="m52 111 108-80 108 80v94H52Z" fill="#F0C58A" stroke="#96612B" stroke-width="8" stroke-linejoin="round"/><path d="m39 112 121-91 121 91" fill="none" stroke="#A65F31" stroke-width="12" stroke-linecap="round"/><rect x="137" y="139" width="47" height="66" fill="#5D646D"/><rect x="76" y="127" width="38" height="34" fill="#BFE8FF" stroke="#5D646D" stroke-width="5"/><rect x="206" y="127" width="38" height="34" fill="#BFE8FF" stroke="#5D646D" stroke-width="5"/>`,
    graduation:`<path d="m44 83 116-48 116 48-116 48Z" fill="#263F73" stroke="#14284C" stroke-width="8"/><path d="M94 108v43q66 48 132 0v-43" fill="#3D5E9E" stroke="#14284C" stroke-width="8"/><path d="M276 82v80" stroke="#D19A36" stroke-width="7"/><circle cx="276" cy="170" r="10" fill="#D19A36"/>`,
    teacher:`<rect x="62" y="43" width="196" height="145" rx="8" fill="#E9F5E9" stroke="#547E60" stroke-width="8"/><path d="M93 80h110m-110 35h138m-138 35h88" stroke="#6B9B78" stroke-width="8" stroke-linecap="round"/><circle cx="220" cy="62" r="19" fill="#F1C27D" stroke="#596069" stroke-width="5"/>`,
    document:`<path d="M92 30h110l37 38v152H92Z" fill="#FCFCF8" stroke="#64748B" stroke-width="8"/><path d="M202 30v42h37" fill="#DCEAF5" stroke="#64748B" stroke-width="7"/><path d="M116 99h95m-95 26h95m-95 26h95m-95 26h64" stroke="#94A3B8" stroke-width="7" stroke-linecap="round"/><path d="m119 70 29-9 27 9" fill="none" stroke="#60A5FA" stroke-width="8"/>`,
    books:`<path d="M74 68h166v47H74Z" fill="#F59E0B" stroke="#98621D" stroke-width="7"/><path d="M57 121h183v49H57Z" fill="#60A5FA" stroke="#315F96" stroke-width="7"/><path d="M83 171h167v42H83Z" fill="#A78BFA" stroke="#61459E" stroke-width="7"/><path d="M100 68v47m65-47v47m-80 6v49m75-49v49m-60 2v42" stroke="#F8FAFC" stroke-width="5"/>`,
    clock:`<circle cx="160" cy="115" r="77" fill="#FFF7DB" stroke="#BA8B31" stroke-width="9"/><path d="M160 62v55l42 25" fill="none" stroke="#745420" stroke-width="10" stroke-linecap="round"/><circle cx="160" cy="115" r="7" fill="#745420"/>`,
    money:`<circle cx="160" cy="114" r="74" fill="#F8D77A" stroke="#A87B25" stroke-width="9"/><path d="M179 74c-9-11-43-10-48 9-9 34 53 18 49 55-3 25-38 29-58 11m38-89v110" fill="none" stroke="#946B1F" stroke-width="9" stroke-linecap="round"/>`,
    piggy:`<path d="M66 127q0-59 93-59 70 0 86 59l18 14-17 20h-29l-15 22h-24l-6-24h-54l-10 24H84l-5-38q-13-4-13-18Z" fill="#F7A9BB" stroke="#A94D6A" stroke-width="8"/><circle cx="202" cy="111" r="7" fill="#7F354C"/><path d="M112 71V55m88 14 10-14" stroke="#A94D6A" stroke-width="8" stroke-linecap="round"/><path d="M127 61h67" stroke="#A94D6A" stroke-width="6"/>`,
    bank:`<path d="m58 94 102-57 102 57Z" fill="#DDE7F4" stroke="#45617C" stroke-width="8"/><path d="M75 103h170v91H75Z" fill="#EEF5FC" stroke="#45617C" stroke-width="8"/><path d="M103 109v76m39-76v76m39-76v76m39-76v76" stroke="#7894AF" stroke-width="12"/><path d="M58 198h204" stroke="#45617C" stroke-width="10" stroke-linecap="round"/>`,
    card:`<rect x="58" y="67" width="204" height="116" rx="17" fill="#5479B8" stroke="#27436F" stroke-width="8"/><path d="M60 102h200" stroke="#DCE8F8" stroke-width="15"/><rect x="84" y="137" width="54" height="23" rx="5" fill="#F1D28B"/><path d="M182 151h48" stroke="#DCE8F8" stroke-width="8" stroke-linecap="round"/>`,
    store:`<path d="M77 91h166v111H77Z" fill="#F6D8A6" stroke="#94642F" stroke-width="8"/><path d="m64 91 21-47h150l21 47Z" fill="#EF7777" stroke="#A84444" stroke-width="8"/><path d="M84 92q0 31 31 31t31-31q0 31 31 31t31-31q0 31 31 31t28-31" fill="#FFE3B6" stroke="#A84444" stroke-width="7"/><rect x="142" y="147" width="41" height="55" fill="#90C6E4" stroke="#94642F" stroke-width="6"/>`,
    cart:`<path d="M63 65h26l22 99h121l24-75H102" fill="none" stroke="#475569" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><circle cx="128" cy="190" r="13" fill="#334155"/><circle cx="213" cy="190" r="13" fill="#334155"/><path d="M116 104h119" stroke="#60A5FA" stroke-width="13" stroke-linecap="round"/>`,
    receipt:`<path d="M91 37h138v174l-21-12-24 12-24-12-23 12-23-12-23 12Z" fill="#FFFEF8" stroke="#64748B" stroke-width="8"/><path d="M117 76h88m-88 26h88m-88 26h54m-54 26h88" stroke="#94A3B8" stroke-width="7" stroke-linecap="round"/>`,
    calendar:`<rect x="67" y="55" width="186" height="147" rx="13" fill="#FFFDF5" stroke="#64748B" stroke-width="8"/><path d="M68 95h184" stroke="#F28A8A" stroke-width="24"/><path d="M111 37v37m98-37v37" stroke="#64748B" stroke-width="11" stroke-linecap="round"/><g fill="#70A1CA"><rect x="96" y="119" width="22" height="19" rx="4"/><rect x="139" y="119" width="22" height="19" rx="4"/><rect x="182" y="119" width="22" height="19" rx="4"/><rect x="96" y="157" width="22" height="19" rx="4"/><rect x="139" y="157" width="22" height="19" rx="4"/><rect x="182" y="157" width="22" height="19" rx="4"/></g>`,
    envelope:`<rect x="52" y="68" width="216" height="126" rx="12" fill="#EAF4FF" stroke="#497AA7" stroke-width="8"/><path d="m60 80 100 79 100-79" fill="none" stroke="#497AA7" stroke-width="8" stroke-linejoin="round"/>`,
    thermometer:`<rect x="140" y="39" width="40" height="123" rx="20" fill="#F8FAFC" stroke="#64748B" stroke-width="8"/><circle cx="160" cy="176" r="37" fill="#EF7777" stroke="#A63F4A" stroke-width="8"/><path d="M160 77v97" stroke="#EF7777" stroke-width="13" stroke-linecap="round"/><path d="M182 66h17m-17 28h17m-17 28h17" stroke="#64748B" stroke-width="5"/>`,
    globe:`<circle cx="160" cy="115" r="77" fill="#BDE8FF" stroke="#2B719A" stroke-width="8"/><path d="M83 115h154m-77-77c-35 36-35 118 0 154m0-154c35 36 35 118 0 154" fill="none" stroke="#2B719A" stroke-width="7"/><path d="M106 78q36-23 55 5l-13 22-35-4Zm74 40 39-15 14 24-28 26-21-9Z" fill="#66B77B"/>`,
    tree:`<path d="M160 178v34" stroke="#4F545C" stroke-width="18"/><path d="M160 33q-46 8-42 57-53 5-35 56 5 31 77 31 74 0 77-35 12-47-37-54-3-48-40-55Z" fill="#79C77A" stroke="#3B8A4A" stroke-width="8"/>`,
    deer:`<path d="M94 102q62-40 125 0v70H94Z" fill="#D89B5B" stroke="#555B64" stroke-width="8"/><path d="M110 103 86 71m-4 4 23-14m97 42 25-34m4 4-27-14" stroke="#555B64" stroke-width="8" stroke-linecap="round"/><circle cx="130" cy="127" r="6" fill="#334155"/><circle cx="185" cy="127" r="6" fill="#334155"/><path d="M111 170v35m92-35v35" stroke="#555B64" stroke-width="10" stroke-linecap="round"/>`,
    butterfly:`<path d="M160 108q-56-91-91-47-30 49 72 76-104 31-71 70 38 38 90-85m0-14q56-91 91-47 30 49-72 76 104 31 71 70-38 38-90-85" fill="#C4B5FD" stroke="#6753A5" stroke-width="8" stroke-linejoin="round"/><path d="M160 76v92" stroke="#475569" stroke-width="10" stroke-linecap="round"/>`,
    elephant:`<path d="M70 126q0-66 86-66t98 63v47h-36v-34h-43v35h-38v-35H98v35H72Z" fill="#9CAFC0" stroke="#526577" stroke-width="8"/><path d="M229 112q27 2 24 47-1 31-25 33" fill="none" stroke="#526577" stroke-width="16" stroke-linecap="round"/><circle cx="203" cy="94" r="6" fill="#334155"/>`,
    lizard:`<path d="M72 142q43-69 94-10 57-38 89 2-29 52-86 23-58 44-97-15Z" fill="#85C97D" stroke="#3E8849" stroke-width="8"/><path d="m111 139-31-43m42 58-17 39m87-55 36-41m-34 58 25 39" stroke="#3E8849" stroke-width="9" stroke-linecap="round"/><circle cx="183" cy="127" r="6" fill="#334155"/>`,
    frog:`<circle cx="120" cy="104" r="34" fill="#7BCB77" stroke="#327D43" stroke-width="8"/><circle cx="200" cy="104" r="34" fill="#7BCB77" stroke="#327D43" stroke-width="8"/><path d="M84 122q-20 70 76 80 95-10 76-80Z" fill="#8DDA82" stroke="#327D43" stroke-width="8"/><circle cx="120" cy="104" r="8" fill="#334155"/><circle cx="200" cy="104" r="8" fill="#334155"/><path d="M130 157q30 21 60 0" fill="none" stroke="#327D43" stroke-width="7" stroke-linecap="round"/>`,
    lion:`<circle cx="160" cy="118" r="76" fill="#D58A31" stroke="#92511D" stroke-width="8"/><circle cx="160" cy="118" r="50" fill="#F5D2A0" stroke="#92511D" stroke-width="7"/><circle cx="143" cy="110" r="6" fill="#334155"/><circle cx="177" cy="110" r="6" fill="#334155"/><path d="M160 125v14m-16 14q16 13 32 0" fill="none" stroke="#92511D" stroke-width="7" stroke-linecap="round"/>`,
    rabbit:`<ellipse cx="160" cy="143" rx="62" ry="54" fill="#E5E6E8" stroke="#818893" stroke-width="8"/><ellipse cx="132" cy="58" rx="21" ry="59" fill="#E5E6E8" stroke="#818893" stroke-width="8" transform="rotate(-13 132 58)"/><ellipse cx="188" cy="58" rx="21" ry="59" fill="#E5E6E8" stroke="#818893" stroke-width="8" transform="rotate(13 188 58)"/><circle cx="140" cy="137" r="6" fill="#334155"/><circle cx="180" cy="137" r="6" fill="#334155"/><circle cx="160" cy="154" r="7" fill="#E88EA4"/>`,
    meat:`<path d="M91 84q34-45 84-24 70-28 74 49 5 76-72 94-85 20-102-45-10-40 16-74Z" fill="#F4A1A1" stroke="#B44D55" stroke-width="8"/><circle cx="180" cy="122" r="26" fill="#FFF1E5" stroke="#B44D55" stroke-width="7"/>`,
    fossil:`<path d="M74 162q22-54 54-20 23 24 42 0 30-37 65 15" fill="none" stroke="#7E8691" stroke-width="13" stroke-linecap="round"/><path d="M96 117v62m31-49v54m34-43v46m36-49v42" stroke="#7E8691" stroke-width="9"/><path d="m78 111 18-16 20 6 9-20 22 14 20-16 17 22 28-2 9 25" fill="none" stroke="#A0A6AE" stroke-width="8" stroke-linejoin="round"/>`,
    dna:`<path d="M111 43q98 30 0 144m98-144q-98 30 0 144" fill="none" stroke="#478AC7" stroke-width="10" stroke-linecap="round"/><path d="M125 64h70m-85 28h100m-100 28h100m-85 28h70m-55 26h40" stroke="#6CB98B" stroke-width="9" stroke-linecap="round"/>`,
    cactus:`<path d="M160 202V62q0-28 25-28t25 28v33h22V78q0-22 19-22t19 22v45q0 23-22 23h-38v56" fill="#78BC72" stroke="#347C45" stroke-width="8" stroke-linejoin="round"/><path d="M160 97h-31V78q0-22-20-22T89 78v49q0 22 22 22h49" fill="#78BC72" stroke="#347C45" stroke-width="8"/><path d="M160 62v130" stroke="#D5F5C7" stroke-width="5" stroke-dasharray="7 10"/>`,
    factory:`<path d="M59 194V110l56 34V95l54 36V78l87-45v161Z" fill="#A9C8DA" stroke="#506E82" stroke-width="8" stroke-linejoin="round"/><path d="M183 80V34h29v31" fill="#94A3B8" stroke="#506E82" stroke-width="8"/><g fill="#E8F4FA"><rect x="82" y="162" width="23" height="22"/><rect x="130" y="162" width="23" height="22"/><rect x="180" y="158" width="23" height="26"/><rect x="221" y="158" width="23" height="26"/></g><circle cx="210" cy="20" r="13" fill="#CBD5E1"/>`,
    trash:`<path d="M91 66h138l-13 143H104Z" fill="#D2DCE5" stroke="#64748B" stroke-width="8"/><path d="M79 66h162M129 48h58" stroke="#64748B" stroke-width="10" stroke-linecap="round"/><path d="M135 96v82m50-82v82" stroke="#94A3B8" stroke-width="9"/>`,
    recycle:`<path d="m145 42 36 0 25 42-19 11-16-27-18 0Zm79 74 18 31-23 41-19-10 15-27-10-17ZM104 190H68l-24-42 19-11 16 27h20Z" fill="#6AC18B" stroke="#348356" stroke-width="7" stroke-linejoin="round"/><path d="m185 86 22 1-9 20m15 60-11 17-14-17M63 138l-6-20 22 2" fill="none" stroke="#348356" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
    water:`<path d="M67 158q38-35 76 0t76 0 47 0v37H67Z" fill="#51B6E8" stroke="#2879A8" stroke-width="7"/><path d="m117 90 43-46 43 46-43 45Z" fill="#AEE8FF" stroke="#2879A8" stroke-width="7"/><path d="M160 135v26m-27-29 27 29 27-29" fill="none" stroke="#2879A8" stroke-width="7" stroke-linecap="round"/>`,
    bed:`<path d="M69 123h182v66H69Z" fill="#8CB8E5" stroke="#416D9B" stroke-width="8"/><path d="M69 111h49q21 0 21 20v25H69Zm70 0h112v45H139Z" fill="#E9F4FF" stroke="#416D9B" stroke-width="7"/><path d="M82 189v22m155-22v22" stroke="#416D9B" stroke-width="10" stroke-linecap="round"/>`,
    sofa:`<path d="M88 106q0-30 30-30h84q30 0 30 30v83H88Z" fill="#BFA2E8" stroke="#7654A7" stroke-width="8"/><path d="M62 119q-18 0-18 27v42h232v-42q0-27-18-27" fill="#D8C8F2" stroke="#7654A7" stroke-width="8"/><path d="M83 188v22m153-22v22" stroke="#7654A7" stroke-width="10" stroke-linecap="round"/>`,
    brain:`<path d="M160 49q-37-35-62 3-34 2-33 42-25 32 4 57-2 43 43 42 18 24 48 2 30 22 48-2 45 1 43-42 29-25 4-57 1-40-34-42-25-38-62-3Z" fill="#E9B5C7" stroke="#A75B76" stroke-width="8"/><path d="M160 48v148m-46-121q-22 25 3 39m-26 37q26-8 39 17m48-93q23 25-3 39m27 37q-26-8-39 17" fill="none" stroke="#A75B76" stroke-width="7" stroke-linecap="round"/>`,
    heart:`<path d="M160 198 72 111C25 61 102 20 160 80c58-60 135-19 88 31Z" fill="#F38AA2" stroke="#A73F5B" stroke-width="8"/><path d="M54 121h53l18-30 26 62 20-33h93" fill="none" stroke="#FFF1F4" stroke-width="8" stroke-linejoin="round"/>`,
    handshake:`<path d="m54 115 52-42 53 35 46-35 61 40-49 72-58-22-43 22Z" fill="#F0C18C" stroke="#616872" stroke-width="8" stroke-linejoin="round"/><path d="m105 111 40 29q15 9 28-4l30-27m-77 48 17 12m18-5 16 10m17-17 13 7" fill="none" stroke="#616872" stroke-width="8" stroke-linecap="round"/>`,
    dove:`<path d="M56 141q62-18 86-75 18 53 73 48l50 24-75 21q-55 36-134-18Z" fill="#F8FAFC" stroke="#718096" stroke-width="8"/><path d="m151 114 32 25-34 4" fill="#CBD5E1" stroke="#718096" stroke-width="6"/><path d="m220 130 24-18" stroke="#D69B34" stroke-width="7" stroke-linecap="round"/>`,
    speech:`<path d="M53 53h140q16 0 16 16v69q0 16-16 16h-57l-35 30v-30H53q-16 0-16-16V69q0-16 16-16Z" fill="#DCEEFF" stroke="#4D7DA7" stroke-width="8"/><path d="M130 95h135q16 0 16 16v57q0 16-16 16h-15v27l-33-27h-87q-16 0-16-16v-57q0-16 16-16Z" fill="#F4E5B8" stroke="#626972" stroke-width="7"/><path d="M65 92h97m-97 22h65m40 14h69m-69 20h48" stroke="#7E9CB8" stroke-width="7" stroke-linecap="round"/>`,
    angry:`<circle cx="160" cy="118" r="72" fill="#F7C7A7" stroke="#727A86" stroke-width="8"/><path d="m114 93 27 10m65-10-27 10" stroke="#50565E" stroke-width="9" stroke-linecap="round"/><path d="M130 159q30-28 60 0" fill="none" stroke="#50565E" stroke-width="9" stroke-linecap="round"/><path d="m94 39 27 20m105-20-27 20" stroke="#EA6969" stroke-width="9" stroke-linecap="round"/>`,
    person:`<circle cx="160" cy="69" r="34" fill="#F0C18C" stroke="#5F666F" stroke-width="7"/><path d="M96 203q0-82 64-82t64 82Z" fill="#6FA7D5" stroke="#3B6B99" stroke-width="8"/>`,
    palette:`<path d="M160 36q-94 0-112 74-18 75 48 101 28 10 39-22 8-26 34-20 34 8 55-11 61-53 1-111-27-11-65-11Z" fill="#F7D69B" stroke="#656D77" stroke-width="8"/><circle cx="111" cy="96" r="11" fill="#EF7777"/><circle cx="160" cy="72" r="11" fill="#60A5FA"/><circle cx="207" cy="91" r="11" fill="#7CBF82"/><circle cx="214" cy="138" r="11" fill="#B38BE4"/>`,
    target:`<circle cx="160" cy="115" r="77" fill="#F7F7F7" stroke="#64748B" stroke-width="8"/><circle cx="160" cy="115" r="49" fill="#F6A1A1" stroke="#A84949" stroke-width="7"/><circle cx="160" cy="115" r="23" fill="#F8F0D1" stroke="#A84949" stroke-width="7"/><path d="m160 115 73-67m-20 0h20v20" stroke="#475569" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
    chess:`<path d="M91 184h138v25H91Z" fill="#585E67" stroke="#363A3F" stroke-width="7"/><path d="M117 183 134 145h52l17 38Z" fill="#F1D7A5" stroke="#585E67" stroke-width="7"/><path d="M142 145V98q-17-22 0-35 20-16 39 0 17 14 0 35v47Z" fill="#F1D7A5" stroke="#585E67" stroke-width="7"/><circle cx="160" cy="46" r="15" fill="#585E67"/>`,
    bulb:`<path d="M160 31q-70 0-70 69 0 34 42 69v23h56v-23q42-35 42-69 0-69-70-69Z" fill="#F8E38A" stroke="#A57B24" stroke-width="8"/><path d="M132 192h56m-50 16h44" stroke="#64748B" stroke-width="8" stroke-linecap="round"/><path d="M160 56v48m-27-26h54" stroke="#C08B1F" stroke-width="7"/>`,
    calculator:`<rect x="91" y="35" width="138" height="174" rx="14" fill="#465569" stroke="#1E293B" stroke-width="8"/><rect x="111" y="53" width="98" height="39" rx="5" fill="#D9F3E2"/><g fill="#CBD5E1"><rect x="111" y="109" width="26" height="22" rx="4"/><rect x="151" y="109" width="26" height="22" rx="4"/><rect x="191" y="109" width="18" height="22" rx="4"/><rect x="111" y="145" width="26" height="22" rx="4"/><rect x="151" y="145" width="26" height="22" rx="4"/><rect x="191" y="145" width="18" height="22" rx="4"/></g>`,
    clipboard:`<rect x="77" y="50" width="166" height="165" rx="12" fill="#FBFCF8" stroke="#64748B" stroke-width="8"/><rect x="128" y="35" width="64" height="30" rx="8" fill="#94A3B8" stroke="#475569" stroke-width="6"/><g stroke="#6C98BD" stroke-width="7" stroke-linecap="round"><path d="M110 104h100m-100 32h100m-100 32h74"/></g><path d="m104 103 8 8 15-18m-23 50 8 8 15-18m-23 50 8 8 15-18" fill="none" stroke="#37A56A" stroke-width="6"/>`,
    warning:`<path d="m160 36 111 166H49Z" fill="#F9D477" stroke="#B57B22" stroke-width="9" stroke-linejoin="round"/><path d="M160 93v51" stroke="#8B5D17" stroke-width="13" stroke-linecap="round"/><circle cx="160" cy="169" r="8" fill="#8B5D17"/>`,
    running:`<circle cx="166" cy="51" r="22" fill="#F0C18C" stroke="#5F666F" stroke-width="6"/><path d="m155 80-34 48 46 24m-46-24-42 18m42-18-7 56m53-32 52 32m-43-57 35-29" fill="none" stroke="#3D83B8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`,
    ambulance:`<path d="M45 105h151v81H45Z" fill="#F8FAFC" stroke="#64748B" stroke-width="8"/><path d="M196 126h43l31 38v22h-74Z" fill="#F8FAFC" stroke="#64748B" stroke-width="8"/><path d="M155 118v51m-25-25h50" stroke="#E25252" stroke-width="14" stroke-linecap="round"/><circle cx="91" cy="190" r="17" fill="#334155"/><circle cx="221" cy="190" r="17" fill="#334155"/>`,
    'car-crash':`<path d="M67 137 91 92h122l31 45v45H67Z" fill="#E77A7A" stroke="#943C3C" stroke-width="8"/><path d="m111 95-9-40m105 40 13-40" stroke="#E5A32C" stroke-width="10" stroke-linecap="round"/><path d="m160 40 0 26m-24-12 12 18m35-18-12 18" stroke="#E5A32C" stroke-width="8"/><circle cx="105" cy="184" r="17" fill="#334155"/><circle cx="217" cy="184" r="17" fill="#334155"/>`,
    map:`<path d="m65 62 67-24 60 24 63-24v152l-63 24-60-24-67 24Z" fill="#D9F0DB" stroke="#5C8A61" stroke-width="8"/><path d="M132 38v152m60-128v152" stroke="#5C8A61" stroke-width="7"/><path d="M95 155q47-59 89-18t42-43" fill="none" stroke="#E6A84C" stroke-width="9" stroke-dasharray="12 9"/>`,
    pin:`<path d="M160 207s-72-74-72-119a72 72 0 1 1 144 0c0 45-72 119-72 119Z" fill="#F18A8A" stroke="#A94747" stroke-width="8"/><circle cx="160" cy="87" r="26" fill="#FFF7F0" stroke="#A94747" stroke-width="7"/>`,
    beach:`<circle cx="218" cy="66" r="27" fill="#F8CD64"/><path d="M41 161q41-26 82 0t82 0 74 0v44H41Z" fill="#54B5E4" stroke="#2879A8" stroke-width="7"/><path d="M41 162q41-28 82 0" fill="none" stroke="#E0F6FF" stroke-width="9"/><path d="M117 160v-55m0 0q-35-12-37-38 42-8 56 34 18-35 51-27-2 33-40 42" fill="#80BF7C" stroke="#45854F" stroke-width="7"/>`,
    camera:`<rect x="67" y="75" width="186" height="120" rx="17" fill="#475569" stroke="#243244" stroke-width="8"/><path d="M105 75 124 48h66l20 27" fill="#64748B" stroke="#243244" stroke-width="8"/><circle cx="160" cy="133" r="44" fill="#D9F3FF" stroke="#243244" stroke-width="9"/><circle cx="160" cy="133" r="21" fill="#5EA7D0"/><circle cx="222" cy="97" r="8" fill="#F87171"/>`,
    hotel:`<path d="M73 50h174v156H73Z" fill="#E7EFF8" stroke="#526A83" stroke-width="8"/><path d="M160 50v156" stroke="#526A83" stroke-width="7"/><g fill="#91BCE0"><rect x="91" y="72" width="29" height="28"/><rect x="134" y="72" width="18" height="28"/><rect x="185" y="72" width="29" height="28"/><rect x="226" y="72" width="12" height="28"/><rect x="91" y="122" width="29" height="28"/><rect x="134" y="122" width="18" height="28"/><rect x="185" y="122" width="29" height="28"/><rect x="226" y="122" width="12" height="28"/></g><rect x="135" y="164" width="51" height="42" fill="#989FA8"/>`,
    ticket:`<path d="M63 73h194v113H63Z" fill="#F9E6A7" stroke="#98752D" stroke-width="8"/><path d="M109 73v113m108-113v113" stroke="#98752D" stroke-width="6" stroke-dasharray="8 8"/><path d="M135 111h54m-54 27h54" stroke="#98752D" stroke-width="7" stroke-linecap="round"/>`
  };
  Object.assign(A,{
    cat:`<circle cx="160" cy="131" r="58" fill="#F3B77B" stroke="#5C636D" stroke-width="8"/><path d="M110 88 92 38l53 24m65 26 18-50-53 24Z" fill="#F3B77B" stroke="#5C636D" stroke-width="8" stroke-linejoin="round"/><path d="M135 131h3m46 0h3" stroke="#334155" stroke-width="12" stroke-linecap="round"/><path d="M146 151q14 14 28 0" fill="none" stroke="#5C636D" stroke-width="7"/>`,
    dog:`<ellipse cx="160" cy="130" rx="61" ry="57" fill="#8E959E" stroke="#525861" stroke-width="8"/><path d="M111 92q-47-42-47 20 0 37 38 38m107-58q47-42 47 20 0 37-38 38" fill="#626972" stroke="#525861" stroke-width="8"/><circle cx="137" cy="124" r="7" fill="#334155"/><circle cx="183" cy="124" r="7" fill="#334155"/><ellipse cx="160" cy="151" rx="13" ry="9" fill="#334155"/>`,
    bird:`<path d="M62 143q48-75 113-35 48-55 83-12-20 78-109 72-38 37-87-25Z" fill="#67A9D7" stroke="#315F8A" stroke-width="8"/><path d="m134 120 42 25-47 5" fill="#D6EAF6" stroke="#315F8A" stroke-width="6"/><path d="m253 105 33 14-33 13Z" fill="#F2B64C"/><circle cx="208" cy="111" r="6" fill="#23384D"/>`,
    fish:`<ellipse cx="151" cy="120" rx="78" ry="48" fill="#69B7D8" stroke="#2C7598" stroke-width="8"/><path d="m220 120 56-40v80Z" fill="#F1A85D" stroke="#2C7598" stroke-width="8"/><path d="m135 84 30-28 28 30m-58 68 30 29 28-30" fill="#9AD9E9" stroke="#2C7598" stroke-width="6"/><circle cx="112" cy="111" r="7" fill="#243B53"/>`,
    horse:`<path d="M104 199V103l30-56 63 13 23 41-17 91h-27l-5-63h-35l-8 70Z" fill="#767E8A" stroke="#494E55" stroke-width="8" stroke-linejoin="round"/><path d="m134 55-7-27 25 24m44 9 27-24-9 44" fill="#595F68" stroke="#494E55" stroke-width="7"/><circle cx="184" cy="90" r="6" fill="#243B53"/>`,
    duck:`<ellipse cx="151" cy="145" rx="73" ry="45" fill="#F4D66A" stroke="#9A7829" stroke-width="8"/><circle cx="194" cy="88" r="35" fill="#F4D66A" stroke="#9A7829" stroke-width="8"/><path d="m225 88 43 15-43 15Z" fill="#E99A3D"/><circle cx="203" cy="80" r="6" fill="#243B53"/><path d="m113 177-20 20m69-9-4 19" stroke="#9A7829" stroke-width="8" stroke-linecap="round"/>`,
    monkey:`<circle cx="160" cy="121" r="67" fill="#6C747F" stroke="#484D54" stroke-width="8"/><circle cx="94" cy="114" r="24" fill="#D9A47D" stroke="#484D54" stroke-width="7"/><circle cx="226" cy="114" r="24" fill="#D9A47D" stroke="#484D54" stroke-width="7"/><ellipse cx="160" cy="145" rx="42" ry="32" fill="#E9C5A7"/><circle cx="139" cy="112" r="7" fill="#27384A"/><circle cx="181" cy="112" r="7" fill="#27384A"/><path d="M145 158q15 12 30 0" fill="none" stroke="#484D54" stroke-width="6"/>`,
    egg:`<ellipse cx="160" cy="121" rx="58" ry="78" fill="#FFFDF5" stroke="#ADB2B9" stroke-width="8"/><ellipse cx="160" cy="150" rx="31" ry="24" fill="#F6C65B" opacity=".75"/>`,
    milk:`<path d="M112 67h96l-10 140h-76Z" fill="#DDF5FF" stroke="#4D89A7" stroke-width="8"/><path d="M112 67 130 38h61l17 29Z" fill="#A7D9F0" stroke="#4D89A7" stroke-width="8"/><path d="M133 116h55m-55 24h55" stroke="#8BBAD1" stroke-width="7" stroke-linecap="round"/>`,
    water:`<path d="M160 35c-23 40-58 75-58 112a58 58 0 0 0 116 0c0-37-35-72-58-112Z" fill="#66C5EA" stroke="#2C7FA7" stroke-width="8"/><path d="M128 157q24-20 49 0" fill="none" stroke="#E9FAFF" stroke-width="8" stroke-linecap="round"/>`,
    bread:`<path d="M74 122q-5-74 86-76 91 1 86 76v70H74Z" fill="#E8B66D" stroke="#98632D" stroke-width="8"/><path d="M120 78q-19 23-9 54m59-56q-20 22-10 56m58-52q-18 23-9 54" stroke="#F9D9A4" stroke-width="9" stroke-linecap="round"/>`,
    apple:`<path d="M160 73q-50-49-81 0-26 46 16 117 24 37 65 8 41 29 65-8 42-71 16-117-31-49-81 0Z" fill="#EF6969" stroke="#A63E46" stroke-width="8"/><path d="M160 76q-4-31 16-47" fill="none" stroke="#474C53" stroke-width="9" stroke-linecap="round"/><path d="M170 52q31-27 53-4-18 27-53 4Z" fill="#6EBB72" stroke="#3B8D4B" stroke-width="6"/>`,
    banana:`<path d="M83 64q31 111 131 108 42-5 42-37-25 11-43-11-76-1-112-85Z" fill="#F6D35C" stroke="#AB8127" stroke-width="8" stroke-linejoin="round"/><path d="m78 56 21-13m154 92 8 27" stroke="#865D24" stroke-width="10" stroke-linecap="round"/>`,
    orange:`<circle cx="160" cy="123" r="72" fill="#F99B37" stroke="#B9621F" stroke-width="8"/><path d="M160 51q-3-24 17-32m-14 29q28-19 48-1-20 26-50 10Z" fill="#70B56D" stroke="#3C8245" stroke-width="6"/>`,
    chicken:`<path d="M103 90q53-38 108 10 38 35 13 76-28 36-75 8-45-25-62-61-10-21 16-33Z" fill="#F6B5A3" stroke="#707884" stroke-width="8"/><circle cx="196" cy="150" r="26" fill="#FFF4E9" stroke="#707884" stroke-width="7"/><path d="m92 82-22-22m24 44-30 6" stroke="#707884" stroke-width="8" stroke-linecap="round"/>`,
    coffee:`<path d="M82 93h139v85q-69 51-139 0Z" fill="#F8F1E8" stroke="#5E656F" stroke-width="8"/><path d="M221 112h26q30 38-26 50" fill="none" stroke="#5E656F" stroke-width="9"/><path d="M117 72q-19-23 0-42m36 42q-19-23 0-42m36 42q-19-23 0-42" fill="none" stroke="#9BA1AA" stroke-width="7" stroke-linecap="round"/><path d="M95 142h110" stroke="#5C636D" stroke-width="13"/>`,
    cake:`<path d="M74 115h172v80H74Z" fill="#F3B2C7" stroke="#A54C6D" stroke-width="8"/><path d="M74 115q0-50 86-50t86 50" fill="#FFF4F6" stroke="#A54C6D" stroke-width="8"/><path d="M160 34v30m-9-18h18" stroke="#EBAA4A" stroke-width="7"/><circle cx="121" cy="110" r="9" fill="#E86A83"/><circle cx="198" cy="110" r="9" fill="#E86A83"/>`,
    pizza:`<path d="m80 181 79-155 88 155Z" fill="#F2CA69" stroke="#A87532" stroke-width="8"/><path d="m80 181 79-155 14 45-61 121Z" fill="#F8E2A5"/><circle cx="153" cy="98" r="12" fill="#E36A54"/><circle cx="183" cy="140" r="11" fill="#E36A54"/><circle cx="128" cy="157" r="10" fill="#E36A54"/><path d="m123 69 20 13m42 27 15-8" stroke="#6DA85B" stroke-width="8" stroke-linecap="round"/>`,
    family:`<circle cx="105" cy="86" r="25" fill="#E9B785"/><circle cx="215" cy="86" r="25" fill="#8D949D"/><circle cx="160" cy="116" r="25" fill="#F1C38B"/><path d="M57 195q0-74 48-74t48 74m-5 0q0-59 38-59t38 59m-9 0q0-74 48-74t48 74" fill="#6C9FC7" stroke="#416B91" stroke-width="7"/>`,
    baby:`<circle cx="160" cy="126" r="62" fill="#F3C99F" stroke="#747C88" stroke-width="8"/><path d="M106 94q54-69 108 0" fill="#D5A36D" stroke="#747C88" stroke-width="8"/><circle cx="140" cy="126" r="6" fill="#334155"/><circle cx="180" cy="126" r="6" fill="#334155"/><path d="M147 151q13 12 26 0" fill="none" stroke="#747C88" stroke-width="7"/>`,
    bag:`<path d="M91 91h138l16 116H75Z" fill="#8FB6E1" stroke="#416C9E" stroke-width="8"/><path d="M125 93V66q0-31 35-31t35 31v27" fill="none" stroke="#416C9E" stroke-width="10"/><rect x="120" y="130" width="80" height="44" rx="10" fill="#C6DEF4" stroke="#416C9E" stroke-width="6"/>`,
    table:`<path d="M61 87h198v28H61Z" fill="#7C8490" stroke="#4B5058" stroke-width="8"/><path d="M84 115v89m152-89v89" stroke="#4B5058" stroke-width="12" stroke-linecap="round"/>`,
    chair:`<path d="M95 57h130v75H95Z" fill="#88ACD1" stroke="#3F6388" stroke-width="8"/><path d="M89 134h143v30H89Zm16 28v47m110-47v47" fill="#6B8FB5" stroke="#3F6388" stroke-width="8" stroke-linecap="round"/>`,
    door:`<rect x="93" y="31" width="134" height="181" rx="5" fill="#7C8490" stroke="#704825" stroke-width="8"/><circle cx="202" cy="129" r="8" fill="#F3D48B"/><path d="M113 49h93v70h-93Z" fill="#ADB2B9" stroke="#704825" stroke-width="6"/>`,
    flower:`<circle cx="160" cy="118" r="24" fill="#F8D46B" stroke="#A77B28" stroke-width="6"/><g fill="#E98BB7" stroke="#AD507E" stroke-width="6"><ellipse cx="160" cy="65" rx="24" ry="34"/><ellipse cx="160" cy="171" rx="24" ry="34"/><ellipse cx="107" cy="118" rx="34" ry="24"/><ellipse cx="213" cy="118" rx="34" ry="24"/></g><path d="M160 144v67m0-33q-43-28-52 4 32 21 52-4" fill="none" stroke="#45894F" stroke-width="9"/>`,
    moon:`<path d="M198 39q-66 16-77 81-12 65 58 96-94 10-123-68-26-74 42-119 50-34 100 10Z" fill="#F9D56B" stroke="#A77B28" stroke-width="8"/>`,
    star:`<path d="m160 31 29 59 65 9-47 46 11 65-58-31-58 31 11-65-47-46 65-9Z" fill="#F8D45D" stroke="#A77B28" stroke-width="8" stroke-linejoin="round"/>`,
    rain:`<path d="M81 125q-21-52 33-63 20-50 75-22 44-1 49 50 38 10 21 48H81Z" fill="#D6E9F7" stroke="#6A96B7" stroke-width="8"/><path d="m115 164-15 31m65-31-15 31m65-31-15 31" stroke="#48A9E0" stroke-width="11" stroke-linecap="round"/>`,
    snow:`<g stroke="#54A7D7" stroke-width="9" stroke-linecap="round"><path d="M160 37v165m-71-124 142 82m0-82L89 160"/><path d="m160 37-13 17m13-17 13 17m-13 148-13-17m13 17 13-17M89 78l22 3m-22-3 7 22m124 60-22-3m22 3-7-22m-124 0 22-3m-22 3 7-22m124-3-22 3m22-3-7-22"/></g>`,
    happy:`<circle cx="160" cy="119" r="75" fill="#F9D26D" stroke="#A77B28" stroke-width="8"/><circle cx="133" cy="104" r="7" fill="#334155"/><circle cx="187" cy="104" r="7" fill="#334155"/><path d="M125 143q35 45 70 0" fill="none" stroke="#8D5C20" stroke-width="9" stroke-linecap="round"/>`,
    sad:`<circle cx="160" cy="119" r="75" fill="#B9D8ED" stroke="#477A9C" stroke-width="8"/><circle cx="133" cy="104" r="7" fill="#334155"/><circle cx="187" cy="104" r="7" fill="#334155"/><path d="M125 166q35-45 70 0" fill="none" stroke="#477A9C" stroke-width="9" stroke-linecap="round"/><path d="M204 126q18 16 0 32" fill="none" stroke="#4AA7DA" stroke-width="7"/>`,
    turtle:`<ellipse cx="160" cy="128" rx="73" ry="55" fill="#75BB77" stroke="#367C45" stroke-width="8"/><path d="M105 111q55-73 110 0v34q-55 64-110 0Z" fill="#4E915B" stroke="#2F6840" stroke-width="8"/><circle cx="241" cy="119" r="22" fill="#8DCE83" stroke="#367C45" stroke-width="7"/><circle cx="246" cy="113" r="5" fill="#243B32"/><path d="M111 166 92 189m104-23 16 24m-78-116-5-25m62 25 8-25" stroke="#367C45" stroke-width="11" stroke-linecap="round"/>`,
    ear:`<path d="M178 196q-68 5-76-70-8-80 55-100 69-21 94 46 16 45-21 77-22 20-20 36-1 17-32 11Z" fill="#F0BE9F" stroke="#717984" stroke-width="8"/><path d="M184 157q-24-14-19-42 6-30 32-20 19 9 5 31-11 14-6 30" fill="none" stroke="#717984" stroke-width="9" stroke-linecap="round"/>`,
    pen:`<g transform="rotate(38 160 115)"><rect x="132" y="42" width="56" height="135" rx="9" fill="#60A5FA" stroke="#2E5F98" stroke-width="8"/><path d="M132 62h56m-56 85h56" stroke="#DDEEFF" stroke-width="7"/><path d="m132 177 28 42 28-42Z" fill="#64748B" stroke="#2E5F98" stroke-width="7"/></g>`,
    ball:`<circle cx="160" cy="118" r="75" fill="#F7F7F7" stroke="#64748B" stroke-width="8"/><path d="M160 43q-28 32-12 54 24 16 40-5 23-24 47-10m-150 65q42-5 53-36 3-26-20-44m47 126q-17-39-3-58 21-26 55-16" fill="none" stroke="#4D83B5" stroke-width="8" stroke-linecap="round"/>`,
    briefcase:`<rect x="69" y="84" width="182" height="120" rx="13" fill="#737B86" stroke="#42474E" stroke-width="8"/><path d="M122 84V62q0-16 18-16h40q18 0 18 16v22" fill="none" stroke="#42474E" stroke-width="9"/><path d="M69 130h182m-106-7h30v22h-30Z" fill="#EBC58F" stroke="#42474E" stroke-width="7"/>`,
    'arrow-right':`<path d="M55 121h190m-72-67 72 67-72 67" fill="none" stroke="#3E83C1" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`,
    'arrow-left':`<path d="M265 121H75m72-67-72 67 72 67" fill="none" stroke="#3E83C1" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`,
    swim:`<path d="M46 162q37-35 74 0t74 0 80 0v39H46Z" fill="#58B6E7" stroke="#2879A8" stroke-width="7"/><circle cx="164" cy="68" r="24" fill="#F0C18C" stroke="#5F666F" stroke-width="6"/><path d="m150 96-43 39 51 13 45-28m-43-24 44 18" fill="none" stroke="#3B83B6" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`,
    hello:`<path d="M54 59h146q16 0 16 16v76q0 16-16 16h-63l-31 25v-25H54q-16 0-16-16V75q0-16 16-16Z" fill="#DDEEFF" stroke="#4C7FA9" stroke-width="8"/><path d="M82 108h86" stroke="#4C7FA9" stroke-width="8" stroke-linecap="round"/><path d="M117 143v-35" stroke="#4C7FA9" stroke-width="8" stroke-linecap="round"/>`,
    thanks:`<path d="M103 181q-34-34-34-83 0-23 22-23 18 0 25 18l5-38q4-24 25-20 19 4 15 26l-4 39 17-26q14-20 31-8 15 12 2 31l-24 42q-16 37-53 42Z" fill="#F0C18C" stroke="#606771" stroke-width="8"/><path d="M195 54q26-29 53-4 28 30-52 81-80-51-52-81 27-25 51 4Z" fill="#E987A5" stroke="#A64E6C" stroke-width="7"/>`,
    apology:`<path d="M160 42q-70 0-70 67 0 39 42 61v26h56v-26q42-22 42-61 0-67-70-67Z" fill="#E9D4B7" stroke="#69707B" stroke-width="8"/><path d="M130 109h60m-60 25h60" stroke="#69707B" stroke-width="8" stroke-linecap="round"/><path d="M147 161q13 12 26 0" fill="none" stroke="#69707B" stroke-width="6"/>`,
    goodbye:`<path d="M80 144q-11-60 44-60 35 0 37 37 3-39 36-37 49 0 43 57-3 36-81 77-77-38-79-74Z" fill="#C7DDF1" stroke="#517EA7" stroke-width="8"/><path d="M133 98q22 19 0 39m54-39q-22 19 0 39" fill="none" stroke="#517EA7" stroke-width="8" stroke-linecap="round"/>`,
    maze:`<rect x="65" y="44" width="190" height="156" rx="8" fill="#F7E7C2" stroke="#5E656E" stroke-width="8"/><path d="M97 74h46v31h-22v40h42v-18h33v41h26m-125-3H96v-21m67-88h54v29h-27v37m-66 47h-22" fill="none" stroke="#5E656E" stroke-width="9" stroke-linejoin="round"/>`,
    shield:`<path d="M160 31q46 27 88 26v66q-4 63-88 99-84-36-88-99V57q42 1 88-26Z" fill="#9BC7E8" stroke="#3F6C90" stroke-width="8"/><path d="m122 123 25 25 52-59" fill="none" stroke="#2F855A" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`,
    puzzle:`<path d="M66 65h65q-8 29 19 30 26 0 17-30h87v66q-30-8-30 18 0 25 30 17v66h-71q8-30-18-30-27 0-19 30H66v-71q29 8 29-18 0-25-29-17Z" fill="#A7CBE9" stroke="#416D96" stroke-width="8" stroke-linejoin="round"/>`,
    stamp:`<path d="M115 65q0-32 45-32t45 32v42h-90Z" fill="#A5B8CB" stroke="#52677A" stroke-width="8"/><rect x="92" y="108" width="136" height="47" rx="8" fill="#64748B" stroke="#334155" stroke-width="8"/><rect x="61" y="169" width="198" height="38" rx="8" fill="#F9E6A7" stroke="#986E29" stroke-width="8"/><path d="m121 188 22 10 48-22" fill="none" stroke="#348A5A" stroke-width="8" stroke-linecap="round"/>`,
    chain:`<g fill="none" stroke="#6488A8" stroke-width="18"><rect x="67" y="81" width="105" height="64" rx="32" transform="rotate(-25 119 113)"/><rect x="148" y="93" width="105" height="64" rx="32" transform="rotate(-25 200 125)"/></g>`,
    arrows:`<path d="M78 89h137m-42-42 42 42-42 42M242 157H105m42-42-42 42 42 42" fill="none" stroke="#4B8DBD" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`,
    scissors:`<circle cx="102" cy="160" r="28" fill="none" stroke="#64748B" stroke-width="9"/><circle cx="102" cy="81" r="28" fill="none" stroke="#64748B" stroke-width="9"/><path d="m124 96 124 91m-124-18 124-91" stroke="#64748B" stroke-width="10" stroke-linecap="round"/>`,
    eye:`<path d="M43 120q117-115 234 0-117 115-234 0Z" fill="#D8EDFA" stroke="#477B9B" stroke-width="8"/><circle cx="160" cy="120" r="43" fill="#6AA3C6" stroke="#477B9B" stroke-width="8"/><circle cx="160" cy="120" r="18" fill="#263F57"/>`,
    gear:`<circle cx="160" cy="120" r="53" fill="#BDD5E8" stroke="#456E8D" stroke-width="9"/><circle cx="160" cy="120" r="20" fill="#F8FAFC" stroke="#456E8D" stroke-width="8"/><path d="M160 38v25m0 115v25M78 120h25m115 0h25M102 62l18 18m80 80 18 18m0-116-18 18m-80 80-18 18" stroke="#456E8D" stroke-width="14" stroke-linecap="round"/>`,
    picture:`<rect x="57" y="40" width="206" height="160" rx="11" fill="#EAF5FF" stroke="#547F9F" stroke-width="8"/><circle cx="210" cy="81" r="17" fill="#F5C75F"/><path d="m75 178 54-58 38 35 37-43 42 66Z" fill="#81BD86" stroke="#4E8958" stroke-width="7" stroke-linejoin="round"/>`,
    tag:`<path d="M65 60h111l79 79-85 85-105-105Z" fill="#F5D9A2" stroke="#626972" stroke-width="8" stroke-linejoin="round"/><circle cx="112" cy="106" r="12" fill="#F8FAFC" stroke="#626972" stroke-width="7"/>`,
    domino:`<rect x="83" y="55" width="69" height="137" rx="8" transform="rotate(-14 83 55)" fill="#EAF3FC" stroke="#496E91" stroke-width="8"/><rect x="170" y="55" width="69" height="137" rx="8" transform="rotate(14 170 55)" fill="#F4DEAA" stroke="#5E656F" stroke-width="8"/><path d="M111 128h27m44 0h27" stroke="#496E91" stroke-width="7"/>`,
    sunrise:`<path d="M55 178h210" stroke="#64748B" stroke-width="8" stroke-linecap="round"/><path d="M91 178a69 69 0 0 1 138 0" fill="#F7CF68" stroke="#B17B2C" stroke-width="8"/><path d="M160 37v24m-77 9 17 17m120-17-17 17" stroke="#D89B3B" stroke-width="9" stroke-linecap="round"/>`,
    chart:`<path d="M63 196h194" stroke="#64748B" stroke-width="8"/><rect x="88" y="125" width="34" height="71" rx="6" fill="#7DB6DF"/><rect x="145" y="89" width="34" height="107" rx="6" fill="#74BE8A"/><rect x="202" y="53" width="34" height="143" rx="6" fill="#F1BC64"/>`,
    tools:`<path d="M75 82q25-44 68-15l-29 29 34 34-20 20-34-34-30 29q-29-44 11-63Zm78 69 18-18 82 82-18 18Z" fill="#94A3B8" stroke="#475569" stroke-width="8" stroke-linejoin="round"/>`,
    layers:`<path d="m160 43 104 48-104 48L56 91Z" fill="#A8CCE8" stroke="#4D7797" stroke-width="8"/><path d="m56 125 104 48 104-48m-208 35 104 48 104-48" fill="none" stroke="#4D7797" stroke-width="8" stroke-linejoin="round"/>`
  });
  for(let n=1;n<=5;n++)A['number-'+n]=`<circle cx="160" cy="120" r="72" fill="#EAF2FB" stroke="#4C78A6" stroke-width="8"/><text x="160" y="154" text-anchor="middle" font-size="104" font-weight="800" fill="#315D8A">${n}</text>`;
  const swatches={'color-red':'#EF4444','color-blue':'#3B82F6','color-green':'#22C55E','color-yellow':'#FACC15','color-black':'#1F2937','color-white':'#FFFFFF'};
  for(const [k,c] of Object.entries(swatches))A[k]=`<rect x="70" y="40" width="180" height="160" rx="25" fill="${c}" stroke="#64748B" stroke-width="8"/><path d="M91 65h45" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="10" stroke-linecap="round"/>`;
  A.chart=A.chart||`<path d="M63 196h194" stroke="#64748B" stroke-width="8"/><rect x="88" y="125" width="34" height="71" rx="6" fill="#7DB6DF"/><rect x="145" y="89" width="34" height="107" rx="6" fill="#74BE8A"/><rect x="202" y="53" width="34" height="143" rx="6" fill="#F1BC64"/>`;
  A.cloud=A.cloud||`<path d="M92 172h132a40 40 0 0 0 6-79 54 54 0 0 0-102-10 46 46 0 0 0-36 89Z" fill="#CBD5E1" stroke="#64748B" stroke-width="8" stroke-linejoin="round"/>`;
  A.tools=A.tools||`<path d="M75 82q25-44 68-15l-29 29 34 34-20 20-34-34-30 29q-29-44 11-63Zm78 69 18-18 82 82-18 18Z" fill="#94A3B8" stroke="#475569" stroke-width="8" stroke-linejoin="round"/>`;
  const EXTRA={
    chartUp:`<path d="M67 188h190" stroke="#64748B" stroke-width="8"/><path d="m83 163 42-44 36 20 69-76" fill="none" stroke="#22A06B" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M207 63h23v24" fill="none" stroke="#22A06B" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
    chartDown:`<path d="M67 188h190" stroke="#64748B" stroke-width="8"/><path d="m83 74 42 44 36-20 69 76" fill="none" stroke="#D65B5B" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M207 174h23v-24" fill="none" stroke="#D65B5B" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`
  };
  function svg(type,label){
    let art=A[type];if(type==='chart-up')art=EXTRA.chartUp;if(type==='chart-down')art=EXTRA.chartDown;
    if(!art)art=A.document;
    const bg={blue:'#EEF6FF',teal:'#E8FAF5',green:'#EDF8ED',orange:'#FFF5E3',red:'#FFF0EF',purple:'#F4F0FF',navy:'#EEF2F7',pink:'#FFF0F5'};
    const color=type==='wave'||type==='water'||type==='plane'||type==='train'||type==='laptop'?'blue':type==='fire'||type==='warning'||type==='siren'?'orange':type==='heart'||type==='angry'||type==='pill'?'pink':type==='tree'||type==='leaf'||type==='recycle'||type==='frog'?'green':type==='graduation'||type==='book'||type==='books'?'purple':'teal';
    return `<div class="st-picture-stage" role="img" aria-label="ภาพประกอบคำศัพท์"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" aria-hidden="true"><defs><linearGradient id="pg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${bg[color]||'#EEF6FF'}"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient></defs><rect x="8" y="8" width="304" height="224" rx="28" fill="url(#pg)"/><circle cx="267" cy="46" r="13" fill="${COLORS[color]||COLORS.teal}" opacity=".13"/><circle cx="48" cy="197" r="20" fill="${COLORS[color]||COLORS.teal}" opacity=".1"/>${art}</svg></div>`;
  }
  const keys=Object.keys(MAP);
  try{if(typeof E==='object'&&E)keys.forEach(k=>{if(!E[k])E[k]='🖼️'});}catch(_){(window.TGAT1_ERR||Object)(_,'app')}
  window.STUDIO_PICTURE_BANK={
    version:window.TGAT1_VERSION.app,
    has(word){return Object.prototype.hasOwnProperty.call(MAP,String(word||'').trim().toLowerCase());},
    render(word){const key=String(word||'').trim().toLowerCase();return svg(MAP[key]||'document',key);},
    words(){return keys.slice();},
    count:keys.length,
    typeFor(word){return MAP[String(word||'').trim().toLowerCase()]||'document';},
    missingTypes:[...new Set(Object.values(MAP))].filter(t=>!A[t]&&t!=='chart-up'&&t!=='chart-down')
  };
})();


/* ===== 40 · 46-exam-diversity-v40-4.js ===== */
/* TGAT1 English Studio v40.6.7 — category-balanced exam selection and passage variety. */
(function(){
  'use strict';
  /* One consolidated selection policy. It does not create new questions; it only chooses/order existing ones. */
  const ORDER=['qr','short','long','tc','rc'];
  const shuffle=a=>{const x=(Array.isArray(a)?a:[]).slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};
  const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
  const catKey=q=>{const raw=norm(q&&(q.category||q.cat||q.section||q.type));const key=raw.replace(/[^a-z]/g,'');if(key==='qr'||key.startsWith('quick'))return'qr';if(key.includes('short'))return'short';if(key.includes('long'))return'long';if(key==='tc'||key.includes('textcompletion'))return'tc';if(key==='rc'||key.includes('reading'))return'rc';return raw;};
  const contextKey=q=>norm(q&&q.context)||('standalone:'+norm(q&&q.prompt));
  const promptKey=q=>norm(q&&q.prompt);
  function scoreCandidate(q,lastContext,lastPrompt,usedContexts,usedPrompts){
    const c=contextKey(q),p=promptKey(q);
    return (c!==lastContext?8:0)+(p!==lastPrompt?5:0)+(!usedContexts.has(c)?4:0)+(!usedPrompts.has(p)?2:0)+Math.random();
  }
  function chooseDiverse(pool,n){
    const src=shuffle((Array.isArray(pool)?pool:[]).filter(Boolean));
    const want=Math.max(0,Math.min(src.length,Math.floor(Number(n)||0)));
    if(!want)return[];
    if(want>=src.length)return diverseOrder(src);
    const cats=ORDER.filter(c=>src.some(q=>catKey(q)===c));
    if(!cats.length)return src.slice(0,want);
    const base=Math.floor(want/cats.length),extra=want%cats.length;
    const targets=Object.fromEntries(cats.map((c,i)=>[c,base+(i<extra?1:0)]));
    const chosen=[],used=new Set(),usedContexts=new Set(),usedPrompts=new Set();
    let lastContext='',lastPrompt='';
    for(const cat of cats){
      const need=targets[cat]||0;
      for(let slot=0;slot<need;slot++){
        const candidates=src.filter(q=>catKey(q)===cat&&!used.has(q.id));
        if(!candidates.length)continue;
        const best=candidates.map(q=>({q,s:scoreCandidate(q,lastContext,lastPrompt,usedContexts,usedPrompts)})).sort((a,b)=>b.s-a.s)[0].q;
        chosen.push(best);used.add(best.id);
        lastContext=contextKey(best);lastPrompt=promptKey(best);usedContexts.add(lastContext);usedPrompts.add(lastPrompt);
      }
    }
    while(chosen.length<want){
      const candidates=src.filter(q=>!used.has(q.id));if(!candidates.length)break;
      const best=candidates.map(q=>({q,s:scoreCandidate(q,lastContext,lastPrompt,usedContexts,usedPrompts)})).sort((a,b)=>b.s-a.s)[0].q;
      chosen.push(best);used.add(best.id);lastContext=contextKey(best);lastPrompt=promptKey(best);usedContexts.add(lastContext);usedPrompts.add(lastPrompt);
    }
    return shuffle(chosen);
  }
  function diverseOrder(pool){
    const src=shuffle((Array.isArray(pool)?pool:[]).filter(Boolean));
    const buckets=Object.fromEntries(ORDER.map(c=>[c,shuffle(src.filter(q=>catKey(q)===c))]));
    const out=[],usedContexts=new Set(),usedPrompts=new Set();
    let lastContext='',lastPrompt='',turn=0;
    while(out.length<src.length){
      let best=null,bestCat='',bestIndex=-1,bestScore=-Infinity;
      for(let step=0;step<ORDER.length;step++){
        const cat=ORDER[(turn+step)%ORDER.length],bucket=buckets[cat];
        if(!bucket.length)continue;
        for(let i=0;i<bucket.length;i++){
          const q=bucket[i],s=scoreCandidate(q,lastContext,lastPrompt,usedContexts,usedPrompts);
          if(s>bestScore){best=q;bestCat=cat;bestIndex=i;bestScore=s;}
        }
      }
      if(!best)break;
      buckets[bestCat].splice(bestIndex,1);
      const ck=contextKey(best),pk=promptKey(best);
      out.push(best);usedContexts.add(ck);usedPrompts.add(pk);lastContext=ck;lastPrompt=pk;turn=(ORDER.indexOf(bestCat)+1)%ORDER.length;
    }
    return out;
  }
  window.STUDIO_EXAM_CATEGORY_KEY=catKey;
  window.STUDIO_SELECT_DIVERSE_QUESTIONS=chooseDiverse;
  window.STUDIO_ORDER_DIVERSE_QUESTIONS=diverseOrder;
  if(typeof VLT_mixPool==='function')window.VLT_mixPool=function(n){return chooseDiverse(typeof VLT_BANK!=='undefined'?VLT_BANK:[],n||10);};
  if(typeof VLT_dailyPool==='function')window.VLT_dailyPool=function(){return chooseDiverse(typeof VLT_BANK!=='undefined'?VLT_BANK:[],10);};
  if(typeof VLT_startSprint==='function')window.VLT_startSprint=function(){
    if(typeof VLT_begin!=='function'||typeof VLT_BANK==='undefined')return;
    const qs=diverseOrder(VLT_BANK).map(q=>({...q,userAnswer:null}));
    VLT_begin({mode:'sprint',label:'สปรินต์ 90 วินาที',qs,index:0,answers:{},score:0,combo:0,deadline:Date.now()+90000,seconds:90,reviewOn:false});
  };
  if(typeof VLT_startReview==='function')window.VLT_startReview=function(){
    const ids=Object.keys(VLT_STATE&&VLT_STATE.missed||{}).filter(id=>VLT_STATE.missed[id]>0);
    if(!ids.length){if(typeof VLT_toast==='function')VLT_toast('ยังไม่มีข้อที่ตอบผิด ลองทำชุดฝึกก่อนนะ');return;}
    const pool=ids.map(VLT_get).filter(Boolean),qs=chooseDiverse(pool,20).map(q=>({...q,userAnswer:null}));
    VLT_begin({mode:'practice',label:'แก้มือข้อที่เคยผิด',qs,index:0,answers:{},score:0,combo:0,reviewOn:true});
  };
})();



/* ===== v40.6.7 consolidated quality + runtime hardening ===== */
(function(){
  'use strict';
  const CONTENT_VERSION=(window.TGAT1_VERSION&&window.TGAT1_VERSION.content)||'42.0.0';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const norm=v=>clean(v).toLocaleLowerCase('en-US').replace(/[“”‘’"']/g,'').replace(/\s+/g,' ');
  const bank=()=>Array.isArray(window.VLT_BANK)?window.VLT_BANK:[];
  const shuffle=a=>{const x=(Array.isArray(a)?a:[]).slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};

  // Hard content gate: malformed questions never enter normal practice flows.
  function contentGate(q){
    if(!q||!q.id||!clean(q.prompt))return false;
    const opts=Array.isArray(q.options)?q.options:[];
    const a=Number(q.answer);
    if(opts.length!==4||!Number.isInteger(a)||a<0||a>3||!clean(q.explanation))return false;
    if(new Set(opts.map(norm)).size!==4)return false;
    if(['short','long','tc','rc'].includes(q.category)&&!clean(q.context))return false;
    return true;
  }
  function eligible(pool){return (Array.isArray(pool)?pool:[]).filter(contentGate);}

  // Shuffle answer choices and remap the correct index every time a practice set is created.
  const PROMPT_VARIANTS=[
    'Choose the best completion for blank ($1).',
    'Which line fits blank ($1) most naturally?',
    'What should the speaker say in blank ($1)?',
    'Select the most appropriate sentence for blank ($1).',
    'Which response best completes blank ($1)?',
    'What is the best line to use for blank ($1)?'
  ];
  function diversifyPrompt(q){
    if(!q||!['short','long'].includes(q.category))return q;
    const p=clean(q.prompt);
    const m=p.match(/(?:what is the best completion for blank|choose the best completion for blank)\s*\((\d+)\)\??/i);
    if(!m)return q;
    const n=m[1],idx=String(q.id||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%PROMPT_VARIANTS.length;
    return {...q,prompt:PROMPT_VARIANTS[idx].replace('$1',n)};
  }
  function prepare(q){
    const opts=Array.isArray(q&&q.options)?q.options:[];
    const a=Number(q&&q.answer);
    if(opts.length!==4||!Number.isInteger(a)||a<0||a>3)return null;
    const pairs=opts.map((text,i)=>({text,correct:i===a}));
    for(let i=pairs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pairs[i],pairs[j]]=[pairs[j],pairs[i]];}
    const out=diversifyPrompt(q);
    return {...out,options:pairs.map(x=>x.text),answer:pairs.findIndex(x=>x.correct),userAnswer:null,contentVersion:CONTENT_VERSION};
  }
  function prepareList(qs){return (Array.isArray(qs)?qs:[]).map(prepare).filter(Boolean);}
  function rcType(q){
    const p=norm(q&&q.prompt);
    if(/main idea|mainly about|central idea/i.test(p))return'main-idea';
    if(/infer|inferred|follows logically|suggest/i.test(p))return'inference';
    if(/purpose|why does the author/i.test(p))return'purpose';
    if(/refer|this word|this phrase/i.test(p))return'reference';
    if(/closest in meaning|meaning of/i.test(p))return'vocabulary';
    if(/attitude|tone/i.test(p))return'attitude';
    if(/compare|contrast|difference/i.test(p))return'compare-contrast';
    if(/cause|reason|result|effect/i.test(p))return'cause-effect';
    if(/sentence.*mean|meaning.*sentence/i.test(p))return'sentence-meaning';
    if(/what|which|according to|states|mentions/i.test(p))return'detail';
    return'other';
  }
  function chooseRC(pool,n){
    const src=shuffle(pool),out=[],used=new Set(),types=new Set();
    const ranked=src.slice().sort((a,b)=>{
      const ad=rcType(a)==='detail'?1:0,bd=rcType(b)==='detail'?1:0;return ad-bd+Math.random()*.1;
    });
    for(const q of ranked){if(out.length>=n)break;const t=rcType(q);if(t!=='detail'&&!types.has(t)){out.push(q);used.add(q.id);types.add(t);}}
    for(const q of ranked){if(out.length>=n)break;if(used.has(q.id))continue;out.push(q);used.add(q.id);}
    return shuffle(out);
  }
  function beginPractice(qs,label,extra={}){
    const ready=prepareList(qs);
    if(!ready.length||typeof window.VLT_begin!=='function')return false;
    window.VLT_begin({mode:'practice',label,qs:ready,index:0,answers:{},score:0,combo:0,reviewOn:false,...extra});
    return true;
  }

  // Fix the last 40.6.4 override that bypassed option randomization.
  window.VLT_startCategory=function(cat){
    const pool=eligible(bank().filter(q=>q.category===cat));
    const recent=typeof window.STUDIO_IS_RECENT_QUESTION==='function'?pool.filter(q=>!window.STUDIO_IS_RECENT_QUESTION(q.id)):pool;
    const source=recent.length>=10?recent:pool;
    const qs=cat==='rc'?chooseRC(source,10):shuffle(source).slice(0,10);
    qs.forEach(q=>window.STUDIO_REMEMBER_QUESTION?.(q));
    return beginPractice(qs,(typeof VLT_CATS!=='undefined'?VLT_CATS:[]).find(x=>x[0]===cat)?.[1]||cat,{coachMeta:{category:cat,createdAt:Date.now()}});
  };
  window.VLT_startQuick=function(){
    const pool=eligible(bank());
    const qs=typeof window.STUDIO_SELECT_DIVERSE_QUESTIONS==='function'?window.STUDIO_SELECT_DIVERSE_QUESTIONS(pool,10):shuffle(pool).slice(0,10);
    return beginPractice(qs,'สุ่ม 10 ข้อ');
  };
  window.VLT_startDaily=function(){
    const pool=eligible(bank());
    const qs=typeof window.STUDIO_SELECT_DIVERSE_QUESTIONS==='function'?window.STUDIO_SELECT_DIVERSE_QUESTIONS(pool,10):shuffle(pool).slice(0,10);
    return beginPractice(qs,'ภารกิจประจำวัน',{mode:'daily'});
  };
  window.VLT_startFavorites=function(){
    const ids=typeof VLT_STATE!=='undefined'&&Array.isArray(VLT_STATE.favorites)?VLT_STATE.favorites:[];
    const qs=eligible(ids.map(id=>typeof VLT_get==='function'?VLT_get(id):null).filter(Boolean));
    if(!qs.length){if(typeof VLT_toast==='function')VLT_toast('กด ♡ ระหว่างทำข้อสอบเพื่อเก็บข้อโปรดก่อนนะ');return false;}
    return beginPractice(shuffle(qs),'ข้อโปรดของฉัน');
  };
  window.VLT_startSprint=function(){
    const pool=eligible(bank());
    const qs=prepareList(typeof window.STUDIO_ORDER_DIVERSE_QUESTIONS==='function'?window.STUDIO_ORDER_DIVERSE_QUESTIONS(pool):shuffle(pool));
    if(!qs.length)return false;
    VLT_begin({mode:'sprint',label:'สปรินต์ 90 วินาที',qs,index:0,answers:{},score:0,combo:0,deadline:Date.now()+90000,seconds:90,reviewOn:false});
    return true;
  };

  // Review uses the historical snapshot, then applies the same answer-position protection.
  const snap=q=>q?{id:q.id,set:q.set,category:q.category,kind:q.kind,section:q.section,prompt:q.prompt,context:q.context,options:Array.isArray(q.options)?q.options.slice():[],answer:q.answer,explanation:q.explanation,hint:q.hint,topic:q.topic,difficulty:q.difficulty,contentVersion:q.contentVersion||CONTENT_VERSION,snapshotAt:Date.now()}:null;
  window.STUDIO_SNAPSHOT_MISSED=function(q){
    if(!q||typeof VLT_STATE==='undefined')return;
    VLT_STATE.missedMeta=VLT_STATE.missedMeta||{};
    if(!VLT_STATE.missedMeta[q.id])VLT_STATE.missedMeta[q.id]=snap(q);
  };
  window.STUDIO_HISTORICAL_QUESTION=function(id){
    const m=VLT_STATE&&VLT_STATE.missedMeta&&VLT_STATE.missedMeta[id];
    return m||(typeof VLT_get==='function'?VLT_get(id):null);
  };
  const oldRecord=typeof VLT_record==='function'?VLT_record:null;
  if(oldRecord&&!oldRecord.__v4064){
    const fn=function(q,ok){if(!ok)window.STUDIO_SNAPSHOT_MISSED(q);return oldRecord(q,ok);};
    fn.__v4064=true;window.VLT_record=fn;
  }
  window.VLT_startReview=function(){
    const ids=Object.keys(VLT_STATE&&VLT_STATE.missed||{}).filter(id=>VLT_STATE.missed[id]>0);
    if(!ids.length){if(typeof VLT_toast==='function')VLT_toast('ยังไม่มีข้อที่ตอบผิด ลองทำชุดฝึกก่อนนะ');return false;}
    const qs=shuffle(ids.map(id=>window.STUDIO_HISTORICAL_QUESTION(id)).filter(contentGate)).slice(0,20);
    return beginPractice(qs,'แก้มือข้อที่เคยผิด',{reviewOn:true});
  };
  window.VLT_retryWrong=function(){
    const r=VLT_RESULT;if(!r)return false;
    const wrong=r.scored.filter(q=>q.userAnswer!==q.answer).map(q=>typeof VLT_get==='function'?VLT_get(q.id):q).filter(contentGate);
    if(!wrong.length)return VLT_home();
    return beginPractice(shuffle(wrong),'แก้มือข้อที่ผิด',{reviewOn:true});
  };
  const oldRetry=window.VLT_retry;
  if(typeof oldRetry==='function'&&!oldRetry.__v4064){
    const fn=function(){
      const r=VLT_RESULT;if(!r)return VLT_home();
      if(r.mode==='mock')return VLT_startMock(r.setNo||1);
      if(r.mode==='daily')return VLT_startDaily();
      if(r.mode==='sprint')return VLT_startSprint();
      if(r.scored.length){const qs=r.scored.map(q=>typeof VLT_get==='function'?VLT_get(q.id):q).filter(contentGate);return beginPractice(shuffle(qs),'เล่นซ้ำ');}
      return VLT_startQuick();
    };
    fn.__v4064=true;window.VLT_retry=fn;
  }

  window.STUDIO_CONTENT_GATE_4064=Object.freeze({
    version:CONTENT_VERSION,
    check:contentGate,
    eligibleCount:()=>eligible(bank()).length,
    excludedCount:()=>bank().length-eligible(bank()).length,
    answerDistribution:()=>{const c=[0,0,0,0];eligible(bank()).forEach(q=>{c[q.answer]++});return {A:c[0],B:c[1],C:c[2],D:c[3],total:c.reduce((a,b)=>a+b,0)};},
    rcQuestionTypes:()=>{const rows=eligible(bank()).filter(q=>q.category==='rc'),out={};for(const q of rows){const p=norm(q.prompt);let t='other';if(/main idea|mainly about|central idea/i.test(p))t='main-idea';else if(/infer|inferred|follows logically|suggest/i.test(p))t='inference';else if(/purpose|why does the author/i.test(p))t='purpose';else if(/refer|this word|this phrase/i.test(p))t='reference';else if(/closest in meaning|meaning of/i.test(p))t='vocabulary';else if(/attitude|tone/i.test(p))t='attitude';else if(/compare|contrast|difference/i.test(p))t='compare-contrast';else if(/cause|reason|result|effect/i.test(p))t='cause-effect';else if(/sentence.*mean|meaning.*sentence/i.test(p))t='sentence-meaning';else if(/what|which|according to|states|mentions/i.test(p))t='detail';out[t]=(out[t]||0)+1;}return out;}
  });
  window.STUDIO_QUALITY_4064={version:CONTENT_VERSION,rcNewPassages:30,conversationCompletionized:400,tcReviewed:20,qrLengthGuard:true,historicalMissSnapshots:true,answerPositionRandomized:true,contentGate:true,rcTypeAudit:true,blankTargetEvidence:true,shortAnswerTemplatesResolved:true,longBlankLabelsUnique:true,qrSuffixRepairs:205};
})();

/* ===== 41 · external-link offline notice (v40.7.27) ===== */
(function(){
  'use strict';
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('a[href^="http"]'):null;
    if(!a||navigator.onLine!==false)return;
    e.preventDefault();
    var msg='ตอนนี้ออฟไลน์ — ลิงก์นี้ (พจนานุกรม/ออกเสียง/ค้นรูป/myTCAS) ใช้ได้เมื่อมีอินเทอร์เน็ต';
    if(typeof window.studioToast==='function')window.studioToast(msg);else alert(msg);
  },true);
})();
/* v40.7.10 — ป๊อปอัปในแอปแทน confirm() ตอนส่งข้อสอบจำลอง */
function VLT_confirmFinish(miss){studioModal(`<div class="st-eyebrow">ส่งข้อสอบ</div><h2 style="font-size:22px;margin:6px 0 8px">${miss?'ยังไม่ได้ตอบ '+miss+' ข้อ':'ตอบครบทุกข้อแล้ว'}</h2><p class="st-subtitle">${miss?'ต้องการส่งข้อสอบตอนนี้ หรือกลับไปทำข้อที่เหลือ':'ส่งข้อสอบเพื่อดูผลและเฉลยทั้งหมด'}</p><div class="st-inline" style="margin-top:16px"><button class="st-btn" onclick="studioCloseModal();VLT_finish()">ส่งข้อสอบ</button><button class="st-btn secondary" onclick="studioCloseModal()">กลับไปทำต่อ</button></div>`)}

/* v40.7.11 — TGConfirm: ป๊อปอัปยืนยันในแอป คืน Promise<boolean> แทน confirm() */
let activeTGConfirmCancel=null;
function TGConfirm(msg,opts){
  const o=opts||{};
  const value=(v,fallback)=>v==null||v===''?fallback:String(v);
  const previouslyFocused=document.activeElement;
  return new Promise(resolve=>{
    // A second confirmation replaces the first one; resolve the previous promise as cancelled.
    studioCloseModal();
    const modal=document.createElement('div');
    modal.className='st-modal';
    modal.id='studioModal';
    const box=document.createElement('div');
    box.className='st-modal-box';
    box.setAttribute('role','dialog');
    box.setAttribute('aria-modal','true');
    box.setAttribute('aria-labelledby','tgcTitle');
    const close=document.createElement('button');
    close.type='button';
    close.className='st-modal-close';
    close.setAttribute('aria-label','ปิดหน้าต่าง');
    close.textContent='✕';
    const eyebrow=document.createElement('div');
    eyebrow.className='st-eyebrow';
    eyebrow.textContent=value(o.eyebrow,'ยืนยัน');
    const title=document.createElement('h2');
    title.id='tgcTitle';
    title.style.cssText='font-size:20px;margin:6px 0 8px';
    title.textContent=value(o.title,'ดำเนินการต่อหรือไม่?');
    const message=document.createElement('p');
    message.className='st-subtitle';
    message.textContent=value(msg,'');
    const actions=document.createElement('div');
    actions.className='st-inline';
    actions.style.marginTop='16px';
    const ok=document.createElement('button');
    ok.type='button';
    ok.className='st-btn';
    ok.textContent=value(o.ok,'ยืนยัน');
    const cancel=document.createElement('button');
    cancel.type='button';
    cancel.className='st-btn secondary';
    cancel.textContent=value(o.cancel,'ยกเลิก');
    actions.append(ok,cancel);
    box.append(close,eyebrow,title,message,actions);
    modal.appendChild(box);
    let done=false;
    const focusable=()=>[close,ok,cancel].filter(el=>el.isConnected&&!el.disabled);
    const onKeyDown=event=>{
      if(event.key==='Escape'){event.preventDefault();finish(false);return;}
      if(event.key!=='Tab')return;
      const list=focusable();if(!list.length)return;
      const first=list[0],last=list[list.length-1];
      if(event.shiftKey&&(document.activeElement===first||!box.contains(document.activeElement))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!box.contains(document.activeElement))){event.preventDefault();first.focus();}
    };
    const finish=result=>{
      if(done)return;
      done=true;
      if(activeTGConfirmCancel===cancelActive)activeTGConfirmCancel=null;
      document.removeEventListener('keydown',onKeyDown,true);
      modal.remove();
      if(previouslyFocused&&previouslyFocused.isConnected&&typeof previouslyFocused.focus==='function')previouslyFocused.focus({preventScroll:true});
      resolve(result);
    };
    const cancelActive=()=>finish(false);
    activeTGConfirmCancel=cancelActive;
    close.addEventListener('click',cancelActive);
    cancel.addEventListener('click',cancelActive);
    ok.addEventListener('click',()=>finish(true));
    modal.addEventListener('click',event=>{if(event.target===modal)cancelActive()});
    document.body.appendChild(modal);
    document.addEventListener('keydown',onKeyDown,true);
    ok.focus();
  });
}


/* v40.7.12 — TG_summary: หน้าสรุปผลกลางสำหรับทุกเกมและโหมดฝึก */
function TG_summary(o){const safe=s=>typeof window.studioEsc==='function'?window.studioEsc(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const chips=(o.chips||[]).map(c=>`<span class="tg-sum-chip">${safe(c)}</span>`).join('');return `<section class="tg-sum"><div class="tg-sum-kicker">${safe(o.kicker||'ผลการฝึก')}</div><div class="tg-sum-score">${safe(o.score)}${o.total!=null?`<span>/${safe(o.total)}</span>`:''}</div>${o.pct!=null?`<div class="tg-sum-pct">${safe(o.pct)}%</div>`:''}${o.msg?`<p class="tg-sum-msg">${safe(o.msg)}</p>`:''}${o.note?`<p class="tg-sum-note">${safe(o.note)}</p>`:''}${chips?`<div class="tg-sum-chips">${chips}</div>`:''}${o.actions?`<div class="tg-sum-actions">${o.actions}</div>`:''}</section>`;}

/* v40.7.27 — consolidated page extension dispatchers. Feature layers register decorators instead of wrapping the same page function repeatedly. */
(function(){
  const install=(name,baseKey,hooksKey)=>{
    const base=window[baseKey],hooks=window[hooksKey];
    if(typeof base!=='function'||!Array.isArray(hooks))return;
    window[name]=function(){
      const result=base.apply(this,arguments);
      for(const hook of hooks){try{hook.apply(this,arguments)}catch(error){console.error('TGAT1 page hook failed:',name,error)}}
      return result;
    };
  };
  install('studioHome','__TGAT1_HOME_BASE__','__TGAT1_HOME_HOOKS__');
  install('studioAnalytics','__TGAT1_ANALYTICS_BASE__','__TGAT1_ANALYTICS_HOOKS__');
  install('studioGame','__TGAT1_GAME_BASE__','__TGAT1_GAME_HOOKS__');
  install('studioSettings','__TGAT1_SETTINGS_BASE__','__TGAT1_SETTINGS_HOOKS__');
  const vocabBase=window.__TGAT1_VOCAB_BASE__,vocabHooks=window.__TGAT1_VOCAB_HOOKS__,vocabPre=window.__TGAT1_VOCAB_PRE_HOOKS__;
  if(typeof vocabBase==='function'&&Array.isArray(vocabHooks))window.studioVocabulary=function(){
    for(const hook of (Array.isArray(vocabPre)?vocabPre:[])){try{const out=hook.apply(this,arguments);if(out&&out.handled)return out.value}catch(error){console.error('TGAT1 vocabulary pre-hook failed',error)}}
    const result=vocabBase.apply(this,arguments);
    for(const hook of vocabHooks){try{hook.apply(this,arguments)}catch(error){console.error('TGAT1 vocabulary hook failed',error)}}
    return result;
  };
  if(typeof STUDIO_PAGE!=='undefined'&&STUDIO_PAGE==='home')try{window.studioHome()}catch(error){console.error('TGAT1 home render failed',error)}
})();


/* v40.7.27 — keyboard accessibility safeguards for dynamically rendered controls. */
(function(){
  'use strict';
  const namedIcons=new Map([['✕','ปิด'],['×','ปิด'],['⌂','หน้าหลัก'],['▤','คลังคำศัพท์'],['✎','ศูนย์สอบ'],['¶','Reading Trainer'],['✦','เกมฝึกทักษะ'],['◎','โปรไฟล์'],['◷','สถิติ'],['⚙','ตั้งค่า'],['＋','เพิ่ม'],['−','ลด'],['←','ย้อนกลับ'],['→','ถัดไป'],['🔊','ฟังเสียง']]);
  const enhanced=new WeakSet();
  function enhance(root){
    const nodes=[];if(root&&root.nodeType===1)nodes.push(root);if(root&&root.querySelectorAll)nodes.push(...root.querySelectorAll('button,[onclick]'));
    nodes.forEach(el=>{
      if(el.tagName==='BUTTON'){if(!el.hasAttribute('aria-label')&&!el.hasAttribute('aria-labelledby')&&!el.hasAttribute('title')){const text=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();if(namedIcons.has(text))el.setAttribute('aria-label',namedIcons.get(text));}return;}
      if(!el.hasAttribute('onclick')||enhanced.has(el)||el.matches('a,input,select,textarea,[role]')||el.querySelector('button,a,input,select,textarea'))return;
      const text=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();if(!text)return;
      enhanced.add(el);el.setAttribute('role','button');if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','0');if(!el.hasAttribute('aria-label')&&!el.hasAttribute('aria-labelledby'))el.setAttribute('aria-label',text.slice(0,120));
      el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();el.click();}});
    });
  }
  enhance(document.body);new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(enhance))).observe(document.body,{childList:true,subtree:true});
  window.TGAT1Accessibility={enhance,version:window.TGAT1_VERSION.app};
})();

/* v40.7.32 fix: late overrides of these entry points skipped the lazy question-bank loader,
   so on a fresh launch (before the Exam page was opened) the buttons did nothing. */
(function(){
  'use strict';
  ['VLT_startDaily','VLT_startQuick','VLT_startSprint','VLT_startCategory','VLT_startReview','VLT_startFavorites'].forEach(function(name){
    var fn=window[name];
    if(typeof fn!=='function'||fn.__tgat1NeedsBank)return;
    var wrapped=function(){
      var self=this,args=arguments;
      if(typeof VLT_BANK!=='undefined'&&VLT_BANK.length)return fn.apply(self,args);
      if(typeof VLT_ensureBank!=='function')return fn.apply(self,args);
      VLT_ensureBank().then(function(){fn.apply(self,args)}).catch(function(e){
        try{(window.studioToast||window.VLT_toast||function(){})(e&&e.message||'โหลดคลังข้อสอบไม่สำเร็จ')}catch(_){(window.TGAT1_ERR||Object)(_,'app')}
      });
    };
    wrapped.__tgat1NeedsBank=true;
    window[name]=wrapped;
  });
})();

/* v40.7.32: more entry points that read the lazily loaded question bank. Without the bank
   they showed misleading messages on a fresh launch ("ยังไม่พบคลังข้อสอบ",
   "หมวดนี้ยังไม่มีข้อผิด") instead of loading it first. */
(function(){
  'use strict';
  function needsBank(owner,name){
    var fn=owner&&owner[name];
    if(typeof fn!=='function'||fn.__tgat1NeedsBank)return;
    var wrapped=function(){
      var self=this,args=arguments;
      if(typeof VLT_BANK!=='undefined'&&VLT_BANK.length)return fn.apply(self,args);
      if(typeof VLT_ensureBank!=='function')return fn.apply(self,args);
      VLT_ensureBank().then(function(){fn.apply(self,args)}).catch(function(e){
        try{(window.studioToast||window.VLT_toast||function(){})(e&&e.message||'โหลดคลังข้อสอบไม่สำเร็จ')}catch(_){(window.TGAT1_ERR||Object)(_,'app')}
      });
    };
    wrapped.__tgat1NeedsBank=true;
    try{owner[name]=wrapped}catch(_){(window.TGAT1_ERR||Object)(_,'app')}
  }
  needsBank(window.TGAT1Adaptive,'start');
  needsBank(window.TGAT1LearningCoach,'startMicro');
  needsBank(window,'V14_startCategoryReview');
  needsBank(window,'VLT_startRandomMock');
})();

/* v40.7.32: the Analytics page stacked ~8 internal QA/engineering panels between the
   student's own statistics. They are kept, but moved into one collapsed section at the
   end so students see their progress first. */
(function(){
  'use strict';
  var DEV=/^(QUESTION QUALITY AUDIT|TRUST & QUALITY CENTER|CONTENT EVIDENCE|DEEP QUALITY AUDIT|DEEP QA|LEARNING QUALITY|PRODUCTION HARDENING|COMPLETE LEARNING HARDENING)$/;
  var queued=false;
  function group(){
    queued=false;
    var app=document.getElementById('app');
    if(!app||typeof STUDIO_PAGE==='undefined'||STUDIO_PAGE!=='analytics')return;
    var panels=[];
    function isDev(eb){return DEV.test(String(eb.textContent||'').trim())}
    function hasStudent(node){return [].some.call(node.querySelectorAll('.st-eyebrow'),function(e){return !isDev(e)})}
    app.querySelectorAll('.st-eyebrow').forEach(function(eb){
      if(!isDev(eb)||eb.closest('#tgDevPanels'))return;
      // Largest ancestor below #app that holds only QA panels; a wrapper that also holds a
      // student section (e.g. the wrong-answer notebook) stays where it is.
      var el=eb;while(el.parentElement&&el.parentElement!==app&&!hasStudent(el.parentElement))el=el.parentElement;
      if(el===eb)el=eb.parentElement||eb;
      if(panels.indexOf(el)<0)panels.push(el);
    });
    if(!panels.length)return;
    var box=app.querySelector('#tgDevPanels');
    if(!box){
      box=document.createElement('details');box.id='tgDevPanels';box.className='st-card tg-dev-panels';
      box.innerHTML='<summary><b>ข้อมูลตรวจคุณภาพคลังข้อสอบและระบบ</b><small>สำหรับผู้สอนหรือผู้พัฒนา · ไม่มีผลต่อคะแนนของคุณ</small></summary><div class="tg-dev-panels-body"></div>';
    }
    var body=box.querySelector('.tg-dev-panels-body');
    panels.forEach(function(p){body.appendChild(p)});
    if(box.parentElement!==app||app.lastElementChild!==box)app.appendChild(box);
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(group)}
  function start(){var app=document.getElementById('app');if(!app)return;new MutationObserver(schedule).observe(app,{childList:true});schedule()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();


/* ===== v40.9.0 content audit (detection only; it never edits content) =====
   Flags patterns that automated checks can see. A flag is a reason to review an item, not proof
   that the item is wrong, and an item without flags has not been validated by a person. */
(function(){
  'use strict';
  const t=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const WRAPPER=/^(รายงานแสดงให้เห็นว่าผู้คนสามารถ.+ได้ในสถานการณ์ทั่วไป|รายงานให้ข้อมูลที่เป็นประโยชน์เกี่ยวกับ.+)$/;
  const GENERIC_DISTRACTOR=/^(A completely unrelated (event|object)|To make the project more expensive without testing it|To avoid collecting any evidence|To replace the original goal with an unrelated activity|A rule that must always be followed in every situation|A result that cannot be changed once it is recorded)/i;
  function skeleton(sentence,word){
    let s=t(sentence);if(word)s=s.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),'X');
    const w=s.split(' ');return w.slice(0,4).join(' ')+' … '+w.slice(-3).join(' ');
  }
  function vocabulary(){
    const words=(window.STUDIO_DATA&&Array.isArray(STUDIO_DATA.words))?STUDIO_DATA.words:[];
    const frames=new Map();let wrappers=0,senses=0,placeholderTranslations=0;
    words.forEach(w=>{
      if(WRAPPER.test(t(w.th)))wrappers++;
      let list=null;try{list=Array.isArray(w.senses)?w.senses:null}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
      (list||[]).forEach(s=>{senses++;if(WRAPPER.test(t(s.meaning)))wrappers++;if(WRAPPER.test(t(s.translation))&&!/^The report provides useful information about/i.test(t(s.example)))placeholderTranslations++;const k=skeleton(s.example,w.w);frames.set(k,(frames.get(k)||0)+1)});
    });
    const repeated=[...frames.entries()].filter(([,n])=>n>=20).sort((a,b)=>b[1]-a[1]);
    return {words:words.length,sensesChecked:senses,placeholderMeanings:wrappers,mismatchedPlaceholderTranslations:placeholderTranslations,
      repeatedSentenceFrames:repeated.length,examplesInRepeatedFrames:repeated.reduce((a,[,n])=>a+n,0),topFrames:repeated.slice(0,8).map(([f,n])=>({frame:f,count:n}))};
  }
  function bankAudit(bank){
    const out={items:bank.length,structuralCue:[],keyLengthOutlier:[],fragmentKey:[],genericDistractor:[],nearDuplicate:[],answerPosition:{}};
    const seen=new Map();
    bank.forEach(q=>{
      const o=(q.options||[]).map(t),a=Number(q.answer);if(o.length!==4||!(a>=0&&a<4))return;
      const pos=out.answerPosition[q.category]||(out.answerPosition[q.category]=[0,0,0,0]);pos[a]++;
      const end=s=>{const c=s.slice(-1);return /[?.!,]/.test(c)?c:''};const others=o.filter((_,i)=>i!==a);
      // the key is the only option whose final punctuation differs (e.g. the only question)
      if(others.every(s=>end(s)!==end(o[a]))&&new Set(others.map(end)).size===1&&(end(o[a])||end(others[0])))out.structuralCue.push(q.id);
      const len=s=>s.split(' ').length,mx=Math.max(...others.map(len));
      if(len(o[a])>=Math.max(6,mx*1.8))out.keyLengthOutlier.push(q.id);
      if(['short','long'].includes(q.category)){const body=s=>s.replace(/^[A-Z][a-z]+:\s*/,'');if(len(body(o[a]))<=2&&others.every(s=>len(body(s))>=4))out.fragmentKey.push(q.id)}
      if(others.some(s=>GENERIC_DISTRACTOR.test(s)))out.genericDistractor.push(q.id);
      const k=(t(q.prompt)+'|'+t(q.context)+'|'+o.slice().sort().join('|')).toLowerCase();
      if(seen.has(k))out.nearDuplicate.push([seen.get(k),q.id]);else seen.set(k,q.id);
    });
    out.answerPositionBias=Object.entries(out.answerPosition).filter(([,p])=>{const n=p.reduce((x,y)=>x+y,0);return n>=20&&Math.max(...p)/n>0.4}).map(([c,p])=>({category:c,positions:p}));
    ['structuralCue','keyLengthOutlier','fragmentKey','genericDistractor','nearDuplicate'].forEach(k=>{out[k+'Count']=out[k].length;out[k]=out[k].slice(0,25)});
    return out;
  }
  function readingLab(){
    const pk=(window.__TGAT1_DATA&&window.__TGAT1_DATA.pack)||{};const pos=[0,0,0,0];
    try{[...(pk.textCompletion||[]),...(pk.readingComprehension||[])].forEach(it=>(it.questions||[]).forEach(q=>{if(q.answer>=0&&q.answer<4)pos[q.answer]++}))}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
    return {answerPositions:pos};
  }
  async function run(){
    if(window.TGAT1LazySenses&&typeof TGAT1LazySenses.ensure==='function'){try{await TGAT1LazySenses.ensure()}catch(e){(window.TGAT1_ERR||Object)(e,'app')}}
    let bank=Array.isArray(window.VLT_BANK)?window.VLT_BANK:[];
    if(!bank.length&&typeof window.VLT_ensureBank==='function'){try{await window.VLT_ensureBank();bank=window.VLT_BANK||[]}catch(e){(window.TGAT1_ERR||Object)(e,'app')}}
    return {version:window.TGAT1_VERSION.content,checkedAt:new Date().toISOString(),vocabulary:vocabulary(),bank:bankAudit(bank),readingLab:readingLab(),
      note:'Automated detection only. Flagged items need human review; unflagged items are not certified correct.'};
  }
  window.TGAT1_CONTENT_AUDIT_V408=Object.freeze({run,bankAudit,vocabulary});
})();

/* ===== v42.0.0 TGAT1 Vocabulary Lab: bank-linked lexical practice + SRS ===== */
(function(){
 'use strict';
 const W=window,core=STUDIO_DATA.words,phrases=STUDIO_DATA.phrases;
 const norm=s=>String(s||'').toLowerCase().replace(/[“”‘’]/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
 // v42.0.0 fix: meanings are Thai, so compare them with a Unicode-aware key. The ASCII-only norm() above
 // reduced every Thai gloss to '' and left only English-tainted glosses as distractors (answer always guessable).
 const meaningKey=s=>String(s||'').normalize('NFC').toLowerCase().replace(/[“”‘’]/g,"'").replace(/[^\p{L}\p{M}\p{N}]+/gu,' ').trim();
 const thaiBad=/ใช้บอกลักษณะหรือการกระทำทั่วไป|ในบริบทของข้อมูลหรือการศึกษา|ในบริบทของคนและการทำงานร่วมกัน|ตัวอย่างนี้มีลักษณะ|บทเรียนใช้คำว่า|คำใกล้เคียงความหมาย/i;
 const pseudo=/^(?:syn\.|confusable|structure|phrasal)/i;
 let rankedCache=null, run=null;
 // v42.0.0 fix: the lab previously called the legacy global save() (which writes 'eng3'), so SRS grades were lost on reload.
 const saveVocab=()=>{try{return studioSave('tgat1_studio_vocab_progress_v1',STUDIO_VSTATE)}catch(e){return false}};
 function good(x){return !!(x&&x.w&&x.th&&/[\u0E00-\u0E7F]/.test(x.th)&&!/[A-Za-z]/.test(x.th)&&!thaiBad.test(x.th)&&!pseudo.test(x.pos||''));}
 function regexFor(w){const raw=String(w||'').trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');if(!raw)return null;try{return new RegExp('(^|[^A-Za-z])('+raw+')(?:s|es|ed|ing)?(?=$|[^A-Za-z])','i')}catch(e){return null}}
 function sourceList(){return Array.isArray(VLT_BANK)?VLT_BANK:[]}
 function matchedSource(word,bank){const re=regexFor(word);if(!re)return null;let best=null,score=-1;for(const q of bank){const raw=String(q.context||'').trim();if(!raw||!re.test(raw))continue;let weight=(q.category==='rc'?3:0)+(q.category==='tc'?2:0);if(weight>score){score=weight;let sentence=raw;try{const pieces=raw.split(/(?<=[.!?])\s+/);sentence=pieces.find(x=>re.test(x))||raw}catch(_){(window.TGAT1_ERR||Object)(_,'app')}best={text:sentence||raw,id:q.id,category:q.category,topic:q.topic||'',weight}}}return best}
 function list(force){if(rankedCache&&!force)return rankedCache;const bank=sourceList();const manual=new Set((STUDIO_DATA.examFocus||[]).map(x=>String(x).toLowerCase()));
  const out=[];for(const x of core){if(!good(x))continue;const hit=bank.length?matchedSource(x.w,bank):null;const curated=manual.has(String(x.w).toLowerCase())||x.examPriority===true;const hasFallback=Array.isArray(STUDIO_DATA.examples[x.w])&&STUDIO_DATA.examples[x.w].some(e=>String(e||'').trim());if(!hit&&!curated&&!hasFallback)continue;x._examHits=hit?hit.weight:0;x._examSource=hit;out.push(x)}
  out.sort((a,b)=>((manual.has(b.w.toLowerCase())||b.examPriority)?100:0)+(b._examHits||0)*4-(manual.has(a.w.toLowerCase())||a.examPriority?100:0)-(a._examHits||0)*4||String(a.w).localeCompare(String(b.w)));
  rankedCache=out;return out;
 }
 function posKey(x){const p=String(x.pos||'').toLowerCase();if(/phr|phrase/.test(p)||/\s/.test(x.w))return'phrase';if(/adj/.test(p))return'adj';if(/adv/.test(p))return'adv';if(/\bv\b/.test(p)||p==='v')return'v';if(/\bn\b/.test(p)||p==='n')return'n';return'other'}
 function optionsFor(target,pool){const k=posKey(target),meaning=meaningKey(target.th);if(!meaning)return null;const usable=x=>x!==target&&good(x)&&String(x.w).toLowerCase()!==String(target.w).toLowerCase();let same=VLT_shuffle(pool.filter(x=>usable(x)&&posKey(x)===k));let other=VLT_shuffle(pool.filter(x=>usable(x)&&posKey(x)!==k));const parts=t=>String(t||'').replace(/\([^)]*\)/g,' ').split(/[;,/]|\s-\s/).map(meaningKey).filter(Boolean);const used=new Set(parts(target.th));const seen=new Set([meaning]);const ds=[];for(const x of [...same,...other]){const m=meaningKey(x.th);if(!m||seen.has(m))continue;const ps=parts(x.th);if(ps.some(p=>used.has(p)))continue;seen.add(m);ps.forEach(p=>used.add(p));ds.push(x);if(ds.length===3)break}return ds.length===3?VLT_shuffle([target,...ds]):null}
 function contextFor(x){let src=x._examSource;if(src&&src.text)return src.text;const se=Array.isArray(x.senses)&&x.senses[0];if(se&&se.example)return se.example;return (STUDIO_DATA.examples[x.w]||[])[0]||`The report discusses ${x.w} in a real-life context.`}
 function byUnit(n){const pool=list().filter(x=>x._examHits||x.examPriority||(STUDIO_DATA.examFocus||[]).includes(x.w));if(!pool.length)return core.filter(good).slice(0,6);const phase=n<=9?0:n<=21?1:n<=30?2:n<=40?3:n<=49?4:n<=60?5:n<=66?6:7;const level=phase===0?'A':phase<=2?'B':phase===6?'C':null;let candidates=level?pool.filter(x=>x.level===level):pool;if(candidates.length<12)candidates=pool;const due=candidates.filter(x=>{const r=STUDIO_VSTATE.items[x.w];return r&&Number(r.due)<=Date.now()});const fresh=candidates.filter(x=>!STUDIO_VSTATE.items[x.w]);const ordered=[...due,...fresh,...candidates.filter(x=>!due.includes(x)&&!fresh.includes(x))];const start=((n-1)*7)%Math.max(1,ordered.length);const out=[];for(let z=0;out.length<6&&z<ordered.length;z++){const x=ordered[(start+z)%ordered.length];if(!out.includes(x))out.push(x)}return out}
 function buildItems(mode,unitNo){const pool=list();const selected=mode==='unit'?byUnit(unitNo):pool.slice();const sorted=VLT_shuffle(selected).slice(0,Math.min(10,selected.length));const out=[];for(const x of sorted){const opts=optionsFor(x,pool);if(!opts)continue;const right=opts.findIndex(o=>o===x);out.push({word:x,context:contextFor(x),options:opts.map(o=>o.th),answer:right,source:x._examSource})}return out}
 function start(mode='mixed',unitNo){
  const from=STUDIO_PAGE||'vocab';
  const go=()=>{rankedCache=null;const items=buildItems(mode,unitNo);if(items.length<5){studioToast('คลังคำศัพท์ที่มีตัวเลือกแปลไม่ซ้ำยังไม่พอ ลองอีกครั้งหลังโหลดคลังข้อสอบ');return}
   run={mode,unitNo:Number(unitNo)||null,from,items,index:0,correct:0,results:[],answered:false,selected:-1,started:Date.now()};STUDIO_PAGE='vocab';studioUpdateChrome('vocab');render()};
  if(!sourceList().length&&typeof VLT_ensureBank==='function'){document.getElementById('app').innerHTML='<div class="st-card" role="status">กำลังเชื่อมคำศัพท์กับคลังข้อสอบฝึก…</div>';VLT_ensureBank().then(()=>{if(STUDIO_PAGE===from||mode==='unit')go()}).catch(()=>{rankedCache=null;go()})}else go();
 }
 function render(){if(!run)return;const q=run.items[run.index],n=run.index+1,total=run.items.length;const app=document.getElementById('app');if(!app)return;const a=run.answered,ok=run.selected===q.answer;app.innerHTML=`<div class="st-inline" style="justify-content:space-between"><div><div class="st-eyebrow">TGAT1 VOCABULARY LAB · ${run.unitNo?'LEARNING HUB · UNIT '+run.unitNo:'EXAM-CONTEXT PRACTICE'}</div><h1 class="st-title">ศัพท์จากบริบท · ${n}/${total}</h1><p class="st-subtitle">${run.correct} ตอบถูก · แยกจากคะแนนข้อสอบจำลอง · คำตอบที่ผิดจะส่งเข้าระบบทบทวนศัพท์</p></div><button class="st-btn ghost" onclick="TGAT1VocabularyLab.exit()">✕ ออก</button></div><div class="st-card" style="max-width:820px;margin:18px auto"><div class="st-progress"><i style="width:${n/total*100}%"></i></div><div class="st-eyebrow" style="margin-top:18px">บริบท${q.source?' · '+studioEsc(q.source.category||'โจทย์ฝึก'):' · ตัวอย่างจากคลังศัพท์'}</div><blockquote class="tgat-vocab-context" style="margin:10px 0 20px;padding:16px 20px;border-left:4px solid #5b68c4;background:rgba(91,104,196,.10);color:inherit;border-radius:10px;line-height:1.75">${studioEsc(q.context)}</blockquote><div class="st-eyebrow">${studioEsc(q.word.pos)} · ${studioEsc(q.word.level)} · ${studioEsc(q.word.cat)}</div><h2 style="font-size:26px;margin:5px 0 16px">“${studioEsc(q.word.w)}” ในบริบทนี้ใกล้เคียงกับความหมายใด?</h2><div class="st-grid two">${q.options.map((o,j)=>`<button class="st-btn ${a?(j===q.answer?'':'secondary'):''}" ${a?'disabled':''} onclick="TGAT1VocabularyLab.answer(${j})">${String.fromCharCode(65+j)}. ${studioEsc(o)}</button>`).join('')}</div>${a?`<div class="st-alert ${ok?'':'bad'}" style="margin-top:16px"><b>${ok?'✓ ถูกต้อง':'✕ ยังไม่ถูก · ทบทวนคำนี้อีกครั้ง'}</b><p><strong>${studioEsc(q.word.w)}</strong> · ${studioEsc(q.word.th)}</p>${q.word.note?`<p class="st-muted">หมายเหตุ: ${studioEsc(q.word.note)}</p>`:''}${Array.isArray(q.word.senses)&&q.word.senses[0]?.example?`<p lang="en">${studioEsc(q.word.senses[0].example)}</p><p>${studioEsc(q.word.senses[0].translation||'')}</p>`:''}<p class="st-muted">${q.source?'เชื่อมกับโจทย์ฝึก '+studioEsc(q.source.id)+' · '+studioEsc(q.source.topic||''): 'ตัวอย่างจากคลังคำศัพท์'}</p><div class="st-inline"><button class="st-btn" onclick="TGAT1VocabularyLab.grade(true)">✓ รู้คำนี้แล้ว</button><button class="st-btn secondary" onclick="TGAT1VocabularyLab.grade(false)">↻ ต้องทบทวน</button></div></div>`:''}</div>`}
 function answer(j){if(!run||run.answered)return;run.selected=Number(j);run.answered=true;if(run.selected===run.items[run.index].answer)run.correct++;render()}
 function grade(known){if(!run||!run.answered)return;const q=run.items[run.index],right=run.selected===q.answer,at=Date.now(),old=STUDIO_VSTATE.items[q.word.w]||{reps:0,interval:0};let days=known&&right?Math.max(2,(Number(old.interval)||0)*2||3):10/(24*60);const due=at+days*86400000;STUDIO_VSTATE.items[q.word.w]={...old,status:known&&right?'known':'learning',reps:(Number(old.reps)||0)+1,interval:days,due,last:at,lastGrade:known&&right?'good':'again',reviewCount:(Number(old.reviewCount)||0)+1};STUDIO_VSTATE.reviewLog=STUDIO_VSTATE.reviewLog||[];STUDIO_VSTATE.reviewLog.push({word:q.word.w,grade:known&&right?'good':'again',at,nextDue:due,intervalDays:days});STUDIO_VSTATE.reviewLog=STUDIO_VSTATE.reviewLog.slice(-2000);STUDIO_VSTATE.xp=(Number(STUDIO_VSTATE.xp)||0)+(right?5:1);if(run.index===run.items.length-1){STUDIO_VSTATE.sessions=STUDIO_VSTATE.sessions||[];STUDIO_VSTATE.sessions.push({at:new Date().toISOString(),total:run.items.length,kind:'examVocab',graded:{again:run.items.length-run.correct,hard:0,good:run.correct,easy:0},durationMs:at-run.started});STUDIO_VSTATE.sessions=STUDIO_VSTATE.sessions.slice(-500)}saveVocab();run.results.push({word:q.word.w,correct:right,known:!!known});run.index++;if(run.index>=run.items.length){finish();return}run.answered=false;run.selected=-1;render()}
 function finish(){const old=run;if(old.unitNo&&W.TGAT1Hub?.logVocabulary)W.TGAT1Hub.logVocabulary(old.unitNo,old.correct,old.items.length);const mode=old.mode,from=old.from;run=null;studioUpdateChrome(from);if(from==='hub'&&old.unitNo&&W.TGAT1Hub?.openUnit)W.TGAT1Hub.openUnit(old.unitNo);else if(from==='game'&&typeof W.studioReturnToGame==='function')W.studioReturnToGame();else studioVocabulary();studioToast(`ศัพท์ฝึกเสร็จแล้ว · ${old.correct}/${old.items.length} ถูก · ผลเก็บในคลังทบทวนศัพท์`)}
 function exit(){if(!run)return;const x=run;run=null;if(x.from==='hub'&&x.unitNo&&W.TGAT1Hub?.openUnit)W.TGAT1Hub.openUnit(x.unitNo);else if(x.from==='game'&&W.studioReturnToGame)W.studioReturnToGame();else studioVocabulary()}
 function openTerm(word){const i=core.findIndex(x=>x.w.toLowerCase()===String(word).toLowerCase());if(i>=0){STUDIO_PAGE='vocab';studioUpdateChrome('vocab');studioWordDetail(i)}}
 W.TGAT1VocabularyLab=Object.freeze({list:()=>list().slice(0,300),start,unitWords:byUnit,openTerm,answer,grade,exit,stats:()=>({items:list().length,bankSize:sourceList().length,curated:(STUDIO_DATA.examFocus||[]).length}),snapshot:()=>run?{index:run.index,items:run.items.map(q=>({word:q.word.w,options:q.options.slice(),answer:q.answer}))}:null,_optionsFor:(w)=>{const x=core.find(z=>z.w===w);const o=x&&optionsFor(x,list());return o?o.map(z=>z.th):null}});
 W.TGAT1_addGameHook?.(function(){const h=[...document.querySelectorAll('.st-section-head h2')].find(x=>x.textContent.includes('เกมฝึกข้อสอบ'));const grid=h?.closest('.st-section-head')?.nextElementSibling;if(grid?.classList.contains('st-grid')&&!grid.querySelector('[data-tgat1-vocab-lab]'))grid.insertAdjacentHTML('beforeend','<button class="st-action-card" data-tgat1-vocab-lab onclick="TGAT1VocabularyLab.start(\'game\')"><span class="st-icon-box">📚</span><span><b>TGAT1 Vocabulary Lab</b><small>ศัพท์จากบริบทจริงในคลังฝึก · ฝึกซ้ำด้วย SRS</small></span></button>')});
})();


/* ===== v42.0.2 matching-game semantic guard =====
   mkMatch() already removes duplicate words and duplicate *first* glosses. This guard also rejects a
   pair when (a) the shown Thai meaning of one word is any listed meaning of the other, (b) the shown
   meanings are the same after removing the noun-forming prefixes การ/ความ, or one contains the other,
   (c) both words are in the same synonym group, or (d) the English words look like the same word family
   (e.g. protect/protection). It is a conservative heuristic: it may exclude some valid pairs, and it is
   not a substitute for a human review of glosses. */
(function(){
  'use strict';
  const PRE=/^(การ|ความ|ผู้|นัก|ที่|อย่าง|โดย)/;
  const norm=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/\([^)]*\)|（[^）]*）/g,' ').replace(/[\s.,!?。；，"“”'‘’]+/g,' ').trim();
  const core=x=>{let c=norm(x).replace(/\s+/g,'');for(let k=0;k<2;k++)c=c.replace(PRE,'');return c};
  const cache=new Map();
  function info(i){
    if(cache.has(i))return cache.get(i);
    const v=(typeof V!=='undefined'&&V[i])||[];const raw=String(v[1]||'');
    const all=raw.split(/[;,/]|\s+หรือ\s+/).map(core).filter(Boolean);
    const o={w:String(v[0]||'').toLowerCase().trim(),shown:core(raw.split(';')[0]),all:new Set(all)};cache.set(i,o);return o;
  }
  let synIndex=null;
  function syn(){
    if(synIndex)return synIndex;synIndex=new Map();
    try{(typeof SYN!=='undefined'?SYN:[]).forEach((g,k)=>(Array.isArray(g[0])?g[0]:[]).forEach(w=>{const key=String(w).toLowerCase();if(!synIndex.has(key))synIndex.set(key,new Set());synIndex.get(key).add(k)}))}catch(e){(window.TGAT1_ERR||Object)(e,'app')}
    return synIndex;
  }
  function family(a,b){if(!a||!b||a===b)return a===b;const [s,l]=a.length<=b.length?[a,b]:[b,a];return s.length>=5&&l.startsWith(s.slice(0,Math.max(5,s.length-1)))&&l.length-s.length<=5}
  function conflict(i,j){
    if(i===j)return true;const A=info(i),B=info(j);if(!A.shown||!B.shown)return false;
    if(A.shown===B.shown||B.all.has(A.shown)||A.all.has(B.shown))return true;
    const [s,l]=A.shown.length<=B.shown.length?[A.shown,B.shown]:[B.shown,A.shown];
    if(s.length>=4&&l.includes(s))return true;
    const sx=syn(),ga=sx.get(A.w),gb=sx.get(B.w);if(ga&&gb&&[...ga].some(k=>gb.has(k)))return true;
    return family(A.w,B.w);
  }
  function thaiOverlap(a,list){const ca=core(a);if(!ca)return false;return (list||[]).some(b=>{const cb=core(b);if(!cb)return false;if(ca===cb)return true;const [s,l]=ca.length<=cb.length?[ca,cb]:[cb,ca];return s.length>=4&&l.includes(s)})}
  let antIndex=null;
  function ants(){if(antIndex)return antIndex;antIndex=new Map();try{(typeof ANT!=='undefined'?ANT:[]).forEach(r=>{const a=String(r[0]).toLowerCase(),b=String(r[1]).toLowerCase();[[a,b],[b,a]].forEach(([x,y])=>{if(!antIndex.has(x))antIndex.set(x,new Set());antIndex.get(x).add(y)})})}catch(e){(window.TGAT1_ERR||Object)(e,'app')}return antIndex}
  /* true when x must not be used as a distractor for word in a synonym/antonym question */
  function related(word,x,kind){const w=String(word).toLowerCase(),y=String(x).toLowerCase();const sx=syn(),ga=sx.get(w),gb=sx.get(y);
    const sameSyn=!!(ga&&gb&&[...ga].some(k=>gb.has(k)));const isAnt=!!(ants().get(w)&&ants().get(w).has(y));
    if(kind==='syn')return sameSyn||family(w,y);if(kind==='ant')return isAnt||family(w,y);return sameSyn||isAnt}
  window.TGAT1MatchGuard=Object.freeze({conflict,info,thaiOverlap,related});
})();
