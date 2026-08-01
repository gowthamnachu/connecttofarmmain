const NIMBUSPOST_API_BASE = 'https://api.nimbuspost.com/v1'

async function getAuthToken(email: string, password: string): Promise<string> {
  const res = await fetch(`${NIMBUSPOST_API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    throw new Error(`NimbusPost auth failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as { data: string }
  return data.data
}

export type ShipmentAddress = {
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
}

// Store is single-location (LB Nagar, Hyderabad) and shipping mode is fixed to
// surface transport only per business decision — no air/express option exposed.
export async function createNimbuspostShipment(params: {
  email: string
  password: string
  orderNumber: string
  origin: ShipmentAddress
  destination: ShipmentAddress
  items: { name: string; qty: number; price: number }[]
  codAmount: number
  paymentType: 'prepaid' | 'cod'
}) {
  const token = await getAuthToken(params.email, params.password)

  const res = await fetch(`${NIMBUSPOST_API_BASE}/shipments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order_number: params.orderNumber,
      shipping_mode: 'surface',
      payment_type: params.paymentType,
      consignee: {
        name: params.destination.name,
        phone: params.destination.phone,
        address: params.destination.address,
        city: params.destination.city,
        state: params.destination.state,
        pincode: params.destination.pincode,
      },
      pickup: {
        name: params.origin.name,
        phone: params.origin.phone,
        address: params.origin.address,
        city: params.origin.city,
        state: params.origin.state,
        pincode: params.origin.pincode,
      },
      order_items: params.items,
      cod_amount: params.codAmount,
    }),
  })

  if (!res.ok) {
    throw new Error(`NimbusPost shipment creation failed: ${res.status} ${await res.text()}`)
  }

  return res.json() as Promise<{ data: { shipment_id: string; awb_number: string; courier_name: string } }>
}

export async function trackNimbuspostShipment(params: { email: string; password: string; awb: string }) {
  const token = await getAuthToken(params.email, params.password)

  const res = await fetch(`${NIMBUSPOST_API_BASE}/shipments/track/${params.awb}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error(`NimbusPost tracking fetch failed: ${res.status} ${await res.text()}`)
  }

  return res.json()
}
