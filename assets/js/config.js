/**
 * Randevu Sistemi - Yapılandırma Dosyası
 * Tüm işletme ve API ayarları bu dosyadan yönetilir.
 */

const APP_CONFIG = {
  // İşletme Bilgileri
  business: {
    name: "Örnek İşletme",
    subtitle: "Randevunuzu kolayca alın",
    adminSubtitle: "Yönetici Paneli | Randevu Yönetimi",
    phone: "05551234567", // Düz telefon formatı (tel: linki için)
    phoneDisplay: "0555 123 45 67",
    category: "Güzellik & Kişisel Bakım",
    logo: "assets/img/logo.svg",
    locationUrl: "https://maps.google.com/?q=Atat%C3%BCrk+Cad.+No:123+Kad%C3%Bck%C3%B6y+%C4%B0stanbul",
    address: "Atatürk Cad. No:123, Kadıköy / İstanbul",
    aboutImage: "assets/img/about.jpg",
    aboutTitle: "İşletmemiz Hakkında",
    aboutText: "2015 yılından bu yana modern ekibimiz ve hijyenik salon ortamımızla kişisel bakım ve güzellik alanında en üst kalite hizmet sunuyoruz. Müşteri memnuniyetini ön planda tutan anlayışımızla, size özel randevu saatlerinizde kesintisiz ve konforlu bir deneyim sağlıyoruz."
  },

  // Sosyal Medya İletişim Bilgileri
  social: {
    instagram: "https://instagram.com/ornekisletme",
    instagramHandle: "@ornekisletme",
    whatsapp: "https://wa.me/905551234567",
    whatsappDisplay: "+90 555 123 45 67",
    website: "https://www.ornekisletme.com",
    websiteDisplay: "www.ornekisletme.com"
  },

  // Çalışma Saatleri ve Randevu Dilimleri
  workingHours: {
    start: "09:00",      // Başlangıç Saati
    end: "18:30",        // Bitiş Saati
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
    url: "https://cuwvhycguikkerunwlew.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1d3ZoeWNndWlra2VydW53bGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDI2ODcsImV4cCI6MjEwNDAxODY4N30.qSsqvCbgMUhfqzHEG7vKiZ0Db_0suJRJ_ZzXXx95jsw"
  },

  // Yönetici Giriş Şifresi
  adminPassword: "123"
};

// Global erişim için window nesnesine ekle
if (typeof window !== "undefined") {
  window.APP_CONFIG = APP_CONFIG;
}

