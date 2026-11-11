import './ZeroPage.css'
import React from 'react';



function ZeroPage({ staffData }) {

  return (
    <div className="page zeropage">
      <div className="zeropage__content">
        <div className="zeropage__line" />
        <div className="zeropage__text">
          <div className="monitor">monitor HackIT</div>
          <div className="catch">16.05.2026</div>
        </div>
      </div>
      <div className="zeropage__subtitle">
        <p>fallback page</p>
        <p></p>
        </div>
      
      <div className="zeropage__loader">
        <div className="zeropage__loader-track">
          <div className="zeropage__loader-bar" />
        </div>
      </div>
    </div>
  );
}

export default ZeroPage;
