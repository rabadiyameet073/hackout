// State
let reports = [];
let filtered = [];
let markersLayer;
let map;
let sortBy = 'id';
let sortDir = 'asc';
let currentPage = 1;
let pageSize = 8;
let currentView = 'dashboard';

// Charts
let barChart, lineChart, pieChart;

// Utils
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Mock data fetch
function mockFetchReports() {
  const seed = [
    { id: 101, user: 'Alice',   lat: 14.5995, lng: 120.9842, region: 'Metro Manila',   location: 'Manila Bay', status: 'Pending',  date: '2025-08-19', volunteers: 5, img: null },
    { id: 102, user: 'Ramon',   lat: 13.7563, lng: 121.0583, region: 'Calabarzon',     location: 'Tayabas Bay', status: 'Verified', date: '2025-08-18', volunteers: 3, img: null },
    { id: 103, user: 'Siti',    lat: 1.3521,  lng: 103.8198, region: 'Singapore',      location: 'Sungei Buloh', status: 'Urgent',  date: '2025-08-20', volunteers: 8, img: null },
    { id: 104, user: 'Anil',    lat: 19.0760, lng: 72.8777,  region: 'Maharashtra',    location: 'Thane Creek', status: 'Verified', date: '2025-08-17', volunteers: 4, img: null },
    { id: 105, user: 'Maya',    lat: -6.2088, lng: 106.8456, region: 'Jakarta',        location: 'Angke Kapuk', status: 'Pending',  date: '2025-08-21', volunteers: 6, img: null },
    { id: 106, user: 'Bao',     lat: 10.8231, lng: 106.6297, region: 'Ho Chi Minh',    location: 'Can Gio',     status: 'Urgent',  date: '2025-08-22', volunteers: 7, img: null },
    { id: 107, user: 'Lina',    lat: 24.7136, lng: 46.6753,  region: 'Riyadh',         location: 'Wadi Hanifa', status: 'Pending',  date: '2025-08-16', volunteers: 2, img: null },
    { id: 108, user: 'Diego',   lat: -12.0464,lng: -77.0428, region: 'Lima',           location: 'Manglares',   status: 'Verified', date: '2025-08-15', volunteers: 5, img: null },
    { id: 109, user: 'Sara',    lat: 25.2048, lng: 55.2708,  region: 'Dubai',          location: 'Ras Al Khor', status: 'Pending',  date: '2025-08-12', volunteers: 4, img: null },
    { id: 110, user: 'Kenji',   lat: 35.6762, lng: 139.6503, region: 'Tokyo',          location: 'Tokyo Bay',   status: 'Verified', date: '2025-08-10', volunteers: 3, img: null },
    { id: 111, user: 'Aisha',   lat: 24.4539, lng: 54.3773,  region: 'Abu Dhabi',      location: 'Eastern Mangroves', status: 'Urgent', date: '2025-08-20', volunteers: 6, img: null },
    { id: 112, user: 'Noah',    lat: -33.8688,lng: 151.2093, region: 'Sydney',         location: 'Homebush Bay', status: 'Verified', date: '2025-08-05', volunteers: 5, img: null },
    { id: 113, user: 'Fatima',  lat: 23.8859, lng: 45.0792,  region: 'Saudi Arabia',   location: 'Jazan',       status: 'Pending',  date: '2025-08-14', volunteers: 2, img: null },
    { id: 114, user: 'Omar',    lat: 29.3759, lng: 47.9774,  region: 'Kuwait',         location: 'Doha Bay',    status: 'Verified', date: '2025-08-13', volunteers: 2, img: null },
    { id: 115, user: 'Ivy',     lat: 22.3193, lng: 114.1694, region: 'Hong Kong',      location: 'Mai Po',      status: 'Pending',  date: '2025-08-09', volunteers: 3, img: null },
    { id: 116, user: 'Luis',    lat: 9.7489,  lng: -83.7534, region: 'Costa Rica',     location: 'Sierpe',      status: 'Verified', date: '2025-08-03', volunteers: 7, img: null },
    { id: 117, user: 'Marta',   lat: 41.3851, lng: 2.1734,   region: 'Barcelona',      location: 'Llobregat',   status: 'Pending',  date: '2025-08-02', volunteers: 1, img: null },
    { id: 118, user: 'Ravi',    lat: 8.5241,  lng: 76.9366,  region: 'Kerala',         location: 'Vembanad',    status: 'Verified', date: '2025-08-01', volunteers: 4, img: null },
    { id: 119, user: 'Nadia',   lat: -2.170998, lng: -79.922359, region: 'Guayaquil', location: 'Churute',     status: 'Urgent',  date: '2025-08-23', volunteers: 9, img: null },
    { id: 120, user: 'Jon',     lat: 52.5200, lng: 13.4050,  region: 'Berlin',         location: 'Spree Delta', status: 'Pending',  date: '2025-08-11', volunteers: 2, img: null },
  ];
  return seed.map(r => ({
    ...r,
    img: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="56"><rect width="100%" height="100%" fill="#151a2b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#e2e8f0" font-size="10" font-family="Arial">IMG ${r.id}</text></svg>`)
  }));
}

// Navigation Functions
function showView(viewName) {
  currentView = viewName;
  
  // Update active menu item
  $$('.menu a').forEach(link => link.classList.remove('active'));
  const activeLink = $(`.menu a[data-view="${viewName}"]`);
  if (activeLink) activeLink.classList.add('active');

  switch(viewName) {
    case 'dashboard':
      showDashboard();
      break;
    case 'reports':
      showReports();
      break;
    case 'analytics':
      showAnalytics();
      break;
    case 'community':
      showCommunity();
      break;
    case 'settings':
      showSettings();
      break;
  }
}

function showDashboard() {
  $('.content').innerHTML = `
    <section class="cards" id="cardsRow">
      <article class="card" aria-live="polite">
        <div class="head">
          <span>Total Reports</span>
          <span class="pill">Live</span>
        </div>
        <div class="metric">
          <span class="value glow-green" id="stat-total">—</span>
          <small class="muted" id="stat-total-change">+0%</small>
        </div>
      </article>
      <article class="card">
        <div class="head">
          <span>Verified Cases</span>
          <span class="pill">Reviewed</span>
        </div>
        <div class="metric">
          <span class="value glow-green" id="stat-verified">—</span>
          <small class="muted" id="stat-verified-change">+0%</small>
        </div>
      </article>
      <article class="card">
        <div class="head">
          <span>Urgent Alerts</span>
          <span class="pill">Priority</span>
        </div>
        <div class="metric">
          <span class="value glow-aqua" id="stat-urgent">—</span>
          <small class="muted" id="stat-urgent-change">0 new</small>
        </div>
      </article>
      <article class="card">
        <div class="head">
          <span>Volunteers Active</span>
          <span class="pill">Community</span>
        </div>
        <div class="metric">
          <span class="value glow-aqua" id="stat-volunteers">—</span>
          <small class="muted" id="stat-volunteers-change">today</small>
        </div>
      </article>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2 class="title">Report Locations Map</h2>
        <div class="filters">
          <button class="btn" onclick="refreshData()">
            <svg class="icon"><use href="#i-alert"></use></svg>
            Refresh
          </button>
          <button class="btn" onclick="exportMapData()">
            <svg class="icon"><use href="#i-gear"></use></svg>
            Export
          </button>
          <select id="statusFilter" aria-label="Filter by status">
            <option value="ALL">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Urgent">Urgent</option>
          </select>
          <select id="regionFilter" aria-label="Filter by region">
            <option value="ALL">All regions</option>
          </select>
        </div>
      </div>
      <div class="map-wrap">
        <div id="map" class="skeleton" role="region" aria-label="Reports map"></div>
        <div class="legend" aria-hidden="true">
          <div><span class="dot dot-green"></span>Verified</div>
          <div><span class="dot dot-aqua"></span>Urgent</div>
          <div><span class="dot dot-gray"></span>Pending</div>
        </div>
      </div>
    </section>

    <section class="panel" aria-label="Reports table">
      <div class="panel-head">
        <h2 class="title">User Submissions</h2>
        <div class="filters">
          <button class="btn" onclick="exportTableData()">
            <svg class="icon"><use href="#i-gear"></use></svg>
            Export CSV
          </button>
          <button class="btn" onclick="bulkApprove()">
            <svg class="icon"><use href="#i-check"></use></svg>
            Bulk Approve
          </button>
          <select id="pageSize" class="page-size" aria-label="Rows per page">
            <option>8</option>
            <option>12</option>
            <option>20</option>
          </select>
        </div>
      </div>
      <div class="table-wrap" id="tableWrap">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" id="selectAll" onchange="toggleSelectAll()"></th>
              <th data-sort="id">ID</th>
              <th data-sort="user">User</th>
              <th>Image</th>
              <th data-sort="location">Location</th>
              <th data-sort="status">Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="tableBody">
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <div class="pager">
          <button class="btn-xs" id="prevPage">Prev</button>
          <span id="pageInfo" aria-live="polite">Page 1 of 1</span>
          <button class="btn-xs" id="nextPage">Next</button>
        </div>
        <div class="muted" id="resultCount">0 results</div>
      </div>
    </section>

    <section class="charts" aria-label="Analytics">
      <div class="chart-box">
        <h3 class="chart-title">Reports per Region (Bar)</h3>
        <canvas id="barRegion"></canvas>
      </div>
      <div class="chart-box">
        <h3 class="chart-title">Reports over Time (Line)</h3>
        <canvas id="lineTime"></canvas>
      </div>
      <div class="chart-box">
        <h3 class="chart-title">Verified vs Pending (Pie)</h3>
        <canvas id="pieStatus"></canvas>
      </div>
    </section>
  `;
  
  initMap();
  populateRegions();
  ensureCharts();
  attachTableEvents();
  renderStats();
  updateMap();
  renderTable();
  updateCharts();
}

function showReports() {
  $('.content').innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h2 class="title">Advanced Reports Management</h2>
        <div class="filters">
          <button class="btn" onclick="createNewReport()">
            <svg class="icon"><use href="#i-leaf"></use></svg>
            New Report
          </button>
          <button class="btn" onclick="importReports()">
            <svg class="icon"><use href="#i-gear"></use></svg>
            Import
          </button>
        </div>
      </div>
      <div style="padding: 30px; text-align: center;">
        <h3>Advanced Reports Management</h3>
        <p>Manage all environmental reports, create new submissions, and handle bulk operations.</p>
        <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button class="btn" onclick="viewPendingReports()">
            <svg class="icon"><use href="#i-alert"></use></svg>
            View Pending Reports
          </button>
          <button class="btn" onclick="viewVerifiedReports()">
            <svg class="icon"><use href="#i-check"></use></svg>
            View Verified Reports
          </button>
          <button class="btn" onclick="viewUrgentReports()">
            <svg class="icon"><use href="#i-x"></use></svg>
            View Urgent Reports
          </button>
          <button class="btn" onclick="generateSummaryReport()">
            <svg class="icon"><use href="#i-chart"></use></svg>
            Generate Summary Report
          </button>
        </div>
        
        <div id="reportDetails" style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.06); border-radius: 12px; display: none;">
          <h4 id="reportTitle">Report Details</h4>
          <div id="reportContent"></div>
        </div>
      </div>
    </div>
  `;
}

function showAnalytics() {
  $('.content').innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h2 class="title">Advanced Analytics Dashboard</h2>
        <div class="filters">
          <button class="btn" onclick="exportAnalytics()">
            <svg class="icon"><use href="#i-chart"></use></svg>
            Export Data
          </button>
          <button class="btn" onclick="refreshAnalytics()">
            <svg class="icon"><use href="#i-alert"></use></svg>
            Refresh
          </button>
        </div>
      </div>
      <div style="padding: 30px; text-align: center;">
        <h3>Analytics Dashboard</h3>
        <p>Comprehensive analytics and insights for environmental monitoring.</p>
        <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button class="btn" onclick="showTrendAnalysis()">
            <svg class="icon"><use href="#i-chart"></use></svg>
            Trend Analysis
          </button>
          <button class="btn" onclick="showRegionalStats()">
            <svg class="icon"><use href="#i-gear"></use></svg>
            Regional Statistics
          </button>
          <button class="btn" onclick="showPerformanceMetrics()">
            <svg class="icon"><use href="#i-check"></use></svg>
            Performance Metrics
          </button>
          <button class="btn" onclick="showPredictiveAnalysis()">
            <svg class="icon"><use href="#i-alert"></use></svg>
            Predictive Analysis
          </button>
        </div>
        
        <div id="analyticsDisplay" style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.06); border-radius: 12px; display: none;">
          <h4 id="analyticsTitle">Analytics Results</h4>
          <div id="analyticsContent"></div>
        </div>
      </div>
    </div>
  `;
}

function showCommunity() {
  $('.content').innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h2 class="title">Community Management Hub</h2>
        <div class="filters">
          <button class="btn" onclick="exportCommunityData()">
            <svg class="icon"><use href="#i-users"></use></svg>
            Export Data
          </button>
          <button class="btn" onclick="refreshCommunityData()">
            <svg class="icon"><use href="#i-alert"></use></svg>
            Refresh
          </button>
        </div>
      </div>
      <div style="padding: 30px; text-align: center;">
        <h3>Volunteer Community Management</h3>
        <p>Manage volunteers, coordinate activities, and build environmental awareness.</p>
        <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button class="btn" onclick="inviteVolunteers()">
            <svg class="icon"><use href="#i-users"></use></svg>
            Invite Volunteers
          </button>
          <button class="btn" onclick="sendCommunityNotifications()">
            <svg class="icon"><use href="#i-bell"></use></svg>
            Send Notifications
          </button>
          <button class="btn" onclick="viewAllVolunteers()">
            <svg class="icon"><use href="#i-check"></use></svg>
            View All Volunteers
          </button>
          <button class="btn" onclick="createCommunityActivity()">
            <svg class="icon"><use href="#i-leaf"></use></svg>
            Create Activity
          </button>
        </div>
        
        <div id="communityDisplay" style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.06); border-radius: 12px; display: none;">
          <h4 id="communityTitle">Community Information</h4>
          <div id="communityContent"></div>
        </div>
      </div>
    </div>
  `;
}
function showSettings() {
  $('.content').innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h2 class="title">System Settings</h2>
        <div class="filters">
          <button class="btn" onclick="saveSettings()">
            <svg class="icon"><use href="#i-check"></use></svg>
            Save Changes
          </button>
          <button class="btn" onclick="resetSettings()">
            <svg class="icon"><use href="#i-x"></use></svg>
            Reset to Default
          </button>
        </div>
      </div>
      <div style="padding: 20px;">
        <h3>Configuration Options</h3>
        <div style="margin-top: 20px; display: grid; gap: 20px;">
          <div class="card">
            <h4>Notification Settings</h4>
            <label><input type="checkbox" checked> Email notifications for new reports</label><br>
            <label><input type="checkbox" checked> SMS alerts for urgent cases</label><br>
            <label><input type="checkbox"> Weekly summary reports</label>
          </div>
          <div class="card">
            <h4>Display Preferences</h4>
            <label>Theme: 
              <select id="themeSelect" onchange="handleThemeChange()">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label><br><br>
            <label>Language: 
              <select id="languageSelect" onchange="handleLanguageChange()">
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
              </select>
            </label>
          </div>
          <div class="card">
            <h4>Data Management</h4>
            <button class="btn" onclick="backupData()">Backup Data</button>
            <button class="btn" onclick="clearCache()">Clear Cache</button>
            <button class="btn" onclick="optimizeDatabase()">Optimize Database</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Set current values after DOM is updated
  setTimeout(() => {
    const themeSelect = document.getElementById('themeSelect');
    const languageSelect = document.getElementById('languageSelect');
    
    if (themeSelect) {
      themeSelect.value = localStorage.getItem('theme') || 'dark';
    }
    
    if (languageSelect) {
      languageSelect.value = localStorage.getItem('language') || 'english';
    }
  }, 100);
}

// ======== REPORTS SECTION BUTTONS (4 buttons) ========

function viewPendingReports() {
  const pendingReports = reports.filter(r => r.status === 'Pending');
  const reportDetails = $('#reportDetails');
  const reportTitle = $('#reportTitle');
  const reportContent = $('#reportContent');
  
  reportTitle.textContent = `Pending Reports (${pendingReports.length})`;
  reportContent.innerHTML = `
    <div style="display: grid; gap: 10px; max-height: 300px; overflow-y: auto;">
      ${pendingReports.map(r => `
        <div style="padding: 10px; background: rgba(255,255,255,0.04); border-radius: 8px; text-align: left;">
          <strong>#${r.id} - ${r.location}</strong><br>
          <small>User: ${r.user} | Region: ${r.region} | Date: ${r.date}</small>
        </div>
      `).join('')}
    </div>
  `;
  reportDetails.style.display = 'block';
  showNotification(`Displaying ${pendingReports.length} pending reports`, 'info');
}

function viewVerifiedReports() {
  const verifiedReports = reports.filter(r => r.status === 'Verified');
  const reportDetails = $('#reportDetails');
  const reportTitle = $('#reportTitle');
  const reportContent = $('#reportContent');
  
  reportTitle.textContent = `Verified Reports (${verifiedReports.length})`;
  reportContent.innerHTML = `
    <div style="display: grid; gap: 10px; max-height: 300px; overflow-y: auto;">
      ${verifiedReports.map(r => `
        <div style="padding: 10px; background: rgba(57,255,20,0.1); border-radius: 8px; text-align: left;">
          <strong>#${r.id} - ${r.location}</strong><br>
          <small>User: ${r.user} | Region: ${r.region} | Date: ${r.date}</small>
        </div>
      `).join('')}
    </div>
  `;
  reportDetails.style.display = 'block';
  showNotification(`Displaying ${verifiedReports.length} verified reports`, 'success');
}

function viewUrgentReports() {
  const urgentReports = reports.filter(r => r.status === 'Urgent');
  const reportDetails = $('#reportDetails');
  const reportTitle = $('#reportTitle');
  const reportContent = $('#reportContent');
  
  reportTitle.textContent = `Urgent Reports (${urgentReports.length})`;
  reportContent.innerHTML = `
    <div style="display: grid; gap: 10px; max-height: 300px; overflow-y: auto;">
      ${urgentReports.map(r => `
        <div style="padding: 10px; background: rgba(255,156,0,0.1); border-radius: 8px; text-align: left;">
          <strong>#${r.id} - ${r.location}</strong><br>
          <small>User: ${r.user} | Region: ${r.region} | Date: ${r.date}</small>
        </div>
      `).join('')}
    </div>
  `;
  reportDetails.style.display = 'block';
  showNotification(`Displaying ${urgentReports.length} urgent reports`, 'warning');
}

function generateSummaryReport() {
  const reportDetails = $('#reportDetails');
  const reportTitle = $('#reportTitle');
  const reportContent = $('#reportContent');
  
  const totalReports = reports.length;
  const pendingCount = reports.filter(r => r.status === 'Pending').length;
  const verifiedCount = reports.filter(r => r.status === 'Verified').length;
  const urgentCount = reports.filter(r => r.status === 'Urgent').length;
  
  const regionStats = {};
  reports.forEach(r => {
    regionStats[r.region] = (regionStats[r.region] || 0) + 1;
  });
  
  reportTitle.textContent = 'Summary Report';
  reportContent.innerHTML = `
    <div style="text-align: left;">
      <h4>Overall Statistics</h4>
      <p><strong>Total Reports:</strong> ${totalReports}</p>
      <p><strong>Pending:</strong> ${pendingCount} (${Math.round(pendingCount/totalReports*100)}%)</p>
      <p><strong>Verified:</strong> ${verifiedCount} (${Math.round(verifiedCount/totalReports*100)}%)</p>
      <p><strong>Urgent:</strong> ${urgentCount} (${Math.round(urgentCount/totalReports*100)}%)</p>
      
      <h4>Reports by Region</h4>
      ${Object.entries(regionStats).map(([region, count]) => 
        `<p><strong>${region}:</strong> ${count} reports</p>`
      ).join('')}
    </div>
  `;
  reportDetails.style.display = 'block';
  showNotification('Summary report generated successfully!', 'success');
}

// ======== ANALYTICS SECTION BUTTONS (4 buttons) ========

function showTrendAnalysis() {
  const analyticsDisplay = $('#analyticsDisplay');
  const analyticsTitle = $('#analyticsTitle');
  const analyticsContent = $('#analyticsContent');
  
  // Calculate trends
  const dateStats = {};
  reports.forEach(r => {
    const date = r.date;
    if (!dateStats[date]) dateStats[date] = { total: 0, verified: 0, urgent: 0 };
    dateStats[date].total++;
    if (r.status === 'Verified') dateStats[date].verified++;
    if (r.status === 'Urgent') dateStats[date].urgent++;
  });
  
  analyticsTitle.textContent = 'Trend Analysis Report';
  analyticsContent.innerHTML = `
    <div style="text-align: left;">
      <h4>Reporting Trends Over Time</h4>
      <div style="max-height: 250px; overflow-y: auto;">
        ${Object.entries(dateStats).sort().map(([date, stats]) => `
          <div style="padding: 8px; margin: 5px 0; background: rgba(0,229,255,0.1); border-radius: 6px;">
            <strong>${date}</strong><br>
            Total: ${stats.total} | Verified: ${stats.verified} | Urgent: ${stats.urgent}
          </div>
        `).join('')}
      </div>
    </div>
  `;
  analyticsDisplay.style.display = 'block';
  showNotification('Trend analysis completed', 'success');
}

function showRegionalStats() {
  const analyticsDisplay = $('#analyticsDisplay');
  const analyticsTitle = $('#analyticsTitle');
  const analyticsContent = $('#analyticsContent');
  
  const regionStats = {};
  reports.forEach(r => {
    if (!regionStats[r.region]) {
      regionStats[r.region] = { total: 0, verified: 0, pending: 0, urgent: 0 };
    }
    regionStats[r.region].total++;
    regionStats[r.region][r.status.toLowerCase()]++;
  });
  
  analyticsTitle.textContent = 'Regional Statistics';
  analyticsContent.innerHTML = `
    <div style="text-align: left;">
      <h4>Reports Distribution by Region</h4>
      <div style="max-height: 250px; overflow-y: auto;">
        ${Object.entries(regionStats).map(([region, stats]) => `
          <div style="padding: 10px; margin: 5px 0; background: rgba(57,255,20,0.1); border-radius: 6px;">
            <strong>${region}</strong><br>
            <small>Total: ${stats.total} | Verified: ${stats.verified || 0} | Pending: ${stats.pending || 0} | Urgent: ${stats.urgent || 0}</small>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  analyticsDisplay.style.display = 'block';
  showNotification('Regional statistics generated', 'success');
}

function showPerformanceMetrics() {
  const analyticsDisplay = $('#analyticsDisplay');
  const analyticsTitle = $('#analyticsTitle');
  const analyticsContent = $('#analyticsContent');
  
  const totalReports = reports.length;
  const verificationRate = Math.round((reports.filter(r => r.status === 'Verified').length / totalReports) * 100);
  const avgVolunteers = Math.round(reports.reduce((sum, r) => sum + r.volunteers, 0) / totalReports);
  const topRegion = Object.entries(reports.reduce((acc, r) => {
    acc[r.region] = (acc[r.region] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1])[0];
  
  analyticsTitle.textContent = 'Performance Metrics';
  analyticsContent.innerHTML = `
    <div style="text-align: left;">
      <h4>Key Performance Indicators</h4>
      <div style="display: grid; gap: 15px;">
        <div style="padding: 15px; background: rgba(57,255,20,0.1); border-radius: 8px;">
          <strong>Verification Rate: ${verificationRate}%</strong><br>
          <small>Percentage of reports verified</small>
        </div>
        <div style="padding: 15px; background: rgba(0,229,255,0.1); border-radius: 8px;">
          <strong>Average Volunteers per Report: ${avgVolunteers}</strong><br>
          <small>Community engagement level</small>
        </div>
        <div style="padding: 15px; background: rgba(255,156,0,0.1); border-radius: 8px;">
          <strong>Most Active Region: ${topRegion[0]}</strong><br>
          <small>${topRegion[1]} reports submitted</small>
        </div>
      </div>
    </div>
  `;
  analyticsDisplay.style.display = 'block';
  showNotification('Performance metrics calculated', 'success');
}

function showPredictiveAnalysis() {
  const analyticsDisplay = $('#analyticsDisplay');
  const analyticsTitle = $('#analyticsTitle');
  const analyticsContent = $('#analyticsContent');
  
  // Mock predictive analysis based on current trends
  const recentReports = reports.filter(r => new Date(r.date) > new Date('2025-08-15'));
  const trendGrowth = Math.round((recentReports.length / reports.length) * 100);
  
  analyticsTitle.textContent = 'Predictive Analysis';
  analyticsContent.innerHTML = `
    <div style="text-align: left;">
      <h4>Forecast & Predictions</h4>
      <div style="display: grid; gap: 15px;">
        <div style="padding: 15px; background: rgba(0,229,255,0.1); border-radius: 8px;">
          <strong>Reporting Trend: ${trendGrowth > 30 ? 'Increasing' : 'Stable'}</strong><br>
          <small>${trendGrowth}% of reports in recent period</small>
        </div>
        <div style="padding: 15px; background: rgba(57,255,20,0.1); border-radius: 8px;">
          <strong>Expected Next Month: ~${Math.round(reports.length * 1.2)} reports</strong><br>
          <small>Based on current growth patterns</small>
        </div>
        <div style="padding: 15px; background: rgba(255,156,0,0.1); border-radius: 8px;">
          <strong>High-Risk Regions:</strong> ${reports.filter(r => r.status === 'Urgent').map(r => r.region).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', ')}<br>
          <small>Regions with urgent reports requiring attention</small>
        </div>
      </div>
    </div>
  `;
  analyticsDisplay.style.display = 'block';
  showNotification('Predictive analysis generated', 'success');
}

// ======== COMMUNITY SECTION BUTTONS (4 buttons) ========

function inviteVolunteers() {
  const communityDisplay = $('#communityDisplay');
  const communityTitle = $('#communityTitle');
  const communityContent = $('#communityContent');
  
  communityTitle.textContent = 'Invite Volunteers';
  communityContent.innerHTML = `
    <div style="text-align: left;">
      <h4>Volunteer Invitation System</h4>
      <div style="padding: 15px; background: rgba(0,229,255,0.1); border-radius: 8px; margin-bottom: 15px;">
        <label>Email Address:</label><br>
        <input type="email" placeholder="volunteer@example.com" style="width: 100%; padding: 8px; margin: 5px 0; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); color: var(--color-text);">
      </div>
      <div style="padding: 15px; background: rgba(57,255,20,0.1); border-radius: 8px; margin-bottom: 15px;">
        <label>Invitation Message:</label><br>
        <textarea placeholder="Join our environmental monitoring community..." style="width: 100%; height: 80px; padding: 8px; margin: 5px 0; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); color: var(--color-text);"></textarea>
      </div>
      <button class="btn" onclick="sendVolunteerInvitation()">Send Invitation</button>
    </div>
  `;
  communityDisplay.style.display = 'block';
  showNotification('Volunteer invitation form loaded', 'info');
}

function sendCommunityNotifications() {
  const communityDisplay = $('#communityDisplay');
  const communityTitle = $('#communityTitle');
  const communityContent = $('#communityContent');
  
  const uniqueUsers = [...new Set(reports.map(r => r.user))];
  
  communityTitle.textContent = 'Send Community Notifications';
  communityContent.innerHTML = `
    <div style="text-align: left;">
      <h4>Broadcast to Community (${uniqueUsers.length} members)</h4>
      <div style="padding: 15px; background: rgba(255,156,0,0.1); border-radius: 8px; margin-bottom: 15px;">
        <label>Notification Type:</label><br>
        <select style="width: 100%; padding: 8px; margin: 5px 0; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); color: var(--color-text);">
          <option>General Announcement</option>
          <option>Urgent Alert</option>
          <option>Achievement Recognition</option>
          <option>Activity Reminder</option>
        </select>
      </div>
      <div style="padding: 15px; background: rgba(0,229,255,0.1); border-radius: 8px; margin-bottom: 15px;">
        <label>Message:</label><br>
        <textarea placeholder="Your message to the community..." style="width: 100%; height: 80px; padding: 8px; margin: 5px 0; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); color: var(--color-text);"></textarea>
      </div>
      <button class="btn" onclick="broadcastNotification()">Send to All Members</button>
    </div>
  `;
  communityDisplay.style.display = 'block';
  showNotification('Community notification system loaded', 'info');
}

function viewAllVolunteers() {
  const communityDisplay = $('#communityDisplay');
  const communityTitle = $('#communityTitle');
  const communityContent = $('#communityContent');
  
  const volunteerStats = {};
  reports.forEach(r => {
    if (!volunteerStats[r.user]) {
      volunteerStats[r.user] = { reports: 0, verified: 0, regions: new Set() };
    }
    volunteerStats[r.user].reports++;
    if (r.status === 'Verified') volunteerStats[r.user].verified++;
    volunteerStats[r.user].regions.add(r.region);
  });
  
  communityTitle.textContent = `All Volunteers (${Object.keys(volunteerStats).length})`;
  communityContent.innerHTML = `
    <div style="text-align: left; max-height: 300px; overflow-y: auto;">
      ${Object.entries(volunteerStats).map(([user, stats]) => `
        <div style="padding: 12px; margin: 8px 0; background: rgba(57,255,20,0.1); border-radius: 8px;">
          <strong>${user}</strong><br>
          <small>Reports: ${stats.reports} | Verified: ${stats.verified} | Active in: ${Array.from(stats.regions).join(', ')}</small>
        </div>
      `).join('')}
    </div>
  `;
  communityDisplay.style.display = 'block';
  showNotification(`Displaying ${Object.keys(volunteerStats).length} volunteer profiles`, 'success');
}

function createCommunityActivity() {
  const communityDisplay = $('#communityDisplay');
  const communityTitle = $('#communityTitle');
  const communityContent = $('#communityContent');
  
  communityTitle.textContent = 'Create Community Activity';
  communityContent.innerHTML = `
    <div style="text-align: left;">
      <h4>New Environmental Activity</h4>
      <div style="display: grid; gap: 15px;">
        <div style="padding: 12px; background: rgba(57,255,20,0.1); border-radius: 8px;">
          <label>Activity Title:</label><br>
          <input type="text" placeholder="Beach Cleanup Drive" style="width: 100%; padding: 8px; margin: 5px 0; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); color: var(--color-text);">
        </div>
        <div style="padding: 12px; background: rgba(0,229,255,0.1); border-radius: 8px;">
          <label>Location:</label><br>
          <input type="text" placeholder="Manila Bay Area" style="width: 100%; padding: 8px; margin: 5px 0; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); color: var(--color-text);">
        </div>
        <div style="padding: 12px; background: rgba(255,156,0,0.1); border-radius: 8px;">
          <label>Date & Time:</label><br>
          <input type="datetime-local" style="width: 100%; padding: 8px; margin: 5px 0; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); color: var(--color-text);">
        </div>
        <div style="padding: 12px; background: rgba(255,255,255,0.06); border-radius: 8px;">
          <label>Description:</label><br>
          <textarea placeholder="Activity description and requirements..." style="width: 100%; height: 60px; padding: 8px; margin: 5px 0; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); color: var(--color-text);"></textarea>
        </div>
      </div>
      <button class="btn" onclick="publishActivity()" style="margin-top: 15px;">Create & Publish Activity</button>
    </div>
  `;
  communityDisplay.style.display = 'block';
  showNotification('Activity creation form loaded', 'info');
}

// Helper functions for community actions
function sendVolunteerInvitation() {
  showNotification('Volunteer invitation sent successfully!', 'success');
}

function broadcastNotification() {
  showNotification('Notification sent to all community members!', 'success');
}

function publishActivity() {
  showNotification('Community activity created and published!', 'success');
}

// ======== EXISTING BUTTON FUNCTIONS ========

function refreshData() {
  showNotification('Data refreshed successfully!', 'success');
  applyFilters();
}

function exportMapData() {
  const data = filtered.map(r => ({
    id: r.id,
    location: r.location,
    region: r.region,
    status: r.status,
    coordinates: `${r.lat}, ${r.lng}`
  }));
  downloadCSV(data, 'map_data.csv');
  showNotification('Map data exported successfully!', 'success');
}

function exportTableData() {
  downloadCSV(filtered, 'reports_data.csv');
  showNotification('Table data exported successfully!', 'success');
}

function exportAnalytics() {
  const analyticsData = {
    totalReports: reports.length,
    verifiedReports: reports.filter(r => r.status === 'Verified').length,
    pendingReports: reports.filter(r => r.status === 'Pending').length,
    urgentReports: reports.filter(r => r.status === 'Urgent').length,
    regionBreakdown: {}
  };
  
  reports.forEach(r => {
    analyticsData.regionBreakdown[r.region] = (analyticsData.regionBreakdown[r.region] || 0) + 1;
  });
  
  downloadJSON(analyticsData, 'analytics_data.json');
  showNotification('Analytics exported successfully!', 'success');
}

function exportCommunityData() {
  const communityData = [...new Set(reports.map(r => r.user))].map(user => {
    const userReports = reports.filter(r => r.user === user);
    return {
      user,
      totalReports: userReports.length,
      verifiedReports: userReports.filter(r => r.status === 'Verified').length,
      regions: [...new Set(userReports.map(r => r.region))]
    };
  });
  
  downloadJSON(communityData, 'community_data.json');
  showNotification('Community data exported successfully!', 'success');
}

function refreshCommunityData() {
  showNotification('Community data refreshed!', 'success');
}

function refreshAnalytics() {
  showNotification('Analytics refreshed!', 'success');
}

function bulkApprove() {
  const selectedRows = $$('input[type="checkbox"]:checked:not(#selectAll)');
  if (selectedRows.length === 0) {
    showNotification('Please select reports to approve', 'warning');
    return;
  }
  
  selectedRows.forEach(checkbox => {
    const id = parseInt(checkbox.value);
    updateStatus(id, 'Verified');
  });
  
  showNotification(`${selectedRows.length} reports approved successfully!`, 'success');
}

function toggleSelectAll() {
  const selectAll = $('#selectAll');
  const checkboxes = $$('tbody input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = selectAll.checked);
}

function createNewReport() { showNotification('New report form would open here', 'info'); }
function importReports() { showNotification('Import dialog would open here', 'info'); }
function saveSettings() { showNotification('Settings saved successfully!', 'success'); }
function resetSettings() { showNotification('Settings reset to default', 'warning'); }
function backupData() { showNotification('Data backup initiated', 'success'); }
function clearCache() { showNotification('Cache cleared successfully', 'success'); }
function optimizeDatabase() { showNotification('Database optimization completed', 'success'); }

// Utility Functions
function downloadCSV(data, filename) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
  ].join('\n');
  
  downloadFile(csvContent, filename, 'text/csv');
}

function downloadJSON(data, filename) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#39ff14' : type === 'warning' ? '#ff9500' : '#00e5ff'};
    color: #0b1020;
    border-radius: 12px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
    z-index: 1000;
    font-weight: 600;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.style.transform = 'translateX(0)', 100);
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

// Map
function initMap() {
  if (!$('#map')) return;
  
  map = L.map('map', { scrollWheelZoom: true });
  const base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 2,
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  });
  base.addTo(map);
  map.setView([14.5, 121.0], 3);
  markersLayer = L.layerGroup().addTo(map);
  $('#map').classList.remove('skeleton');
}

