import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from './supabaseClient';

// 초(second)를 'MM:SS' 형식으로 변환하는 헬퍼 함수
const formatTime = (seconds) => {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function AudioPlayerWithComments() {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);

  const [projectName, setProjectName] = useState('나의 새 프로젝트');
  const [tracks, setTracks] = useState([
    { id: 't1', title: '보컬 1 (내 파일)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', uploader: 'mine', order: 1 },
    { id: 't2', title: '보컬 2 (팀원 파일)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', uploader: 'team', order: 2 },
  ]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [feedbackAuthor, setFeedbackAuthor] = useState('팀원');
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [commentText, setCommentText] = useState('');

  const [feedbacks, setFeedbacks] = useState([
    { id: 1, startTime: 10.0, endTime: 15.5, author: '프로듀서A', text: '이 구간 확인해주세요', trackTitle: '보컬 1 (내 파일)' }
  ]);

  useEffect(() => {
    if (!containerRef.current || tracks.length === 0) return;

    const currentTrack = tracks[currentTrackIndex];
    if (!currentTrack) return;

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: currentTrack.url,
      waveColor: '#cbd5e1',
      progressColor: '#4f46e5',
      cursorColor: '#312e81',
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 70,
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => {
      setDuration(ws.getDuration());
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('interaction', () => {
      const clickedTime = ws.getCurrentTime();
      setCurrentTime(clickedTime);
      setStartTime(parseFloat(clickedTime.toFixed(2)));
      setEndTime(parseFloat(clickedTime.toFixed(2)));
      setSelectedTrackId(currentTrack.id);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    ws.on('finish', () => {
      if (currentTrackIndex < tracks.length - 1) {
        setCurrentTrackIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    });

    return () => {
      ws.destroy();
    };
  }, [currentTrackIndex, tracks]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleMoveTrack = (index, direction) => {
    const newTracks = [...tracks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTracks.length) return;

    const temp = newTracks[index];
    newTracks[index] = newTracks[targetIndex];
    newTracks[targetIndex] = temp;

    newTracks.forEach((t, idx) => { t.order = idx + 1; });
    setTracks(newTracks);
    setCurrentTrackIndex(0);
  };

  const handleS3MultipleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newUploadedTracks = files.map((file, idx) => ({
      id: `upload_${Date.now()}_${idx}`,
      title: file.name,
      url: URL.createObjectURL(file),
      uploader: 'mine',
      order: tracks.length + idx + 1
    }));

    setTracks((prev) => [...prev, ...newUploadedTracks]);
    alert(`${files.length}개의 파일이 성공적으로 추가되었습니다.`);
  };

  const handleAddFeedback = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const targetTrack = tracks.find(t => t.id === selectedTrackId) || tracks[currentTrackIndex];

    const newFeedback = {
      id: Date.now(),
      startTime: parseFloat(startTime),
      endTime: parseFloat(endTime),
      author: feedbackAuthor,
      text: commentText,
      trackTitle: targetTrack.title
    };

    setFeedbacks((prev) => [...prev, newFeedback].sort((a, b) => a.startTime - b.startTime));
    setCommentText('');
  };

  const handleSeekRange = (start) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setTime(start);
      wavesurferRef.current.play();
    }
  };

  const handleSaveProject = async () => {
    try {
      const { data: projData, error: projError } = await supabase
        .from('projects')
        .insert([{ project_name: projectName }])
        .select()
        .single();

      if (projError) throw projError;
      const projectId = projData.id;

      const trackPayloads = tracks.map(t => ({
        project_id: projectId,
        title: t.title,
        audio_url: t.url,
        uploader_type: t.uploader,
        track_order: t.order
      }));
      await supabase.from('tracks').insert(trackPayloads);

      alert(`"${projectName}" 프로젝트가 Supabase에 저장되었습니다!`);
    } catch (err) {
      console.error(err);
      alert('프로젝트 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 rounded-xl shadow-md space-y-6">
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center space-x-3">
          <label className="font-bold text-gray-700">프로젝트명:</label>
          <input 
            type="text" 
            value={projectName} 
            onChange={(e) => setProjectName(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 font-semibold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center space-x-3">
          <label className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg cursor-pointer font-medium border border-indigo-200 hover:bg-indigo-100 transition">
            📁 S3 음원 다중 업로드
            <input type="file" multiple accept="audio/*" onChange={handleS3MultipleUpload} className="hidden" />
          </label>
          <button 
            onClick={handleSaveProject}
            className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition shadow"
          >
            💾 프로젝트 저장
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">🎵 멀티트랙 순차 재생 스튜디오</h2>
            <p className="text-sm text-gray-500">현재 재생 중: <span className="font-semibold text-indigo-600">{tracks[currentTrackIndex]?.title}</span></p>
          </div>
          <div>
            <button 
              onClick={handlePlayPause}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow"
            >
              {isPlaying ? '⏸ 일시정지' : '▶ 전체 순차 재생'}
            </button>
          </div>
          <div className="text-lg font-mono font-bold text-gray-700">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div ref={containerRef} className="bg-gray-100 p-2 rounded-lg border border-gray-200" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">🎚️ 트랙 구성 및 순서 설정</h3>
        <div className="space-y-2">
          {tracks.map((track, index) => (
            <div key={track.id} className={`flex items-center justify-between p-3 rounded-lg border ${index === currentTrackIndex ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center space-x-3">
                <span className="font-bold text-gray-500 w-6">#{index + 1}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${track.uploader === 'mine' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {track.uploader === 'mine' ? '내 파일' : '팀원 파일'}
                </span>
                <span className="font-medium text-gray-800">{track.title}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentTrackIndex(index)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded font-medium text-gray-700"
                >
                  선택 재생
                </button>
                <button 
                  onClick={() => handleMoveTrack(index, 'up')}
                  disabled={index === 0}
                  className="px-2.5 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30"
                >
                  ⬆️ 위로
                </button>
                <button 
                  onClick={() => handleMoveTrack(index, 'down')}
                  disabled={index === tracks.length - 1}
                  className="px-2.5 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30"
                >
                  ⬇️ 아래로
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleAddFeedback} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-lg font-bold text-gray-800">💬 미세 구간 타임라인 피드백 남기기</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">작성자 이름</label>
              <input 
                type="text" 
                value={feedbackAuthor} 
                onChange={(e) => setFeedbackAuthor(e.target.value)}
                className="w-full border rounded p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">대상 트랙</label>
              <select 
                value={selectedTrackId} 
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full border rounded p-2 text-sm bg-white"
              >
                {tracks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">시작점 (초)</label>
              <input 
                type="number" 
                step="0.1" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border rounded p-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">종료점 (초)</label>
              <input 
                type="number" 
                step="0.1" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border rounded p-2 text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">의견 내용</label>
            <textarea 
              rows="3" 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="의견을 적어주세요..."
              className="w-full border rounded p-2 text-sm"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition shadow"
          >
            실시간 공유하기 🚀
          </button>
        </form>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[420px]">
          <h3 className="text-lg font-bold text-gray-800 mb-3">📋 실시간 타임라인 피드백 ({feedbacks.length})</h3>
          <div className="overflow-y-auto space-y-3 flex-1 pr-1">
            {feedbacks.map((fb) => (
              <div 
                key={fb.id} 
                onClick={() => handleSeekRange(fb.startTime)}
                className="p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg cursor-pointer transition space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-indigo-600">{fb.author} <span className="text-gray-400 font-normal">({fb.trackTitle})</span></span>
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded font-mono">
                    {formatTime(fb.startTime)} ~ {formatTime(fb.endTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{fb.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}