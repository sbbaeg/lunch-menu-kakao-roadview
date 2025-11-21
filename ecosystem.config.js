module.exports = {
  apps: [
    {
      name: 'menu-app', // pm2에서 표시될 앱 이름
      script: 'npm',
      args: 'run start',
      exec_mode: 'fork', // 실행 모드를 'fork'로 명시
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
