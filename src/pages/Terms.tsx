import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => (
  <main className="min-h-screen bg-background text-foreground px-4 py-10 max-w-3xl mx-auto">
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft className="h-4 w-4" /> Басты бет
    </Link>
    <h1 className="text-2xl font-bold mb-6">Пользовательское соглашение</h1>
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p><strong className="text-foreground">1. Жалпы ережелер</strong></p>
      <p>Осы пайдаланушылық келісім (бұдан әрі — «Келісім») TrendMe платформасын (бұдан әрі — «Сервис») пайдалану шарттарын реттейді. Сервисті пайдалана отырып, сіз осы Келісімнің барлық шарттарымен келісесіз.</p>
      <p>Сервис иесі: ИП Батырхан, БИН 970528301753.</p>

      <p><strong className="text-foreground">2. Сервисті пайдалану</strong></p>
      <p>Сервис тек заңды мақсаттарда пайдаланылуы тиіс. Пайдаланушы тіркелу кезінде дұрыс ақпарат беруге міндеттенеді. Сервистің кез келген бөлігін автоматтандырылған жүйелер арқылы жүктеуге, көшіруге немесе таратуға тыйым салынады.</p>

      <p><strong className="text-foreground">3. Зияткерлік меншік</strong></p>
      <p>Сервистегі барлық мазмұн, дизайн, код және деректер ИП Батырхан меншігі болып табылады. Пайдаланушы аналитикалық нәтижелерді жеке мақсатта пайдалана алады.</p>

      <p><strong className="text-foreground">4. Жауапкершілікті шектеу</strong></p>
      <p>Сервис «сол қалпында» ұсынылады. Біз деректердің дәлдігіне 100% кепілдік бермейміз. Сервис үшінші тарап API-ларына тәуелді, сондықтан олардың қолжетімділігі біздің бақылауымыздан тыс.</p>

      <p><strong className="text-foreground">5. Келісімнің өзгеруі</strong></p>
      <p>Біз кез келген уақытта осы Келісімге өзгерістер енгізуге құқылымыз. Өзгерістер сервисте жарияланған сәттен бастап күшіне енеді.</p>

      <p className="text-xs text-muted-foreground/60 pt-4">Соңғы жаңарту: 2026 жыл, наурыз</p>
    </div>
  </main>
);

export default Terms;
