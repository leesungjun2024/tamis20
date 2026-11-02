import { _supabase } from '../supabaseClient.js'; // Supabase 클라이언트 임포트

/**
 * [Read] 사용자의 작업방(포트폴리오/룸) 목록 조회
 * @param {string} userId - 현재 로그인한 사용자의 UUID
 */
export async function fetchUserRooms(userId) {
    const { data, error } = await _supabase
        .from('portfolios') // 또는 rooms 테이블명
        .select(`
            *,
            tracks(*),
            feedbacks(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('작업방 조회 오류:', error.message);
        throw new Error('작업방 목록을 불러오지 못했습니다.');
    }
    return data || [];
}

/**
 * [Create]새로운 작업방 생성
 * @param {Object} roomData - { title, genre, cover, status, people, user_id }
 */
export async function createRoom(roomData) {
    const { data, error } = await _supabase
        .from('portfolios')
        .insert([
            {
                title: roomData.title,
                genre: roomData.genre || 'Work in progress',
                cover: roomData.cover || 'blue-hour',
                status: roomData.status || 'progress',
                people: roomData.people || [],
                user_id: roomData.user_id,
                created_at: new Date()
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('작업방 생성 오류:', error.message);
        throw new Error('작업방을 생성하지 못했습니다.');
    }
    return data;
}

/**
 * [Update] 작업방 정보 수정 (상태 변경, 제목 수정 등)
 * @param {string} roomId 
 * @param {Object} updates - 수정할 필드 객체
 */
export async function updateRoom(roomId, updates) {
    const { data, error } = await _supabase
        .from('portfolios')
        .update(updates)
        .eq('id', roomId)
        .select()
        .single();

    if (error) {
        console.error('작업방 수정 오류:', error.message);
        throw new Error('작업방 정보를 수정하지 못했습니다.');
    }
    return data;
}

/**
 * [Delete] 작업방 삭제
 * @param {string} roomId 
 */
export async function deleteRoom(roomId) {
    const { error } = await _supabase
        .from('portfolios')
        .delete()
        .eq('id', roomId);

    if (error) {
        console.error('작업방 삭제 오류:', error.message);
        throw new Error('작업방을 삭제하지 못했습니다.');
    }
    return true;
}

/**
 * [Storage & Track] 음원 파일 업로드 및 트랙 레코드 추가
 * @param {File} file - 업로드할 MP3 파일 객체
 * @param {string} roomId - 연결된 작업방 ID
 * @param {string} versionLabel - 버전 이름 (예: 'v1', 'v2')
 */
export async function uploadAndCreateTrack(file, roomId, versionLabel = 'v1') {
    // 1. 파일 이름 정제 및 경로 설정
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36.substring(2, 7))}.${fileExt}`;
    const filePath = `${roomId}/${fileName}`;

    // 2. Supabase Storage ('audio_files' 버킷) 업로드
    const { error: uploadError } = await _supabase.storage
        .from('audio_files')
        .upload(filePath, file);

    if (uploadError) {
        console.error('파일 업로드 실패:', uploadError.message);
        throw new Error('음원 파일을 스토리지에 업로드하지 못했습니다.');
    }

    // 3. 업로드된 파일의 Public URL 획득
    const { data: { publicUrl } } = _supabase.storage
        .from('audio_files')
        .getPublicUrl(filePath);

    // 4. tracks 테이블에 메타데이터 저장
    const { data: trackData, error: trackError } = await _supabase
        .from('tracks')
        .insert([
            {
                portfolio_id: roomId,
                label: versionLabel,
                filename: file.name,
                file_url: publicUrl,
                duration: 48, // 필요시 오디오 디코딩을 통한 실제 duration 입력 가능
                local_file: true,
                created_at: new Date()
            }
        ])
        .select()
        .single();

    if (trackError) {
        console.error('트랙 데이터 저장 실패:', trackError.message);
        throw new Error('음원 정보를 데이터베이스에 기록하지 못했습니다.');
    }

    return trackData;
}