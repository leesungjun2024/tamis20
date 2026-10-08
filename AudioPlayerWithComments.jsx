import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

// 초(second)를 'MM:SS' 형식으로 변환하는 헬퍼 함수
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `\({mins}:\){secs < 10 ? '0' : ''}${secs}`;
};

export default function AudioPlayerWithComments() {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // 타임스탬프 코멘트 상태 리스트
  const [comments, setComments] = useState([
    { id: 1, time: 15.5, author: '프로듀서A', text: '여기 킥 드럼 사운드 펀치감 좋네요!' },
    { id: 2, time: 42.1, author: '보컬B', text: '이 구간 코러스 화음 살짝 키워주세요.' },
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  // 1. WaveSurfer 초기화 및 이벤트 바인딩
  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // 테스트용 음원 URL
      waveColor: '#d1d5db', // 기본 파형 색상 (Gray-300)
      progressColor: '#6366f1', // 재생된 파형 색상 (Indigo-500)
      cursorColor: '#4f46e5',
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 80,
    });

    wavesurferRef.current = ws;

    // 음원 로드 완료 시 총 재생 시간 설정
    ws.on('ready', () => {
      setDuration(ws.getDuration());
    });

    // 재생 중 실시간으로 현재 시간 업데이트
    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    // 사용자가 파형을 마우스로 클릭해 시크(Seek)했을 때
    ws.on('interaction', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    // 컴포넌트 언마운트 시 인스턴스 정리
    return () => {
      ws.destroy();
    };
  }, []);

  // 재생 / 일시정지 토글
  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  // 특정 타임스탬프로 이동 (코멘트 클릭 시)
  const handleSeekToTime = (seconds) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setTime(seconds);
      wavesurferRef.current.play(); // 클릭 시 바로 재생 (선택사항)
    }
  };

  // 현재 재생 중인 위치에 새 코멘트 추가
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !wavesurferRef.current) return;

    const current = wavesurferRef.current.getCurrentTime();
    const newComment = {
      id: Date.now(),
      time: current,
      author: '나 (로그인 유저)',
      text: newCommentText,
    };

    // 시간 순으로 정렬되도록 추가
    setComments((prev) => [...prev, newComment].sort((a, b) => a.time - b.time));
    setNewCommentText('');
  };

  return (