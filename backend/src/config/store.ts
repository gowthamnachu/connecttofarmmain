// Single fulfilment store — all shipments originate here (surface transport only).
export const STORE_ORIGIN = {
  name: 'Connect to Farm - LB Nagar',
  phone: '9999999999',
  address: 'LB Nagar, Hyderabad',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500074',
} as const

export const FREE_DELIVERY_THRESHOLD = 500
export const FLAT_DELIVERY_FEE = '20.00'
