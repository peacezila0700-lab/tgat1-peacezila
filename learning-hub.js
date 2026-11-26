/* TGAT1 English Studio v48.2.0 — Learning Hub 3: one button, one chapter a day.
   The learner presses “เรียนต่อ” and studies the whole app as a book. Core phase (41 days): 36 chapters (~2 hours
   each), two full timed mocks and three buffer days. Final phase, generated from the exam date (default
   30 Jan 2027 13:00, paper-based): the remaining mocks, weak-spot review days, light review and a rest day.
   Every chapter: warm-up (due words) → 3 ungraded pre-questions → Part 1 language/grammar (rules, worked examples,
   practice with hints) → Part 2 vocabulary (20 spaced-repetition words + 10 exposure words, 11 mini-game types,
   phrases) → break → Part 3 speaking (Question–Response, a dialogue set) → Part 4 reading (a passage set) →
   sentence games → recap → end-of-chapter test (18–22 items) with error analysis by skill.
   Test decision (sequential): ≥85 % pass · 65–84 % → 8 more items on the missed types, then ≥80 % pass,
   65–79 % pass with a quiet review weave (similar new items in chapter n+2 and n+6/7, capped), <65 % short
   targeted re-study and a retake with different questions (after two attempts the learner may carry on).
   Content plan: learning-path-data.js (tools/build_path_data.py) + the concept library in
   learning-hub-curriculum.js. Optional AI explanations (user's own API key, off by default).
   State: one localStorage key with a versioned schema (3); older 70-unit progress is migrated. */
(function(){
'use strict';
if(window.TGAT1Hub)return;
const W=window,D=document;
const PD=()=>W.TGAT1_PATH_DATA||null;
const KEY='tgat1_learning_hub_v1',SCHEMA=3,DAY=86400000;
// A6 — one source of truth for the plan numbers. The profile (โปรไฟล์/ตั้งค่า) owns the daily goal (minutes) and the exam
// date; the Hub only falls back to its own default when the profile has nothing usable. This is why a profile that says
// "30 นาที/วัน" can no longer disagree with a Hub plan that used to say 120.
function profile(){try{return (typeof STUDIO_PROFILE!=='undefined'&&STUDIO_PROFILE)||{}}catch(_){return {}}}
function goalMinutes(s){const g=Number(profile().dailyGoal);if(Number.isFinite(g)&&g>=15)return clamp(g,15,300);
  const m=Number(s&&s.plan&&s.plan.minutes);return clamp(Number.isFinite(m)&&m>=15?m:120,15,300)}
// A3 — storage budget. Measured in this build: the Hub state reached ~312 K characters and the error book ~1.31 M after a
// full path, while iOS Safari allows ~5 MB per origin (≈2.5 M UTF-16 characters). We keep the single Hub key under
// STATE_BUDGET and cap the error book, instead of discovering a full quota in January.
const ERRORS_MAX=300,ERRORS_HARD=120,SEEN_MAX=900,WHY_MAX=200,STATE_BUDGET=1200000;
const UNITS=(PD()&&PD().chapters.length)||36;
// The core phase (36 chapters, 2 checkpoint mocks, 3 buffer days) comes from the data file; the final phase is
// generated from the exam date (see genTail) so it always fits the days that are really left.
const CORE=(PD()&&PD().days)||[];
const TAIL=(PD()&&PD().tail)||{sets:[17,18,19,20],light:3,rest:1};
let DAYS=CORE.slice();
// End-of-chapter test: >= 85 % passes at once, < 65 % does not pass; in between (the uncertain band of a ~20-item
// test, SE about ±9 points) 8 more items on the missed skills are added and the decision uses all items:
// >= 80 % pass, 65-79 % pass with a quiet review weave, < 65 % re-study and retake (sequential mastery testing).
const PASS_PCT=80,COND_PCT=65,SURE_PCT=85,EXT_N=8,DK=-1,TEST_MIN=18,WEAVE_MAX_ITEMS=4,WEAVE_MAX_WORDS=4,WARM_MAX=25,SRS_DEFAULT=20;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// W.__LH_SHIFT (ms) lets automated tests move the clock forward day by day; it is never set by the app.
const now=()=>Date.now()+(Number(W.__LH_SHIFT)||0);
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>ymd(new Date(now()));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const isObj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const hash=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function toast(m){try{(W.studioToast||W.VLT_toast||function(){})(m)}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}}
function page(){try{return typeof STUDIO_PAGE!=='undefined'?STUDIO_PAGE:''}catch(_){return ''}}
function bankReady(){try{return typeof VLT_BANK!=='undefined'&&VLT_BANK.length>0}catch(_){return false}}
function ensureBank(){return typeof W.VLT_ensureBank==='function'?W.VLT_ensureBank():Promise.resolve([])}
function dateOf(s){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||''));return m?new Date(+m[1],+m[2]-1,+m[3]):null}
function diffDays(a,b){const x=dateOf(a),y=dateOf(b);if(!x||!y)return 0;return Math.round((y-x)/DAY)}
function addDays(s,n){const d=dateOf(s)||new Date();d.setDate(d.getDate()+n);return ymd(d)}
function thDate(s){const d=dateOf(s);if(!d)return '-';const m=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];return d.getDate()+' '+m[d.getMonth()]+' '+(d.getFullYear()+543)}

/* ------------------------------------------------------------------ cross-app daily ledger */
// One place that counts what was studied today, whichever page it was done on (Learning Hub, exam centre,
// vocabulary centre, games). The Learning Hub checklist reads it.
const LKEY='tgat1_ledger_v1';
const LEDGER={
  read(){try{const v=JSON.parse(localStorage.getItem(LKEY)||'{}');return isObj(v)?v:{}}catch(_){return {}}},
  add(mod,n){try{const L=LEDGER.read(),d=today();L[d]=isObj(L[d])?L[d]:{};L[d][mod]=(Number(L[d][mod])||0)+(Number(n)||1);
    const ks=Object.keys(L).sort();while(ks.length>120)delete L[ks.shift()];localStorage.setItem(LKEY,JSON.stringify(L))}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}},
  day(d){const L=LEDGER.read();return isObj(L[d||today()])?L[d||today()]:{}},
  streak(){const L=LEDGER.read();let n=0;let d=today();if(!L[d])d=addDays(d,-1);while(L[d]&&Object.values(L[d]).some(v=>v>0)){n++;d=addDays(d,-1)}return n},
  // cumulative study days (shown instead of a streak that can be "lost": no loss aversion, no guilt)
  studied(){const L=LEDGER.read();return Object.values(L).filter(v=>isObj(v)&&Object.values(v).some(x=>x>0)).length}
};
W.TGAT1_LEDGER=LEDGER;

/* ------------------------------------------------------------------ state + migration */
let HS=null,READONLY=false,NOTICE='';
function fresh(){return {schema:SCHEMA,createdAt:now(),updatedAt:now(),pos:0,unit:1,units:{},mocks:{},reviews:{},active:null,pending:null,returnTo:false,
  concepts:{},errors:{},seen:{},words:{},weave:{},history:[],assessments:[],stats:{answered:0,correct:0},flow:null,plan:{start:'',exam:'',minutes:120,card:false},lastResult:null,tailDone:[]}}
const MIGRATIONS={
  0:function(s){const o={...s};o.schema=1;return o},
  1:function(s){const o={...s};o.schema=2;return o},
  // v46: the 70-unit path became a 36-chapter daily path. Chapter progress starts again from chapter 1; the
  // learner's concept history, error memory and statistics are kept.
  2:function(s){const o=fresh();['concepts','errors','seen'].forEach(f=>{if(isObj(s[f]))o[f]=s[f]});if(Array.isArray(s.history))o.history=s.history.filter(isObj).slice(-200);
    if(isObj(s.stats))o.stats={answered:Number(s.stats.answered)||0,correct:Number(s.stats.correct)||0};o.migrated=70;o.schema=3;return o}
};
function normUnit(v){return {st:v.st==='done'?'done':'active',done:isObj(v.done)?v.done:{},res:isObj(v.res)?v.res:{},
  att:Array.isArray(v.att)?v.att.filter(isObj).slice(-20).map((a,i,arr)=>i<arr.length-2&&a.wrong?{...a,wrong:[]}:a):[],remed:isObj(v.remed)?v.remed:null,
  started:Number(v.started)||0,completed:Number(v.completed)||0,used:Array.isArray(v.used)?v.used.map(String).slice(-400):[]}}
function dayKey(e){return e.k==='chapter'?'c'+e.n:e.k==='mock'?'m'+e.set:e.k==='buffer'?'b'+e.n:e.k==='review'?'r'+(e.d||e.n):e.k==='light'?'l'+(e.d||''):e.k==='rest'?'z'+(e.d||''):'x'}
function dayDone(o,e){if(!e)return true;if(e.k==='chapter')return !!(o.units[e.n]&&o.units[e.n].st==='done');if(e.k==='mock')return !!o.mocks[e.set];return !!o.reviews[dayKey(e)]}
function mockNo(set){return Number(set)-14}
function mockLabel(set){return 'สอบจำลองเต็มชุด ครั้งที่ '+mockNo(set)+' (จับเวลา 60 นาที)'}
function examOf(o){let e=o&&o.plan&&o.plan.exam;try{if(!e&&typeof STUDIO_PROFILE!=='undefined'&&STUDIO_PROFILE&&STUDIO_PROFILE.examDate)e=STUDIO_PROFILE.examDate}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}return dateOf(e)?e:((PD()&&PD().examDefault)||'2027-01-30')}
function doneOn(o,d){return (o.history||[]).some(h=>(h.k==='unit'||h.k==='day'||h.k==='mock')&&ymd(new Date(h.t))===d)}
// how many core entries the learner should have finished before today (one per day from the start date)
function behindBy(o){const st0=o.plan&&o.plan.start;if(!st0)return 0;const planned=Math.min(CORE.length,Math.max(0,diffDays(st0,today())));const done=CORE.filter(e=>dayDone(o,e)).length;return Math.max(0,planned-done)}
// final phase, generated from the first free day after the core phase up to the day before the exam:
// remaining mocks spread out (the last one ~5 days before the exam, never fewer than 3 while days allow),
// weak-spot review days between them, up to 3 light-review days, and a rest/preparation day before the exam.
function genTail(o){
  const t=today(),exam=examOf(o),doneT=doneOn(o,t);const coreLeft=CORE.filter(e=>!dayDone(o,e)).length;
  const base=coreLeft?addDays(t,coreLeft-(doneT?0:1)+1):(doneT?addDays(t,1):t);
  const D=Math.max(0,diffDays(base,exam));const left=(TAIL.sets||[]).filter(set=>!o.mocks[set]);
  // the rest day and the light days are anchored to the exam date (the 3 days before the day before the exam);
  // they give way to mocks only when too few days are left for the remaining mocks
  const rest=D>=1?1:0;let light=Math.min(TAIL.light||3,Math.max(0,D-rest));const need=Math.min(3,left.length);
  if(D-rest-light<need)light=Math.max(0,D-rest-need);const M=D-rest-light;
  const mocks=Math.min(left.length,M,Math.max(need,Math.floor((M+1)/2)));const slot=new Array(Math.max(0,M)).fill(null);
  if(mocks){const gap=clamp(Math.round(M/mocks),1,6);for(let j=mocks-1;j>=0;j--){let q=clamp(M-1-(mocks-1-j)*gap,0,M-1);while(q>0&&slot[q])q--;if(!slot[q])slot[q]=left[j]}}
  const out=[];for(let i=0;i<D;i++){const d=addDays(base,i);
    if(i<M)out.push(slot[i]?{k:'mock',set:slot[i],label:mockLabel(slot[i]),d,final:true}:{k:'review',d,label:'วันทบทวนจุดอ่อน',final:true});
    else if(i<M+light)out.push({k:'light',d,label:'ทบทวนเบา ๆ ก่อนสอบ',final:true});
    else out.push({k:'rest',d,label:'วันก่อนสอบ · พักและเตรียมตัว',final:true})}
  return out;
}
function buildDays(o){const done=(o.tailDone||[]).filter(isObj);DAYS=CORE.concat(done.map(x=>({...x,final:true,past:true})),genTail(o));return DAYS}
// a buffer day is used automatically when the learner is behind the one-chapter-a-day plan
function useBuffers(o){let p=0;while(p<CORE.length){const e=CORE[p];if(!dayDone(o,e)){if(e.k==='buffer'&&behindBy(o)>=1){o.reviews[dayKey(e)]={at:now(),k:0,t:0,used:true};p++;continue}break}p++}}
function scanPos(o){useBuffers(o);buildDays(o);let p=0;while(p<DAYS.length&&(DAYS[p].past||dayDone(o,DAYS[p])))p++;o.pos=p;const nc=DAYS.slice(p).find(e=>e.k==='chapter');o.unit=nc?nc.n:UNITS}
function normalize(s){
  const o=fresh();
  o.createdAt=Number(s.createdAt)||o.createdAt;o.updatedAt=Number(s.updatedAt)||0;o.migrated=s.migrated||0;
  if(isObj(s.units))for(const [k,v] of Object.entries(s.units)){const n=Number(k);if(Number.isInteger(n)&&n>=1&&n<=UNITS&&isObj(v))o.units[n]=normUnit(v)}
  if(isObj(s.mocks))for(const [k,v] of Object.entries(s.mocks))if(isObj(v))o.mocks[k]=v;
  if(isObj(s.reviews))for(const [k,v] of Object.entries(s.reviews))if(v)o.reviews[k]=v;
  if(isObj(s.plan))o.plan={start:typeof s.plan.start==='string'?s.plan.start:'',exam:typeof s.plan.exam==='string'?s.plan.exam:'',minutes:clamp(goalMinutes(s),30,300),card:!!s.plan.card,backupAt:Number(s.plan.backupAt)||0};
  if(Array.isArray(s.tailDone))o.tailDone=s.tailDone.filter(isObj).slice(-60);
  if(Array.isArray(s.history))o.history=s.history.filter(isObj).slice(-400);
  // sequential invariant: the current day is the first path entry that is not done
  scanPos(o);
  if(isObj(s.active)&&Array.isArray(s.active.items)&&s.active.items.length&&Number.isInteger(s.active.i)){
    const a=s.active;if(a.unit<=o.unit||a.mode==='extra')o.active={...a,ans:Array.isArray(a.ans)?a.ans:[],i:clamp(a.i,0,a.items.length-1)}}
  if(isObj(s.pending))o.pending=s.pending;
  if(isObj(s.flow)&&Array.isArray(s.flow.cards)&&s.flow.cards.length&&Number.isInteger(s.flow.i)&&(s.flow.day||(Number(s.flow.unit)>=1&&Number(s.flow.unit)<=o.unit)))
    o.flow={...s.flow,i:clamp(s.flow.i,0,s.flow.cards.length-1),ans:isObj(s.flow.ans)?s.flow.ans:{}};
  o.returnTo=!!s.returnTo;
  ['concepts','errors','seen','words','weave'].forEach(f=>{if(isObj(s[f]))o[f]=s[f]});
  if(Array.isArray(s.assessments))o.assessments=s.assessments.filter(isObj).slice(-300);
  if(isObj(s.stats))o.stats={answered:Number(s.stats.answered)||0,correct:Number(s.stats.correct)||0,...(isObj(s.stats.pred)?{pred:s.stats.pred}:{}),...(isObj(s.stats.qtype)?{qtype:s.stats.qtype}:{})};
  if(isObj(s.lastResult))o.lastResult=s.lastResult;
  const errs=Object.entries(o.errors);if(errs.length>1500){errs.sort((a,b)=>(b[1].last||0)-(a[1].last||0));o.errors=Object.fromEntries(errs.slice(0,1500))}
  const seen=Object.entries(o.seen);if(seen.length>4000){seen.sort((a,b)=>(b[1].t||0)-(a[1].t||0));o.seen=Object.fromEntries(seen.slice(0,4000))}
  const wv=Object.entries(o.weave);if(wv.length>12){wv.sort((a,b)=>(b[1].at||0)-(a[1].at||0));o.weave=Object.fromEntries(wv.slice(0,12))}
  return o;
}
function backupRaw(tag,str){try{const k=KEY+'__backup_'+tag;if(localStorage.getItem(k)==null)localStorage.setItem(k,str)}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}}
function load(){
  let str=null;READONLY=false;NOTICE='';
  try{str=localStorage.getItem(KEY)}catch(e){READONLY=true;NOTICE='เบราว์เซอร์ไม่อนุญาตให้บันทึกข้อมูล ความคืบหน้าใน Learning Hub จะไม่ถูกเก็บ';return fresh()}
  if(str==null)return fresh();
  let raw;try{raw=JSON.parse(str)}catch(e){raw=undefined}
  if(!isObj(raw)){backupRaw('unreadable',str);NOTICE='ข้อมูล Learning Hub เดิมอ่านไม่ได้ ระบบเก็บสำเนาไว้ในเครื่องและเริ่มใหม่เฉพาะ Learning Hub (ข้อมูลส่วนอื่นไม่ถูกแตะต้อง)';return fresh()}
  const v=Number.isInteger(raw.schema)?raw.schema:0;
  if(v>SCHEMA){READONLY=true;NOTICE='ข้อมูล Learning Hub มาจากแอปเวอร์ชันที่ใหม่กว่า จึงเปิดแบบอ่านอย่างเดียวเพื่อไม่ให้ข้อมูลเสียหาย';return normalize(raw)}
  let s=raw;
  if(v<SCHEMA){backupRaw('schema'+v,str);for(let k=v;k<SCHEMA;k++){if(typeof MIGRATIONS[k]!=='function'){READONLY=true;NOTICE='ไม่พบขั้นตอนย้ายข้อมูล Learning Hub';return fresh()}s=MIGRATIONS[k](s)}}
  const out=normalize(s);
  if(out.migrated===70&&v<SCHEMA)NOTICE='Learning Hub เปลี่ยนเป็นเส้นทางรายวัน 36 บท (เรียนวันละบท) จึงเริ่มบทที่ 1 ใหม่ · ประวัติข้อผิดและสถิติเดิมยังอยู่ครบ';
  if(v<SCHEMA){HS=out;save()}
  return out;
}
let SAVE_T=0;
// A3 — the error book is the biggest object in the Hub state: every worked item keeps its explanation (now ≤ WHY_MAX
// characters) plus the learner's own answer. Cap it by recency so the state can never grow without a ceiling.
function pruneErrors(s){try{const b=s.errors||{};const ids=Object.keys(b);if(ids.length<=ERRORS_MAX)return 0;
  ids.sort((x,y)=>((b[y]||{}).last||0)-((b[x]||{}).last||0));
  const drop=ids.slice(ERRORS_MAX);for(const id of drop)delete b[id];return drop.length}catch(_){return 0}}
function compactState(s,hard){pruneErrors(s);
  try{const seen=s.seen||{},ids=Object.keys(seen);if(ids.length>SEEN_MAX){ids.sort((x,y)=>((seen[y]||{}).t||0)-((seen[x]||{}).t||0));for(const id of ids.slice(SEEN_MAX))delete seen[id]}}catch(_){}
  if(!hard)return s;
  try{if(Array.isArray(s.history)&&s.history.length>120)s.history=s.history.slice(-120)}catch(_){}
  try{const w=s.weave||{},ids=Object.keys(w);if(ids.length>8){ids.sort((x,y)=>((w[x]||{}).at||0)-((w[y]||{}).at||0));for(const c of ids.slice(0,ids.length-8))delete w[c]}}catch(_){}
  try{const b=s.errors||{};let n=Object.keys(b).length;while(n>ERRORS_HARD){const ids=Object.keys(b).sort((x,y)=>((b[x]||{}).last||0)-((b[y]||{}).last||0));delete b[ids[0]];n--}}catch(_){}
  return s}
function saveNow(){if(SAVE_T){clearTimeout(SAVE_T);SAVE_T=0}if(READONLY||!HS)return false;HS.updatedAt=now();
  let json='';try{json=JSON.stringify(HS)}catch(_){return false}
  if(json.length>STATE_BUDGET){compactState(HS,true);try{json=JSON.stringify(HS)}catch(_){return false}}
  try{localStorage.setItem(KEY,json);return true}catch(e){
    compactState(HS,true);
    try{localStorage.setItem(KEY,JSON.stringify(HS));toast('พื้นที่จัดเก็บใกล้เต็ม ระบบย่อประวัติเก่าให้แล้ว');return true}catch(_){
      toast('บันทึก Learning Hub ไม่สำเร็จ: พื้นที่จัดเก็บเต็ม · ไปที่ ตั้งค่า → ส่งออกข้อมูลสำรอง');return false}}}
function save(){if(READONLY||!HS)return false;if(!SAVE_T)SAVE_T=setTimeout(saveNow,400);return true}
try{W.addEventListener('pagehide',()=>{saveNow();flushVocab(true)});D.addEventListener('visibilitychange',()=>{if(D.visibilityState==='hidden'){saveNow();flushVocab(true)}})}catch(_){}
function st(){if(!HS)HS=load();return HS}
function unitState(n){const s=st();if(!s.units[n])s.units[n]=normUnit({});return s.units[n]}
function log(e){const s=st();s.history.push({t:now(),...e});if(s.history.length>400)s.history.splice(0,s.history.length-400)}
function recompute(){scanPos(st())}
// record a finished final-phase day so the generated schedule moves on (and the past day stays in the map)
function tailMark(e,extra){const s=st();if(!e||!e.final)return;s.tailDone=(s.tailDone||[]).filter(x=>dayKey(x)!==dayKey(e)).concat({k:e.k,set:e.set,d:today(),label:e.label,...(extra||{})}).slice(-60)}
function curDay(){return DAYS[st().pos]||null}

/* ------------------------------------------------------------------ content: chapters, concept library, items */
let IDX=null;
function cur(){return W.TGAT1_HUB_CURRICULUM||null}
function idx(){
  const c=cur();if(!c)return null;
  if(IDX&&IDX.c===c)return IDX;
  const items=new Map(),byC=new Map();
  (c.items||[]).forEach(r=>{const it={id:r[0],c:r[1],d:r[2]||2,stem:r[3],ctx:r[4]||'',opts:r[5],ans:r[6],hint:r[7]||'',why:r[8]||'',wrong:r[9]||[],src:'hub'};
    items.set(it.id,it);if(!byC.has(it.c))byC.set(it.c,[]);byC.get(it.c).push(it.id)});
  const ex=(PD()&&PD().extra)||{};Object.values(ex).forEach(x=>{if(!byC.has(x.c))byC.set(x.c,[]);byC.get(x.c).push(x.id)});
  const alloc=new Map();(PD()?PD().chapters:[]).forEach(ch=>{['g','s','r'].forEach(k=>(ch.practice[k]||[]).forEach(r=>alloc.set(r.id,ch.n)));(ch.test||[]).forEach(r=>alloc.set(r.id,ch.n))});
  IDX={c,units:new Map(c.units.map(u=>[u.n,u])),items,byC,concepts:c.concepts||{},bankByC:null,alloc};
  return IDX;
}
function libUnit(n){const x=idx();return x?x.units.get(n):null}
function unitDef(n){const p=PD();return p?p.chapters[n-1]||null:null}
function conceptDef(c){const x=idx();if(x&&x.concepts[c])return x.concepts[c];const f=PD()&&PD().fam&&PD().fam[c];if(f)return f;if(c==='vocab')return {t:'คำศัพท์ประจำบท',skill:'vocab'};return {t:c||'ผสม',skill:'mixed'}}
const FAM_FALLBACK_SKILL=c=>/^qr\.|^conv\./.test(c)?'conversation':/^rc\./.test(c)?'reading':/^tc\./.test(c)?'cloze':'mixed';
function family(q){
  if(q&&q.f)return q.f;
  const tg=W.TGAT1_HUB_DATA&&W.TGAT1_HUB_DATA.tags&&W.TGAT1_HUB_DATA.tags[q.id];if(tg)return tg;
  const c=q.category;if(c==='short')return'conv.short';if(c==='long')return'conv.long';if(c==='qr')return'qr.info';if(c==='rc')return'rc.detail';if(c==='tc')return'tc.vocab';return'other'}
function sxAll(){try{return W.TGAT1_STRUCTURE_EXTRA||null}catch(_){return null}}
function bankPool(c){
  const x=idx();if(!x||!bankReady())return [];
  if(!x.bankByC)x.bankByC=new Map();
  if(x.bankByC.has(c))return x.bankByC.get(c);
  const def=x.concepts[c]||{};const fams=Array.isArray(def.bank)?def.bank:(/^(qr|conv|rc|tc)\./.test(c)?[c]:[]);
  const re=def.bre?new RegExp(def.bre,'i'):null;const kre=def.kre?new RegExp(def.kre,'i'):null;
  const okBank=q=>fams.includes(family(q))&&(!re||re.test(String(q.explanation||'')+' '+String(q.prompt||'')))&&(!kre||kre.test(String((q.options||[])[q.answer]||'').trim()));
  const bIds=fams.length?VLT_BANK.filter(okBank).map(q=>q.id):[];
  /* C5: คลังเสริม structure-extra อยู่นอก VLT_BANK (ไม่แตะชุดสอบ 60 ข้อ) แต่ใช้ตัวกรองเดียวกับคลังกลาง
     สอดแทรกเข้าคิวทุก ๆ สองข้อ เพื่อให้ผู้เรียนเห็นทั้งข้อจากชุดสอบและข้อเสริมตั้งแต่รอบแรก */
  const S=sxAll();const sIds=[];
  if(S&&fams.length)fams.forEach(f=>(S.byFamily[f]||[]).forEach(id=>{
    const it=S.get(id);if(!it||!it.options)return;
    if(re&&!re.test(String(it.explanation||'')+' '+String(it.prompt||'')))return;
    if(kre&&!kre.test(String(it.options[it.answer]||'').trim()))return;
    sIds.push(id);
  }));
  const ids=[];let si=0;
  for(let i=0;i<bIds.length;i++){ids.push(bIds[i]);if((i%2===1)&&si<sIds.length)ids.push(sIds[si++])}
  while(si<sIds.length)ids.push(sIds[si++]);
  x.bankByC.set(c,ids);return ids;
}
function sxItem(id){
  const S=sxAll();const it=S?S.get(id):null;if(!it)return null;
  return {id:it.i,c:it.f,d:Number(it.d)||2,stem:it.prompt,ctx:it.ctx||'',opts:it.options,ans:it.answer,hint:it.hint||'',why:it.explanation||'',wrong:null,src:'sx',fam:it.f};
}
function bankItem(id){
  const q=typeof W.VLT_get==='function'?W.VLT_get(id):null;if(!q)return null;
  let why=q.explanation||'';try{if(typeof W.VLT_learningExplanation==='function')why=W.VLT_learningExplanation(q)||why}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}
  const f=family(q);return {id:q.id,c:f,d:Number(q.difficulty)||2,stem:q.prompt,ctx:q.context||'',opts:q.options,ans:q.answer,hint:q.hint||'',why,wrong:null,src:'bank',fam:f,q};
}
function extraItem(id){const x=PD()&&PD().extra&&PD().extra[id];if(!x)return null;return {id:x.id,c:x.c,d:2,stem:x.stem,ctx:x.ctx||'',opts:x.opts,ans:x.ans,hint:x.hint||'',why:x.why||'',wrong:[],src:'x',origin:x.origin||''}}
function sightSentence(w){try{const C=W.TGAT1_SIGHT_CONTEXT;return C&&C.sentence?String(C.sentence(w)||''):''}catch(_){return ''}}
function vocabItem(ref){const w=wordObj(ref.w);if(!w||!Array.isArray(ref.vo))return null;
  const stem=ref.vt==='gap'?gapSentenceSight(w):`คำว่า “${w.w}” หมายถึงข้อใด`;
  /* C8b: ถ้ามีประโยคบริบทที่เขียนเฉพาะคำนี้ ให้ใช้ประโยคนั้นก่อน (ทุกคำผ่านตามีอย่างน้อยหนึ่งประโยค) */
  const ctxEx=sightSentence(w.w)||w.ex||'';
  const thNote=ctxEx&&ctxEx!==w.ex?(w.exTh?' ('+w.exTh+')':''):(w.exTh?' ('+w.exTh+')':'');
  return {id:ref.id,c:'vocab',d:2,stem,ctx:'',opts:ref.vo,ans:ref.va,hint:'',why:`${w.w} = ${w.th}${ctxEx?' · ตัวอย่าง: '+ctxEx+thNote:''}`,wrong:[],src:'v',w:w.w}}
