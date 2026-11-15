@echo off
chcp 65001 >nul
rem =====================================================================
rem  LỌ CHÉO - HŨ DƯA ĐẠI CHIẾN - Trình chạy cho Windows
rem  Đa ngôn ngữ: Tiếng Việt (gốc, có dấu) - English - 中文 - 日本語 - 한국어 - Español - Français
rem  Tự nhận theo %LOCHEO_LANG% hoặc mặc định Tiếng Việt.
rem  Nhấn đúp để mở menu tương tác nhiều màu có hoạt ảnh.
rem  Mọi chuỗi hiển thị viết ngoài dòng, cú pháp lệnh dùng ASCII thuần.
rem =====================================================================
setlocal EnableDelayedExpansion
cd /d "%~dp0.." || exit /b 1

rem ---------- Màu ANSI: chỉ bật khi chạy trong Windows Terminal / ANSICON / Git-bash ----------
if defined WT_SESSION set "USE_COLOR=1"
if defined ANSICON set "USE_COLOR=1"
if defined LOCHEO_FORCE_COLOR set "USE_COLOR=1"
if /i "%TERM%"=="xterm" set "USE_COLOR=1"
set "R=" & set "B=" & set "D="
set "GOLD=" & set "GOLD2=" & set "JADE=" & set "CHILI=" & set "PINK="
set "BRINE=" & set "GREEN=" & set "CYAN="
if defined USE_COLOR (
  set "R=[0m" & set "B=[1m" & set "D=[2m"
  set "GOLD=[38;5;220m" & set "GOLD2=[38;5;228m" & set "PINK=[38;5;218m" & set "JADE=[38;5;79m" & set "CHILI=[38;5;203m"
  set "BRINE=[38;5;159m" & set "GREEN=[38;5;114m" & set "CYAN=[38;5;116m"
)
set "VERSION=1.1.8"

rem ---------- Ngôn ngữ: LOCHEO_LANG=vi/en/zh/ja/ko/es/fr, mặc định vi ----------
set "UILANG=%LOCHEO_LANG%"
if "%UILANG%"=="" set "UILANG=vi"
goto menu

