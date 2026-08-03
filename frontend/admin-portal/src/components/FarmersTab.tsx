import { useEffect, useState, useRef } from 'react'
import {
  getFarmers,
  onboardFarmer,
  updateFarmerCertification,
  updateFarmer,
  uploadImage,
  type Farmer,
} from '../lib/api'
import { IconCheck, IconSearch, IconRefresh } from './Icons'
import { useDebounce } from '../lib/useDebounce'

export default function FarmersTab() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [createdTempPassword, setCreatedTempPassword] = useState<{ name: string; pass: string } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const photoFileInputRef = useRef<HTMLInputElement | null>(null)
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 250)
  const [statusFilter, setStatusFilter] = useState<'all' | 'certified' | 'pending' | 'rejected'>('all')

  // Form State
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [phone, setPhone] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [bio, setBio] = useState('')
  const [area, setArea] = useState('')
  const [village, setVillage] = useState('')
  const [district, setDistrict] = useState('')
  const [state, setState] = useState('Telangana')
  const [pincode, setPincode] = useState('')
  const [landAreaAcres, setLandAreaAcres] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [certifiedByConnectToFarm, setCertifiedByConnectToFarm] = useState(true)

  // Edit Mode
  const [editingFarmerId, setEditingFarmerId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    getFarmers()
      .then(setFarmers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load farmers'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function startEditFarmer(f: Farmer) {
    setEditingFarmerId(f.id)
    setName(f.name)
    setAge(f.age ? f.age.toString() : '')
    setPhone(f.phone)
    setPhotoUrl(f.photoUrl || '')
    setBannerUrl(f.bannerUrl || '')
    setBio(f.bio || '')
    setArea(f.area || '')
    setVillage(f.village || '')
    setDistrict(f.district || '')
    setState(f.state || 'Telangana')
    setPincode(f.pincode || '')
    setLandAreaAcres(f.landAreaAcres ? f.landAreaAcres.toString() : '')
    setExperienceYears(f.experienceYears ? f.experienceYears.toString() : '')
    setCertifiedByConnectToFarm(f.certifiedByConnectToFarm ?? true)
    setShowAddForm(true)
  }

  function resetForm() {
    setEditingFarmerId(null)
    setName('')
    setAge('')
    setPhone('')
    setPhotoUrl('')
    setBannerUrl('')
    setBio('')
    setArea('')
    setVillage('')
    setDistrict('')
    setState('Telangana')
    setPincode('')
    setLandAreaAcres('')
    setExperienceYears('')
    setCertifiedByConnectToFarm(true)
    setShowAddForm(false)
  }

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      setPhotoUrl(url)
      setNotice('Farmer photo uploaded to R2 bucket!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleBannerUpload(file: File) {
    setUploadingBanner(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      setBannerUrl(url)
      setNotice('Farmer farm banner uploaded to R2 bucket!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Banner upload failed')
    } finally {
      setUploadingBanner(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return

    setSaving(true)
    setError(null)
    setCreatedTempPassword(null)

    try {
      const payload = {
        name: name.trim(),
        age: age ? Number(age) : undefined,
        phone: phone.trim(),
        photoUrl: photoUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        bio: bio.trim() || undefined,
        area: area.trim() || undefined,
        village: village.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        landAreaAcres: landAreaAcres.trim() ? Number(landAreaAcres) : undefined,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        certifiedByConnectToFarm,
      }

      if (editingFarmerId) {
        await updateFarmer(editingFarmerId, payload)
        setNotice(`Farmer "${name}" profile updated!`)
        resetForm()
        load()
      } else {
        const res = await onboardFarmer(payload)
        setCreatedTempPassword({ name: res.farmer.name, pass: res.tempPassword })
        setNotice(`Farmer "${res.farmer.name}" onboarded successfully! Temporary password generated.`)
        resetForm()
        load()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save farmer details')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(farmerId: string, status: 'pending' | 'certified' | 'rejected') {
    setError(null)
    try {
      await updateFarmerCertification(farmerId, status)
      setNotice(`Farmer audit status updated to ${status}.`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update farmer status')
    }
  }

  const filteredFarmers = farmers.filter((f) => {
    const q = debouncedSearchQuery.toLowerCase().trim()
    const matchesSearch =
      q === '' ||
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.phone && f.phone.includes(q)) ||
      (f.village && f.village.toLowerCase().includes(q)) ||
      (f.district && f.district.toLowerCase().includes(q))

    if (!matchesSearch) return false
    if (statusFilter !== 'all' && f.certificationStatus !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Hidden Upload Inputs */}
      <input
        ref={photoFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handlePhotoUpload(file)
        }}
      />
      <input
        ref={bannerFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleBannerUpload(file)
        }}
      />

      {/* Top Banner Header & Onboard Button */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#164220]">Farmer Network</span>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Registered Farmers Datatable ({farmers.length})</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage organic farming network profiles, land details, and lab certifications</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowAddForm(!showAddForm)
          }}
          className="rounded-full bg-[#164220] hover:bg-[#123C1E] text-white px-5 py-2.5 text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span>{showAddForm ? '✕ Close Form' : '+ Onboard New Farmer'}</span>
        </button>
      </div>

      {notice && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {createdTempPassword && (
        <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <IconCheck className="w-4 h-4 text-emerald-600" />
            <span>Onboarding Complete for {createdTempPassword.name}!</span>
          </div>
          <p className="text-xs text-emerald-800">
            Issued Mobile Credentials: <strong className="font-mono bg-white px-2 py-0.5 rounded border">{phone || '1234567890'}</strong> · Password: <strong className="font-mono bg-white px-2 py-0.5 rounded border">{createdTempPassword.pass}</strong>
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900 font-bold">✕</button>
        </div>
      )}

      {/* Onboard Farmer Form Drawer */}
      {showAddForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900">{editingFarmerId ? 'Edit Farmer Profile' : '+ Onboard New Farmer to Network'}</h3>
            <button onClick={resetForm} className="text-xs font-bold text-gray-400 hover:text-gray-600">✕ Close</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                placeholder="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
                required
              />
              <input
                type="tel"
                placeholder="10-digit Phone Number *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
                required
              />
              <input
                type="number"
                placeholder="Age (Optional)"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <input
                type="text"
                placeholder="Village / Town"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
              />
              <input
                type="text"
                placeholder="District (e.g. Mandya)"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
              />
              <input
                type="text"
                placeholder="State (e.g. Karnataka)"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
              />
              <input
                type="text"
                placeholder="Land Area (Acres)"
                value={landAreaAcres}
                onChange={(e) => setLandAreaAcres(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
              />
            </div>

            {/* R2 Photo Upload */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Farmer Photo R2 URL"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-[#164220]"
              />
              <button
                type="button"
                onClick={() => photoFileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="rounded-xl bg-[#164220] hover:bg-[#123C1E] text-white px-4 py-2.5 text-xs font-bold shadow-sm transition whitespace-nowrap"
              >
                {uploadingPhoto ? 'Uploading R2...' : '📷 Upload Photo'}
              </button>
            </div>

            <textarea
              placeholder="Farmer bio / organic harvest philosophy..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-xs font-medium outline-none focus:border-[#164220]"
            />

            <button
              type="submit"
              disabled={saving || uploadingPhoto || uploadingBanner}
              className="w-full rounded-xl bg-[#164220] hover:bg-[#123C1E] text-white py-3 text-xs font-bold shadow-sm transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingFarmerId ? '✓ Update Farmer Profile' : '+ Onboard Farmer to Network'}
            </button>
          </form>
        </div>
      )}

      {/* Directory Search & Status Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2 text-xs text-gray-900">
            <IconSearch className="w-4 h-4 text-[#164220] mr-2" />
            <input
              type="text"
              placeholder="Search farmers by name, phone, village or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold placeholder-gray-400 outline-none"
            />
          </div>
          <button
            onClick={load}
            className="rounded-xl bg-gray-100 hover:bg-gray-200 px-3.5 py-2 text-xs font-bold text-gray-700 transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <IconRefresh className="w-3.5 h-3.5" />
            <span>Refresh List</span>
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto text-xs font-bold">
          {[
            { id: 'all', label: `All Farmers (${farmers.length})` },
            { id: 'certified', label: `Certified (${farmers.filter((f) => f.certificationStatus === 'certified').length})` },
            { id: 'pending', label: `Pending Audit (${farmers.filter((f) => f.certificationStatus === 'pending').length})` },
            { id: 'rejected', label: `Rejected (${farmers.filter((f) => f.certificationStatus === 'rejected').length})` },
          ].map((flt) => (
            <button
              key={flt.id}
              onClick={() => setStatusFilter(flt.id as never)}
              className={`rounded-full px-3.5 py-1.5 transition whitespace-nowrap ${
                statusFilter === flt.id
                  ? 'bg-[#164220] text-white shadow-sm font-extrabold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {flt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Farmers Network Datatable */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-500">Loading farmers network...</div>
        ) : filteredFarmers.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-500">No farmers found matching the search criteria.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-5 py-3.5">Farmer & Location</th>
                <th className="px-5 py-3.5">Mobile Phone</th>
                <th className="px-5 py-3.5">Land & Experience</th>
                <th className="px-5 py-3.5">Lab Audit Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {filteredFarmers.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50/80 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={f.photoUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                        alt={f.name}
                        className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-white flex-shrink-0"
                      />
                      <div>
                        <p className="font-extrabold text-gray-900">{f.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                          📍 {f.village || f.district || 'Mandya'}, {f.state || 'Karnataka'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-gray-900">{f.phone || 'N/A'}</span>
                    {f.age && <span className="text-[10px] text-gray-400 ml-1 font-medium">({f.age} yrs)</span>}
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="font-bold text-gray-800">{f.landAreaAcres ? `${f.landAreaAcres} Acres` : 'Smallholding'}</p>
                    <p className="text-[10px] text-[#164220] font-bold mt-0.5">
                      {f.experienceYears ? `🌾 ${f.experienceYears} Years Exp` : 'Organic Farmer'}
                    </p>
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        f.certificationStatus === 'certified'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : f.certificationStatus === 'pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${f.certificationStatus === 'certified' ? 'bg-emerald-500' : f.certificationStatus === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      <span>{f.certificationStatus === 'certified' ? '✓ Lab Certified' : f.certificationStatus === 'pending' ? '⏳ Audit Pending' : '✕ Rejected'}</span>
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => startEditFarmer(f)}
                      className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                    >
                      ✏️ Edit
                    </button>

                    {f.certificationStatus !== 'certified' && (
                      <button
                        onClick={() => handleStatusChange(f.id, 'certified')}
                        className="rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-xs font-bold transition"
                      >
                        ✓ Certify
                      </button>
                    )}

                    {f.certificationStatus !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(f.id, 'rejected')}
                        className="rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 text-xs font-bold transition"
                      >
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
