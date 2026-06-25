const hero = document.querySelector(".hero");
const story = document.querySelector("[data-scroll-story]");
const canvas = document.querySelector(".hero__canvas");
const aboutLink = document.querySelector('.nav a[href="#about"]');
const filmsLink = document.querySelector('.nav a[href="#films"]');
const festivalLogo = document.querySelector(".festival-mark__logo");
const festivalLogo42 = document.querySelector(".festival-mark__42");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const festivalMark = document.querySelector(".festival-mark");
const movieItems = document.querySelectorAll(".trailers__item");
const trailerVideo = document.querySelector(".trailers__video");
const storyTearOriginal = document.querySelector(".story__tear:not(.story__tear--flipped)");
const storyTearFlipped = document.querySelector(".story__tear--flipped");
const trailersList = document.querySelector(".trailers__list");

let ticking = false;
let logoAnimationFrame = 0;
let logoAnimationStart = 0;
let logoAnimationRunning = false;
let logoHasPlayed = false;
let logoLeftView = false;

const LOGO_FRAME_COUNT = 127;
const LOGO_FRAME_DURATION = 1000 / 30;

function logoFrameSource(frame) {
  return `assets/logotype-animated${String(frame).padStart(3, "0")}.gif`;
}

function preloadLogoFrames() {
  for (let frame = 0; frame < LOGO_FRAME_COUNT; frame += 1) {
    const image = new Image();
    image.src = logoFrameSource(frame);
  }
}

function stopLogoOnFinalFrame() {
  logoAnimationRunning = false;
  festivalLogo.src = logoFrameSource(LOGO_FRAME_COUNT - 1);
  if (festivalLogo42) {
    festivalLogo42.style.opacity = 1;
  }
}

function updateLogoAnimation(timestamp) {
  if (!logoAnimationRunning) return;

  const frame = Math.min(
    LOGO_FRAME_COUNT - 1,
    Math.floor((timestamp - logoAnimationStart) / LOGO_FRAME_DURATION),
  );

  if (frame !== logoAnimationFrame) {
    logoAnimationFrame = frame;
    festivalLogo.src = logoFrameSource(frame);
    if (festivalLogo42) {
      const opacity = Math.min(1, Math.max(0, (frame - 6) / 38));
      festivalLogo42.style.opacity = opacity;
    }
  }

  if (frame >= LOGO_FRAME_COUNT - 1) {
    stopLogoOnFinalFrame();
    return;
  }

  requestAnimationFrame(updateLogoAnimation);
}