function statusColor(status) {
  if (status === 'Verified') return '#39ff14';
  if (status === 'Urgent') return '#00e5ff';
  return 'rgba(226,232,240,0.85)';
}

function updateMap() {
  if (!markersLayer) return;
  
  markersLayer.clearLayers();
  filtered.forEach(r => {
    const marker = L.circleMarker([r.lat, r.lng], {
      radius: 7,
      color: statusColor(r.status),
      fillColor: statusColor(r.status),
      fillOpacity: 0.85,
      weight: 2
    });
    const popupHtml = `
      <div style="min-width:220px">
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
          <img src="${r.img}" alt="Report ${r.id} image" style="width:70px;height:48px;border-radius:8px;border:1px solid rgba(255,255,255,0.12)" />
          <div>
            <div style="font-weight:700">#${r.id} • ${r.location}</div>
            <div style="opacity:.8;font-size:12px">${r.region}</div>
            <div style="margin-top:4px;font-size:12px;display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;padding:2px 8px;background:rgba(255,255,255,0.04)">${r.status}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button data-id="${r.id}" class="popup-verify" style="padding:6px 8px;border-radius:8px;border:1px solid rgba(0,229,255,0.35);background:rgba(0,229,255,0.08);color:#e2e8f0;cursor:pointer">Verify</button>
          <button data-id="${r.id}" class="popup-reject" style="padding:6px 8px;border-radius:8px;border:1px solid rgba(0,229,255,0.35);background:rgba(0,229,255,0.08);color:#e2e8f0;cursor:pointer">Reject</button>
        </div>
      </div>
    `;
    marker.bindPopup(popupHtml);
    marker.addTo(markersLayer);
  });
}

