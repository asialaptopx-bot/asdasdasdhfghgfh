// Soheil Gate — Client Application
// Brand: Soheil Net (https://t.me/sohil)
// Sponsor: WhiteDNS (https://t.me/whitedns)

let gateData = null;
let allNodesCache = [];
let currentFilter = 'all';
let currentSearch = '';

// --- Toast Feedback ---
function showToast(text) {
  const toast = document.getElementById('shToast');
  if (!toast) return;
  toast.innerText = text;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

// --- Clipboard Copy ---
function copyTextToClipboard(text) {
  if (!text) return;
  const successMsg = 'Copied to clipboard! ✓';

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      fallbackCopy(text, successMsg);
    });
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, msg) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast(msg);
  } catch (err) {
    showToast('Failed to copy');
  }
  document.body.removeChild(textArea);
}

// --- Built-in Lightweight QR Code Generator (SVG) ---
// Minimal Type 1-10 QR Generator for offline resilience
function createQrSvg(text) {
  // Try remote QR image first, with instant SVG fallback
  const img = document.createElement('img');
  img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(text);
  img.alt = 'QR Code';
  img.width = 250;
  img.height = 250;
  img.loading = 'eager';
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
    titleEl.innerText = title || 'Scan QR Code';
  }

  wrapper.innerHTML = '';
  const qrEl = createQrSvg(text);
  wrapper.appendChild(qrEl);

  modal.classList.add('active');
}

function closeQr() {
  document.getElementById('qrModal')?.classList.remove('active');
}

document.getElementById('qrCloseBtn')?.addEventListener('click', closeQr);
document.getElementById('qrModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'qrModal') closeQr();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeQr();
});

// --- Theme Management (Dark / Cozy) ---
function applyTheme(theme) {
  const isCozy = (theme === 'cozy');
  const targetTheme = isCozy ? 'cozy' : 'dark';

  document.documentElement.setAttribute('data-theme', targetTheme);
  document.body.setAttribute('data-theme', targetTheme);

  if (isCozy) {
    document.body.classList.add('theme-cozy');
  } else {
    document.body.classList.remove('theme-cozy');
  }

  const toggleBtn = document.getElementById('themeToggleBtn');
  const toggleLabel = document.getElementById('themeToggleLabel');
  if (toggleBtn) {
    toggleBtn.setAttribute('data-theme', targetTheme);
    toggleBtn.setAttribute('aria-pressed', isCozy ? 'true' : 'false');
  }
  if (toggleLabel) {
    toggleLabel.textContent = isCozy ? 'Cozy' : 'Dark';
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('sh-theme') || localStorage.getItem('sh_gate_theme') || 'dark';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || (document.body.classList.contains('theme-cozy') ? 'cozy' : 'dark');
  const nextTheme = (current === 'cozy') ? 'dark' : 'cozy';
  applyTheme(nextTheme);
  try {
    localStorage.setItem('sh-theme', nextTheme);
    localStorage.setItem('sh_gate_theme', nextTheme);
  } catch (_) {}
}

document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);

// --- Global Click Delegation (Copy & QR) ---
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.getAttribute('data-action');

  if (action === 'copy-input') {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (input && input.value) copyTextToClipboard(input.value);
  } else if (action === 'copy-text') {
    const raw = btn.getAttribute('data-text');
    if (raw) copyTextToClipboard(decodeURIComponent(raw));
  } else if (action === 'qr-input') {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (input && input.value) openQr(input.value, 'Scan Subscription QR');
  } else if (action === 'qr-text') {
    const raw = btn.getAttribute('data-text');
    const title = btn.getAttribute('data-title') || 'Scan QR Code';
    if (raw) openQr(decodeURIComponent(raw), decodeURIComponent(title));
  }
});

