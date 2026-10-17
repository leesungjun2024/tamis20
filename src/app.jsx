import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from './supabaseClient'; 

export default function App() {
  // 1.  인증(Login) 상태 
  const [user, setUser] = useState(null);   
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const currentLogIdRef = useRef(null);

  // 2. 탭 관리 상태 ('portfolio' | 'studio' | 'admin_dashboard' | 'admin_management' | 'admin_logs' | 'competitor_monitoring')
  const [activeTab, setActiveTab] = useState('portfolio');
  const [myPortfolios, setMyPortfolios] = useState([]);
  const [currentPortfolioId, setCurrentPortfolioId] = useState(null);
  const [portfolioName, setPortfolioName] = useState('새 포트폴리오');
  const [portfolioOwnerEmail, setPortfolioOwnerEmail] = useState(''); 
  const [portfolioMembers, setPortfolioMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');

  // 3. 관리자 전용 데이터 및 세분화된 대시보드 필터 상태
  const [allPortfoliosAdmin, setAllPortfoliosAdmin] = useState([]);
  const [allTracksAdmin, setAllTracksAdmin] = useState([]); 
  const [allFeedbacksAdmin, setAllFeedbacksAdmin] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  
  const [dashboardFilterType, setDashboardFilterType] = useState('week'); 
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // 현재 접속자 상세 조회를 위한 선택된 유저 상태
  const [selectedActiveUser, setSelectedActiveUser] = useState(null);

  // 4. Supabase DB 연동 관리자 현황 관리 상태 (확장성 있는 권한 체계 포함)
  const [adminList, setAdminList] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('portfolio_admin');
  const [newAdminName, setNewAdminName] = useState('');

  // 관리자 정보 수정 및 권한 상세 설정 모달/인라인 편집 상태 (확장성 구현)
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminRole, setEditAdminRole] = useState('portfolio_admin');
  const [editPermissions, setEditPermissions] = useState({ portfolio: 'all', track: 'all', feedback: 'all' });

  // 로그인 이력 조회 페이지 전용 검색 및 페이징 상태
  const [loginSearchKeyword, setLoginSearchKeyword] = useState('');
  const [loginFromDate, setLoginFromDate] = useState('');
  const [loginToDate, setLoginToDate] = useState('');
  const [loginRegionFilter, setLoginRegionFilter] = useState('');
  const [loginLimitCount, setLoginLimitCount] = useState(10);
  const [loginQueryExecuted, setLoginQueryExecuted] = useState(false);

  // 관리 페이지 전용 검색 및 페이징 상태 (포트폴리오, 음원, 피드백 개별 분리)
  const [portfolioSearchName, setPortfolioSearchName] = useState('');
  const [portfolioFromDate, setPortfolioFromDate] = useState('');
  const [portfolioToDate, setPortfolioToDate] = useState('');
  const [portfolioLimitCount, setPortfolioLimitCount] = useState(10);
  const [portfolioQueryExecuted, setPortfolioQueryExecuted] = useState(false);

  const [trackSearchName, setTrackSearchName] = useState('');
  const [trackFromDate, setTrackFromDate] = useState('');
  const [trackToDate, setTrackToDate] = useState('');
  const [trackLimitCount, setTrackLimitCount] = useState(10);
  const [trackQueryExecuted, setTrackQueryExecuted] = useState(false);

  const [feedbackSearchName, setFeedbackSearchName] = useState('');
  const [feedbackFromDate, setFeedbackFromDate] = useState('');
  const [feedbackToDate, setFeedbackToDate] = useState('');
  const [feedbackLimitCount, setFeedbackLimitCount] = useState(10);
  const [feedbackQueryExecuted, setFeedbackQueryExecuted] = useState(false);

  // 5. 로그인 이력 자동 리프레시 상태 ('none' | '10s' | '1m' | '5m')
  const [autoRefreshInterval, setAutoRefreshInterval] = useState('none');

  // 6. 경쟁사 모니터링 인터랙티브 상태
  const [competitorSearchKeyword, setCompetitorSearchKeyword] = useState('');
  const [competitorNotes, setCompetitorNotes] = useState([
    { id: 1, competitor: 'SoundBetter', note: '프로페셔널 믹싱 엔지니어 매칭 시스템 고도화 완료. 수수료 5% 인하 전략 시행 중.', date: '2026-10-14' },
    { id: 2, competitor: 'Audiio', note: '무제한 음원 다운로드 구독 모델 도입 후 크리에이터 유입량 20% 증가.', date: '2026-10-12' },
    { id: 3, competitor: 'BandLab', note: '웹 기반 멀티트랙 실시간 협업 에디터에 AI 마스터링 기능 기본 탑재.', date: '2026-10-10' }
  ]);
  const [newCompetitorNote, setNewCompetitorNote] = useState('');
  const [selectedCompetitorTarget, setSelectedCompetitorTarget] = useState('SoundBetter');

  // 7. 오디오 재생 및 타임라인 상태
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 재생 방식 체크박스 상태 ('all' | 'sequential' | 'none') 및 메인 재생 상태
  const [playMode, setPlayMode] = useState('none'); 
  const [isMainPlaying, setIsMainPlaying] = useState(false);
  const [activeSequentialTrackId, setActiveSequentialTrackId] = useState(null);

  // 개별 트랙 재생 상태 관리 객체 (trackId: boolean)
  const [trackPlayingStates, setTrackPlayingStates] = useState({});

  // 8. 트랙 리스트
  const [tracks, setTracks] = useState([]);

  // 9. 피드백 및 댓글 상태
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

  // 관리자 판별 함수 (Supabase admins 테이블 연동 검사 포함)
  const checkIsAdmin = (userEmail) => {
    if (!userEmail) return false;
    const isRegisteredAdmin = adminList.some(a => a.email.toLowerCase() === userEmail.toLowerCase());
    return isRegisteredAdmin || userEmail === 'admin@admin.com' || userEmail.startsWith('admin') || userEmail === 'krsungjun@gmail.com';
  };

  const recordLoginLog = async (userEmail) => {
    try {
      let ip = 'Unknown IP';
      let location = '대한민국 (Seoul)';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData.ip;

        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoRes.json();
        if (geoData && geoData.country_name) {
          location = `${geoData.country_name} (${geoData.region || 'Unknown'})`;
        }
      } catch (e) {
        console.error('IP/위치 조회 실패:', e);
      }

      const device = navigator.userAgent;
      const currentLoginTime = new Date();
      const currentLoginTimeISO = currentLoginTime.toISOString();

      const midnightToday = new Date(currentLoginTime);
      midnightToday.setHours(0, 0, 0, 0);

      const thirtyMinutesAgo = new Date(currentLoginTime.getTime() - 30 * 60 * 1000).toISOString();

      const { error: updateError } = await supabase
        .from('login_logs')
        .update({ logout_time: midnightToday.toISOString() })
        .eq('user_email', userEmail)
        .is('logout_time', null)
        .lt('login_time', thirtyMinutesAgo);

      if (updateError) {
        console.error('이전 로그인 세션 강제 종료 업데이트 실패:', updateError.message);
      }

      const { data, error } = await supabase
        .from('login_logs')
        .insert([{ user_email: userEmail, ip_address: ip, location: location, device: device, login_time: currentLoginTimeISO }])
        .select()
        .single();

      if (!error && data) {
        currentLogIdRef.current = data.id;
      } else if (error) {
        console.error('로그인 기록 삽입 에러:', error.message);
      }
    } catch (err) {
      console.error('로그인 기록 저장 오류:', err);
    }
  };

  const recordLogoutLog = async () => {
    if (currentLogIdRef.current) {
      await supabase
        .from('login_logs')
        .update({ logout_time: new Date().toISOString() })
        .eq('id', currentLogIdRef.current);
      currentLogIdRef.current = null;
    }
  };

  // Supabase에서 관리자 목록 불러오기
  const fetchAdminsFromDB = async () => {
    try {
      const { data, error } = await supabase.from('admins').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setAdminList(data);
      } else {
        // 테이블이 아직 없거나 비어있는 경우 기본값 설정
        setAdminList([
          { id: 1, email: 'krsungjun@gmail.com', role: 'system_admin', name: '김성준 (시스템총괄)', permissions: { portfolio: 'all', track: 'all', feedback: 'all' } },
          { id: 2, email: 'admin@admin.com', role: 'system_admin', name: '최고관리자', permissions: { portfolio: 'all', track: 'all', feedback: 'all' } },
          { id: 3, email: 'portfolio_m1@admin.com', role: 'portfolio_admin', name: '포트폴리오 담당자 1', permissions: { portfolio: 'read_write', track: 'read_write', feedback: 'all' } }
        ]);
      }
    } catch (err) {
      console.error('관리자 목록 조회 오류:', err);
    }
  };

  useEffect(() => {
    fetchAdminsFromDB();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        const adminCheck = checkIsAdmin(currentUser.email);
        setIsAdmin(adminCheck);
        setUser(currentUser);
        fetchMyPortfolios(currentUser, adminCheck);
        setAuthorName(currentUser.email.split('@')[0]);

        if (event === 'SIGNED_IN') {
          await recordLoginLog(currentUser.email);
        }

        if (adminCheck) fetchAdminData();
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'admin_logs' || autoRefreshInterval === 'none') return;

    let delayMs = 10000; 
    if (autoRefreshInterval === '1m') delayMs = 60000; 
    if (autoRefreshInterval === '5m') delayMs = 300000; 

    const timer = setInterval(() => {
      fetchAdminData();
    }, delayMs);

    return () => clearInterval(timer);
  }, [activeTab, autoRefreshInterval]);

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
    await recordLogoutLog();
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setCurrentPortfolioId(null);
    setTracks([]);
    setComments([]);
    setPortfolioMembers([]);
    setActiveTab('portfolio');
  };

  const fetchMyPortfolios = async (userObj, adminFlag) => {
    if (!userObj) return;

    try {
      let rawPortfolios = [];

      if (adminFlag) {
        const { data, error } = await supabase
          .from('portfolios')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) rawPortfolios = data.filter(p => p.del_yn !== 'Y');
      } else {
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
      }

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

  const fetchAdminData = async () => {
    fetchAdminsFromDB();
    const { data: pData } = await supabase.from('portfolios').select('*').order('created_at', { ascending: false });
    const { data: mData } = await supabase.from('portfolio_members').select('*');
    const { data: tData } = await supabase
      .from('tracks')
      .select('*, portfolios(portfolio_name)')
      .order('created_at', { ascending: false });

    const { data: fData } = await supabase
      .from('feedbacks')
      .select('*, tracks(track_name), portfolios(portfolio_name)')
      .order('created_at', { ascending: false });
    
    const { data: lData } = await supabase.from('login_logs').select('*');
    let sortedLogs = [];
    if (lData) {
      const activeLogs = lData
        .filter(l => !l.logout_time)
        .sort((a, b) => new Date(b.login_time) - new Date(a.login_time));
      
      const finishedLogs = lData
        .filter(l => l.logout_time)
        .sort((a, b) => new Date(b.login_time) - new Date(a.login_time));

      sortedLogs = [...activeLogs, ...finishedLogs];
    }

    const enhancedPortfolios = (pData || []).map(p => {
      const pMembers = (mData || []).filter(m => m.portfolio_id === p.id);
      const pTracks = (tData || []).filter(t => t.portfolio_id === p.id);
      const pFeedbacks = (fData || []).filter(f => f.portfolio_id === p.id && f.del_yn !== 'Y');

      const trackDates = pTracks.map(t => new Date(t.created_at || t.updated_at || 0)).filter(d => !isNaN(d));
      const lastTrackDate = trackDates.length > 0 ? new Date(Math.max(...trackDates)) : null;

      const feedbackDates = pFeedbacks.map(f => new Date(f.updated_at || f.created_at || 0)).filter(d => !isNaN(d));
      const lastFeedbackDate = feedbackDates.length > 0 ? new Date(Math.max(...feedbackDates)) : null;

      const ownerEmail = (p.user_email && !p.user_email.includes('user_') && p.user_email.includes('@')) 
        ? p.user_email 
        : (user?.email || '알 수 없음');

      return {
        ...p,
        user_email: ownerEmail,
        member_count: 1 + pMembers.length,
        last_track_date: lastTrackDate ? lastTrackDate.toLocaleString() : '음원 없음',
        last_feedback_date: lastFeedbackDate ? lastFeedbackDate.toLocaleString() : '피드백 없음',
        owner_id: p.user_id || '알 수 없음',
        raw_members: pMembers
      };
    });

    setAllPortfoliosAdmin(enhancedPortfolios);
    setAllTracksAdmin(tData || []); 
    setAllFeedbacksAdmin(fData || []);
    setLoginLogs(sortedLogs);
  };

  const handleToggleViewYn = async (table, id, currentVal) => {
    const nextVal = currentVal === 'N' ? 'Y' : 'N';
    const { error } = await supabase
      .from(table)
      .update({ view_yn: nextVal })
      .eq('id', id);

    if (error) {
      alert('변경 실패: ' + error.message);
    } else {
      fetchAdminData();
      if (user) fetchMyPortfolios(user, isAdmin);
    }
  };

  const handleDeleteCurrentPortfolio = async () => {
    if (!currentPortfolioId) return;
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
      fetchMyPortfolios(user, isAdmin);
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
      const filtered = isAdmin ? activeFeedbacks : activeFeedbacks.filter(f => f.view_yn !== 'N');
      const sorted = filtered.sort((a, b) => (a.start_time || 0) - (b.start_time || 0));
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
      fetchMyPortfolios(user, isAdmin);
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
      fetchMyPortfolios(user, isAdmin);
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
      fetchMyPortfolios(user, isAdmin);
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

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말 이 피드백을 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('feedbacks')
      .update({ del_yn: 'Y' })
      .eq('id', commentId);

    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      await fetchFeedbacksAndReplies(currentPortfolioId);
      fetchMyPortfolios(user, isAdmin);
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

  const filterByDashboardRange = (itemList, dateField) => {
    const now = new Date();
    return itemList.filter(item => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]);

      if (dashboardFilterType === 'today') {
        return itemDate.toDateString() === now.toDateString();
      } else if (dashboardFilterType === 'yesterday') {
        const yest = new Date();
        yest.setDate(now.getDate() - 1);
        return itemDate.toDateString() === yest.toDateString();
      } else if (dashboardFilterType === 'week') {
        const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      } else if (dashboardFilterType === 'month') {
        const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 30;
      } else if (dashboardFilterType === 'custom' && fromDate && toDate) {
        const fDate = new Date(fromDate);
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59, 999);
        return itemDate >= fDate && itemDate <= tDate;
      }
      return true;
    });
  };

  const filteredPortfolios = filterByDashboardRange(allPortfoliosAdmin, 'created_at');
  const filteredFeedbacks = filterByDashboardRange(allFeedbacksAdmin.filter(f => f.del_yn !== 'Y'), 'created_at');
  const filteredLogs = filterByDashboardRange(loginLogs, 'login_time');

  // 현재 접속자 필터링 (logout_time이 없는 항목)
  const activeUsersList = loginLogs.filter(l => !l.logout_time);

  // 접속자 강제 종료 기능 핸들러
  const handleForceLogoutUser = async (logId, userEmail) => {
    if (!window.confirm(`정말 "${userEmail}" 사용자의 접속 세션을 강제 종료하시겠습니까?`)) return;

    const { error } = await supabase
      .from('login_logs')
      .update({ logout_time: new Date().toISOString() })
      .eq('id', logId);

    if (error) {
      alert('강제 종료 실패: ' + error.message);
    } else {
      alert(`${userEmail} 사용자의 세션이 강제 종료되었습니다.`);
      fetchAdminData();
    }
  };

  // Supabase DB 연동: 관리자 추가 핸들러 (등급 및 정원 제한 검사)
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const trimmedEmail = newAdminEmail.trim();
    if (!trimmedEmail) return;

    const portfolioAdminCount = adminList.filter(a => a.role === 'portfolio_admin').length;
    const systemAdminCount = adminList.filter(a => a.role === 'system_admin').length;

    if (newAdminRole === 'portfolio_admin' && portfolioAdminCount >= 10) {
      alert('⚠️ 포트폴리오 관리자는 최대 10명까지만 등록할 수 있습니다!');
      return;
    }

    if (newAdminRole === 'system_admin' && systemAdminCount >= 3) {
      alert('⚠️ 시스템 관리자는 최대 3명까지만 등록할 수 있습니다!');
      return;
    }

    const isAlready = adminList.some(a => a.email.toLowerCase() === trimmedEmail.toLowerCase());
    if (isAlready) {
      alert('이미 등록된 관리자 이메일입니다.');
      return;
    }

    const newAdminObj = {
      email: trimmedEmail,
      role: newAdminRole,
      name: newAdminName.trim() || trimmedEmail.split('@')[0],
      permissions: { portfolio: 'all', track: 'all', feedback: 'all' }
    };

    const { data, error } = await supabase.from('admins').insert([newAdminObj]).select();

    if (error) {
      alert('관리자 DB 등록 실패: ' + error.message);
    } else {
      if (data) setAdminList([...adminList, data[0]]);
      else fetchAdminsFromDB();
      setNewAdminEmail('');
      setNewAdminName('');
      alert('새로운 관리자가 DB에 등록되었습니다.');
    }
  };

  // Supabase DB 연동: 관리자 삭제 핸들러
  const handleDeleteAdmin = async (id, email) => {
    if (adminList.length <= 1) {
      alert('최소 1명의 관리자는 유지되어야 합니다.');
      return;
    }
    if (!window.confirm(`정말 "${email}" 관리자를 해제하시겠습니까?`)) return;

    const { error } = await supabase.from('admins').delete().eq('id', id);

    if (error) {
      alert('관리자 삭제 실패: ' + error.message);
    } else {
      setAdminList(adminList.filter(a => a.id !== id));
      alert('관리자가 해제되었습니다.');
    }
  };

  // 관리자 정보 수정 시작
  const handleStartEditAdmin = (admin) => {
    setEditingAdminId(admin.id);
    setEditAdminName(admin.name);
    setEditAdminRole(admin.role);
    setEditPermissions(admin.permissions || { portfolio: 'all', track: 'all', feedback: 'all' });
  };

  // Supabase DB 연동: 관리자 정보 및 권한 수정 저장
  const handleSaveEditAdmin = async (id) => {
    const portfolioAdminCount = adminList.filter(a => a.role === 'portfolio_admin' && a.id !== id).length;
    const systemAdminCount = adminList.filter(a => a.role === 'system_admin' && a.id !== id).length;

    if (editAdminRole === 'portfolio_admin' && portfolioAdminCount >= 10) {
      alert('⚠️ 포트폴리오 관리자는 최대 10명까지만 등록할 수 있습니다!');
      return;
    }

    if (editAdminRole === 'system_admin' && systemAdminCount >= 3) {
      alert('⚠️ 시스템 관리자는 최대 3명까지만 등록할 수 있습니다!');
      return;
    }

    const updatePayload = {
      name: editAdminName.trim(),
      role: editAdminRole,
      permissions: editPermissions
    };

    const { error } = await supabase.from('admins').update(updatePayload).eq('id', id);

    if (error) {
      alert('관리자 정보 수정 실패: ' + error.message);
    } else {
      setAdminList(adminList.map(a => a.id === id ? { ...a, ...updatePayload } : a));
      setEditingAdminId(null);
      alert('관리자 정보 및 권한이 DB에 성공적으로 업데이트되었습니다.');
    }
  };

  // 로그인 이력 조회 페이지 전용 검색 필터 적용 함수
  const applyLoginHistoryFilter = () => {
    let result = loginLogs;

    if (loginSearchKeyword.trim()) {
      const keyword = loginSearchKeyword.trim().toLowerCase();
      result = result.filter(item => 
        (item.user_email || '').toLowerCase().includes(keyword) || 
        (item.device || '').toLowerCase().includes(keyword)
      );
    }

    if (loginRegionFilter.trim()) {
      const reg = loginRegionFilter.trim().toLowerCase();
      result = result.filter(item => (item.location || '').toLowerCase().includes(reg));
    }

    if (loginFromDate && loginToDate) {
      const fDate = new Date(loginFromDate);
      const tDate = new Date(loginToDate);
      tDate.setHours(23, 59, 59, 999);
      result = result.filter(item => {
        if (!item.login_time) return false;
        const lDate = new Date(item.login_time);
        return lDate >= fDate && lDate <= tDate;
      });
    }

    return result.slice(0, loginLimitCount);
  };

  const displayedLoginLogs = loginQueryExecuted ? applyLoginHistoryFilter() : loginLogs.slice(0, loginLimitCount);

  const applyPortfolioManagementFilter = () => {
    let result = allPortfoliosAdmin;
    if (portfolioSearchName.trim()) {
      const keyword = portfolioSearchName.trim().toLowerCase();
      result = result.filter(item => (item.portfolio_name || '').toLowerCase().includes(keyword));
    }
    return result.slice(0, portfolioLimitCount);
  };

  const applyTrackManagementFilter = () => {
    let result = allTracksAdmin;
    if (trackSearchName.trim()) {
      const keyword = trackSearchName.trim().toLowerCase();
      result = result.filter(item => (item.track_name || '').toLowerCase().includes(keyword));
    }
    return result.slice(0, trackLimitCount);
  };

  const applyFeedbackManagementFilter = () => {
    let result = allFeedbacksAdmin;
    if (feedbackSearchName.trim()) {
      const keyword = feedbackSearchName.trim().toLowerCase();
      result = result.filter(item => (item.content || '').toLowerCase().includes(keyword));
    }
    return result.slice(0, feedbackLimitCount);
  };

  const displayedPortfolios = portfolioQueryExecuted ? applyPortfolioManagementFilter() : allPortfoliosAdmin.slice(0, portfolioLimitCount);
  const displayedTracks = trackQueryExecuted ? applyTrackManagementFilter() : allTracksAdmin.slice(0, trackLimitCount);
  const displayedFeedbacks = feedbackQueryExecuted ? applyFeedbackManagementFilter() : allFeedbacksAdmin.slice(0, feedbackLimitCount);

  const generateTimeSeriesStats = () => {
    const now = new Date();
    let slots = [];

    if (dashboardFilterType === 'today' || dashboardFilterType === 'yesterday') {
      const targetDay = new Date();
      if (dashboardFilterType === 'yesterday') targetDay.setDate(now.getDate() - 1);
      
      for (let h = 0; h < 24; h++) {
        const label = `${h.toString().padStart(2, '0')}시`;
        slots.push({ key: label, label, pCount: 0, mCount: 0, fCount: 0, rawDate: new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), h) });
      }

      filteredPortfolios.forEach(p => {
        const d = new Date(p.created_at);
        if (d.toDateString() === targetDay.toDateString()) {
          const h = d.getHours();
          if (slots[h]) { slots[h].pCount += 1; slots[h].mCount += (p.member_count || 1); }
        }
      });
      filteredFeedbacks.forEach(f => {
        const d = new Date(f.created_at);
        if (d.toDateString() === targetDay.toDateString()) {
          const h = d.getHours();
          if (slots[h]) slots[h].fCount += 1;
        }
      });
    } else {
      let daysCount = 7;
      let startDate = new Date();

      if (dashboardFilterType === 'month') {
        daysCount = 31;
      } else if (dashboardFilterType === 'custom' && fromDate && toDate) {
        const f = new Date(fromDate);
        const t = new Date(toDate);
        const diff = Math.ceil((t - f) / (1000 * 60 * 60 * 24)) + 1;
        daysCount = Math.max(7, Math.min(31, diff));
        startDate = new Date(t);
      }

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() - i);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        slots.push({ key: label, label, pCount: 0, mCount: 0, fCount: 0, targetDateStr: d.toDateString() });
      }

      filteredPortfolios.forEach(p => {
        const d = new Date(p.created_at);
        const slot = slots.find(s => s.targetDateStr === d.toDateString());
        if (slot) { slot.pCount += 1; slot.mCount += (p.member_count || 1); }
      });
      filteredFeedbacks.forEach(f => {
        const d = new Date(f.created_at);
        const slot = slots.find(s => s.targetDateStr === d.toDateString());
        if (slot) slot.fCount += 1;
      });
    }

    return slots;
  };

  const timeSeriesData = generateTimeSeriesStats();
  const maxTimeSeriesVal = Math.max(...timeSeriesData.map(s => Math.max(s.pCount, s.mCount, s.fCount)), 1);

  const sortedTracks = [...tracks].sort((a, b) => (a.order || 0) - (b.order || 0));

  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

  // 경쟁사별 UI 특징 및 장단점 분석 데이터 구조
  const competitorDetailList = [
    {
      name: 'SoundBetter',
      uiFeatures: '전문가 프로필 카드 중심의 깔끔한 그리드 레이아웃. 트랙별 오디오 플레이어와 마커가 상단에 고정되어 검색과 샘플 청취가 유기적임.',
      imageDescription: '참고 화면: 엔지니어/프로듀서 프로필 그리드 및 오디오 샘플 플레이어가 결합된 마켓플레이스 UI',
      pros: [
        '세계 최대 규모의 프로페셔널 엔지니어/음악가 인프라',
        'Spotify 기반 신뢰할 수 있는 구인/구직 매칭 UI',
        '에스크로 결제 시스템 통합으로 높은 거래 안전성'
      ],
      cons: [
        '실시간 웹 기반 멀티트랙 동시 편집 및 정밀 스튜디오 기능 부재',
        'Pro 등급 월 구독 비용 및 거래 수수료 발생',
        '초보 크리에이터 접근 장벽 존재'
      ]
    },
    {
      name: 'Audiio',
      uiFeatures: '다크 모드 중심의 시네마틱 오디오 플레이어 UI. 웨이브폼 비주얼라이저와 필터링 사이드바가 직관적으로 배치됨.',
      imageDescription: '참고 화면: 다크모드 기반의 시네마틱 오디오 플레이어 및 라이선스 필터 사이드바 UI',
      pros: [
        '음원 라이선스 구매 및 사용 과정이 매우 간결한 인터페이스',
        '빠른 오디오 로딩 속도와 직관적인 장르/태그 탐색 시스템',
        '영상 제작자 및 유튜버 친화적 컬렉션 관리 기능'
      ],
      cons: [
        '사용자 간 타임라인 피드백 및 대댓글 기능 미지원',
        '멀티트랙 개별 음소거/순차 재생 기능 없음',
        '단순 음원 다운로드에 특화되어 있어 협업 스튜디오 기능 부족'
      ]
    },
    {
      name: 'BandLab',
      uiFeatures: '웹 DAW(Digital Audio Workstation) 스타일의 가로 타임라인 레이아웃. 소셜 피드와 트랙 편집기가 결합된 하이브리드 UI.',
      imageDescription: '참고 화면: 브라우저 기반 DAW 멀티트랙 에디터 및 소셜 커뮤니티 피드 복합 UI',
      pros: [
        '브라우저에서 직접 멀티트랙 녹음 및 AI 마스터링 가능',
        '강력한 글로벌 음악인 커뮤니티 및 소셜 공유 기능',
        '전면 무료 제공으로 초기 유입에 강력함'
      ],
      cons: [
        '기능이 과도하게 많아 단순 피드백 및 포트폴리오 관리시 UI 복잡도 상승',
        '초 단위 피드백 코멘트 관리 시 시각적 시퀀스 직관성 다소 떨어짐',
        '고음질 대용량 오디오 보관 시 일부 렌더링 지연 발생'
      ]
    },
    {
      name: '우리 플랫폼 (현재)',
      uiFeatures: '포트폴리오 중심의 멀티트랙 스튜디오 레이아웃. 초단위 정밀 파동 피드백과 반응형 타임라인 대시보드 통합 UI.',
      imageDescription: '참고 화면: 사용자 제공 매트릭스 및 실시간 멀티트랙 웨이브폼 피드백 통합 인터페이스',
      pros: [
        '웨이브폼 클릭을 통한 정확한 초단위(Start/End) 타임스탬프 피드백',
        '전체재생 및 순차재생 모드, 트랙별 음소거/순서 변경 완벽 지원',
        '관리자 모니터링, 세분화된 대시보드, 팀원 초대 및 권한 통합'
      ],
      cons: [
        '웹 브라우저 내 DAW급 실시간 이펙터/녹음 기능 미지원 (현재 지원 예정)',
        '마켓플레이스 연동 결제 모델 구축 단계'
      ]
    }
  ];

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
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4f46e5' }}>👤 {user.email}</span> 
          {isAdmin && <span style={{ marginLeft: '6px', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>👑 관리자</span>}
          님 접속중
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => { setActiveTab('portfolio'); fetchMyPortfolios(user, isAdmin); }} style={{ padding: '6px 10px', background: activeTab === 'portfolio' ? '#4f46e5' : '#e2e8f0', color: activeTab === 'portfolio' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
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
          
          {isAdmin && (
            <>
              <button onClick={() => { setActiveTab('admin_dashboard'); fetchAdminData(); }} style={{ padding: '6px 10px', background: activeTab === 'admin_dashboard' ? '#0f172a' : '#e2e8f0', color: activeTab === 'admin_dashboard' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                📊 대시보드
              </button>
              <button onClick={() => { setActiveTab('admin_management'); fetchAdminData(); }} style={{ padding: '6px 10px', background: activeTab === 'admin_management' ? '#0f172a' : '#e2e8f0', color: activeTab === 'admin_management' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                ⚙️ 관리 페이지
              </button>
              <button onClick={() => { setActiveTab('admin_logs'); fetchAdminData(); }} style={{ padding: '6px 10px', background: activeTab === 'admin_logs' ? '#0f172a' : '#e2e8f0', color: activeTab === 'admin_logs' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                📋 관리자 현황 관리
              </button>
              <button onClick={() => { setActiveTab('competitor_monitoring'); }} style={{ padding: '6px 10px', background: activeTab === 'competitor_monitoring' ? '#0f172a' : '#e2e8f0', color: activeTab === 'competitor_monitoring' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                🔍 경쟁사 모니터링
              </button>
            </>
          )}

          <button onClick={handleLogout} style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            로그아웃
          </button>
        </div>
      </div>

      {activeTab === 'admin_dashboard' && isAdmin ? (
        <div style={{ padding: '10px 0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>📊 관리자 대시보드 상세 통계</h2>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setDashboardFilterType('today')} style={{ padding: '6px 10px', background: dashboardFilterType === 'today' ? '#4f46e5' : '#fff', color: dashboardFilterType === 'today' ? '#fff' : '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>금일</button>
              <button onClick={() => setDashboardFilterType('yesterday')} style={{ padding: '6px 10px', background: dashboardFilterType === 'yesterday' ? '#4f46e5' : '#fff', color: dashboardFilterType === 'yesterday' ? '#fff' : '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>어제</button>
              <button onClick={() => setDashboardFilterType('week')} style={{ padding: '6px 10px', background: dashboardFilterType === 'week' ? '#4f46e5' : '#fff', color: dashboardFilterType === 'week' ? '#fff' : '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>최근 일주일</button>
              <button onClick={() => setDashboardFilterType('month')} style={{ padding: '6px 10px', background: dashboardFilterType === 'month' ? '#4f46e5' : '#fff', color: dashboardFilterType === 'month' ? '#fff' : '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>최근 한달</button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setDashboardFilterType('custom'); }} style={{ padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <span style={{ fontSize: '11px' }}>~</span>
                <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setDashboardFilterType('custom'); }} style={{ padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>🟢 현재 접속자 통계 및 상세 조회 ({activeUsersList.length}명 접속 중)</h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>유저를 클릭하면 상세 정보를 조회합니다</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedActiveUser ? '1fr 1fr' : '1fr', gap: '16px' }}>
              <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', maxHeight: '200px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#e2e8f0', textAlign: 'left', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '6px 8px' }}>사용자명 (이메일)</th>
                      <th style={{ padding: '6px 8px' }}>로그인 시간</th>
                      <th style={{ padding: '6px 8px' }}>접속 상태 / 강제종료</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUsersList.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>현재 접속 중인 사용자가 없습니다.</td></tr>
                    ) : (
                      activeUsersList.map((log) => {
                        const isSelected = selectedActiveUser?.id === log.id;
                        const loginDate = new Date(log.login_time);
                        const diffMins = Math.floor((new Date() - loginDate) / (1000 * 60));
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        const activeDurationStr = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;

                        return (
                          <tr 
                            key={log.id} 
                            onClick={() => setSelectedActiveUser({ ...log, activeDurationStr })}
                            style={{ 
                              borderBottom: '1px solid #e2e8f0', 
                              cursor: 'pointer', 
                              background: isSelected ? '#e0e7ff' : 'transparent' 
                            }}
                          >
                            <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#4f46e5' }}>{log.user_email}</td>
                            <td style={{ padding: '6px 8px' }}>{loginDate.toLocaleTimeString()}</td>
                            <td style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                ({activeDurationStr})
                              </span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleForceLogoutUser(log.id, log.user_email); }}
                                style={{ padding: '2px 6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                강제종료
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {selectedActiveUser && (
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    <strong style={{ color: '#1e293b' }}>👤 로그인 유저 상세 정보</strong>
                    <button 
                      onClick={() => setSelectedActiveUser(null)} 
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                    >
                      닫기 ✕
                    </button>
                  </div>
                  <div><strong>사용자 이메일:</strong> <span style={{ color: '#4f46e5' }}>{selectedActiveUser.user_email}</span></div>
                  <div><strong>활동(접속) 시간:</strong> {selectedActiveUser.activeDurationStr} (시작: {new Date(selectedActiveUser.login_time).toLocaleString()})</div>
                  <div><strong>최근 접속 IP / 위치:</strong> {selectedActiveUser.ip_address || '-'} / {selectedActiveUser.location || '대한민국 (Seoul)'}</div>
                  <div><strong>접속 기기(Device):</strong> <span style={{ fontSize: '10px', color: '#64748b' }}>{selectedActiveUser.device || '-'}</span></div>
                  
                  <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>포트폴리오 보유 수: <strong>{allPortfoliosAdmin.filter(p => p.user_email === selectedActiveUser.user_email).length}개</strong></span>
                    <span>작성한 피드백 수: <strong>{allFeedbacksAdmin.filter(f => f.author === selectedActiveUser.user_email.split('@')[0] && f.del_yn !== 'Y').length}건</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>포트폴리오 (기간내 / 전체)</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4f46e5', marginTop: '6px' }}>
                {filteredPortfolios.length} 개 <span style={{ fontSize: '13px', color: '#94a3b8' }}>/ {allPortfoliosAdmin.length} 개</span>
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>피드백 (기간내 / 전체)</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginTop: '6px' }}>
                {filteredFeedbacks.length} 건 <span style={{ fontSize: '13px', color: '#94a3b8' }}>/ {allFeedbacksAdmin.filter(f => f.del_yn !== 'Y').length} 건</span>
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>로그인 이력 (기간내 / 전체)</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', marginTop: '6px' }}>
                {filteredLogs.length} 건 <span style={{ fontSize: '13px', color: '#94a3b8' }}>/ {loginLogs.length} 건</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', margin: 0 }}>📈 1. 시계열 현황 (포트폴리오 / 회원수 / 피드백수)</h3>
              <div style={{ fontSize: '11px', color: '#475569', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                🔵 포트폴리오 | 🟢 회원수 | 🟠 피드백
              </div>
            </div>

            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '24px', borderBottom: '1px solid #cbd5e1', paddingLeft: '8px', paddingRight: '8px', overflowX: 'auto' }}>
              {timeSeriesData.length === 0 ? (
                <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8', lineHeight: '170px' }}>데이터가 없습니다.</div>
              ) : (
                timeSeriesData.map((stat, idx) => {
                  const pHeight = Math.round((stat.pCount / maxTimeSeriesVal) * 120);
                  const mHeight = Math.round((stat.mCount / maxTimeSeriesVal) * 120);
                  const fHeight = Math.round((stat.fCount / maxTimeSeriesVal) * 120);

                  return (
                    <div key={idx} style={{ flex: 1, minWidth: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '8px', color: '#334155', marginBottom: '2px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {stat.pCount}/{stat.mCount}/{stat.fCount}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', width: '100%', height: '130px', justifyContent: 'center' }}>
                        <div style={{ width: '28%', background: '#4f46e5', height: `${Math.max(pHeight, 4)}px`, borderRadius: '2px 2px 0 0' }} title={`포트폴리오: ${stat.pCount}`} />
                        <div style={{ width: '28%', background: '#10b981', height: `${Math.max(mHeight, 4)}px`, borderRadius: '2px 2px 0 0' }} title={`회원수: ${stat.mCount}`} />
                        <div style={{ width: '28%', background: '#f59e0b', height: `${Math.max(fHeight, 4)}px`, borderRadius: '2px 2px 0 0' }} title={`피드백: ${stat.fCount}`} />
                      </div>
                      <span style={{ fontSize: '9px', color: '#475569', marginTop: '6px', whiteSpace: 'nowrap' }}>{stat.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#334155' }}>🎵 2. 콘텐츠 및 피드백 지표</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span>기간 내 포트폴리오 수</span><strong style={{ color: '#4f46e5' }}>{filteredPortfolios.length} 개</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span>기간 내 피드백 수</span><strong style={{ color: '#10b981' }}>{filteredFeedbacks.length} 건</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span>기간 내 피드백 회원수</span><strong style={{ color: '#f59e0b' }}>{new Set(filteredFeedbacks.map(f => f.author)).size} 명</strong>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#334155' }}>🌍 3. 로그인 지역 및 회원 분포</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                {Object.entries(
                  filteredLogs.reduce((acc, log) => {
                    const loc = log.location || '대한민국 (Seoul)';
                    acc[loc] = (acc[loc] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([location, count], idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span>📍 {location}</span>
                    <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{count} 명</span>
                  </div>
                ))}
                {filteredLogs.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>데이터 없음</div>}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'admin_management' && isAdmin ? (
        <div style={{ padding: '10px 0' }}>
          
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>⚙️ 관리 페이지 (조회/사용 여부 및 상세 정보 관리)</h2>

          <div style={{ marginBottom: '28px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', margin: 0 }}>📁 포트폴리오 사용(조회) 여부 및 상세 관리</h3>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="text" placeholder="🔍 명칭 검색..." value={portfolioSearchName} onChange={(e) => setPortfolioSearchName(e.target.value)} style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '130px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="date" value={portfolioFromDate} onChange={(e) => setPortfolioFromDate(e.target.value)} style={{ padding: '5px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <span style={{ fontSize: '11px' }}>~</span>
                  <input type="date" value={portfolioToDate} onChange={(e) => setPortfolioToDate(e.target.value)} style={{ padding: '5px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', color: '#334155', background: '#fff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <span>조회:</span>
                  {[10, 50, 100].map(cnt => (
                    <label key={cnt} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: portfolioLimitCount === cnt ? 'bold' : 'normal', color: portfolioLimitCount === cnt ? '#4f46e5' : '#475569' }}>
                      <input type="radio" name="portfolioLimit" checked={portfolioLimitCount === cnt} onChange={() => setPortfolioLimitCount(cnt)} /> {cnt}건
                    </label>
                  ))}
                </div>

                <button onClick={() => setPortfolioQueryExecuted(true)} style={{ padding: '6px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  조회
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>포트폴리오 명</th>
                    <th style={{ padding: '8px' }}>이메일 (소유자)</th>
                    <th style={{ padding: '8px' }}>회원수</th>
                    <th style={{ padding: '8px' }}>최종 음원 조회일자</th>
                    <th style={{ padding: '8px' }}>최종 피드백 수정일자</th>
                    <th style={{ padding: '8px' }}>사용 여부</th>
                    <th style={{ padding: '8px' }}>삭제 여부</th>
                    <th style={{ padding: '8px' }}>소유자 ID</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPortfolios.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>조건에 맞는 포트폴리오가 없습니다.</td></tr>
                  ) : (
                    displayedPortfolios.map((p) => {
                      const isDeleted = p.del_yn === 'Y';
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #cbd5e1', background: isDeleted ? '#ffeeec' : 'transparent' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: isDeleted ? '#94a3b8' : '#1e293b' }}>
                            {p.portfolio_name} {isDeleted && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>(삭제됨)</span>}
                          </td>
                          <td style={{ padding: '8px', color: '#4f46e5', fontWeight: 'bold' }}>{p.user_email}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{p.member_count} 명</td>
                          <td style={{ padding: '8px' }}>{p.last_track_date}</td>
                          <td style={{ padding: '8px' }}>{p.last_feedback_date}</td>
                          <td style={{ padding: '8px' }}>
                            <button onClick={() => handleToggleViewYn('portfolios', p.id, p.view_yn || 'Y')} style={{ padding: '4px 8px', background: (p.view_yn || 'Y') !== 'N' ? '#10b981' : '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                              {(p.view_yn || 'Y') !== 'N' ? 'Y (사용 중)' : 'N (중지됨)'}
                            </button>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <span style={{ padding: '3px 8px', background: isDeleted ? '#ef4444' : '#e2e8f0', color: isDeleted ? '#fff' : '#475569', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>
                              {isDeleted ? 'Y (삭제됨)' : 'N (정상)'}
                            </span>
                          </td>
                          <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '10px' }}>{p.owner_id}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginBottom: '28px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', margin: 0 }}>🎵 음원 사용(조회) 여부 및 상세 관리</h3>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="text" placeholder="🔍 명칭 검색..." value={trackSearchName} onChange={(e) => setTrackSearchName(e.target.value)} style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '130px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="date" value={trackFromDate} onChange={(e) => setTrackFromDate(e.target.value)} style={{ padding: '5px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <span style={{ fontSize: '11px' }}>~</span>
                  <input type="date" value={trackToDate} onChange={(e) => setTrackToDate(e.target.value)} style={{ padding: '5px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', color: '#334155', background: '#fff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <span>조회:</span>
                  {[10, 50, 100].map(cnt => (
                    <label key={cnt} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: trackLimitCount === cnt ? 'bold' : 'normal', color: trackLimitCount === cnt ? '#4f46e5' : '#475569' }}>
                      <input type="radio" name="trackLimit" checked={trackLimitCount === cnt} onChange={() => setTrackLimitCount(cnt)} /> {cnt}건
                    </label>
                  ))}
                </div>
                <button onClick={() => setTrackQueryExecuted(true)} style={{ padding: '6px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  조회
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>포트폴리오 명</th>
                    <th style={{ padding: '8px' }}>음원명</th>
                    <th style={{ padding: '8px' }}>등록일자</th>
                    <th style={{ padding: '8px' }}>사용 여부</th>
                    <th style={{ padding: '8px' }}>삭제 여부</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTracks.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>조건에 맞는 음원이 없습니다.</td></tr>
                  ) : (
                    displayedTracks.map((track) => {
                      const isTrackDeleted = track.del_yn === 'Y';
                      return (
                        <tr key={track.id} style={{ borderBottom: '1px solid #cbd5e1', background: isTrackDeleted ? '#ffeeec' : 'transparent' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{track.portfolios?.portfolio_name || '알 수 없음'}</td>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: isTrackDeleted ? '#94a3b8' : '#4f46e5' }}>
                            {track.track_name} {isTrackDeleted && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>(삭제됨)</span>}
                          </td>
                          <td style={{ padding: '8px' }}>{track.created_at ? new Date(track.created_at).toLocaleString() : '-'}</td>
                          <td style={{ padding: '8px' }}>
                            <button onClick={() => handleToggleViewYn('tracks', track.id, track.view_yn || 'Y')} style={{ padding: '4px 8px', background: (track.view_yn || 'Y') !== 'N' ? '#10b981' : '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                              {(track.view_yn || 'Y') !== 'N' ? 'Y (사용 중)' : 'N (중지됨)'}
                            </button>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <span style={{ padding: '3px 8px', background: isTrackDeleted ? '#ef4444' : '#e2e8f0', color: isTrackDeleted ? '#fff' : '#475569', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>
                              {isTrackDeleted ? 'Y (삭제됨)' : 'N (정상)'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', margin: 0 }}>💬 피드백 사용(조회) 여부 및 상세 관리</h3>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="text" placeholder="🔍 명칭 검색..." value={feedbackSearchName} onChange={(e) => setFeedbackSearchName(e.target.value)} style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '130px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="date" value={feedbackFromDate} onChange={(e) => setFeedbackFromDate(e.target.value)} style={{ padding: '5px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <span style={{ fontSize: '11px' }}>~</span>
                  <input type="date" value={feedbackToDate} onChange={(e) => setFeedbackToDate(e.target.value)} style={{ padding: '5px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', color: '#334155', background: '#fff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <span>조회:</span>
                  {[10, 50, 100].map(cnt => (
                    <label key={cnt} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: feedbackLimitCount === cnt ? 'bold' : 'normal', color: feedbackLimitCount === cnt ? '#4f46e5' : '#475569' }}>
                      <input type="radio" name="feedbackLimit" checked={feedbackLimitCount === cnt} onChange={() => setFeedbackLimitCount(cnt)} /> {cnt}건
                    </label>
                  ))}
                </div>
                <button onClick={() => setFeedbackQueryExecuted(true)} style={{ padding: '6px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  조회
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>포트폴리오</th>
                    <th style={{ padding: '8px' }}>음원명</th>
                    <th style={{ padding: '8px' }}>작성자</th>
                    <th style={{ padding: '8px' }}>내용</th>
                    <th style={{ padding: '8px' }}>등록일자</th>
                    <th style={{ padding: '8px' }}>사용 여부</th>
                    <th style={{ padding: '8px' }}>삭제 여부</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedFeedbacks.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>조건에 맞는 피드백이 없습니다.</td></tr>
                  ) : (
                    displayedFeedbacks.map((f) => {
                      const isFeedbackDeleted = f.del_yn === 'Y';
                      return (
                        <tr key={f.id} style={{ borderBottom: '1px solid #cbd5e1', background: isFeedbackDeleted ? '#ffeeec' : 'transparent' }}>
                          <td style={{ padding: '8px' }}>{f.portfolios?.portfolio_name || '알 수 없음'}</td>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: '#4f46e5' }}>{f.tracks?.track_name || '음원 정보 없음'}</td>
                          <td style={{ padding: '8px' }}>{f.author}</td>
                          <td style={{ padding: '8px', color: isFeedbackDeleted ? '#94a3b8' : '#334155' }}>
                            {f.content} {isFeedbackDeleted && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>(삭제됨)</span>}
                          </td>
                          <td style={{ padding: '8px' }}>{f.created_at ? new Date(f.created_at).toLocaleString() : '-'}</td>
                          <td style={{ padding: '8px' }}>
                            <button onClick={() => handleToggleViewYn('feedbacks', f.id, f.view_yn || 'Y')} style={{ padding: '4px 8px', background: (f.view_yn || 'Y') !== 'N' ? '#10b981' : '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                              {(f.view_yn || 'Y') !== 'N' ? 'Y (사용 중)' : 'N (중지됨)'}
                            </button>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <span style={{ padding: '3px 8px', background: isFeedbackDeleted ? '#ef4444' : '#e2e8f0', color: isFeedbackDeleted ? '#fff' : '#475569', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>
                              {isFeedbackDeleted ? 'Y (삭제됨)' : 'N (정상)'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'admin_logs' && isAdmin ? (
        <div style={{ padding: '10px 0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>📋 사용자 로그인 이력 및 현재 접속자 관리</h2>
          </div>

          <div style={{ marginBottom: '28px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', margin: 0 }}>🟢 현재 접속자 현황 및 강제 종료 관리 ({activeUsersList.length}명 접속 중)</h3>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={fetchAdminData} style={{ padding: '5px 10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  🔄 리프레시
                </button>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#475569' }}>
                  <span>자동 리프레시:</span>
                  <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={autoRefreshInterval === '10s'} onChange={(e) => setAutoRefreshInterval(e.target.checked ? '10s' : 'none')} /> 10초</label>
                  <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={autoRefreshInterval === '1m'} onChange={(e) => setAutoRefreshInterval(e.target.checked ? '1m' : 'none')} /> 1분</label>
                  <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={autoRefreshInterval === '5m'} onChange={(e) => setAutoRefreshInterval(e.target.checked ? '5m' : 'none')} /> 5분</label>
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>사용자 이메일</th>
                    <th style={{ padding: '8px' }}>접속 IP</th>
                    <th style={{ padding: '8px' }}>지역/국가</th>
                    <th style={{ padding: '8px' }}>로그인 시간</th>
                    <th style={{ padding: '8px' }}>접속 매체</th>
                    <th style={{ padding: '8px' }}>세션 강제 종료</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUsersList.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>현재 접속 중인 사용자가 없습니다.</td></tr>
                  ) : (
                    activeUsersList.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: '#4f46e5' }}>{log.user_email}</td>
                        <td style={{ padding: '8px' }}>{log.ip_address || '-'}</td>
                        <td style={{ padding: '8px' }}>{log.location || '대한민국 (Seoul)'}</td>
                        <td style={{ padding: '8px' }}>{new Date(log.login_time).toLocaleString()}</td>
                        <td style={{ padding: '8px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.device}>{log.device || '-'}</td>
                        <td style={{ padding: '8px' }}>
                          <button onClick={() => handleForceLogoutUser(log.id, log.user_email)} style={{ padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                            강제 종료 🚫
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supabase DB 연동 및 권한 확장성이 반영된 "관리자 현황 및 권한 등급 관리" 섹션 */}
          <div style={{ marginBottom: '28px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', margin: 0 }}>👑 관리자 현황 및 권한 등급 관리 (DB 연동 & 기능별 세부 권한 확장)</h3>
              <div style={{ fontSize: '11px', color: '#475569', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                시스템 관리자: <strong>{adminList.filter(a => a.role === 'system_admin').length} / 3명</strong> | 포트폴리오 관리자: <strong>{adminList.filter(a => a.role === 'portfolio_admin').length} / 10명</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', alignItems: 'start' }}>
              <form onSubmit={handleAddAdmin} style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>신규 관리자 DB 등록</h4>
                <input type="email" placeholder="관리자 이메일 입력" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} style={{ padding: '6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                <input type="text" placeholder="관리자 성명/직책" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} style={{ padding: '6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <select value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value)} style={{ padding: '6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}>
                  <option value="portfolio_admin">포트폴리오 관리자 (최대 10명)</option>
                  <option value="system_admin">시스템 관리자 (최대 3명)</option>
                </select>
                <button type="submit" style={{ padding: '6px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                  관리자 DB 추가 ➕
                </button>
              </form>

              <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>성명</th>
                      <th style={{ padding: '8px' }}>이메일</th>
                      <th style={{ padding: '8px' }}>권한 등급 / 세부 권한</th>
                      <th style={{ padding: '8px' }}>관리 (수정/해제)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminList.map((admin) => {
                      const isEditing = editingAdminId === admin.id;
                      const permissions = admin.permissions || { portfolio: 'all', track: 'all', feedback: 'all' };

                      return (
                        <tr key={admin.id} style={{ borderBottom: '1px solid #e2e8f0', background: isEditing ? '#fefce8' : 'transparent' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>
                            {isEditing ? (
                              <input type="text" value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} style={{ padding: '3px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '90px' }} />
                            ) : (
                              admin.name
                            )}
                          </td>
                          <td style={{ padding: '8px', color: '#4f46e5' }}>{admin.email}</td>
                          <td style={{ padding: '8px' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <select value={editAdminRole} onChange={(e) => setEditAdminRole(e.target.value)} style={{ padding: '3px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff' }}>
                                  <option value="portfolio_admin">포트폴리오 관리자</option>
                                  <option value="system_admin">시스템 관리자</option>
                                </select>
                                <div style={{ fontSize: '10px', color: '#475569', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  <span>포트폴리오:</span>
                                  <select value={editPermissions.portfolio} onChange={(e) => setEditPermissions({...editPermissions, portfolio: e.target.value})} style={{ fontSize: '10px' }}>
                                    <option value="all">전체</option>
                                    <option value="read_write">읽기/쓰기</option>
                                    <option value="read">읽기전용</option>
                                    <option value="none">없음</option>
                                  </select>
                                  <span>음원:</span>
                                  <select value={editPermissions.track} onChange={(e) => setEditPermissions({...editPermissions, track: e.target.value})} style={{ fontSize: '10px' }}>
                                    <option value="all">전체</option>
                                    <option value="read_write">읽기/쓰기</option>
                                    <option value="read">읽기전용</option>
                                    <option value="none">없음</option>
                                  </select>
                                  <span>피드백:</span>
                                  <select value={editPermissions.feedback} onChange={(e) => setEditPermissions({...editPermissions, feedback: e.target.value})} style={{ fontSize: '10px' }}>
                                    <option value="all">전체</option>
                                    <option value="read_write">읽기/쓰기</option>
                                    <option value="read">읽기전용</option>
                                    <option value="none">없음</option>
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block', background: admin.role === 'system_admin' ? '#fee2e2' : '#e0e7ff', color: admin.role === 'system_admin' ? '#991b1b' : '#3730a3' }}>
                                  {admin.role === 'system_admin' ? '시스템 관리자' : '포트폴리오 관리자'}
                                </span>
                                <span style={{ fontSize: '10px', color: '#64748b' }}>
                                  📂포트폴리오:{permissions.portfolio} | 🎵음원:{permissions.track} | 💬피드백:{permissions.feedback}
                                </span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => handleSaveEditAdmin(admin.id)} style={{ padding: '3px 8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                                  저장
                                </button>
                                <button onClick={() => setEditingAdminId(null)} style={{ padding: '3px 8px', background: '#94a3b8', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                                  취소
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => handleStartEditAdmin(admin)} style={{ padding: '3px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                                  수정
                                </button>
                                <button onClick={() => handleDeleteAdmin(admin.id, admin.email)} style={{ padding: '3px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                                  해제
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', margin: 0 }}>🔍 사용자 로그인 이력 조회 및 검색</h3>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="text" placeholder="🔍 명칭(이메일/기기) 검색..." value={loginSearchKeyword} onChange={(e) => setLoginSearchKeyword(e.target.value)} style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '150px' }} />
                <input type="text" placeholder="🌍 지역 검색..." value={loginRegionFilter} onChange={(e) => setLoginRegionFilter(e.target.value)} style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="date" value={loginFromDate} onChange={(e) => setLoginFromDate(e.target.value)} style={{ padding: '5px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <span style={{ fontSize: '11px' }}>~</span>
                  <input type="date" value={loginToDate} onChange={(e) => setLoginToDate(e.target.value)} style={{ padding: '5px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px', fontWeight: 'bold', color: '#334155', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <span>조회:</span>
                  {[10, 50, 100].map(cnt => (
                    <label key={cnt} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: loginLimitCount === cnt ? 'bold' : 'normal', color: loginLimitCount === cnt ? '#4f46e5' : '#475569' }}>
                      <input type="radio" name="loginLimit" checked={loginLimitCount === cnt} onChange={() => setLoginLimitCount(cnt)} /> {cnt}건
                    </label>
                  ))}
                </div>
                <button onClick={() => setLoginQueryExecuted(true)} style={{ padding: '6px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
                  조회
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>사용자 이메일</th>
                    <th style={{ padding: '8px' }}>접속 IP</th>
                    <th style={{ padding: '8px' }}>지역/국가</th>
                    <th style={{ padding: '8px' }}>로그인 시간</th>
                    <th style={{ padding: '8px' }}>로그아웃 시간</th>
                    <th style={{ padding: '8px' }}>접속 매체</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLoginLogs.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>검색 조건에 맞는 로그인 이력이 없습니다.</td></tr>
                  ) : (
                    displayedLoginLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{log.user_email}</td>
                        <td style={{ padding: '8px' }}>{log.ip_address || '-'}</td>
                        <td style={{ padding: '8px' }}>{log.location || '대한민국 (Seoul)'}</td>
                        <td style={{ padding: '8px' }}>{log.login_time ? new Date(log.login_time).toLocaleString() : '-'}</td>
                        <td style={{ padding: '8px' }}>{log.logout_time ? new Date(log.logout_time).toLocaleString() : '접속 중'}</td>
                        <td style={{ padding: '8px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.device}>{log.device || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'competitor_monitoring' && isAdmin ? (
        <div style={{ padding: '10px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>🔍 오디오 플랫폼 경쟁사 모니터링 시스템</h2>
            <input type="text" placeholder="🔍 경쟁사 검색..." value={competitorSearchKeyword} onChange={(e) => setCompetitorSearchKeyword(e.target.value)} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '200px' }} />
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>📊 주요 오디오 플랫폼 기능 및 스펙 비교 매트릭스</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>서비스명</th>
                    <th style={{ padding: '8px' }}>멀티트랙 지원</th>
                    <th style={{ padding: '8px' }}>타임스탬프 피드백</th>
                    <th style={{ padding: '8px' }}>클라우드 스토리지</th>
                    <th style={{ padding: '8px' }}>수익화 모델 / 수수료</th>
                    <th style={{ padding: '8px' }}>시장 포지션</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'SoundBetter', multi: '지원 (Pro)', timestamp: 'O (오디오 마커)', storage: '무제한 (Pro)', fee: '중개 수수료 5%', position: '엔지니어/프로듀서 마켓플레이스' },
                    { name: 'Audiio', multi: '지원', timestamp: 'O', storage: '50GB ~ 무제한', fee: '구독형 (월 $14.99)', position: '싱크 라이센싱 & 오디오 포트폴리오' },
                    { name: 'BandLab', multi: '지원 (웹 DAW 연동)', timestamp: 'O (댓글 연동)', storage: '무제한 (클라우드)', fee: '무료 (팁/후원)', position: '소셜 음악 제작 및 협업 플랫폼' },
                    { name: '우리 플랫폼 (현재)', multi: '지원 (멀티트랙 + 웨이브폼)', timestamp: 'O (초단위 정밀 피드백)', storage: 'Supabase 연동', fee: '오픈 베타 / 자체 운영', position: '크리에이터 맞춤형 포트폴리오 & 실시간 피드백' }
                  ]
                  .filter(c => c.name.toLowerCase().includes(competitorSearchKeyword.toLowerCase()))
                  .map((comp, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', background: comp.name.includes('우리') ? '#e0e7ff' : '#fff' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#4f46e5' }}>{comp.name}</td>
                      <td style={{ padding: '8px' }}>{comp.multi}</td>
                      <td style={{ padding: '8px' }}>{comp.timestamp}</td>
                      <td style={{ padding: '8px' }}>{comp.storage}</td>
                      <td style={{ padding: '8px' }}>{comp.fee}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{comp.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', marginBottom: '14px' }}>🎨 각 서비스별 UI 특징 및 장단점 상세 비교 (참고 이미지 연동)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {competitorDetailList
                .filter(item => item.name.toLowerCase().includes(competitorSearchKeyword.toLowerCase()))
                .map((item, index) => (
                  <div key={index} style={{ background: '#fff', border: item.name.includes('우리') ? '2px solid #6366f1' : '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: item.name.includes('우리') ? '#4f46e5' : '#1e293b' }}>
                        {item.name}
                      </span>
                      {item.name.includes('우리') && <span style={{ fontSize: '10px', background: '#6366f1', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Our App</span>}
                    </div>

                    <div style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80px' }}>
                      <span style={{ fontSize: '20px', marginBottom: '4px' }}>🖼️</span>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>{item.imageDescription}</span>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#334155' }}>
                      <strong style={{ color: '#475569', display: 'block', marginBottom: '2px' }}>🖥️ UI 디자인 특징:</strong>
                      {item.uiFeatures}
                    </div>

                    <div style={{ fontSize: '11px' }}>
                      <strong style={{ color: '#10b981', display: 'block', marginBottom: '4px' }}>✅ 장점 (Pros)</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', color: '#334155' }}>
                        {item.pros.map((pro, pIdx) => (<li key={pIdx} style={{ marginBottom: '2px' }}>{pro}</li>))}
                      </ul>
                    </div>

                    <div style={{ fontSize: '11px' }}>
                      <strong style={{ color: '#ef4444', display: 'block', marginBottom: '4px' }}>⚠️ 단점 및 한계 (Cons)</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', color: '#64748b' }}>
                        {item.cons.map((con, cIdx) => (<li key={cIdx} style={{ marginBottom: '2px' }}>{con}</li>))}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>🚨 실시간 경쟁사 업데이트 노트</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {competitorNotes.map((note) => (
                  <div key={note.id} style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ef4444' }}>🏢 {note.competitor}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{note.date}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#334155', margin: 0 }}>{note.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>✍️ 모니터링 메모 및 인사이트 등록</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newCompetitorNote.trim()) return;
                const newItem = {
                  id: Date.now(),
                  competitor: selectedCompetitorTarget,
                  note: newCompetitorNote,
                  date: new Date().toISOString().split('T')[0]
                };
                setCompetitorNotes([newItem, ...competitorNotes]);
                setNewCompetitorNote('');
                alert('경쟁사 모니터링 메모가 등록되었습니다!');
              }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>대상 경쟁사</label>
                  <select value={selectedCompetitorTarget} onChange={(e) => setSelectedCompetitorTarget(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}>
                    <option value="SoundBetter">SoundBetter</option>
                    <option value="Audiio">Audiio</option>
                    <option value="BandLab">BandLab</option>
                    <option value="기타 신규 서비스">기타 신규 서비스</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>특이사항 및 벤치마킹 내용</label>
                  <textarea value={newCompetitorNote} onChange={(e) => setNewCompetitorNote(e.target.value)} placeholder="경쟁사 신기능 출시, 가격 정책 변경 등 내용을 기록하세요..." style={{ width: '100%', height: '70px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', resize: 'none', boxSizing: 'border-box' }} required />
                </div>
                <button type="submit" style={{ padding: '8px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  메모 등록 📝
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : activeTab === 'portfolio' ? (
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
        <div style={{ padding: '10px 0' }}>
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                  🎵 현재 포트폴리오: <span style={{ color: '#4f46e5' }}>{portfolioName} ({portfolioOwnerEmail})</span>
                </h2>
                {isOwner && (
                  <button onClick={handleDeleteCurrentPortfolio} style={{ padding: '5px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
                    삭제
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

                          {c.user_id === user.id && (
                            <button onClick={() => handleDeleteComment(c.id)} style={{ fontSize: '11px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>
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
                            {replies.map((r) => (
                              <div key={r.id} style={{ padding: '6px 8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#4f46e5' }}>↳ {r.author}</span>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>{new Date(r.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {r.user_id === user.id && (
                                      <button onClick={() => handleDeleteComment(r.id)} style={{ fontSize: '9px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}>
                                        삭제
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p style={{ fontSize: '11px', color: '#334155', margin: 0 }}>{r.content}</p>
                              </div>
                            ))}
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