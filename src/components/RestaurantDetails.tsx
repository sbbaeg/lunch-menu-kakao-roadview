// src/components/RestaurantDetails.tsx
"use client";

import { AppRestaurant } from "@/lib/types";
import { Session } from "next-auth";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react'; // useEffect 추가됨
import { RestaurantActionButtons } from "./RestaurantActionButtons";
import { RestaurantPreviewContent } from "./RestaurantPreviewContent";
import { usePwaDisplayMode } from "@/hooks/usePwaDisplayMode";
import { useAppStore } from "@/store/useAppStore";
import { Button } from '@/components/ui/button'; // Button 추가됨
import { ThumbsUp, ThumbsDown } from 'lucide-react'; // 아이콘 추가됨
import { VoteType } from '@prisma/client'; // VoteType 추가됨

// 1. 인터페이스 수정: 좋아요/싫어요 관련 props 추가됨
interface RestaurantDetailsProps {
  restaurant: AppRestaurant;
  session: Session | null;
  isFavorite?: (id: string) => boolean;
  isBlacklisted?: (id: string) => boolean;
  onToggleFavorite?: (restaurant: AppRestaurant) => void;
  onToggleBlacklist?: (restaurant: AppRestaurant) => void;
  onTagManagement?: (restaurant: AppRestaurant) => void;
  hideViewDetailsButton?: boolean;
  onNavigate?: () => void;

  likeCount?: number;   // 좋아요 수 (옵셔널)
  dislikeCount?: number; // 싫어요 수 (옵셔널)
  likePercentage?: number | null; // 좋아요 비율 (옵셔널)
}

