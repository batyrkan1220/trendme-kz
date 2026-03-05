import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => (
  <main className="min-h-screen bg-background text-foreground px-4 py-10 max-w-3xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft className="h-4 w-4" /> На главную
    </Link>
    <h1 className="text-2xl font-bold mb-6">Политика конфиденциальности</h1>
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p><strong className="text-foreground">1. Собираемые данные</strong></p>
      <p>При регистрации мы собираем ваш адрес электронной почты, имя и нишу. Также собирается статистика использования Сервиса.</p>

      <p><strong className="text-foreground">2. Использование данных</strong></p>
      <p>Ваши данные используются для улучшения Сервиса, предоставления персональных рекомендаций и оказания технической поддержки. Мы не продаём данные третьим лицам.</p>

      <p><strong className="text-foreground">3. Хранение данных</strong></p>
      <p>Данные хранятся на защищённых серверах. При удалении аккаунта все персональные данные полностью удаляются в течение 30 дней.</p>

      <p><strong className="text-foreground">4. Файлы cookie</strong></p>
      <p>Сервис использует файлы cookie для авторизации и аналитики.</p>

      <p><strong className="text-foreground">5. Права пользователя</strong></p>
      <p>Вы можете в любое время запросить доступ к своим данным, их исправление или удаление. Для этого напишите на support@trendme.kz.</p>

      <p className="text-xs text-muted-foreground/60 pt-4">Последнее обновление: март 2026 года</p>
    </div>
  </main>
);

export default Privacy;
