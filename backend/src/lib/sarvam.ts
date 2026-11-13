export type SarvamDraftProduct = {
  name?: string
  categoryId?: string
  categoryName?: string
  stock?: number
  unit?: string
  price?: string
  harvestDate?: string
  gradeTag?: string
  description?: string
}

export type SarvamLLMOutput = {
  updatedDraft: SarvamDraftProduct
  englishSummary: string
  teluguReply: string
  isComplete: boolean
  isConfirmed: boolean
}

export type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string
}

export interface IndicCropDefinition {
  keys: string[]
  name: string
  teluguShort: string
  categorySlug: string
  defaultImage: string
}

export const INDIC_CROPS: IndicCropDefinition[] = [
  {
    keys: ['వరి', 'బియ్యం', 'వరి ధాన్యం', 'వరిధాన్యం', 'ధాన్యం', 'సోనా మసూరి', 'paddy', 'rice', 'sona masoori', 'sona masuri'],
    name: 'Rice / Paddy (వరి)',
    teluguShort: 'బియ్యం',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['కందులు', 'కందిపప్పు', 'కంది పప్పు', 'కంది', 'తోర్ దాల్', 'తోర్', 'toor dal', 'toor', 'red gram', 'pigeon pea'],
    name: 'Toor Dal (కందులు)',
    teluguShort: 'కందులు',
    categorySlug: 'pulses',
    defaultImage: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['పెసలు', 'పెసరపప్పు', 'పెసర పప్పు', 'పెసర', 'moong dal', 'moong', 'green gram'],
    name: 'Moong Dal (పెసలు)',
    teluguShort: 'పెసలు',
    categorySlug: 'pulses',
    defaultImage: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['మినుములు', 'మినపప్పు', 'మినప పప్పు', 'మినప', 'urad dal', 'urad', 'black gram'],
    name: 'Urad Dal (మినుములు)',
    teluguShort: 'మినుములు',
    categorySlug: 'pulses',
    defaultImage: 'https://images.unsplash.com/photo-1599307767316-776533da941c?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['శనగలు', 'శనగపప్పు', 'శనగ పప్పు', 'శనగ', 'సెనగలు', 'సెనగ', 'chana dal', 'chana', 'chickpeas', 'bengal gram'],
    name: 'Chana / Chickpeas (శనగలు)',
    teluguShort: 'శనగలు',
    categorySlug: 'pulses',
    defaultImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['గోధుమలు', 'గోధుమ పిండి', 'గోధుమ', 'wheat', 'sharbati'],
    name: 'Wheat (గోధుమలు)',
    teluguShort: 'గోధుమలు',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['జొన్నలు', 'జొన్న', 'jowar', 'sorghum'],
    name: 'Jowar (జొన్నలు)',
    teluguShort: 'జొన్నలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['రాగులు', 'రాగి పిండి', 'రాగి', 'తైదలు', 'ragi', 'finger millet'],
    name: 'Ragi (రాగులు)',
    teluguShort: 'రాగులు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['కొర్రలు', 'కొర్ర', 'foxtail millet', 'foxtail'],
    name: 'Foxtail Millet (కొర్రలు)',
    teluguShort: 'కొర్రలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['సజ్జలు', 'సజ్జ', 'bajra', 'pearl millet'],
    name: 'Bajra / Pearl Millet (సజ్జలు)',
    teluguShort: 'సజ్జలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['అరికెలు', 'అరికలు', 'kodo millet'],
    name: 'Kodo Millet (అరికెలు)',
    teluguShort: 'అరికెలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['సామలు', 'సామ', 'little millet'],
    name: 'Little Millet (సామలు)',
    teluguShort: 'సామలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['మొక్కజొన్న', 'మొక్క జొన్న', 'corn', 'maize'],
    name: 'Maize / Corn (మొక్కజొన్న)',
    teluguShort: 'మొక్కజొన్న',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['వేరుశనగ', 'వేరు శనగ', 'పల్లీలు', 'పల్లీ', 'groundnut', 'peanut'],
    name: 'Groundnut (వేరుశనగ)',
    teluguShort: 'వేరుశనగ',
    categorySlug: 'pulses',
    defaultImage: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['పసుపు', 'turmeric'],
    name: 'Organic Turmeric (పసుపు)',
    teluguShort: 'పసుపు',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['మిరప', 'మిరపకాయలు', 'మిర్చి', 'ఎండుమిర్చి', 'chilli', 'red chilli'],
    name: 'Red Chilli (మిరప)',
    teluguShort: 'మిరప',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['ఉల్లిపాయలు', 'ఉల్లి', 'ఉల్లిగడ్డలు', 'onion'],
    name: 'Fresh Onion (ఉల్లిపాయలు)',
    teluguShort: 'ఉల్లిపాయలు',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['టమాట', 'టమాటో', 'టమోటా', 'నాటు టమాటా', 'tomato'],
    name: 'Country Tomato (నాటు టమాటా)',
    teluguShort: 'టమాటా',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
  },
  {
    keys: ['నువ్వులు', 'నువ్వు', 'sesame'],
    name: 'Sesame Seeds (నువ్వులు)',
    teluguShort: 'నువ్వులు',
    categorySlug: 'oils',
    defaultImage: 'https://images.unsplash.com/photo-1599307767316-776533da941c?w=800&auto=format&fit=crop&q=80',
  },
]

