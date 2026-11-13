const INDIC_CROPS = [
  // 1. Foxtail Millet (కొర్రలు)
  {
    keys: ['కొర్ర బియ్యం', 'కొర్ర బియ్యము', 'కొర్రలు', 'కొర్ర', 'foxtail millet', 'foxtail', 'korralu', 'korra'],
    name: 'Foxtail Millet (కొర్రలు)',
    teluguShort: 'కొర్రలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
  },
  // 2. Browntop Millet (అండుకొర్రలు)
  {
    keys: [
      'అండుకొర్ర బియ్యం',
      'అండు కొర్ర బియ్యం',
      'అండుకొర్రలు',
      'అండు కొర్రలు',
      'అండుకొర్ర',
      'అండు కొర్ర',
      'browntop millet',
      'browntop',
      'andukorralu',
      'andu korralu',
    ],
    name: 'Browntop Millet (అండుకొర్రలు)',
    teluguShort: 'అండుకొర్రలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
  },
  // 3. Finger Millet / Ragi (రాగులు)
  {
    keys: ['రాగి పిండి', 'రాగులు', 'రాగి', 'తైదలు', 'తైద', 'ragi', 'finger millet', 'ragulu'],
    name: 'Ragi / Finger Millet (రాగులు)',
    teluguShort: 'రాగులు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
  },
  // 4. Jowar / Sorghum (జొన్నలు)
  {
    keys: [
      'తెల్ల జొన్నలు',
      'పచ్చ జొన్నలు',
      'జొన్న పిండి',
      'జొన్న రవ్వ',
      'జొన్నలు',
      'జొన్న',
      'jowar',
      'sorghum',
      'jonnalu',
      'jonna',
    ],
    name: 'Jowar / Sorghum (జొన్నలు)',
    teluguShort: 'జొన్నలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  // 5. Bajra / Pearl Millet (సజ్జలు)
  {
    keys: ['సజ్జ పిండి', 'సజ్జ రవ్వ', 'సజ్జలు', 'సజ్జ', 'bajra', 'pearl millet', 'sajjalu', 'sajja'],
    name: 'Bajra / Pearl Millet (సజ్జలు)',
    teluguShort: 'సజ్జలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  // 6. Kodo Millet (అరికెలు)
  {
    keys: ['అరిక బియ్యం', 'అరికె బియ్యం', 'అరికెలు', 'అరికలు', 'అరికె', 'అరిక', 'kodo millet', 'kodo', 'arikelu', 'arikalu'],
    name: 'Kodo Millet (అరికెలు)',
    teluguShort: 'అరికెలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  // 7. Little Millet (సామలు)
  {
    keys: [
      'సామ బియ్యం',
      'సామె బియ్యం',
      'సామలు',
      'సామెలు',
      'సామ',
      'సామె',
      'little millet',
      'samalu',
      'samelu',
      'sama',
    ],
    name: 'Little Millet (సామలు)',
    teluguShort: 'సామలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  // 8. Barnyard Millet (ఊదలు)
  {
    keys: [
      'ఊద బియ్యం',
      'వూద బియ్యం',
      'ఊదలు',
      'వూదలు',
      'ఊద',
      'వూద',
      'barnyard millet',
      'barnyard',
      'oodalu',
      'ooda',
      'sanwa',
    ],
    name: 'Barnyard Millet (ఊదలు)',
    teluguShort: 'ఊదలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  // 9. Proso Millet (వరిగెలు)
  {
    keys: ['వరిగ బియ్యం', 'వరిగెలు', 'బరిగెలు', 'వరిగె', 'బరిగె', 'వరిగ', 'proso millet', 'proso', 'varigelu', 'barigelu'],
    name: 'Proso Millet (వరిగెలు)',
    teluguShort: 'వరిగెలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
  },
  // 10. Siridhanya / Millets Basket (సిరిధాన్యాలు)
  {
    keys: [
      'సిరిధాన్యాలు',
      'సిరి ధాన్యాలు',
      'చిరుధాన్యాలు',
      'చిరు ధాన్యాలు',
      'మిల్లెట్స్',
      'మిల్లెట్',
      'మిల్లెట్లు',
      'siridhanya',
      'millets basket',
      'millets',
    ],
    name: 'Siridhanya Millets (సిరిధాన్యాలు)',
    teluguShort: 'సిరిధాన్యాలు',
    categorySlug: 'millets',
    defaultImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
  },
  // 11. Maize / Corn (మొక్కజొన్న)
  {
    keys: ['మొక్కజొన్న కండీలు', 'మొక్కజొన్న', 'మొక్క జొన్న', 'corn', 'maize', 'mokka jonna', 'mokkajonna'],
    name: 'Maize / Corn (మొక్కజొన్న)',
    teluguShort: 'మొక్కజొన్న',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80',
  },
  // 12. Groundnut (వేరుశనగ)
  {
    keys: [
      'వేరుశనగ గుళ్ళు',
      'వేరుశనగ పప్పు',
      'వేరుశనగ',
      'వేరు శనగ',
      'పల్లీలు',
      'పల్లీ',
      'groundnut',
      'peanut',
      'groundnuts',
      'peanuts',
      'verusenaga',
    ],
    name: 'Groundnut (వేరుశనగ)',
    teluguShort: 'వేరుశనగ',
    categorySlug: 'pulses',
    defaultImage: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=800&auto=format&fit=crop&q=80',
  },
  // 13. Toor Dal (కందులు)
  {
    keys: ['కందులు', 'కందిపప్పు', 'కంది పప్పు', 'కంది', 'తోర్ దాల్', 'తోర్', 'toor dal', 'toor', 'red gram', 'pigeon pea'],
    name: 'Toor Dal (కందులు)',
    teluguShort: 'కందులు',
    categorySlug: 'pulses',
    defaultImage: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=800&auto=format&fit=crop&q=80',
  },
  // 14. Moong Dal (పెసలు)
  {
    keys: ['పెసలు', 'పెసరపప్పు', 'పెసర పప్పు', 'పెసర', 'moong dal', 'moong', 'green gram'],
    name: 'Moong Dal (పెసలు)',
    teluguShort: 'పెసలు',
    categorySlug: 'pulses',
    defaultImage: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800&auto=format&fit=crop&q=80',
  },
  // 15. Urad Dal (మినుములు)
  {
    keys: ['మినుములు', 'మినపప్పు', 'మినప పప్పు', 'మినప', 'urad dal', 'urad', 'black gram'],
    name: 'Urad Dal (మినుములు)',
    teluguShort: 'మినుములు',
    categorySlug: 'pulses',
    defaultImage: 'https://images.unsplash.com/photo-1599307767316-776533da941c?w=800&auto=format&fit=crop&q=80',
  },
  // 16. Chana / Chickpeas (శనగలు)
  {
    keys: ['శనగలు', 'శనగపప్పు', 'శనగ పప్పు', 'శనగ', 'సెనగలు', 'సెనగ', 'chana dal', 'chana', 'chickpeas', 'bengal gram'],
    name: 'Chana / Chickpeas (శనగలు)',
    teluguShort: 'శనగలు',
    categorySlug: 'pulses',
    defaultImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  // 17. Wheat (గోధుమలు)
  {
    keys: ['గోధుమలు', 'గోధుమ పిండి', 'గోధుమ రవ్వ', 'గోధుమ', 'wheat', 'sharbati'],
    name: 'Wheat (గోధుమలు)',
    teluguShort: 'గోధుమలు',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
  },
  // 18. Rice / Paddy (వరి)
  {
    keys: [
      'వరి ధాన్యం',
      'వరిధాన్యం',
      'వరి బియ్యం',
      'సోనా మసూరి బియ్యం',
      'సోనా మసూరి',
      'సోనామసూరి',
      'బాస్మతి బియ్యం',
      'బాస్మతి',
      'వరి',
      'బియ్యం',
      'paddy',
      'rice',
      'sona masoori',
      'sona masuri',
      'basmati',
    ],
    name: 'Rice / Paddy (వరి)',
    teluguShort: 'బియ్యం',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
  },
  // 19. Sesame Seeds (నువ్వులు)
  {
    keys: ['తెల్ల నువ్వులు', 'నల్ల నువ్వులు', 'నువ్వులు', 'నువ్వు', 'sesame'],
    name: 'Sesame Seeds (నువ్వులు)',
    teluguShort: 'నువ్వులు',
    categorySlug: 'oils',
    defaultImage: 'https://images.unsplash.com/photo-1599307767316-776533da941c?w=800&auto=format&fit=crop&q=80',
  },
  // 20. Organic Turmeric (పసుపు)
  {
    keys: ['పసుపు కొమ్ములు', 'పసుపు పొడి', 'పసుపు', 'turmeric'],
    name: 'Organic Turmeric (పసుపు)',
    teluguShort: 'పసుపు',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80',
  },
  // 21. Red Chilli (మిరప)
  {
    keys: ['ఎండుమిర్చి', 'ఎండు మిర్చి', 'మిరపకాయలు', 'మిరప', 'మిర్చి', 'chilli', 'red chilli'],
    name: 'Red Chilli (మిరప)',
    teluguShort: 'మిరప',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80',
  },
  // 22. Fresh Onion (ఉల్లిపాయలు)
  {
    keys: ['ఉల్లిపాయలు', 'ఉల్లిగడ్డలు', 'ఉల్లి', 'onion'],
    name: 'Fresh Onion (ఉల్లిపాయలు)',
    teluguShort: 'ఉల్లిపాయలు',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=800&auto=format&fit=crop&q=80',
  },
  // 23. Country Tomato (నాటు టమాటా)
  {
    keys: ['నాటు టమాటా', 'నాటు టమోటా', 'టమాట', 'టమాటో', 'టమోటా', 'tomato'],
    name: 'Country Tomato (నాటు టమాటా)',
    teluguShort: 'టమాటా',
    categorySlug: 'grains',
    defaultImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
  },
]

const SORTED_CROP_KEYS = []
for (const crop of INDIC_CROPS) {
  for (const k of crop.keys) {
    SORTED_CROP_KEYS.push({
      key: k.toLowerCase().trim(),
      length: k.trim().length,
      crop,
    })
  }
}
SORTED_CROP_KEYS.sort((a, b) => b.length - a.length)

const TELUGU_NUMBER_WORDS = [
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

function hasCorrectionIntent(text) {
  return /(?:కాదు|మార్చు|మార్చండి|మారుద్దాం|బదులు|బదులుగా|వేరే|తప్పు|రద్దు|change|instead|not|different|wrong)/i.test(text)
}

function hasExplicitPriceIndicator(text) {
  return /(?:ధర|రేటు|rate|price|రూపాయలు|రూపాయల|రూపాయ|రూ\.?|rs\.?|inr|\/\-)/i.test(text)
}

function extractCrop(text, currentCropName) {
  const lowerText = text.toLowerCase()
  const isCorrection = hasCorrectionIntent(text)

  // If farmer is explicitly correcting an existing crop (e.g. "కొర్రలు కాదు రాగులు"):
  // We search for a crop that is DIFFERENT from currentCropName!
  if (currentCropName && isCorrection) {
    for (const item of SORTED_CROP_KEYS) {
      if (lowerText.includes(item.key) && item.crop.name !== currentCropName) {
        return item.crop
      }
    }
  }

  // If crop is already set and NO correction was requested, lock and retain current crop!
  if (currentCropName && !isCorrection) {
    return null
  }

  // Otherwise, find the longest matching key for initial crop extraction
  for (const item of SORTED_CROP_KEYS) {
    if (lowerText.includes(item.key)) {
      return item.crop
    }
  }

  return null
}

function extractQuantity(text, currentStock) {
  // 1. Matches digits with mandatory quantity unit (e.g. "50 కేజీలు", "50 kg", "10 బస్తాలు", "5 క్వింటాళ్లు")
  const explicitMatches = text.matchAll(
    /(\d+)\s*(కేజీలు|కేజీ|కిలోలు|కిలో|kg|kgs|క్వింటాళ్ళు|క్వింటాలు|క్వింటాల్|క్వింటా|quintal|quintals|బస్తాలు|బస్తా|మూటలు|మూట|bags|bag|టన్నులు|టన్ను|ton|tons)/gi
  )

  for (const match of explicitMatches) {
    const qty = parseInt(match[1], 10)
    const rawUnit = match[2].toLowerCase()
    if (qty > 0) {
      let unit = 'kg'
      if (rawUnit.includes('క్వింటా') || rawUnit.includes('quintal')) unit = 'quintal'
      else if (rawUnit.includes('బస్తా') || rawUnit.includes('మూట') || rawUnit.includes('bag')) unit = 'bag'
      else if (rawUnit.includes('టన్ను') || rawUnit.includes('ton')) unit = 'ton'
      return { stock: qty, unit, rawValue: qty }
    }
  }

  // 2. Telugu number words with mandatory quantity unit
  for (const item of TELUGU_NUMBER_WORDS) {
    const pattern = new RegExp(
      `${item.word}\\s*(కేజీలు|కేజీ|కిలోలు|కిలో|kg|kgs|క్వింటాళ్ళు|క్వింటాలు|క్వింటాల్|క్వింటా|quintal|quintals|బస్తాలు|బస్తా|మూటలు|మూట|bags|bag|టన్నులు|టన్ను|ton|tons)`,
      'i'
    )
    const match = text.match(pattern)
    if (match) {
      const rawUnit = match[1].toLowerCase()
      let unit = 'kg'
      if (rawUnit.includes('క్వింటా') || rawUnit.includes('quintal')) unit = 'quintal'
      else if (rawUnit.includes('బస్తా') || rawUnit.includes('మూట') || rawUnit.includes('bag')) unit = 'bag'
      else if (rawUnit.includes('టన్ను') || rawUnit.includes('ton')) unit = 'ton'
      return { stock: item.value, unit, rawValue: item.value }
    }
  }

  // 3. Bare digits: ONLY IF currentStock is NOT set AND text does NOT have price indicators
  if (!currentStock && !hasExplicitPriceIndicator(text)) {
    const bareMatch = text.match(/(?:^|[^\d.])(\d+)(?:\s*(?:ఉన్నాయి|ఉంది|చేర్చండి|మాత్రమే|ready)?)(?:$|[^\d.])/i)
    if (bareMatch && bareMatch[1]) {
      const qty = parseInt(bareMatch[1], 10)
      if (qty > 0) return { stock: qty, unit: 'kg', rawValue: qty }
    }

    // Bare Telugu number word without price
    for (const item of TELUGU_NUMBER_WORDS) {
      if (text.includes(item.word)) {
        return { stock: item.value, unit: 'kg', rawValue: item.value }
      }
    }
  }

  return null
}

function extractPrice(text, currentDraft, consumedQtyValue) {
  // 1. Explicit price indicators: "120 రూపాయలు", "రూ. 120", "ధర 120", "రేటు 120", "120/-", "120 rs"
  const explicitMatch = text.match(
    /(?:ధర|రేటు|rate|price|రూపాయలు|రూపాయల|రూపాయ|రూ\.?|rs\.?|inr)\s*[:=]?\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:రూపాయలు|రూపాయల|రూపాయ|రూ\.?|\/\-|rs\.?|inr)/i
  )
  if (explicitMatch) {
    const p = explicitMatch[1] || explicitMatch[2]
    if (p && parseFloat(p) > 0) return p
  }

  // 2. "కిలో 120" or "కిలో 120 రూపాయలు" (price per unit)
  const perKgMatch = text.match(/(?:కిలో|కేజీ|పర్\s*kg|పర్\s*కేజీ|కేజీకి|కిలోకి)\s*[:=]?\s*(\d+(?:\.\d{1,2})?)/i)
  if (perKgMatch && perKgMatch[1]) {
    const p = perKgMatch[1]
    const num = parseFloat(p)
    if (num > 0 && num !== consumedQtyValue) {
      return p
    }
  }

  // 3. Spoken Telugu price words e.g. "వంద రూపాయలు", "యాభై రూపాయలు", "ధర ఎనభై"
  for (const item of TELUGU_NUMBER_WORDS) {
    if (
      text.includes(`${item.word} రూపాయ`) ||
      text.includes(`రూపాయలు ${item.word}`) ||
      text.includes(`ధర ${item.word}`) ||
      text.includes(`రేటు ${item.word}`) ||
      text.includes(`కిలో ${item.word}`)
    ) {
      return item.value.toString()
    }
  }

  // 4. Bare digits when stock is already known:
  const hasQuantityUnit = /(?:కేజీలు|కేజీ|కిలోలు|కిలో|క్వింటా|బస్తా|మూట|bags|kg)/i.test(text)
  if (currentDraft.stock && !currentDraft.price && !hasQuantityUnit) {
    const bareDigits = text.match(/(?:^|[^\d.])(\d+(?:\.\d{1,2})?)(?:$|[^\d.])/i)
    if (bareDigits && bareDigits[1]) {
      const num = parseFloat(bareDigits[1])
      if (num > 0 && num !== consumedQtyValue) {
        return bareDigits[1]
      }
    }

    // Single Telugu number word
    for (const item of TELUGU_NUMBER_WORDS) {
      if (text.includes(item.word) && item.value !== consumedQtyValue) {
        return item.value.toString()
      }
    }
  }

  return null
}

function extractIndicAgriculturalEntitiesNew(text, currentDraft, categoriesList) {
  const draft = { ...currentDraft }
  if (!draft.unit) draft.unit = 'kg'

  // 1. Identify crop with longest key match & overwrite protection
  const matchedCrop = extractCrop(text, draft.name)
  if (matchedCrop) {
    if (draft.name && draft.name !== matchedCrop.name && hasCorrectionIntent(text)) {
      draft.name = matchedCrop.name
      // On crop change, preserve or reset based on context
      draft.stock = undefined
      draft.price = undefined
    } else if (!draft.name) {
      draft.name = matchedCrop.name
    }

    const matchedCat =
      categoriesList.find(
        (c) =>
          c.slug.toLowerCase().includes(matchedCrop.categorySlug.toLowerCase()) ||
          c.name.toLowerCase().includes(matchedCrop.categorySlug.toLowerCase())
      ) || categoriesList[0]

    if (matchedCat) {
      draft.categoryId = matchedCat.id
      draft.categoryName = matchedCat.name
    }
  }

  // 2. Identify quantity
  const qty = extractQuantity(text, draft.stock)
  let consumedQtyValue = undefined
  if (qty) {
    draft.stock = qty.stock
    draft.unit = qty.unit
    consumedQtyValue = qty.rawValue
  }

  // 3. Identify price
  const price = extractPrice(text, currentDraft, consumedQtyValue)
  if (price) {
    draft.price = price
  }

  return draft
}

const mockCategories = [
  { id: 'cat-pulses', name: 'Pulses & Dals', slug: 'pulses' },
  { id: 'cat-millets', name: 'Millets & Superfoods', slug: 'millets' },
  { id: 'cat-grains', name: 'Organic Grains & Rice', slug: 'grains' },
  { id: 'cat-combos', name: 'Farm Combos & Baskets', slug: 'combos' },
  { id: 'cat-oils', name: 'Cold-Pressed Oils & Ghee', slug: 'oils' },
]

console.log('=== RUNNING TESTS ===\n')

// Test 1: Foxtail Millet rice disambiguation
let r1 = extractIndicAgriculturalEntitiesNew('కొర్ర బియ్యం 50 కేజీలు', {}, mockCategories)
console.log('Test 1 (కొర్ర బియ్యం):', r1.name, '| Stock:', r1.stock, '| Cat:', r1.categoryName)
if (r1.name !== 'Foxtail Millet (కొర్రలు)' || r1.stock !== 50 || r1.price !== undefined) throw new Error('Test 1 failed')

// Test 2: Turn 2 price setting
let r2 = extractIndicAgriculturalEntitiesNew('కిలో 80 రూపాయలు', r1, mockCategories)
console.log('Test 2 (కిలో 80 రూపాయలు):', r2.name, '| Stock:', r2.stock, '| Price:', r2.price)
if (r2.name !== 'Foxtail Millet (కొర్రలు)' || r2.stock !== 50 || r2.price !== '80') throw new Error('Test 2 failed')

// Test 3: Browntop Millet
let r3 = extractIndicAgriculturalEntitiesNew('అండుకొర్రలు 40 కేజీలు', {}, mockCategories)
console.log('Test 3 (అండుకొర్రలు):', r3.name)
if (r3.name !== 'Browntop Millet (అండుకొర్రలు)') throw new Error('Test 3 failed')

// Test 4: Maize
let r4 = extractIndicAgriculturalEntitiesNew('మొక్కజొన్న 60 కేజీలు', {}, mockCategories)
console.log('Test 4 (మొక్కజొన్న):', r4.name)
if (r4.name !== 'Maize / Corn (మొక్కజొన్న)') throw new Error('Test 4 failed')

// Test 5: Groundnut
let r5 = extractIndicAgriculturalEntitiesNew('వేరుశనగ 35 కేజీలు', {}, mockCategories)
console.log('Test 5 (వేరుశనగ):', r5.name)
if (r5.name !== 'Groundnut (వేరుశనగ)') throw new Error('Test 5 failed')

// Test 6: Barnyard Millet
let r6 = extractIndicAgriculturalEntitiesNew('నా దగ్గర 25 బస్తాల ఊదలు ఉన్నాయి', {}, mockCategories)
console.log('Test 6 (ఊదలు):', r6.name, '| Stock:', r6.stock, r6.unit)
if (r6.name !== 'Barnyard Millet (ఊదలు)' || r6.stock !== 25 || r6.unit !== 'bag') throw new Error('Test 6 failed')

// Test 7: Proso Millet
let r7 = extractIndicAgriculturalEntitiesNew('నా దగ్గర వరిగెలు ఉన్నాయి', {}, mockCategories)
console.log('Test 7 (వరిగెలు):', r7.name)
if (r7.name !== 'Proso Millet (వరిగెలు)') throw new Error('Test 7 failed')

// Test 8: Siridhanya Millets
let r8 = extractIndicAgriculturalEntitiesNew('సిరిధాన్యాలు 100 కేజీలు', {}, mockCategories)
console.log('Test 8 (సిరిధాన్యాలు):', r8.name)
if (r8.name !== 'Siridhanya Millets (సిరిధాన్యాలు)') throw new Error('Test 8 failed')

// Test 9: Bare number "50"
let r9_1 = extractIndicAgriculturalEntitiesNew('నా దగ్గర కొర్రలు ఉన్నాయి', {}, mockCategories)
let r9_2 = extractIndicAgriculturalEntitiesNew('50', r9_1, mockCategories)
console.log('Test 9 Turn 2 ("50"): Stock:', r9_2.stock, '| Price:', r9_2.price)
if (r9_2.stock !== 50 || r9_2.price !== undefined) throw new Error('Test 9.2 failed')

let r9_3 = extractIndicAgriculturalEntitiesNew('80', r9_2, mockCategories)
console.log('Test 9 Turn 3 ("80"): Stock:', r9_3.stock, '| Price:', r9_3.price)
if (r9_3.stock !== 50 || r9_3.price !== '80') throw new Error('Test 9.3 failed')

// Test 10: Explicit crop correction ("కొర్రలు కాదు రాగులు")
let r10 = extractIndicAgriculturalEntitiesNew('కొర్రలు కాదు రాగులు చేర్చండి', r9_3, mockCategories)
console.log('Test 10 (Correction):', r10.name)
if (r10.name !== 'Ragi / Finger Millet (రాగులు)') throw new Error('Test 10 failed')

// Test 11: Single-turn all slots: "50 కేజీల కొర్రలు, కిలో 80 రూపాయలు"
let r11 = extractIndicAgriculturalEntitiesNew('50 కేజీల కొర్రలు, కిలో 80 రూపాయలు', {}, mockCategories)
console.log('Test 11 (All in one):', r11.name, '| Stock:', r11.stock, '| Price:', r11.price)
if (r11.name !== 'Foxtail Millet (కొర్రలు)' || r11.stock !== 50 || r11.price !== '80') throw new Error('Test 11 failed')

// Test 12: Turn 2 with crop word repetition ("కొర్రలు కిలో 80 రూపాయలు")
let r12 = extractIndicAgriculturalEntitiesNew('కొర్రలు కిలో 80 రూపాయలు', r1, mockCategories)
console.log('Test 12 (Repeat crop in turn 2):', r12.name, '| Stock:', r12.stock, '| Price:', r12.price)
if (r12.name !== 'Foxtail Millet (కొర్రలు)' || r12.stock !== 50 || r12.price !== '80') throw new Error('Test 12 failed')

console.log('\n🌟 ALL 12 TEST SCENARIOS PASSED WITH 100% ACCURACY!')

// Test 13: Telugu number word for price ("వంద రూపాయలు")
let r13_1 = extractIndicAgriculturalEntitiesNew('నా దగ్గర 50 కేజీల రాగులు ఉన్నాయి', {}, mockCategories)
let r13_2 = extractIndicAgriculturalEntitiesNew('వంద రూపాయలు', r13_1, mockCategories)
console.log('Test 13 ("వంద రూపాయలు"):', r13_2.name, '| Stock:', r13_2.stock, '| Price:', r13_2.price)
if (r13_2.stock !== 50 || r13_2.price !== '100') throw new Error('Test 13 failed')

// Test 14: Telugu number word for price ("ఎనభై రూపాయలు")
let r14_1 = extractIndicAgriculturalEntitiesNew('నా దగ్గర 40 కేజీల సజ్జలు ఉన్నాయి', {}, mockCategories)
let r14_2 = extractIndicAgriculturalEntitiesNew('ఎనభై రూపాయలు', r14_1, mockCategories)
console.log('Test 14 ("ఎనభై రూపాయలు"):', r14_2.name, '| Stock:', r14_2.stock, '| Price:', r14_2.price)
if (r14_2.stock !== 40 || r14_2.price !== '80') throw new Error('Test 14 failed')

console.log('🌟 Tests 13 & 14 passed as well!')