export function RestaurantDetails(props: RestaurantDetailsProps) {
  // 2. props 분해: 새로 추가된 props 받도록 수정됨
  const {
    restaurant,
    session, // session은 props에서 직접 받음
    likeCount: initialLikeCount,   // 초기 좋아요 수
    dislikeCount: initialDislikeCount, // 초기 싫어요 수
    likePercentage,                // 좋아요 비율
    // ... 나머지 props는 아래에서 사용하거나 RestaurantActionButtons로 전달
  } = props;

  const router = useRouter(); //
  const [isNavigating, setIsNavigating] = useState(false); //
  const { isStandalone } = usePwaDisplayMode(); //
  const showRestaurantDetail = useAppStore((state) => state.showRestaurantDetail); //

  // 3. State 추가: 좋아요/싫어요 상태 관리 (Optimistic UI용)
  const [localLikeCount, setLocalLikeCount] = useState(initialLikeCount ?? 0);
  const [localDislikeCount, setLocalDislikeCount] = useState(initialDislikeCount ?? 0);
  const [currentUserVote, setCurrentUserVote] = useState<VoteType | null>(null); // 현재 사용자 투표 상태
  const [isVoting, setIsVoting] = useState(false);

  // 4. useEffect 추가: 컴포넌트 마운트/업데이트 시 상태 초기화
  useEffect(() => {
    // TODO: 실제로는 restaurant 객체에 currentUserVote 포함시켜 전달받는 것이 더 효율적
    setCurrentUserVote(restaurant.currentUserVote ?? null);

    // props로 받은 초기 카운트로 로컬 state 설정
    setLocalLikeCount(initialLikeCount ?? 0);
    setLocalDislikeCount(initialDislikeCount ?? 0);

    // (현재 사용자 투표 상태를 가져오는 로직이 필요하다면 여기에 추가)
    // 예: fetch(`/api/restaurants/${restaurant.dbId}/vote/status`).then(...)

  }, [restaurant.id, initialLikeCount, initialDislikeCount]); // restaurant.id가 바뀌면 상태 재설정

  // 기존 handleViewDetails 함수 (변경 없음)
  const handleViewDetails = async () => {
    setIsNavigating(true); //
    try {
      await fetch('/api/restaurants', { //
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurant),
      });

      if (props.onNavigate) props.onNavigate(); //

      if (isStandalone) { //
        showRestaurantDetail(restaurant.id); //
      } else {
        router.push(`/restaurants/${restaurant.id}`); //
      }
    } catch (error) {
      console.error("Failed to navigate to details page:", error); //
      alert("상세 페이지로 이동하는 데 실패했습니다."); //
      setIsNavigating(false); //
    }
  };

  // 5. 함수 추가: 투표 처리 핸들러
  const handleVote = async (voteType: VoteType) => {
    // 로그인 안 했거나, 투표 진행 중이거나, DB ID 없으면 중단
    if (!session || isVoting || !restaurant.dbId) return;
    setIsVoting(true); // 로딩 시작

    // 현재 상태 저장 (오류 시 롤백용)
    const originalState = {
      likes: localLikeCount,
      dislikes: localDislikeCount,
      vote: currentUserVote
    };

    // Optimistic UI: 먼저 화면부터 업데이트
    let likeIncrement = 0;
    let dislikeIncrement = 0;
    let nextVote: VoteType | null = null;

    if (currentUserVote === voteType) { // 같은 버튼 다시 누름 (투표 취소)
      if (voteType === 'UPVOTE') likeIncrement = -1; else dislikeIncrement = -1;
      nextVote = null;
    } else { // 새 투표 또는 다른 버튼 누름 (투표 변경)
      if (currentUserVote === 'UPVOTE') likeIncrement = -1; // 이전 좋아요 취소
      if (currentUserVote === 'DOWNVOTE') dislikeIncrement = -1; // 이전 싫어요 취소
      if (voteType === 'UPVOTE') likeIncrement = 1; else dislikeIncrement = 1; // 새 투표 반영
      nextVote = voteType;
    }
    // 로컬 state 업데이트
    setLocalLikeCount(c => c + likeIncrement);
    setLocalDislikeCount(c => c + dislikeIncrement);
    setCurrentUserVote(nextVote);

    try {
      // 실제 API 호출 (DB ID 사용)
      const response = await fetch(`/api/restaurants/${restaurant.dbId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) throw new Error('Vote failed'); // 실패 시 catch 블록으로 이동

      // (선택 사항) API 응답값으로 상태를 다시 동기화할 수 있음
      // const result = await response.json();
      // setLocalLikeCount(result.likeCount);
      // setLocalDislikeCount(result.dislikeCount);
      // setCurrentUserVote(result.currentUserVote);

    } catch (error) {
      // API 호출 실패 시 Optimistic UI 롤백
      setLocalLikeCount(originalState.likes);
      setLocalDislikeCount(originalState.dislikes);
      setCurrentUserVote(originalState.vote);
      alert('투표 처리에 실패했습니다.'); // 사용자에게 오류 알림
    } finally {
      setIsVoting(false); // 로딩 종료
    }
  };

  return (
    <div
      className="px-4 pb-4 text-sm space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 기존 카테고리 및 액션 버튼 (변경 없음) */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-500">
          {restaurant.categoryName?.split('>').pop()?.trim()}
        </p>
        {props.session?.user &&
          props.isFavorite &&
          props.isBlacklisted &&
          props.onToggleFavorite &&
          props.onToggleBlacklist &&
          props.onTagManagement && <RestaurantActionButtons {...props} />}
      </div>
      {/* ⬆️ 기존 코드 끝 */}

      {/* ⬇️ 6. JSX 추가: 좋아요/싫어요 표시 및 버튼 영역 (RestaurantActionButtons 다음) */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t mt-3">
        {/* 왼쪽: 통계 표시 */}
        <div className="flex items-center gap-3 text-muted-foreground">
          {likePercentage !== null ? ( // 평가가 있을 때만 표시
            <>
              {/* 좋아요 비율 */}
              <div className="flex items-center gap-1" title="좋아요 비율">
                <ThumbsUp className="h-4 w-4 text-sky-500" />
                <span className="font-medium text-foreground">{likePercentage}%</span>
              </div>
              {/* 좋아요 수 */}
              <div className="flex items-center gap-1 text-xs" title="좋아요 수">
                <ThumbsUp className="h-3 w-3" /> {localLikeCount}
              </div>
              {/* 싫어요 수 */}
              <div className="flex items-center gap-1 text-xs" title="싫어요 수">
                <ThumbsDown className="h-3 w-3" /> {localDislikeCount}
              </div>
            </>
          ) : ( // 평가가 없을 때
            <span className="text-xs">아직 평가가 없습니다.</span>
          )}
        </div>

        {/* 오른쪽: 투표 버튼 */}
        <div className="flex gap-1">
          {/* 좋아요 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote('UPVOTE')} // 핸들러 연결
            disabled={!session || isVoting} // 로그인 안 했거나 로딩 중이면 비활성화
            // 현재 투표 상태에 따라 스타일 변경
            className={`gap-1 ${currentUserVote === 'UPVOTE' ? 'bg-primary/10 border-primary text-primary' : ''}`}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          {/* 싫어요 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote('DOWNVOTE')} // 핸들러 연결
            disabled={!session || isVoting} // 로그인 안 했거나 로딩 중이면 비활성화
            // 현재 투표 상태에 따라 스타일 변경
            className={`gap-1 ${currentUserVote === 'DOWNVOTE' ? 'bg-destructive/10 border-destructive text-destructive' : ''}`}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* ⬆️ 6. JSX 추가 끝 */}


      {/* 기존 RestaurantPreviewContent (변경 없음) */}
      <RestaurantPreviewContent
        restaurant={restaurant}
        isNavigating={isNavigating}
        onViewDetails={handleViewDetails}
        showViewDetailsButton={!props.hideViewDetailsButton}
      />
      {/* ⬆️ 기존 코드 끝 */}
    </div>
  );
}