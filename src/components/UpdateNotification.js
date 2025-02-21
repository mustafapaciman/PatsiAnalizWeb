import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const { ipcRenderer } = window.require('electron');
export function UpdateNotification() {
    const [updateStatus, setUpdateStatus] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    useEffect(() => {
        ipcRenderer.on('update-status', (_, status) => {
            setUpdateStatus(status);
            setShowNotification(true);
        });
        return () => {
            ipcRenderer.removeAllListeners('update-status');
        };
    }, []);
    if (!showNotification)
        return null;
    return (_jsx("div", { className: "fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg", children: _jsx("p", { children: updateStatus }) }));
}