function getItem(ref){if(!ref)return null;if(ref.src==='sx')return sxItem(ref.id)||bankItem(ref.id);if(ref.src==='bank')return bankItem(ref.id);if(ref.src==='x')return extraItem(ref.id);if(ref.src==='v')return vocabItem(ref);const x=idx();return x?x.items.get(ref.id)||null:null}
function refCat(ref,it){return ref.c||(it&&it.c)||''}
function conceptPool(c,src){
  const x=idx();if(!x)return [];
  const out=[];if(src!=='bank')(x.byC.get(c)||[]).forEach(id=>out.push({id,src:String(id).startsWith('gc')||String(id).startsWith('rl-')?'x':'hub',c}));
  if(src!=='hub')bankPool(c).forEach(id=>out.push({id,src:String(id).slice(0,2)==='SX'?'sx':'bank',c}));
  return out;
}
function itemDifficulty(ref){const it=getItem(ref);return it?it.d:2}
// Fresh items for a category: never an item planned for the current or a later chapter, prefer unseen, then the
// least recently seen (at least `minAgeDays` ago).
function freshFor(c,n,k,opt={}){
  const s=st(),x=idx(),ex=opt.exclude||new Set(),t=now(),min=(opt.minAgeDays==null?3:opt.minAgeDays)*DAY;
  const pool=conceptPool(c).filter(r=>!ex.has(r.id)&&!(x.alloc.has(r.id)&&x.alloc.get(r.id)>=n));
  const unseen=pool.filter(r=>!s.seen[r.id]),old=pool.filter(r=>s.seen[r.id]&&t-s.seen[r.id].t>=min).sort((a,b)=>s.seen[a.id].t-s.seen[b.id].t);
  return shuffle(unseen).concat(old).slice(0,k);
}

/* ------------------------------------------------------------------ mastery, error memory, word memory */
const IV=[1,3,7,14,30];
function cRec(c){const s=st();if(!isObj(s.concepts[c]))s.concepts[c]={a:0,k:0,r:[],st:'new',p:0,due:0,iv:0,last:0,mis:0,low:0,days:[]};return s.concepts[c]}
function evalConcept(c){
  const r=cRec(c),last=r.r.slice(-5),avg=last.length?last.reduce((a,b)=>a+b,0)/last.length:0;
  if(r.a>=4&&last.length>=4&&avg>=0.8&&(r.days||[]).length>=2){if(r.st!=='mastered'){r.st='mastered';r.p=0}}
  else if(r.st==='mastered'&&r.r.slice(-2).every(v=>v===0))r.st='learning';
  else if(r.st==='new')r.st='learning';
  return r;
}
function evidence(c,ok,conf,kind){
  const s=st(),r=cRec(c),t=now(),d=today();
  if(kind==='hinted'){r.last=t;return r}
  r.a++;if(ok)r.k++;let v=ok?1:0;
  if(ok&&conf==='not'){v=0.5;r.low++;r.p=clamp(r.p+1,0,20)}
  if(!ok){r.p=clamp(r.p+(conf==='sure'?3:2),0,20);if(conf==='sure')r.mis++}
  r.r.push(v);if(r.r.length>12)r.r.splice(0,r.r.length-12);
  if(!(r.days||[]).includes(d))r.days=(r.days||[]).concat(d).slice(-6);
  r.last=t;s.stats.answered++;if(ok)s.stats.correct++;LEDGER.add('hub',1);
  return evalConcept(c);
}
function errorType(ok,conf,c){if(ok)return conf==='not'?'guess':'';const r=cRec(c);if(conf==='sure')return'misconception';if(conf==='not')return'knowledge-gap';if(r.st==='mastered')return'slip';return'error'}
function remember(ref,item,sel,ok,conf,mode){
  const s=st();s.seen[ref.id]={n:((s.seen[ref.id]||{}).n||0)+1,t:now()};
  const c=refCat(ref,item);const def=conceptDef(c);const type=errorType(ok,conf,c);const e=s.errors[ref.id];
  if((!ok||e||type==='guess')&&ref.src!=='v'){
    const row=e||{qid:ref.id,src:ref.src,c,skill:def.skill||FAM_FALLBACK_SKILL(c),att:0,wrong:0,recent:[],first:now()};
    row.att++;if(!ok)row.wrong++;row.recent=(row.recent||[]).concat(ok?1:0).slice(-6);
    row.type=type||row.type||'';row.sel=sel===DK?'(ไม่รู้)':(item.opts[sel]??'');row.ans=item.opts[item.ans]??'';
    row.why=String(item.why||'').slice(0,WHY_MAX);row.conf=conf||row.conf||null;row.last=now();row.mode=mode;row.unit=s.unit;
    if(type==='guess'&&!e)row.wrong=0;s.errors[ref.id]=row;pruneErrors(s);
  }
  try{if(ref.src==='bank'&&item.q&&typeof W.VLT_record==='function'&&mode!=='extra'){INHUB=true;try{W.VLT_record(item.q,ok)}finally{INHUB=false}}}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}
  try{if(!ok&&typeof W.STUDIO_RECORD_ERROR==='function'&&ref.src!=='v')W.STUDIO_RECORD_ERROR({id:(ref.src==='bank'?'':'hub-')+ref.id,module:'learning-hub',topic:def.t||c,prompt:item.stem,context:item.ctx||'',selected:sel===DK?'(ไม่รู้)':item.opts[sel],answer:item.opts[item.ans],correct:ok,explanation:String(item.why||'').slice(0,600),at:now()})}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}
}
let VDIRTY=false,INHUB=false;
function wordResult(w,ok){
  if(!w)return;const s=st(),t=now(),d=today();const r=isObj(s.words[w])?s.words[w]:(s.words[w]={n:0,k:0,iv:0,due:0,last:0,days:[]});
  r.n++;if(ok)r.k++;r.last=t;if(!r.days.includes(d))r.days=r.days.concat(d).slice(-6);
  if(ok){const i=IV.indexOf(r.iv);r.iv=IV[Math.min(IV.length-1,i+1)];r.due=t+r.iv*DAY}else{r.iv=0;r.due=t+DAY/2}
  // never schedule a word past the last days before the exam: every word comes back at least once before it
  {const ex=dateOf(examOf(s));if(ex){const cap=ex.getTime()-2*DAY;if(r.due>cap)r.due=Math.max(t+DAY/2,cap)}}
  LEDGER.add('words',1);
  try{if(typeof STUDIO_VSTATE!=='undefined'&&STUDIO_VSTATE&&isObj(STUDIO_VSTATE.items)){const old=STUDIO_VSTATE.items[w]||{reps:0};
    const known=r.k>=2&&r.days.length>=2&&ok;STUDIO_VSTATE.items[w]={...old,status:known?'known':(old.status==='known'&&ok?'known':'learning'),reps:(Number(old.reps)||0)+1,interval:r.iv,due:r.due,last:t,source:'learning-hub'};VDIRTY=true}}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}
}
let VTICK=0;
function flushVocab(force){if(!VDIRTY)return;if(!force&&++VTICK%8)return;VDIRTY=false;try{if(typeof W.studioSave==='function')W.studioSave('tgat1_studio_vocab_progress_v1',STUDIO_VSTATE)}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}}
function dueWords(k){const s=st(),t=now();return Object.entries(s.words).filter(([w,r])=>isObj(r)&&r.due&&r.due<=t&&wordObj(w)).sort((a,b)=>a[1].due-b[1].due).slice(0,k).map(([w])=>w)}

/* C8 — คำผ่านตา (index ≥ ch.srs) เดิมไม่เคยถูกถามเลย (ทุกเส้นทางให้คะแนนใช้ slice(0, ch.srs))
   ตอนนี้หมุนเข้าชุดที่ถูกถาม 2 คำต่อรอบ: ครบทุกคำภายใน ceil(expo/2) รอบ (10 คำ → 5 รอบ)
   cycle มาจากหลักฐานถาวร (จำนวนครั้งที่สอบ/เรียนบทนั้น) ไม่ใช่ตัวนับที่รีเซ็ตได้ */
function chapterCycle(n){const us=unitState(n)||{};return ((us.att||[]).length)+((us.done&&us.done.lesson)?1:0)+(us.remed?1:0)}
function wordRotation(ch,cycle){
  const Q=W.TGAT1_QUALITY;
  if(Q&&typeof Q.wordRotation==='function')return Q.wordRotation(ch,cycle,{srsDefault:SRS_DEFAULT});
  const all=(ch&&ch.words)||[],nS=(ch&&ch.srs)||SRS_DEFAULT,core=all.slice(0,nS),expo=all.slice(nS);
  const k=Math.min(2,expo.length)||0,start=expo.length?((Math.max(0,cycle||0)*k)%expo.length):0,cycled=[];
  for(let i=0;i<k;i++)cycled.push(expo[(start+i)%expo.length]);
  return {core,expo,cycled,quizzed:core.concat(cycled),cyclesToCover:expo.length?Math.ceil(expo.length/k):0};
}

/* ------------------------------------------------------------------ the quiet review weave */
// After a near-pass (and after misses in practice) the missed *types* are stored. Each type comes back as one or two
// fresh, similar items (never the same item) mixed into the normal parts with no label, on an expanding schedule:
// about 2 chapters later and again about 6-7 chapters later (spacing ≈ 10-30 % of the time left to the exam), and
// once more on a final-phase review day. Caps: ≤ 4 woven items per chapter, ≤ 1 type per part, a type never two
// chapters in a row. Two correct echoes in a row retire it; a wrong echo sends the type to the review days instead
// of adding more echoes, so it never snowballs and the learner never sees a "debt" counter.
function weaveAdd(cat,n,w){const s=st();if(!cat)return;const old=isObj(s.weave[cat])?s.weave[cat]:null;
  const e=old||(s.weave[cat]={due:[],ok:0,at:0,w:!!w,b:1,last:0});
  const d2=n+2,d6=n+6+(hash(cat+'|'+n)%2);e.due=[...new Set((Array.isArray(e.due)?e.due:[]).concat(d2,d6))].filter(x=>x<=UNITS).sort((x,y)=>x-y).slice(0,3);
  e.at=now();e.ok=0;e.b=1;
  const all=Object.entries(s.weave);if(all.length>12){all.sort((x,y)=>(WEIGHT(x[0])-WEIGHT(y[0]))||((x[1].at||0)-(y[1].at||0)));delete s.weave[all[0][0]]}}
function weaveSettle(cat,ok){const s=st(),e=s.weave[cat];if(!e)return;if(ok){e.ok++;if(e.ok>=2)delete s.weave[cat]}else{e.ok=0;e.due=[];e.b=1}}
function weaveFor(n){
  const s=st(),out={g:[],s:[],r:[],v:[]};let items=0;const used=new Set(),partUsed=new Set();
  // spacing in days as well as chapters: an echo never comes back within 2 days (learners who do 2 chapters a day)
  const ents=Object.entries(s.weave).filter(([c,e])=>Array.isArray(e.due)&&e.due.some(d=>d<=n)&&(e.last||0)!==n-1&&now()-(e.lastT||e.at||0)>=2*DAY)
    .sort((a,b)=>Math.min(...a[1].due)-Math.min(...b[1].due)||WEIGHT(b[0])-WEIGHT(a[0]));
  for(const [c,e] of ents){
    const take=()=>{e.due=e.due.filter(d=>d>n);e.last=n;e.lastT=now()};
    if(c.startsWith('w:'))continue; // missed words come back through spaced repetition (wordResult), not the weave
    const part=roleOfCat(c)==='v'?'g':roleOfCat(c);if(partUsed.has(part)||items>=WEAVE_MAX_ITEMS)continue;
    const k=Math.min(2,WEAVE_MAX_ITEMS-items);const rs=freshFor(c,n,k,{exclude:used});if(!rs.length)continue;
    rs.forEach(r=>{used.add(r.id);items++;out[part].push({...r,c,wv:c})});partUsed.add(part);take();
  }
  return out;
}

