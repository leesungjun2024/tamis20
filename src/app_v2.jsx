import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from './supabaseClient';

export default function App() {
  // 인증(Login) 상태
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // 프로젝트 및 포트폴리오 상태
  const [projectName, setProjectName] = useState('나의 포트폴리오 프로젝트');
  const [myProjects, setMyProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'portfolio'

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSequentialPlaying, setIsSequentialPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 트랙 리스트 (내 음악 / 타인(팀원) 음악 구분)
  const [tracks, setTracks] = useState([
    { id: 'vocal', title: '🎤 보컬 스템 (내 음악)', url: 'https://tami.s3.ap-southeast-2.amazonaws.com/11.mp3', muted: false, uploader: 'mine', order: 1 },
    { id: 'instrumental', title: '🎸 악기 스템 (타인/팀원 음악)', url: 'https://tami.s3.ap-southeast-2.amazonaws.com/12.mp3', muted: false, uploader: 'team', order: 2 },
  ]);

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [authorName, setAuthorName] = useState('작성자');
  const [selectedTrack, setSelectedTrack] = useState('vocal');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshRef = useRef(autoRefresh);
  autoRefreshRef.current = autoRefresh;

  const wavesurferRefs = useRef({});
  const containerRefs = useRef({});

  const isSequentialRef = useRef(false);
  const sequentialIndexRef = useRef(0);
  const trackListRef = useRef(tracks);
  trackListRef.current = tracks;

  // 세션 체크 및 로그인 상태 유지
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMyProjects(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMyProjects(session.user.id);
      }
    });

    fetchComments();

    const channel = supabase
      .channel('public:comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (payload) => {
        if (autoRefreshRef.current) {
          setComments((prev) => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('회원가입 성공! 로그인해주세요.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*').order('start_time', { ascending: true });
    if (data) setComments(data);
  };

  const fetchMyProjects = async (userId) => {
    const { data } = await supabase.from('projects').select('*').eq('user_id', userId);
    if (data) setMyProjects(data);
  };

  // 프로젝트 저장 (내 포트폴리오에 등록)
  const handleSaveProject = async () => {
    if (!user) {
      alert('로그인이 필요합니다!');
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{ project_name: projectName, user_id: user.id }])
      .select()
      .single();

    if (error) {
      alert('프로젝트 저장 실패');
    } else {
      alert(`"${projectName}" 프로젝트가 포트폴리오에 저장되었습니다!`);
      fetchMyProjects(user.id);
    }
  };

  // S3 파일 다중 업로드 (내 음악으로 추가)
  const handleS3MultipleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newUploaded = files.map((file, idx) => ({
      id: `s3_${Date.now()}_${idx}`,
      title: `🎵 ${file.name} (내 S3 음악)`,
      url: URL.createObjectURL(file), // 실제 AWS S3 URL 또는 Presigned URL 대입
      muted: false,
      uploader: 'mine',
      order: tracks.length + idx + 1
    }));

    setTracks((prev) => [...prev, ...newUploaded]);
    alert(`${files.length}개의 S3 음악이 추가되었습니다.`);
  };

  // WaveSurfer 초기화 및 순차 재생 로직
  useEffect(() => {
    let isMounted = true;
    const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);

    sortedTracks.forEach((track) => {
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

      ws.on('interaction', () => {
        if (!isMounted) return;
        const clickedTime = ws.getCurrentTime();
        setCurrentTime(clickedTime);
        setStartTime(Number(clickedTime.toFixed(2)));
        setEndTime(Number(clickedTime.toFixed(2)));
        setSelectedTrack(track.id);
      });

      ws.on('finish', () => {
        if (!isMounted) return;
        if (isSequentialRef.current) {
          ws.pause();
          const currentIndex = sequentialIndexRef.current;
          const nextIndex = currentIndex + 1;
          const currentTracks = [...trackListRef.current].sort((a, b) => a.order - b.order);

          if (nextIndex < currentTracks.length) {
            sequentialIndexRef.current = nextIndex;
            wavesurferRefs.current[currentTracks[currentIndex].id]?.setMuted(true);
            const nextWs = wavesurferRefs.current[currentTracks[nextIndex].id];
            if (nextWs) {
              nextWs.setMuted(false);
              nextWs.setTime(0);
              nextWs.play();
            }
          } else {
            isSequentialRef.current = false;
            setIsSequentialPlaying(false);
            currentTracks.forEach((t) => wavesurferRefs.current[t.id]?.setMuted(t.muted));
          }
        }
      });
    });

    return () => {
      isMounted = false;
      Object.values(wavesurferRefs.current).forEach((ws) => ws?.destroy());
    };
  }, [tracks]);

  const handleMasterPlayPause = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    Object.values(wavesurferRefs.current).forEach((ws) => {
      if (ws) nextState ? ws.play() : ws.pause();
    });
  };

  const handleSequentialPlay = () => {
    const nextSequentialState = !isSequentialPlaying;
    isSequentialRef.current = nextSequentialState;
    setIsSequentialPlaying(nextSequentialState);
    const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);

    if (nextSequentialState) {
      sequentialIndexRef.current = 0;
      sortedTracks.forEach((t, idx) => {
        const ws = wavesurferRefs.current[t.id];
        if (ws) {
          ws.setTime(0);
          ws.setMuted(idx !== 0);
          if (idx === 0) ws.play();
          else ws.pause();
        }
      });
    } else {
      sortedTracks.forEach((t) => {
        const ws = wavesurferRefs.current[t.id];
        if (ws) {
          ws.pause();
          ws.setMuted(t.muted);
        }
      });
    }
  };

  const handleToggleMute = (trackId) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t))
    );
  };

  const handleMoveTrack = (trackId, direction) => {
    const sorted = [...tracks].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((t) => t.id === trackId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const temp = sorted[index].order;
    sorted[index].order = sorted[targetIndex].order;
    sorted[targetIndex].order = temp;
    setTracks([...sorted]);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      track_id: selectedTrack,
      author: user ? user.email : authorName,
      start_time: Number(startTime),
      end_time: Number(endTime),
      text: newCommentText,
    };

    const { data, error } = await supabase.from('comments').insert([newComment]).select();
    if (!error && data && autoRefresh) {
      setComments((prev) => [...prev, data[0]]);
    }
    setNewCommentText('');
  };

  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);

  // 로그인하지 않은 경우 로그인 화면 표시
  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'sans-serif' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e293b' }}>🎵 S3 스튜디오 로그인</h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
          <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
          <button type="submit" style={{ padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {isSignUp ? '회원가입' : '로그인'}
          </button>
        </form>
        <p onClick={() => setIsSignUp(!isSignUp)} style={{ textAlign: 'center', marginTop: '15px', fontSize: '13px', color: '#6366f1', cursor: 'pointer' }}>
          {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '30px auto', padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'sans-serif' }}>
      
      {/* 상단 유저 정보 및 탭 네비게이션 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4f46e5' }}>👤 {user.email}</span> 님 환영합니다!
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('studio')} style={{ padding: '6px 12px', background: activeTab === 'studio' ? '#4f46e5' : '#e2e8f0', color: activeTab === 'studio' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            🎛️ 스튜디오
          </button>
          <button onClick={() => setActiveTab('portfolio')} style={{ padding: '6px 12px', background: activeTab === 'portfolio' ? '#4f46e5' : '#e2e8f0', color: activeTab === 'portfolio' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            📁 내 포트폴리오
          </button>
          <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            로그아웃
          </button>
        </div>
      </div>

      {activeTab === 'portfolio' ? (
        <div style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>📁 나의 프로젝트 포트폴리오</h2>
          {myProjects.length === 0 ? (
            <p style={{ color: '#64748b' }}>저장된 프로젝트가 없습니다. 스튜디오에서 프로젝트를 저장해 보세요!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myProjects.map((p) => (
                <div key={p.id} style={{ padding: '15px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{p.project_name}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 프로젝트 저장 및 S3 다중 업로드 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 16px', background: '#f1f5f9', borderRadius: '10px', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>프로젝트명:</label>
              <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#4f46e5' }} />
              <button onClick={handleSaveProject} style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                💾 포트폴리오 저장
              </button>
            </div>
            <div>
              <label style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'inline-block' }}>
                📁 AWS S3 내 음악 가져오기
                <input type="file" multiple accept="audio/*" onChange={handleS3MultipleUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px', color: '#111' }}>AWS S3 멀티트랙 피드백 스튜디오</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>내 음악과 타인(팀원)의 음악을 조합하여 포트폴리오를 구성하세요.</p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleMasterPlayPause} style={{ padding: '10px 16px', background: isPlaying ? '#ef4444' : '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isPlaying ? '⏸ 일시정지' : '▶ 전체 동시 재생'}
              </button>
              <button onClick={handleSequentialPlay} style={{ padding: '10px 16px', background: isSequentialPlaying ? '#d97706' : '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSequentialPlaying ? '⏹ 순차 재생 중지' : '🔁 스템별 순차 재생'}
              </button>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold' }}>{Math.floor(currentTime)}초 / {Math.floor(duration)}초</span>
          </div>

          {/* 트랙 리스트 (내 음악 vs 타인 음악 구분 배지 적용) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '25px' }}>
            {sortedTracks.map((track, idx) => (
              <div key={track.id} style={{ padding: '12px', background: '#fafafa', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', background: track.uploader === 'mine' ? '#dbeafe' : '#ffedd5', color: track.uploader === 'mine' ? '#1e40af' : '#9a3412', padding: '2px 6px', borderRadius: '4px' }}>
                      {track.uploader === 'mine' ? '내 음악' : '타인/팀원 음악'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#222' }}>{track.title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleMoveTrack(track.id, 'up')} disabled={idx === 0} style={{ padding: '3px 6px', fontSize: '10px' }}>⬆️</button>
                    <button onClick={() => handleMoveTrack(track.id, 'down')} disabled={idx === sortedTracks.length - 1} style={{ padding: '3px 6px', fontSize: '10px' }}>⬇️</button>
                    <button onClick={() => handleToggleMute(track.id)} style={{ padding: '3px 8px', fontSize: '11px', background: track.muted ? '#ef4444' : '#e5e7eb', color: track.muted ? '#fff' : '#333', border: 'none', borderRadius: '4px' }}>
                      {track.muted ? '🔇' : '🔊'}
                    </button>
                  </div>
                </div>
                <div ref={(el) => (containerRefs.current[track.id] = el)} style={{ width: '100%', background: '#fff', borderRadius: '6px' }} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}