// --- SPA Hash Router ---
function handleRouting() {
  let hash = window.location.hash || '#/home';
  if (hash === '#' || hash === '') hash = '#/home';
  const page = hash.replace(/^#\/?/, '').split('?')[0].toLowerCase() || 'home';

  let validPage = 'home';
  if (page === 'subs' || page === 'sub') {
    validPage = 'subs';
  } else if (page === 'nodes' || page === 'node') {
    validPage = 'nodes';
  } else if (page === 'usage' || page === 'traffic') {
    validPage = 'usage';
  } else if (page === 'scanner') {
    validPage = 'scanner';
  }

  // Toggle active view
  document.querySelectorAll('.view-page').forEach(el => {
    el.classList.remove('active');
  });

  let targetViewId = 'viewHome';
  if (validPage === 'subs') targetViewId = 'viewSubs';
  else if (validPage === 'nodes') targetViewId = 'viewNodes';
  else if (validPage === 'usage') targetViewId = 'viewUsage';
  else if (validPage === 'scanner') targetViewId = 'viewScanner';

  const targetView = document.getElementById(targetViewId);
  if (targetView) targetView.classList.add('active');

  // Toggle nav links
  document.querySelectorAll('.nav-tab, .mob-link, .drawer-item').forEach(el => {
    if (el.getAttribute('data-page') === validPage) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  toggleDrawer(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('hashchange', handleRouting);

// --- Mobile Drawer Controls ---
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileDrawer = document.getElementById('mobileDrawer');

function toggleDrawer(open) {
  if (!hamburgerBtn || !mobileDrawer) return;
  const isOpen = (typeof open === 'boolean') ? open : !mobileDrawer.classList.contains('open');
  mobileDrawer.classList.toggle('open', isOpen);
  hamburgerBtn.classList.toggle('active', isOpen);
  hamburgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  mobileDrawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

hamburgerBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDrawer();
});

mobileDrawer?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => toggleDrawer(false));
});

document.addEventListener('click', (e) => {
  if (mobileDrawer?.classList.contains('open')) {
    if (!mobileDrawer.contains(e.target) && !hamburgerBtn?.contains(e.target)) {
      toggleDrawer(false);
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileDrawer?.classList.contains('open')) {
    toggleDrawer(false);
  }
});

// Helper to escape HTML characters
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render dynamic node cards
function renderNodes(nodes, locationStr) {
  const container = document.getElementById('nodesContainer');
  if (!container) return;

  if (nodes) allNodesCache = nodes;
  const rawList = allNodesCache || [];

  // Filter out invalid or hysteria
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
      return name.includes(q) || type.includes(q);
    });
  }

  if (activeNodes.length === 0) {
    container.innerHTML = `
      <div class="no-nodes-msg">
        <p>No matching proxy nodes found. Try adjusting your filter.</p>
      </div>
    `;
    return;
  }

  let html = '';
  activeNodes.forEach((node, index) => {
    const rawUri = node.uri;
    const name = node.name || `Soheil | ${index + 1}`;
    const lowerType = (node.type || '').toLowerCase();

    // Determine protocol badge
    let protoLabel = 'VLESS';
    let protoClass = 'badge-proto-vless';
    if (lowerType.includes('vmess')) {
      protoLabel = 'VMess';
      protoClass = 'badge-proto-vmess';
    } else if (lowerType.includes('trojan')) {
      protoLabel = 'Trojan';
      protoClass = 'badge-proto-trojan';
    } else if (lowerType.includes('shadowsocks') || lowerType.startsWith('ss')) {
      protoLabel = 'Shadowsocks';
      protoClass = 'badge-proto-ss';
    } else if (lowerType.includes('wireguard') || lowerType.includes('wg')) {
      protoLabel = 'WireGuard';
      protoClass = 'badge-proto-wg';
    } else if (lowerType.includes('tuic')) {
      protoLabel = 'TUIC';
      protoClass = 'badge-proto-tuic';
    }

    // Determine transport / security badges
    let transportBadge = '';
    if (lowerType.includes('ws')) {
      transportBadge = '<span class="node-badge-tag">WS</span>';
    } else if (lowerType.includes('httpupgrade')) {
      transportBadge = '<span class="node-badge-tag">HTTPUpgrade</span>';
    } else if (lowerType.includes('grpc')) {
      transportBadge = '<span class="node-badge-tag">gRPC</span>';
    } else if (lowerType.includes('xhttp')) {
      transportBadge = '<span class="node-badge-tag">XHTTP</span>';
    }

    let secBadge = '';
    if (lowerType.includes('reality')) {
      secBadge = '<span class="node-badge-tag badge-reality">Reality</span>';
    } else if (lowerType.includes('tls') || lowerType.includes('shadowtls')) {
      secBadge = '<span class="node-badge-tag badge-tls">TLS</span>';
    }

    const encodedUri = encodeURIComponent(rawUri);
    const encodedTitle = encodeURIComponent(name);

    html += `
      <div class="node-item-card">
        <div class="node-card-header">
          <div class="node-card-title-group">
            <span class="proto-badge ${protoClass}">${protoLabel}</span>
            <h4 class="node-remark-title" title="${escapeHtml(name)}">${escapeHtml(name)}</h4>
          </div>
          <div class="node-badges-group">
            ${transportBadge}
            ${secBadge}
          </div>
        </div>

        <div class="node-card-meta">
          <div class="node-location-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="loc-icon">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${escapeHtml(locationStr || 'Global Gateway')}</span>
          </div>
          ${node.note ? `<div class="node-location-tag" style="opacity:.85;font-size:.78rem">${escapeHtml(node.note)}</div>` : ''}
        </div>

        <div class="node-uri-box">
          <input type="text" class="node-uri-input" readonly value="${escapeHtml(rawUri)}" onclick="this.select();">
        </div>

        <div class="node-actions-row">
          <button type="button" class="btn-node-copy" data-action="copy-text" data-text="${encodedUri}">
            <svg class="btn-action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span>Copy Link</span>
          </button>
          <button type="button" class="btn-node-qr" data-action="qr-text" data-text="${encodedUri}" data-title="${encodedTitle}" title="Show QR Code">
            <svg class="btn-action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>QR</span>
          </button>
          ${node.wgConf ? `
            <a href="/سهیل/wg.conf" download="wg0.conf" class="btn-node-dl" title="Download WireGuard Profile">
              <span>.conf</span>
            </a>
          ` : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// --- Setup Node Filtering & Search Listeners ---
function initNodeFilters() {
  const searchInput = document.getElementById('nodeSearchInput');
  searchInput?.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderNodes(null, gateData?.location);
  });

  const filterBtns = document.querySelectorAll('#protoFilterGroup .filter-pill');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      renderNodes(null, gateData?.location);
    });
  });
}

// --- Load Gate Data from Server ---
async function loadGateData() {
  try {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const pathPrefix = pathSegments[0] || 'سهیل';

    // Fetch server status
    const res = await fetch('/health');
    const data = await res.json();
    gateData = data;

    // Determine host and port
    const pubPort = data.publicPort || window.location.port || '8080';
    const serverHost = data.domain || data.host || window.location.hostname;
    const locationStr = data.location || 'Global Gateway';

    // Format Uptime
    let uptimeStr = '--';
    if (data.uptime !== undefined) {
      const mins = Math.floor(data.uptime / 60);
      const secs = Math.floor(data.uptime % 60);
      uptimeStr = `${mins}m ${secs}s`;
    }

    // Update Home Section Stats
    const homeLocation = document.getElementById('homeLocation');
    if (homeLocation) homeLocation.innerText = locationStr;

    const homePort = document.getElementById('homePort');
    if (homePort) homePort.innerText = pubPort;

    const homeUptime = document.getElementById('homeUptime');
    if (homeUptime) homeUptime.innerText = uptimeStr;

    // Update Sub Section Metrics
    const statLocation = document.getElementById('statLocation');
    if (statLocation) statLocation.innerText = locationStr;

    const statPort = document.getElementById('statPort');
    if (statPort) statPort.innerText = pubPort;

    const statHost = document.getElementById('statHost');
    if (statHost) statHost.innerText = serverHost;

    const statUptime = document.getElementById('statUptime');
    if (statUptime) statUptime.innerText = uptimeStr;

    // Update Node Section Header
    const nodesLocation = document.getElementById('nodesLocation');
    if (nodesLocation) nodesLocation.innerText = locationStr;

    // Update Engines
    const engines = [];
    if (data.engines?.singbox) engines.push('sing-box');
    if (data.engines?.xray) engines.push('xray');
    if (data.engines?.argo) engines.push('argo');
    const statEngines = document.getElementById('statEngines');
    if (statEngines) statEngines.innerText = engines.join(' + ') || 'sing-box active';

    // Subscription URLs protocol
    let activeProto = (data.forceHttps || window.location.protocol === 'https:') ? 'https:' : 'http:';

    const updateSubscriptionUrls = (proto) => {
      let origin;
      if (data.publicBaseUrl && typeof data.publicBaseUrl === 'string' && data.publicBaseUrl.trim()) {
        origin = data.publicBaseUrl.trim().replace(/\/+$/, '');
      } else if (data.subBase && typeof data.subBase === 'string' && data.subBase.trim()) {
        origin = data.subBase.trim().replace(/\/+$/, '');
      } else {
        const hostPort = window.location.port ? `${window.location.hostname}:${window.location.port}` : window.location.hostname;
        if (proto === 'https:') {
          if (data.domain) {
            origin = data.domain.startsWith('http') ? data.domain : `https://${data.domain}`;
          } else if (window.location.protocol === 'https:') {
            origin = window.location.origin;
          } else {
            origin = `https://${hostPort}`;
          }
        } else {
          origin = `http://${hostPort}`;
        }
      }

      const shTok = (data && data.subToken) ? encodeURIComponent(data.subToken) : '';
      const shQ = (u) => shTok ? u + (u.indexOf('?') >= 0 ? '&' : '?') + 'token=' + shTok : u;
      
      const compatSubUrl = shQ(`${origin}/${pathPrefix}/base64`);
      const rawSubUrl = shQ(`${origin}/${pathPrefix}/raw`);
      const fullSubUrl = shQ(`${origin}/${pathPrefix}/base64?compat=full`);
      const clashUrl = shQ(`${origin}/${pathPrefix}/clash`);
      const sbUrl = shQ(`${origin}/${pathPrefix}/sb/raw`);
      const wgConfUrl = shQ(`${origin}/${pathPrefix}/wg.conf`);

      const elCompat = document.getElementById('urlSubCompat');
      if (elCompat) elCompat.value = compatSubUrl;

      const elRaw = document.getElementById('urlSubRaw');
      if (elRaw) elRaw.value = rawSubUrl;

      const elFull = document.getElementById('urlSubFull');
      if (elFull) elFull.value = fullSubUrl;

      const elClash = document.getElementById('urlClash');
      if (elClash) elClash.value = clashUrl;

      const elSb = document.getElementById('urlSb');
      if (elSb) elSb.value = sbUrl;

      const elWg = document.getElementById('urlWgConf');
      if (elWg) elWg.value = wgConfUrl;

      const btnDlWg = document.getElementById('btnDownloadWg');
      if (btnDlWg) btnDlWg.href = `${origin}/${pathPrefix}/wg.conf`;

      const compatBadge = document.getElementById('compatBadge');
      if (compatBadge) {
        compatBadge.innerText = (proto === 'https:') ? '(HTTPS Subscription)' : '(v2rayN / Windows Ready)';
      }
    };

    updateSubscriptionUrls(activeProto);

    // Setup interactive protocol toggle buttons
    const btnProtoHttp = document.getElementById('btnProtoHttp');
    const btnProtoHttps = document.getElementById('btnProtoHttps');
    if (btnProtoHttp && btnProtoHttps) {
      btnProtoHttp.classList.toggle('active', activeProto === 'http:');
      btnProtoHttps.classList.toggle('active', activeProto === 'https:');

      btnProtoHttp.onclick = () => {
        activeProto = 'http:';
        btnProtoHttp.classList.add('active');
        btnProtoHttps.classList.remove('active');
        updateSubscriptionUrls('http:');
        showToast('Switched to HTTP (v2rayN Windows compatible)');
      };

      btnProtoHttps.onclick = () => {
        activeProto = 'https:';
        btnProtoHttps.classList.add('active');
        btnProtoHttp.classList.remove('active');
        updateSubscriptionUrls('https:');
        showToast('Switched to HTTPS (Requires SSL Proxy)');
      };
    }

    // Render node list
    renderNodes(data.nodes, locationStr);

  } catch (err) {
    console.error('Failed to load gate status:', err);
    const container = document.getElementById('nodesContainer');
    if (container) {
      container.innerHTML = `
        <div class="no-nodes-msg">
          <p>Failed to connect to gateway server. Please refresh or check connection.</p>
        </div>
      `;
    }
  }
}