rem ---------- Bảng chuỗi đa ngôn ngữ: VI gốc - EN - ZH - JA - KO - ES - FR ----------
:T
set "TSTR=%~2"
if /i "%~1"=="title" (
  if /i "%UILANG%"=="vi" (set "TSTR=LỌ CHÉO - HŨ DƯA ĐẠI CHIẾN") else if /i "%UILANG%"=="en" (set "TSTR=LỌ CHÉO - PICKLED JAR SHOWDOWN") else if /i "%UILANG%"=="zh" (set "TSTR=LỌ CHÉO - 腌罐大乱斗") else if /i "%UILANG%"=="ja" (set "TSTR=LỌ CHÉO - 漬物壺大戦争") else if /i "%UILANG%"=="ko" (set "TSTR=LỌ CHÉO - 절임항아리 대격전") else if /i "%UILANG%"=="es" (set "TSTR=LỌ CHÉO - DUELO DE TARROS ENCURTIDOS") else if /i "%UILANG%"=="fr" (set "TSTR=LỌ CHÉO - LE DUEL DES BOCAUX") else (set "TSTR=LỌ CHÉO - HŨ DƯA ĐẠI CHIẾN")
  exit /b 0
)
if /i "%~1"=="subtitle" (
  if /i "%UILANG%"=="vi" (set "TSTR=TRÌNH CHẠY WINDOWS - chọn một mục rồi nhấn Enter") else if /i "%UILANG%"=="en" (set "TSTR=WINDOWS LAUNCHER - pick an option, then press Enter") else if /i "%UILANG%"=="zh" (set "TSTR=Windows 启动器 - 选择一项后按回车") else if /i "%UILANG%"=="ja" (set "TSTR=WINDOWS ランチャー - 項目を選んで Enter を押してください") else if /i "%UILANG%"=="ko" (set "TSTR=WINDOWS 런처 - 항목을 선택하고 Enter를 누르세요") else if /i "%UILANG%"=="es" (set "TSTR=LANZADOR WINDOWS - elige una opción y pulsa Enter") else if /i "%UILANG%"=="fr" (set "TSTR=LANCEUR WINDOWS - choisis une option puis appuie sur Entrée") else (set "TSTR=TRÌNH CHẠY WINDOWS - chọn một mục rồi nhấn Enter")
  exit /b 0
)
if /i "%~1"=="pick" (
  if /i "%UILANG%"=="vi" (set "TSTR=Lựa chọn của bạn") else if /i "%UILANG%"=="en" (set "TSTR=Your choice") else if /i "%UILANG%"=="zh" (set "TSTR=请选择") else if /i "%UILANG%"=="ja" (set "TSTR=選択してください") else if /i "%UILANG%"=="ko" (set "TSTR=선택하세요") else if /i "%UILANG%"=="es" (set "TSTR=Tu elección") else if /i "%UILANG%"=="fr" (set "TSTR=Ton choix") else (set "TSTR=Lựa chọn của bạn")
  exit /b 0
)
if /i "%~1"=="langhint" (
  if /i "%UILANG%"=="vi" (set "TSTR=L - đổi ngôn ngữ: VI/EN/中/日/한/ES/FR") else if /i "%UILANG%"=="en" (set "TSTR=L - switch language: VI/EN/中/日/한/ES/FR") else if /i "%UILANG%"=="zh" (set "TSTR=L - 切换语言: VI/EN/中/日/한/ES/FR") else if /i "%UILANG%"=="ja" (set "TSTR=L - 言語切替: VI/EN/中/日/한/ES/FR") else if /i "%UILANG%"=="ko" (set "TSTR=L - 언어 전환: VI/EN/中/日/한/ES/FR") else if /i "%UILANG%"=="es" (set "TSTR=L - cambiar idioma: VI/EN/中/日/한/ES/FR") else if /i "%UILANG%"=="fr" (set "TSTR=L - changer de langue: VI/EN/中/日/한/ES/FR") else (set "TSTR=L - đổi ngôn ngữ: VI/EN/中/日/한/ES/FR")
  exit /b 0
)
if /i "%~1"=="play" (
  if /i "%UILANG%"=="vi" (set "TSTR=Chơi ngay - build và mở game") else if /i "%UILANG%"=="en" (set "TSTR=Play now - build and open the game") else if /i "%UILANG%"=="zh" (set "TSTR=立即游玩 - 构建并打开游戏") else if /i "%UILANG%"=="ja" (set "TSTR=今すぐプレイ - ビルドしてゲームを開く") else if /i "%UILANG%"=="ko" (set "TSTR=바로 플레이 - 빌드 후 게임 열기") else if /i "%UILANG%"=="es" (set "TSTR=Jugar ahora - compilar y abrir el juego") else if /i "%UILANG%"=="fr" (set "TSTR=Jouer maintenant - compiler et ouvrir le jeu") else (set "TSTR=Chơi ngay - build và mở game")
  exit /b 0
)
if /i "%~1"=="dev" (
  if /i "%UILANG%"=="vi" (set "TSTR=Dev mode - server HMR tại localhost:5173") else if /i "%UILANG%"=="en" (set "TSTR=Dev mode - HMR server at localhost:5173") else if /i "%UILANG%"=="zh" (set "TSTR=开发模式 - localhost:5173 HMR 服务器") else if /i "%UILANG%"=="ja" (set "TSTR=開発モード - localhost:5173 の HMR サーバー") else if /i "%UILANG%"=="ko" (set "TSTR=개발 모드 - localhost:5173 HMR 서버") else if /i "%UILANG%"=="es" (set "TSTR=Modo dev - servidor HMR en localhost:5173") else if /i "%UILANG%"=="fr" (set "TSTR=Mode dev - serveur HMR sur localhost:5173") else (set "TSTR=Dev mode - server HMR tại localhost:5173")
  exit /b 0
)
if /i "%~1"=="build" (
  if /i "%UILANG%"=="vi" (set "TSTR=Build production - tạo dist/index.html") else if /i "%UILANG%"=="en" (set "TSTR=Build production - create dist/index.html") else if /i "%UILANG%"=="zh" (set "TSTR=构建正式版 - 生成 dist/index.html") else if /i "%UILANG%"=="ja" (set "TSTR=本番ビルド - dist/index.html を生成") else if /i "%UILANG%"=="ko" (set "TSTR=프로덕션 빌드 - dist/index.html 생성") else if /i "%UILANG%"=="es" (set "TSTR=Build de producción - crear dist/index.html") else if /i "%UILANG%"=="fr" (set "TSTR=Build de production - créer dist/index.html") else (set "TSTR=Build production - tạo dist/index.html")
  exit /b 0
)
if /i "%~1"=="test" (
  if /i "%UILANG%"=="vi" (set "TSTR=Chạy tests - vitest") else if /i "%UILANG%"=="en" (set "TSTR=Run tests - vitest") else if /i "%UILANG%"=="zh" (set "TSTR=运行测试 - vitest") else if /i "%UILANG%"=="ja" (set "TSTR=テストを実行 - vitest") else if /i "%UILANG%"=="ko" (set "TSTR=테스트 실행 - vitest") else if /i "%UILANG%"=="es" (set "TSTR=Ejecutar tests - vitest") else if /i "%UILANG%"=="fr" (set "TSTR=Lancer les tests - vitest") else (set "TSTR=Chạy tests - vitest")
  exit /b 0
)
if /i "%~1"=="check" (
  if /i "%UILANG%"=="vi" (set "TSTR=Kiểm tra toàn bộ - typecheck + tests + build") else if /i "%UILANG%"=="en" (set "TSTR=Full check - typecheck + tests + build") else if /i "%UILANG%"=="zh" (set "TSTR=全面检查 - typecheck + 测试 + 构建") else if /i "%UILANG%"=="ja" (set "TSTR=総合チェック - typecheck + テスト + ビルド") else if /i "%UILANG%"=="ko" (set "TSTR=전체 검사 - typecheck + 테스트 + 빌드") else if /i "%UILANG%"=="es" (set "TSTR=Comprobación total - typecheck + tests + build") else if /i "%UILANG%"=="fr" (set "TSTR=Vérification complète - typecheck + tests + build") else (set "TSTR=Kiểm tra toàn bộ - typecheck + tests + build")
  exit /b 0
)
if /i "%~1"=="install" (
  if /i "%UILANG%"=="vi" (set "TSTR=Cài đặt dependencies - npm install") else if /i "%UILANG%"=="en" (set "TSTR=Install dependencies - npm install") else if /i "%UILANG%"=="zh" (set "TSTR=安装依赖 - npm install") else if /i "%UILANG%"=="ja" (set "TSTR=依存関係をインストール - npm install") else if /i "%UILANG%"=="ko" (set "TSTR=의존성 설치 - npm install") else if /i "%UILANG%"=="es" (set "TSTR=Instalar dependencias - npm install") else if /i "%UILANG%"=="fr" (set "TSTR=Installer les dépendances - npm install") else (set "TSTR=Cài đặt dependencies - npm install")
  exit /b 0
)
if /i "%~1"=="clean" (
  if /i "%UILANG%"=="vi" (set "TSTR=Dọn dẹp - xoá node_modules/ và dist/") else if /i "%UILANG%"=="en" (set "TSTR=Clean up - remove node_modules/ and dist/") else if /i "%UILANG%"=="zh" (set "TSTR=清理 - 删除 node_modules/ 和 dist/") else if /i "%UILANG%"=="ja" (set "TSTR=クリーンアップ - node_modules/ と dist/ を削除") else if /i "%UILANG%"=="ko" (set "TSTR=정리 - node_modules/ 및 dist/ 삭제") else if /i "%UILANG%"=="es" (set "TSTR=Limpiar - borrar node_modules/ y dist/") else if /i "%UILANG%"=="fr" (set "TSTR=Nettoyer - supprimer node_modules/ et dist/") else (set "TSTR=Dọn dẹp - xoá node_modules/ và dist/")
  exit /b 0
)
if /i "%~1"=="info" (
  if /i "%UILANG%"=="vi" (set "TSTR=Thông tin và hướng dẫn") else if /i "%UILANG%"=="en" (set "TSTR=About and help") else if /i "%UILANG%"=="zh" (set "TSTR=关于与帮助") else if /i "%UILANG%"=="ja" (set "TSTR=情報とヘルプ") else if /i "%UILANG%"=="ko" (set "TSTR=정보 및 도움말") else if /i "%UILANG%"=="es" (set "TSTR=Información y ayuda") else if /i "%UILANG%"=="fr" (set "TSTR=Informations et aide") else (set "TSTR=Thông tin và hướng dẫn")
  exit /b 0
)
if /i "%~1"=="quit" (
  if /i "%UILANG%"=="vi" (set "TSTR=Thoát") else if /i "%UILANG%"=="en" (set "TSTR=Quit") else if /i "%UILANG%"=="zh" (set "TSTR=退出") else if /i "%UILANG%"=="ja" (set "TSTR=終了") else if /i "%UILANG%"=="ko" (set "TSTR=종료") else if /i "%UILANG%"=="es" (set "TSTR=Salir") else if /i "%UILANG%"=="fr" (set "TSTR=Quitter") else (set "TSTR=Thoát")
  exit /b 0
)
if /i "%~1"=="bye" (
  if /i "%UILANG%"=="vi" (set "TSTR=Hẹn gặp lại trong bếp!") else if /i "%UILANG%"=="en" (set "TSTR=See you in the kitchen!") else if /i "%UILANG%"=="zh" (set "TSTR=厨房见！") else if /i "%UILANG%"=="ja" (set "TSTR=また台所で！") else if /i "%UILANG%"=="ko" (set "TSTR=또 주방에서 만나요!") else if /i "%UILANG%"=="es" (set "TSTR=¡Nos vemos en la cocina!") else if /i "%UILANG%"=="fr" (set "TSTR=À la cuisine !") else (set "TSTR=Hẹn gặp lại trong bếp!")
  exit /b 0
)
if /i "%~1"=="badchoice" (
  if /i "%UILANG%"=="vi" (set "TSTR=Lựa chọn không hợp lệ.") else if /i "%UILANG%"=="en" (set "TSTR=Invalid choice.") else if /i "%UILANG%"=="zh" (set "TSTR=无效选择。") else if /i "%UILANG%"=="ja" (set "TSTR=無効な選択です。") else if /i "%UILANG%"=="ko" (set "TSTR=잘못된 선택입니다.") else if /i "%UILANG%"=="es" (set "TSTR=Opción no válida.") else if /i "%UILANG%"=="fr" (set "TSTR=Choix invalide.") else (set "TSTR=Lựa chọn không hợp lệ.")
  exit /b 0
)
if /i "%~1"=="pressenter" (
  if /i "%UILANG%"=="vi" (set "TSTR=Nhấn Enter để quay lại menu...") else if /i "%UILANG%"=="en" (set "TSTR=Press Enter to return to the menu...") else if /i "%UILANG%"=="zh" (set "TSTR=按回车返回菜单...") else if /i "%UILANG%"=="ja" (set "TSTR=Enter を押してメニューに戻る...") else if /i "%UILANG%"=="ko" (set "TSTR=Enter를 눌러 메뉴로 돌아가기...") else if /i "%UILANG%"=="es" (set "TSTR=Pulsa Enter para volver al menú...") else if /i "%UILANG%"=="fr" (set "TSTR=Appuie sur Entrée pour revenir au menu...") else (set "TSTR=Nhấn Enter để quay lại menu...")
  exit /b 0
)
if /i "%~1"=="nodiff" (
  if /i "%UILANG%"=="vi" (set "TSTR=Không tìm thấy Node.js / npm.") else if /i "%UILANG%"=="en" (set "TSTR=Node.js / npm not found.") else if /i "%UILANG%"=="zh" (set "TSTR=未找到 Node.js / npm。") else if /i "%UILANG%"=="ja" (set "TSTR=Node.js / npm が見つかりません。") else if /i "%UILANG%"=="ko" (set "TSTR=Node.js / npm을 찾을 수 없습니다.") else if /i "%UILANG%"=="es" (set "TSTR=Node.js / npm no encontrado.") else if /i "%UILANG%"=="fr" (set "TSTR=Node.js / npm introuvable.") else (set "TSTR=Không tìm thấy Node.js / npm.")
  exit /b 0
)
if /i "%~1"=="nodehint" (
  if /i "%UILANG%"=="vi" (set "TSTR=Cài Node LTS >= 20.19 rồi mở lại file này:") else if /i "%UILANG%"=="en" (set "TSTR=Install Node LTS >= 20.19, then reopen this file:") else if /i "%UILANG%"=="zh" (set "TSTR=请安装 Node LTS >= 20.19 后重新打开本文件:") else if /i "%UILANG%"=="ja" (set "TSTR=Node LTS >= 20.19 をインストールして、このファイルを開き直してください:") else if /i "%UILANG%"=="ko" (set "TSTR=Node LTS >= 20.19를 설치한 후 이 파일을 다시 여세요:") else if /i "%UILANG%"=="es" (set "TSTR=Instala Node LTS >= 20.19 y vuelve a abrir este archivo:") else if /i "%UILANG%"=="fr" (set "TSTR=Installe Node LTS >= 20.19 puis rouvre ce fichier :") else (set "TSTR=Cài Node LTS >= 20.19 rồi mở lại file này:")
  exit /b 0
)
if /i "%~1"=="nodeinstall" (
  if /i "%UILANG%"=="vi" (set "TSTR=winget install OpenJS.NodeJS.LTS  hoặc  https://nodejs.org") else if /i "%UILANG%"=="en" (set "TSTR=winget install OpenJS.NodeJS.LTS  or  https://nodejs.org") else if /i "%UILANG%"=="zh" (set "TSTR=winget install OpenJS.NodeJS.LTS  或  https://nodejs.org") else if /i "%UILANG%"=="ja" (set "TSTR=winget install OpenJS.NodeJS.LTS  または  https://nodejs.org") else if /i "%UILANG%"=="ko" (set "TSTR=winget install OpenJS.NodeJS.LTS  또는  https://nodejs.org") else if /i "%UILANG%"=="es" (set "TSTR=winget install OpenJS.NodeJS.LTS  o  https://nodejs.org") else if /i "%UILANG%"=="fr" (set "TSTR=winget install OpenJS.NodeJS.LTS  ou  https://nodejs.org") else (set "TSTR=winget install OpenJS.NodeJS.LTS  hoặc  https://nodejs.org")
  exit /b 0
)
if /i "%~1"=="firstinstall" (
  if /i "%UILANG%"=="vi" (set "TSTR=Chưa có node_modules - đang chạy npm install, chỉ lần đầu...") else if /i "%UILANG%"=="en" (set "TSTR=No node_modules yet - running npm install, first time only...") else if /i "%UILANG%"=="zh" (set "TSTR=尚无 node_modules - 正在 npm install, 仅首次...") else if /i "%UILANG%"=="ja" (set "TSTR=node_modules がありません - npm install を実行中, 初回のみ...") else if /i "%UILANG%"=="ko" (set "TSTR=node_modules가 없습니다 - npm install 실행 중, 최초 1회만...") else if /i "%UILANG%"=="es" (set "TSTR=Aún no hay node_modules - ejecutando npm install, solo la primera vez...") else if /i "%UILANG%"=="fr" (set "TSTR=Pas de node_modules - lancement de npm install, première fois uniquement...") else (set "TSTR=Chưa có node_modules - đang chạy npm install, chỉ lần đầu...")
  exit /b 0
)
if /i "%~1"=="buildstart" (
  if /i "%UILANG%"=="vi" (set "TSTR=Đang build bản production...") else if /i "%UILANG%"=="en" (set "TSTR=Building production...") else if /i "%UILANG%"=="zh" (set "TSTR=正在构建正式版...") else if /i "%UILANG%"=="ja" (set "TSTR=本番ビルド中...") else if /i "%UILANG%"=="ko" (set "TSTR=프로덕션 빌드 중...") else if /i "%UILANG%"=="es" (set "TSTR=Compilando producción...") else if /i "%UILANG%"=="fr" (set "TSTR=Compilation production...") else (set "TSTR=Đang build bản production...")
  exit /b 0
)
if /i "%~1"=="buildok" (
  if /i "%UILANG%"=="vi" (set "TSTR=Build xong - đang mở game.") else if /i "%UILANG%"=="en" (set "TSTR=Build complete - opening the game.") else if /i "%UILANG%"=="zh" (set "TSTR=构建完成 - 正在打开游戏.") else if /i "%UILANG%"=="ja" (set "TSTR=ビルド完了 - ゲームを開きます.") else if /i "%UILANG%"=="ko" (set "TSTR=빌드 완료 - 게임을 여는 중.") else if /i "%UILANG%"=="es" (set "TSTR=Compilación lista - abriendo el juego.") else if /i "%UILANG%"=="fr" (set "TSTR=Build terminé - ouverture du jeu.") else (set "TSTR=Build xong - đang mở game.")
  exit /b 0
)
if /i "%~1"=="buildfail" (
  if /i "%UILANG%"=="vi" (set "TSTR=Build thất bại. Xem log ở trên.") else if /i "%UILANG%"=="en" (set "TSTR=Build failed. See the log above.") else if /i "%UILANG%"=="zh" (set "TSTR=构建失败。请查看上方日志。") else if /i "%UILANG%"=="ja" (set "TSTR=ビルドに失敗しました. 上のログを確認してください.") else if /i "%UILANG%"=="ko" (set "TSTR=빌드 실패. 위의 로그를 확인하세요.") else if /i "%UILANG%"=="es" (set "TSTR=Falló la compilación. Revisa el log de arriba.") else if /i "%UILANG%"=="fr" (set "TSTR=Échec du build. Regarde le log ci-dessus.") else (set "TSTR=Build thất bại. Xem log ở trên.")
  exit /b 0
)
if /i "%~1"=="devextra" (
  if /i "%UILANG%"=="vi" (set "TSTR=Dev server HMR tại http://localhost:5173 - bấm Ctrl+C để dừng.") else if /i "%UILANG%"=="en" (set "TSTR=Dev server HMR at http://localhost:5173 - Ctrl+C to stop.") else if /i "%UILANG%"=="zh" (set "TSTR=开发服务器 HMR 运行于 http://localhost:5173 - 按 Ctrl+C 停止.") else if /i "%UILANG%"=="ja" (set "TSTR=開発サーバー HMR は http://localhost:5173 - Ctrl+C で停止.") else if /i "%UILANG%"=="ko" (set "TSTR=개발 서버 HMR: http://localhost:5173 - Ctrl+C로 중지.") else if /i "%UILANG%"=="es" (set "TSTR=Servidor dev HMR en http://localhost:5173 - Ctrl+C para detener.") else if /i "%UILANG%"=="fr" (set "TSTR=Serveur dev HMR sur http://localhost:5173 - Ctrl+C pour arrêter.") else (set "TSTR=Dev server HMR tại http://localhost:5173 - bấm Ctrl+C để dừng.")
  exit /b 0
)
if /i "%~1"=="checkok" (
  if /i "%UILANG%"=="vi" (set "TSTR=Mọi thứ đều xanh.") else if /i "%UILANG%"=="en" (set "TSTR=Everything is green.") else if /i "%UILANG%"=="zh" (set "TSTR=一切顺利.") else if /i "%UILANG%"=="ja" (set "TSTR=すべてグリーン.") else if /i "%UILANG%"=="ko" (set "TSTR=모든 항목 그린.") else if /i "%UILANG%"=="es" (set "TSTR=¡Todo en verde!") else if /i "%UILANG%"=="fr" (set "TSTR=Tout est vert !") else (set "TSTR=Mọi thứ đều xanh.")
  exit /b 0
)
if /i "%~1"=="installdone" (
  if /i "%UILANG%"=="vi" (set "TSTR=Dependencies đã cài xong.") else if /i "%UILANG%"=="en" (set "TSTR=Dependencies installed.") else if /i "%UILANG%"=="zh" (set "TSTR=依赖安装完成.") else if /i "%UILANG%"=="ja" (set "TSTR=依存関係のインストールが完了しました.") else if /i "%UILANG%"=="ko" (set "TSTR=의존성 설치 완료.") else if /i "%UILANG%"=="es" (set "TSTR=Dependencias instaladas.") else if /i "%UILANG%"=="fr" (set "TSTR=Dépendances installées.") else (set "TSTR=Dependencies đã cài xong.")
  exit /b 0
)
if /i "%~1"=="cleanknown" (
  if /i "%UILANG%"=="vi" (set "TSTR=Sẽ xoá node_modules/ và dist/, không xoá mã nguồn.") else if /i "%UILANG%"=="en" (set "TSTR=Deletes node_modules/ and dist/, source untouched.") else if /i "%UILANG%"=="zh" (set "TSTR=将删除 node_modules/ 和 dist/, 不会动源码.") else if /i "%UILANG%"=="ja" (set "TSTR=node_modules/ と dist/ を削除します, ソースはそのまま.") else if /i "%UILANG%"=="ko" (set "TSTR=node_modules/와 dist/를 삭제합니다. 소스는 그대로입니다.") else if /i "%UILANG%"=="es" (set "TSTR=Se borrarán node_modules/ y dist/, el código fuente no se toca.") else if /i "%UILANG%"=="fr" (set "TSTR=Supprime node_modules/ et dist/, le code source est intact.") else (set "TSTR=Sẽ xoá node_modules/ và dist/, không xoá mã nguồn.")
  exit /b 0
)
if /i "%~1"=="confirmdelete" (
  if /i "%UILANG%"=="vi" (set "TSTR=Gõ YES để xác nhận: ") else if /i "%UILANG%"=="en" (set "TSTR=Type YES to confirm: ") else if /i "%UILANG%"=="zh" (set "TSTR=输入 YES 确认: ") else if /i "%UILANG%"=="ja" (set "TSTR=確認のため YES と入力: ") else if /i "%UILANG%"=="ko" (set "TSTR=확인하려면 YES 입력: ") else if /i "%UILANG%"=="es" (set "TSTR=Escribe YES para confirmar: ") else if /i "%UILANG%"=="fr" (set "TSTR=Tape YES pour confirmer : ") else (set "TSTR=Gõ YES để xác nhận: ")
  exit /b 0
)
if /i "%~1"=="cleaned" (
  if /i "%UILANG%"=="vi" (set "TSTR=Đã dọn dẹp.") else if /i "%UILANG%"=="en" (set "TSTR=Cleaned.") else if /i "%UILANG%"=="zh" (set "TSTR=已清理。") else if /i "%UILANG%"=="ja" (set "TSTR=クリーンアップ完了.") else if /i "%UILANG%"=="ko" (set "TSTR=정리 완료.") else if /i "%UILANG%"=="es" (set "TSTR=Limpieza hecha.") else if /i "%UILANG%"=="fr" (set "TSTR=Nettoyé.") else (set "TSTR=Đã dọn dẹp.")
  exit /b 0
)
if /i "%~1"=="cancelled" (
  if /i "%UILANG%"=="vi" (set "TSTR=Đã huỷ.") else if /i "%UILANG%"=="en" (set "TSTR=Cancelled.") else if /i "%UILANG%"=="zh" (set "TSTR=已取消。") else if /i "%UILANG%"=="ja" (set "TSTR=キャンセルしました.") else if /i "%UILANG%"=="ko" (set "TSTR=취소되었습니다.") else if /i "%UILANG%"=="es" (set "TSTR=Cancelado.") else if /i "%UILANG%"=="fr" (set "TSTR=Annulé.") else (set "TSTR=Đã huỷ.")
  exit /b 0
)
if /i "%~1"=="info1" (
  if /i "%UILANG%"=="vi" (set "TSTR=Chơi ngay: build dist/index.html rồi mở bằng trình duyệt.") else if /i "%UILANG%"=="en" (set "TSTR=Play: build dist/index.html and open it in the browser.") else if /i "%UILANG%"=="zh" (set "TSTR=游玩: 构建 dist/index.html 后打开即可.") else if /i "%UILANG%"=="ja" (set "TSTR=プレイ: dist/index.html をビルドしてブラウザで開く.") else if /i "%UILANG%"=="ko" (set "TSTR=플레이: dist/index.html 빌드 후 브라우저로 열기.") else if /i "%UILANG%"=="es" (set "TSTR=Jugar: compila dist/index.html y ábrelo en el navegador.") else if /i "%UILANG%"=="fr" (set "TSTR=Jouer : compile dist/index.html et ouvre-le.") else (set "TSTR=Chơi ngay: build dist/index.html rồi mở bằng trình duyệt.")
  exit /b 0
)
if /i "%~1"=="info2" (
  if /i "%UILANG%"=="vi" (set "TSTR=Dev: Vite HMR, sửa code thấy ngay. Cần Node >= 20.19.") else if /i "%UILANG%"=="en" (set "TSTR=Dev: Vite HMR, instant feedback. Needs Node >= 20.19.") else if /i "%UILANG%"=="zh" (set "TSTR=开发: Vite HMR 即时热更新。需要 Node >= 20.19。") else if /i "%UILANG%"=="ja" (set "TSTR=開発: Vite HMR で即時反映. Node >= 20.19 が必要.") else if /i "%UILANG%"=="ko" (set "TSTR=개발: Vite HMR 즉시 반영. Node >= 20.19 필요.") else if /i "%UILANG%"=="es" (set "TSTR=Dev: Vite HMR, cambios al instante. Requiere Node >= 20.19.") else if /i "%UILANG%"=="fr" (set "TSTR=Dev : Vite HMR, changements instantanés. Node >= 20.19 requis.") else (set "TSTR=Dev: Vite HMR, sửa code thấy ngay. Cần Node >= 20.19.")
  exit /b 0
)
if /i "%~1"=="info3" (
  if /i "%UILANG%"=="vi" (set "TSTR=Dữ liệu lưu cục bộ: điểm và thành tựu, không gửi đi đâu. localStorage.") else if /i "%UILANG%"=="en" (set "TSTR=Data stays local: scores and achievements, never sent anywhere. localStorage.") else if /i "%UILANG%"=="zh" (set "TSTR=数据均存于本地: 分数和成就, 绝不上传. localStorage.") else if /i "%UILANG%"=="ja" (set "TSTR=データはローカル保存: スコアと実績, 送信されません. localStorage.") else if /i "%UILANG%"=="ko" (set "TSTR=데이터는 로컬 저장: 점수와 업적, 어디로도 전송되지 않습니다. localStorage.") else if /i "%UILANG%"=="es" (set "TSTR=Los datos son locales: puntos y logros, nunca se envían a ningún sitio. localStorage.") else if /i "%UILANG%"=="fr" (set "TSTR=Données locales : scores et succès, jamais envoyés. localStorage.") else (set "TSTR=Dữ liệu lưu cục bộ: điểm và thành tựu, không gửi đi đâu. localStorage.")
  exit /b 0
)
if /i "%~1"=="author" (
  if /i "%UILANG%"=="vi" (set "TSTR=Tác giả: Standardize Paradigm [standardizeparadigm@donuco.com]") else if /i "%UILANG%"=="en" (set "TSTR=Author: Standardize Paradigm [standardizeparadigm@donuco.com]") else if /i "%UILANG%"=="zh" (set "TSTR=作者: Standardize Paradigm [standardizeparadigm@donuco.com]") else if /i "%UILANG%"=="ja" (set "TSTR=作者: Standardize Paradigm [standardizeparadigm@donuco.com]") else if /i "%UILANG%"=="ko" (set "TSTR=저자: Standardize Paradigm [standardizeparadigm@donuco.com]") else if /i "%UILANG%"=="es" (set "TSTR=Autor: Standardize Paradigm [standardizeparadigm@donuco.com]") else if /i "%UILANG%"=="fr" (set "TSTR=Auteur : Standardize Paradigm [standardizeparadigm@donuco.com]") else (set "TSTR=Tác giả: Standardize Paradigm [standardizeparadigm@donuco.com]")
  exit /b 0
)
if /i "%~1"=="license" (
  if /i "%UILANG%"=="vi" (set "TSTR=Arcade muối dưa offline-first - AGPL-3.0-only") else if /i "%UILANG%"=="en" (set "TSTR=Offline-first pickle arcade - AGPL-3.0-only") else if /i "%UILANG%"=="zh" (set "TSTR=离线优先腌菜街机 - AGPL-3.0-only") else if /i "%UILANG%"=="ja" (set "TSTR=オフライン・ピックルアーケード - AGPL-3.0-only") else if /i "%UILANG%"=="ko" (set "TSTR=오프라인 피클 아케이드 - AGPL-3.0-only") else if /i "%UILANG%"=="es" (set "TSTR=Arcade de encurtidos offline-first - AGPL-3.0-only") else if /i "%UILANG%"=="fr" (set "TSTR=Arcade de pickles offline-first - AGPL-3.0-only") else (set "TSTR=Arcade muối dưa offline-first - AGPL-3.0-only")
  exit /b 0
)
set "TSTR=%~1"
exit /b 0

