import React, { useEffect, useRef, useState, useCallback } from 'react';
import { convertImageDataToAscii, DENSITY_STRING_DEFAULT } from '../utils/ascii';

interface AsciiDisplayProps {
    fontSize?: number;
    color?: string;
    densityStr?: string;
}

const AsciiDisplay: React.FC<AsciiDisplayProps> = ({
    fontSize = 10,
    color = '#00ff00',
    densityStr = DENSITY_STRING_DEFAULT
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    const [error, setError] = useState<string>('');

    const settingsRef = useRef({ density: densityStr, fontSize });

    useEffect(() => {
        settingsRef.current = { density: densityStr, fontSize };
    }, [densityStr, fontSize]);

    const processFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !preRef.current || videoRef.current.paused || videoRef.current.ended) {
            requestAnimationFrame(processFrame);
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Check if measurement nodes exist
        if (!ctx || !containerRef.current || !measureRef.current) {
            requestAnimationFrame(processFrame);
            return;
        }

        // Measure container and char
        const { clientWidth: viewWidth, clientHeight: viewHeight } = containerRef.current;
        const { width: charWidth, height: charHeight } = measureRef.current.getBoundingClientRect();

        if (charWidth === 0 || charHeight === 0) {
            requestAnimationFrame(processFrame);
            return;
        }

        // Auto-calculate resolution
        const w = Math.floor(viewWidth / charWidth);
        const h = Math.floor(viewHeight / charHeight);

        if (w <= 0 || h <= 0) {
            requestAnimationFrame(processFrame);
            return;
        }

        const { density: d } = settingsRef.current;

        // Determine strict sizing to fill container
        // If charWidth * w < viewWidth, we have a gap.
        // We can increase letter-spacing slightly to fill it.
        const preciseCharWidth = viewWidth / w;
        const preciseLineHeight = viewHeight / h;

        if (preRef.current) {
            const letterSpacing = preciseCharWidth - charWidth;
            // Avoid thrashing if difference is negligible (though browsers handle subpixel well usually)
            preRef.current.style.lineHeight = `${preciseLineHeight}px`;
            preRef.current.style.letterSpacing = `${letterSpacing}px`;
            // Force block to fill
            preRef.current.style.width = `${viewWidth}px`;
            preRef.current.style.height = `${viewHeight}px`;
        }

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }

        // Draw "cover" style to ensure no black bars
        const videoAspect = video.videoWidth / video.videoHeight;
        const screenAspect = viewWidth / viewHeight;

        let sx = 0, sy = 0, sWidth = video.videoWidth, sHeight = video.videoHeight;

        if (screenAspect > videoAspect) {
            // Screen wider: crop top/bottom
            const newHeight = video.videoWidth / screenAspect;
            sy = (video.videoHeight - newHeight) / 2;
            sHeight = newHeight;
        } else {
            // Screen taller: crop left/right
            const newWidth = video.videoHeight * screenAspect;
            sx = (video.videoWidth - newWidth) / 2;
            sWidth = newWidth;
        }

        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const ascii = convertImageDataToAscii(imageData, w, h, d);

        preRef.current.innerText = ascii;

        requestAnimationFrame(processFrame);
    }, []);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().then(() => {
                        requestAnimationFrame(processFrame);
                    }).catch(e => console.error("Play error", e));
                }
            })
            .catch(err => {
                console.error("Camera access error:", err);
                setError("Could not access camera. Please allow permissions.");
            });

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [processFrame]);

    return (
        <div
            ref={containerRef}
            className="ascii-container"
            style={{
                color: color,
                fontSize: `${fontSize}px`,
                // Initial line-height, updated dynamically
                lineHeight: `${fontSize}px`,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {error && <div className="error">{error}</div>}

            <video
                ref={videoRef}
                style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', width: 1, height: 1 }}
                playsInline
                muted
            />
            <canvas
                ref={canvasRef}
                style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', width: 1, height: 1 }}
            />

            <span ref={measureRef} style={{ visibility: 'hidden', position: 'absolute', fontSize: `${fontSize}px`, fontFamily: 'monospace' }}>W</span>

            <pre ref={preRef} className="ascii-output" style={{ transform: 'scaleX(-1)' }}>
                Initializing System...
            </pre>
        </div>
    );
};

export default AsciiDisplay;