/* ------------------------------------------------------------------ words and mini-games */
function wordObj(w){const p=PD();if(p&&p.words&&p.words[w])return p.words[w];return null}
function phraseObj(w){const p=PD();return p&&p.phrases?p.phrases[w]||null:null}
let ALLW=null;function allWords(){if(!ALLW)ALLW=Object.values((PD()&&PD().words)||{});return ALLW}
let ALLP=null;function allPhrases(){if(!ALLP)ALLP=Object.values((PD()&&PD().phrases)||{});return ALLP}
function sayIt(t){try{if(typeof W.speak==='function'){W.speak(t);return}if(W.speechSynthesis){const u=new SpeechSynthesisUtterance(String(t));u.lang='en-US';u.rate=0.9;W.speechSynthesis.cancel();W.speechSynthesis.speak(u)}}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}}
const posK=p=>{p=String(p||'').toLowerCase();return /phr|phrase/.test(p)?'phr':/adj/.test(p)?'adj':/adv/.test(p)?'adv':/\bv\b|^v/.test(p)?'v':/\bn\b|^n/.test(p)?'n':'x'};
function distractWords(w,field,k=3){
  const pool=shuffle(allWords().filter(x=>x.w!==w.w&&String(x[field]).trim()!==String(w[field]).trim()));
  const same=pool.filter(x=>posK(x.pos)===posK(w.pos)),other=pool.filter(x=>posK(x.pos)!==posK(w.pos));
  const out=[],seen=new Set([String(w[field]).trim()]);for(const x of [...same,...other]){const v=String(x[field]).trim();if(seen.has(v))continue;seen.add(v);out.push(v);if(out.length===k)break}
  return out;
}
function mcq(key,ds){const opts=shuffle([key,...ds]);return {opts,ans:opts.indexOf(key)}}
function surface(w){const head=String(w.w);const re=new RegExp('\\b('+head.split(/\s+/).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s+')+')(s|es|ed|d|ing)?\\b','i');const m=String(w.ex).match(re);return m?m[0]:null}
function gapSentence(w){const sf=surface(w);if(!sf)return w.ex;return String(w.ex).replace(new RegExp(sf.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),'_____')}
/* C8b — ประโยคบริบทที่เขียนเฉพาะคำผ่านตา: ใช้เป็นประโยคตั้งคำถามและเป็นตัวอย่างบนบัตรคำ */
function sightEx(w){const s=sightSentence(typeof w==='string'?w:(w&&w.w));return s||''}
function gapSentenceSight(w){const s=sightEx(w);if(!s)return gapSentence(w);
  const k=String(w.w).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const out=s.replace(new RegExp('\\b'+k+'(s|es|ed|d|ing|ly|er|est|ies)?\\b','i'),'_____');
  return out===s?gapSentence(w):out}
const COMMON=new Set('the a an this that these those my our your his her their its we you they he she it there here many some most all every each one two after before when while if although because since as people students our many most more most last next first new'.split(' '));
const normTxt=t=>String(t||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z' -]/g,'').replace(/\s+/g,' ').trim();
function gameCard(type,w){
  if(!w)return null;const P=PD()||{};
  switch(type){
    case 'meaning':{const q=mcq(String(w.th),distractWords(w,'th'));return {t:'g',g:'meaning',w:w.w,...q}}
    case 'reverse':{const q=mcq(String(w.w),distractWords(w,'w'));return {t:'g',g:'reverse',w:w.w,...q}}
    case 'listen':{const q=mcq(String(w.w),distractWords(w,'w'));return {t:'g',g:'listen',w:w.w,...q}}
    case 'trans':{if(!w.exTh)return gameCard('meaning',w);const q=mcq(String(w.exTh),allWords().filter(x=>x.w!==w.w&&x.exTh).map(x=>x.exTh).__fy().slice(0,3));return {t:'g',g:'trans',w:w.w,...q}}
    case 'gap':{const f=surface(w);if(!f||f.toLowerCase()!==String(w.w).toLowerCase())return gameCard('reverse',w);
      const q=mcq(String(w.w),distractWords(w,'w').filter(x=>!/\s/.test(x)||/\s/.test(w.w)));if(q.opts.length<4)return gameCard('reverse',w);return {t:'g',g:'gap',w:w.w,...q}}
    case 'typed':{if(/\s/.test(w.w)||w.w.length>14)return gameCard('gap',w);return {t:'g',g:'typed',w:w.w}}
    case 'syn':{const sy=P.syn&&P.syn[w.w];if(!sy||!sy.s||!sy.s.length)return null;const key=sy.s[0];const ds=allWords().filter(x=>x.w!==w.w&&!sy.s.includes(x.w)&&posK(x.pos)===posK(w.pos)).map(x=>x.w);const q=mcq(key,shuffle(ds).slice(0,3));return q.opts.length===4?{t:'g',g:'syn',w:w.w,...q}:null}
    case 'ant':{const an=P.ant&&P.ant[w.w];if(!an)return null;const ds=allWords().filter(x=>x.w!==w.w&&x.w!==an).map(x=>x.w);const q=mcq(an,shuffle(ds).slice(0,3));return {t:'g',g:'ant',w:w.w,...q}}
    case 'build':{const toks=String(w.ex).replace(/\s+/g,' ').trim().replace(/[.!?]+$/,'').split(' ');if(toks.length<4||toks.length>13)return null;
      {const lw=toks[0].toLowerCase();if(lw!==toks[0]&&toks[0]!=='I'&&(COMMON.has(lw)||allWords().some(x=>x.w===lw)))toks[0]=lw}
      let sh=shuffle(toks.map((x,i)=>i));let guard=0;while(sh.every((x,i)=>x===i)&&guard++<5)sh=shuffle(sh);return {t:'g',g:'build',w:w.w,toks,order:sh}}
  }
  return null;
}
const QT=[['wh','Wh- (What/Where/When/Who/Why/How) · ต้องการข้อมูล'],['yn','Yes/No · ตอบรับ/ปฏิเสธ (อาจตอบอ้อม)'],['offer','ขอร้อง / เสนอ / ชวน (Could you…? Would you like…? Why don’t we…?)'],['choice','A or B · เลือกอย่างใดอย่างหนึ่ง (หรืออย่างที่สาม)'],['stmt','ประโยคบอกเล่า / แสดงความรู้สึก · ตอบรับความเห็นหรือความรู้สึก']];
function qType(p){const t=String(p||'').replace(/^Q:\s*/,'').trim();const l=t.toLowerCase();
  if(/^(could|can|would|will) you\b|^would you like|^why don['’]t (we|you)|^shall we|^how about|^what about|^do you want to|^let['’]s|^(may|can|could) i\b/.test(l))return 'offer';
  if(!/\?\s*$/.test(t))return 'stmt';if(/,\s*(isn['’]t|aren['’]t|don['’]t|doesn['’]t|didn['’]t|won['’]t|can['’]t|haven['’]t|hasn['’]t|wasn['’]t|weren['’]t|is|are|do|does|did|will|can|have|has)\s+\w+\s*\?\s*$/.test(l))return 'yn';
  if(/\bor\b/.test(l)&&/^(do|does|did|is|are|was|were|would|will|should|can|have|has)\b/.test(l))return 'choice';
  if(/^(what|where|when|who|whom|whose|which|why|how)\b/.test(l))return 'wh';if(/^(do|does|did|is|are|was|were|have|has|had|will|would|should|can|could|may|must|am)\b/.test(l))return 'yn';return null}
function qtypeCards(n,k,ex){if(!bankReady())return [];const pool=VLT_BANK.filter(q=>(q.category||q.kind)==='qr'&&Number(q.set||String(q.id).slice(1,3))<=14&&!ex.has(q.id)&&qType(q.prompt));
  const out=[];const seenT=new Set();for(const q of shuffle(pool)){const t=qType(q.prompt);if(out.length>=k)break;if(seenT.has(t)&&out.length<3)continue;seenT.add(t);out.push({t:'g',g:'qtype',qid:q.id,opts:QT.map(x=>x[1]),ans:QT.findIndex(x=>x[0]===t)})}return out}
function matchCard(ws){const list=ws.map(wordObj).filter(Boolean).slice(0,4);if(list.length<4)return null;return {t:'g',g:'match',ws:list.map(x=>x.w),th:shuffle([0,1,2,3])}}
function phraseGame(p){const ds=shuffle(allPhrases().filter(x=>x.w!==p&&x.th!==(phraseObj(p)||{}).th)).slice(0,3).map(x=>x.th);const q=mcq((phraseObj(p)||{}).th||'',ds);return {t:'g',g:'phrase',w:p,...q}}
// gap types for text completion (TOEIC Part 6 / Kaplan "predict before you peek"): the learner names what the gap
// needs before the options are shown; right prediction + wrong answer = a vocabulary problem, wrong prediction =
// a structure problem.
const GAP_TH=[['verb','รูปกริยา (tense / passive / to + V / V-ing)'],['form','ชนิดคำ / รูปคำ (n. adj. adv.)'],['link','คำเชื่อม (ขัดแย้ง / เหตุผล / เงื่อนไข / ลำดับ)'],['struct','คำไวยากรณ์ (who/which, a/the, บุพบท, it/that)'],['word','ศัพท์ตามความหมาย / collocation']];
function gapType(c){c=String(c||'');if(/^tc\.(tense|passive|agreement|modal|verb-form|gerund-inf)$/.test(c))return 'verb';if(/^tc\.(word-form|compare|participle)$/.test(c))return 'form';
  if(/^tc\.(connector|conditional)$/.test(c))return 'link';if(/^tc\.(relative|noun-clause|inversion|tag|structure|article-quant|preposition)$/.test(c))return 'struct';if(/^tc\.(vocab|collocation)$/.test(c))return 'word';return null}
function qCard(ref,extra){const it=getItem(ref);const len=it?it.opts.length:4;return {t:'q',id:ref.id,src:ref.src,c:ref.c||(it&&it.c)||'',o:shuffle([...Array(len).keys()]),...(ref.wv?{wv:ref.wv}:{}),...(ref.src==='v'?{w:ref.w,vo:ref.vo,va:ref.va,vt:ref.vt}:{}),...(extra||{})}}
function vocabRef(w,type){const o=wordObj(w);if(!o)return null;if(type==='gap'){const f=surface(o);if(!f)type='mean'}
  const q=type==='gap'?mcq(o.w,distractWords(o,'w')):mcq(o.th,distractWords(o,'th'));return {id:'v:'+o.w+':'+type,src:'v',c:'vocab',w:o.w,vt:type,vo:q.opts,va:q.ans}}

/* ------------------------------------------------------------------ continue (one button) */
function nextAction(){
  const s=st();
  if(READONLY)return {k:'readonly'};
  if(s.flow)return {k:'resume',flow:true,run:s.flow};
  if(s.active)return {k:'resume',run:s.active};
  if(s.pending){verifyPending();if(st().pending)return {k:'external',p:st().pending}}
  recompute();const e=curDay();if(!e)return {k:'finished'};
  // final phase is tied to the calendar: once today's day is done, the next one is tomorrow's (can be done early)
  if(e.final&&e.d&&e.d>today())return {k:'wait',e,u:s.unit};
  if(e.k==='chapter'){const n=e.n,us=unitState(n);
    if(us.remed&&us.remed.required)return {k:'remed',u:n};
    if(!us.done.lesson)return {k:'step',u:n,step:{k:'lesson'}};
    if(!us.done.assess)return {k:'step',u:n,step:{k:'assess'}};
    return {k:'complete-unit',u:n}}
  if(e.k==='mock')return {k:'mock',e,u:s.unit};
  return {k:'day',e,u:s.unit};
}
function describe(a){
  switch(a.k){
    case 'resume':{const r=a.run;if(a.flow){const f=r;return f.day?`ทำต่อ: ${dayLabel(f.day)} · ${f.i+1}/${f.cards.length}`:`เรียนต่อ: บทที่ ${f.unit} · ${f.remed?'ทบทวนจุดที่พลาด':partName(f.cards[f.i])} · ${f.i+1}/${f.cards.length}`}return `ทำต่อ: ${runTitle(r)} · ข้อ ${r.i+1}/${r.items.length}`}
    case 'external':return `กลับไปทำให้จบ: ${a.p.label||''}`;
    case 'remed':return `บทที่ ${a.u}: ทบทวนจุดที่พลาดสั้น ๆ แล้วสอบใหม่`;
    case 'step':return a.step.k==='lesson'?`บทที่ ${a.u} · ${(unitDef(a.u)||{}).title||''}`:`บทที่ ${a.u} · แบบทดสอบท้ายบท`;
    case 'complete-unit':return `บทที่ ${a.u} เสร็จแล้ว`;
    case 'mock':return a.e.label;
    case 'day':return a.e.label;
    case 'wait':return `วันนี้ครบแล้ว · พรุ่งนี้: ${a.e.label}`;
    case 'finished':return 'เรียนครบทั้งเส้นทางแล้ว · ทบทวนเบา ๆ ได้ทุกวัน';
    case 'readonly':return 'เปิดแบบอ่านอย่างเดียว';
    default:return 'เริ่มเรียน';
  }
}
function dayLabel(k){const e=DAYS.find(x=>dayKey(x)===k);return e?(e.k==='chapter'?'บทที่ '+e.n:e.label):''}
const PART_TH={open:'เปิดบท',pre:'ลองเดาก่อน',warm:'อุ่นเครื่อง',g:'ภาษาและไวยากรณ์',v:'คำศัพท์',s:'บทสนทนา (Speaking)',r:'การอ่าน (Reading)',x:'ประโยค',recap:'สรุปบท',remed:'ทบทวนจุดที่พลาด',review:'ทบทวน'};
function partName(c){return c&&c.part?PART_TH[c.part]||'':''}
function runTitle(r){const lab={assess:'แบบทดสอบท้ายบท',extra:'ฝึกเพิ่ม'}[r.mode]||'';return 'บทที่ '+r.unit+' · '+lab}
function cont(force){
  const s=st();if(!idx()||!PD()){toast('ยังโหลดเนื้อหาไม่สำเร็จ');return}
  if(!s.plan.start){s.plan.start=today();save()}
  const a=nextAction();
  switch(a.k){
    case 'resume':if(a.flow){showFlow();return}showRun();return;
    case 'external':relaunch();return;
    case 'remed':startLesson(a.u,{remed:true});return;
    case 'step':return startStep(a.u,a.step.k);
    case 'complete-unit':completeUnit(a.u);renderHub();return;
    case 'mock':return showMockDay(a.e);
    case 'day':return startDay(a.e);
    case 'wait':if(force)return a.e.k==='mock'?showMockDay(a.e):startDay(a.e);renderHub();toast('วันนี้ทำครบแล้ว พักผ่อนได้เลย');return;
    default:renderHub();
  }
}
function locked(n){return n>st().unit}
function startStep(n,key){
  if(READONLY){toast(NOTICE);return}
  if(locked(n)){toast('ต้องจบบทที่ '+st().unit+' ก่อน จึงจะเรียนบทถัดไปได้');return}
  const u=unitDef(n),us=unitState(n);if(!u)return;
  if(st().flow){toast('มีบทเรียนที่ค้างอยู่ ระบบพาไปเรียนต่อจากจุดเดิม');showFlow();return}
  if(st().active){toast('มีแบบทดสอบที่ค้างอยู่ ระบบพาไปทำต่อจากข้อเดิม');showRun();return}
  if(!us.started)us.started=now();
  if(key==='learn'||key==='guided'||key==='practice')key='lesson';
  if(us.st!=='done'&&key==='assess'&&!us.done.lesson){toast('เรียนบทนี้ให้จบก่อน แล้วจึงทำแบบทดสอบท้ายบท');return}
  if(us.remed&&us.remed.required&&key==='assess'){startLesson(n,{remed:true});return}
  if(key==='lesson')return startLesson(n);
  if(key==='assess')return startAssess(n);
}
function needsBank(){return true}
function withBank(fn){if(bankReady())return fn();renderLoading('กำลังโหลดคลังข้อสอบ…');ensureBank().then(()=>{if(idx())idx().bankByC=null;fn()}).catch(e=>{toast(e&&e.message||'โหลดคลังข้อสอบไม่สำเร็จ');renderHub()})}

/* ------------------------------------------------------------------ building a chapter (the "book") */
function learnCards(ch,role,cards){
  const L=(ch.learn||[]).find(l=>l.role===role);if(!L)return;const u=libUnit(L.u);if(!u||!u.learn)return;
  if(L.mode==='full'){cards.push({t:'learn',u:L.u,p:0,role,part:role});const x=u.learn;if((x.rules&&x.rules.length)||(x.ex&&x.ex.length)||(x.traps&&x.traps.length))cards.push({t:'learn',u:L.u,p:1,role,part:role})}
  else cards.push({t:'learn',u:L.u,p:2,role,part:role});
}
function grammarRefs(ch,n){
  if(ch.dyn==='errors'){const s=st();const byC={};Object.values(s.errors).forEach(e=>{if(e&&e.c&&e.wrong>0)byC[e.c]=(byC[e.c]||0)+e.wrong*(e.type==='misconception'?2:1)});
    const cs=Object.entries(byC).sort((a,b)=>b[1]-a[1]).map(x=>x[0]).slice(0,4);const out=[],ex=new Set();
    (cs.length?cs:['tc.vocab','rc.detail','qr.social']).forEach(c=>freshFor(c,n,2,{exclude:ex,minAgeDays:1}).forEach(r=>{ex.add(r.id);out.push({...r,c})}));return out.slice(0,8)}
  return (ch.practice.g||[]).slice();
}
function buildLesson(n,opt){
  const ch=unitDef(n),cards=[];
  if(opt&&opt.remed)return buildRemed(n);
  cards.push({t:'open',part:'open'});
  // warm-up: words that are due (spaced retrieval of earlier chapters)
  const compress=!!(opt&&opt.compress);
  const due=dueWords(compress?15:WARM_MAX);if(due.length){cards.push({t:'part',p:'warm',part:'warm'});const kinds=['meaning','reverse','gap','meaning','typed'];due.forEach((w,i)=>{const g=gameCard(compress&&i%5===4?'reverse':kinds[i%kinds.length],wordObj(w));if(g)cards.push({...g,part:'warm',rv:1})})}
  const wv=weaveFor(n);
  // pre-questions: 3 ungraded items from today's practice, answered before the teaching (feedback at once). The
  // same items come back later in the lesson, which is where the pretesting benefit shows.
  const pre=[(ch.practice.g||[])[0],(ch.practice.s||[]).find(r=>r.src==='bank'),(ch.practice.r||[])[0]].filter(Boolean).slice(0,3);
  if(pre.length&&!ch.dyn){cards.push({t:'part',p:'pre',part:'pre'});pre.forEach(r=>cards.push({...qCard(r),part:'pre',pre:true}))}
  // Part 1 — language / grammar
  cards.push({t:'part',p:'g',part:'g'});learnCards(ch,'g',cards);
  // C3b: ยูนิตเสริมที่ผูกกับบทด้วย role x* (ชุดผสม/ข้อสอบจำลอง) ต้องถูกแสดงในส่วนไวยากรณ์ด้วย ไม่งั้นเนื้อหาสอนจะเข้าไม่ถึงผู้เรียน
  (ch.learn||[]).filter(l=>/^x/.test(String(l.role||''))).forEach(l=>{const before=cards.length;learnCards(ch,l.role,cards);for(let i=before;i<cards.length;i++){cards[i].part='g';cards[i].role='g'}});
  grammarRefs(ch,n).concat(wv.g).forEach(r=>cards.push({...qCard(r),part:'g'}));
  // Part 2 — vocabulary
  cards.push({t:'part',p:'v',part:'v'});cards.push({t:'vintro',part:'v'});
  const allW=(ch.words||[]).filter(w=>wordObj(w));const nS=compress?15:(ch.srs||SRS_DEFAULT);
  // C8: core (nS คำแรก) + คำผ่านตาที่หมุนเข้ามาในรอบนี้ ถูกถามทั้งคู่ · ที่เหลือแสดงใน wlist
  const rot=wordRotation(ch,chapterCycle(n)),picked=new Set(rot.cycled);
  const words=compress?allW.slice(0,nS):allW.slice(0,nS).concat(rot.cycled.filter(w=>wordObj(w)));
  const expo=compress?allW.slice(nS):allW.slice(nS).filter(w=>!picked.has(w));
  const plan=compress?['meaning','listen','gap','reverse','meaning','listen']:['meaning','listen','gap','reverse','typed','trans'];
  for(let b=0;b<words.length;b+=10){const blk=words.slice(b,b+10);
    blk.forEach((w,i)=>{cards.push({t:'word',w,part:'v'});const g=gameCard(plan[(b+i)%plan.length],wordObj(w));if(g)cards.push({...g,part:'v'})});
    const m=matchCard(shuffle(blk));if(m)cards.push({...m,part:'v'});
    const sy=blk.find(w=>PD().syn&&PD().syn[w]);if(sy){const g=gameCard('syn',wordObj(sy));if(g)cards.push({...g,part:'v'})}
    const an=blk.find(w=>PD().ant&&PD().ant[w]);if(an){const g=gameCard('ant',wordObj(an));if(g)cards.push({...g,part:'v'})}
  }
  if(expo.length)cards.push({t:'wlist',ws:expo,part:'v'});
  wv.v.forEach((w,i)=>{const g=gameCard(['gap','reverse','meaning','typed'][i%4],wordObj(w));if(g)cards.push({...g,part:'v',wvw:w})});
  (ch.phrases||[]).forEach(p=>{if(phraseObj(p)){cards.push({t:'phrase',w:p,part:'v'});cards.push({...phraseGame(p),part:'v'})}});
  cards.push({t:'break',n:1,part:'v'});
  // Part 3 — speaking (conversation)
  cards.push({t:'part',p:'s',part:'s'});learnCards(ch,'s',cards);
  if(n<=24&&!compress){const used=new Set((ch.practice.s||[]).map(r=>r.id));qtypeCards(n,n<=12?4:2,used).forEach(g=>cards.push({...g,part:'s'}))}
  (ch.practice.s||[]).concat(wv.s).forEach(r=>cards.push({...qCard(r),part:'s'}));
  // Part 4 — reading (cloze / comprehension)
  cards.push({t:'part',p:'r',part:'r'});learnCards(ch,'r',cards);
  (ch.practice.r||[]).concat(wv.r).forEach(r=>{const q=qCard(r);const gt=r.src==='bank'?gapType(refFam(r)):null;cards.push({...q,part:'r',...(gt?{pred:gt}:{})})});
  // Part 5 — sentences: build two, translate one (from today's words); dropped in catch-up mode
  const sw=words.filter(w=>{const o=wordObj(w);const k=String(o.ex||'').split(' ').length;return k>=5&&k<=12});
  const picks=compress?[]:sw.slice(0,3);if(picks.length){cards.push({t:'part',p:'x',part:'x'});picks.forEach((w,i)=>{const g=gameCard(i<2?'build':'trans',wordObj(w));if(g)cards.push({...g,part:'x'})})}
  cards.push({t:'recap',part:'recap'});
  return addMini(cards);
}
const MINI={
 'tc.tag':{t:'Question tag (…, isn’t it? / …, didn’t you?)',rules:['ประโยคบอกเล่า → tag ปฏิเสธ · ประโยคปฏิเสธ → tag บอกเล่า','tag ใช้กริยาช่วยตัวเดียวกับประโยค (is/are/was/were/have/has/will/can) + สรรพนามแทนประธาน','ประโยคที่ไม่มีกริยาช่วย ใช้ do/does/did ตาม tense: You built it yourself, didn’t you?','แบบพิเศษ: I am … → aren’t I? · Let’s … → shall we? · ประโยคคำสั่ง → will you?'],ex:[['She has finished the report, ____?','กริยาช่วย has + บอกเล่า → hasn’t she?'],['They didn’t call you, ____?','ประโยคปฏิเสธ did → did they?']],trap:'อย่าดูแค่ประธาน ต้องดู tense ของกริยาด้วย: built เป็น past → didn’t you ไม่ใช่ don’t you'},
 'tc.inversion':{t:'Inversion (สลับกริยาช่วยขึ้นหน้าประธาน)',rules:['ขึ้นต้นประโยคด้วยคำปฏิเสธหรือคำจำกัด เช่น Never (before), Rarely, Seldom, Hardly … when, No sooner … than, Not only … but also, Under no circumstances, Only then → เรียง กริยาช่วย + ประธาน + กริยาหลัก','ประโยคเดิมไม่มีกริยาช่วย ใช้ do/does/did: Rarely does he complain.','Not until … ให้สลับในประโยคหลัก: Not until the guests left did the staff start cleaning.'],ex:[['Never before ____ so many companies asked for help.','สถิติถึงปัจจุบัน + ประธานพหูพจน์ → have'],['Under no circumstances ____ you continue using the charger.','คำแนะนำ/ข้อห้าม → should you continue']],trap:'ตัวเลือกที่ไม่ใช่กริยาช่วย (to, that, for) ใช้ทำ inversion ไม่ได้'},
 'tc.noun-clause':{t:'Noun clause (what / how / when / whether / that)',rules:['noun clause ทำหน้าที่เป็นคำนาม (ประธานหรือกรรม): I know what he wants.','ใน noun clause เรียงแบบบอกเล่า: I wonder where she lives. (ไม่ใช่ where does she live)','what = “สิ่งที่” ใช้เมื่อ clause ขาดประธาน/กรรม · how/when/where/why ใช้เมื่อ clause ครบแล้ว · whether/if = “หรือไม่” · that = “ว่า” (clause ครบ)'],ex:[['Nobody knows exactly ____ the first tower stood.','clause ครบ (the first tower stood) ขาดแค่ “เมื่อไร” → when'],['I want to know ____ you cut your spending.','clause ครบ ถามวิธี → how']],trap:'ถ้า clause ครบแล้ว ห้ามใช้ what'}};
function addMini(cards){const done=new Set();for(let i=0;i<cards.length;i++){const c=cards[i];if(c.t!=='q'||c.src!=='bank'||c.pre)continue;const fm=refFam(c);if(MINI[fm]&&!done.has(fm)){done.add(fm);cards.splice(i,0,{t:'mini',fam:fm,part:c.part});i++}}return cards}
function weakCats(n){const us=unitState(n);return ((us.remed&&us.remed.cats)||[]).slice(0,3)}
function roleOfCat(c){const sk=conceptDef(c).skill||FAM_FALLBACK_SKILL(c);return sk==='conversation'?'s':(sk==='reading'||sk==='cloze')?'r':sk==='vocab'?'v':'g'}
function buildRemed(n){
  const ch=unitDef(n),cards=[{t:'part',p:'remed',part:'remed',remed:true}];const cats=weakCats(n);const ex=new Set();
  const roles=[...new Set(cats.map(roleOfCat).filter(r=>r!=='v'))];
  roles.forEach(r=>{const L=(ch.learn||[]).find(l=>l.role===r);if(L)cards.push({t:'learn',u:L.u,p:2,role:r,part:'remed',remed:true})});
  cats.filter(c=>c!=='vocab').forEach(c=>freshFor(c,n+1,3,{exclude:ex,minAgeDays:0}).forEach(r=>{ex.add(r.id);cards.push({...qCard({...r,c}),part:'remed'})}));
  const missedW=((unitState(n).remed||{}).words||[]).slice(0,8);missedW.forEach((w,i)=>{const o=wordObj(w);if(!o)return;cards.push({t:'word',w,part:'remed'});const g=gameCard(['reverse','typed','gap'][i%3],o);if(g)cards.push({...g,part:'remed'})});
  if(cards.filter(c=>c.t==='q'||c.t==='g').length<4)(ch.concepts||[]).forEach(c=>freshFor(c,n+1,2,{exclude:ex,minAgeDays:0}).forEach(r=>{ex.add(r.id);cards.push({...qCard({...r,c}),part:'remed'})}));
  cards.push({t:'recap',part:'recap',remed:true});return cards;
}
function startLesson(n,opt){
  if(READONLY){toast(NOTICE);return}
  const s=st();if(s.flow){showFlow();return}if(s.active){showRun();return}
  const u=unitDef(n);if(!u)return;
  const comp=!(opt&&opt.remed)&&behindBy(s)>=3;
  withBank(()=>{const cards=buildLesson(n,{...(opt||{}),compress:comp});const us=unitState(n);if(!us.started)us.started=now();
    s.flow={unit:n,cards,n0:cards.length,i:0,ans:{},k:0,t:0,rq:0,remed:!!(opt&&opt.remed),compress:comp,started:now()};
    us.used=(us.used||[]).concat(cards.filter(c=>c.t==='q').map(c=>c.id)).slice(-400);save();showFlow()});
}

/* ------------------------------------------------------------------ lesson flow interaction */
function fcur(){const f=st().flow;if(!f)return null;const c=f.cards[f.i];const a=f.ans[f.i]||(f.ans[f.i]={});return {f,c,a}}
function flowGradable(c){return c&&(c.t==='q'||c.t==='g')}
function flowAnswered(c,a){if(c.t==='q')return a.ph==='fb';if(c.t==='g')return !!a.done;return true}
function cardWord(c){return c.g==='match'?null:c.w}
function flowPick(k){
  const x=fcur();if(!x)return;const {f,c,a}=x;
  if(c.t==='g'){if(a.done||c.g==='build'||c.g==='typed'||c.g==='match')return;a.sel=k;a.ok=k===c.ans;a.done=true;f.t++;if(a.ok)f.k++;
    if(c.g==='qtype'){const P=st().stats.qtype=st().stats.qtype||{n:0,ok:0};P.n++;if(a.ok)P.ok++;save();renderFlow(true);return}
    if(c.g!=='phrase')wordResult(c.w,a.ok);if(c.wvw)weaveSettle('w:'+c.wvw,a.ok);
    if(c.g!=='trans'&&c.g!=='phrase')sayIt(c.w);save();renderFlow(true);return}
  if(c.t!=='q')return;const it=getItem(c);if(!it||a.ph==='fb')return;const orig=c.o[k];
  if(a.ph==='hint'){if(orig===a.s1)return;a.s2=orig;a.ok2=orig===it.ans;evidence(c.c||it.c,a.ok2,null,'hinted');a.ph='fb';if(!a.ok2)flowMiss(c,it);save();renderFlow(true);return}
  a.s1=orig;flowJudge(c,it,a);
}
function flowJudge(c,it,a){
  const f=st().flow;const ok=a.s1===it.ans;a.ok1=ok;
  if(!ok&&c.pred&&a.pd&&a.pd!=='skip'){const P=st().stats.pred=st().stats.pred||{n:0,ok:0,vocab:0,struct:0};if(a.pok)P.vocab++;else P.struct++}
  if(c.pre){a.ph='fb';save();renderFlow(true);return}
  f.t++;if(ok)f.k++;const cat=c.c||it.c;
  evidence(cat,ok,a.dk?'not':null,'first');remember(c,it,a.s1,ok,a.dk?'not':null,'lesson');
  if(c.src==='v'&&c.w)wordResult(c.w,ok);
  if(c.wv)weaveSettle(c.wv,ok);
  if(ok){a.ph='fb'}
  else if(a.dk||!it.hint||c.src==='bank'){a.ph='fb';flowMiss(c,it)}
  else a.ph='hint';
  save();renderFlow(true);
}
// a final miss: one fresh question of the same type near the end of this part (max 3 per lesson), and the type
// is remembered for the quiet weave in later chapters.
function flowMiss(c,it){
  const f=st().flow;const cat=c.c||it.c;if(!f.day&&cat&&cat!=='vocab'&&taughtBy(c,f.unit||st().unit))weaveAdd(cat,f.unit||st().unit);
  if(f.rq>=3||c.rq)return;
  const ex=new Set(f.cards.filter(x=>x.t==='q').map(x=>x.id));const nx=freshFor(cat,(f.unit||st().unit)+1,1,{exclude:ex,minAgeDays:2})[0];
  if(!nx)return;let at=f.i+1;while(at<f.cards.length&&f.cards[at].part===c.part&&f.cards[at].t!=='part')at++;
  f.cards.splice(at,0,{...qCard({...nx,c:cat}),part:c.part,rq:true});f.rq++;
}
function flowPredict(k){const x=fcur();if(!x||x.c.t!=='q'||!x.c.pred||x.a.pd!=null)return;const {c,a}=x;const s=st();
  a.pd=k;a.pok=k===c.pred;s.stats.pred=s.stats.pred||{n:0,ok:0,vocab:0,struct:0};if(k!=='skip'){s.stats.pred.n++;if(a.pok)s.stats.pred.ok++}save();renderFlow(true)}
function flowDK(){const x=fcur();if(!x||x.c.t!=='q')return;const {c,a}=x;if(a.ph==='fb'||a.ph==='hint')return;const it=getItem(c);if(!it)return;a.s1=DK;a.dk=true;flowJudge(c,it,a)}
function flowBuild(ti){const x=fcur();if(!x||x.c.t!=='g'||x.c.g!=='build'||x.a.done)return;const a=x.a;a.b=a.b||[];
  if(a.b.includes(ti))a.b=a.b.filter(z=>z!==ti);else a.b.push(ti);save();renderFlow()}
function flowBuildCheck(){const x=fcur();if(!x||x.c.g!=='build'||x.a.done)return;const {f,c,a}=x;a.b=a.b||[];if(a.b.length!==c.toks.length){toast('เรียงให้ครบทุกคำก่อน');return}
  const said=a.b.map(i=>c.toks[i]).join(' ');const ok=said===c.toks.join(' ');a.tries=(a.tries||0)+1;
  if(ok||a.tries>=2){a.done=true;a.ok=ok&&a.tries===1;f.t++;if(a.ok)f.k++;sayIt(c.toks.join(' '))}else{a.b=[];toast('ยังไม่ถูก ลองอีกครั้ง: หาประธานและกริยาหลักก่อน แล้วค่อยวางส่วนขยาย')}
  save();renderFlow(true)}
function flowType(v){const x=fcur();if(!x||x.c.g!=='typed'||x.a.done)return;x.a.val=String(v||'').slice(0,40)}
function flowTypedCheck(v){const x=fcur();if(!x||x.c.g!=='typed'||x.a.done)return;const {f,c,a}=x;if(v!=null)a.val=String(v).slice(0,40);
  if(!normTxt(a.val)){toast('พิมพ์คำตอบก่อน');return}
  const ok=normTxt(a.val)===normTxt(c.w);a.tries=(a.tries||0)+1;
  if(ok||a.tries>=2){a.done=true;a.ok=ok&&a.tries===1;f.t++;if(a.ok)f.k++;wordResult(c.w,a.ok);if(c.wvw)weaveSettle('w:'+c.wvw,a.ok);sayIt(c.w)}
  else toast('ยังไม่ถูก ลองอีกครั้ง (ดูตัวอักษรแรกที่ใบ้ไว้)');
  save();renderFlow(true)}
function flowMatch(side,i){const x=fcur();if(!x||x.c.g!=='match'||x.a.done)return;const {f,c,a}=x;a.pairs=a.pairs||{};a.err=a.err||0;a.werr=a.werr||{};
  if(side==='w'){if(a.pairs[i]!=null)return;a.sel=i;save();renderFlow();return}
  if(a.sel==null){toast('แตะคำภาษาอังกฤษก่อน แล้วแตะความหมาย');return}
  const wi=a.sel;if(Object.values(a.pairs).includes(i))return;
  if(c.th[i]===wi){a.pairs[wi]=i;a.sel=null;if(Object.keys(a.pairs).length===c.ws.length){a.done=true;a.ok=a.err===0;f.t++;if(a.ok)f.k++;c.ws.forEach((w,k)=>wordResult(w,!a.werr[k]))}}
  else{a.err++;a.werr[wi]=1;a.flash=i;toast('ยังไม่คู่กัน ลองใหม่')}
  save();renderFlow(!!a.done)}
function flowNext(){
  const x=fcur();if(!x)return;const {f,c,a}=x;
  if(flowGradable(c)&&!flowAnswered(c,a)){toast(c.t==='q'?'ตอบข้อนี้ หรือกด “ไม่รู้” ก่อน':'ตอบข้อนี้ก่อน');return}
  flushVocab();
  if(f.i<f.cards.length-1){f.i++;save();renderFlow();scrollTop();const nc=f.cards[f.i];if(nc.t==='g'&&nc.g==='listen')setTimeout(()=>sayIt(nc.w),250);return}
  finishLesson();
}
function flowBack(){const f=st().flow;if(!f||f.i===0)return;f.i--;save();renderFlow();scrollTop()}
function finishLesson(){
  const s=st(),f=s.flow;if(!f)return;flushVocab(true);
  if(f.day){s.reviews[f.day]={at:now(),k:f.k,t:f.t};log({k:'day',day:f.day,score:f.k,total:f.t});tailMark(DAYS.find(x=>!x.past&&dayKey(x)===f.day));s.flow=null;recompute();save();
    LEDGER.add('days',1);return renderDayDone(f)}
  const n=f.unit,us=unitState(n);const pct=f.t?Math.round(f.k/f.t*100):100;
  if(f.remed){if(us.remed){us.remed.required=false;us.remed.doneAt=now()}log({k:'remed',u:n,score:f.k,total:f.t})}
  else{const first=!us.done.lesson;us.done.lesson=true;us.res.lesson={score:f.k,total:f.t,pct,at:now()};log({k:'lesson',u:n,score:f.k,total:f.t});
    try{const vs=W.VLT_STATE;if(vs&&first){vs.xp=(Number(vs.xp)||0)+20;if(typeof W.VLT_save==='function')W.VLT_save()}}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}}
  s.flow=null;s.lastResult={mode:f.remed?'remed':'lesson',u:n,score:f.k,total:f.t};save();
  const el=app();if(!el)return;chrome('บทที่ '+n+' · จบบทเรียน');
  el.innerHTML=`<section class="st-card lh-card" role="status"><div class="st-eyebrow">บทที่ ${n} · ${f.remed?'ทบทวนจุดที่พลาด':'บทเรียน'} เสร็จแล้ว</div>
   <h1 class="st-title">ตอบถูกตั้งแต่ครั้งแรก ${f.k}/${f.t}</h1>
   <p class="lh-p">${f.remed?'พร้อมสอบท้ายบทรอบใหม่แล้ว · รอบนี้เป็นโจทย์ชุดใหม่':'ขั้นสุดท้ายของบทคือแบบทดสอบท้ายบท (ประมาณ 20 ข้อ ไม่มีคำใบ้ เฉลยพร้อมวิเคราะห์ตอนท้าย) · ได้ 85% ขึ้นไปผ่านทันที · ถ้าคะแนนอยู่ใกล้เส้น (65–84%) จะมีข้อเสริม 8 ข้อจากเรื่องที่พลาดเพื่อวัดให้แม่นขึ้น · ต่ำกว่า 65% ทบทวนสั้น ๆ แล้วสอบใหม่ · พัก 3–5 นาทีก่อนเริ่ม'}</p>
   <div class="lh-actions"><button type="button" class="st-btn" onclick="TGAT1Hub.continue()">${esc(describe(nextAction()))} →</button><button type="button" class="st-btn ghost" onclick="TGAT1Hub.open()">กลับหน้า Learning Hub</button></div></section>`;scrollTop();
}
function showFlow(){const f=st().flow;if(!f)return renderHub();if(f.cards.some(c=>c.t==='q'&&c.src==='bank')&&!bankReady())return withBank(showFlow);renderFlow();scrollTop()}

/* ------------------------------------------------------------------ end-of-chapter test */
// v47: the chapter in which each item family is first taught (grammar concepts of the chapter + the concepts of its
// speaking/reading units). Items of a family taught later are kept out of the test of an earlier chapter and are
// labelled "ยังไม่ได้เรียน" in practice.
let TAUGHT=null;
function taughtMap(){if(TAUGHT)return TAUGHT;const C=cur()||{},P=PD();const m={};if(!P)return m;
  const mark=(k,n)=>{if(k&&(!(k in m)||m[k]>n))m[k]=n};
  P.chapters.forEach(ch=>{(ch.concepts||[]).forEach(c=>{mark(c,ch.n);(((C.concepts||{})[c]||{}).bank||[]).forEach(f=>mark(f,ch.n))});
    (ch.units||[]).forEach(u=>{const U=libUnit(u);((U&&U.concepts)||[]).forEach(c=>{if(typeof c!=='string')return;mark(c,ch.n);(((C.concepts||{})[c]||{}).bank||[]).forEach(f=>mark(f,ch.n))})})});
  return TAUGHT=m}
function refFam(r){if(r.src==='bank'){const q=W.VLT_get&&W.VLT_get(r.id);return q?family(q):(r.c||'')}return r.c||((getItem(r)||{}).c)||''}
function taughtBy(r,n){if(r.src==='v')return true;const f=refFam(r);const m=taughtMap();return !(f in m)||m[f]<=n}
// End-of-chapter test (v47 blueprint): about half on this chapter's own topic, about a third on earlier chapters
// (weakest first), the rest in TGAT format from the chapter's dialogue/passage — never on a topic not taught yet.
function testRefs(n,retake){
  const ch=unitDef(n),us=unitState(n),s=st();let refs=[];const ex=new Set([...(us.used||[])]);
  const prev=new Set((us.att||[]).flatMap(x=>x.ids||[]));const taken=()=>new Set([...ex,...prev,...refs.map(x=>x.id)]);
  if(ch.dyn==='errors'){refs=grammarRefs(ch,n+1).slice(0,8)}
  else{
    let base=(ch.test||[]).filter(r=>taughtBy(r,n));
    if(retake)base=base.map(r=>{const it=getItem(r);const c=refCat(r,it);const alt=freshFor(c,n+1,1,{exclude:taken(),minAgeDays:1})[0];return alt?{...alt,c}:r});
    const own=base.filter(r=>r.src!=='bank'),fmt=base.filter(r=>r.src==='bank');
    refs=own.slice();
    // own topic up to 8 items
    for(let round=0;round<3&&refs.length<8;round++)(ch.concepts||[]).forEach(c=>{if(refs.length>=8)return;const x=freshFor(c,n+1,1,{exclude:taken(),minAgeDays:1})[0];if(x)refs.push({...x,c})});
    // earlier chapters: up to 5, weakest concepts first
    const earlier=[...new Set(PD().chapters.filter(x=>x.n<n).flatMap(x=>x.concepts||[]))];
    const acc=c=>{const r=s.concepts[c];return r&&r.a?r.k/r.a:0.5};
    earlier.sort((a,b)=>acc(a)-acc(b)||hash(a+n)-hash(b+n));
    let rv=0;for(const c of earlier){if(rv>=5)break;const x=freshFor(c,n+1,1,{exclude:taken(),minAgeDays:2})[0];if(x&&taughtBy({...x,c},n)){refs.push({...x,c});rv++}}
    // TGAT format from the chapter's own dialogue/passage, up to 6
    fmt.slice(0,6).forEach(r=>refs.push(r));
  }
  const words=shuffle(wordRotation(ch,chapterCycle(n)).quizzed.filter(w=>wordObj(w)));let wi=0;
  const want=Math.min(refs.length<10?8:6,Math.max(3,TEST_MIN-refs.length));for(;wi<words.length&&refs.filter(r=>r.src==='v').length<want;wi++){const r=vocabRef(words[wi],wi%2?'gap':'mean');if(r)refs.push(r)}
  // order like the real test: speaking (Q-R, dialogues) → language → vocabulary → reading
  const rank=r=>{const c=r.c||(r.src==='bank'?(family(W.VLT_get(r.id)||{})):'');return /^qr\./.test(c)?0:/^conv\./.test(c)?1:r.src==='v'?3:/^(tc|rc)\./.test(c)?4:2};
  return refs.map((r,i)=>({r,i,k:rank(r)})).sort((a,b)=>a.k-b.k||a.i-b.i).map(x=>x.r);
}
// "I know this already": take the chapter test before the lesson. ≥ 85 % (no extension) completes the chapter and its
// 20 words go straight into spaced review; otherwise nothing is lost and the lesson starts as usual.
function testOut(n){const s=st(),us=unitState(n);if(READONLY||n!==s.unit||us.st==='done'||s.active)return;const ch=unitDef(n);if(!ch||ch.dyn)return;
  if(s.flow&&s.flow.unit===n&&!s.flow.day){if(s.flow.i>1){toast('เริ่มเรียนบทนี้ไปแล้ว ทำต่อให้จบจะดีกว่า');return}s.flow=null}
  startAssess(n,false,true)}
function startAssess(n,retake,skip){withBank(()=>{
  const us=unitState(n);const refs=testRefs(n,!skip&&(retake||(us.att||[]).filter(x=>!x.skip).length>0));
  if(refs.length<6){toast('ยังสร้างแบบทดสอบของบทนี้ไม่ได้');return}
  const items=refs.map(r=>{const it=getItem(r);const len=it?it.opts.length:4;return {...r,c:refCat(r,it),o:shuffle([...Array(len).keys()])}});
  const conf=[];const seenC=new Set();items.forEach((r,i)=>{if(conf.length<2&&!seenC.has(r.c)&&r.src!=='v'){conf.push(i);seenC.add(r.c)}});
  const s=st();s.active={mode:'assess',unit:n,items,i:0,ans:[],phase:'q',conf,started:now(),key:'assess',...(skip?{skip:true}:{})};us.used=(us.used||[]).concat(items.map(x=>x.id)).slice(-400);save();showRun();
})}
function current(){const r=st().active;if(!r)return null;const ref=r.items[r.i];return {r,ref,item:getItem(ref),a:r.ans[r.i]||(r.ans[r.i]={})}}
function needConf(r){return (r.conf||[]).includes(r.i)}
function pickOption(k){const cu=current();if(!cu||!cu.item)return;const {r,a}=cu;const orig=r.items[r.i].o[k];if(r.mode==='assess'||r.mode==='extra'){a.s1=orig;save();renderRun();return}}
function dontKnow(){const cu=current();if(!cu||!cu.item)return;const {a}=cu;a.s1=DK;a.dk=true;a.cf='not';save();renderRun()}
function setConf(v){const cu=current();if(!cu)return;cu.a.cf=v;save();renderRun()}
function nextQ(){
  const r=st().active;if(!r)return;const a=r.ans[r.i]||{};
  if(!Number.isInteger(a.s1)){toast('เลือกคำตอบ หรือกด “ไม่รู้” ก่อน');return}if(needConf(r)&&!a.cf&&!a.dk){toast('เลือกระดับความมั่นใจก่อน');return}
  if(r.i<r.items.length-1){r.i++;save();renderRun();scrollTop();return}
  finishRun();
}
function pauseRun(){flushVocab(true);saveNow();renderHub()}
const ADVICE={grammar:'ทวนกฎในส่วนที่ 1 ของบท แล้วลองวิเคราะห์ประโยคทีละส่วน: หาประธาน กริยาแท้ และคำบอกเวลา ก่อนดูตัวเลือก',structure:'หา S + V ของประโยคก่อน แล้วดูตำแหน่งช่องว่างว่าต้องการคำชนิดใด',logic:'อ่านความสัมพันธ์ของสองส่วน (ขัดแย้ง/เหตุผล/เงื่อนไข/ลำดับ) แล้วเลือกคำเชื่อมที่ตรงความสัมพันธ์และโครงสร้าง',
  vocab:'คำที่พลาดถูกเพิ่มเข้าคิวทบทวนศัพท์แล้ว ลองพูดประโยคตัวอย่างออกเสียง 1 รอบจะจำได้ดีขึ้น',conversation:'อ่านบรรทัดก่อนและหลังช่องว่างเสมอ คำตอบต้องทำให้ผู้พูดคนถัดไปตอบแบบนั้นได้ ระวังตัวเลือกที่ใช้คำซ้ำกับคำถามแต่ตอบคนละเรื่อง',
  reading:'หาประโยคหลักฐานในบทอ่านก่อนเลือก ตัวเลือกที่ถูกมักถอดความ (paraphrase) ไม่ได้ลอกคำเดิม และระวังตัวเลือกที่เกินจากที่บทอ่านบอก',cloze:'ดูคำก่อน–หลังช่อง (ชนิดคำ รูปกริยา คำเชื่อม) แล้วอ่านทั้งประโยคหลังเติมเพื่อตรวจความหมาย',strategy:'บริหารเวลา: ข้อที่ไม่แน่ใจให้ข้ามแล้วกลับมาทำ',mixed:'ทบทวนคำอธิบายของข้อที่พลาดทีละข้อ'};
// items for the extension: fresh items of the types missed in the first part (never the same items), vocabulary from
// the chapter's other spaced-repetition words, topped up with the chapter's own concepts
function extRefs(r){
  const n=r.unit,ch=unitDef(n),us=unitState(n);const ex=new Set([...(us.used||[]),...r.items.map(x=>x.id)]);const out=[];
  const missed=r.items.filter((ref,i)=>{const it=getItem(ref);const a=r.ans[i]||{};return it&&a.s1!==it.ans});
  const cats=[...new Set(missed.map(x=>x.c).filter(c=>c&&c!=='vocab'))];
  for(let round=0;round<3&&out.length<EXT_N;round++)cats.forEach(c=>{if(out.length>=EXT_N)return;const x=freshFor(c,n+1,1,{exclude:ex,minAgeDays:1})[0];if(x){ex.add(x.id);out.push({...x,c})}});
  if(missed.some(x=>x.src==='v')){const usedW=new Set(r.items.filter(x=>x.src==='v').map(x=>x.w));wordRotation(ch,chapterCycle(n)).quizzed.filter(w=>!usedW.has(w)).slice(0,3).forEach((w,i)=>{if(out.length<EXT_N){const v=vocabRef(w,i%2?'gap':'mean');if(v)out.push(v)}})}
  (ch.concepts||[]).forEach(c=>{if(out.length>=EXT_N)return;const x=freshFor(c,n+1,1,{exclude:ex,minAgeDays:1})[0];if(x){ex.add(x.id);out.push({...x,c})}});
  return out.slice(0,EXT_N).map(ref=>{const it=getItem(ref);return {...ref,c:refCat(ref,it),o:shuffle([...Array(it?it.opts.length:4).keys()]),ext:1}}).filter(x=>getItem(x));
}
function renderExtIntro(k,t,add){const el=app();if(!el)return;chrome('แบบทดสอบท้ายบท · ข้อเสริม');
  el.innerHTML=`<section class="st-card lh-card" role="status"><div class="st-eyebrow">แบบทดสอบท้ายบท · ช่วงที่ 2</div><h1 class="st-title">ได้ ${k}/${t} · ใกล้เส้นผ่านมาก</h1>
   <p class="lh-p">คะแนนช่วงนี้ใกล้เส้นผ่าน ซึ่งแบบทดสอบ 20 ข้อยังตัดสินได้ไม่แม่นพอ ขอเพิ่มอีก ${add} ข้อจากเรื่องที่พลาด (โจทย์ใหม่ทั้งหมด) แล้วตัดสินจากคะแนนรวม: 80% ขึ้นไปผ่าน · 65–79% ผ่าน · ต่ำกว่า 65% ทบทวนสั้น ๆ แล้วสอบใหม่</p>
   <div class="lh-actions"><button type="button" class="st-btn" onclick="TGAT1Hub.continue()">ทำต่ออีก ${add} ข้อ →</button><button type="button" class="st-btn ghost" onclick="TGAT1Hub.open()">พักไว้ก่อน</button></div></section>`;scrollTop()}
function finishRun(){
  const s=st(),r=s.active;if(!r)return;const n=r.unit,us=unitState(n);
  if(r.mode==='assess'&&!r.ext&&!r.skip){const k0=r.items.filter((ref,i)=>{const it=getItem(ref);const a=r.ans[i]||{};return it&&a.s1===it.ans}).length;const p0=Math.round(k0/r.items.length*100);
    if(p0>=COND_PCT&&p0<SURE_PCT){const add=extRefs(r);if(add.length>=4){r.ext=r.items.length;r.items=r.items.concat(add);r.i=r.ext;us.used=(us.used||[]).concat(add.map(x=>x.id)).slice(-400);save();return renderExtIntro(k0,r.ext,add.length)}}}
  const res=r.items.map((ref,i)=>({ref,a:r.ans[i]||{}}));const total=res.length;
  if(r.mode==='extra'){const k=res.filter(({ref,a})=>{const it=getItem(ref);return it&&a.s1===it.ans}).length;log({k:'extra',u:n,score:k,total});s.active=null;save();return renderRunDone(k,total)}
  const byC={},bySkill={},missedWords=[];
  res.forEach(({ref,a})=>{const it=getItem(ref);if(!it)return;const ok=a.s1===it.ans;a.ok1=ok;const c=refCat(ref,it);
    evidence(c,ok,a.dk?'not':(a.cf||null),'first');remember(ref,it,a.s1,ok,a.dk?'not':(a.cf||null),'assess');
    if(ref.src==='v'){wordResult(ref.w,ok);if(!ok)missedWords.push(ref.w)}
    byC[c]=byC[c]||{k:0,t:0,low:0};byC[c].t++;if(ok)byC[c].k++;if(ok&&a.cf==='not')byC[c].low++;
    const sk=conceptDef(c).skill||FAM_FALLBACK_SKILL(c);bySkill[sk]=bySkill[sk]||{k:0,t:0};bySkill[sk].t++;if(ok)bySkill[sk].k++});
  flushVocab(true);
  const score=res.filter(x=>x.a.ok1).length,pct=Math.round(score/total*100);
  const weak=Object.entries(byC).filter(([c,v])=>v.k<v.t).sort((a,b)=>(a[1].k/a[1].t)-(b[1].k/b[1].t)).map(([c])=>c);
  const pass=pct>=PASS_PCT,cond=!pass&&pct>=COND_PCT,ok=pass||cond;
  const mis=res.filter(x=>!x.a.ok1&&x.a.cf==='sure').length,dk=res.filter(x=>x.a.dk).length;
  const wrong=res.filter(x=>!x.a.ok1).map(({ref,a})=>{const it=getItem(ref);return it?{id:ref.id,src:ref.src,c:refCat(ref,it),stem:String(it.stem).slice(0,240),ctx:'',opts:it.opts.map(String),sel:a.dk?'(ไม่รู้)':(Number.isInteger(a.s1)&&a.s1>=0?String(it.opts[a.s1]):''),ans:String(it.opts[it.ans]),why:String(it.why||'').slice(0,900),cf:a.cf||null}:null}).filter(Boolean);
  const rec={t:now(),u:n,k:score,n:total,pct,pass:ok,cond,c:byC,sk:bySkill,ids:res.map(x=>x.ref.id),weak,wrong,dk,mis,ext:r.ext||0};
  if(r.skip){rec.skip=true;rec.pass=pct>=SURE_PCT;rec.cond=false;us.att.push(rec);s.assessments.push({t:rec.t,u:n,k:score,n:total,pct,pass:rec.pass,skip:true});LEDGER.add('tests',1);
    if(rec.pass){us.done.lesson=true;us.done.assess=true;us.skipped=true;us.res.assess={score,total,pct,at:now()};const ch=unitDef(n),t=now();
      (ch.words||[]).forEach(w=>{if(!isObj(s.words[w]))s.words[w]={n:0,k:0,iv:0,due:t,last:0,days:[]}});
      weak.forEach(c=>{if(c!=='vocab')weaveAdd(c,n)});log({k:'assess',u:n,pct,pass:true,skip:true});completeUnit(n)}
    else log({k:'assess',u:n,pct,pass:false,skip:true});
    s.active=null;s.lastResult={mode:'assess',u:n,rec};save();return renderAssessResult(rec)}
  us.att.push(rec);s.assessments.push({t:rec.t,u:n,k:score,n:total,pct,pass:ok});LEDGER.add('tests',1);
  if(ok){us.done.assess=true;us.res.assess={score,total,pct,at:now()};us.remed=null;
    weak.forEach(c=>{if(c!=='vocab')weaveAdd(c,n)});
    log({k:'assess',u:n,pct,pass:true,cond});completeUnit(n);
  }else{us.remed={required:true,cats:weak.slice(0,3),words:missedWords,at:now()};us.done.assess=false;log({k:'assess',u:n,pct,pass:false})}
  s.active=null;s.lastResult={mode:'assess',u:n,rec};save();renderAssessResult(rec);try{if(rec.pass&&!rec.cond&&W.TGAT1FX)W.TGAT1FX.confetti()}catch(_){}
}
// after two attempts that did not pass, the learner may move on: the chapter counts as done "with review", and its
// weak types go to the review days (the course never gets stuck on one chapter)
function carryOn(n){const s=st(),us=unitState(n);const fails=(us.att||[]).filter(x=>!x.pass&&!x.skip).length;if(us.st==='done'||fails<2)return;
  const last=(us.att||[]).slice(-1)[0];(last&&last.weak||[]).forEach(c=>{if(c!=='vocab')weaveAdd(c,n)});
  us.done.assess=true;us.carried=true;us.remed=null;log({k:'carry',u:n});completeUnit(n);save();renderHub()}
function completeUnit(n){
  const s=st(),us=unitState(n);if(us.st==='done')return;
  us.st='done';us.completed=now();log({k:'unit',u:n});recompute();
  try{if(typeof VLT_STATE!=='undefined'&&VLT_STATE){VLT_STATE.xp=(Number(VLT_STATE.xp)||0)+50;if(typeof W.VLT_save==='function')W.VLT_save()}}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}
  save();
}
function startExtra(n){const ch=unitDef(n);if(st().active){toast('มีแบบทดสอบค้างอยู่ ทำให้จบก่อน');return}withBank(()=>{
  const refs=[],ex=new Set();(ch.concepts||[]).concat(['qr.social','rc.detail','tc.vocab']).forEach(c=>freshFor(c,UNITS+1,2,{exclude:ex,minAgeDays:1}).forEach(r=>{ex.add(r.id);refs.push({...r,c})}));
  if(!refs.length){toast('ยังไม่มีโจทย์เพิ่มสำหรับบทนี้');return}
  const items=shuffle(refs).slice(0,8).map(r=>{const it=getItem(r);return {...r,o:shuffle([...Array(it?it.opts.length:4).keys()])}});
  st().active={mode:'extra',unit:n,items,i:0,ans:[],phase:'q',conf:[],started:now(),key:'extra'};save();showRun();
})}

/* ------------------------------------------------------------------ mock days, review days */
function reservedSetList(){const P=W.TGAT1_PATH_DATA||{};return Array.isArray(P.reservedSets)?P.reservedSets.slice():[]}
function isReservedSet(n){return reservedSetList().indexOf(Number(n))>=0}
function mockUsedSets(){const P=W.TGAT1_PATH_DATA||{};const days=Array.isArray(P.days)?P.days:[];const out=[];days.forEach(d=>{if(d&&d.k==='mock'){const n=Number(d.set);if(Number.isInteger(n)&&out.indexOf(n)<0)out.push(n)}});return out}
/* ชุดสำรองที่ยังไม่ถูกใช้ เป็นตัวกันไม่ให้ผู้เรียนเจอข้อซ้ำเมื่อต้องทำชุดเพิ่ม */
function reservedTailText(){const used=mockUsedSets();const tail=reservedSetList().filter(n=>used.indexOf(Number(n))<0);return tail.length?tail.join(', '):'ไม่มี (ใช้ครบแล้ว)'}

function showMockDay(e){withBank(()=>{
  const el=app();if(!el)return;chrome(e.label);const s=st(),m=s.mocks[e.set];
  let seenSet=false;try{const V=W.VLT_STATE||(typeof VLT_STATE!=='undefined'?VLT_STATE:null);seenSet=!!(V&&((V.completedSets&&V.completedSets[e.set])||(V.history||[]).some(h=>Number(h.setNo)===Number(e.set))))}catch(_){}
  el.innerHTML=`<div class="lh-top"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.open()">← Learning Hub</button></div>
  <section class="st-card lh-card"><div class="st-eyebrow">วันสอบจำลอง · ชุดที่ ${e.set} (ชุดนี้ไม่เคยใช้ในบทเรียน)</div><h1 class="st-title">${esc(e.label)}</h1>${seenSet&&!m?'<p class="lh-mini"><b>หมายเหตุ:</b> ชุดนี้เคยทำในศูนย์สอบมาแล้ว คะแนนรอบนี้อาจสูงกว่าความสามารถจริง ใช้ดูเรื่องเวลาเป็นหลัก</p>':''}${isReservedSet(e.set)?'<p class="lh-mini"><b>ชุดสำรอง:</b> ชุดที่ '+esc(String(e.set))+' ถูกกันไว้สำหรับข้อสอบจำลอง ไม่ถูกใช้ในบทเรียน จึงไม่มีทางซ้ำกับข้อที่เรียนมาแล้ว (ชุดสำรองที่ยังไม่ใช้: '+esc(reservedTailText())+')</p>':''}
   <p class="lh-p">ทำเหมือนวันสอบจริง: 60 ข้อ 60 นาที (Speaking 30 ข้อ · Reading 30 ข้อ) ปิดเสียงแจ้งเตือน และทำรวดเดียว ไม่ดูเฉลยระหว่างทำ · ในแอปข้ามข้อ ปักธงข้อที่ไม่แน่ใจ และกระโดดไปข้อใดก็ได้จากแผนผังข้อ เหมือนข้อสอบกระดาษ</p>
   <p class="lh-p">TCAS70 สอบ TGAT ด้วย<b>กระดาษ</b> (บ่าย 13:00–16:00 น. รวม TGAT1–3) จึงแนะนำให้พิมพ์ชุดสอบและฝนกระดาษคำตอบอย่างน้อย 2 ครั้ง และถ้าทำได้ ให้เริ่มทำตอน 13:00 น. ให้ร่างกายชินกับเวลาสอบจริง${mockNo(e.set)>=5?' · ครั้งนี้ลองทำต่อเนื่องแบบวันจริง: TGAT1 เสร็จแล้วพัก 5 นาทีก่อนทำอย่างอื่น เพราะวันจริงต้องทำ TGAT2–3 ต่อในบล็อกเดียวกัน':''}</p>
   <h2 class="lh-h">แบ่งเวลาโดยประมาณ</h2><ul class="lh-rules"><li>Question–Response 10 ข้อ: ~5 นาที</li><li>Short conversations 10 ข้อ: ~8 นาที · Long conversations 10 ข้อ: ~10 นาที</li><li>Text completion 15 ข้อ: ~13 นาที · Reading comprehension 15 ข้อ: ~18 นาที</li><li>เหลือ ~6 นาทีตรวจทานและฝนให้ครบ อย่าเว้นข้อว่าง (ไม่มีการหักคะแนน)</li></ul>
   ${m?`<p class="lh-p"><b>ทำแล้ว: ${m.score}/${m.total}</b> (${Math.round(m.score/m.total*100)}%) · ${esc(m.via==='paper'?'บันทึกจากกระดาษ':'ทำในแอป')}${m.blind!=null?` · Blind Review ${m.blind}/60 → ${m.blind-m.score>=4?'<b>ปัญหาหลักคือเวลา</b>: ฝึกจับเวลาแยกพาร์ตและข้ามข้อที่ติดเร็วขึ้น':(m.score<45?'<b>ปัญหาหลักคือความรู้</b>: กลับไปทวนเรื่องที่ผิดในวันทบทวน':'เวลาและความรู้สมดุลดี')}`:''}</p>`:''}
   <p class="lh-mini">ก่อนเริ่ม: ใจเต้นแรงหรือตื่นเต้นเป็นสัญญาณว่าร่างกายกำลังเตรียมพลังให้ทำข้อสอบได้ดี ไม่ใช่สัญญาณว่าจะพลาด · กติกาการเดา: ข้อสอบไม่หักคะแนน ข้อที่ติดเกิน 90 วินาทีให้ข้ามและวงไว้ ตอนเหลือ 3 นาทีฝนทุกข้อที่ว่างด้วยตัวอักษรสำรองตัวเดียวกัน</p>
   <div class="lh-actions"><button type="button" class="st-btn" onclick="TGAT1Hub.mockStart(${e.set})">เริ่มสอบในแอป (จับเวลา 60 นาที)</button><button type="button" class="st-btn ghost" onclick="TGAT1Hub.print(${e.set})">พิมพ์ชุดสอบ + กระดาษคำตอบ</button></div>
   <details class="lh-paper"><summary>ทำบนกระดาษแล้ว? บันทึกคะแนนที่นี่</summary><label class="lh-field">จำนวนข้อที่ถูก (จาก 60) <input type="number" id="lhPaperScore" min="0" max="60" inputmode="numeric"></label>
   <p class="lh-mini"><b>Blind Review (แนะนำ):</b> ระหว่างสอบให้วงเลขข้อที่ไม่มั่นใจ 100% · หลังหมดเวลา กรอกคะแนนช่องบนก่อน แล้ว<b>ยังไม่ดูเฉลย</b> ทำเฉพาะข้อที่วงใหม่โดยไม่จับเวลา จากนั้นค่อยตรวจและกรอกคะแนนรวมรอบหลัง ระบบจะบอกว่าปัญหาหลักคือ “เวลา” หรือ “ความรู้”</p>
   <label class="lh-field">คะแนนรวมหลัง Blind Review (จาก 60, ไม่บังคับ) <input type="number" id="lhPaperBlind" min="0" max="60" inputmode="numeric"></label>
   <p class="lh-mini">ไม่บังคับ: ข้อที่ถูกในแต่ละพาร์ต เพื่อให้วันทบทวนเลือกจุดอ่อนได้ตรงขึ้น</p><div class="lh-paperparts">${[['qr','Q–R',10],['short','Short',10],['long','Long',10],['tc','Text completion',15],['rc','Reading',15]].map(([k,t,mx])=>`<label class="lh-field">${t} (/${mx}) <input type="number" id="lhPaper_${k}" min="0" max="${mx}" inputmode="numeric"></label>`).join('')}</div><div class="lh-actions"><button type="button" class="st-btn small" onclick="TGAT1Hub.paperScore(${e.set})">บันทึกคะแนน</button></div><p class="lh-mini">หน้าสุดท้ายของไฟล์พิมพ์มีเฉลย ตรวจเองแล้วกรอกคะแนน ระบบจะนับวันนี้ว่าเสร็จ</p></details>
  </section>`;scrollTop();
})}
function mockStart(set){const s=st();if(s.active){toast('มีแบบทดสอบค้างอยู่ ทำให้จบก่อน');return}launchAct(s.unit,'mock'+set,{type:'mock',ref:set,label:'สอบจำลองชุดที่ '+set})}
function paperScore(set){const el=D.getElementById('lhPaperScore');const v=el?Number(el.value):NaN;if(!Number.isFinite(v)||v<0||v>60){toast('กรอกคะแนน 0–60');return}
  const s=st();const e=DAYS.find(x=>x.k==='mock'&&!x.past&&Number(x.set)===Number(set));
  // paper mocks: an optional per-part breakdown tells the review days what to work on
  const parts=[['qr','qr.social'],['short','conv.short'],['long','conv.long'],['tc','tc.vocab'],['rc','rc.detail']].map(([k,c])=>{const el2=D.getElementById('lhPaper_'+k);const n=el2&&el2.value!==''?Number(el2.value):NaN;return [c,n,k==='tc'||k==='rc'?15:10]}).filter(([c,n,mx])=>Number.isFinite(n)&&n>=0&&n<=mx);
  const weak=parts.sort((a,b)=>a[1]/a[2]-b[1]/b[2]).slice(0,3).map(x=>x[0]);
  const bEl=D.getElementById('lhPaperBlind');const bv=bEl&&bEl.value!==''?Number(bEl.value):NaN;const blind=Number.isFinite(bv)&&bv>=v&&bv<=60?Math.round(bv):null;
  s.mocks[set]={score:Math.round(v),total:60,at:now(),via:'paper',...(weak.length?{weak}:{}),...(blind!=null?{blind}:{})};log({k:'mock',set,score:Math.round(v),total:60});LEDGER.add('mock',1);tailMark(e);recompute();save();toast('บันทึกคะแนนแล้ว');renderHub()}
function printMock(set){withBank(()=>{
  const qs=VLT_BANK.filter(q=>Number(q.set)===Number(set));if(!qs.length){toast('ไม่พบชุดสอบ');return}
  const order={qr:0,short:1,long:2,tc:3,rc:4},names={qr:'Part 1 · Question–Response',short:'Part 2 · Short conversations',long:'Part 3 · Long conversations',tc:'Part 4 · Text completion',rc:'Part 5 · Reading comprehension'};
  const kd=q=>q.category||q.kind;const sorted=qs.slice().sort((a,b)=>(order[kd(a)]??9)-(order[kd(b)]??9)||a.id.localeCompare(b.id));let html='',lastCtx='',lastKind='';
  sorted.forEach((q,i)=>{if(kd(q)!==lastKind){html+=`<h2>${names[kd(q)]||kd(q)}</h2>`;lastKind=kd(q);lastCtx=''}
    if(q.context&&q.context!==lastCtx){html+=`<div class="ctx">${esc(q.context)}</div>`;lastCtx=q.context}
    html+=`<div class="q"><b>${i+1}.</b> ${esc(q.prompt)}<ol type="A">${q.options.map(o=>`<li>${esc(o)}</li>`).join('')}</ol></div>`});
  const sheet=sorted.map((q,i)=>`<div class="b"><b>${i+1}</b>${['A','B','C','D'].map(L=>`<span>${L}</span>`).join('')}</div>`).join('');
  const key=sorted.map((q,i)=>`${i+1}-${'ABCD'[q.answer]}`).join(' · ');
  const doc=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>TGAT1 practice mock set ${set}</title><style>body{font:12pt/1.5 Georgia,serif;margin:18mm;color:#000}h1{font-size:16pt}h2{font-size:13pt;margin-top:18px;border-bottom:1px solid #000}.ctx{white-space:pre-wrap;border:1px solid #555;padding:8px;margin:8px 0}.q{margin:6px 0;break-inside:avoid}.q ol{margin:2px 0 0 18px}.sheet{page-break-before:always;display:grid;grid-template-columns:repeat(3,1fr);gap:6px 18px}.b span{display:inline-block;width:22px;height:22px;border:1px solid #000;border-radius:50%;text-align:center;margin-left:6px;font-size:10pt;line-height:22px}.key{page-break-before:always}</style></head><body><h1>TGAT1 English Communication — practice mock, set ${set}</h1><p>60 questions · 60 minutes · original practice material (not an official test). Answer on the answer sheet.</p>${html}<div class="sheet"><h2 style="grid-column:1/-1">Answer sheet · name ____________ · score ____/60</h2>${sheet}</div><div class="key"><h2>Answer key (cut off before the test)</h2><p>${key}</p></div></body></html>`;
  const w=W.open('','_blank');if(!w){toast('เบราว์เซอร์บล็อกหน้าต่างใหม่ อนุญาต pop-up ก่อนพิมพ์');return}w.document.open();w.document.write(doc);w.document.close();try{w.focus();setTimeout(()=>{try{w.print()}catch(_){}},400)}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}
})}
function startDay(e){
  if(READONLY){toast(NOTICE);return}const s=st();if(s.flow){showFlow();return}
  withBank(()=>{const cards=buildDay(e);s.flow={day:dayKey(e),dk:e.k,unit:s.unit,cards,i:0,ans:{},k:0,t:0,rq:0,started:now()};save();showFlow()});
}
// exam weight decides the order when there is more to review than fits: reading/text completion first
const WEIGHT=c=>/^tc\./.test(c)?5:/^rc\./.test(c)?4:/^conv\./.test(c)?3:/^qr\./.test(c)?3:2;
function buildDay(e){
  const s=st(),k=e.k,cards=[{t:'part',p:k==='buffer'?'buffer':k==='rest'?'rest':'review',part:'review'}],ex=new Set();const n=UNITS+1;
  if(k==='rest'){cards.push({t:'tips',part:'review'});cards.push({t:'recap',part:'recap'});return cards}
  const light=k==='light',buffer=k==='buffer';const nCats=light?2:buffer?4:6,per=light?2:buffer?3:4,nWords=light?12:buffer?30:40;
  // weakest types: the weave queue (types sent to review), the latest mock results and the error memory
  const byC={};Object.values(s.errors).forEach(x=>{if(x&&x.c&&x.wrong>0)byC[x.c]=(byC[x.c]||0)+x.wrong});
  Object.entries(s.weave).forEach(([c,w])=>{if(!c.startsWith('w:'))byC[c]=(byC[c]||0)+(w.b?6:3)});
  Object.values(s.mocks).forEach(m=>(m.weak||[]).forEach((c,i)=>{byC[c]=(byC[c]||0)+(4-i)}));
  const cats=Object.entries(byC).sort((a,b)=>b[1]-a[1]||WEIGHT(b[0])-WEIGHT(a[0])).map(x=>x[0]).filter(c=>c!=='vocab').slice(0,nCats);
  (cats.length?cats:['tc.vocab','rc.detail','conv.short','qr.social']).forEach(c=>{const L=conceptDef(c);const got=freshFor(c,n,per,{exclude:ex,minAgeDays:2});
    if(got.length&&!light){const role=roleOfCat(c);const ch=PD().chapters.find(x=>x.concepts&&x.concepts.includes(c));const Lr=ch&&(ch.learn||[]).find(l=>l.role===role);if(Lr&&libUnit(Lr.u)&&!cards.some(z=>z.t==='learn'&&z.u===Lr.u))cards.push({t:'learn',u:Lr.u,p:2,role,part:'review'})}
    got.forEach(r=>{ex.add(r.id);cards.push({...qCard({...r,c}),part:'review'})});if(s.weave[c])s.weave[c].b=0});
  const ws=dueWords(nWords).concat(Object.keys(s.weave).filter(c=>c.startsWith('w:')).map(c=>c.slice(2))).filter((w,i,a)=>a.indexOf(w)===i&&wordObj(w)).slice(0,nWords);
  ws.forEach((w,i)=>{const g=gameCard(i%5===4?'typed':['reverse','meaning','gap','meaning'][i%4],wordObj(w));if(g)cards.push({...g,part:'review',rv:1})});
  if(light)cards.push({t:'tips',part:'review'});
  cards.push({t:'recap',part:'recap'});return cards;
}
// a buffer day can be given back to the path ("use it to study the next chapter")
function skipBuffer(){const s=st(),f=s.flow;const e=curDay();if(f&&f.dk==='buffer'){s.reviews[f.day]={at:now(),k:0,t:0,used:true};s.flow=null}else if(e&&e.k==='buffer'&&!s.flow){s.reviews[dayKey(e)]={at:now(),k:0,t:0,used:true}}else return;recompute();save();toast('ใช้วันเผื่อแล้ว ไปบทถัดไปได้เลย');renderHub()}
function renderDayDone(f){const el=app();if(!el)return;chrome('ทบทวนเสร็จแล้ว');
  el.innerHTML=`<section class="st-card lh-card" role="status"><div class="st-eyebrow">${esc(dayLabel(f.day))} เสร็จแล้ว</div><h1 class="st-title">ตอบถูก ${f.k}/${f.t}</h1><p class="lh-p">พักผ่อนให้พอ แล้วพรุ่งนี้กด “เรียนต่อ” อีกครั้ง</p><div class="lh-actions"><button type="button" class="st-btn" onclick="TGAT1Hub.open()">กลับหน้า Learning Hub</button></div></section>`;scrollTop()}

/* ------------------------------------------------------------------ plan: exam date, pace, today's checklist */
function examDate(){return examOf(st())}
function doneToday(){return doneOn(st(),today())}
// schedule from today: core entries one per day (from tomorrow if today's is done), final-phase entries on their dates
function calendar(){const s=st(),t=today();let d=doneToday()?addDays(t,1):t;const out=[];
  DAYS.forEach((e,i)=>{if(i<s.pos||e.past)return;if(e.final&&e.d){out.push({i,e,d:e.d});return}out.push({i,e,d});d=addDays(d,1)});return out}
function planInfo(){
  const s=st(),t=today(),exam=examDate();const daysLeft=Math.max(0,diffDays(t,exam));
  const coreLeft=CORE.filter(e=>!dayDone(s,e)).length,remainCh=CORE.filter(e=>e.k==='chapter'&&!dayDone(s,e)).length;
  const cal=calendar();const coreCal=cal.filter(x=>!x.e.final);const coreEnd=coreCal.length?coreCal[coreCal.length-1].d:'';
  const tail=DAYS.filter(e=>e.final&&!e.past);const tailMocks=tail.filter(e=>e.k==='mock').length,tailReviews=tail.filter(e=>e.k==='review').length;
  const behind=behindBy(s),compress=behind>=3&&coreLeft>0;const minutes=goalMinutes(s);
  const e=curDay();const chMin=e&&e.k==='chapter'?(unitDef(e.n)||{}).minutes||120:e&&e.k==='mock'?75:60;
  let status;
  if(daysLeft<=0)status='ถึงวันสอบแล้ว ขอให้โชคดี';
  else if(coreLeft&&coreEnd&&diffDays(coreEnd,exam)<=1)status=`บทเรียนหลักยังเหลือ ${remainCh} บท แต่เหลือเวลาไม่พอวันละบท · ลองทำวันละ 2 บทในบางวัน หรือเลื่อนวันสอบในแผนถ้าวันสอบจริงไม่ใช่วันนี้`;
  else if(compress)status=`ช้ากว่าแผน ${behind} วัน · ระบบย่อกิจกรรมรองให้อัตโนมัติ (ศัพท์ใหม่ 15 คำ ตัดเกมพิมพ์และส่วนแต่งประโยค) และเก็บแบบทดสอบท้ายบทไว้ครบ`;
  else if(behind>0)status=`ช้ากว่าแผน ${behind} วัน · วันเผื่อจะถูกใช้ให้อัตโนมัติ ไม่ต้องกังวล`;
  else if(coreLeft)status=`ตามแผน · บทเรียนหลักจบประมาณ ${thDate(coreEnd)} แล้วต่อด้วยสอบจำลอง ${tailMocks} ครั้งและวันทบทวน ${tailReviews} วัน`;
  else status=`ช่วงท้าย: สอบจำลองที่เหลือ ${tailMocks} ครั้ง · วันทบทวน ${tailReviews} วัน`;
  return {today:t,exam,examTime:(PD()&&PD().examTime)||'13:00',daysLeft,remain:DAYS.length-s.pos,remainCh,coreLeft,coreEnd,tailDays:tail.length,tailMocks,tailReviews,behind,compress,
    slack:-behind,pace:behind>=3?2:1,minutes,chMin,split:minutes<chMin-10,start:s.plan.start||'',pos:s.pos,total:DAYS.length,status,studied:LEDGER.studied(),doneToday:doneToday()};
}
function savePlan(){const g=id=>D.getElementById(id);const s=st();const ex=g('lhExam')?g('lhExam').value:'';const mi=g('lhMin')?Number(g('lhMin').value):120;
  if(ex&&!dateOf(ex)){toast('รูปแบบวันที่ไม่ถูกต้อง');return}s.plan.exam=ex||'';s.plan.minutes=clamp(mi||120,30,300);
  const sd=g('lhStart')?g('lhStart').value:'';if(sd&&dateOf(sd)&&sd<=today())s.plan.start=sd;
  try{if(typeof STUDIO_PROFILE!=='undefined'&&STUDIO_PROFILE){if(ex)STUDIO_PROFILE.examDate=ex;STUDIO_PROFILE.dailyGoal=s.plan.minutes;if(typeof W.studioSave==='function')W.studioSave('tgat1_english_studio_v1',STUDIO_PROFILE)}}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}
  recompute();save();toast('บันทึกแผนแล้ว');renderHub()}
function icsExport(){
  const pad=n=>String(n).padStart(2,'0');const dt=(d,h,m)=>d.replace(/-/g,'')+'T'+pad(h)+pad(m)+'00';const t=new Date(now());const stamp=t.getUTCFullYear()+pad(t.getUTCMonth()+1)+pad(t.getUTCDate())+'T'+pad(t.getUTCHours())+pad(t.getUTCMinutes())+'00Z';
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//TGAT1 English Studio//Learning Hub//TH','CALSCALE:GREGORIAN','BEGIN:VTIMEZONE','TZID:Asia/Bangkok','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0700','TZOFFSETTO:+0700','TZNAME:ICT','END:STANDARD','END:VTIMEZONE'];
  const esc2=x=>String(x).replace(/[\\,;]/g,m=>'\\'+m).replace(/\n/g,'\\n');
  calendar().forEach(({e,d},i)=>{if(e.k==='rest')return;const mock=e.k==='mock';const [h,m,dur]=mock?[13,0,75]:e.k==='chapter'?[18,0,120]:[18,0,e.k==='light'?45:60];const end=new Date(2000,0,1,h,m+dur);
    L.push('BEGIN:VEVENT','UID:tgat1-'+d+'-'+i+'@tgat1-studio','DTSTAMP:'+stamp,'DTSTART;TZID=Asia/Bangkok:'+dt(d,h,m),'DTEND;TZID=Asia/Bangkok:'+dt(d,end.getHours(),end.getMinutes()),'SUMMARY:'+esc2('TGAT1 · '+entryTitle(e)),'DESCRIPTION:'+esc2('เปิดแอป TGAT1 English Studio แล้วกด “เรียนต่อ”'),'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc2('ได้เวลาเรียน TGAT1'),'TRIGGER:-PT15M','END:VALARM','END:VEVENT')});
  const ex=examDate();L.push('BEGIN:VEVENT','UID:tgat1-exam-'+ex+'@tgat1-studio','DTSTAMP:'+stamp,'DTSTART;TZID=Asia/Bangkok:'+dt(ex,13,0),'DTEND;TZID=Asia/Bangkok:'+dt(ex,16,0),'SUMMARY:'+esc2('สอบ TGAT (TGAT1–3)'),'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc2('พรุ่งนี้สอบ TGAT เตรียมบัตรที่นั่งสอบ บัตรประชาชน ดินสอ 2B'),'TRIGGER:-PT18H','END:VALARM','END:VEVENT','END:VCALENDAR');
  try{const b=new Blob([L.join('\r\n')],{type:'text/calendar'});const u=URL.createObjectURL(b);const a=D.createElement('a');a.href=u;a.download='tgat1-study-plan.ics';D.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);toast('ดาวน์โหลดตารางแล้ว เปิดไฟล์เพื่อเพิ่มลงปฏิทิน')}catch(_){toast('สร้างไฟล์ปฏิทินไม่สำเร็จ')}
  return L.length}
function cardDone(){const s=st();s.plan.card=true;save();renderHub()}

/* ------------------------------------------------------------------ v45 optional AI tutor (unchanged) */
const AI_KEY='tgat1_ai_tutor_v1';
const AI_PROVIDERS={
  /* P1-11: แต่ละเจ้ามี "โมเดลหลัก" + รายการสำรอง ถ้าโมเดลถูกยกเลิก API จะตอบ model_not_found แล้วระบบจะลองตัวถัดไปเอง */
  anthropic:{label:'Anthropic (Claude)',url:'https://api.anthropic.com/v1/messages',model:'claude-haiku-5-5',
    models:['claude-haiku-5-5','claude-sonnet-5-5','claude-3-5-haiku-latest']},
  openai:{label:'OpenAI',url:'https://api.openai.com/v1/chat/completions',model:'gpt-4o-mini',
    models:['gpt-4o-mini','gpt-4.1-mini','gpt-4o','gpt-3.5-turbo']},
  openrouter:{label:'OpenRouter',url:'https://openrouter.ai/api/v1/chat/completions',model:'openai/gpt-4o-mini',
    models:['openai/gpt-4o-mini','openai/gpt-4.1-mini','anthropic/claude-3.5-haiku']}};
function aiCfg(){try{const c=JSON.parse(localStorage.getItem(AI_KEY)||sessionStorage.getItem(AI_KEY)||'{}');return isObj(c)?c:{}}catch(_){return {}}}
function aiOn(){const c=aiCfg();return !!(c.on&&c.key&&AI_PROVIDERS[c.provider||'anthropic'])}
function aiButton(where){return aiOn()?`<div class="lh-ai"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.ai('${where}')">🤖 ให้ AI อธิบายเพิ่ม</button><div class="lh-ai-out" id="lhAiOut" aria-live="polite"></div></div>`:''}
function aiContext(where,ix){
  let it=null,sel=null;
  if(where==='flow'){const x=fcur();if(!x||x.c.t!=='q')return null;it=getItem(x.c);sel=x.a.dk?'(ไม่รู้)':(Number.isInteger(x.a.s2)?it.opts[x.a.s2]:Number.isInteger(x.a.s1)&&x.a.s1>=0?it.opts[x.a.s1]:'')}
  else if(where==='result'){const r=(st().lastResult||{}).rec;const w=r&&r.wrong&&r.wrong[ix];if(!w)return null;return {stem:w.stem,ctx:w.ctx||'',opts:w.opts||[],ans:w.ans,sel:w.sel,why:w.why}}
  if(!it)return null;return {stem:it.stem,ctx:it.ctx||'',opts:it.opts,ans:it.opts[it.ans],sel,why:it.why||''};
}
function aiPrompt(q){return `คุณเป็นติวเตอร์ภาษาอังกฤษสำหรับนักเรียนไทยที่เตรียมสอบ TGAT1 อธิบายเป็นภาษาไทย กระชับ ไม่เกิน 150 คำ เป็นกันเอง
บอก (1) เหตุผลที่คำตอบที่ถูกถูก โดยชี้คำ/โครงสร้างในโจทย์ที่เป็นหลักฐาน (2) ทำไมคำตอบของนักเรียนผิด (ถ้าตอบผิดหรือไม่รู้) (3) เคล็ดลับจำสั้น ๆ 1 ข้อ ห้ามเปลี่ยนเฉลย
${q.ctx?'บริบท/บทอ่าน:\n'+q.ctx.slice(0,1500)+'\n':''}โจทย์: ${q.stem}
ตัวเลือก: ${q.opts.map((o,i)=>String.fromCharCode(65+i)+') '+o).join(' | ')}
คำตอบที่ถูก: ${q.ans}
คำตอบของนักเรียน: ${q.sel||'-'}
คำอธิบายเดิมในแอป: ${q.why}`}
function aiModelList(c,p){
  const list=[String(c.model||'').trim()||p.model].concat(p.models||[p.model]);
  const out=[];list.forEach(m=>{const v=String(m||'').trim();if(v&&out.indexOf(v)<0)out.push(v)});
  return out;
}
/* API ตอบว่าไม่รู้จักโมเดลหรือไม่ (404, not_found_error, ข้อความพูดถึง model + not found) */
function aiIsModelError(status,data){
  if(Number(status)===404)return true;
  const err=(data&&data.error)||{};const type=String((err&&err.type)||(data&&data.type)||'');
  const msg=String((err&&err.message)||(typeof err==='string'?err:'')||'');
  if(/not_found_error|model_not_found|invalid_model/i.test(type))return true;
  return /model/i.test(msg)&&/(not\s*found|unknown|does not exist|invalid|no such)/i.test(msg);
}
async function aiCallOnce(p,c,model,prompt){
  const ctl=typeof AbortController!=='undefined'?new AbortController():null;
  const timer=setTimeout(()=>{try{ctl&&ctl.abort()}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}},30000);
  try{
    let res,data;
    if((c.provider||'anthropic')==='anthropic'){
      res=await fetch(p.url,{method:'POST',signal:ctl&&ctl.signal,headers:{'content-type':'application/json','x-api-key':c.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model,max_tokens:600,messages:[{role:'user',content:prompt}]})});
      data=await res.json().catch(()=>({}));
      if(!res.ok){
        const why=String((data&&data.error&&data.error.message)||('HTTP '+res.status));
        const e=new Error(why);e.status=res.status;e.data=data;throw e;
      }
      return (data.content||[]).map(x=>x.text||'').join('').trim();
    }
    res=await fetch(p.url,{method:'POST',signal:ctl&&ctl.signal,headers:{'content-type':'application/json','authorization':'Bearer '+c.key},body:JSON.stringify({model,max_tokens:600,messages:[{role:'user',content:prompt}]})});
    data=await res.json().catch(()=>({}));
    if(!res.ok){
      const raw=(data&&data.error&&(data.error.message||data.error))||('HTTP '+res.status);
      const e=new Error(String(raw));e.status=res.status;e.data=data;throw e;
    }
    return ((data.choices||[])[0]||{}).message?.content?.trim()||'';
  }finally{clearTimeout(timer)}
}
async function aiCall(prompt){
  const c=aiCfg(),p=AI_PROVIDERS[c.provider||'anthropic'];if(!p||!c.key)throw new Error('ยังไม่ได้ตั้งค่า API key');
  if(W.navigator&&W.navigator.onLine===false)throw new Error('ออฟไลน์อยู่ ฟีเจอร์ AI ต้องใช้อินเทอร์เน็ต');
  const models=aiModelList(c,p);
  let lastErr=null,tried=[];
  for(let i=0;i<models.length;i++){
    tried.push(models[i]);
    try{
      return await aiCallOnce(p,c,models[i],prompt);
    }catch(e){
      lastErr=e;
      const retry=e&&aiIsModelError(e.status,e.data)&&i<models.length-1;
      if(!retry)throw lastErr;
    }
  }
  throw lastErr||new Error('เรียก AI ไม่สำเร็จ');
}
function aiExplain(where,ix){
  const out=D.getElementById(where==='result'?'lhAiOut'+ix:'lhAiOut');const q=aiContext(where,ix);if(!out||!q)return;
  out.textContent='กำลังถาม AI…';
  aiCall(aiPrompt(q)).then(t=>{out.innerHTML=`<p class="lh-mini">คำอธิบายจาก AI · AI อาจผิดได้ ให้ยึดเฉลยของแอปเป็นหลัก:</p><div class="lh-ai-text">${esc(t||'(ไม่มีคำตอบ)').replace(/\n/g,'<br>')}</div>`}).catch(e=>{out.textContent='เรียก AI ไม่สำเร็จ: '+(e&&e.name==='AbortError'?'หมดเวลา':(e&&e.message||e))});
}
function aiSettingsHtml(){
  const c=aiCfg(),pv=c.provider||'anthropic';
  return `<details class="st-card lh-card lh-aiset"><summary><b>🤖 ผู้ช่วย AI (ไม่บังคับ)</b> <small>${aiOn()?'เปิดอยู่':'ปิดอยู่'}</small></summary>
   <p class="lh-mini">เปิดเพื่อให้มีปุ่ม “ให้ AI อธิบายเพิ่ม” หลังตอบโจทย์ ต้องใช้ API key ของคุณเอง (มีค่าใช้จ่ายตามผู้ให้บริการ) · key ส่งไปยังผู้ให้บริการที่เลือกเท่านั้น · แอปทำงานครบทุกอย่างแม้ไม่เปิด AI · AI อาจอธิบายผิดได้</p>
   <label class="lh-field"><input type="checkbox" id="aiOn" ${c.on?'checked':''}> เปิดใช้ผู้ช่วย AI</label>
   <label class="lh-field"><input type="checkbox" id="aiSession" ${c.session?'checked':''}> จำ key เฉพาะรอบนี้ (ปิดแท็บแล้วลบ) · แนะนำบนเครื่องที่ใช้ร่วมกัน</label>
   <label class="lh-field">ผู้ให้บริการ <select id="aiProv">${Object.entries(AI_PROVIDERS).map(([k,v])=>`<option value="${k}" ${k===pv?'selected':''}>${esc(v.label)}</option>`).join('')}</select></label>
   <label class="lh-field">API key <input type="password" id="aiKey" autocomplete="off" value="${esc(c.key||'')}" placeholder="วาง API key ที่นี่"></label>
   <label class="lh-field">โมเดล <input type="text" id="aiModel" value="${esc(c.model||'')}" placeholder="${esc(AI_PROVIDERS[pv].model)}"></label>
   <div class="lh-actions"><button type="button" class="st-btn small" onclick="TGAT1Hub.aiSave()">บันทึก</button><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.aiTest()">ทดสอบการเชื่อมต่อ</button><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.aiClear()">ลบ key</button></div><div class="lh-ai-out" id="lhAiTest" aria-live="polite"></div></details>`;
}
function aiSave(){const g=id=>D.getElementById(id);const c={on:!!(g('aiOn')&&g('aiOn').checked),session:!!(g('aiSession')&&g('aiSession').checked),provider:g('aiProv')?g('aiProv').value:'anthropic',key:g('aiKey')?g('aiKey').value.trim():'',model:g('aiModel')?g('aiModel').value.trim():''};
  try{if(c.session){sessionStorage.setItem(AI_KEY,JSON.stringify(c));localStorage.removeItem(AI_KEY)}else{localStorage.setItem(AI_KEY,JSON.stringify(c));sessionStorage.removeItem(AI_KEY)}toast(c.on&&c.key?'เปิดผู้ช่วย AI แล้ว':'บันทึกแล้ว (AI ปิดอยู่)')}catch(_){toast('บันทึกไม่สำเร็จ')}renderHub()}
function aiClear(){try{localStorage.removeItem(AI_KEY);sessionStorage.removeItem(AI_KEY)}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}toast('ลบการตั้งค่า AI แล้ว');renderHub()}
function aiTest(){aiSave();const o2=D.getElementById('lhAiTest');if(!o2)return;if(!aiOn()){o2.textContent='ยังไม่ได้เปิดหรือยังไม่ได้ใส่ key';return}
  o2.textContent='กำลังทดสอบ…';aiCall('ตอบสั้น ๆ ว่า "พร้อมช่วยติว TGAT1"').then(t=>{o2.textContent='เชื่อมต่อสำเร็จ: '+t.slice(0,80)}).catch(e=>{o2.textContent='เชื่อมต่อไม่สำเร็จ: '+(e&&e.message||e)})}

/* ------------------------------------------------------------------ the full mock in the exam centre */
function readJSON(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(_){return f}}
function launchAct(n,key,a){
  const s=st();if(s.active){toast('มีแบบทดสอบใน Learning Hub ค้างอยู่ ทำให้จบก่อน');return}
  s.pending={u:n,key,type:a.type,ref:a.ref??null,label:a.label||'',at:now(),result:null};s.returnTo=true;save();
  if(a.type==='mock')withBank(()=>{W.VLT_startMock(Number(a.ref)||1)});else{s.pending=null;save()}
  updateBanner();
}
function relaunch(){const p=st().pending;if(!p)return renderHub();if(p.type==='mock'){const e=DAYS.find(x=>x.k==='mock'&&!x.past&&x.set===Number(p.ref));st().pending=null;save();return e?showMockDay(e):renderHub()}st().pending=null;save();renderHub()}
function cancelPending(){const s=st();s.pending=null;save();renderHub()}
function verifyPending(){const s=st(),p=s.pending;if(!p)return null;if(!p.result)return null;s.pending=null;s.returnTo=true;save();return p.result}
function onVltFinished(r){
  const s=st(),p=s.pending;if(!r||!p)return;
  if(p.type==='mock'&&r.mode==='mock'&&Number(r.setNo)===Number(p.ref)){
    const fam={};(r.qs||[]).forEach(q=>{const f=family(q);fam[f]=fam[f]||{k:0,t:0};fam[f].t++;if(r.answers&&r.answers[q.id]===q.answer)fam[f].k++});
    const weak=Object.entries(fam).filter(([f,v])=>v.t>=2).sort((a,b)=>a[1].k/a[1].t-b[1].k/b[1].t).slice(0,3).map(x=>x[0]);
    const k=(r.qs||[]).filter(q=>r.answers&&r.answers[q.id]===q.answer).length;const total=(r.qs||[]).length||60;
    s.mocks[p.ref]={score:k,total,at:now(),via:'app',weak};log({k:'mock',set:p.ref,score:k,total});LEDGER.add('mock',1);tailMark(DAYS.find(x=>x.k==='mock'&&!x.past&&Number(x.set)===Number(p.ref)));
    p.result={score:k,total};recompute();save();verifyPending();updateBanner();
  }
}

/* ------------------------------------------------------------------ rendering */
function app(){return D.getElementById('app')}
function scrollTop(){try{W.scrollTo({top:0,behavior:'auto'})}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}}
function chrome(sub){try{if(page()!=='hub'){STUDIO_PAGE='hub'}W.studioUpdateChrome('hub');const t=D.getElementById('studioTitle');if(t&&sub)t.textContent=sub}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}}
function renderLoading(msg){const el=app();if(!el)return;chrome();el.innerHTML=`<div class="st-card lh-card" role="status">${esc(msg)}</div>`}
function bar(p,label){return `<div class="lh-bar" role="progressbar" aria-label="${esc(label||'ความคืบหน้า')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p)}"><i style="width:${clamp(p,0,100)}%"></i></div>`}
const G_TITLE={qtype:'คำถามนี้เป็นแบบไหน (ดู 2–3 คำแรก) · ยังไม่ต้องดูตัวเลือก',meaning:'คำนี้แปลว่าอะไร',reverse:'คำภาษาอังกฤษข้อไหนตรงกับความหมายนี้',listen:'ฟังแล้วเลือกคำที่ได้ยิน',gap:'เติมคำลงในประโยค',build:'แตะคำเรียงให้เป็นประโยค',trans:'ประโยคนี้แปลว่าอะไร',phrase:'วลีนี้หมายถึงอะไร',typed:'พิมพ์คำภาษาอังกฤษจากความหมาย',syn:'เลือกคำที่ความหมายใกล้เคียงที่สุด',ant:'เลือกคำที่ความหมายตรงข้าม',match:'จับคู่คำกับความหมาย'};
const SKILL_TH={structure:'โครงสร้างประโยค',grammar:'ไวยากรณ์',vocab:'คำศัพท์',logic:'คำเชื่อม/ตรรกะประโยค',conversation:'บทสนทนา (Speaking)',cloze:'เติมคำในบทความ',reading:'การอ่าน',strategy:'กลยุทธ์ข้อสอบ',mixed:'ผสม'};
const TYPE_TH={misconception:'เข้าใจผิด (ผิดแต่มั่นใจ)','knowledge-gap':'ยังไม่รู้ (ผิดและไม่มั่นใจ)',guess:'ถูกแต่ไม่มั่นใจ',slip:'พลาดในเรื่องที่เคยทำได้',error:'ตอบผิด'};
function fmtDate(t){if(!t)return'-';const d=new Date(t);return d.getDate()+'/'+(d.getMonth()+1)+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function spkBtn(t){return `<button type="button" class="lh-say" onclick="TGAT1Hub.say(${esc(JSON.stringify(t))})" aria-label="ฟังเสียง">🔊</button>`}
function learnHtml(c,ch,n){
  const u=libUnit(c.u)||{},L=u.learn||{};const roleTh={g:'ส่วนที่ 1 · ภาษาและไวยากรณ์',s:'ส่วนที่ 3 · บทสนทนา',r:'ส่วนที่ 4 · การอ่าน'}[c.role]||'';
  if(c.p===0)return `<div class="st-eyebrow">บทที่ ${n} · ${roleTh}</div><h1 class="st-title">${esc(u.title||'')}</h1>${u.en?`<p class="st-subtitle">${esc(u.en)}</p>`:''}
      <h2 class="lh-h">เป้าหมาย</h2><ul class="lh-obj">${(u.obj||[]).map(o=>`<li>${esc(o)}</li>`).join('')}</ul>
      ${L.intro?`<p class="lh-p">${esc(L.intro)}</p>`:''}${L.steps&&L.steps.length?`<h2 class="lh-h">ขั้นตอนคิด</h2><ol class="lh-reason">${L.steps.map(z=>`<li>${esc(z)}</li>`).join('')}</ol>`:''}`;
  const exHtml=(L.ex||[]).slice(0,c.p===2?1:9).map(z=>`<div class="lh-example"><p class="lh-en" lang="en">${esc(z.en)}</p>${z.th?`<p class="lh-th">${esc(z.th)}</p>`:''}<ol>${(z.a||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ol></div>`).join('');
  return `<div class="st-eyebrow">บทที่ ${n} · ${c.remed?'ทบทวนก่อนสอบใหม่':c.p===2?roleTh+' · ทบทวนกลยุทธ์':roleTh+' · หลักและตัวอย่าง'}</div><h1 class="st-title">${esc(u.title||'')}</h1>
      ${c.p===2&&L.intro?`<p class="lh-p">${esc(L.intro)}</p>`:''}
      ${L.rules&&L.rules.length?`<h2 class="lh-h">หลักที่ต้องจำให้แม่น</h2><ul class="lh-rules">${L.rules.map(z=>`<li>${esc(z)}</li>`).join('')}</ul>`:''}
      ${exHtml?`<h2 class="lh-h">ตัวอย่างวิเคราะห์ทีละขั้น</h2>${exHtml}`:''}
      ${L.traps&&L.traps.length?`<h2 class="lh-h">กับดักที่พบบ่อย</h2><ul class="lh-traps">${L.traps.map(z=>`<li>${esc(z)}</li>`).join('')}</ul>`:''}`;
}
const PART_INTRO={pre:['ลองเดาก่อน 3 ข้อ (ไม่คิดคะแนน)','ตอบก่อนเรียน เดาผิดได้เต็มที่ เฉลยทันที · การลองตอบก่อนช่วยให้จำเนื้อหาที่ตามมาได้ดีขึ้น และสามข้อนี้จะกลับมาอีกครั้งในบท'],
  buffer:['วันเผื่อ · ทบทวนสะสม','ทวนเรื่องที่ยังพลาดบ่อยและศัพท์ที่ถึงรอบ (~45 นาที) · ถ้าวันนี้ต้องใช้วันเผื่อไปเรียนบทถัดไป กดปุ่มด้านล่างได้เลย'],
  rest:['พรุ่งนี้สอบแล้ว','วันนี้ไม่ต้องเรียนเรื่องใหม่ เตรียมของ เช็กเส้นทาง และนอนให้พอ'],
  warm:['อุ่นเครื่อง','ทวนศัพท์ที่ถึงรอบจากบทก่อน ๆ (ดึงความจำแบบเว้นระยะ ช่วยให้จำได้นานกว่าการอ่านซ้ำ)'],g:['ส่วนที่ 1 · ภาษาและไวยากรณ์','อ่านหลัก ดูตัวอย่างวิเคราะห์ แล้วลองทำโจทย์พร้อมคำใบ้'],v:['ส่วนที่ 2 · คำศัพท์','ศัพท์ใหม่ 20 คำ (เข้ารอบทบทวนอัตโนมัติ) เรียนเป็นชุดละ 10 คำ สลับมินิเกมหลายแบบ + คำผ่านตาอีก 10 คำ'],s:['ส่วนที่ 3 · บทสนทนา (Speaking)','กลยุทธ์ + Question–Response + บทสนทนาเติมบรรทัด แบบเดียวกับข้อสอบส่วนแรก'],r:['ส่วนที่ 4 · การอ่าน (Reading)','กลยุทธ์ + เติมคำในบทความ/อ่านจับใจความ แบบเดียวกับข้อสอบส่วนหลัง'],x:['ส่วนที่ 5 · ประโยค','เรียงประโยคและแปลประโยคจากศัพท์ของวันนี้'],remed:['ทบทวนจุดที่พลาด','ทวนหลักสั้น ๆ แล้วลองโจทย์ใหม่ในเรื่องที่พลาด ก่อนสอบรอบใหม่'],review:['วันทบทวน','รวมเรื่องที่ยังพลาดบ่อยจากบทเรียนและข้อสอบจำลอง + ศัพท์ที่ถึงรอบ']};
function renderFlow(focusFb){
  const el=app(),x=fcur();if(!el||!x)return renderHub();const {f,c,a}=x;const n=f.unit,ch=unitDef(n)||{};
  chrome(f.day?dayLabel(f.day):'บทที่ '+n+' · '+(f.remed?'ทบทวน':(PART_TH[c.part]||'บทเรียน')));
  let body='',next=true,nextLabel=f.i<f.cards.length-1?'ต่อไป →':(f.day?'จบวันนี้':'จบบทเรียน');
  if(c.t==='open'){const pi=planInfo();
    body=`<div class="st-eyebrow">บทที่ ${n} จาก ${UNITS} · ประมาณ ${ch.minutes||120} นาที · เป้าวันละ ${pi.minutes} นาที</div><h1 class="st-title">${esc(ch.title||'')}</h1>${ch.en?`<p class="st-subtitle">${esc(ch.en)}</p>`:''}
      <h2 class="lh-h">วันนี้จะได้เรียน</h2><ol class="lh-reason"><li><b>ภาษาและไวยากรณ์:</b> ${esc(ch.parts.g)}</li><li><b>คำศัพท์:</b> ศัพท์ใหม่ ${f.compress?15:(ch.srs||SRS_DEFAULT)} คำ + คำผ่านตา ${Math.max(0,ch.words.length-(f.compress?15:(ch.srs||SRS_DEFAULT)))} คำ + วลี ${ch.phrases.length} วลี</li><li><b>บทสนทนา:</b> ${esc(ch.parts.s)}</li><li><b>การอ่าน:</b> ${esc(ch.parts.r)}</li><li><b>แบบทดสอบท้ายบท</b> ~20 ข้อ พร้อมวิเคราะห์ข้อผิด</li></ol>
      <p class="lh-mini">กด “พักไว้ก่อน” ได้ทุกเมื่อ ระบบจำการ์ดที่ค้างไว้ · มีพักสั้น 2 ช่วงในบท${pi.split?' · วันนี้ตั้งเวลาไว้ '+pi.minutes+' นาที ทำครึ่งบทแล้วพรุ่งนี้ทำต่อได้':''}${f.compress?' · <b>โหมดเร่ง:</b> ช้ากว่าแผนหลายวัน ระบบตัดกิจกรรมรอง (ศัพท์ใหม่ 15 คำ ไม่มีเกมพิมพ์/แต่งประโยค) แต่แบบทดสอบท้ายบทครบเหมือนเดิม':''}</p>
      ${!f.remed&&!f.again&&!ch.dyn&&unitState(n).st!=='done'&&n===st().unit?`<p class="lh-mini">รู้เรื่องในบทนี้ดีอยู่แล้ว? <button type="button" class="lh-link" onclick="TGAT1Hub.testOut(${n})">ทดสอบข้ามบท</button> (ได้ 85% ขึ้นไปนับว่าจบบท ไม่ผ่านก็ไม่เสียอะไร)</p>`:''}
      ${n===1?'<p class="lh-mini">วิธีที่แอปนี้ช่วยให้จำได้นาน: เริ่มบทด้วยการลองเดา 3 ข้อ · ศัพท์ที่เรียนจะกลับมาให้ทวนเป็นรอบ ๆ · เรื่องที่เคยพลาดจะถูกผสมกลับมาเป็นโจทย์ใหม่แนวเดียวกันในบางบทโดยอัตโนมัติ ไม่ต้องจำเองว่าค้างอะไร</p>':''}`;
    nextLabel='เริ่มบทเรียน →';
  }else if(c.t==='part'){const P=PART_INTRO[c.p]||['',''];body=`<div class="st-eyebrow">${f.day?esc(dayLabel(f.day)):'บทที่ '+n}</div><h1 class="st-title">${esc(P[0])}</h1><p class="lh-p">${esc(P[1])}</p>${c.p==='buffer'?'<div class="lh-actions"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.skipBuffer()">ใช้วันเผื่อไปเรียนบทถัดไป</button></div>':''}`;nextLabel='ไปต่อ →'}
  else if(c.t==='mini'){const M=MINI[c.fam]||{};body=`<div class="st-eyebrow">บทเรียนสั้นก่อนทำข้อถัดไป</div><h1 class="st-title" lang="en">${esc(M.t||'')}</h1>
      <h2 class="lh-h">หลัก</h2><ul class="lh-rules">${(M.rules||[]).map(r=>`<li>${esc(r)}</li>`).join('')}</ul>
      <h2 class="lh-h">ตัวอย่าง</h2>${(M.ex||[]).map(e=>`<div class="lh-example"><p class="lh-en" lang="en">${esc(e[0])}</p><p class="lh-th">${esc(e[1])}</p></div>`).join('')}
      <h2 class="lh-h">กับดัก</h2><p class="lh-p">${esc(M.trap||'')}</p>`;nextLabel='เข้าใจแล้ว ไปทำข้อ →'}
  else if(c.t==='break'){body=`<div class="st-eyebrow">พักสั้น</div><h1 class="st-title">พัก 3–5 นาที</h1><p class="lh-p">ลุกเดิน ดื่มน้ำ พักสายตาจากจอ แล้วกลับมาทำส่วนต่อไป</p><p class="lh-mini">ถ้าวันนี้แบ่งเรียนเป็น 2 รอบ (รอบละประมาณ 1 ชั่วโมง) หยุดตรงนี้ได้เลย กด “พักไว้ก่อน” ระบบจำการ์ดนี้ไว้</p>`;nextLabel='พร้อมแล้ว ไปต่อ →'}
  else if(c.t==='wlist'){const ws=(c.ws||[]).map(wordObj).filter(Boolean);
    body=`<div class="st-eyebrow">ส่วนที่ 2 · คำผ่านตา</div><h1 class="st-title">คำผ่านตา ${ws.length} คำ</h1><p class="lh-p">ไม่ต้องท่อง แค่อ่านและฟังหนึ่งรอบ คำกลุ่มนี้พบในบทอ่านและข้อสอบได้ แต่ยังไม่เข้ารอบทบทวน เพื่อไม่ให้งานทบทวนรายวันหนักเกินไป</p>
      <ul class="lh-wlist">${ws.map(w=>`<li><b lang="en">${esc(w.w)}</b> ${spkBtn(w.w)} <span>${esc(w.th)}</span>${(sightEx(w)||w.ex)?`<small lang="en">${esc(sightEx(w)||w.ex)}</small>`:''}</li>`).join('')}</ul>`;nextLabel='อ่านครบแล้ว ไปต่อ →'}
  else if(c.t==='learn'){body=learnHtml(c,ch,n);nextLabel='เข้าใจแล้ว ไปต่อ →'}
  else if(c.t==='vintro'){const ws=(ch.words||[]).map(wordObj).filter(Boolean);
    body=`<div class="st-eyebrow">ส่วนที่ 2 · คำศัพท์ของวันนี้</div><h1 class="st-title">ศัพท์ใหม่ ${Math.min(ws.length,f.compress?15:(ch.srs||SRS_DEFAULT))} คำ + คำผ่านตา ${Math.max(0,ws.length-(f.compress?15:(ch.srs||SRS_DEFAULT)))} คำ</h1>
      <p class="lh-p">${f.compress?15:(ch.srs||SRS_DEFAULT)} คำแรกเข้ารอบทวนหลัก (กลับมาทวนหลัง 1, 3, 7, 14 วัน) ที่เหลือเป็นคำผ่านตา: หมุนเข้ามาถูกถามรอบละ 2 คำ จนครบทุกคำใน 5 รอบ · หลายคำมาจากบทสนทนาและบทอ่านของบทนี้ (เรียนก่อนอ่านช่วยให้อ่านเข้าใจขึ้น) ทุกคำมีประโยคตัวอย่างพร้อมคำแปล</p>
      <div class="lh-vocab-words">${ws.map((w,i)=>`<span class="lh-vocab-word ${i>=(f.compress?15:(ch.srs||SRS_DEFAULT))?'expo':''}"><b lang="en">${esc(w.w)}</b><small>${esc(w.th)}</small></span>`).join('')}</div>`}
  else if(c.t==='word'){const w=wordObj(c.w)||{w:c.w};
    body=`<div class="st-eyebrow">คำศัพท์ · ${esc(w.pos||'')}${w.lv?' · กลุ่มความยาก '+esc(w.lv):''}</div>
      <h1 class="st-title lh-word" lang="en">${esc(w.w)} ${spkBtn(w.w)}</h1>${w.ipa?`<p class="lh-ipa">${esc(w.ipa)}</p>`:''}
      <p class="lh-p"><b>${esc(w.th||'')}</b></p>
      ${w.ex?`<div class="lh-example"><p class="lh-en" lang="en">${esc(w.ex)}</p>${w.exTh?`<p class="lh-th">${esc(w.exTh)}</p>`:''}</div>`:''}
      ${sightEx(w)&&sightEx(w)!==w.ex?`<div class="lh-example"><p class="lh-mini">ตัวอย่างเพิ่มเติม (ประโยคบริบทของคำนี้)</p><p class="lh-en" lang="en">${esc(sightEx(w))}</p></div>`:''}`;
    if(!a.seen){a.seen=true;sayIt(w.w);save()}}
  else if(c.t==='phrase'){const p=phraseObj(c.w)||{w:c.w};
    body=`<div class="st-eyebrow">วลีใช้จริง · ${esc(p.type||'')}</div><h1 class="st-title lh-word" lang="en">${esc(p.w)} ${spkBtn(p.w)}</h1>
      <p class="lh-p"><b>${esc(p.th||'')}</b></p>${p.ex?`<div class="lh-example"><p class="lh-en" lang="en">${esc(p.ex)}</p></div>`:''}`}
  else if(c.t==='tips'){const pi=planInfo();body=`<div class="st-eyebrow">ก่อนวันสอบ</div><h1 class="st-title">เช็กลิสต์วันสอบ</h1><ul class="lh-rules"><li>วันสอบในแผน: ${esc(thDate(pi.exam))} · TGAT (TGAT1–3) บ่าย ${esc(pi.examTime)}–16:00 น. ตรวจวัน เวลา และสนามสอบในบัตรที่นั่งสอบ (mytcas.com) อีกครั้ง</li><li>พิมพ์บัตรที่นั่งสอบ เตรียมบัตรประชาชน ดินสอ 2B ยางลบ กบเหลาดินสอ</li><li>ปีนี้สอบด้วยกระดาษ: ฝนคำตอบให้เต็มวง และฝนให้ครบทุกข้อ (ไม่มีการหักคะแนน)</li><li>เช็กเส้นทางและเวลาเดินทางไปสนามสอบ เผื่อเวลาอย่างน้อย 1 ชั่วโมง</li><li>คืนก่อนสอบนอนให้พอ ทบทวนเบา ๆ ไม่อ่านเรื่องใหม่</li><li>ในห้องสอบ: Speaking ก่อนแล้ว Reading · ข้อไหนเกิน 1.5 นาทีให้ข้ามแล้วกลับมาทำ · TGAT1 ใช้เวลาประมาณ 60 นาทีจากบล็อก 3 ชั่วโมง</li></ul>`}
  else if(c.t==='g'&&c.g==='qtype'){const q=W.VLT_get?W.VLT_get(c.qid):null;
    body=`<div class="st-eyebrow">ฝึกจับชนิดคำถาม Q–R · ${esc(G_TITLE.qtype)}</div><p class="lh-big" lang="en">${esc(q?q.prompt:'')}</p>
      <div class="lh-opts">${c.opts.map((o,k)=>{let cls='';if(a.done){if(k===c.ans)cls='ok';else if(k===a.sel)cls='bad'}return `<button type="button" class="lh-opt ${cls}" ${a.done?'disabled':''} onclick="TGAT1Hub.flowPick(${k})"><span class="lh-L">${k+1}</span><span class="lh-o">${esc(o)}</span></button>`}).join('')}</div>
      ${a.done&&q?`<div class="lh-fb ${a.ok?'good':'mid'}" role="status" id="lhFb" tabindex="-1"><b>${a.ok?'ใช่ จับชนิดถูก':'ชนิดที่ถูกคือ: '+esc(c.opts[c.ans])}</b><p>คำตอบที่ถูกของข้อนี้: <span lang="en">“${esc(q.options[q.answer])}”</span></p><p class="lh-mini">ชนิดคำถามบอก “หน้าตา” ของคำตอบ: Wh- ต้องให้ข้อมูลตรงคำถาม (Where → สถานที่) · Yes/No ตอบอ้อมได้ · คำขอร้อง/ชวน ตอบรับหรือปฏิเสธอย่างสุภาพ · ตัวลวงมักเป็นคำตอบที่ถูกของคำถามอีกชนิด</p></div>`:''}`;next=!!a.done}
  else if(c.t==='g'){
    const w=c.g==='phrase'?phraseObj(c.w):wordObj(c.w);let prompt='',opts='';
    if(c.g==='meaning')prompt=`<p class="lh-big" lang="en">${esc(c.w)} ${spkBtn(c.w)}</p>`;
    if(c.g==='reverse')prompt=`<p class="lh-big">${esc(w?w.th:'')}</p>`;
    if(c.g==='listen')prompt=`<p class="lh-big">${spkBtn(c.w)} <span class="lh-mini">กด 🔊 เพื่อฟังอีกครั้ง</span></p>`;
    if(c.g==='trans')prompt=`<p class="lh-big" lang="en">${esc(w?w.ex:'')}</p>`;
    if(c.g==='phrase')prompt=`<p class="lh-big" lang="en">${esc(c.w)} ${spkBtn(c.w)}</p>${w&&w.ex?`<p class="lh-mini" lang="en">${esc(w.ex)}</p>`:''}`;
    if(c.g==='syn'||c.g==='ant')prompt=`<p class="lh-big" lang="en">${esc(c.w)} ${spkBtn(c.w)}</p><p class="lh-mini">${esc(w?w.th:'')}</p>`;
    if(c.g==='gap')prompt=`<p class="lh-big" lang="en">${esc(w?gapSentence(w):'')}</p>${w&&w.exTh?`<p class="lh-mini">${esc(w.exTh)}</p>`:''}`;
    if(c.g==='typed'){prompt=`<p class="lh-big">${esc(w?w.th:'')}</p><p class="lh-mini">ใบ้: ขึ้นต้นด้วย “${esc(String(c.w).charAt(0))}” · ${String(c.w).length} ตัวอักษร</p>
       <label class="lh-field lh-typed"><span class="lh-sr">คำตอบ</span><input type="text" id="lhTyped" lang="en" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(a.val||'')}" ${a.done?'disabled':''} oninput="TGAT1Hub.type(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();TGAT1Hub.typedCheck(this.value)}"></label>
       ${a.done?`<div class="lh-fb ${a.ok?'good':'bad'}" role="status" id="lhFb" tabindex="-1"><b>${a.ok?'ถูกต้อง':'คำที่ถูกคือ'}</b> <span lang="en">${esc(c.w)}</span>${w&&w.ex?`<p lang="en">${esc(w.ex)}</p><p>${esc(w.exTh||'')}</p>`:''}</div>`:`<div class="lh-actions"><button type="button" class="st-btn small" onclick="TGAT1Hub.typedCheck()">ตรวจคำตอบ</button></div>`}`}
    if(c.g==='build'){const b=a.b||[];prompt=`<p class="lh-mini">${esc(w?w.exTh:'')}</p><div class="lh-build-out" aria-live="polite">${b.length?b.map(i=>`<button type="button" class="lh-tok on" onclick="TGAT1Hub.build(${i})">${esc(c.toks[i])}</button>`).join(''):'<span class="lh-mini">แตะคำด้านล่างตามลำดับ</span>'}</div>
       <div class="lh-build-in">${c.order.map(i=>b.includes(i)?'':`<button type="button" class="lh-tok" ${a.done?'disabled':''} onclick="TGAT1Hub.build(${i})" lang="en">${esc(c.toks[i])}</button>`).join('')}</div>
       ${a.done?`<div class="lh-fb ${a.ok?'good':'mid'}" role="status" id="lhFb" tabindex="-1"><b>${a.ok?'ถูกต้อง':'ประโยคที่ถูกคือ'}</b><p lang="en">${esc(w?w.ex:c.toks.join(' '))}</p></div>`:`<div class="lh-actions"><button type="button" class="st-btn small" onclick="TGAT1Hub.buildCheck()">ตรวจคำตอบ</button></div>`}`}
    if(c.g==='match'){const pairs=a.pairs||{};const ws=c.ws.map(wordObj);
      prompt=`<div class="lh-match"><div class="lh-match-col">${ws.map((x,i)=>`<button type="button" class="lh-tok ${pairs[i]!=null?'done':''} ${a.sel===i?'on':''}" ${pairs[i]!=null||a.done?'disabled':''} onclick="TGAT1Hub.match('w',${i})" lang="en">${esc(x?x.w:'')}</button>`).join('')}</div>
        <div class="lh-match-col">${c.th.map((wi,i)=>{const used=Object.values(pairs).includes(i);return `<button type="button" class="lh-tok ${used?'done':''} ${a.flash===i&&!used?'bad':''}" ${used||a.done?'disabled':''} onclick="TGAT1Hub.match('t',${i})">${esc(ws[wi]?ws[wi].th:'')}</button>`}).join('')}</div></div>
        ${a.done?`<div class="lh-fb ${a.ok?'good':'mid'}" role="status" id="lhFb" tabindex="-1"><b>${a.ok?'จับคู่ถูกทั้งหมดตั้งแต่ครั้งแรก':'จับคู่ครบแล้ว'}</b></div>`:'<p class="lh-mini">แตะคำภาษาอังกฤษ แล้วแตะความหมายที่คู่กัน</p>'}`}
    if(!['build','typed','match'].includes(c.g)){opts=`<div class="lh-opts">${c.opts.map((o,k)=>{let cls='';if(a.done){if(k===c.ans)cls='ok';else if(k===a.sel)cls='bad'}
      return `<button type="button" class="lh-opt ${cls}" ${a.done?'disabled':''} onclick="TGAT1Hub.flowPick(${k})"><span class="lh-L">${String.fromCharCode(65+k)}</span><span class="lh-o" ${/[฀-๿]/.test(o)?'':'lang="en"'}>${esc(o)}</span>${a.done&&k===c.ans?'<span class="lh-mark">ถูก</span>':''}</button>`}).join('')}</div>
      ${a.done?`<div class="lh-fb ${a.ok?'good':'bad'}" role="status" id="lhFb" tabindex="-1"><b>${a.ok?'ถูกต้อง':'ยังไม่ถูก'}</b>${c.g==='syn'&&PD().syn[c.w]?`<p>${esc(PD().syn[c.w].th||'')}</p>`:''}${w&&w.ex&&c.g!=='trans'?`<p lang="en">${esc(w.ex)}</p><p>${esc(w.exTh||'')}</p>`:''}${c.g==='trans'&&w?`<p>${esc(w.exTh)}</p>`:''}</div>`:''}`}
    body=`<div class="st-eyebrow">${c.rv?'ทวนศัพท์':'มินิเกม'} · ${esc(G_TITLE[c.g]||'')}</div>${prompt}${opts}`;next=!!a.done;
  }else if(c.t==='q'){
    const it=getItem(c);if(!it){f.cards.splice(f.i,1);if(f.i>=f.cards.length)f.i=f.cards.length-1;save();return renderFlow()}
    const def=conceptDef(c.c||it.c),ans=it.ans,ph=a.ph||'q';
    if(c.pred&&a.pd==null&&ph==='q'){const same0=f.cards[f.i-1]&&f.cards[f.i-1].t==='q'&&getItem(f.cards[f.i-1])&&getItem(f.cards[f.i-1]).ctx===it.ctx&&it.ctx;
      body=`<div class="st-eyebrow">${esc(PART_TH[c.part]||'')} · ทายก่อนดูตัวเลือก</div>${it.ctx?`<div class="lh-ctx" lang="en" tabindex="0" aria-label="บทอ่าน">${same0?'<p class="lh-mini">บทเดิมจากข้อก่อนหน้า</p>':''}${esc(it.ctx)}</div>`:''}<h2 class="lh-stem" lang="en">${esc(it.stem)}</h2>
        <p class="lh-p">อ่านคำก่อนและหลังช่อง แล้วเลือกว่าช่องนี้ต้องการอะไร (ตัวเลือกจะเปิดหลังจากนี้)</p>
        <div class="lh-opts">${GAP_TH.map(([k,t])=>`<button type="button" class="lh-opt" onclick="TGAT1Hub.predict('${k}')"><span class="lh-o">${esc(t)}</span></button>`).join('')}</div>
        <button type="button" class="lh-dk" onclick="TGAT1Hub.predict('skip')">ข้ามขั้นนี้</button>`;
      next=false;
    }else{
    const optsHtml=c.o.map((orig,k)=>{let cls='',dis=false,mark='';
      if(ph==='fb'){dis=true;if(orig===ans){cls='ok';mark='ถูก'}else if(orig===a.s1||orig===a.s2){cls='bad';mark='ผิด'}}
      else if(ph==='hint'&&orig===a.s1){cls='bad crossed';dis=true;mark='ตัดออก'}
      return `<button type="button" class="lh-opt ${cls}" ${dis?'disabled':''} onclick="TGAT1Hub.flowPick(${k})"><span class="lh-L">${String.fromCharCode(65+k)}</span><span class="lh-o" ${/[฀-๿]/.test(it.opts[orig])?'':'lang="en"'}>${esc(it.opts[orig])}</span>${mark?`<span class="lh-mark">${mark}</span>`:''}</button>`}).join('');
    let fb='';if(ph==='hint')fb=`<div class="lh-hint" role="status"><b>ยังไม่ใช่ ลองคิดอีกครั้ง</b><p>${esc(it.hint||'')}</p></div>`;
    if(ph==='fb'){const wr=Array.isArray(it.wrong)?it.wrong:[];const good=a.ok1||a.ok2;
      fb=`<div class="lh-fb ${a.ok1?'good':good?'mid':c.pre?'mid':'bad'}" role="status" tabindex="-1" id="lhFb"><b>${c.pre?(a.ok1?'เดาถูก!':'ไม่เป็นไร เดาผิดได้ เดี๋ยวจะได้เรียนเรื่องนี้'):a.ok1?'ถูกต้อง':a.ok2?'ถูกในครั้งที่สอง':a.dk?'ไม่เป็นไร นี่คือคำตอบและเหตุผล':'ยังไม่ถูก'}</b>
       <p><b>เหตุผล:</b> ${esc(it.why||'')}</p>
       ${wr.some(Boolean)?`<ul>${c.o.map((orig,k)=>orig!==ans&&wr[orig]?`<li><b>${String.fromCharCode(65+k)}</b> ${esc(it.opts[orig])} — ${esc(wr[orig])}</li>`:'').join('')}</ul>`:''}${aiButton('flow')}</div>`}
    const same=f.cards[f.i-1]&&f.cards[f.i-1].t==='q'&&getItem(f.cards[f.i-1])&&getItem(f.cards[f.i-1]).ctx===it.ctx&&it.ctx;
    const notYet=!f.day&&!c.pre&&!taughtBy(c,n)&&!MINI[refFam(c)];
    body=`<div class="st-eyebrow">${c.pre?'ลองเดาก่อน · ไม่คิดคะแนน':esc(PART_TH[c.part]||'ฝึกโจทย์')} · ${esc(def.t||'')}${it.origin?' · '+esc(it.origin):''}</div>${notYet?'<p class="lh-mini">ข้อนี้เป็นเรื่องที่ยังไม่ได้เรียน (จะได้เรียนในบทหลัง) ลองเดาได้เลย ไม่นับเป็นจุดอ่อน</p>':''}
      ${it.ctx?`<div class="lh-ctx" lang="en" tabindex="0" aria-label="บทอ่าน">${same?'<p class="lh-mini">บทเดิมจากข้อก่อนหน้า</p>':''}${esc(it.ctx)}</div>`:''}<h2 class="lh-stem" ${/[฀-๿]/.test(it.stem)?'':'lang="en"'}>${esc(it.stem)}</h2>
      ${c.pred&&a.pd&&a.pd!=='skip'?`<p class="lh-mini">${a.pok?'✓ ทายชนิดช่องว่างถูก':'ช่องนี้ต้องการ: '+esc((GAP_TH.find(x=>x[0]===c.pred)||['',''])[1])}</p>`:''}
      <div class="lh-opts">${optsHtml}</div>${ph==='q'?`<button type="button" class="lh-dk" onclick="TGAT1Hub.flowDK()">🤷 ไม่รู้ข้อนี้ (ดีกว่าเดา)</button>`:''}${fb}`;
    next=ph==='fb';}
  }else if(c.t==='recap'){
    const ws=(!f.day&&!f.remed)?(ch.words||[]).slice(0,f.compress?15:(ch.srs||SRS_DEFAULT)).map(wordObj).filter(Boolean):[];
    body=`<div class="st-eyebrow">สรุป</div><h1 class="st-title">${f.day?'ทบทวนครบแล้ว':f.remed?'ทบทวนครบแล้ว':'เก่งมาก! จบเนื้อหาบทที่ '+n}</h1>
      <p class="lh-p">ตอบถูกตั้งแต่ครั้งแรก <b>${f.k}/${f.t}</b></p>
      ${ws.length?`<h2 class="lh-h">ศัพท์ของวันนี้</h2><div class="lh-vocab-words">${ws.map(w=>`<span class="lh-vocab-word"><b lang="en">${esc(w.w)}</b><small>${esc(w.th)}</small></span>`).join('')}</div>`:''}`;
    nextLabel=f.day?'บันทึกและจบวันนี้ →':f.remed?'เสร็จ ไปสอบใหม่ →':'บันทึกและไปแบบทดสอบท้ายบท →';
    if(!f.day&&!f.remed)body+='<p class="lh-mini">พัก 3–5 นาทีก่อนทำแบบทดสอบท้ายบท</p>';
  }
  const parts=f.day?[]:[...new Set(f.cards.map(z=>z.part).filter(p=>p&&p!=='open'&&p!=='recap'))];
  el.innerHTML=`<div class="lh-top"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.pause()">พักไว้ก่อน (บันทึกแล้ว)</button><span class="lh-count">${f.i+1} / ${f.n0||f.cards.length}${f.n0&&f.cards.length>f.n0?` <small>+${f.cards.length-f.n0} ข้อทบทวน</small>`:''}</span></div>
   ${parts.length>1?`<ol class="lh-parts" aria-label="ส่วนของบท">${parts.map(p=>`<li class="${p===c.part?'now':''}">${esc(PART_TH[p]||p)}</li>`).join('')}</ol>`:''}
   <section class="st-card lh-q lh-flow" aria-live="polite">${bar(f.i/f.cards.length*100,'ความคืบหน้าบทเรียน')}${body}
   <div class="lh-actions">${f.i>0&&!flowGradable(c)?`<button type="button" class="st-btn ghost small" onclick="TGAT1Hub.flowBack()">← ย้อนกลับ</button>`:''}${next?`<button type="button" class="st-btn" id="lhNext" onclick="TGAT1Hub.flowNext()">${nextLabel}</button>`:''}</div></section>`;
  if(focusFb){const fbEl=D.getElementById('lhFb')||D.getElementById('lhNext');if(fbEl)try{fbEl.scrollIntoView({block:'nearest'});if(fbEl.id==='lhFb')fbEl.focus({preventScroll:true})}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}}
  if(c.t==='g'&&c.g==='typed'&&!a.done){const inp=D.getElementById('lhTyped');if(inp)try{inp.focus({preventScroll:true})}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}}
}
function showRun(){const r=st().active;if(!r)return renderHub();if(r.items.some(x=>x.src==='bank')&&!bankReady())return withBank(showRun);renderRun();scrollTop()}
function renderRun(){
  const el=app(),cu=current();if(!el||!cu)return renderHub();
  const {r,item,a}=cu;if(!item){r.items.splice(r.i,1);if(!r.items.length){st().active=null;save();return renderHub()}r.i=Math.min(r.i,r.items.length-1);save();return renderRun()}
  chrome(runTitle(r));const o=r.items[r.i].o;const def=conceptDef(r.items[r.i].c||item.c);
  const optsHtml=o.map((orig,k)=>`<button type="button" class="lh-opt ${a.s1===orig?'sel':''}" aria-pressed="${a.s1===orig?'true':'false'}" onclick="TGAT1Hub.pick(${k})"><span class="lh-L">${String.fromCharCode(65+k)}</span><span class="lh-o" ${/[฀-๿]/.test(item.opts[orig])?'':'lang="en"'}>${esc(item.opts[orig])}</span></button>`).join('');
  const confHtml=(needConf(r)&&!a.dk&&Number.isInteger(a.s1))?`<div class="lh-conf" role="group" aria-label="ความมั่นใจในคำตอบนี้"><span>มั่นใจแค่ไหน?</span>${[['sure','มั่นใจ'],['some','ค่อนข้างมั่นใจ'],['not','ไม่มั่นใจ']].map(([v,t])=>`<button type="button" class="lh-chip ${a.cf===v?'on':''}" aria-pressed="${a.cf===v}" onclick="TGAT1Hub.conf('${v}')">${t}</button>`).join('')}</div>`:'';
  const canNext=Number.isInteger(a.s1)&&(!needConf(r)||a.cf||a.dk);const prev=r.items[r.i-1];const same=prev&&getItem(prev)&&item.ctx&&getItem(prev).ctx===item.ctx;
  el.innerHTML=`<div class="lh-top"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.pause()">พักไว้ก่อน (บันทึกแล้ว)</button><span class="lh-count">ข้อ ${r.i+1} / ${r.items.length}</span></div>
  <section class="st-card lh-q" aria-labelledby="lhQ">
    <div class="st-eyebrow">${esc(runTitle(r))} · ${esc(def.t||'')}</div>${bar((r.i)/r.items.length*100)}
    ${r.mode==='assess'?'<p class="lh-mini">แบบทดสอบ: ไม่มีคำใบ้ เฉลยพร้อมวิเคราะห์เมื่อทำครบทุกข้อ</p>':''}
    ${item.ctx?`<div class="lh-ctx" lang="en" tabindex="0" aria-label="บทอ่าน">${same?'<p class="lh-mini">บทเดิมจากข้อก่อนหน้า</p>':''}${esc(item.ctx)}</div>`:''}
    <h2 id="lhQ" class="lh-stem" ${/[฀-๿]/.test(item.stem)?'':'lang="en"'} tabindex="-1">${esc(item.stem)}</h2>
    <div class="lh-opts">${optsHtml}</div><button type="button" class="lh-dk ${a.dk?'on':''}" aria-pressed="${a.dk?'true':'false'}" onclick="TGAT1Hub.dk()">🤷 ไม่รู้ข้อนี้ (ดีกว่าเดา)</button>${confHtml}
    <div class="lh-actions">${canNext?`<button type="button" class="st-btn" id="lhNext" onclick="TGAT1Hub.next()">${r.i<r.items.length-1?'ข้อถัดไป →':'ส่งคำตอบและดูผล'}</button>`:''}</div>
  </section>`;
}
function renderRunDone(k,total){const el=app();el.innerHTML=`<section class="st-card lh-card" role="status"><div class="st-eyebrow">ฝึกเพิ่มเสร็จแล้ว</div><h1 class="st-title">ตอบถูก ${k}/${total}</h1><div class="lh-actions"><button type="button" class="st-btn" onclick="TGAT1Hub.open()">กลับหน้า Learning Hub</button></div></section>`;scrollTop()}
function renderAssessResult(rec,readonly){
  const el=app(),n=rec.u;chrome('ผลแบบทดสอบบทที่ '+n);
  const wrongRows=Array.isArray(rec.wrong)?rec.wrong:[];const bySk=rec.sk||{};
  const groups={};wrongRows.forEach((x,i)=>{const sk=conceptDef(x.c).skill||FAM_FALLBACK_SKILL(x.c);(groups[sk]=groups[sk]||[]).push({...x,i})});
  const verdict=rec.skip?(rec.pass?'ข้ามบทได้':'เรียนบทนี้ตามปกติ'):rec.pass?(rec.cond?'ผ่าน':'ผ่าน · ยอดเยี่ยม'):'ยังไม่ผ่าน';
  el.innerHTML=`<section class="st-card lh-card"><div class="st-eyebrow">แบบทดสอบท้ายบทที่ ${n}</div>
   <h1 class="st-title">${rec.k}/${rec.n} · ${rec.pct}% · ${verdict}</h1>${rec.ext?`<p class="lh-mini">รวมข้อเสริม ${rec.n-rec.ext} ข้อจากเรื่องที่พลาด (คะแนนช่วงแรกอยู่ใกล้เส้นผ่าน)</p>`:''}
   ${rec.skip?`<p class="lh-p">${rec.pass?'ทดสอบข้ามบทผ่าน (85% ขึ้นไป) บทนี้นับว่าเรียนจบแล้ว · ศัพท์ 20 คำของบทนี้เข้ารอบทบทวนในช่วงอุ่นเครื่องของบทถัดไป':'ยังไม่ถึง 85% ไม่เป็นไรเลย ไม่นับเป็นการสอบตก · กด “เรียนบทนี้” เพื่อเรียนตามปกติ แบบทดสอบท้ายบทจะใช้ข้อชุดใหม่'}</p>`:''}
   <p class="lh-p" ${rec.skip?'hidden':''}>${rec.pass?(n<UNITS?'ไปบทถัดไปได้แล้ว · ดูข้อที่พลาดและเคล็ดลับด้านล่างก่อน 2–3 นาที'+(rec.cond?' · เรื่องที่พลาดจะกลับมาเป็นโจทย์ใหม่แนวเดียวกันในบางบทถัดไป':''):'จบบทเรียนหลักทั้งหมดแล้ว ต่อไปคือช่วงสอบจำลองและทบทวน'):'ได้ต่ำกว่า '+COND_PCT+'% · ขั้นต่อไปคือทบทวนเฉพาะจุดที่พลาด (~10–15 นาที) แล้วสอบใหม่ด้วยโจทย์ชุดใหม่ · ถ้าวันนี้เหนื่อยแล้ว พักแล้วค่อยทำพรุ่งนี้ได้'}${rec.dk?' · มี '+rec.dk+' ข้อที่ตอบว่า “ไม่รู้”':''}</p>
   <h2 class="lh-h">ผลรายทักษะ</h2><ul class="lh-list">${Object.entries(bySk).map(([k,v])=>`<li><span>${esc(SKILL_TH[k]||k)}</span><small>${v.k}/${v.t}</small></li>`).join('')}</ul>
   ${wrongRows.length?`<h2 class="lh-h">วิเคราะห์ข้อผิด</h2>${rec.mis?`<p class="lh-mini">มี ${rec.mis} ข้อที่ตอบผิดทั้งที่มั่นใจ = อาจเข้าใจหลักคลาดเคลื่อน ให้อ่านเหตุผลของข้อนั้นช้า ๆ</p>`:''}
     ${Object.entries(groups).map(([sk,rows])=>`<div class="lh-errgroup"><h3 class="lh-h3">${esc(SKILL_TH[sk]||sk)} · พลาด ${rows.length} ข้อ</h3><p class="lh-mini"><b>วิธีแก้:</b> ${esc(ADVICE[sk]||ADVICE.mixed)}</p>
       ${rows.map(x=>`<div class="lh-example">${(()=>{const cx=x.ctx||((getItem({id:x.id,src:x.src})||{}).ctx)||'';return cx?`<details class="lh-ctxd"><summary>ดูบทสนทนา/บทอ่านของข้อนี้</summary><div class="lh-ctx" lang="en">${esc(cx)}</div></details>`:''})()}<p ${/[฀-๿]/.test(x.stem)?'':'lang="en"'}>${esc(x.stem)}</p><p><b>คุณตอบ:</b> <span lang="en">${esc(x.sel||'-')}</span> · <b>ที่ถูก:</b> <span lang="en">${esc(x.ans)}</span></p><p>${esc(x.why)}</p>${aiOn()&&!readonly?`<div class="lh-ai"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.ai('result',${x.i})">🤖 ให้ AI อธิบายเพิ่ม</button><div class="lh-ai-out" id="lhAiOut${x.i}" aria-live="polite"></div></div>`:''}</div>`).join('')}</div>`).join('')}`:'<p class="lh-p">ไม่มีข้อผิดเลย</p>'}
   <div class="lh-actions">${readonly?'':`<button type="button" class="st-btn" onclick="TGAT1Hub.continue()">${rec.pass?'ไปต่อ':rec.skip?'เรียนบทนี้':'เริ่มทบทวนจุดที่พลาด'}</button>`}${!readonly&&!rec.pass&&!rec.skip&&(unitState(n).att||[]).filter(x=>!x.pass&&!x.skip).length>=2&&unitState(n).st!=='done'?`<button type="button" class="st-btn ghost" onclick="TGAT1Hub.carry(${n})">ไปบทถัดไปก่อน (เก็บเรื่องนี้ไว้ทบทวนช่วงท้าย)</button>`:''}<button type="button" class="st-btn ghost" onclick="TGAT1Hub.open()">กลับหน้า Learning Hub</button></div></section>`;scrollTop();
}
function entryTitle(e){if(!e)return '';return e.k==='chapter'?'บทที่ '+e.n+' · '+((unitDef(e.n)||{}).title||''):e.label}
function checklistHtml(){
  const s=st(),L=LEDGER.day(),pi=planInfo(),e=curDay();const items=[];
  const d=today();const doneH=s.history.filter(h=>ymd(new Date(h.t))===d);
  const unitDoneToday=doneH.filter(h=>h.k==='unit'),dayDoneToday=doneH.find(h=>h.k==='day'||h.k==='mock');
  unitDoneToday.forEach(h=>items.push([true,'จบบทที่ '+h.u+' แล้ว (รวมแบบทดสอบท้ายบท)']));
  if(dayDoneToday)items.push([true,dayDoneToday.k==='mock'?'ทำสอบจำลองเต็มชุดแล้ว':'ทำวันทบทวนแล้ว']);
  if(!unitDoneToday.length&&!dayDoneToday&&e&&!(e.final&&e.d>d)){const f=s.flow;items.push([false,e.k==='chapter'?`บทที่ ${e.n}${f&&f.unit===e.n&&!f.day?' · ทำไปแล้ว '+f.i+'/'+f.cards.length+' การ์ด':''}${unitState(e.n).done.lesson?' · เหลือแบบทดสอบท้ายบท':''}`:e.label])}
  const due=dueWords(999).length;items.push([due===0,due?`ศัพท์ถึงรอบทบทวน ${due} คำ (อยู่ในช่วงอุ่นเครื่องของบทถัดไป)`:'ไม่มีศัพท์ค้างทบทวน']);
  const cardOpen=d>='2026-12-07'&&d<=pi.exam&&pi.daysLeft>0;
  const other=[['hub','ข้อ/การ์ดใน Learning Hub'],['words','ครั้งที่ทวนศัพท์'],['exam','ข้อในศูนย์สอบ'],['vocab','คำในคลังศัพท์'],['game','รอบเกม']].filter(([k])=>L[k]).map(([k,t])=>`${t} ${L[k]}`);
  return `<section class="st-card lh-card" aria-labelledby="lhChk"><h2 id="lhChk">วันนี้ (${esc(thDate(d))})</h2><ul class="lh-check">${items.map(([ok,t])=>`<li class="${ok?'ok':''}"><span aria-hidden="true">${ok?'✓':'○'}</span>${esc(t)}</li>`).join('')}
    ${pi.studied>=3&&(!s.plan.backupAt||now()-s.plan.backupAt>7*DAY)&&typeof W.studioExportAll==='function'?`<li><span aria-hidden="true">○</span>สำรองข้อมูลการเรียน (ข้อมูลอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น แนะนำสัปดาห์ละครั้ง) <button type="button" class="lh-link" onclick="studioExportAll()">ดาวน์โหลดไฟล์สำรอง</button></li>`:''}
    ${cardOpen?`<li class="${s.plan.card?'ok':''}"><span aria-hidden="true">${s.plan.card?'✓':'○'}</span>${s.plan.card?'พิมพ์บัตรที่นั่งสอบแล้ว':'พิมพ์บัตรที่นั่งสอบที่ mytcas.com (พิมพ์ได้ 7 ธ.ค. 2569 – 1 ก.พ. 2570) และดูสนามสอบ'}${s.plan.card?'':' <button type="button" class="lh-link" onclick="TGAT1Hub.cardDone()">พิมพ์แล้ว</button>'}</li>`:''}</ul>
    ${other.length?`<p class="lh-mini">บันทึกวันนี้ทั้งแอป: ${esc(other.join(' · '))}</p>`:'<p class="lh-mini">ยังไม่มีกิจกรรมวันนี้</p>'}<p class="lh-mini">เรียนมาแล้วรวม ${pi.studied} วัน</p></section>`;
}
function calendarHtml(){const cal=calendar();if(!cal.length)return '';const t=today();
  const kind=e=>e.k==='chapter'?'':e.k==='mock'?'mock':e.k==='buffer'?'buf':e.k==='rest'?'rest':'rev';
  return `<ol class="lh-cal">${cal.map(({e,d})=>`<li class="${kind(e)} ${d===t?'now':''}"><span>${esc(thDate(d))}</span><b>${esc(entryTitle(e))}</b></li>`).join('')}<li class="exam"><span>${esc(thDate(examDate()))}</span><b>วันสอบ TGAT · ${esc(planInfo().examTime)} น.</b></li></ol>`}
