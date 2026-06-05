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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(iso));
  }

  /* apply saved theme before render to avoid flash */
  var saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', function () {
    updateIcon();

    document.getElementById('theme-toggle').addEventListener('click', function () {
      applyTheme(isDark() ? 'light' : 'dark');
    });

    var list = document.getElementById('post-list');

    fetch('posts/index.json')
      .then(function (r) {
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      })
      .then(function (posts) {
        if (!posts.length) {
          list.innerHTML = '<p class="empty">아직 글이 없습니다.</p>';
          return;
        }
        list.innerHTML = posts.map(function (p) {
          return (
            '<a class="post-card" href="post.html?slug=' + encodeURIComponent(p.slug) + '">' +
              '<h2 class="post-card-title">' + escapeHtml(p.title) + '</h2>' +
              '<time class="post-card-date">' + formatDate(p.date) + '</time>' +
              (p.summary ? '<p class="post-card-summary">' + escapeHtml(p.summary) + '</p>' : '') +
            '</a>'
          );
        }).join('');
      })
      .catch(function () {
        list.innerHTML = '<p class="error">글 목록을 불러오지 못했습니다.</p>';
      });
  });
})();