:pause_menu
call :T pressenter
set /p "_=%D%!TSTR!%R%"
exit /b 0

:neednode
where node >nul 2>nul || goto NONODE
where npm >nul 2>nul || goto NONODE
exit /b 0
:NONODE
call :T nodiff & echo %CHILI%!TSTR!%R%
call :T nodehint & echo %BRINE%!TSTR!%R%
call :T nodeinstall & echo %GOLD%!TSTR!%R%
call :pause_menu
exit /b 1

:ensuredeps
if not exist node_modules (
  call :T firstinstall & echo %CYAN%!TSTR!%R%
  call npm install || ( echo %CHILI%npm install failed.%R% & call :pause_menu & exit /b 1 )
)
exit /b 0

:play
call :neednode || goto menu
call :ensuredeps || goto menu
call :T buildstart & echo %GOLD%!TSTR!%R%
call npm run build
if errorlevel 1 ( call :T buildfail & echo %CHILI%!TSTR!%R% & call :pause_menu & goto menu )
call :T buildok & echo %GREEN%!TSTR!%R%
start "" "dist\index.html"
call :pause_menu
goto menu

:dev
call :neednode || goto menu
call :ensuredeps || goto menu
call :T devextra & echo %GOLD%!TSTR!%R%
call npm run dev
call :pause_menu
goto menu

