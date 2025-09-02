'use client';

import { useEffect, useRef, useState } from 'react';

// Vercel 환경 변수에서 API 키 불러오기
const KAKAO_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;

const Roadview = ({ lat, lng }) => {
  const roadviewRef = useRef(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Kakao Maps SDK 스크립트를 동적으로 로드
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&libraries=services`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        const roadviewContainer = roadviewRef.current;
        const roadview = new window.kakao.maps.Roadview(roadviewContainer);
        const roadviewClient = new window.kakao.maps.RoadviewClient();

        const position = new window.kakao.maps.LatLng(lat, lng);
        
        roadviewClient.getNearestPanoId(position, 50, (panoId) => {
          if (panoId) {
            roadview.setPanoId(panoId, position);
            setMessage('');
          } else {
            setMessage('해당 위치에 로드뷰가 제공되지 않습니다.');
          }
        });
      } else {
        setMessage('카카오맵 API 로드에 실패했습니다. 키를 확인하거나 Vercel 배포 환경을 확인해주세요.');
      }
    };
  }, [lat, lng]);

  return (
    <div className="flex flex-col gap-2">
      {message && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {message}
        </div>
      )}
      <div id="roadview-container" ref={roadviewRef} className="w-full h-[300px] rounded-md shadow-md"></div>
    </div>
  );
};

export default Roadview;
