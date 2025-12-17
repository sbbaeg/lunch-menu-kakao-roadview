'use client';

import { useAppStore } from '@/store/useAppStore';
import React from 'react';

export function DebugDisplay() {
  const logs = useAppStore((state) => state.debugLogs);

  /*
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  */

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      width: 'calc(100% - 20px)',
      maxHeight: '150px',
      overflowY: 'auto',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: '#0f0',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '10px',
      zIndex: 9999,
      border: '1px solid #333',
      borderRadius: '5px',
    }}>
      <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>Debug Logs</h3>
      {logs.map((log, index) => (
        <div key={index}>{log}</div>
      ))}
    </div>
  );
}
