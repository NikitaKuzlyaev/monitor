import React, { useEffect, useState } from 'react';
import { getUnfreezeLogsUrl } from '../config';
import './UnfreezePage.css';

async function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const UnfreezePage = () => {
  const [hash, setHash] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await fetch(getUnfreezeLogsUrl());
        const json = await res.json();
        const newLogs = json.data ?? '';
        const newHash = await sha256(newLogs);
        setHash(newHash);
        localStorage.setItem('unfreeze_logs', newLogs);
        localStorage.setItem('unfreeze_logs_hash', newHash);
      } catch (e) {
        console.error('Ошибка загрузки логов:', e);
      }
    };

    loadLogs();
    const interval = setInterval(loadLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleGoToOriginal = () => {
    window.location.href = '/src/pages/main/S4RiS StanD.html';
  };

  return (
    <div className="page unfreeze">
      <button onClick={handleGoToOriginal} className="unfreeze-original-btn">
        
      </button>
      <h1 className="hash-display">{hash || '—'}</h1>
    </div>
  );
};

export default UnfreezePage;