// Table
function renderTable() {
  const tbody = $('#tableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  filtered.sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    let va = a[sortBy], vb = b[sortBy];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return -1 * mul;
    if (va > vb) return 1 * mul;
    return 0;
  });

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  currentPage = Math.min(currentPage, pages);
  const start = (currentPage - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);

  slice.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" value="${r.id}"></td>
      <td>#${r.id}</td>
      <td>${r.user}</td>
      <td><img src="${r.img}" alt="Report ${r.id} image" width="64" height="44" style="border-radius:8px;border:1px solid rgba(255,255,255,0.12)" /></td>
      <td>${r.location}<div style="opacity:.7;font-size:12px">${r.region}</div></td>
      <td><span class="status">${r.status}</span></td>
      <td>
        <div class="actions-row">
          <button class="btn-xs" data-act="verify" data-id="${r.id}"><svg class="icon"><use href="#i-check"></use></svg>Verify</button>
          <button class="btn-xs" data-act="reject" data-id="${r.id}"><svg class="icon"><use href="#i-x"></use></svg>Reject</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const pageInfo = $('#pageInfo');
  const resultCount = $('#resultCount');
  const prevPage = $('#prevPage');
  const nextPage = $('#nextPage');
  
  if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${Math.max(1, Math.ceil(total / pageSize))}`;
  if (resultCount) resultCount.textContent = `${total} results`;
  if (prevPage) prevPage.disabled = currentPage <= 1;
  if (nextPage) nextPage.disabled = currentPage >= Math.ceil(total / pageSize);
}

function attachTableEvents() {
  $$('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort');
      if (sortBy === key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortBy = key; sortDir = 'asc';
      }
      renderTable();
    });
  });

  const prevBtn = $('#prevPage');
  const nextBtn = $('#nextPage');
  const pageSizeSelect = $('#pageSize');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) { currentPage--; renderTable(); }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const pages = Math.ceil(filtered.length / pageSize);
      if (currentPage < pages) { currentPage++; renderTable(); }
    });
  }
  
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
      pageSize = parseInt(e.target.value, 10); currentPage = 1; renderTable();
    });
  }

  const tableBody = $('#tableBody');
  if (tableBody) {
    tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const id = Number(btn.getAttribute('data-id'));
      if (btn.getAttribute('data-act') === 'verify') updateStatus(id, 'Verified');
      if (btn.getAttribute('data-act') === 'reject') updateStatus(id, 'Pending');
    });
  }
}

// Filters/Search
function applyFilters() {
  const searchInput = $('#searchInput');
  const statusFilter = $('#statusFilter');
  const regionFilter = $('#regionFilter');
  
  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const s = statusFilter ? statusFilter.value : 'ALL';
  const reg = regionFilter ? regionFilter.value : 'ALL';

  filtered = reports.filter(r => {
    const matchesText = !q || [r.user, r.location, r.region].some(v => v.toLowerCase().includes(q));
    const matchesStatus = (s === 'ALL') || (r.status === s);
    const matchesRegion = (reg === 'ALL') || (r.region === reg);
    return matchesText && matchesStatus && matchesRegion;
  });

  currentPage = 1;
  renderStats();
  renderTable();
  updateMap();
  updateCharts();
}

// Stats
function renderStats() {
  const total = filtered.length;
  const verified = filtered.filter(r => r.status === 'Verified').length;
  const urgent = filtered.filter(r => r.status === 'Urgent').length;
  const volunteers = new Set(filtered.map(r => r.user)).size + Math.floor(total / 4);

  const statTotal = $('#stat-total');
  const statVerified = $('#stat-verified');
  const statUrgent = $('#stat-urgent');
  const statVolunteers = $('#stat-volunteers');
  
  if (statTotal) statTotal.textContent = total;
  if (statVerified) statVerified.textContent = verified;
  if (statUrgent) statUrgent.textContent = urgent;
  if (statVolunteers) statVolunteers.textContent = volunteers;

  const statTotalChange = $('#stat-total-change');
  const statVerifiedChange = $('#stat-verified-change');
  const statUrgentChange = $('#stat-urgent-change');
  const statVolunteersChange = $('#stat-volunteers-change');
  
  if (statTotalChange) statTotalChange.textContent = '+' + Math.max(0, Math.round((total / (reports.length || 1)) * 10)) + '%';
  if (statVerifiedChange) statVerifiedChange.textContent = '+' + Math.max(0, Math.round((verified / (reports.length || 1)) * 10)) + '%';
  if (statUrgentChange) statUrgentChange.textContent = urgent + ' new';
  if (statVolunteersChange) statVolunteersChange.textContent = 'today';
}

// Charts
function ensureCharts() {
  const c1 = document.getElementById('barRegion');
  const c2 = document.getElementById('lineTime');
  const c3 = document.getElementById('pieStatus');
  
  if (!c1 || !c2 || !c3) return;

  const common = {
    animation: { duration: 600 },
    plugins: { legend: { labels: { color: '#e2e8f0' } } },
    scales: {
      x: { ticks: { color: '#e2e8f0' }, grid: { color: 'rgba(226,232,240,0.08)' } },
      y: { ticks: { color: '#e2e8f0' }, grid: { color: 'rgba(226,232,240,0.08)' } },
    }
  };

  if (barChart) barChart.destroy();
  if (lineChart) lineChart.destroy();
  if (pieChart) pieChart.destroy();

  barChart = new Chart(c1, { type: 'bar', data: { labels: [], datasets: [] }, options: common });
  lineChart = new Chart(c2, { type: 'line', data: { labels: [], datasets: [] }, options: common });
  pieChart = new Chart(c3, { type: 'pie', data: { labels: [], datasets: [] }, options: { animation: { duration: 600 }, plugins: { legend: { labels: { color: '#e2e8f0' } } } } });
}

function updateCharts() {
  if (!barChart || !lineChart || !pieChart) return;

  const byRegion = {};
  filtered.forEach(r => { byRegion[r.region] = (byRegion[r.region] || 0) + 1; });
  const regions = Object.keys(byRegion);
  const regionCounts = regions.map(k => byRegion[k]);

  barChart.data.labels = regions;
  barChart.data.datasets = [{
    label: 'Reports',
    data: regionCounts,
    backgroundColor: 'rgba(0,229,255,0.35)',
    borderColor: '#00e5ff',
    borderWidth: 1.5
  }];
  barChart.update();

  const byDate = {};
  filtered.forEach(r => { byDate[r.date] = (byDate[r.date] || 0) + 1; });
  const dates = Object.keys(byDate).sort();
  const dateCounts = dates.map(d => byDate[d]);

  lineChart.data.labels = dates;
  lineChart.data.datasets = [{
    label: 'Reports',
    data: dateCounts,
    tension: 0.35,
    fill: true,
    backgroundColor: 'rgba(57,255,20,0.18)',
    borderColor: '#39ff14',
    pointRadius: 3,
    pointBackgroundColor: '#39ff14'
  }];
  lineChart.update();

  const verified = filtered.filter(r => r.status === 'Verified').length;
  const pending = filtered.filter(r => r.status === 'Pending').length;
  const urgent = filtered.filter(r => r.status === 'Urgent').length;

  pieChart.data.labels = ['Verified', 'Pending', 'Urgent'];
  pieChart.data.datasets = [{
    data: [verified, pending, urgent],
    backgroundColor: ['#39ff14', 'rgba(226,232,240,0.85)', '#00e5ff'],
    borderColor: ['#39ff14', 'rgba(226,232,240,0.85)', '#00e5ff'],
    borderWidth: 1
  }];
  pieChart.update();
}

// Actions
function updateStatus(id, newStatus) {
  const r = reports.find(x => x.id === id);
  if (!r) return;
  r.status = newStatus;
  applyFilters();
  showNotification(`Report #${id} status updated to ${newStatus}`, 'success');
}

