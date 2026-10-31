# Поиск авиабилетов: экран загрузки (webview)

Экран из Figma «Экскурсии» → «Редактировать поиск» (node `903:119485`), 360 × 800, на React 18 + Vite + TypeScript, стили в CSS Modules, токены DS Mtravel 2.0 с именами из Figma (`src/styles/tokens.css`).

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # dist/
npm run build:single   # dist-single/index.html, всё в одном файле
```

Живая версия: https://govsun.github.io/webview-search-loading/

Каждый пуш в `main` собирает `dist/` и публикует его на GitHub Pages (`.github/workflows/pages.yml`, в настройках репозитория Pages → Source: GitHub Actions). Пути в сборке относительные, поэтому сайт работает по адресу `https://<user>.github.io/<repo>/`.

На телефоне экран занимает весь viewport, как в webview. В браузере на десктопе он показан в рамке 360 × 800 со статус-баром из макета: рамка нужна только для сверки, статус-бар в приложении нативный.

## Состав

| Файл | Что это |
| --- | --- |
| `screens/SearchLoadingScreen.tsx` | Экран. Тексты и обработчики приходят пропсами: `route`, `details`, `message`, `filters`, `onBack`, `onEditSearch`, `onSort`, `onOpenAllFilters`, `onOpenFilter(id)` |
| `components/Appbar` | DS Appbar, вариант с поиском: зоны 60 / растягивается / 60, отступ сверху `env(safe-area-inset-top)` |
| `components/SearchSummary` | Плашка «Бишкек → Москва» (Tab 44 px, IM-13 S + IM-11 R) |
| `components/FilterBar` | Кнопка «filter-chips» и чипы быстрых фильтров, горизонтальный скролл |
| `components/PlaneWindow` | Иллюминатор из Rive: `RiveWindow.tsx` проигрывает `assets/window/plane-window.riv`, при «Уменьшить движение» вместо него картинка `plane-window-still.webp` |
| `rive/project` | Исходник анимации: проект Rive CLI, скачанный из файла «Travel Animation» (сцена `scene.rml`, скрипт неба и облаков `PlaneGlass.luau`, SVG рамы, ободка, шторки, крыло). Подробно в `rive/README.md` |
| `scripts/round-window.py` | Делает контуры рамы, ободка и маски стекла округлыми: прямые бока, сверху и снизу половинки эллипса (высота = 0.9 полуширины). Запускать после новой выгрузки SVG из Figma, до импорта в Rive |
| `scripts/gray-wing.py` | Перекрашивает крыло, выгруженное из Figma, из лавандового в серые DS (нужен Pillow) |

## Иллюминатор

Окно с облаками, крылом и шторкой сделано в Rive и подключено файлом `src/assets/window/plane-window.riv` (55 КБ). State machine «Plane window»: шторка в начале закрыта и за 0.9 с поднимается (как на mikes.cv, но без затемнения), облака летят и крыло покачивается по кругу. Раньше то же самое рисовал код (Canvas 2D и SVG), он есть в истории git до коммита с Rive.

- Рантайм `@rive-app/react-webgl2` (Rive Renderer, нужен для feather-теней и скриптов) грузится отдельным чанком (`React.lazy`): 89 КБ JS и 2.3 МБ WebAssembly (около 950 КБ в gzip). WebAssembly раздаётся из нашей сборки, а не с CDN unpkg.
- Canvas плавно проявляется, когда файл и рантайм загрузились. Рантайм сам останавливается, когда вкладка или webview уходит в фон.
- При `prefers-reduced-motion: reduce` рантайм не загружается: показывается `plane-window-still.webp` (кадр после подъёма шторки, 3×, 33 КБ).
- Файл собран на бесплатном плане Rive, поэтому перед анимацией около 2 с идёт заставка Rive (чёрный экран с логотипом). На платном плане (Cadet и выше) её нет: пересобрать файл и заменить `plane-window.riv`.
- Окно в 1.2 раза крупнее, чем в Figma: размеры в `PlaneWindow.module.css` заданы в `--u` (один пиксель Figma). Артборд Rive на 8 px шире окна с каждой стороны, чтобы не обрезалась тень рамы, поэтому canvas выступает за коробку окна на `8 × --u`.

Как обновить анимацию после правок в редакторе Rive:

```bash
~/.rive/bin/rive pull rive/project            # забрать изменения файла «Travel Animation»
~/.rive/bin/rive rive/project --publish       # собрать подписанный .riv (нужен rive login)
cp rive/project/build/project.riv src/assets/window/plane-window.riv
```

Скрипты в `.riv` должны быть подписаны: веб-рантайм Rive не запускает неподписанные скрипты, поэтому `--once` без входа не подойдёт.

Крыло взято из стоковой иллюстрации в Figma (фрейм «21414987_Airplane_window (1) 1», `948:62116`, слои 16–126 группы `group-R5`), выгружено в PNG 4× и переведено в серый `scripts/gray-wing.py`. Шторка, её тени и ход повторяют mikes.cv: форма и цвета со слоя шторки сайта, подъём 900 мс по easeInOutCubic из кода сайта.

## Шрифт

Inter Mbank (400 / 500 / 600) сабсетнут до латиницы, кириллицы и знаков (`src/assets/fonts`, по ~21 КБ на начертание). Это версия Inter (The Inter Project Authors) под SIL Open Font License 1.1, копирайт и текст лицензии лежат в метаданных каждого файла. Если в приложении шрифт уже подключён нативно, `styles/fonts.css` можно убрать.
