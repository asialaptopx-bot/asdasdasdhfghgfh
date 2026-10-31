// سایور (Saiur) — Client Application
// ساخته شده توسط سهیل یزدانی

let gateData = null;
let allNodesCache = [];
let currentFilter = 'all';
let currentSearch = '';
let currentSubFormat = 'compat'; // compat, clash, sb, raw
let isHttpsSub = true;

// --- Toast Feedback ---
function showToast(text) {
  const toast = document.getElementById('shToast');
  if (!toast) return;
  toast.innerText = text;
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 2400);
}

// --- Clipboard Copy ---
async function copyToClipboard(text, successMsg) {
  if (!text) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    showToast(successMsg || '✓ با موفقیت کپی شد');
  } catch (err) {
    showToast('خطا در کپی کردن: ' + (err.message || ''));
  }
}

// --- QR Code Generator (SVG / Image with fallback) ---
function createQrSvg(text) {
  const img = document.createElement('img');
  img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(text);
  img.alt = 'QR Code';
  img.width = 250;
  img.height = 250;
  img.loading = 'eager';
  img.onerror = () => {
    // Fallback if qrserver is blocked
    img.src = 'https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=' + encodeURIComponent(text);
  };
  return img;
}

// --- QR Code Modal ---
function openQr(text, title) {
  if (!text) return;
  const modal = document.getElementById('qrModal');
  const wrapper = document.getElementById('qrcodeWrapper');
  const titleEl = document.getElementById('qrModalTitle');
  if (!modal || !wrapper) return;

  if (titleEl) {
    titleEl.innerText = title || 'اسکن بارکد QR';
  }

  wrapper.innerHTML = '';
  const qrEl = createQrSvg(text);
  wrapper.appendChild(qrEl);

  modal.classList.add('active');
}

function closeQr() {
  const modal = document.getElementById('qrModal');
  if (modal) modal.classList.remove('active');
}

document.getElementById('qrCloseBtn')?.addEventListener('click', closeQr);
document.getElementById('qrModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'qrModal') closeQr();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeQr();
});

// --- Protocol Mode Selection (HTTP vs HTTPS) ---
function setupProtoMode() {
  const btnHttp = document.getElementById('btnProtoHttp');
  const btnHttps = document.getElementById('btnProtoHttps');

  function updateProtoState(useHttps) {
    isHttpsSub = useHttps;
    if (btnHttp && btnHttps) {
      if (useHttps) {
        btnHttps.classList.add('active');
        btnHttp.classList.remove('active');
      } else {
        btnHttp.classList.add('active');
        btnHttps.classList.remove('active');
      }
    }
    updateSubscriptionUrls();
  }

  btnHttp?.addEventListener('click', () => updateProtoState(false));
  btnHttps?.addEventListener('click', () => updateProtoState(true));

  // Default to HTTPS if page loaded over HTTPS or running on PaaS
  if (window.location.protocol === 'https:' || window.location.hostname.includes('runflare') || window.location.hostname.includes('railway')) {
    updateProtoState(true);
  }
}

// --- Subscription URLs Computation ---
function getSubscriptionUrls() {
  if (!gateData) return {};
  const currentHost = window.location.hostname || gateData.domain || gateData.host || '127.0.0.1';
  const pubPort = gateData.publicPort || window.location.port || '443';
  const proto = isHttpsSub ? 'https' : 'http';

  let baseOrigin = `${proto}://${currentHost}`;
  if (!isHttpsSub && pubPort && pubPort !== '80' && pubPort !== '443') {
    baseOrigin += `:${pubPort}`;
  } else if (isHttpsSub && window.location.port && window.location.port !== '443' && window.location.port !== '80') {
    baseOrigin += `:${window.location.port}`;
  }

  const pathPrefix = (window.location.pathname.split('/').filter(Boolean)[0]) || 'سهیل';
  const encPrefix = encodeURI(pathPrefix);
  const tokenParam = gateData.subToken ? `?token=${encodeURIComponent(gateData.subToken)}` : '';

  return {
    compat: `${baseOrigin}/${encPrefix}/sub${tokenParam}`,
    clash: `${baseOrigin}/${encPrefix}/clash${tokenParam}`,
    sb: `${baseOrigin}/${encPrefix}/sb${tokenParam}`,
    raw: `${baseOrigin}/${encPrefix}/raw${tokenParam}`,
    full: `${baseOrigin}/${encPrefix}/base64?compat=full${gateData.subToken ? `&token=${encodeURIComponent(gateData.subToken)}` : ''}`,
    wg: `${baseOrigin}/${encPrefix}/wg.conf${tokenParam}`
  };
}