// Populate Region filter
function populateRegions() {
  const regionFilter = $('#regionFilter');
  if (!regionFilter) return;
  
  const regions = Array.from(new Set(reports.map(r => r.region))).sort();
  regionFilter.innerHTML = '<option value="ALL">All regions</option>' + regions.map(r => `<option>${r}</option>`).join('');
}

// Event bindings
function bindEvents() {
  $('#toggleSidebar').addEventListener('click', () => {
    const sidebar = $('#sidebar');
    const isSmall = window.matchMedia('(max-width: 800px)').matches;
    if (isSmall) {
      sidebar.classList.toggle('open');
      const expanded = sidebar.classList.contains('open');
      $('#toggleSidebar').setAttribute('aria-expanded', expanded ? 'true' : 'false');
    } else {
      sidebar.classList.toggle('collapsed');
      const expanded = !sidebar.classList.contains('collapsed');
      $('#toggleSidebar').setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
  });

  $('#notifBtn').addEventListener('click', () => {
    $('#notifDot')?.remove();
    showNotification('All notifications cleared', 'info');
  });

  $$('.menu a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewName = e.currentTarget.getAttribute('data-view') || 'dashboard';
      showView(viewName);
    });
  });

  const searchInput = $('#searchInput');
  const statusFilter = $('#statusFilter');
  const regionFilter = $('#regionFilter');
  
  if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 150));
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (regionFilter) regionFilter.addEventListener('change', applyFilters);

  if (map) {
    map.on('popupopen', (e) => {
      const node = e.popup.getElement();
      node.querySelector('.popup-verify')?.addEventListener('click', (ev) => {
        const id = Number(ev.target.closest('button').getAttribute('data-id'));
        updateStatus(id, 'Verified');
        map.closePopup();
      });
      node.querySelector('.popup-reject')?.addEventListener('click', (ev) => {
        const id = Number(ev.target.closest('button').getAttribute('data-id'));
        updateStatus(id, 'Pending');
        map.closePopup();
      });
    });
  }
}

