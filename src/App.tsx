import { useState, useEffect, useRef } from 'react';
import AsciiDisplay, { type AsciiDisplayHandle } from './components/AsciiDisplay';
import { DENSITY_STRING_DEFAULT, DENSITY_STRING_COMPLEX } from './utils/ascii';
import './App.css';

function App() {
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState('#00ff41'); // Matrix green
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [densityStr, setDensityStr] = useState(DENSITY_STRING_DEFAULT);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const asciiRef = useRef<AsciiDisplayHandle>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageSrc(null);
  };

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

          <div className="control-group">
            <label>SOURCE</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="file-upload"
                className="hidden-input"
              />
              <label htmlFor="file-upload" className="button-style">UPLOAD IMAGE</label>
            </div>
            {imageSrc && (
              <button onClick={clearImage} style={{ marginTop: '10px' }}>SWITCH TO CAMERA</button>
            )}
          </div>

          <div className="actions">
            <button onClick={() => asciiRef.current?.capture()}>CAPTURE SNAPSHOT</button>
          </div>

        </div>
      )}

      {!isUIVisible && (
        <div className="hint-overlay">Press 'H' for controls</div>
      )}

      <div className="display-area">
        <AsciiDisplay
          ref={asciiRef}
          fontSize={fontSize}
          color={color}
          densityStr={densityStr}
          imageSrc={imageSrc}
        />
      </div>

      <div className="scanline"></div>
    </div>
  );
}

export default App;