function libraryHtml(){
  const s=st();const rows=DAYS.map((d,i)=>({d,i})).filter(({d,i})=>i<s.pos&&(d.k==='chapter'||d.k==='mock'));
  return `<details class="st-card lh-card lh-lib"><summary><b>ห้องสมุดบทเรียน</b> <small>เปิดดูบทที่เรียนแล้ว ${rows.filter(x=>x.d.k==='chapter').length} บท</small></summary>
   ${rows.length?`<div class="lh-units">${rows.map(({d,i})=>`<button type="button" class="lh-unit done" onclick="TGAT1Hub.openDay(${i})"><span class="lh-unit-n" aria-hidden="true">${d.k==='chapter'?d.n:'★'}</span><span class="lh-unit-t">${esc(d.k==='chapter'?d.n+'. '+((unitDef(d.n)||{}).title||''):d.label)}${d.k==='chapter'&&unitState(d.n).carried?' · ทบทวนต่อช่วงท้าย':''}</span><span class="lh-sr"> · เสร็จแล้ว</span></button>`).join('')}</div>`:'<p class="lh-mini">บทที่เรียนจบแล้วจะมาอยู่ที่นี่ เปิดทวนเนื้อหา ศัพท์ และผลสอบได้ทุกเมื่อ</p>'}</details>`}
