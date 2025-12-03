# 1. Linux 기반의 공식 Node.js 20 이미지를 사용합니다.
FROM node:20-slim AS base

# Build-time arguments for NEXT_PUBLIC_ variables
ARG NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY

# Prisma 경고 해결을 위해 openssl 설치
RUN apt-get update && apt-get install -y openssl

# 2. 컨테이너 내부의 작업 디렉토리를 설정합니다.
WORKDIR /app

# 3. package.json과 package-lock.json을 먼저 복사합니다.
# (이 파일들이 변경되지 않으면, 다음 단계의 npm install은 캐시를 사용해 빠르게 넘어갑니다.)
COPY package*.json ./

# 4. 의존성을 설치합니다.
# 서버에서 prisma generate를 실행할 필요가 없도록, 여기서 함께 실행합니다.
RUN npm install --legacy-peer-deps

# 5. 나머지 모든 소스 코드를 복사합니다.
COPY . .

# 6. 빌드 명령을 실행합니다.
# Make the build-time arg available as an env var for the build process
ENV NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY
RUN echo "Build-time MAPS_KEY is: $NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY"
RUN npm run build

# 7. 컨테이너가 시작될 때 실행할 명령어를 지정합니다.
CMD ["npm", "start"]