// Update all URL inputs
function updateSubscriptionUrls() {
  const urls = getSubscriptionUrls();
  if (!urls.compat) return;

  // Detailed view inputs
  const urlSubCompat = document.getElementById('urlSubCompat');
  if (urlSubCompat) urlSubCompat.value = urls.compat;

  const urlSubRaw = document.getElementById('urlSubRaw');
  if (urlSubRaw) urlSubRaw.value = urls.raw;

  const urlClash = document.getElementById('urlClash');
  if (urlClash) urlClash.value = urls.clash;

  const urlSb = document.getElementById('urlSb');
  if (urlSb) urlSb.value = urls.sb;

  const urlSubFull = document.getElementById('urlSubFull');
  if (urlSubFull) urlSubFull.value = urls.full;

  const urlWgConf = document.getElementById('urlWgConf');
  if (urlWgConf) urlWgConf.value = urls.wg;

  // Active sub input on Home Hero Card
  const activeSubUrl = document.getElementById('activeSubUrl');
  if (activeSubUrl) {
    activeSubUrl.value = urls[currentSubFormat] || urls.compat;
  }
}

// --- Format Switcher on Home Card ---
function setupFormatTabs() {
  const tabs = document.querySelectorAll('.format-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSubFormat = tab.getAttribute('data-sub') || 'compat';
      updateSubscriptionUrls();
    });
  });

  const btnCopyActiveSub = document.getElementById('btnCopyActiveSub');
  btnCopyActiveSub?.addEventListener('click', () => {
    const input = document.getElementById('activeSubUrl');
    if (input && input.value) {
      copyToClipboard(input.value, '✓ لینک سابسکریپشن کپی شد');
    }
  });

  const btnQrActiveSub = document.getElementById('btnQrActiveSub');
  btnQrActiveSub?.addEventListener('click', () => {
    const input = document.getElementById('activeSubUrl');
    if (input && input.value) {
      openQr(input.value, 'بارکد سابسکریپشن سایور');
    }
  });

  const btnCopyAllConfigs = document.getElementById('btnCopyAllConfigs');
  btnCopyAllConfigs?.addEventListener('click', () => {
    if (!allNodesCache || allNodesCache.length === 0) {
      showToast('کانفیگی یافت نشد');
      return;
    }
    const allText = allNodesCache.map(n => n.uri).filter(Boolean).join('\n');
    copyToClipboard(allText, `✓ تعداد ${allNodesCache.length} کانفیگ کپی شدند`);
  });
}

