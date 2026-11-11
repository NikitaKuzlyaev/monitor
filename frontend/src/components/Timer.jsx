import React, { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';

function Timer({ targetDate }) {
  const targetRef = useRef(targetDate);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!targetDate) return 0;
    const diff = dayjs(targetDate).diff(dayjs());
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (targetRef.current !== targetDate) {
      targetRef.current = targetDate;
      const diff = targetDate ? dayjs(targetDate).diff(dayjs()) : 0;
      setTimeLeft(Math.max(0, diff));
    }
  }, [targetDate]);

  useEffect(() => {
    if (!targetRef.current) return;

    const tick = () => {
      const diff = dayjs(targetRef.current).diff(dayjs());
      setTimeLeft(Math.max(0, diff));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const formatHMS = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return <p className="timer-value">{formatHMS(timeLeft)}</p>;
}

export default Timer;
