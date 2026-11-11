import { useCallback, useEffect, useState } from 'react'
import {
  getAdminLoginUrl,
  getAdminLogoutUrl,
  getAdminSessionUrl,
  getPulseStandingsUrl,
  getPulseStatisticsUrl,
  getPulseSubmissionsUrl,
  getSarisConverterUrl,
  getSetAllUrl,
  getStaffUrl,
  getUnfreezeLogsUrl,
  getUnfreezeUploadUrl,
} from '../config'
import './AdminPage.css'

const emptySettings = {
  header: '',
  desc: '',
  page: 0,
  time_start: '',
  timer_end_time: '',
  pulse_timer_end_time: '',
  information_page: '',
  pulse_contest_id: 0,
  codeforces_refresh_interval_seconds: 15,
  staff_request_timeout_seconds: 10,
}

const toDateTimeInput = (value) => (value ? value.replace(' ', 'T').slice(0, 16) : '')
const toApiDate = (value) => (value ? `${value.replace('T', ' ')}:00` : '')

async function request(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(body.detail || 'Запрос не выполнен')
    error.status = response.status
    throw error
  }
  return response.json()
}

function LoginForm({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await request(getAdminLoginUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      setPassword('')
      onLogin()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="admin-card admin-login">
      <h1>Панель администратора</h1>
      <p>Введите пароль администратора, чтобы открыть страницу.</p>
      <form onSubmit={submit}>
        <label>
          Пароль
          <input
            autoComplete="current-password"
            autoFocus
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error && <p className="admin-error">{error}</p>}
        <button disabled={pending} type="submit">{pending ? 'Проверка…' : 'Войти'}</button>
      </form>
    </section>
  )
}