function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), ms); };
}

// Init
window.addEventListener('DOMContentLoaded', async () => {
  reports = mockFetchReports();
  filtered = reports.slice();
  
  showDashboard();
  bindEvents();

  document.getElementById('appRoot').removeAttribute('aria-busy');
  showNotification('MangroveWatch Admin Dashboard loaded successfully!', 'success');
});
// Language translations
const translations = {
  english: {
    dashboard: 'Dashboard',
    reports: 'Reports',
    analytics: 'Analytics',
    community: 'Community',
    settings: 'Settings',
    totalReports: 'Total Reports',
    verifiedCases: 'Verified Cases',
    urgentAlerts: 'Urgent Alerts',
    volunteersActive: 'Volunteers Active'
  },
  spanish: {
    dashboard: 'Tablero',
    reports: 'Reportes',
    analytics: 'Análisis',
    community: 'Comunidad',
    settings: 'Configuración',
    totalReports: 'Reportes Totales',
    verifiedCases: 'Casos Verificados',
    urgentAlerts: 'Alertas Urgentes',
    volunteersActive: 'Voluntarios Activos'
  },
  french: {
    dashboard: 'Tableau de Bord',
    reports: 'Rapports',
    analytics: 'Analytique',
    community: 'Communauté',
    settings: 'Paramètres',
    totalReports: 'Rapports Totaux',
    verifiedCases: 'Cas Vérifiés',
    urgentAlerts: 'Alertes Urgentes',
    volunteersActive: 'Bénévoles Actifs'
  }
};

