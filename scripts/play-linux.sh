#!/bin/bash
# =====================================================================
#  LỌ CHÉO — HŨ DƯA ĐẠI CHIẾN · Trình chạy cho Linux
#  ─────────────────────────────────────────────────────────────────
#  • Đa ngôn ngữ: Tiếng Việt (gốc, có dấu) · English · 中文 · 日本語 · 한국어 · Español · Français
#  • Tự nhận ngôn ngữ theo locale (mặc định Tiếng Việt), đổi trong menu bằng phím L
#  • Nhấn đúp (double-click) file này để mở Terminal và hiện menu tương tác
#    nhiều màu, có hoạt ảnh (banner nhấp nháy + spinner tiến trình). Không cần gõ lệnh nào.
# =====================================================================
set -u
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" || exit 1

# ---------- màu sắc ----------
if [ -t 1 ]; then
  R='\033[0m'; B='\033[1m'; D='\033[2m'
  GOLD='\033[38;5;220m'; GOLD2='\033[38;5;228m'; JADE='\033[38;5;79m'; CHILI='\033[38;5;203m'
  BRINE='\033[38;5;159m'; GREEN='\033[38;5;114m'; RED='\033[38;5;203m'; CYAN='\033[38;5;116m'; PINK='\033[38;5;218m'
else
  R=''; B=''; D=''; GOLD=''; GOLD2=''; JADE=''; CHILI=''; BRINE=''; GREEN=''; RED=''; CYAN=''; PINK=''
fi
VERSION="1.1.8"

# ---------- ngôn ngữ giao diện (VI gốc · EN · ZH · JA · KO · ES · FR) ----------
UI_LANG="${LOCHEO_LANG:-}"
if [ -z "$UI_LANG" ]; then
  case "${LC_ALL:-${LC_MESSAGES:-${LANG:-vi}}}" in
    vi*|VI*) UI_LANG=vi ;;
    zh*|ZH*) UI_LANG=zh ;;
    ja*|JA*) UI_LANG=ja ;;
    ko*|KO*) UI_LANG=ko ;;
    es*|ES*) UI_LANG=es ;;
    fr*|FR*) UI_LANG=fr ;;
    en*|EN*) UI_LANG=en ;;
    *)       UI_LANG=vi ;;   # gốc: Tiếng Việt
  esac
fi

