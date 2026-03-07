;(function () {
  "use strict";

  function hideLoader() {
    var body = document.body;
    var loader = document.getElementById("page-loader");

    if (body) {
      body.classList.add("page-loaded");
    }

    if (!loader) return;

    loader.classList.add("page-loader--hidden");

    setTimeout(function () {
      if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    }, 600);
  }

  function onWindowLoad() {
    setTimeout(hideLoader, 200);
  }

  if (document.readyState === "complete") {
    setTimeout(hideLoader, 0);
  } else {
    window.addEventListener("load", onWindowLoad);
  }
})();