// Telugu spoken number words to integer mapping
const TELUGU_NUMBER_WORDS: Array<{ word: string; value: number }> = [
  { word: 'రెండు వందలు', value: 200 },
  { word: 'రెండువందలు', value: 200 },
  { word: 'ఐదు వందలు', value: 500 },
  { word: 'ఐదువందలు', value: 500 },
  { word: 'వెయ్యి', value: 1000 },
  { word: 'వంద', value: 100 },
  { word: 'తొంభై ఐదు', value: 95 },
  { word: 'తొంభై', value: 90 },
  { word: 'తొంబై', value: 90 },
  { word: 'ఎనభై ఐదు', value: 85 },
  { word: 'ఎనభై', value: 80 },
  { word: 'ఎనబై', value: 80 },
  { word: 'డెబ్బై ఐదు', value: 75 },
  { word: 'డెబ్బై', value: 70 },
  { word: 'దెబ్బై', value: 70 },
  { word: 'అరవై ఐదు', value: 65 },
  { word: 'అరవై', value: 60 },
  { word: 'యాభై ఐదు', value: 55 },
  { word: 'యాభై', value: 50 },
  { word: 'యాబై', value: 50 },
  { word: 'నలభై ఐదు', value: 45 },
  { word: 'నలభై', value: 40 },
  { word: 'ముప్పై ఐదు', value: 35 },
  { word: 'ముప్పై', value: 30 },
  { word: 'ఇరవై ఐదు', value: 25 },
  { word: 'ఇరవై', value: 20 },
  { word: 'పదిహేను', value: 15 },
  { word: 'పది', value: 10 },
  { word: 'తొమ్మిది', value: 9 },
  { word: 'ఎనిమిది', value: 8 },
  { word: 'ఏడు', value: 7 },
  { word: 'ఆరు', value: 6 },
  { word: 'ఐదు', value: 5 },
  { word: 'ఏదు', value: 5 },
  { word: 'నాలుగు', value: 4 },
  { word: 'మూడు', value: 3 },
  { word: 'రెండు', value: 2 },
  { word: 'ఒకటి', value: 1 },
]

