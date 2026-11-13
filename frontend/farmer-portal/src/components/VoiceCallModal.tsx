import { useState, useRef, useEffect, useMemo } from 'react'
import { Orb, type OrbSignal, type OrbState } from 'orb-ui'
import {
  sendVoiceChat,
  createFarmerProduct,
  type ProductDraft,
  type FarmerProduct,
} from '../lib/api'
import {
  PhoneOffIcon,
  MicIcon,
  MicOffIcon,
  SparklesIcon,
  CheckCircleIcon,
  PackageIcon,
} from './Icons'

type CallState = 'connecting' | 'ai_speaking' | 'listening' | 'processing' | 'ended'

interface VoiceCallModalProps {
  isOpen: boolean
  onClose: () => void
  onProductAdded: (product: FarmerProduct) => void
}

export function VoiceCallModal({
  isOpen,
  onClose,
  onProductAdded,
}: VoiceCallModalProps) {
  const [callState, setCallState] = useState<CallState>('connecting')
  const [callSeconds, setCallSeconds] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showKeypad, setShowKeypad] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [aiSpeakingVolume, setAiSpeakingVolume] = useState<number>(0)

  // Live subtitles
  const [lastFarmerSpeech, setLastFarmerSpeech] = useState<string>('')
  const [lastAssistantSpeech, setLastAssistantSpeech] = useState<string>(
    'నమస్కారం! కనెక్ట్‌టుఫార్మ్ వాయిస్ అసిస్టెంట్‌కి స్వాగతం. మీరు ఏ పంట చేర్చాలనుకుంటున్నారు?'
  )
  const [englishTranslation, setEnglishTranslation] = useState<string>(
    'Hello! Welcome to ConnectToFarm Voice Assistant. What crop would you like to list?'
  )

  // Inventory draft extracted during the call
  const [draft, setDraft] = useState<ProductDraft>({ unit: 'kg' })
  const [confirmedProduct, setConfirmedProduct] = useState<FarmerProduct | null>(null)
  const [micVolume, setMicVolume] = useState<number>(0)

  // Stable references for state to break dependency cycles
  const draftRef = useRef<ProductDraft>(draft)
  draftRef.current = draft

  const historyRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([])

  const isMutedRef = useRef(isMuted)
  isMutedRef.current = isMuted

  const onProductAddedRef = useRef(onProductAdded)
  onProductAddedRef.current = onProductAdded

  const isMountedRef = useRef(true)
  const audioContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null)
  const callTimerRef = useRef<number | null>(null)
  const hasSpokenRef = useRef(false)

  // Function refs to allow mutual calls without dependency cycle
  const startListeningRef = useRef<() => void>(() => {})
  const playAssistantAudioRef = useRef<(base64: string) => void>(() => {})
  const processFarmerAudioRef = useRef<(blob: Blob) => void>(() => {})

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const cleanupCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }

    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause()
      activeAudioElementRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {}
      mediaRecorderRef.current = null
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close()
      } catch {}
      audioContextRef.current = null
    }
  }

  // Organic speaking audio wave modulation for the AI voice
  useEffect(() => {
    if (callState !== 'ai_speaking') {
      setAiSpeakingVolume(0)
      return
    }

    let frameId: number
    const start = performance.now()
    const updateWave = (now: number) => {
      const t = (now - start) / 1000
      const envelope = 0.55 + 0.3 * Math.sin(t * 14) * Math.cos(t * 7) + 0.15 * Math.sin(t * 23)
      setAiSpeakingVolume(Math.max(0.15, Math.min(1, envelope)))
      frameId = requestAnimationFrame(updateWave)
    }

    frameId = requestAnimationFrame(updateWave)
    return () => cancelAnimationFrame(frameId)
  }, [callState])

  // Map application call states to normalized OrbSignal
  const orbSignal: OrbSignal = useMemo(() => {
    let state: OrbState = 'idle'
    if (errorMessage) {
      state = 'error'
    } else if (callState === 'connecting') {
      state = 'connecting'
    } else if (callState === 'listening') {
      state = 'listening'
    } else if (callState === 'processing') {
      state = 'thinking'
    } else if (callState === 'ai_speaking') {
      state = 'speaking'
    } else if (callState === 'ended') {
      state = 'idle'
    }

    return {
      state,
      inputVolume: callState === 'listening' ? Math.min(1, micVolume / 65) : 0,
      outputVolume: callState === 'ai_speaking' ? aiSpeakingVolume : 0,
      error: errorMessage || undefined,
    }
  }, [callState, micVolume, aiSpeakingVolume, errorMessage])

  // Handle incoming audio from farmer
  processFarmerAudioRef.current = async (blob: Blob) => {
    setCallState('processing')
    setErrorMessage(null)

    try {
      const res = await sendVoiceChat('', {
        audioBlob: blob,
        draft: draftRef.current,
        history: historyRef.current,
      })

      if (!isMountedRef.current) return

      if (res.transcript) {
        setLastFarmerSpeech(res.transcript)
        historyRef.current.push({ role: 'user', content: res.transcript })
      }
      if (res.teluguReply) {
        setLastAssistantSpeech(res.teluguReply)
        historyRef.current.push({ role: 'assistant', content: res.teluguReply })
      }
      if (res.englishSummary) setEnglishTranslation(res.englishSummary)

      draftRef.current = res.updatedDraft
      setDraft(res.updatedDraft)

      if (res.createdProduct) {
        setConfirmedProduct(res.createdProduct)
        onProductAddedRef.current(res.createdProduct)
      }

      if (res.audioBase64) {
        playAssistantAudioRef.current(res.audioBase64)
      } else {
        setTimeout(() => {
          if (isMountedRef.current) startListeningRef.current()
        }, 1500)
      }
    } catch (err) {
      console.error('Call processing failed:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Processing failed')
      setTimeout(() => {
        if (isMountedRef.current) startListeningRef.current()
      }, 2000)
    }
  }

  // Play audio response and auto-listen on finish
  playAssistantAudioRef.current = (base64Audio: string) => {
    setCallState('ai_speaking')

    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause()
    }

    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`)
    activeAudioElementRef.current = audio

    audio.onended = () => {
      if (!isMountedRef.current) return
      startListeningRef.current()
    }

    audio.onerror = () => {
      if (isMountedRef.current) startListeningRef.current()
    }

    audio.play().catch((err) => {
      console.warn('Autoplay error:', err)
      startListeningRef.current()
    })
  }

  // Listen hands-free with VAD (Voice Activity Detection)
  startListeningRef.current = async () => {
    if (isMutedRef.current || !isMountedRef.current) return
    setCallState('listening')
    setErrorMessage(null)
    audioChunksRef.current = []
    hasSpokenRef.current = false

    try {
      let stream = micStreamRef.current
      if (!stream || !stream.active) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStreamRef.current = stream
      }

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioCtx = new AudioCtx()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        })
        if (audioBlob.size > 1500 && hasSpokenRef.current) {
          processFarmerAudioRef.current(audioBlob)
        } else if (isMountedRef.current) {
          // No audible speech was captured; restart listening loop smoothly
          startListeningRef.current()
        }
      }

      mediaRecorder.start(250)

      let silenceStart: number | null = null

      const checkVolume = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return

        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength
        setMicVolume(Math.min(100, Math.round(average * 1.8)))

        const SPEECH_THRESHOLD = 18
        const SILENCE_DURATION_MS = 1600

        if (average > SPEECH_THRESHOLD) {
          hasSpokenRef.current = true
          silenceStart = null
        } else if (hasSpokenRef.current) {
          if (!silenceStart) {
            silenceStart = Date.now()
          } else if (Date.now() - silenceStart > SILENCE_DURATION_MS) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop()
              return
            }
          }
        }

        requestAnimationFrame(checkVolume)
      }

      requestAnimationFrame(checkVolume)
    } catch (err) {
      console.error('Microphone error:', err)
      setErrorMessage('Microphone access failed. Please check permissions.')
    }
  }

  // Effect to manage the call life-cycle strictly on isOpen changes
  useEffect(() => {
    isMountedRef.current = true

    if (!isOpen) {
      cleanupCall()
      return
    }

    setCallState('connecting')
    setCallSeconds(0)
    setConfirmedProduct(null)
    setDraft({ unit: 'kg' })
    draftRef.current = { unit: 'kg' }
    historyRef.current = []

    callTimerRef.current = window.setInterval(() => {
      setCallSeconds((s) => s + 1)
    }, 1000)

    // Trigger initial greeting from Sarvam AI
    const initTimer = setTimeout(async () => {
      try {
        const res = await sendVoiceChat('', {
          text: 'నమస్కారం, నేను రైతుని.',
          draft: { unit: 'kg' },
          history: [],
        })

        if (!isMountedRef.current) return

        if (res.teluguReply) {
          setLastAssistantSpeech(res.teluguReply)
          historyRef.current.push({ role: 'assistant', content: res.teluguReply })
        }
        if (res.englishSummary) setEnglishTranslation(res.englishSummary)
        if (res.updatedDraft) {
          draftRef.current = res.updatedDraft
          setDraft(res.updatedDraft)
        }

        if (res.audioBase64) {
          playAssistantAudioRef.current(res.audioBase64)
        } else {
          startListeningRef.current()
        }
      } catch (err) {
        console.error('Initial greeting call failed:', err)
        startListeningRef.current()
      }
    }, 1000)

    return () => {
      isMountedRef.current = false
      clearTimeout(initTimer)
      cleanupCall()
    }
  }, [isOpen])

  const handleDoneSpeaking = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      hasSpokenRef.current = true
      mediaRecorderRef.current.stop()
    }
  }

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || callState === 'processing') return

    const input = textInput.trim()
    setTextInput('')
    setCallState('processing')
    setLastFarmerSpeech(input)

    try {
      historyRef.current.push({ role: 'user', content: input })
      const res = await sendVoiceChat('', {
        text: input,
        draft: draftRef.current,
        history: historyRef.current,
      })

      if (res.teluguReply) {
        setLastAssistantSpeech(res.teluguReply)
        historyRef.current.push({ role: 'assistant', content: res.teluguReply })
      }
      if (res.englishSummary) setEnglishTranslation(res.englishSummary)

      draftRef.current = res.updatedDraft
      setDraft(res.updatedDraft)

      if (res.createdProduct) {
        setConfirmedProduct(res.createdProduct)
        onProductAddedRef.current(res.createdProduct)
      }

      if (res.audioBase64) {
        playAssistantAudioRef.current(res.audioBase64)
      } else {
        setTimeout(startListeningRef.current, 1500)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send text')
      startListeningRef.current()
    }
  }

  const handleConfirmProduce = async () => {
    if (!draft.name || !draft.stock || !draft.price) {
      setErrorMessage('Awaiting complete details (Name, Quantity, Price) before confirming.')
      return
    }

    setCallState('processing')
    try {
      const cleanPrice = String(draft.price).replace(/[^\d.]/g, '') || '0'
      const cleanStock = Math.floor(Number(draft.stock) || 0)
      const productPayload: ProductDraft = {
        ...draft,
        price: cleanPrice,
        stock: cleanStock,
        unit: draft.unit || 'kg',
      }

      const created = await createFarmerProduct('', productPayload)
      setConfirmedProduct(created)
      onProductAddedRef.current(created)
      setLastAssistantSpeech('ధన్యవాదాలు! మీ సరుకు విజయవంతంగా ఇన్వెంటరీలో చేర్చబడింది.')
      setEnglishTranslation(`Successfully added "${created.name}" to your farm inventory!`)

      const audioRes = await sendVoiceChat('', {
        text: 'ధృవీకరించబడింది',
        draft: productPayload,
      })
      if (audioRes.audioBase64) {
        playAssistantAudioRef.current(audioRes.audioBase64)
      }
    } catch (err) {
      console.error('Confirmation failed:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Confirmation failed')
      startListeningRef.current()
    }
  }

  const handleEndCall = () => {
    cleanupCall()
    setCallState('ended')
    setTimeout(() => {
      onClose()
    }, 500)
  }

  if (!isOpen) return null

  const isDraftReady = Boolean(draft.name && draft.stock && draft.price)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Smartphone Call Card */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#0a2312] via-[#0f3319] to-[#081a0d] text-white rounded-[2.5rem] shadow-2xl border border-emerald-500/20 overflow-hidden flex flex-col justify-between min-h-[580px] max-h-[92vh]">
        {/* Call Header */}
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Voice Call • Sarvam AI
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            ConnectToFarm Assistant
          </h2>
          <p className="text-xs text-emerald-300/80 font-medium">
            Telugu Native Voice (కవిత)
          </p>
          <div className="text-sm font-mono text-emerald-400/90 font-medium mt-1">
            {callState === 'connecting' ? 'Connecting...' : formatTime(callSeconds)}
          </div>
        </div>

        {/* Center Stage: Animated Cloud Voice Orb (orb-ui) */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 sm:py-3">
          <div className="relative flex items-center justify-center my-3">
            {/* Ambient Background Aura */}
            <div
              className={`absolute w-56 h-56 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
                callState === 'ai_speaking'
                  ? 'bg-emerald-500/30 opacity-100 scale-110'
                  : callState === 'listening'
                  ? 'bg-emerald-400/35 opacity-90'
                  : callState === 'processing'
                  ? 'bg-blue-500/25 opacity-80'
                  : 'bg-emerald-600/20 opacity-50'
              }`}
            />

            {/* Cloud Orb Component */}
            <div className="relative z-10 p-2 flex items-center justify-center">
              <Orb
                signal={orbSignal}
                theme="cloud"
                size={190}
                aria-label={`ConnectToFarm voice assistant is ${orbSignal.state}`}
              />
            </div>
          </div>

          {/* Dynamic Status Text */}
          <div className="text-center mb-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                callState === 'ai_speaking'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : callState === 'listening'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                  : callState === 'processing'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {callState === 'ai_speaking' && '🔊 Kavitha is Speaking...'}
              {callState === 'listening' && '🎙️ Listening to You (Speak in Telugu)...'}
              {callState === 'processing' && '⏳ Processing with Sarvam AI...'}
              {callState === 'connecting' && '📞 Connecting Call...'}
              {callState === 'ended' && 'Call Ended'}
            </span>
          </div>

          {/* Live Subtitle Card (Telugu + English) */}
          <div className="w-full bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left shadow-lg space-y-2 max-h-36 overflow-y-auto">
            {lastAssistantSpeech && (
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400 block">
                  Assistant (Telugu)
                </span>
                <p className="text-xs font-medium text-white/95 leading-relaxed">
                  {lastAssistantSpeech}
                </p>
                <p className="text-[11px] text-white/60 italic mt-0.5">
                  "{englishTranslation}"
                </p>
              </div>
            )}

            {lastFarmerSpeech && (
              <div className="pt-2 border-t border-white/10">
                <span className="text-[10px] font-medium uppercase tracking-wider text-amber-300 block">
                  You (Telugu)
                </span>
                <p className="text-xs font-medium text-white/90">
                  {lastFarmerSpeech}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live Detected Produce HUD (English) */}
        <div className="mx-6 mb-3 p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
              Live Produce Sync (English)
            </span>
            {confirmedProduct ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Added to Inventory!</span>
              </div>
            ) : isDraftReady ? (
              <button
                type="button"
                onClick={handleConfirmProduce}
                disabled={callState === 'processing'}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-semibold text-xs shadow-lg shadow-emerald-500/30 transition cursor-pointer animate-pulse"
              >
                <PackageIcon className="w-3.5 h-3.5 text-white" />
                <span>✓ Confirm & Add Produce</span>
              </button>
            ) : (
              <span className="text-[10px] font-medium text-white/50">
                Listening for details...
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-black/30 rounded-xl p-1.5">
              <span className="text-[9px] uppercase text-white/40 block">Produce</span>
              <span className="font-semibold text-white text-[11px] truncate block">
                {draft.name || '—'}
              </span>
            </div>
            <div className="bg-black/30 rounded-xl p-1.5">
              <span className="text-[9px] uppercase text-white/40 block">Category</span>
              <span className="font-semibold text-white text-[11px] truncate block">
                {draft.categoryName || '—'}
              </span>
            </div>
            <div className="bg-black/30 rounded-xl p-1.5">
              <span className="text-[9px] uppercase text-white/40 block">Quantity</span>
              <span className="font-semibold text-white text-[11px] truncate block">
                {draft.stock ? `${draft.stock} ${draft.unit || 'kg'}` : '—'}
              </span>
            </div>
            <div className="bg-black/30 rounded-xl p-1.5">
              <span className="text-[9px] uppercase text-white/40 block">Price</span>
              <span className="font-semibold text-emerald-300 text-[11px] truncate block">
                {draft.price ? `₹${draft.price}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-6 mb-2 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-medium text-center">
            {errorMessage}
          </div>
        )}

        {/* Optional Keypad Input Tray */}
        {showKeypad && (
          <form onSubmit={handleSendText} className="mx-6 mb-3 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type in Telugu or English..."
              disabled={callState === 'processing'}
              className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || callState === 'processing'}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40"
            >
              Send
            </button>
          </form>
        )}

        {/* In-Call Phone Action Controls */}
        <div className="px-6 pb-6 pt-2 bg-black/30 border-t border-white/5 flex items-center justify-around">
          {/* Mute Mic Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-xs font-semibold transition cursor-pointer ${
              isMuted
                ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40 shadow-inner'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOffIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
            <span className="text-[9px] mt-0.5">{isMuted ? 'Muted' : 'Mic'}</span>
          </button>

          {/* Red End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl flex items-center justify-center transition transform active:scale-95 cursor-pointer border-2 border-red-400/30 shadow-red-600/50"
            title="End Call"
          >
            <PhoneOffIcon className="w-7 h-7" />
          </button>

          {/* Action Button: Priority to Add when ready, else Done Speaking or Chat */}
          {isDraftReady && !confirmedProduct ? (
            <button
              type="button"
              onClick={handleConfirmProduce}
              className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex flex-col items-center justify-center text-xs font-semibold shadow-lg shadow-emerald-500/50 transition animate-bounce cursor-pointer border border-emerald-300/40"
              title="Confirm & Add Produce"
            >
              <PackageIcon className="w-5 h-5 text-white" />
              <span className="text-[9px] mt-0.5 font-semibold">Add</span>
            </button>
          ) : callState === 'listening' ? (
            <button
              type="button"
              onClick={handleDoneSpeaking}
              className="w-12 h-12 rounded-full bg-emerald-500/30 hover:bg-emerald-500/40 border border-emerald-400/40 text-emerald-300 flex flex-col items-center justify-center text-xs font-semibold transition cursor-pointer"
              title="Done Speaking"
            >
              <CheckCircleIcon className="w-5 h-5 text-emerald-300" />
              <span className="text-[9px] mt-0.5">Done</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowKeypad((k) => !k)}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex flex-col items-center justify-center text-xs font-semibold transition cursor-pointer"
              title="Toggle Keypad"
            >
              <SparklesIcon className="w-5 h-5 text-emerald-400" />
              <span className="text-[9px] mt-0.5">Chat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
