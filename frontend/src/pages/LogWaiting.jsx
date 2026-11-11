import React, { useEffect, useState } from 'react'
import './LogWaiting.css'

const gifs = [
  new URL('../assets/gifs/heart-love.gif', import.meta.url).href,
  new URL('../assets/gifs/potz-power.gif', import.meta.url).href,
  new URL('../assets/gifs/cute-cat-white.gif', import.meta.url).href,
  new URL('../assets/gifs/deltarune.gif', import.meta.url).href,
  new URL('../assets/gifs/music-happy.gif', import.meta.url).href,
  new URL('../assets/gifs/toby-fox-annoying-dog.gif', import.meta.url).href,
  new URL('../assets/gifs/absolute-cinema-toby-fox.gif', import.meta.url).href,
]

function LogWaiting() {

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % gifs.length)
    }, 5000) 
    return () => clearInterval(id)
  }, [])

  return (
    <div className="page logwaiting">
      <div className="logwaiting__column logwaiting__column--left">
        <div className="logwaiting__container">
          <h1 className="logwaiting__title">Контест завершен. Спасибо!</h1>
          {/* <h1 className="logwaiting__title">Спасибо за участие!</h1> */}
          <p className="logwaiting__subtitle">
            Готовим сертификаты и логи соревнования для разморозки таблицы
          </p>
        </div>
      </div>
      <div className="logwaiting__column logwaiting__column--right">
        <div className="logwaiting__gif">
          <img src={gifs[index]} alt="-" />
        </div>
      </div>
    </div>
  )
}

export default LogWaiting

