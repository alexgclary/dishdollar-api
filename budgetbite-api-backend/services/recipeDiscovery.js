const robotsParser = require('robots-parser');

const GOOGLE_CSE_BASE = 'https://www.googleapis.com/customsearch/v1';
const USER_AGENT = 'DishDollarBot/1.0 (+https://dishdollar.com/bot)';

// In-memory robots.txt cache: domain -> { parser, fetchedAt }
const robotsTxtCache = new Map();
const ROBOTS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Known recipe domains for targeted search
const RECIPE_DOMAINS = [
  'allrecipes.com',
  'budgetbytes.com',
  'skinnytaste.com',
  'simplyrecipes.com',
  'minimalistbaker.com',
  'natashaskitchen.com',
  'seriouseats.com',
  'bonappetit.com',
  'foodnetwork.com',
  'epicurious.com',
  'cooking.nytimes.com',
  'delish.com',
  'tasty.co',
  'eatingwell.com'
];

/**
 * Build a search query from structured parameters
 */
function buildSearchQuery(query, { cuisines = [], diets = [], budgetKeywords = [] } = {}) {
  const parts = [];

  if (query) parts.push(query);
  if (cuisines.length) parts.push(cuisines.join(' '));
  if (diets.length) parts.push(diets.join(' '));
  if (budgetKeywords.length) parts.push(budgetKeywords.join(' '));

  // Always include "recipe" to focus results
  if (!parts.some(p => /recipe/i.test(p))) {
    parts.push('recipe');
  }

  return parts.join(' ').trim();
}

/**
 * Check robots.txt for a given URL
 * Returns { allowed: boolean, crawlDelay: number|null }
 */
async function checkRobotsTxt(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.origin;

    // Check cache
    const cached = robotsTxtCache.get(domain);
    if (cached && (Date.now() - cached.fetchedAt) < ROBOTS_CACHE_TTL) {
      return {
        allowed: cached.parser.isAllowed(url, USER_AGENT) !== false,
        crawlDelay: cached.parser.getCrawlDelay(USER_AGENT) || null
      };
    }

    // Fetch robots.txt
    const robotsUrl = `${domain}/robots.txt`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT }
    });
    clearTimeout(timeout);

    let robotsContent = '';
    if (response.ok) {
      robotsContent = await response.text();
    }

    const parser = robotsParser(robotsUrl, robotsContent);

    // Cache the result
    robotsTxtCache.set(domain, { parser, fetchedAt: Date.now() });

    return {
      allowed: parser.isAllowed(url, USER_AGENT) !== false,
      crawlDelay: parser.getCrawlDelay(USER_AGENT) || null
    };
  } catch (error) {
    // On any failure, default to allowed (industry standard)
    console.log(`[Discovery] robots.txt check failed for ${url}: ${error.message}`);
    return { allowed: true, crawlDelay: null };
  }
}

/**
 * Discover recipe URLs via Google Custom Search API
 */
async function discoverRecipeUrls(query, options = {}) {
  const { cuisines = [], diets = [], budgetKeywords = [], limit = 10 } = options;

  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.log('[Discovery] Google CSE not configured, skipping discovery');
    return [];
  }

  const searchQuery = buildSearchQuery(query, { cuisines, diets, budgetKeywords });
  const num = Math.min(limit, 10); // Google CSE max is 10 per request

  console.log(`[Discovery] Searching: "${searchQuery}" (limit: ${num})`);

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: searchQuery,
      num: String(num)
    });

    const response = await fetch(`${GOOGLE_CSE_BASE}?${params}`, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Discovery] Google CSE error ${response.status}: ${errorText}`);
      return [];
    }

    const data = await response.json();
    const items = data.items || [];

    console.log(`[Discovery] Found ${items.length} results`);

    // Process each result: extract metadata and check robots.txt
    const results = [];
    for (const item of items) {
      const url = item.link;
      const domain = new URL(url).hostname.replace(/^www\./, '');

      const robotsCheck = await checkRobotsTxt(url);

      results.push({
        url,
        title: item.title,
        snippet: item.snippet || '',
        domain,
        robotsAllowed: robotsCheck.allowed,
        crawlDelay: robotsCheck.crawlDelay
      });

      // Respect crawl delay if specified
      if (robotsCheck.crawlDelay) {
        await new Promise(resolve => setTimeout(resolve, robotsCheck.crawlDelay * 1000));
      }
    }

    const allowed = results.filter(r => r.robotsAllowed).length;
    const blocked = results.filter(r => !r.robotsAllowed).length;
    console.log(`[Discovery] ${allowed} allowed, ${blocked} blocked by robots.txt`);

    return results;
  } catch (error) {
    console.error('[Discovery] Search failed:', error.message);
    return [];
  }
}

module.exports = {
  discoverRecipeUrls,
  checkRobotsTxt,
  buildSearchQuery,
  USER_AGENT,
  RECIPE_DOMAINS
};
