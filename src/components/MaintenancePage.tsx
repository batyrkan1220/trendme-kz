import logoIcon from "@/assets/logo-icon-cropped.png";
import { Wrench } from "lucide-react";

export function MaintenancePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, hsl(72 40% 6%) 0%, #0a0a0a 70%)",
      }}
    >
      <img
        src={logoIcon}
        alt="trendme"
        className="h-20 w-20 rounded-2xl mb-6"
        style={{
          filter: "drop-shadow(0 0 20px hsl(72 100% 50% / 0.3))",
        }}
      />

      <h1
        className="text-2xl font-black tracking-[0.15em] uppercase mb-8"
        style={{
          color: "hsl(72 100% 50%)",
          textShadow: "0 0 20px hsl(72 100% 50% / 0.4)",
        }}
      >
        trendme
      </h1>

      <div
        className="rounded-2xl p-8 max-w-md w-full text-center"
        style={{
          background: "hsl(0 0% 8%)",
          border: "1px solid hsl(0 0% 16%)",
        }}
      >
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "hsl(72 100% 50% / 0.1)" }}
        >
          <Wrench className="h-7 w-7" style={{ color: "hsl(72 100% 50%)" }} />
        </div>

        <h2 className="text-xl font-bold text-foreground mb-3">
          Платформа временно недоступна
        </h2>

        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          На платформе проводятся технические работы. 
          Мы обновляем систему, чтобы сделать её ещё лучше для вас.
        </p>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Пожалуйста, зайдите позже. Приносим извинения за неудобства.
        </p>
      </div>

      <p className="text-muted-foreground/40 text-xs mt-8">
        © {new Date().getFullYear()} trendme · TikTok Official Partner
      </p>
    </div>
  );
}
