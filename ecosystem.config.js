module.exports = {
  apps: [
    {
      name: 'menu-app', // pm2에서 표시될 앱 이름
      script: 'npm',
      args: 'run start',
      // Next.js 앱은 보통 자체적으로 CPU 코어 수를 관리하므로 instances는 1로 설정
      instances: 1, 
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // 여기가 핵심: NODE_ENV를 'production'으로 설정
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
