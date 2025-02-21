import React, { useEffect, useState } from 'react';
const { ipcRenderer } = window.require('electron');

export function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    ipcRenderer.on('update-status', (_, status: string) => {
      setUpdateStatus(status);
      setShowNotification(true);
    });

    return () => {
      ipcRenderer.removeAllListeners('update-status');
    };
  }, []);

  if (!showNotification) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
      <p>{updateStatus}</p>
    </div>
  );
} 