/* C11 — คลังสำนวน Speaking: จัดกลุ่มตามฟังก์ชัน (ตอบรับ / ปฏิเสธ / ขอ / ความเห็น / แผน / กำลังใจ / สังคม / เล่าข่าว)
   ทุกสำนวนมี “คำตอบมาตรฐาน” หนึ่งประโยคที่ใช้ได้จริง และลิงก์ไปข้อสอบในคลังที่ถามสำนวนนั้น */
function idiomLibraryHtml(){
  const D=W.TGAT1_IDIOMS;if(!D||!Array.isArray(D.entries)||!D.entries.length)return '';
  const byFn={};D.entries.forEach(e=>{(byFn[e.fn]=byFn[e.fn]||[]).push(e)});
  const fns=(D.functions||[]).filter(f=>byFn[f.id]&&byFn[f.id].length);
  const linked=D.entries.filter(e=>e.item).length;
  return `<details class="st-card lh-card lh-plan"><summary><b>คลังสำนวน Speaking</b> <small>${D.entries.length} สำนวน · ${fns.length} ฟังก์ชัน · คำตอบมาตรฐานทุกสำนวน · ตรงข้อสอบ ${linked} ข้อ</small></summary>
   <p class="lh-mini">วิธีใช้: อ่าน “สถานการณ์” ทางซ้ายแล้วตอบด้วยประโยคมาตรฐานทางขวา — สำนวนคือคำตอบที่เจ้าของภาษาพูดจริง ไม่ใช่การแปลตรงตัว</p>
   ${fns.map(f=>`<details class="lh-plan"><summary><b>${esc(f.th)}</b> <small>${byFn[f.id].length} สำนวน · ${esc(f.en||'')}</small></summary>
     <ul class="lh-list">${byFn[f.id].map(e=>`<li><span><b lang="en">${esc(e.idiom)}</b> — ${esc(e.th)}<br><small lang="en">Q: ${esc(e.ex.q)}</small></span><small lang="en">${esc(e.resp)}</small><small>${esc(e.respTh)}${e.item?' · ข้อสอบ '+esc(e.item):''}</small></li>`).join('')}</ul>
   </details>`).join('')}
   <p class="lh-mini">ตรวจความสอดคล้อง: <button type="button" class="lh-link" onclick="TGAT1Hub.idiomBank()">ดูรายงานคลังสำนวน</button></p></details>`;
}
/* C12 — บทอ่านเสริม 150–200 คำ (12 บท 12 แนว) · ข้อคิดขั้นสูง ≥3 ข้อ/บท
   แยกจากชุดสอบ 60 ข้อ จึงไม่กระทบ blueprint · ตรวจคำตอบทันทีพร้อมคำอธิบาย ไม่บันทึกลงสถานะ */
