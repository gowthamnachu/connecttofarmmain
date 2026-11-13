import { useEffect, useState } from 'react'
import { fetchFarmerProfile, type FarmerProfile } from '../lib/api'
import { FARMER_AVATAR_IMAGE } from '../lib/cropImages'
import {
  XIcon,
  ShieldCheckIcon,
  LeafIcon,
} from './Icons'

interface FarmerProfileModalProps {
  isOpen: boolean
  onClose: () => void
  farmerName: string
}

export function FarmerProfileModal({
  isOpen,
  onClose,
  farmerName,
}: FarmerProfileModalProps) {
  const [profile, setProfile] = useState<FarmerProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetchFarmerProfile()
        .then((res) => setProfile(res))
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Banner with Avatar */}
        <div className="relative h-28 bg-gradient-to-r from-[#164220] via-[#1b5028] to-[#12361a] p-4 flex items-start justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-emerald-200 text-[10px] font-medium tracking-wider uppercase border border-white/20">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-300" />
            Verified Farmer Account
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Details */}
        <div className="px-6 pb-6 pt-0 relative flex-1">
          {/* Avatar floating */}
          <div className="-mt-12 mb-3 flex items-end justify-between">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-neutral-100">
              <img
                src={FARMER_AVATAR_IMAGE}
                alt={farmerName}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <LeafIcon className="w-3 h-3 text-emerald-600" />
              {profile?.certificationStatus || 'Certified Organic'}
            </span>
          </div>

          <h3 className="font-semibold text-lg text-neutral-900 leading-tight">
            {profile?.name || farmerName}
          </h3>
          <p className="text-xs text-neutral-500 font-medium mb-4">
            {profile?.village ? `${profile.village}, ${profile.district || ''}` : 'Rural Farm Partner'}
          </p>

          {loading ? (
            <div className="py-8 text-center text-xs text-neutral-400 font-medium">
              Loading profile details...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
                  <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider block">
                    Phone
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {profile?.phone || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
                  <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider block">
                    Land Area
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {profile?.landAreaAcres ? `${profile.landAreaAcres} Acres` : '5 Acres'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheckIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-emerald-950">
                    ConnectToFarm Direct Guarantee
                  </h4>
                  <p className="text-[11px] text-emerald-800/90 leading-relaxed font-medium">
                    Your farm is directly listed on the customer app. Direct settlements and 0% commission on orders.
                  </p>
                </div>
              </div>

              {profile?.bio && (
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-600">
                  {profile.bio}
                </div>
              )}
            </div>
          )}

          <div className="mt-5 pt-3 border-t border-neutral-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#164220] text-white text-xs font-semibold hover:bg-[#103318] transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
