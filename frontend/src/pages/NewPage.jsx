import './NewPage.css'
import React, { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';

const formatTarget = (value) => {
  if (!value) return null;
  return value.replace(' ', 'T');
};

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
  const [phase, setPhase] = useState('countdown'); // countdown | after | dot
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
      setTime((prev) => {
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
    const totalMs = timeMs;
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = Math.floor((totalMs % 1000) / 10);
    const showMs = totalMs < 1800000 && totalMs >= 60000;
    const lessThanMinute = totalMs < 60000;

    // Если менее минуты - показываем только секунды и миллисекунды
    if (lessThanMinute) {
      return (
        <div className="timer-demo">
          {seconds.toString().padStart(2, '0')}
          <span className="timer-ms">.{milliseconds.toString().padStart(2, '0')}</span>
        </div>
      );
    }

    let timeString = '';
    if (hours > 0) {
      timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    if (showMs) {
      return (
        <div className="timer-demo">
          {timeString}
          <span className="timer-ms">.{milliseconds.toString().padStart(2, '0')}</span>
        </div>
      );
    }

    return (
      <div className="timer-demo">
        {timeString}
      </div>
    );
  };

  if (phase === 'dot') {
    return <div><pre className='timer-demo dot-final'> .  </pre></div>;
  }

  return formatTime(time);
}

function NewPage({ staffData }) {
  const fallbackRef = useRef(dayjs().add(2, 'hour').format('YYYY-MM-DDTHH:mm:ss'));
  const targetDate = formatTarget(staffData?.timer_end_time) ?? fallbackRef.current;

  return (
    <div className="page newpage">
      <CountdownTimer targetDate={targetDate} />
    </div>
  );
}

export default NewPage;