// Theme switching function
function handleThemeChange() {
  const themeSelect = document.getElementById('themeSelect');
  if (!themeSelect) return;
  
  const selectedTheme = themeSelect.value;
  
  if (selectedTheme === 'light') {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  } else {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  }
  
  localStorage.setItem('theme', selectedTheme);
  showNotification('Theme changed to ' + selectedTheme + ' mode', 'success');
}

// Language switching function
function handleLanguageChange() {
  const languageSelect = document.getElementById('languageSelect');
  if (!languageSelect) return;
  
  const selectedLanguage = languageSelect.value;
  currentLanguage = selectedLanguage;
  
  // Update menu items
  const menuLabels = document.querySelectorAll('.menu a .label');
  if (menuLabels.length >= 5) {
    menuLabels[0].textContent = translations[selectedLanguage].dashboard;
    menuLabels[1].textContent = translations[selectedLanguage].reports;
    menuLabels[2].textContent = translations[selectedLanguage].analytics;
    menuLabels[3].textContent = translations[selectedLanguage].community;
    menuLabels[4].textContent = translations[selectedLanguage].settings;
  }
  
  // Update dashboard cards if currently on dashboard
  if (currentView === 'dashboard') {
    const cardTitles = document.querySelectorAll('.cards .card .head span:first-child');
    if (cardTitles.length >= 4) {
      cardTitles[0].textContent = translations[selectedLanguage].totalReports;
      cardTitles[1].textContent = translations[selectedLanguage].verifiedCases;
      cardTitles[2].textContent = translations[selectedLanguage].urgentAlerts;
      cardTitles[3].textContent = translations[selectedLanguage].volunteersActive;
    }
  }
  
  localStorage.setItem('language', selectedLanguage);
  showNotification('Language changed to ' + selectedLanguage, 'success');
}

