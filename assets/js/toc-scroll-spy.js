(function () {
  "use strict";

  const sidebar = document.querySelector(".post-toc-sidebar");
  if (!sidebar) return;

  const links = Array.from(
    sidebar.querySelectorAll(".toc__inner a[href^='#']")
  );
  if (!links.length) return;

  const pairs = links
    .map((link) => {
      const id = decodeURIComponent(link.getAttribute("href").slice(1));
      const heading = document.getElementById(id);
      return heading ? { id, link, heading } : null;
    })
    .filter(Boolean);

  if (!pairs.length) return;

  const linkById = new Map(pairs.map((p) => [p.id, p.link]));
  let activeId = null;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function getScrollOffset() {
    const header = getComputedStyle(document.documentElement)
      .getPropertyValue("--header-height")
      .trim();
    return (parseInt(header, 10) || 60) + 16;
  }

  function setActive(id) {
    if (!id || activeId === id) return;
    activeId = id;

    links.forEach((link) => {
      const isActive = link === linkById.get(id);
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    const activeLink = linkById.get(id);
    if (!activeLink || sidebar.scrollHeight <= sidebar.clientHeight) return;

    const linkTop = activeLink.offsetTop;
    const linkBottom = linkTop + activeLink.offsetHeight;
    const viewTop = sidebar.scrollTop;
    const viewBottom = viewTop + sidebar.clientHeight;

    if (linkTop < viewTop || linkBottom > viewBottom) {
      activeLink.scrollIntoView({
        block: "nearest",
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
  }

  function updateActive() {
    const offset = getScrollOffset();
    let current = pairs[0].id;

    for (const { id, heading } of pairs) {
      if (heading.getBoundingClientRect().top <= offset) {
        current = id;
      } else {
        break;
      }
    }

    setActive(current);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateActive();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("hashchange", updateActive);

  links.forEach((link) => {
    link.addEventListener("click", () => {
      window.setTimeout(updateActive, 400);
    });
  });

  updateActive();
})();
