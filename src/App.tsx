import { useState, useEffect } from 'react';
import AsciiDisplay from './components/AsciiDisplay';
import { DENSITY_STRING_DEFAULT, DENSITY_STRING_COMPLEX } from './utils/ascii';
import './App.css';

function App() {
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState('#00ff41'); // Matrix green
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [densityStr, setDensityStr] = useState(DENSITY_STRING_DEFAULT);

  // Toggle UI with 'H' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setIsUIVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  return (
    <div className="app-container">
      {isUIVisible && (
        <div className="controls">
          <h1>MATRIX_CAM_V1.1</h1>
          <div className="control-group">
            <label>FONT_SIZE: {fontSize}px</label>
            <input
              type="range"
              min="6"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </div>
          <div className="control-group">
            <label>COLOR</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="control-group">
            <label>MODE</label>
            <div className="button-group">
              <button onClick={() => setDensityStr(DENSITY_STRING_DEFAULT)}>STANDARD</button>
              <button onClick={() => setDensityStr(DENSITY_STRING_COMPLEX)}>COMPLEX</button>
            </div>
          </div>

        </div>
      )}

      {!isUIVisible && (
        <div className="hint-overlay">Press 'H' for controls</div>
      )}

      <div className="display-area">
        <AsciiDisplay
          fontSize={fontSize}
          color={color}
          densityStr={densityStr}
        />
      </div>

      <div className="scanline"></div>
    </div>
  );
}

export default App;
