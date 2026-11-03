/* TAMI: workspace interactions are demonstrations; portfolio uses persistent server storage. */
const $ = s => document.querySelector(s);

// --- Supabase 설정 및 초기화 --
const SUPABASE_URL = 'https://ymiisppfazwbcpfqqxxs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaWlzcHBmYXp3YmNwZnFxeHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NjU1NzMsImV4cCI6MjEwODI0MTU3M30.GWMEDIbn0YOhGEX3MZ3KF4s4UF9cjl2avWCRVNvsAJw';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const icons = {
    plus: 'M12 5v14M5 12h14',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    back: 'M15 5l-7 7 7 7',
    chevron: 'M9 5l7 7-7 7',
    close: 'M6 6l12 12M18 6L6 18',
    search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    play: 'M8 5l11 7-11 7z',
    pause: 'M8 5v14M16 5v14',
    share: 'M12 15V3M7 8l5-5 5 5M5 12v8h14v-8',
    link: 'M10 14l4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
    check: 'M5 12l4 4L19 6',
    work: 'M3 8h18v12H3zM8 8V4h8v4M3 13h18M10 13v3h4v-3',
    compass: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M16 8l-3 5-5 3 3-5z',
    chat: 'M21 11a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4M7 10h10M7 14h6',
    user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',
    upload: 'M12 16V3M7 8l5-5 5 5M4 16v5h16v-5',
    music: 'M9 18V5l11-2v13M9 9l11-2M9 18a3 2 0 1 1-6 0 3 2 0 0 1 6 0M20 16a3 2 0 1 1-6 0 3 2 0 0 1 6 0',
    send: 'M22 2L9 15M22 2l-7 20-6-7-7-6z',
    repeat: 'M17 2l4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 13v3a2 2 0 0 1-2 2H3',
    prev: 'M5 5v14M18 5l-10 7 10 7z',
    next: 'M19 5v14M6 5l10 7L6 19z',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2',
    headphones: 'M3 14v-3a9 9 0 0 1 18 0v3M3 13h4v8H3zM17 13h4v8h-4z',
    globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3a20 20 0 0 1 0 18 20 20 0 0 1 0-18',
    edit: 'M15 4l5 5M4 20l5-1L21 7l-5-5L4 14z',
    lock: 'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4',
    folder: 'M3 6h7l2 3h9v12H3z',
    volume: 'M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8',
    spark: 'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z'
};
const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name] || icons.music}"/></svg>`;
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[c]));
const fmt = t => `${Math.floor((t || 0) / 60)}:${String(Math.floor((t || 0) % 60)).padStart(2, '0')}`;
const seeds = [{
    id: 'blue-hour',
    title: 'Blue Hour',
    subtitle: '푸른 새벽을 담은 첫 번째 데모',
    genre: 'Indie R&B',
    cover: 'blue-hour',
    status: 'progress',
    people: ['하린', '준', '서우'],
    duration: 48,
    comments: [{
        id: 'c1',
        name: '준',
        start: 8,
        end: 15,
        text: '여기 기타 톤 너무 좋아요. 보컬이 조금 더 앞으로 나오면 어떨까요?',
        time: '12분 전'
    }, {
        id: 'c2',
        name: '서우',
        start: 25,
        end: 33,
        text: '이 구간에 화음 한 겹 더 쌓아볼게요 🌿',
        time: '32분 전'
    }]
}, {
    id: 'afterglow',
    title: 'Afterglow',
    subtitle: '노을이 머무는 시간',
    genre: 'Alternative Pop',
    cover: 'afterglow',
    status: 'progress',
    people: ['하린', '서우'],
    duration: 48,
    comments: [{
        id: 'a1',
        name: '서우',
        start: 16,
        end: 24,
        text: '후렴으로 넘어가는 부분이 자연스러워졌어요!',
        time: '1시간 전'
    }]
}, {
    id: 'slow-bloom',
    title: 'Slow Bloom',
    subtitle: '조금 느리게 피어나는 마음',
    genre: 'Lo-fi / Indie',
    cover: 'slow-bloom',
    status: 'done',
    people: ['하린', '준'],
    duration: 48,
    comments: []
}, {
    id: 'orbit',
    title: 'Orbit',
    subtitle: '주위를 맴도는 작은 멜로디',
    genre: 'Electronic',
    cover: 'orbit',
    status: 'progress',
    people: ['하린'],
    duration: 48,
    comments: []
}];

let state;
try {
    state = JSON.parse(localStorage.getItem('tami-demo-v1'))
} catch {}
if (!state || !Array.isArray(state.rooms) || !state.rooms.length)
    state = {
        rooms: structuredClone(seeds),
        published: ['slow-bloom'],
        theme: 'light',
        messages: [],
        chatPeople: {},
        chatFiles: []
    };

function startSheet() {
    showSheet('TAMI 시작하기', `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 6px 0; color: #1c1b18;">TAMI 시작하기</h2>
        </div>
        <div style="background: #f7f6f0; border: 1px solid #c8c5b8; border-radius: 16px; padding: 20px;">
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button type="button" data-action="start-google" style="width: 100%; background: #fff; color: #333; border: 1px solid #c2bfb3; padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                    구글로 계속
                </button>
                <button type="button" data-action="start-email" style="width: 100%; background: #1c1b18; color: #fff; border: none; padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer;">
                    이메일로 계속
                </button>
            </div>
        </div>
    `);
}

// --- 1. 로그인 탭 구분 상태 변수 ---
let authTabMode = 'email'; // 'email' 또는 'social'

// --- 2. 통합 로그인 모달 (소셜/이메일 탭 지원) ---
function loginSheet(mode = 'email') {
    authTabMode = mode;
    
    const isEmail = authTabMode === 'email';
    
    showSheet('TAMI 시작하기', `
        ${sheetHeader('TAMI 시작하기')}
        <div style="background: #f7f6f0; border: 1px solid #c8c5b8; border-radius: 16px; padding: 20px; margin-top: 10px;">
            <!-- 탭 헤더 영역 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="font-size: 15px; font-weight: 700; color: #222; margin: 0; display: flex; align-items: center; gap: 6px;">
                    ${isEmail ? '🔑 이메일 로그인' : '🌐 소셜 로그인'}
                </h3>
                <button type="button" data-action="toggle-auth-tab" style="background: none; border: none; color: #4a62d6; font-size: 12px; font-weight: 600; cursor: pointer; padding: 0;">
                    ${isEmail ? '‹ 소셜 로그인' : '이메일 로그인 ›'}
                </button>
            </div>

            <!-- 이메일 로그인 폼 -->
            ${isEmail ? `
                <form id="login-form">
                    <div style="margin-bottom: 12px;">
                        <input id="login-email" type="email" placeholder="email@example.com" value="krsungjun@gmail.com" required 
                               style="width: 100%; padding: 12px 14px; border: 1px solid #c2bfb3; border-radius: 8px; font-size: 13px; box-sizing: border-box; background: #fff;">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <input id="login-password" type="password" placeholder="비밀번호" required 
                               style="width: 100%; padding: 12px 14px; border: 1px solid #c2bfb3; border-radius: 8px; font-size: 13px; box-sizing: border-box; background: #fff;">
                    </div>
                    <button type="submit" style="width: 100%; background: #1c1b18; color: #fff; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                        로그인
                    </button>
                    <p id="login-status" style="color: #e53935; font-size: 12px; margin-top: 10px; text-align: center; font-weight: 500;"></p>
                </form>
            ` : `
                <!-- 소셜 로그인 폼 -->
                <div style="display: flex; flex-direction: column; gap: 10px; margin: 10px 0 16px;">
                    <button id="btn-google-login" type="button" style="width: 100%; background: #fff; color: #333; border: 1px solid #c2bfb3; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                        Google 계정으로 계속하기
                    </button>
                </div>
            `}

            <!-- 회원가입 전환 링크 -->
            <div style="text-align: center; margin-top: 18px;">
                <button type="button" data-action="open-signup" style="background: none; border: none; color: #2e605d; font-size: 12px; text-decoration: underline; cursor: pointer;">
                    계정이 없으신가요? 회원가입하기
                </button>
            </div>
        </div>
    `);

    // 이벤트 리스너 바인딩
    if (isEmail) {
        $('#login-form').onsubmit = async e => {
            e.preventDefault();
            const email = $('#login-email').value.trim();
            const password = $('#login-password').value.trim();
            
            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
            if (error) {
                $('#login-status').textContent = '로그인 실패: ' + error.message;
            } else {
                currentUser = data.user;
                toast('성공적으로 로그인되었습니다.');
                closeSheet();
                route();
            }
        };
    } else {
        const googleBtn = $('#btn-google-login');
        if (googleBtn) {
            googleBtn.onclick = async () => {
                const { error } = await _supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: window.location.origin }
                });
                if (error) toast('Google 로그인 실패: ' + error.message);
            };
        }
    }
}

// --- 3. 회원가입 모달 ---
function signUpSheet() {
    showSheet('TAMI 회원가입', `
        ${sheetHeader('TAMI 회원가입')}
        <div style="background: #f7f6f0; border: 1px solid #c8c5b8; border-radius: 16px; padding: 20px; margin-top: 10px;">
            <form id="signup-form">
                <div style="margin-bottom: 12px;">
                    <label style="display:block; font-size:11px; color:#666; margin-bottom:4px;">이메일</label>
                    <input id="signup-email" type="email" placeholder="email@example.com" required 
                           style="width: 100%; padding: 10px 12px; border: 1px solid #c2bfb3; border-radius: 8px; font-size: 13px; box-sizing: border-box; background: #fff;">
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display:block; font-size:11px; color:#666; margin-bottom:4px;">비밀번호 (6자리 이상)</label>
                    <input id="signup-password" type="password" placeholder="비밀번호" minlength="6" required 
                           style="width: 100%; padding: 10px 12px; border: 1px solid #c2bfb3; border-radius: 8px; font-size: 13px; box-sizing: border-box; background: #fff;">
                </div>
                <button type="submit" style="width: 100%; background: #2e605d; color: #fff; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                    가입하기
                </button>
                <p id="signup-status" style="color: #e53935; font-size: 12px; margin-top: 10px; text-align: center; font-weight: 500;"></p>
            </form>
            <div style="text-align: center; margin-top: 16px;">
                <button type="button" data-action="open-login" style="background: none; border: none; color: #4a62d6; font-size: 12px; cursor: pointer;">
                    이미 계정이 있으신가요? 로그인하기
                </button>
            </div>
        </div>
    `);

    $('#signup-form').onsubmit = async e => {
        e.preventDefault();
        const email = $('#signup-email').value.trim();
        const password = $('#signup-password').value.trim();

        const { data, error } = await _supabase.auth.signUp({ email, password });
        if (error) {
            $('#signup-status').textContent = '가입 실패: ' + error.message;
        } else {
            toast('가입 확인 이메일이 발송되었습니다. 이메일을 확인해 주세요!');
            closeSheet();
        }
    };
}

let currentUser = null;

// --- Supabase 연동 로직 시작 (workgroups 및 workgroup_members 기반) ---
let unsubscribeRealtime = null;

async function checkUserSession() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        currentUser = user;
    } catch {
        currentUser = null;
    }
}

async function loadRoomsFromSupabase() {
    try {
        const { data, error } = await _supabase
            .from('workgroups')
            .select(`
                *,
                tracks(*),
                workgroup_members(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            // 각 작업방별 트랙 ID에 해당하는 피드백을 가져오기 위해 트랙 ID 목록 수집
            for (let dbRoom of data) {
                const trackIds = dbRoom.tracks?.map(t => t.id) || [];
                let feedbacksData = [];
                
                if (trackIds.length > 0) {
                    const { data: fbData } = await _supabase
                        .from('feedbacks')
                        .select('*')
                        .in('track_id', trackIds);
                    if (fbData) feedbacksData = fbData;
                }

                dbRoom.fetchedFeedbacks = feedbacksData;
            }

            state.rooms = data.map(dbRoom => ({
                id: dbRoom.id,
                title: dbRoom.workgroup_name,
                subtitle: dbRoom.description || '작업방 데모',
                genre: 'Work in progress',
                cover: 'blue-hour',
                status: dbRoom.view_yn === 'Y' ? 'progress' : 'done',
                people: dbRoom.workgroup_members?.map(m => m.name || m.member_email) || ['하린'],
                duration: 48,
                versions: dbRoom.tracks?.map(t => ({
                    id: t.id,
                    label: t.label || 'v1',
                    duration: t.duration || 48,
                    localFile: true,
                    filename: t.filename || t.track_name || 'audio.mp3',
                    fileUrl: t.file_url
                })) || [{ id: dbRoom.id + '-v1', label: 'v1', duration: 48, localFile: false, filename: 'Original demo.wav' }],
                activeVersion: dbRoom.tracks?.[0]?.id || (dbRoom.id + '-v1'),
                comments: dbRoom.fetchedFeedbacks?.map(f => ({
                    id: f.id,
                    name: f.author || '익명',
                    start: f.start_time || 0,
                    at: f.start_time || 0,
                    text: f.content || '',
                    resolved: f.resolved || false,
                    replies: f.replies || [],
                    versionId: f.track_id || dbRoom.tracks?.[0]?.id || (dbRoom.id + '-v1'),
                    time: '저장된 피드백'
                })) || []
            }));
            console.log('Supabase 작업방 및 피드백 로드 성공');
        }
    } catch (err) {
        console.warn('Supabase DB 연결 실패, 로컬 상태를 사용합니다:', err.message);
    }
}

function subscribeToRoomFeedbacks(roomId) {
    if (unsubscribeRealtime) {
        unsubscribeRealtime();
        unsubscribeRealtime = null;
    }

    const channel = _supabase
        .channel(`room-feedbacks-${roomId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'feedbacks' },
            payload => {
                const newComment = {
                    id: payload.new.id,
                    name: payload.new.author,
                    start: payload.new.start_time,
                    at: payload.new.start_time,
                    text: payload.new.content,
                    resolved: payload.new.resolved || false,
                    replies: payload.new.replies || [],
                    versionId: payload.new.track_id || currentRoom?.activeVersion,
                    time: '방금 전'
                };
                if (currentRoom && !currentRoom.comments.some(c => c.id === newComment.id)) {
                    currentRoom.comments.push(newComment);
                    renderDetail();
                    paintWave();
                    toast('새로운 피드백이 동기화되었습니다.');
                }
            }
        )
        .subscribe();

    unsubscribeRealtime = () => {
        _supabase.removeChannel(channel);
    };
}
// --- Supabase 연동 로직 끝 ---

const persist = () => {
    try {
        localStorage.setItem('tami-demo-v1', JSON.stringify(state))
    } catch {
        toast('저장 공간이 부족해 이번 화면에서만 유지됩니다.')
    }
};

const audio = $('#audio');
let currentRoom = null, playingRoom = null, view = 'work', filter = 'all', selection = null, segmentEnd = null, loop = false, activeDetail = 'comments', guest = false, sheetLastFocus = null, modalType = '', toastTimer, uploadFile = null, uploadChoice = false, objectURLs = new Map(), wavePeaks = Array.from({
    length: 64
}, (_, i) => .14 + .65 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * .31)));
let themeDraft = state.theme
  , sharedRoom = null;