let RST=null,SST=null;
function readingExtraHtml(){
  const D=W.TGAT1_READING;if(!D||!Array.isArray(D.passages)||!D.passages.length)return '';
  const items=D.passages.reduce((a,p)=>a+(p.items||[]).length,0);
  const ho=D.passages.reduce((a,p)=>a+(p.items||[]).filter(x=>/^rc\.(inference|attitude|purpose|tone)$/.test(x.type)).length,0);
  return `<details class="st-card lh-card lh-plan"><summary><b>บทอ่านเสริม 150–200 คำ</b> <small>${D.passages.length} บท · ${D.passages.length} แนว · ${items} ข้อ (ข้ออนุมาน/ทัศนคติ/จุดประสงค์ ${ho} ข้อ)</small></summary>
   <p class="lh-mini">บทอ่านนอกชุดสอบ 60 ข้อ: อ่านจบใน 2 นาทีแล้วตอบ 5 ข้อ ทุกข้อมีคำอธิบายภาษาไทย — เน้นข้ออนุมานและทัศนคติผู้เขียนซึ่งเป็นข้อที่พลาดบ่อย</p>
   <ul class="lh-list">${D.passages.map(p=>`<li><span>${esc(p.genre)} · <b lang="en">${esc(p.title)}</b></span><small>${String(p.text).split(/\s+/).length} คำ · ${(p.items||[]).length} ข้อ</small><small><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.reading('${esc(p.id)}')">อ่านบทนี้ →</button></small></li>`).join('')}</ul></details>`;
}
function sightDoc(){try{return W.TGAT1_SIGHT_CONTEXT||null}catch(_){return null}}
function sightById(id){const D=sightDoc();if(!D||!Array.isArray(D.passages))return null;return D.passages.find(p=>p.id===String(id))||null}
function sightHtml(){
  const D=sightDoc();if(!D||!Array.isArray(D.passages)||!D.passages.length)return '';
  const words=D.sentences?D.sentences.length:0;
  return `<details class="st-card lh-card lh-plan"><summary><b>คำผ่านตาในบริบท</b> <small>${D.passages.length} บทอ่าน · ${words} ประโยคตัวอย่าง</small></summary>
   <p class="lh-mini">ทุกคำผ่านตา 1,080 คำมีที่ให้เจอในแอปแล้ว: ${D.passages.length} บทอ่านสั้นที่ใช้คำเหล่านี้อย่างเป็นธรรมชาติ + ประโยคตัวอย่างเฉพาะคำอีก ${words} ประโยค (ประโยคพวกนี้ยังแสดงบนบัตรคำศัพท์ทุกใบด้วย)</p>
   <ul class="lh-list">${D.passages.map(p=>`<li><span><b lang="en">${esc(p.title)}</b></span><small>${String(p.text).split(/\s+/).length} คำ · คำเป้าหมาย ${(p.words||[]).length} คำ</small><small><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.sight('${esc(p.id)}')">อ่านบทนี้ →</button></small></li>`).join('')}</ul></details>`;
}
function renderSight(){
  const el=app(),p=SST&&sightById(SST.pid);if(!el)return;
  if(!p){el.innerHTML=`<div class="st-card lh-card" role="alert">ไม่พบบทอ่านนี้</div>`;return}
  chrome('คำผ่านตาในบริบท');
  const C=sightDoc();
  const words=(p.words||[]).map(w=>({w,th:(C&&C.sentence(w)?'':''),obj:wordObj(w)})).filter(x=>x.obj);
  let html=String(p.text||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const targets=(p.words||[]).slice().sort((a,b)=>b.length-a.length);
  if(targets.length){
    const rx=new RegExp('(^|[^A-Za-z])('+targets.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(s|es|ed|d|ing|ly|er|est|ies|ied)?(?![A-Za-z])','gi');
    html=html.replace(rx,(m,pre,w)=>pre+'<b class="lh-sw">'+w+'</b>');
  }
  el.innerHTML=`<div class="lh-top"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.open()">← Learning Hub</button></div>
   <section class="st-card lh-card">
    <div class="st-eyebrow">คำผ่านตาในบริบท · ${String(p.text).split(/\s+/).length} คำ</div>
    <h1 class="st-title" lang="en">${esc(p.title)}</h1>
    <p class="lh-p" lang="en" style="line-height:1.9">${html}</p>
   </section>
   <section class="st-card lh-card">
    <h2 class="lh-h">คำเป้าหมายในบทนี้ ${(p.words||[]).length} คำ</h2>
    <ul class="lh-wlist">${words.map(x=>`<li><b lang="en">${esc(x.w)}</b> ${spkBtn(x.w)} <span>${esc(x.obj.th||'')}</span>${sightSentence(x.w)?`<small lang="en">${esc(sightSentence(x.w))}</small>`:''}</li>`).join('')}</ul>
   </section>`;
}
function readingById(id){const D=W.TGAT1_READING;if(!D||!Array.isArray(D.passages))return null;return D.passages.find(p=>p.id===id)||null}
function renderReading(){
  const el=app(),p=RST&&readingById(RST.pid);if(!el)return;
  if(!p){el.innerHTML=`<div class="st-card lh-card" role="alert">ไม่พบบทอ่านนี้</div>`;return}
  chrome('บทอ่านเสริม · '+p.genre);
  const answered=Object.keys(RST.ans).length;
  const right=p.items.filter(it=>RST.ans[it.id]===it.answer).length;
  el.innerHTML=`<div class="lh-top"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.open()">← Learning Hub</button></div>
   <section class="st-card lh-card">
    <div class="st-eyebrow">${esc(p.genre)} · ${String(p.text).split(/\s+/).length} คำ</div>
    <h1 class="st-title" lang="en">${esc(p.title)}</h1>
    <p class="lh-p" lang="en" style="line-height:1.9">${esc(p.text)}</p>
   </section>
   <section class="st-card lh-card">
    <h2 class="lh-h">คำถาม 5 ข้อ <small>ตอบแล้ว ${answered}/${p.items.length}${answered?' · ถูก '+right:''}</small></h2>
    ${p.items.map((it,i)=>{const pick=RST.ans[it.id];const done=pick!=null;const ok=done&&pick===it.answer;
      return `<div class="lh-q" style="margin:14px 0 22px">
       <p class="lh-p"><b>${i+1}.</b> <span lang="en">${esc(it.prompt)}</span> <small>· ${esc(it.type.replace('rc.',''))}</small></p>
       <div class="lh-actions" style="flex-wrap:wrap;gap:8px">${it.options.map((o,j)=>`<button type="button" class="st-btn ghost small" ${done?'disabled':''} style="${done&&j===it.answer?'border-color:#2e7d32;font-weight:700':(done&&j===pick?'border-color:#c62828':(done?'opacity:.55':''))}" onclick="TGAT1Hub.readPick('${esc(it.id)}',${j})">${String.fromCharCode(65+j)}. <span lang="en">${esc(o)}</span></button>`).join('')}</div>
       ${done?`<p class="lh-mini" style="margin-top:8px"><b>${ok?'ถูกต้อง':'ยังไม่ถูก'}</b> — ${esc(it.why)}</p>`:`<p class="lh-mini" style="margin-top:6px">คำใบ้: ${esc(it.hint)}</p>`}
      </div>`}).join('')}
    ${answered===p.items.length?`<div class="lh-actions"><button type="button" class="st-btn" onclick="TGAT1Hub.reading('${esc(p.id)}')">ทำบทนี้อีกครั้ง</button><button type="button" class="st-btn ghost" onclick="TGAT1Hub.open()">กลับ Hub</button></div>`:''}
   </section>`;
}
function renderHub(){
  const el=app();if(!el)return;chrome('Learning Hub · เรียนวันละบท');
  if(!cur()||!PD()){el.innerHTML=`<div class="st-card lh-card" role="alert">โหลดเนื้อหา Learning Hub ไม่สำเร็จ ลองรีเฟรชหน้า</div>`;return}
  const s=st();if(s.pending)verifyPending();s.returnTo=false;recompute();save();updateBanner();
  const a=nextAction(),pi=planInfo(),e=curDay();const ch=e&&e.k==='chapter'?unitDef(e.n):null;const doneCh=Object.values(s.units).filter(x=>x.st==='done').length;
  const nx=DAYS[s.pos+1];const wait=a.k==='wait';
  const con=Object.entries(s.concepts).filter(([c,r])=>isObj(r)&&r.a>0);const bySk={};con.forEach(([c,r])=>{const sk=conceptDef(c).skill||FAM_FALLBACK_SKILL(c);bySk[sk]=bySk[sk]||{a:0,k:0};bySk[sk].a+=r.a;bySk[sk].k+=r.k});
  const wordsLearned=Object.values(s.words).filter(r=>isObj(r)&&r.k>0).length;
  const actBtn=a.k==='finished'?`<button type="button" class="st-btn lh-cta" onclick="TGAT1Hub.open()" disabled><span>เรียนครบแล้ว</span></button>`:wait?`<button type="button" class="st-btn lh-cta" onclick="TGAT1Hub.open()" disabled><span>วันนี้ครบแล้ว</span><small>พักผ่อนได้เลย</small></button>`:`<button type="button" class="st-btn lh-cta" onclick="TGAT1Hub.continue()" ${READONLY?'disabled':''}><span>เรียนต่อ</span><small>${esc(describe(a))}</small></button>`;
  el.innerHTML=`
  ${NOTICE?`<div class="st-card lh-notice" role="status">${esc(NOTICE)}</div>`:''}
  <section class="st-card lh-main" aria-labelledby="lhHeroTitle">
    <div class="st-eyebrow">เรียนวันละบท · กดปุ่มเดียวแล้วเรียนต่อได้เลย</div>
    <h1 class="st-title" id="lhHeroTitle">${wait?'วันนี้ทำครบแล้ว':e?esc(entryTitle(e)):'เรียนครบทั้งเส้นทางแล้ว'}</h1>
    <p class="st-subtitle">${ch?`Speaking: ${esc(ch.parts.s)} · Reading: ${esc(ch.parts.r)} · ศัพท์ใหม่ ${ch.srs||SRS_DEFAULT} คำ + คำผ่านตา ${Math.max(0,ch.words.length-(ch.srs||SRS_DEFAULT))} · ~${ch.minutes} นาที`:wait?'พรุ่งนี้: '+esc(e.label):''}</p>
    <div class="lh-countdown"><b>อีก ${pi.daysLeft} วัน</b> ถึงวันสอบ (${esc(thDate(pi.exam))} · ${esc(pi.examTime)} น. · สอบด้วยกระดาษ)</div>
    <p class="lh-mini">${esc(pi.status)}</p>
    <div class="lh-progress-row"><span>ผ่านแล้ว <b>${doneCh}</b> / ${UNITS} บท · เรียนมาแล้ว ${pi.studied} วัน</span>${bar(doneCh/UNITS*100,'ความคืบหน้าบทเรียนหลัก')}</div>
    <div class="lh-next">${actBtn}</div>
    ${wait?`<p class="lh-mini">อยากทำต่อเลยก็ได้: <button type="button" class="lh-link" onclick="TGAT1Hub.ahead()">ทำของพรุ่งนี้ล่วงหน้า</button></p>`:(nx&&a.k!=='finished'?`<p class="lh-mini">ถัดไป: ${esc(entryTitle(nx))}</p>`:'')}
    ${e&&e.k==='buffer'&&!s.flow&&!wait?`<p class="lh-mini">วันนี้เป็นวันเผื่อ: ทบทวนสะสม ~45 นาที หรือ <button type="button" class="lh-link" onclick="TGAT1Hub.skipBuffer()">ใช้วันเผื่อไปเรียนบทถัดไป</button></p>`:''}
    ${a.k==='external'?`<p class="lh-mini">กำลังทำสอบจำลองในศูนย์สอบ ระบบจะนับเมื่อส่งข้อสอบ · <button type="button" class="lh-link" onclick="TGAT1Hub.cancelPending()">ยกเลิกไว้ก่อน</button></p>`:''}
  </section>
  ${checklistHtml()}
  <details class="st-card lh-card lh-plan"><summary><b>แผนการเรียนรายวันถึงวันสอบ</b> <small>วันสอบ ${esc(thDate(pi.exam))} · วันละ ${pi.minutes} นาที</small></summary>
    <p class="lh-mini">ค่าเริ่มต้น: TGAT (TGAT1–3) TCAS70 สอบวันเสาร์ 30 ม.ค. 2570 เวลา 13:00–16:00 น. ด้วยกระดาษ ตามปฏิทิน ทปอ. ที่สื่อการศึกษาหลายแห่งรายงาน · ตรวจซ้ำในบัตรที่นั่งสอบ ถ้าวันสอบของคุณต่างไป แก้ที่นี่ได้ ระบบจัดช่วงท้ายใหม่ให้ทันที</p>
    <label class="lh-field">วันสอบ <input type="date" id="lhExam" value="${esc(s.plan.exam||examDate())}"></label>
    <label class="lh-field">วันเริ่มเรียน <input type="date" id="lhStart" value="${esc(s.plan.start||today())}" max="${esc(today())}"></label>
    <label class="lh-field">เวลาเรียนต่อวัน <select id="lhMin">${[60,90,120,150,180].map(m=>`<option value="${m}" ${m===pi.minutes?'selected':''}>${m} นาที</option>`).join('')}</select></label>
    <div class="lh-actions"><button type="button" class="st-btn small" onclick="TGAT1Hub.savePlan()">บันทึกแผน</button></div>
    ${W.TGAT1FX?`<p class="lh-mini">แอนิเมชัน (ตามระบบ = ตามการตั้งค่าลดการเคลื่อนไหวของเครื่อง)</p>${W.TGAT1FX.controlHtml()}`:''}
    <p class="lh-mini">โครงสร้าง: ช่วงที่ 1 เรียน ${UNITS} บท (บทละ ~2 ชม.) + สอบจำลองเต็มชุด 2 ครั้ง + วันเผื่อ 3 วัน · ช่วงที่ 2 จัดอัตโนมัติจากวันสอบ: สอบจำลองอีก ${pi.tailMocks} ครั้งสลับวันทบทวนจุดอ่อน ${pi.tailReviews} วัน ทบทวนเบา ๆ และพักก่อนสอบ 1 วัน</p>
    <h3 class="lh-h3">ตารางจากวันนี้</h3><div class="lh-actions"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.ics()">เพิ่มตารางลงปฏิทินมือถือ (.ics มีแจ้งเตือน)</button></div>${calendarHtml()}</details>
  ${libraryHtml()}
  ${idiomLibraryHtml()}
  ${readingExtraHtml()}${sightHtml()}
  <div class="lh-grid">
    <section class="st-card lh-card" aria-labelledby="lhS"><h2 id="lhS">ผลรายทักษะ</h2>
      ${Object.keys(bySk).length?`<ul class="lh-list">${Object.entries(bySk).map(([k,v])=>`<li><span>${esc(SKILL_TH[k]||k)}</span><small>${Math.round(v.k/v.a*100)}% · ${v.a} ข้อ</small></li>`).join('')}</ul>`:'<p class="lh-mini">จะแสดงหลังเริ่มเรียน</p>'}
      <p class="lh-mini">ศัพท์ที่เรียนแล้ว ${wordsLearned} คำ${s.stats.qtype&&s.stats.qtype.n?` · จับชนิดคำถาม Q–R ถูก ${Math.round(s.stats.qtype.ok/s.stats.qtype.n*100)}%`:''}${s.stats.pred&&s.stats.pred.n?` · ทายชนิดช่องว่างถูก ${Math.round(s.stats.pred.ok/s.stats.pred.n*100)}%${s.stats.pred.vocab+s.stats.pred.struct?` (ข้อที่ผิด: ปัญหาศัพท์ ${s.stats.pred.vocab} · ปัญหาโครงสร้าง ${s.stats.pred.struct})`:''}`:''}</p></section>
    <section class="st-card lh-card" aria-labelledby="lhA"><h2 id="lhA">แบบทดสอบล่าสุด</h2>
      ${s.assessments.length||Object.keys(s.mocks).length?`<ul class="lh-list">${s.assessments.slice(-4).reverse().map(x=>`<li><span>บทที่ ${x.u}</span><small>${x.k}/${x.n} · ${x.pct}%</small></li>`).join('')}${Object.entries(s.mocks).map(([k,m])=>`<li><span>สอบจำลองครั้งที่ ${mockNo(k)} (ชุด ${k})</span><small>${m.score}/${m.total}</small></li>`).join('')}</ul>`:'<p class="lh-mini">ยังไม่มี</p>'}
      ${Object.keys(s.errors).length?'<button type="button" class="st-btn ghost small" onclick="TGAT1Hub.showErrors()">ดูข้อที่เคยผิด</button>':''}</section>
    <section class="st-card lh-card" aria-labelledby="lhX"><h2 id="lhX">ห้องฝึกเพิ่ม (ไม่บังคับ)</h2><p class="lh-mini">ทุกอย่างที่จำเป็นอยู่ในปุ่ม “เรียนต่อ” แล้ว ห้องเหล่านี้ไว้ฝึกเพิ่มเมื่อมีเวลา และระบบนับลงบันทึกของวันนี้ด้วย</p>
      <div class="lh-actions"><button type="button" class="st-btn ghost small" onclick="studioNav('vocab')">คลังศัพท์</button><button type="button" class="st-btn ghost small" onclick="studioNav('exam')">ศูนย์สอบ</button><button type="button" class="st-btn ghost small" onclick="studioNav('game')">เกม</button><button type="button" class="st-btn ghost small" onclick="studioNav('reading')">Reading Lab</button></div></section>
  </div>
  ${aiSettingsHtml()}`;
}
function openDay(i){const d=DAYS[i];const s=st();if(!d)return;if(i>s.pos){toast('ยังไม่ถึงวันนี้ · ทำตามลำดับเพื่อให้ทบทวนได้ถูกจังหวะ');return}
  if(d.k==='chapter')return openUnit(d.n);if(d.k==='mock')return showMockDay(d);if(i===s.pos)return cont();toast('ทำวันนี้ไปแล้ว')}
function openUnit(n){
  if(locked(n)){toast('บทที่ '+n+' ยังไม่ถึง · ต้องจบบทที่ '+st().unit+' ก่อน');return}
  const el=app(),ch=unitDef(n),us=unitState(n);if(!el||!ch)return;chrome('บทที่ '+n);
  const ws=(ch.words||[]).map(wordObj).filter(Boolean);
  el.innerHTML=`<div class="lh-top"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.open()">← Learning Hub</button></div>
  <section class="st-card lh-card"><div class="st-eyebrow">บทที่ ${n} · ~${ch.minutes} นาที</div><h1 class="st-title">${esc(ch.title)}</h1><p class="st-subtitle">${esc(ch.en||'')}</p>
   <h2 class="lh-h">ในบทนี้</h2><ol class="lh-reason"><li>ไวยากรณ์: ${esc(ch.parts.g)}</li><li>ศัพท์ใหม่ ${ch.srs||SRS_DEFAULT} คำ + คำผ่านตา ${Math.max(0,ws.length-(ch.srs||SRS_DEFAULT))} คำ + วลี ${ch.phrases.length}</li><li>Speaking: ${esc(ch.parts.s)}</li><li>Reading: ${esc(ch.parts.r)}</li></ol>
   <h2 class="lh-h">เป้าหมาย</h2><ul class="lh-obj">${(ch.obj||[]).filter(Boolean).map(o=>`<li>${esc(o)}</li>`).join('')}</ul>
   <div class="lh-vocab-words">${ws.map(x=>`<button type="button" class="lh-vocab-word" onclick="window.TGAT1VocabularyLab&&TGAT1VocabularyLab.openTerm(${esc(JSON.stringify(x.w))})"><b lang="en">${esc(x.w)}</b><small>${esc(x.th)}</small></button>`).join('')}</div>
   <h2 class="lh-h">ขั้นตอน</h2><ol class="lh-steplist">${[['lesson','บทเรียน (เนื้อหา · ศัพท์ · มินิเกม · บทสนทนา · การอ่าน)'],['assess','แบบทดสอบท้ายบท ~20 ข้อ']].map(([k,t])=>{const r=us.res[k];const can=us.st==='done'||k==='lesson'||us.done.lesson;
     return `<li class="${us.done[k]?'done':''}"><div><b>${t}</b>${r?`<small>ผล: ${r.score}/${r.total} (${r.pct}%)</small>`:''}</div>${can?`<button type="button" class="st-btn small ${us.done[k]?'ghost':''}" onclick="TGAT1Hub.step(${n},'${k}')">${us.done[k]?(k==='assess'?'ดูผล':'เรียนอีกครั้ง'):'เริ่ม'}</button>`:'<small>เรียนบทเรียนก่อน</small>'}</li>`}).join('')}</ol>
   ${us.st==='done'?`<button type="button" class="st-btn ghost" onclick="TGAT1Hub.extra(${n})">ฝึกเพิ่ม 8 ข้อ (ไม่กระทบความคืบหน้า)</button>`:''}
   ${us.att&&us.att.length?`<h2 class="lh-h">ประวัติแบบทดสอบ</h2><ul class="lh-list">${us.att.slice(-5).reverse().map(x=>`<li><span>${fmtDate(x.t)}</span><small>${x.k}/${x.n} · ${x.pct}% · ${x.pass?'ผ่าน':'ยังไม่ผ่าน'}</small></li>`).join('')}</ul>`:''}
  </section>`;scrollTop();
}
function stepEntry(n,key){const us=unitState(n);
  if(us.done[key]&&key==='assess'){const last=(us.att||[]).filter(x=>x.pass).slice(-1)[0];if(last)return renderAssessResult(last,true)}
  if(us.st==='done'&&key==='lesson'){if(st().flow){showFlow();return}return withBank(()=>{const s=st();s.flow={unit:n,cards:buildLesson(n),i:0,ans:{},k:0,t:0,rq:0,remed:false,again:true,started:now()};save();showFlow()})}
  return startStep(n,key)}
function showErrors(){
  const el=app(),s=st();chrome('ข้อที่เคยผิด');
  const rows=Object.values(s.errors).filter(e=>e&&(e.wrong>0||e.type==='guess')).sort((a,b)=>(b.last||0)-(a.last||0)).slice(0,60);
  el.innerHTML=`<div class="lh-top"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.open()">← Learning Hub</button></div>
  <section class="st-card lh-card"><div class="st-eyebrow">ERROR MEMORY</div><h1 class="st-title">ข้อที่เคยผิด</h1><p class="lh-p">ระบบไม่ถามข้อเดิมซ้ำทันที แต่จะนำโจทย์แนวเดียวกันกลับมาฝึกในบทถัด ๆ ไปตามจังหวะ</p>
  ${rows.length?`<ul class="lh-err">${rows.map(e=>`<li><div><b>${esc(conceptDef(e.c).t)}</b><small>${esc(TYPE_TH[e.type]||'')} · ผิด ${e.wrong}/${e.att} ครั้ง</small></div><p><b>ตอบ:</b> <span lang="en">${esc(e.sel)}</span> · <b>ที่ถูก:</b> <span lang="en">${esc(e.ans)}</span></p><p>${esc(e.why)}</p></li>`).join('')}</ul>`:'<p class="lh-mini">ยังไม่มีข้อผิด</p>'}</section>`;scrollTop();
}

/* ------------------------------------------------------------------ integration with the rest of the app */
function updateBanner(){
  let el=D.getElementById('lhReturn');const s=HS;const show=!!(s&&(s.pending||s.returnTo))&&page()!=='hub';
  if(!show){if(el&&!el.hidden){el.hidden=true;D.body.classList.remove('lh-has-return')}return}
  if(!el){el=D.createElement('div');el.id='lhReturn';el.className='lh-return';el.setAttribute('role','region');el.setAttribute('aria-label','กลับไป Learning Hub');D.body.appendChild(el)}
  const html=`<span>${s.pending?'กำลังทำสอบจำลองจาก Learning Hub':'บันทึกผลใน Learning Hub แล้ว'}</span><button type="button" onclick="TGAT1Hub.open()">กลับ Learning Hub</button>`;
  if(el.dataset.h!==html){el.innerHTML=html;el.dataset.h=html}
  if(el.hidden!==false)el.hidden=false;D.body.classList.add('lh-has-return');
}
// Home: the Learning Hub card is the first thing on the page — the one button.
function homeCard(){
  const el=app();if(!el||page()!=='home'||!cur()||!PD()||el.querySelector('#lhHomeCard'))return;
  const s=st(),e=curDay(),a=nextAction(),pi=planInfo(),done=Object.values(s.units).filter(x=>x.st==='done').length;const wait=a.k==='wait';
  const html=`<section class="st-card lh-homecard" id="lhHomeCard" aria-labelledby="lhHomeT"><div><div class="st-eyebrow">LEARNING HUB · อีก ${pi.daysLeft} วันถึงวันสอบ (${esc(thDate(pi.exam))}) · ผ่านแล้ว ${done}/${UNITS} บท</div><h2 id="lhHomeT">${wait?'วันนี้ทำครบแล้ว':e?'วันนี้: '+esc(entryTitle(e)):'เรียนครบทั้งเส้นทางแล้ว'}</h2><p class="lh-mini">${esc(wait||!e||a.k==='step'?pi.status:describe(a))}</p>${bar(done/UNITS*100)}</div><div class="lh-homecard-actions"><button type="button" class="st-btn lh-cta" onclick="TGAT1Hub.continue()"><span>เรียนต่อ</span><small>ปุ่มเดียว เรียนทั้งแอป</small></button><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.open()">ดูแผนและเส้นทาง</button></div></section>`;
  el.insertAdjacentHTML('afterbegin',html);
  homeFocus();
  // one button: the hero's own call to action continues the path, and the other home planners move into a
  // collapsed "more practice" section at the bottom (still available, no longer competing)
  try{const hb=el.querySelector('.dash-hero-actions button, .dash-hero-actions a');if(hb&&!hb.dataset.lh){hb.dataset.lh='1';hb.setAttribute('onclick','TGAT1Hub.continue()');hb.innerHTML='เรียนต่อ <span aria-hidden="true">→</span>'}
    const extra=['#tgAdaptiveCard','#tg36CoachPlan'].map(q=>el.querySelector(q)).filter(Boolean);
    if(extra.length&&!el.querySelector('#lhMorePractice')){const d=D.createElement('details');d.id='lhMorePractice';d.className='st-card lh-card';d.innerHTML='<summary><b>ห้องฝึกเพิ่มและแผนฝึกอื่น ๆ (ไม่บังคับ)</b></summary>';extra.forEach(x=>d.appendChild(x));el.appendChild(d)}}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}
}
// The home page keeps only the Learning Hub card, the hero (without its own buttons) and the key numbers. The other
// planners/shortcuts (coach, adaptive plan, smart daily plan, quick tiles, streak calendar, focus card, shelves) are
// hidden by a body class, so they stay hidden even when they redraw themselves; one tap shows them again.
function homeAll(){try{return localStorage.getItem('tgat1_home_all_v1')==='1'}catch(_){return false}}
function homeFocus(){const el=app();if(!el)return;D.body.classList.toggle('lh-home-focus',!homeAll()&&page()==='home');
  if(!el.querySelector('#lhHomeMore')){el.insertAdjacentHTML('beforeend',`<div class="lh-home-more" id="lhHomeMore"><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.homeAll()">${homeAll()?'ซ่อนเครื่องมืออื่น (เหลือปุ่มเดียว)':'แสดงเครื่องมือฝึกอื่น ๆ (ไม่บังคับ)'}</button></div>`)}}
function toggleHomeAll(){try{localStorage.setItem('tgat1_home_all_v1',homeAll()?'0':'1')}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}const b=D.getElementById('lhHomeMore');if(b)b.remove();homeFocus()}
function analyticsCard(){
  const el=app();if(!el||page()!=='analytics'||!cur()||el.querySelector('#lhAnalytics'))return;
  const s=st(),done=Object.values(s.units).filter(x=>x.st==='done').length,acc=s.stats.answered?Math.round(s.stats.correct/s.stats.answered*100):0;
  const head=el.firstElementChild;const html=`<section class="st-card lh-card" id="lhAnalytics" aria-labelledby="lhAnT"><div class="st-eyebrow">LEARNING HUB</div><h2 id="lhAnT">ความคืบหน้าเส้นทางรายวัน</h2><div class="lh-kpis"><div><b>${done}/${UNITS}</b><small>บทที่ผ่าน</small></div><div><b>${Object.keys(s.mocks).length}</b><small>สอบจำลองที่ทำ</small></div><div><b>${s.stats.answered?acc+'%':'—'}</b><small>ความแม่นยำใน Hub (${s.stats.answered} ข้อ)</small></div><div><b>${Object.values(s.words).filter(r=>isObj(r)&&r.k>0).length}</b><small>ศัพท์ที่เรียนแล้ว</small></div></div><button type="button" class="st-btn ghost small" onclick="TGAT1Hub.open()">เปิด Learning Hub</button></section>`;
  if(head)head.insertAdjacentHTML('afterend',html);else el.insertAdjacentHTML('afterbegin',html);
}
function render(){renderHub()}
function continueToHub(){if(page()==='hub'){cont();return}let busy=false;try{busy=!!(VLT_RUN||Q)}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}const go=()=>{try{if(VLT_RUN){if(typeof W.VLT_stopTimer==='function')W.VLT_stopTimer();VLT_RUN=null}if(Q){if(typeof W.studioClearSession==='function')W.studioClearSession();if(typeof W.stopExamClock==='function')W.stopExamClock();Q=null}STUDIO_PAGE='hub';W.studioUpdateChrome('hub');cont()}catch(e){console.error('Learning Hub continue failed',e);renderHub()}};if(busy&&typeof W.TGConfirm==='function'){W.TGConfirm('กำลังทำแบบฝึกอยู่ หากไป Learning Hub ความคืบหน้ารอบนี้อาจไม่ถูกบันทึก ต้องการไปต่อหรือไม่?').then(ok=>{if(ok)go()}).catch(()=>{})}else go()}
function wrapLedger(name,mod){const f=W[name];if(typeof f!=='function'||f.__ledger)return;const w=function(){const out=f.apply(this,arguments);try{LEDGER.add(mod,1)}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}return out};w.__ledger=true;W[name]=w}
function install(){
  if(typeof W.studioRender==='function'){const prev=W.studioRender;W.studioRender=function(){if(page()==='hub'){render();return}return prev.apply(this,arguments)}}
  if(typeof W.studioUpdateChrome==='function'){const prev=W.studioUpdateChrome;W.studioUpdateChrome=function(p){const out=prev.apply(this,arguments);try{D.body.classList.toggle('lh-home-focus',p==='home'&&!homeAll())}catch(_){}if(p==='hub'){const c=D.getElementById('studioCrumb'),t=D.getElementById('studioTitle');if(c)c.textContent='LEARNING HUB';if(t)t.textContent='Learning Hub'}try{updateBanner()}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}return out}}
  if(typeof W.VLT_finish==='function'&&!W.VLT_finish.__hub){const prev=W.VLT_finish;const w=function(){let r=null;try{r=typeof VLT_RUN!=='undefined'?VLT_RUN:null}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}const out=prev.apply(this,arguments);try{onVltFinished(r)}catch(e){console.error('Learning Hub: VLT result not recorded',e)}return out};w.__hub=true;W.VLT_finish=w}
  // cross-app ledger: answers in the exam centre, vocabulary reviews and game rounds count toward "today"
  if(typeof W.VLT_record==='function'&&!W.VLT_record.__ledger){const f=W.VLT_record;const w=function(q){const out=f.apply(this,arguments);try{if(!INHUB)LEDGER.add('exam',1)}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}return out};w.__ledger=true;W.VLT_record=w}
  if(typeof W.studioExportAll==='function'&&!W.studioExportAll.__hub){const f=W.studioExportAll;const w=function(){const out=f.apply(this,arguments);try{const s=st();s.plan.backupAt=now();save()}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}return out};w.__hub=true;W.studioExportAll=w}
  wrapLedger('studioReviewResult','vocab');wrapLedger('studioMarkWord','vocab');wrapLedger('finish','game');
  if(typeof W.TGAT1_addHomeHook==='function')W.TGAT1_addHomeHook(()=>{try{homeCard()}catch(e){console.error(e)}});
  if(typeof W.TGAT1_addAnalyticsHook==='function')W.TGAT1_addAnalyticsHook(()=>{try{analyticsCard()}catch(e){console.error(e)}});
  W.addEventListener('storage',e=>{try{if(e&&e.key===KEY){HS=load();if(page()==='hub'&&!HS.active&&!HS.flow)renderHub()}}catch(err){console.warn('Learning Hub storage event ignored',err)}},{passive:true});
  try{homeCard()}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}
  updateBanner();
}

