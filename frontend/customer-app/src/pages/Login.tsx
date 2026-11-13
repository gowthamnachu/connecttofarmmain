import { useState } from 'react'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth'
import { firebaseAuth } from '../lib/firebase'
import { checkCustomerPhone, saveSession, verifyCustomerToken } from '../lib/api'

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
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    setLoading(true)
    try {
      const userCheck = await checkCustomerPhone(phone)
      setIsExistingUser(userCheck.exists)
      if (userCheck.name) setName(userCheck.name)

      const verifier = getRecaptchaVerifier()
      const result = await signInWithPhoneNumber(firebaseAuth, `+91${phone}`, verifier)
      setConfirmation(result)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!confirmation) return
    if (!isExistingUser && !name.trim()) {
      setError('Please enter your full name for sign-up')
      return
    }
    setLoading(true)
    try {
      const credential = await confirmation.confirm(otp)
      const idToken = await credential.user.getIdToken()
      const auth = await verifyCustomerToken({ idToken, name: name.trim() || undefined })
      saveSession(auth)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP entered')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-3xl bg-white text-gray-900 shadow-2xl border border-gray-100 font-sans">
      {/* Top Banner / Illustration Container */}
      <div className="relative bg-gradient-to-b from-[#E8DFC9] via-[#F4EFE6] to-white p-5 pt-4 pb-2 text-center overflow-hidden rounded-b-[2.5rem] border-b border-gray-100">
        {/* Skip Pill Button (Top Right) */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 z-20 rounded-full bg-white/95 backdrop-blur px-4 py-1 text-xs font-semibold text-slate-700 shadow-md border border-gray-200 hover:bg-white hover:shadow-lg transition"
          >
            Skip
          </button>
        )}

        {/* Quick Commerce Delivery Graphic Banner */}
        <div className="mx-auto my-2 h-44 w-full flex items-center justify-center">
          <svg className="w-full h-full max-h-40" viewBox="0 0 380 170" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="190" cy="140" rx="160" ry="30" fill="#E8DFC9" opacity="0.5" />
            <ellipse cx="70" cy="45" rx="45" ry="25" fill="white" opacity="0.85" />
            <ellipse cx="310" cy="55" rx="55" ry="30" fill="white" opacity="0.85" />
            <ellipse cx="200" cy="28" rx="35" ry="20" fill="white" opacity="0.9" />

            {/* Delivery Bag */}
            <path d="M135 65 L245 65 L235 155 C235 160 230 165 225 165 L155 165 C150 165 145 160 145 155 Z" fill="#D4A373" stroke="#8C5E34" strokeWidth="3" />
            <path d="M165 65 C165 42 185 42 185 65" stroke="#5C3A21" strokeWidth="4" fill="none" />
            <path d="M195 65 C195 42 215 42 215 65" stroke="#5C3A21" strokeWidth="4" fill="none" />

            {/* Fresh Veggies & Organic Produce */}
            <circle cx="162" cy="60" r="14" fill="#E74C3C" />
            <circle cx="158" cy="53" r="3.5" fill="#27AE60" />
            <circle cx="218" cy="60" r="14" fill="#E74C3C" />
            <circle cx="222" cy="53" r="3.5" fill="#27AE60" />
            <rect x="178" y="40" width="24" height="28" rx="4" fill="#3498DB" />
            <circle cx="190" cy="54" r="4" fill="white" />
            <path d="M198 46 L210 60 L202 65 Z" fill="#2ECC71" />

            {/* Speed Bolts */}
            <path d="M115 35 L125 18 L120 18 L127 5 Z" fill="#F1C40F" stroke="#D35400" strokeWidth="1.2" />
            <path d="M138 30 L148 15 L143 15 L150 4 Z" fill="#F1C40F" stroke="#D35400" strokeWidth="1.2" />

            {/* Handing Over Arms */}
            <path d="M55 105 L138 100" stroke="#D35400" strokeWidth="12" strokeLinecap="round" />
            <path d="M325 105 L242 100" stroke="#E67E22" strokeWidth="12" strokeLinecap="round" />

            {/* Customer Character & Headphones */}
            <circle cx="305" cy="55" r="28" fill="#2C3E50" />
            <circle cx="305" cy="55" r="22" fill="#F39C12" />
            <circle cx="296" cy="52" r="3.5" fill="#2C3E50" />
            <circle cx="314" cy="52" r="3.5" fill="#2C3E50" />
            <path d="M298 64 C303 69 307 69 312 64" stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M280 55 C280 35 330 35 330 55" stroke="#8E44AD" strokeWidth="6" fill="none" />
            <rect x="274" y="48" width="10" height="18" rx="5" fill="#8E44AD" />
            <rect x="326" y="48" width="10" height="18" rx="5" fill="#8E44AD" />
          </svg>
        </div>
      </div>

      {/* Main Body Content */}
      <div className="p-6 pt-3 space-y-5 bg-white text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 leading-tight">
          Groceries delivered in <span className="text-[#164220]">minutes</span>
        </h2>

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Input Box matching Zepto style */}
            <div className="flex items-center rounded-2xl border border-gray-300 bg-white px-4 py-3.5 shadow-sm focus-within:border-[#164220] focus-within:ring-2 focus-within:ring-[#164220]/20 transition">
              <span className="font-semibold text-sm text-gray-900 border-r border-gray-300 pr-3.5 mr-3 flex-shrink-0">
                IN +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 outline-none"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {error}
              </p>
            )}

            {/* Continue Action Button */}
            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className={`w-full rounded-2xl py-4 text-sm font-semibold transition shadow-md flex items-center justify-center gap-2 ${
                phone.length === 10 && !loading
                  ? 'bg-[#164220] text-white hover:bg-[#103318] active:scale-[0.98]'
                  : 'bg-[#E5E7EB] text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Sending OTP...
                </span>
              ) : (
                <span>Continue</span>
              )}
            </button>

            {/* Legal Terms Disclaimer Footer */}
            <div className="pt-2 text-center text-[11px] font-medium text-gray-500">
              By continuing, you agree to our{' '}
              <span className="font-semibold text-[#164220] hover:underline cursor-pointer">Terms of Use</span> &{' '}
              <span className="font-semibold text-[#164220] hover:underline cursor-pointer">Privacy Policy</span>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Enter 6-Digit OTP sent to +91 {phone}
              </label>
              <div className="flex items-center rounded-2xl border border-gray-300 bg-white px-4 py-3.5 shadow-sm focus-within:border-[#164220] focus-within:ring-2 focus-within:ring-[#164220]/20 transition">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full tracking-[0.3em] text-center text-lg font-semibold text-gray-900 placeholder-gray-300 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {!isExistingUser && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Full Name (Required for First-Time Registration)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-xs font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-[#164220] focus:ring-2 focus:ring-[#164220]/20"
                  required
                />
              </div>
            )}

            {error && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className={`w-full rounded-2xl py-4 text-sm font-semibold transition shadow-md flex items-center justify-center gap-2 ${
                otp.length === 6 && !loading
                  ? 'bg-[#164220] text-white hover:bg-[#103318] active:scale-[0.98]'
                  : 'bg-[#E5E7EB] text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Verifying...
                </span>
              ) : (
                <span>Verify & Continue</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-center text-xs font-semibold text-[#164220] hover:underline transition pt-1"
            >
              ← Change Mobile Number
            </button>

            <div className="pt-2 text-center text-[11px] font-medium text-gray-500">
              By continuing, you agree to our{' '}
              <span className="font-semibold text-[#164220] hover:underline cursor-pointer">Terms of Use</span> &{' '}
              <span className="font-semibold text-[#164220] hover:underline cursor-pointer">Privacy Policy</span>
            </div>
          </form>
        )}
      </div>

      <div id="recaptcha-container" />
    </div>
  )
}
