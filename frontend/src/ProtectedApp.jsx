import { useState, useEffect, useCallback } from 'react'
import './App.css'
import Home from './pages/Home'
import About from './pages/About'
import NewPage from './pages/NewPage'
import ZeroPage from './pages/ZeroPage'
import PulsePage from './pages/PulsePage'
import LogWaiting from './pages/LogWaiting'
import UnfreezePage from './pages/UnfreezePage'
import AdminPage from './pages/AdminPage'
import { getStaffUrl } from './config'

const STAFF_POLL_INTERVAL_MS = 5_000
const DEFAULT_STAFF_REQUEST_TIMEOUT_MS = 10_000
const pageIndexMap = {
  0: 'zeropage',
  1: 'home',
  2: 'about',
  3: 'newpage',
  4: 'pulsepage',
  5: 'logwaiting',
  7: 'unfreeze',
  8: 'admin',
}

function ProtectedApp() {
  const [currentPage, setCurrentPage] = useState('zeropage')
  const [staffData, setStaffData] = useState(null)
  const [remoteControlLocked, setRemoteControlLocked] = useState(false)
  const [staffRequestTimeoutMs, setStaffRequestTimeoutMs] = useState(DEFAULT_STAFF_REQUEST_TIMEOUT_MS)
  const fetchStaff = useCallback(async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), staffRequestTimeoutMs)
    try {
      const response = await fetch(getStaffUrl(), { signal: controller.signal })
      if (!response.ok) return
      const result = await response.json()
      setStaffData(result)
      setStaffRequestTimeoutMs(
        Math.max(1_000, Number(result.staff_request_timeout_seconds || 10) * 1_000),
      )

      const pageIdx = Number(result?.page)
      if (!Number.isNaN(pageIdx) && pageIndexMap[pageIdx]) {
        const nextPage = pageIndexMap[pageIdx]
        setCurrentPage((prev) => {
          if (prev === nextPage || remoteControlLocked) return prev
          return nextPage
        })
      }
    } catch (err) {
      // intentionally silent
    } finally {
      clearTimeout(timeout)
    }
  }, [remoteControlLocked, staffRequestTimeoutMs])

  useEffect(() => {
    fetchStaff()
    const timer = setInterval(fetchStaff, STAFF_POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [fetchStaff])

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home staffData={staffData} />
      case 'zeropage':
        return <ZeroPage staffData={staffData} />
      case 'about':
        return <About staffData={staffData}/>
      case 'newpage':
        return <NewPage staffData={staffData} />
      case 'pulsepage':
        return <PulsePage staffData={staffData} />
      case 'logwaiting':
        return <LogWaiting />
      case 'unfreeze':
        return <UnfreezePage />
      case 'admin':
        return <AdminPage />
      default:
        return <ZeroPage staffData={staffData} />
    }
  }

  return (
    <div className="App">
      <nav className="navbar">
        <button
          onClick={() => setRemoteControlLocked((prev) => !prev)}
          className={`toggle ${remoteControlLocked ? 'active' : ''}`}
        >
          {remoteControlLocked ? 'remote catch: off' : 'remote catch: on'}
        </button>

        <button
          onClick={() => setCurrentPage('zeropage')}
          className={currentPage === 'zeropage' ? 'active' : ''}
        >
          0
        </button>
        <button
          onClick={() => setCurrentPage('home')}
          className={currentPage === 'home' ? 'active' : ''}
        >
          1
        </button>
        <button 
          onClick={() => setCurrentPage('about')}
          className={currentPage === 'about' ? 'active' : ''}
        >
          2
        </button>
        <button 
          onClick={() => setCurrentPage('newpage')}
          className={currentPage === 'newpage' ? 'active' : ''}
        >
          3
        </button>
        <button 
          onClick={() => setCurrentPage('pulsepage')}
          className={currentPage === 'pulsepage' ? 'active' : ''}
        >
          4
        </button>
        <button 
          onClick={() => setCurrentPage('logwaiting')}
          className={currentPage === 'logwaiting' ? 'active' : ''}
        >
          5
        </button>
        <button 
          onClick={() => setCurrentPage('unfreeze')}
          className={currentPage === 'unfreeze' ? 'active' : ''}
        >
          7
        </button>
        <button
          onClick={() => setCurrentPage('admin')}
          className={currentPage === 'admin' ? 'active' : ''}
        >
          8
        </button>
      </nav>
      
      <main>
        {renderPage()}
      </main>
    </div>
  )
}

export default ProtectedApp
