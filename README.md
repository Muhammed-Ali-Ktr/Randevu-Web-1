# Modern Serverless & Statik Randevu Sistemi (JAMstack)

Tüm sektörlere (berber, kuaför, dişçi, avukat, oto tamircisi vb.) uyarlanabilir, sunucusuz ve tamamen statik (JAMstack) mimaride çalışan web tabanlı randevu sistemi.

İstemci tarafında **Vanilla HTML5, CSS3, JavaScript** ve **Supabase JS SDK** kullanılarak geliştirilmiştir.

---

## 📁 Proje Dosya Yapısı

```text
randevu-sistemi/
├── assets/
│   ├── css/
│   │   ├── main.css          # Tema renkleri (#006654), CSS değişkenleri, typography, modal & nav
│   │   ├── client.css        # Müşteri ekranı stilleri (Görsel 1)
│   │   └── admin.css         # Yönetim paneli stilleri (Görsel 2)
│   ├── js/
│   │   ├── config.js         # İşletme ayarları, çalışma saatleri, Supabase API bilgileri
│   │   ├── db.js             # Supabase istemci bağlantısı, CRUD fonksiyonları & Realtime
│   │   ├── client.js         # Müşteri ekranı mantığı ve dinamik saat üretimi
│   │   └── admin.js          # Yönetim paneli mantığı, oturum kontrolü ve toggle işlemleri
│   └── img/
│       ├── logo.svg          # İşletme logosu (Yeşil makas amblemli vektörel SVG)
│       └── about.jpg         # Hakkımızda görseli
├── admin/
│   ├── index.html            # Şifreli Yönetici Giriş Ekranı
│   └── dashboard.html        # Randevu Yönetim Paneli (Görsel 2)
├── index.html                # Müşteri Randevu Alma Sayfası (Görsel 1)
└── README.md                 # Kurulum ve Veritabanı Rehberi
```

---

## 🚀 Supabase Bağlantı Adımları (Adım Adım Rehber)

Projenizi canlı Supabase veritabanına bağlamak için aşağıdaki 4 basit adımı takip edin:

### 1. Adım: Supabase Projesi Oluşturma
1. [supabase.com](https://supabase.com) adresine gidin ve ücretsiz bir hesap açın / giriş yapın.
2. **"New Project"** (Yeni Proje) butonuna tıklayın.
3. Projenize bir isim verin ve veritabanı şifresi (Database Password) belirleyin.

---

### 2. Adım: SQL Kodunu Çalıştırma (Tabloları ve Realtime'ı Oluşturma)
1. Supabase sol menüsünden **"SQL Editor"** sekmesine tıklayın.
2. **"New query"** butonuna basın ve aşağıdaki SQL kodunu yapıştırıp **"Run"** butonuna basarak çalıştırın:

```sql
-- 1. Randevular Tablosu (appointments)
CREATE TABLE public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    service_id VARCHAR(50),
    service_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bloklanan / Kapalı Saatler Tablosu (blocked_slots)
CREATE TABLE public.blocked_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Güvenlik İzinleri (Row Level Security - RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Appointments Select" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Public Appointments Insert" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Appointments Delete" ON public.appointments FOR DELETE USING (true);

CREATE POLICY "Public Blocked Slots Select" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "Public Blocked Slots Insert" ON public.blocked_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Blocked Slots Update" ON public.blocked_slots FOR UPDATE USING (true);
CREATE POLICY "Public Blocked Slots Delete" ON public.blocked_slots FOR DELETE USING (true);

-- 4. Canlı Senkronizasyon (Supabase Realtime Yayın Özelliği)
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_slots;
```

---

### 3. Adım: API Bilgilerini Alma
1. Supabase sol menüsünün en altındaki **"Project Settings"** (Çark Simgesi) -> **"API"** sekmesine gidin.
2. Burada yer alan iki bilgiyi kopyalayın:
   - **Project URL** (örn: `https://xyzxyz.supabase.co`)
   - **anon / public key** (örn: `eyJhbGciOi...`)

---

### 4. Adım: Projeye Ekleme (`assets/js/config.js`)
Projenizdeki `assets/js/config.js` dosyasını açın ve `supabase` bölümüne kopyaladığınız değerleri yapıştırın:

```javascript
supabase: {
  url: "https://xyzxyz.supabase.co", 
  anonKey: "eyJhbGciOi..."
}
```

Tebrikler! Sistem artık tamamen canlı Supabase veritabanınıza bağlı çalışmaktadır.

---

## 🔐 Yönetici Paneli Girişi
- **Yönetici Giriş Adresi**: `admin/index.html`
- **Varsayılan Şifre**: `123` (`assets/js/config.js` içerisinden değiştirilebilir).
