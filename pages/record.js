import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { Mic, CheckCircle2, AlertTriangle, Camera, X } from 'lucide-react';
import { Btn, Spinner } from '../components/ui';

const PHASE = { idle: 'idle', recording: 'recording', processing: 'processing', done: 'done', error: 'error' };

export default function RecordPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [phase, setPhase] = useState(PHASE.idle);
  const [elapsed, setElapsed] = useState(0);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [flash, setFlash] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

useEffect(() => {
    if (!user) router.replace('/login');
    return () => {
      clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [user]);

  const getSupportedAudioMimeType = () => {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
  };

  // Whisper picks its decoder off the filename extension. iOS Safari records
  // audio/mp4 (not webm), so the uploaded filename must match the blob's
  // actual mime type or OpenAI rejects it as an invalid file format.
  const extFromMime = (mime) => {
    const type = (mime || '').split(';')[0].trim();
    const map = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav' };
    return map[type] || 'webm';
  };

  const startRecording = async () => {
    setError('');
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } }, audio: true });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
      }
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }

      // Record audio only. The camera video is only ever shown live in the
      // viewfinder above — it is never captured into the uploaded file.
      // Whisper only transcribes audio, and including the video track was
      // what pushed recordings past Vercel's 4.5MB request-body limit.
      //
      // Get a fresh, independent audio-only stream for the recorder rather
      // than cloning tracks out of the combined stream above: some browsers
      // (notably iOS Safari) don't reliably produce MediaRecorder data from
      // a MediaStream built out of tracks copied from another stream.
      // Permission was already granted by the getUserMedia call above, so
      // this resolves silently with no second prompt.
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = audioStream;
      const recorder = new MediaRecorder(audioStream, { mimeType: getSupportedAudioMimeType(), audioBitsPerSecond: 32000 });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      mediaRecorderRef.current = recorder;

      setPhase(PHASE.recording);
      setElapsed(0);
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setElapsed(elapsed);
        if (elapsed >= 600) stopAndProcess();
      }, 1000);
    } catch (e) {
      setError(e.name === 'NotAllowedError' ? 'Camera/mic access denied. Please allow in browser settings.' : `Camera error: ${e.message}`);
      setPhase(PHASE.error);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    const maxW = 1024;
    const scale = Math.min(1, maxW / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setPhotos(p => [...p, { id: 'ph_' + Date.now(), dataUrl }]);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  };

  const removePhoto = (id) => setPhotos(p => p.filter(ph => ph.id !== id));

  const stopAndProcess = () => {
    clearInterval(timerRef.current);
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.onstop = async () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      if (blob.size < 500) {
        setError('No audio was captured. Check that microphone access is allowed for this site in your browser settings, then try again.');
        setPhase(PHASE.error);
        return;
      }
      await processRecording(blob);
    };
    recorder.stop();
    setPhase(PHASE.processing);
  };

  const processRecording = async (blob) => {
    try {
      // Step 1: Transcribe via our server-side proxy (pages/api/transcribe.js).
      // The OpenAI API key stays server-side there and is never exposed to
      // the browser. The audio-only blob is small (well under Vercel's
      // 4.5MB limit even at a full 10-minute cap), unlike the old video+audio recording.
      setStep('Transcribing your recording...');
      const formData = new FormData();
      formData.append('file', blob, `recording.${extFromMime(blob.type)}`);
      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!transcribeRes.ok) {
        const err = await transcribeRes.json().catch(() => ({}));
        throw new Error(err.error || 'Transcription failed');
      }
      const { text: transcript } = await transcribeRes.json();

      // Step 2: Generate estimate
      setStep('Generating your estimate with AI...');
      const estimateRes = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      if (!estimateRes.ok) {
        const err = await estimateRes.json();
        throw new Error(err.error || 'Estimate generation failed');
      }
      const { lineItems, scope } = await estimateRes.json();

      setResult({ transcript, lineItems, scope, photos: photos.map(p => p.dataUrl) });
      setPhase(PHASE.done);
    } catch (e) {
      setError(e.message);
      setPhase(PHASE.error);
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Done — navigate to quote editor
  useEffect(() => {
    if (phase === PHASE.done && result) {
      // Store in sessionStorage and redirect
      sessionStorage.setItem('pendingQuote', JSON.stringify(result));
      router.push('/quotes/new');
    }
  }, [phase, result]);

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Video viewfinder */}
      <video ref={videoRef} muted playsInline autoPlay style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: phase === PHASE.recording ? 1 : 0.15 }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {flash && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.7, zIndex: 20, pointerEvents: 'none' }} />}

      {/* Overlay */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        {/* Header */}
        <div style={{ padding: 'calc(16px + env(safe-area-inset-top)) 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: 12, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>‹</button>
          <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: 0, fontFamily: "'Sora', sans-serif" }}>Record Job Site</h2>
          {phase === PHASE.recording && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {photos.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Camera size={13} color="#fff" />
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{photos.length}</span>
                </div>
              )}
              <div style={{ background: 'rgba(220,38,38,0.8)', borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: 4, background: '#fff', animation: 'blink 1s ease infinite' }} />
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{fmt(elapsed)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Center content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          {phase === PHASE.idle && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 40, background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Mic size={36} color="#fff" strokeWidth={1.75} /></div>
              <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px', fontFamily: "'Sora', sans-serif" }}>Ready to record</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>Walk the job site and describe the work out loud — in any language. Tap the camera button anytime to snap photos too.</p>
            </div>
          )}

          {phase === PHASE.processing && (
            <div style={{ textAlign: 'center' }}>
              <Spinner size={48} color="#fff" />
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '20px 0 6px', fontFamily: "'Sora', sans-serif" }}>Processing...</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>{step}</p>
            </div>
          )}

          {phase === PHASE.done && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><CheckCircle2 size={52} color="#22c55e" strokeWidth={1.75} /></div>
              <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: "'Sora', sans-serif" }}>Estimate ready!</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Redirecting to editor...</p>
            </div>
          )}

          {phase === PHASE.error && (
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><AlertTriangle size={44} color="#fbbf24" strokeWidth={1.75} /></div>
              <p style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: '0 0 10px', fontFamily: "'Sora', sans-serif" }}>Something went wrong</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '0 0 28px', lineHeight: 1.5 }}>{error}</p>
              <Btn onClick={() => { setPhase(PHASE.idle); setError(''); }} variant="secondary">Try Again</Btn>
            </div>
          )}
        </div>

        {/* Photo thumbnail strip */}
        {phase === PHASE.recording && photos.length > 0 && (
          <div style={{ display: 'flex', gap: 8, padding: '0 20px 12px', overflowX: 'auto' }}>
            {photos.map(p => (
              <div key={p.id} style={{ position: 'relative', flexShrink: 0 }}>
                <img src={p.dataUrl} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }} />
                <button onClick={() => removePhoto(p.id)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, background: '#dc2626', border: '2px solid #0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                  <X size={11} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom controls */}
        <div style={{ padding: '24px 32px calc(32px + env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'center' }}>
          {phase === PHASE.idle && (
            <button
              onClick={startRecording}
              style={{ width: 72, height: 72, borderRadius: 36, background: '#2563eb', border: '4px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 8px rgba(37,99,235,0.2)', animation: 'pulse 2s ease infinite' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 16, background: '#fff' }} />
            </button>
          )}

          {phase === PHASE.recording && (
            <>
              <button
                onClick={capturePhoto}
                style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Camera size={24} color="#fff" strokeWidth={2} />
              </button>
              <button
                onClick={stopAndProcess}
                style={{ width: 72, height: 72, borderRadius: 36, background: '#dc2626', border: '4px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <div style={{ width: 24, height: 24, borderRadius: 4, background: '#fff' }} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
