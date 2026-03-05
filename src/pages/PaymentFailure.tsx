import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentFailure = () => (
  <main className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="text-center space-y-4 max-w-md">
      <XCircle className="h-16 w-16 text-destructive mx-auto" />
      <h1 className="text-2xl font-bold text-foreground">Оплата не прошла</h1>
      <p className="text-muted-foreground">Произошла ошибка при обработке платежа. Попробуйте ещё раз или выберите другой способ оплаты.</p>
      <Link to="/subscription">
        <Button className="mt-4 rounded-xl px-8 h-12 font-semibold">
          Вернуться к тарифам
        </Button>
      </Link>
    </div>
  </main>
);

export default PaymentFailure;