# Chuỗi theo ngôn ngữ:  T <khóa>
T() {
  case "$UI_LANG:$1" in
    vi:author)        printf 'Tác giả: Standardize Paradigm <standardizeparadigm@donuco.com>' ;;
    en:author)        printf 'Author: Standardize Paradigm <standardizeparadigm@donuco.com>' ;;
    zh:author)        printf '作者：Standardize Paradigm <standardizeparadigm@donuco.com>' ;;
    ja:author)        printf '作者：Standardize Paradigm <standardizeparadigm@donuco.com>' ;;
    ko:author)        printf '저자: Standardize Paradigm <standardizeparadigm@donuco.com>' ;;
    es:author)        printf 'Autor: Standardize Paradigm <standardizeparadigm@donuco.com>' ;;
    fr:author)        printf 'Auteur : Standardize Paradigm <standardizeparadigm@donuco.com>' ;;
    vi:badchoice)     printf 'Lựa chọn không hợp lệ.' ;;
    en:badchoice)     printf 'Invalid choice.' ;;
    zh:badchoice)     printf '无效选择。' ;;
    ja:badchoice)     printf '無効な選択です。' ;;
    ko:badchoice)     printf '잘못된 선택입니다.' ;;
    es:badchoice)     printf 'Opción no válida.' ;;
    fr:badchoice)     printf 'Choix invalide.' ;;
    vi:build)         printf 'Build production — tạo dist/index.html' ;;
    en:build)         printf 'Build production — create dist/index.html' ;;
    zh:build)         printf '构建正式版 — 生成 dist/index.html' ;;
    ja:build)         printf '本番ビルド — dist/index.html を生成' ;;
    ko:build)         printf '프로덕션 빌드 — dist/index.html 생성' ;;
    es:build)         printf 'Build de producción — crear dist/index.html' ;;
    fr:build)         printf 'Build de production — créer dist/index.html' ;;
    vi:buildfail)     printf '✖ Build thất bại. Xem log ở trên.' ;;
    en:buildfail)     printf '✖ Build failed. See the log above.' ;;
    zh:buildfail)     printf '✖ 构建失败。请查看上方日志。' ;;
    ja:buildfail)     printf '✖ ビルドに失敗しました。上のログを確認してください。' ;;
    ko:buildfail)     printf '✖ 빌드 실패. 위의 로그를 확인하세요.' ;;
    es:buildfail)     printf '✖ Falló la compilación. Revisa el log de arriba.' ;;
    fr:buildfail)     printf '✖ Échec du build. Regarde le log ci-dessus.' ;;
    vi:buildok)       printf '✔ Build xong — đang mở game…' ;;
    en:buildok)       printf '✔ Build complete — opening the game…' ;;
    zh:buildok)       printf '✔ 构建完成 — 正在打开游戏…' ;;
    ja:buildok)       printf '✔ ビルド完了 — ゲームを開きます…' ;;
    ko:buildok)       printf '✔ 빌드 완료 — 게임을 여는 중…' ;;
    es:buildok)       printf '✔ Compilación lista — abriendo el juego…' ;;
    fr:buildok)       printf '✔ Build terminé — ouverture du jeu…' ;;
    vi:buildstart)    printf '→ Đang build bản production…' ;;
    en:buildstart)    printf '→ Building production…' ;;
    zh:buildstart)    printf '→ 正在构建正式版…' ;;
    ja:buildstart)    printf '→ 本番ビルド中…' ;;
    ko:buildstart)    printf '→ 프로덕션 빌드 중…' ;;
    es:buildstart)    printf '→ Compilando producción…' ;;
    fr:buildstart)    printf '→ Compilation production…' ;;
    vi:bye)           printf 'Hẹn gặp lại trong bếp! 🫙' ;;
    en:bye)           printf 'See you in the kitchen! 🫙' ;;
    zh:bye)           printf '厨房见！🫙' ;;
    ja:bye)           printf 'また台所で！🫙' ;;
    ko:bye)           printf '또 주방에서 만나요! 🫙' ;;
    es:bye)           printf '¡Nos vemos en la cocina! 🫙' ;;
    fr:bye)           printf 'À la cuisine ! 🫙' ;;
    vi:cancelled)     printf 'Đã huỷ.' ;;
    en:cancelled)     printf 'Cancelled.' ;;
    zh:cancelled)     printf '已取消。' ;;
    ja:cancelled)     printf 'キャンセルしました。' ;;
    ko:cancelled)     printf '취소되었습니다.' ;;
    es:cancelled)     printf 'Cancelado.' ;;
    fr:cancelled)     printf 'Annulé.' ;;
    vi:check)         printf 'Kiểm tra toàn bộ — typecheck + tests + build' ;;
    en:check)         printf 'Full check — typecheck + tests + build' ;;
    zh:check)         printf '全面检查 — typecheck + 测试 + 构建' ;;
    ja:check)         printf '総合チェック — typecheck + テスト + ビルド' ;;
    ko:check)         printf '전체 검사 — typecheck + 테스트 + 빌드' ;;
    es:check)         printf 'Comprobación total — typecheck + tests + build' ;;
    fr:check)         printf 'Vérification complète — typecheck + tests + build' ;;
    vi:checkok)       printf '✔ Mọi thứ xanh!' ;;
    en:checkok)       printf '✔ Everything is green!' ;;
    zh:checkok)       printf '✔ 一切顺利！' ;;
    ja:checkok)       printf '✔ すべてグリーン！' ;;
    ko:checkok)       printf '✔ 모두 그린!' ;;
    es:checkok)       printf '✔ ¡Todo en verde!' ;;
    fr:checkok)       printf '✔ Tout est vert !' ;;
    vi:clean)         printf 'Dọn dẹp — xoá node_modules/ và dist/' ;;
    en:clean)         printf 'Clean up — remove node_modules/ and dist/' ;;
    zh:clean)         printf '清理 — 删除 node_modules/ 和 dist/' ;;
    ja:clean)         printf 'クリーンアップ — node_modules/ と dist/ を削除' ;;
    ko:clean)         printf '정리 — node_modules/ 및 dist/ 삭제' ;;
    es:clean)         printf 'Limpiar — borrar node_modules/ y dist/' ;;
    fr:clean)         printf 'Nettoyer — supprimer node_modules/ et dist/' ;;
    vi:cleaned)       printf '✔ Đã dọn dẹp.' ;;
    en:cleaned)       printf '✔ Cleaned.' ;;
    zh:cleaned)       printf '✔ 已清理。' ;;
    ja:cleaned)       printf '✔ クリーンアップ完了。' ;;
    ko:cleaned)       printf '✔ 정리 완료.' ;;
    es:cleaned)       printf '✔ Limpieza hecha.' ;;
    fr:cleaned)       printf '✔ Nettoyé.' ;;
    vi:cleanknown)    printf '⚠ Sẽ xoá node_modules/ và dist/ (không xoá mã nguồn).' ;;
    en:cleanknown)    printf '⚠ This will delete node_modules/ and dist/ (source untouched).' ;;
    zh:cleanknown)    printf '⚠ 将删除 node_modules/ 和 dist/（不会动源码）。' ;;
    ja:cleanknown)    printf '⚠ node_modules/ と dist/ を削除します（ソースはそのまま）。' ;;
    ko:cleanknown)    printf '⚠ node_modules/와 dist/를 삭제합니다(소스는 그대로).' ;;
    es:cleanknown)    printf '⚠ Se borrarán node_modules/ y dist/ (el código fuente no se toca).' ;;
    fr:cleanknown)    printf '⚠ Supprime node_modules/ et dist/ (le code source est intact).' ;;
    vi:confirmdelete) printf 'Gõ YES để xác nhận: ' ;;
    en:confirmdelete) printf 'Type YES to confirm: ' ;;
    zh:confirmdelete) printf '输入 YES 确认：' ;;
    ja:confirmdelete) printf '確認のため YES と入力: ' ;;
    ko:confirmdelete) printf '확인하려면 YES 입력: ' ;;
    es:confirmdelete) printf 'Escribe YES para confirmar: ' ;;
    fr:confirmdelete) printf 'Tape YES pour confirmer : ' ;;
    vi:dev)           printf 'Dev mode — server HMR tại localhost:5173' ;;
    en:dev)           printf 'Dev mode — HMR server at localhost:5173' ;;
    zh:dev)           printf '开发模式 — localhost:5173 HMR 服务器' ;;
    ja:dev)           printf '開発モード — localhost:5173 の HMR サーバー' ;;
    ko:dev)           printf '개발 모드 — localhost:5173 HMR 서버' ;;
    es:dev)           printf 'Modo dev — servidor HMR en localhost:5173' ;;
    fr:dev)           printf 'Mode dev — serveur HMR sur localhost:5173' ;;
    vi:devextra)      printf 'Dev server (HMR) tại http://localhost:5173 — bấm Ctrl+C để dừng.' ;;
    en:devextra)      printf 'Dev server (HMR) at http://localhost:5173 — Ctrl+C to stop.' ;;
    zh:devextra)      printf '开发服务器 (HMR) 运行于 http://localhost:5173 — 按 Ctrl+C 停止。' ;;
    ja:devextra)      printf '開発サーバー (HMR) は http://localhost:5173 — Ctrl+C で停止。' ;;
    ko:devextra)      printf '개발 서버 (HMR): http://localhost:5173 — Ctrl+C로 중지.' ;;
    es:devextra)      printf 'Servidor dev (HMR) en http://localhost:5173 — Ctrl+C para detener.' ;;
    fr:devextra)      printf 'Serveur dev (HMR) sur http://localhost:5173 — Ctrl+C pour arrêter.' ;;
    vi:firstinstall)  printf '→ Chưa có node_modules — đang chạy npm install (chỉ lần đầu)…' ;;
    en:firstinstall)  printf '→ No node_modules yet — running npm install (first time only)…' ;;
    zh:firstinstall)  printf '→ 尚无 node_modules — 正在 npm install（仅首次）…' ;;
    ja:firstinstall)  printf '→ node_modules がありません — npm install を実行中（初回のみ）…' ;;
    ko:firstinstall)  printf '→ node_modules가 없습니다 — npm install 실행 중(최초 1회만)…' ;;
    es:firstinstall)  printf '→ Aún no hay node_modules — ejecutando npm install (solo la primera vez)…' ;;
    fr:firstinstall)  printf '→ Pas de node_modules — lancement de npm install (première fois uniquement)…' ;;
    vi:info)          printf 'Thông tin & hướng dẫn' ;;
    en:info)          printf 'About & help' ;;
    zh:info)          printf '关于与帮助' ;;
    ja:info)          printf '情報とヘルプ' ;;
    ko:info)          printf '정보 및 도움말' ;;
    es:info)          printf 'Información y ayuda' ;;
    fr:info)          printf 'Informations et aide' ;;
    vi:info1)         printf '• Chơi ngay: build file tự chứa dist/index.html rồi mở bằng trình duyệt.' ;;
    en:info1)         printf '• Play: build the self-contained dist/index.html and open it.' ;;
    zh:info1)         printf '• 游玩：构建独立 dist/index.html 后打开即可。' ;;
    ja:info1)         printf '• プレイ：自己完結の dist/index.html をビルドして開くだけ。' ;;
    ko:info1)         printf '• 플레이: 자체 완결형 dist/index.html 빌드 후 브라우저로 열기.' ;;
    es:info1)         printf '• Jugar: compila el dist/index.html autónomo y ábrelo en el navegador.' ;;
    fr:info1)         printf '• Jouer : compile le dist/index.html autonome et ouvre-le.' ;;
    vi:info2)         printf '• Dev: Vite HMR, sửa code thấy ngay. Cần Node ≥ 20.19.' ;;
    en:info2)         printf '• Dev: Vite HMR, instant feedback. Needs Node ≥ 20.19.' ;;
    zh:info2)         printf '• 开发：Vite HMR 即时热更新。需要 Node ≥ 20.19。' ;;
    ja:info2)         printf '• 開発：Vite HMR で即時反映。Node ≥ 20.19 が必要。' ;;
    ko:info2)         printf '• 개발: Vite HMR 즉시 반영. Node ≥ 20.19 필요.' ;;
    es:info2)         printf '• Dev: Vite HMR, cambios al instante. Requiere Node ≥ 20.19.' ;;
    fr:info2)         printf '• Dev : Vite HMR, changements instantanés. Node ≥ 20.19 requis.' ;;
    vi:info3)         printf '• Dữ liệu lưu cục bộ: điểm/thành tựu (localStorage), không gửi đi đâu.' ;;
    en:info3)         printf '• Data is local: scores/achievements (localStorage), never sent anywhere.' ;;
    zh:info3)         printf '• 数据均存于本地：分数/成就（localStorage），绝不上传。' ;;
    ja:info3)         printf '• データはローカル保存：スコア/実績（localStorage）、送信されません。' ;;
    ko:info3)         printf '• 데이터는 로컬 저장: 점수/업적(localStorage), 어디로도 전송되지 않습니다.' ;;
    es:info3)         printf '• Los datos son locales: puntos/logros (localStorage), nunca se envían a ningún sitio.' ;;
    fr:info3)         printf '• Données locales : scores/succès (localStorage), jamais envoyés.' ;;
    vi:install)       printf 'Cài đặt dependencies — npm install' ;;
    en:install)       printf 'Install dependencies — npm install' ;;
    zh:install)       printf '安装依赖 — npm install' ;;
    ja:install)       printf '依存関係をインストール — npm install' ;;
    ko:install)       printf '의존성 설치 — npm install' ;;
    es:install)       printf 'Instalar dependencias — npm install' ;;
    fr:install)       printf 'Installer les dépendances — npm install' ;;
    vi:installdone)   printf '✔ Dependencies đã cài xong.' ;;
    en:installdone)   printf '✔ Dependencies installed.' ;;
    zh:installdone)   printf '✔ 依赖安装完成。' ;;
    ja:installdone)   printf '✔ 依存関係のインストールが完了しました。' ;;
    ko:installdone)   printf '✔ 의존성 설치 완료.' ;;
    es:installdone)   printf '✔ Dependencias instaladas.' ;;
    fr:installdone)   printf '✔ Dépendances installées.' ;;
    vi:langhint)      printf 'L — đổi ngôn ngữ (VI/EN/中/日/한/ES/FR)' ;;
    en:langhint)      printf 'L — switch language (VI/EN/中/日/한/ES/FR)' ;;
    zh:langhint)      printf 'L — 切换语言（VI/EN/中/日/한/ES/FR）' ;;
    ja:langhint)      printf 'L — 言語切替（VI/EN/中/日/한/ES/FR）' ;;
    ko:langhint)      printf 'L — 언어 전환 (VI/EN/中/日/한/ES/FR)' ;;
    es:langhint)      printf 'L — cambiar idioma (VI/EN/中/日/한/ES/FR)' ;;
    fr:langhint)      printf 'L — changer de langue (VI/EN/中/日/한/ES/FR)' ;;
    vi:license)       printf 'Arcade muối dưa offline-first · AGPL-3.0-only' ;;
    en:license)       printf 'Offline-first pickle arcade · AGPL-3.0-only' ;;
    zh:license)       printf '离线优先腌菜街机 · AGPL-3.0-only' ;;
    ja:license)       printf 'オフライン・ピックルアーケード · AGPL-3.0-only' ;;
    ko:license)       printf '오프라인 피클 아케이드 · AGPL-3.0-only' ;;
    es:license)       printf 'Arcade de encurtidos offline-first · AGPL-3.0-only' ;;
    fr:license)       printf 'Arcade de pickles offline-first · AGPL-3.0-only' ;;
    vi:nodehint)      printf 'Cài Node LTS (≥ 20.19) rồi mở lại file này:' ;;
    en:nodehint)      printf 'Install Node LTS (≥ 20.19), then reopen this file:' ;;
    zh:nodehint)      printf '请安装 Node LTS（≥ 20.19）后重新打开本文件：' ;;
    ja:nodehint)      printf 'Node LTS (≥ 20.19) をインストールして、このファイルを開き直してください:' ;;
    ko:nodehint)      printf 'Node LTS (≥ 20.19)를 설치한 후 이 파일을 다시 여세요:' ;;
    es:nodehint)      printf 'Instala Node LTS (≥ 20.19) y vuelve a abrir este archivo:' ;;
    fr:nodehint)      printf 'Installe Node LTS (≥ 20.19) puis rouvre ce fichier :' ;;
    vi:nodiff)        printf '✖ Không tìm thấy Node.js / npm.' ;;
    en:nodiff)        printf '✖ Node.js / npm not found.' ;;
    zh:nodiff)        printf '✖ 未找到 Node.js / npm。' ;;
    ja:nodiff)        printf '✖ Node.js / npm が見つかりません。' ;;
    ko:nodiff)        printf '✖ Node.js / npm을 찾을 수 없습니다.' ;;
    es:nodiff)        printf '✖ Node.js / npm no encontrado.' ;;
    fr:nodiff)        printf '✖ Node.js / npm introuvable.' ;;
    vi:pick)          printf '➜ Lựa chọn của bạn' ;;
    en:pick)          printf '➜ Your choice' ;;
    zh:pick)          printf '➜ 请选择' ;;
    ja:pick)          printf '➜ 選択してください' ;;
    ko:pick)          printf '➜ 선택하세요' ;;
    es:pick)          printf '➜ Tu elección' ;;
    fr:pick)          printf '➜ Ton choix' ;;
    vi:play)          printf 'Chơi ngay (Production) — build + mở game' ;;
    en:play)          printf 'Play now (Production) — build + open game' ;;
    zh:play)          printf '立即游玩（正式版）— 构建并打开游戏' ;;
    ja:play)          printf '今すぐプレイ（本番）— ビルドしてゲームを開く' ;;
    ko:play)          printf '바로 플레이(프로덕션) — 빌드 후 게임 열기' ;;
    es:play)          printf 'Jugar ahora (producción) — compilar y abrir el juego' ;;
    fr:play)          printf 'Jouer maintenant (production) — compiler et ouvrir le jeu' ;;
    vi:pressenter)    printf 'Nhấn Enter để quay lại menu…' ;;
    en:pressenter)    printf 'Press Enter to return to the menu…' ;;
    zh:pressenter)    printf '按回车返回菜单…' ;;
    ja:pressenter)    printf 'Enter を押してメニューに戻る…' ;;
    ko:pressenter)    printf 'Enter를 눌러 메뉴로 돌아가기…' ;;
    es:pressenter)    printf 'Pulsa Enter para volver al menú…' ;;
    fr:pressenter)    printf 'Appuie sur Entrée pour revenir au menu…' ;;
    vi:quit)          printf 'Thoát' ;;
    en:quit)          printf 'Quit' ;;
    zh:quit)          printf '退出' ;;
    ja:quit)          printf '終了' ;;
    ko:quit)          printf '종료' ;;
    es:quit)          printf 'Salir' ;;
    fr:quit)          printf 'Quitter' ;;
    vi:test)          printf 'Chạy tests — vitest' ;;
    en:test)          printf 'Run tests — vitest' ;;
    zh:test)          printf '运行测试 — vitest' ;;
    ja:test)          printf 'テストを実行 — vitest' ;;
    ko:test)          printf '테스트 실행 — vitest' ;;
    es:test)          printf 'Ejecutar tests — vitest' ;;
    fr:test)          printf 'Lancer les tests — vitest' ;;
    vi:title)         printf 'LỌ CHÉO — HŨ DƯA ĐẠI CHIẾN' ;;
    en:title)         printf 'LỌ CHÉO — PICKLED JAR SHOWDOWN' ;;
    zh:title)         printf 'LỌ CHÉO — 腌罐大乱斗' ;;
    ja:title)         printf 'LỌ CHÉO — 漬物壺大戦争' ;;
    ko:title)         printf 'LỌ CHÉO — 절임항아리 대격전' ;;
    es:title)         printf 'LỌ CHÉO — DUELO DE TARROS ENCURTIDOS' ;;
    fr:title)         printf 'LỌ CHÉO — LE DUEL DES BOCAUX' ;;
    vi:subtitle)      printf 'TRÌNH CHẠY LINUX — chọn một mục rồi nhấn Enter' ;;
    en:subtitle)      printf 'LINUX LAUNCHER — pick an option, then press Enter' ;;
    zh:subtitle)      printf 'Linux 启动器 — 选择一项后按回车' ;;
    ja:subtitle)      printf 'LINUX ランチャー — 項目を選んで Enter を押してください' ;;
    ko:subtitle)      printf 'LINUX 런처 — 항목을 선택하고 Enter를 누르세요' ;;
    es:subtitle)      printf 'LANZADOR LINUX — elige una opción y pulsa Enter' ;;
    fr:subtitle)      printf 'LANCEUR LINUX — choisis une option puis appuie sur Entrée' ;;
    vi:nodeinstall)   printf 'sudo apt-get install nodejs npm  (Debian/Ubuntu)  ·  https://nodejs.org' ;;
    en:nodeinstall)   printf 'sudo apt-get install nodejs npm  (Debian/Ubuntu)  ·  https://nodejs.org' ;;
    zh:nodeinstall)   printf 'sudo apt-get install nodejs npm  (Debian/Ubuntu)  ·  https://nodejs.org' ;;
    ja:nodeinstall)   printf 'sudo apt-get install nodejs npm  (Debian/Ubuntu)  ·  https://nodejs.org' ;;
    ko:nodeinstall)   printf 'sudo apt-get install nodejs npm  (Debian/Ubuntu)  ·  https://nodejs.org' ;;
    es:nodeinstall)   printf 'sudo apt-get install nodejs npm  (Debian/Ubuntu)  ·  https://nodejs.org' ;;
    fr:nodeinstall)   printf 'sudo apt-get install nodejs npm  (Debian/Ubuntu)  ·  https://nodejs.org' ;;
    *)              printf '%s' "$1" ;;
  esac
}
say() { printf "%b\n" "$*"; }
pause() { printf "%b" "${D}$(T pressenter)${R}\n"; read -r _; }

