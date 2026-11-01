/* TAMI portfolio sandbox. Public snapshots and editable drafts are separate. */
(() => {
  'use strict';
  const STORE = 'tami-portfolios-v1';
  const PENDING = 'tami-portfolio-room-v1';
  const MAX_BLOCKS = 30;
  const PURPOSES = [['promotion','작업 알리기','새 음악·공연·프로젝트를 소개해요'],['commission','협업·외주 제안','내 역할과 관련 작업을 보여줘요'],['profile','나를 소개하기','사진·영상·이력을 한곳에 모아요']];
  const CONTENTS = [['music','음원','music'],['video','영상 링크','eye'],['photos','사진·이력','image'],['links','기존 링크','link']];
  const CONCEPTS = [['cover','Cover','한 장의 아트워크'],['editorial','Editorial','이야기가 있는 지면'],['stage','Stage','무대 위의 존재감'],['studio','Studio','작업 노트의 질감']];
  let startChoice = {purpose:'profile',content:'links',links:'',research:false}, creationStartedAt=0;
  const CONSENT_KEY='tami-visit-consent-v1', VISITOR_KEY='tami-visitor-v1';
  const TYPES = {
    profile: ['프로필', '당신의 이름과 소개', 'user'],
    track: ['음원', '직접 들려주는 나의 음악', 'music'],
    credits: ['크레딧', '함께 만든 사람들', 'people'],
    text: ['글', '작업에 담긴 이야기', 'text'],
    image: ['이미지', '사진과 아트워크', 'image'],
    link: ['링크', '다른 채널로 이어지는 문', 'link']
  };
  const PATHS = {
    plus: 'M12 5v14M5 12h14', back: 'M15 5l-7 7 7 7', arrow: 'M5 12h14M13 6l6 6-6 6',
    close: 'M6 6l12 12M18 6L6 18', check: 'M5 12l4 4L19 6',
    up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6',
    copy: 'M8 8h12v13H8zM16 8V3H3v13h5', trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
    user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',
    music: 'M9 18V5l11-2v13M9 9l11-2M9 18a3 2 0 1 1-6 0 3 2 0 0 1 6 0M20 16a3 2 0 1 1-6 0 3 2 0 0 1 6 0',
    people: 'M15 21v-2a6 6 0 0 0-12 0v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 3a4 4 0 0 1 0 8M17 13a6 6 0 0 1 4 6v2',
    text: 'M4 5h16M4 10h16M4 15h10M4 20h13',
    image: 'M3 3h18v18H3zM3 16l6-6 6 6 3-3 3 3M16 7h.01',
    link: 'M10 14l4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
    share: 'M12 15V3M7 8l5-5 5 5M5 12v8h14v-8',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    edit: 'M15 4l5 5M4 20l5-1L21 7l-5-5L4 14z',
    lock: 'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4',
    upload: 'M12 16V3M7 8l5-5 5 5M4 16v5h16v-5',
    spark: 'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z'
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => `<svg class="pf-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${PATHS[name] || PATHS.spark}"/></svg>`;
  const uid = () => crypto.randomUUID();
  const screen = () => document.getElementById('screen');
  const fresh = type => ({id:uid(),type,...({profile:{name:'나의 이름',role:'Artist · Producer',bio:'나의 음악과 이야기를 소개해 주세요.',image:'/assets/blue-hour.svg',contactEmail:'',contactUrl:''},track:{title:'새로운 곡',artist:'',description:'',audio:'/assets/demo.wav',cover:'/assets/blue-hour.svg',featured:false,startAt:0},credits:{title:'함께 만든 사람들',entries:[{name:'',role:''}]},text:{title:'나의 이야기',body:'',variant:'text'},image:{image:'/assets/afterglow.svg',caption:''},link:{label:'나의 채널',url:'',variant:'link'}}[type])});
  const ARTISTS={harin:{name:'하린 / Harin',role:'Singer-songwriter · Indie R&B',bio:'낮과 밤 사이, 작은 감정들을 노래합니다.\n천천히 오래 남을 음악을 만들고 있어요.',cover:'blue-hour',title:'Blue Hour',theme:'sage'},jun:{name:'준 / Jun',role:'Producer · Guitarist',bio:'좋은 멜로디가 머물 수 있는 소리를 만듭니다.\n기타와 비트, 그 사이의 따뜻한 질감.',cover:'orbit',title:'Orbit',theme:'night'},seowoo:{name:'서우 / Seowoo',role:'Vocalist · Alternative Pop',bio:'목소리로 남기는 조용한 장면들.\n새로운 색을 가진 음악을 함께 만들어요.',cover:'slow-bloom',title:'Slow Bloom',theme:'paper'}};
  function sample(artist='harin') {
    const a=ARTISTS[artist]||ARTISTS.harin;
    const track={...fresh('track'),title:a.title,artist:a.name.split(' / ')[1],description:'작은 순간을 오래 기억하기 위한 사운드 스케치.',cover:`/assets/${a.cover}.svg`,featured:true,startAt:12,duration:48};
    return {version:1,title:`${track.artist} · Portfolio`,theme:a.theme,appearance:{font:'sans'},blocks:[
      {...fresh('profile'),name:a.name,role:a.role,bio:a.bio,image:`/assets/${a.cover}.svg`},track,
      {...fresh('text'),trackId:track.id,title:'음악이 시작되는 순간',body:'창문 너머의 빛, 집으로 돌아오는 길.\n일상에서 놓치기 쉬운 순간들을 모아 음악으로 남깁니다.'},
      {...fresh('credits'),trackId:track.id,title:'Made together',entries:[{name:'하린',role:'Songwriting · Vocal',portfolioId:'sample:harin'},{name:'준',role:'Guitar · Production',portfolioId:'sample:jun'},{name:'서우',role:'Background vocal',portfolioId:'sample:seowoo'}]},
      {...fresh('image'),trackId:track.id,caption:'오래 머물고 싶은 색, Afterglow.'},
      {...fresh('link'),label:'SoundCloud에서 더 듣기',url:'https://soundcloud.com/'}
    ]};
  }
  function template(kind) {
    if(kind==='blank')return {version:1,title:'나의 포트폴리오',theme:'sage',blocks:[{...fresh('profile'),name:'',role:'',bio:'',image:''}]};
    const doc=sample(kind==='producer'?'jun':'harin');
    if(kind==='band'){doc.title='Our Band · Portfolio';Object.assign(doc.blocks[0],{name:'우리의 밴드',role:'Band · Indie Rock',bio:'서로 다른 소리가 만나, 하나의 음악이 됩니다.',image:'/assets/afterglow.svg'});Object.assign(doc.blocks[1],{title:'Afterglow',artist:'Our Band',cover:'/assets/afterglow.svg'});}
    return doc;
  }
  function starterDocument() {
    const profile={...fresh('profile'),name:'',role:'',bio:'',image:'',preferredContact:'none'};
    const blocks=[profile], purpose=startChoice.purpose;
    if(startChoice.content==='music')blocks.push({...fresh('track'),title:'',artist:'',audio:'',cover:'',featured:true,participation:''});
    if(startChoice.content==='video')blocks.push({...fresh('link'),label:'대표 공연·작업 영상',url:'',variant:'video'});
    if(startChoice.content==='photos')blocks.push({...fresh('image'),image:'',caption:''},{...fresh('text'),title:'활동과 참여 작업',body:''});
    const urls=startChoice.links.split(/\n/).map(v=>v.trim()).filter(Boolean);
    if(urls.length>5)throw new Error('시작할 링크는 최대 5개까지 입력해 주세요.');
    for(const url of urls){const safe=safeLink(url);if(!safe)throw new Error('기존 링크는 https:// 또는 http://로 시작하는 주소를 입력해 주세요.');blocks.push({...fresh('link'),label:new URL(safe).hostname.replace(/^www\./,''),url:safe});}
    if(startChoice.content==='links'&&!urls.length)blocks.push({...fresh('link'),label:'나의 채널',url:''});
    return {version:1,title:purpose==='commission'?'협업을 위한 포트폴리오':purpose==='promotion'?'새로운 작업 소개':'나의 포트폴리오',theme:'sage',purpose,storyConcept:'cover',blocks};
  }
  const clock = seconds => `${Math.floor((Number(seconds)||0)/60)}:${String(Math.floor((Number(seconds)||0)%60)).padStart(2,'0')}`;
  let ctx = null, generation = 0, overlay = null, toastTimer = 0, storyRun = 0;
  const blobs = new Map();
  const getSaved = () => {try {const data=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(data)?data.filter(x=>x && typeof x.id==='string' && typeof x.editToken==='string').slice(0,30):[];}catch{return [];}};
  const pendingRoom = () => {try{const room=JSON.parse(localStorage.getItem(PENDING)||'null');return room&&typeof room.title==='string'?room:null;}catch{return null;}};
  function queueRoom(room) {
    if(!room)return;
    const copy={id:room.id,title:String(room.title||'나의 작품').slice(0,200),subtitle:String(room.subtitle||'').slice(0,2000),cover:['blue-hour','afterglow','slow-bloom','orbit'].includes(room.cover)?room.cover:'blue-hour',localFile:!!room.localFile,duration:Number(room.duration)||0,credits:Array.isArray(room.credits)?room.credits.slice(0,20).map(person=>({name:String(person.name||'').slice(0,100),role:String(person.role||'').slice(0,160)})):[],people:Array.isArray(room.people)?room.people.slice(0,20).map(person=>String(person).slice(0,100)):[],publishedCredits:room.publishedCredits!==false,publishedStory:room.publishedStory!==false};
    try{localStorage.setItem(PENDING,JSON.stringify(copy));}catch{}
  }
  function documentFromRoom(room) {
    return {version:1,title:`${room.title} · Portfolio`.slice(0,120),theme:'sage',blocks:[{...fresh('profile'),name:room.people?.[0]||'나의 이름'},...blocksFromRoom(room,true)]};
  }
  function blocksFromRoom(room,featured=false) {
    const track={...fresh('track'),title:room.title,artist:room.people?.[0]||'하린',description:room.subtitle,cover:`/assets/${room.cover}.svg`,audio:room.localFile?'':'/assets/demo.wav',featured};
    if(room.duration>0&&room.duration<=7200)track.duration=room.duration;
    return [track,...(room.publishedStory?[{...fresh('text'),title:'함께 만든 과정',body:room.subtitle||'작업방에서 함께 완성한 음악입니다.',trackId:track.id}]:[]),...(room.publishedCredits?[{...fresh('credits'),trackId:track.id,entries:room.credits?.length?room.credits:(room.people||[]).map(name=>({name,role:''}))}]:[])];
  }
  function remember(model=ctx) {
    if (!model?.token) return;
    const prior=getSaved().find(r=>r.id===model.id);
    const record={id:model.id,editToken:model.token,title:model.doc.title||'나의 포트폴리오',updatedAt:Date.now(),publishedRevision:model.publishedRevision,startedAt:model.startedAt||prior?.startedAt||null,completionEventId:prior?.completionEventId||uid(),creationCompleted:prior?.creationCompleted||false};
    try {localStorage.setItem(STORE,JSON.stringify([record,...getSaved().filter(x=>x.id!==model.id)].slice(0,30)));}catch {notify('이 기기에 편집 링크를 저장하지 못했습니다. 링크를 따로 복사해 주세요.');}
  }
  function notify(message) {
    const target=document.getElementById('toast');
    if(!target)return;
    clearTimeout(toastTimer);target.textContent=message;target.classList.add('show');
    toastTimer=setTimeout(()=>target.classList.remove('show'),3500);
  }
  function urlFor(kind) { return `${location.origin}${location.pathname}#${kind==='edit'?`edit/${ctx.id}/${ctx.token}`:ctx.sample?`artist/${ctx.id}`:`p/${ctx.id}`}`; }
  function safeLink(value) {try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
  function media(value, isPublic=false) {
    if (!value) return '';
    if (/^asset:[a-zA-Z0-9-]+$/.test(value)) {const id=value.slice(6);return isPublic?`/api/media/${encodeURIComponent(id)}`:blobs.get(id)||'';}
    return /^\/assets\/(blue-hour\.svg|afterglow\.svg|slow-bloom\.svg|orbit\.svg|demo\.wav)$/.test(value)?value:'';
  }
  function errorText(error) {
    if(error.status===409)return '다른 창에서 새 내용이 저장되었습니다. 현재 초안은 유지됩니다. 최신 내용을 불러온 뒤 다시 편집해 주세요.';
    if(error.status===401||error.status===403)return '편집 권한을 확인할 수 없습니다. 보관한 편집 링크를 다시 열어 주세요.';
    if(error.status===404)return '페이지를 찾을 수 없습니다. 아직 공개되지 않았거나 링크가 올바르지 않습니다.';
    if(error.status===413)return '파일 또는 내용이 너무 큽니다. MP3 15MB, 이미지 5MB 이내로 다시 시도해 주세요.';
    if(error.status===429)return '잠시 뒤 다시 시도해 주세요. 요청이 빠르게 반복되고 있습니다.';
    return /[가-힣]/.test(error.message||'')?error.message:'연결이 원활하지 않습니다. 잠시 뒤 다시 시도해 주세요.';
  }
  async function api(path, {method='GET',body,auth=false,token}={}) {
    const headers={}; if(token||(auth&&ctx?.token))headers.Authorization=`Bearer ${token||ctx.token}`;
    if(body && !(body instanceof FormData))headers['Content-Type']='application/json';
    const res=await fetch(path,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,cache:'no-store'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok){const error=new Error(typeof data.error==='string'?data.error:data.message||data.error?.message||'');error.status=res.status;throw error;}
    return data;
  }
  function ownedToken(model=ctx){return model?.token||(!model?.sample&&getSaved().find(r=>r.id===model?.id)?.editToken)||'';}
  function visitorConsent(id=ctx?.id){try{return localStorage.getItem(`${CONSENT_KEY}:${id}`);}catch{return null;}}
  function setVisitorConsent(value){try{localStorage.setItem(`${CONSENT_KEY}:${ctx.id}`,value);}catch{}ctx.visitConsent=value;}
  function visitorId(){try{let id=localStorage.getItem(VISITOR_KEY);if(!/^[0-9a-f-]{36}$/.test(id||'')){id=uid();localStorage.setItem(VISITOR_KEY,id);}return id;}catch{return undefined;}}
  async function eventLog(name,metadata={},model=ctx,eventId){
    if(!model||model.sample)return false;
    model.recordingError='';
    const token=ownedToken(model);
    if(token&&model.measurement?.consent===false){model.recordingError='사용 기록에서 선택 기록 참여를 먼저 켜 주세요.';return false;}
    if(!token&&['design_select','sns_post_reported','editor_open','help_reported','creation_completed','edit_reason_reported'].includes(name))return false;
    if(!token&&model.visitConsent!=='yes'&&visitorConsent(model.id)!=='yes')return false;
    try{const result=await api(`/api/portfolios/${encodeURIComponent(model.id)}/events`,{method:'POST',token:token||undefined,body:{id:eventId||uid(),name,consent:true,...(!token?{visitorId:visitorId()}:{}),metadata}});model.recordingError=result.reason==='consent_required'?'사용 기록에서 선택 기록 참여를 먼저 켜 주세요.':'';return result.recorded===true||result.duplicate===true;}catch{return false;}
  }
  function consentHTML(){
    if(ctx.sample||ownedToken())return '';
    const consent=ctx.visitConsent||visitorConsent();
    if(consent)return `<div class="pf-privacy-link"><button data-pf-action="visit-settings">방문 기록 ${consent==='yes'?'참여 중':'참여 안 함'} · 변경</button></div>`;
    return `<aside class="pf-consent"><strong>더 나은 소개 페이지를 함께 만들어요</strong><p>동의하면 익명 브라우저 식별자와 방문·작업 열기·공유·연락 버튼 사용을 기록합니다. 문의 내용은 기록하지 않으며, 참여하지 않아도 모든 기능을 이용할 수 있어요.</p><div><button class="pf-btn pf-secondary" data-pf-action="visit-no">참여하지 않기</button><button class="pf-btn pf-primary" data-pf-action="visit-yes">기록에 동의</button></div></aside>`;
  }
  const EVENT_LABELS={created:'페이지 생성',draft_saved:'실제 변경 저장',published:'공개 반영',unpublished:'공개 중단',public_view:'공개 페이지 방문',work_open:'대표 작업 열기',contact_open:'외부 연락 이동',link_copy:'공개 링크 복사',card_save:'카드 저장 요청',design_select:'시각 콘셉트 선택',sns_post_reported:'SNS 게시 자기보고',editor_open:'편집 화면 재접속',edit_reason_reported:'갱신 이유 자기보고',help_reported:'도움 횟수 자기보고',preparation_reported:'준비 시간 자기보고',creation_completed:'첫 공개까지 경과 시간'};
  function recordDetails(record){
    const m=record.metadata||{},labels={cover:'Cover',editorial:'Editorial',stage:'Stage',studio:'Studio',release:'새 발매',commission:'협업·외주',performance:'공연','representative-work':'대표 작업 변경',other:'기타',email:'이메일',link:'외부 채널',copy:'복사',native:'공유 메뉴',instagram:'Instagram',music:'음원',video:'영상',photos:'사진',links:'링크'};
    return [m.concept&&labels[m.concept],m.reason&&`계기: ${labels[m.reason]}`,m.channel&&labels[m.channel],m.content&&labels[m.content],Number.isInteger(m.assistanceCount)&&`도움 ${m.assistanceCount}회`,Number.isInteger(m.elapsedSeconds)&&`경과 ${Math.ceil(m.elapsedSeconds/60)}분`,Array.isArray(m.changedTypes)&&`수정: ${m.changedTypes.map(type=>({page:'페이지',profile:'소개',track:'음원',credits:'참여자',text:'글',image:'이미지',link:'링크',order:'순서'}[type]||type)).join(' · ')}`].filter(Boolean).join(' / ');
  }
  async function insightsSheet(){
    if(!ownedToken())return;
    const model=ctx,run=generation;
    sheet('나의 사용 기록','<p class="pf-sheet-intro">저장한 행동 기록을 불러오고 있어요.</p>');
    const loadingOverlay=overlay;
    try{
      const data=await api(`/api/portfolios/${model.id}/insights`,{token:ownedToken(model)});
      if(ctx!==model||generation!==run||overlay!==loadingOverlay)return;
      ctx.insights=data;ctx.measurement=data.measurement;
      const research=data.measurement?.mode==='research',enabled=data.measurement?.consent===true,counts=data.counts?.[research?'research':'demo']||{},completion=(data.records||[]).find(r=>r.name==='creation_completed'&&r.mode===(research?'research':'demo'));
      sheet('나의 사용 기록',`<div class="pf-measure-mode"><span>${research?'사용자 테스트 참여':'개인 체험·팀 시연'}</span><h3>행동을 나누어 살펴봐요.</h3><small class="pf-recording-status">${enabled?'선택 행동 기록에 참여 중':'선택 행동 기록 꺼짐 · 기본 저장·공개 이력만 유지'}</small><p>링크 복사와 카드 저장은 SNS 게시나 문의 전송을 뜻하지 않습니다.</p></div><div class="pf-metric-grid">${[['public_view','동의한 공개 방문'],['work_open','작업 열기'],['link_copy','링크 복사'],['card_save','카드 저장 요청'],['contact_open','연락 채널 이동'],['sns_post_reported','SNS 게시 자기보고'],['draft_saved','변경 내용 저장'],['published','공개 반영'],['editor_open','편집 화면 열기']].map(([key,label])=>`<article><strong>${counts[key]||0}</strong><span>${label}</span></article>`).join('')}</div><p class="pf-field-note pf-positive-space">동의한 외부 브라우저 ${data.visitors?.[research?'research':'demo']||0}개 · 편집 화면 활동 날짜 ${data.editingDays?.[research?'research':'demo']||0}일<br>현재 분류의 최근 ${data.windowDays||90}일 기록입니다. 방문·작업 열기·연락 이동은 외부 방문자만, 공유 행동은 본인도 포함합니다. 같은 사람의 다른 브라우저는 구분됩니다.</p>${completion?`<p class="pf-timing-note">처음 시작부터 첫 공개까지 <strong>${Math.ceil(completion.metadata.elapsedSeconds/60)}분</strong><small>이 브라우저에서 측정한 경과 시간 · 휴식 포함 · 제품 효과 검증 아님</small></p>`:''}<section class="pf-measure-actions"><h3>이번 사용도 남겨둘까요?</h3><label class="pf-field">이번 갱신 이유 (자기보고)<select id="pf-return-reason"><option value="release">새 발매</option><option value="commission">협업·외주</option><option value="performance">공연</option><option value="representative-work">대표 작업 변경</option><option value="other">그 밖의 이유</option></select></label><button class="pf-btn pf-secondary" data-pf-action="report-return">선택한 갱신 이유 기록</button><label class="pf-field">제작 중 도움받은 횟수<input id="pf-help-count" type="number" min="0" max="100" value="0"></label><button class="pf-btn pf-secondary" data-pf-action="report-help">도움 횟수 기록</button><button class="pf-btn pf-secondary" data-pf-action="report-sns">실제 SNS에 게시했어요</button><p class="pf-field-note pf-positive-space">게시 여부는 제작자의 자기보고입니다. 실제 게시물 확인이나 확산 효과 검증으로 집계하지 않아요.</p></section><details class="pf-research-settings"><summary>사용 기록 참여 설정</summary><p>기본은 개인 체험·팀 시연입니다. 선택 기록은 동의한 경우에만 수집합니다. 테스트 참여로 전환하면 이후의 행동을 연구 기록으로 구분합니다. 내용·연락처·음원 파일 자체는 행동 기록에 포함하지 않습니다. 공개 방문자의 기록에는 별도 동의가 필요해요.</p><label class="pf-check"><input type="checkbox" id="pf-research-consent" ${enabled?'checked':''}><span>선택한 구분으로 행동을 기록하는 데 동의합니다.</span></label><div class="pf-two-actions"><button class="pf-btn pf-secondary" data-pf-action="measure-demo-on">시연 기록 켜기</button><button class="pf-btn pf-primary" data-pf-action="measure-research">테스트 참여 적용</button></div><button class="pf-text-button" data-pf-action="measure-demo">선택 행동 기록 끄기</button><small>분류를 바꿔도 이미 수집한 기록의 분류는 바뀌지 않습니다.</small></details><details class="pf-event-list"><summary>최근 행동 기록 ${Math.min(30,data.records?.length||0)}개</summary>${(data.records||[]).slice(0,30).map(r=>`<div><span>${esc(EVENT_LABELS[r.name]||r.name)}${recordDetails(r)?`<small>${esc(recordDetails(r))}</small>`:''}<small>${r.actor==='owner'?'본인':r.actor==='visitor'?'외부 방문자':'서버'} · ${r.mode==='research'?'테스트':'시연'} · ${r.evidence==='self-report'?'자기보고':r.evidence==='server'?'서버 확인':'클라이언트 기록'}</small></span><time>${esc(new Date(r.createdAt).toLocaleDateString('ko-KR'))}</time></div>`).join('')}</details><details class="pf-research-settings"><summary>기록 해석 기준과 한도</summary>${(data.limitations||[]).map(note=>`<p>${esc(note)}</p>`).join('')}</details><button class="pf-btn pf-secondary" data-pf-action="export-insights">기록 JSON 내려받기</button><p class="pf-field-note pf-positive-space">가입·실제 메일 발송·수신자의 응답은 측정하지 않습니다. 대화와 작업방은 별도 시연이며 이 지표에 포함하지 않습니다.${data.truncated?' 화면은 최근 30개, 내보내기는 최근 200개 사건입니다.':''}</p>`);
    }catch(error){if(ctx===model&&generation===run&&overlay===loadingOverlay)sheet('기록을 불러올 수 없어요',`<p class="pf-sheet-intro">${esc(errorText(error))}</p><button class="pf-btn pf-primary" data-pf-action="insights">다시 시도</button>`);}
  }
  async function hydrate(doc, currentGeneration) {
    const ids=[...new Set(doc.blocks.flatMap(b=>['image','audio','cover'].map(k=>b[k])).filter(x=>typeof x==='string'&&x.startsWith('asset:')).map(x=>x.slice(6)))];
    await Promise.all(ids.map(async id=>{
      if(blobs.has(id))return;
      const res=await fetch(`/api/media/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${ctx.token}`},cache:'no-store'});
      if(!res.ok){const e=new Error();e.status=res.status;throw e;}
      const blob=await res.blob();if(currentGeneration!==generation)return;blobs.set(id,URL.createObjectURL(blob));
    }));
  }
  function clearOverlay() {storyRun++;overlay?.remove();overlay=null;storyState=null;}
  function clearChrome() {document.querySelector('.device > .pf-publish-bar')?.remove();}
  function sheet(title,content) {
    clearOverlay();overlay=document.createElement('div');overlay.className='pf-overlay';
    overlay.innerHTML=`<section class="pf-sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="pf-handle"></div><div class="pf-sheet-head"><h2>${esc(title)}</h2><button class="pf-round" data-pf-action="close-sheet" aria-label="닫기">${icon('close')}</button></div>${content}</section>`;
    document.querySelector('.device').append(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)clearOverlay();});
    setTimeout(()=>overlay?.querySelector('button,input')?.focus(),0);
  }
  function messagePage(title,message,retry=true) {
    screen().innerHTML=`<div class="pf-page pf-state"><div class="pf-state-icon">${icon('link')}</div><h1>${esc(title)}</h1><p>${esc(message)}</p>${retry?'<button class="pf-btn pf-primary" data-pf-action="retry">다시 시도</button>':''}<a class="pf-btn pf-secondary" href="#portfolio">포트폴리오 홈</a></div>`;
  }
  function drawHubBase() {
    const records=getSaved();
    screen().innerHTML=`<div class="pf-page pf-hub"><header class="pf-hub-head"><div><div class="pf-eyebrow">YOUR WORK, YOUR WAY</div><h1>나를 보여주는<br>하나의 페이지<span class="pf-spark">✳</span></h1></div><button class="pf-round pf-soft" data-pf-action="info" aria-label="포트폴리오 사용 안내">${icon('eye')}</button></header><p class="pf-intro">음악도, 무대도, 작업의 순간도.<br>지금 보여주고 싶은 것부터 시작하세요.</p><div class="pf-hub-visual"><div class="pf-hub-cover"><img src="/assets/blue-hour.svg" alt=""></div><div class="pf-hub-editorial"><small>ARTIST / 001</small><strong>Made<br>of you.</strong><i>✳</i><span>소리 너머의 나를 소개하는 곳</span></div><div class="pf-hub-types"><span>${icon('music')} 음악</span><span>${icon('eye')} 영상</span><span>${icon('image')} 사진</span><span>${icon('link')} 링크</span></div></div><button class="pf-btn pf-primary pf-create" data-pf-action="create">${icon('plus')} 내 자료로 시작하기 ${icon('arrow')}</button><div class="pf-steps"><span>01 목적 선택</span><i></i><span>02 자료 배치</span><i></i><span>03 공유·연락</span></div><div class="pf-hub-secondary"><button data-pf-action="sample-templates">샘플로 먼저 둘러보기</button><button data-pf-action="restore-link">편집 링크로 이어서 작업</button></div><div class="pf-section-title"><h2>나의 페이지</h2><span>${records.length}개</span></div>${records.length?`<div class="pf-owned-list">${records.map((r,i)=>`<article class="pf-owned-card"><div class="pf-owned-heading"><span class="pf-saved-art">${String(i+1).padStart(2,'0')}</span><div class="pf-saved-info"><strong>${esc(r.title)}</strong><small>${r.publishedRevision?'공개 중':'비공개 초안'}</small></div><button class="pf-round" data-pf-action="forget" data-id="${esc(r.id)}" aria-label="${esc(r.title)} 이 기기 목록에서 숨기기">${icon('close')}</button></div><div class="pf-owned-actions"><a class="pf-btn pf-primary" href="#edit/${encodeURIComponent(r.id)}/${encodeURIComponent(r.editToken)}">${icon('edit')} 편집</a>${r.publishedRevision?`<a class="pf-btn pf-secondary" href="#p/${encodeURIComponent(r.id)}">${icon('eye')} 공개 페이지</a>`:`<a class="pf-btn pf-secondary" href="#edit/${encodeURIComponent(r.id)}/${encodeURIComponent(r.editToken)}">초안 이어 만들기</a>`}</div></article>`).join('')}</div>`:`<div class="pf-hub-empty">${icon('edit')}<p>첫 페이지를 만들어 보세요.<br><span>기존 링크만으로도 시작할 수 있어요.</span></p></div>`}<p class="pf-footnote">초안 저장과 공개 반영은 따로 이루어져요.<br>다른 기기에서는 보관한 편집 링크로 이어서 만드세요.</p></div>`;
  }
  function drawHub() {
    drawHubBase();
    const room=pendingRoom();
    if(room)screen().querySelector('.pf-section-title')?.insertAdjacentHTML('beforebegin',`<section class="pf-import-card"><div><span>${icon('check')}</span><div><small>작업방에서 완성한 작품</small><strong>${esc(room.title)}</strong></div></div><p>완성한 곡과 참여 크레딧을 나의 페이지에 더해 보세요. 초안으로 추가되며, 공개는 직접 결정해요.</p><button class="pf-btn pf-secondary" data-pf-action="import-menu">내 포트폴리오에 추가 ${icon('arrow')}</button></section>`);
  }
  function isRoute(hash) {return hash==='#portfolio'||/^#edit\/[^/]+\/[^/]+$/.test(hash)||/^#p\/[^/]+$/.test(hash)||/^#artist\/(harin|jun|seowoo)$/.test(hash);}
  async function render(hash) {
    if(!isRoute(hash))return false;
    const run=++generation;clearOverlay();clearChrome();screen().removeAttribute('aria-busy');
    for(const objectUrl of blobs.values())URL.revokeObjectURL(objectUrl);blobs.clear();
    ctx=null;screen().scrollTop=0;
    if(hash==='#portfolio'){drawHub();return true;}
    screen().innerHTML='<div class="pf-page pf-loading" role="status"><span class="pf-loader"></span><p>포트폴리오를 불러오는 중이에요.</p></div>';
    const parts=hash.slice(1).split('/');
    try {
      const id=decodeURIComponent(parts[1]);
      if(parts[0]==='artist') {
        ctx={id,doc:sample(id),public:true,sample:true};drawPublic();
      } else if(parts[0]==='p') {
        const result=await api(`/api/portfolios/${encodeURIComponent(id)}/public`);if(run!==generation)return true;
        ctx={id,doc:result.document,public:true,visitConsent:visitorConsent(id)};drawPublic();if(!ownedToken())eventLog('public_view');
      } else {
        ctx={id,token:decodeURIComponent(parts[2])};
        const result=await api(`/api/portfolios/${encodeURIComponent(id)}`,{auth:true});if(run!==generation)return true;
        ctx={...ctx,doc:result.draft,revision:result.revision,publishedRevision:result.publishedRevision,dirty:false,expanded:null,mode:'edit',busy:false,error:'',assets:result.assets||[],measurement:result.measurement,startedAt:getSaved().find(r=>r.id===id)?.startedAt};
        remember();
        try{await hydrate(ctx.doc,run);}catch(e){ctx.error='일부 파일을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.';}
        if(run===generation){drawEditor();eventLog('editor_open');}
      }
    } catch(error) {if(run===generation)messagePage(parts[0]==='p'?'아직 열 수 없는 페이지예요':'편집 페이지를 열 수 없어요',errorText(error));}
    return true;
  }
  function statusText() {return ctx.busy?'저장 중…':ctx.dirty?'저장하지 않은 변경사항':ctx.publishedRevision===ctx.revision?'저장됨 · 공유 페이지와 같음':ctx.publishedRevision?'초안 저장됨 · 공유 전':'초안 저장됨';}
  function updateStatus() {const el=screen().querySelector('[data-pf-status]');if(el){el.textContent=statusText();el.classList.toggle('is-dirty',ctx.dirty);}const s=screen().querySelector('[data-pf-action="save"]');if(s)s.disabled=ctx.busy||!ctx.dirty;}
  function dirty(){ctx.dirty=true;ctx.error='';updateStatus();}
  function fieldsFor(block) {
    const id=esc(block.id);
    const field=(key,label,placeholder='',multiline=false,limit=500)=>`<label class="pf-field">${label}${multiline?`<textarea data-pf-field="${key}" data-block="${id}" placeholder="${esc(placeholder)}" maxlength="${limit}" rows="4">${esc(block[key])}</textarea>`:`<input data-pf-field="${key}" data-block="${id}" value="${esc(block[key])}" placeholder="${esc(placeholder)}" maxlength="${limit}">`}</label>`;
    const select=(key,label,options)=>`<label class="pf-field">${label}<select aria-label="${esc(label)}" data-pf-field="${key}" data-block="${id}">${options.map(([value,text])=>`<option value="${esc(value)}" ${key==='releaseStatus'&&!value?'disabled':''} ${String(block[key]??(key==='preferredContact'?(block.contactEmail?'email':block.contactUrl?'link':'none'):''))===value?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;
    const parent=!['profile','track'].includes(block.type)?select('trackId','어디에 보여줄까요?',[['','포트폴리오 전체 소개'],...ctx.doc.blocks.filter(b=>b.type==='track').map(b=>[b.id,`${b.title||'제목 없는 곡'} · 곡 안에 표시`])]):'';
    const mediaField=(key,label,kind)=>{
      const src=media(block[key]);const uploaded=String(block[key]||'').startsWith('asset:');
      return `<div class="pf-field"><span>${label}</span><div class="pf-media-field">${kind==='image'?(src?`<img src="${esc(src)}" alt="${label} 미리보기">`:`<span class="pf-media-empty">${icon('image')}</span>`):`<span class="pf-media-empty">${icon('music')}</span>`}<div class="pf-media-info"><strong>${block[key]?(uploaded?'내가 올린 파일':kind==='audio'?'Blue Hour · 샘플 음원':'샘플 아트워크'):'선택한 파일 없음'}</strong><small>${kind==='audio'?'MP3 · 최대 15MB':'JPG, PNG, WebP · 최대 5MB'}</small></div></div><div class="pf-media-actions"><label class="pf-btn pf-secondary pf-upload-label">${icon('upload')} 파일 올리기<input type="file" class="pf-file-input" data-pf-upload="${key}" data-block="${id}" data-kind="${kind}" accept="${kind==='audio'?'.mp3,audio/mpeg':'image/png,image/jpeg,image/webp'}"></label><button class="pf-btn pf-secondary" data-pf-action="samples" data-block="${id}" data-field="${key}" data-kind="${kind}">샘플 선택</button>${block[key]?`<button class="pf-round" data-pf-action="clear-media" data-block="${id}" data-field="${key}" aria-label="${label} 제거">${icon('close')}</button>`:''}</div>${kind==='audio'&&src?`<audio class="pf-audio pf-edit-audio" controls preload="metadata" src="${esc(src)}" aria-label="${esc(block.title||'음원')} 미리 듣기"></audio>`:''}</div>`;
    };
    if(block.type==='profile')return mediaField('image','프로필 이미지','image')+field('name','이름','아티스트 이름',false,100)+field('role','하는 일 / 장르','Singer-songwriter · Indie R&B',false,160)+field('bio','소개','당신의 음악과 이야기를 소개해 주세요.',true,2000)+field('contactEmail','문의 받을 이메일','hello@example.com',false,254)+field('contactUrl','다른 연락 채널','https://instagram.com/…',false,2048)+select('preferredContact','주로 받을 연락 방법',[['email','이메일 우선'],['link','다른 연락 채널 우선'],['none','연락받지 않기']])+'<p class="pf-field-note">입력한 연락 방법은 공개 페이지의 문의하기에 표시돼요.</p>';
    if(block.type==='track')return `<button class="pf-feature-toggle ${block.featured?'selected':''}" data-pf-action="feature" data-block="${id}" aria-pressed="${!!block.featured}">${icon('spark')} <span>${block.featured?'대표곡으로 고정됨':'대표곡으로 고정하기'}</span><small>최대 3곡</small></button>`+field('title','곡 제목','나의 대표곡',false,200)+field('artist','아티스트','아티스트 이름',false,160)+field('participation','이 작업에서 맡은 역할','Guitar / Production / Vocal…',false,160)+select('releaseStatus','작업 상태',[...(!block.releaseStatus?[['','상태 선택 (선택 사항)']]:[]),['released','발매·공개한 작업'],['work-in-progress','작업 중·미발매']])+'<p class="pf-field-note">공유 페이지에 반영하면 작업 중 음원도 누구나 들을 수 있어요. 공개할 자료만 넣어 주세요.</p>'+mediaField('audio','음원','audio')+`<label class="pf-field">추천 시작 지점 (초)<div class="pf-start-field"><input type="number" min="0" max="3600" step="1" data-pf-number="startAt" data-block="${id}" value="${Number(block.startAt)||0}" aria-label="추천 시작 지점 (초)"><button class="pf-btn pf-secondary" data-pf-action="preview-start" data-block="${id}">여기부터 듣기</button></div><small class="pf-field-note">가장 먼저 들려주고 싶은 순간을 골라 주세요.</small></label>`+mediaField('cover','커버 이미지','image')+field('description','곡 소개','곡에 담긴 이야기를 들려주세요.',true,2000)+`<button class="pf-btn pf-secondary" data-pf-action="add-child" data-block="${id}">${icon('plus')} 이 곡에 이야기 · 참여자 추가</button>`;
    if(block.type==='text')return parent+select('variant','글 종류',[['text','소개 · 작업 이야기'],['lyrics','가사']])+field('title','제목','이야기의 제목',false,200)+field('body','내용','나의 음악, 작업 과정, 하고 싶은 이야기…',true,5000);
    if(block.type==='image')return parent+mediaField('image','이미지','image')+field('caption','설명','이미지에 짧은 이야기를 더해 주세요.',false,500);
    if(block.type==='link')return parent+select('variant','링크 종류',[['link','다른 채널'],['video','영상 링크']])+field('label','링크 이름','Instagram / SoundCloud / Live video',false,200)+field('url','주소','https://',false,2048)+'<p class="pf-field-note">영상은 업로드 없이 링크로 연결해요.</p>';
    if(block.type==='credits')return parent+field('title','제목','함께 만든 사람들',false,200)+`<div class="pf-credit-fields">${block.entries.map((entry,index)=>`<div class="pf-credit-entry"><div class="pf-credit-field"><label>이름<input data-pf-credit="name" data-block="${id}" data-entry="${index}" value="${esc(entry.name)}" maxlength="100" placeholder="이름"></label><label>참여 역할<input data-pf-credit="role" data-block="${id}" data-entry="${index}" value="${esc(entry.role)}" maxlength="160" placeholder="Vocal / Guitar"></label><button class="pf-round" data-pf-action="remove-credit" data-block="${id}" data-entry="${index}" aria-label="${index+1}번째 크레딧 삭제">${icon('close')}</button></div><label class="pf-field pf-credit-link">포트폴리오 태그<select aria-label="포트폴리오 태그" data-pf-credit="portfolioId" data-block="${id}" data-entry="${index}">${[['','연결 안 함'],...Object.entries(ARTISTS).map(([key,a])=>[`sample:${key}`,`${a.name} · 샘플`]),...getSaved().filter(r=>r.publishedRevision).map(r=>[r.id,r.title]),...(entry.portfolioId&&!entry.portfolioId.startsWith('sample:')&&!getSaved().some(r=>r.id===entry.portfolioId)?[[entry.portfolioId,'현재 연결된 포트폴리오']]:[])].map(([value,label])=>`<option value="${esc(value)}" ${(entry.portfolioId||'')===value?'selected':''}>${esc(label)}</option>`).join('')}</select></label></div>`).join('')}</div><button class="pf-btn pf-secondary" data-pf-action="add-credit" data-block="${id}" ${block.entries.length>=20?'disabled':''}>${icon('plus')} 참여자 추가</button><p class="pf-field-note pf-tag-note">태그를 누르면 참여자의 소개와 공개 페이지를 볼 수 있어요. 상대 페이지에 자동 등록되지는 않아요.</p>`;
    return '';
  }
  function blockSummary(b) {return b.name||b.title||b.label||b.caption||TYPES[b.type]?.[0]||'블록';}
  function appearanceUI() {
    const a=ctx.doc.appearance||{};
    return `<div class="pf-appearance"><span>포인트 컬러</span><div class="pf-palette" role="group" aria-label="포인트 컬러">${[['#d6eb99','라임'],['#b9d9e8','블루'],['#edc0ad','피치'],['#d4c5e8','라벤더']].map(([color,label])=>`<button style="--swatch:${color}" data-pf-action="accent" data-color="${color}" aria-label="${label}" aria-pressed="${a.accent===color}" class="${a.accent===color?'selected':''}">${a.accent===color?icon('check'):''}</button>`).join('')}</div><span>글꼴</span><div class="pf-font-options"><button data-pf-action="font" data-font="sans" aria-pressed="${a.font!=='serif'}" class="${a.font!=='serif'?'selected':''}">담백한 고딕</button><button data-pf-action="font" data-font="serif" aria-pressed="${a.font==='serif'}" class="${a.font==='serif'?'selected':''}">여유로운 명조</button></div></div>`;
  }
  function blockEditor(b,index) {
    const open=ctx.expanded===b.id;
    return `<article class="pf-block-editor ${open?'is-open':''}" data-editor-block="${esc(b.id)}"><div class="pf-block-head"><button class="pf-block-toggle" data-pf-action="toggle-block" data-block="${esc(b.id)}" aria-expanded="${open}"><span class="pf-block-type">${icon(TYPES[b.type][2])}</span><span class="pf-block-title"><small>${String(index+1).padStart(2,'0')} / ${TYPES[b.type][0]}</small><strong>${esc(blockSummary(b))}</strong></span>${icon(open?'up':'down')}</button></div>${open?`<div class="pf-block-fields">${fieldsFor(b)}<div class="pf-block-tools"><span class="pf-order-label">순서</span><button class="pf-round" data-pf-action="up" data-block="${esc(b.id)}" aria-label="${esc(TYPES[b.type][0])} 위로 이동" ${index===0?'disabled':''}>${icon('up')}</button><button class="pf-round" data-pf-action="down" data-block="${esc(b.id)}" aria-label="${esc(TYPES[b.type][0])} 아래로 이동" ${index===ctx.doc.blocks.length-1?'disabled':''}>${icon('down')}</button><span class="pf-tool-spacer"></span><button class="pf-round" data-pf-action="duplicate" data-block="${esc(b.id)}" aria-label="${esc(TYPES[b.type][0])} 복제">${icon('copy')}</button><button class="pf-round pf-danger" data-pf-action="delete" data-block="${esc(b.id)}" aria-label="${esc(TYPES[b.type][0])} 삭제">${icon('trash')}</button></div></div>`:''}</article>`;
  }
  function drawEditor() {
    if(!ctx?.doc||ctx.public)return;
    const pos=screen().scrollTop;
    screen().innerHTML=`<div class="pf-editor"><header class="pf-editor-header"><div class="pf-editor-top"><button class="pf-round" data-pf-action="back" aria-label="포트폴리오 홈으로">${icon('back')}</button><div class="pf-editor-heading"><strong>나의 포트폴리오</strong><span data-pf-status class="${ctx.dirty?'is-dirty':''}" role="status">${statusText()}</span></div><button class="pf-save" data-pf-action="save" ${ctx.busy||!ctx.dirty?'disabled':''}>저장</button></div><div class="pf-editor-modes"><button data-pf-action="mode-edit" class="${ctx.mode==='edit'?'active':''}">${icon('edit')} 편집</button><button data-pf-action="mode-preview" class="${ctx.mode==='preview'?'active':''}">${icon('eye')} 미리보기</button><button data-pf-action="links" class="pf-link-tool" aria-label="공개 링크와 편집 링크">${icon('link')}</button><button class="pf-link-tool" data-pf-action="insights" aria-label="나의 사용 기록">${icon('text')}</button></div></header>${ctx.error?`<div class="pf-error" role="alert">${esc(ctx.error)}${ctx.conflict?'<button data-pf-action="reload-confirm">최신 내용 불러오기</button>':''}</div>`:''}${ctx.mode==='edit'?`<div class="pf-editor-body"><label class="pf-field pf-title-field">페이지 이름<input data-pf-document="title" value="${esc(ctx.doc.title)}" maxlength="120" placeholder="나의 포트폴리오"></label><label class="pf-field">이 페이지의 목적<select data-pf-document="purpose" aria-label="이 페이지의 목적">${PURPOSES.map(([value,label])=>`<option value="${value}" ${(ctx.doc.purpose||'profile')===value?'selected':''}>${label}</option>`).join('')}</select></label><div class="pf-theme-heading"><h2>분위기를 골라보세요</h2><span>THEME</span></div><div class="pf-theme-options" role="group" aria-label="포트폴리오 테마">${[['sage','Sage','차분한 초록'],['night','Night','깊은 밤'],['paper','Paper','따뜻한 여백']].map(([value,label,desc])=>`<button class="pf-theme ${ctx.doc.theme===value?'selected':''}" data-pf-action="theme" data-theme="${value}" aria-pressed="${ctx.doc.theme===value}"><span class="pf-theme-swatch pf-swatch-${value}"><i></i><b></b><em></em>${ctx.doc.theme===value?icon('check'):''}</span><strong>${label}</strong><small>${desc}</small></button>`).join('')}</div><div class="pf-section-title"><h2>나의 블록</h2><span>${ctx.doc.blocks.length} / ${MAX_BLOCKS}</span></div><p class="pf-block-hint">이 순서대로 공개 페이지에 보여요. 곡에 연결한 자료는 해당 곡의 상세 안에 표시됩니다.</p><div class="pf-blocks">${ctx.doc.blocks.map(blockEditor).join('')}</div><button class="pf-add-block" data-pf-action="add-menu" ${ctx.doc.blocks.length>=MAX_BLOCKS?'disabled':''}>${icon('plus')} 블록 추가하기</button><p class="pf-editor-note">초안은 저장해 두고,<br>준비가 되었을 때 공유 페이지에 반영하세요.</p></div>`:`<div class="pf-preview-note">${icon('eye')} 지금 편집 중인 초안의 모습이에요</div>${documentHTML(ctx.doc,false)}`}<footer class="pf-publish-bar"><button class="pf-btn pf-primary" data-pf-action="publish" ${ctx.busy?'disabled':''}>${icon('share')} ${ctx.busy?'저장 중…':'공유 페이지에 반영'}</button><span>${ctx.publishedRevision?'공유한 링크는 그대로, 내용만 새롭게':'반영하면 로그인 없이 누구나 볼 수 있어요'}</span></footer></div>`;
    clearChrome();
    if(ctx.mode==='edit'){
      const themeHeading=screen().querySelector('.pf-theme-heading'),themeOptions=screen().querySelector('.pf-theme-options');
      if(themeHeading&&themeOptions){const details=document.createElement('details');details.className='pf-style-details';details.open=!!ctx.appearanceOpen;details.innerHTML=`<summary>${icon('spark')} 페이지 꾸미기 <span>${esc(ctx.doc.theme)} · 테마, 컬러, 글꼴</span>${icon('down')}</summary>`;themeHeading.before(details);details.append(themeOptions);details.insertAdjacentHTML('beforeend',appearanceUI());themeHeading.remove();details.addEventListener('toggle',()=>{if(ctx)ctx.appearanceOpen=details.open;});}
      screen().querySelectorAll('[data-editor-block]').forEach(el=>{const b=findBlock(el.dataset.editorBlock);if(b?.featured)el.classList.add('pf-is-featured');if(b?.trackId){el.classList.add('pf-is-child');const t=findBlock(b.trackId);el.querySelector('.pf-block-title small').textContent=`${TYPES[b.type][0]} · ${t?.title||'곡에 연결됨'}`;}});
    }
    const publishBar=screen().querySelector('.pf-publish-bar');
    if(publishBar)document.querySelector('.device').append(publishBar);
    screen().scrollTop=pos;
  }
  function documentHTML(doc,isPublic) {
    const tracks=doc.blocks.filter(b=>b.type==='track');
    const attached=b=>b.trackId&&tracks.some(t=>t.id===b.trackId);
    const profile=doc.blocks.find(b=>b.type==='profile');
    const blockHTML=(b,index)=>{
      if(b.type==='profile')return '<section class="pf-profile"><div class="pf-profile-art">'+(media(b.image,isPublic)?'<img src="'+esc(media(b.image,isPublic))+'" alt="'+esc(b.name)+' 프로필">':'<div class="pf-profile-art-empty">✳</div>')+'<span class="pf-profile-label">ARTIST PORTFOLIO</span><span class="pf-profile-stamp">✳</span></div><div class="pf-profile-copy"><p class="pf-profile-role">'+esc(b.role)+'</p><h1>'+esc(b.name||'Artist')+'</h1>'+(b.bio?'<p class="pf-profile-bio">'+esc(b.bio)+'</p>':'')+(b===profile?'<div class="pf-profile-actions">'+(b.preferredContact==='none'?'<span class="pf-contact-paused">현재 문의를 받지 않아요</span>':'<button class="pf-btn pf-primary" data-pf-action="inquiry">'+icon('people')+' 협업·작업 문의</button>')+'<button class="pf-round pf-contact-share" data-pf-action="share-menu" aria-label="포트폴리오 공유">'+icon('share')+'</button></div>':'')+'</div></section>';
      if(b.type==='track'){
        const children=doc.blocks.filter(c=>c.trackId===b.id);
        return '<section class="pf-track pf-content-block" data-pf-track="'+esc(b.id)+'"><div class="pf-content-kicker">'+(b.featured?'<span class="pf-featured-label">'+icon('spark')+' REPRESENTATIVE TRACK</span>':'MORE MUSIC')+'</div><div class="pf-track-identity">'+(media(b.cover,isPublic)?'<img src="'+esc(media(b.cover,isPublic))+'" alt="'+esc(b.title)+' 커버">':'<span class="pf-track-placeholder">'+icon('music')+'</span>')+'<div><h2>'+esc(b.title||'Untitled')+'</h2><p>'+esc(b.artist)+'</p></div><span class="pf-track-number">♪</span></div>'+(media(b.audio,isPublic)?'<button class="pf-listen-start" data-pf-action="play-start" data-block="'+esc(b.id)+'">'+icon('music')+' 추천 구간 듣기 <span>'+clock(b.startAt)+' 부터</span></button><audio class="pf-audio" controls preload="metadata" src="'+esc(media(b.audio,isPublic))+'" aria-label="'+esc(b.title||'음원')+' 재생"></audio>':'<p class="pf-file-missing">아직 등록된 음원이 없어요.</p>')+(b.participation?'<p class="pf-track-role">'+esc(b.participation)+'</p>':'')+(b.releaseStatus?'<span class="pf-release-state">'+(b.releaseStatus==='work-in-progress'?'작업 중 · 공개 자료':'발매·공개 작업')+'</span>':'')+(b.description?'<p class="pf-track-description">'+esc(b.description)+'</p>':'')+(children.length?'<details class="pf-track-details"><summary>곡의 이야기 · 참여자 <span>'+children.length+'</span>'+icon('down')+'</summary><div class="pf-track-story">'+children.map(blockHTML).join('')+'</div></details>':'')+'</section>';
      }
      if(b.type==='text')return '<section class="pf-story pf-content-block"><div class="pf-content-kicker">'+(b.variant==='lyrics'?'LYRICS':'BEHIND THE MUSIC')+'</div>'+(b.title?'<h2>'+esc(b.title)+'</h2>':'')+'<p class="'+(b.variant==='lyrics'?'pf-lyrics':'')+'">'+esc(b.body)+'</p></section>';
      if(b.type==='credits')return '<section class="pf-credits pf-content-block"><div class="pf-content-kicker">CREDITS</div><h2>'+esc(b.title||'함께 만든 사람들')+'</h2>'+b.entries.filter(e=>e.name||e.role).map((e)=>'<div class="pf-credit">'+(e.portfolioId?'<button data-pf-action="participant" data-portfolio="'+esc(e.portfolioId)+'" data-name="'+esc(e.name)+'" data-role="'+esc(e.role)+'">'+esc(e.name)+icon('arrow')+'</button>':'<strong>'+esc(e.name)+'</strong>')+'<span>'+esc(e.role)+'</span></div>').join('')+'</section>';
      if(b.type==='image')return '<figure class="pf-image-block">'+(media(b.image,isPublic)?'<button class="pf-image-open" data-pf-action="view-image" data-block="'+esc(b.id)+'" aria-label="'+esc(b.caption||'포트폴리오 이미지')+' 크게 보기"><img src="'+esc(media(b.image,isPublic))+'" alt="'+esc(b.caption||'포트폴리오 이미지')+'" loading="lazy"></button>':'')+(b.caption?'<figcaption>'+esc(b.caption)+'</figcaption>':'')+'</figure>';
      if(b.type==='link'){const url=safeLink(b.url);return '<section class="pf-link-block">'+(url?'<a href="'+esc(url)+'" data-pf-action="work-open" data-content="'+(b.variant==='video'?'video':'links')+'" target="_blank" rel="noopener noreferrer">'+icon(b.variant==='video'?'eye':'link')+'<span>'+(b.variant==='video'?'<small>WATCH THE VIDEO</small>':'')+esc(b.label||url)+'</span>'+icon('arrow')+'</a>':'<div class="pf-invalid-link">'+icon('link')+'<span>'+esc(b.label||'링크')+'</span><small>주소를 확인해 주세요</small></div>')+'</section>';}
      return '';
    };
    const ordered=doc.blocks.filter(b=>!attached(b));
    const accent=/^#[0-9a-f]{6}$/i.test(doc.appearance?.accent||'')?doc.appearance.accent:'';
    return '<div class="pf-document pf-theme-'+esc(['sage','night','paper'].includes(doc.theme)?doc.theme:'sage')+(doc.appearance?.font==='serif'?' pf-font-serif':'')+'"'+(accent?' style="--pf-accent:'+accent+'"':'')+'>'+(ordered.length?ordered.map(blockHTML).join(''):'<div class="pf-public-empty">아직 이야기를 준비하고 있어요.</div>')+'<div class="pf-document-end"><span>Made of music.</span><strong>tami<span>✳</span></strong></div></div>';
  }
  function drawPublic() {
    const owned=!ctx.sample?getSaved().find(r=>r.id===ctx.id):null;
    screen().innerHTML='<div class="pf-public"><header class="pf-public-header"><a href="'+(ctx.sample?'#explore':'#portfolio')+'" class="pf-public-brand" aria-label="TAMI '+(ctx.sample?'탐색':'포트폴리오 홈')+'">tami<span>✳</span></a>'+(ctx.sample?'<span class="pf-sample-badge">샘플 아티스트</span>':'')+'<button class="pf-public-share" data-pf-action="share-menu">'+icon('share')+' 공유</button></header>'+ (owned?'<div class="pf-owner-toolbar"><span>나의 공개 페이지</span><a href="#edit/'+esc(owned.id)+'/'+esc(owned.editToken)+'">'+icon('edit')+' 편집</a><button data-pf-action="story">스토리 카드</button></div>':'')+documentHTML(ctx.doc,true)+consentHTML()+'<div class="pf-public-cta"><p>다음 페이지는, 당신의 작업으로.</p><a class="pf-btn pf-primary" href="#portfolio">나도 만들기 '+icon('arrow')+'</a></div></div>';
  }
  async function saveDraft() {
    if(!ctx.dirty)return;
    const active=ctx,run=generation;
    for(const block of active.doc.blocks){if(block.type==='link'&&block.url&&!safeLink(block.url))throw new Error('링크 주소를 확인해 주세요. https:// 또는 http://로 시작해야 합니다.');}
    const snapshot=JSON.stringify(active.doc);
    const result=await api(`/api/portfolios/${encodeURIComponent(active.id)}`,{method:'PUT',body:{document:JSON.parse(snapshot),revision:active.revision},auth:true});
    active.revision=result.revision;active.publishedRevision=result.publishedRevision;active.dirty=JSON.stringify(active.doc)!==snapshot;active.conflict=false;remember(active);
    if(ctx!==active||run!==generation)throw Object.assign(new Error(),{cancelled:true});
    updateStatus();
  }
  async function operate(task) {
    if(ctx?.busy)return;
    const active=ctx,run=generation;
    if(active)active.busy=true;updateStatus();
    screen()?.querySelector('.pf-editor')?.setAttribute('inert','');
    screen()?.setAttribute('aria-busy','true');
    overlay?.setAttribute('inert','');
    document.querySelectorAll('[data-pf-action="publish"]').forEach(b=>b.disabled=true);
    try{await task();}catch(error){if(ctx===active&&run===generation&&!error.cancelled){if(ctx){ctx.error=errorText(error);ctx.conflict=error.status===409;}notify(errorText(error));}}
    finally{if(active){active.busy=false;if(ctx===active&&run===generation){screen()?.removeAttribute('aria-busy');overlay?.removeAttribute('inert');if(!ctx.public)drawEditor();}}}
  }
  function linksSheet(justPublished=false) {
    const published=!!ctx.publishedRevision;
    sheet(justPublished?'공유할 준비가 되었어요':'포트폴리오 링크',`<p class="pf-sheet-intro">${justPublished?'반영한 모습 그대로, 링크 하나로 음악을 들려주세요.':'공개 링크와 편집 링크는 서로 다른 역할을 해요.'}</p><div class="pf-link-card"><div class="pf-link-card-title">${icon('eye')}<strong>공개 보기 링크</strong><span>${published?'공개 중':'아직 비공개'}</span></div><p>로그인 없이 누구나 보고 음악을 들을 수 있어요.</p><input aria-label="공개 보기 링크" readonly value="${esc(urlFor('public'))}"><div class="pf-link-card-actions"><button class="pf-btn pf-primary" data-pf-action="copy-public" ${published?'':'disabled'}>${icon('copy')} 링크 복사</button>${published?`<a class="pf-btn pf-secondary" href="${esc(urlFor('public'))}" target="_blank" rel="noopener">열어보기 ${icon('arrow')}</a>`:''}</div>${published?'':'<small>‘공유 페이지에 반영’을 누르면 열 수 있어요.</small>'}</div><div class="pf-link-card pf-secret"><div class="pf-link-card-title">${icon('lock')}<strong>나만의 편집 링크</strong></div><p>이 링크를 가진 사람은 내용을 수정할 수 있어요.<br>다시 편집할 수 있도록 따로 보관해 주세요.</p><input aria-label="편집 링크" readonly value="${esc(urlFor('edit'))}"><button class="pf-btn pf-secondary" data-pf-action="copy-edit">${icon('copy')} 편집 링크 복사</button></div>`);
  }
  function appendLinkActions() {
    if(!ctx?.publishedRevision)return;
    overlay?.querySelector('.pf-sheet')?.insertAdjacentHTML('beforeend',`<button class="pf-btn pf-secondary" data-pf-action="story">${icon('image')} 공개된 내용으로 스토리 카드 만들기</button><button class="pf-text-button" data-pf-action="unpublish-ask">공개를 중지하고 비공개로 전환</button>`);
  }
  async function copy(text,message='링크를 복사했어요.') {
    try{await navigator.clipboard.writeText(text);notify(message);return true;}
    catch{sheet('링크 복사',`<p class="pf-sheet-intro">아래 링크를 길게 누르거나 선택해 복사해 주세요.</p><input class="pf-copy-fallback" aria-label="복사할 링크" value="${esc(text)}" readonly><button class="pf-btn pf-primary" data-pf-action="close-sheet">확인</button>`);overlay?.querySelector('input')?.select();return false;}
  }
  function templatesSheet() {
    if(!creationStartedAt)creationStartedAt=Date.now();
    sheet('무엇을 위해 만들까요?',`<div class="pf-onboard-step">START WITH YOUR PURPOSE <span>01 / 02</span></div><p class="pf-sheet-intro">하나의 목적에서 시작해도 좋아요.<br>자료와 순서는 나중에 자유롭게 바꿀 수 있어요.</p><div class="pf-purpose-options">${PURPOSES.map(([value,label,description])=>`<button data-pf-action="start-purpose" data-purpose="${value}" aria-pressed="${startChoice.purpose===value}" class="${startChoice.purpose===value?'selected':''}"><span>${icon(value==='promotion'?'share':value==='commission'?'people':'user')}</span><div><strong>${label}</strong><small>${description}</small></div>${icon(startChoice.purpose===value?'check':'arrow')}</button>`).join('')}</div><div class="pf-onboard-step">LEAD WITH YOUR WORK <span>02 / 02</span></div><h3 class="pf-onboard-question">가장 먼저 보여줄 자료는요?</h3><div class="pf-content-options">${CONTENTS.map(([value,label,ico])=>`<button data-pf-action="start-content" data-content="${value}" aria-pressed="${startChoice.content===value}" class="${startChoice.content===value?'selected':''}">${icon(ico)}<span>${label}</span></button>`).join('')}</div><label class="pf-field">이미 가지고 있는 링크 <small>선택</small><textarea data-pf-start-links rows="3" maxlength="10000" placeholder="SNS, 음악, 영상, 기존 포트폴리오 주소를 한 줄에 하나씩 입력하세요. 최대 5개">${esc(startChoice.links)}</textarea></label><p class="pf-field-note">링크 내용을 자동으로 가져오지 않아요. 입력한 링크를 골라 배치합니다.</p><button class="pf-btn pf-primary" data-pf-action="create-starter">이 구성으로 시작하기 ${icon('arrow')}</button><label class="pf-check pf-start-research"><input type="checkbox" data-pf-start-research ${startChoice.research?'checked':''}><span>사용자 테스트에 참여하며 작성·공개·공유 행동 기록에 동의합니다.<small>선택하지 않으면 개인 체험으로 구분하고 기본 저장·공개 이력만 남겨요. 내용·연락처·파일 자체는 행동 기록에 포함하지 않습니다.</small></span></label>`);
  }
  function sampleTemplatesSheet(){
    sheet('샘플로 흐름 살펴보기',`<p class="pf-sheet-intro">아래는 자료 구성을 이해하기 위한 시연 샘플입니다. 공유 카드의 시각 콘셉트와는 별도예요.</p><div class="pf-template-grid">${[['vocal','보컬 · 싱어송라이터','목소리와 곡의 이야기','blue-hour'],['producer','프로듀서 · 연주자','사운드와 참여 작업','orbit'],['band','밴드 · 팀','음악과 멤버 소개','afterglow']].map(([kind,label,description,art])=>`<button data-pf-action="create-template" data-template="${kind}"><img src="/assets/${art}.svg" alt=""><span><strong>${label}</strong><small>${description} · 샘플 복사</small></span>${icon('arrow')}</button>`).join('')}</div><a class="pf-btn pf-secondary" href="#artist/harin">복사 없이 공개 샘플 보기 ${icon('eye')}</a><button class="pf-text-button" data-pf-action="create-template" data-template="blank">빈 페이지로 시작하기</button>`);
  }
  function restoreLinkSheet(){
    sheet('이어서 작업하기',`<p class="pf-sheet-intro">보관한 TAMI 편집 링크를 붙여 주세요. 편집 링크를 가진 사람은 내용을 수정하고 공개할 수 있습니다.</p><label class="pf-field">나만의 편집 링크<input type="url" id="pf-restore-link" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://…/#edit/…"></label><button class="pf-btn pf-primary" data-pf-action="restore-link-confirm">내 초안 열기 ${icon('arrow')}</button>`);
  }
  function importSheet() {
    const room=pendingRoom();if(!room)return;
    sheet('완성곡을 어디에 더할까요?',`<p class="pf-sheet-intro"><b>${esc(room.title)}</b>의 음원과 선택한 이야기·크레딧을 가져옵니다. 공개된 페이지는 그대로 유지돼요.</p><div class="pf-import-options">${getSaved().map(r=>`<button data-pf-action="import-existing" data-id="${esc(r.id)}">${icon('music')}<span><strong>${esc(r.title)}</strong><small>기존 페이지의 초안에 곡 추가</small></span>${icon('arrow')}</button>`).join('')}</div><button class="pf-btn pf-primary" data-pf-action="create-room">${icon('plus')} 새 포트폴리오에 담기</button>`);
  }
  async function importAudio(room,model,track) {
    if(!room?.localFile)return false;
    const file=window.TamiWorkflow?.getRoomFile(room.id);if(!file)return false;
    const form=new FormData();form.append('file',file);
    const asset=await api(`/api/portfolios/${encodeURIComponent(model.id)}/assets`,{method:'POST',body:form,token:model.token});track.audio=`asset:${asset.id}`;return true;
  }
  async function createPortfolio(button,kind,room=null,documentOverride=null) {
    const run=generation;button.disabled=true;overlay?.setAttribute('inert','');
    try{
      const result=await api('/api/portfolios',{method:'POST',body:{document:documentOverride||(room?documentFromRoom(room):template(kind)),...(documentOverride&&startChoice.research?{measurement:{mode:'research',consent:true}}:{})}});
      const created={id:result.id,token:result.editToken,doc:result.draft,revision:result.revision,publishedRevision:result.publishedRevision,measurement:result.measurement,startedAt:creationStartedAt||Date.now()};remember(created);
      let uploaded=false;
      if(room?.localFile){try{uploaded=await importAudio(room,created,created.doc.blocks.find(b=>b.type==='track'));if(uploaded){const saved=await api(`/api/portfolios/${created.id}`,{method:'PUT',body:{document:created.doc,revision:created.revision},token:created.token});created.revision=saved.revision;}}catch{uploaded=false;}}
      if(room){try{localStorage.removeItem(PENDING);}catch{}}
      if(run===generation){clearOverlay();ctx=created;location.hash=`edit/${result.id}/${result.editToken}`;if(room?.localFile&&!uploaded)notify('초안을 만들었어요. 음원 블록에서 내 MP3를 다시 올려 주세요.');}
    }catch(e){if(run===generation){notify(errorText(e));overlay?.removeAttribute('inert');button.disabled=false;}}
  }
  async function importExisting(button) {
    const room=pendingRoom(),record=getSaved().find(r=>r.id===button.dataset.id);if(!room||!record)return;
    const run=generation;button.disabled=true;overlay?.setAttribute('inert','');
    try{
      const result=await api(`/api/portfolios/${encodeURIComponent(record.id)}`,{token:record.editToken});
      const blocks=blocksFromRoom(room);if(result.draft.blocks.length+blocks.length>MAX_BLOCKS)throw new Error('블록이 30개를 넘어요. 기존 블록을 정리하거나 새 포트폴리오에 담아 주세요.');
      const model={id:record.id,token:record.editToken,doc:result.draft,revision:result.revision,publishedRevision:result.publishedRevision};
      const uploaded=await importAudio(room,model,blocks[0]);model.doc.blocks.push(...blocks);
      const saved=await api(`/api/portfolios/${encodeURIComponent(model.id)}`,{method:'PUT',body:{document:model.doc,revision:model.revision},token:model.token});model.revision=saved.revision;remember(model);
      try{localStorage.removeItem(PENDING);}catch{}
      if(run===generation){clearOverlay();location.hash=`edit/${model.id}/${model.token}`;notify(room.localFile&&!uploaded?'초안에 추가했어요. 음원 블록에서 내 MP3를 다시 올려 주세요.':'기존 포트폴리오 초안에 추가했어요. 준비되면 공개에 반영해 주세요.');}
    }catch(e){if(run===generation){notify(errorText(e));overlay?.removeAttribute('inert');button.disabled=false;}}
  }
  function inquirySheet() {
    const p=ctx.doc.blocks.find(b=>b.type==='profile')||{};
    const email=typeof p.contactEmail==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactEmail)?p.contactEmail:'';
    const contact=safeLink(p.contactUrl),disabled=p.preferredContact==='none';
    const methods=disabled?[]:[...(email?[['email',email]]:[]),...(contact?[['link',contact]]:[])];
    methods.sort((a,b)=>Number(b[0]===p.preferredContact)-Number(a[0]===p.preferredContact));
    sheet('작업 문의를 준비해요',`<div class="pf-inquiry-recipient"><span>${icon('user')}</span><div><small>TO</small><strong>${esc(p.name||'아티스트')}</strong><p>${esc(p.role||'')}</p></div></div><p class="pf-sheet-intro">상대가 어떤 작업인지 빠르게 이해할 수 있게 정리해 보세요. 아래 항목은 모두 선택입니다.</p><label class="pf-field">관련 작업<select id="pf-inquiry-track"><option value="">선택하지 않음</option>${ctx.doc.blocks.filter(b=>b.type==='track'||(b.type==='link'&&b.variant==='video')).map(b=>`<option value="${esc(b.title||b.label)}">${esc(b.title||b.label||'제목 없는 작업')}</option>`).join('')}</select></label><div class="pf-inquiry-grid"><label class="pf-field">부탁할 역할<input id="pf-inquiry-role" maxlength="160" placeholder="기타 녹음, 편곡…"></label><label class="pf-field">희망 일정<input id="pf-inquiry-date" type="date"></label></div><label class="pf-field">회신받을 방법<input id="pf-inquiry-reply" maxlength="254" placeholder="내 이메일 또는 연락 가능한 채널"></label><label class="pf-field">함께하고 싶은 작업<textarea id="pf-inquiry-message" rows="4" maxlength="2000" placeholder="작업의 목적과 참고 자료를 자유롭게 적어 주세요."></textarea></label><button class="pf-btn pf-secondary" data-pf-action="copy-inquiry">${icon('copy')} 문의 내용 복사</button><div class="pf-contact-methods">${methods.map(([kind,value])=>kind==='email'?`<a class="pf-btn pf-primary" href="mailto:${encodeURIComponent(value)}" data-pf-action="compose-email" data-email="${esc(value)}">${icon('share')} 이메일 앱에서 이어쓰기 ${p.preferredContact==='email'?'<small>선호 연락</small>':''}</a>`:`<a class="pf-btn ${p.preferredContact==='link'?'pf-primary':'pf-secondary'}" href="${esc(value)}" data-pf-action="contact-open" target="_blank" rel="noopener noreferrer">${icon('link')} 연락 채널 열기 ${p.preferredContact==='link'?'<small>선호 연락</small>':''}</a>`).join('')}</div><p class="pf-field-note pf-inquiry-note">${methods.length?'TAMI가 문의를 전송하지는 않습니다. 복사한 내용을 선택한 연락 채널에 붙여 넣고 직접 보내 주세요. 문의 내용과 회신 연락처는 행동 기록에 저장하지 않아요.':disabled?'이 아티스트는 현재 문의를 받지 않아요.':'등록된 외부 연락 방법이 없습니다. 이 화면에서 문의를 보내지는 않습니다.'}</p>${ctx.sample?`<details class="pf-demo-details"><summary>샘플 대화 흐름 체험</summary><a class="pf-btn pf-secondary" href="#inquiry/${encodeURIComponent(p.name||'아티스트')}">TAMI 메시지 체험</a><p>실제 상대에게 전송되지 않는 시연입니다.</p></details>`:''}`);
  }
  function inquiryBody(){
    const val=id=>overlay?.querySelector(id)?.value.trim()||'';
    return ['안녕하세요. 포트폴리오를 보고 연락드립니다.',val('#pf-inquiry-track')&&`관련 작업: ${val('#pf-inquiry-track')}`,val('#pf-inquiry-role')&&`요청 역할: ${val('#pf-inquiry-role')}`,val('#pf-inquiry-date')&&`희망 일정: ${val('#pf-inquiry-date')}`,val('#pf-inquiry-reply')&&`회신 방법: ${val('#pf-inquiry-reply')}`,val('#pf-inquiry-message'),`참고 포트폴리오: ${urlFor('public')}`].filter(Boolean).join('\n\n');
  }
  async function participantSheet(button) {
    const id=button.dataset.portfolio,name=button.dataset.name,role=button.dataset.role,run=generation;
    const link=id.startsWith('sample:')?`#artist/${id.slice(7)}`:`#p/${id}`;
    sheet('함께 만든 사람',`<div class="pf-participant-card"><div class="pf-participant-avatar">${icon('user')}</div><h3>${esc(name)}</h3><p>${esc(role)}</p><span class="pf-participant-bio">소개를 불러오는 중이에요.</span><a class="pf-btn pf-primary" href="${esc(link)}">포트폴리오 보기 ${icon('arrow')}</a></div>`);
    const current=overlay;
    try{const doc=id.startsWith('sample:')?sample(id.slice(7)):(await api(`/api/portfolios/${encodeURIComponent(id)}/public`)).document;if(run!==generation||overlay!==current)return;const p=doc.blocks.find(b=>b.type==='profile');const bio=overlay.querySelector('.pf-participant-bio');bio.textContent=p?.bio||'음악과 이야기를 만나보세요.';const avatar=overlay.querySelector('.pf-participant-avatar');if(media(p?.image,true))avatar.innerHTML=`<img src="${esc(media(p.image,true))}" alt="${esc(p.name)}">`;}catch{if(overlay===current)overlay.querySelector('.pf-participant-bio').textContent='현재 공개된 소개를 불러올 수 없어요.';}
  }
  function shareSheet() {
    if(!ctx.public&&!ctx.publishedRevision){notify('먼저 공유 페이지에 반영해 주세요.');return;}
    sheet('음악을 세상과 연결해요',`<p class="pf-sheet-intro">지금 공개된 페이지를 공유합니다. 초안의 변경사항은 포함되지 않아요.</p><button class="pf-btn pf-primary" data-pf-action="copy-public">${icon('link')} 공개 링크 복사</button><button class="pf-btn pf-secondary" data-pf-action="story">${icon('image')} 인스타 스토리 카드 만들기</button><button class="pf-btn pf-secondary" data-pf-action="native-share">${icon('share')} 다른 앱으로 공유</button>`);
  }
  let storyState=null;
  async function storySheet() {
    if(!ctx.public&&!ctx.publishedRevision){notify('먼저 공유 페이지에 반영해 주세요.');return;}
    const active=ctx,run=generation;
    try{
      const doc=ctx.public?ctx.doc:(await api(`/api/portfolios/${encodeURIComponent(ctx.id)}/public`)).document;
      if(ctx!==active||run!==generation)return;
      const concept=ctx.doc.storyConcept||doc.storyConcept||'cover';
      sheet('나의 작업, 네 가지 모습',`<p class="pf-sheet-intro">같은 작업으로 서로 다른 분위기를 비교해 보세요.<br>공개된 자료만 담는 9:16 공유 카드입니다.</p><div class="pf-concepts" role="group" aria-label="공유 카드 시각 콘셉트">${CONCEPTS.map(([value,label,description],i)=>`<button data-pf-action="story-concept" data-concept="${value}" class="${concept===value?'selected':''}" aria-pressed="${concept===value}"><span class="pf-concept-thumb pf-concept-${value}"><b>${['SOUND.','Artist<br>notes.','ON<br>STAGE','FIELD<br>NOTES'][i]}</b><i>✳</i><em>${String(i+1).padStart(2,'0')}</em></span><strong>${label}</strong><small>${description}</small></button>`).join('')}</div><label class="pf-field">무엇을 소개할까요?<select aria-label="스토리 카드 내용" data-pf-story-select><option value="profile">아티스트 소개</option>${doc.blocks.filter(b=>['track','image','link'].includes(b.type)).map(b=>`<option value="${esc(b.id)}">${esc(b.title||b.caption||b.label||'사진')}</option>`).join('')}</select></label><div class="pf-story-canvas-wrap"><canvas width="1080" height="1920" class="pf-story-canvas" aria-label="스토리 카드 미리보기"></canvas></div><p class="pf-story-tip">PNG를 저장한 뒤 SNS에서 게시하고, 링크 스티커에 공개 링크를 붙여 주세요. 이미지에는 재생 기능이 포함되지 않습니다.</p><div class="pf-story-buttons"><button class="pf-btn pf-primary" data-pf-action="download-story">${icon('image')} PNG 내려받기</button><button class="pf-btn pf-secondary" data-pf-action="copy-public">${icon('link')} 공개 링크 복사</button></div>${ownedToken()?'<button class="pf-text-button" data-pf-action="report-sns">이미 SNS에 게시했다면 기록하기</button>':''}`);
      storyState={doc,url:urlFor('public'),selection:'profile',concept,ready:false};await paintStory();
    }catch(e){notify(errorText(e));}
  }
  async function paintStory() {
    const canvas=overlay?.querySelector('canvas');if(!canvas||!storyState)return;
    const turn=++storyRun,state=storyState;state.ready=false;
    const profile=state.doc.blocks.find(b=>b.type==='profile')||{},work=state.doc.blocks.find(b=>b.id===state.selection),g=canvas.getContext('2d');
    const title=work?.title||work?.caption||work?.label||profile.name||'Your next chapter';
    const sub=work?.participation||work?.artist||profile.role||'ARTIST PORTFOLIO';
    const body=work?.description||(work?.type==='link'?'영상과 작업 이야기는 공개 포트폴리오에서 만나보세요.':profile.bio)||'나의 작업과 이야기를 만나보세요.';
    const src=media(work?.cover||work?.image||profile.image,true);let img=null;
    if(src){try{img=new Image();img.src=src;await img.decode();}catch{img=null;}}
    if(turn!==storyRun||overlay?.querySelector('canvas')!==canvas)return;
    function photo(x,y,w,h){g.save();g.beginPath();g.rect(x,y,w,h);g.clip();if(img){const scale=Math.max(w/img.width,h/img.height),dw=img.width*scale,dh=img.height*scale;g.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);}else{const f=g.createLinearGradient(x,y,x+w,y+h);f.addColorStop(0,'#678375');f.addColorStop(1,'#b8cbad');g.fillStyle=f;g.fillRect(x,y,w,h);g.fillStyle='#eff4db';g.font='500px Georgia';g.textAlign='center';g.fillText('✳',x+w/2,y+h*.65);g.textAlign='left';}g.restore();}
    function wrap(text,x,y,width,lineHeight,maxLines){const chars=Array.from(String(text||'').replace(/\r/g,''));let line='',row=0;for(let i=0;i<chars.length;i++){const char=chars[i],next=line+char;if(char==='\n'||(g.measureText(next).width>width&&line)){if(row===maxLines-1){while(line&&g.measureText(line+'…').width>width)line=line.slice(0,-1);g.fillText(line+'…',x,y+row*lineHeight);return;}g.fillText(line,x,y+row*lineHeight);row++;line=char==='\n'?'':char;}else line=next;}g.fillText(line,x,y+row*lineHeight);}
    function footer(color,y=1810){g.fillStyle=color;g.fillRect(80,y-65,920,2);g.font='700 30px Manrope, sans-serif';g.fillText('tami ✳',80,y);g.font='24px sans-serif';g.fillText('작업과 연락 방법은 스토리의 링크에서',80,y+55);}
    g.clearRect(0,0,1080,1920);
    if(state.concept==='editorial'){
      g.fillStyle='#f1ebde';g.fillRect(0,0,1080,1920);g.fillStyle='#332f2b';g.font='26px sans-serif';g.fillText('THE ARTIST ISSUE / 001',80,105);g.font='italic 126px Georgia, serif';g.fillText('Artist notes.',70,265);g.fillRect(80,315,920,2);photo(80,365,920,850);g.fillStyle='#332f2b';g.font='26px sans-serif';wrap(sub,80,1300,900,39,2);g.font='72px Georgia, serif';wrap(title,80,1440,920,90,2);g.font='29px sans-serif';wrap(body,80,1640,920,46,2);footer('#332f2b');
    }else if(state.concept==='stage'){
      g.fillStyle='#191c23';g.fillRect(0,0,1080,1920);photo(0,300,1080,1120);const grad=g.createLinearGradient(0,1050,0,1450);grad.addColorStop(0,'transparent');grad.addColorStop(1,'#191c23');g.fillStyle=grad;g.fillRect(0,1050,1080,400);g.fillStyle='#d8ee9e';g.font='900 152px Manrope, sans-serif';g.fillText('ON STAGE',58,205);g.font='24px sans-serif';g.fillText('A MOMENT OF YOUR WORK',75,270);g.fillStyle='#f6f7f0';g.font='700 84px Manrope,sans-serif';wrap(title,75,1470,930,100,2);g.fillStyle='#cad4c4';g.font='30px sans-serif';wrap(sub,80,1690,920,45,1);footer('#d8ee9e');
    }else if(state.concept==='studio'){
      g.fillStyle='#d9e2d1';g.fillRect(0,0,1080,1920);g.strokeStyle='#aebb9f';g.lineWidth=1;for(let y=0;y<1920;y+=64){g.beginPath();g.moveTo(0,y);g.lineTo(1080,y);g.stroke();}g.fillStyle='#2e3e30';g.font='24px monospace';g.fillText('FIELD NOTES / WORK IN FOCUS',80,105);g.font='700 105px Manrope,sans-serif';wrap(title,80,240,920,115,2);g.save();g.translate(540,930);g.rotate(-.045);g.fillStyle='#f8f7ef';g.fillRect(-432,-470,864,975);photo(-400,-438,800,800);g.fillStyle='#53624a';g.font='27px monospace';wrap(sub,-390,425,790,42,1);g.restore();g.fillStyle='#33472f';g.font='29px sans-serif';wrap(body,80,1570,920,48,3);footer('#33472f');
    }else{
      g.fillStyle='#f1f5e7';g.fillRect(0,0,1080,1920);photo(0,0,1080,1200);const grad=g.createLinearGradient(0,760,0,1220);grad.addColorStop(0,'transparent');grad.addColorStop(1,'#f1f5e7');g.fillStyle=grad;g.fillRect(0,760,1080,460);g.fillStyle='#f1f5e7';g.fillRect(55,55,265,75);g.fillStyle='#293c2d';g.font='700 35px Manrope,sans-serif';g.fillText('tami ✳',82,106);g.font='27px sans-serif';wrap(sub,80,1245,920,42,2);g.font='700 84px Manrope,sans-serif';wrap(title,80,1390,920,100,2);g.font='30px sans-serif';wrap(body,80,1600,920,47,3);footer('#293c2d');
    }
    state.ready=true;
  }
  function downloadStory() {
    const canvas=overlay?.querySelector('canvas');if(!canvas||!storyState?.ready){notify('카드를 준비하는 중이에요. 잠시 후 다시 눌러 주세요.');return;}
    const concept=storyState.concept,model=ctx;
    canvas.toBlob(blob=>{if(!blob){notify('카드를 저장하지 못했어요. 다시 시도해 주세요.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`TAMI-${concept}-story.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);eventLog('card_save',{concept},model);notify('PNG 다운로드를 요청했어요. SNS 게시와 링크 추가는 직접 진행해 주세요.');},'image/png');
  }
  function addMenu(trackId='') {
    const choices=Object.entries(TYPES).filter(([type])=>!trackId||!['profile','track'].includes(type));
    sheet(trackId?'이 곡에 어떤 이야기를 더할까요?':'어떤 이야기를 더할까요?',`<p class="pf-sheet-intro">${trackId?'선택한 곡의 이야기와 참여자를 한곳에 모아요.':'필요한 블록을 골라 나만의 페이지를 만들어 보세요.'}</p><div class="pf-add-grid">${choices.map(([type,[title,desc,ico]])=>`<button data-pf-action="add-block" data-type="${type}" data-parent="${esc(trackId)}"><span>${icon(ico)}</span><strong>${title}</strong><small>${desc}</small></button>`).join('')}</div>`);
  }
  function samplesSheet(blockId,field,kind) {
    const choices=kind==='audio'?[['demo.wav','Blue Hour','직접 만든 48초 샘플']]:[['blue-hour.svg','Blue Hour','푸른 새벽'],['afterglow.svg','Afterglow','노을의 잔상'],['slow-bloom.svg','Slow Bloom','느리게 피어나는'],['orbit.svg','Orbit','작은 궤도']];
    sheet(kind==='audio'?'샘플 음원':'샘플 아트워크',`<p class="pf-sheet-intro">자유롭게 바꿔보며 포트폴리오를 만들어 보세요.</p><div class="pf-sample-choices">${choices.map(([file,title,description])=>`<button data-pf-action="sample-pick" data-block="${esc(blockId)}" data-field="${esc(field)}" data-file="${file}"><img src="/assets/${kind==='audio'?'blue-hour.svg':file}" alt=""><span><strong>${title}</strong><small>${description}</small></span>${icon('plus')}</button>`).join('')}</div>`);
  }
  function findBlock(id){return ctx?.doc?.blocks.find(b=>b.id===id);}
  function audioDuration(file) {
    return new Promise(resolve=>{const source=URL.createObjectURL(file),audio=new Audio();let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);const duration=Number.isFinite(audio.duration)&&audio.duration>0&&audio.duration<=7200?audio.duration:null;audio.removeAttribute('src');audio.load();URL.revokeObjectURL(source);resolve(duration);};const timer=setTimeout(finish,3000);audio.addEventListener('loadedmetadata',finish,{once:true});audio.addEventListener('error',finish,{once:true});audio.preload='metadata';audio.src=source;});
  }
  async function upload(input) {
    const file=input.files?.[0];if(!file)return;
    const kind=input.dataset.kind, block=findBlock(input.dataset.block), field=input.dataset.pfUpload;
    if(!block)return;
    if(file.size>(kind==='audio'?15:5)*1024*1024){notify(kind==='audio'?'15MB 이하의 MP3 파일을 선택해 주세요.':'5MB 이하의 이미지를 선택해 주세요.');input.value='';return;}
    if(kind==='audio'&&!/\.mp3$/i.test(file.name)){notify('MP3 파일을 선택해 주세요.');input.value='';return;}
    if(kind==='image'&&!/^image\/(png|jpeg|webp)$/.test(file.type)){notify('JPG, PNG 또는 WebP 이미지를 선택해 주세요.');input.value='';return;}
    const active=ctx,run=generation;
    await operate(async()=>{
      notify('파일을 올리는 중이에요.');
      const form=new FormData();form.append('file',file);
      const asset=await api(`/api/portfolios/${encodeURIComponent(ctx.id)}/assets`,{method:'POST',body:form,auth:true});
      if(ctx!==active||run!==generation)return;
      block[field]=`asset:${asset.id}`;ctx.assets.push(asset);blobs.set(asset.id,URL.createObjectURL(file));
      if(kind==='audio'){block.startAt=0;delete block.duration;const duration=await audioDuration(file);if(ctx!==active||run!==generation)return;if(duration)block.duration=duration;}
      dirty();
      notify('파일을 올렸어요. 초안을 저장해 주세요.');
    });
  }
  document.addEventListener('input',event=>{
    const el=event.target;
    if(el.matches('[data-pf-start-links]'))startChoice.links=el.value;
    if(el.matches('[data-pf-start-research]'))startChoice.research=el.checked;
    if(!ctx?.doc||ctx.public)return;
    if(el.dataset.pfDocument){ctx.doc[el.dataset.pfDocument]=el.value;dirty();}
    if(el.dataset.pfField){const b=findBlock(el.dataset.block);if(b){if(el.dataset.pfField==='releaseStatus'&&!el.value){el.value=b.releaseStatus||'';return;}if(el.dataset.pfField==='trackId'&&!el.value)delete b.trackId;else b[el.dataset.pfField]=el.value;dirty();}}
    if(el.dataset.pfNumber){const b=findBlock(el.dataset.block);if(b){const max=b.duration>0?Math.min(3600,Math.max(0,b.duration-0.1)):3600;b[el.dataset.pfNumber]=Math.max(0,Math.min(max,Number(el.value)||0));dirty();}}
    if(el.dataset.pfCredit){const b=findBlock(el.dataset.block),entry=b?.entries[Number(el.dataset.entry)];if(entry){if(el.dataset.pfCredit==='portfolioId'&&!el.value)delete entry.portfolioId;else entry[el.dataset.pfCredit]=el.value;dirty();}}
  });
  document.addEventListener('change',event=>{if(event.target.matches('[data-pf-upload]'))upload(event.target);if(event.target.matches('[data-pf-story-select]')&&storyState){storyState.selection=event.target.value;paintStory();}if(event.target.dataset.pfNumber){const b=findBlock(event.target.dataset.block);if(b)event.target.value=b[event.target.dataset.pfNumber];}});
  document.addEventListener('play',event=>{if(event.target.matches?.('.pf-audio')){document.querySelectorAll('audio').forEach(audio=>{if(audio!==event.target)audio.pause();});if(ctx?.public)eventLog('work_open',{content:'music'});}},true);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&overlay)clearOverlay();
    if(event.key==='Tab'&&overlay){const focusable=[...overlay.querySelectorAll('button:not(:disabled),a[href],input,textarea,select')];const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  });
  window.addEventListener('beforeunload',event=>{if(ctx?.dirty){event.preventDefault();event.returnValue='';}});
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-pf-action]');if(!button)return;
    const action=button.dataset.pfAction;
    if(button.disabled)return;
    const b=findBlock(button.dataset.block),index=b?ctx.doc.blocks.indexOf(b):-1;
    if(action==='close-sheet'){clearOverlay();return;}
    if(action==='retry'){render(location.hash);return;}
    if(action==='copy-public'){const model=ctx;if(await copy(urlFor('public')))eventLog('link_copy',{channel:'copy'},model);return;}
    if(action==='copy-edit'){copy(urlFor('edit'));return;}
    if(action==='create'){startChoice={purpose:'profile',content:'links',links:'',research:false};creationStartedAt=Date.now();templatesSheet();return;}
    if(action==='start-purpose'){startChoice.purpose=button.dataset.purpose;overlay.querySelectorAll('[data-pf-action="start-purpose"]').forEach(el=>{const selected=el.dataset.purpose===startChoice.purpose;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});return;}
    if(action==='start-content'){startChoice.content=button.dataset.content;overlay.querySelectorAll('[data-pf-action="start-content"]').forEach(el=>{const selected=el.dataset.content===startChoice.content;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});return;}
    if(action==='sample-templates'){creationStartedAt=Date.now();sampleTemplatesSheet();return;}
    if(action==='create-starter'){try{await createPortfolio(button,'blank',null,starterDocument());}catch(error){notify(errorText(error));}return;}
    if(action==='restore-link'){restoreLinkSheet();return;}
    if(action==='restore-link-confirm'){try{const url=new URL(overlay.querySelector('#pf-restore-link').value.trim());if(url.origin!==location.origin||url.pathname!==location.pathname||url.search||!/^#edit\/[0-9a-f-]{36}\/[A-Za-z0-9_-]{43}$/.test(url.hash))throw new Error();location.hash=url.hash;clearOverlay();}catch{notify('이 TAMI 사이트에서 보관한 편집 링크를 입력해 주세요.');}return;}
    if(action==='create-template'){await createPortfolio(button,button.dataset.template);return;}
    if(action==='create-room'){const room=pendingRoom();if(room)await createPortfolio(button,'vocal',room);return;}
    if(action==='import-menu'){importSheet();return;}
    if(action==='import-existing'){await importExisting(button);return;}
    if(action==='inquiry'){inquirySheet();return;}
    if(action==='compose-email'){const p=ctx.doc.blocks.find(b=>b.type==='profile');button.href=`mailto:${encodeURIComponent(button.dataset.email)}?subject=${encodeURIComponent(`[TAMI] ${p?.name||'아티스트'}님께 작업 문의`)}&body=${encodeURIComponent(inquiryBody())}`;eventLog('contact_open',{channel:'email'});return;}
    if(action==='copy-inquiry'){await copy(inquiryBody(),'문의 내용을 복사했어요. 연락 채널에서 직접 보내 주세요.');return;}
    if(action==='contact-open'){eventLog('contact_open',{channel:'link'});return;}
    if(action==='work-open'){eventLog('work_open',{content:button.dataset.content});return;}
    if(action==='view-image'&&b){sheet('작업 사진',`<img class="pf-image-detail" src="${esc(media(b.image,!!ctx.public))}" alt="${esc(b.caption||'포트폴리오 이미지')}"><p class="pf-sheet-intro">${esc(b.caption)}</p>`);eventLog('work_open',{content:'photos'});return;}
    if(action==='participant'){await participantSheet(button);return;}
    if(action==='share-menu'){shareSheet();return;}
    if(action==='story'){await storySheet();return;}
    if(action==='download-story'){downloadStory();return;}
    if(action==='story-concept'&&storyState){storyState.concept=button.dataset.concept;overlay.querySelectorAll('[data-pf-action="story-concept"]').forEach(el=>{const selected=el.dataset.concept===storyState.concept;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});if(ctx.token){ctx.doc.storyConcept=storyState.concept;dirty();}eventLog('design_select',{concept:storyState.concept});await paintStory();return;}
    if(action==='native-share'){const data={title:ctx.doc.title||'TAMI Portfolio',text:'나의 음악과 이야기를 만나보세요.',url:urlFor('public')};if(navigator.share){try{await navigator.share(data);}catch(e){if(e.name!=='AbortError')copy(data.url);}}else copy(data.url);return;}
    if(action==='play-start'||action==='preview-start'){
      if(!b)return;const audio=action==='preview-start'?screen().querySelector(`[data-editor-block="${b.id}"] audio`):screen().querySelector(`[data-pf-track="${b.id}"] audio`);if(!audio){notify('먼저 음원을 등록해 주세요.');return;}
      const seek=()=>{audio.currentTime=Math.max(0,Math.min(Number(b.startAt)||0,Number.isFinite(audio.duration)?Math.max(0,audio.duration-.1):3600));};if(audio.readyState)seek();else audio.addEventListener('loadedmetadata',seek,{once:true});audio.play().catch(()=>notify('음원을 재생할 수 없어요. 잠시 후 다시 시도해 주세요.'));return;
    }
    if(action==='visit-yes'||action==='visit-no'){setVisitorConsent(action==='visit-yes'?'yes':'no');clearOverlay();drawPublic();if(action==='visit-yes')eventLog('public_view');return;}
    if(action==='visit-settings'){sheet('방문 기록 설정',`<p class="pf-sheet-intro">익명 브라우저 식별자와 방문·작업 열기·공유·연락 버튼 사용을 기록합니다. 문의 내용은 포함하지 않습니다. 참여 중단은 이후 기록에 적용됩니다.</p><button class="pf-btn pf-primary" data-pf-action="visit-yes">기록에 동의</button><button class="pf-btn pf-secondary" data-pf-action="visit-no">참여하지 않기</button>`);return;}
    if(action==='insights'){await insightsSheet();return;}
    if(['measure-demo','measure-demo-on','measure-research'].includes(action)){
      if(action!=='measure-demo'&&!overlay.querySelector('#pf-research-consent')?.checked){notify('행동 기록 참여에 동의한 뒤 적용해 주세요.');return;}
      const model=ctx,form=overlay;button.disabled=true;try{const result=await api(`/api/portfolios/${ctx.id}/measurement`,{method:'PATCH',token:ownedToken(),body:{mode:action==='measure-research'?'research':'demo',consent:action!=='measure-demo'}});if(ctx===model)ctx.measurement=result.measurement;if(ctx===model&&overlay===form){await insightsSheet();notify('앞으로의 기록에 참여 설정을 적용했어요.');}}catch(error){notify(errorText(error));button.disabled=false;}return;
    }
    if(action==='report-return'){const model=ctx,form=overlay,reason=overlay.querySelector('#pf-return-reason')?.value;button.disabled=true;const recorded=await eventLog('edit_reason_reported',{reason},model);if(ctx!==model||overlay!==form)return;button.disabled=false;if(recorded){notify('선택한 갱신 이유를 자기보고로 기록했어요.');await insightsSheet();}else notify(model.recordingError||'기록하지 못했어요. 다시 시도해 주세요.');return;}
    if(action==='report-help'){const model=ctx,form=overlay,assistanceCount=Number(overlay.querySelector('#pf-help-count')?.value);if(!Number.isInteger(assistanceCount)||assistanceCount<0||assistanceCount>100){notify('횟수는 0~100 사이의 정수로 입력해 주세요.');return;}button.disabled=true;const recorded=await eventLog('help_reported',{assistanceCount},model);if(ctx!==model||overlay!==form)return;button.disabled=false;if(recorded){notify('도움 횟수를 자기보고로 기록했어요.');await insightsSheet();}else notify(model.recordingError||'기록하지 못했어요. 다시 시도해 주세요.');return;}
    if(action==='report-sns'){const selectedConcept=storyState?.concept||ctx.doc.storyConcept||'cover';if(!ownedToken()){notify('제작자의 편집 화면에서 기록할 수 있어요.');return;}sheet('실제 게시 여부 기록',`<p class="pf-sheet-intro">카드 저장이나 링크 복사는 게시가 아닙니다. 실제로 SNS에 올린 경우에만 기록해 주세요. 이 기록은 제작자의 자기보고이며 게시물 검증 결과가 아닙니다.</p><label class="pf-field">게시한 채널<select id="pf-sns-channel"><option value="instagram">Instagram</option><option value="other">그 밖의 SNS</option></select></label><button class="pf-btn pf-primary" data-pf-action="report-sns-confirm" data-concept="${esc(selectedConcept)}">실제 게시했다고 기록하기</button><button class="pf-btn pf-secondary" data-pf-action="close-sheet">아직 게시하지 않았어요</button>`);return;}
    if(action==='report-sns-confirm'){const model=ctx,form=overlay;button.disabled=true;const recorded=await eventLog('sns_post_reported',{channel:overlay.querySelector('#pf-sns-channel')?.value||'other',concept:button.dataset.concept||ctx.doc.storyConcept||'cover'},model);if(ctx!==model||overlay!==form)return;if(recorded){clearOverlay();notify('SNS 게시 자기보고를 기록했어요.');}else{button.disabled=false;notify(model.recordingError||'기록하지 못했어요. 다시 시도해 주세요.');}return;}
    if(action==='export-insights'&&ctx?.insights){const blob=new Blob([JSON.stringify(ctx.insights,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='TAMI-use-records.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(action==='info'){sheet('나만의 음악 페이지',`<div class="pf-info-steps"><p><b>01 / 자유롭게 편집</b>프로필, 음원, 크레딧, 글, 이미지, 링크를 조립해요.</p><p><b>02 / 나만의 파일</b>내 MP3와 이미지를 올리거나 샘플로 시작해요.</p><p><b>03 / 준비되면 공유</b>초안은 따로 저장하고, 반영한 내용만 공개해요.</p></div><button class="pf-btn pf-primary" data-pf-action="close-sheet">시작해 볼게요</button>`);return;}
    if(action==='forget'){const id=button.dataset.id;sheet('목록에서 숨길까요?',`<p class="pf-sheet-intro">이 기기의 목록에서만 사라져요. 공개 페이지는 유지됩니다. 다시 편집하려면 편집 링크가 필요해요.</p><button class="pf-btn pf-primary" data-pf-action="forget-confirm" data-id="${esc(id)}">이 기기에서 숨기기</button><button class="pf-btn pf-secondary" data-pf-action="close-sheet">취소</button>`);return;}
    if(action==='forget-confirm'){try{localStorage.setItem(STORE,JSON.stringify(getSaved().filter(r=>r.id!==button.dataset.id)));}catch{}clearOverlay();drawHub();return;}
    if(!ctx||ctx.public||ctx.busy)return;
    if(action==='mode-edit'||action==='mode-preview'){ctx.mode=action==='mode-edit'?'edit':'preview';drawEditor();screen().scrollTop=0;return;}
    if(action==='theme'){ctx.doc.theme=button.dataset.theme;dirty();drawEditor();return;}
    if(action==='accent'||action==='font'){ctx.doc.appearance={...ctx.doc.appearance,[action==='accent'?'accent':'font']:action==='accent'?button.dataset.color:button.dataset.font};dirty();drawEditor();return;}
    if(action==='feature'){if(!b.featured&&ctx.doc.blocks.filter(x=>x.type==='track'&&x.featured).length>=3){notify('대표곡은 최대 3곡까지 고정할 수 있어요.');return;}b.featured=!b.featured;dirty();drawEditor();return;}
    if(action==='toggle-block'){ctx.expanded=ctx.expanded===b.id?null:b.id;drawEditor();return;}
    if(action==='add-menu'){addMenu();return;}
    if(action==='add-child'){addMenu(b.id);return;}
    if(action==='add-block'){
      if(ctx.doc.blocks.length>=MAX_BLOCKS){notify('블록은 최대 30개까지 넣을 수 있어요.');return;}
      const block=fresh(button.dataset.type);if(button.dataset.parent)block.trackId=button.dataset.parent;ctx.doc.blocks.push(block);ctx.expanded=block.id;clearOverlay();dirty();drawEditor();screen().querySelector(`[data-editor-block="${block.id}"]`)?.scrollIntoView({block:'start',behavior:'smooth'});return;
    }
    if(action==='up'||action==='down') {const target=index+(action==='up'?-1:1);if(index>=0&&target>=0&&target<ctx.doc.blocks.length){[ctx.doc.blocks[index],ctx.doc.blocks[target]]=[ctx.doc.blocks[target],ctx.doc.blocks[index]];dirty();drawEditor();}return;}
    if(action==='duplicate'){if(ctx.doc.blocks.length>=MAX_BLOCKS){notify('블록은 최대 30개까지 넣을 수 있어요.');return;}const block=JSON.parse(JSON.stringify(b));block.id=uid();if(block.type==='track')block.featured=false;ctx.doc.blocks.splice(index+1,0,block);ctx.expanded=block.id;dirty();drawEditor();notify('블록을 복제했어요.');return;}
    if(action==='delete'){sheet('이 블록을 삭제할까요?',`<p class="pf-sheet-intro">${esc(blockSummary(b))} 블록을 초안에서 삭제합니다. 공유 페이지는 반영하기 전까지 그대로 유지돼요.</p><button class="pf-btn pf-primary" data-pf-action="delete-confirm" data-block="${esc(b.id)}">블록 삭제</button><button class="pf-btn pf-secondary" data-pf-action="close-sheet">취소</button>`);return;}
    if(action==='delete-confirm'){ctx.doc.blocks.splice(index,1);if(b.type==='track')ctx.doc.blocks.forEach(child=>{if(child.trackId===b.id)delete child.trackId;});ctx.expanded=null;clearOverlay();dirty();drawEditor();return;}
    if(action==='add-credit'){if(b.entries.length<20){b.entries.push({name:'',role:''});dirty();drawEditor();}return;}
    if(action==='remove-credit'){b.entries.splice(Number(button.dataset.entry),1);dirty();drawEditor();return;}
    if(action==='clear-media'){b[button.dataset.field]='';dirty();drawEditor();return;}
    if(action==='samples'){samplesSheet(b.id,button.dataset.field,button.dataset.kind);return;}
    if(action==='sample-pick'){b[button.dataset.field]=`/assets/${button.dataset.file}`;if(button.dataset.field==='audio'){b.duration=48;b.startAt=Math.min(47,Number(b.startAt)||0);}clearOverlay();dirty();drawEditor();return;}
    if(action==='links'){linksSheet();appendLinkActions();return;}
    if(action==='unpublish-ask'){sheet('공개를 중지할까요?',`<p class="pf-sheet-intro">공개 링크에서 페이지와 업로드한 파일을 더 이상 볼 수 없게 됩니다. 저장된 초안은 그대로 남고, 다시 반영하면 같은 링크로 공개할 수 있어요.</p><button class="pf-btn pf-primary" data-pf-action="unpublish">비공개로 전환</button><button class="pf-btn pf-secondary" data-pf-action="close-sheet">공개 유지</button>`);return;}
    if(action==='unpublish'){const active=ctx,run=generation;await operate(async()=>{const result=await api(`/api/portfolios/${active.id}/unpublish`,{method:'POST',body:{revision:active.revision},token:active.token});active.publishedRevision=null;active.revision=result.revision;remember(active);if(ctx===active&&run===generation){clearOverlay();notify('공개를 중지했어요. 초안은 계속 편집할 수 있어요.');}});return;}
    if(action==='save'){await operate(async()=>{await saveDraft();notify('초안을 저장했어요.');});return;}
    if(action==='publish'&&ctx.doc.blocks.some(block=>block.type==='track'&&block.releaseStatus==='work-in-progress')){sheet('작업 중 자료도 공개할까요?',`<p class="pf-sheet-intro">이 페이지에는 작업 중·미발매 음원이 있습니다. 반영하면 링크를 받은 누구나 페이지와 음원을 열 수 있어요. 접근 대상을 제한하는 비공개 공유 기능이 아닙니다.</p><button class="pf-btn pf-primary" data-pf-action="publish-confirm">공개에 반영하기</button><button class="pf-btn pf-secondary" data-pf-action="close-sheet">초안으로 두기</button>`);return;}
    if(action==='publish'||action==='publish-confirm'){
      const active=ctx,run=generation;
      await operate(async()=>{await saveDraft();if(ctx!==active||run!==generation)return;if(active.dirty)throw new Error('새로 바꾼 내용을 먼저 저장한 뒤 다시 반영해 주세요.');const result=await api(`/api/portfolios/${encodeURIComponent(active.id)}/publish`,{method:'POST',body:{revision:active.revision},auth:true});active.publishedRevision=result.publishedRevision;remember(active);const record=getSaved().find(r=>r.id===active.id);if(record?.startedAt&&!record.creationCompleted){const elapsedSeconds=Math.floor((Date.now()-record.startedAt)/1000);if(elapsedSeconds>=0&&elapsedSeconds<=604800&&await eventLog('creation_completed',{elapsedSeconds},active,record.completionEventId)){try{localStorage.setItem(STORE,JSON.stringify(getSaved().map(r=>r.id===active.id?{...r,creationCompleted:true}:r)));}catch{}}}if(ctx!==active||run!==generation)return;linksSheet(true);appendLinkActions();notify('공유 페이지에 반영했어요.');});return;
    }
    if(action==='back'){if(ctx.dirty)sheet('작업한 내용을 저장할까요?',`<p class="pf-sheet-intro">저장하면 편집 링크로 다시 이어서 만들 수 있어요.</p><button class="pf-btn pf-primary" data-pf-action="save-leave">저장하고 나가기</button><button class="pf-btn pf-secondary" data-pf-action="close-sheet">계속 편집하기</button><button class="pf-text-button" data-pf-action="discard-leave">이번 변경사항 버리고 나가기</button>`);else location.hash='portfolio';return;}
    if(action==='discard-leave'){ctx.dirty=false;clearOverlay();location.hash='portfolio';return;}
    if(action==='save-leave'){await operate(async()=>{await saveDraft();clearOverlay();location.hash='portfolio';});return;}
    if(action==='reload-confirm'){sheet('최신 초안을 불러올까요?',`<p class="pf-sheet-intro">현재 창에서 저장하지 않은 변경사항은 사라집니다. 다른 창에서 저장한 최신 초안을 불러와요.</p><button class="pf-btn pf-primary" data-pf-action="reload-draft">최신 초안 불러오기</button><button class="pf-btn pf-secondary" data-pf-action="close-sheet">현재 편집 유지</button>`);return;}
    if(action==='reload-draft'){ctx.dirty=false;render(location.hash);}
  });
  window.TamiPortfolio={isRoute,render,queueRoom,cleanup(){++generation;clearOverlay();clearChrome();screen()?.removeAttribute('aria-busy');ctx=null;for(const objectUrl of blobs.values())URL.revokeObjectURL(objectUrl);blobs.clear();}};
})();
