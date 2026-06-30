/* ============================================================
   Qing Pu Elementary School — English Website
   main.js  |  Shared JS: navbar, mobile menu, active links,
               news data loading + rendering
   ============================================================ */

   document.addEventListener('DOMContentLoaded', async () => {

    /* ── 0. Load news articles from news.json ──
       Replaces the old static js/news_data.js include. Any page that
       needs article data (news.html, news-article.html) now gets it
       here, fetched fresh from the JSON file the admin panel writes to. */
    let NEWS_ARTICLES = [];
    try {
      const newsRes = await fetch('news.json');
      if (newsRes.ok) NEWS_ARTICLES = await newsRes.json();
    } catch (err) {
      console.error('Could not load news.json:', err);
    }

    // Always show newest first — the admin panel doesn't enforce order on save.
    NEWS_ARTICLES.sort((a, b) => new Date(b.date) - new Date(a.date));

    function getArticleById(id) {
      const numericId = parseInt(id, 10);
      return NEWS_ARTICLES.find(article => article.id === numericId);
    }

    function getAdjacentArticles(id) {
      const numericId = parseInt(id, 10);
      const index = NEWS_ARTICLES.findIndex(article => article.id === numericId);
      if (index === -1) return { prev: null, next: null };
      return {
        prev: index > 0 ? NEWS_ARTICLES[index - 1] : null,
        next: index < NEWS_ARTICLES.length - 1 ? NEWS_ARTICLES[index + 1] : null,
      };
    }

    function getRelatedArticles(id, count = 5) {
      const numericId = parseInt(id, 10);
      const current = getArticleById(numericId);
      if (!current) return NEWS_ARTICLES.slice(0, count);
      const sameCategory = NEWS_ARTICLES.filter(a => a.id !== numericId && a.category === current.category);
      const others       = NEWS_ARTICLES.filter(a => a.id !== numericId && a.category !== current.category);
      return [...sameCategory, ...others].slice(0, count);
    }

    /* ── 0b. Render the news listing page (featured + grid + sidebar) ──
       Only runs on news.html, detected by the presence of #news-grid.
       Builds the DOM from NEWS_ARTICLES so the existing filter/search/
       pagination logic below (blocks 7–8) has real elements to work with. */
    const newsGridEl = document.getElementById('news-grid');

    if (newsGridEl && NEWS_ARTICLES.length > 0) {
      const PAGE_SIZE = 3;
      const [featured, ...rest] = NEWS_ARTICLES;

      // ── Featured article ──
      const featuredEl = document.querySelector('.news-featured');
      if (featuredEl && featured) {
        featuredEl.dataset.category = featured.categoryKey;
        featuredEl.innerHTML = `
          <div class="news-featured__img" aria-hidden="true">
            <div class="news-img-placeholder">${featured.emoji}</div>
          </div>
          <div class="news-featured__body">
            <div class="news-featured__meta">
              <span class="badge ${featured.categoryBadge}">${featured.category}</span>
              <time class="news-date" datetime="${featured.date}">${featured.dateDisplay}</time>
            </div>
            <h2 class="news-featured__title">${featured.title}</h2>
            <p class="news-featured__excerpt">${featured.excerpt}</p>
            <div class="news-featured__footer">
              <a href="news-article.html?id=${featured.id}" class="btn btn-secondary btn-sm">Read full article</a>
              <span class="text-sm text-muted">${featured.readTime} · ${featured.category}</span>
            </div>
          </div>
        `;
      }

      // ── Grid cards (everything except the featured article) ──
      newsGridEl.innerHTML = rest.map((article, i) => {
        const page = Math.floor(i / PAGE_SIZE) + 1;
        return `
          <article class="news-card fade-in" data-category="${article.categoryKey}" data-page="${page}" role="listitem">
            <div class="news-card__img" aria-hidden="true">
              <div class="news-img-placeholder">${article.emoji}</div>
            </div>
            <div class="news-card__body">
              <div class="news-card__meta">
                <span class="badge ${article.categoryBadge}">${article.category}</span>
                <time class="news-date" datetime="${article.date}">${article.dateDisplay}</time>
              </div>
              <h3 class="news-card__title">${article.title}</h3>
              <p class="news-card__excerpt">${article.excerpt}</p>
              <a href="news-article.html?id=${article.id}" class="news-card__link">Read more →</a>
            </div>
          </article>
        `;
      }).join('');

      // ── Sidebar: category counts ──
      const counts = { all: NEWS_ARTICLES.length };
      NEWS_ARTICLES.forEach(a => { counts[a.categoryKey] = (counts[a.categoryKey] || 0) + 1; });
      document.querySelectorAll('.category-list__item').forEach(btn => {
        const key = btn.dataset.filter;
        const countEl = btn.querySelector('.category-list__count');
        if (countEl) countEl.textContent = counts[key] || 0;
      });

      // ── Sidebar: recent articles (top 5 by date) ──
      const recentListEl = document.querySelector('.recent-list');
      if (recentListEl) {
        recentListEl.innerHTML = NEWS_ARTICLES.slice(0, 5).map(a => `
          <li class="recent-item">
            <time class="recent-item__date" datetime="${a.date}">${a.dateDisplay}</time>
            <a href="news-article.html?id=${a.id}" class="recent-item__title">${a.title}</a>
          </li>
        `).join('');
      }

      // ── "Showing X articles" count (initial, before any filtering) ──
      const newsCountNumEl = document.querySelector('.news-count__num');
      if (newsCountNumEl) newsCountNumEl.textContent = NEWS_ARTICLES.length;
    }


    /* ── 1. Navbar scroll shadow ── */
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      const onScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 10);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll(); // run once on load
    }
  
  
    /* ── 2. Mobile menu toggle ── */
    const toggle = document.querySelector('.navbar__toggle');
    const mobileMenu = document.querySelector('.navbar__mobile');
  
    if (toggle && mobileMenu) {
      toggle.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', isOpen);
        // Prevent body scroll when menu is open
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });
  
      // Close mobile menu when a link is clicked
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
          toggle.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
  
      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
          mobileMenu.classList.remove('open');
          toggle.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    }
  
  
    /* ── 3. Mark active nav link based on current page ── */
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
    // Desktop links
    document.querySelectorAll('.navbar__links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  
    // Mobile links
    document.querySelectorAll('.navbar__mobile a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  
  
    /* ── 4. Smooth scroll for anchor links ── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const offset = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--navbar-height')) || 64;
          const top = target.getBoundingClientRect().top + window.scrollY - offset - 16;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  
  
    /* ── 5. Fade-in on scroll (subtle, respects reduced motion) ── */
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
    if (!prefersReduced) {
      const fadeEls = document.querySelectorAll('.fade-in');
  
      if (fadeEls.length > 0) {
        // Set initial hidden state via JS (not CSS) so it only applies when JS is on
        fadeEls.forEach(el => {
          el.style.opacity = '0';
          el.style.transform = 'translateY(16px)';
          el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        });
  
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
  
        fadeEls.forEach(el => observer.observe(el));
      }
    }
  
    /* ── 6. Section nav scroll-spy (bilingual page) ── */
    const sectionNavLinks = document.querySelectorAll('.section-nav__link');
  
    if (sectionNavLinks.length > 0) {
      // Collect the target sections from each link's href
      const sections = [...sectionNavLinks].map(link => {
        const id = link.getAttribute('href').replace('#', '');
        return document.getElementById(id);
      }).filter(Boolean);
  
      const navbarH   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 64;
      const sectionNavH = document.querySelector('.section-nav')?.offsetHeight || 48;
      const offset    = navbarH + sectionNavH + 24;
  
      const onSectionScroll = () => {
        // Find the last section whose top is above the offset line
        let current = sections[0];
        sections.forEach(section => {
          if (window.scrollY >= section.offsetTop - offset) {
            current = section;
          }
        });
  
        sectionNavLinks.forEach(link => {
          const matches = link.getAttribute('href') === `#${current?.id}`;
          link.classList.toggle('active', matches);
        });
      };
  
      window.addEventListener('scroll', onSectionScroll, { passive: true });
      onSectionScroll(); // run once on load
    }
  
  
    /* ── 7. News page — category filter + pagination (combined) ── */
    const filterBtns      = document.querySelectorAll('.filter-btn, .category-list__item');
    const newsArticles    = document.querySelectorAll('[data-category]'); // featured + cards
    const newsCountEl     = document.querySelector('.news-count__num');
    const emptyState      = document.querySelector('.news-empty');
    const newsFeatured    = document.querySelector('.news-featured');
    const paginatedCards  = document.querySelectorAll('.news-card[data-page]');
    const paginationNav   = document.getElementById('news-pagination');
    const paginationPages = document.getElementById('pagination-pages');
    const paginationPrev  = document.getElementById('pagination-prev');
    const paginationNext  = document.getElementById('pagination-next');
  
    const PAGE_SIZE = 3; // cards per page — matches the 3 static page buttons in HTML
  
    // Current state shared between filter, search, and pagination
    let currentFilter   = 'all';
    let currentNewsPage = 1;
    let applyFilter     = () => {}; // reassigned below if filter UI exists
  
    if (filterBtns.length && newsArticles.length) {
  
      /* Re-render the grid for the current filter + page.
         Featured article only shows on page 1 with no active filter/search. */
      const render = () => {
        const filter = currentFilter;
  
        // Get cards matching the current filter (search is handled separately below)
        const matchingCards = [...paginatedCards].filter(card =>
          filter === 'all' || card.dataset.category === filter
        );
  
        const totalPages = Math.max(1, Math.ceil(matchingCards.length / PAGE_SIZE));
        currentNewsPage = Math.min(currentNewsPage, totalPages);
  
        const startIdx = (currentNewsPage - 1) * PAGE_SIZE;
        const endIdx   = startIdx + PAGE_SIZE;
  
        let visibleCount = 0;
  
        // Show/hide cards based on filter match AND current page slice
        paginatedCards.forEach(card => {
          const matchesFilter = filter === 'all' || card.dataset.category === filter;
          const idx           = matchingCards.indexOf(card);
          const onCurrentPage = matchesFilter && idx >= startIdx && idx < endIdx;
          card.hidden = !onCurrentPage;
          if (onCurrentPage) visibleCount++;
        });
  
        // Featured article only shows on page 1 of the "all" view
        if (newsFeatured) {
          const showFeatured = filter === 'all' && currentNewsPage === 1;
          newsFeatured.hidden = !showFeatured;
          if (showFeatured) visibleCount++;
        }
  
        if (newsCountEl) newsCountEl.textContent = matchingCards.length + (filter === 'all' ? 1 : 0);
        if (emptyState)  emptyState.hidden = visibleCount > 0;
  
        // ── Rebuild pagination buttons to match real page count ──
        if (paginationPages) {
          paginationPages.innerHTML = '';
          for (let p = 1; p <= totalPages; p++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pagination__page' + (p === currentNewsPage ? ' active' : '');
            btn.dataset.page = p;
            btn.textContent = p;
            btn.setAttribute('aria-label', `Page ${p}`);
            if (p === currentNewsPage) btn.setAttribute('aria-current', 'page');
            btn.addEventListener('click', () => {
              currentNewsPage = p;
              render();
              paginationNav?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
            paginationPages.appendChild(btn);
          }
        }
  
        // Prev/next button state
        if (paginationPrev) paginationPrev.disabled = currentNewsPage <= 1;
        if (paginationNext) paginationNext.disabled = currentNewsPage >= totalPages;
  
        // Hide whole pagination nav if everything fits on one page
        if (paginationNav) paginationNav.hidden = totalPages <= 1;
  
        // Sync active state across filter bar + sidebar category list
        document.querySelectorAll('.filter-btn, .category-list__item').forEach(btn => {
          const isActive = btn.dataset.filter === filter;
          btn.classList.toggle('active', isActive);
          if (btn.getAttribute('role') === 'tab') {
            btn.setAttribute('aria-selected', isActive);
          }
        });
      };
  
      applyFilter = (filter) => {
        currentFilter   = filter;
        currentNewsPage = 1; // reset to first page on every new filter
        render();
      };
  
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
      });
  
      // "View all" link inside empty state
      const resetLink = document.querySelector('.filter-reset-link');
      if (resetLink) {
        resetLink.addEventListener('click', (e) => {
          e.preventDefault();
          applyFilter('all');
        });
      }
  
      // Prev / next buttons
      paginationPrev?.addEventListener('click', () => {
        if (currentNewsPage > 1) { currentNewsPage--; render(); }
      });
      paginationNext?.addEventListener('click', () => {
        currentNewsPage++; render();
      });
  
      // Initial render on page load
      render();
    }
  
  
    /* ── 8. News page — live search (overrides filter+pagination view while active) ── */
    const searchInput = document.querySelector('#news-search');
  
    if (searchInput && newsArticles.length) {
  
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
  
        if (query === '') {
          // Empty search → hand control back to the filter/pagination renderer
          if (paginationNav) paginationNav.hidden = false;
          applyFilter('all');
          return;
        }
  
        // While actively searching, hide pagination entirely — search shows all matches at once
        if (paginationNav) paginationNav.hidden = true;
  
        // Clear active state on filter buttons while searching
        document.querySelectorAll('.filter-btn, .category-list__item').forEach(btn => {
          btn.classList.remove('active');
          if (btn.getAttribute('role') === 'tab') btn.setAttribute('aria-selected', 'false');
        });
  
        let visible = 0;
  
        newsArticles.forEach(article => {
          const title   = article.querySelector('h2, h3')?.textContent.toLowerCase() || '';
          const excerpt = article.querySelector('p')?.textContent.toLowerCase() || '';
          const matches = title.includes(query) || excerpt.includes(query);
          article.hidden = !matches;
          if (matches) visible++;
        });
  
        if (newsCountEl) newsCountEl.textContent = visible;
        if (emptyState)  emptyState.hidden = visible > 0;
      });
    }
  
  
    /* ── 9. Contact form — client-side validation + AJAX submit ── */
    const contactForm = document.getElementById('contact-form');
  
    if (contactForm) {
  
      // ── Character counter for message textarea ──
      const textarea     = contactForm.querySelector('#message');
      const charCountEl  = contactForm.querySelector('.form-char-count__num');
      const charWrap     = contactForm.querySelector('.form-char-count');
      const MAX_CHARS    = 1000;
  
      if (textarea && charCountEl) {
        textarea.addEventListener('input', () => {
          const len = textarea.value.length;
          charCountEl.textContent = len;
          charWrap.classList.toggle('form-char-count--over', len > MAX_CHARS);
        });
      }
  
      // ── Field validator ──
      const showError = (field, msg) => {
        field.classList.add('invalid');
        const errEl = field.closest('.form-group')?.querySelector('.form-error');
        if (errEl) errEl.textContent = msg;
      };
  
      const clearError = (field) => {
        field.classList.remove('invalid');
        const errEl = field.closest('.form-group')?.querySelector('.form-error');
        if (errEl) errEl.textContent = '';
      };
  
      // Clear errors as user types
      contactForm.querySelectorAll('.form-input').forEach(field => {
        field.addEventListener('input', () => clearError(field));
      });
  
      // ── Full form validation ──
      const validateForm = () => {
        let valid = true;
  
        const firstName = contactForm.querySelector('#first-name');
        const lastName  = contactForm.querySelector('#last-name');
        const email     = contactForm.querySelector('#email');
        const subject   = contactForm.querySelector('#subject');
        const message   = contactForm.querySelector('#message');
  
        if (!firstName.value.trim()) {
          showError(firstName, 'Please enter your first name.');
          valid = false;
        }
  
        if (!lastName.value.trim()) {
          showError(lastName, 'Please enter your last name.');
          valid = false;
        }
  
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim()) {
          showError(email, 'Please enter your email address.');
          valid = false;
        } else if (!emailPattern.test(email.value.trim())) {
          showError(email, 'Please enter a valid email address (e.g. name@example.com).');
          valid = false;
        }
  
        if (!subject.value) {
          showError(subject, 'Please select a subject.');
          valid = false;
        }
  
        if (!message.value.trim()) {
          showError(message, 'Please write a message before sending.');
          valid = false;
        } else if (message.value.length > MAX_CHARS) {
          showError(message, `Message is too long — please keep it under ${MAX_CHARS} characters.`);
          valid = false;
        }
  
        return valid;
      };
  
      // ── Form submit handler ──
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        // Honeypot check
        const honeypot = contactForm.querySelector('#website');
        if (honeypot && honeypot.value) return; // silent drop — it's a bot
  
        if (!validateForm()) {
          // Scroll to first error
          const firstInvalid = contactForm.querySelector('.invalid');
          if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalid.focus();
          }
          return;
        }
  
        // ── Show loading state ──
        const submitBtn    = contactForm.querySelector('#submit-btn');
        const btnText      = submitBtn.querySelector('.form-submit-btn__text');
        const btnSpinner   = submitBtn.querySelector('.form-submit-btn__spinner');
        const successMsg   = contactForm.querySelector('.form-feedback--success');
        const errorMsg     = contactForm.querySelector('.form-feedback--error');
  
        submitBtn.disabled = true;
        btnText.textContent = 'Sending…';
        btnSpinner.hidden   = false;
        successMsg.hidden   = true;
        errorMsg.hidden     = true;
  
        try {
          const formData = new FormData(contactForm);
  
          const response = await fetch('contact.php', {
            method: 'POST',
            body: formData,
          });
  
          if (response.ok) {
            // ── Success ──
            contactForm.reset();
            if (charCountEl) charCountEl.textContent = '0';
            successMsg.hidden = false;
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            throw new Error(`Server returned ${response.status}`);
          }
  
        } catch (err) {
          // ── Error — show fallback message ──
          errorMsg.hidden = false;
          errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          console.error('Form submission error:', err);
        } finally {
          submitBtn.disabled  = false;
          btnText.textContent = 'Send message';
          btnSpinner.hidden   = true;
        }
      });
    }
  
  
    /* ── 10. FAQ accordion ── */
    const faqItems = document.querySelectorAll('.faq-item');
  
    if (faqItems.length) {
      faqItems.forEach(item => {
        const btn    = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
  
        if (!btn || !answer) return;
  
        btn.addEventListener('click', () => {
          const isOpen = btn.getAttribute('aria-expanded') === 'true';
  
          // Close all other items first (accordion behaviour)
          faqItems.forEach(other => {
            if (other !== item) {
              other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
              const otherAnswer = other.querySelector('.faq-answer');
              if (otherAnswer) otherAnswer.hidden = true;
            }
          });
  
          // Toggle this one
          btn.setAttribute('aria-expanded', !isOpen);
          answer.hidden = isOpen;
  
          // Smooth scroll so the answer doesn't jump off screen
          if (!isOpen) {
            setTimeout(() => {
              answer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 50);
          }
        });
      });
    }
  
  
    /* ── 11. Gallery — category filter ── */
    const galleryFilterBtns = document.querySelectorAll('.gallery-filter__btn');
    const galleryItems      = document.querySelectorAll('.gallery-item');
    const galleryCountEl    = document.querySelector('.gallery-count__num');
    const galleryEmpty      = document.querySelector('.gallery-empty');
    const galleryLoadMore   = document.getElementById('gallery-load-more');
  
    if (galleryFilterBtns.length && galleryItems.length) {
  
      const applyGalleryFilter = (filter) => {
        let visible = 0;
  
        galleryItems.forEach(item => {
          const matches = filter === 'all' || item.dataset.category === filter;
          item.hidden = !matches;
          if (matches) visible++;
        });
  
        if (galleryCountEl) galleryCountEl.textContent = visible;
        if (galleryEmpty)   galleryEmpty.hidden = visible > 0;
  
        // Hide "load more" when filtered — it only makes sense for "all"
        if (galleryLoadMore) galleryLoadMore.hidden = filter !== 'all';
  
        galleryFilterBtns.forEach(btn => {
          const isActive = btn.dataset.filter === filter;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', isActive);
        });
      };
  
      galleryFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => applyGalleryFilter(btn.dataset.filter));
      });
  
      // Empty state reset button
      const galleryReset = document.querySelector('.gallery-empty__reset');
      if (galleryReset) {
        galleryReset.addEventListener('click', () => applyGalleryFilter('all'));
      }
    }
  
  
    /* ── 12. Gallery — lightbox ── */
    const lightbox         = document.getElementById('lightbox');
    const lightboxBackdrop = document.getElementById('lightbox-backdrop');
    const lightboxClose    = document.getElementById('lightbox-close');
    const lightboxPrev     = document.getElementById('lightbox-prev');
    const lightboxNext     = document.getElementById('lightbox-next');
    const lightboxImg      = document.getElementById('lightbox-img');
    const lightboxEmoji    = document.getElementById('lightbox-emoji');
    const lightboxPlaceholder = document.getElementById('lightbox-placeholder');
    const lightboxCaption  = document.getElementById('lightbox-caption');
    const lightboxCurrent  = document.getElementById('lightbox-current');
    const lightboxTotal    = document.getElementById('lightbox-total');
    const lightboxSpinner  = lightbox?.querySelector('.lightbox__spinner');
  
    if (lightbox && galleryItems.length) {
  
      let currentIndex = 0;
  
      // Build a navigable list of visible items at the time of opening
      const getVisible = () => [...galleryItems].filter(el => !el.hidden);
  
      // ── Open lightbox at a given item ──
      const openLightbox = (index, visibleItems) => {
        const item    = visibleItems[index];
        if (!item) return;
  
        currentIndex  = index;
        const total   = visibleItems.length;
        const src     = item.dataset.src   || '';
        const caption = item.dataset.caption || item.querySelector('.gallery-item__caption')?.textContent || '';
  
        // Get the emoji from the placeholder for the lightbox placeholder
        const emojiEl = item.querySelector('.gallery-placeholder span');
        const emoji   = emojiEl ? emojiEl.textContent : '📷';
  
        // Update counter
        if (lightboxCurrent) lightboxCurrent.textContent = index + 1;
        if (lightboxTotal)   lightboxTotal.textContent   = total;
  
        // Update caption
        if (lightboxCaption) lightboxCaption.textContent = caption;
  
        // Show/hide nav arrows
        if (lightboxPrev) lightboxPrev.hidden = index === 0;
        if (lightboxNext) lightboxNext.hidden = index === total - 1;
  
        // Show spinner, hide image
        if (lightboxSpinner) lightboxSpinner.hidden = false;
        if (lightboxImg)     { lightboxImg.hidden = true; lightboxImg.src = ''; }
        if (lightboxEmoji)   lightboxEmoji.textContent = emoji;
        if (lightboxPlaceholder) lightboxPlaceholder.hidden = false;
  
        // Load real image if src is provided
        if (src) {
          const tempImg = new Image();
          tempImg.onload = () => {
            if (lightboxImg) {
              lightboxImg.src = src;
              lightboxImg.alt = caption;
              lightboxImg.hidden = false;
            }
            if (lightboxSpinner)     lightboxSpinner.hidden = true;
            if (lightboxPlaceholder) lightboxPlaceholder.hidden = true;
          };
          tempImg.onerror = () => {
            // Image failed to load — keep placeholder visible
            if (lightboxSpinner) lightboxSpinner.hidden = true;
          };
          tempImg.src = src;
        } else {
          // No src — show placeholder only
          if (lightboxSpinner) lightboxSpinner.hidden = true;
        }
  
        // Show the lightbox
        lightbox.hidden = false;
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        lightboxClose?.focus();
      };
  
      // ── Close lightbox ──
      const closeLightbox = () => {
        lightbox.hidden = true;
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
  
        // Return focus to the item that opened the lightbox
        const visibleItems = getVisible();
        visibleItems[currentIndex]?.focus();
      };
  
      // ── Navigate ──
      const navigate = (direction) => {
        const visibleItems = getVisible();
        const next = currentIndex + direction;
        if (next >= 0 && next < visibleItems.length) {
          openLightbox(next, visibleItems);
        }
      };
  
      // ── Attach click handlers to each gallery item ──
      galleryItems.forEach((item) => {
        const openHandler = () => {
          const visibleItems = getVisible();
          const index = visibleItems.indexOf(item);
          if (index !== -1) openLightbox(index, visibleItems);
        };
  
        item.addEventListener('click', openHandler);
  
        // Keyboard: Enter or Space opens the lightbox
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openHandler();
          }
        });
      });
  
      // ── Control buttons ──
      lightboxClose?.addEventListener('click', closeLightbox);
      lightboxBackdrop?.addEventListener('click', closeLightbox);
      lightboxPrev?.addEventListener('click', () => navigate(-1));
      lightboxNext?.addEventListener('click', () => navigate(1));
  
      // ── Keyboard navigation ──
      document.addEventListener('keydown', (e) => {
        if (lightbox.hidden) return;
        switch (e.key) {
          case 'Escape':    closeLightbox();   break;
          case 'ArrowLeft': navigate(-1);       break;
          case 'ArrowRight':navigate(1);        break;
        }
      });
  
      // ── Touch swipe support ──
      let touchStartX = 0;
  
      lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
  
      lightbox.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
      }, { passive: true });
    }
  
  
    /* ── 13. Gallery — "load more" button (stub) ──
       Wire this to your PHP backend when ready.
       For now it just hides itself after one click to show the pattern. */
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn && galleryLoadMore) {
      loadMoreBtn.addEventListener('click', () => {
        // TODO: fetch the next batch of photos from the server and
        // append them to #gallery-grid as new .gallery-item elements,
        // then re-attach the click/keydown handlers above.
        // For the portfolio version, we just disable the button:
        loadMoreBtn.textContent    = 'All photos loaded';
        loadMoreBtn.disabled       = true;
        loadMoreBtn.style.opacity  = '0.5';
        loadMoreBtn.style.cursor   = 'default';
      });
    }
  
  
    /* ── 14. Teachers page — grade filter ── */
    const teacherFilterBtns = document.querySelectorAll('.teacher-filter__btn');
    const teacherCards      = document.querySelectorAll('.teacher-card');
  
    if (teacherFilterBtns.length && teacherCards.length) {
  
      const applyTeacherFilter = (grade) => {
        teacherCards.forEach(card => {
          const cardGrade = card.dataset.grade;
          // "all" shows everything; otherwise match exact grade string
          card.hidden = grade !== 'all' && cardGrade !== grade;
        });
  
        teacherFilterBtns.forEach(btn => {
          const isActive = btn.dataset.grade === grade;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', isActive);
        });
      };
  
      teacherFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => applyTeacherFilter(btn.dataset.grade));
      });
    }
  
  
    /* ── 15. Article page — render content from URL ?id= parameter ──
       Requires NEWS_ARTICLES to be loaded from news.json (see block 0 above). */
    const articleBodyEl = document.getElementById('article-body');
  
    if (articleBodyEl && typeof getArticleById === 'function') {
  
      const params    = new URLSearchParams(window.location.search);
      const articleId = params.get('id');
      const article    = getArticleById(articleId);
  
      const notFoundSection = document.getElementById('article-not-found');
      const heroSection     = document.querySelector('.article-hero');
      const layoutSection   = document.querySelector('.article-layout')?.closest('section');
  
      if (!article) {
        // No matching article — show the not-found state, hide everything else
        if (heroSection)   heroSection.hidden = true;
        if (layoutSection) layoutSection.hidden = true;
        if (notFoundSection) notFoundSection.hidden = false;
      } else {
  
        // ── Page title + breadcrumb ──
        document.getElementById('page-title').textContent = `${article.title} — Qing Pu Elementary School`;
        document.getElementById('breadcrumb-current').textContent = article.title;
  
        // ── Hero meta (badge + date + read time) ──
        const metaEl = document.getElementById('article-meta');
        if (metaEl) {
          metaEl.innerHTML = `
            <span class="badge ${article.categoryBadge}">${article.category}</span>
            <time datetime="${article.date}">${article.dateDisplay}</time>
            <span class="article-hero__dot" aria-hidden="true">·</span>
            <span>${article.readTime}</span>
          `;
        }
  
        // ── Title + subtitle ──
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-subtitle').textContent = article.subtitle || '';
  
        // ── Hero image placeholder emoji ──
        const emojiEl = document.getElementById('article-hero-emoji');
        if (emojiEl) emojiEl.textContent = article.emoji || '📰';
  
        // ── Body paragraphs ──
        const contentEl = document.getElementById('article-content');
        if (contentEl) {
          contentEl.innerHTML = article.paragraphs
            .map(p => `<p>${p}</p>`)
            .join('');
        }
  
        // ── Tags ──
        const tagsEl = document.getElementById('article-tags');
        if (tagsEl && article.tags) {
          tagsEl.innerHTML = article.tags
            .map(tag => `<span class="badge badge-gray">${tag}</span>`)
            .join('');
        }
  
        // ── Prev / next pager ──
        const { prev, next } = getAdjacentArticles(article.id);
  
        const prevLink  = document.getElementById('article-prev');
        const prevTitle = document.getElementById('article-prev-title');
        if (prev && prevLink && prevTitle) {
          prevLink.href = `news-article.html?id=${prev.id}`;
          prevTitle.textContent = prev.title;
          prevLink.hidden = false;
        }
  
        const nextLink  = document.getElementById('article-next');
        const nextTitle = document.getElementById('article-next-title');
        if (next && nextLink && nextTitle) {
          nextLink.href = `news-article.html?id=${next.id}`;
          nextTitle.textContent = next.title;
          nextLink.hidden = false;
        }
  
        // ── Related articles sidebar ──
        const relatedEl = document.getElementById('related-articles');
        if (relatedEl) {
          const related = getRelatedArticles(article.id, 5);
          relatedEl.innerHTML = related.map(a => `
            <li class="recent-item">
              <time class="recent-item__date" datetime="${a.date}">${a.dateDisplay}</time>
              <a href="news-article.html?id=${a.id}" class="recent-item__title">${a.title}</a>
            </li>
          `).join('');
        }
  
        // Scroll to top when navigating between articles via prev/next/related
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  

    /* ── 16. Auto-updating school year (Taiwan time) ── */
    const schoolYearEl = document.getElementById('schoolYearLabel');
    if (schoolYearEl) {
      // Read the current date/month in Asia/Taipei specifically — not the
      // visitor's local clock — so the label is correct no matter where
      // the page is viewed from.
      const taipeiParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: 'numeric'
      }).formatToParts(new Date());

      const taipeiYear  = parseInt(taipeiParts.find(p => p.type === 'year').value, 10);
      const taipeiMonth = parseInt(taipeiParts.find(p => p.type === 'month').value, 10); // 1–12

      // Taiwan's school year runs September through the following June.
      // From Jan–Aug we're still inside the year that started last September.
      const startYear = taipeiMonth >= 9 ? taipeiYear : taipeiYear - 1;
      const endYear    = startYear + 1;

      schoolYearEl.textContent = `Sept ${startYear} – Jun ${endYear}`;
    }

  }); // end DOMContentLoaded