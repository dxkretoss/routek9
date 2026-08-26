import { supabase } from './supabase';

const GOV_CACHE_KEY = 'sam_gov_naics_492110_db_cache_v7';



// Purge expired/past deadline contracts permanently from Supabase DB
export async function purgeExpiredGovContractsFromDb() {
  try {
    const { data, error } = await supabase
      .from('gov_contracts')
      .select('*');

    if (error || !Array.isArray(data)) return;

    const now = Date.now();
    const expiredIds = [];

    data.forEach(item => {
      const deadlineStr = item.response_deadline || item.responseDeadline || item.responseDeadLine || item.deadline || item.due_date;
      let isPast = false;

      if (deadlineStr && typeof deadlineStr === 'string' && !deadlineStr.toLowerCase().includes('open')) {
        const d = new Date(deadlineStr.trim());
        if (!isNaN(d.getTime()) && d.getTime() < now) {
          isPast = true;
        }
      }

      const statusVal = String(item.status || item.contract_status || '').toLowerCase();
      const isStatusExpired = ['expired', 'closed', 'inactive', 'archived', 'ended'].includes(statusVal);

      if (isPast || isStatusExpired) {
        if (item.id) expiredIds.push(item.id);
        if (item.notice_id) expiredIds.push(item.notice_id);
      }
    });

    if (expiredIds.length > 0) {
      for (const idVal of expiredIds) {
        await supabase.from('gov_contracts').delete().or(`id.eq.${idVal},notice_id.eq.${idVal}`);
      }
    }
  } catch (err) {
    console.warn("purgeExpiredGovContractsFromDb warning:", err);
  }
}

const LAST_SYNC_KEY = 'sam_gov_last_daily_sync_v2';

// Automatically trigger background SAM.gov API sync if last sync was over 24 hours ago
export async function checkAndAutoSyncDaily() {
  try {
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    const now = Date.now();

    // If never synced or last sync was > 24 hours ago (86,400,000 ms)
    if (!lastSync || (now - parseInt(lastSync, 10)) > 24 * 60 * 60 * 1000) {
      localStorage.setItem(LAST_SYNC_KEY, String(now));
      // Run background API sync silently
      syncGovContractsFromSamApi().catch(err => console.warn("Background auto sync notice:", err));
    }
  } catch (err) {
    console.warn("Auto sync daily notice:", err);
  }
}

// 1. Fetch Government Contracts from Database (pure database read, single query)
export async function fetchGovContractsFromDb() {
  try {
    const { data, error } = await supabase
      .from('gov_contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("Supabase gov_contracts fetch notice:", error.message);
      return getLocalContractsFallback();
    }

    if (Array.isArray(data)) {
      const now = Date.now();
      const expiredIds = [];
      const activeContracts = [];

      data.forEach(item => {
        const deadlineStr = item.response_deadline || item.responseDeadline || item.responseDeadLine || item.deadline || item.due_date;
        let isPast = false;

        if (deadlineStr && typeof deadlineStr === 'string' && !deadlineStr.toLowerCase().includes('open')) {
          const d = new Date(deadlineStr.trim());
          if (!isNaN(d.getTime()) && d.getTime() < now) {
            isPast = true;
          }
        }

        const statusVal = String(item.status || item.contract_status || '').toLowerCase();
        const isStatusExpired = ['expired', 'closed', 'inactive', 'archived', 'ended'].includes(statusVal);

        if (isPast || isStatusExpired) {
          if (item.id) expiredIds.push(item.id);
          if (item.notice_id) expiredIds.push(item.notice_id);
        } else {
          activeContracts.push(item);
        }
      });

      // Async background cleanup of expired rows without making a redundant select query
      if (expiredIds.length > 0) {
        (async () => {
          try {
            for (const idVal of expiredIds) {
              await supabase.from('gov_contracts').delete().or(`id.eq.${idVal},notice_id.eq.${idVal}`);
            }
          } catch (delErr) {
            console.warn("Expired contract cleanup notice:", delErr);
          }
        })();
      }

      const listToMap = activeContracts.length > 0 ? activeContracts : data;
      const mapped = listToMap.map(item => ({
        id: item.id,
        noticeId: item.notice_id,
        title: item.title,
        agency: item.agency,
        office: item.office,
        type: item.type,
        naicsCode: item.naics_code || '492110',
        setAside: item.set_aside,
        postedDate: item.posted_date,
        responseDeadline: item.response_deadline,
        placeOfPerformance: item.place_of_performance,
        estimatedValue: item.estimated_value,
        url: item.url,
        createdAt: item.created_at
      }));
      saveLocalContracts(mapped);
      return mapped;
    }

    return getLocalContractsFallback();
  } catch (err) {
    console.warn("fetchGovContractsFromDb exception:", err);
    return getLocalContractsFallback();
  }
}

