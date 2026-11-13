import { useState, useRef, useEffect } from 'react'
import {
  sendVoiceChat,
  createFarmerProduct,
  type ProductDraft,
  type FarmerProduct,
} from '../lib/api'

type ChatMessage = {
  id: string
  sender: 'farmer' | 'assistant'
  teluguText?: string
  englishText?: string
  audioBase64?: string | null
}

interface VoiceAssistantModalProps {
  accessToken: string
  isOpen: boolean
  onClose: () => void
  onProductAdded: (product: FarmerProduct) => void
}

export function VoiceAssistantModal({
  accessToken,
  isOpen,
  onClose,
  onProductAdded,
}: VoiceAssistantModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      teluguText: 'నమస్కారం! మీరు ఇన్వెంటరీలో ఏ పంట చేర్చాలనుకుంటున్నారో చెప్పండి. (ఉదాహరణకు: నా దగ్గర 50 కేజీల కందులు ఉన్నాయి)',
      englishText:
        'Hello! Tell me what crop or produce you want to add to your inventory. (For example: "I have 50 kg of toor dal / pulses")',
    },
  ])

  const [draft, setDraft] = useState<ProductDraft>({ unit: 'kg' })
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successProduct, setSuccessProduct] = useState<FarmerProduct | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isProcessing])

  function playAudio(base64Audio: string) {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
      }
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`)
      currentAudioRef.current = audio
      audio.play().catch((e) => console.log('Audio autoplay blocked or cancelled:', e))
    } catch (e) {
      console.error('Audio play error:', e)
    }
  }

  async function startRecording() {
    setErrorMessage(null)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : undefined,
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        })
        if (audioBlob.size > 1000) {
          await handleSendAudio(audioBlob)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(200)
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone error:', err)
      setErrorMessage(
        'Could not access microphone. Please check browser microphone permissions or type below.'
      )
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  async function handleSendAudio(audioBlob: Blob) {
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const res = await sendVoiceChat(accessToken, {
        audioBlob,
        draft,
      })

      const farmerMsgId = `f-${Date.now()}`
      const assistantMsgId = `a-${Date.now()}`

      setMessages((prev) => [
        ...prev,
        {
          id: farmerMsgId,
          sender: 'farmer',
          teluguText: res.transcript || '(Audio input)',
          englishText: res.englishSummary || 'Audio query processed',
        },
        {
          id: assistantMsgId,
          sender: 'assistant',
          teluguText: res.teluguReply,
          englishText: res.englishSummary,
          audioBase64: res.audioBase64,
        },
      ])

      setDraft(res.updatedDraft)

      if (res.audioBase64) {
        playAudio(res.audioBase64)
      }

      if (res.createdProduct) {
        setSuccessProduct(res.createdProduct)
        onProductAdded(res.createdProduct)
      }
    } catch (err) {
      console.error('Voice chat error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleSendText(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!textInput.trim() || isProcessing) return

    const input = textInput.trim()
    setTextInput('')
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const res = await sendVoiceChat(accessToken, {
        text: input,
        draft,
      })

      setMessages((prev) => [
        ...prev,
        {
          id: `f-${Date.now()}`,
          sender: 'farmer',
          teluguText: input,
          englishText: res.englishSummary,
        },
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          teluguText: res.teluguReply,
          englishText: res.englishSummary,
          audioBase64: res.audioBase64,
        },
      ])

      setDraft(res.updatedDraft)

      if (res.audioBase64) {
        playAudio(res.audioBase64)
      }

      if (res.createdProduct) {
        setSuccessProduct(res.createdProduct)
        onProductAdded(res.createdProduct)
      }
    } catch (err) {
      console.error('Send text error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleManualConfirm() {
    if (!draft.name || !draft.categoryId || !draft.stock || !draft.price) {
      setErrorMessage('Please provide all details (Crop Name, Category, Stock, Price) before confirming.')
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const created = await createFarmerProduct(accessToken, draft)
      setSuccessProduct(created)
      onProductAdded(created)

      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'assistant',
          teluguText: 'ధన్యవాదాలు! మీ సరుకు విజయవంతంగా ఇన్వెంటరీలో చేర్చబడింది.',
          englishText: `Successfully created product "${created.name}" in your inventory!`,
        },
      ])
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add product')
    } finally {
      setIsProcessing(false)
    }
  }

  function handleReset() {
    setDraft({ unit: 'kg' })
    setSuccessProduct(null)
    setErrorMessage(null)
    setMessages([
      {
        id: 'init-reset',
        sender: 'assistant',
        teluguText: 'నమస్కారం! మీరు ఇన్వెంటరీలో ఏ పంట చేర్చాలనుకుంటున్నారో చెప్పండి. (ఉదా: నా దగ్గర 50 కేజీల కందులు ఉన్నాయి)',
        englishText: 'Tell me what crop you want to add to your inventory. (For example: "I have 50 kg of toor dal")',
      },
    ])
  }

  if (!isOpen) return null

  const isDraftReady = Boolean(draft.name && draft.categoryId && draft.stock && draft.price)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-neutral-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header (English) */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#164220] text-white flex items-center justify-center text-lg shadow-sm">
              🎙️
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
                Voice Inventory Assistant
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-[#164220] border border-emerald-200">
                  Sarvam AI Powered
                </span>
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Talk in Telugu (తెలుగు) • Real-time English inventory sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Live Detected Parameters Card (English) */}
        <div className="px-6 py-3 bg-neutral-50/80 border-b border-neutral-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Live Product Details (Detected in English)
            </span>
            {successProduct ? (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                ✓ Added to Inventory
              </span>
            ) : isDraftReady ? (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md animate-pulse">
                Ready for Confirmation
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                Collecting details...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Crop / Name</span>
              <span className="font-semibold text-neutral-800 truncate block">
                {draft.name || <span className="text-neutral-300 font-normal italic">Pending...</span>}
              </span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Category</span>
              <span className="font-semibold text-neutral-800 truncate block">
                {draft.categoryName || <span className="text-neutral-300 font-normal italic">Pending...</span>}
              </span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Quantity</span>
              <span className="font-semibold text-neutral-800 truncate block">
                {draft.stock !== undefined && draft.stock !== null ? (
                  `${draft.stock} ${draft.unit || 'kg'}`
                ) : (
                  <span className="text-neutral-300 font-normal italic">Pending...</span>
                )}
              </span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Unit Price</span>
              <span className="font-semibold text-[#164220] truncate block">
                {draft.price ? `₹${draft.price} / ${draft.unit || 'kg'}` : (
                  <span className="text-neutral-300 font-normal italic">Pending...</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Conversation Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-neutral-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'farmer' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-2xs ${
                  m.sender === 'farmer'
                    ? 'bg-[#164220] text-white rounded-br-none'
                    : 'bg-white border border-neutral-200 text-neutral-900 rounded-bl-none'
                }`}
              >
                {/* Spoken Telugu Content */}
                {m.teluguText && (
                  <div className="mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-70 mb-0.5">
                      {m.sender === 'farmer' ? '🗣️ Spoken in Telugu' : '🌾 Assistant (Telugu)'}
                    </span>
                    <p className="text-sm font-semibold leading-relaxed">{m.teluguText}</p>
                  </div>
                )}

                {/* English Meaning / Translation */}
                {m.englishText && (
                  <div
                    className={`pt-2 border-t text-xs ${
                      m.sender === 'farmer'
                        ? 'border-white/20 text-emerald-100'
                        : 'border-neutral-100 text-neutral-600'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-70 mb-0.5">
                      🌐 English Meaning
                    </span>
                    <p className="italic">{m.englishText}</p>
                  </div>
                )}

                {/* Replay Voice Button */}
                {m.audioBase64 && (
                  <button
                    onClick={() => playAudio(m.audioBase64!)}
                    className="mt-2 text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#164220] hover:bg-emerald-100 font-semibold transition border border-emerald-200"
                  >
                    <span>🔊</span> Play Voice
                  </button>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 text-[#164220] rounded-2xl w-fit border border-emerald-200 animate-pulse text-xs font-semibold">
              <span className="animate-spin text-base">⏳</span>
              Sarvam AI is transcribing speech and understanding parameters...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="px-6 py-2 bg-red-50 border-t border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800">
              ✕
            </button>
          </div>
        )}

        {/* Success notification */}
        {successProduct && (
          <div className="px-6 py-3 bg-emerald-600 text-white flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-2">
              <span>🎉</span>
              Successfully added "{successProduct.name}" to your inventory!
            </span>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-white text-emerald-800 rounded-lg hover:bg-emerald-50 transition"
            >
              Add Another Product
            </button>
          </div>
        )}

        {/* Interactive Controls Bar (English) */}
        <div className="p-4 bg-white border-t border-neutral-200 flex flex-col gap-3">
          {/* Main Voice Button */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={isProcessing}
                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#164220] hover:bg-[#0f2e16] text-white text-sm font-semibold shadow-lg transition disabled:opacity-60 cursor-pointer"
              >
                <span className="text-xl">🎙️</span>
                <span>Click to Speak (Telugu)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-lg animate-pulse transition cursor-pointer"
              >
                <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
                <span>Listening... Click to Finish</span>
              </button>
            )}

            {isDraftReady && !successProduct && (
              <button
                type="button"
                onClick={handleManualConfirm}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <span>✓</span>
                <span>Confirm & Add Product</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="p-3 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-2xl transition text-xs font-semibold"
              title="Reset conversation"
            >
              🔄 Reset
            </button>
          </div>

          {/* Fallback Text Input (Telugu or English) */}
          <form onSubmit={handleSendText} className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type here in Telugu or English (e.g. నా దగ్గర 50 కేజీల కందులు ఉన్నాయి)..."
              disabled={isProcessing || isRecording}
              className="flex-1 rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-medium text-neutral-900 outline-none focus:border-[#164220] focus:ring-1 focus:ring-[#164220] transition"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
