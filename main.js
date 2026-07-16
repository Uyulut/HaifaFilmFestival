// Single accordion state: null | "map" | "movies" | "contact".
// Opening one section closes the others; clicking the open one closes it.
(function () {
  "use strict";

  var sections = Array.prototype.slice.call(document.querySelectorAll(".acc"));
  var activeSection = null;

  function render() {
    sections.forEach(function (section) {
      var isOpen = section.dataset.section === activeSection;
      section.classList.toggle("is-open", isOpen);
      section.querySelector(".bar").setAttribute("aria-expanded", String(isOpen));
    });
  }

  function scrollToOpenedSection(section) {
    var start = performance.now();
    var duration = 430;

    function keepSectionAtTop(now) {
      var currentY = window.pageYOffset || document.documentElement.scrollTop || 0;
      var y = currentY + section.getBoundingClientRect().top;
      window.scrollTo(0, Math.max(0, y));

      if (now - start < duration) requestAnimationFrame(keepSectionAtTop);
    }

    requestAnimationFrame(keepSectionAtTop);
  }

  function openSection(name) {
    var section = sections.find(function (item) { return item.dataset.section === name; });
    if (!section) return;
    var willOpen = activeSection !== name;
    activeSection = willOpen ? name : null;
    render();
    if (willOpen) scrollToOpenedSection(section);
  }

  sections.forEach(function (section) {
    section.querySelector(".bar").addEventListener("click", function () {
      openSection(section.dataset.section);
    });
  });

  Array.prototype.slice.call(document.querySelectorAll("[data-open-section]")).forEach(function (button) {
    button.addEventListener("click", function () {
      openSection(button.dataset.openSection);
    });
  });

  // Don't submit the demo contact form anywhere.
  var form = document.querySelector(".cform");
  if (form) form.addEventListener("submit", function (e) { e.preventDefault(); });

  render();
})();
// ── Mouse parallax on the hero ───────────────────────────────────────────
// Cursor position (normalised to -0.5…0.5) is eased toward and written to
// --px/--py on .hero; each hero layer translates by its own factor (depth).
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  if (!hero) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var targetX = 0, targetY = 0, curX = 0, curY = 0, running = false;

  function tick() {
    curX += (targetX - curX) * 0.08;          // smooth follow
    curY += (targetY - curY) * 0.08;
    hero.style.setProperty("--px", curX.toFixed(4));
    hero.style.setProperty("--py", curY.toFixed(4));
    if (Math.abs(targetX - curX) > 0.0004 || Math.abs(targetY - curY) > 0.0004) {
      requestAnimationFrame(tick);
    } else {
      running = false;
    }
  }

  function start() { if (!running) { running = true; requestAnimationFrame(tick); } }

  window.addEventListener("mousemove", function (e) {
    if (reduce.matches || window.innerWidth <= 800) return;
    var r = hero.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= window.innerHeight) return;  // only while hero is on screen
    targetX = e.clientX / window.innerWidth - 0.5;
    targetY = e.clientY / window.innerHeight - 0.5;
    start();
  }, { passive: true });
}());

