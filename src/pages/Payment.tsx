import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Payment = () => (
  <main className="min-h-screen bg-background text-foreground px-4 py-10 max-w-3xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft className="h-4 w-4" /> На главную
    </Link>
    <h1 className="text-2xl font-bold mb-6">Оплата и возврат</h1>
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p><strong className="text-foreground">1. Способы оплаты</strong></p>
      <p>Оплата принимается банковскими картами (Visa, Mastercard, Kaspi). Все платежи осуществляются в тенге (₸).</p>

      <p><strong className="text-foreground">2. Подписка</strong></p>
      <p>Подписка активируется в соответствии с выбранным тарифом. По истечении срока подписка автоматически прекращается, автоматическое продление отсутствует.</p>

      <p><strong className="text-foreground">3. Политика возврата</strong></p>
      <p>В течение 3 дней после покупки можно подать запрос на полный возврат, если Сервис не был использован. Возврат осуществляется в течение 5–10 рабочих дней.</p>

      <p><strong className="text-foreground">4. Демо-режим</strong></p>
      <p>Все пользователи могут воспользоваться бесплатным демо-режимом, который позволяет работать с ограниченным функционалом.</p>

      <p><strong className="text-foreground">5. Связь</strong></p>
      <p>По вопросам оплаты пишите на support@trendme.kz.</p>

      <p className="text-xs text-muted-foreground/60 pt-4">Последнее обновление: март 2026 года</p>
    </div>
  </main>
);

export default Payment;