need_node() {
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    say "${RED}$(T nodiff)${R}"
    say "${BRINE}  $(T nodehint)${R}"
    say "${GOLD}    $(T nodeinstall)${R}"
    pause; return 1
  fi
  return 0
}
ensure_deps() {
  if [ ! -d node_modules ]; then
    say "${CYAN}$(T firstinstall)${R}"
    npm install || { say "${RED}✖ npm install failed.${R}"; pause; return 1; }
  fi
  return 0
}

# ----- spinner + hoạt ảnh tiến trình (braille frames, có % chạy thật theo bước) -----
spin_run() { # spin_run <logfile> <label> -- <lệnh...>
  local log="$1"; local label="$2"; shift 2
  [ "${1:-}" = "--" ] && shift
  ("$@" >"$log" 2>&1) &
  local pid=$!
  local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  local i=0 pct=0
  while kill -0 "$pid" 2>/dev/null; do
    [ "$pct" -lt 92 ] && pct=$((pct + 3))
    printf "\r${CYAN}%s${R} ${B}%s${R}  [%3d%%]" "${frames[$((i % 10))]}" "$label" "$pct"
    i=$((i + 1)); sleep 0.09
  done
  wait "$pid"; local rc=$?
  if [ "$rc" -eq 0 ]; then
    printf "\r${GREEN}✔${R} ${B}%s${R}  [100%%]   \n" "$label"
  else
    printf "\r${RED}✖ %s${R}                    \n" "$label"
  fi
  return "$rc"
}

