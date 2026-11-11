import React, { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';

const calcTimeLeft = (target) => {
  if (!target) return 0;
  const diff = dayjs(target).diff(dayjs());
  if (diff <= 0) return 0;
  return Math.max(0, Math.floor(diff / 10) * 10);
};

function CountdownTimer({ targetDate }) {
  const [time, setTime] = useState(() => calcTimeLeft(targetDate));
  const [isPaused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  const pauseTimeoutRef = useRef(null);
  const [phase, setPhase] = useState('countdown');
  const targetRef = useRef(targetDate);

  useEffect(() => {
    if (!targetDate) return;
    if (targetRef.current !== targetDate) {
      targetRef.current = targetDate;
      setPhase('countdown');
      setPaused(false);
      clearInterval(intervalRef.current);
      clearTimeout(pauseTimeoutRef.current);
      setTime(calcTimeLeft(targetDate));
    }
  }, [targetDate]);

  useEffect(() => {
    if (!targetRef.current || phase !== 'countdown' || isPaused) return;

    const msLeft = () => dayjs(targetRef.current).diff(dayjs());
    const toMillisOnly = (val) => Math.max(0, Math.floor(val / 10) * 10);

    setTime(toMillisOnly(msLeft()));

    intervalRef.current = setInterval(() => {
      setTime(() => {
        const left = toMillisOnly(msLeft());

        if (left <= 0) {
          clearInterval(intervalRef.current);
          setPhase('after');
          return 0;
        }

        if (left === 10 && !isPaused) {
          setPaused(true);
          pauseTimeoutRef.current = setTimeout(() => {
            setPaused(false);
            setPhase('after');
            setTime(0);
          }, 100);
          return 10;
        }

        return left;
      });
    }, 10);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(pauseTimeoutRef.current);
    };
  }, [isPaused, phase, targetDate]);

  useEffect(() => {
    if (phase === 'after') {
      const timer = setTimeout(() => {
        setPhase('dot');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const formatTime = (timeMs) => {
    const hours = Math.floor(timeMs / 3600000);
    const minutes = Math.floor((timeMs % 3600000) / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    const milliseconds = Math.floor((timeMs % 1000) / 10);

    const lessThanMinute = timeMs < 60000;
    const showMs = timeMs < 1800000 && timeMs >= 60000;

    if (lessThanMinute) {
      return (
        <div className="timer-demo">
          {seconds.toString().padStart(2, '0')}
          <span className="timer-ms">.{milliseconds.toString().padStart(2, '0')}</span>
        </div>
      );
    }

    let timeString =
      hours > 0
        ? `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;

    return (
      <div className="timer-demo">
        {timeString}
        {showMs && (
          <span className="timer-ms">
            .{milliseconds.toString().padStart(2, '0')}
          </span>
        )}
      </div>
    );
  };

  if (phase === 'dot') {
    return <div className="timer-demo">.</div>;
  }

  return formatTime(time);
}

export default CountdownTimer;