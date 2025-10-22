"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Star } from "lucide-react";

interface TagHeaderProps {
    tagData: {
        name: string;
        creator: { id: string; name: string | null };
        subscriberCount: number;
        restaurantCount: number;
        isSubscribed: boolean;
    };
    onSubscribe: () => void;
    onShare: () => void;
}

export function TagHeader({ tagData, onSubscribe, onShare }: TagHeaderProps) {
    const router = useRouter();
    const { data: session, status } = useSession();

    return (
        <header className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="w-fit p-0 h-auto text-muted-foreground mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                뒤로가기
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-2xl font-bold">{tagData.name}</h1>
                        <span className="text-sm text-muted-foreground">by {tagData.creator.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        맛집 {tagData.restaurantCount}개 ・ 구독자 {tagData.subscriberCount}명
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {status === 'authenticated' && tagData.creator.id !== session?.user?.id && (
                        <Button onClick={onSubscribe} variant={tagData.isSubscribed ? "default" : "outline"}>
                            <Star className={`mr-2 h-4 w-4 ${tagData.isSubscribed ? "fill-white dark:fill-black" : ""}`} />
                            {tagData.isSubscribed ? '구독중' : '구독하기'}
                        </Button>
                    )}
                    <Button variant="secondary" onClick={onShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        공유
                    </Button>
                </div>
            </div>
        </header>
    );
}