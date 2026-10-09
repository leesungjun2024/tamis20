import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from './supabaseClient';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSequentialPlaying, setIsSequentialPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [projectName, setProjectName] = useState('나의 새 프로젝트');
  const [savedProjects, setSavedProjects] = useState([]);

  const [tracks, setTracks] = useState([
    { id: 'vocal', title: '🎤 보컬 스템 (Vocal)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', muted: false, uploader: 'mine', order: 1 },
    { id: 'instrumental', title: '🎸 악기 스템 (Instrumental)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', muted: false, uploader: 'team', order: 2 },
    { id: 'drums', title: '🥁 드럼 및 베이스 (Drums & Bass)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', muted: false, uploader: 'team', order: 3 }
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

  useEffect(() => {
    fetchComments();
    fetchProjects();

    const channel = supabase
      .channel('public:comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          // 자동 리프레쉬가 켜져 있을 때만 실시간 추가
          if (autoRefreshRef.current) {
            setComments((prev) => [...prev, payload.new]);
          }
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
      .order('start_time', { ascending: true });

    if (!error) {
      setComments(data || []);
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*');
    if (!error && data) {
      setSavedProjects(data);
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

  const handleMultipleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newTracks = files.map((file, idx) => ({
      id: `upload_${Date.now()}_${idx}`,
      title: `🎵 ${file.name} (내 파일)`,
      url: URL.createObjectURL(file),
      muted: false,
      uploader: 'mine',
      order: tracks.length + idx + 1
    }));

    setTracks((prev) => [...prev, ...newTracks]);
    alert(`${files.length}개의 파일이 성공적으로 추가되었습니다.`);
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
      // 자동 리프레쉬가 꺼져 있어도 내가 방금 등록한 내용은 바로 볼 수 있게 즉시 추가
      if (data && data.length > 0 && !autoRefresh) {
        setComments((prev) => [...prev, data[0]].sort((a, b) => a.start_time - b.start_time));
      }
      setNewCommentText('');
    }
  };

  const handleSaveProject = async () => {
    const { error } = await supabase
      .from('projects')
      .insert([{ project_name: projectName }]);

    if (error) {
      alert('프로젝트 저장 실패');
    } else {
      alert(`"${projectName}" 프로젝트가 저장되었습니다!`);
      fetchProjects();
    }
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

  return (
    <div style={{ maxWidth: '850px', margin: '30px auto', padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'sans-serif' }}>
      
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
            💾 프로젝트 저장
          </button>
        </div>

        <div>
          <label style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'inline-block' }}>
            📁 S3 파일 다중 업로드
            <input type="file" multiple accept="audio/*" onChange={handleMultipleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#111' }}>AWS S3 기반 멀티트랙 피드백 스튜디오</h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>템플릿 순차 재생, 트랙 순서 변경 및 미세 구간 피드백을 지원합니다.</p>

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
                  {track.uploader === 'mine' ? '내 파일' : '팀원 파일'}
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

        {/* 타임라인 피드백 목록 및 리프레시 컨트롤 영역 */}
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
    </div>
  );
}