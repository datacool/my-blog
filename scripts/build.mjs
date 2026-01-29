import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import mdAnchor from "markdown-it-anchor";
import mdPrism from "markdown-it-prism";

const rootDir = path.resolve(process.cwd());
const contentDir = path.join(rootDir, "content");
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(rootDir, "public");
const basePath = process.env.BASE_PATH || "";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(mdAnchor, { permalink: mdAnchor.permalink.ariaHidden() }).use(mdPrism);

const walkMarkdownFiles = (dir) => {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      result.push(full);
    }
  }
  return result;
};

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const slugify = (text) =>
  text
    .toString()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

const loadTemplate = (name) => {
  const p = path.join(rootDir, "templates", `${name}.html`);
  return fs.readFileSync(p, "utf8");
};

const writePage = (relativePath, html) => {
  const outPath = path.join(distDir, relativePath);
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, html, "utf8");
};

const copyPublic = () => {
  if (!fs.existsSync(publicDir)) return;
  const copy = (src, dest) => {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      ensureDir(dest);
      for (const entry of fs.readdirSync(src)) {
        copy(path.join(src, entry), path.join(dest, entry));
      }
    } else {
      ensureDir(path.dirname(dest));
      fs.copyFileSync(src, dest);
    }
  };
  copy(publicDir, distDir);
};

const build = () => {
  console.log("▶ 정적 블로그 빌드 시작...");
  ensureDir(distDir);
  copyPublic();

  const baseTemplate = loadTemplate("base");
  const postTemplate = loadTemplate("post");
  const listTemplate = loadTemplate("list");

  const mdFiles = walkMarkdownFiles(contentDir);

  const posts = mdFiles.map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);

    const html = md.render(content);
    const rel = path.relative(contentDir, filePath);
    const parsed = path.parse(rel);

    const date = data.date ? new Date(data.date) : new Date();
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");

    const slug = data.slug || slugify(parsed.name);
    const url = `${basePath}/blog/${year}/${month}/${slug}/`;

    const tags = Array.isArray(data.tags)
      ? data.tags.map(String)
      : data.tags
      ? String(data.tags).split(",").map((t) => t.trim())
      : [];

    const category = data.category || "Uncategorized";

    return {
      id: slug,
      title: data.title || parsed.name,
      date,
      year,
      month,
      category,
      tags,
      summary: data.summary || "",
      url,
      html,
    };
  });

  posts.sort((a, b) => b.date - a.date);

  const byYearMonth = new Map();
  const byCategory = new Map();
  const byTag = new Map();

  for (const post of posts) {
    const ymKey = `${post.year}-${post.month}`;
    if (!byYearMonth.has(ymKey)) byYearMonth.set(ymKey, []);
    byYearMonth.get(ymKey).push(post);

    if (!byCategory.has(post.category)) byCategory.set(post.category, []);
    byCategory.get(post.category).push(post);

    for (const tag of post.tags) {
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag).push(post);
    }
  }

  const renderPage = (title, body, layout = "base") => {
    const tpl = baseTemplate
      .replace(/{{base}}/g, basePath)
      .replace("{{title}}", title)
      .replace("{{content}}", body);
    return tpl;
  };

  // 개별 포스트
  for (const post of posts) {
    const body = postTemplate
      .replace(/{{title}}/g, post.title)
      .replace("{{date}}", post.date.toISOString().slice(0, 10))
      .replace("{{category}}", post.category)
      .replace(
        "{{tags}}",
        post.tags.map((t) =>
          `<a href="${basePath}/tags/${slugify(t)}/">${t}</a>`
        ).join(
          ", ",
        ) || "No tags",
      )
      .replace("{{content}}", post.html);

    const html = renderPage(post.title, body);
    const outRel = path.join(
      "blog",
      post.year,
      post.month,
      post.id,
      "index.html",
    );
    writePage(outRel, html);
  }

  const renderList = (title, description, items, isHome = false) => {
    const entries = items
      .map(
        (p) => `
<li class="post-list-item">
  <a href="${p.url}">
    <h3>${p.title}</h3>
    <p class="meta">
      <span>${p.date.toISOString().slice(0, 10)}</span>
      <span>· ${p.category}</span>
    </p>
    ${
      p.summary
        ? `<p class="summary">${p.summary}</p>`
        : ""
    }
  </a>
</li>`,
      )
      .join("\n");

    const heroImage = isHome
      ? `<div class="hero-image"><img src="${basePath}/logo.jpg" alt="Blog Hero" /></div>`
      : "";

    const body = listTemplate
      .replace("{{heroImage}}", heroImage)
      .replace("{{title}}", title)
      .replace("{{description}}", description)
      .replace("{{items}}", entries || "<p>아직 게시글이 없습니다.</p>");

    return renderPage(title, body);
  };

  // Home
  {
    const latest = posts.slice(0, 5);
    const html = renderList(
      "Home",
      "최근 게시글",
      latest,
      true, // isHome
    );
    writePage("index.html", html);
  }

  // About (정적)
  {
    const aboutPath = path.join(contentDir, "about.md");
    let aboutHtml = "<p>소개 페이지를 준비 중입니다.</p>";
    if (fs.existsSync(aboutPath)) {
      const { content } = matter(fs.readFileSync(aboutPath, "utf8"));
      aboutHtml = md.render(content);
    }
    const body = `
<section class="page">
  <h1>About</h1>
  <div class="markdown-body">
    ${aboutHtml}
  </div>
</section>`;
    const html = renderPage("About", body);
    writePage("about/index.html", html);
  }

  // Blog 전체 리스트
  {
    const html = renderList(
      "Blog",
      "전체 게시글",
      posts,
    );
    writePage("blog/index.html", html);
  }

  // 월별 아카이브
  for (const [ym, list] of byYearMonth.entries()) {
    const [year, month] = ym.split("-");
    const title = `${year}년 ${month}월 글`;
    const html = renderList(title, `${ym}의 글 목록`, list);
    writePage(path.join("blog", year, month, "index.html"), html);
  }

  // 카테고리별
  for (const [category, list] of byCategory.entries()) {
    const slug = slugify(category);
    const title = `Category: ${category}`;
    const html = renderList(title, `${category} 카테고리의 글`, list);
    writePage(path.join("categories", slug, "index.html"), html);
  }

  // 태그별
  for (const [tag, list] of byTag.entries()) {
    const slug = slugify(tag);
    const title = `Tag: ${tag}`;
    const html = renderList(title, `${tag} 태그의 글`, list);
    writePage(path.join("tags", slug, "index.html"), html);
  }

  console.log("✅ 빌드 완료: dist/ 폴더를 GitHub Pages에 배포하세요.");
};

build();