export function extractQuantity(text: string): { stock: number; unit: string } | null {
  // 1. Matches digits with quantity units e.g. "50 కేజీలు", "50 kg", "10 బస్తాలు", "5 క్వింటాళ్లు"
  const digitMatch = text.match(
    /(\d+)\s*(కేజీలు|కేజీ|కిలోలు|కిలో|kg|kgs|క్వింటాళ్ళు|క్వింటాలు|క్వింటాల్|క్వింటా|quintal|quintals|బస్తాలు|బస్తా|మూటలు|మూట|bags|bag|టన్నులు|టన్ను|ton|tons)?/i
  )
  if (digitMatch && digitMatch[1]) {
    const qty = parseInt(digitMatch[1], 10)
    if (qty > 0) {
      let unit = 'kg'
      const rawUnit = (digitMatch[2] || '').toLowerCase()
      if (rawUnit.includes('క్వింటా') || rawUnit.includes('quintal')) unit = 'quintal'
      else if (rawUnit.includes('బస్తా') || rawUnit.includes('మూట') || rawUnit.includes('bag')) unit = 'bag'
      else if (rawUnit.includes('టన్ను') || rawUnit.includes('ton')) unit = 'ton'
      return { stock: qty, unit }
    }
  }

  // 2. Matches Telugu number words with or without unit
  for (const item of TELUGU_NUMBER_WORDS) {
    const pattern = new RegExp(
      `${item.word}\\s*(కేజీలు|కేజీ|కిలోలు|కిలో|kg|kgs|క్వింటాళ్ళు|క్వింటాల్|క్వింటా|బస్తాలు|బస్తా|మూటలు|మూట|bags|bag)?`,
      'i'
    )
    const match = text.match(pattern)
    if (match) {
      let unit = 'kg'
      if (match[1]) {
        const rawUnit = match[1].toLowerCase()
        if (rawUnit.includes('క్వింటా')) unit = 'quintal'
        else if (rawUnit.includes('బస్తా') || rawUnit.includes('మూట')) unit = 'bag'
      }
      return { stock: item.value, unit }
    }
  }

  return null
}

export function extractPrice(text: string, currentDraft: SarvamDraftProduct): string | null {
  // 1. Explicit price indicators: "120 రూపాయలు", "రూ. 120", "ధర 120", "రేటు 120", "120/-", "120 rs"
  const explicitMatch = text.match(
    /(?:ధర|రేటు|రూపాయలు|రూ\.?|rs\.?|inr)\s*[:=]?\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:రూపాయలు|రూ\.?|\/\-|rs\.?|inr)/i
  )
  if (explicitMatch) {
    const p = explicitMatch[1] || explicitMatch[2]
    if (p && parseFloat(p) > 0) return p
  }

  // 2. "కిలో 120" or "కిలో 120 రూపాయలు" (price per unit)
  const perKgMatch = text.match(/(?:కిలో|కేజీ|పర్ kg)\s*(\d+(?:\.\d{1,2})?)/i)
  if (perKgMatch && perKgMatch[1]) {
    const p = perKgMatch[1]
    const num = parseFloat(p)
    // Avoid confusing quantity "50 కిలోలు" with price unless explicit currency is used or stock is different
    if (num > 0 && (!currentDraft.stock || num !== currentDraft.stock || /రూ|ధర|రేటు/.test(text))) {
      return p
    }
  }

  // 3. Spoken Telugu price words e.g. "వంద రూపాయలు", "యాభై రూపాయలు"
  for (const item of TELUGU_NUMBER_WORDS) {
    if (
      text.includes(`${item.word} రూపాయలు`) ||
      text.includes(`రూపాయలు ${item.word}`) ||
      text.includes(`ధర ${item.word}`) ||
      text.includes(`రేటు ${item.word}`)
    ) {
      return item.value.toString()
    }
  }

  // 4. If stock is already known and price is missing, and the farmer says a bare number without quantity units
  const hasQuantityUnit = /(?:కేజీలు|కేజీ|కిలోలు|కిలో|క్వింటా|బస్తా|మూట|bags|kg)/i.test(text)
  if (currentDraft.stock && !currentDraft.price && !hasQuantityUnit) {
    const bareDigits = text.match(/^\s*(\d+(?:\.\d{1,2})?)\s*$/)
    if (bareDigits && bareDigits[1]) {
      const num = parseFloat(bareDigits[1])
      if (num > 0) return bareDigits[1]
    }
    // Also check single Telugu number word
    for (const item of TELUGU_NUMBER_WORDS) {
      if (text.trim() === item.word) {
        return item.value.toString()
      }
    }
  }

  return null
}

