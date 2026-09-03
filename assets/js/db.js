/**
 * Randevu Sistemi - Veritabanı Mantığı (assets/js/db.js)
 * Supabase JS SDK istemci bağlantısı ve CRUD fonksiyonları.
 * Supabase yapılandırması girildiğinde Supabase kullanır ve eski demo hafızasını temizler.
 */

class DatabaseService {
  constructor() {
    this.supabase = null;
    this.useLocalStorage = true;
    this.subscribers = [];
    this.init();
  }

  /**
   * Supabase Bağlantısını Başlat ve Eski Demo Çerezlerini Temizle
   */
  init() {
    const config = window.APP_CONFIG ? window.APP_CONFIG.supabase : null;

    if (config && config.url && config.anonKey && typeof supabase !== 'undefined') {
      try {
        this.supabase = supabase.createClient(config.url, config.anonKey);
        this.useLocalStorage = false;
        console.log("Supabase veritabanı bağlantısı başarıyla kuruldu.");
        
        // Supabase canlı moda geçildiğinde tarayıcı yerel hafızasındaki eski demo verileri temizle
        this.clearLegacyLocalStorage();
      } catch (err) {
        console.warn("Supabase bağlantı hatası, LocalStorage moduna geçiliyor:", err);
        this.useLocalStorage = true;
      }
    } else {
      console.log("Supabase API bilgileri eksik, LocalStorage yerel veri modu kullanılıyor.");
      this.useLocalStorage = true;
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'randevu_db_signal') {
          this.notifySubscribers();
        }
      });
    }
  }

  /**
   * Tarayıcı hafızasındaki tüm eski randevu verilerini temizler
   */
  clearLegacyLocalStorage() {
    if (typeof localStorage === 'undefined') return;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('randevu_data_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  /**
   * Belirtilen tarihe ait randevuları ve engellenmiş (dolu/kapalı) saatleri getirir.
   * @param {string} dateStr - 'YYYY-MM-DD' formatında tarih
   * @returns {Promise<{appointments: Array, blockedSlots: Array}>}
   */
  async getAppointmentsByDate(dateStr) {
    if (!this.useLocalStorage && this.supabase) {
      try {
        const { data: appointments, error: appErr } = await this.supabase
          .from('appointments')
          .select('*')
          .eq('date', dateStr);

        if (appErr) {
          console.error("Supabase appointments çekme hatası:", appErr);
        }

        const { data: blockedSlots, error: blockErr } = await this.supabase
          .from('blocked_slots')
          .select('*')
          .eq('date', dateStr);

        if (blockErr) {
          console.error("Supabase blocked_slots çekme hatası:", blockErr);
        }

        return {
          appointments: appointments || [],
          blockedSlots: (blockedSlots || []).map(s => s.time)
        };
      } catch (err) {
        console.error("Supabase veri çekme hatası:", err);
        return { appointments: [], blockedSlots: [] };
      }
    }

    // LocalStorage modu: Herhangi bir demo veri olmadan tamamen boş başlar
    const storageKey = `randevu_data_${dateStr}`;
    const rawData = localStorage.getItem(storageKey);
    if (!rawData) {
      const emptyData = { appointments: [], blockedSlots: [] };
      localStorage.setItem(storageKey, JSON.stringify(emptyData));
      return emptyData;
    }
    return JSON.parse(rawData);
  }

  /**
   * Telefon numarasına göre müşterinin geçmiş ve gelecek randevularını getirir.
   * @param {string} phoneStr
   */
  async getAppointmentsByPhone(phoneStr) {
    const cleanPhone = phoneStr.replace(/\s+/g, '');
    if (!cleanPhone) return [];

    if (!this.useLocalStorage && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('appointments')
          .select('*')
          .ilike('phone', `%${cleanPhone}%`)
          .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Supabase telefon ile randevu arama hatası:", err);
        return [];
      }
    }

    // LocalStorage modu
    const results = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('randevu_data_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.appointments) {
            data.appointments.forEach(app => {
              if (app.phone && app.phone.replace(/\s+/g, '').includes(cleanPhone)) {
                results.push(app);
              }
            });
          }
        } catch (e) {}
      }
    }
    
    return results.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB - dateA;
    });
  }

  /**
   * Müşteri randevusu oluşturur.
   * @param {Object} data - { date, time, customer_name, phone, service_name, service_id }
   */
  async createAppointment(data) {
    const appointmentData = {
      date: data.date,
      time: data.time,
      customer_name: data.customer_name,
      phone: data.phone,
      service_name: data.service_name || '',
      service_id: data.service_id || '',
      created_at: new Date().toISOString()
    };

    if (!this.useLocalStorage && this.supabase) {
      try {
        const { data: res, error } = await this.supabase
          .from('appointments')
          .insert([appointmentData])
          .select();

        if (error) throw error;
        this.notifySubscribers();
        return { success: true, data: res };
      } catch (err) {
        console.error("Supabase randevu kaydı oluşturma hatası:", err);
        return { success: false, error: err.message };
      }
    }

    // LocalStorage modu
    const storageKey = `randevu_data_${data.date}`;
    const current = await this.getAppointmentsByDate(data.date);
    
    const isBooked = current.appointments.some(a => a.time === data.time);
    const isBlocked = current.blockedSlots.includes(data.time);

    if (isBooked || isBlocked) {
      return { success: false, error: "Seçilen saat dilimi ne yazık ki dolu." };
    }

    current.appointments.push(appointmentData);
    localStorage.setItem(storageKey, JSON.stringify(current));
    
    localStorage.setItem('randevu_last_phone', data.phone);

    this.broadcastLocalChange();
    this.notifySubscribers();

    return { success: true, data: appointmentData };
  }

  /**
   * Bir saat diliminin durumunu (Dolu/Kapalı veya Boş) değiştirir.
   */
  async toggleSlotStatus(date, time, isBlocked, manualCustomer = null) {
    if (!this.useLocalStorage && this.supabase) {
      try {
        if (isBlocked) {
          if (manualCustomer) {
            await this.supabase.from('appointments').insert([{
              date,
              time,
              customer_name: manualCustomer.customer_name,
              phone: manualCustomer.phone,
              service_name: manualCustomer.service_name,
              created_at: new Date().toISOString()
            }]);
          } else {
            await this.supabase.from('blocked_slots').upsert([{ date, time }]);
          }
        } else {
          await this.supabase.from('appointments').delete().match({ date, time });
          await this.supabase.from('blocked_slots').delete().match({ date, time });
        }

        this.notifySubscribers();
        return { success: true };
      } catch (err) {
        console.error("Supabase toggle slot hatası:", err);
        return { success: false, error: err.message };
      }
    }

    // LocalStorage modu
    const storageKey = `randevu_data_${date}`;
    const current = await this.getAppointmentsByDate(date);

    if (isBlocked) {
      if (manualCustomer) {
        current.appointments = current.appointments.filter(a => a.time !== time);
        current.appointments.push({
          date,
          time,
          customer_name: manualCustomer.customer_name,
          phone: manualCustomer.phone,
          service_name: manualCustomer.service_name,
          created_at: new Date().toISOString()
        });
      } else {
        if (!current.blockedSlots.includes(time)) {
          current.blockedSlots.push(time);
        }
      }
    } else {
      current.appointments = current.appointments.filter(a => a.time !== time);
      current.blockedSlots = current.blockedSlots.filter(t => t !== time);
    }

    localStorage.setItem(storageKey, JSON.stringify(current));
    this.broadcastLocalChange();
    this.notifySubscribers();

    return { success: true };
  }

  /**
   * Supabase Realtime veya Yerel Değişiklik Aboneliği
   */
  subscribeToChanges(callback) {
    this.subscribers.push(callback);

    if (!this.useLocalStorage && this.supabase) {
      const channel = this.supabase
        .channel('randevu-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments' },
          () => callback()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'blocked_slots' },
          () => callback()
        )
        .subscribe();

      return () => {
        this.supabase.removeChannel(channel);
      };
    }

    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => {
      try { cb(); } catch (e) { console.error("Subscriber error:", e); }
    });
  }

  broadcastLocalChange() {
    try {
      localStorage.setItem('randevu_db_signal', Date.now().toString());
    } catch (e) {}
  }
}

// Global instance
if (typeof window !== "undefined") {
  window.dbService = new DatabaseService();
}