// Profile menu function
function showProfileMenu() {
  // Remove existing menu if any
  const existingMenu = document.getElementById('profileMenu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  // Create new profile menu
  const profileMenu = document.createElement('div');
  profileMenu.id = 'profileMenu';
  profileMenu.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    background: var(--color-panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 0;
    box-shadow: var(--shadow-2);
    backdrop-filter: blur(12px) saturate(140%);
    z-index: 1000;
    min-width: 200px;
    animation: slideIn 0.2s ease;
  `;
  
  profileMenu.innerHTML = `
    <div style="padding: 15px 20px; border-bottom: 1px solid var(--border);">
      <div style="font-weight: 600; color: var(--color-text);">Admin Profile</div>
      <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">admin@mangrovewatch.com</div>
    </div>
    <div style="padding: 10px 0;">
      <button onclick="editProfile()" style="width: 100%; text-align: left; padding: 10px 20px; background: none; border: none; color: var(--color-text); cursor: pointer; transition: background 0.2s;">
        <svg class="icon" style="width: 16px; height: 16px; margin-right: 10px;"><use href="#i-gear"></use></svg>
        Edit Profile
      </button>
      <button onclick="viewActivity()" style="width: 100%; text-align: left; padding: 10px 20px; background: none; border: none; color: var(--color-text); cursor: pointer; transition: background 0.2s;">
        <svg class="icon" style="width: 16px; height: 16px; margin-right: 10px;"><use href="#i-chart"></use></svg>
        View Activity
      </button>
      <button onclick="changePassword()" style="width: 100%; text-align: left; padding: 10px 20px; background: none; border: none; color: var(--color-text); cursor: pointer; transition: background 0.2s;">
        <svg class="icon" style="width: 16px; height: 16px; margin-right: 10px;"><use href="#i-alert"></use></svg>
        Change Password
      </button>
      <hr style="border: none; border-top: 1px solid var(--border); margin: 10px 0;">
      <button onclick="logout()" style="width: 100%; text-align: left; padding: 10px 20px; background: none; border: none; color: #ff4444; cursor: pointer; transition: background 0.2s;">
        <svg class="icon" style="width: 16px; height: 16px; margin-right: 10px;"><use href="#i-x"></use></svg>
        Logout
      </button>
    </div>
  `;
  
  document.body.appendChild(profileMenu);
  
  // Add hover effects
  profileMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'var(--glass)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'none';
    });
  });
  
  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!profileMenu.contains(e.target) && !e.target.closest('.avatar')) {
        profileMenu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);
}

// Profile menu action functions
function editProfile() {
  document.getElementById('profileMenu')?.remove();
  showNotification('Profile editor would open here', 'info');
}

function viewActivity() {
  document.getElementById('profileMenu')?.remove();
  showNotification('Activity log would be displayed here', 'info');
}

function changePassword() {
  document.getElementById('profileMenu')?.remove();
  showNotification('Password change form would open here', 'info');
}

function logout() {
  document.getElementById('profileMenu')?.remove();
  showNotification('Logging out...', 'warning');
  setTimeout(() => {
    showNotification('Logged out successfully', 'success');
  }, 1000);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Set up profile button click
  const avatar = document.querySelector('.avatar');
  if (avatar) {
    avatar.addEventListener('click', showProfileMenu);
    avatar.style.cursor = 'pointer'; // Make it clear it's clickable
  }
  
  // Restore saved preferences
  const savedTheme = localStorage.getItem('theme') || 'dark';
  const savedLanguage = localStorage.getItem('language') || 'english';
  
  // Apply saved theme
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  } else {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  }
  
  // Set saved language
  currentLanguage = savedLanguage;
  
  // Set dropdown values when settings are loaded
  setTimeout(() => {
    const themeSelect = document.getElementById('themeSelect');
    const languageSelect = document.getElementById('languageSelect');
    
    if (themeSelect) {
      themeSelect.value = savedTheme;
    }
    
    if (languageSelect) {
      languageSelect.value = savedLanguage;
    }
  }, 500);
});
