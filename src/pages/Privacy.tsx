import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => (
  <main className="min-h-screen bg-background text-foreground px-4 py-10 max-w-3xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft className="h-4 w-4" /> Басты бет
    </Link>
    <h1 className="text-2xl font-bold mb-6">Политика конфиденциальности</h1>
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p><strong className="text-foreground">1. Жиналатын деректер</strong></p>
      <p>Біз тіркелу кезінде электрондық пошта мекенжайыңызды, атыңызды және нишаңызды жинаймыз. Сондай-ақ, сервисті пайдалану статистикасы жиналады.</p>

      <p><strong className="text-foreground">2. Деректерді пайдалану</strong></p>
      <p>Деректеріңіз сервисті жақсарту, жеке ұсыныстар беру және техникалық қолдау көрсету мақсатында пайдаланылады. Біз деректерді үшінші тараптарға сатпаймыз.</p>

      <p><strong className="text-foreground">3. Деректерді сақтау</strong></p>
      <p>Деректер қауіпсіз серверлерде сақталады. Аккаунт жойылған кезде барлық жеке деректер 30 күн ішінде толық жойылады.</p>

      <p><strong className="text-foreground">4. Cookie файлдары</strong></p>
      <p>Сервис авторизация және аналитика мақсатында cookie файлдарын пайдаланады.</p>

      <p><strong className="text-foreground">5. Пайдаланушы құқықтары</strong></p>
      <p>Сіз кез келген уақытта деректеріңізге қол жеткізуді, түзетуді немесе жоюды сұрай аласыз. Бұл үшін support@trendme.kz мекенжайына жазыңыз.</p>

      <p className="text-xs text-muted-foreground/60 pt-4">Соңғы жаңарту: 2026 жыл, наурыз</p>
    </div>
  </main>
);

export default Privacy;
