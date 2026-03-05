import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Payment = () => (
  <main className="min-h-screen bg-background text-foreground px-4 py-10 max-w-3xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft className="h-4 w-4" /> Басты бет
    </Link>
    <h1 className="text-2xl font-bold mb-6">Оплата и возврат</h1>
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p><strong className="text-foreground">1. Төлем тәсілдері</strong></p>
      <p>Төлем банк карталары (Visa, Mastercard, Kaspi) арқылы қабылданады. Барлық төлемдер теңгемен (₸) жүргізіледі.</p>

      <p><strong className="text-foreground">2. Жазылым</strong></p>
      <p>Жазылым таңдалған тарифке сәйкес белсендіріледі. Жазылым мерзімі аяқталғанда автоматты түрде тоқтатылады, автоматты жаңарту жоқ.</p>

      <p><strong className="text-foreground">3. Қайтару саясаты</strong></p>
      <p>Сатып алғаннан кейін 3 күн ішінде толық қайтаруға сұраныс беруге болады, егер сервис пайдаланылмаған болса. Қайтару 5-10 жұмыс күні ішінде жүргізіледі.</p>

      <p><strong className="text-foreground">4. Демо режим</strong></p>
      <p>Барлық пайдаланушылар тегін демо режимді пайдалана алады, ол шектеулі функциялармен жұмыс істеуге мүмкіндік береді.</p>

      <p><strong className="text-foreground">5. Байланыс</strong></p>
      <p>Төлемге қатысты сұрақтар бойынша support@trendme.kz мекенжайына жазыңыз.</p>

      <p className="text-xs text-muted-foreground/60 pt-4">Соңғы жаңарту: 2026 жыл, наурыз</p>
    </div>
  </main>
);

export default Payment;
