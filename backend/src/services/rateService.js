const { supabase } = require('../config/supabase');

// Cache for rate cards to avoid frequent database calls
let rateCardsCache = null;
let settingsCache = null;
let cacheExpiry = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Load rate cards from Supabase (with caching)
 */
async function loadRateCards() {
    if (rateCardsCache && Date.now() < cacheExpiry) {
        return rateCardsCache;
    }

    const { data, error } = await supabase
        .from('rate_cards')
        .select('*')
        .eq('is_active', true)
        .order('milk_type')
        .order('min_fat');

    if (error) {
        console.error('Error loading rate cards:', error);
        return [];
    }

    rateCardsCache = data || [];
    cacheExpiry = Date.now() + CACHE_TTL;
    return rateCardsCache;
}

/**
 * Load settings from Supabase (with caching)
 */
async function loadSettings() {
    if (settingsCache && Date.now() < cacheExpiry) {
        return settingsCache;
    }

    const { data, error } = await supabase
        .from('settings')
        .select('key, value');

    if (error) {
        console.error('Error loading settings:', error);
        return {};
    }

    settingsCache = {};
    (data || []).forEach(s => {
        settingsCache[s.key] = s.value;
    });
    cacheExpiry = Date.now() + CACHE_TTL;
    return settingsCache;
}

/**
 * Calculate rate per litre based on fat, snf, and milk type
 * Uses rate_cards table for lookup, falls back to default rates in settings
 * Note: This is now async to ensure cache is loaded
 */
async function calculateRate(milkType, fat, snf) {
    // Ensure cache is loaded
    if (!rateCardsCache || Date.now() >= cacheExpiry) {
        await loadRateCards();
    }
    
    // Try to find matching rate card from cache
    if (rateCardsCache && rateCardsCache.length > 0) {
        const matchingCard = rateCardsCache.find(card => 
            card.milk_type === milkType &&
            (card.min_fat === null || fat >= card.min_fat) &&
            (card.max_fat === null || fat < card.max_fat) &&
            (card.min_snf === null || snf >= card.min_snf) &&
            (card.max_snf === null || snf < card.max_snf)
        );

        if (matchingCard) {
            return matchingCard.rate_per_litre;
        } else {
            console.warn(`No matching rate card for ${milkType} Fat:${fat} SNF:${snf}. Available cards:`, rateCardsCache.length);
        }
    } else {
        console.warn('Rate cards cache is empty or not loaded');
    }

    // Fallback to default rates from settings cache (removed for strict mode)
    // if (settingsCache) {
    //     const defaultRateKey = `default_rate_${milkType.toLowerCase()}`;
    //     if (settingsCache[defaultRateKey]) {
    //         return parseFloat(settingsCache[defaultRateKey]);
    //     }
    // }

    // Ultimate fallback for strict mode: return 0 if no card matches
    return 0;
}

/**
 * Calculate amount for a milk entry
 */
function calculateAmount(quantityLitre, ratePerLitre) {
    return Math.round(quantityLitre * ratePerLitre * 100) / 100;
}

/**
 * Clear cache to force reload
 */
function clearCache() {
    rateCardsCache = null;
    settingsCache = null;
    cacheExpiry = 0;
}

/**
 * Initialize cache on module load
 */
async function initializeCache() {
    try {
        await loadRateCards();
        await loadSettings();
        console.log('Rate service cache initialized');
    } catch (error) {
        console.error('Failed to initialize rate service cache:', error);
    }
}

// Initialize cache when module loads
initializeCache();

module.exports = {
    calculateRate,
    calculateAmount,
    loadRateCards,
    loadSettings,
    clearCache
};
