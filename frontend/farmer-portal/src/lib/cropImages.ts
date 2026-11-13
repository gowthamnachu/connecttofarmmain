/**
 * Realistic high-resolution agricultural crop photography mapper for Indian produce
 * Matches products to photography by name, telugu name, and category.
 */

interface CropImageMatch {
  keywords: string[]
  imageUrl: string
  category: string
}

export const CROP_IMAGE_LIBRARY: CropImageMatch[] = [
  {
    keywords: ['toor', 'కందులు', 'కంది', 'pigeon pea', 'red gram', 'arhar', 'pulses'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    category: 'Pulses',
  },
  {
    keywords: ['moong', 'పెసలు', 'పెసర', 'green gram', 'mung'],
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
    category: 'Pulses',
  },
  {
    keywords: ['urad', 'మినుములు', 'మినప', 'black gram'],
    imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80',
    category: 'Pulses',
  },
  {
    keywords: ['chana', 'శనగలు', 'శనగ', 'chickpea', 'bengal gram'],
    imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80',
    category: 'Pulses',
  },
  {
    keywords: ['rice', 'వరి', 'ధాన్యం', 'బియ్యం', 'paddy', 'basmati', 'sona masoori'],
    imageUrl: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80',
    category: 'Grains',
  },
  {
    keywords: ['millet', 'వరి', 'రాగులు', 'జొన్నలు', 'సజ్జలు', 'ragi', 'jowar', 'bajra', 'foxtail'],
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
    category: 'Millets',
  },
  {
    keywords: ['wheat', 'గోధుమలు', 'atta'],
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
    category: 'Grains',
  },
  {
    keywords: ['tomato', 'టమాటాలు', 'టమోటా'],
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    category: 'Vegetables',
  },
  {
    keywords: ['chili', 'మిర్చి', 'మిరపకాయలు', 'mirchi', 'pepper'],
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
    category: 'Spices',
  },
  {
    keywords: ['turmeric', 'పసుపు', 'haldi'],
    imageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80',
    category: 'Spices',
  },
  {
    keywords: ['onion', 'ఉల్లిపాయలు', 'ఉల్లి'],
    imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
    category: 'Vegetables',
  },
  {
    keywords: ['potato', 'బంగాళాదుంపలు', 'ఆలూ'],
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
    category: 'Vegetables',
  },
  {
    keywords: ['groundnut', 'వేరుశనగ', 'పల్లీలు', 'peanut'],
    imageUrl: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=800&q=80',
    category: 'Oilseeds',
  },
]

export const DEFAULT_FARM_IMAGE =
  'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80'

export const HERO_FARM_BANNER =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80'

export const FARMER_AVATAR_IMAGE =
  'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=400&q=80'

export function getCropImage(name?: string, existingImages?: string[]): string {
  if (existingImages && existingImages.length > 0 && existingImages[0].startsWith('http')) {
    return existingImages[0]
  }

  if (!name) return DEFAULT_FARM_IMAGE

  const lower = name.toLowerCase()
  for (const item of CROP_IMAGE_LIBRARY) {
    if (item.keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return item.imageUrl
    }
  }

  return DEFAULT_FARM_IMAGE
}
