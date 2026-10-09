import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from './supabaseClient';

export default function App() {
  // 인증(Login) 상태
  const [user, setUser] = useState(null);   
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // 탭 전환 상태 ('studio' | 'portfolio')
  const [activeTab, setActiveTab] = useState('studio');
  const [myProjects, setMyProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSequentialPlaying, setIsSequentialPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [projectName, setProjectName] = useState('나의 새 프로젝트');

  // 트랙 리스트 (내 파일 vs 팀원/타인 파일 구분)
  const [tracks, setTracks] = useState([
    { id: 'vocal', title: '🎤 보컬 스템 (내 음악)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', muted: false, uploader: 'mine', order: 1 },
    { id: 'instrumental', title: '🎸 악기 스템 (팀원/타인 음악)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', muted: false, uploader: 'team', order: 2 },
    { id: 'drums', title: '🥁 드럼 및 베이스 (팀원/타인 음악)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', muted: false, uploader: 'team', order: 3 }
  ]);

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [authorName, setAuthorName] = useState('팀원');
  const [selectedTrack, setSelectedTrack] = useState('vocal');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  // 자동 리프레쉬 상태 및 Ref 설정
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef(autoRefresh);
  autoRefreshRef.current = autoRefresh;

  const wavesurferRefs = useRef({});
  const containerRefs = useRef({});

  const isSequentialRef = useRef(false);
  const sequentialIndexRef = useRef(0);
  const trackListRef = useRef(tracks);
  trackListRef.current = tracks;

  // 세션 체크 및 실시간 구독 설정
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMyProjects(session.user.id);
        setAuthorName(session.user.email.split('@')[0]);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMyProjects(session.user.id);
        setAuthorName(session.user.email.split('@')[0]);
      }
    });

    fetchComments();

    const channel = supabase
      .channel('public:comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          if (autoRefreshRef.current) {
            setComments((prev) => [...prev, payload.new]);
          }
        }
      )
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
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('start_time', { ascending: true });

    if (!error) {
      setComments(data || []);
    }
  };

  const fetchMyProjects = async (userId) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyProjects(data);
    }
  };

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
  }, [tracks]);

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

  const handleSequentialPlay = () => {
    if (isPlaying) {
      Object.values(wavesurferRefs.current).forEach((ws) => ws?.pause());
      setIsPlaying(false);
    }

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

  // S3 파일 다중 업로드 (내 음악 추가)
  const handleMultipleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newTracks = files.map((file, idx) => ({
      id: `upload_${Date.now()}_${idx}`,
      title: `🎵 ${file.name} (내 S3 음악)`,
      url: URL.createObjectURL(file),
      muted: false,
      uploader: 'mine',
      order: tracks.length + idx + 1
    }));

    setTracks((prev) => [...prev, ...newTracks]);
    alert(`${files.length}개의 S3 음악 파일이 추가되었습니다.`);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      track_id: selectedTrack,
      author: authorName,
      start_time: Number(Number(startTime).toFixed(2)),
      end_time: Number(Number(endTime).toFixed(2)),
      text: newCommentText,
    };

    const { data, error } = await supabase.from('comments').insert([newComment]).select();

    if (error) {
      alert('댓글 저장 중 오류가 발생했습니다.');
    } else {
      if (data && data.length > 0 && !autoRefresh) {
        setComments((prev) => [...prev, data[0]].sort((a, b) => a.start_time - b.start_time));
      }
      setNewCommentText('');
    }
  };

  // 프로젝트 포트폴리오 저장
  const handleSaveProject = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (currentProjectId) {
      // 기존 프로젝트 업데이트
      const { error } = await supabase
        .from('projects')
        .update({ project_name: projectName })
        .eq('id', currentProjectId);

      if (error) alert('프로젝트 수정 실패');
      else alert(`"${projectName}" 프로젝트가 수정되었습니다!`);
    } else {
      // 새 프로젝트 저장
      const { data, error } = await supabase
        .from('projects')
        .insert([{ project_name: projectName, user_id: user.id }])
        .select()
        .single();

      if (error) {
        alert('프로젝트 저장 실패');
      } else {
        setCurrentProjectId(data.id);
        alert(`"${projectName}" 프로젝트가 포트폴리오에 저장되었습니다!`);
        fetchMyProjects(user.id);
      }
    }
  };

  // 포트폴리오 목록에서 특정 프로젝트 불러오기
  const handleLoadProject = (project) => {
    setCurrentProjectId(project.id);
    setProjectName(project.project_name);
    setActiveTab('studio');
    alert(`"${project.project_name}" 프로젝트를 불러왔습니다.`);
  };

  const handleSeek = (seconds) => {
    Object.values(wavesurferRefs.current).forEach((ws) => {
      if (ws) ws.setTime(seconds);
    });
    setCurrentTime(seconds);
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);

  // 로그인하지 않은 경우 로그인/회원가입 화면 표시
  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'sans-serif' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e293b' }}>🎵 S3 멀티트랙 스튜디오 로그인</h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="email" 
            placeholder="이메일 입력" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
            required 
          />
          <input 
            type="password" 
            placeholder="비밀번호 입력" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
            required 
          />
          <button type="submit" style={{ padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {isSignUp ? '회원가입 하기' : '로그인 하기'}
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
      
      {/* 상단 로그인 정보 및 탭 네비게이션 바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4f46e5' }}>👤 {user.email}</span> 님 접속중
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('studio')} 
            style={{ padding: '6px 12px', background: activeTab === 'studio' ? '#4f46e5' : '#e2e8f0', color: activeTab === 'studio' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
          >
            🎛️ 스튜디오
          </button>
          <button 
            onClick={() => setActiveTab('portfolio')} 
            style={{ padding: '6px 12px', background: activeTab === 'portfolio' ? '#4f46e5' : '#e2e8f0', color: activeTab === 'portfolio' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
          >
            📁 내 포트폴리오 ({myProjects.length})
          </button>
          <button 
            onClick={handleLogout} 
            style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {activeTab === 'portfolio' ? (
        <div style={{ padding: '20px 0' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#1e293b' }}>📁 나의 포트폴리오 프로젝트 관리</h2>
          {myProjects.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', background: '#f8fafc', borderRadius: '10px' }}>
              저장된 프로젝트가 없습니다. 스튜디오에서 프로젝트를 저장해 보세요!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myProjects.map((p) => (
                <div key={p.id} style={{ padding: '16px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '15px', display: 'block', marginBottom: '4px' }}>{p.project_name}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>생성일: {new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={() => handleLoadProject(p)}
                    style={{ padding: '8px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                  >
                    📂 프로젝트 불러오기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 16px', background: '#f1f5f9', borderRadius: '10px', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>프로젝트명:</label>
              <input 
                type="text" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#4f46e5' }}
              />
              <button onClick={handleSaveProject} style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                💾 포트폴리오 저장
              </button>
            </div>

            <div>
              <label style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'inline-block' }}>
                📁 AWS S3 내 음악 가져오기
                <input type="file" multiple accept="audio/*" onChange={handleMultipleUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#111' }}>AWS S3 기반 멀티트랙 피드백 스튜디오</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>내 음악과 팀원/타인의 음악을 조합하여 순차 재생 및 미세 구간 피드백을 진행하세요.</p>

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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' }}>
            {sortedTracks.map((track, idx) => (
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', background: track.uploader === 'mine' ? '#dbeafe' : '#ffedd5', color: track.uploader === 'mine' ? '#1e40af' : '#9a3412', padding: '2px 6px', borderRadius: '4px' }}>
                      {track.uploader === 'mine' ? '내 음악' : '팀원/타인 음악'}
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#222' }}>{track.title}</span>
                    {isSequentialPlaying && sequentialIndexRef.current === idx && (
                      <span style={{ padding: '2px 6px', background: '#3b82f6', color: '#fff', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px' }}>
                        재생 중 🎵
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => handleMoveTrack(track.id, 'up')} disabled={idx === 0} style={{ padding: '4px 8px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>⬆️ 위로</button>
                    <button onClick={() => handleMoveTrack(track.id, 'down')} disabled={idx === sortedTracks.length - 1} style={{ padding: '4px 8px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>⬇️ 아래로</button>
                    <button
                      onClick={() => handleToggleMute(track.id)}
                      style={{ padding: '4px 10px', background: track.muted ? '#ef4444' : '#e5e7eb', color: track.muted ? '#fff' : '#374151', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {track.muted ? '🔇 음소거 해제' : '🔊 음소거'}
                    </button>
                  </div>
                </div>
                <div ref={(el) => (containerRefs.current[track.id] = el)} style={{ width: '100%', background: '#fff', borderRadius: '6px', overflow: 'hidden' }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>💬 미세 구간 타임라인 피드백</h3>
              <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>작성자</label>
                    <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>대상 트랙</label>
                    <select value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}>
                      {tracks.map((t) => (<option key={t.id} value={t.id}>{t.title}</option>))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>시작점 (초)</label>
                    <input type="number" step="0.1" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>종료점 (초)</label>
                    <input type="number" step="0.1" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }} required />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>의견 내용</label>
                  <textarea value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} placeholder="파형을 클릭하거나 수치를 입력하세요..." style={{ width: '100%', height: '60px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', resize: 'none' }} required />
                </div>

                <button type="submit" style={{ padding: '8px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  실시간 공유하기 🚀
                </button>
              </form>
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '320px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                  📋 타임라인 피드백 ({comments.length})
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', color: '#475569', fontWeight: '600' }}>
                    <input 
                      type="checkbox" 
                      checked={autoRefresh} 
                      onChange={(e) => setAutoRefresh(e.target.checked)} 
                    />
                    자동 리프레쉬
                  </label>
                  <button 
                    onClick={fetchComments}
                    style={{ padding: '4px 8px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    🔄 리프레시
                  </button>
                </div>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {comments.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '60px' }}>
                    등록된 피드백이 없습니다.
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} onClick={() => handleSeek(Number(c.start_time || 0))} style={{ padding: '8px', background: '#fff', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#4f46e5' }}>{c.author}</span>
                        <span style={{ fontSize: '10px', fontFamily: 'monospace', background: '#e0e7ff', color: '#3730a3', padding: '1px 4px', borderRadius: '4px' }}>
                          {formatTime(Number(c.start_time || 0))} ~ {formatTime(Number(c.end_time || c.start_time || 0))}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>{c.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div> 
  );
}