:build
call :neednode || goto menu
call :ensuredeps || goto menu
call :T buildstart & echo %GOLD%!TSTR!%R%
call npm run build && echo %GREEN%dist/index.html%R%
call :pause_menu
goto menu

:test
call :neednode || goto menu
call :ensuredeps || goto menu
call npm run test
call :pause_menu
goto menu

:checkall
call :neednode || goto menu
call :ensuredeps || goto menu
call npm run check
if not errorlevel 1 ( call :T checkok & echo %GREEN%!TSTR!%R% )
call :pause_menu
goto menu

:install
call :neednode || goto menu
call npm install
if not errorlevel 1 ( call :T installdone & echo %GREEN%!TSTR!%R% )
call :pause_menu
goto menu

:clean
call :T cleanknown & echo %CHILI%!TSTR!%R%
call :T confirmdelete & set /p "YN=%CHILI%!TSTR!%R%"
if /i "%YN%"=="YES" ( rmdir /s /q node_modules dist 2>nul & call :T cleaned & echo %GREEN%!TSTR!%R% ) else ( call :T cancelled & echo %D%!TSTR!%R% )
call :pause_menu
goto menu

:info
echo %BRINE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%R%
call :T title & echo %GOLD%%B% !TSTR!  v%VERSION% %R%
call :T license & echo %BRINE% !TSTR!%R%
call :T author & echo %BRINE% !TSTR!%R%
echo %BRINE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%R%
call :T info1 & echo %CYAN%!TSTR!%R%
call :T info2 & echo %CYAN%!TSTR!%R%
call :T info3 & echo %CYAN%!TSTR!%R%
call :pause_menu
goto menu

