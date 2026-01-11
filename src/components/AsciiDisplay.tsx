import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { convertImageDataToAscii, DENSITY_STRING_DEFAULT } from '../utils/ascii';

interface AsciiDisplayProps {
    fontSize?: number;
    color?: string;
    densityStr?: string;
    imageSrc?: string | null;
}

export interface AsciiDisplayHandle {
    capture: () => void;
}

const AsciiDisplay = forwardRef<AsciiDisplayHandle, AsciiDisplayProps>(({
    fontSize = 10,
    color = '#00ff00',
    densityStr = DENSITY_STRING_DEFAULT,
    imageSrc = null
}, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    const [error, setError] = useState<string>('');

    // Store latest frame data for capture
    const frameDataRef = useRef<{ ascii: string; w: number; h: number; preciseCharWidth: number; preciseLineHeight: number } | null>(null);

    const settingsRef = useRef({ density: densityStr, fontSize, imageSrc });

    useEffect(() => {
        settingsRef.current = { density: densityStr, fontSize, imageSrc };
    }, [densityStr, fontSize, imageSrc]);

    useImperativeHandle(ref, () => ({
        capture: () => {
            if (!frameDataRef.current || !containerRef.current) return;

            const { ascii, preciseCharWidth, preciseLineHeight } = frameDataRef.current;
            const { clientWidth, clientHeight } = containerRef.current;

            const captureCanvas = document.createElement('canvas');
            captureCanvas.width = clientWidth;
            captureCanvas.height = clientHeight;
            const ctx = captureCanvas.getContext('2d');
            if (!ctx) return;

            // Draw Background
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, captureCanvas.width, captureCanvas.height);

            // Draw Text
            ctx.fillStyle = color;
            ctx.font = `bold ${fontSize}px "Courier New", monospace`;
            ctx.textBaseline = 'top';

            const lines = ascii.split('\n');

            // We need to handle mirroring if it's camera
            // But text drawing direction is tricky with canvas transform.
            // Easiest is to just draw normally, and if !imageSrc, flip the canvas at the end? 
            // Or flip context before drawing.

            ctx.save();
            if (!imageSrc) {
                // Mirroring for camera
                ctx.translate(captureCanvas.width, 0);
                ctx.scale(-1, 1);
            }

            lines.forEach((line, i) => {
                const y = i * preciseLineHeight;
                // Draw char by char to match grid perfectly
                for (let j = 0; j < line.length; j++) {
                    const x = j * preciseCharWidth;
                    ctx.fillText(line[j], x, y);
                }
            });

            ctx.restore();

            // Download
            const link = document.createElement('a');
            link.download = `matrix_capture_${Date.now()}.png`;
            link.href = captureCanvas.toDataURL('image/png');
            link.click();
        }
    }));

    const processFrame = useCallback(() => {
        const { imageSrc: src, density: d } = settingsRef.current;

        let source: HTMLVideoElement | HTMLImageElement | null = videoRef.current;

        if (src && imageRef.current) {
            source = imageRef.current;
            if (!imageRef.current.complete || imageRef.current.naturalWidth === 0) {
                requestAnimationFrame(processFrame);
                return;
            }
        } else {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || videoRef.current.readyState < 2) {
                requestAnimationFrame(processFrame);
                return;
            }
        }

        const canvas = canvasRef.current;
        if (!canvas) {
            requestAnimationFrame(processFrame);
            return;
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx || !containerRef.current || !measureRef.current) {
            requestAnimationFrame(processFrame);
            return;
        }

        const { clientWidth: viewWidth, clientHeight: viewHeight } = containerRef.current;
        const { width: charWidth, height: charHeight } = measureRef.current.getBoundingClientRect();

        if (charWidth === 0 || charHeight === 0) {
            requestAnimationFrame(processFrame);
            return;
        }

        const w = Math.floor(viewWidth / charWidth);
        const h = Math.floor(viewHeight / charHeight);

        if (w <= 0 || h <= 0) {
            requestAnimationFrame(processFrame);
            return;
        }

        const preciseCharWidth = viewWidth / w;
        const preciseLineHeight = viewHeight / h;

        if (preRef.current) {
            const letterSpacing = preciseCharWidth - charWidth;
            preRef.current.style.lineHeight = `${preciseLineHeight}px`;
            preRef.current.style.letterSpacing = `${letterSpacing}px`;
            preRef.current.style.width = `${viewWidth}px`;
            preRef.current.style.height = `${viewHeight}px`;
        }

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }

        let sourceWidth = 0;
        let sourceHeight = 0;

        if (src && imageRef.current) {
            sourceWidth = imageRef.current.naturalWidth;
            sourceHeight = imageRef.current.naturalHeight;
        } else if (videoRef.current) {
            sourceWidth = videoRef.current.videoWidth;
            sourceHeight = videoRef.current.videoHeight;
        }

        const videoAspect = sourceWidth / sourceHeight;
        const screenAspect = viewWidth / viewHeight;

        let sx = 0, sy = 0, sWidth = sourceWidth, sHeight = sourceHeight;

        if (screenAspect > videoAspect) {
            const newHeight = sourceWidth / screenAspect;
            sy = (sourceHeight - newHeight) / 2;
            sHeight = newHeight;
        } else {
            const newWidth = sourceHeight * screenAspect;
            sx = (sourceWidth - newWidth) / 2;
            sWidth = newWidth;
        }

        if (source) {
            ctx.drawImage(source as CanvasImageSource, sx, sy, sWidth, sHeight, 0, 0, w, h);
        }

        const imageData = ctx.getImageData(0, 0, w, h);
        const ascii = convertImageDataToAscii(imageData, w, h, d);

        if (preRef.current) {
            preRef.current.innerText = ascii;
        }

        // Update frame data for capture
        frameDataRef.current = { ascii, w, h, preciseCharWidth, preciseLineHeight };

        requestAnimationFrame(processFrame);
    }, []);

    useEffect(() => {
        if (imageSrc) {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            requestAnimationFrame(processFrame);
            return;
        }

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
    }, [imageSrc, processFrame]);

    return (
        <div
            ref={containerRef}
            className="ascii-container"
            style={{
                color: color,
                fontSize: `${fontSize}px`,
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

            {imageSrc && (
                <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="source"
                    style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', width: 1, height: 1 }}
                />
            )}

            <canvas
                ref={canvasRef}
                style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', width: 1, height: 1 }}
            />

            <span ref={measureRef} style={{ visibility: 'hidden', position: 'absolute', fontSize: `${fontSize}px`, fontFamily: 'monospace' }}>W</span>

            <pre ref={preRef} className="ascii-output" style={{ transform: imageSrc ? 'none' : 'scaleX(-1)' }}>
                Initializing System...
            </pre>
        </div>
    );
});

export default AsciiDisplay;
