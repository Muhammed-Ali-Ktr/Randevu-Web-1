/**
 * Randevu Sistemi - Müşteri Ekranı Mantığı (assets/js/client.js)
 * Dinamik saat üretimi, tarih/hizmet yönetimi, sekme geçişleri ve iletişim entegrasyonu.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elemanları
  const formName = document.getElementById("customer-name");
  const formPhone = document.getElementById("customer-phone");
  const formService = document.getElementById("service-select");
  const formDateInput = document.getElementById("date-input");
  const dateDisplay = document.getElementById("date-display");
  const timeGrid = document.getElementById("time-grid");
  const btnSubmit = document.getElementById("btn-submit-booking");
  const toast = document.getElementById("toast");

  // Top Bar Linkleri
  const btnHeaderLocation = document.getElementById("btn-header-location");
  const btnHeaderPhone = document.getElementById("btn-header-phone");

  // Randevularım Sekmesi Elemanları
  const searchPhoneInput = document.getElementById("search-phone-input");
  const btnSearchPhone = document.getElementById("btn-search-phone");
  const myAppointmentsList = document.getElementById("my-appointments-list");

  // İletişim Sekmesi Elemanları
  const contactLocationLink = document.getElementById("contact-location-link");
  const contactAddressText = document.getElementById("contact-address-text");
  const contactPhoneLink = document.getElementById("contact-phone-link");
  const contactPhoneText = document.getElementById("contact-phone-text");
  const socialInstagram = document.getElementById("social-instagram");
  const socialWhatsapp = document.getElementById("social-whatsapp");
  const socialWebsite = document.getElementById("social-website");

  // Hakkımızda Sekmesi Elemanları
  const aboutImgElement = document.getElementById("about-img-element");
  const aboutTitleElement = document.getElementById("about-title-element");
  const aboutTextElement = document.getElementById("about-text-element");

  // Durum Değişkenleri
  let selectedDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  let selectedTime = null;

  initApp();

  async function applyBusinessSettings() {
    let b = window.APP_CONFIG ? window.APP_CONFIG.business : {};
    if (window.dbService) {
      b = await window.dbService.getSettings();
    }
    const soc = window.APP_CONFIG ? window.APP_CONFIG.social : {};

    // Header Başlıkları ve Sayfa Başlığı
    if (b.name) {
      document.querySelectorAll(".business-name").forEach(el => el.textContent = b.name);
      document.title = `Randevu Al | ${b.name}`;
    }
    if (b.subtitle) {
      document.querySelectorAll(".business-subtitle").forEach(el => el.textContent = b.subtitle);
    }

    // Header Sol İkon (Konum) & Sağ İkon (Telefon)
    if (btnHeaderLocation) btnHeaderLocation.href = b.locationUrl || "#";
    if (btnHeaderPhone) btnHeaderPhone.href = `tel:${b.phone}`;

    // Hakkımızda Sekmesi Bilgileri
    if (aboutImgElement && b.aboutImage) aboutImgElement.src = b.aboutImage;
    if (aboutTitleElement && b.aboutTitle) aboutTitleElement.textContent = b.aboutTitle;
    if (aboutTextElement && b.aboutText) aboutTextElement.textContent = b.aboutText;

    // İletişim Sekmesi Bilgileri
    if (contactLocationLink) contactLocationLink.href = b.locationUrl || "#";
    if (contactAddressText) contactAddressText.textContent = b.address || b.name || "";
    if (contactPhoneLink) contactPhoneLink.href = `tel:${b.phone}`;
    if (contactPhoneText) contactPhoneText.textContent = b.phoneDisplay || b.phone || "";

    if (socialInstagram && soc) socialInstagram.href = soc.instagram || "#";
    if (socialWhatsapp && soc) socialWhatsapp.href = soc.whatsapp || "#";
    if (socialWebsite && soc) socialWebsite.href = soc.website || "#";
  }

  async function initApp() {
    // İşletme Bilgilerini Doldur
    await applyBusinessSettings();

    // Hizmet Seçimi Dropdown Doldur
    populateServices();

    // Tarih Seçimi İlk Değer
    formDateInput.value = selectedDate;
    updateDateDisplay(selectedDate);

    // Saat Gridini Yükle
    loadSlotsForDate(selectedDate);

    // Sekme Geçişlerini Ayarla
    setupTabNavigation();

    // Son Kullanılan Telefon Numarasını Hatırla
    const lastPhone = localStorage.getItem('randevu_last_phone');
    if (lastPhone && searchPhoneInput) {
      searchPhoneInput.value = lastPhone;
      fetchMyAppointments(lastPhone);
    }

    // Supabase Realtime ve Yerel Değişiklik Dinleyicisi
    if (window.dbService) {
      window.dbService.subscribeToChanges(() => {
        loadSlotsForDate(selectedDate);
        applyBusinessSettings();
      });
    }

    window.addEventListener('storage', (event) => {
      if (event.key === 'randevu_business_settings' || event.key === 'randevu_db_signal') {
        applyBusinessSettings();
      }
    });

    // Etkinlik Dinleyicileri
    setupEventListeners();
  }

  // 1. Sekme Geçiş Mantığı
  function setupTabNavigation() {
    const navItems = document.querySelectorAll(".bottom-nav .nav-item");
    const tabContents = document.querySelectorAll(".tab-content");

    navItems.forEach(item => {
      item.addEventListener("click", () => {
        const targetTabId = item.getAttribute("data-tab");
        if (!targetTabId) return;

        // Aktif Sekme Butonunu Güncelle
        navItems.forEach(nav => nav.classList.remove("active"));
        item.classList.add("active");

        // Aktif İçeriği Göster
        tabContents.forEach(tab => {
          if (tab.id === targetTabId) {
            tab.classList.add("active");
          } else {
            tab.classList.remove("active");
          }
        });

        // Randevularım sekmesine geçildiyse ve arama kutusu doluysa otomatik getir
        if (targetTabId === "tab-my-appointments" && searchPhoneInput && searchPhoneInput.value.trim()) {
          fetchMyAppointments(searchPhoneInput.value.trim());
        }
      });
    });
  }

  // 2. Hizmet Dropdown Doldurma
  function populateServices() {
    if (!window.APP_CONFIG || !window.APP_CONFIG.services) return;
    formService.innerHTML = '<option value="">Hizmet seçiniz</option>';
    window.APP_CONFIG.services.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.price} TL - ${s.duration} dk)`;
      formService.appendChild(opt);
    });
  }

  // 3. Türkçe Tarih Formatlama
  function updateDateDisplay(dateStr) {
    const parts = dateStr.split("-");
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const formatted = d.toLocaleDateString('tr-TR', options);
    dateDisplay.textContent = formatted;
  }

  // 4. Çalışma Saatlerine Göre Dinamik Slot Listesi Üretme
  function generateTimeSlots() {
    const hoursConfig = window.APP_CONFIG.workingHours;
    const slots = [];

    const [startH, startM] = hoursConfig.start.split(":").map(Number);
    const [endH, endM] = hoursConfig.end.split(":").map(Number);
    const interval = hoursConfig.intervalMinutes;

    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const endTime = new Date();
    endTime.setHours(endH, endM, 0, 0);

    while (current <= endTime) {
      const h = String(current.getHours()).padStart(2, '0');
      const m = String(current.getMinutes()).padStart(2, '0');
      slots.push(`${h}:${m}`);
      current.setMinutes(current.getMinutes() + interval);
    }

    return slots;
  }

  // 5. Tarihe Göre Saat Dilimlerini Çekip Render Etme
  async function loadSlotsForDate(dateStr) {
    if (!timeGrid) return;
    timeGrid.innerHTML = '<div style="grid-column: span 4; text-align: center; padding: 20px; color: #64748b;">Saatler yükleniyor...</div>';
    
    const allSlots = generateTimeSlots();
    const dbData = await window.dbService.getAppointmentsByDate(dateStr);
    
    const bookedTimes = new Set([
      ...dbData.appointments.map(a => a.time),
      ...dbData.blockedSlots
    ]);

    timeGrid.innerHTML = '';

    allSlots.forEach(timeStr => {
      const isBooked = bookedTimes.has(timeStr);
      const isSelected = (selectedTime === timeStr);

      const slotBtn = document.createElement("button");
      slotBtn.type = "button";
      slotBtn.className = `time-slot ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`;
      slotBtn.textContent = timeStr;

      if (isBooked) {
        slotBtn.disabled = true;
        slotBtn.title = "Bu saat dilimi dolu veya kapalı";
      } else {
        slotBtn.addEventListener("click", () => {
          document.querySelectorAll(".time-slot").forEach(el => el.classList.remove("selected"));
          slotBtn.classList.add("selected");
          selectedTime = timeStr;
        });
      }

      timeGrid.appendChild(slotBtn);
    });
  }

  // 6. Müşteri Randevularını Sorgulama (Randevularım Sekmesi)
  async function fetchMyAppointments(phoneStr) {
    if (!myAppointmentsList) return;
    myAppointmentsList.innerHTML = '<p style="text-align:center; padding:16px; color:#64748b;">Randevular sorgulanıyor...</p>';

    const appointments = await window.dbService.getAppointmentsByPhone(phoneStr);

    if (!appointments || appointments.length === 0) {
      myAppointmentsList.innerHTML = `
        <div style="text-align:center; padding: 24px; color: #64748b;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px; opacity:0.5;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p style="font-weight: 600;">Kayıtlı randevu bulunamadı.</p>
          <p style="font-size: 0.8rem; margin-top: 4px;">Girdiğiniz telefon numarasını kontrol ediniz.</p>
        </div>
      `;
      return;
    }

    myAppointmentsList.innerHTML = '';
    const now = new Date();

    appointments.forEach(app => {
      const appDateTime = new Date(`${app.date}T${app.time}`);
      const isPast = appDateTime < now;

      const card = document.createElement("div");
      card.className = `appointment-item-card ${isPast ? 'past' : ''}`;

      const dateObj = new Date(app.date);
      const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' });

      card.innerHTML = `
        <div>
          <span class="app-date-badge">${formattedDate} ${isPast ? '(Geçmiş)' : '(Gelecek)'}</span>
          <div class="app-service-title">${app.service_name || 'Randevu'}</div>
          <div class="app-customer-name">${app.customer_name} - ${app.phone}</div>
        </div>
        <div style="text-align: right;">
          <div class="app-time-badge">${app.time}</div>
        </div>
      `;

      myAppointmentsList.appendChild(card);
    });
  }

  // 7. Etkinlik Dinleyicileri
  function setupEventListeners() {
    formDateInput.addEventListener("change", (e) => {
      selectedDate = e.target.value;
      selectedTime = null;
      updateDateDisplay(selectedDate);
      loadSlotsForDate(selectedDate);
    });

    btnSubmit.addEventListener("click", async () => {
      const name = formName.value.trim();
      const phone = formPhone.value.trim();
      const serviceId = formService.value;

      if (!name) {
        showToast("Lütfen adınızı ve soyadınızı giriniz.", "error");
        formName.focus();
        return;
      }
      if (!phone) {
        showToast("Lütfen telefon numaranızı giriniz.", "error");
        formPhone.focus();
        return;
      }
      if (!serviceId) {
        showToast("Lütfen bir hizmet seçiniz.", "error");
        formService.focus();
        return;
      }
      if (!selectedTime) {
        showToast("Lütfen saat seçimi alanından uygun bir saat seçiniz.", "error");
        return;
      }

      const selectedService = window.APP_CONFIG.services.find(s => s.id === serviceId);

      btnSubmit.disabled = true;
      btnSubmit.textContent = "İşleniyor...";

      const result = await window.dbService.createAppointment({
        date: selectedDate,
        time: selectedTime,
        customer_name: name,
        phone: phone,
        service_id: serviceId,
        service_name: selectedService ? selectedService.name : ''
      });

      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `Randevuyu Onayla <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

      if (result.success) {
        showToast("Randevunuz başarıyla oluşturuldu!", "success");
        formName.value = '';
        formPhone.value = '';
        formService.value = '';
        selectedTime = null;
        loadSlotsForDate(selectedDate);

        // Sorgu kutusuna da kaydedip telefon numarasını saklayalım
        if (searchPhoneInput) {
          searchPhoneInput.value = phone;
        }
      } else {
        showToast(result.error || "Randevu oluşturulamadı.", "error");
      }
    });

    // Telefon Sorgulama Butonu
    if (btnSearchPhone) {
      btnSearchPhone.addEventListener("click", () => {
        const p = searchPhoneInput.value.trim();
        if (p) fetchMyAppointments(p);
        else showToast("Lütfen sorgulamak için telefon numaranızı giriniz.", "error");
      });
    }
  }

  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = `toast-notification show ${type}`;
    setTimeout(() => {
      toast.className = "toast-notification";
    }, 3500);
  }
});
