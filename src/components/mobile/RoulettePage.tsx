'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { FilterDialog } from '@/components/FilterDialog';
import { useUserTags } from '@/hooks/useUserTags';
import { AppRestaurant } from '@/lib/types';
import { toast } from 'sonner';
import { Settings, RefreshCw } from 'lucide-react';

// 룰렛 라이브러리는 클라이언트 사이드에서만 렌더링하도록 dynamic import 합니다.
const Wheel = dynamic(
    () => import("react-custom-roulette").then((mod) => mod.Wheel),
    { ssr: false }
);

interface RouletteOption {
    option: string;
    style?: { backgroundColor?: string; textColor?: string };
}

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
    
    // 룰렛 라이브러리 상태
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);

    const fetchRouletteItems = async () => {
        const result = await recommendProcess(true);
        if (!result.success && result.message) {
            toast.error(result.message);
        }
    };

    useEffect(() => {
        if (rouletteItems.length === 0) {
            fetchRouletteItems();
        }
    }, []);

    // 룰렛 데이터를 라이브러리 형식에 맞게 변환
    const rouletteData: RouletteOption[] = rouletteItems.map((item, index) => {
        const colors = ['#FFDDC1', '#D4F1F4', '#E1F7D5', '#FEEFDD', '#E4D9FF', '#D9E4FF'];
        return {
            option: item.placeName.length > 10 ? item.placeName.substring(0, 10) + '..' : item.placeName,
            style: {
                backgroundColor: colors[index % colors.length],
                textColor: "#333333",
            },
        };
    });

    const handleSpinClick = () => {
        if (mustSpin || rouletteItems.length < 2) return;
        const newPrizeNumber = Math.floor(Math.random() * rouletteItems.length);
        setPrizeNumber(newPrizeNumber);
        setMustSpin(true);
    };

    const handleStopSpinning = () => {
        setMustSpin(false);
        const winner = rouletteItems[prizeNumber];
        toast.success(`🎉 축하합니다! ${winner.placeName}에 당첨되었습니다! 🎉`);
        handleRouletteResult(winner);
        // 1초 후 지도 탭으로 이동하여 결과 확인
        setTimeout(() => {
            useAppStore.getState().setActiveTab('map');
        }, 1000);
    };

    return (
        <>
            <div className="h-full w-full flex flex-col p-4 bg-gray-50 dark:bg-gray-900">
                <header className="p-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">오늘의 룰렛</h1>
                    <div>
                        <Button variant="ghost" size="icon" onClick={fetchRouletteItems} disabled={loading || mustSpin}>
                            <RefreshCw className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(true)} disabled={loading || mustSpin}>
                            <Settings className="h-6 w-6" />
                        </Button>
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-start gap-8 min-h-0 pt-8">
                    <div className="relative w-80 h-80 md:w-96 md:h-96">
                        {rouletteData.length > 0 ? (
                            <Wheel
                                mustStartSpinning={mustSpin}
                                prizeNumber={prizeNumber}
                                data={rouletteData}
                                onStopSpinning={handleStopSpinning}
                                outerBorderColor={"#e2e8f0"}
                                outerBorderWidth={5}
                                radiusLineColor={"#e2e8f0"}
                                radiusLineWidth={2}
                                fontSize={14}
                                textDistance={60}
                            />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full">
                                <p className="text-muted-foreground text-center px-4">
                                    {loading ? '음식점 목록을 불러오는 중...' : '룰렛을 구성할 음식점이 없습니다.'}
                                </p>
                            </div>
                        )}
                    </div>

                    <Button 
                        size="lg" 
                        className="w-64 h-16 text-2xl font-bold shadow-lg transform active:scale-95" 
                        onClick={handleSpinClick} 
                        disabled={mustSpin || loading || rouletteItems.length < 2}
                    >
                        {mustSpin ? '돌아가는 중...' : '돌리기!'}
                    </Button>
                </main>
            </div>

            <FilterDialog
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                initialFilters={filters}
                onApplyFilters={(newFilters) => {
                    setFilters(newFilters);
                    setTimeout(fetchRouletteItems, 100);
                }}
                userTags={userTags}
            />
        </>
    );
}