export function isAffirmativeConfirmation(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return (
    lower.includes('సరే') ||
    lower.includes('సరేనండి') ||
    lower.includes('సరేనయ్యా') ||
    lower.includes('సరే చేయండి') ||
    lower.includes('సరిగ్గా ఉంది') ||
    lower.includes('సరియైనదే') ||
    lower.includes('సరిపోయింది') ||
    lower.includes('ఓకే') ||
    lower.includes('ఓకేనండి') ||
    lower.includes('ఓకే చేయండి') ||
    lower.includes('అవును') ||
    lower.includes('అవునండి') ||
    lower.includes('అవునయ్యా') ||
    lower.includes('కరెక్ట్') ||
    lower.includes('కరెక్టే') ||
    lower.includes('చేర్చండి') ||
    lower.includes('చేర్చు') ||
    lower.includes('చేయండి') ||
    lower.includes('చేయి') ||
    lower.includes('యాడ్ చేయండి') ||
    lower.includes('యాడ్ చేయ్') ||
    lower.includes('యాడ్') ||
    lower.includes('సేవ్ చేయండి') ||
    lower.includes('సేవ్ చేయ్') ||
    lower.includes('సేవ్') ||
    lower.includes('ఖరారు చేయండి') ||
    lower.includes('ఖరారు') ||
    lower.includes('ధృవీకరించండి') ||
    lower.includes('ధృవీకరించు') ||
    lower.includes('నమోదు చేయండి') ||
    lower.includes('నమోదు') ||
    lower.includes('బాగుంది') ||
    lower.includes('రైట్') ||
    lower.includes('హాం') ||
    lower.includes('హా') ||
    lower.includes('ఆ') ||
    lower.includes('ok') ||
    lower.includes('okay') ||
    lower.includes('yes') ||
    lower.includes('confirm') ||
    lower.includes('save') ||
    lower.includes('add') ||
    lower.includes('done') ||
    lower.includes('proceed')
  )
}

export function extractIndicAgriculturalEntities(
  text: string,
  currentDraft: SarvamDraftProduct,
  categoriesList: Array<{ id: string; name: string; slug: string }>
): SarvamDraftProduct {
  const draft = { ...currentDraft }
  if (!draft.unit) draft.unit = 'kg'
  const lowerText = text.toLowerCase()

  // 1. Identify crop if mentioned in latest speech
  for (const crop of INDIC_CROPS) {
    if (crop.keys.some((k) => lowerText.includes(k.toLowerCase()))) {
      // If a brand new crop is mentioned that differs from current draft, start a fresh slot for it
      if (draft.name && draft.name !== crop.name) {
        draft.name = crop.name
        draft.stock = undefined
        draft.price = undefined
      } else {
        draft.name = crop.name
      }

      const matchedCat =
        categoriesList.find(
          (c) =>
            c.slug.toLowerCase().includes(crop.categorySlug.toLowerCase()) ||
            c.name.toLowerCase().includes(crop.categorySlug.toLowerCase())
        ) || categoriesList[0]
      if (matchedCat) {
        draft.categoryId = matchedCat.id
        draft.categoryName = matchedCat.name
      }
      break
    }
  }

  // 2. Identify quantity/stock
  const qty = extractQuantity(text)
  if (qty) {
    draft.stock = qty.stock
    draft.unit = qty.unit
  }

  // 3. Identify price
  const price = extractPrice(text, draft)
  if (price) {
    draft.price = price
  }

  return draft
}

