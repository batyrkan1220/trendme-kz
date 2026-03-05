import { ArrowLeft, Mail, MapPin, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const Contacts = () => (
  <main className="min-h-screen bg-background text-foreground px-4 py-10 max-w-3xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft className="h-4 w-4" /> Басты бет
    </Link>
    <h1 className="text-2xl font-bold mb-6">Контакты</h1>
    <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
      <div className="flex items-start gap-3">
        <Building2 className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-medium text-foreground">ИП Батырхан</p>
          <p>БИН: 970528301753</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <MapPin className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Мекенжай</p>
          <p>Республика Казахстан, г. Шымкент</p>
          <p>ул. Кунаева 59, БЦ "Астана", 5 этаж, офис 501</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Электрондық пошта</p>
          <p>support@trendme.kz</p>
        </div>
      </div>
    </div>
  </main>
);

export default Contacts;
