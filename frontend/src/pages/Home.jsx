import CountdownTimer from "../components/CountdownTimer";
import WinterStorm from "../components/WinterStorm";
import "./Home.css";
import dayjs from "dayjs";
import { useRef } from "react";

const formatTarget = (value) => {
  if (!value) return null;
  return value.replace(" ", "T");
};

function Home({ staffData }) {
  const fallbackRef = useRef(
    dayjs().add(2, "hour").format("YYYY-MM-DDTHH:mm:ss")
  );

  const targetDate =
    formatTarget(staffData?.pulse_timer_end_time) ?? fallbackRef.current;
  const titleRef = useRef(null);

  /* const qrLinks = [
  {
    label: "Сайт",
    url: "https://hackit-olimp.tpu.ru/",
  },
  {
    label: "Правила",
    url: "https://docs.google.com/document/d/1nIv54frEh5BJ3CB9Klvn7EJYuycPNt3FndEh9EPhSfg/edit?usp=sharing",
  },
  {
    label: "Вконтакте",
    url: "https://vk.me/join/MvJMnmmWyp/LaGSxrAVEielTyMouW2COIVw=",
  },
  {
    label: "Telegram",
    url: "https://t.me/itr_tpu_hackit",
  },
]; */

  return (
    <div className="page home">
      <WinterStorm titleRef={titleRef} />

      <div className="side-ui">
        <div className="glass-panel">
          <div className="panel-content">
            <div className="title" ref={titleRef}>HackIT</div>

            <div className="title2">
              Командная олимпиада ИШИТР ТПУ по программированию
            </div>

            <div className="title2">Региональный этап</div>

            <div className="title3">
              Россия, Томск, НТБ ТПУ. 16 мая 2026 г.
            </div>
          </div>

          <div className="panel-bottom">
            <div className="timer-wrap">
              <CountdownTimer targetDate={targetDate} />
            </div>

            {/* <div className="qr-row">
              {qrLinks.map((item) => (
                <div className="qr-card" key={item.url}>
                  <QRCodeSVG
                    value={item.url}
                    size={198}
                    bgColor="transparent"
                    fgColor="#111111"
                    level="H"
                    includeMargin={false}
                  />

                  <div className="qr-label">{item.label}</div>
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </div>

      <div className="home-scroll-space" aria-hidden="true" />
    </div>
  );
}

export default Home;
