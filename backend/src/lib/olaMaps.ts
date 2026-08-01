const OLA_MAPS_API_BASE = 'https://api.olamaps.io'

export async function reverseGeocode(params: { apiKey: string; lat: number; lng: number }) {
  const url = new URL(`${OLA_MAPS_API_BASE}/places/v1/reverse-geocode`)
  url.searchParams.set('latlng', `${params.lat},${params.lng}`)
  url.searchParams.set('api_key', params.apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`Ola Maps reverse-geocode failed: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<{ results: { formatted_address: string }[] }>
}

export async function autocompleteAddress(params: { apiKey: string; input: string }) {
  const url = new URL(`${OLA_MAPS_API_BASE}/places/v1/autocomplete`)
  url.searchParams.set('input', params.input)
  url.searchParams.set('api_key', params.apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`Ola Maps autocomplete failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}
