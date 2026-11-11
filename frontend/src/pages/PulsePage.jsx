import './PulsePage.css'
import React, { useEffect, useState, useRef, useMemo } from 'react'
import dayjs from 'dayjs'
import { getPulseSubmissionsUrl, getPulseStandingsUrl, getPulseStatisticsUrl } from '../config'

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
    const showMs = totalMs < 1800000 && totalMs >= 60000; // менее 30 минут, но не менее 1 минуты
    const lessThanMinute = totalMs < 60000; // менее 1 минуты

    // Если менее минуты - показываем только секунды и миллисекунды
    if (lessThanMinute) {
      return (
        <div className="pulsepage__timer">
          {seconds.toString().padStart(2, '0')}
          <span className="pulsepage__timer-ms">.{milliseconds.toString().padStart(2, '0')}</span>
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
        <div className="pulsepage__timer">
          {timeString}
          <span className="pulsepage__timer-ms">.{milliseconds.toString().padStart(2, '0')}</span>
        </div>
      );
    }

    return (
      <div className="pulsepage__timer">
        {timeString}
      </div>
    );
  };

  if (phase === 'dot') {
    return <div className="pulsepage__timer pulsepage__timer--dot">.</div>;
  }

  return formatTime(time);
}

function SubmissionCard({ submission }) {
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    if (submission.receivedAt) {
      const checkIfNew = () => {
        const now = Date.now();
        const receivedAt = submission.receivedAt;
        const diff = now - receivedAt;
        setIsNew(diff < 30000);
      };

      checkIfNew();
      const interval = setInterval(checkIfNew, 1000);

      return () => clearInterval(interval);
    }
  }, [submission.receivedAt]);

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'TESTING':
        return '#fbc02d';
      case 'OK':
        return '#4caf50';
      case 'WRONG_ANSWER':
        return '#f44336';
      case 'TIME_LIMIT_EXCEEDED':
        return '#ff9800';
      case 'RUNTIME_ERROR':
        return '#9c27b0';
      case 'COMPILATION_ERROR':
        return '#2196f3';
      default:
        return '#757575';
    }
  };

  const getCardBackgroundColor = (verdict) => {
    if (verdict === 'OK') {
      return 'rgba(76, 175, 80, 0.2)';
    } else if (verdict === 'TESTING') {
      return 'rgba(251, 192, 45, 0.12)';
    } else {
      return 'rgba(244, 67, 54, 0.2)';
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`pulsepage__submission-card ${isNew ? 'pulsepage__submission-card--glow' : ''} ${submission.verdict === 'TESTING' ? 'pulsepage__submission-card--testing' : ''}`}
      style={{ backgroundColor: getCardBackgroundColor(submission.verdict) }}
    >
      <div className="pulsepage__submission-problem">{submission.problemIndex}</div>
      <div className="pulsepage__submission-content">
        <div className="pulsepage__submission-team">{submission.teamName}</div>
        <div className="pulsepage__submission-bottom">
          <span 
            className="pulsepage__submission-verdict"
            style={{ color: getVerdictColor(submission.verdict) }}
          >
            {submission.verdict}
          </span>
          <span className="pulsepage__submission-time">{formatTime(submission.relativeTimeSeconds)}</span>
          <span className="pulsepage__submission-tests">{submission.passedTestCount} тестов</span>
          <span className="pulsepage__submission-lang">{submission.programmingLanguage}</span>
        </div>
      </div>
    </div>
  );
}