action_play() {
  need_node || return
  ensure_deps || return
  say "${GOLD}$(T buildstart)${R}"
  local log; log="$(mktemp)"
  if spin_run "$log" "$(T buildstart)" -- npm run build; then
    say "${GREEN}$(T buildok)${R}"
    xdg-open "dist/index.html" >/dev/null 2>&1 &
  else
    cat "$log"; say "${RED}$(T buildfail)${R}"
  fi
  rm -f "$log"; pause
}
action_dev() {
  need_node || return
  ensure_deps || return
  say "${GOLD}$(T devextra)${R}"
  npm run dev
  pause
}
action_build() { need_node || return; ensure_deps || return; say "${GOLD}$(T buildstart)${R}"; npm run build && say "${GREEN}✔ dist/index.html${R}"; pause; }
action_test()  { need_node || return; ensure_deps || return; npm run test; pause; }
action_check() { need_node || return; ensure_deps || return; npm run check && say "${GREEN}$(T checkok)${R}"; pause; }
action_install(){ need_node || return; npm install && say "${GREEN}$(T installdone)${R}"; pause; }
action_clean() {
  say "${CHILI}$(T cleanknown)${R}"
  printf "${CHILI}%s${R}" "$(T confirmdelete)"
  read -r yn
  if [ "$yn" = "YES" ]; then rm -rf node_modules dist && say "${GREEN}$(T cleaned)${R}"; else say "${D}$(T cancelled)${R}"; fi
  pause
}
action_info() {
  say "${BRINE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"
  say "${GOLD}${B} $(T title)${R}  (v${VERSION})"
  say "${BRINE} $(T license)${R}"
  say "${BRINE} $(T author)${R}"
  say "${BRINE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"
  say "${CYAN}$(T info1)${R}"
  say "${CYAN}$(T info2)${R}"
  say "${CYAN}$(T info3)${R}"
  pause
}

