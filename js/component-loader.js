(function () {
  var NO_FOOTER_PAGES = ['admin', 'profile'];

  function load(path, position) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', path, false);
    try {
      xhr.send();
      if (xhr.status >= 200 && xhr.status < 300) {
        document.body.insertAdjacentHTML(position === 'header' ? 'afterbegin' : 'beforeend', xhr.responseText);
      }
    } catch (e) {}
  }

  function currentPage() {
    var parts = window.location.pathname.split('/');
    var file  = parts[parts.length - 1].replace('.html', '');
    return file;
  }

  function init() {
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