const localPeaks = new Map();
const needsLocalFile = r => !!r?.localFile && !objectURLs.has(r.id);
const peaksFor = r => r?.localFile ? (localPeaks.get(r.id) || Array(64).fill(.15)) : wavePeaks;
fetch('assets/waveform.json').then(r => r.json()).then(d => {
    wavePeaks = d.peaks.filter( (_, i) => i % 3 !== 0);
    if (currentRoom)
        paintWave()
}
).catch( () => {}
);
const roomById = id => state.rooms.find(r => r.id === id) || sharedRoom?.id === id && sharedRoom || state.rooms[0];
const art = r => `assets/${r.cover || 'blue-hour'}.svg`;
const avatars = r => `<div class="avatar-stack">${r.people.slice(0, 3).map( (n, i) => `<span class="avatar a${i + 1}" title="${esc(n)}">${esc(n.slice(0, 1))}</span>`).join('')}</div>`;

async function checkUserSession() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        currentUser = user;
    } catch {
        currentUser = null;
    }
}
function toast(t) {
    clearTimeout(toastTimer);
    $('#toast').textContent = t;
    $('#toast').classList.add('show');
    toastTimer = setTimeout( () => $('#toast').classList.remove('show'), 2600)
}
function navigate(hash) {
    closeSheet();
    if (location.hash === hash)
        route();
    else
        location.hash = hash
}
function setActiveFlow() {
    document.querySelectorAll('.flow').forEach(e => e.classList.toggle('active', e.dataset.id === (view === 'portfolio' ? 'portfolio' : 'listen')))
}
function renderNav() {
    const selected = ['room', 'work'].includes(view) ? 'work' : view === 'artist' ? 'explore' : view === 'chat' ? 'messages' : view;
    $('#tabbar').style.display = guest ? 'none' : 'flex';
    $('#tabbar').innerHTML = [['portfolio', 'user', '내 페이지'], ['explore', 'compass', '샘플 탐색'], ['messages', 'chat', '대화 체험'], ['work', 'work', '작업방 체험']].map( ([id,ic,label]) => `<button data-action="nav" data-id="${id}" class="${id === selected ? 'active' : ''}" aria-current="${id === selected ? 'page' : 'false'}">${icon(ic)}<span>${label}</span></button>`).join('')
}
function renderMain() {
    if (view === 'work')
        renderWork();
    if (view === 'explore')
        renderExplore();
    if (view === 'messages')
        renderMessages();
    if (view === 'portfolio')
        renderPortfolio()
}
function renderWork() {
    const rooms = state.rooms.filter(r => filter === 'all' || r.status === filter);
    const recent = rooms[0];
    $('#screen').innerHTML = `<div class="page"><header class="page-header"><span class="wordmark">tami<span class="brand-star">✳</span></span><button class="icon-btn pale" data-action="nav" data-id="portfolio" aria-label="내 프로필"><span class="avatar a2">H</span></button></header><div class="row between" style="margin-bottom:17px"><div><div class="page-eyebrow">YOUR CREATIVE SPACE</div><h1 class="page-title">나의 작업방<span style="color:#a0ab8f;font-size:17px;margin-left:8px">${state.rooms.length}</span></h1></div><button class="icon-btn dark" data-action="create" aria-label="새 작업방 만들기">${icon('plus')}</button></div><aside class="tami-demo-context"><strong>작업방 흐름 체험</strong><p>음원 버전과 시점별 피드백을 미리 체험합니다. 이 브라우저의 시연 자료이며 실제 상대방과 동기화되지 않습니다.</p></aside><p class="welcome">작은 아이디어도 좋아요.<br><strong>오늘은 어떤 소리를 만들어 볼까요?</strong></p><div class="chips">${[['all', '전체'], ['progress', '진행 중'], ['done', '완료']].map( ([id,t]) => `<button class="chip ${filter === id ? 'active' : ''}" data-action="filter" data-id="${id}">${t}<span class="count">${id === 'all' ? state.rooms.length : state.rooms.filter(r => r.status === id).length}</span></button>`).join('')}</div>${recent ? `<button class="feature" data-action="open-room" data-id="${recent.id}" aria-label="${esc(recent.title)} 작업방 열기"><img src="${art(recent)}" alt="${esc(recent.title)} 앨범 아트"><span class="feature-tag"><i></i> ${filter === 'done' ? '완성된 작업' : '이어서 작업하기'}</span><div class="feature-info"><div><h2>${esc(recent.title)}</h2><p>${esc(recent.genre)} · ${recent.people.length}명의 아티스트</p></div><span class="feature-play">${icon('arrow')}</span></div></button>` : ''}<div class="section-heading"><h3>${filter === 'all' ? '우리의 음악이 자라는 곳' : filter === 'done' ? '완성된 음악' : '만들고 있는 음악'}</h3><span>${rooms.length} PROJECTS</span></div><div class="project-grid">${rooms.slice(1).map(projectCard).join('')}${rooms.length < 2 ? `<button class="project" data-action="create"><div class="upload-zone" style="aspect-ratio:1;margin:0;justify-content:center">${icon('plus')}<span>새로운 음악 시작하기</span></div></button>` : ''}</div><div class="activity">${icon('spark')}<p><strong>완성되지 않아도 괜찮아요.</strong><br>지금의 소리를 공유하고, 함께 다음을 만들어 가세요.</p></div><p class="mobile-demo-note">샘플 아티스트 · 시연용 작업 공간</p></div>`
}
function projectCard(r) {
    return `<button class="project" data-action="open-room" data-id="${r.id}"><div class="cover-wrap"><img src="${art(r)}" alt="${esc(r.title)} 커버"><span class="project-status">${r.status === 'done' ? '✓ 작업 완료' : '● 진행 중'}</span></div><h3>${esc(r.title)}</h3><div class="row between" style="margin-top:5px"><p>${r.comments.length ? `코멘트 ${r.comments.length}개` : '첫 아이디어를 기다려요'}</p>${avatars(r)}</div></button>`
}
function roomToolbar() {
    return `<div class="toolbar"><button class="icon-btn" data-action="${guest ? 'exit-guest' : 'nav'}" data-id="work" aria-label="작업방 목록으로">${icon('back')}</button><h2>${guest ? '공유받은 작업방' : '작업방'}</h2><button class="icon-btn" data-action="share" aria-label="작업방 공유">${icon('share')}</button></div>`
}
function ensureAudio(r) {
    if (!r || r.empty || needsLocalFile(r)) {
        audio.pause();
        playingRoom = null;
        segmentEnd = null;
        if (r) {
            navigate(`#room/${r.id}`);
            toast(r.empty ? '먼저 음원을 추가해 주세요.' : '저장한 작업방에서 MP3 파일을 다시 선택해 주세요.')
        }
        return false
    }
    if (playingRoom === r.id)
        return true;
    audio.pause();
    playingRoom = r.id;
    const v = versionFor(r);
    audio.src = objectURLs.get(r.id) || v.fileUrl || 'assets/demo.wav';
    audio.load();
    segmentEnd = null;
    return true
}
async function startAudio(r, start, end) {
    if (!ensureAudio(r))
        return false;
    if (Number.isFinite(start))
        audio.currentTime = start;
    segmentEnd = end ?? null;
    try {
        await audio.play()
    } catch {
        toast('음원을 재생하지 못했어요. 다시 눌러 주세요.'); 
        updatePlayerUI();
        renderMini();
        return false
    }
    updatePlayerUI();
    renderMini();
    return true
}
function renderMini() {
    const r = roomById(playingRoom);
    $('#mini-player').innerHTML = playingRoom && !currentRoom && !guest ? `<div class="mini"><img src="${art(r)}" alt="" data-action="open-room" data-id="${r.id}"><button class="grow" data-action="open-room" data-id="${r.id}"><strong>${esc(r.title)}</strong><p>${esc(versionFor(r).label)} · ${audio.paused ? '일시정지' : '지금 재생 중'}</p></button><button class="icon-btn" data-action="mini-play" aria-label="${audio.paused ? '미니 플레이어 재생' : '미니 플레이어 일시정지'}">${icon(audio.paused ? 'play' : 'pause')}</button><button class="icon-btn" data-action="mini-close" aria-label="미니 플레이어 닫기">${icon('close')}</button><span class="mini-progress"></span></div>` : '';
    updatePlayerUI()
}
function showSheet(type, html) {
    sheetLastFocus = document.activeElement;
    modalType = type;
    $('#overlay').innerHTML = `<div class="sheet-backdrop"><section class="sheet" role="dialog" aria-modal="true" aria-label="${type}"><div class="sheet-handle"></div>${html}</section></div>`;
    $('#screen').inert = true;
    $('#tabbar').inert = true;
    $('#mini-player').inert = true;
    $('#overlay .sheet-backdrop').addEventListener('click', e => {
        if (e.target.classList.contains('sheet-backdrop'))
            closeSheet()
    }
    );
    setTimeout( () => $('#overlay button, #overlay input')?.focus(), 30)
}
function closeSheet() {
    if (workflow.attachmentAudio) {
        workflow.attachmentAudio.pause();
        workflow.attachmentAudio = null
    }
    const was = !!$('#overlay').innerHTML;
    $('#overlay').innerHTML = '';
    modalType = '';
    $('#screen').inert = false;
    $('#tabbar').inert = false;
    $('#mini-player').inert = false;
    if (was && sheetLastFocus?.isConnected)
        sheetLastFocus.focus()
}
const sheetHeader = title => `<div class="sheet-header"><h2>${title}</h2><button class="icon-btn" data-action="close" aria-label="닫기">${icon('close')}</button></div>`;

function loginSheet() {
    showSheet('로그인', `
        ${sheetHeader('로그인')}
        <p>작업방을 만들고 데이터베이스와 동기화하려면 로그인해 주세요.</p>
        <form id="login-form">
            <label class="field">이메일<input id="login-email" type="email" placeholder="email@example.com" required></label>
            <label class="field">비밀번호<input id="login-password" type="password" placeholder="비밀번호" required></label>
            <button class="primary lime gap-top" type="submit">로그인하기</button>
            <p id="login-status" class="caption gap-top" style="color:red;"></p>
        </form>
    `);
    
    $('#login-form').onsubmit = async e => {
        e.preventDefault();
        const email = $('#login-email').value.trim();
        const password = $('#login-password').value.trim();
        
        const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
        if (error) {
            $('#login-status').textContent = '로그인 실패: ' + error.message;
        } else {
            currentUser = data.user;
            toast('로그인되었습니다.');
            closeSheet();
            route();
        }
    };
}

