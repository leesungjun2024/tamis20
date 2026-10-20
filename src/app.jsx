import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from './supabaseClient'; 

export default function App() {
  // 1. 인증(Login) 상태 
  const [user, setUser] = useState(null);   
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // 2. 탭 관리 상태 ('portfolio' | 'studio')
  const [activeTab, setActiveTab] = useState('portfolio');
  const [myPortfolios, setMyPortfolios] = useState([]);
  const [currentPortfolioId, setCurrentPortfolioId] = useState(null);
  const [portfolioName, setPortfolioName] = useState('새 포트폴리오');
  const [portfolioOwnerEmail, setPortfolioOwnerEmail] = useState(''); 
  const [portfolioMembers, setPortfolioMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');

  // 3. 오디오 재생 및 타임라인 상태
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 재생 방식 체크박스 상태 ('all' | 'sequential' | 'none') 및 메인 재생 상태
  const [playMode, setPlayMode] = useState('none'); 
  const [isMainPlaying, setIsMainPlaying] = useState(false);
  const [activeSequentialTrackId, setActiveSequentialTrackId] = useState(null);

  // 개별 트랙 재생 상태 관리 객체 (trackId: boolean)
  const [trackPlayingStates, setTrackPlayingStates] = useState({});

  // 4. 트랙 리스트
  const [tracks, setTracks] = useState([]);

  // 5. 피드백 및 댓글 상태
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [authorName, setAuthorName] = useState('사용자');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  // 대댓글 입력 상태 관리
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const wavesurferRefs = useRef({});
  const containerRefs = useRef({});
  const trackListRef = useRef(tracks);
  trackListRef.current = tracks;

  // 인증 상태 변화 감지 및 세션 관리
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        fetchMyPortfolios(currentUser);
        setAuthorName(currentUser.email.split('@')[0]);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('회원가입 성공! 로그인해주세요.');
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(error.message);
        return;
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPortfolioId(null);
    setTracks([]);
    setComments([]);
    setPortfolioMembers([]);
    setActiveTab('portfolio');
  };

  // 포트폴리오 목록 조회 (내가 소유했거나 초대받은 포트폴리오)
  const fetchMyPortfolios = async (userObj) => {
    if (!userObj) return;

    try {
      let rawPortfolios = [];

      const { data: myOwnedData, error: myError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userObj.id);

      if (myError) throw myError;

      const { data: invitedMemberData, error: memberError } = await supabase
        .from('portfolio_members')
        .select('portfolio_id')
        .eq('member_email', userObj.email);

      if (memberError) throw memberError;

      const invitedIds = (invitedMemberData || []).map((m) => m.portfolio_id);

      let invitedPortfolios = [];
      if (invitedIds.length > 0) {
        const { data: invitedData, error: invitedError } = await supabase
          .from('portfolios')
          .select('*')
          .in('id', invitedIds);

        if (!invitedError && invitedData) {
          invitedPortfolios = invitedData;
        }
      }

      const combinedMap = new Map();
      [...(myOwnedData || []), ...invitedPortfolios].forEach((item) => {
        if (item.view_yn !== 'N' && item.del_yn !== 'Y') {
          combinedMap.set(item.id, item);
        }
      });

      rawPortfolios = Array.from(combinedMap.values());
      const portfolioIds = rawPortfolios.map((p) => p.id);

      if (portfolioIds.length === 0) {
        setMyPortfolios([]);
        return;
      }

      const { data: membersData } = await supabase
        .from('portfolio_members')
        .select('*')
        .in('portfolio_id', portfolioIds);

      const { data: feedbacksData } = await supabase
        .from('feedbacks')
        .select('id, portfolio_id, del_yn')
        .in('portfolio_id', portfolioIds);

      const validFeedbacks = (feedbacksData || []).filter(f => f.del_yn !== 'Y');

      const finalPortfolios = rawPortfolios.map((p) => {
        const members = (membersData || []).filter((m) => m.portfolio_id === p.id);
        const feedbackCount = validFeedbacks.filter((f) => f.portfolio_id === p.id).length;
        const ownerEmail = (p.user_email && !p.user_email.includes('user_') && p.user_email.includes('@')) 
          ? p.user_email 
          : (userObj.email || '알 수 없음');

        return {
          ...p,
          user_email: ownerEmail,
          invited_members: members.map((m) => m.member_email),
          feedback_count: feedbackCount
        };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setMyPortfolios(finalPortfolios);
    } catch (err) {
      console.error('포트폴리오 목록 조회 오류:', err);
    }
  };

  const handleDeleteCurrentPortfolio = async () => {
    if (!currentPortfolioId) return;

    const isOwner = user?.email && portfolioOwnerEmail && 
      user.email.trim().toLowerCase() === portfolioOwnerEmail.trim().toLowerCase();

    if (!isOwner) {
      alert('⚠️ 포트폴리오 삭제는 소유자만 가능합니다.');
      return;
    }

    if (!window.confirm(`정말 "${portfolioName}" 포트폴리오를 삭제하시겠습니까?`)) return;

    const { error } = await supabase
      .from('portfolios')
      .update({ del_yn: 'Y' })
      .eq('id', currentPortfolioId);

    if (error) {
      alert('포트폴리오 삭제 실패: ' + error.message);
    } else {
      alert('포트폴리오가 삭제되었습니다.');
      setCurrentPortfolioId(null);
      setActiveTab('portfolio');
      fetchMyPortfolios(user);
    }
  };

  const handleDeleteTrack = async (trackId, trackName) => {
    if (!window.confirm(`정말 "${trackName}" 음원을 삭제하시겠습니까?`)) return;

    if (wavesurferRefs.current[trackId]) {
      wavesurferRefs.current[trackId].destroy();
      delete wavesurferRefs.current[trackId];
    }

    const { error } = await supabase
      .from('tracks')
      .update({ del_yn: 'Y' })
      .eq('id', trackId);

    if (error) {
      const { error: deleteError } = await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId);

      if (deleteError) {
        alert('음원 삭제 실패: ' + deleteError.message);
        return;
      }
    }

    setTracks(prev => {
      const filtered = prev.filter(t => t.id !== trackId);
      if (selectedTrack === trackId) {
        setSelectedTrack(filtered.length > 0 ? filtered[0].id : '');
      }
      return filtered;
    });

    alert('음원이 삭제되었습니다.');
  };

  const fetchFeedbacksAndReplies = async (portfolioId) => {
    const { data: feedbackData } = await supabase
      .from('feedbacks')
      .select(`*, tracks (track_name)`)
      .eq('portfolio_id', portfolioId);

    if (feedbackData) {
      const activeFeedbacks = feedbackData.filter(f => f.del_yn !== 'Y');
      const sorted = activeFeedbacks.sort((a, b) => (a.start_time || 0) - (b.start_time || 0));
      setComments(sorted);
    } else {
      setComments([]);
    }
  };

  const handleLoadPortfolio = async (portfolio) => {
    setCurrentPortfolioId(portfolio.id);
    setPortfolioName(portfolio.portfolio_name);
    setPortfolioOwnerEmail(portfolio.user_email || user?.email || '알 수 없음');
    setActiveTab('studio');

    const { data: trackData } = await supabase
      .from('tracks')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('order', { ascending: true });

    if (trackData && trackData.length > 0) {
      const activeTracks = trackData.filter(t => t.del_yn !== 'Y');
      setTracks(activeTracks);
      setSelectedTrack(activeTracks.length > 0 ? activeTracks[0].id : '');
    } else {
      setTracks([]);
      setSelectedTrack('');
    }

    await fetchFeedbacksAndReplies(portfolio.id);

    const { data: memberData } = await supabase
      .from('portfolio_members')
      .select('*')
      .eq('portfolio_id', portfolio.id);

    setPortfolioMembers(memberData || []);
  };

  const handleCreatePortfolio = async () => {
    if (!user) return;
    const title = prompt('새 포트폴리오 이름을 입력하세요:', '나의 새 포트폴리오');
    if (!title) return;

    const { data, error } = await supabase
      .from('portfolios')
      .insert([
        { 
          portfolio_name: title, 
          user_id: user.id, 
          user_email: user.email, 
          view_yn: 'Y',
          del_yn: 'N'
        }
      ])
      .select()
      .single();

    if (error) {
      alert('포트폴리오 생성 실패: ' + error.message);
    } else {
      fetchMyPortfolios(user);
      handleLoadPortfolio(data);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    const trimmedEmail = inviteEmail.trim();
    if (!trimmedEmail || !currentPortfolioId) return;

    if (trimmedEmail.toLowerCase() === portfolioOwnerEmail.toLowerCase()) {
      alert(`이미 초대 된 사용자(${trimmedEmail}) 입니다.`);
      setInviteEmail('');
      return;
    }

    const { data: dbMembers, error: dbError } = await supabase
      .from('portfolio_members')
      .select('member_email')
      .eq('portfolio_id', currentPortfolioId);

    if (dbError) {
      alert('초대 목록 조회 중 오류가 발생했습니다.');
      return;
    }

    const isAlreadyMember = (dbMembers || []).some(
      (m) => m.member_email && m.member_email.toLowerCase() === trimmedEmail.toLowerCase()
    );

    if (isAlreadyMember) {
      alert(`이미 초대 된 사용자(${trimmedEmail}) 입니다.`);
      setInviteEmail('');
      return;
    }

    const { error: insertError } = await supabase
      .from('portfolio_members')
      .insert([{ portfolio_id: currentPortfolioId, member_email: trimmedEmail, role: 'editor' }]);

    if (insertError) {
      if (insertError.code === '23505') {
        alert(`이미 초대 된 사용자(${trimmedEmail}) 입니다.`);
      } else {
        alert('사용자 초대 실패: ' + insertError.message);
      }
    } else {
      alert(`${trimmedEmail} 님을 초대했습니다!`);
      setInviteEmail('');
      
      const { data: refreshedMembers } = await supabase
        .from('portfolio_members')
        .select('*')
        .eq('portfolio_id', currentPortfolioId);
      setPortfolioMembers(refreshedMembers || []);
      fetchMyPortfolios(user);
    }
  };

  useEffect(() => {
    if (!currentPortfolioId || tracks.length === 0) return;
    let isMounted = true;
    const sortedTracks = [...tracks].sort((a, b) => (a.order || 0) - (b.order || 0));

    sortedTracks.forEach((track, index) => {
      const container = containerRefs.current[track.id];
      if (!container) return;

      if (wavesurferRefs.current[track.id]) {
        wavesurferRefs.current[track.id].destroy();
      }

      const ws = WaveSurfer.create({
        container: container,
        url: track.file_url,
        waveColor: '#cbd5e1',
        progressColor: '#6366f1',
        cursorColor: '#4f46e5',
        height: 48,
        mediaControls: false,
        xhr: { cache: 'default', mode: 'cors' }
      });

      wavesurferRefs.current[track.id] = ws;

      ws.on('ready', () => {
        if (!isMounted) return;
        const dur = ws.getDuration();
        if (dur > duration) setDuration(dur);
      });

      ws.on('audioprocess', () => {
        if (!isMounted) return;
        if (track.id === trackListRef.current[0]?.id) {
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

      ws.on('play', () => {
        if (!isMounted) return;
        setTrackPlayingStates(prev => ({ ...prev, [track.id]: true }));
      });

      ws.on('pause', () => {
        if (!isMounted) return;
        setTrackPlayingStates(prev => ({ ...prev, [track.id]: false }));
      });

      ws.on('finish', () => {
        if (!isMounted) return;
        setTrackPlayingStates(prev => ({ ...prev, [track.id]: false }));

        if (playMode === 'sequential') {
          const currentTracks = [...trackListRef.current].sort((a, b) => (a.order || 0) - (b.order || 0));
          const nextIndex = index + 1;
          if (nextIndex < currentTracks.length) {
            const nextTrack = currentTracks[nextIndex];
            setActiveSequentialTrackId(nextTrack.id);
            const nextWs = wavesurferRefs.current[nextTrack.id];
            if (nextWs) {
              nextWs.play();
            }
          } else {
            setIsMainPlaying(false);
            setActiveSequentialTrackId(null);
          }
        }
      });
    });

    return () => {
      isMounted = false;
      Object.values(wavesurferRefs.current).forEach((ws) => ws?.destroy());
    };
  }, [tracks, currentPortfolioId, playMode]);

  const handlePlayModeChange = (mode) => {
    const newMode = playMode === mode ? 'none' : mode;
    setPlayMode(newMode);

    if (newMode === 'none') {
      setIsMainPlaying(false);
      setActiveSequentialTrackId(null);
      Object.values(wavesurferRefs.current).forEach((ws) => {
        if (ws) ws.pause();
      });
    } else {
      setIsMainPlaying(true);
      if (newMode === 'all') {
        setActiveSequentialTrackId(null);
        Object.values(wavesurferRefs.current).forEach((ws) => {
          if (ws) ws.play();
        });
      } else if (newMode === 'sequential') {
        if (tracks.length === 0) {
          alert('재생할 음원이 없습니다.');
          setPlayMode('none');
          setIsMainPlaying(false);
          return;
        }
        const sortedTracks = [...tracks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const firstTrack = sortedTracks[0];
        setActiveSequentialTrackId(firstTrack.id);

        Object.entries(wavesurferRefs.current).forEach(([id, ws]) => {
          if (ws) {
            if (id === firstTrack.id) {
              ws.play();
            } else {
              ws.pause();
              ws.setTime(0);
            }
          }
        });
      }
    }
  };

  const handleMainPlayPauseToggle = () => {
    if (playMode === 'none') {
      alert('재생 방식을 체크박스(전체재생 또는 순차재생)에서 먼저 선택해주세요.');
      return;
    }

    const nextState = !isMainPlaying;
    setIsMainPlaying(nextState);

    if (nextState) {
      if (playMode === 'all') {
        Object.values(wavesurferRefs.current).forEach((ws) => {
          if (ws) ws.play();
        });
      } else if (playMode === 'sequential') {
        const sortedTracks = [...tracks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const targetId = activeSequentialTrackId || sortedTracks[0]?.id;
        if (targetId) {
          setActiveSequentialTrackId(targetId);
          const ws = wavesurferRefs.current[targetId];
          if (ws) ws.play();
        }
      }
    } else {
      Object.values(wavesurferRefs.current).forEach((ws) => {
        if (ws) ws.pause();
      });
    }
  };

  const handleToggleTrackPlay = (trackId) => {
    const ws = wavesurferRefs.current[trackId];
    if (!ws) return;

    if (ws.isPlaying()) {
      ws.pause();
    } else {
      ws.play();
    }
  };

  const handleMoveTrackOrder = async (index, direction) => {
    const sortedTracks = [...tracks].sort((a, b) => (a.order || 0) - (b.order || 0));
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= sortedTracks.length) return;

    const temp = sortedTracks[index];
    sortedTracks[index] = sortedTracks[targetIndex];
    sortedTracks[targetIndex] = temp;

    const updatedTracks = sortedTracks.map((t, idx) => ({
      ...t,
      order: idx + 1
    }));

    setTracks(updatedTracks);

    try {
      for (const t of updatedTracks) {
        await supabase
          .from('tracks')
          .update({ order: t.order })
          .eq('id', t.id);
      }
    } catch (err) {
      console.error('트랙 순서 변경 DB 저장 실패:', err);
      alert('순서 변경 저장 중 오류가 발생했습니다.');
    }
  };

  const handleToggleMute = (trackId) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const newMuted = !t.muted;
          const ws = wavesurferRefs.current[trackId];
          if (ws) ws.setMuted(newMuted);
          return { ...t, muted: newMuted };
        }
        return t;
      })
    );
  };

  const handleMultipleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !currentPortfolioId) {
      alert('포트폴리오를 먼저 열어주세요!');
      return;
    }

    try {
      const newTracksPayload = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `${currentPortfolioId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('audio_files')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`파일 업로드 실패 (${file.name}): ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('audio_files')
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        newTracksPayload.push({
          portfolio_id: currentPortfolioId,
          track_name: file.name,
          file_url: publicUrl,
          uploader_type: 'mine',
          order: tracks.length + i + 1,
          del_yn: 'N'
        });
      }

      const { data, error } = await supabase.from('tracks').insert(newTracksPayload).select();

      if (error) {
        alert('음원 정보 저장 중 오류가 발생했습니다: ' + error.message);
      } else {
        setTracks((prev) => [...prev, ...data]);
        if (!selectedTrack && data.length > 0) setSelectedTrack(data[0].id);
        alert(`${files.length}개의 음원이 스토리지에 성공적으로 업로드되었습니다!`);
      }
    } catch (err) {
      console.error('업로드 프로세스 오류:', err);
      alert(err.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentPortfolioId) {
      alert('포트폴리오를 열고 의견을 남겨주세요.');
      return;
    }

    const newComment = {
      portfolio_id: currentPortfolioId,
      user_id: user.id,
      author: authorName,
      track_id: selectedTrack,
      start_time: Number(Number(startTime).toFixed(2)),
      end_time: Number(Number(endTime).toFixed(2)),
      content: newCommentText,
      view_yn: 'Y',
      del_yn: 'N',
      parent_id: null,
      reactions: {}
    };

    const { error } = await supabase.from('feedbacks').insert([newComment]);

    if (error) {
      alert('피드백 저장 중 오류 발생: ' + error.message);
    } else {
      setNewCommentText('');
      await fetchFeedbacksAndReplies(currentPortfolioId);
      fetchMyPortfolios(user);
    }
  };

  const handleAddReply = async (parentFeedbackId) => {
    if (!replyText.trim() || !currentPortfolioId) return;

    const parentComment = comments.find(c => c.id === parentFeedbackId);

    const newReply = {
      portfolio_id: currentPortfolioId,
      user_id: user.id,
      author: authorName,
      track_id: parentComment ? parentComment.track_id : selectedTrack,
      start_time: parentComment ? parentComment.start_time : 0,
      end_time: parentComment ? parentComment.end_time : 0,
      content: replyText,
      view_yn: 'Y',
      del_yn: 'N',
      parent_id: parentFeedbackId,
      reactions: {}
    };

    const { error } = await supabase.from('feedbacks').insert([newReply]);

    if (error) {
      alert('답글 등록 실패: ' + error.message);
    } else {
      setReplyText('');
      setReplyingCommentId(null);
      await fetchFeedbacksAndReplies(currentPortfolioId);
    }
  };

  const handleDeleteComment = async (comment) => {
    const isAuthor = comment.user_id === user.id;

    if (!isAuthor) {
      alert('⚠️ 본인의 피드백만 삭제할 수 있습니다.');
      return;
    }

    if (!window.confirm('정말 이 피드백을 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('feedbacks')
      .update({ del_yn: 'Y' })
      .eq('id', comment.id);

    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      await fetchFeedbacksAndReplies(currentPortfolioId);
      fetchMyPortfolios(user);
    }
  };

  const handleReaction = async (comment, reactionType) => {
    let currentReactions = comment.reactions || {};
    if (typeof currentReactions === 'string') {
      try { currentReactions = JSON.parse(currentReactions); } catch(e) { currentReactions = {}; }
    }

    let usersList = currentReactions[reactionType] || [];
    if (!Array.isArray(usersList)) usersList = [];

    if (usersList.includes(user.email)) {
      usersList = usersList.filter(email => email !== user.email);
    } else {
      usersList.push(user.email);
    }

    const updatedReactions = {
      ...currentReactions,
      [reactionType]: usersList
    };

    const { error } = await supabase
      .from('feedbacks')
      .update({ reactions: updatedReactions })
      .eq('id', comment.id);

    if (!error) {
      await fetchFeedbacksAndReplies(currentPortfolioId);
    } else {
      alert('반응 저장 실패: ' + error.message);
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

  const sortedTracks = [...tracks].sort((a, b) => (a.order || 0) - (b.order || 0));
  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'sans-serif' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e293b' }}>🎵 멀티트랙 포트폴리오 로그인</h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="email" placeholder="이메일 입력" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
          <input type="password" placeholder="비밀번호 입력" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
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

  const isOwner = user?.email && portfolioOwnerEmail && 
    user.email.trim().toLowerCase() === portfolioOwnerEmail.trim().toLowerCase();

  return (
    <div style={{ maxWidth: '1050px', margin: '30px auto', padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'sans-serif' }}>
      
      {/* 상단 네비게이션바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4f46e5' }}>👤 {user.email}</span> 님 접속중
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => { setActiveTab('portfolio'); fetchMyPortfolios(user); }} style={{ padding: '6px 10px', background: activeTab === 'portfolio' ? '#4f46e5' : '#e2e8f0', color: activeTab === 'portfolio' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            📁 포트폴리오 목록
          </button>
          <button onClick={() => {
            if (!currentPortfolioId) {
              alert('열려있는 포트폴리오가 없습니다.');
              return;
            }
            setActiveTab('studio');
          }} style={{ padding: '6px 10px', background: activeTab === 'studio' ? '#4f46e5' : '#e2e8f0', color: activeTab === 'studio' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            🎛️ 스튜디오
          </button>

          <button onClick={handleLogout} style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 포트폴리오 목록 탭 */}
      {activeTab === 'portfolio' ? (
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>📁 포트폴리오 목록</h2>
            <button onClick={handleCreatePortfolio} style={{ padding: '8px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              ➕ 새 포트폴리오 만들기
            </button>
          </div>

          {myPortfolios.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', background: '#f8fafc', borderRadius: '10px' }}>
              생성된 포트폴리오가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myPortfolios.map((p) => (
                <div key={p.id} style={{ padding: '18px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '17px' }}>{p.portfolio_name}</span>
                      <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                        💬 피드백 {p.feedback_count || 0}개
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>👑 소유자:</span>
                      <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>{p.user_email}</span>
                      <span style={{ color: '#cbd5e1' }}>|</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>생성일: {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>👥 초대된 멤버:</span>
                      {p.invited_members && p.invited_members.length > 0 ? (
                        p.invited_members.map((mEmail, idx) => (
                          <span key={idx} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', color: '#334155' }}>
                            {mEmail}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>초대된 멤버 없음</span>
                      )}
                    </div>
                  </div>

                  <button onClick={() => handleLoadPortfolio(p)} style={{ padding: '10px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    📂 포트폴리오 열기 (스튜디오 진입)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 스튜디오 탭 (멀티트랙 재생 및 피드백) */
        <div style={{ padding: '10px 0' }}>
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                  🎵 현재 포트폴리오: <span style={{ color: '#4f46e5' }}>{portfolioName} ({portfolioOwnerEmail})</span>
                </h2>
                
                {isOwner && (
                  <button onClick={handleDeleteCurrentPortfolio} style={{ padding: '5px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
                    포트폴리오 삭제
                  </button>
                )}
              </div>

              <label style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'inline-block' }}>
                📁 음원 추가하기 (Supabase Storage)
                <input type="file" multiple accept="audio/*" onChange={handleMultipleUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', marginRight: '8px' }}>👥 팀원 접속현황:</span>
                
                <span style={{ fontSize: '12px', background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', marginRight: '6px', fontWeight: 'bold', border: '1px solid #3b82f6' }}>
                  🟢 {user.email} ({isOwner ? '소유자' : 'editor'})
                </span>

                {portfolioMembers.map((m) => {
                  if (m.member_email === user.email) return null;
                  return (
                    <span key={m.id} style={{ fontSize: '12px', background: '#f1f5f9', color: '#94a3b8', padding: '3px 8px', borderRadius: '6px', marginRight: '6px', border: '1px solid #cbd5e1' }} title="미접속">
                      ⚪ {m.member_email} ({m.role || 'editor'})
                    </span>
                  );
                })}
              </div>

              <form onSubmit={handleInviteMember} style={{ display: 'flex', gap: '6px' }}>
                <input type="email" placeholder="초대할 팀원 이메일" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} required />
                <button type="submit" style={{ padding: '6px 10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                  사용자 초대
                </button>
              </form>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 18px', background: '#f1f5f9', borderRadius: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>
                <input type="checkbox" checked={playMode === 'all'} onChange={() => handlePlayModeChange('all')} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                전체재생
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>
                <input type="checkbox" checked={playMode === 'sequential'} onChange={() => handlePlayModeChange('sequential')} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                순차재생
              </label>

              <button onClick={handleMainPlayPauseToggle} style={{ padding: '8px 16px', background: isMainPlaying ? '#ef4444' : '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                {isMainPlaying ? '메인 정지 (II)' : '메인 재생 (>)'}
              </button>
            </div>

            <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* 음원 트랙 리스트 및 웨이브서퍼 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' }}>
            {sortedTracks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', background: '#fafafa', borderRadius: '8px' }}>
                등록된 음원이 없습니다.
              </div>
            ) : (
              sortedTracks.map((track, index) => {
                const isCurrentSeq = activeSequentialTrackId === track.id;
                const isTrackPlaying = !!trackPlayingStates[track.id];

                return (
                  <div key={track.id} style={{ padding: '14px', background: isCurrentSeq ? '#ecfdf5' : '#fafafa', borderRadius: '12px', border: `1px solid ${isCurrentSeq ? '#10b981' : '#e5e7eb'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px' }}>음원 {index + 1}</span>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#222' }}>{track.track_name}</span>
                        {isCurrentSeq && <span style={{ fontSize: '11px', background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>🔊 재생 중</span>}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button onClick={() => handleToggleTrackPlay(track.id)} style={{ padding: '4px 12px', background: isTrackPlaying ? '#ef4444' : '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                          {isTrackPlaying ? '정지 (II)' : '재생 (>)'}
                        </button>

                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button onClick={() => handleMoveTrackOrder(index, 'up')} disabled={index === 0} style={{ padding: '3px 7px', background: index === 0 ? '#cbd5e1' : '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: index === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }} title="위로 이동">
                            ▲ 위로
                          </button>
                          <button onClick={() => handleMoveTrackOrder(index, 'down')} disabled={index === sortedTracks.length - 1} style={{ padding: '3px 7px', background: index === sortedTracks.length - 1 ? '#cbd5e1' : '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: index === sortedTracks.length - 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }} title="아래로 이동">
                            ▼ 아래로
                          </button>
                        </div>

                        <button onClick={() => handleToggleMute(track.id)} style={{ padding: '4px 10px', background: track.muted ? '#ef4444' : '#e5e7eb', color: track.muted ? '#fff' : '#374151', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                          {track.muted ? '🔇 음소거 해제' : '🔊 음소거'}
                        </button>

                        <button onClick={() => handleDeleteTrack(track.id, track.track_name)} style={{ padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                          삭제
                        </button>
                      </div>
                    </div>
                    <div ref={(el) => (containerRefs.current[track.id] = el)} style={{ width: '100%', background: '#fff', borderRadius: '6px', overflow: 'hidden' }} />
                  </div>
                );
              })
            )}
          </div>

          {/* 피드백 작성 및 목록 영역 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>💬 피드백 남기기</h3>
              <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>작성자</label>
                    <input type="text" value={authorName} readOnly style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', background: '#e2e8f0', color: '#475569', boxSizing: 'border-box', cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>대상 음원</label>
                    <select value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', background: '#fff', boxSizing: 'border-box', height: '33px' }}>
                      {tracks.map((t) => (<option key={t.id} value={t.id}>{t.track_name}</option>))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>시작점 (초)</label>
                    <input type="number" step="0.1" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>종료점 (초)</label>
                    <input type="number" step="0.1" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }} required />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>의견 내용</label>
                  <textarea value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} placeholder="의견을 적어주세요..." style={{ width: '100%', height: '64px', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', resize: 'none', boxSizing: 'border-box' }} required />
                </div>

                <button type="submit" style={{ padding: '8px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  피드백 등록 🚀
                </button>
              </form>
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '420px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
                📋 피드백 목록 ({comments.length})
              </h3>
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {rootComments.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '60px' }}>
                    등록된 피드백이 없습니다.
                  </div>
                ) : (
                  rootComments.map((c) => {
                    const replies = getReplies(c.id);
                    let reactions = c.reactions || {};
                    if (typeof reactions === 'string') {
                      try { reactions = JSON.parse(reactions); } catch(e) { reactions = {}; }
                    }

                    const isAuthor = c.user_id === user.id;

                    return (
                      <div key={c.id} style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        
                        <div onClick={() => handleSeek(Number(c.start_time || 0))} style={{ cursor: 'pointer' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#4f46e5' }}>{c.author}</span>
                              <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                🎵 {c.tracks?.track_name || '음원'}
                              </span>
                            </div>
                            <span style={{ fontSize: '10px', fontFamily: 'monospace', background: '#e0e7ff', color: '#3730a3', padding: '1px 4px', borderRadius: '4px' }}>
                              {formatTime(Number(c.start_time || 0))} ~ {formatTime(Number(c.end_time || c.start_time || 0))}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>{c.content}</p>
                        </div>

                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #f1f5f9' }}>
                          {['Good', 'Bad', 'Not Bad', '👍', '🔥', '❤️', '👏'].map((type) => {
                            const count = Array.isArray(reactions[type]) ? reactions[type].length : 0;
                            const isMyReaction = Array.isArray(reactions[type]) && reactions[type].includes(user.email);
                            return (
                              <button key={type} onClick={() => handleReaction(c, type)} style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', background: isMyReaction ? '#e0e7ff' : '#f8fafc', color: isMyReaction ? '#3730a3' : '#475569', cursor: 'pointer', fontWeight: isMyReaction ? 'bold' : 'normal' }}>
                                {type} {count > 0 ? count : ''}
                              </button>
                            );
                          })}

                          {isAuthor && (
                            <button onClick={() => handleDeleteComment(c)} style={{ fontSize: '11px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>
                              삭제
                            </button>
                          )}

                          <button onClick={() => setReplyingCommentId(replyingCommentId === c.id ? null : c.id)} style={{ marginLeft: 'auto', fontSize: '11px', background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold' }}>
                            💬 답글달기
                          </button>
                        </div>

                        {replyingCommentId === c.id && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px', paddingLeft: '12px' }}>
                            <input type="text" placeholder="답글을 입력하세요..." value={replyText} onChange={(e) => setReplyText(e.target.value)} style={{ flex: 1, padding: '4px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            <button onClick={() => handleAddReply(c.id)} style={{ padding: '4px 8px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                              등록
                            </button>
                          </div>
                        )}

                        {replies.length > 0 && ( 
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', paddingLeft: '16px', borderLeft: '2px solid #e2e8f0' }}>
                            {replies.map((r) => {
                              const isReplyAuthor = r.user_id === user.id;

                              return (
                                <div key={r.id} style={{ padding: '6px 8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#4f46e5' }}>↳ {r.author}</span>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>{new Date(r.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      {isReplyAuthor && (
                                        <button onClick={() => handleDeleteComment(r)} style={{ fontSize: '9px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}>
                                          삭제 
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p style={{ fontSize: '11px', color: '#334155', margin: 0 }}>{r.content}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                      </div> 
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div> 
  );
}