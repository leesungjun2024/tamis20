import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from './supabaseClient'; 

export default function App() {
  // 1. 인증 및 세션 상태
  const [user, setUser] = useState(null);   
  const [authStep, setAuthStep] = useState(1); 
  const [loginMethod, setLoginMethod] = useState('social'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // 온보딩 프로필 상태 
  const [position, setPosition] = useState('프로듀서');
  const [genre, setGenre] = useState('힙합');

  // 2. 탭 및 네비게이션 상태 ('explore' | 'messages' | 'workspace' | 'portfolio' | 'public_detail' | 'settings')
  const [activeTab, setActiveTab] = useState('explore'); 
  const [selectedChatRoom, setSelectedChatRoom] = useState(null); 
  const [selectedPublicPortfolio, setSelectedPublicPortfolio] = useState(null); 

  // 요금제 설정 관련 상태 (이미지 14.jpg - S01, S02)
  const [selectedPlan, setSelectedPlan] = useState('Pro');

  // 팔로우 상태 (V01)
  const [isFollowing, setIsFollowing] = useState(false);

  // 공유 메뉴 모달 상태 (P11)
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isStoryCardModalOpen, setIsStoryCardModalOpen] = useState(false);

  // 비회원 메일 보내기 모달 상태 (M06)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [targetEmail, setTargetEmail] = useState('contact@external-artist.com');
  const [attachedPortfolioName, setAttachedPortfolioName] = useState('나의 새 포트폴리오 (v2)');
  const [mailContent, setMailContent] = useState('');

  // 메시지 및 대화 관련 토글 상태 (M03, M04)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [fileFilter, setFileFilter] = useState('all');

  const [myPortfolios, setMyPortfolios] = useState([]);
  const [currentPortfolioId, setCurrentPortfolioId] = useState(null);
  const [portfolioName, setPortfolioName] = useState('작업방 스튜디오');
  const [portfolioOwnerEmail, setPortfolioOwnerEmail] = useState(''); 

  // 탐색 피드 검색 및 필터 상태 (E01, E03, E04)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState('전체 장르');
  const [selectedPositionFilter, setSelectedPositionFilter] = useState('전체 포지션');
  const [sortBy, setSortBy] = useState('최신순');
  const [explorePortfolios, setExplorePortfolios] = useState([]);

  // 대화 메시지 상태 (M01, M02)
  const [conversations, setConversations] = useState([
    { id: 1, name: '프로듀서 J', lastMessage: '작업방 보컬 믹스 피드백 확인했습니다!', time: '10분 전', unread: 2 },
    { id: 2, name: '탑라이너 M', lastMessage: 'v2 스템 파일 공유드렸습니다.', time: '3시간 전', unread: 0 },
  ]);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: '프로듀서 J', text: '안녕하세요! 이번 곡 스템 파일 공유드립니다.', time: '14:20' }
  ]);
  const [chatInputText, setChatInputText] = useState('');

  // 알림 목록 상태 (C05)
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'comment', title: '새 코멘트', desc: '작업방에 새 타임스탬프 코멘트가 달렸습니다.', time: '방금 전', read: false },
  ]);

  // 3. 작업방 상세 전용 상태 (W03 ~ W08)
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // W05: 타임스탬프 코멘트 작성 모드
  const [isTimestampMode, setIsTimestampMode] = useState(false);
  const [timestampTime, setTimestampTime] = useState(0);
  const [timestampInput, setTimestampInput] = useState('');

  // W06: 코멘트 목록 및 재생시점 동기화
  const [comments, setComments] = useState([]);
  const [activeSyncComment, setActiveSyncComment] = useState(null);
  const [isAllCommentsOpen, setIsAllCommentsOpen] = useState(false);

  // W04: 비교 듣기 모드
  const [isComparing, setIsComparing] = useState(false);

  // W07: 참여자 크레딧 목록
  const [contributors, setContributors] = useState([
    { id: 1, name: '사용자(나)', role: '프로듀서' },
    { id: 2, name: '프로듀서 J', role: '보컬' }
  ]);
  const [newContributorName, setNewContributorName] = useState('');
  const [newContributorRole, setNewContributorRole] = useState('탑라이너');

  // 곡 펼치기 상태 (공개 페이지 V02)
  const [isTrackListExpanded, setIsTrackListExpanded] = useState(false);

  const wavesurferRef = useRef(null);
  const waveformContainerRef = useRef(null);
  const publicWaveformRef = useRef(null);
  const publicWsInstance = useRef(null);

  // 인증 감지 및 초기 데이터 로드
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        fetchMyPortfolios(currentUser);
        fetchAllPublicPortfolios();
      } else {
        setUser(null);
        setAuthStep(1);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  const handleSocialLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) alert(`${provider} 로그인 오류: ` + error.message);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { position, genre } } });
      if (error) alert(error.message);
      else setAuthStep(2);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (user) {
      await supabase.auth.updateUser({ data: { position, genre } });
    }
    setAuthStep(1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTab('explore');
    setSelectedPublicPortfolio(null);
    setSelectedChatRoom(null);
  };

  const fetchAllPublicPortfolios = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('view_yn', 'Y')
        .eq('del_yn', 'N');

      if (error) throw error;
      setExplorePortfolios(data || []);
    } catch (err) {
      console.error('탐색 피드 조회 오류:', err);
    }
  };

  const fetchMyPortfolios = async (userObj) => {
    if (!userObj) return;
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userObj.id)
        .eq('del_yn', 'N');

      if (error) throw error;
      setMyPortfolios(data || []);
      if (data && data.length > 0 && !currentPortfolioId) {
        handleLoadPortfolio(data[0]);
      }
    } catch (err) {
      console.error('포트폴리오 조회 오류:', err);
    }
  };

  const handleLoadPortfolio = async (portfolio) => {
    setCurrentPortfolioId(portfolio.id);
    setPortfolioName(portfolio.portfolio_name);
    setPortfolioOwnerEmail(portfolio.user_email || user?.email || '');
    setActiveTab('workspace');

    const { data: trackData } = await supabase
      .from('tracks')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .eq('del_yn', 'N')
      .order('order', { ascending: true });

    if (trackData && trackData.length > 0) {
      setTracks(trackData);
      setSelectedTrackId(trackData[0].id);
    } else {
      setTracks([]);
      setSelectedTrackId(null);
    }

    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .eq('del_yn', 'N');

    if (feedbackError) {
      console.error('코멘트 조회 오류:', feedbackError);
      setComments([]);
    } else {
      setComments(feedbackData || []);
    }
  };

  const handleOpenPublicDetail = (portfolio) => {
    setSelectedPublicPortfolio(portfolio);
    setActiveTab('public_detail');
  };

  const handleInquiry = (ownerEmail) => {
    if (user) {
      const existingRoom = conversations.find(c => c.name.includes(ownerEmail.split('@')[0]));
      if (existingRoom) {
        setSelectedChatRoom(existingRoom);
      } else {
        const newRoom = { id: Date.now(), name: ownerEmail.split('@')[0], lastMessage: '문의를 시작합니다.', time: '방금 전', unread: 0 };
        setConversations([newRoom, ...conversations]);
        setSelectedChatRoom(newRoom);
      }
      setActiveTab('messages');
    } else {
      setTargetEmail(ownerEmail || 'artist@tami.com');
      setIsEmailModalOpen(true);
    }
  };

  // 작업방 WaveSurfer 인스턴스 (W03) - 업로드된 파일의 유효한 URL 로드 보완
  useEffect(() => {
    if (activeTab !== 'workspace' || !selectedTrackId || !waveformContainerRef.current) return;

    const currentTrack = tracks.find(t => t.id === selectedTrackId);
    if (!currentTrack || !currentTrack.file_url) return;

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    const ws = WaveSurfer.create({
      container: waveformContainerRef.current,
      url: currentTrack.file_url,
      waveColor: isTimestampMode ? '#94a3b8' : '#cbd5e1',
      progressColor: isTimestampMode ? '#64748b' : '#4f46e5',
      cursorColor: '#1e293b',
      height: 50,
      barWidth: 2,
      barGap: 1
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => setDuration(ws.getDuration()));
    ws.on('audioprocess', () => {
      const time = ws.getCurrentTime();
      setCurrentTime(time);
      const found = comments.find(c => Math.abs((c.start_time || 0) - time) < 1.5);
      setActiveSyncComment(found || null);
    });
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    return () => ws.destroy();
  }, [selectedTrackId, activeTab, isTimestampMode, tracks]);

  // 공개 상세 페이지 WaveSurfer 인스턴스 (E06)
  useEffect(() => {
    if (activeTab !== 'public_detail' || !publicWaveformRef.current) return;

    if (publicWsInstance.current) {
      publicWsInstance.current.destroy();
    }

    const ws = WaveSurfer.create({
      container: publicWaveformRef.current,
      waveColor: '#a5b4fc',
      progressColor: '#4f46e5',
      cursorColor: '#312e81',
      height: 55,
      barWidth: 2,
      barGap: 1
    });

    publicWsInstance.current = ws;
    ws.load('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');

    return () => ws.destroy();
  }, [activeTab]);

  const handleTogglePlay = () => {
    if (wavesurferRef.current) wavesurferRef.current.playPause();
  };

  const handleTogglePublicPlay = () => {
    if (publicWsInstance.current) publicWsInstance.current.playPause();
  };

  const handlePlayRecommendedSection = () => {
    if (publicWsInstance.current) {
      publicWsInstance.current.setTime(35);
      publicWsInstance.current.play();
    }
  };

  const handleStartTimestamp = () => {
    if (wavesurferRef.current) {
      const time = wavesurferRef.current.getCurrentTime();
      setTimestampTime(time);
      setIsTimestampMode(true);
      wavesurferRef.current.pause();
    }
  };

  const handleSaveTimestampComment = async (e) => {
    e.preventDefault();
    if (!timestampInput.trim() || !currentPortfolioId || !user) return;

    const newComment = {
      portfolio_id: currentPortfolioId,
      user_id: user.id,
      author: user.email ? user.email.split('@')[0] : '익명',
      track_id: selectedTrackId,
      start_time: Number(timestampTime.toFixed(2)),
      content: timestampInput,
      resolved: false,
      del_yn: 'N'
    };

    const { data, error } = await supabase.from('feedbacks').insert([newComment]).select().single();
    
    if (error) {
      console.error('타임스탬프 코멘트 저장 오류:', error.message);
      alert('코멘트 저장 중 오류가 발생했습니다: ' + error.message);
    } else if (data) {
      setComments((prevComments) => [...prevComments, data]);
      setTimestampInput('');
      setIsTimestampMode(false);
    }
  };

  const handleToggleResolve = async (commentId) => {
    const targetComment = comments.find(c => c.id === commentId);
    if (!targetComment) return;

    const newResolvedState = !targetComment.resolved;
    const updated = comments.map(c => c.id === commentId ? { ...c, resolved: newResolvedState } : c);
    setComments(updated);

    const { error } = await supabase
      .from('feedbacks')
      .update({ resolved: newResolvedState })
      .eq('id', commentId);

    if (error) {
      console.error('해결 상태 업데이트 오류:', error.message);
    }
  };

  const handleSeekToComment = (time) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setTime(time);
      wavesurferRef.current.play();
    }
  };

  // [기능 3.5] 새 버전 음원 업로드 및 재생 가능하도록 URL 보완
  const handleUploadNewVersion = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !currentPortfolioId) return;

    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_'); // 특수문자 정제
    const fileName = `${Date.now()}_${cleanFileName}`;
    const filePath = `${currentPortfolioId}/${fileName}`;

    // Supabase Storage 업로드 실행 ('audio_files' 버킷)
    const { error: uploadError } = await supabase.storage.from('audio_files').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

    if (uploadError) {
      console.error('스토리지 업로드 오류:', uploadError.message);
      alert('음원 파일 업로드 실패: ' + uploadError.message);
      return;
    }

    // 퍼블릭 URL 획득
    const { data: publicUrlData } = supabase.storage.from('audio_files').getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      alert('업로드된 음원의 퍼블릭 URL을 가져오지 못했습니다.');
      return;
    }

    const versionNum = tracks.length + 1;
    const newTrack = {
      portfolio_id: currentPortfolioId,
      track_name: `v${versionNum} - ${file.name}`,
      file_url: publicUrl,
      order: versionNum,
      del_yn: 'N'
    };

    const { data, error: dbError } = await supabase.from('tracks').insert([newTrack]).select().single();
    
    if (dbError) {
      console.error('트랙 DB 저장 오류:', dbError.message);
      alert('트랙 정보 저장 실패: ' + dbError.message);
    } else if (data) {
      setTracks((prevTracks) => [...prevTracks, data]);
      setSelectedTrackId(data.id); // 업로드 직후 해당 트랙을 바로 선택하여 재생 가능 상태로 세팅[cite: 5]
      alert(`v${versionNum} 버전이 업로드되어 재생 준비되었습니다!`);
    }
  };

  const handleCompleteWorkspace = () => {
    alert(`🎉 작업방이 최종 완료되었습니다!\n참여자 각자의 포트폴리오에 자동 등록되었습니다.`);
    setActiveTab('portfolio');
  };

  const handleSendExternalMail = (e) => {
    e.preventDefault();
    alert(`[메일 전송 완료]\n받는 사람: ${targetEmail}\n첨부: ${attachedPortfolioName}\n내용: ${mailContent || '문의 사항 전송'}`);
    setIsEmailModalOpen(false);
    setMailContent('');
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: '나',
      text: chatInputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages([...chatMessages, newMsg]);
    setChatInputText('');
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!user || authStep === 2) {
    return (
      <div style={{ width: '100%', maxWidth: '440px', margin: '20px auto', padding: '16px', fontFamily: 'sans-serif' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>가입 공통</h2>
        <div style={{ border: '2px solid #5d5b54', borderRadius: '24px', padding: '18px 14px', background: '#f7f6f2' }}>
          {loginMethod === 'social' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => handleSocialLogin('google')} style={{ padding: '10px', background: '#fff', border: '1px solid #bdb9ad', borderRadius: '8px', cursor: 'pointer' }}>구글로 계속</button>
              <button onClick={() => setLoginMethod('email')} style={{ padding: '10px', background: '#fff', border: '1px solid #bdb9ad', borderRadius: '8px', cursor: 'pointer' }}>이메일로 가입</button>
            </div>
          ) : (
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="email" placeholder="이메일 입력" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '8px', border: '1px solid #bdb9ad', borderRadius: '6px' }} required />
              <input type="password" placeholder="비밀번호 입력" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '8px', border: '1px solid #bdb9ad', borderRadius: '6px' }} required />
              <button type="submit" style={{ padding: '9px', background: '#1f1e1b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>로그인/가입</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', padding: '14px', boxSizing: 'border-box', fontFamily: 'sans-serif', minHeight: '100vh', paddingBottom: '90px', background: '#fff', position: 'relative' }}>
      
      {/* 상단 프로필 및 설정 진입 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
        <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 'bold' }}>👤 {user.email}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setActiveTab('settings')} style={{ padding: '3px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>⚙️ 계정·요금제</button>
          <button onClick={() => setIsEmailModalOpen(true)} style={{ padding: '3px 8px', background: '#0f6e56', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>✉️ 메일문의</button>
          <button onClick={handleLogout} style={{ padding: '3px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>로그아웃</button>
        </div>
      </div>

      {/* ⚙️ 계정·요금제 설정 화면 */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>계정·요금제 설정</h2>
            <button onClick={() => setActiveTab('portfolio')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold' }}>✕ 닫기</button>
          </div>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
              계정 설정 (S01)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', fontSize: '12px', cursor: 'pointer' }} onClick={() => alert(`현재 이메일: ${user.email}`)}>
                <span>이메일</span>
                <span style={{ color: '#64748b' }}>{user.email} ›</span>
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', fontSize: '12px', cursor: 'pointer' }} onClick={() => alert('비밀번호 변경 창')}>
                <span>비밀번호</span>
                <span style={{ color: '#64748b' }}>변경 ›</span>
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', cursor: 'pointer', color: '#ef4444' }} onClick={handleLogout}>
                <span>로그아웃</span>
                <span>›</span>
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
              요금제 설정 (S02 - 무료, Pro, Crew 비교)
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              무료, Pro, Crew 세 가지 요금제를 나란히 비교하고 원하는 플랜으로 업그레이드하세요.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div onClick={() => setSelectedPlan('무료')} style={{ padding: '10px', background: selectedPlan === '무료' ? '#e0e7ff' : '#fff', border: `2px solid ${selectedPlan === '무료' ? '#4f46e5' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>무료</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>기본 기능 제공</div>
              </div>
              <div onClick={() => setSelectedPlan('Pro')} style={{ padding: '10px', background: selectedPlan === 'Pro' ? '#e0e7ff' : '#fff', border: `2px solid ${selectedPlan === 'Pro' ? '#4f46e5' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>Pro</div>
                <div style={{ fontSize: '10px', color: '#4f46e5' }}>추천 플랜</div>
              </div>
              <div onClick={() => setSelectedPlan('Crew')} style={{ padding: '10px', background: selectedPlan === 'Crew' ? '#e0e7ff' : '#fff', border: `2px solid ${selectedPlan === 'Crew' ? '#4f46e5' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>Crew</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>팀 협업용</div>
              </div>
            </div>

            <button onClick={() => alert(`성공적으로 [${selectedPlan}] 요금제로 업그레이드 되었습니다!`)} style={{ width: '100%', padding: '12px', background: '#1f1e1b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>
              {selectedPlan} 요금제로 업그레이드
            </button>
          </div>
        </div>
      )}

      {/* 📧 비회원 메일 보내기 모달 */}
      {isEmailModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: '#f7f6f2', border: '2px solid #5d5b54', borderRadius: '20px', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f1e1b', margin: 0 }}>메일 보내기 (M06)</h3>
              <button onClick={() => setIsEmailModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #bdb9ad', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f1e1b', marginBottom: '4px' }}>가입 안내 푸시</div>
              <div style={{ fontSize: '11px', color: '#5a5852', marginBottom: '8px' }}>더 편리한 DM과 작업 공간을 쓰려면 TAMI에 가입하세요</div>
              <button onClick={() => alert('가입 페이지로 이동')} style={{ width: '100%', padding: '8px', background: '#1f1e1b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>가입하기</button>
            </div>
            <form onSubmit={handleSendExternalMail} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="email" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #bdb9ad', borderRadius: '6px', fontSize: '11px' }} required />
              <input type="text" value={attachedPortfolioName} onChange={(e) => setAttachedPortfolioName(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #bdb9ad', borderRadius: '6px', fontSize: '11px' }} required />
              <textarea placeholder="메시지 내용..." value={mailContent} onChange={(e) => setMailContent(e.target.value)} style={{ width: '100%', height: '50px', padding: '8px', border: '1px solid #bdb9ad', borderRadius: '6px', fontSize: '11px', resize: 'none' }} />
              <button type="submit" style={{ padding: '10px', background: '#1f1e1b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>보내기</button>
            </form>
          </div>
        </div>
      )}

      {/* 🔗 공유 메뉴 모달 */}
      {isShareMenuOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '380px', background: '#f7f6f2', border: '2px solid #5d5b54', borderRadius: '20px', padding: '18px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f1e1b', margin: 0 }}>공유 내 포트폴리오 (P11)</h3>
              <button onClick={() => setIsShareMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('링크가 복사되었습니다!'); }} style={{ padding: '10px', background: '#fff', border: '1px solid #bdb9ad', borderRadius: '8px', fontSize: '12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span>링크 복사</span><span>›</span>
              </button>
              <button onClick={() => setIsStoryCardModalOpen(true)} style={{ padding: '10px', background: '#fff', border: '1px solid #bdb9ad', borderRadius: '8px', fontSize: '12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span>인스타 스토리 카드</span><span>›</span>
              </button>
              <button onClick={() => alert('SNS 공유')} style={{ padding: '10px', background: '#fff', border: '1px solid #bdb9ad', borderRadius: '8px', fontSize: '12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span>SNS로 공유</span><span>›</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 포트폴리오 상세 공개 페이지 */}
      {activeTab === 'public_detail' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button onClick={() => setActiveTab('explore')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#64748b', cursor: 'pointer', alignSelf: 'flex-start', fontWeight: 'bold' }}>
            ← 피드 탐색으로 돌아가기
          </button>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '14px', padding: '14px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#cbd5e1' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>{selectedPublicPortfolio?.portfolio_name || '대표 포트폴리오'}</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedPublicPortfolio?.user_email || '아티스트 프로필'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setIsFollowing(!isFollowing)} style={{ flex: 1, padding: '7px', background: isFollowing ? '#e2e8f0' : '#4f46e5', color: isFollowing ? '#1e293b' : '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isFollowing ? '팔로잉 ✓' : '팔로우'}
              </button>
              <button onClick={() => handleInquiry(selectedPublicPortfolio?.user_email)} style={{ flex: 1, padding: '7px', background: '#0f6e56', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                문의하기
              </button>
              <button onClick={() => setIsShareMenuOpen(true)} style={{ flex: 1, padding: '7px', background: '#fff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                링크 공유
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '14px', padding: '14px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5' }}>🎵 대표작 하이라이트</div>
            <div ref={publicWaveformRef} style={{ width: '100%', background: '#fafafa', borderRadius: '8px' }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleTogglePublicPlay} style={{ flex: 1, padding: '8px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>재생 / 일시정지</button>
              <button onClick={handlePlayRecommendedSection} style={{ flex: 1, padding: '8px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>🔥 추천 구간 듣기</button>
            </div>
          </div>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '14px', padding: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>🎶 전체 곡 목록</span>
              <button onClick={() => setIsTrackListExpanded(!isTrackListExpanded)} style={{ fontSize: '11px', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                {isTrackListExpanded ? '접기 ∧' : '곡 펼치기 ∨'}
              </button>
            </div>
            <div style={{ padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span>1. 메인 타이틀 트랙 (v2)</span>
              <button onClick={handlePlayRecommendedSection} style={{ padding: '3px 6px', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>추천 구간 듣기</button>
            </div>
          </div>
        </div>
      )}

      {/* 탐색 피드 탭 */}
      {activeTab === 'explore' && (
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '12px' }}>🔍 피드 탐색</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {explorePortfolios.map((p) => (
              <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', background: '#f8fafc' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{p.portfolio_name}</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => handleOpenPublicDetail(p)} style={{ flex: 1, padding: '5px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>공개 페이지</button>
                  <button onClick={() => handleLoadPortfolio(p)} style={{ flex: 1, padding: '5px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>작업방</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메시지 탭 */}
      {activeTab === 'messages' && !selectedChatRoom && (
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '12px' }}>💬 대화 목록 메시지</h2>
          {conversations.map((conv) => (
            <div key={conv.id} onClick={() => setSelectedChatRoom(conv)} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '8px', cursor: 'pointer' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{conv.name}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{conv.lastMessage}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'messages' && selectedChatRoom && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setSelectedChatRoom(null)} style={{ background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start' }}>← 목록으로</button>
          <div style={{ fontWeight: 'bold' }}>{selectedChatRoom.name} 님과의 대화</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '180px', overflowY: 'auto', padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
            {chatMessages.map(m => (
              <div key={m.id} style={{ fontSize: '11px', padding: '6px 10px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>{m.text}</div>
            ))}
          </div>
          <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '4px' }}>
            <input type="text" value={chatInputText} onChange={e => setChatInputText(e.target.value)} placeholder="메시지 입력..." style={{ flex: 1, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px' }} />
            <button type="submit" style={{ padding: '6px 10px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px' }}>전송</button>
          </form>
        </div>
      )}

      {/* 작업방 탭 */}
      {activeTab === 'workspace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
            🎹 작업방 상세 : <span style={{ color: '#4f46e5' }}>{portfolioName}</span>
          </h2>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
              <span>파형을 누르면 재생·멈춤</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#1e293b' }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <div ref={waveformContainerRef} onClick={handleTogglePlay} style={{ width: '100%', background: '#fff', borderRadius: '8px', cursor: 'pointer', padding: '4px 0' }} />
            <button onClick={handleStartTimestamp} style={{ width: '100%', padding: '8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#1e293b' }}>
              📍 타임스탬프 찍기 ({formatTime(currentTime)})
            </button>
          </div>

          {isTimestampMode && (
            <form onSubmit={handleSaveTimestampComment} style={{ border: '1px dashed #64748b', borderRadius: '10px', padding: '10px', background: '#f1f5f9', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#4f46e5' }}>[{formatTime(timestampTime)}]</span>
              <input type="text" placeholder="수정 요청 코멘트 입력..." value={timestampInput} onChange={(e) => setTimestampInput(e.target.value)} style={{ flex: 1, padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px' }} required />
              <button type="submit" style={{ padding: '7px 12px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>✓</button>
            </form>
          )}

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#4f46e5' }}>
                💬 {activeSyncComment ? `지금 지점(${formatTime(activeSyncComment.start_time)}) 코멘트` : '재생 지점 코멘트'}
              </span>
              <button onClick={() => setIsAllCommentsOpen(!isAllCommentsOpen)} style={{ fontSize: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}>
                {isAllCommentsOpen ? '접기 ∧' : '전체 코멘트 모음 ∨'}
              </button>
            </div>
            {activeSyncComment ? (
              <div onClick={() => handleSeekToComment(activeSyncComment.start_time)} style={{ padding: '8px', background: '#eeedfe', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>{formatTime(activeSyncComment.start_time)}</strong> {activeSyncComment.content}</span>
                <button onClick={(e) => { e.stopPropagation(); handleToggleResolve(activeSyncComment.id); }} style={{ fontSize: '10px', padding: '2px 6px', background: activeSyncComment.resolved ? '#10b981' : '#fff', color: activeSyncComment.resolved ? '#fff' : '#333', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  {activeSyncComment.resolved ? '해결됨 ✓' : '해결됨'}
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '6px' }}>해당 재생 시점에 달린 코멘트가 없습니다.</div>
            )}
            {isAllCommentsOpen && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: '#f8fafc', borderRadius: '6px', fontSize: '11px' }}>
                    <span onClick={() => handleSeekToComment(c.start_time)} style={{ cursor: 'pointer', color: '#1e293b' }}>
                      <strong style={{ color: '#4f46e5' }}>{formatTime(c.start_time)}</strong> {c.content}
                    </span>
                    <button onClick={() => handleToggleResolve(c.id)} style={{ fontSize: '9px', padding: '2px 6px', background: c.resolved ? '#10b981' : '#fff', color: c.resolved ? '#fff' : '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>
                      {c.resolved ? '해결됨 ✓' : '해결됨'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>📁 버전 목록 (v1, v2)</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <label style={{ padding: '4px 8px', background: '#3b82f6', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
                  + 새 버전 올리기
                  <input type="file" accept="audio/*" onChange={handleUploadNewVersion} style={{ display: 'none' }} />
                </label>
                <button onClick={() => setIsComparing(!isComparing)} style={{ padding: '4px 8px', background: isComparing ? '#10b981' : '#e2e8f0', color: isComparing ? '#fff' : '#334155', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}>비교 듣기</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tracks.map((t) => (
                <div key={t.id} onClick={() => setSelectedTrackId(t.id)} style={{ padding: '8px 10px', background: selectedTrackId === t.id ? '#e0e7ff' : '#fff', border: `1px solid ${selectedTrackId === t.id ? '#6366f1' : '#e2e8f0'}`, borderRadius: '6px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontWeight: selectedTrackId === t.id ? 'bold' : 'normal', color: selectedTrackId === t.id ? '#3730a3' : '#334155' }}>▶ {t.track_name}</span>
                  {selectedTrackId === t.id && <span style={{ fontSize: '9px', background: '#4f46e5', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>재생중</span>}
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleCompleteWorkspace} style={{ width: '100%', padding: '12px', background: '#1f1e1b', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
            작업 완료 (내 포트폴리오에 자동 추가)
          </button>
        </div>
      )}

      {/* 내 포트폴리오 탭 */}
      {activeTab === 'portfolio' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 'bold', margin: 0 }}>📁 내 포트폴리오</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setIsShareMenuOpen(true)} style={{ padding: '6px 10px', background: '#0f6e56', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>🔗 공유</button>
              <button onClick={() => handleLoadPortfolio(myPortfolios[0])} style={{ padding: '6px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>➕ 새로 만들기</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myPortfolios.map((p) => (
              <div key={p.id} style={{ padding: '12px', background: '#f1f5f9', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{p.portfolio_name}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => handleOpenPublicDetail(p)} style={{ padding: '6px 8px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>공개보기</button>
                  <button onClick={() => handleLoadPortfolio(p)} style={{ padding: '6px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>작업방</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 고정 탭바 */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#fff', borderTop: '1px solid #e2dfd6', display: 'flex', justifyContent: 'space-around', padding: '8px 0 16px 0', zIndex: 100 }}>
        <div onClick={() => setActiveTab('explore')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flex: 1 }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: activeTab === 'explore' ? '#0f6e56' : '#d6d3c9' }} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'explore' ? 'bold' : 'normal', color: activeTab === 'explore' ? '#1f1e1b' : '#8d8a81' }}>탐색</span>
        </div>
        <div onClick={() => setActiveTab('messages')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flex: 1 }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: activeTab === 'messages' ? '#0f6e56' : '#d6d3c9' }} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'messages' ? 'bold' : 'normal', color: activeTab === 'messages' ? '#1f1e1b' : '#8d8a81' }}>메시지</span>
        </div>
        <div onClick={() => setActiveTab('workspace')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flex: 1 }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: activeTab === 'workspace' ? '#0f6e56' : '#d6d3c9' }} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'workspace' ? 'bold' : 'normal', color: activeTab === 'workspace' ? '#1f1e1b' : '#8d8a81' }}>작업방</span>
        </div>
        <div onClick={() => setActiveTab('portfolio')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flex: 1 }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: activeTab === 'portfolio' ? '#0f6e56' : '#d6d3c9' }} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'portfolio' ? 'bold' : 'normal', color: activeTab === 'portfolio' ? '#1f1e1b' : '#8d8a81' }}>내 포트폴리오</span>
        </div>
      </div>

    </div> 
  );
}