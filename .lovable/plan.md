
# Платформа ашылғандағы анимациялар жоспары

## Қазіргі жағдай
- **SplashScreen**: тек native платформада көрсетіледі (logo scale + fade)
- **PageTransition**: CSSTransition, 200ms fade-in/out — барлық беттерде жұмыс істейді
- Бет ішіндегі элементтер анимациясыз бірден пайда болады

## Не жасалады

### 1. SplashScreen жаңарту — веб үшін де қосу + неон glow эффекті
- SplashScreen-ді тек native емес, веб-те де бірінші рет ашқанда көрсету (sessionStorage арқылы)
- Логотипке неон-жасыл glow анимациясы қосу
- Фондағы жұлдызша/particle эффекті (CSS-only radial gradient pulse)
- "trendme" мәтінін әріп-әріптеп неон glow-мен пайда ету

### 2. Бет ішіндегі staggered анимациялар
- Хедер элементтері (тақырып, категория чиптері) — slide-down + fade-in, кезектесе (stagger 50-100ms)
- Карточкалар — slide-up + fade-in, stagger delay арқылы бірінен соң бірі көтеріліп шығады
- Бұл Trends, Search, Library беттеріне қолданылады

### 3. Bottom Navigation анимациясы
- Бет жүктелгенде bottom nav төменнен slide-up + fade-in
- Белсенді таб ауысқанда indicator scale анимациясы

### 4. Page Transition жақсарту
- Қазіргі 200ms fade-ді сақтау, бірақ кіргенде scale(0.98→1) қосу — iOS style

## Техникалық жүзеге асыру

**Файлдар:**
- `src/components/SplashScreen.tsx` — неон glow + text reveal + веб қолдау
- `src/index.css` — stagger keyframes, bottom-nav-enter анимациялары
- `src/components/layout/MobileBottomNav.tsx` — mount анимациясы
- `src/pages/Trends.tsx` — хедер + карточка stagger
- `src/pages/SearchPage.tsx` — хедер stagger
- `src/App.tsx` — SplashScreen-ді веб-те де көрсету (бір рет)

Барлық анимациялар CSS-only немесе inline style, қосымша кітапхана қажет емес. Дизайн: қараңғы фон + неон-жасыл glow стиліне сәйкес.