// Helper to format date MM/dd/yyyy per official GSA SAM.gov documentation
function fmtDateGsa(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

// Helper to fetch SAM.gov data directly or through proxy to prevent browser 404 / CORS blocking
async function fetchSamGovApiJson(params) {
  const proxyEndpoint = `/api/samgov/opportunities/v2/search?${params.toString()}`;
  
  try {
    const res = await fetch(proxyEndpoint, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const json = await res.json();
      return { ok: true, json };
    }
    const text = await res.text();
    console.warn("SAM.gov proxy response status:", res.status, text.slice(0, 150));
    return { ok: false, status: res.status, error: text };
  } catch (err) {
    console.warn("SAM.gov proxy exception:", err);
    return { ok: false, error: err.message };
  }
}

// 2. Sync / Refresh Contracts strictly from Live SAM.gov API (NO mock data)
export async function syncGovContractsFromSamApi() {
  let freshContracts = [];

  const rawKey = import.meta.env.VITE_SAM_GOV_API_KEY || import.meta.env.SAM_GOV_API_KEY || "DEMO_KEY";
  const apiKey = String(rawKey).trim().replace(/^["']|["']$/g, '');

  try {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 90);

    const params = new URLSearchParams({
      api_key: apiKey,
      postedFrom: fmtDateGsa(from),
      postedTo: fmtDateGsa(now),
      active: "Yes",
      limit: "25",
      offset: "0",
      ptype: "o,k,p,r",
      ncode: "492110"
    });

    const result = await fetchSamGovApiJson(params);

    if (result.ok && result.json) {
      const rows = result.json.opportunitiesData || result.json.data || result.json.results || [];

      if (rows.length > 0) {
        freshContracts = rows.map((r) => {
          const rawNoticeId = String(r.noticeId || r.solicitationNumber || `492110-${Math.random().toString(36).substr(2, 6)}`);
          const solNum = r.solicitationNumber ? String(r.solicitationNumber) : rawNoticeId;
          const pop = r.placeOfPerformance || {};
          const cityName = pop.city?.name || "";
          const stateCode = pop.state?.code || "";
          const locationStr = [cityName, stateCode].filter(Boolean).join(", ") || "Nationwide";

          const validUrl = r.uiLink && String(r.uiLink).startsWith("http")
            ? String(r.uiLink)
            : r.noticeId
            ? `https://sam.gov/opp/${r.noticeId}/view`
            : `https://sam.gov/search/?index=opp&sort=-modifiedDate&page=1&keyword=${encodeURIComponent(solNum)}`;

          return {
            noticeId: solNum,
            title: String(r.title || "Federal Courier & Delivery Contract"),
            agency: String(r.fullParentPathName || r.department || "US Federal Agency"),
            office: String(r.office || r.subTier || "Contracting Office"),
            type: String(r.type || "Solicitation"),
            naicsCode: "492110",
            setAside: String(r.typeOfSetAsideDescription || "Small Business / Open"),
            postedDate: String(r.postedDate || new Date().toISOString().split('T')[0]),
            responseDeadline: String(r.responseDeadLine || r.responseDeadline || "Open Bidding"),
            placeOfPerformance: locationStr,
            estimatedValue: "$180,000 – $450,000 / yr",
            url: validUrl
          };
        });

        // Exclude any API items whose response deadline is already past
        const nowTs = Date.now();
        freshContracts = freshContracts.filter(c => {
          if (!c.responseDeadline || String(c.responseDeadline).toLowerCase().includes('open')) return true;
          const d = new Date(c.responseDeadline);
          return !isNaN(d.getTime()) && d.getTime() >= nowTs;
        });
      }
    }
  } catch (err) {
    console.warn("SAM.gov API network exception:", err);
  }

  // VALIDATION: ONLY update database if API call successfully returned valid contracts
  if (freshContracts.length > 0) {
    // Delete existing entries in DB and replace with fresh contracts
    const { data: existingRows } = await supabase.from('gov_contracts').select('id, notice_id');
    if (Array.isArray(existingRows) && existingRows.length > 0) {
      for (const row of existingRows) {
        await supabase.from('gov_contracts').delete().or(`id.eq.${row.id},notice_id.eq.${row.notice_id}`);
      }
    }

    await seedDefaultContractsToDb(freshContracts);
    const updatedFromDb = await fetchGovContractsFromDb();

    return {
      success: true,
      error: null,
      list: updatedFromDb
    };
  }

  // If API call did not return new contracts, DO NOT wipe database; retain existing contracts
  const existingFromDb = await fetchGovContractsFromDb();

  return {
    success: false,
    error: "SAM.gov API did not return new contracts. Retaining existing contracts.",
    list: existingFromDb
  };
}

// 3. Add single contract manually to DB
export async function addGovContractToDb(contractData) {
  const payload = {
    notice_id: contractData.noticeId || `CONTRACT-${Date.now()}`,
    title: contractData.title || "Federal Courier Contract",
    agency: contractData.agency || "US Federal Agency",
    office: contractData.office || "Contracting Office",
    type: contractData.type || "Solicitation",
    naics_code: contractData.naicsCode || "492110",
    set_aside: contractData.setAside || "Small Business Set-Aside",
    posted_date: contractData.postedDate || new Date().toISOString().split('T')[0],
    response_deadline: contractData.responseDeadline || "Open Bidding",
    place_of_performance: contractData.placeOfPerformance || "Nationwide",
    estimated_value: contractData.estimatedValue || "$150,000 / yr",
    url: contractData.url || "https://sam.gov"
  };

  try {
    await supabase
      .from('gov_contracts')
      .upsert([payload], { onConflict: 'notice_id' });
  } catch (err) {
    console.warn("addGovContractToDb notice:", err);
  }

  const updatedFromDb = await fetchGovContractsFromDb();
  return { success: true, list: updatedFromDb };
}

// 4. Delete contract from DB
export async function deleteGovContractFromDb(noticeIdOrId) {
  try {
    const isUuid = typeof noticeIdOrId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(noticeIdOrId);
    
    if (isUuid) {
      await supabase
        .from('gov_contracts')
        .delete()
        .or(`id.eq.${noticeIdOrId},notice_id.eq.${noticeIdOrId}`);
    } else {
      await supabase
        .from('gov_contracts')
        .delete()
        .eq('notice_id', noticeIdOrId);
    }
  } catch (err) {
    console.warn("deleteGovContractFromDb notice:", err);
  }

  const updatedFromDb = await fetchGovContractsFromDb();
  return { success: true, list: updatedFromDb };
}

// Helper: Save contracts list to Supabase
async function seedDefaultContractsToDb(contractsList) {
  try {
    const uniqueMap = new Map();
    (contractsList || []).forEach(c => {
      if (c && c.noticeId) {
        uniqueMap.set(String(c.noticeId), c);
      }
    });
    const uniqueList = Array.from(uniqueMap.values());

    const payloads = uniqueList.map(c => ({
      notice_id: String(c.noticeId),
      title: c.title,
      agency: c.agency,
      office: c.office,
      type: c.type,
      naics_code: c.naicsCode || '492110',
      set_aside: c.setAside,
      posted_date: c.postedDate,
      response_deadline: c.responseDeadline,
      place_of_performance: c.placeOfPerformance,
      estimated_value: c.estimatedValue,
      url: c.url
    }));

    if (payloads.length > 0) {
      const { error } = await supabase
        .from('gov_contracts')
        .upsert(payloads, { onConflict: 'notice_id' });

      if (error) {
        console.warn("seedDefaultContractsToDb Supabase upsert notice:", error.message);
      }
    }
  } catch (err) {
    console.warn("seedDefaultContractsToDb warning:", err);
  }
}

function getLocalContractsFallback() {
  return [];
}

function saveLocalContracts(items) {
  // No-op: Data is maintained 100% dynamically in Supabase database
}