function chooseFile(f) {
    if (!f)
        return;
    if (!/\.mp3$/i.test(f.name)) {
        toast('MP3 파일을 선택해 주세요.');
        return
    }
    if (f.size > 50 * 1024 * 1024) {
        toast('50MB 이하의 MP3를 선택해 주세요.');
        return
    }
    uploadFile = f;
    uploadChoice = false;
    $('.demo-file').classList.remove('selected');
    $('#file-status').innerHTML = `<div class="file-success">✓ ${esc(f.name)} <span class="caption">${(f.size / 1024 / 1024).toFixed(1)}MB</span></div>`
}
async function readPeaks(file) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context)
        throw new Error('Audio decoding unavailable');
    const context = new Context();
    try {
        const buffer = await context.decodeAudioData(await file.arrayBuffer())
          , data = buffer.getChannelData(0)
          , peaks = [];
        for (let i = 0; i < 64; i++) {
            const start = Math.floor(i * data.length / 64)
              , end = Math.max(start + 1, Math.floor((i + 1) * data.length / 64));
            let sum = 0;
            for (let j = start; j < end; j++)
                sum += (data[j] || 0) ** 2;
            peaks.push(Math.sqrt(sum / (end - start)))
        }
        const max = Math.max(...peaks, .000001);
        return peaks.map(v => v / max)
    } finally {
        await context.close()
    }
}
function readDuration(url) {
    return new Promise( (resolve, reject) => {
        const a = new Audio();
        const timer = setTimeout( () => {
            a.src = '';
            reject()
        }
        , 6000);
        a.onloadedmetadata = () => {
            clearTimeout(timer);
            Number.isFinite(a.duration) && a.duration > 0 ? resolve(a.duration) : reject();
            a.src = ''
        }
        ;
        a.onerror = () => {
            clearTimeout(timer);
            reject()
        }
        ;
        a.src = url
    }
    )
}
function shareSheet(portfolio=false) {
    const a = artists.find(a => a.id === location.hash.split('/')[1]) || artists[0];
    const r = currentRoom || roomById(playingRoom) || state.rooms[0];
    const url = portfolio ? `${location.href.split('#')[0]}#artist/${a.id}` : makeShareURL(r);
    showSheet('공유', `${sheetHeader(portfolio ? '나의 음악을 세상에' : '함께 들으면 더 좋아요')}<p>${portfolio ? '나만의 포트폴리오를 링크 하나로 공유해 보세요.' : '링크를 받은 사람은 가입 없이 듣고<br>음악의 원하는 지점에 코멘트를 남길 수 있어요.'}</p><div class="share-preview"><img src="${portfolio ? `assets/${a.cover}.svg` : art(r)}" alt=""><div><h3>${portfolio ? a.name : esc(r.title)}</h3><p class="caption">${portfolio ? a.role + ' · Seoul' : '초대받은 사람을 위한 음악 작업방'}</p></div></div><div class="link-field">${esc(url.split('?')[0])}</div><button class="primary lime" data-action="copy-link" data-url="${esc(url)}">${icon('link')}링크 복사</button><button class="secondary" data-action="${portfolio ? 'public-preview' : 'guest-preview'}" data-id="${portfolio ? a.id : r.id}">${portfolio ? '공개 포트폴리오 미리보기' : '방문자 화면 미리보기'} ↗</button><p class="caption" style="font-size:9px;margin:17px 0 0">시연용 링크입니다. 샘플 음원으로 흐름을 체험하며, 실제 파일 전송이나 다른 사람과의 코멘트 동기화는 제공하지 않습니다.</p>`)
}
function finishSheet() {
    const r = currentRoom;
    showSheet('포트폴리오에 추가', `${sheetHeader('좋은 작업, 나의 대표작으로')}<p>함께 만든 음악에서 공개할 내용을 골라주세요.<br>선택하지 않은 작업 기록은 작업방에 남아요.</p><div class="share-preview"><img src="${art(r)}" alt=""><div><h3>${esc(r.title)}</h3><p class="caption">이 작업을 포트폴리오에 담습니다.</p></div></div><label class="check-row"><input type="checkbox" checked disabled><span>완성된 음원<small>포트폴리오에서 바로 들을 수 있어요.</small></span></label><label class="check-row"><input id="publish-credits" type="checkbox" checked><span>참여 크레딧<small>함께 만든 아티스트와 역할</small></span></label><label class="check-row"><input id="publish-story" type="checkbox"><span>작업 과정 한 줄<small>“작은 아이디어가 하나의 음악이 되기까지.”</small></span></label><p class="caption" style="margin:15px 0">코멘트와 미공개 파일은 공개되지 않아요.</p><button class="primary lime" data-action="publish-work">${icon('check')}완료하고 포트폴리오에 추가</button>`)
}
const artists = [{
    id: 'harin',
    name: 'harin.',
    role: 'Singer-songwriter',
    genre: 'Indie R&B',
    cover: 'blue-hour',
    line: '밤의 끝에서 꺼내 놓는 조용한 이야기.'
}, {
    id: 'jun',
    name: 'JUNE',
    role: 'Producer · Mixing engineer',
    genre: 'Alternative',
    cover: 'afterglow',
    line: '선명한 드럼, 따뜻한 질감. 그 사이의 소리.'
}, {
    id: 'seowoo',
    name: 'seowoo',
    role: 'Vocalist · Topliner',
    genre: 'Indie Pop',
    cover: 'slow-bloom',
    line: '계절이 바뀌어도 남아 있는 멜로디.'
}];
function renderExplore() {
    $('#screen').innerHTML = `<div class="page"><header class="page-header"><div><div class="page-eyebrow">PORTFOLIO EXAMPLES</div><h1 class="page-title">다른 소개 방식 둘러보기</h1></div></header><div class="search-field">${icon('search')}<input id="artist-search" placeholder="아티스트, 장르, 역할 검색" aria-label="아티스트 검색"></div><div class="chips" id="genre-chips">${['전체', 'Indie R&B', 'Alternative', 'Indie Pop'].map( (g, i) => `<button class="chip ${i === 0 ? 'active' : ''}" data-action="genre" data-id="${g}">${g}</button>`).join('')}</div><aside class="tami-demo-context"><strong>샘플 포트폴리오</strong><p>소개 방식과 자료 구성을 살펴보세요. 실제 활동 중인 아티스트의 추천 목록은 아닙니다.</p><a href="#portfolio">내 자료로 페이지 만들기 ↗</a></aside><p class="editorial-label">THREE DIFFERENT STORIES</p><div id="artist-results">${artists.map(artistCard).join('')}</div><p class="mobile-demo-note">실제 추천 결과가 아닌 샘플 아티스트입니다.</p></div>`;
    $('#artist-search').oninput = () => filterArtists()
}
function artistCard(a) {
    return `<button class="artist-card" data-action="artist" data-id="${a.id}"><div class="artist-cover"><img src="assets/${a.cover}.svg" alt="${a.name} 대표작 커버"><span class="artist-sticker">OPEN TO<br>COLLAB</span></div><div class="artist-line"><div><h3>${a.name}</h3><p>${a.role} · ${a.genre}</p></div>${icon('arrow')}</div></button>`
}
function filterArtists(genre) {
    const q = $('#artist-search').value.toLowerCase();
    const g = genre || $('#genre-chips .active')?.dataset.id || '전체';
    const found = artists.filter(a => (g === '전체' || a.genre === g) && `${a.name} ${a.role} ${a.genre}`.toLowerCase().includes(q));
    $('#artist-results').innerHTML = found.map(artistCard).join('') || '<div class="empty">일치하는 아티스트가 없어요.<br>다른 이름이나 장르로 찾아보세요.</div>'
}
function renderPortfolio(id) {
    const own = !id;
    const a = artists.find(a => a.id === id) || artists[0];
   // const publicHarin = id === 'harin';
    const pub = own || publicHarin ? state.published.map(roomById).filter(Boolean) : [state.rooms.find(r => r.cover === a.cover) || seeds[0]];
    const theme = own || publicHarin ? state.theme : 'light';
   // 로그인된 사용자의 이메일/ID를 괄호 형태로 정의
    const userIdentifier = currentUser ? `(${currentUser.email || currentUser.id})` : '';

    $('#screen').innerHTML = `<div class="page ${theme === 'dark' ? 'dark-profile' : theme === 'warm' ? 'warm-profile' : ''}">${own ? `<div class="toolbar"><h2 style="text-align:left">내 포트폴리오 <span style="font-size:12px; font-weight:normal; opacity:0.7;">${userIdentifier}</span></h2><button class="icon-btn" data-action="theme" aria-label="포트폴리오 꾸미기">${icon('edit')}</button><button class="icon-btn" data-action="share-portfolio" aria-label="포트폴리오 공유">${icon('share')}</button></div>` : `<div class="toolbar"><button class="icon-btn" data-action="nav" data-id="explore" aria-label="탐색으로 돌아가기">${icon('back')}</button><h2>Artist portfolio</h2><button class="icon-btn" data-action="share-portfolio" aria-label="포트폴리오 공유">${icon('share')}</button></div>`}<div class="profile-top"><img class="profile-banner" src="assets/${a.cover}.svg" alt="아티스트 배너"><div class="profile-identity"><div class="profile-avatar">${a.name.slice(0, 1).toUpperCase()}.</div><h1>${a.name}</h1><p class="profile-role">${a.role} · Seoul, KR</p><p class="profile-intro">${a.line}<br>오래 머물고 싶은 음악을 만듭니다.</p><div class="tag-row"><span class="tag">${a.genre}</span><span class="tag">Songwriting</span><span class="tag">협업 가능</span></div></div></div><div class="profile-actions"><button class="primary ${own ? '' : 'lime'}" data-action="${own ? 'share-portfolio' : 'contact'}" data-id="${a.id}">${icon(own ? 'link' : 'chat')}${own ? '내 페이지 공유하기' : '협업 이야기 나누기'}</button>${own ? `<button class="secondary" data-action="theme" aria-label="테마 변경">${icon('edit')}</button>` : ''}</div><div class="section-heading"><h3>소리로 소개할게요.</h3><span>SELECTED WORKS</span></div>${pub.map( (r, i) => `<div class="track-row"><img src="${art(r)}" alt="${esc(r.title)} 앨범 커버"><div class="grow"><h3>${esc(r.title)} ${i === 0 ? '<span class="tag" style="font-size:7px">대표작</span>' : ''}</h3><p>${r.publishedCredits === false ? 'Original track' : 'Written & performed by ' + a.name} · ${fmt(r.duration)}</p></div><button data-action="track-play" data-id="${r.id}" aria-label="${esc(r.title)} 재생">${icon('play')}</button></div>`).join('') || '<div class="empty">작업을 완성하고 첫 대표작을 담아보세요.</div>'}<div class="section-heading"><h3>음악이 되기까지</h3><span>BEHIND THE SOUND</span></div><div class="process-card"><div class="date">A NOTE FROM ${a.name.toUpperCase()}</div><strong>완벽한 시작보다, 솔직한 첫 소리.</strong><br>방 안에서 흥얼거린 멜로디에 친구들의 소리가 더해졌어요. 그렇게 우리의 음악이 되었습니다.</div>${pub.filter(r => r.publishedStory).map(r => `<div class="process-card gap-top"><strong>${esc(r.title)}</strong><br>작은 아이디어가 하나의 음악이 되기까지.</div>`).join('')}

    ${own ? (currentUser ? `
        <div style="margin: 10px 0 7px; text-align: center;">
            <button data-action="wf-logout" style="background: transparent; border: 1px solid #d5dbce; color: #5a6650; font-size: 8px; font-weight: 500; padding: 8px 16px; border-radius: 20px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                SIGN OUT
            </button>
        </div>
    ` : `
        <div style="margin: 10px 0 7px; text-align: center;">
            <button data-action="wf-login" style="background: transparent; border: 1px solid #d5dbce; color: #5a6650; font-size: 8px; font-weight: 500; padding: 8px 16px; border-radius: 20px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                SIGN IN
            </button>
        </div>
    `) : ''}

    <p class="mobile-demo-note">MADE WITH tami ✳ · 샘플 포트폴리오</p></div>`
}
function themeSheet() {
    themeDraft = state.theme;
    showSheet('포트폴리오 테마', `${sheetHeader('나의 음악, 나의 분위기')}<p>음악에 어울리는 페이지의 색을 골라주세요.</p><div class="theme-options">${[['light', 'Paper'], ['dark', 'Midnight'], ['warm', 'Sand']].map( ([id,t]) => `<button class="theme-option ${themeDraft === id ? 'active' : ''}" data-action="select-theme" data-id="${id}"><div class="theme-swatch"></div>${t}</button>`).join('')}</div><button class="primary lime" data-action="save-theme">이 분위기로 저장</button>`)
}
function aboutSheet() {
    showSheet('시연 안내와 디자인 레퍼런스', `${sheetHeader('TAMI, 지금은 프로토타입')}<p>아이디어가 음악이 되는 과정을 경험해 보세요.</p><div class="about-notice">① 작업방의 파형을 눌러 재생하고 좌우로 밀어보세요.<br>② 타임스탬프로 한 지점을 정해 코멘트를 남겨보세요.<br>③ 공유 메뉴에서 방문자 화면을 확인하세요.<br>④ 작업 완료 후 포트폴리오에 담아보세요.<br><br>샘플 아티스트와 원본 데모 음원을 사용합니다. 작업방과 메시지는 브라우저 안에서 체험하는 데모입니다. 내 포트폴리오에서는 파일 업로드·초안 저장·실제 공개 링크 공유가 가능합니다.</div><h3 style="font-size:13px;margin:12px 0">디자인 레퍼런스</h3><a class="ref-link" href="https://untitled.stream/" target="_blank" rel="noreferrer">[untitled] ↗<span>커버 중심의 작업 목록 · 프로젝트 구조</span></a><a class="ref-link" href="https://help.soundcloud.com/hc/en-us/articles/115003566008-Comments" target="_blank" rel="noreferrer">SoundCloud ↗<span>파형과 시간대별 코멘트의 연결</span></a><a class="ref-link" href="https://support.apple.com/en-euro/guide/iphone/iph676daac9b/ios" target="_blank" rel="noreferrer">Apple Music ↗<span>커버 중심 플레이어 · 지속되는 미니 플레이어</span></a><a class="ref-link" href="https://newsroom.spotify.com/2021-04-29/listeners-can-explore-their-spotify-collections-faster-and-easier-with-a-new-your-library-2/" target="_blank" rel="noreferrer">Spotify ↗<span>라이브러리 필터와 정보 위계 (2021 UI 참고)</span></a><a class="ref-link" href="https://www.bandlab.com/" target="_blank" rel="noreferrer">BandLab ↗<span>프로젝트 안의 협업 맥락</span></a><p class="caption" style="margin:15px 0">확인 기준: 2026.10.11 · 화면과 색상은 TAMI용으로 새롭게 디자인했습니다.</p>`)
}
document.addEventListener('click', async e => {
    const b = e.target.closest('[data-action]');
    if (!b)
        return;
    const {action, id} = b.dataset;
    switch (action) {
    case 'nav':
        navigate(`#${id}`);
        break;
    case 'open-room':
        navigate(`#room/${id}`);
        break;
    case 'filter':
        filter = id;
        renderWork();
        break;
    case 'create':
        createSheet();
        break;
    case 'add-audio':
        createSheet(true);
        break;
    case 'close':
        closeSheet();
        break;
    case 'select-demo':
        uploadFile = null;
        uploadChoice = true;
        b.classList.add('selected');
        b.querySelector('.icon').outerHTML = icon('check');
        $('#file-status').innerHTML = '';
        if ($('#room-title') && !$('#room-title').value)
            $('#room-title').value = '나의 첫 번째 데모';
        break;
    case 'play':
        if (playingRoom === currentRoom.id && !audio.paused)
            audio.pause();
        else
            await startAudio(currentRoom, audio.ended ? 0 : undefined);
        break;
    case 'mini-play':
        if (audio.paused)
            await startAudio(roomById(playingRoom));
        else
            audio.pause();
        break;
    case 'mini-close':
        audio.pause();
        playingRoom = null;
        renderMini();
        break;
    case 'seek':
        if (!ensureAudio(currentRoom))
            break;
        audio.currentTime = Math.max(0, Math.min(currentRoom.duration, audio.currentTime + Number(id)));
        segmentEnd = null;
        updatePlayerUI();
        break;
    case 'loop':
        loop = !loop;
        b.classList.toggle('active', loop);
        b.setAttribute('aria-pressed', loop);
        toast(loop ? '선택한 구간을 반복해 들을 수 있어요.' : '구간 반복을 해제했어요.');
        break;
    case 'volume':
        audio.muted = !audio.muted;
        b.setAttribute('aria-pressed', audio.muted);
        b.style.opacity = audio.muted ? '.3' : '1';
        toast(audio.muted ? '음소거했어요.' : '소리를 켰어요.');
        break;
    case 'comment-play':
        {
            const c = currentRoom.comments.find(c => c.id === id);
            if (c) {
                selection = {
                    start: c.start,
                    end: c.end
                };
                await startAudio(currentRoom, c.start, c.end);
                paintWave();
                updateSelectionLabel()
            }
        }
        break;
    case 'detail':
        activeDetail = id;
        renderDetail();
        break;
    case 'share':
        shareSheet();
        break;
    case 'share-portfolio':
        shareSheet(true);
        break;
    case 'copy-link':
        try {
            await navigator.clipboard.writeText(b.dataset.url);
            toast('시연 링크를 복사했어요.')
        } catch {
            toast('복사가 제한되어 있어요. 표시된 링크를 선택해 주세요.');
            const f = $('.link-field');
            f.textContent = b.dataset.url;
            f.style.whiteSpace = 'normal';
            f.style.overflowWrap = 'anywhere';
            f.setAttribute('tabindex', '0');
            const range = document.createRange();
            range.selectNodeContents(f);
            getSelection().removeAllRanges();
            getSelection().addRange(range)
        }
        break;
    case 'guest-preview':
        navigate(makeShareURL(currentRoom || roomById(id)).split('#')[1] ? '#' + makeShareURL(currentRoom || roomById(id)).split('#')[1] : '#work');
        toast('방문자 화면으로 전환했어요.');
        break;
    case 'exit-guest':
        navigate('#work');
        break;
    case 'public-preview':
        navigate(`#artist/${id || 'harin'}`);
        break;
    case 'finish':
        finishSheet();
        break;
    case 'publish-work':
        publishWork();
        break;
    case 'members':
        showSheet('참여 아티스트', `${sheetHeader('함께 만드는 사람들')}<p>서로 다른 소리가 모여 하나의 음악이 됩니다.</p>${currentRoom.people.map( (n, i) => `<div class="member-row"><span class="avatar lg a${i + 1}">${esc(n.slice(0, 1))}</span><div>${esc(n)}<small>${['Songwriting · Vocal', 'Production · Mixing', 'Vocal · Topline'][i % 3]}</small></div><span class="tag">${i === 0 ? '나' : '함께 작업 중'}</span></div>`).join('')}<p class="caption gap-top">이 화면은 샘플 참여자와 역할을 보여줍니다.</p>`);
        break;
    case 'genre':
        document.querySelectorAll('#genre-chips .chip').forEach(c => c.classList.toggle('active', c === b));
        filterArtists(id);
        break;
    case 'artist':
        navigate(`#artist/${id}`);
        break;
    case 'chat':
        navigate(`#chat/${id}`);
        break;
    case 'track-play':
        if (await startAudio(roomById(id), 0)) {
            renderMini();
            toast('음악을 재생합니다.')
        }
        break;
    case 'contact':
        navigate(`#chat/${id === 'harin' ? 'jun' : id}`);
        break;
    case 'theme':
        themeSheet();
        break;
    case 'select-theme':
        themeDraft = id;
        document.querySelectorAll('.theme-option').forEach(c => c.classList.toggle('active', c === b));
        break;
    case 'save-theme':
        state.theme = themeDraft;
        persist();
        closeSheet();
        renderPortfolio();
        toast('포트폴리오의 분위기를 바꿨어요.');
        break;
    case 'about':
        aboutSheet();
        break;
    case 'reset':
        showSheet('데모 초기화', `${sheetHeader('처음부터 다시 둘러볼까요?')}<p>이 브라우저에서 추가한 작업방, 코멘트, 메시지를 지우고 샘플 화면으로 돌아갑니다.</p><button class="primary" data-action="confirm-reset">데모 초기화</button><button class="secondary" data-action="close">취소</button>`);
        break;
    case 'confirm-reset':
        audio.pause();
        playingRoom = null;
        objectURLs.forEach(u => URL.revokeObjectURL(u));
        objectURLs.clear();
        localPeaks.clear();
        state = {
            rooms: structuredClone(seeds),
            published: ['slow-bloom'],
            theme: 'light',
            messages: [],
            chatPeople: {},
            chatFiles: []
        };
        persist();
        filter = 'all';
        navigate('#work');
        toast('처음의 작업 공간으로 돌아왔어요.');
        break;
    case 'scenario':
        document.querySelectorAll('.flow').forEach(c => c.classList.toggle('active', c === b));
        if (id === 'create') {
            navigate('#work');
            setTimeout( () => createSheet(), 30)
        } else if (id === 'portfolio') {
            navigate('#room/blue-hour');
            setTimeout( () => finishSheet(), 30)
        } else
            navigate('#room/blue-hour');
        break;
    case 'wf-login':
        loginSheet();
        break;
    case 'wf-logout':
        await handleSignOut();
        break;
    case 'toggle-auth-tab':
        loginSheet(authTabMode === 'email' ? 'social' : 'email');
        break;
    case 'open-signup':
        signUpSheet();
        break;
    case 'open-login':
        loginSheet('email');
        break;
    case 'start-google':
        {
            const { error } = await _supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            if (error) toast('Google 로그인 실패: ' + error.message);
        }
        break;
    case 'start-email':
        loginSheet('email');
        break;
    }
}
);
document.addEventListener('keydown', e => {
    if (!modalType)
        return;
    if (e.key === 'Escape') {
        closeSheet();
        return
    }
    if (e.key === 'Tab') {
        const all = [...$('#overlay').querySelectorAll('button:not(:disabled), input:not(:disabled), textarea, a[href]')].filter(el => el.offsetParent !== null);
        if (!all.length)
            return;
        const first = all[0]
          , last = all.at(-1);
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus()
        }
    }
}
);

