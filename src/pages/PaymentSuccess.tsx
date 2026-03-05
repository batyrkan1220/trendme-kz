import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => (
  <main className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="text-center space-y-4 max-w-md">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
      <h1 className="text-2xl font-bold text-foreground">Оплата прошла успешно!</h1>
      <p className="text-muted-foreground">Ваша подписка активирована. Теперь вам доступны все функции платформы.</p>
      <Link to="/dashboard">
        <Button className="mt-4 rounded-xl px-8 h-12 font-semibold">
          Перейти в кабинет
        </Button>
      </Link>
    </div>
  </main>
);

export default PaymentSuccess;
