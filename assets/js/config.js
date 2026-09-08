/**
 * Randevu Sistemi - Yapılandırma Dosyası
 * Tüm işletme ve API ayarları bu dosyadan yönetilir.
 */

const APP_CONFIG = {
  // İşletme Bilgileri
  business: {
    name: "Kuaför Vadık",
    subtitle: "Randevunuzu kolayca alın",
    adminSubtitle: "Yönetici Paneli | Randevu Yönetimi",
    phone: "05425823459", // Düz telefon formatı (tel: linki için)
    phoneDisplay: "0542 582 34 59",
    category: "Güzellik & Kişisel Bakım",
    logo: "assets/img/logo.svg",
    locationUrl: "https://www.google.com/maps/place/KUAF%C3%96R+VADIK/@37.890026,32.5048061,661m/data=!3m2!1e3!4b1!4m6!3m5!1s0x14d0856976c5fdf9:0x2e6a1bff03b283b0!8m2!3d37.890026!4d32.507381!16s%2Fg%2F11h6mqkb6_?entry=ttu&g_ep=EgoyMDI2MDkwMi4wIKXMDSoASAFQAw%3D%3D",
    address: "Araplar, Büyük Sinan Cd. No:8, 42050 Karatay/Konya",
    aboutImage: "assets/img/about.jpg",
    aboutTitle: "İşletmemiz Hakkında",
    aboutText: "Temiz ortam, titiz işçilik ve güler yüzlü hizmet. Aradığınız kaliteli bakımı bütçenize uygun fiyatlarla sunuyoruz. Randevunuzu hemen oluşturun!"
  },

  // Sosyal Medya İletişim Bilgileri
  social: {
    instagram: "https://instagram.com/ornekisletme",
    instagramHandle: "@ornekisletme",
    whatsapp: "https://wa.me/905425823459",
    whatsappDisplay: "+90 542 582 34 59",
    website: "https://www.ornekisletme.com",
    websiteDisplay: "www.ornekisletme.com"
  },

  // Çalışma Saatleri ve Randevu Dilimleri
  workingHours: {
    start: "09:00",      // Başlangıç Saati
    end: "20:30",        // Bitiş Saati
    intervalMinutes: 30  // Randevu Aralığı (dakika)
  },

  // Sunulan Hizmetler
  services: [
    { id: "s1", name: "Saç Kesimi", duration: 30, price: 300 },
    { id: "s2", name: "Sakal Tıraşı", duration: 30, price: 150 },
    { id: "s3", name: "Saç & Sakal Bakımı", duration: 60, price: 400 },
    { id: "s4", name: "Cilt Bakımı & Maske", duration: 45, price: 350 },
    { id: "s5", name: "Fön & Şekillendirme", duration: 20, price: 200 }
  ],

  // Supabase Veritabanı ve API Ayarları
  supabase: {
    url: "https://vqjwkmnzucladrgobgvm.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxandrbW56dWNsYWRyZ29iZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4OTQ3MTYsImV4cCI6MjEwNDQ3MDcxNn0.8y2qo1xaPhAy-saAYaEpKFgdGjUtrC5Nx-rtWULK9Zg"
  },

  // Yönetici Giriş Şifresi
  adminPassword: "123"
};

// Global erişim için window nesnesine ekle
if (typeof window !== "undefined") {
  window.APP_CONFIG = APP_CONFIG;
}

