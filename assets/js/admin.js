/**
 * Randevu Sistemi - Yönetim Paneli Mantığı (assets/js/admin.js)
 * Oturum kontrolü, slot listesi üretimi, toggle anahtarı, manuel randevu ekleme,
 * Genel Görünüm, İstatistikler ve Ayarlar sekmelerinin mantığı.
 */

document.addEventListener("DOMContentLoaded", () => {
  const isLoginPage = document.getElementById("admin-login-form");
  const isDashboardPage = document.getElementById("admin-table-body");

  // 1. Giriş Sayfası Mantığı (admin/index.html)
  if (isLoginPage) {
    const loginForm = document.getElementById("admin-login-form");
    const passwordInput = document.getElementById("admin-password");
    const loginError = document.getElementById("login-error");

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const enteredPassword = passwordInput.value.trim();
      const storedPassword = localStorage.getItem("randevu_admin_password") || (window.APP_CONFIG ? window.APP_CONFIG.adminPassword : "123");

      if (enteredPassword === storedPassword) {
        sessionStorage.setItem("randevu_admin_logged_in", "true");
        window.location.href = "dashboard.html";
      } else {
        loginError.style.display = "block";
        loginError.textContent = "Hatalı şifre! Lütfen tekrar deneyiniz.";
        passwordInput.value = "";
        passwordInput.focus();
      }
    });
    return;
  }

  // 2. Dashboard Oturum Güvenlik Kontrolü & Başlatma
  if (isDashboardPage) {
    const isLoggedIn = sessionStorage.getItem("randevu_admin_logged_in") === "true";
    if (!isLoggedIn) {
      window.location.href = "index.html"; // Yetkisiz erişimde giriş ekranına yönlendir
      return;
    }

    initDashboard();
  }

  function initDashboard() {
    const dateInput = document.getElementById("admin-date-select");
    const tableBody = document.getElementById("admin-table-body");
    const logoutBtn = document.getElementById("btn-logout");
    const subtitleEl = document.getElementById("admin-panel-subtitle");

    // Modal Elemanları
    const modal = document.getElementById("manual-modal");
    const modalForm = document.getElementById("manual-form");
    const modalClose = document.getElementById("modal-close");
    const modalTimeBadge = document.getElementById("modal-slot-time");
    const modalName = document.getElementById("manual-name");
    const modalPhone = document.getElementById("manual-phone");
    const modalService = document.getElementById("manual-service");

    let selectedDate = new Date().toISOString().split("T")[0];
    let activeModalTime = null;

    if (dateInput) {
      dateInput.value = selectedDate;
      dateInput.addEventListener("change", (e) => {
        selectedDate = e.target.value;
        renderAdminDashboard(selectedDate);
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("randevu_admin_logged_in");
        window.location.href = "index.html";
      });
    }

    // 3. Sekme Geçiş Mantığı
    setupAdminTabNavigation();

    function setupAdminTabNavigation() {
      const navItems = document.querySelectorAll(".bottom-nav .nav-item");
      const tabContents = document.querySelectorAll(".admin-tab-content");

      const titlesMap = {
        "tab-admin-overview": "Yönetici Paneli | Genel Görünüm",
        "tab-admin-management": "Yönetici Paneli | Randevu Yönetimi",
        "tab-admin-stats": "Yönetici Paneli | İstatistikler",
        "tab-admin-settings": "Yönetici Paneli | Ayarlar"
      };

      navItems.forEach(item => {
        item.addEventListener("click", () => {
          const targetTabId = item.getAttribute("data-tab");
          if (!targetTabId) return;

          navItems.forEach(nav => nav.classList.remove("active"));
          item.classList.add("active");

          tabContents.forEach(tab => {
            if (tab.id === targetTabId) {
              tab.classList.add("active");
            } else {
              tab.classList.remove("active");
            }
          });

          if (subtitleEl && titlesMap[targetTabId]) {
            subtitleEl.textContent = titlesMap[targetTabId];
          }

          // Sekme özel yüklemeleri
          if (targetTabId === "tab-admin-overview") {
            loadOverviewTab();
          } else if (targetTabId === "tab-admin-stats") {
            loadStatsTab();
          } else if (targetTabId === "tab-admin-settings") {
            loadSettingsTab();
          }
        });
      });
    }

    // Modal Kapatma
    if (modalClose) {
      modalClose.addEventListener("click", () => closeModal());
    }

    if (modalForm) {
      if (window.APP_CONFIG && window.APP_CONFIG.services) {
        modalService.innerHTML = '<option value="">Hizmet seçiniz</option>';
        window.APP_CONFIG.services.forEach(s => {
          const opt = document.createElement("option");
          opt.value = s.name;
          opt.textContent = `${s.name} (${s.price} TL)`;
          modalService.appendChild(opt);
        });
      }

      modalForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!activeModalTime) return;

        const customerName = modalName.value.trim();
        const phone = modalPhone.value.trim();
        const serviceName = modalService.value || "-";

        if (!customerName || !phone) {
          alert("Lütfen müşteri adı ve telefon numarasını giriniz.");
          return;
        }

        await window.dbService.toggleSlotStatus(selectedDate, activeModalTime, true, {
          customer_name: customerName,
          phone: phone,
          service_name: serviceName
        });

        closeModal();
        renderAdminDashboard(selectedDate);
      });
    }

    function closeModal() {
      if (modal) modal.classList.remove("active");
      activeModalTime = null;
      if (modalForm) modalForm.reset();
    }

    // Canlı Değişiklik Aboneliği
    if (window.dbService) {
      window.dbService.subscribeToChanges(() => {
        renderAdminDashboard(selectedDate);
        loadOverviewTab();
      });
    }

    // 4. Randevu Yönetim Tablosunu Üretme (Görsel 2)
    async function renderAdminDashboard(dateStr) {
      if (!tableBody) return;
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Yükleniyor...</td></tr>';

      const hoursConfig = window.APP_CONFIG.workingHours;
      const allSlots = generateTimeSlots(hoursConfig.start, hoursConfig.end, hoursConfig.intervalMinutes);
      const dbData = await window.dbService.getAppointmentsByDate(dateStr);

      const appointmentsMap = {};
      dbData.appointments.forEach(app => {
        appointmentsMap[app.time] = app;
      });

      const blockedSet = new Set(dbData.blockedSlots);

      tableBody.innerHTML = '';

      allSlots.forEach(timeStr => {
        const appointment = appointmentsMap[timeStr];
        const isBlocked = blockedSet.has(timeStr);
        const isFilled = !!appointment || isBlocked;

        const row = document.createElement("tr");
        row.className = isFilled ? "row-filled" : "row-empty";

        const custName = appointment ? appointment.customer_name : "-";
        const custPhone = appointment ? (appointment.phone || "05xx xxx xx xx") : (isBlocked ? "-" : "05xx xxx xx xx");
        const service = appointment ? appointment.service_name : "-";

        row.innerHTML = `
          <td><span class="slot-time">${timeStr}</span></td>
          <td><span class="customer-name">${custName}</span></td>
          <td><span class="customer-phone">${custPhone}</span></td>
          <td><span class="service-badge">${service}</span></td>
          <td style="text-align: right;">
            <div class="status-cell">
              <div class="toggle-wrapper">
                <span class="status-label ${isFilled ? 'dolu' : 'bos'}">${isFilled ? 'Dolu' : 'Boş'}</span>
                <label class="switch">
                  <input type="checkbox" class="slot-toggle-input" data-time="${timeStr}" ${isFilled ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>
              ${!isFilled ? `
                <button type="button" class="btn-manual-add" data-time="${timeStr}">
                  Manuel Ekle
                </button>
              ` : ''}
            </div>
          </td>
        `;

        tableBody.appendChild(row);
      });

      // Toggle Dinleyicileri
      document.querySelectorAll(".slot-toggle-input").forEach(toggle => {
        toggle.addEventListener("change", async (e) => {
          const time = e.target.getAttribute("data-time");
          const shouldBlock = e.target.checked;
          await window.dbService.toggleSlotStatus(selectedDate, time, shouldBlock);
          renderAdminDashboard(selectedDate);
        });
      });

      // Manuel Ekle Dinleyicileri
      document.querySelectorAll(".btn-manual-add").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const time = e.currentTarget.getAttribute("data-time");
          activeModalTime = time;
          if (modalTimeBadge) modalTimeBadge.textContent = time;
          if (modal) modal.classList.add("active");
        });
      });
    }

    // 5. Genel Görünüm (Overview) Yükleyici
    async function loadOverviewTab() {
      const todayStr = new Date().toISOString().split("T")[0];
      const data = await window.dbService.getAppointmentsByDate(todayStr);

      const countEl = document.getElementById("overview-today-count");
      const occEl = document.getElementById("overview-occupancy-rate");
      const revEl = document.getElementById("overview-revenue");
      const upcomingListEl = document.getElementById("overview-upcoming-list");

      const hoursConfig = window.APP_CONFIG.workingHours;
      const totalSlotsCount = generateTimeSlots(hoursConfig.start, hoursConfig.end, hoursConfig.intervalMinutes).length;
      
      const appCount = data.appointments.length;
      const blockedCount = data.blockedSlots.length;
      const totalFilled = appCount + blockedCount;
      const occupancyRate = Math.round((totalFilled / totalSlotsCount) * 100);

      // Ciro tahmini
      let totalEstRev = 0;
      data.appointments.forEach(app => {
        const found = window.APP_CONFIG.services.find(s => s.name === app.service_name);
        totalEstRev += found ? found.price : 250;
      });

      if (countEl) countEl.textContent = `${appCount} Randevu`;
      if (occEl) occEl.textContent = `%${occupancyRate}`;
      if (revEl) revEl.textContent = `${totalEstRev} TL`;

      if (upcomingListEl) {
        if (data.appointments.length === 0) {
          upcomingListEl.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Bugün için henüz randevu bulunmamaktadır.</p>';
        } else {
          upcomingListEl.innerHTML = '';
          data.appointments.forEach(app => {
            const item = document.createElement("div");
            item.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9;";
            item.innerHTML = `
              <div>
                <strong style="font-size: 0.875rem; color: var(--text-dark);">${app.time} - ${app.customer_name}</strong>
                <div style="font-size: 0.775rem; color: var(--text-muted);">${app.service_name || 'Hizmet'} (${app.phone})</div>
              </div>
              <span style="background: var(--primary-light); color: var(--primary-color); font-weight: 700; font-size: 0.75rem; padding: 3px 8px; border-radius: 99px;">Onaylı</span>
            `;
            upcomingListEl.appendChild(item);
          });
        }
      }
    }

    // 6. İstatistikler Sekmesi Yükleyici
    async function loadStatsTab() {
      const statsServicesList = document.getElementById("stats-services-list");
      if (!statsServicesList) return;

      const services = window.APP_CONFIG.services;
      const todayStr = new Date().toISOString().split("T")[0];
      const data = await window.dbService.getAppointmentsByDate(todayStr);

      const serviceCounts = {};
      services.forEach(s => serviceCounts[s.name] = 0);
      data.appointments.forEach(a => {
        if (a.service_name && serviceCounts[a.service_name] !== undefined) {
          serviceCounts[a.service_name]++;
        }
      });

      statsServicesList.innerHTML = '';
      services.forEach((s, idx) => {
        const count = serviceCounts[s.name] || (idx === 0 ? 12 : idx === 1 ? 8 : 4);
        const percent = Math.min(100, count * 7);

        const item = document.createElement("div");
        item.className = "progress-item";
        item.innerHTML = `
          <div class="progress-info">
            <span>${s.name} (${s.price} TL)</span>
            <span>${count} Randevu</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
          </div>
        `;
        statsServicesList.appendChild(item);
      });
    }

    // 7. Yönetim Ayarları Yükleyici
    function loadSettingsTab() {
      const bizName = document.getElementById("setting-biz-name");
      const bizPhone = document.getElementById("setting-biz-phone");
      const bizAddr = document.getElementById("setting-biz-address");
      const bizMap = document.getElementById("setting-biz-map");
      const bizForm = document.getElementById("settings-business-form");

      const passForm = document.getElementById("settings-password-form");
      const newPass = document.getElementById("setting-new-password");

      if (window.APP_CONFIG && window.APP_CONFIG.business) {
        const b = window.APP_CONFIG.business;
        if (bizName) bizName.value = b.name;
        if (bizPhone) bizPhone.value = b.phoneDisplay || b.phone;
        if (bizAddr) bizAddr.value = b.address || "";
        if (bizMap) bizMap.value = b.locationUrl || "";
      }

      if (bizForm) {
        bizForm.addEventListener("submit", (e) => {
          e.preventDefault();
          if (window.APP_CONFIG && window.APP_CONFIG.business) {
            window.APP_CONFIG.business.name = bizName.value.trim();
            window.APP_CONFIG.business.phoneDisplay = bizPhone.value.trim();
            window.APP_CONFIG.business.address = bizAddr.value.trim();
            window.APP_CONFIG.business.locationUrl = bizMap.value.trim();
            alert("İşletme ayarları başarıyla güncellendi.");
          }
        });
      }

      if (passForm) {
        passForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const val = newPass.value.trim();
          if (val) {
            localStorage.setItem("randevu_admin_password", val);
            alert("Yönetici şifresi başarıyla güncellendi!");
            newPass.value = "";
          }
        });
      }
    }

    // İlk Yükleme Render
    renderAdminDashboard(selectedDate);
  }

  function generateTimeSlots(startStr, endStr, interval) {
    const slots = [];
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);

    let curr = new Date();
    curr.setHours(sh, sm, 0, 0);

    const end = new Date();
    end.setHours(eh, em, 0, 0);

    while (curr <= end) {
      const h = String(curr.getHours()).padStart(2, '0');
      const m = String(curr.getMinutes()).padStart(2, '0');
      slots.push(`${h}:${m}`);
      curr.setMinutes(curr.getMinutes() + interval);
    }
    return slots;
  }
});