function playLogoOnce() {
  if (!festivalLogo || logoAnimationRunning) return;

  if (reducedMotion.matches) {
    stopLogoOnFinalFrame();
    return;
  }

  logoAnimationFrame = 0;
  logoAnimationStart = performance.now();
  logoAnimationRunning = true;
  festivalLogo.src = logoFrameSource(0);
  if (festivalLogo42) {
    festivalLogo42.style.opacity = 0;
  }
  requestAnimationFrame(updateLogoAnimation);
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

function phase(progress, start, end) {
  return smoothstep(clamp((progress - start) / (end - start)));
}

function updateStory() {
  ticking = false;
  if (reducedMotion.matches) {
    story.style.setProperty("--tear-progress", 1);
    story.style.setProperty("--settle-progress", 1);
    story.style.setProperty("--copy-progress", 1);
    canvas.style.setProperty("--tear-progress", 1);
    canvas.style.setProperty("--settle-progress", 1);
    canvas.style.setProperty("--logo-progress", 1);
    if (festivalLogo42) {
      festivalLogo42.style.opacity = 1;
    }
    return;
  }

  const rect = hero.getBoundingClientRect();
  const travel = hero.offsetHeight - window.innerHeight;
  const rawProgress = travel > 0 ? -rect.top / travel : 1;

  const isHeroActive = rect.bottom > 0 && rect.top < window.innerHeight;
  if (isHeroActive) {
    startMouseParallax();
  }

  if (reducedMotion.matches || window.innerWidth <= 800) {
    canvas.style.removeProperty("--mouse-x");
    canvas.style.removeProperty("--mouse-y");
  }

  // Phase 1 holds the poster. Phase 2 drives the torn-paper wipe.
  // Phase 3 eases the paper into place before the copy resolves.
  const tearProgress = phase(rawProgress, 0.14, 0.56);
  const settleProgress = phase(rawProgress, 0.52, 0.76);
  const logoProgress = phase(rawProgress, 0.18, 0.46);
  const copyProgress = phase(rawProgress, 0.45, 0.75);
  const trailersProgress = phase(rawProgress, 0.76, 0.96);

  if (rawProgress >= 0.46) {
    logoLeftView = true;
    logoAnimationRunning = false;
  } else {
    if (!logoHasPlayed) {
      logoHasPlayed = true;
      playLogoOnce();
    } else if (logoLeftView) {
      logoLeftView = false;
      playLogoOnce();
    }
  }

  story.style.setProperty("--tear-progress", tearProgress.toFixed(4));
  story.style.setProperty("--settle-progress", settleProgress.toFixed(4));
  story.style.setProperty("--copy-progress", copyProgress.toFixed(4));
  canvas.style.setProperty("--tear-progress", tearProgress.toFixed(4));
  canvas.style.setProperty("--settle-progress", settleProgress.toFixed(4));
  canvas.style.setProperty("--logo-progress", logoProgress.toFixed(4));
  canvas.style.setProperty("--trailers-progress", trailersProgress.toFixed(4));
  story.style.setProperty("--trailers-progress", trailersProgress.toFixed(4));

  if (festivalMark) {
    if (logoProgress >= 0.98) {
      festivalMark.style.pointerEvents = "none";
    } else {
      festivalMark.style.pointerEvents = "auto";
    }
  }

  // The moving transition is now fully handled in CSS using transforms driven by --trailers-progress

  if (trailersList) {
    if (trailersProgress > 0.05) {
      trailersList.classList.add("trailers__list--active");
    } else {
      trailersList.classList.remove("trailers__list--active");
    }
  }
}

let targetMouseX = 0;
let targetMouseY = 0;
let currentMouseX = 0;
let currentMouseY = 0;
let parallaxRunning = false;

function updateMouseParallax() {
  if (reducedMotion.matches || window.innerWidth <= 800) {
    parallaxRunning = false;
    return;
  }

  const rect = hero.getBoundingClientRect();
  const isHeroActive = rect.bottom > 0 && rect.top < window.innerHeight;

  if (!isHeroActive) {
    parallaxRunning = false;
    return;
  }

  currentMouseX += (targetMouseX - currentMouseX) * 0.08;
  currentMouseY += (targetMouseY - currentMouseY) * 0.08;

  canvas.style.setProperty("--mouse-x", currentMouseX.toFixed(4));
  canvas.style.setProperty("--mouse-y", currentMouseY.toFixed(4));

  requestAnimationFrame(updateMouseParallax);
}

function startMouseParallax() {
  if (reducedMotion.matches || window.innerWidth <= 800) return;
  if (parallaxRunning) return;
  parallaxRunning = true;
  requestAnimationFrame(updateMouseParallax);
}

window.addEventListener("mousemove", (event) => {
  if (reducedMotion.matches || window.innerWidth <= 800) return;
  targetMouseX = (event.clientX / window.innerWidth) - 0.5;
  targetMouseY = (event.clientY / window.innerHeight) - 0.5;
  startMouseParallax();
});

function requestUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(updateStory);
}

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);
reducedMotion.addEventListener?.("change", requestUpdate);

if (festivalLogo) {
  preloadLogoFrames();
}