// --- Render Node Cards ---
function renderNodes(nodes) {
  const container = document.getElementById('nodesContainer');
  const mirror = document.getElementById('nodesContainerCopy');
  if (!container) return;

  if (nodes) allNodesCache = nodes;
  const rawList = allNodesCache || [];

  // Filter out any invalid items
  let activeNodes = rawList.filter(n => {
    if (!n || !n.uri) return false;
    const lowerType = (n.type || '').toLowerCase();
    return !lowerType.includes('hy2') && !lowerType.includes('hysteria');
  });

  // Apply Protocol Filter
  if (currentFilter !== 'all') {
    activeNodes = activeNodes.filter(n => {
      const t = (n.type || '').toLowerCase();
      if (currentFilter === 'vless') return t.includes('vless');
      if (currentFilter === 'vmess') return t.includes('vmess');
      if (currentFilter === 'trojan') return t.includes('trojan');
      if (currentFilter === 'ss') return t.includes('ss') || t.includes('shadowsocks');
      if (currentFilter === 'wg') return t.includes('wg') || t.includes('wireguard');
      return true;
    });
  }

  // Apply Search
  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    activeNodes = activeNodes.filter(n => {
      const name = (n.name || '').toLowerCase();
      const type = (n.type || '').toLowerCase();
      const uri = (n.uri || '').toLowerCase();
      return name.includes(q) || type.includes(q) || uri.includes(q);
    });
  }

  if (activeNodes.length === 0) {
    const emptyHtml = `<div class="loading-state"><span>هیچ کانفیگی مطابق با فیلتر یافت نشد.</span></div>`;
    container.innerHTML = emptyHtml;
    if (mirror) mirror.innerHTML = emptyHtml;
    return;
  }

  const cardsHtml = activeNodes.map((n, idx) => {
    const rawType = (n.type || 'Proxy').toUpperCase();
    let badgeClass = 'proto-vless';
    if (rawType.includes('VMESS')) badgeClass = 'proto-vmess';
    else if (rawType.includes('TROJAN')) badgeClass = 'proto-trojan';
    else if (rawType.includes('SS') || rawType.includes('SHADOWSOCKS')) badgeClass = 'proto-ss';
    else if (rawType.includes('WG') || rawType.includes('WIREGUARD')) badgeClass = 'proto-wg';

    const safeName = (n.name || `Soheil | ${idx + 1}`).replace(/[<>&"]/g, '');
    const safeUri = (n.uri || '').replace(/"/g, '&quot;');
    const isTls = (n.uri || '').includes('security=tls') || (n.uri || '').includes('tls=1');

    return `
      <div class="node-card">
        <div class="node-card-top">
          <div class="node-name">${safeName}</div>
          <span class="node-proto-badge ${badgeClass}">${rawType}</span>
        </div>
        <div class="node-details-row">
          <span class="node-detail-item">پورت: <b>443</b></span>
          <span>•</span>
          <span class="node-detail-item">رمزنگاری: <b>${isTls ? 'TLS 1.3' : 'اختصاصی'}</b></span>
        </div>
        <div class="node-uri-box" title="برای کپی کلیک کنید" onclick="copyToClipboard('${safeUri}', '✓ کانفیگ کپی شد')">
          ${safeUri}
        </div>
        <div class="node-actions-row">
          <button type="button" class="btn btn-primary btn-sm" onclick="copyToClipboard('${safeUri}', '✓ کانفیگ کپی شد')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>کپی کانفیگ</span>
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="openQr('${safeUri}', '${safeName}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>کد QR</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = cardsHtml;
  if (mirror) mirror.innerHTML = cardsHtml;
}

// --- Search & Filter Listeners ---
function setupFilters() {
  const searchInput = document.getElementById('nodeSearchInput');
  searchInput?.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderNodes();
  });

  const filterPills = document.querySelectorAll('#protoFilterGroup .filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter') || 'all';
      renderNodes();
    });
  });
}

// --- Copy & QR Handlers for Sub View ---
function setupSubCopyButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;

    if (action === 'copy-input') {
      copyToClipboard(input.value, '✓ لینک کپی شد');
    } else if (action === 'qr-input') {
      openQr(input.value, 'بارکد سابسکریپشن');
    }
  });
}

// --- Navigation Router ---
function setupNavigation() {
  const routes = ['home', 'subs', 'nodes', 'usage', 'scanner'];

  function navigateTo(pageId) {
    if (!routes.includes(pageId)) pageId = 'home';

    // Update pages
    routes.forEach(r => {
      const view = document.getElementById('view' + r.charAt(0).toUpperCase() + r.slice(1));
      if (view) {
        if (r === pageId) view.classList.add('active');
        else view.classList.remove('active');
      }
    });

    // Update desktop tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      if (tab.getAttribute('data-page') === pageId) tab.classList.add('active');
      else tab.classList.remove('active');
    });

    // Update mobile drawer links
    document.querySelectorAll('.drawer-item').forEach(link => {
      if (link.getAttribute('data-page') === pageId) link.classList.add('active');
      else link.classList.remove('active');
    });

    // Update mobile bottom bar links
    document.querySelectorAll('.mob-link').forEach(link => {
      if (link.getAttribute('data-page') === pageId) link.classList.add('active');
      else link.classList.remove('active');
    });

    // Close mobile drawer
    document.getElementById('mobileDrawer')?.classList.remove('active');
  }

  function handleHash() {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    navigateTo(hash || 'home');
  }

  window.addEventListener('hashchange', handleHash);
  handleHash();

  // Mobile Hamburger Toggle
  const hamburger = document.getElementById('hamburgerBtn');
  const drawer = document.getElementById('mobileDrawer');
  hamburger?.addEventListener('click', () => {
    drawer?.classList.toggle('active');
  });
}

// --- Telemetry & Server Resources ---
function setupTelemetry() {
  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
  };

  const pathPrefix = (window.location.pathname.split('/').filter(Boolean)[0]) || 'سهیل';
  const apiRes = `/${pathPrefix}/api/resources`;
  const apiTraffic = `/${pathPrefix}/api/traffic`;

  async function refreshTelemetry() {
    try {
      const res = await fetch(apiRes, { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        const cpuEl = document.getElementById('shrCpu');
        if (cpuEl && d.cpu) cpuEl.innerText = `${d.cpu.usedPercent || 0}%`;

        const ramEl = document.getElementById('shrRam');
        if (ramEl && d.memory) {
          ramEl.innerText = `${formatBytes(d.memory.used)} / ${formatBytes(d.memory.total)}`;
        }

        const diskEl = document.getElementById('shrDisk');
        if (diskEl && d.disk) {
          diskEl.innerText = formatBytes(d.disk.used);
        }
      }
    } catch (_) {}

    try {
      const res = await fetch(apiTraffic, { cache: 'no-store' });
      if (res.ok) {
        const t = await res.json();
        const upEl = document.getElementById('shuLiveUp');
        const downEl = document.getElementById('shuLiveDown');
        if (upEl && t.live) upEl.innerText = formatBytes(t.live.up) + '/s';
        if (downEl && t.live) downEl.innerText = formatBytes(t.live.down) + '/s';

        const dayTotal = document.getElementById('shuDayTotal');
        if (dayTotal && t.today) dayTotal.innerText = formatBytes(t.today.total);

        const monthTotal = document.getElementById('shuMonthTotal');
        if (monthTotal && t.month) monthTotal.innerText = formatBytes(t.month.total);

        const allTotal = document.getElementById('shuAllTotal');
        if (allTotal && t.allTime) allTotal.innerText = formatBytes(t.allTime.total);
      }
    } catch (_) {}
  }

  // Refresh every 5s if usage tab active
  setInterval(() => {
    if (window.location.hash.includes('usage')) {
      refreshTelemetry();
    }
  }, 5000);

  // Initial trigger
  refreshTelemetry();
}

// --- Ingress Scanner ---
function setupScanner() {
  const form = document.getElementById('shsForm');
  const startBtn = document.getElementById('shsStart');
  const cancelBtn = document.getElementById('shsCancel');
  const statusEl = document.getElementById('shsStatus');
  const countEl = document.getElementById('shsCount');
  const rowsEl = document.getElementById('shsRows');
  const outputEl = document.getElementById('shsOutput');
  const copyAllBtn = document.getElementById('shsCopyAll');

  const pathPrefix = (window.location.pathname.split('/').filter(Boolean)[0]) || 'سهیل';
  const api = `/${pathPrefix}/api/scanner`;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (startBtn) startBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = false;
    if (statusEl) statusEl.innerText = 'در حال اسکن...';

    const ips = (document.getElementById('shsIps')?.value || '').split('\n').map(x => x.trim()).filter(Boolean);
    const discover = document.getElementById('shsDiscover')?.checked !== false;

    try {
      const res = await fetch(api + '/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-SH-Req': '1' },
        body: JSON.stringify({ ips, discover })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در اسکن');
      pollScanner();
    } catch (err) {
      if (statusEl) statusEl.innerText = 'خطا: ' + err.message;
      if (startBtn) startBtn.disabled = false;
      if (cancelBtn) cancelBtn.disabled = true;
    }
  });

  cancelBtn?.addEventListener('click', async () => {
    try {
      await fetch(api + '/cancel', { method: 'POST', headers: { 'X-SH-Req': '1' } });
    } catch (_) {}
  });

  async function pollScanner() {
    try {
      const res = await fetch(api, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const job = data.job;
      if (!job) return;

      if (statusEl) statusEl.innerText = job.status === 'running' ? `در حال اسکن (${job.tested || 0}/${job.total || 0})...` : 'پایان اسکن';
      if (countEl) countEl.innerText = `${(job.verified || []).length} تایید شده`;

      if (rowsEl && job.results) {
        rowsEl.innerHTML = job.results.map(r => `
          <tr>
            <td dir="ltr">${r.ip}</td>
            <td>${r.verified ? '<span style="color:#10b981;">✓ سالم</span>' : '<span style="color:#ef4444;">✗ ناموفق</span>'}</td>
            <td>${r.handshakeMs ? r.handshakeMs + ' ms' : '--'}</td>
            <td>${r.stage || '--'}</td>
            <td>${r.verified ? '<button type="button" class="btn btn-secondary btn-sm" onclick="copyToClipboard(\'' + (r.configs ? r.configs[0]?.uri : '') + '\')">کپی</button>' : '--'}</td>
          </tr>
        `).join('');
      }

      if (job.status === 'running') {
        setTimeout(pollScanner, 1500);
      } else {
        if (startBtn) startBtn.disabled = false;
        if (cancelBtn) cancelBtn.disabled = true;
        if (copyAllBtn && job.verified && job.verified.length > 0) {
          copyAllBtn.disabled = false;
          copyAllBtn.onclick = () => {
            const all = job.verified.map(v => v.configs ? v.configs[0]?.uri : '').filter(Boolean).join('\n');
            copyToClipboard(all, '✓ تمام کانفیگ‌های تایید شده کپی شدند');
          };
        }
      }
    } catch (_) {}
  }
}

// --- Initialize Application ---
async function init() {
  setupNavigation();
  setupProtoMode();
  setupFormatTabs();
  setupFilters();
  setupSubCopyButtons();

  // Load server status & nodes from /health
  try {
    const res = await fetch('/health');
    if (res.ok) {
      gateData = await res.json();

      // Update location
      const loc = gateData.location || 'آلمان (Germany)';
      const homeLoc = document.getElementById('homeLocation');
      if (homeLoc) homeLoc.innerText = loc;
      const nodesLoc = document.getElementById('nodesLocation');
      if (nodesLoc) nodesLoc.innerText = loc;

      // Update Uptime
      const uptimeSec = Math.floor(gateData.uptime || 0);
      const hours = Math.floor(uptimeSec / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);
      const homeUptime = document.getElementById('homeUptime');
      if (homeUptime) homeUptime.innerText = `${hours} ساعت و ${mins} دقیقه`;

      // Update Port
      const port = gateData.publicPort || '443';
      const homePort = document.getElementById('homePort');
      if (homePort) homePort.innerText = port;

      // Render nodes
      if (gateData.nodes) {
        renderNodes(gateData.nodes);
      }

      // Update subscription URLs
      updateSubscriptionUrls();
    }
  } catch (err) {
    console.error('Failed to load gate status:', err);
  }

  setupTelemetry();
  setupScanner();
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