function AdminPage() {
  const [authenticated, setAuthenticated] = useState(null)
  const [settings, setSettings] = useState(emptySettings)
  const [logs, setLogs] = useState('')
  const [conversion, setConversion] = useState('')
  const [apiResult, setApiResult] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadSettings = useCallback(async () => {
    const data = await request(getStaffUrl())
    setSettings({
      ...data,
      time_start: toDateTimeInput(data.time_start),
      timer_end_time: toDateTimeInput(data.timer_end_time),
      pulse_timer_end_time: toDateTimeInput(data.pulse_timer_end_time),
    })
  }, [])

  const checkSession = useCallback(async () => {
    try {
      const data = await request(getAdminSessionUrl())
      setAuthenticated(data.authenticated)
      if (data.authenticated) await loadSettings()
    } catch {
      setAuthenticated(false)
    }
  }, [loadSettings])

  useEffect(() => {
    checkSession()
    const timer = setInterval(checkSession, 60_000)
    return () => clearInterval(timer)
  }, [checkSession])

  const handleRequestError = (requestError) => {
    if (requestError.status === 401) setAuthenticated(false)
    setError(requestError.message)
  }

  const updateSetting = (event) => {
    const { name, value } = event.target
    setSettings((current) => ({
      ...current,
      [name]: ['page', 'codeforces_refresh_interval_seconds', 'staff_request_timeout_seconds'].includes(name) ? Number(value) : value,
    }))
  }

  const saveSettings = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      await request(getSetAllUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          time_start: toApiDate(settings.time_start),
          timer_end_time: toApiDate(settings.timer_end_time),
          pulse_timer_end_time: toApiDate(settings.pulse_timer_end_time),
        }),
      })
      setMessage('Настройки сохранены')
    } catch (requestError) {
      handleRequestError(requestError)
    }
  }

  const saveLogs = async () => {
    setMessage('')
    setError('')
    try {
      const result = await request(getUnfreezeUploadUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: logs,
      })
      setMessage(`Логи сохранены: ${result.message}`)
    } catch (requestError) {
      handleRequestError(requestError)
    }
  }

  const loadLogs = async () => {
    try {
      const result = await request(getUnfreezeLogsUrl())
      setLogs(result.data || '')
    } catch (requestError) {
      handleRequestError(requestError)
    }
  }

  const convertLogs = async () => {
    setError('')
    try {
      const result = await request(getSarisConverterUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: logs,
      })
      setConversion(JSON.stringify(result, null, 2))
    } catch (requestError) {
      handleRequestError(requestError)
    }
  }

  const logout = async () => {
    await request(getAdminLogoutUrl(), { method: 'POST' })
    setAuthenticated(false)
    setMessage('')
  }

  const inspectCache = async (url) => {
    setError('')
    try {
      setApiResult(JSON.stringify(await request(url), null, 2))
    } catch (requestError) {
      handleRequestError(requestError)
    }
  }

  if (authenticated === null) return <div className="admin-loading">Проверка доступа…</div>
  if (!authenticated) return <div className="admin-page"><LoginForm onLogin={checkSession} /></div>

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div><h1>Панель администратора</h1><p>Только один браузер может быть авторизован одновременно.</p></div>
        <button className="admin-secondary" onClick={logout} type="button">Выйти</button>
      </header>
      {message && <p className="admin-message">{message}</p>}
      {error && <p className="admin-error">{error}</p>}

      <form className="admin-card admin-settings" onSubmit={saveSettings}>
        <h2>Экран и контест</h2>
        <label>Заголовок<input name="header" onChange={updateSetting} required value={settings.header} /></label>
        <label>Описание<textarea name="desc" onChange={updateSetting} required value={settings.desc} /></label>
        <label>Страница
          <select name="page" onChange={updateSetting} value={settings.page}>
            {[0, 1, 2, 3, 4, 5, 7, 8].map((page) => <option key={page} value={page}>{page}</option>)}
          </select>
        </label>
        <label>Начало<input name="time_start" onChange={updateSetting} required type="datetime-local" value={settings.time_start} /></label>
        <label>Конец таймера<input name="timer_end_time" onChange={updateSetting} required type="datetime-local" value={settings.timer_end_time} /></label>
        <label>Конец таймера Pulse<input name="pulse_timer_end_time" onChange={updateSetting} required type="datetime-local" value={settings.pulse_timer_end_time} /></label>
        <label>Ключ (ID) контеста Codeforces<input inputMode="numeric" name="pulse_contest_id" onChange={updateSetting} placeholder="Например, 675662" required type="text" value={settings.pulse_contest_id} /></label>
        <label>Обновление Codeforces, секунд<input max="300" min="5" name="codeforces_refresh_interval_seconds" onChange={updateSetting} required type="number" value={settings.codeforces_refresh_interval_seconds} /></label>
        <label>Таймаут запроса staff, секунд<input max="60" min="1" name="staff_request_timeout_seconds" onChange={updateSetting} required type="number" value={settings.staff_request_timeout_seconds} /></label>
        <label>Информационная страница<textarea name="information_page" onChange={updateSetting} required value={settings.information_page} /></label>
        <button type="submit">Сохранить настройки</button>
      </form>

      <section className="admin-card">
        <h2>Логи разморозки</h2>
        <textarea className="admin-log" onChange={(event) => setLogs(event.target.value)} placeholder="Вставьте лог Codeforces" value={logs} />
        <div className="admin-actions">
          <button className="admin-secondary" onClick={loadLogs} type="button">Загрузить сохранённые</button>
          <button className="admin-secondary" onClick={convertLogs} type="button">Преобразовать в S4RiS</button>
          <button onClick={saveLogs} type="button">Сохранить логи</button>
        </div>
        {conversion && <pre className="admin-result">{conversion}</pre>}
      </section>

      <section className="admin-card">
        <h2>Данные Codeforces</h2>
        <p>Быстрый просмотр данных из кеша без Swagger.</p>
        <div className="admin-actions">
          <button className="admin-secondary" onClick={() => inspectCache(getPulseSubmissionsUrl())} type="button">Посылки</button>
          <button className="admin-secondary" onClick={() => inspectCache(getPulseStandingsUrl())} type="button">Таблица</button>
          <button className="admin-secondary" onClick={() => inspectCache(getPulseStatisticsUrl())} type="button">Статистика</button>
        </div>
        {apiResult && <pre className="admin-result">{apiResult}</pre>}
      </section>
    </div>
  )
}

export default AdminPage