W.TGAT1Hub=Object.freeze({
  version:'3.0.0',schema:SCHEMA,key:KEY,
  /* ใช้โดยเทสต์เท่านั้น (tests/ops.test.mjs) — ไม่ใช่ API สำหรับหน้าจอ */
  __test:{aiModelList,aiIsModelError,AI_PROVIDERS},
  open(){if(page()!=='hub'&&typeof W.studioNav==='function'){W.studioNav('hub');return}renderHub()},
  continue(){continueToHub()},
  ahead(){try{STUDIO_PAGE='hub';W.studioUpdateChrome('hub')}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}cont(true)},
  homeAll:toggleHomeAll,ics:icsExport,skipBuffer,carry:n=>carryOn(Number(n)),cardDone,testOut:n=>testOut(Number(n)),
  // A6: one setter that both the profile screen and quality.js use, so the daily goal can never drift between pages
  syncPlan(patch){try{const s=st();const m=Number(patch&&patch.minutes);if(Number.isFinite(m)&&m>=15)s.plan.minutes=clamp(m,15,300);
    const ex=String((patch&&patch.exam)||'');if(ex&&dateOf(ex))s.plan.exam=ex;save();recompute();if(page()==='hub')renderHub();
    return {minutes:goalMinutes(s),exam:examOf(s)}}catch(e){(W.TGAT1_ERR||Object)(e,'learning-hub');return null}},
  goal(){try{return goalMinutes(st())}catch(_){return 120}},calendar:()=>calendar().map(x=>({d:x.d,k:x.e.k,n:x.e.n||null,set:x.e.set||null,label:entryTitle(x.e)})),
  step:(n,k)=>{try{STUDIO_PAGE='hub';W.studioUpdateChrome('hub')}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}stepEntry(n,k)},
  openUnit:n=>{try{STUDIO_PAGE='hub';W.studioUpdateChrome('hub')}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}openUnit(n)},
  openDay:i=>{try{STUDIO_PAGE='hub';W.studioUpdateChrome('hub')}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}openDay(i)},
  pick:pickOption,conf:setConf,next:nextQ,pause:pauseRun,extra:startExtra,dk:dontKnow,
  lesson:n=>{try{STUDIO_PAGE='hub';W.studioUpdateChrome('hub')}catch(_){(W.TGAT1_ERR||Object)(_,'learning-hub')}startLesson(n||st().unit)},
  predict:flowPredict,flowPick,flowDK,flowNext,flowBack,build:flowBuild,buildCheck:flowBuildCheck,type:flowType,typedCheck:flowTypedCheck,match:flowMatch,say:sayIt,
  mockStart,print:printMock,paperScore,savePlan,
  ai:aiExplain,aiSave,aiTest,aiClear,aiEnabled:aiOn,
  showErrors,cancelPending,
  logVocabulary(n,score,total){const u=Number(n);if(!Number.isInteger(u)||u<1||u>UNITS)return false;log({k:'vocab',u,score:clamp(Number(score)||0,0,1000),total:clamp(Number(total)||0,0,1000)});LEDGER.add('vocab',Number(total)||0);save();return true},
  // C8 — คำผ่านตา: ชุดคำที่ถูกถามของบทหนึ่งในรอบที่กำหนด (ใช้ตรวจว่าทุกคำถูกถามจริง)
  wordPlan(n,cycle){const ch=unitDef(Number(n));if(!ch)return null;const r=wordRotation(ch,cycle==null?chapterCycle(Number(n)):Number(cycle));
    return {unit:Number(n),total:(ch.words||[]).length,srs:ch.srs||SRS_DEFAULT,core:r.core.slice(),cycled:r.cycled.slice(),expo:r.expo.slice(),quizzed:r.quizzed.slice(),cyclesToCover:r.cyclesToCover}},
  // C12 — บทอ่านเสริม
  sight(id){const p=sightById(String(id));if(!p){toast('ไม่พบบทอ่านนี้');return false}SST={pid:p.id};renderSight();scrollTop();return true},
  sightList(){const D=sightDoc();if(!D||!Array.isArray(D.passages))return [];return D.passages.map(p=>({id:p.id,title:p.title,words:String(p.text||'').split(/\s+/).length,targets:(p.words||[]).length}))},
  reading(id){const p=readingById(String(id));if(!p){toast('ไม่พบบทอ่านนี้');return false}RST={pid:p.id,ans:{}};renderReading();scrollTop();return true},
  readPick(qid,idx){if(!RST)return;const p=readingById(RST.pid);if(!p)return;const it=p.items.find(x=>x.id===qid);if(!it)return;
    if(RST.ans[qid]!=null)return;RST.ans[qid]=Number(idx);renderReading();return RST.ans[qid]===it.answer},
  readingList(){const D=W.TGAT1_READING;if(!D||!Array.isArray(D.passages))return [];
    return D.passages.map(p=>({id:p.id,genre:p.genre,title:p.title,words:String(p.text).split(/\s+/).length,items:(p.items||[]).length,
      higher:(p.items||[]).filter(x=>/^rc\.(inference|attitude|purpose|tone)$/.test(x.type)).length}))},
  readingScore(){if(!RST)return null;const p=readingById(RST.pid);const answered=Object.keys(RST.ans).length;
    return {id:RST.pid,answered,total:(p&&p.items||[]).length,right:p?p.items.filter(it=>RST.ans[it.id]===it.answer).length:0}},
  idiomBank(){const D=W.TGAT1_IDIOMS;if(!D||!Array.isArray(D.entries))return {ready:false};
    const byFn={};D.entries.forEach(e=>{byFn[e.fn]=(byFn[e.fn]||0)+1});
    const problems=[];const seen=new Set();D.entries.forEach(e=>{const k=String(e.idiom).toLowerCase();if(seen.has(k))problems.push('duplicate '+e.idiom);seen.add(k);
      if(!e.th||!e.resp||!e.respTh)problems.push('missing text '+e.id);if(!e.ex||!e.ex.q||!e.ex.a)problems.push('missing dialogue '+e.id)});
    return {ready:true,entries:D.entries.length,functions:Object.keys(byFn).length,perFn:byFn,linked:D.entries.filter(e=>e.item).length,problems}},
  wordCoverage(){const p=PD();const Q=W.TGAT1_QUALITY;const rows=(p&&p.chapters||[]).map(ch=>{const seen={};let cyc=0;const N=12;
      for(let c=0;c<N;c++){wordRotation(ch,c).cycled.forEach(w=>{if(seen[w]==null)seen[w]=c})}
      const expo=((ch.words||[]).slice(ch.srs||SRS_DEFAULT));const never=expo.filter(w=>seen[w]==null);
      return {chapter:ch.n,total:(ch.words||[]).length,expo:expo.length,reachable:expo.length-never.length,never,cyclesToCover:wordRotation(ch,0).cyclesToCover}});
    const sum=k=>rows.reduce((a,r)=>a+r[k],0);
    return {chapters:rows.length,words:sum('total'),expo:sum('expo'),reachable:sum('reachable'),worstCycles:rows.reduce((a,r)=>Math.max(a,r.cyclesToCover),0),failing:rows.filter(r=>r.never.length).map(r=>r.chapter),rows}},
  // read-only helpers for diagnostics and automated tests
  state:()=>JSON.parse(JSON.stringify(st())),plan:()=>planInfo(),days:()=>DAYS.slice(),
  // read-only: การ์ดทั้งหมดของบทหนึ่ง (ใช้ตรวจว่าเนื้อหาที่ควรมีถูกจัดเข้า flow จริง)
  lessonCards(n){let out=[];try{withBank(()=>{out=buildLesson(Number(n),{})})}catch(_){out=[]}
    return out.map(c=>({t:c.t,u:c.u==null?null:c.u,p:c.p==null?null:c.p,part:c.part||null,role:c.role||null,id:c.id||null}))},
  nextAction:()=>{const a=nextAction();return {k:a.k,u:a.u,step:a.step&&a.step.k,flow:!!a.flow,day:a.e?dayKey(a.e):null,set:a.e&&a.e.set||null,kind:a.e?a.e.k:null,d:a.e&&a.e.d||null}},
  flowCard:()=>{const x=fcur();if(!x)return null;const c=x.c;const it=c.t==='q'?getItem(c):null;
    return {i:x.f.i,n:x.f.cards.length,t:c.t,g:c.g||null,part:c.part||null,ans:c.t==='g'?(['build','typed','match'].includes(c.g)?null:c.ans):(it?c.o.indexOf(it.ans):null),toks:c.toks||null,word:c.g==='typed'?c.w:null,
      match:c.g==='match'?c.th.slice():null,answered:flowGradable(c)?flowAnswered(c,x.a):true,phase:x.a.ph||null,wv:!!(c.wv||c.wvw),src:c.src||null,pre:!!c.pre,compress:!!x.f.compress,unit:x.f.unit,day:x.f.day||null}},
  family,conceptPool:(c)=>conceptPool(c).length,
  // C5: รายการข้อของคอนเซปต์พร้อมแหล่งที่มา (bank = ชุดสอบ 60 ข้อ, sx = คลังเสริมโครงสร้าง)
  conceptPoolItems:(c)=>conceptPool(c).map(r=>({id:r.id,src:r.src})),
  // C5: ดึงข้อตาม id เพื่อตรวจรูปข้อมูลที่ UI ใช้จริง (ทั้งคลังกลางและคลังเสริม)
  itemById:(id)=>getItem({src:String(id).slice(0,2)==='SX'?'sx':'bank',id}),reload:()=>{if(SAVE_T){clearTimeout(SAVE_T);SAVE_T=0}HS=load();return HS.unit},flush:()=>{saveNow();flushVocab(true);return true},notice:()=>NOTICE,readonly:()=>READONLY,ledger:()=>LEDGER.read(),
  audit(){const c=cur(),p=PD();if(!c||!p)return null;const x=idx();const out={chapters:p.chapters.length,days:DAYS.length,items:x.items.size,problems:[]};
    p.chapters.forEach(ch=>{(ch.learn||[]).forEach(l=>{if(!libUnit(l.u))out.problems.push('chapter '+ch.n+': missing library unit '+l.u)});
      ['g','s','r'].forEach(k=>(ch.practice[k]||[]).forEach(r=>{if(r.src==='hub'&&!x.items.has(r.id))out.problems.push('chapter '+ch.n+': missing hub item '+r.id);if(r.src==='x'&&!(p.extra||{})[r.id])out.problems.push('chapter '+ch.n+': missing extra item '+r.id)}));
      (ch.words||[]).forEach(w=>{if(!p.words[w])out.problems.push('chapter '+ch.n+': missing word '+w)})});
    x.items.forEach(it=>{if(!Array.isArray(it.opts)||it.opts.length<3||!(it.ans>=0&&it.ans<it.opts.length))out.problems.push('item '+it.id+': bad options/answer');if(new Set(it.opts.map(o=>String(o).trim().toLowerCase())).size!==it.opts.length)out.problems.push('item '+it.id+': duplicate options');if(!it.why)out.problems.push('item '+it.id+': no explanation')});
    return out}
});
install();
})();
