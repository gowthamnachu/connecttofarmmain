const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export type FarmerAuthResponse = {
  accessToken: string
  refreshToken: string
  farmer: { id: string; name: string; certificationStatus: string }
}

export async function farmerLogin(phone: string, password: string): Promise<FarmerAuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/farmer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Login failed')
  }

  return res.json()
}

export function saveSession(auth: FarmerAuthResponse) {
  localStorage.setItem('accessToken', auth.accessToken)
  localStorage.setItem('refreshToken', auth.refreshToken)
  localStorage.setItem('farmer', JSON.stringify(auth.farmer))
}

export function getSession() {
  const accessToken = localStorage.getItem('accessToken')
  const farmerRaw = localStorage.getItem('farmer')
  if (!accessToken || !farmerRaw) return null
  return { accessToken, farmer: JSON.parse(farmerRaw) as FarmerAuthResponse['farmer'] }
}

export function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('farmer')
}
