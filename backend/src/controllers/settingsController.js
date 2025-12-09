const { supabase } = require('../config/supabase');

/**
 * Get all settings
 */
async function getAllSettings(req, res) {
    try {
        const { data: settings, error } = await supabase
            .from('settings')
            .select('key, value');

        if (error) throw error;

        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        res.json({ settings: settingsMap });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
}

/**
 * Update settings
 */
async function updateSettings(req, res) {
    try {
        const updates = req.body;

        for (const [key, value] of Object.entries(updates)) {
            const { error } = await supabase
                .from('settings')
                .upsert({ 
                    key, 
                    value: String(value),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
        }

        // Fetch updated settings
        const { data: settings, error } = await supabase
            .from('settings')
            .select('key, value');

        if (error) throw error;

        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        res.json({ settings: settingsMap });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
}

/**
 * Get all rate cards
 */
async function getRateCards(req, res) {
    try {
        const { data: rateCards, error } = await supabase
            .from('rate_cards')
            .select('*')
            .order('milk_type')
            .order('min_fat');

        if (error) throw error;

        res.json({ rateCards });
    } catch (error) {
        console.error('Get rate cards error:', error);
        res.status(500).json({ error: 'Failed to fetch rate cards' });
    }
}

/**
 * Create rate card
 */
async function createRateCard(req, res) {
    try {
        const { milk_type, min_fat, max_fat, min_snf, max_snf, rate_per_litre, effective_from } = req.body;

        if (!milk_type || !rate_per_litre) {
            return res.status(400).json({ error: 'Milk type and rate are required' });
        }

        const { data: rateCard, error } = await supabase
            .from('rate_cards')
            .insert({
                milk_type,
                min_fat: min_fat || null,
                max_fat: max_fat || null,
                min_snf: min_snf || null,
                max_snf: max_snf || null,
                rate_per_litre,
                effective_from: effective_from || null,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ rateCard });
    } catch (error) {
        console.error('Create rate card error:', error);
        res.status(500).json({ error: 'Failed to create rate card' });
    }
}

/**
 * Update rate card
 */
async function updateRateCard(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updateData = { updated_at: new Date().toISOString() };

        if (updates.milk_type) updateData.milk_type = updates.milk_type;
        if (updates.min_fat !== undefined) updateData.min_fat = updates.min_fat;
        if (updates.max_fat !== undefined) updateData.max_fat = updates.max_fat;
        if (updates.min_snf !== undefined) updateData.min_snf = updates.min_snf;
        if (updates.max_snf !== undefined) updateData.max_snf = updates.max_snf;
        if (updates.rate_per_litre !== undefined) updateData.rate_per_litre = updates.rate_per_litre;
        if (updates.effective_from !== undefined) updateData.effective_from = updates.effective_from;
        if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

        const { data: rateCard, error } = await supabase
            .from('rate_cards')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ rateCard });
    } catch (error) {
        console.error('Update rate card error:', error);
        res.status(500).json({ error: 'Failed to update rate card' });
    }
}

/**
 * Delete rate card
 */
async function deleteRateCard(req, res) {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('rate_cards')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Rate card deleted' });
    } catch (error) {
        console.error('Delete rate card error:', error);
        res.status(500).json({ error: 'Failed to delete rate card' });
    }
}

/**
 * Get password reset requests (for admin)
 */
async function getPasswordResetRequests(req, res) {
    try {
        // Try to get from password_reset_requests table
        const { data: requests, error } = await supabase
            .from('password_reset_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            // Table might not exist, return empty
            if (error.message.includes('does not exist')) {
                return res.json({ requests: [] });
            }
            throw error;
        }

        res.json({ requests: requests || [] });
    } catch (error) {
        console.error('Get password reset requests error:', error);
        res.json({ requests: [] }); // Return empty on error
    }
}

/**
 * Dismiss/complete password reset request
 */
async function dismissPasswordResetRequest(req, res) {
    try {
        const { id } = req.params;
        const { status = 'completed' } = req.body;

        const { error } = await supabase
            .from('password_reset_requests')
            .update({ 
                status, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Request updated' });
    } catch (error) {
        console.error('Dismiss password reset request error:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
}

module.exports = {
    getAllSettings,
    updateSettings,
    getRateCards,
    createRateCard,
    updateRateCard,
    deleteRateCard,
    getPasswordResetRequests,
    dismissPasswordResetRequest
};
