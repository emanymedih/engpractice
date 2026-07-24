// WordMemo v11 — reliability + evidence-informed learning UX
(function(){
'use strict';

const BUILD='11.0.0';
const LOCAL_BACKUP_KEY=KEY+'.backup';
const IDB_NAME='wordmemo-v11';
const LEGACY_IDB_NAME='wordmemo-v10';
const IDB_STORE='state';
const IDB_KEY='main';
const bootLocalRaw=(()=>{try{return localStorage.getItem(KEY)}catch(e){return null}})();
const bootBackupRaw=(()=>{try{return localStorage.getItem(LOCAL_BACKUP_KEY)}catch(e){return null}})();

const RELATION_WORDS=new Set(['of','to','in','for','on','with','at','from','by','about','into','over','after','before','under','between','around','through','against','without','within','across','off','up','down','out','as','than','since','during','until']);
const CONTEXT_FIRST=new Set(['the','a','an','of','to','in','for','on','with','at','from','by','about','into','over','after','before','under','between','around','through','against','without','within','across','off','up','down','out','as','than','and','or','but','if','so','that','which','who','what','when','where','how','would','will','can','could','should','may','might','must']);
const FUNCTION_WORDS=new Set(['the','a','an','and','or','but','if','so','as','that','which','who','what','when','where','why','how','this','these','those','some','any','each','every','all','both','either','neither','not','there']);

const TRANSLATION_OVERRIDES={
  of:'связь / принадлежность; часто по-русски без предлога: «чашка чая»',
  to:'к, в — направление; перед глаголом — частица инфинитива',
  in:'внутри; в каком-то месте, месяце, году или периоде',
  for:'для, ради; в течение какого-то времени',
  on:'на поверхности; в определённый день; о какой-то теме',
  with:'с кем-то / чем-то; при помощи чего-то',
  at:'в конкретной точке, месте или времени',
  from:'из, от — источник или начальная точка',
  by:'рядом; при помощи; кем/чем выполнено действие',
  about:'о чём-то; примерно, около',
  into:'внутрь — движение изнаружи внутрь',
  over:'над; через; больше чем; в течение',
  after:'после, вслед за',
  before:'до, перед',
  under:'под, ниже; под действием / контролем',
  between:'между объектами / сторонами',
  around:'вокруг; примерно; по разным местам',
  through:'через, сквозь; на протяжении процесса',
  against:'против; вплотную к поверхности',
  without:'без, при отсутствии',
  within:'внутри; в пределах времени или границ',
  across:'через — с одной стороны на другую',
  off:'прочь / с поверхности; также частица во фразовых глаголах',
  up:'вверх; также частица во фразовых глаголах',
  down:'вниз; также частица во фразовых глаголах',
  out:'наружу; также частица во фразовых глаголах',
  as:'как; в роли / качестве кого-то или чего-то',
  than:'чем — после сравнительной формы',
  since:'с какого-то момента; поскольку',
  during:'во время какого-то события / периода',
  until:'до определённого момента'
};
for(const w of WORDS){const x=TRANSLATION_OVERRIDES[w.en.toLowerCase()];if(x)w.ru=x}

const RELATION_HINTS={
  of:'Связь между существительными. Часто русский язык выражает её окончанием: a cup of tea → «чашка чая».',
  to:'Направление к цели: go to work. Перед глаголом часто это не предлог, а маркер инфинитива: want to learn.',
  in:'Внутри пространства или периода: in the bag, in July.',
  on:'Контакт с поверхностью, день или тема: on the table, on Monday, a book on history.',
  at:'Точка, а не пространство: at the station, at 7 o’clock.',
  for:'Получатель, цель или длительность: for you, for work, for two hours.',
  from:'Источник или начало движения: from Anna, from London.',
  by:'Способ, автор или положение рядом: by bus, written by her, by the door.',
  with:'Совместность или инструмент: with my brother, cut with a knife.',
  about:'Тема или приблизительность: talk about work, about ten minutes.',
  into:'Движение внутрь: walk into the room.',
  over:'Над / через / больше: over the table, over 100 people.',
  under:'Ниже или под чем-то: under the table.',
  between:'Положение в промежутке: between two houses.',
  through:'Сквозь пространство или процесс: through the window, through the night.',
  around:'Вокруг или примерно: around the park, around five o’clock.',
  against:'Против или с контактом: against the wall.',
  without:'Отсутствие: coffee without sugar.',
  across:'С одной стороны на другую: across the street.',
  off:'Отделение / удаление: take it off. Во фразовых глаголах значение учится целиком.',
  up:'Направление вверх. Во фразовых глаголах учите сочетание целиком: get up, pick up.',
  down:'Направление вниз. Во фразовых глаголах: sit down, write down.',
  out:'Наружу / вне. Во фразовых глаголах: go out, find out.',
  as:'Роль или способ сравнения: work as a teacher, as quickly as possible.',
  than:'Вторая часть сравнения: bigger than, more useful than.',
  since:'Начальная точка периода: since Monday. Также может означать «поскольку».',
  during:'Что-то происходит внутри периода / события: during the meeting.',
  until:'Граница во времени: wait until Friday.'
};

const CONCRETE_ICONS={
  person:'🧍',people:'👥',man:'👨',woman:'👩',boy:'👦',girl:'👧',child:'🧒',baby:'👶',family:'👨‍👩‍👧',friend:'🤝',teacher:'🧑‍🏫',student:'🧑‍🎓',doctor:'🧑‍⚕️',worker:'🧑‍🔧',employee:'🧑‍💼',president:'🏛️',
  house:'🏠',home:'🏡',room:'🚪',apartment:'🏢',building:'🏢',door:'🚪',window:'🪟',floor:'🧱',kitchen:'🍳',office:'🏢',school:'🏫',hospital:'🏥',restaurant:'🍽️',store:'🏪',shop:'🛍️',bank:'🏦',church:'⛪',station:'🚉',airport:'✈️',city:'🌆',town:'🏘️',village:'🏘️',street:'🛣️',road:'🛣️',park:'🌳',
  car:'🚗',bus:'🚌',train:'🚆',plane:'✈️',flight:'✈️',vehicle:'🚙',traffic:'🚦',trip:'🧳',travel:'🧳',journey:'🗺️',
  phone:'📱',computer:'💻',internet:'🌐',camera:'📷',television:'📺',radio:'📻',screen:'🖥️',message:'💬',email:'✉️',video:'🎥',
  book:'📘',paper:'📄',article:'📰',magazine:'🗞️',story:'📖',report:'📋',letter:'✉️',word:'🔤',language:'🗣️',question:'❓',answer:'✅',
  money:'💵',price:'🏷️',cost:'💰',account:'🧾',contract:'📑',job:'💼',business:'💼',company:'🏢',meeting:'👥',project:'📌',
  food:'🍲',water:'💧',coffee:'☕',tea:'🍵',drink:'🥤',meal:'🍽️',dinner:'🍽️',lunch:'🥪',breakfast:'🥣',cup:'☕',glass:'🥛',
  tree:'🌳',plant:'🌱',flower:'🌼',animal:'🐾',dog:'🐕',cat:'🐈',bird:'🐦',horse:'🐎',sea:'🌊',river:'🏞️',earth:'🌍',world:'🌍',
  heart:'❤️',music:'🎵',song:'🎶',sound:'🔊',voice:'🗣️',art:'🎨',film:'🎬',movie:'🎬',picture:'🖼️',image:'🖼️',game:'🎮',sport:'⚽',team:'👥',ball:'⚽',
  hand:'✋',head:'🙂',face:'🙂',eye:'👁️',body:'🧍',hair:'💇',foot:'🦶',arm:'💪',leg:'🦵',
  time:'⏰',day:'☀️',week:'📅',month:'🗓️',year:'📆',morning:'🌅',night:'🌙',hour:'🕐',minute:'⏱️',today:'📅',tomorrow:'➡️📅',yesterday:'⬅️📅',
  sun:'☀️',rain:'🌧️',snow:'❄️',weather:'🌦️',fire:'🔥',air:'💨',
  table:'🪑',chair:'🪑',bed:'🛏️',bag:'👜',box:'📦',key:'🔑',card:'💳',clothes:'👕',shoe:'👟',
  mother:'👩',father:'👨',brother:'👦',sister:'👧',parent:'👪'
};

function learningKind(w){const en=w.en.toLowerCase();if(RELATION_WORDS.has(en))return'relation';if(FUNCTION_WORDS.has(en)||CONTEXT_FIRST.has(en))return'function';if(CONCRETE_ICONS[en])return'concrete';if(VERB_LEMMAS.has(en))return'verb';return'context'}
function relationDiagramClass(en){return ['in','on','under','over','to','from','with','between'].includes(en)?'prep-'+en:'prep-in'}
function visualMemoryHtml(w){const en=w.en.toLowerCase(),kind=learningKind(w);if(kind==='relation'){return `<div class="visual-memory prep"><div class="visual-title">${escapeHTML(w.en)} · схема отношения</div><div class="prep-scene ${relationDiagramClass(en)}"><div class="prep-box"></div><div class="prep-dot"></div></div><div class="visual-note">${escapeHTML(RELATION_HINTS[en]||'Смотрите не на один русский перевод, а на роль слова в конкретной фразе.')}</div></div>`}if(kind==='concrete'){return `<div class="visual-memory"><div class="visual-icon" aria-hidden="true">${CONCRETE_ICONS[en]}</div><div class="visual-title">Образ-якорь · ${escapeHTML(w.en)}</div><div class="visual-note">Сначала назовите предмет по-английски, затем проверьте себя по примеру.</div></div>`}if(kind==='verb'){return `<div class="visual-memory"><div class="visual-icon" aria-hidden="true">🎬</div><div class="visual-title">Мини-сцена · ${escapeHTML(w.en)}</div><div class="visual-note">Представьте действие: ${escapeHTML(w.exRu)} Затем произнесите глагол без перевода.</div></div>`}if(kind==='function'){return `<div class="visual-memory"><div class="visual-icon" aria-hidden="true">🔗</div><div class="visual-title">Паттерн вместо картинки</div><div class="visual-note">Служебные слова лучше запоминать внутри конструкции: ${escapeHTML(w.ex)}</div></div>`}return `<div class="visual-memory"><div class="visual-icon" aria-hidden="true">🧠</div><div class="visual-title">Контекстный якорь · ${escapeHTML(w.en)}</div><div class="visual-note">Свяжите слово с одной конкретной ситуацией: ${escapeHTML(w.exRu)}</div></div>`}
function relationUsageHtml(w){const x=RELATION_HINTS[w.en.toLowerCase()];return x?`<div class="preposition-note"><b>Как понимать в живой речи:</b> ${escapeHTML(x)}</div>`:''}

function parseState(raw){try{const s=raw?JSON.parse(raw):null;return s&&s.version===1?s:null}catch(e){return null}}
function progressWeight(s){if(!s)return-1;const cards=Object.values(s.cards||{});const touched=cards.filter(c=>c&&c.status&&c.status!=='new').length;const reps=cards.reduce((n,c)=>n+(c?.reps||0)+(c?.recallOK||0)+(c?.contextOK||0),0);const reviews=Object.values(s.history||{}).reduce((n,h)=>n+(h?.reviews||0),0);return touched*1000+reps*10+reviews}
function stateTimestamp(s){return Number(s?.updatedAt||s?.createdAt||0)}
function ensureState(s){s=s&&s.version===1?s:defaultState();s.settings=s.settings||{};if(!s.settings.newPerDay)s.settings.newPerDay=10;if(!s.settings.band)s.settings.band='all';if(!s.settings.theme)s.settings.theme='system';if(!s.settings.mode)s.settings.mode='random';s.cards=s.cards||{};s.history=s.history||{};s.notes=s.notes||{};s.recentIds=Array.isArray(s.recentIds)?s.recentIds:[];s.updatedAt=stateTimestamp(s);s.engine=s.engine||{};if(s.engine.version!==BUILD){s.engine={version:BUILD,migratedAt:Date.now()};if(!s.settings.mode||s.settings.mode==='mixed')s.settings.mode='random'}return s}
function openDB(name){return new Promise((resolve,reject)=>{if(!('indexedDB'in window))return reject(new Error('IndexedDB unavailable'));const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(IDB_STORE))r.result.createObjectStore(IDB_STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function dbRead(name){try{const db=await openDB(name);const val=await new Promise((resolve,reject)=>{const tx=db.transaction(IDB_STORE,'readonly');const r=tx.objectStore(IDB_STORE).get(IDB_KEY);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)});db.close();return val}catch(e){return null}}
async function dbWrite(snapshot){try{const db=await openDB(IDB_NAME);await new Promise((resolve,reject)=>{const tx=db.transaction(IDB_STORE,'readwrite');tx.objectStore(IDB_STORE).put(snapshot,IDB_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();return true}catch(e){console.warn('WordMemo IndexedDB:',e);return false}}
function updateSaveIndicator(ok=storageOK){document.querySelectorAll('[data-save-dot]').forEach(x=>x.classList.toggle('warn',!ok));document.querySelectorAll('[data-save-text]').forEach(x=>x.textContent=ok?'Сохранено на этом устройстве':'Ошибка локального сохранения')}

save=function(){state=ensureState(state);state.updatedAt=Date.now();const text=JSON.stringify(state);try{const old=localStorage.getItem(KEY);if(old&&old!==text)localStorage.setItem(LOCAL_BACKUP_KEY,old);localStorage.setItem(KEY,text);storageOK=true}catch(e){storageOK=false;console.warn('WordMemo localStorage:',e)}void dbWrite(JSON.parse(text));updateSaveIndicator(storageOK)};

function localDayKey(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
historyToday=function(){return state.history[localDayKey()]||{reviews:0,again:0,hard:0,good:0,easy:0,new:0}}
streak=function(){let d=new Date(),s=0;for(let i=0;i<3650;i++){const h=state.history[localDayKey(d)];if(h&&h.reviews>0)s++;else if(i>0)break;d.setDate(d.getDate()-1)}return s}
recordTypedAttempt=function(kind,ok){if(attemptRecorded)return;attemptRecorded=true;const k=localDayKey();if(!state.history[k])state.history[k]={reviews:0,again:0,hard:0,good:0,easy:0,new:0};const h=state.history[k],key=kind+(ok?'Correct':'Wrong');h[key]=(h[key]||0)+1;save()}
studyExtra=function(){const k=localDayKey(),h=state.history[k]||historyToday();h.new=Math.max(0,(h.new||0)-10);state.history[k]=h;save();session=buildSession();sessionIndex=0;attemptRecorded=false;lastTypedCorrect=null;renderStudy()}

function fisherYates(arr){arr=[...arr];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function freshCandidates(pool,recent){const unseen=pool.filter(w=>!state.cards[w.id]||state.cards[w.id].status==='new');const preferred=unseen.filter(w=>!recent.has(w.id));const fallback=unseen.filter(w=>recent.has(w.id));const weighted=(list)=>list.map(w=>({w,key:Math.random()/(1+Math.max(0,w.rank-1)/450)})).sort((a,b)=>b.key-a.key).map(x=>x.w);return weighted(preferred).concat(weighted(fallback))}
buildSession=function(){const now=Date.now(),h=historyToday(),pool=selectedWords(),recent=new Set((state.recentIds||[]).slice(-80));let due=pool.filter(w=>{const c=state.cards[w.id];return c&&c.status!=='new'&&c.due<=now});due=due.map(w=>({w,score:(now-(cardState(w.id).due||0))/DAY+Math.random()*.15})).sort((a,b)=>b.score-a.score).map(x=>x.w);const allowed=Math.max(0,(state.settings.newPerDay||10)-(h.new||0));const fresh=freshCandidates(pool,recent).slice(0,allowed);let arr=[];if(state.settings.mode==='random'){arr=fisherYates([...due,...fresh])}else{let d=[...due],f=[...fresh];while(d.length||f.length){if(d.length)arr.push(d.shift());if(d.length)arr.push(d.shift());if(f.length)arr.push(f.shift())}}return arr}

teacherModeFor=function(w){const c=cardState(w.id),kind=learningKind(w);if(c.status==='new'||c.reps===0)return'cards';if(kind==='relation'||kind==='function'){if((c.contextOK||0)<2)return'context';if((c.recallOK||0)<1)return'recall';return c.reps%3===0?'recall':'context'}if((c.recallOK||0)<2)return'recall';if((c.contextOK||0)<2)return'context';return c.reps%2===0?'recall':'context'}

const STAGES=[0,1,3,7,14,30,60,120];
previewInterval=function(c,q){const stage=Number.isFinite(c.stage)?c.stage:Math.min(c.reps||0,STAGES.length-1);if(q===0)return'3 мин';if(q===1)return stage<=1?'10 мин':STAGES[Math.max(1,stage)]+' дн';const next=Math.min(STAGES.length-1,stage+(q===3?2:1));return STAGES[next]+' дн'}
rate=function(q){const w=session[sessionIndex],c=cardState(w.id),wasNew=c.status==='new',now=Date.now();if(lastTypedCorrect===false&&q>1){q=1;toast('После ошибки максимум — «С трудом»')}c.stage=Number.isFinite(c.stage)?c.stage:Math.min(c.reps||0,STAGES.length-1);c.last=now;if(q===0){c.lapses=(c.lapses||0)+1;c.stage=Math.max(0,c.stage-1);c.reps=Math.max(0,(c.reps||0)-1);c.interval=0;c.due=now+3*MIN;c.status='learning'}else if(q===1){c.reps=(c.reps||0)+1;if(c.stage<=1){c.stage=Math.max(1,c.stage);c.interval=0;c.due=now+10*MIN}else{c.interval=STAGES[c.stage];c.due=now+c.interval*DAY}c.status='learning'}else{c.stage=Math.min(STAGES.length-1,c.stage+(q===3?2:1));c.reps=(c.reps||0)+1;c.interval=STAGES[c.stage];c.due=now+c.interval*DAY;c.status='learning'}const k=localDayKey();if(!state.history[k])state.history[k]={reviews:0,again:0,hard:0,good:0,easy:0,new:0};const h=state.history[k];h.reviews++;h[['again','hard','good','easy'][q]]++;if(wasNew)h.new++;state.recentIds=(state.recentIds||[]).concat(w.id).slice(-160);if((wasNew||q===0||lastTypedCorrect===false)&&session.length<90){const lag=3+Math.floor(Math.random()*3),pos=Math.min(session.length,sessionIndex+1+lag);session.splice(pos,0,w)}save();sessionIndex++;revealed=false;attemptRecorded=false;lastTypedCorrect=null;renderStudy()}

const baseRenderStudy=renderStudy;
renderStudy=function(){baseRenderStudy();if(!session.length||sessionIndex>=session.length)return;const w=session[sessionIndex],mode=currentMode==='teacher'?teacherModeFor(w):currentMode,flash=document.querySelector('#page-study .flash');if(flash){flash.classList.toggle('answered',!!revealed);flash.dataset.kind=learningKind(w)}if(mode==='cards'&&revealed){const answer=document.getElementById('answer');if(answer&&!answer.querySelector('.visual-memory'))answer.insertAdjacentHTML('afterbegin',visualMemoryHtml(w)+relationUsageHtml(w))}decorateStudy(w)}
function decorateStudy(w){const head=document.querySelector('#page-study .session-head');if(head&&!head.querySelector('.save-state'))head.insertAdjacentHTML('beforeend','<span class="save-state"><i data-save-dot class="save-dot"></i><span data-save-text>Сохранено на этом устройстве</span></span>');const buttons=document.querySelectorAll('#ratings button');const labels=['Не вспомнил','С трудом','Вспомнил','Очень легко'];buttons.forEach((b,i)=>{if(!b)return;const c=cardState(w.id);b.innerHTML=`<span>${i+1} · ${labels[i]}</span><small>${i===0?'через '+previewInterval(c,0):previewInterval(c,i)}</small>`});updateSaveIndicator(storageOK)}
function revealVisual(){const w=session[sessionIndex],flash=document.querySelector('#page-study .flash'),box=document.querySelector('#page-study .example-box:not(.hidden)');if(flash)flash.classList.add('answered');if(box&&!box.querySelector('.visual-memory'))box.insertAdjacentHTML('beforeend',visualMemoryHtml(w)+relationUsageHtml(w));decorateStudy(w)}
const baseReveal=reveal;reveal=function(){baseReveal();revealVisual()}
const baseCheckRecall=checkRecall;checkRecall=function(){baseCheckRecall();if(revealed)revealVisual()}
const baseCheckContext=checkContext;checkContext=function(){baseCheckContext();if(revealed)revealVisual()}

const baseWordLibraryDetail=wordLibraryDetail;
wordLibraryDetail=function(w){let html=baseWordLibraryDetail(w),needle='<div class="example-box">',insert=visualMemoryHtml(w)+relationUsageHtml(w),idx=html.indexOf(needle);return idx>=0?html.slice(0,idx)+insert+html.slice(idx):insert+html}

renderHome=function(){const c=counts(),h=historyToday(),foundation=WORDS.slice(0,500).filter(w=>statusOf(state.cards[w.id])==='mastered').length,bridge=WORDS.slice(500).filter(w=>statusOf(state.cards[w.id])==='mastered').length,newLeft=Math.max(0,(state.settings.newPerDay||10)-(h.new||0));document.getElementById('page-home').innerHTML=pageHeader('Сегодня','Одна понятная задача: вспомнить нужное и добавить немного нового.')+`<div class="science-hero"><div class="build-badge">WordMemo ${BUILD}</div><h2>${c.due?'Сначала повторим то, что пора вспомнить':'Можно начинать новую сессию'}</h2><p>Новые слова идут в случайном порядке, но более частотная лексика имеет небольшой приоритет. Ошибочные карточки возвращаются ещё раз внутри той же сессии.</p><div class="today-strip"><div class="today-metric"><b>${c.due}</b><span>пора повторить</span></div><div class="today-metric"><b>${newLeft}</b><span>новых сегодня</span></div><div class="today-metric"><b>${c.m}</b><span>устойчиво освоено</span></div></div><div class="actions"><button class="btn primary big" onclick="startStudy('teacher')">Начать умную сессию</button><button class="btn" data-page="library">Открыть библиотеку</button></div></div><div class="panel"><h2>Как работает одна карточка</h2><div class="method-steps"><div class="method-step"><b>1 · Понять</b><small>Значение, произношение и подходящий визуальный или смысловой якорь.</small></div><div class="method-step"><b>2 · Вспомнить</b><small>Попытка достать слово из памяти без готового ответа.</small></div><div class="method-step"><b>3 · Употребить</b><small>Восстановить слово внутри естественного предложения.</small></div><div class="method-step"><b>4 · Вернуться позже</b><small>Интервал растёт только после успешного извлечения.</small></div></div></div><div class="panel"><h2>Ваш прогресс</h2><div class="sub">A1–A2 foundation: <b>${foundation}/500</b> · A2–B1 bridge: <b>${bridge}/500</b></div><div class="progress" style="margin-top:14px"><i style="width:${Math.round(c.m/10)}%"></i></div><div class="save-state" style="margin-top:12px"><i data-save-dot class="save-dot"></i><span data-save-text>Сохранено на этом устройстве</span></div></div>`;updateSaveIndicator(storageOK)}

const baseRenderSettings=renderSettings;
renderSettings=function(){baseRenderSettings();const root=document.querySelector('#page-settings .settings');if(!root)return;const old=root.querySelector('.sync-card');if(old)old.remove();const sync=document.createElement('div');sync.className='field sync-card';sync.innerHTML=`<label>Прогресс и синхронизация</label><div class="sync-status"><div class="sync-icon">☁️</div><div><b>Локальное сохранение: включено</b><p>Каждое изменение дублируется в localStorage, IndexedDB и в одну предыдущую локальную копию. Это защищает от части сбоев браузерного хранилища.</p></div></div><div class="save-state"><i data-save-dot class="save-dot"></i><span data-save-text>Сохранено на этом устройстве</span></div><div class="notice"><b>iPhone ↔ компьютер:</b> автоматическая облачная синхронизация пока не подключена. Для неё нужен отдельный защищённый backend с авторизацией; GitHub Pages не хранит пользовательские данные.</div>`;root.insertBefore(sync,root.firstChild);const order=[...root.querySelectorAll('.field')].find(x=>x.querySelector('label')?.textContent==='Порядок карточек');if(order){const p=order.querySelector('p');if(p)p.textContent='Новые слова всегда перемешиваются. В режиме «смешанный» повторения получают приоритет, но порядок внутри групп тоже не последовательный.'}const device=[...root.querySelectorAll('.field')].find(x=>x.querySelector('label')?.textContent?.includes('iPhone'));if(device){const note=device.querySelector('.mini-muted');if(note)note.textContent='Приложение работает offline-first. Для защиты от потери данных до подключения cloud sync периодически используйте экспорт JSON.'}const version=document.createElement('div');version.className='mini-muted';version.textContent='Сборка '+BUILD+' · localStorage + IndexedDB · PWA';root.appendChild(version);updateSaveIndicator(storageOK)}

function installMobileNav(){const navEl=document.querySelector('.mobile-nav');if(!navEl||navEl.dataset.v11)return;navEl.dataset.v11='1';navEl.innerHTML='<button data-page="home"><b>⌂</b>Сегодня</button><button data-page="study"><b>◈</b>Учиться</button><button data-page="library"><b>▤</b>Библиотека</button><button id="mobileMoreBtn" type="button"><b>•••</b>Ещё</button>';const sheet=document.createElement('div');sheet.id='mobileMoreSheet';sheet.className='mobile-more-sheet hidden';sheet.innerHTML='<button class="mobile-sheet-backdrop" aria-label="Закрыть"></button><div class="mobile-sheet-panel"><div class="mobile-sheet-handle"></div><b>Ещё</b><button data-page="words">☷ Все 1000 слов</button><button data-page="stats">↗ Статистика</button><button data-page="settings">⚙ Настройки</button></div>';document.body.appendChild(sheet);document.getElementById('mobileMoreBtn')?.addEventListener('click',()=>sheet.classList.toggle('hidden'));sheet.querySelector('.mobile-sheet-backdrop')?.addEventListener('click',()=>sheet.classList.add('hidden'))}
function syncMobileNav(page){document.querySelectorAll('.mobile-nav [data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));document.getElementById('mobileMoreBtn')?.classList.toggle('active',['words','stats','settings'].includes(page));document.getElementById('mobileMoreSheet')?.classList.add('hidden')}
const baseNav=nav;nav=function(page){baseNav(page);syncMobileNav(page)}

async function recover(){const local=parseState(bootLocalRaw),backup=parseState(bootBackupRaw);const [db11,db10]=await Promise.all([dbRead(IDB_NAME),dbRead(LEGACY_IDB_NAME)]);const candidates=[backup,db10,db11].filter(x=>x&&x.version===1);let chosen=local;if(!chosen&&candidates.length){chosen=candidates.sort((a,b)=>progressWeight(b)-progressWeight(a)||stateTimestamp(b)-stateTimestamp(a))[0]}else if(chosen){for(const c of candidates){if(progressWeight(c)>progressWeight(chosen)&&stateTimestamp(c)>=stateTimestamp(chosen))chosen=c;else if(progressWeight(c)===progressWeight(chosen)&&stateTimestamp(c)>stateTimestamp(chosen))chosen=c}}if(chosen)state=ensureState(chosen);else state=ensureState(state);try{if(navigator.storage?.persist)await navigator.storage.persist()}catch(e){}save();applyTheme();render(currentPage);installMobileNav();syncMobileNav(currentPage);if(chosen&&chosen!==local&&progressWeight(chosen)>progressWeight(local))toast('Прогресс восстановлен из локальной резервной копии');window.__WORDMEMO_V11_READY__=true}

window.addEventListener('pageshow',()=>{if(window.__WORDMEMO_V11_READY__){const s=parseState((()=>{try{return localStorage.getItem(KEY)}catch(e){return null}})());if(s&&stateTimestamp(s)>stateTimestamp(state)){state=ensureState(s);applyTheme();render(currentPage);toast('Прогресс обновлён')}}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&window.__WORDMEMO_V11_READY__)save()});

recover().catch(e=>{console.error('WordMemo v11 init:',e);state=ensureState(state);save();installMobileNav();render(currentPage);window.__WORDMEMO_V11_READY__=true});
})();