export async function sarvamTranscribe(
  apiKey: string,
  audioBlob: Blob,
  filename = 'audio.webm'
): Promise<string> {
  const rawType = audioBlob.type || 'audio/webm'
  const cleanType = rawType.split(';')[0].trim() || 'audio/webm'
  const buffer = await audioBlob.arrayBuffer()
  const cleanBlob = new Blob([buffer], { type: cleanType })

  const formData = new FormData()
  formData.append('file', cleanBlob, filename)
  formData.append('model', 'saaras:v4')
  formData.append('language_code', 'te-IN')

  const res = await fetch('https://api.sarvam.ai/speech-to-text', {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey,
    },
    body: formData,
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('Sarvam STT failed:', res.status, errorText)
    throw new Error(`Speech recognition failed: ${errorText}`)
  }

  const data = (await res.json()) as { transcript?: string }
  return data.transcript?.trim() ?? ''
}

export async function sarvamTextToSpeech(
  apiKey: string,
  teluguText: string
): Promise<string | null> {
  if (!teluguText || !teluguText.trim()) return null

  const cleanText = teluguText.replace(/[\r\n]+/g, ' ').trim().slice(0, 1000)

  const res = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: cleanText,
      target_language_code: 'te-IN',
      speaker: 'kavitha_te_conversation',
      model: 'bulbul:v4-flash',
      pace: 1.0,
      output_audio_codec: 'mp3',
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Sarvam TTS error:', res.status, errText)
    return null
  }

  const data = (await res.json()) as { audios?: string[] }
  return data.audios?.[0] ?? null
}

