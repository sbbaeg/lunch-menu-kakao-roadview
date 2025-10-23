'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { FilterDialog } from '@/components/FilterDialog';
import { useUserTags } from '@/hooks/useUserTags';
import { AppRestaurant } from '@/lib/types';
import { toast } from 'sonner';
import { Settings, RefreshCw } from 'lucide-react';

export default function RoulettePage() {
    const {
        rouletteItems,
        recommendProcess,
        filters,
        setFilters,
        loading,
        handleRouletteResult,
    } = useAppStore();

    const { userTags } = useUserTags();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);

    const fetchRouletteItems = async () => {
        const result = await recommendProcess(true);
        if (!result.success && result.message) {
            toast.error(result.message);
        }
    };

    useEffect(() => {
        // 페이지에 처음 진입했을 때 룰렛 아이템 로드
        if (rouletteItems.length === 0) {
            fetchRouletteItems();
        }
    }, []);

    const handleSpin = () => {
        if (isSpinning || rouletteItems.length === 0) return;

        setIsSpinning(true);
        const totalItems = rouletteItems.length;
        // 각 아이템이 중앙에 오도록 추가 각도 계산 (포인터가 위쪽을 가리키므로, 첫 아이템의 중앙은 0도)
        const winningNumber = Math.floor(Math.random() * totalItems);
        const baseAngle = 360 / totalItems;
        const targetAngle = -(winningNumber * baseAngle + baseAngle / 2);

        // 최소 5바퀴 + 랜덤 각도
        const randomSpins = 5 + Math.random() * 5;
        const finalRotation = rotation + (360 * randomSpins) + targetAngle;

        setRotation(finalRotation);

        // 애니메이션 시간 후 결과 처리
        setTimeout(() => {
            const winner = rouletteItems[winningNumber];
            setIsSpinning(false);
            toast.success(`🎉 축하합니다! ${winner.placeName}에 당첨되었습니다! 🎉`);
            handleRouletteResult(winner);
            // 여기서 activeTab을 'map'으로 변경하여 지도에서 결과를 보여줄 수 있습니다.
            // useAppStore.getState().setActiveTab('map');
        }, 6000); // transition-duration (5s) + 약간의 여유
    };

    const renderRouletteWheel = () => {
        const itemCount = rouletteItems.length;
        if (itemCount === 0) {
            return <div className="text-muted-foreground">룰렛을 구성할 음식점이 없습니다.</div>;
        }
        const angle = 360 / itemCount;
        const skewY = 90 - angle;

        return rouletteItems.map((item, index) => {
            const itemAngle = angle * index;
            const colors = ['bg-red-100', 'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100', 'bg-indigo-100'];
            const color = colors[index % colors.length];

            return (
                <div
                    key={item.id}
                    className={`absolute w-1/2 h-1/2 origin-bottom-right transform-gpu ${color}`}
                    style={{
                        transform: `rotate(${itemAngle}deg) skewY(-${skewY}deg)`,
                    }}
                >
                    <div 
                        className="absolute w-full h-full flex items-center justify-center text-sm font-semibold text-gray-700 p-2 break-all"
                        style={{ transform: `skewY(${skewY}deg) rotate(${angle / 2}deg)` }}
                    >
                        <span className='truncate'>{item.placeName}</span>
                    </div>
                </div>
            );
        });
    };

    return (
        <>
            <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
                <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">오늘의 룰렛</h1>
                    <div>
                        <Button variant="ghost" size="icon" onClick={fetchRouletteItems} disabled={loading || isSpinning}>
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(true)} disabled={loading || isSpinning}>
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                <main className="flex flex-col items-center justify-center gap-8">
                    <div className="relative w-80 h-80 md:w-96 md:h-96">
                        {/* 포인터 */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 
                            border-l-[15px] border-l-transparent
                            border-r-[15px] border-r-transparent
                            border-t-[25px] border-t-primary z-10"></div>
                        
                        {/* 룰렛 휠 */}
                        <div
                            className="relative w-full h-full rounded-full overflow-hidden border-4 border-primary shadow-lg transition-transform duration-[5s] ease-out"
                            style={{ transform: `rotate(${rotation}deg)` }}
                        >
                            {loading ? (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <p>음식점 목록을 불러오는 중...</p>
                                </div>
                            ) : renderRouletteWheel()}
                        </div>
                    </div>

                    <Button 
                        size="lg" 
                        className="w-64 h-16 text-2xl font-bold shadow-lg transform active:scale-95" 
                        onClick={handleSpin} 
                        disabled={isSpinning || loading || rouletteItems.length < 2}
                    >
                        {isSpinning ? '돌아가는 중...' : '돌리기!'}
                    </Button>
                </main>
            </div>

            <FilterDialog
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                initialFilters={filters}
                onApplyFilters={(newFilters) => {
                    setFilters(newFilters);
                    // 필터 적용 후 자동으로 룰렛 아이템 다시 불러오기
                    setTimeout(fetchRouletteItems, 100);
                }}
                userTags={userTags}
            />
        </>
    );
}
