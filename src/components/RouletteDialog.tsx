import { useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppRestaurant } from "@/lib/types";

// 룰렛 라이브러리는 클라이언트 사이드에서만 렌더링하도록 dynamic import 합니다.
const Wheel = dynamic(
    () => import("react-custom-roulette").then((mod) => mod.Wheel),
    { ssr: false }
);

interface RouletteOption {
    option: string;
    style?: { backgroundColor?: string; textColor?: string };
}

interface RouletteDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    items: AppRestaurant[];
    onResult: (winner: AppRestaurant) => void;
}

export function RouletteDialog({ isOpen, onOpenChange, items, onResult }: RouletteDialogProps) {
    // 룰렛의 내부 상태(스핀 여부, 당첨 번호)를 컴포넌트가 직접 관리합니다.
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);

    // 룰렛 데이터를 props로 받은 items로부터 생성합니다.
    const rouletteData: RouletteOption[] = items.map((item, index) => {
        const colors = [
            "#FF6B6B", "#FFD966", "#96F291", "#66D9E8", "#63A4FF", "#f9a8d4",
            "#d9a8f9", "#f3a683", "#a29bfe", "#e17055", "#00b894", "#74b9ff",
            "#ff7675", "#fdcb6e", "#55efc4",
        ];
        return {
            option: item.placeName,
            style: {
                backgroundColor: colors[index % colors.length],
                textColor: "#333333",
            },
        };
    });

    const handleSpinClick = () => {
        if (mustSpin) return;
        const newPrizeNumber = Math.floor(Math.random() * items.length);
        setPrizeNumber(newPrizeNumber);
        setMustSpin(true);
    };

    const handleStopSpinning = () => {
        setMustSpin(false);
        setTimeout(() => {
            onOpenChange(false); // 다이얼로그 닫기
            const winner = items[prizeNumber];
            onResult(winner); // 부모 컴포넌트에 당첨 결과 전달
        }, 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-6">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl mb-4">
                        룰렛을 돌려 오늘 점심을 선택하세요!
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col justify-center items-center space-y-6">
                    {rouletteData.length > 0 && (
                        <div className="w-full max-w-[400px]">
                            <Wheel
                                mustStartSpinning={mustSpin}
                                prizeNumber={prizeNumber}
                                data={rouletteData}
                                onStopSpinning={handleStopSpinning}
                                outerBorderWidth={3}
                                radiusLineWidth={3}
                                fontSize={14}
                            />
                        </div>
                    )}
                    <Button
                        onClick={handleSpinClick}
                        disabled={mustSpin}
                        className="w-full max-w-[150px]"
                    >
                        돌리기
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}