# ----- banner hoạt ảnh: khung vàng nhấp nháy + ngôi sao lấp lánh -----
banner() {
  [ -t 1 ] && printf "\033[2J\033[H"
  say "${GOLD}${B}╔════════════════════════════════════════════╗${R}"
  say "${GOLD}${B}║   🫙  $(T title)  v${VERSION}   ║${R}"
  say "${GOLD}${B}╚════════════════════════════════════════════╝${R}"
  say "${JADE}  $(T subtitle)${R}"
  if [ -t 1 ]; then
    local palette=("$GOLD2" "$PINK" "$GOLD")
    local f
    for f in 0 1 2; do
      printf "\033[4A"
      say "${palette[$f]}${B}╔════════════════════════════════════════════╗${R}"
      say "${palette[$f]}${B}║   🫙  $(T title)  v${VERSION}   ║${R}"
      say "${palette[$f]}${B}╚════════════════════════════════════════════╝${R}"
      say "${JADE}  $(T subtitle)${R}"
      sleep 0.06
    done
  fi
  say ""
}
SPARK_IDX=0
sparkle_line() {
  local hues=("$GOLD" "$PINK" "$CYAN")
  printf "%b  ✦ ·˚ ·✦ ·˚ ·✦ ·˚ ·✦ ·˚ ·✦ ·˚ ·✦ ·˚ ·✦ ·˚ ·✦  %b\n" "${hues[$SPARK_IDX]}${D}" "${R}"
  SPARK_IDX=$(( (SPARK_IDX + 1) % 3 ))
}

