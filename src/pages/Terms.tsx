import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => (
  <main className="min-h-screen bg-background text-foreground px-4 py-10 max-w-3xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft className="h-4 w-4" /> На главную
    </Link>
    <h1 className="text-2xl font-bold mb-6">Пользовательское соглашение</h1>
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p><strong className="text-foreground">1. Общие положения</strong></p>
      <p>Настоящее пользовательское соглашение (далее — «Соглашение») регулирует условия использования платформы trendme (далее — «Сервис»). Используя Сервис, вы соглашаетесь со всеми условиями настоящего Соглашения.</p>
      <p>Владелец Сервиса: ИП Батырхан, БИН 970528301753.</p>

      <p><strong className="text-foreground">2. Использование Сервиса</strong></p>
      <p>Сервис предназначен исключительно для законных целей. Пользователь обязуется предоставлять достоверную информацию при регистрации. Запрещается загружать, копировать или распространять любую часть Сервиса с помощью автоматизированных систем.</p>

      <p><strong className="text-foreground">3. Интеллектуальная собственность</strong></p>
      <p>Весь контент, дизайн, код и данные Сервиса являются собственностью ИП Батырхан. Пользователь может использовать аналитические результаты в личных целях.</p>

      <p><strong className="text-foreground">4. Ограничение ответственности</strong></p>
      <p>Сервис предоставляется «как есть». Мы не гарантируем 100% точность данных. Сервис зависит от сторонних API, доступность которых находится вне нашего контроля.</p>

      <p><strong className="text-foreground">5. Изменение Соглашения</strong></p>
      <p>Мы вправе в любое время вносить изменения в настоящее Соглашение. Изменения вступают в силу с момента их публикации в Сервисе.</p>

      <p className="text-xs text-muted-foreground/60 pt-4">Последнее обновление: март 2026 года</p>
    </div>
  </main>
);

export default Terms;
