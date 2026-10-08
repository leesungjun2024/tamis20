import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from './supabaseClient';

export default function App() {
const [isPlaying, setIsPlaying] = useState(false);
const [isSequentialPlaying, setIsSequentialPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);

// 실시간 동기화되는 댓글 목록 
const [comments, setComments] = useState([]);
const [newCommentText, setNewCommentText] = useState('');
const [authorName, setAuthorName] = useState('팀원');
const [selectedTrack, setSelectedTrack] = useState('vocal');

// AWS S3 스템 파일 URL 설정 (11.mp3, 12.mp3, 13.mp3)
const [tracks, setTracks] = useState([
{ id: 'vocal', title: '🎤 보컬 스템 (Vocal)', url: 'https://tami.s3.ap-southeast-2.amazonaws.com/11.mp3', muted: false },
{ id: 'instrumental', title: '🎸 악기 스템 (Instrumental)', url: 'https://tami.s3.ap-southeast-2.amazonaws.com/12.mp3', muted: false },
{ id: 'drums', title: '🥁 드럼 및 베이스 (Drums & Bass)', url: 'https://tami.s3.ap-southeast-2.amazonaws.com/13.mp3', muted: false }
]);

const wavesurferRefs = useRef({});
const containerRefs = useRef({});

// 순차적 재생 상태 관리를 위한 Ref (비동기 이벤트 내부 최신 값 참조용)
const isSequentialRef = useRef(false);
const sequentialIndexRef = useRef(0);
const trackListRef = useRef(tracks);
trackListRef.current = tracks;

// 1. Supabase 초기 댓글 불러오기 및 실시간(Realtime) 구독 설정
useEffect(() => {
fetchComments();

const channel = supabase
.channel('public:comments')
.on(
'postgres_changes',
{ event: 'INSERT', schema: 'public', table: 'comments' },
(payload) => {
setComments((prev) => [...prev, payload.new]);
}
)
.subscribe();

return () => {
supabase.removeChannel(channel);
};
}, []);

const fetchComments = async () => {
const { data, error } = await supabase
.from('comments')
.select('*')
.order('timestamp_seconds', { ascending: true });

if (error) {
console.error('댓글을 불러오는 중 오류 발생:', error);
} else {
setComments(data || []);
}
};

// 2. WaveSurfer 초기화 및 이벤트 리스너 설정
useEffect(() => {
let isMounted = true;

tracks.forEach((track, index) => {
const container = containerRefs.current[track.id];
if (!container) return;

if (wavesurferRefs.current[track.id]) {
wavesurferRefs.current[track.id].destroy();
}

const ws = WaveSurfer.create({
container: container,
url: track.url,
waveColor: '#cbd5e1',
progressColor: '#6366f1',
cursorColor: '#4f46e5',
height: 48,
});

wavesurferRefs.current[track.id] = ws;

ws.on('ready', () => {
if (!isMounted) return;
const dur = ws.getDuration();
if (dur > duration) setDuration(dur);
});

ws.on('audioprocess', () => {
if (!isMounted) return;
if (track.id === trackListRef.current[0].id && !isSequentialRef.current) {
setCurrentTime(ws.getCurrentTime());
}
});

// 개별 트랙 재생 완료 시 처리 (순차 재생 모드 지원)
ws.on('finish', () => {
if (!isMounted) return;

if (isSequentialRef.current) {
ws.pause();
const currentIndex = sequentialIndexRef.current;
const nextIndex = currentIndex + 1;
const currentTracks = trackListRef.current;

if (nextIndex < currentTracks.length) {
sequentialIndexRef.current = nextIndex;
const prevTrackId = currentTracks[currentIndex].id;
const nextTrackId = currentTracks[nextIndex].id;

wavesurferRefs.current[prevTrackId]?.setMuted(true);
const nextWs = wavesurferRefs.current[nextTrackId];
if (nextWs) {
nextWs.setMuted(false);
nextWs.setTime(0);
nextWs.play();
}
} else {
// 모든 트랙 순차 재생 완료
isSequentialRef.current = false;
setIsSequentialPlaying(false);
currentTracks.forEach((t) => {
wavesurferRefs.current[t.id]?.setMuted(t.muted);
});
}
} else {
if (track.id === trackListRef.current[0].id) {
setIsPlaying(false);
}
}
});
});

return () => {
isMounted = false;
Object.values(wavesurferRefs.current).forEach((ws) => ws?.destroy());
};
}, []);

// 전체 동시 재생 / 일시정지
const handleMasterPlayPause = () => {
if (isSequentialRef.current) {
isSequentialRef.current = false;
setIsSequentialPlaying(false);
tracks.forEach((t) => {
wavesurferRefs.current[t.id]?.pause();
wavesurferRefs.current[t.id]?.setMuted(t.muted);
});
}

const nextState = !isPlaying;
setIsPlaying(nextState);

Object.values(wavesurferRefs.current).forEach((ws) => {
if (ws) {
if (nextState) ws.play();
else ws.pause();
}
});
};

// 🔁 스템별 순차적 솔로 재생 시작/중지
const handleSequentialPlay = () => {
if (isPlaying) {
Object.values(wavesurferRefs.current).forEach((ws) => ws?.pause());
setIsPlaying(false);
}

const nextSequentialState = !isSequentialPlaying;
isSequentialRef.current = nextSequentialState;
setIsSequentialPlaying(nextSequentialState);

if (nextSequentialState) {
sequentialIndexRef.current = 0;
tracks.forEach((t, idx) => {
const ws = wavesurferRefs.current[t.id];
if (ws) {
ws.setTime(0);
if (idx === 0) {
ws.setMuted(false);
ws.play();
} else {
ws.setMuted(true);
ws.pause();
}
}
});
} else {
tracks.forEach((t) => {
const ws = wavesurferRefs.current[t.id];
if (ws) {
ws.pause();
ws.setMuted(t.muted);
}
});
}
};

// 개별 트랙 음소거 토글
const handleToggleMute = (trackId) => {
setTracks((prev) =>
prev.map((t) => {
if (t.id === trackId) {
const newMuted = !t.muted;
const ws = wavesurferRefs.current[trackId];
if (ws && !isSequentialRef.current) ws.setMuted(newMuted);
return { ...t, muted: newMuted };
}
return t;
})
);
};

// 타임스탬프 클릭 시 위치 이동
const handleSeek = (seconds) => {
Object.values(wavesurferRefs.current).forEach((ws) => {
if (ws) ws.setTime(seconds);
});
setCurrentTime(seconds);
};

// 3. Supabase로 실시간 댓글 등록
const handleAddComment = async (e) => {
e.preventDefault();
if (!newCommentText.trim()) return;

const newComment = {
track_id: selectedTrack,
author: authorName,
timestamp_seconds: Number(currentTime.toFixed(2)),
text: newCommentText,
};

const { error } = await supabase.from('comments').insert([newComment]);

if (error) {
console.error('댓글 저장 실패:', error);
alert('댓글 저장 중 오류가 발생했습니다.');
} else {
setNewCommentText('');
}
};

const formatTime = (secs) => {
const m = Math.floor(secs / 60);
const s = Math.floor(secs % 60);
return `${m}:${s < 10 ? '0' : ''}${s}`;
};

return (
<div style={{ maxWidth: '800px', margin: '30px auto', padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'sans-serif' }}>
<h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#111' }}>AWS S3 기반 멀티트랙 피드백 스튜디오</h2>
<p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>S3에 저장된 고음질 스템 음원을 동시 재생 혹은 순차 재생하고 팀원들과 실시간 피드백을 공유하세요.</p>

{/* 플레이어 컨트롤 바 (동시 재생 및 순차 재생 버튼 추가) */}
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', gap: '10px', flexWrap: 'wrap' }}>
<div style={{ display: 'flex', gap: '8px' }}>
<button
onClick={handleMasterPlayPause}
style={{ padding: '10px 16px', background: isPlaying ? '#ef4444' : '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
>
{isPlaying ? '⏸ 전체 일시정지' : '▶ 전체 동시 재생'}
</button>
<button
onClick={handleSequentialPlay}
style={{ padding: '10px 16px', background: isSequentialPlaying ? '#d97706' : '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
>
{isSequentialPlaying ? '⏹ 순차 재생 중지' : '🔁 스템별 순차 재생'}
</button>
</div>
<span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
{formatTime(currentTime)} / {formatTime(duration)}
</span>
</div>

{/* 멀티트랙 웨이브폼 리스트 */}
<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' }}>
{tracks.map((track, idx) => (
<div
key={track.id}
style={{
padding: '14px',
background: isSequentialPlaying && sequentialIndexRef.current === idx ? '#eff6ff' : '#fafafa',
borderRadius: '12px',
border: isSequentialPlaying && sequentialIndexRef.current === idx ? '2px solid #3b82f6' : '1px solid #e5e7eb',
transition: 'all 0.2s'
}}
>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
<span style={{ fontSize: '15px', fontWeight: 'bold', color: '#222' }}>{track.title}</span>
{isSequentialPlaying && sequentialIndexRef.current === idx && (
<span style={{ padding: '2px 6px', background: '#3b82f6', color: '#fff', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px' }}>
재생 중 🎵
</span>
)}
</div>
<button
onClick={() => handleToggleMute(track.id)}
style={{ padding: '4px 10px', background: track.muted ? '#ef4444' : '#e5e7eb', color: track.muted ? '#fff' : '#374151', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
>
{track.muted ? '🔇 음소거 해제' : '🔊 음소거'}
</button>
</div>
<div ref={(el) => (containerRefs.current[track.id] = el)} style={{ width: '100%', background: '#fff', borderRadius: '6px', overflow: 'hidden' }} />
</div>
))}
</div>

{/* 하단 피드백 입력 및 실시간 목록 영역 */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
{/* 댓글 작성 폼 */}
<div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
<h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>💬 피드백 남기기</h3>
<form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
<div>
<label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>작성자 이름</label>
<input
type="text"
value={authorName}
onChange={(e) => setAuthorName(e.target.value)}
style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
required
/>
</div>
<div>
<label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>대상 트랙</label>
<select
value={selectedTrack}
onChange={(e) => setSelectedTrack(e.target.value)}
style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
>
{tracks.map((t) => (
<option key={t.id} value={t.id}>{t.title}</option>
))}
</select>
</div>
<div>
<label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>타임스탬프: {formatTime(currentTime)}</label>
<textarea
value={newCommentText}
onChange={(e) => setNewCommentText(e.target.value)}
placeholder="이 구간에 대한 의견을 적어주세요..."
style={{ width: '100%', height: '70px', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', resize: 'none' }}
required
/>
</div>
<button
type="submit"
style={{ padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
>
실시간 공유하기 🚀 
</button>
</form>
</div>

{/* 실시간 댓글 목록 (팀원들과 동기화) */}
<div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '320px' }}>
<h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>
📋 실시간 타임라인 피드백 ({comments.length})
</h3>
<div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
{comments.length === 0 ? (
<div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '60px' }}>
아직 등록된 피드백이 없습니다.<br />첫 피드백을 남겨보세요!
</div>
) : (
comments.map((c) => (
<div
key={c.id}
onClick={() => handleSeek(Number(c.timestamp_seconds))}
style={{ padding: '10px', background: '#fff', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}
>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
<span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5' }}>{c.author}</span>
<span style={{ fontSize: '11px', fontFamily: 'monospace', background: '#e0e7ff', color: '#3730a3', padding: '1px 6px', borderRadius: '4px' }}>
{formatTime(Number(c.timestamp_seconds))}
</span>
</div>
<p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>{c.text}</p>
</div>
))
)}
</div>
</div>
</div>
</div>
);
}