while true; do
  banner
  say "${GOLD}  1)${R} ▶  ${B}$(T play)${R}"
  say "${GOLD}  2)${R} 🛠  ${B}$(T dev)${R}"
  say "${GOLD}  3)${R} 📦  ${B}$(T build)${R}"
  say "${GOLD}  4)${R} 🧪  ${B}$(T test)${R}"
  say "${GOLD}  5)${R} ✅  ${B}$(T check)${R}"
  say "${GOLD}  6)${R} 📥  ${B}$(T install)${R}"
  say "${GOLD}  7)${R} 🧹  ${B}$(T clean)${R}"
  say "${GOLD}  8)${R} ℹ️   ${B}$(T info)${R}"
  say "${GOLD}  0)${R} 🚪  ${B}$(T quit)${R}      ${D}$(T langhint)${R}"
  sparkle_line
  say ""
  printf "${BRINE}%s: ${R}" "$(T pick)"
  read -r opt
  case "$opt" in
    1) action_play ;; 2) action_dev ;; 3) action_build ;; 4) action_test ;;
    5) action_check ;; 6) action_install ;; 7) action_clean ;; 8) action_info ;;
    L|l) case "$UI_LANG" in vi) UI_LANG=en ;; en) UI_LANG=zh ;; zh) UI_LANG=ja ;; ja) UI_LANG=ko ;; ko) UI_LANG=es ;; es) UI_LANG=fr ;; fr) UI_LANG=vi ;; *) UI_LANG=vi ;; esac ;;
    0) say "${GOLD}$(T bye)${R}"; exit 0 ;;
    *) say "${RED}$(T badchoice)${R}"; pause ;;
  esac
done