export async function sarvamDialogueAgent(
  apiKey: string,
  farmerInput: string,
  currentDraft: SarvamDraftProduct,
  categoriesList: Array<{ id: string; name: string; slug: string }>,
  history: ConversationMessage[] = []
): Promise<SarvamLLMOutput> {
  // Step 1: Deterministic Indic entity extraction ensuring slots are NEVER lost
  const baseDraft = extractIndicAgriculturalEntities(farmerInput, currentDraft, categoriesList)

  // Step 2: Determine slot presence
  const hasCrop = Boolean(baseDraft.name && baseDraft.categoryId)
  const hasStock = Boolean(baseDraft.stock && baseDraft.stock > 0)
  const hasPrice = Boolean(baseDraft.price && baseDraft.price.trim())
  const isComplete = hasCrop && hasStock && hasPrice
  const isConfirmed = isComplete && isAffirmativeConfirmation(farmerInput)

  const matchedCrop = INDIC_CROPS.find((c) => c.name === baseDraft.name)
  const cropTelugu = matchedCrop ? matchedCrop.teluguShort : baseDraft.name || 'పంట'
  const cropEnglish = baseDraft.name ? baseDraft.name.split('(')[0].trim() : 'crop'
  const unitTelugu =
    baseDraft.unit === 'quintal' ? 'క్వింటాళ్ల' : baseDraft.unit === 'bag' ? 'బస్తాల' : 'కేజీల'

  // Step 3: Default guaranteed contextual response for current dialogue state
  let teluguReply = ''
  let englishSummary = ''

  if (isConfirmed) {
    teluguReply = `ధన్యవాదాలు! మీ ${cropTelugu} విజయవంతంగా ఇన్వెంటరీలో చేర్చబడింది.`
    englishSummary = `Thank you! Your ${cropEnglish} has been successfully added to inventory.`
  } else if (isComplete) {
    teluguReply = `మీరు ${baseDraft.stock} ${unitTelugu} ${cropTelugu}, కిలో ₹${baseDraft.price} తో చేర్చాలనుకుంటున్నారు. ఇది సరియైనదా? సరే అని చెప్పండి.`
    englishSummary = `You want to list ${baseDraft.stock} ${baseDraft.unit} ${cropEnglish} at ₹${baseDraft.price}/${baseDraft.unit}. Is this correct? Say 'Okay' to confirm.`
  } else if (hasCrop && hasStock && !hasPrice) {
    teluguReply = `సరే, ${baseDraft.stock} ${unitTelugu} ${cropTelugu} గుర్తించాను. కిలో ధర ఎంత నిర్ణయించాలనుకుంటున్నారు?`
    englishSummary = `Noted ${baseDraft.stock} ${baseDraft.unit} of ${cropEnglish}. What price per ${baseDraft.unit} would you like to set?`
  } else if (hasCrop && !hasStock) {
    teluguReply = `సరే, ${cropTelugu} గుర్తించాను. మీ దగ్గర ఎన్ని కేజీలు లేదా బస్తాలు ఉన్నాయి?`
    englishSummary = `Noted ${cropEnglish}. How many kilograms or bags do you have?`
  } else {
    // Initial greeting or general inquiry
    teluguReply =
      'నమస్కారం! కనెక్ట్‌టుఫార్మ్ వాయిస్ అసిస్టెంట్‌కి స్వాగతం. మీరు ఏ పంట చేర్చాలనుకుంటున్నారు? ఉదాహరణకు బియ్యం, కందులు, లేదా గోధుమలు.'
    englishSummary = 'Welcome! Which crop would you like to list? (e.g. Rice, Toor Dal, Wheat)'
  }

  // Step 4: Best-effort enrichment via Sarvam LLM
  // We call the LLM to get natural conversational nuances or optional metadata.
  // If parsing fails or LLM outputs plain text, WE USE OUR STATE MACHINE REPLY, NEVER FAILING!
  try {
    const categoriesContext = categoriesList
      .map((c) => `- "${c.name}" (ID: "${c.id}")`)
      .join('\n')

    const systemPrompt = `You are a friendly Telugu voice assistant for farmers at ConnectToFarm.
The farmer is talking to you to add their crop to inventory.
CRITICAL RULE: DO NOT forget previously mentioned crop name, quantity, or price.
Active Product Draft: ${JSON.stringify(baseDraft)}
Categories:
${categoriesContext}

Instructions:
- If all fields (name, categoryId, stock, price) are present and farmer says "సరే" or confirms, confirm it.
- If crop name is known, DO NOT ask what crop it is.
- Keep Telugu replies short (under 20 words), polite, and natural.
Respond strictly in JSON format:
{
  "teluguReply": "Telugu speech under 20 words",
  "englishSummary": "English translation"
}`

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]
    for (const m of history.slice(-4)) {
      messages.push({ role: m.role, content: m.content })
    }
    messages.push({ role: 'user', content: farmerInput })

    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        model: 'sarvam-105b-conversations',
        messages,
        temperature: 0.1,
      }),
    })

    if (res.ok) {
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const rawContent = data.choices?.[0]?.message?.content?.trim() ?? ''
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawContent]
      const jsonString = (jsonMatch[1] || rawContent).trim()

      try {
        const parsed = JSON.parse(jsonString) as { teluguReply?: string; englishSummary?: string }
        if (parsed.teluguReply && parsed.teluguReply.trim().length > 3) {
          teluguReply = parsed.teluguReply.trim()
        }
        if (parsed.englishSummary && parsed.englishSummary.trim().length > 3) {
          englishSummary = parsed.englishSummary.trim()
        }
      } catch {
        // If LLM returned direct Telugu text instead of JSON, check if it's usable conversational Telugu
        if (
          rawContent.length > 5 &&
          !rawContent.includes('{') &&
          !rawContent.includes('}') &&
          !/error|syntax/i.test(rawContent)
        ) {
          teluguReply = rawContent
          englishSummary = farmerInput
        }
      }
    }
  } catch (err) {
    console.warn('Sarvam LLM call warning (using deterministic state reply):', err)
  }

  return {
    updatedDraft: baseDraft,
    englishSummary,
    teluguReply,
    isComplete,
    isConfirmed,
  }
}
