'use client';

import { useEffect, useRef, useState } from 'react';

interface RoadviewProps {
  lat: number;
  lng: number;
}

declare global {
    interface Window {
      kakao: any;
    }
}

const Roadview = ({ lat, lng }: RoadviewProps) => {
  const container = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      setMessage('카카오맵 API를 로드하는 중이거나, 로드에 실패했습니다.');
      return;
    }

    const roadviewContainer = container.current;
    if (!roadviewContainer) return;

    const timerId = setTimeout(() => {
      roadviewContainer.innerHTML = ''; // 이전 메시지나 로드뷰를 초기화합니다.
      const roadview = new window.kakao.maps.Roadview(roadviewContainer);
      const roadviewClient = new window.kakao.maps.RoadviewClient();
      const position = new window.kakao.maps.LatLng(lat, lng);

      roadviewClient.getNearestPanoId(position, 50, (panoId: number | null) => {
        if (panoId) {
          roadview.setPanoId(panoId, position);
        } else {
          setMessage('해당 위치에 로드뷰가 제공되지 않습니다.');
        }
      });
    }, 100); 

    return () => clearTimeout(timerId);

  }, [lat, lng]);

  return (
    <div ref={container} style={{ width: '100%', height: '100%' }}>
      {message && (
        <div className="flex items-center justify-center h-full bg-gray-100 text-gray-600 rounded-md">
          {message}
        </div>
      )}
    </div>
  );
};

export default Roadview;