// ── Movie program navigation ─────────────────────────────────────────────
(function () {
  "use strict";

  var stage = document.querySelector(".stage--movies");
  if (!stage) return;

  var video = stage.querySelector(".movie-still");
  var content = stage.querySelector(".movie__content-wrap");
  var titlesMenu = stage.querySelector(".titles");
  var titlePrev = stage.querySelector(".titles-arrow--prev");
  var titleNext = stage.querySelector(".titles-arrow--next");
  var buttons = Array.prototype.slice.call(stage.querySelectorAll(".titles button"));
  var titleHe = stage.querySelector(".movie__title-he");
  var titleEn = stage.querySelector(".movie__title-en");
  var venue = stage.querySelector(".movie__venue");

  var date = stage.querySelector(".movie__date");
  var credits = stage.querySelector(".movie__credits");
  var synopsis = stage.querySelector(".movie__synopsis");
  var soundToggle = stage.querySelector(".sound-toggle");

  var isMuted = true;
  var currentYoutubeId = "xy_bOwqSX6w";

  // controls=0 and the rest live in the URL, so they have to be re-applied on
  // every swap: the JS API's loadVideoById() reuses the running player and lets
  // YouTube's chrome back in over the trailer.
  // Deliberately NOT looping via loop=1&playlist=<id>: that makes the embed a
  // playlist, which adds prev/next buttons to the player's centre overlay. We
  // restart it ourselves on end instead (see below) — the trailer then never
  // pauses, so the centre play/pause overlay never has a reason to appear.
  function trailerUrl(id) {
    return "https://www.youtube.com/embed/" + id +
      "?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0" +
      "&rel=0&playsinline=1&enablejsapi=1&modestbranding=1";
  }

  function sendYouTubeCommand(command, args) {
    if (!video || !video.contentWindow) return;
    video.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: command, args: args || [] }), "*");
  }

  // The embed only reports its state once asked; re-ask after every src swap.
  function listenToPlayer() {
    if (!video || !video.contentWindow) return;
    video.contentWindow.postMessage(
      JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
  }

  if (video) {
    video.addEventListener("load", listenToPlayer);
    listenToPlayer();

    window.addEventListener("message", function (e) {
      if (e.origin !== "https://www.youtube.com" || typeof e.data !== "string") return;
      var msg;
      try { msg = JSON.parse(e.data); } catch (err) { return; }
      // playerState 0 = ended: rewind and keep going, so no end screen
      if (msg.event === "infoDelivery" && msg.info && msg.info.playerState === 0) {
        sendYouTubeCommand("seekTo", [0, true]);
        sendYouTubeCommand("playVideo");
      }
    });
  }

  if (soundToggle) {
    soundToggle.addEventListener("click", function () {
      isMuted = !isMuted;
      sendYouTubeCommand(isMuted ? "mute" : "unMute");
      soundToggle.classList.toggle("is-muted", isMuted);
      soundToggle.setAttribute("aria-pressed", String(!isMuted));
    });
  }
  function scrollTitles(direction) {
    if (!titlesMenu) return;
    titlesMenu.scrollBy({ left: direction * titlesMenu.clientWidth * 0.75, behavior: "smooth" });
  }

  if (titlePrev) titlePrev.addEventListener("click", function () { scrollTitles(-1); });
  if (titleNext) titleNext.addEventListener("click", function () { scrollTitles(1); });

  var MOVIES = {
    armand: {
      youtubeId: "xy_bOwqSX6w",
      // measured from the trailer's own letterbox: scope films need a wider
      // iframe so the picture is tall enough to fill the frame
      sourceRatio: 1.85,
      trailerTitle: "Armand trailer",
      titleHe: "ארמנד",
      titleEn: "ARMAND",
      venue: "מרכז קריגר",
      venueColor: "var(--yellow)",
      date: "28.9",
      credits: "בימוי: הלפדן אולמן טונדל | נורבגיה 2026 | 117 דקות | נורבגית | תרגום לעברית ואנגלית",
      compactTitle: false,
      synopsis: [
        "במהלך אחר צהריים חורפי אחד, בבית ספר ריק, נפגשות אימהותיהם של ארמנד וג'ון בני ה-6 בניסיון ללבן את העניינים אחרי תקרית שקרתה או לא קרתה בין שני הילדים. להפתעתה של המורה המתווכת האבודה, התקרית בין הילדים תתגמד אל מול הקרב בין שתי הנשים הנחושות להגן על ילדיהן. כשאין דרך לגלות מה באמת קרה, סודות ייחשפו, האשמות יוטחו, קווים אישיים ייחצו, ונדמה שכל האמצעים כשרים – עד שלא ברור מי בעצם רב עם מי...",
        "\"ארמנד\" הוקרן במסגרת \"מבט מסוים\" היוקרתית בפסטיבל קאן האחרון, הדהים את הצופים והמבקרים, וזכה בפרס סרט הביכורים הטוב ביותר בפסטיבל. הבמאי הצעיר והמבטיח הלפדן אולמן טונדל, נכדו של ענק הקולנוע אינגמר ברגמן, מגיש דרמה עוצמתית בכיכובה של רנאטה ריינסב (\"האדם הגרוע בעולם\") בתצוגת משחק סוחפת - זוהי דרמה חכמה, מרתקת, חשופה ואנושית."
      ]
    },
    ernest: {
      youtubeId: "V0Tu7WSYSt8",
      // measured from the trailer's own letterbox: scope films need a wider
      // iframe so the picture is tall enough to fill the frame
      sourceRatio: 1.778,
      trailerTitle: "Ernest Cole: Lost and Found trailer",
      titleHe: "ארנסט קול:<br>לאבד ולמצוא",
      titleEn: "ERNEST COLE:<br>LOST AND FOUND",
      venue: "מוזיאון טיקוטין",
      venueColor: "var(--blue)",
      date: "30.9",
      credits: "בימוי: ראול פק | צרפת, ארה\"ב 2024 | 106 דקות | אנגלית | תרגום לעברית, אנגלית",
      compactTitle: true,
      synopsis: [
        "במהלך קרוב לעשור צילם ארנסט קול את המציאות שוברת הלב של השחורים בדרום אפריקה מולדתו, בשיא ימי האפרטהייד. בשנת 1967, כאשר היה רק בן 27, פרסם ספר שנוי במחלוקת ונאלץ לעזוב את המדינה. קול עבר לאמריקה והחל לעבוד במדינות הדרום, עד שהתייאש מן הגזענות והאפליה שמצא גם שם. מבודד, חסר בית, הוא חדל לצלם. לאחרונה נמצאו בכספת בנק בשוודיה עשרות אלפי נגטיבים. הצילומים האלה וסיפורו האישי של קול הם הבסיס לסרט, זוכה פרס הסרט התיעודי בפסטיבל קאן השנה.",
        "סרטו החדש של ראול פק (\"קרל מרקס הצעיר\", פסטיבל חיפה 2017) מספר סיפור רלוונטי, מעורר השראה ומרתק על נשמתו של אמן, על גזע וחוסר צדק, על המחיר האישי של הליכה שלא התלם. פסקול מלנכולי של מוזיקת ג'ז וקריינות של השחקן לאקית׳ סטנפילד עוד תורמים לאווירה."
      ]
    },
    bang: {
      youtubeId: "8-WXrAcF96o",
      // measured from the trailer's own letterbox: scope films need a wider
      // iframe so the picture is tall enough to fill the frame
      sourceRatio: 2.006,
      trailerTitle: "Bang Bang trailer",
      titleHe: "באנג באנג",
      titleEn: "BANG BANG",
      venue: "בית הכט",
      venueColor: "var(--red)",
      date: "1.10",
      credits: "בימוי: וינסנט גראשאו | ארה״ב 2024 | 124 דקות | אנגלית | תרגום לעברית",
      compactTitle: false,
      synopsis: [
        "בשיא תהילתו, בשנות השמונים, ברנארד רוזיסקי - ״באנג באנג״ - היה מתאגרף אהוב ומצליח. אבל זה היה מזמן. היום הוא מבוגר ומריר וחי בבית עלוב בשכונה צנועה בדטרויט. כאשר הנכד שלו שב במפתיע לחייו, באנג באנג מגלה שהצעיר ירש את הכישרון ומתחיל לאמן אותו. אבל החזרה של באנג באנג לזירה, ואולי גם לחיים, אינה פשוטה - שדי העבר, שהוא עבד כה קשה להשאיר מאחור, מתעוררים לתחייה."
      ]
    },
    buddha: {
      youtubeId: "uQRPpWzIibU",
      // measured from the trailer's own letterbox: scope films need a wider
      // iframe so the picture is tall enough to fill the frame
      sourceRatio: 2.344,
      trailerTitle: "Buddha Jumps Over the Wall trailer",
      titleHe: "בודהה קופץ<br>מעל לקיר",
      titleEn: "BUDDHA JUMPS<br>OVER THE WALL",
      venue: "מרכז קריגר",
      venueColor: "var(--yellow)",
      date: "2.10",
      credits: "בימוי: פדרו פיירה | ספרד 2024 | 83 דקות | ספרדית | תרגום לעברית, אנגלית",
      compactTitle: true,
      compactMeta: false,
      synopsis: [
        "השף דיוויד יארנוס הוא שף מעוטר בכוכבי מישלן. הוא הבעלים של מסעדה יוקרתית בצפון ספרד ומסעדה תאומה בטאיפיי, בירת טאיוואן. הוא לא ביקר בטאיוואן במשך שלוש שנים, בעקבות מגפת הקורונה, וכעת סוף סוף יוצא לדרך. יארנוס לא רק בודק את המסעדה, הוא גם סקרן לפגוש את המקומיים, למצוא שפה משותפת, להבין את ההבדלים, ובדרך גם מתיידד עם שף מקומי, עטור כוכבי מישלן גם הוא, קאי הו."
      ]
    },
    babylonia: {
      youtubeId: "PWSgkY9J4bA",
      // measured from the trailer's own letterbox: scope films need a wider
      // iframe so the picture is tall enough to fill the frame
      sourceRatio: 1.793,
      trailerTitle: "Good Morning, Babilonia trailer",
      titleHe: "בוקר טוב<br>בבילוניה",
      titleEn: "GOOD MORNING,<br>BABILONIA",
      venue: "מוזיאון טיקוטין",
      venueColor: "var(--blue)",
      date: "3.10",
      credits: "בימוי: פאולו טביאני, ויטוריו טביאני | איטליה, צרפת, ארה״ב 1982 | 117 דקות | אנגלית, איטלקית | תרגום לעברית, אנגלית",
      compactTitle: true,
      compactMeta: true,
      synopsis: [
        "בראשית המאה העשרים נקלעת משפחה של משפצי כנסיות מטוסקנה למצוקה כלכלית. שניים מן הבנים, אנדראה וניקולא, מחליטים לנסות את מזלם בארצות הברית. השניים הם אומנים מיומנים, ועד מהרה הם עושים את דרכם להוליווד ומתחילים לעבוד כבוני תפאורה על הסט של ״אי-סובלנות״ של ד״ו גריפית', מגדולי הסרטים של עידן הקולנוע האילם. אנדראה וניקולא יודעים הצלחה וגם אהבה, אבל החיים מוצאים דרך להפריד ביניהם."
      ]
    }
  };

  buttons.forEach(function (button) {
    var movie = MOVIES[button.dataset.movie];
    if (!movie) return;
    button.classList.add("has-movie");
    button.style.setProperty("--movie-menu-color", movie.venueColor);
  });

  function setMovie(key) {
    var movie = MOVIES[key];
    if (!movie) return;
    stage.dataset.movie = key;

    // drives the iframe width, so a scope film's picture still fills the frame
    stage.style.setProperty("--trailer-ratio", movie.sourceRatio || 1.778);

    if (video && currentYoutubeId !== movie.youtubeId) {
      currentYoutubeId = movie.youtubeId;
      video.title = movie.trailerTitle;
      video.src = trailerUrl(movie.youtubeId);
      isMuted = true;
      if (soundToggle) {
        soundToggle.classList.add("is-muted");
        soundToggle.setAttribute("aria-pressed", "false");
      }
    }

    titleHe.innerHTML = movie.titleHe;
    titleEn.innerHTML = movie.titleEn;
    venue.innerHTML = movie.venue;
    content.style.setProperty("--movie-venue-color", movie.venueColor);
    venue.style.setProperty("--movie-venue-color", movie.venueColor);


    date.textContent = movie.date;
    credits.textContent = movie.credits;
    synopsis.innerHTML = movie.synopsis.slice(0, 1).map(function (paragraph) {
      return "<p>" + paragraph + "</p>";
    }).join("");
    content.classList.toggle("is-compact-title", movie.compactTitle);
    content.classList.toggle("is-compact-meta", Boolean(movie.compactMeta));

    buttons.forEach(function (button) {
      var isActive = button.dataset.movie === key;
      button.classList.toggle("is-active", isActive);
      if (isActive) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () { setMovie(button.dataset.movie); });
  });
}());
// ── Map venue navigation ─────────────────────────────────────────────────
// Selecting a venue — by its name OR by its dot on the map — swaps the map
// (the active venue's dot is colored) and recolors the accessibility icons.
(function () {
  "use strict";

  var stage = document.querySelector(".stage--map");
  if (!stage) return;

  var mapImg = stage.querySelector(".map-img");
  var venueBtns = Array.prototype.slice.call(stage.querySelectorAll(".venue"));
  var dots = Array.prototype.slice.call(stage.querySelectorAll(".map-dot"));
  var icons = Array.prototype.slice.call(stage.querySelectorAll(".legend__ic"));
  var infoTitle = stage.querySelector(".map-info__title");
  var infoAddress = stage.querySelector(".map-info__address");
  var infoBody = stage.querySelector(".map-info__body");

  var MAP = { krieger: "yellowmap", tikotin: "bluemap", hecht: "redmap" };
  var COLOR = { krieger: "yellow", tikotin: "blue", hecht: "red" };
  var TITLE_COLOR = { krieger: "var(--yellow)", tikotin: "var(--blue)", hecht: "var(--red)" };
  var INFO = {
    krieger: {
      title: "מרכז קריגר",
      address: "אליהו חכים 6",
      body: "מרכז קריגר משמש כאחד מאולמות ההקרנה המרכזיים של פסטיבל הסרטים הבינלאומי בחיפה, המושך אליו עשרות אלפי צופים."
    },
    tikotin: {
      title: "מוזיאון טיקוטין",
      address: "שדרות הנשיא 89",
      body: "מוזיאון טיקוטין לאמנות יפנית, היחיד מסוגו במזרח התיכון, הוקם בשנת 1959 ומארח את הקרנות הפסטיבל באודיטוריום רפאל שבמתחם המוזיאון."
    },
    hecht: {
      title: "בית הכט",
      address: "שדרות הנשיא 138",
      body: "בית הכט, מבנה טמפלרי משנת 1893 שהוסב למרכז תרבות ואמנות, שוכן בלב מתחם אולמות הפסטיבל במרכז הכרמל."
    }
  };
  var LEGEND = {
    krieger: ["חניה זמינה בקרבת האולם", "בתי קפה במרחק הליכה קצר"],
    tikotin: ["חניה ציבורית בקרבת המוזיאון", "בתי קפה במרחק הליכה קצר"],
    hecht:   ["חניונים ציבוריים באזור מרכז הכרמל", "בתי קפה ומסעדות בסביבה הקרובה"]
  };

  // preload the other maps + icon colors so switching is instant
  Object.keys(MAP).forEach(function (v) { new Image().src = "./assets/SVG/" + MAP[v] + ".svg"; });
  ["yellow", "red", "blue"].forEach(function (c) {
    for (var n = 1; n <= 4; n++) new Image().src = "./img/legend-" + c + "-" + n + ".png";
  });

  function setVenue(v) {
    if (!MAP[v]) return;
    mapImg.src = "./assets/SVG/" + MAP[v] + ".svg";
    infoTitle.textContent = INFO[v].title;
    infoTitle.style.setProperty("--map-title-color", TITLE_COLOR[v]);
    infoAddress.textContent = INFO[v].address;
    infoBody.textContent = INFO[v].body;
    document.getElementById("legend-text-3").textContent = LEGEND[v][0];
    document.getElementById("legend-text-4").textContent = LEGEND[v][1];
    icons.forEach(function (ic) { ic.src = "./img/legend-" + COLOR[v] + "-" + ic.dataset.i + ".png"; });
    venueBtns.forEach(function (b) {
      var on = b.dataset.venue === v;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    dots.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.venue === v));
    });
  }

  venueBtns.concat(dots).forEach(function (el) {
    el.addEventListener("click", function () { setVenue(el.dataset.venue); });
  });
  setVenue("krieger");
}());