aboutLink?.addEventListener("click", (event) => {
  event.preventDefault();

  const heroTop = window.scrollY + hero.getBoundingClientRect().top;
  const travel = hero.offsetHeight - window.innerHeight;
  const textStateScrollPosition = heroTop + travel * 0.75;

  window.scrollTo({
    top: textStateScrollPosition,
    behavior: reducedMotion.matches ? "auto" : "smooth",
  });
});

filmsLink?.addEventListener("click", (event) => {
  event.preventDefault();

  const heroTop = window.scrollY + hero.getBoundingClientRect().top;
  const travel = hero.offsetHeight - window.innerHeight;
  const filmsScrollPosition = heroTop + travel * 1.0;

  window.scrollTo({
    top: filmsScrollPosition,
    behavior: reducedMotion.matches ? "auto" : "smooth",
  });
});

// Movie switching implementation
const movieTrailers = {
  love: "assets/trailers/Love  Official US Trailer  Strand Releasing - Strand Releasing (1080p, h264).mp4",
  lurker: "assets/trailers/LURKER _ Official Trailer _ Now Streaming.mp4",
  choice: "assets/trailers/NO OTHER CHOICE - Official Teaser Trailer - Coming Soon - NEON (1080p, h264).mp4"
};

let activeVideoTimeout = null;
let activeFallbackTimeout = null;
let onLoadedHandler = null;
let onErrorHandler = null;

function clearVideoListeners() {
  if (onLoadedHandler && trailerVideo) {
    trailerVideo.removeEventListener("loadeddata", onLoadedHandler);
  }
  if (onErrorHandler && trailerVideo) {
    trailerVideo.removeEventListener("error", onErrorHandler);
  }
  onLoadedHandler = null;
  onErrorHandler = null;
}

movieItems.forEach(item => {
  item.addEventListener("click", () => {
    if (item.classList.contains("trailers__item--active")) return;

    // Update active tab selection state
    movieItems.forEach(i => {
      i.classList.remove("trailers__item--active");
      i.setAttribute("aria-selected", "false");
    });
    item.classList.add("trailers__item--active");
    item.setAttribute("aria-selected", "true");

    const movieKey = item.getAttribute("data-movie");
    const trailerSrc = movieTrailers[movieKey];

    if (trailerVideo && trailerSrc) {
      if (activeVideoTimeout) clearTimeout(activeVideoTimeout);
      if (activeFallbackTimeout) clearTimeout(activeFallbackTimeout);
      clearVideoListeners();

      // Fade out
      trailerVideo.classList.remove("trailers__video--active");

      activeVideoTimeout = setTimeout(() => {
        // set the video src to the selected file
        trailerVideo.src = trailerSrc;
        
        // call load()
        trailerVideo.load();
        
        // reset currentTime to 0
        trailerVideo.currentTime = 0;

        let hasActivated = false;
        const activateVideo = () => {
          if (!hasActivated) {
            hasActivated = true;
            trailerVideo.classList.add("trailers__video--active");
            clearVideoListeners();
            if (activeFallbackTimeout) clearTimeout(activeFallbackTimeout);
          }
        };

        onLoadedHandler = () => {
          activateVideo();
        };

        // log an error if the selected video file fails to load
        onErrorHandler = (e) => {
          console.error(`Error loading video file: ${trailerSrc}`, e);
          activateVideo(); // fallback activation
        };

        trailerVideo.addEventListener("loadeddata", onLoadedHandler);
        trailerVideo.addEventListener("error", onErrorHandler);

        // add the active opacity class even if loadeddata does not fire
        activeFallbackTimeout = setTimeout(() => {
          if (!hasActivated) {
            console.warn(`Fallback triggered: loadeddata did not fire within 1500ms for ${trailerSrc}`);
            activateVideo();
          }
        }, 1500);

        trailerVideo.play().catch(err => {
          console.error(`Playback or autoplay failed for ${trailerSrc}:`, err);
          activateVideo();
        });
      }, 250);
    }
  });
});

if (trailerVideo) {
  trailerVideo.classList.add("trailers__video--active");
}

updateStory();
