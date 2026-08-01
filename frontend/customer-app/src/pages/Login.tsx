import { useState } from 'react'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth'
import { firebaseAuth } from '../lib/firebase'
import { saveSession, verifyCustomerToken } from '../lib/api'

type Step = 'phone' | 'otp'

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier
  }
}

function getRecaptchaVerifier() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
      size: 'invisible',
    })
  }
  return window.recaptchaVerifier
}

export default function Login({ onSuccess, onCancel }: { onSuccess: () => void; onCancel?: () => void }) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    try {
      const verifier = getRecaptchaVerifier()
      const result = await signInWithPhoneNumber(firebaseAuth, `+91${phone}`, verifier)
      setConfirmation(result)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!confirmation) return
    setLoading(true)
    try {
      const credential = await confirmation.confirm(otp)
      const idToken = await credential.user.getIdToken()
      const auth = await verifyCustomerToken({ idToken, name: name || undefined })
      saveSession(auth)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,#fffefb_0%,#f7f1e4_100%)] p-6 shadow-[0_35px_80px_rgba(18,32,24,0.22)]">
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(34,55,45,0.92),rgba(203,160,89,0.82))]" />
      {onCancel && (
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full bg-white/18 text-lg leading-none text-white backdrop-blur"
        >
          ✕
        </button>
      )}
      <div className="relative z-10 rounded-[28px] bg-white/10 p-4 text-white backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">Quick login</p>
        <h1 className="mt-2 text-2xl font-extrabold">Connect to Farm</h1>
        <p className="mt-2 text-sm text-white/78">
          {step === 'phone' ? 'Use your phone number to continue shopping in a Zepto-style flow.' : `Enter the OTP sent to +91 ${phone}`}
        </p>
      </div>

      <div className="relative z-10 mt-5 rounded-[28px] bg-white p-5 shadow-[0_18px_40px_rgba(24,43,32,0.08)]">
        <div className="mb-5 flex gap-2 rounded-full bg-[#f5efdf] p-1">
          <div className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold ${step === 'phone' ? 'bg-[#22372d] text-white' : 'text-[#667265]'}`}>
            1. Phone
          </div>
          <div className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold ${step === 'otp' ? 'bg-[#22372d] text-white' : 'text-[#667265]'}`}>
            2. OTP
          </div>
        </div>

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7e876f]">Mobile number</label>
            <div className="flex items-center rounded-[22px] border border-[#ddd4bd] bg-[#fbf8f1] px-4 py-3">
              <span className="mr-2 text-sm font-semibold text-[#5d6759]">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <p className="text-xs text-[#6e7768]">We use Firebase OTP verification. No password to remember.</p>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-[#22372d] py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7e876f]">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="rounded-[22px] border border-[#ddd4bd] bg-[#fbf8f1] px-4 py-3 text-sm outline-none focus:border-[#22372d]"
            />
            <input
              type="text"
              placeholder="Your name (first time only)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-[22px] border border-[#ddd4bd] bg-[#fbf8f1] px-4 py-3 text-sm outline-none focus:border-[#22372d]"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-[#22372d] py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify and continue'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="text-xs font-semibold text-[#6e7768] underline underline-offset-4"
            >
              Change phone number
            </button>
          </form>
        )}
      </div>

      {/* Required by Firebase for invisible reCAPTCHA */}
      <div id="recaptcha-container" />
    </div>
  )
}