const formatContestTime = (seconds) => {
  if (seconds == null) return '';
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

function StandingsTable({ problems, rows, error, submissions }) {
  const columnsTemplate = useMemo(() => {
    const base = ['60px', 'minmax(0, 3.2fr)', '65px', '75px'];
    const problemsTemplate = problems.length > 0
      ? `repeat(${problems.length}, minmax(45px, 0.7fr))`
      : '';
    return [...base, problemsTemplate].filter(Boolean).join(' ');
  }, [problems.length]);

  // build a set of testing attempts keyed by "handle|problemIndex"
  const testingSet = useMemo(() => {
    const s = new Set();
    (submissions || []).forEach((sub) => {
      if ((sub.verdict || '').toString() === 'TESTING') {
        const handle = sub.teamHandle || sub.teamName || sub.team || sub.handle;
        const pIdx = sub.problemIndex || sub.problem || sub.problemIndex;
        if (handle && pIdx) s.add(`${handle}|${pIdx}`);
      }
    });
    return s;
  }, [submissions]);

  const renderProblemCell = (result, index, row) => {
    if (!result) {
      return (
        <div key={index} className="pulsepage__standings-problem" />
      );
    }

    const attempts = result.rejectedAttemptCount ?? 0;
    const solved = (result.points ?? 0) > 0;
    const classNames = [
      'pulsepage__standings-problem',
      solved && 'pulsepage__standings-problem--solved',
      !solved && attempts > 0 && 'pulsepage__standings-problem--attempts'
    ].filter(Boolean).join(' ');

    // detect testing state for this cell (match by team handle and problem index)
    const problemIndex = problems[index]?.index ?? index;
    const handle = row?.party?.members?.[0]?.handle;
    const isTesting = handle && testingSet.has(`${handle}|${problemIndex}`);
    // don't mark already-solved cells as testing
    const finalClassNames = `${classNames}${!solved && isTesting ? ' pulsepage__standings-problem--testing' : ''}`;

    // find latest submission for this team/problem to show a time for attempts/test
    let latestSub = null;
    if (submissions && handle) {
      for (let i = 0; i < submissions.length; i++) {
        const s = submissions[i];
        const sHandle = s.teamHandle || s.teamName || s.team || s.handle;
        const sProb = s.problemIndex || s.problem;
        if (sHandle === handle && sProb === problemIndex) {
          if (!latestSub || (s.relativeTimeSeconds || 0) > (latestSub.relativeTimeSeconds || 0)) {
            latestSub = s;
          }
        }
      }
    }

    const displayTimeSec = solved ? result.bestSubmissionTimeSeconds : (latestSub?.relativeTimeSeconds ?? result.bestSubmissionTimeSeconds ?? null);
    const displayTime = displayTimeSec != null ? formatContestTime(displayTimeSec) : '';

    if (solved) {
      return (
        <div key={index} className={finalClassNames}>
          <span className="pulsepage__standings-problem-status">
            {'+'}{attempts > 0 ? attempts : ''}
          </span>
          <span className="pulsepage__standings-problem-time">
            {displayTime}
          </span>
        </div>
      );
    }

    if (attempts > 0) {
      return (
        <div key={index} className={finalClassNames}>
          <span className="pulsepage__standings-problem-status">
            {isTesting ? '?' : '-'}{attempts > 0 ? attempts : ''}
          </span>
          <span className="pulsepage__standings-problem-time">
            {displayTime}
          </span>
          {isTesting && <div className="pulsepage__standings-problem-badge" />}
        </div>
      );
    }

    return (
      <div key={index} className={finalClassNames}>{isTesting ? <><span className="pulsepage__standings-problem-status">?</span><span className="pulsepage__standings-problem-time">{displayTime}</span><div className="pulsepage__standings-problem-badge" /></> : null}</div>
    );
  };

  return (
    <div className="pulsepage__standings">
      <div
        className={
          "pulsepage__standings-head" +
          (error ? " pulsepage__standings-head--warning" : "")
        }
        style={{ gridTemplateColumns: columnsTemplate }}
      >
        <div className="pulsepage__standings-cell pulsepage__standings-cell--rank">#</div>
        <div className="pulsepage__standings-cell pulsepage__standings-cell--team">Команда</div>
        <div className="pulsepage__standings-cell pulsepage__standings-cell--solved">Задачи</div>
        <div className="pulsepage__standings-cell pulsepage__standings-cell--penalty">Штраф</div>
        {problems.map((problem) => (
          <div
            key={problem.index ?? problem.name}
            className="pulsepage__standings-cell pulsepage__standings-cell--problem"
          >
            <div className="pulsepage__standings-problem pulsepage__standings-problem--header">
              {problem.index}
            </div>
          </div>
        ))}
      </div>
      <div className="pulsepage__standings-body">
        {rows.map((row) => {
          const rowKey = row.party?.participantId ?? row.rank;
          const teamName = row.party?.members?.[0]?.name ?? 'Неизвестная команда';
          const problemResults = row.problemResults ?? [];
          return (
            <div
              key={rowKey}
              className="pulsepage__standings-row"
              style={{ gridTemplateColumns: columnsTemplate }}
            >
              <div className="pulsepage__standings-cell pulsepage__standings-cell--rank">{row.rank ?? '—'}</div>
              <div className="pulsepage__standings-cell pulsepage__standings-cell--team" title={teamName}>
                {teamName}
              </div>
              <div className="pulsepage__standings-cell pulsepage__standings-cell--solved">{row.points ?? 0}</div>
              <div className="pulsepage__standings-cell pulsepage__standings-cell--penalty">{row.penalty ?? 0}</div>
              {problems.map((_, idx) => renderProblemCell(problemResults[idx], idx, row))}
            </div>
          );
        })}
      </div>
    </div>
  );
}



function PulsePage({ staffData }) {
  const fallbackRef = useRef(dayjs().add(2, 'hour').format('YYYY-MM-DDTHH:mm:ss'));
  const targetDate = formatTarget(staffData?.pulse_timer_end_time) ?? fallbackRef.current;
  
  const [submissions, setSubmissions] = useState([]);
  const [standings, setStandings] = useState([]);
  const [problems, setProblems] = useState([]);
  const [isStandingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState(null);
  const knownIdsRef = useRef(new Set());
  const [problemsSolved, setProblemsSolved] = useState(0);
  const [submissionsMade, setSubmissionsMade] = useState(0);


  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch(getPulseSubmissionsUrl());
        if (!response.ok) return;
        const result = await response.json();
        
            if (result.status === 'ok' && Array.isArray(result.data)) {
              setSubmissions((prev) => {
                const now = Date.now();
                const map = new Map(prev.map((s) => [s.id, s]));

                result.data.forEach((serverSub) => {
                  const existing = map.get(serverSub.id);
                  if (existing) {
                    // if anything changed, replace with merged object so React re-renders
                    if (
                      existing.verdict !== serverSub.verdict ||
                      existing.passedTestCount !== serverSub.passedTestCount ||
                      existing.relativeTimeSeconds !== serverSub.relativeTimeSeconds ||
                      existing.programmingLanguage !== serverSub.programmingLanguage
                    ) {
                      map.set(serverSub.id, { ...existing, ...serverSub });
                    }
                  } else {
                    map.set(serverSub.id, { ...serverSub, receivedAt: now });
                  }
                });

                const combined = Array.from(map.values()).sort((a, b) => b.relativeTimeSeconds - a.relativeTimeSeconds);
                knownIdsRef.current = new Set(combined.map((s) => s.id));
                return combined;
              });
            }
      } catch (err) {
        // intentionally silent
      }
    };

    fetchSubmissions();
    const timer = setInterval(fetchSubmissions, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchStandings = async () => {
      try {
        const response = await fetch(getPulseStandingsUrl());
        if (!response.ok) throw new Error('Failed to load standings');

        const payload = await response.json();
        const container = payload?.result ?? payload?.data ?? payload;

        const rowsSource = container?.rows ?? container?.result?.rows ?? payload?.data?.result?.rows;
        const problemsSource = container?.problems ?? container?.result?.problems ?? payload?.data?.result?.problems;
        
        const rows = Array.isArray(rowsSource) ? rowsSource : [];
        const contestProblems = Array.isArray(problemsSource) ? problemsSource : [];
        
        if (!isMounted) return;
        
        setStandings(rows);
        setProblems(contestProblems);
        setStandingsLoading(false);
        setStandingsError(null);

      } catch (err) {
        if (!isMounted) return;

        // setStandings([]);
        setStandingsLoading(false);
        setStandingsError('Разработчик дурак');
      }
    };

    fetchStandings();
    const timer = setInterval(fetchStandings, 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchStatistics = async () => {
        try {
            const response = await fetch(getPulseStatisticsUrl());
            if (!response.ok) throw new Error('Разработчик дурак');

            const payload = await response.json();

            const container =
                payload?.data ??
                payload?.result ??
                payload;

            const problemsSolved = container?.problemsSolved ?? 0;
            const submissionsMade = container?.submissionsMade ?? 0;

            if (!isMounted) return;

            setProblemsSolved(problemsSolved);
            setSubmissionsMade(submissionsMade);
            setStatisticsError(null);
            setStatisticsLoading(false);

        } catch (err) {
            if (!isMounted) return;

            //setProblemsSolved(0);
            //setSubmissionsMade(0);
            setStatisticsLoading(false);
            setStatisticsError('Разработчик дурак');
        }
    };

    fetchStatistics();
    const timer = setInterval(fetchStatistics, 1000);

    return () => {
        isMounted = false;
        clearInterval(timer);
    };
  }, []);

  
  return (
    <div className="page pulsepage">
      <div className="pulsepage__grid">
        <div className="pulsepage__block pulsepage__block--top-left">
          <CountdownTimer targetDate={targetDate} />
        </div>
        <div className="pulsepage__block pulsepage__block--top-right">
          <div className="pulsepage__stats">
            <div className="pulsepage__stats-item">
                <span>Решено: {problemsSolved}</span>
            </div>
            <div className="pulsepage__stats-item">
                <span>Попыток: {submissionsMade}</span>
            </div>
          </div>
        </div>
        <div className="pulsepage__block pulsepage__block--bottom-left">

          <div className="pulsepage__standings-wrapper">
            {isStandingsLoading && <div className="pulsepage__standings-placeholder">loading...</div>}
            
            {!isStandingsLoading && standingsError && (
              <div className="pulsepage__standings-warning">{}</div>
            )}



            {true && (
              <StandingsTable problems={problems} rows={standings} error={standingsError} submissions={submissions} />
            )}

          </div>

        </div>
        <div className="pulsepage__block pulsepage__block--bottom-right">
          <div className="pulsepage__submissions-container">
            {submissions.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PulsePage