:menu
cls
call :T title
echo %GOLD%%B%╔════════════════════════════════════════════╗%R%
echo %GOLD%%B%║  🫙  !TSTR!  v%VERSION%  ║%R%
echo %GOLD%%B%╚════════════════════════════════════════════╝%R%
ping -n 1 -w 70 127.0.0.1 >nul
cls
echo %GOLD2%%B%╔════════════════════════════════════════════╗%R%
echo %GOLD2%%B%║  🫙  !TSTR!  v%VERSION%  ║%R%
echo %GOLD2%%B%╚════════════════════════════════════════════╝%R%
ping -n 1 -w 70 127.0.0.1 >nul
cls
echo %PINK%%B%╔════════════════════════════════════════════╗%R%
echo %PINK%%B%║  🫙  !TSTR!  v%VERSION%  ║%R%
echo %PINK%%B%╚════════════════════════════════════════════╝%R%
call :T subtitle & echo %JADE%  !TSTR!%R%
echo.
call :T play   & echo %GOLD%  1)%R% !TSTR!
call :T dev    & echo %GOLD%  2)%R% !TSTR!
call :T build  & echo %GOLD%  3)%R% !TSTR!
call :T test   & echo %GOLD%  4)%R% !TSTR!
call :T check  & echo %GOLD%  5)%R% !TSTR!
call :T install& echo %GOLD%  6)%R% !TSTR!
call :T clean  & echo %GOLD%  7)%R% !TSTR!
call :T info   & echo %GOLD%  8)%R% !TSTR!
call :T quit   & echo %GOLD%  0)%R% !TSTR!
call :T langhint
echo %D%     !TSTR!%R%
echo %D%  ✦ ·˚ ·✦ ·˚ ·✦ ·˚ ·✦ ·˚ ·✦ ·˚ ·✦ ·˚ ·✦ ·˚ ·✦  %R%
echo.
call :T pick & set /p "opt=%BRINE%!TSTR!: %R%"
if "%opt%"=="1" goto play
if "%opt%"=="2" goto dev
if "%opt%"=="3" goto build
if "%opt%"=="4" goto test
if "%opt%"=="5" goto checkall
if "%opt%"=="6" goto install
if "%opt%"=="7" goto clean
if "%opt%"=="8" goto info
if /i "%opt%"=="L" (
  if /i "%UILANG%"=="vi" (set "UILANG=en") else if /i "%UILANG%"=="en" (set "UILANG=zh") else if /i "%UILANG%"=="zh" (set "UILANG=ja") else if /i "%UILANG%"=="ja" (set "UILANG=ko") else if /i "%UILANG%"=="ko" (set "UILANG=es") else if /i "%UILANG%"=="es" (set "UILANG=fr") else (set "UILANG=vi")
  goto menu
)
if "%opt%"=="0" goto bye
call :T badchoice & echo %CHILI%!TSTR!%R%
call :pause_menu
goto menu

:bye
call :T bye & echo %GOLD%!TSTR!%R%
exit /b 0
