
/* ==========================================
   ARJİN REKLAM — JAVASCRIPT
   Firma bilgileri ve site işlevleri
========================================== */

// 1. GERÇEK FİRMA BİLGİLERİ

const SITE_CONFIG = {
  companyName: "Arjin Reklam",
  phone: "+905437447347",
  phoneDisplay: "+90 543 744 73 47",
  whatsappNumber: "905437447347",
  address:
    "İkitelli OSB, Saraçlar Sanayi Sitesi Blok 4, No: 8, 34490 Başakşehir/İstanbul",
  location: "Başakşehir / İstanbul",
  city: "İstanbul",
  email: "tabela@arjinreklam.com",
  services: [
    "Tabela Sistemleri",
    "Dijital Baskı",
    "Reklam Uygulamaları",
    "Araç Giydirme",
    "Kutu Harf",
    "LED Tabela"
  ]
};

// 2. YARDIMCI FONKSİYONLAR

const qs = (selector) =>
  document.querySelector(selector);

const qsa = (selector) =>
  document.querySelectorAll(selector);

// 3. FOOTER YIL BİLGİSİ

const yearElement = qs("#year");

if (yearElement) {
  yearElement.textContent =
    new Date().getFullYear();
}

// 4. MOBİL MENÜ

const menuButton = qs(".menu-toggle");
const mobileMenu = qs("#mobile-menu");

function setMenu(open) {
  if (!menuButton || !mobileMenu) return;

  menuButton.setAttribute(
    "aria-expanded",
    String(open)
  );

  menuButton.setAttribute(
    "aria-label",
    open ? "Menüyü kapat" : "Menüyü aç"
  );

  mobileMenu.hidden = !open;

  document.body.classList.toggle(
    "menu-open",
    open
  );
}

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const isOpen =
      menuButton.getAttribute("aria-expanded")
      === "true";

    setMenu(!isOpen);
  });

  mobileMenu.querySelectorAll("a").forEach(
    (link) => {
      link.addEventListener("click", () => {
        setMenu(false);
      });
    }
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenu(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      setMenu(false);
    }
  });
}

// 5. PROJE FİLTRELEME

const filterButtons = qsa(".filter-btn");
const projects = qsa(".project-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((b) => {
      const selected = b === button;

      b.classList.toggle("active", selected);

      b.setAttribute(
        "aria-pressed",
        String(selected)
      );
    });

    projects.forEach((card) => {
      card.hidden =
        filter !== "all" &&
        card.dataset.category !== filter;
    });
  });
});

// 6. HİZMET SEÇİMİ

qsa("[data-service]").forEach((link) => {
  link.addEventListener("click", () => {
    const field = qs(
      '#quote-form select[name="service"]'
    );

    if (!field) return;

    const requested = link.dataset.service;

    const option = Array.from(field.options).find(
      (item) => item.value === requested
    );

    if (option) {
      field.value = requested;
    }
  });
});

// 7. İLETİŞİM BİLGİLERİ

const phoneLink = qs("#contact-phone");

if (phoneLink) {
  phoneLink.textContent =
    SITE_CONFIG.phoneDisplay;

  phoneLink.href =
    `tel:${SITE_CONFIG.phone}`;

  phoneLink.hidden = false;
}

const emailLink = qs("#contact-email");

if (emailLink && SITE_CONFIG.email) {
  emailLink.textContent = SITE_CONFIG.email;

  emailLink.href =
    `mailto:${SITE_CONFIG.email}`;

  emailLink.hidden = false;
}

const locationText = qs("#contact-location");

if (locationText) {
  locationText.textContent =
    SITE_CONFIG.address;

  locationText.hidden = false;
}

// 8. WHATSAPP BAĞLANTISI

const whatsappDigits =
  SITE_CONFIG.whatsappNumber.replace(/\D/g, "");

const waButton = qs("#floating-wa");

if (waButton && whatsappDigits) {
  waButton.href =
    `https://wa.me/${whatsappDigits}`;

  waButton.target = "_blank";

  waButton.rel = "noopener noreferrer";
}

// 9. TEKLİF FORMU

const quoteForm = qs("#quote-form");

if (quoteForm) {
  quoteForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (!quoteForm.reportValidity()) {
        return;
      }

      const data = new FormData(quoteForm);

      const name = String(
        data.get("name") || ""
      ).trim();

      const phone = String(
        data.get("phone") || ""
      ).trim();

      const service = String(
        data.get("service") || ""
      ).trim();

      const message = String(
        data.get("message") || ""
      ).trim();

      const feedback = qs("#form-feedback");

      if (
        !name ||
        !phone ||
        !service ||
        message.length < 10
      ) {
        if (feedback) {
          feedback.textContent =
            "Lütfen tüm alanları doğru doldurun.";
        }

        return;
      }

      const text =
        `Merhaba Arjin Reklam, teklif almak istiyorum.\n\n` +
        `Ad Soyad: ${name}\n` +
        `Telefon: ${phone}\n` +
        `Hizmet: ${service}\n` +
        `Proje Detayı: ${message}`;

      if (!whatsappDigits) {
        if (feedback) {
          feedback.textContent =
            "WhatsApp numarası tanımlanmamış.";
        }
        return;
      }

      const link =
        `https://wa.me/${whatsappDigits}` +
        `?text=${encodeURIComponent(text)}`;

      const opened = window.open(
        link,
        "_blank"
      );

      if (opened) {
        opened.opener = null;
      }

      if (feedback) {
        feedback.textContent = opened
          ? "WhatsApp mesajınız hazırlandı. Göndermeyi WhatsApp üzerinden onaylayın."
          : "WhatsApp sekmesi açılamadı. Tarayıcınızın açılır pencere ayarlarını kontrol edin.";
      }

      if (
        !opened &&
        navigator.clipboard &&
        window.isSecureContext
      ) {
        try {
          await navigator.clipboard.writeText(text);

          if (feedback) {
            feedback.textContent +=
              " Mesaj panoya kopyalandı.";
          }
        } catch (_) {
          // Panoya erişim engellenebilir.
        }
      }
    }
  );
}

