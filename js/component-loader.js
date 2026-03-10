(function () {
  var NO_FOOTER_PAGES = ['admin', 'profile'];

  function injectCSS(href) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function load(path, position) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', path, false);
    try {
      xhr.send();
      if (xhr.status >= 200 && xhr.status < 300) {
        document.body.insertAdjacentHTML(
          position === 'header' ? 'afterbegin' : 'beforeend',
          xhr.responseText
        );
      }
    } catch (e) {}
  }

  function currentPage() {
    var parts = window.location.pathname.split('/');
    return parts[parts.length - 1].replace('.html', '');
  }

  function init() {
    injectCSS('/css/header.css');
    injectCSS('/css/footer.css');
    load('/components/header.html', 'header');
    if (NO_FOOTER_PAGES.indexOf(currentPage()) === -1) {
      load('/components/footer.html', 'footer');
    }
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();