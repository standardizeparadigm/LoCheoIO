/* =====================================================================
   Lọ Chéo — Vietnamese messages (Tiếng Việt)
   =====================================================================
   302 keys · number locale: vi-VN

   This file IS the key set: every other locale is checked against it, and a
   key that exists here but nowhere else will fail `npm run check:i18n`.
   Dấu tiếng Việt phải đầy đủ — không viết tắt, không bỏ thanh.

   Parity with vi.ts is enforced by tests/i18n.test.ts and by
   `npm run check:i18n` (v1.1.7: 302 keys × 7 locales).
   ===================================================================== */

const vi = {
  /* live badge & version line */
  "live.badge": "TRỰC TIẾP TỪ BẾP",
  "menu.arcade": "Arcade muối dưa · 60fps",

  /* brand */
  "brand.badge": "HŨ DƯA ĐẠI CHIẾN",
  "app.wordmark": "LỌ CHÉO",
  "app.wordmarkLo": "LỌ",
  "app.wordmarkCheo": "CHÉO",

  /* start screen */
  "menu.best": "kỷ lục hiện tại:",
  "menu.desc1": "Cái lọ này ",
  "menu.descStrong": "chỉ chịu đi đường chéo",
  "menu.desc2":
    ". Lượn xiên để tăng tốc và chém tan mốc, ruồi, sâu rau; hứng trọn cà pháo, tỏi, ớt cho đầy hũ trước khi gốm nứt làm ba.",
  "menu.cta": "Vào bếp",
  "menu.howtoOpen": "Cách chơi",
  "menu.howtoClose": "Bớt lại",
  "menu.achievements": "Thành tựu",
  "menu.orPress": "hoặc nhấn",
  "daily.challenge": "THỬ THÁCH HÔM NAY",
  "daily.rule": "LUẬT CHƠI",
  "touch.drag": "KÉO NGÓN TAY — lọ trượt theo",
  "touch.diagonal": "KÉO XÉO 45° — chém mốc",
  "touch.slam": "NÚT LẮC — dọn sạch",
  "keys.move": "DI CHUYỂN",
  "keys.slam": "LẮC HŨ",
  "keys.pause": "TẠM NGHỈ",
  "panel.local": "lưu trên máy bạn",

  /* scoreboard */
  "scoreboard.title": "BẢNG VÀNG HŨ DƯA",
  "scoreboard.empty": "Chưa có ai muối dưa.",
  "scoreboard.top": "TOP {n}",
  "scoreboard.row": "CẤP {level} · {jars} HŨ",

  /* game over */
  "gameover.kicker": "gốm không chịu nổi",
  "gameover.title": "VỠ HŨ!",
  "gameover.scoreLabel": "điểm ván này",
  "gameover.best": "kỷ lục:",
  "gameover.rank": "VÀO TOP {rank}!",
  "gameover.saved": "ĐÃ GHI VÀO BẢNG VÀNG",
  "gameover.again": "Muối lại ngay",
  "gameover.menu": "Về menu",
  "gameover.instantA": "nhấn",
  "gameover.instantB": "để chơi lại tức thì",
  "gameover.mode": "CHẾ ĐỘ: {name}",
  "newAch.title": "THÀNH TỰU MỚI!",

  /* stats grid */
  "stats.catches": "Củ muối",
  "stats.bestCombo": "Chuỗi đỉnh",
  "stats.level": "Cấp",
  "stats.jars": "Hũ đầy",
  "stats.sliced": "Đã chém",
  "stats.time": "Thời gian",

  /* save score */
  "save.label": "ghi tên vào bảng vàng",
  "save.placeholder": "VD: BÀ TƯ",
  "save.anonymous": "KHÔNG TÊN",
  "save.button": "Lưu",

  /* pause */
  "pause.kicker": "hũ đang đậy nắp",
  "pause.title": "TẠM NGHỈ",
  "pause.score": "Điểm",
  "pause.catches": "Củ đã muối",
  "pause.bestCombo": "Chuỗi cao nhất",
  "pause.levelJars": "Cấp / Hũ",
  "pause.resume": "Muối tiếp",
  "pause.restart": "Chơi lại",
  "pause.menu": "Về menu",
  "pause.hintResume": "tiếp tục",
  "pause.hintSlam": "lắc hũ",
  "pause.hintMute": "tắt tiếng",

  /* in-run chrome */
  "app.hint": "giữ 2 phím để chém chéo · SPACE lắc hũ · ESC tạm nghỉ · {mode}",
  "app.pause.ariaOn": "Tạm nghỉ",
  "app.pause.ariaOff": "Tiếp tục",
  "mute.turnOff": "Tắt âm",
  "mute.turnOn": "Bật âm",

  /* canvas HUD */
  "hud.best": "KỶ LỤC",
  "hud.cheo": "CHÉO!",
  "hud.jar": "HŨ DƯA",
  "hud.timeLeft": "CÒN {n}S",
  "hud.combo": "{n} CHUỖI",
  "hud.slamReady": "LẮC HŨ ✦ SẴN SÀNG",
  "hud.slamCd": "LẮC HŨ…",
  "hud.frenzy": "ỚT HIỂM ×2",
  "hud.slow": "ĐÁ LẠNH",
  "hud.shield": "TỎI VÀNG ×{n}",
  "hud.level": "CẤP {n}",
  "hud.jarsCatches": "{jars} HŨ · {catches} CỦ",

  /* canvas banners */
  "banner.start.title": "MUỐI NÀO!",
  "banner.start.sub": "giữ 2 phím để CHÉM CHÉO",
  "banner.jarFull": "HŨ ĐẦY! +{bonus}",
  "banner.jarFull.sub": "dưa muối đạt chuẩn",
  "banner.level": "CẤP {n}",
  "banner.level.sub": "dưa rơi nhanh hơn",
  "banner.frenzy": "CAY XÈ!",
  "banner.frenzy.sub": "nhân đôi điểm · tự chém mốc",
  "banner.slow": "NGÂM ĐÁ",
  "banner.slow.sub": "thời gian trôi chậm lại",
  "banner.shield": "KHIÊN TỎI!",
  "banner.shield.sub": "chặn một vết nứt · tối đa 2 lớp",

  /* canvas popups */
  "popup.mult": "NHÂN ×{n}",
  "popup.slam": "LẮC HŨ!",
  "popup.cheo": "CHÉO +{n}",
  "popup.miss": "TRƯỢT!",
  "popup.cracked": "NỨT! -1",
  "popup.broken": "VỠ HŨ!",
  "popup.healCrack": "+{gain} · LÀNH VẾT NỨT!",
  "popup.healFull": "+{gain} MUỐI VÀNG",
  "popup.frenzy": "ỚT HIỂM! ×2 ĐIỂM",
  "popup.slow": "ĐÁ LẠNH! CHẬM RÃI",
  "popup.shieldGain": "TỎI VÀNG! KHIÊN ×{n}",
  "popup.shieldBlock": "KHIÊN TỎI! CHẶN!",

  /* mode selector */
  "mode.choose": "Chọn chế độ",
  "mode.switch": "đổi được trước mỗi ván",
  "mode.classic.name": "MUỐI DƯA CỔ ĐIỂN",
  "mode.classic.tagline": "Cân bằng hương vị truyền thống",
  "mode.classic.desc":
    "Toàn bộ trải nghiệm gốc: cà pháo, tỏi, ớt rơi xuống — né đồ hư, chém chéo khi hưng phấn, lắc hũ cứu nguy.",
  "mode.classic.badge": "×1.0 ĐIỂM",
  "mode.zen.name": "THẢNH THƠI",
  "mode.zen.tagline": "Không đồ hư · thư thái muối dưa",
  "mode.zen.desc":
    "Chế độ chữa lành: mốc và ruồi biến mất, dưa rơi chậm hơn 20%, đổi lại điểm chỉ còn một nửa. Dành cho những buổi chiều mưa.",
  "mode.zen.badge": "×0.5 ĐIỂM",
  "mode.inferno.name": "ỚT LỬA",
  "mode.inferno.tagline": "Dưa rơi như lửa · thưởng nửa điểm nữa",
  "mode.inferno.desc":
    "Địa ngục của dân muối dưa: dưa rơi nhanh hơn 35%, đồ hư nhiều gần gấp đôi, đền lại +50% điểm mỗi củ. Chỉ dành cho tay chéo cứng.",
  "mode.inferno.badge": "×1.5 ĐIỂM",
  "mode.blitz.name": "ĐUA 60 GIÂY",
  "mode.blitz.tagline": "Đồng hồ đếm ngược · chém điểm tối đa",
  "mode.blitz.desc":
    "Chạy đua với đồng hồ: 60 giây, dưa rơi dày hơn và nhanh hơn một chút, đồ hư nhiều hơn một chút, đền lại ×1.25 điểm mỗi củ. Hết giờ là hết ván — hứng được càng nhiều càng tốt.",
  "mode.blitz.badge": "×1.25 · 60S",
  "mode.goldrush.name": "MÙA VÀNG",
  "mode.goldrush.tagline": "Đồ vàng rơi dày đặc · mùa bội thu",
  "mode.goldrush.desc":
    "Mùa gặt rực rỡ: Muối Vàng, Cải Vàng, Tỏi Vàng, Ớt Hiểm và Đá Lạnh rơi dày gấp khoảng 2.6 lần. Cân bằng như Cổ điển — dành cho ai thích ăn vàng và leo thành tựu.",
  "mode.goldrush.badge": "×1.0 · GOLD ×2.6",
  "mode.storm.name": "MƯA DƯA",
  "mode.storm.tagline": "Dưa rơi như trút nước · lụt dưa cả bếp",
  "mode.storm.desc":
    "Thiên tai của dân muối dưa: dưa rơi chậm hơn một chút nhưng dày gần gấp rưỡi, đồ hư cũng nhiều hơn 50%. Điểm mỗi củ chỉ ×0.75 — đổi lấy cảm giác lụt dưa sướng tay và leo cấp cực nhanh.",
  "mode.storm.badge": "×0.75 · STORM",
  "mode.hardcore.name": "GỐM MỎNG",
  "mode.hardcore.tagline": "Chỉ một vết nứt là vỡ hũ · ×2.0 điểm",
  "mode.hardcore.desc":
    "Gốm lò nung non tay: chỉ chịu đúng MỘT vết nứt — chạm đồ hư khi chưa gãy là vỡ hũ ngay. Đền lại ×2.0 điểm mỗi củ và đồ hư nhiều hơn 30%. Chỉ dành cho tay chéo kim cương.",
  "mode.hardcore.badge": "×2.0 · 1 NỨT",
  "mode.combo.name": "LỄ HỘI COMBO",
  "mode.combo.tagline": "Cửa sổ combo ×2 · kéo dây thả ga",
  "mode.combo.desc":
    "Lễ hội dành cho tay kéo dây: cửa sổ combo sống gấp đôi (5.4 giây), dưa rơi dày hơn một chút, đền lại +15% điểm mỗi củ. Giữ nhịp hứng đều — multiplier nhảy vọt như pháo bông.",
  "mode.combo.badge": "×1.15 · COMBO ×2",
  "mode.feast.name": "ĐẠI TIỆC DƯA",
  "mode.feast.tagline": "Dưa rơi như trẩy hội · hũ thưởng ×2.5",
  "mode.feast.desc":
    "Trẩy hội muối dưa: dưa rơi chậm mà dày gần gấp đôi, thưởng đổ đầy hũ ×2.5. Điểm mỗi củ chỉ ×0.6 — chơi kiểu «trồng lúa»: nhặt nhanh tay, đổ thật nhiều hũ.",
  "mode.feast.badge": "×0.6 · HŨ ×2.5",

  /* achievements */
  "ach.title": "Thành tựu bếp dưa",
  "ach.locked": "CHƯA MỞ",
  "ach.hint": "Hãy chơi để mở khóa",
  "ach.first-catch.name": "MẺ MUỐI ĐẦU TIÊN",
  "ach.first-catch.desc": "Hứng được củ dưa đầu tiên trong sự nghiệp.",
  "ach.combo-10.name": "TAY MUỐI CHUYÊN NGHIỆP",
  "ach.combo-10.desc": "Đạt chuỗi 10 củ liên tiếp trong một ván.",
  "ach.combo-20.name": "CHÉO THẦN VÔ ĐỐI",
  "ach.combo-20.desc": "Đạt chuỗi 20 củ liên tiếp trong một ván.",
  "ach.slice-10.name": "KIẾM CHÉO THÁI MỎNG",
  "ach.slice-10.desc": "Chém tan 10 đồ hư trong một ván.",
  "ach.jar-1.name": "HŨ ĐẦU TAY",
  "ach.jar-1.desc": "Đầy một hũ dưa trong một ván.",
  "ach.level-6.name": "BẾP TRƯỞNG XÓM DƯA",
  "ach.level-6.desc": "Đạt cấp 6 trong một ván.",
  "ach.score-3000.name": "TÚI MUỐI 3 NÚT",
  "ach.score-3000.desc": "Ghi 3.000 điểm trong một ván.",
  "ach.score-6000.name": "HUYỀN THOẠI HŨ CHÉO",
  "ach.score-6000.desc": "Ghi 6.000 điểm trong một ván.",
  "ach.runs-5.name": "MUỐI 5 MẺ",
  "ach.runs-5.desc": "Hoàn thành 5 ván chơi (cộng dồn mọi chế độ).",
  "ach.inferno-1500.name": "ĂN ỚT KHÔNG CAY",
  "ach.inferno-1500.desc": "Ghi 1.500 điểm ở chế độ Ớt Lửa.",
  "ach.blitz-3000.name": "VUA ĐUA 60 GIÂY",
  "ach.blitz-3000.desc": "Ghi 3.000 điểm trong một ván Đua 60 Giây.",
  "ach.goldrush-2jars.name": "MÙA VÀNG BỘI THU",
  "ach.goldrush-2jars.desc": "Đầy 2 hũ trong một ván Mùa Vàng.",
  "ach.storm-60.name": "CƠN MƯA NẶNG HẠT",
  "ach.storm-60.desc": "Hứng được 60 củ trong một ván Mưa Dưa.",
  "ach.hardcore-jar.name": "GỐM THÉP",
  "ach.hardcore-jar.desc": "Đầy một hũ trong một ván Gốm Mỏng.",
  "ach.combo-40.name": "DÂY THÉP COMBO",
  "ach.combo-40.desc": "Đạt chuỗi 40 củ liên tiếp trong một ván.",
  "ach.feast-3jars.name": "TẤM LÒNG TRẨY HỘI",
  "ach.feast-3jars.desc": "Đầy 3 hũ trong một ván Đại Tiệc Dưa.",

  /* ingredient ticker */
  "ticker.0": "CÀ PHÁO +10",
  "ticker.1": "ỚT +15",
  "ticker.2": "TỎI +10",
  "ticker.3": "GỪNG +12",
  "ticker.4": "MUỐI +8",
  "ticker.5": "CẢI +18",
  "ticker.6": "CẢI VÀNG +45",
  "ticker.7": "MUỐI VÀNG +120",
  "ticker.8": "ỚT HIỂM ×2",
  "ticker.9": "ĐÁ LẠNH — CHẬM",
  "ticker.10": "TỎI VÀNG — KHIÊN",
  "ticker.11": "MỐC — NÉ!",
  "ticker.12": "RUỒI — NÉ!",
  "ticker.13": "SÂU RAU — NÉ!",

  /* how-to rules */
  "rule.0.t": "LƯỢT CHÉO",
  "rule.0.d":
    "Giữ 2 phím cùng lúc (hoặc kéo queo chéo) — lọ tăng tốc, phát sáng và CHÉM tan mốc, ruồi, sâu rau.",
  "rule.1.t": "HỨNG ĐỒ MUỐI",
  "rule.1.d":
    "Cà pháo, ớt, tỏi, gừng rơi xuống. Bắt liên tục để dựng chuỗi nhân điểm tới ×9 (×18 khi cay).",
  "rule.2.t": "LẮC HŨ",
  "rule.2.d":
    "Phím Cách (hoặc nút đỏ góc phải) tạo sóng xung kích: dọn sạch đồ hư quanh lọ và hút đồ muối về phía mình.",
  "rule.3.t": "KHIÊN TỎI VÀNG",
  "rule.3.d":
    "Nhặt TỎI VÀNG để tích tối đa 2 lớp khiên. Một lần đụng đồ hư, khiên vỡ thay cho vết nứt.",
  "rule.4.t": "3 VẾT NỨT",
  "rule.4.d":
    "Đụng đồ hư khi không lướt chéo là nứt hũ. Ba vết là mất hũ, đầy hũ thì được thưởng.",
  "rule.5.t": "9 CHẾ ĐỘ",
  "rule.5.d":
    "Cổ điển cân bằng · Thảnh Thơi không đồ hư · Ớt Lửa +35% tốc đổi ×1.5 điểm · Đua 60 Giây time-attack · Mùa Vàng đồ vàng ×2.6 · Mưa Dưa dày đặc · Gốm Mỏng 1 vết nứt · Lễ Hội Combo cửa sổ combo ×2 · Đại Tiệc Dưa hũ thưởng ×2.5.",

  /* language switcher */

  /* footer */
  "footer.offline": "100% offline",

  /* banner — resume suspended run */
  "banner.resume.title": "CHƠI TIẾP NÀO!",
  "banner.resume.sub": "ván dở được khôi phục nguyên trạng",

  /* corner menus — GAME / INFO */
  "menu.game": "GAME",
  "menu.info": "THÔNG TIN",
  "game.play": "CHƠI NGAY",
  "game.continue": "CHƠI TIẾP",
  "game.continueNone": "Chưa có ván nào đang dở",
  "game.continueHint": "{mode} · {score} điểm · {jars} hũ",
  "game.modes": "CHẾ ĐỘ CHƠI",
  "game.modesHint": "9 chế độ — chọn phong cách của bạn",
  "game.leaderboard": "BẢNG XẾP HẠNG",
  "game.leaderboardHint": "TOP 8 trên máy bạn",
  "game.achievements": "THÀNH TỰU",
  "game.achievementsHint": "{n}/{total} đã mở khóa",
  "game.settings": "CÀI ĐẶT",
  "game.settingsHint": "Âm thanh · nhạc · rung · chuyển động",
  "game.howtoHint": "luật · phím · mục tiêu",
  "howto.goal": "Mục tiêu: hứng đầy hũ dưa trước khi gốm nứt làm ba — chỉ đi được đường chéo.",
  "info.about": "GIỚI THIỆU",
  "info.aboutHint": "về trò chơi & tác giả",
  "info.changelog": "CHANGELOG",
  "info.quit": "THOÁT",
  "shortcuts.title": "PHÍM TẮT",
  "shortcuts.intro": "Điều khiển",
  "shortcuts.move": "Di chuyển",
  "shortcuts.slam": "Đập (slam)",
  "shortcuts.pause": "Tạm dừng",
  "shortcuts.mute": "Tắt/bật âm",
  "shortcuts.touch": "Chạm & kéo",
  "shortcuts.start": "Khởi động",
  "shortcuts.restart": "Chơi lại ngay",
  "shortcuts.footer": "Mọi phím đều dùng được ở cả bàn phím và tay cầm ảo trên điện thoại.",
  "info.shortcuts": "PHÍM TẮT",
  "info.shortcutsHint": "Điều khiển",
  "summary.modes": "CHẾ ĐỘ",
  "summary.ingredients": "NGUYÊN LIỆU",
  "summary.achievements": "THÀNH TỰU",
  "close.aria": "Đóng",

  /* mode select screen */
  "modes.title": "CHỌN CHẾ ĐỘ CHƠI",
  "modes.subtitle": "9 chế độ — mỗi chế độ một phong cách muối dưa",
  "modes.back": "QUAY LẠI",
  "modes.playing": "Đang chọn: {name}",

  /* settings panel */
  "settings.title": "CÀI ĐẶT",
  "settings.sfx": "Âm thanh",
  "settings.sfxDesc": "Tiếng hứng dưa, chém, vỡ hũ và SLAM",
  "settings.music": "Nhạc nền",
  "settings.musicDesc": "Giai điệu pentatonic khi đang chơi",
  "settings.shake": "Rung màn hình",
  "settings.shakeDesc": "Lắc hũ, SLAM và nứt hũ tạo chấn động",
  "settings.reducedMotion": "Giảm chuyển động",
  "settings.reducedMotionDesc": "Tắt lắc mạnh, làm dịu nhấp nháy trắng",
  "settings.clearData": "XÓA DỮ LIỆU ĐÃ LƯU",
  "settings.clearDataDesc": "Xóa bảng điểm, tiến trình và thành tựu trên máy này",
  "settings.clearDataConfirm": "Xóa toàn bộ điểm, tiến trình, thành tựu? Không thể hoàn tác!",
  "settings.saved": "Đã lưu cài đặt",

  /* about author panel */
  "about.title": "GIỚI THIỆU TÁC GIẢ",
  "about.introHeading": "GIỚI THIỆU",
  "about.intro":
    "Cái lọ này chỉ chịu đi đường chéo. Lượn xiên để tăng tốc và chém tan mốc, ruồi, sâu rau; hứng trọn cà pháo, tỏi, ớt cho đầy hũ trước khi gốm nứt làm ba.",
  "about.craftHeading": "VỀ DỰ ÁN",
  "about.thanksHeading": "LỜI CẢM ƠN",
  "about.role": "Nhà phát triển độc lập — Standardize Paradigm",
  "about.craft": "Lọ Chéo là dự án đam mê: một game arcade muối dưa chạy hoàn toàn trong trình duyệt, một file HTML duy nhất, không cần mạng, không cần server. Vẽ tay, code tay, chép tay từng dấu tiếng Việt.",
  "about.contact": "Liên hệ: standardizeparadigm@donuco.com",
  "about.source": "Mã nguồn: github.com/standardizeparadigm/Lo-CheoIO",
  "about.license": "Giấy phép: AGPL-3.0-only © 2026",
  "about.fonts": "Fonts: Be Vietnam Pro & Bungee — SIL Open Font License 1.1",
  "about.thanks": "Cảm ơn bạn đã ghé bếp muối dưa! 🫙",

  /* changelog panel */
  "changelog.title": "CHANGELOG",
  "changelog.current": "hiện tại",

  /* quit screen */
  "quit.title": "TẠM BIỆT!",
  "quit.thanks": "Cảm ơn bạn đã ghé bếp muối dưa.",
  "quit.hint": "Nếu tab này không tự đóng, hãy dùng Ctrl+W (Windows/Linux) hoặc Cmd+W (macOS).",
  "quit.back": "QUAY LẠI MENU",
  "quit.close": "ĐÓNG TAB NÀY",
  "settings.decrease": "Giảm",
  "settings.increase": "Tăng",
  "settings.section.presets": "CẤU HÌNH NHANH",
  "settings.preset.performance": "MƯỢT",
  "settings.preset.performanceDesc": "Máy yếu: ít hạt, tắt phát sáng",
  "settings.preset.balanced": "CÂN BẰNG",
  "settings.preset.balancedDesc": "Mặc định của game",
  "settings.preset.cinematic": "ĐIỆN ẢNH",
  "settings.preset.cinematicDesc": "Hết hạt, hết sáng, rung đủ",
  "settings.preset.speedrun": "SPEEDRUN",
  "settings.preset.speedrunDesc": "Nhạc tắt, SFX nhỏ, không auto-pause",
  "settings.preset.custom": "TUỲ CHỈNH",
  "settings.backupTitle": "SAO LƯU CÀI ĐẶT",
  "settings.backupDesc": "Xuất cấu hình ra JSON để mang sang máy khác",
  "settings.backupExport": "XUẤT",
  "settings.backupImport": "NHẬP",
  "settings.backupPlaceholder": "Dán JSON sao lưu vào đây…",
  "settings.backupApply": "ÁP DỤNG",
  "settings.backupBad": "JSON không hợp lệ — không có khoá cài đặt nào.",
  "settings.backupOk": "Đã nhập cài đặt từ bản sao lưu.",
  "settings.backupCopied": "Đã copy vào clipboard",

  "settings.section.audio": "ÂM THANH",
  "settings.section.display": "GIAO DIỆN & CHUYỂN ĐỘNG",
  "settings.section.language": "NGÔN NGỮ",
  "settings.section.data": "DỮ LIỆU",
  "settings.sfxVolume": "Âm lượng SFX",
  "settings.sfxVolumeDesc": "Tiếng hứng dưa, chém, đau hũ…",
  "settings.musicVolume": "Âm lượng nhạc",
  "settings.musicVolumeDesc": "Nhạc ngũ cung nền trong ván",
  "settings.shakeLevel": "Mức rung",
  "settings.shakeLevelDesc": "Lắc nhẹ hay lắc hết cỡ khi chơi",
  "settings.shakeLevel.low": "NHẸ",
  "settings.shakeLevel.high": "MẠNH",
  "settings.visualQuality": "Chất lượng hình",
  "settings.visualQualityDesc": "THẤP: giảm hạt lấp lánh, tắt phát sáng",
  "settings.visualQuality.low": "THẤP",
  "settings.visualQuality.high": "CAO",
  "settings.autoPauseOnBlur": "Tự tạm dừng khi đổi tab",
  "settings.autoPauseOnBlurDesc": "Mất focus cửa sổ sẽ tự pause ván đang chơi",
  "settings.resetDefaults": "Khôi phục mặc định",
  "settings.resetDefaultsDesc": "Đặt lại mọi cài đặt về mặc định (giữ ngôn ngữ)",
  "settings.resetDefaultsConfirm": "Về mặc định? Ngôn ngữ vẫn giữ nguyên.",
  "common.cancel": "HUỶ",
  "pause.leftSuffix": "CÒN LẠI",
  "changelog.tier.major": "MAJOR",
  "changelog.tier.minor": "UPDATE",
  "changelog.tier.patch": "PATCH",
  "changelog.filter.all": "TẤT CẢ",
  "changelog.releases": "{n} bản",
  "changelog.filterHint": "Lọc theo tầng phát hành",
} as const;

export default vi;
export type MessageKey = keyof typeof vi;
