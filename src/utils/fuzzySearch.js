// Lightweight fuzzy search for pantry/ingredient items
// Supports typo tolerance, synonym matching, and relevance scoring

// Common ingredient synonyms (bidirectional)
const SYNONYMS = {
  'cilantro': ['coriander', 'chinese parsley'],
  'coriander': ['cilantro'],
  'scallions': ['green onions', 'spring onions'],
  'green onions': ['scallions', 'spring onions'],
  'spring onions': ['scallions', 'green onions'],
  'zucchini': ['courgette'],
  'courgette': ['zucchini'],
  'eggplant': ['aubergine'],
  'aubergine': ['eggplant'],
  'arugula': ['rocket'],
  'rocket': ['arugula'],
  'bell pepper': ['capsicum', 'sweet pepper'],
  'capsicum': ['bell pepper'],
  'chickpeas': ['garbanzo beans'],
  'garbanzo beans': ['chickpeas'],
  'cornstarch': ['corn starch', 'corn flour'],
  'powdered sugar': ['confectioners sugar', 'icing sugar'],
  'heavy cream': ['whipping cream', 'double cream'],
  'all-purpose flour': ['plain flour', 'ap flour'],
  'baking soda': ['bicarbonate of soda', 'bicarb'],
  'broil': ['grill'],
  'skillet': ['frying pan', 'frypan'],
  'stock pot': ['soup pot', 'large pot'],
  'immersion blender': ['stick blender', 'hand blender'],
  'slow cooker': ['crock pot', 'crockpot'],
  'instant pot': ['pressure cooker', 'multi cooker'],
  'parchment paper': ['baking paper', 'greaseproof paper'],
  'plastic wrap': ['cling film', 'saran wrap', 'cling wrap'],
  'aluminum foil': ['tin foil', 'aluminium foil'],
  'mayo': ['mayonnaise'],
  'mayonnaise': ['mayo'],
  'sriracha': ['rooster sauce'],
  'msg': ['monosodium glutamate'],
};

/**
 * Calculate a simple fuzzy match score between query and target.
 * Returns 0 (no match) to 1 (exact match).
 * Handles:
 *  - Exact substring match (highest score)
 *  - Prefix match (high score)
 *  - Word-boundary match (medium score)
 *  - Character-sequence match with gaps (low score for typo tolerance)
 */
function fuzzyScore(query, target) {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact match
  if (q === t) return 1.0;

  // Starts with query
  if (t.startsWith(q)) return 0.95;

  // Contains query as exact substring
  if (t.includes(q)) return 0.85;

  // Word boundary match (query matches start of a word in target)
  const words = t.split(/[\s\-\/\(\),]+/);
  for (const word of words) {
    if (word.startsWith(q)) return 0.8;
  }

  // Fuzzy character sequence match (allows gaps for typo tolerance)
  // e.g. "cmn" matches "cinnamon", "paprka" matches "paprika"
  let qi = 0;
  let consecutive = 0;
  let maxConsecutive = 0;
  let firstMatchIndex = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (firstMatchIndex === -1) firstMatchIndex = ti;
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
      qi++;
    } else {
      consecutive = 0;
    }
  }

  // All query characters found in order
  if (qi === q.length) {
    // Score based on: how many chars matched consecutively, position of first match,
    // and ratio of query length to target length
    const consecutiveBonus = maxConsecutive / q.length;
    const positionBonus = firstMatchIndex === 0 ? 0.1 : 0;
    const lengthRatio = q.length / t.length;
    return Math.min(0.7, 0.3 + (consecutiveBonus * 0.25) + positionBonus + (lengthRatio * 0.1));
  }

  return 0;
}

/**
 * Search a list of options with fuzzy matching and synonym support.
 *
 * @param {string} query - The search query
 * @param {Array} options - Array of { value, label } or plain strings
 * @param {Array} excludeValues - Values to exclude from results (already selected)
 * @param {number} maxResults - Max number of results to return
 * @returns {Array<{ option, score, matchedVia }>} - Sorted results with scores
 */
export function fuzzySearchOptions(query, options, excludeValues = [], maxResults = 10) {
  if (!query || query.length < 1) return [];

  const q = query.toLowerCase().trim();
  const excludeSet = new Set(excludeValues.map(v => (v || '').toLowerCase()));
  const results = [];

  for (const option of options) {
    const value = (option.value || option || '').toString();
    const label = (option.label || option.value || option || '').toString();

    if (excludeSet.has(value.toLowerCase())) continue;

    // Score against value and label
    const valueScore = fuzzyScore(q, value);
    const labelScore = fuzzyScore(q, label);
    let bestScore = Math.max(valueScore, labelScore);
    let matchedVia = null;

    // Check synonyms
    const synonymsForQuery = SYNONYMS[q] || [];
    for (const syn of synonymsForQuery) {
      const synScore = fuzzyScore(syn, value) * 0.9; // slight penalty for synonym match
      if (synScore > bestScore) {
        bestScore = synScore;
        matchedVia = syn;
      }
    }

    // Also check if any synonym of the target item matches the query
    const valueLower = value.toLowerCase();
    const targetSynonyms = SYNONYMS[valueLower] || [];
    for (const syn of targetSynonyms) {
      const synScore = fuzzyScore(q, syn) * 0.9;
      if (synScore > bestScore) {
        bestScore = synScore;
        matchedVia = `also known as ${syn}`;
      }
    }

    if (bestScore > 0.25) {
      results.push({ option, score: bestScore, matchedVia });
    }
  }

  // Sort by score descending, then alphabetically for ties
  results.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.01) return b.score - a.score;
    const aVal = (a.option.value || a.option).toString();
    const bVal = (b.option.value || b.option).toString();
    return aVal.localeCompare(bVal);
  });

  return results.slice(0, maxResults);
}

/**
 * Highlight the matching portion of text for display.
 * Returns an array of { text, highlighted } segments.
 */
export function highlightMatch(text, query) {
  if (!query || query.length < 1) return [{ text, highlighted: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const idx = lowerText.indexOf(lowerQuery);

  if (idx === -1) {
    // No exact substring match - try highlighting individual matching chars
    return [{ text, highlighted: false }];
  }

  const segments = [];
  if (idx > 0) {
    segments.push({ text: text.slice(0, idx), highlighted: false });
  }
  segments.push({ text: text.slice(idx, idx + lowerQuery.length), highlighted: true });
  if (idx + lowerQuery.length < text.length) {
    segments.push({ text: text.slice(idx + lowerQuery.length), highlighted: false });
  }

  return segments;
}
