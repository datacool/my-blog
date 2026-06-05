(function () {
  'use strict';

  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateIcon();
  }

  function updateIcon() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    if (isDark()) {
      btn.textContent = '☀️';
      btn.setAttribute('aria-label', '라이트 모드로 전환');
    } else {
      btn.textContent = '🌙';
      btn.setAttribute('aria-label', '다크 모드로 전환');
    }
  }

  /* apply saved theme before render to avoid flash */
  var saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', function () {
    updateIcon();

    document.getElementById('theme-toggle').addEventListener('click', function () {
      applyTheme(isDark() ? 'light' : 'dark');
    });

    /* configure marked with highlight.js */
    marked.setOptions({
      highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      langPrefix: 'hljs language-',
      breaks: false,
      gfm: true
    });

    var article = document.getElementById('post-content');
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');

    if (!slug) {
      article.innerHTML = '<p class="error">잘못된 접근입니다. <a href="index.html">홈으로 돌아가기</a></p>';
      return;
    }

    fetch('posts/' + encodeURIComponent(slug) + '.md')
      .then(function (r) {
        if (!r.ok) throw new Error('not found');
        return r.text();
      })
      .then(function (md) {
        article.innerHTML = marked.parse(md);

        var h1 = article.querySelector('h1');
        if (h1) {
          document.title = h1.textContent + ' — My Blog';

          /* inject a post-meta date line if posts/index.json has date info */
          fetchMeta(slug, function (meta) {
            if (!meta) return;
            var dateLine = document.createElement('div');
            dateLine.className = 'post-meta';
            dateLine.innerHTML =
              '<time>' +
              new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                .format(new Date(meta.date)) +
              '</time>';
            h1.insertAdjacentElement('afterend', dateLine);
          });
        }
      })
      .catch(function () {
        article.innerHTML = '<p class="error">글을 찾을 수 없습니다. <a href="index.html">홈으로 돌아가기</a></p>';
      });
  });

  function fetchMeta(slug, cb) {
    fetch('posts/index.json')
      .then(function (r) { return r.json(); })
      .then(function (posts) {
        var match = posts.find(function (p) { return p.slug === slug; });
        cb(match || null);
      })
      .catch(function () { cb(null); });
  }
})();
