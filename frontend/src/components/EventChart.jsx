import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import './EventChart.css'

function EventChart({ data, interval = 10000 }) {
  // Определяем порядок отображения разных типов данных
  const views = useMemo(() => [
    { key: 'predicted_top_teams', title: 'Прогнозируемый рейтинг команд' },
    { key: 'first_one_ok', title: 'Первая команда, которая правильно решит любую задачу' },
    { key: 'first_four_ok', title: 'Первая команда, которая правильно решит любые четыре различные задачи' },
    { key: 'winner_problems', title: 'Количество задач у победившей команды?' },
    { key: 'penalty_win', title: 'Команды топ-1 и топ-2 решат одинаковое число задач?' },
    { key: 'max_activity', title: 'Когда будет отправлено максимальное число решений?' },
    { key: 'big_fail', title: 'Упадет ли у кого-то решение после 30-го теста?' },
  ], []);

  const [currentView, setCurrentView] = useState(views[0].key);

  // Переключение между видами
  useEffect(() => {
    if (views.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentView((prev) => {
          const currentIdx = views.findIndex(v => v.key === prev);
          const nextIdx = (currentIdx + 1) % views.length;
          return views[nextIdx].key;
        });
      }, interval);

      return () => clearInterval(intervalId);
    }
  }, [views, interval]);

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
        Загрузка данных...
      </div>
    );
  }

  // Универсальный компонент для отображения списка команд
  const TeamsList = ({ teams, maxItems = Infinity, showFreq = false }) => {
    if (!teams || teams.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          Нет данных
        </div>
      );
    }

    // Ограничиваем количество элементов
    const displayedTeams = teams.slice(0, maxItems);

    return (
      <div className="predicted-teams-list" style={{ width: '100%', flexShrink: 0 }}>
        {displayedTeams.map((team, index) => (
          <div key={index} className="team-item">
            {/* Левая часть: название и progress в столбик */}
            <div className="team-label-bar-block">
              <span className="team-value">{team.value}</span>
              <div className="team-progress-bar-wrapper">
                <div
                  className="team-progress-bar"
                  style={{
                    width: `${((showFreq ? ((team.freq ?? 0) / Math.max(1, teams[0]?.freq ?? 1)) : ((team.score ?? 0) / Math.max(1, teams[0]?.score ?? 1))) * 100)}%`,
                    background: '#be07c5',
                    height: '4px',
                    borderRadius: '0px',
                    margin: '2px 0 0 0',
                    opacity: 0.5
                  }}
                />
              </div>
            </div>
            {/* Справа: score/freq */}
            <div className="team-score-block">
              {showFreq && team.freq !== undefined && (
                <span className="team-score">{team.freq}</span>
              )}
              {/* {!showFreq && team.score !== undefined && (
                <span className="team-score">{team.score.toFixed(1)}</span>
              )} */}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Компонент для отображения списка predicted_top_teams
  const PredictedTopTeamsList = () => {
    const teams = data.predicted_top_teams || [];
    return <TeamsList teams={teams} />;
  };

  // Функция для расчета процентов из частот
  const calculatePercentages = (items) => {
    if (!items || items.length === 0) return [];
    
    const totalFreq = items.reduce((sum, item) => sum + (item.freq || 0), 0);
    
    if (totalFreq === 0) return items.map(item => ({ ...item, percentage: 0 }));
    
    return items.map(item => ({
      ...item,
      percentage: ((item.freq || 0) / totalFreq) * 100
    }));
  };

  // Цвета для графиков
  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

  // Компонент для строковой диаграммы в виде списка с прогресс-барами
  const FrequencyBarsList = ({ items }) => {
    if (!items || !items.length) {
      return (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
          Нет данных
        </div>
      );
    }
    return (
      <div className="freq-bar-list">
        {items.map((item, idx) => (
          <div key={idx} className="freq-bar-item">
            <div className="freq-bar-label-line">
              <span className="freq-bar-label">{item.value}</span>
              <span className="freq-bar-percent">{typeof item.freq === 'number' ? (item.freq * 100).toFixed(2) + '%' : '0.00%'}</span>
            </div>
            <div className="freq-bar-progress-wrapper">
              <div
                className="team-progress-bar"
                style={{
                  width: `${Math.min(100, Math.max(0, item.percentage ?? 0))}%`,
                  background: '#be07c5',
                  height: '4px',
                  borderRadius: '0px',
                  margin: '2px 0 0 0',
                  opacity: 0.5,
                  transition: 'width 0.5s cubic-bezier(.7,0,.2,1)'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const FrequencyBarChart = ({ dataKey }) => {
    const source = data[dataKey] || [];
    if (!source.length) return <FrequencyBarsList items={[]} />;
    // Если у объектов есть freq — процент = freq / сумма(freq) * 100
    let freqSum = 0;
    if (typeof source[0].freq !== 'undefined') {
      freqSum = source.reduce((sum, x) => sum + (x.freq || 0), 0);
    }
    const items = source.map(item => ({
      ...item,
      percentage: (typeof item.freq !== 'undefined' && freqSum > 0) ? ((item.freq / freqSum) * 100) : 0
    }));
    return <FrequencyBarsList items={items} />;
  };

  // Компоненты для новых типов данных
  const WinnerProblemsChart = () => {
    return <FrequencyBarChart dataKey="winner_problems" />;
  };

  const PenaltyWinChart = () => {
    return <FrequencyBarChart dataKey="penalty_win" />;
  };

  const MaxActivityChart = () => {
    return <FrequencyBarChart dataKey="max_activity" />;
  };

  const BigFailChart = () => {
    return <FrequencyBarChart dataKey="big_fail" />;
  };

  // Рендер контента в зависимости от текущего вида
  const renderContent = () => {
    try {
      switch (currentView) {
        case 'predicted_top_teams':
          return <PredictedTopTeamsList />;
        case 'first_one_ok':
          return <FrequencyBarChart dataKey="first_one_ok" />;
        case 'first_four_ok':
          return <FrequencyBarChart dataKey="first_four_ok" />;
        case 'winner_problems':
          return <WinnerProblemsChart />;
        case 'penalty_win':
          return <PenaltyWinChart />;
        case 'max_activity':
          return <MaxActivityChart />;
        case 'big_fail':
          return <BigFailChart />;
        
        default:
          return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Неизвестный тип данных
            </div>
          );
      }
    } catch (err) {
      console.error('Ошибка при рендеринге контента:', err);
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
          Ошибка при отображении
        </div>
      );
    }
  };

  const currentViewConfig = views.find(v => v.key === currentView);

  try {
    return (
      <div className="events-container">
        <div className="event-item">
          {currentViewConfig && (
            <p className="event-desc">{currentViewConfig.title}</p>
          )}
          
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {renderContent()}
          </div>
          
          {/* Индикаторы текущего графика */}
          {views.length > 1 && (
            <div className="chart-indicators">
              {views.map((view) => (
                <span
                  key={view.key}
                  className={`indicator ${view.key === currentView ? 'active' : ''}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    console.error('Критическая ошибка в EventChart:', err);
    return (
      <div className="events-container">
        <div className="event-item">
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            Критическая ошибка при отображении. Проверьте консоль браузера.
          </div>
        </div>
      </div>
    );
  }
}

export default EventChart;
