(()=>{
  const PRICE_REPLACEMENTS = new Map([
    ['7 900 ₽','20 000 ₽'],
    ['19 900 ₽','35 000 ₽'],
    ['29 900 ₽','50 000 ₽'],
    ['39 000 ₽','60 000 ₽'],
    ['7 900 рублей','20 000 рублей'],
    ['19 900 рублей','35 000 рублей'],
    ['29 900 рублей','50 000 рублей'],
    ['39 000 рублей','60 000 рублей']
  ]);

  const replacePrices = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      let value = node.nodeValue;
      for (const [oldPrice, newPrice] of PRICE_REPLACEMENTS) {
        value = value.split(oldPrice).join(newPrice);
      }
      node.nodeValue = value;
    }
  };

  const initMenu = () => {
    const toggle = document.querySelector('.menu-toggle,[data-menu-button]');
    const nav = document.querySelector('.nav-links,[data-nav]');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }));
  };

  const initCopyButtons = () => {
    document.querySelectorAll('[data-copy]').forEach(button => {
      button.addEventListener('click', async () => {
        const value = button.getAttribute('data-copy') || '';
        try {
          await navigator.clipboard.writeText(value);
          const previous = button.textContent;
          button.textContent = 'Скопировано';
          setTimeout(() => { button.textContent = previous; }, 1600);
        } catch (_) {
          window.location.href = `mailto:${value}`;
        }
      });
    });
  };

  const initReveal = () => {
    const items = document.querySelectorAll('.reveal');
    if (!items.length || !('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    items.forEach(item => observer.observe(item));
  };

  const initYear = () => {
    const year = document.getElementById('year') || document.querySelector('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  };

  const init = () => {
    replacePrices();
    initMenu();
    initCopyButtons();
    initReveal();
    initYear();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
