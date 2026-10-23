(() => {
  'use strict';
  const data = window.PORTFOLIO;
  if (!data) return;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const imagePath = name => 'assets/images/' + name;
  const imageViewer = $('#image-viewer');
  const videoViewer = $('#video-viewer');
  const video = $('video', videoViewer);
  let activeSeries = null;
  let activeIndex = 0;
  let lastTrigger = null;

  const menuToggle = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMenu() {
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.innerHTML = 'Меню <span aria-hidden="true">＋</span>';
  }
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    mobileNav.hidden = expanded;
    menuToggle.innerHTML = expanded ? 'Меню <span aria-hidden="true">＋</span>' : 'Закрыть <span aria-hidden="true">×</span>';
  });
  $$('a', mobileNav).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  window.matchMedia('(min-width: 801px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

  function openDialog(dialog) {
    closeMenu();
    if (dialog.open) return;
    if (imageViewer.open) imageViewer.close();
    if (videoViewer.open) videoViewer.close();
    document.body.classList.add('modal-open');
    dialog.showModal();
  }
  [imageViewer, videoViewer].forEach(dialog => {
    $('.viewer-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (!imageViewer.open && !videoViewer.open) document.body.classList.remove('modal-open');
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({preventScroll:true});
    });
  });

  function showImage(index, focusThumb = false) {
    if (!activeSeries) return;
    const series = activeSeries;
    activeIndex = ((index % series.images.length) + series.images.length) % series.images.length;
    const img = $('#viewer-image');
    img.src = imagePath(series.images[activeIndex]);
    img.alt = `${series.title} — ${series.category.startsWith('Презентация') ? 'слайд' : 'изображение'} ${activeIndex + 1}`;
    $('#viewer-count').textContent = `${activeIndex + 1} / ${series.images.length}`;
    const thumbs = $$('.viewer-thumbs button');
    thumbs.forEach((b, i) => b.setAttribute('aria-current', String(i === activeIndex)));
    if (focusThumb) thumbs[activeIndex]?.scrollIntoView({block:'nearest', inline:'nearest', behavior:'instant'});
    $('.gallery-prev', imageViewer).hidden = series.images.length < 2;
    $('.gallery-next', imageViewer).hidden = series.images.length < 2;
    const next = new Image();
    next.src = imagePath(series.images[(activeIndex + 1) % series.images.length]);
  }

  $$('[data-series]').forEach(button => button.addEventListener('click', () => {
    const series = data.series[button.dataset.series];
    if (!series) return;
    activeSeries = series;
    lastTrigger = button;
    $('#viewer-title').textContent = series.title;
    $('#viewer-subtitle').textContent = series.subtitle;
    $('#viewer-category').textContent = series.category;
    $('#viewer-description').textContent = series.description;
    $('#viewer-role').textContent = series.role;
    const thumbs = $('.viewer-thumbs');
    thumbs.replaceChildren();
    series.images.forEach((name, i) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.setAttribute('aria-label', `Показать ${i + 1} из ${series.images.length}`);
      const img = document.createElement('img');
      img.src = imagePath(name);
      img.alt = '';
      img.loading = 'lazy';
      thumb.append(img);
      thumb.addEventListener('click', () => showImage(i));
      thumbs.append(thumb);
    });
    const source = $('.source-details');
    source.hidden = !series.source;
    source.open = false;
    if (series.source) $('img', source).src = imagePath(series.source);
    else $('img', source).removeAttribute('src');
    showImage(Number(button.dataset.index || 0));
    openDialog(imageViewer);
    imageViewer.scrollTop = 0;
  }));
  $('.gallery-prev').addEventListener('click', () => showImage(activeIndex - 1, true));
  $('.gallery-next').addEventListener('click', () => showImage(activeIndex + 1, true));
  imageViewer.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); showImage(activeIndex - 1, true); }
    if (e.key === 'ArrowRight') { e.preventDefault(); showImage(activeIndex + 1, true); }
  });
  let touchStart = null;
  $('.viewer-stage').addEventListener('touchstart', e => {
    const t = e.changedTouches[0]; touchStart = {x:t.clientX,y:t.clientY};
  }, {passive:true});
  $('.viewer-stage').addEventListener('touchend', e => {
    if (!touchStart) return;
    const t = e.changedTouches[0], dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) showImage(activeIndex + (dx < 0 ? 1 : -1), true);
    touchStart = null;
  }, {passive:true});

  $$('[data-video]').forEach(button => button.addEventListener('click', () => {
    const item = data.videos[button.dataset.video];
    if (!item) return;
    lastTrigger = button;
    $('#video-title').textContent = item.title;
    $('#video-description').textContent = item.caption;
    video.poster = imagePath(item.poster);
    video.src = 'assets/video/' + item.file;
    video.muted = false;
    video.setAttribute('aria-label', item.title);
    openDialog(videoViewer);
    videoViewer.scrollTop = 0;
    video.play().catch(() => { /* Native controls remain available when play is restricted. */ });
  }));
  videoViewer.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });

  $$('.compare-visual input').forEach(input => input.addEventListener('input', () => {
    input.closest('.compare-visual').style.setProperty('--split', `${input.value}%`);
  }));

  function initMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    const {gsap, ScrollTrigger} = window;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add({desktop:'(min-width: 801px)', mobile:'(max-width: 800px)', motion:'(prefers-reduced-motion: no-preference)'}, context => {
      if (!context.conditions.motion) return;
      const desktop = context.conditions.desktop;
      if ($('.ambient-background')) {
        const background = gsap.timeline({
          defaults: {duration:1, ease:'none'},
          scrollTrigger: {
            id:'ambient-background', trigger:document.body,
            start:0, end:'max', scrub:.9, invalidateOnRefresh:true
          }
        });
        background
          .to('.ambient-paper--wine', {x:desktop ? 44 : 12, y:desktop ? -260 : -65, rotation:desktop ? -8 : -13}, 0)
          .to('.ambient-paper--blue', {x:desktop ? -55 : -14, y:desktop ? 210 : 60, rotation:desktop ? 10 : 15}, 0)
          .to('.ambient-orbit', {y:desktop ? -140 : -35, rotation:desktop ? 55 : 14}, 0)
          .to('.ambient-line', {y:desktop ? 180 : 45, rotation:desktop ? 12 : 5}, 0)
          .to('.ambient-dot', {x:desktop ? 35 : 8, y:desktop ? -160 : -40}, 0);
      }
      const entry = gsap.timeline({defaults:{ease:'power3.out'}});
      entry.from('.hero-copy > *', {y:20, opacity:0, duration:.65, stagger:.08})
        .from('.hero-art .paper-frame', {y:50, opacity:0, duration:.8, stagger:.12}, .15)
        .from('.hero-sticker', {scale:.5, opacity:0, duration:.6}, .6);
      if (desktop) {
        gsap.to('.hero-art', {y:-40, rotation:1.5, ease:'none', scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:.7}});
      }
      $$('.reveal').forEach(el => gsap.from(el, {y:desktop ? 30 : 16, opacity:0, duration:.65, ease:'power2.out', scrollTrigger:{trigger:el, start:'clamp(top 93%)', once:true}}));
      const films = $$('.collage-film');
      if (desktop) {
        const tl = gsap.timeline({scrollTrigger:{trigger:'.collage-stage',start:'top 88%',end:'center 57%',scrub:.65}});
        films.forEach((film, index) => {
          const offset = index - (films.length - 1) / 2;
          tl.from(film, {x:offset * 18,y:20 + index * 7,rotation:offset * 6,opacity:.2,ease:'none'},0);
        });
      } else {
        gsap.from('.collage-stage', {y:20,opacity:0,duration:.6,scrollTrigger:{trigger:'.collage-stage',start:'clamp(top 92%)',once:true}});
      }
    });
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh, {once:true});
    $$('details.photo-more').forEach(details => details.addEventListener('toggle', refresh));
  }
  initMotion();
})();