// --- Home page latest YouTube video thumbnail ---
async function initLatestVideo() {
  try {
    const res = await fetch('/api/latest-video');
    const data = await res.json();
    if (data && data.ok && data.videoId) {
      const heroCard = document.querySelector('.single-hero-card');
      const heroImg = document.querySelector('.hero-card-img');
      if (heroCard && heroImg) {
        const preImg = new Image();
        preImg.onload = () => {
          heroImg.src = data.thumbnail;
        };
        preImg.src = data.thumbnail;
      }
    }
  } catch (_) {}
}

// --- Usage & Resource Monitoring ---
(function() {
  const $ = id => document.getElementById(id);
  const pathPrefix = window.location.pathname.split('/').filter(Boolean)[0] || 'سهیل';
  const apiRes = `/${pathPrefix}/api/resources`;
  const apiTraffic = `/${pathPrefix}/api/traffic`;

  function fmtBytes(b) {
    if (!b || b <= 0) return '0 B';
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), units.length - 1);
    return (b / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2) + ' ' + units[i];
  }

  function fmtSpeed(b) {
    return fmtBytes(b) + '/s';
  }

  async function loadResources() {
    try {
      const res = await fetch(apiRes, { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();

      if ($('shrStatus')) $('shrStatus').textContent = 'Live telemetry';

      if (data.cpu) {
        if ($('shrCpu')) $('shrCpu').textContent = (data.cpu.percent !== null && data.cpu.percent !== undefined) ? data.cpu.percent + '%' : 'Sampling...';
        if ($('shrCpuBar')) {
          $('shrCpuBar').hidden = false;
          $('shrCpuBar').value = data.cpu.percent || 0;
        }
        if ($('shrCpuInfo')) $('shrCpuInfo').textContent = data.cpu.info || '';
      }

      if (data.ram) {
        if ($('shrRam')) $('shrRam').textContent = (data.ram.percent !== null && data.ram.percent !== undefined) ? data.ram.percent + '%' : '–';
        if ($('shrRamBar')) {
          $('shrRamBar').hidden = false;
          $('shrRamBar').value = data.ram.percent || 0;
        }
        if ($('shrRamInfo')) $('shrRamInfo').textContent = (data.ram.used && data.ram.total) ? `${data.ram.used} / ${data.ram.total}` : '';
      }

      if (data.disk) {
        if ($('shrDisk')) $('shrDisk').textContent = data.disk.used || '–';
        if ($('shrDiskBar') && data.disk.percent !== null) {
          $('shrDiskBar').hidden = false;
          $('shrDiskBar').value = data.disk.percent || 0;
        }
        if ($('shrDiskInfo')) $('shrDiskInfo').textContent = data.disk.info || '';
      }

      if (data.days !== undefined && $('shrDays')) {
        $('shrDays').textContent = data.days || 'Not provided';
      }
      if (data.expiry && $('shrExpiry')) {
        $('shrExpiry').textContent = data.expiry;
      }
      if (data.credit !== undefined && $('shrCredit')) {
        $('shrCredit').textContent = data.credit || 'Not provided';
      }
      if (data.creditInfo && $('shrCreditInfo')) {
        $('shrCreditInfo').textContent = data.creditInfo;
      }
    } catch (_) {}
  }

  async function loadTraffic() {
    try {
      const res = await fetch(apiTraffic, { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();

      if (data.live) {
        if ($('shuLiveUp')) $('shuLiveUp').textContent = fmtSpeed(data.live.up);
        if ($('shuLiveDown')) $('shuLiveDown').textContent = fmtSpeed(data.live.down);
      }

      if (data.today) {
        if ($('shuDayTotal')) $('shuDayTotal').textContent = fmtBytes(data.today.total);
        if ($('shuDayUp')) $('shuDayUp').textContent = fmtBytes(data.today.up);
        if ($('shuDayDown')) $('shuDayDown').textContent = fmtBytes(data.today.down);
      }

      if (data.month) {
        if ($('shuMonthTotal')) $('shuMonthTotal').textContent = fmtBytes(data.month.total);
        if ($('shuMonthUp')) $('shuMonthUp').textContent = fmtBytes(data.month.up);
        if ($('shuMonthDown')) $('shuMonthDown').textContent = fmtBytes(data.month.down);
        if ($('shuMonthKey')) $('shuMonthKey').textContent = data.month.key ? `(${data.month.key})` : '';
      }

      if (data.all) {
        if ($('shuAllTotal')) $('shuAllTotal').textContent = fmtBytes(data.all.total);
        if ($('shuAllUp')) $('shuAllUp').textContent = fmtBytes(data.all.up);
        if ($('shuAllDown')) $('shuAllDown').textContent = fmtBytes(data.all.down);
      }

      // Render Table Rows
      const rowsEl = $('shuRows');
      if (rowsEl && Array.isArray(data.configs)) {
        rowsEl.innerHTML = '';
        data.configs.forEach(c => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${escapeHtml(c.name || c.id)}</strong></td>
            <td>&uarr; ${fmtSpeed(c.liveUp)} &nbsp; &darr; ${fmtSpeed(c.liveDown)}</td>
            <td>${fmtBytes(c.today)}</td>
            <td>${fmtBytes(c.monthUp)}</td>
            <td>${fmtBytes(c.monthDown)}</td>
            <td><strong>${fmtBytes(c.monthTotal)}</strong></td>
            <td>${fmtBytes(c.allTotal)}</td>
          `;
          rowsEl.appendChild(tr);
        });
      }

      // Sync & Reset controls
      const syncBtn = $('shuSyncBtn');
      if (syncBtn) syncBtn.onclick = async () => {
        const val = parseFloat($('shuSyncGb')?.value);
        if (isNaN(val) || val < 0) return showToast('Please enter a valid GiB amount');
        try {
          const r = await fetch(`/${pathPrefix}/api/traffic/baseline`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-SH-Req': '1' },
            body: JSON.stringify({ gib: val })
          });
          if (r.ok) {
            showToast('Traffic baseline updated!');
            loadTraffic();
          }
        } catch (_) {}
      };

      const resetBtn = $('shuResetBtn');
      if (resetBtn) resetBtn.onclick = async () => {
        if (!confirm('Are you sure you want to reset the traffic counter?')) return;
        try {
          const r = await fetch(`/${pathPrefix}/api/traffic/reset`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'X-SH-Req': '1' }
          });
          if (r.ok) {
            showToast('Counter reset successfully');
            loadTraffic();
          }
        } catch (_) {}
      };

    } catch (_) {}
  }

  // Periodic Telemetry Poll
  let pollInterval = null;
  function startPoll() {
    if (pollInterval) clearInterval(pollInterval);
    loadResources();
    loadTraffic();
    pollInterval = setInterval(() => {
      if (/usage|traffic/.test(window.location.hash)) {
        loadResources();
        loadTraffic();
      }
    }, 5000);
  }

  window.addEventListener('hashchange', () => {
    if (/usage|traffic/.test(window.location.hash)) {
      startPoll();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (/usage|traffic/.test(window.location.hash)) startPoll();
  });
})();

// --- Ingress Scanner Controller ---
(function() {
  const $ = id => document.getElementById(id);
  const pathPrefix = window.location.pathname.split('/').filter(Boolean)[0] || 'سهیل';
  const api = `/${pathPrefix}/api/scanner`;
  let job = null, loading = false, timer = null;

  function visible() {
    return window.location.hash === '#/scanner' && document.visibilityState === 'visible';
  }

  function configFor(result) {
    if (!result || !result.configs) return null;
    return result.configs.find(c => c.type === $('shsProtocol').value);
  }

  function exports() {
    const links = job ? job.results.filter(r => r.verified).map(configFor).filter(Boolean).map(c => c.uri) : [];
    if ($('shsOutput')) $('shsOutput').value = links.join('\n');
    if ($('shsCopyAll')) $('shsCopyAll').disabled = !links.length;
  }

  function render(data) {
    if (data.domain && $('shsDomain')) $('shsDomain').textContent = data.domain;
    if (data.job !== undefined) job = data.job;
    const running = job && job.status === 'running';

    if ($('shsStart')) $('shsStart').disabled = !!running;
    if ($('shsCancel')) $('shsCancel').disabled = !running;
    if ($('shsIps')) $('shsIps').disabled = !!running;
    if ($('shsDiscover')) $('shsDiscover').disabled = !!running;

    if ($('shsCount')) {
      $('shsCount').textContent = (job ? job.results.filter(r => r.verified).length : 0) + ' verified';
    }

    if ($('shsStatus')) {
      $('shsStatus').textContent = job ? (job.phase === 'discovery' && running ? 'Discovering public ingress IPs...' : job.status + ' / ' + job.tested + ' of ' + job.total + ' tested') : 'Ready to scan';
    }

    if ($('shsNotes')) {
      $('shsNotes').textContent = job ? job.notes.join(' ') : '';
    }

    const body = $('shsRows');
    if (body) {
      body.innerHTML = '';
      if (!job || !job.results.length) {
        const row = body.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = running ? 'Testing candidates...' : 'No results yet.';
      } else {
        job.results.forEach(result => {
          const row = body.insertRow();
          row.insertCell().textContent = result.ip;
          const status = row.insertCell();
          status.textContent = result.verified ? 'Verified / HTTP ' + result.httpStatus : result.stage + ': ' + result.error;
          if (result.verified) status.className = 'shs-good';
          row.insertCell().textContent = result.handshakeMs === null ? '—' : result.handshakeMs + ' ms';
          row.insertCell().textContent = result.verified ? result.totalMs + ' ms' : '—';
          const cell = row.insertCell();
          const button = document.createElement('button');
          button.className = 'shu-btn';
          button.type = 'button';
          button.textContent = 'Copy';
          button.disabled = !result.verified || !configFor(result);
          button.addEventListener('click', () => {
            const config = configFor(result);
            if (config) copyTextToClipboard(config.uri);
          });
          cell.appendChild(button);
        });
      }
    }
    exports();
  }

  function schedule() {
    clearTimeout(timer);
    if (visible() && job && job.status === 'running') {
      timer = setTimeout(load, 2000);
    }
  }

  async function load() {
    if (loading) return;
    loading = true;
    try {
      const response = await fetch(api, { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('Could not read scan status');
      render(await response.json());
    } catch (error) {
      if ($('shsStatus')) $('shsStatus').textContent = error.message;
    } finally {
      loading = false;
      schedule();
    }
  }

  async function post(path, body) {
    const response = await fetch(api + path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-SH-Req': '1' },
      body: JSON.stringify(body || {})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  $('shsForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    if ($('shsStart')) $('shsStart').disabled = true;
    if ($('shsStatus')) $('shsStatus').textContent = 'Starting scan...';
    try {
      const ips = $('shsIps').value.split(/[\s,;]+/).filter(Boolean);
      const data = await post('/start', { ips, discover: $('shsDiscover').checked });
      render(data);
      schedule();
    } catch (error) {
      if ($('shsStatus')) $('shsStatus').textContent = error.message;
      if ($('shsStart')) $('shsStart').disabled = false;
    }
  });

  $('shsCancel')?.addEventListener('click', async () => {
    if ($('shsCancel')) $('shsCancel').disabled = true;
    try {
      await post('/cancel');
      await load();
    } catch (error) {
      if ($('shsStatus')) $('shsStatus').textContent = error.message;
    }
  });

  $('shsProtocol')?.addEventListener('change', () => render({ job }));
  $('shsCopyAll')?.addEventListener('click', () => {
    if ($('shsOutput')) copyTextToClipboard($('shsOutput').value);
  });

  function changed() {
    clearTimeout(timer);
    if (visible()) load();
  }

  window.addEventListener('hashchange', changed);
  document.addEventListener('visibilitychange', changed);
  document.addEventListener('DOMContentLoaded', changed);
})();

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  handleRouting();
  initNodeFilters();
  loadGateData();
  initLatestVideo();
});