// 10. SAYFA ANİMASYONLARI

if (
  "IntersectionObserver" in window &&
  !window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(
            "is-visible"
          );

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  qsa(
    ".service-card, .project-card, .statement-grid, .contact-layout"
  ).forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });
}

// 11. URL ÜZERİNDEN HİZMET SEÇİMİ

const requestedService =
  new URLSearchParams(
    window.location.search
  ).get("service");

const serviceSelect = qs(
  '#quote-form select[name="service"]'
);

const serviceNames = {
  tabela: "Tabela Sistemleri",
  baski: "Dijital Baskı",
  uygulama: "Reklam Uygulamaları",
  arac: "Araç Giydirme",
  kutu: "Kutu Harf",
  led: "LED Tabela",
  diger: "Diğer"
};

if (
  serviceSelect &&
  requestedService &&
  serviceNames[requestedService]
) {
  serviceSelect.value =
    serviceNames[requestedService];
}


/* GERÇEK PROJELER FOTOĞRAF BÜYÜTME / KATEGORİ GEZİNME */
(() => {
  const dialog = document.querySelector('#gallery-lightbox');
  if (!dialog) return;
  const img = dialog.querySelector('#lightbox-image');
  const category = dialog.querySelector('#lightbox-category');
  const position = dialog.querySelector('#lightbox-position');
  const result = document.querySelector('#gallery-results');
  const cards = [...document.querySelectorAll('.photo-card')];
  let visibleLinks = [];
  let activeIndex = 0;
  let oldOverflow = '';
  let touchX = null;

  function visibleGallery() {
    return cards.filter(card => !card.hidden).map(card => card.querySelector('.photo-frame'));
  }
  function drawPhoto() {
    const link = visibleLinks[activeIndex];
    if (!link) return;
    const card = link.closest('.photo-card');
    const thumbnail = link.querySelector('img');
    img.src = link.href;
    img.alt = thumbnail.alt;
    category.textContent = card.querySelector('.photo-meta span').textContent;
    position.textContent = `${activeIndex + 1} / ${visibleLinks.length}`;
  }
  function openPhoto(link) {
    if (typeof dialog.showModal !== 'function') return;
    visibleLinks = visibleGallery();
    activeIndex = visibleLinks.indexOf(link);
    if (activeIndex === -1) return;
    drawPhoto();
    oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.querySelector('.lightbox-close').focus();
  }
  function move(step) {
    if (!visibleLinks.length) return;
    activeIndex = (activeIndex + step + visibleLinks.length) % visibleLinks.length;
    drawPhoto();
  }
  cards.forEach(card => {
    const link = card.querySelector('.photo-frame');
    link.addEventListener('click', e => {
      if (typeof dialog.showModal !== 'function') return;
      e.preventDefault(); openPhoto(link);
    });
  });
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.lightbox-prev').addEventListener('click', () => move(-1));
  dialog.querySelector('.lightbox-next').addEventListener('click', () => move(1));
  dialog.addEventListener('close', () => { document.body.style.overflow = oldOverflow; img.removeAttribute('src'); });
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {e.preventDefault(); move(-1);}
    if (e.key === 'ArrowRight') {e.preventDefault(); move(1);}
  });
  dialog.addEventListener('touchstart', e => { touchX = e.changedTouches[0].screenX; }, {passive:true});
  dialog.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx=e.changedTouches[0].screenX-touchX;
    if(Math.abs(dx)>65) move(dx<0?1:-1);
    touchX=null;
  }, {passive:true});
  // The existing site script performs the actual show/hide; this also updates status.
  document.querySelectorAll('.real-filter-row .filter-btn').forEach(button => {
    button.addEventListener('click', () => {
      const n=cards.filter(card=>!card.hidden).length;
      if(result) result.textContent=`${n} fotoğraf gösteriliyor`;
    });
  });
})();

/* Load blurred gallery backdrops only for cards near viewport. */
(() => {
  const spans = [...document.querySelectorAll('.photo-backdrop[data-bg]')];
  const load = el => {
    const url = el.getAttribute('data-bg');
    if (!url) return;
    el.style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
    el.removeAttribute('data-bg');
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { load(entry.target);io.unobserve(entry.target); }
      });
    }, { rootMargin: '350px' });
    spans.forEach(el => io.observe(el));
  } else { spans.forEach(load); }
})();


// SEO gallery category deep link: from service detail pages to filtered portfolio.
(function () {
  const filter = new URLSearchParams(window.location.search).get('kategori');
  if (!filter || !/^(led|kutu|baski|arac|yon|ic|diger)$/.test(filter)) return;
  const tab = document.querySelector('.filter-btn[data-filter="' + filter + '"]');
  if (tab) tab.click();
})();
