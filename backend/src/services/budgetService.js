const { v4: uuidv4 } = require('uuid');

/**
 * Budget Service - Sync budget from various data sources
 */

/**
 * Sync budget.exteriorMaterials from home.exteriorMaterials extraction data
 */
function syncFromExteriorMaterials(home, budget) {
    const ext = home.exteriorMaterials || {};
    const totals = ext.totals || {};
    const now = new Date();

    // Roofing
    budget.exteriorMaterials = budget.exteriorMaterials || {};
    budget.exteriorMaterials.roofing = {
        estimated: totals.totalRoofingCost || 0,
        actual: 0,
        notes: ext.roofing?.type ? `${ext.roofing.type} - ${ext.roofing.material || 'N/A'}` : '',
        items: ext.roofing ? [{
            _id: uuidv4(),
            label: ext.roofing.type || 'Roofing',
            estimated: ext.roofing.estCost || totals.totalRoofingCost || 0,
            actual: 0,
            source: 'extraction',
        }] : [],
        lastSyncedAt: now,
    };

    // Cladding
    const claddingItems = (ext.cladding || []).map((c) => ({
        _id: uuidv4(),
        label: `${c.area || 'Area'} - ${c.type || 'Cladding'}`,
        estimated: c.estCost || 0,
        actual: 0,
        source: 'extraction',
    }));
    budget.exteriorMaterials.cladding = {
        estimated: totals.totalCladdingCost || claddingItems.reduce((s, i) => s + i.estimated, 0),
        actual: 0,
        notes: '',
        items: claddingItems,
        lastSyncedAt: now,
    };

    // Windows
    const windowItems = (ext.windows || []).map((w) => ({
        _id: uuidv4(),
        label: w.label || `Window - ${w.roomName || 'Unknown'}`,
        estimated: w.estCost || 0,
        actual: 0,
        source: 'extraction',
    }));
    budget.exteriorMaterials.windows = {
        estimated: totals.totalWindowsCost || windowItems.reduce((s, i) => s + i.estimated, 0),
        actual: 0,
        notes: `${ext.windows?.length || 0} windows`,
        items: windowItems,
        lastSyncedAt: now,
    };

    // Doors
    const doorItems = (ext.doors || []).map((d) => ({
        _id: uuidv4(),
        label: d.label || `Door - ${d.roomName || 'Unknown'}`,
        estimated: d.estCost || 0,
        actual: 0,
        source: 'extraction',
    }));
    budget.exteriorMaterials.doors = {
        estimated: totals.totalDoorsCost || doorItems.reduce((s, i) => s + i.estimated, 0),
        actual: 0,
        notes: `${ext.doors?.length || 0} doors`,
        items: doorItems,
        lastSyncedAt: now,
    };

    return budget;
}

/**
 * Sync budget.trades from home.trades data
 */
function syncFromTrades(home, budget) {
    const trades = home.trades || [];
    const now = new Date();

    const tradeItems = trades.map((t) => {
        const invoicedAmount = (t.invoices || [])
            .filter((i) => i.paid)
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);
        return {
            _id: uuidv4(),
            label: t.name,
            estimated: Number(t.totalPrice) || 0,
            actual: invoicedAmount,
            source: 'trade',
        };
    });

    budget.trades = {
        estimated: tradeItems.reduce((s, i) => s + i.estimated, 0),
        actual: tradeItems.reduce((s, i) => s + i.actual, 0),
        notes: `${trades.length} trades`,
        items: tradeItems,
        lastSyncedAt: now,
    };

    return budget;
}

/**
 * Calculate budget summary totals
 */
function calculateSummary(budget) {
    let totalEstimated = 0;
    let totalActual = 0;

    // Exterior materials
    const ext = budget.exteriorMaterials || {};
    for (const key of ['roofing', 'cladding', 'windows', 'doors']) {
        if (ext[key]) {
            totalEstimated += ext[key].estimated || 0;
            totalActual += ext[key].actual || 0;
        }
    }

    // Other categories
    for (const key of ['flooring', 'appliances', 'cabinets', 'windowsDoors', 'trades']) {
        if (budget[key]) {
            totalEstimated += budget[key].estimated || 0;
            totalActual += budget[key].actual || 0;
        }
    }

    // Manual entries
    for (const entry of (budget.manualEntries || [])) {
        totalEstimated += entry.estimated || 0;
        totalActual += entry.actual || 0;
    }

    // Contingency
    const contingencyPercent = budget.contingency?.percent || 10;
    const contingencyAmount = Math.round(totalEstimated * (contingencyPercent / 100));
    budget.contingency = {
        percent: contingencyPercent,
        amount: contingencyAmount,
    };
    totalEstimated += contingencyAmount;

    budget.summary = {
        totalEstimated,
        totalActual,
        variance: totalActual - totalEstimated,
    };

    budget.lastUpdatedAt = new Date();

    return budget;
}

/**
 * Full recalculation of budget from all sources
 */
function recalculateBudget(home) {
    let budget = home.budget || {};

    // Sync from all sources
    budget = syncFromExteriorMaterials(home, budget);
    budget = syncFromTrades(home, budget);
    // TODO: Add syncFromFlooring, syncFromAppliances, syncFromCabinets when those schemas are defined

    // Calculate totals
    budget = calculateSummary(budget);

    return budget;
}

/**
 * Add or update a manual budget entry
 */
function addManualEntry(budget, entry) {
    budget.manualEntries = budget.manualEntries || [];
    const existing = budget.manualEntries.find((e) => e._id === entry._id);
    if (existing) {
        Object.assign(existing, entry);
    } else {
        budget.manualEntries.push({
            _id: uuidv4(),
            category: entry.category || 'other',
            label: entry.label || 'Manual Entry',
            estimated: entry.estimated || 0,
            actual: entry.actual || 0,
            createdAt: new Date(),
        });
    }
    return calculateSummary(budget);
}

/**
 * Remove a manual budget entry
 */
function removeManualEntry(budget, entryId) {
    budget.manualEntries = (budget.manualEntries || []).filter((e) => e._id !== entryId);
    return calculateSummary(budget);
}

module.exports = {
    syncFromExteriorMaterials,
    syncFromTrades,
    calculateSummary,
    recalculateBudget,
    addManualEntry,
    removeManualEntry,
};
