"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const badges = [
    // 1. 활동 (User Actions)
    // 리뷰
    { name: '첫 발자국', description: '첫 리뷰 작성', iconUrl: '/badges/activity-review-bronze.svg', tier: 'BRONZE', category: 'ACTIVITY' },
    { name: '리뷰어', description: '리뷰 10개 작성', iconUrl: '/badges/activity-review-silver.svg', tier: 'SILVER', category: 'ACTIVITY' },
    { name: '프로 리뷰어', description: '리뷰 50개 작성', iconUrl: '/badges/activity-review-gold.svg', tier: 'GOLD', category: 'ACTIVITY' },
    // 태그 생성
    { name: '태그 개척자', description: '첫 태그 생성', iconUrl: '/badges/activity-tag-create-bronze.svg', tier: 'BRONZE', category: 'ACTIVITY' },
    { name: '태그 전문가', description: '태그 10개 생성', iconUrl: '/badges/activity-tag-create-silver.svg', tier: 'SILVER', category: 'ACTIVITY' },
    { name: '태그 장인', description: '태그 50개 생성', iconUrl: '/badges/activity-tag-create-gold.svg', tier: 'GOLD', category: 'ACTIVITY' },
    // 기능 사용
    { name: '운명론자', description: '룰렛 기능 10회 사용', iconUrl: '/badges/activity-roulette-bronze.svg', tier: 'BRONZE', category: 'ACTIVITY' },
    { name: '운명의 탐구자', description: '룰렛 기능 50회 사용', iconUrl: '/badges/activity-roulette-silver.svg', tier: 'SILVER', category: 'ACTIVITY' },
    { name: '운명의 지배자', description: '룰렛 기능 200회 사용', iconUrl: '/badges/activity-roulette-gold.svg', tier: 'GOLD', category: 'ACTIVITY' },
    // 2. 평판 (Reputation)
    // 리뷰 평판
    { name: '주목받는 리뷰', description: '한 개의 리뷰가 \'좋아요\' 10개 획득', iconUrl: '/badges/reputation-review-bronze.svg', tier: 'BRONZE', category: 'REPUTATION' },
    { name: '베스트 리뷰', description: '한 개의 리뷰가 \'좋아요\' 50개 획득', iconUrl: '/badges/reputation-review-silver.svg', tier: 'SILVER', category: 'REPUTATION' },
    { name: '명예의 전당', description: '한 개의 리뷰가 \'좋아요\' 100개 획득', iconUrl: '/badges/reputation-review-gold.svg', tier: 'GOLD', category: 'REPUTATION' },
    // 태그 평판
    { name: '주목받는 태그', description: '내가 만든 태그가 구독자 10명 달성', iconUrl: '/badges/reputation-tag-bronze.svg', tier: 'BRONZE', category: 'REPUTATION' },
    { name: '유명 태그', description: '내가 만든 태그가 구독자 25명 달성', iconUrl: '/badges/reputation-tag-silver.svg', tier: 'SILVER', category: 'REPUTATION' },
    { name: '인기 태그 마스터', description: '내가 만든 태그가 구독자 50명 달성', iconUrl: '/badges/reputation-tag-gold.svg', tier: 'GOLD', category: 'REPUTATION' },
    // 3. 수집 (Collection)
    { name: '탐험가', description: '태그 10개 구독', iconUrl: '/badges/collection-subscribe-bronze.svg', tier: 'BRONZE', category: 'COLLECTION' },
    { name: '큐레이터', description: '태그 50개 구독', iconUrl: '/badges/collection-subscribe-silver.svg', tier: 'SILVER', category: 'COLLECTION' },
    { name: '지식의 보고', description: '태그 150개 구독', iconUrl: '/badges/collection-subscribe-gold.svg', tier: 'GOLD', category: 'COLLECTION' },
    // 4. 마스터리 (Mastery)
    { name: '골드 콜렉터', description: '첫 번째 골드 등급 뱃지 획득', iconUrl: '/badges/mastery-gold-collector-bronze.svg', tier: 'BRONZE', category: 'MASTERY' },
    { name: '골드 헌터', description: '골드 등급 뱃지 3개 획득', iconUrl: '/badges/mastery-gold-hunter-silver.svg', tier: 'SILVER', category: 'MASTERY' },
    { name: '그랜드 마스터', description: '골드 등급 뱃지 7개 획득', iconUrl: '/badges/mastery-grandmaster-gold.svg', tier: 'GOLD', category: 'MASTERY' },
    // 5. 특별 (Special)
    { name: '얼리버드', description: '서비스 런칭 초기(예: 한 달 이내)에 가입한 사용자', iconUrl: '/badges/special-early-bird.svg', tier: 'SPECIAL', category: 'SPECIAL' },
    { name: '태그 랭킹 1위', description: '태그 랭킹에서 1위를 달성', iconUrl: '/badges/special-tag-ranker.svg', tier: 'SPECIAL', category: 'SPECIAL' },
];
async function main() {
    console.log(`Start seeding ...`);
    for (const badge of badges) {
        const result = await prisma.badge.upsert({
            where: { name: badge.name },
            update: {},
            create: {
                name: badge.name,
                description: badge.description,
                iconUrl: badge.iconUrl,
                tier: badge.tier,
                category: badge.category,
            },
        });
        console.log(`Created or found badge: ${result.name}`);
    }
    console.log(`Seeding finished.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