// Workroom and messages are local demonstrations. Published portfolios are separate.
const workflow = {
    stamp: false,
    stampConfirmed: false,
    stampTime: 0,
    chatId: 'jun',
    chatFilter: 'all',
    files: new Map(),
    liveId: null,
    attachmentAudio: null
};
const defaultRoles = ['Songwriting · Vocal', 'Production · Mixing', 'Vocal · Topline'];
function normalizeRoom(r) {
    if (!r.versions?.length)
        r.versions = [{
            id: r.id + '-v1',
            label: 'v1',
            duration: r.duration || 48,
            localFile: !!r.localFile,
            filename: r.localFile ? '내 음원.mp3' : 'Original demo.wav',
            empty: !!r.empty
        }];
    if (!r.activeVersion)
        r.activeVersion = r.versions[0].id;
    if (!r.credits)
        r.credits = r.people.map( (name, i) => ({
            name,
            role: defaultRoles[i % 3]
        }));
    r.comments.forEach(c => {
        if (!c.versionId)
            c.versionId = r.versions[0].id;
        if (!c.replies)
            c.replies = []
    }
    );
    return r;
}
state.rooms.forEach(normalizeRoom);
state.chatPeople = state.chatPeople || {};
state.chatFiles = state.chatFiles || [];
const versionFor = r => normalizeRoom(r).versions.find(v => v.id === r.activeVersion) || r.versions[0];
const roomComments = r => normalizeRoom(r).comments.filter(c => c.versionId === r.activeVersion);
const commentTime = c => Number(c.at ?? c.start) || 0;
window.TamiWorkflow = {
    getRoomFile: id => {
        const r = state.rooms.find(r => r.id === id);
        return r ? workflow.files.get(versionFor(r).id) || null : null
    }
};
function activateVersion(r, id) {
    normalizeRoom(r);
    const v = r.versions.find(v => v.id === id);
    if (!v)
        return;
    if (playingRoom === r.id) {
        audio.pause();
        playingRoom = null;
        segmentEnd = null
    }
    r.activeVersion = id;
    r.duration = v.duration;
    r.localFile = v.localFile;
    r.empty = !!v.empty;
    if (objectURLs.has(v.id))
        objectURLs.set(r.id, objectURLs.get(v.id));
    else
        objectURLs.delete(r.id);
    if (localPeaks.has(v.id))
        localPeaks.set(r.id, localPeaks.get(v.id));
    else
        localPeaks.delete(r.id);
    selection = null;
    workflow.stamp = false;
    workflow.stampConfirmed = false;
    workflow.stampTime = 0;
    persist();
}
function route() {
    const hash = location.hash.slice(1) || 'portfolio';
    // #portfolio인 경우 app.js 내부의 renderPortfolio를 직접 호출하도록 처리
    if (hash === 'portfolio') {
        closeSheet();
        audio.pause();
        playingRoom = null;
        currentRoom = null;
        guest = false;
        view = 'portfolio';
        renderNav();
        $('#tabbar').style.display = 'flex';
        $('#mini-player').innerHTML = '';
        renderPortfolio();
        return;
    }
    if (window.TamiPortfolio?.isRoute('#' + hash)) {
        closeSheet();
        audio.pause();
        playingRoom = null;
        currentRoom = null;
        guest = false;
        view = hash.startsWith('artist/') ? 'artist' : 'portfolio';
        renderNav();
        $('#tabbar').style.display = hash === 'portfolio' || hash.startsWith('artist/') ? 'flex' : 'none';
        $('#mini-player').innerHTML = '';
        window.TamiPortfolio.render('#' + hash);
        return
    }
    window.TamiPortfolio?.cleanup();
    guest = hash.startsWith('guest/');
    currentRoom = null;
    selection = null;
    activeDetail = 'comments';
    if (hash.startsWith('room/') || guest) {
        const id = hash.split('/')[1]?.split('?')[0];
        if (guest) {
            const data = new URLSearchParams(hash.split('?')[1]).get('d');
            if (data)
                try {
                    const d = JSON.parse(decodeURIComponent(data));
                    if (typeof d.title === 'string')
                        sharedRoom = {
                            id,
                            title: d.title.slice(0, 80),
                            subtitle: '공유받은 데모',
                            cover: ['blue-hour', 'afterglow', 'slow-bloom', 'orbit'].includes(d.cover) ? d.cover : 'blue-hour',
                            genre: 'Demo',
                            duration: 48,
                            people: ['하린'],
                            status: 'progress',
                            comments: (Array.isArray(d.comments) ? d.comments : []).slice(0, 30).filter(c => Number.isFinite(c.at ?? c.start) && (c.at ?? c.start) >= 0 && (c.at ?? c.start) < 48).map(c => ({
                                ...c,
                                text: String(c.text).slice(0, 500),
                                name: String(c.name).slice(0, 20)
                            }))
                        }
                } catch {}
        }
        currentRoom = normalizeRoom(roomById(id));
        if (playingRoom && playingRoom !== currentRoom.id)
            audio.pause();
        view = 'room';
        renderRoom();
        subscribeToRoomFeedbacks(currentRoom.id); // Supabase 실시간 동기화 채널 연결
    } else if (hash.startsWith('inquiry/')) {
        let name;
        try {
            name = decodeURIComponent(hash.slice(8)).slice(0, 60)
        } catch {
            name = '아티스트'
        }
        const known = artists.find(a => a.name === name || a.id === name);
        const id = known?.id || 'inquiry:' + name;
        state.chatPeople[id] = {
            name: known?.name || name,
            artistId: known?.id || null
        };
        persist();
        view = 'chat';
        renderChat(id)
    } else if (hash.startsWith('chat/')) {
        let id;
        try {
            id = decodeURIComponent(hash.slice(5))
        } catch {
            id = 'jun'
        }
        view = 'chat';
        renderChat(id)
    } else if (hash.startsWith('artist/')) {
        view = 'artist';
        renderPortfolio(hash.split('/')[1])
    } else {
        if (unsubscribeRealtime) {
            unsubscribeRealtime();
            unsubscribeRealtime = null;
        }
        view = ['work', 'explore', 'messages', 'portfolio'].includes(hash) ? hash : 'portfolio';
        renderMain()
    }
    $('#screen').scrollTop = 0;
    renderNav();
    renderMini();
    setActiveFlow();
}
function renderRoom() {
    const r = normalizeRoom(currentRoom)
      , v = versionFor(r)
      , needsFile = needsLocalFile(r)
      , comments = roomComments(r);
    $('#screen').innerHTML = `<div class="page room-page wf-room">${roomToolbar()}${guest ? '<div class="guest-banner"><b>함께 듣는 작업방</b>샘플 음원으로 체험하는 화면이에요. 코멘트는 이 브라우저에만 남습니다.</div>' : ''}<div class="wf-room-heading"><img class="room-art" src="${art(r)}" alt="${esc(r.title)} 커버"><div class="room-track"><div><span class="page-eyebrow">${r.status === 'done' ? 'WORK COMPLETED' : 'WORK IN PROGRESS'}</span><h1>${esc(r.title)}</h1><p>${esc(r.genre)} · ${r.status === 'done' ? '작업 완료' : '함께 만드는 중'}</p><button class="version" data-action="wf-versions">${esc(v.label)} ${icon('chevron')}</button></div></div></div><div class="room-people"><button class="row" data-action="wf-members">${avatars(r)}<span class="caption">참여자 ${r.people.length}명 · 크레딧 편집</span></button><span class="tag">${r.localFile ? '내 MP3' : 'SAMPLE'}</span></div>${r.empty || needsFile ? `<div class="wf-file-needed"><p>${r.empty ? '첫 소리를 올려 이 작업을 시작해 보세요.' : '이 버전의 MP3를 다시 연결해 주세요. 코멘트와 버전 정보는 남아 있어요.'}</p><button class="secondary" data-action="wf-reconnect">${icon('upload')}${r.empty ? '음원 추가' : 'MP3 다시 선택'}</button></div>` : `<div class="wave-box"><div id="waveform" class="waveform" tabindex="0" role="slider" aria-label="파형: 누르면 재생 또는 일시정지, 좌우로 밀면 위치 이동. 키보드 스페이스 재생, 방향키 이동" aria-valuemin="0" aria-valuemax="${r.duration}" aria-valuenow="0"></div><div id="wave-markers" class="markers"></div><div class="time-row"><span id="elapsed">0:00</span><span id="wave-state">파형을 눌러 재생</span><span>${fmt(r.duration)}</span></div></div><div class="wf-stamp-row"><span>터치로 재생 · 좌우로 밀어 이동</span><button data-action="wf-stamp">${icon('clock')}타임스탬프</button></div><div id="stamp-guide"></div><button id="live-comment" class="wf-live" data-action="wf-all-comments"></button>`}<div class="detail-tabs"><button data-action="detail" data-id="comments">코멘트<span id="comment-count">${comments.length}</span></button><button data-action="detail" data-id="files">버전<span>${r.versions.length}</span></button><button data-action="detail" data-id="credits">참여자<span>${r.people.length}</span></button></div><div id="detail-content"></div><button class="finish-button" data-action="finish">${icon('check')}${r.status === 'done' ? '완성곡을 내 포트폴리오에 추가' : '작업 완료하고 포트폴리오에 담기'}</button><p class="mobile-demo-note">작업방 · 참여자 · 코멘트는 이 브라우저의 시연 데이터입니다.</p></div>`;
    renderDetail();
    if (!r.empty && !needsFile) {
        paintWave();
        bindWave();
        updatePlayerUI();
        updateLiveComment(true)
    }
}
function renderDetail() {
    if (!currentRoom)
        return;
    const r = currentRoom;
    document.querySelectorAll('.detail-tabs button').forEach(b => b.classList.toggle('active', b.dataset.id === activeDetail));
    const target = $('#detail-content');
    if (!target)
        return;
    if (activeDetail === 'comments') {
        target.innerHTML = `${workflow.stampConfirmed ? `<form id="comment-form" class="comment-compose"><div class="selection-label">${icon('clock')}<span id="selection-label">${fmt(workflow.stampTime)}</span><span class="wf-muted">이 지점의 코멘트</span><button type="button" data-action="wf-stamp" aria-label="타임스탬프 다시 선택">${icon('edit')}</button></div><textarea id="comment-text" maxlength="500" placeholder="이 순간, 어떤 소리가 들리나요?" aria-label="타임스탬프 코멘트" required></textarea><div class="compose-bottom"><input id="comment-name" aria-label="작성자 이름" placeholder="이름" value="${guest ? '' : '하린'}" maxlength="20" required><button class="send-btn" type="submit">남기기 ${icon('arrow')}</button></div></form>` : `<button class="wf-comment-start" data-action="wf-stamp">${icon('plus')}지점을 찍고 코멘트 남기기</button>`}<div id="comments-list">${commentsHTML(r)}</div>`;
        if ($('#comment-form'))
            $('#comment-form').onsubmit = submitComment;
    } else if (activeDetail === 'files') {
        target.innerHTML = versionListHTML(r) + `<button class="secondary" data-action="wf-new-version">${icon('plus')}새 버전 올리기</button><p class="caption gap-top">코멘트는 각 버전에 따로 남아요. 선택한 버전이 완성곡으로 이어집니다.</p>`
    } else
        target.innerHTML = r.credits.map( (c, i) => `<div class="member-row"><span class="avatar lg a${i % 3 + 1}">${esc(c.name.slice(0, 1))}</span><div>${esc(c.name)}<small>${esc(c.role || '포지션 미지정')}</small></div></div>`).join('') + `<button class="secondary" data-action="wf-members">${icon('edit')}참여자와 포지션 편집</button><p class="caption gap-top">여기서 정한 포지션이 포트폴리오의 참여 크레딧이 됩니다.</p>`;
}
function commentsHTML(r) {
    return roomComments(r).slice().sort( (a, b) => commentTime(a) - commentTime(b)).map( (c, i) => `<article class="comment ${c.resolved ? 'wf-resolved' : ''}"><span class="avatar a${i % 3 + 2}">${esc(c.name.slice(0, 1))}</span><div class="comment-body"><div class="comment-meta"><strong>${esc(c.name)}</strong><small>${c.resolved ? '✓ 해결됨' : esc(c.time || '방금 전')}</small></div><button class="comment-time" data-action="wf-comment-play" data-id="${esc(c.id)}" aria-label="${fmt(commentTime(c))}부터 재생">${icon('play')}${fmt(commentTime(c))}</button><p>${esc(c.text)}</p><div class="wf-comment-actions"><button data-action="wf-reply" data-id="${esc(c.id)}">답글 ${c.replies.length || ''}</button><button data-action="wf-resolve" data-id="${esc(c.id)}" aria-pressed="${!!c.resolved}">${c.resolved ? '해결 취소' : '해결됨 표시'}</button></div>${c.replies.map(x => `<div class="wf-reply"><b>${esc(x.name)}</b><p>${esc(x.text)}</p></div>`).join('')}</div></article>`).join('') || '<div class="empty">아직 이 버전의 코멘트가 없어요.<br>타임스탬프로 첫 아이디어를 남겨 주세요.</div>'
}
async function submitComment(e) {
    e.preventDefault();
    const text = $('#comment-text').value.trim();
    const name = $('#comment-name').value.trim();
    if (!text || !name) return;

    let targetTrackId = null;

    try {
        // 1. 현재 작업방(workgroup_id = currentRoom.id)에 연결된 트랙이 DB에 있는지 조회합니다.
        const { data: existingTracks, error: fetchErr } = await _supabase
            .from('tracks')
            .select('id')
            .eq('workgroup_id', currentRoom.id)
            .limit(1);

        if (!fetchErr && existingTracks && existingTracks.length > 0) {
            targetTrackId = existingTracks[0].id;
        } else {
            // 2. DB에 등록된 트랙이 없다면 기본 트랙을 하나 생성합니다.
            const { data: newTrack, error: insErr } = await _supabase
                .from('tracks')
                .insert([{
                    workgroup_id: currentRoom.id,
                    portfolio_id: null,
                    track_name: currentRoom.title + ' - 기본 트랙',
                    file_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Beethoven_Moonlight_1st_movement.ogg',
                    uploader_type: 'mine',
                    order: 1
                }])
                .select()
                .single();

            if (insErr) {
                console.error('기본 트랙 생성 실패:', insErr.message);
                toast('트랙 생성 실패: ' + insErr.message);
                return;
            }
            targetTrackId = newTrack.id;
        }

        const { data: { user } } = await _supabase.auth.getUser();

        const insertData = {
            track_id: targetTrackId,
            portfolio_id: null,
            user_id: user ? user.id : '00000000-0000-0000-0000-000000000000',
            author: name,
            content: text,
            start_time: workflow.stampTime,
            end_time: workflow.stampTime,
            resolved: false
        };

        // 3. .select().single()을 사용하여 서버에서 생성된 실제 레코드(ID 포함)를 반환받습니다.
        const { data: savedFeedback, error: fbErr } = await _supabase
            .from('feedbacks')
            .insert([insertData])
            .select()
            .single();

        if (fbErr) {
            console.error('Supabase 피드백 저장 오류:', fbErr.message);
            toast('DB 저장 실패: ' + fbErr.message);
            return;
        } else {
            toast('데이터베이스에 피드백이 안전하게 저장되었습니다.');

            // 4. 서버 ID를 가진 데이터로 로컬 상태에 정확히 1번만 추가합니다 (중복 방지).
            if (savedFeedback && !currentRoom.comments.some(c => c.id === savedFeedback.id)) {
                currentRoom.comments.push({
                    id: savedFeedback.id,
                    name: savedFeedback.author,
                    at: savedFeedback.start_time,
                    start: savedFeedback.start_time,
                    versionId: savedFeedback.track_id,
                    text: savedFeedback.content,
                    time: '방금 전',
                    replies: savedFeedback.replies || [],
                    resolved: savedFeedback.resolved || false
                });
            }
        }
    } catch (err) {
        console.warn('Supabase DB 동기화 예외:', err);
        toast('저장 중 예외가 발생했습니다.');
        return;
    }

    persist();
    workflow.stampConfirmed = false;
    renderDetail();
    paintWave();
    updateLiveComment(true);
    $('#comment-count').textContent = roomComments(currentRoom).length;
} 
function paintWave() {
    const wave = $('#waveform');
    if (!wave || !currentRoom)
        return;
    const dur = currentRoom.duration || 48
      , peaks = peaksFor(currentRoom)
      , time = workflow.stamp ? workflow.stampTime : playingRoom === currentRoom.id ? audio.currentTime : 0
      , pos = time / dur;
    wave.classList.toggle('wf-stamping', workflow.stamp);
    wave.innerHTML = peaks.map( (v, i) => `<span class="wavebar ${i / peaks.length < pos ? 'played' : ''}" style="height:${8 + v * 47}px"></span>`).join('') + `<span class="wave-cursor" style="left:${Math.min(pos * 100, 100)}%"></span>`;
    $('#wave-markers').innerHTML = roomComments(currentRoom).map(c => `<button class="wave-marker ${c.resolved ? 'resolved' : ''}" data-action="wf-comment-play" data-id="${esc(c.id)}" style="left:${Math.min(97, commentTime(c) / dur * 100)}%" aria-label="${esc(c.name)}의 ${fmt(commentTime(c))} 코멘트"></button>`).join('');
    updateSelectionLabel()
}
function bindWave() {
    const wave = $('#waveform');
    if (!wave)
        return;
    let x = 0
      , drag = false
      , moved = false
      , wasPlaying = false;
    const pos = e => {
        const b = wave.getBoundingClientRect();
        return Math.max(0, Math.min(currentRoom.duration - .05, (e.clientX - b.left) / b.width * currentRoom.duration))
    }
    ;
    const seek = t => {
        if (workflow.stamp) {
            workflow.stampTime = t;
            paintWave()
        } else if (ensureAudio(currentRoom)) {
            audio.currentTime = t;
            updatePlayerUI()
        }
    }
    ;
    wave.onpointerdown = e => {
        if (e.button !== 0)
            return;
        wave.setPointerCapture(e.pointerId);
        x = e.clientX;
        drag = true;
        moved = false;
        wasPlaying = playingRoom === currentRoom.id && !audio.paused
    }
    ;
    wave.onpointermove = e => {
        if (!drag || Math.abs(e.clientX - x) < 5 && !moved)
            return;
        moved = true;
        audio.pause();
        seek(pos(e))
    }
    ;
    wave.onpointerup = e => {
        if (!drag)
            return;
        drag = false;
        if (workflow.stamp) {
            seek(pos(e));
            return
        }
        if (moved) {
            seek(pos(e));
            if (wasPlaying)
                startAudio(currentRoom)
        } else if (playingRoom === currentRoom.id && !audio.paused)
            audio.pause();
        else
            startAudio(currentRoom, audio.ended ? 0 : undefined)
    }
    ;
    wave.onpointercancel = () => {
        drag = false
    }
    ;
    wave.onkeydown = e => {
        if (e.code === 'Space' || e.key === 'Enter') {
            e.preventDefault();
            if (workflow.stamp) {
                confirmStamp();
                return
            }
            if (playingRoom === currentRoom.id && !audio.paused)
                audio.pause();
            else
                startAudio(currentRoom, audio.ended ? 0 : undefined);
            return
        }
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))
            return;
        e.preventDefault();
        const now = workflow.stamp ? workflow.stampTime : playingRoom === currentRoom.id ? audio.currentTime : 0;
        seek(Math.max(0, Math.min(currentRoom.duration - .05, e.key === 'Home' ? 0 : e.key === 'End' ? currentRoom.duration - .05 : now + (e.key === 'ArrowRight' ? 1 : -1))))
    }
    ;
}
function beginStamp() {
    if (currentRoom.empty || needsLocalFile(currentRoom)) {
        toast('먼저 이 버전의 음원을 연결해 주세요.');
        return
    }
    audio.pause();
    workflow.stamp = true;
    workflow.stampConfirmed = false;
    workflow.stampTime = playingRoom === currentRoom.id ? audio.currentTime : 0;
    activeDetail = 'comments';
    renderDetail();
    $('#stamp-guide').innerHTML = `<div class="wf-stamp-guide"><span><b id="stamp-position">${fmt(workflow.stampTime)}</b> 좌우로 밀어 지점을 골라주세요</span><button data-action="wf-stamp-confirm" aria-label="타임스탬프 확정">${icon('check')}</button><button data-action="wf-stamp-cancel" aria-label="타임스탬프 취소">${icon('close')}</button></div>`;
    paintWave();
    $('#waveform').focus()
}
function confirmStamp() {
    workflow.stamp = false;
    workflow.stampConfirmed = true;
    selection = null;
    $('#stamp-guide').innerHTML = '';
    if (ensureAudio(currentRoom))
        audio.currentTime = workflow.stampTime;
    activeDetail = 'comments';
    renderDetail();
    paintWave();
    updatePlayerUI();
    $('#comment-text')?.focus()
}
function updateSelectionLabel() {
    if ($('#stamp-position'))
        $('#stamp-position').textContent = fmt(workflow.stampTime);
    if ($('#selection-label'))
        $('#selection-label').textContent = fmt(workflow.stampTime);
    if (workflow.stamp && $('#waveform')) {
        $('#waveform').setAttribute('aria-valuenow', Math.round(workflow.stampTime));
        $('#waveform').setAttribute('aria-valuetext', fmt(workflow.stampTime))
    }
}
function updateLiveComment(force=false) {
    const el = $('#live-comment');
    if (!el || !currentRoom)
        return;
    const time = playingRoom === currentRoom.id ? audio.currentTime : 0
      , all = roomComments(currentRoom).slice().sort( (a, b) => commentTime(a) - commentTime(b))
      , c = all.filter(c => commentTime(c) <= time + .35).at(-1);
    const key = c?.id || 'none';
    if (!force && workflow.liveId === key)
        return;
    workflow.liveId = key;
    el.innerHTML = `<span class="wf-live-label">${icon('chat')}지금 지점의 코멘트 <span>전체 보기 ↗</span></span>${c ? `<b>${fmt(commentTime(c))} · ${esc(c.name)} ${c.resolved ? '✓ 해결됨' : ''}</b><p>${esc(c.text)}</p>` : `<p>${all.length ? '아직 코멘트가 없는 지점이에요. 계속 들어보세요.' : '첫 코멘트가 곡의 다음 방향이 될 수 있어요.'}</p>`}`
}
function updatePlayerUI() {
    const active = currentRoom && playingRoom === currentRoom.id
      , isPlaying = active && !audio.paused
      , t = active ? audio.currentTime : 0;
    if ($('#elapsed'))
        $('#elapsed').textContent = fmt(t);
    if ($('#wave-state'))
        $('#wave-state').textContent = workflow.stamp ? '지점 선택 중' : isPlaying ? '지금 재생 중 · 터치로 일시정지' : '파형을 눌러 재생';
    if ($('#waveform') && !workflow.stamp) {
        $('#waveform').setAttribute('aria-valuenow', Math.round(t));
        $('#waveform').setAttribute('aria-valuetext', fmt(t));
        const p = t / (currentRoom.duration || 48);
        $('#waveform').querySelectorAll('.wavebar').forEach( (b, i) => b.classList.toggle('played', i / peaksFor(currentRoom).length < p));
        const c = $('.wave-cursor');
        if (c)
            c.style.left = `${Math.min(p * 100, 100)}%`
    }
    const mini = $('.mini [data-action="mini-play"]');
    if (mini) {
        mini.innerHTML = icon(audio.paused ? 'play' : 'pause');
        mini.setAttribute('aria-label', audio.paused ? '미니 플레이어 재생' : '미니 플레이어 일시정지')
    }
    if ($('.mini-progress'))
        $('.mini-progress').style.width = `${audio.currentTime / (audio.duration || 48) * 100}%`;
    updateLiveComment()
}
function versionListHTML(r) {
    return r.versions.slice().reverse().map(v => `<button class="wf-version ${v.id === r.activeVersion ? 'active' : ''}" data-action="wf-switch-version" data-id="${esc(v.id)}"><span class="wf-version-label">${esc(v.label)}</span><span class="grow"><b>${esc(v.filename)}</b><small>${fmt(v.duration)} · ${v.localFile ? '내 MP3' : '샘플 음원'} · 코멘트 ${r.comments.filter(c => c.versionId === v.id).length}</small></span>${icon(v.id === r.activeVersion ? 'check' : 'chevron')}</button>`).join('')
}
function versionSheet() {
    showSheet('버전 목록', `${sheetHeader('한 곡의 여러 순간')}<p>듣고 싶은 버전을 선택하세요.<br>코멘트와 재생 위치는 버전별로 구분됩니다.</p>${versionListHTML(currentRoom)}<button class="primary lime gap-top" data-action="wf-new-version">${icon('plus')}새 버전 올리기</button>`)
}
async function attachAudioFile(r, file, replace=false) {
    if (!file || !file.name.toLowerCase().endsWith('.mp3'))
        throw Error('MP3 파일을 선택해 주세요.');
    if (file.size > 50 * 1024 * 1024 || !file.size)
        throw Error('0MB 초과, 50MB 이하의 MP3를 선택해 주세요.');
    
    const url = URL.createObjectURL(file);
    let duration, peaks;
    try {
        duration = await readDuration(url);
        peaks = await readPeaks(file);
    } catch {
        URL.revokeObjectURL(url);
        throw Error('재생할 수 없는 MP3예요. 다른 파일을 선택해 주세요.');
    }
    
    normalizeRoom(r);
    let newTrackId = crypto.randomUUID();
    let label = 'v' + (r.versions.length + 1);

    // 1. Supabase tracks 테이블에 음원 파일 정보 저장 (duration 컬럼 제외)
    try {
        const fileUrl = url;

        if (replace && r.versions.length > 0 && !r.versions[0].id.includes('-v1')) {
            newTrackId = versionFor(r).id;
            label = versionFor(r).label;
            
            await _supabase.from('tracks')
                .update({
                    track_name: file.name,
                    filename: file.name,
                    file_url: fileUrl
                })
                .eq('id', newTrackId);
        } else {
            // DB에 존재하는 컬럼만 명시하여 인서트
            const { data: trackData, error: trackErr } = await _supabase
                .from('tracks')
                .insert([{
                    workgroup_id: r.id,
                    portfolio_id: null,
                    track_name: file.name,
                    filename: file.name,
                    file_url: fileUrl,
                    uploader_type: 'mine',
                    order: r.versions.length + 1
                }])
                .select()
                .single();

            if (!trackErr && trackData) {
                newTrackId = trackData.id;
            } else if (trackErr) {
                console.error('Supabase tracks 테이블 저장 실패:', trackErr.message);
            }
        }
    } catch (err) {
        console.warn('Supabase tracks 테이블 동기화 예외 발생:', err);
    }

    const v = replace ? versionFor(r) : {
        id: newTrackId,
        label: label
    };
    Object.assign(v, {
        id: newTrackId,
        duration,
        localFile: true,
        filename: file.name,
        empty: false
    });
    
    const old = objectURLs.get(v.id);
    if (old)
        URL.revokeObjectURL(old);
    objectURLs.set(v.id, url);
    localPeaks.set(v.id, peaks);
    workflow.files.set(v.id, file);
    if (!replace)
        r.versions.push(v);
    
    activateVersion(r, v.id);
    persist();
}
function newVersionSheet(reconnect=false) {
    const r = currentRoom;
    showSheet('음원 버전 추가', `${sheetHeader(reconnect ? '음원을 다시 연결하기' : '음악의 다음 버전')}<p>${reconnect ? '선택한 버전의 MP3를 연결합니다. 코멘트는 유지됩니다.' : 'MP3를 올리면 새 번호로 쌓이고, 그 버전만의 피드백을 남길 수 있어요.'}</p><label class="upload-zone" for="version-file">${icon('upload')}<strong>MP3 선택하기</strong><span>최대 50MB · 이 브라우저에서만 사용</span></label><input class="file-input" id="version-file" type="file" accept="audio/mpeg,.mp3" aria-label="새 버전 MP3 선택"><p id="version-status" class="caption"></p>${!reconnect ? '<button class="secondary" data-action="wf-sample-version">샘플로 새 버전 체험하기</button>' : ''}`);
    $('#version-file').onchange = async e => {
        const file = e.target.files[0];
        if (!file)
            return;
        const input = e.target;
        input.disabled = true;
        $('#version-status').textContent = '음원을 확인하고 있어요…';
        try {
            await attachAudioFile(r, file, reconnect);
            if (currentRoom?.id === r.id) {
                closeSheet();
                renderRoom()
            }
            toast('새 음원을 연결했어요.')
        } catch (err) {
            if (input.isConnected) {
                input.disabled = false;
                $('#version-status').textContent = err.message
            }
        }
    }
}
function createSheet(addToExisting=false) {
    const fromChat = view === 'chat' ? workflow.chatId : null;
    if (addToExisting) {
        newVersionSheet(true);
        return
    }
    showSheet('새 작업방', `${sheetHeader('새로운 음악의 시작')}<p>곡 제목과 함께할 사람을 정해 보세요.</p><form id="create-form"><label class="field">곡 제목<input id="room-title" maxlength="60" placeholder="예: 새벽에 떠오른 멜로디" required></label><label class="field">참여자 이름<input id="room-members" maxlength="120" placeholder="쉼표로 구분 · 예: 준, 서우"></label><label class="field">첫 음원<input id="room-audio-file" type="file" accept="audio/mpeg,.mp3"><small class="caption">선택 사항 · MP3 최대 50MB</small></label><label class="check-row"><input id="room-sample" type="checkbox" checked><span>파일이 없으면 샘플 음원으로 시작</span></label><button class="primary lime gap-top" type="submit">작업방 만들기 ${icon('arrow')}</button><p id="create-status" class="caption gap-top"></p></form>`);
    $('#create-form').onsubmit = async e => {
        e.preventDefault();
        const title = $('#room-title').value.trim();
        if (!title)
            return;
        const names = [...new Set(['하린', ...$('#room-members').value.split(',').map(x => x.trim()).filter(Boolean)])].slice(0, 12)
          , file = $('#room-audio-file').files[0]
          , sample = $('#room-sample').checked;

        let dbRoomId = crypto.randomUUID();
        try {
            // 1. 현재 로그인된 사용자 정보 가져오기
            const { data: { user }, error: userError } = await _supabase.auth.getUser();
            
            if (userError || !user) {
                toast('로그인이 필요한 기능입니다.');
                loginSheet();
                const submit = e.target.querySelector('[type=submit]');
                if (submit) submit.disabled = false;
                return;
            }

            // 2. workgroups 테이블에 작업방 생성 (스키마 컬럼명 일치)
            const { data: groupData, error: groupError } = await _supabase.from('workgroups').insert([{
                workgroup_name: title,
                description: 'Work in progress',
                user_id: user.id,
                user_email: user.email,
                view_yn: 'Y',
                del_yn: 'N'
            }]).select().single();

            if (groupError) {
                console.error('Supabase workgroups 삽입 오류:', groupError.message);
                throw groupError;
            }

            if (groupData) {
                dbRoomId = groupData.id;

                // 3. workgroup_members 테이블에 참여자 등록 (workgroup_id 사용)
                const memberInserts = names.map(name => ({
                    workgroup_id: dbRoomId,
                    member_email: name.includes('@') ? name : `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
                    role: 'editor'
                }));
                
                const { error: memberError } = await _supabase.from('workgroup_members').insert(memberInserts);
                if (memberError) {
                    console.error('Supabase workgroup_members 삽입 오류:', memberError.message);
                }
            }
        } catch (err) {
            console.warn('Supabase 작업방 생성 중 예외 발생:', err);
        }

        const r = normalizeRoom({
            id: dbRoomId,
            title,
            genre: 'Work in progress',
            cover: 'blue-hour',
            status: 'progress',
            people: names,
            comments: [],
            duration: 48,
            empty: !sample && !file
        });
        const submit = e.target.querySelector('[type=submit]');
        submit.disabled = true;
        try {
            if (file)
                await attachAudioFile(r, file, true);
            state.rooms.unshift(r);
            if (fromChat)
                state.messages.push({
                    to: fromChat,
                    type: 'room',
                    roomId: r.id,
                    text: r.title
                });
            persist();
            navigate('#room/' + r.id);
            toast('작업방을 만들었어요.')
        } catch (err) {
            submit.disabled = false;
            $('#create-status').textContent = err.message
        }
    }
}
function membersSheet() {
    const r = currentRoom;
    showSheet('참여자와 포지션', `${sheetHeader('함께 만든 이름들')}<p>참여자와 포지션을 정해 보세요.<br>완료한 곡의 크레딧으로 이어집니다.</p><form id="members-form"><div id="member-fields">${r.credits.map(c => memberFields(c)).join('')}</div><button class="secondary" type="button" data-action="wf-member-add">${icon('plus')}참여자 추가</button><button class="primary lime gap-top" type="submit">크레딧 저장</button><p class="caption gap-top">이 화면은 초대 메일을 보내지 않는 참여자 설정 데모입니다.</p></form>`);
    $('#members-form').onsubmit = e => {
        e.preventDefault();
        const credits = [...$('#member-fields').children].map(row => ({
            name: row.querySelector('[name=name]').value.trim(),
            role: row.querySelector('[name=role]').value.trim()
        })).filter(c => c.name);
        if (!credits.length) {
            toast('참여자 한 명 이상을 남겨 주세요.');
            return
        }
        r.credits = credits;
        r.people = credits.map(c => c.name);
        persist();
        closeSheet();
        renderRoom();
        toast('참여 크레딧을 저장했어요.')
    }
}
function memberFields(c={
    name: '',
    role: ''
}) {
    return `<div class="wf-member-fields"><label>이름<input name="name" aria-label="참여자 이름" maxlength="30" value="${esc(c.name)}" placeholder="아티스트 이름"></label><label>포지션<input name="role" aria-label="참여자 포지션" maxlength="80" value="${esc(c.role)}" placeholder="예: Vocal · Topline"></label><button type="button" data-action="wf-member-remove" aria-label="참여자 삭제">${icon('close')}</button></div>`
}
function publishWork() {
    const r = currentRoom;
    r.status = 'done';
    r.publishedCredits = $('#publish-credits').checked;
    r.publishedStory = $('#publish-story').checked;
    if (!state.published.includes(r.id))
        state.published.unshift(r.id);
    window.TamiPortfolio?.queueRoom(r);
    persist();
    closeSheet();
    navigate('#portfolio');
    toast('완성곡을 담을 포트폴리오를 선택해 주세요.')
}
function makeShareURL(r) {
    const data = {
        title: r.title,
        cover: r.cover,
        comments: roomComments(r).slice(-15).filter(c => commentTime(c) < 48).map(c => ({
            id: c.id,
            name: c.name,
            text: c.text,
            at: commentTime(c)
        }))
    };
    return `${location.href.split('#')[0]}#guest/${r.id}?d=${encodeURIComponent(encodeURIComponent(JSON.stringify(data)))}`
}
function replySheet(id) {
    const c = currentRoom.comments.find(c => c.id === id);
    if (!c)
        return;
    showSheet('코멘트 답글', `${sheetHeader('아이디어 이어가기')}<div class="process-card"><b>${esc(c.name)} · ${fmt(commentTime(c))}</b><p>${esc(c.text)}</p></div><form id="reply-form"><label class="field">답글<textarea maxlength="500" required aria-label="답글" placeholder="아이디어를 이어가 보세요"></textarea></label><button class="primary lime" type="submit">답글 남기기</button></form>`);
    $('#reply-form').onsubmit = e => {
        e.preventDefault();
        const text = e.target.querySelector('textarea').value.trim();
        if (!text)
            return;
        c.replies.push({
            name: '하린',
            text
        });
        persist();
        closeSheet();
        renderDetail();
        toast('답글을 남겼어요.')
    }
}
function chatPerson(id) {
    return state.chatPeople[id] || {
        name: id === 'jun' ? '준' : id === 'seowoo' ? '서우' : id === 'harin' ? 'harin.' : id,
        artistId: artists.some(a => a.id === id) ? id : null
    }
}
function ensureChatFiles(id) {
    if (!['jun', 'seowoo'].includes(id) || state.chatFiles.some(f => f.to === id))
        return;
    state.chatFiles.push({
        id: 'sample-mp3-' + id,
        to: id,
        name: 'Blue Hour_demo.mp3',
        kind: 'mp3',
        version: 1,
        size: 0,
        sample: true
    }, {
        id: 'sample-original-' + id,
        to: id,
        name: 'Blue Hour_stems.zip',
        kind: 'original',
        version: 2,
        size: 0,
        sample: true,
        metadataOnly: true
    });
    persist()
}
function renderMessages() {
    const ids = [...new Set(['jun', 'seowoo', ...Object.keys(state.chatPeople), ...state.messages.map(m => m.to)])];
    const query = $('#chat-search')?.value?.toLowerCase().trim() || '';

    $('#screen').innerHTML = `
        <div class="page">
            <header class="page-header">
                <div>
                    <div class="page-eyebrow">GOOD MUSIC STARTS WITH HELLO</div>
                    <h1 class="page-title">메시지</h1>
                </div>
                <span class="tag">DEMO</span>
            </header>
            <div class="search-field">
                ${icon('search')}
                <input id="chat-search" aria-label="대화 및 피드백 내용 검색" placeholder="아티스트 이름 또는 이메일/내용 검색" value="${esc(query)}">
            </div>
            <div id="conversation-list">
                ${ids.map((id, i) => {
                    const p = chatPerson(id);
                    const userMessages = state.messages.filter(m => m.to === id);
                    const last = userMessages.at(-1);
                    const allTexts = [p.name, id, ...userMessages.map(m => m.text || '')].join(' ').toLowerCase();
                    const match = !query || allTexts.includes(query);

                    return `
                        <button class="message-row" data-action="wf-chat" data-id="${esc(id)}" data-name="${esc(p.name)}" style="${match ? '' : 'display: none;'}">
                            <span class="avatar lg a${i % 3 + 2}">${esc(p.name.slice(0, 1))}</span>
                            <div class="grow">
                                <h3>${esc(p.name)} <small style="font-size:10px; color:#888; font-weight:normal;">(${esc(id)})</small></h3>
                                <p>${esc(last?.text || (last?.type === 'file' ? '파일을 첨부했어요.' : id === 'jun' ? '기타 톤 좋아요! 작업방에 코멘트 남겼어요.' : id === 'seowoo' ? '다음 데모도 함께 들어봐요 🌿' : '포트폴리오에서 시작한 새로운 대화'))}</p>
                            </div>
                            ${icon('chevron')}
                        </button>
                    `;
                }).join('')}
                ${query && !ids.some(id => id.toLowerCase().includes(query) || chatPerson(id).name.toLowerCase().includes(query)) ? `
                    <button class="message-row" data-action="wf-chat" data-id="${esc(query)}" data-name="${esc(query)}" style="background: #f0f4f1; border: 1px dashed #2e605d; margin-top: 8px;">
                        <span class="avatar lg a1">+</span>
                        <div class="grow">
                            <h3>"${esc(query)}" 님과 새 대화 시작하기</h3>
                            <p>이메일/ID로 새 대화방을 엽니다.</p>
                        </div>
                        ${icon('arrow')}
                    </button>
                ` : ''}
            </div>
            <div class="activity">
                ${icon('music')}
                <p>파일에서 피드백으로, 피드백에서 다음 버전으로.<br>대화의 소리를 작업방으로 이어 보세요.</p>
            </div>
            <p class="mobile-demo-note">시연용 대화 · 실제 메시지는 전송되지 않습니다.</p>
        </div>
    `;

    // 입력 포커스 및 커서 위치 유지 
    const inputEl = $('#chat-search');
    if (inputEl) {
        inputEl.focus();
        inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
        inputEl.oninput = () => {
            renderMessages();
        };
    }
}
function chatBubble(m) {
    if (m.type === 'file') {
        const f = state.chatFiles.find(f => f.id === m.fileId);
        return f ? `<button class="bubble mine wf-file-bubble" data-action="wf-files">${icon(f.kind === 'mp3' ? 'music' : 'folder')}<span><b>${esc(f.name)}</b><small>v${f.version} · 파일 보관함에서 보기</small></span></button>` : ''
    }
    if (m.type === 'room')
        return `<button class="bubble mine room-bubble" data-action="open-room" data-id="${esc(m.roomId)}">${icon('work')}<span><b>${esc(m.text)}</b><small>작업방 열기 ↗</small></span></button>`;
    if (m.type === 'portfolio')
        return `<a class="bubble mine wf-link-bubble" href="${esc(m.url)}" target="_blank" rel="noopener noreferrer"><b>내 포트폴리오</b><small>포트폴리오 열기 ↗</small></a>`;
    return `<div class="bubble mine">${esc(m.text)}</div>`
}
function renderChat(id='jun') {
    workflow.chatId = id;
    ensureChatFiles(id);
    const p = chatPerson(id)
      , isSeed = ['jun', 'seowoo'].includes(id);
    $('#screen').innerHTML = `<div class="page wf-chat-page"><div class="toolbar"><button class="icon-btn" data-action="nav" data-id="messages" aria-label="메시지 목록으로">${icon('back')}</button><button class="wf-chat-title" data-action="wf-person"><span class="avatar a2">${esc(p.name.slice(0, 1))}</span><span>${esc(p.name)}<small>프로필 요약 보기</small></span></button><button class="icon-btn" data-action="wf-files" aria-label="파일 보관함 열기">${icon('folder')}</button></div><div class="wf-demo-banner">대화 체험 · 실제 전송·회신이 없는 시연입니다. 입력과 첨부는 이 브라우저에만 저장됩니다.</div><div id="chat-bubbles">${isSeed ? '<div class="chat-date">함께 시작한 대화</div><div class="bubble">이번 데모 들어봤어요.<br>후렴 앞에 기타 톤 정말 좋네요!</div><div class="bubble mine">고마워요! 파일과 작업방에 올려뒀어요.<br>편하게 의견 남겨주세요 🌿</div><button class="bubble room-bubble" data-action="open-room" data-id="blue-hour"><img src="assets/blue-hour.svg" alt=""><span><strong>Blue Hour</strong><small>작업방에서 함께 들어보기 ↗</small></span></button>' : `<div class="chat-date">${esc(p.name)}님의 음악에서 시작된 연결</div><div class="wf-inquiry-intro">${icon('chat')}<b>어떤 음악을 함께 만들고 싶으신가요?</b><p>작업 내용, 일정, 관심 있는 곡을 자유롭게 적어 보세요.</p></div>`}${state.messages.filter(m => m.to === id).map(chatBubble).join('')}</div><form id="chat-form" class="chat-form"><button type="button" class="icon-btn wf-attach" data-action="wf-attach" aria-label="첨부 메뉴 열기">${icon('plus')}</button><input placeholder="메시지를 입력하세요" maxlength="500" aria-label="메시지" required><button class="icon-btn" aria-label="데모 메시지 남기기" type="submit">${icon('arrow')}</button></form><p class="mobile-demo-note">실제 상대방에게 전송되지 않는 메시지 데모입니다.</p></div>`;
    $('#chat-form').onsubmit = e => {
        e.preventDefault();
        const text = e.target.querySelector('input').value.trim();
        if (!text)
            return;
        state.messages.push({
            to: id,
            text
        });
        persist();
        renderChat(id);
        $('#screen').scrollTop = $('#screen').scrollHeight;
        toast('이 브라우저의 대화에 남겼어요. 실제 전송은 되지 않습니다.')
    }
    ;
    const drop = $('#chat-bubbles');
    drop.ondragover = e => e.preventDefault();
    drop.ondrop = async e => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f)
            await addChatFile(f, id)
    }
}
function personSheet() {
    const p = chatPerson(workflow.chatId)
      , a = artists.find(a => a.id === p.artistId);
    showSheet('상대 프로필', `${sheetHeader(p.name)}${a ? `<img class="wf-person-cover" src="assets/${a.cover}.svg" alt="대표작 커버"><p class="gap-top">${esc(a.role)} · ${esc(a.genre)}<br>${esc(a.line)}</p><button class="secondary" data-action="wf-person-preview">${icon('headphones')}대표작 미리듣기</button><button class="primary lime gap-top" data-action="artist" data-id="${a.id}">포트폴리오 보기 ${icon('arrow')}</button>` : `<div class="wf-inquiry-intro"><b>${esc(p.name)}</b><p>공개 포트폴리오에서 시작한 문의입니다.</p></div><p class="caption">입력한 메시지는 이 브라우저에서만 체험할 수 있습니다.</p>`}`)
}
function chatFilesSheet() {
    const files = state.chatFiles.filter(f => f.to === workflow.chatId && (workflow.chatFilter === 'all' || f.kind === workflow.chatFilter));
    showSheet('파일 보관함', `${sheetHeader('대화 속 파일들')}<p>올린 순서대로 버전이 붙어요.<br>MP3는 들어보고 작업방으로 이어갈 수 있어요.</p><div class="chips">${[['all', '전체'], ['original', '원본만'], ['mp3', 'MP3만']].map( ([id,label]) => `<button class="chip ${workflow.chatFilter === id ? 'active' : ''}" data-action="wf-file-filter" data-id="${id}">${label}</button>`).join('')}</div>${files.slice().reverse().map(f => `<div class="wf-chat-file"><div class="row"><span class="version">v${f.version}</span><b>${esc(f.name)}</b></div><small>${f.sample ? '샘플' + (f.metadataOnly ? ' 파일 정보' : ' 음원') : `${(f.size / 1024 / 1024).toFixed(1)}MB · 내 파일`} · ${f.kind === 'mp3' ? '듣기용' : '수정용 원본'}</small><div class="wf-file-actions">${f.kind === 'mp3' ? `<button data-action="wf-file-play" data-id="${esc(f.id)}">${icon('play')}미리듣기</button><button data-action="wf-file-room" data-id="${esc(f.id)}">${icon('work')}작업방으로</button>` : '<span>원본은 편집 프로그램에서 확인해 주세요.</span>'}${!f.metadataOnly ? `<button data-action="wf-file-download" data-id="${esc(f.id)}">${icon('upload')}저장</button>` : ''}</div></div>`).join('') || '<div class="empty">아직 이 종류의 파일이 없어요.</div>'}<button class="secondary" data-action="wf-attach">${icon('plus')}파일 첨부하기</button><div class="wf-file-links"><button data-action="wf-person">상대 포트폴리오</button><button data-action="nav" data-id="portfolio">내 포트폴리오</button></div><p class="caption gap-top">파일은 이 탭에서만 연결됩니다. 새로고침하면 다시 선택해 주세요. 실제 업로드·전송은 하지 않습니다.</p>`)
}
function attachMenu() {
    showSheet('첨부 메뉴', `${sheetHeader('대화를 음악으로 이어가기')}<label class="upload-zone" for="chat-attachment">${icon('folder')}<strong>프로젝트 파일 첨부</strong><span>MP3 · WAV · ZIP · 프로젝트 파일<br>최대 50MB · 대화에 끌어다 놓기도 가능</span></label><input id="chat-attachment" class="file-input" type="file" accept=".mp3,.wav,.zip,.als,.flp,.logicx,.band,.ptx,.rpp" aria-label="대화 파일 선택"><button class="secondary" data-action="wf-chat-room">${icon('work')}작업방 만들기</button><button class="secondary" data-action="wf-chat-portfolio">${icon('user')}포트폴리오 보내기</button><p id="attachment-status" class="caption gap-top">첨부는 이 브라우저의 데모 대화에만 보입니다.</p>`);
    $('#chat-attachment').onchange = e => {
        const f = e.target.files[0];
        if (f)
            addChatFile(f, workflow.chatId)
    }
}
async function addChatFile(file, to) {
    try {
        if (!/\.(mp3|wav|zip|als|flp|logicx|band|ptx|rpp)$/i.test(file.name))
            throw Error('MP3, WAV, ZIP 또는 지원되는 음악 프로젝트 파일을 선택해 주세요.');
        if (!file.size || file.size > 50 * 1024 * 1024)
            throw Error('0MB 초과, 50MB 이하 파일을 선택해 주세요.');
        const mp3 = /\.mp3$/i.test(file.name)
          , id = crypto.randomUUID()
          , f = {
            id,
            to,
            name: file.name,
            kind: mp3 ? 'mp3' : 'original',
            size: file.size,
            version: state.chatFiles.filter(f => f.to === to).length + 1
        };
        if (mp3) {
            const url = URL.createObjectURL(file);
            try {
                f.duration = await readDuration(url);
                f.peaks = await readPeaks(file);
                objectURLs.set(id, url)
            } catch {
                URL.revokeObjectURL(url);
                throw Error('재생할 수 없는 MP3 파일이에요.')
            }
        } else
            objectURLs.set(id, URL.createObjectURL(file));
        workflow.files.set(id, file);
        state.chatFiles.push(f);
        state.messages.push({
            to,
            type: 'file',
            fileId: id
        });
        persist();
        if (view === 'chat' && workflow.chatId === to) {
            closeSheet();
            renderChat(to);
            $('#screen').scrollTop = $('#screen').scrollHeight
        }
        toast('데모 대화에 파일을 첨부했어요.')
    } catch (err) {
        toast(err.message);
        if ($('#attachment-status'))
            $('#attachment-status').textContent = err.message
    }
}
function fileRoomSheet(id) {
    const f = state.chatFiles.find(f => f.id === id);
    if (!f)
        return;
    if (!f.sample && !workflow.files.has(id)) {
        toast('MP3를 다시 첨부해 주세요. 파일 연결이 해제됐어요.');
        return
    }
    showSheet('파일을 작업방으로', `${sheetHeader('소리를 함께 다듬기')}<p>${esc(f.name)}을 어디에 담을까요?</p><button class="primary lime" data-action="wf-file-new-room" data-id="${esc(id)}">새 작업방 만들기</button><div class="section-heading"><h3>기존 작업방에 새 버전으로</h3></div>${state.rooms.slice(0, 10).map(r => `<button class="wf-target-room" data-action="wf-file-existing-room" data-id="${esc(id)}" data-room="${esc(r.id)}"><span>${esc(r.title)}</span>${icon('plus')}</button>`).join('')}`)
}
function sendFileToRoom(fileId, roomId) {
    const f = state.chatFiles.find(f => f.id === fileId);
    if (!f)
        return;
    let r = roomId ? state.rooms.find(r => r.id === roomId) : null;
    const newRoom = !r;
    if (!r)
        r = normalizeRoom({
            id: crypto.randomUUID(),
            title: f.name.replace(/\.[^.]+$/, ''),
            genre: 'Shared in messages',
            cover: 'blue-hour',
            status: 'progress',
            people: ['하린', chatPerson(workflow.chatId).name],
            comments: [],
            duration: f.duration || 48
        });
    const v = newRoom ? r.versions[0] : {
        id: crypto.randomUUID(),
        label: 'v' + (r.versions.length + 1)
    };
    Object.assign(v, {
        filename: f.name,
        duration: f.duration || 48,
        localFile: !f.sample,
        empty: false
    });
    if (!newRoom)
        r.versions.push(v);
    if (!f.sample) {
        objectURLs.set(v.id, URL.createObjectURL(workflow.files.get(f.id)));
        localPeaks.set(v.id, f.peaks || wavePeaks);
        workflow.files.set(v.id, workflow.files.get(f.id))
    }
    activateVersion(r, v.id);
    if (newRoom)
        state.rooms.unshift(r);
    state.messages.push({
        to: workflow.chatId,
        type: 'room',
        roomId: r.id,
        text: r.title
    });
    persist();
    navigate('#room/' + r.id);
    toast(newRoom ? '대화에서 새 작업방을 만들었어요.' : '새 버전으로 작업방에 담았어요.')
}
function chatPortfolioSheet() {
    showSheet('포트폴리오 보내기', `${sheetHeader('음악으로 나를 소개하기')}<p>공개된 포트폴리오 링크를 대화에 남겨 보세요.</p><form id="chat-portfolio-form"><label class="field">공개 링크<input type="url" required maxlength="2000" placeholder="https://…/#p/…" aria-label="공유할 포트폴리오 링크"></label><button class="primary lime" type="submit">대화에 남기기</button></form><button class="secondary" data-action="nav" data-id="portfolio">내 포트폴리오에서 링크 확인</button>`);
    $('#chat-portfolio-form').onsubmit = e => {
        e.preventDefault();
        const url = e.target.querySelector('input').value.trim();
        let parsed;
        try {
            parsed = new URL(url)
        } catch {
            return
        }
        if (!['https:', 'http:'].includes(parsed.protocol)) {
            toast('웹 링크를 입력해 주세요.');
            return
        }
        state.messages.push({
            to: workflow.chatId,
            type: 'portfolio',
            url: parsed.href
        });
        persist();
        closeSheet();
        renderChat(workflow.chatId)
    }
}
async function handleSignOut() {
    const { error } = await _supabase.auth.signOut();
    if (!error) {
        currentUser = null;
        toast('로그아웃되었습니다.');
        route();
    } else {
        toast('로그아웃 실패: ' + error.message);
    }
}
document.addEventListener('click', async e => {
    const b = e.target.closest('[data-action]');
    if (!b || !b.dataset.action.startsWith('wf-'))
        return;
    e.stopImmediatePropagation();
    const {action, id} = b.dataset;
    switch (action) {
    case 'wf-stamp':
        beginStamp();
        break;
    case 'wf-stamp-confirm':
        confirmStamp();
        break;
    case 'wf-stamp-cancel':
        workflow.stamp = false;
        $('#stamp-guide').innerHTML = '';
        paintWave();
        updatePlayerUI();
        break;
    case 'wf-all-comments':
        showSheet('전체 코멘트', `${sheetHeader('이 버전의 모든 코멘트')}<div id="sheet-comments">${commentsHTML(currentRoom)}</div>`);
        break;
    case 'wf-comment-play':
        {
            const c = currentRoom.comments.find(c => c.id === id);
            if (c) {
                closeSheet();
                workflow.stamp = false;
                workflow.stampConfirmed = false;
                if ($('#stamp-guide'))
                    $('#stamp-guide').innerHTML = '';
                selection = null;
                await startAudio(currentRoom, commentTime(c));
                renderDetail();
                paintWave()
            }
        }
        break;
    case 'wf-resolve':
        {
            const c = currentRoom.comments.find(c => c.id === id);
            if (c) {
                c.resolved = !c.resolved;
                persist();
                renderDetail();
                if ($('#sheet-comments'))
                    $('#sheet-comments').innerHTML = commentsHTML(currentRoom);
                paintWave();
                updateLiveComment(true)
            }
        }
        break;
    case 'wf-reply':
        replySheet(id);
        break;
    case 'wf-versions':
        versionSheet();
        break;
    case 'wf-switch-version':
        activateVersion(currentRoom, id);
        closeSheet();
        renderRoom();
        break;
    case 'wf-new-version':
        newVersionSheet();
        break;
    case 'wf-reconnect':
        newVersionSheet(true);
        break;
    case 'wf-sample-version':
        {
            const r = currentRoom
              , v = {
                id: crypto.randomUUID(),
                label: 'v' + (r.versions.length + 1),
                duration: 48,
                localFile: false,
                filename: 'Blue Hour_sample.wav',
                empty: false
            };
            r.versions.push(v);
            activateVersion(r, v.id);
            closeSheet();
            renderRoom();
            toast('같은 샘플 음원으로 새 버전 흐름을 만들었어요.')
        }
        break;
    case 'wf-members':
        membersSheet();
        break;
    case 'wf-member-add':
        if ($('#member-fields').children.length >= 12) {
            toast('참여자는 최대 12명까지 추가할 수 있어요.');
            break
        }
        $('#member-fields').insertAdjacentHTML('beforeend', memberFields());
        $('#member-fields').lastElementChild.querySelector('input').focus();
        break;
    case 'wf-member-remove':
        b.closest('.wf-member-fields').remove();
        break;
    case 'wf-chat':
        navigate('#chat/' + encodeURIComponent(id));
        break;
    case 'wf-person':
        personSheet();
        break;
    case 'wf-person-preview':
        {
            const a = artists.find(a => a.id === chatPerson(workflow.chatId).artistId);
            const r = state.rooms.find(r => r.cover === a?.cover) || state.rooms[0];
            if (playingRoom === r.id && !audio.paused) {
                audio.pause();
                b.innerHTML = icon('headphones') + '대표작 미리듣기'
            } else if (await startAudio(r, 0)) {
                b.innerHTML = icon('pause') + '미리듣기 멈추기'
            }
        }
        break;
    case 'wf-files':
        workflow.chatFilter = 'all';
        chatFilesSheet();
        break;
    case 'wf-file-filter':
        workflow.attachmentAudio?.pause();
        workflow.chatFilter = id;
        chatFilesSheet();
        break;
    case 'wf-attach':
        attachMenu();
        break;
    case 'wf-file-play':
        {
            const f = state.chatFiles.find(f => f.id === id);
            if (!f)
                break;
            const src = f.sample ? 'assets/demo.wav' : objectURLs.get(id);
            if (!src) {
                toast('파일을 다시 첨부해 주세요.');
                break
            }
            audio.pause();
            if (workflow.attachmentAudio?.dataset.file === id && !workflow.attachmentAudio.paused) {
                workflow.attachmentAudio.pause();
                b.innerHTML = icon('play') + '미리듣기';
                break
            }
            workflow.attachmentAudio?.pause();
            document.querySelectorAll('[data-action="wf-file-play"]').forEach(x => x.innerHTML = icon('play') + '미리듣기');
            const a = new Audio(src);
            a.dataset.file = id;
            workflow.attachmentAudio = a;
            try {
                await a.play();
                b.innerHTML = icon('pause') + '멈추기';
                a.onended = () => {
                    if (b.isConnected)
                        b.innerHTML = icon('play') + '미리듣기'
                }
            } catch {
                toast('재생하지 못했어요. 다시 선택해 주세요.')
            }
        }
        break;
    case 'wf-file-download':
        {
            const f = state.chatFiles.find(f => f.id === id)
              , url = f?.sample ? 'assets/demo.wav' : objectURLs.get(id);
            if (!url) {
                toast('파일을 다시 첨부해 주세요.');
                break
            }
            const a = document.createElement('a');
            a.href = url;
            a.download = f.sample ? 'TAMI_sample.wav' : f.name;
            a.click()
        }
        break;
    case 'wf-file-room':
        workflow.attachmentAudio?.pause();
        fileRoomSheet(id);
        break;
    case 'wf-file-new-room':
        sendFileToRoom(id);
        break;
    case 'wf-file-existing-room':
        sendFileToRoom(id, b.dataset.room);
        break;
    case 'wf-chat-room':
        createSheet();
        break;
    case 'wf-chat-portfolio':
        chatPortfolioSheet();
        break;
    case 'wf-login':
        loginSheet();
        break;
    case 'wf-logout':
        await handleSignOut();
        break;
    }
}
, true);
audio.addEventListener('timeupdate', updatePlayerUI);
audio.addEventListener('play', updatePlayerUI);
audio.addEventListener('pause', updatePlayerUI);
audio.addEventListener('ended', updatePlayerUI);

window.addEventListener('hashchange', route);

// 초기화 시 유저 세션 및 Supabase workgroups 데이터 로드 후 라우팅 실행
(async () => {
    // URL 해시에 access_token이 포함되어 있는 경우 Supabase가 세션을 처리하도록 유도
    if (window.location.hash && window.location.hash.includes('access_token')) {
        // Supabase가 자동으로 해시의 토큰을 읽어 세션을 설정합니다.
        await _supabase.auth.getSession();
        // 토큰 정리를 위해 해시를 기본 #portfolio로 깔끔하게 변경
        window.history.replaceState(null, '', window.location.pathname + '#portfolio');
    }

    await checkUserSession();
    await loadRoomsFromSupabase();
    route();
    
    // 로그인된 유저가 없을 때만 시작 화면 띄우기
    if (!currentUser) {
        startSheet();
    }
})();