import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'astro/zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const blogContentDir = path.join(projectRoot, 'src', 'content', 'blog');

// --- Zod Schema Replication matching content.config.ts ---
const DISCIPLINAS = ['karate', 'bjj', 'muay-thai', 'boxeo', 'mma'];
const TIPOS_ARTICULO = ['guia-tecnica', 'historia', 'filosofia', 'entrenamiento'];
const NIVELES_DIFICULTAD = ['principiante', 'intermedio', 'avanzado', 'todos'];

const blogSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(120),
  description: z.string().min(10, 'La descripción debe ser descriptiva').max(300),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  disciplina: z.enum(DISCIPLINAS, {
    errorMap: () => ({ message: 'Disciplina inválida. Permitidas: karate, bjj, muay-thai, boxeo, mma' }),
  }),
  tipo: z.enum(TIPOS_ARTICULO, {
    errorMap: () => ({ message: 'Tipo inválido. Permitidos: guia-tecnica, historia, filosofia, entrenamiento' }),
  }),
  dificultad: z.enum(NIVELES_DIFICULTAD).default('todos'),
  autor: z.object({
    name: z.string(),
    role: z.string().default('Instructor Marcial'),
    avatar: z.string().optional(),
  }),
  tags: z.array(z.string()).default([]),
  heroImage: z.string().optional(),
  readingTime: z.string().regex(/^\d+\s+min$/, 'Formato esperado: "X min" (ej. "6 min")'),
  featured: z.boolean().default(false),
});

// Helper to crawl directory for files
function getFilesRecursively(dir, extension = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getFilesRecursively(full, extension));
    } else if (!extension || item.endsWith(extension)) {
      results.push(full);
    }
  }
  return results;
}

// Simple YAML frontmatter parser for audit
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const raw = match[1];
  const lines = raw.split(/\r?\n/);
  const data = {};
  let currentKey = null;
  let inObject = null;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    // Sub-field (autor.name, autor.role)
    if (line.startsWith('  ') && currentKey === 'autor') {
      const subMatch = line.trim().match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
      if (subMatch) {
        data.autor = data.autor || {};
        data.autor[subMatch[1]] = subMatch[2].replace(/^['\"]|['\"]$/g, '');
      }
      continue;
    }

    // Array tags: ['a', 'b']
    const arrayMatch = line.match(/^([a-zA-Z0-9_]+):\s*\[(.*)\]$/);
    if (arrayMatch) {
      currentKey = arrayMatch[1];
      data[currentKey] = arrayMatch[2]
        .split(',')
        .map((s) => s.trim().replace(/^['\"]|['\"]$/g, ''))
        .filter(Boolean);
      continue;
    }

    // Normal key: value
    const kvMatch = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let val = kvMatch[2].trim();
      currentKey = key;
      if (val === '') {
        // could be object start like autor:
        continue;
      }
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else val = val.replace(/^['\"]|['\"]$/g, '');
      data[key] = val;
    }
  }
  return data;
}

describe('Suite 1: Rutas Críticas y Archivos Generados en dist/', () => {
  const criticalPaths = [
    'index.html',
    'blog/index.html',
    'about/index.html',
    'artes/karate/index.html',
    'artes/bjj/index.html',
    'artes/muay-thai/index.html',
    'artes/boxeo/index.html',
    'artes/mma/index.html',
    'blog/karate-filosofia-dojo-kun/index.html',
    'rss.xml',
  ];

  for (const relPath of criticalPaths) {
    test(`Existe y no está vacío: dist/${relPath}`, () => {
      const fullPath = path.join(distDir, relPath);
      assert.ok(fs.existsSync(fullPath), `El archivo dist/${relPath} debe existir`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 0, `El archivo dist/${relPath} no debe tener tamaño 0 (tamaño: ${stat.size} bytes)`);
    });
  }
});

describe('Suite 2: Integridad del HTML y Ausencia de Glitches de Renderizado', () => {
  const htmlFiles = getFilesRecursively(distDir, '.html');

  test(`Se han generado al menos 10 páginas HTML (encontradas: ${htmlFiles.length})`, () => {
    assert.ok(htmlFiles.length >= 10, 'Debe haber al menos 10 páginas HTML generadas');
  });

  for (const filePath of htmlFiles) {
    const rel = path.relative(distDir, filePath);
    test(`HTML Válido y Libre de Glitches: ${rel}`, () => {
      const content = fs.readFileSync(filePath, 'utf8');

      // Doctype
      assert.ok(/<!doctype\s+html>/i.test(content), `${rel} debe declarar <!doctype html>`);
      // Closing tag
      assert.ok(/<\/html>/i.test(content), `${rel} debe tener tag de cierre </html>`);
      // Lang="es"
      assert.ok(/<html[^>]*lang=["']es["']/i.test(content), `${rel} debe tener lang="es"`);
      // Title
      assert.ok(/<title>[^<]+<\/title>/i.test(content), `${rel} debe tener una etiqueta <title> no vacía`);

      // Glitch detection: no undefined, NaN or [object Object] as visible strings
      const hasUndefinedGlitch = />[^<]*\bundefined\b[^<]*</.test(content);
      const hasObjectObjectGlitch = />[^<]*\[object Object\][^<]*</.test(content);
      const hasNanGlitch = />[^<]*\bNaN\b[^<]*</.test(content);

      assert.strictEqual(hasUndefinedGlitch, false, `${rel} contiene texto literal 'undefined'`);
      assert.strictEqual(hasObjectObjectGlitch, false, `${rel} contiene texto literal '[object Object]'`);
      assert.strictEqual(hasNanGlitch, false, `${rel} contiene texto literal 'NaN'`);
    });
  }
});

describe('Suite 3: Rastreo de Enlaces Internos y Navegación Principal', () => {
  const htmlFiles = getFilesRecursively(distDir, '.html');
  const hrefRegex = /href=["']([^"'#?]+)(?:[#?][^"']*)?["']/g;

  test('Todos los enlaces internos resuelven a rutas o recursos reales en dist/', () => {
    const brokenLinks = [];
    let verifiedCount = 0;

    for (const filePath of htmlFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      let match;
      while ((match = hrefRegex.exec(content)) !== null) {
        const href = match[1].trim();

        // Ignorar externos, esquemas y URLs vacías
        if (
          !href ||
          href.startsWith('http://') ||
          href.startsWith('https://') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('javascript:')
        ) {
          continue;
        }

        verifiedCount++;
        let targetPath;
        if (href.startsWith('/')) {
          targetPath = path.join(distDir, href);
        } else {
          targetPath = path.join(path.dirname(filePath), href);
        }

        let exists = false;
        if (fs.existsSync(targetPath)) {
          if (fs.statSync(targetPath).isDirectory()) {
            exists = fs.existsSync(path.join(targetPath, 'index.html'));
          } else {
            exists = true;
          }
        } else if (fs.existsSync(targetPath + '.html')) {
          exists = true;
        } else if (fs.existsSync(path.join(targetPath, 'index.html'))) {
          exists = true;
        }

        if (!exists) {
          brokenLinks.push({
            page: path.relative(distDir, filePath),
            href,
            expectedTarget: targetPath,
          });
        }
      }
    }

    assert.strictEqual(
      brokenLinks.length,
      0,
      `Se encontraron ${brokenLinks.length} enlaces rotos:\n` + JSON.stringify(brokenLinks, null, 2)
    );
    assert.ok(verifiedCount > 20, `Se deben verificar enlaces (verificados: ${verifiedCount})`);
  });

  test('La barra de navegación principal incluye las 5 disciplinas y enlaces requeridos', () => {
    const indexPath = path.join(distDir, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');

    const expectedNavHrefs = [
      'href="/"',
      'href="/blog/"',
      'href="/about/"',
      'href="/artes/karate/"',
      'href="/artes/bjj/"',
      'href="/artes/muay-thai/"',
      'href="/artes/boxeo/"',
      'href="/artes/mma/"',
    ];

    for (const link of expectedNavHrefs) {
      assert.ok(content.includes(link), `La barra de navegación debe incluir ${link}`);
    }
  });
});

describe('Suite 4: Verificación del Feed RSS (dist/rss.xml)', () => {
  const rssPath = path.join(distDir, 'rss.xml');

  test('dist/rss.xml es un documento RSS 2.0 válido con estructura XML completa', () => {
    assert.ok(fs.existsSync(rssPath), 'dist/rss.xml debe existir');
    const content = fs.readFileSync(rssPath, 'utf8');

    assert.ok(content.includes('<rss version="2.0">'), 'Debe contener <rss version="2.0">');
    assert.ok(content.includes('<channel>'), 'Debe contener elemento <channel>');
    assert.ok(content.includes('</channel>'), 'Debe cerrar elemento </channel>');
    assert.ok(content.includes('</rss>'), 'Debe cerrar elemento </rss>');
    assert.ok(content.includes('<title>'), 'Debe contener <title>');
    assert.ok(content.includes('<description>'), 'Debe contener <description>');

    // Contar los items del blog (deben ser 5)
    const items = content.match(/<item>/g) || [];
    assert.strictEqual(items.length, 5, `El feed RSS debe contener 5 ítems (encontrados: ${items.length})`);

    // Comprobar que incluye enlaces a cada uno de los 5 artículos
    const expectedSlugs = [
      'karate-filosofia-dojo-kun',
      'bjj-fundamentos-pasaje-guardia',
      'muay-thai-tecnica-teep-frontal',
      'boxeo-biomecanica-jab-perfecto',
      'mma-evolucion-artes-marciales-mixtas',
    ];

    for (const slug of expectedSlugs) {
      assert.ok(
        content.includes(`/blog/${slug}/`),
        `El feed RSS debe contener enlace para el artículo /blog/${slug}/`
      );
    }
  });
});

describe('Suite 5: Validación Estricta del Esquema Zod (src/content.config.ts)', () => {
  test('Caso normal: Los 5 artículos reales del blog pasan la validación sin errores', () => {
    const files = fs.readdirSync(blogContentDir);
    assert.strictEqual(files.length, 5, 'Debe haber exactamente 5 artículos en src/content/blog');

    for (const file of files) {
      const content = fs.readFileSync(path.join(blogContentDir, file), 'utf8');
      const frontmatter = parseFrontmatter(content);
      assert.ok(frontmatter, `Frontmatter debe ser parseable en ${file}`);

      const result = blogSchema.safeParse(frontmatter);
      assert.strictEqual(
        result.success,
        true,
        `El archivo ${file} falló la validación del esquema Zod: ${JSON.stringify(result.error?.issues, null, 2)}`
      );
    }
  });

  test('Caso límite: Título de exactamente 5 caracteres es aceptado', () => {
    const validData = {
      title: '12345',
      description: 'Descripción descriptiva con más de diez caracteres',
      pubDate: '2026-03-01',
      disciplina: 'karate',
      tipo: 'filosofia',
      readingTime: '5 min',
      autor: { name: 'Sensei' },
    };
    const res = blogSchema.safeParse(validData);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.dificultad, 'todos'); // default
    assert.strictEqual(res.data.featured, false); // default
    assert.strictEqual(res.data.autor.role, 'Instructor Marcial'); // default
  });

  test('Caso inválido: Título con menos de 5 caracteres es rechazado', () => {
    const invalidData = {
      title: 'Kata',
      description: 'Descripción descriptiva válida',
      pubDate: '2026-03-01',
      disciplina: 'karate',
      tipo: 'filosofia',
      readingTime: '5 min',
      autor: { name: 'Sensei' },
    };
    const res = blogSchema.safeParse(invalidData);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.issues.some((i) => i.message.includes('al menos 5 caracteres')));
  });

  test('Caso límite: Descripción de exactamente 10 caracteres es aceptada', () => {
    const validData = {
      title: 'Título Válido',
      description: '1234567890',
      pubDate: '2026-03-01',
      disciplina: 'boxeo',
      tipo: 'guia-tecnica',
      readingTime: '3 min',
      autor: { name: 'Coach' },
    };
    const res = blogSchema.safeParse(validData);
    assert.strictEqual(res.success, true);
  });

  test('Caso inválido: Descripción con menos de 10 caracteres es rechazada', () => {
    const invalidData = {
      title: 'Título Válido',
      description: 'Muy corta',
      pubDate: '2026-03-01',
      disciplina: 'boxeo',
      tipo: 'guia-tecnica',
      readingTime: '3 min',
      autor: { name: 'Coach' },
    };
    const res = blogSchema.safeParse(invalidData);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.issues.some((i) => i.message.includes('descriptiva')));
  });

  test('Caso inválido: Disciplina no autorizada (ej. kung-fu) es rechazada estrictamente', () => {
    const invalidData = {
      title: 'Fundamentos de Wing Chun',
      description: 'Descripción válida de más de diez caracteres',
      pubDate: '2026-03-01',
      disciplina: 'kung-fu',
      tipo: 'filosofia',
      readingTime: '5 min',
      autor: { name: 'Sifu' },
    };
    const res = blogSchema.safeParse(invalidData);
    assert.strictEqual(res.success, false, 'Una disciplina fuera del enum no debe ser permitida');
    assert.ok(
      res.error.issues.some((i) => i.path.includes('disciplina')),
      'El issue de error debe señalar el campo disciplina'
    );
  });

  test('Caso inválido: Tipo de artículo no autorizado (ej. noticia) es rechazado estrictamente', () => {
    const invalidData = {
      title: 'Resultados del Torneo Nacional',
      description: 'Descripción válida de más de diez caracteres',
      pubDate: '2026-03-01',
      disciplina: 'karate',
      tipo: 'noticia',
      readingTime: '5 min',
      autor: { name: 'Reportero' },
    };
    const res = blogSchema.safeParse(invalidData);
    assert.strictEqual(res.success, false, 'Un tipo fuera del enum no debe ser permitido');
    assert.ok(
      res.error.issues.some((i) => i.path.includes('tipo')),
      'El issue de error debe señalar el campo tipo'
    );
  });

  test('Casos límite regex readingTime: acepta "1 min", "12 min"; rechaza "5 mins", "5m", "rapido"', () => {
    const base = {
      title: 'Título Válido',
      description: 'Descripción descriptiva válida',
      pubDate: '2026-03-01',
      disciplina: 'mma',
      tipo: 'historia',
      autor: { name: 'Autor' },
    };

    assert.strictEqual(blogSchema.safeParse({ ...base, readingTime: '1 min' }).success, true);
    assert.strictEqual(blogSchema.safeParse({ ...base, readingTime: '120 min' }).success, true);

    const invalidFormats = ['5 mins', '5m', '5', 'min', 'rápido', '', '6 min extra'];
    for (const fmt of invalidFormats) {
      const res = blogSchema.safeParse({ ...base, readingTime: fmt });
      assert.strictEqual(
        res.success,
        false,
        `readingTime "${fmt}" debería fallar validación regex`
      );
    }
  });

  test('Caso campos obligatorios faltantes: rechaza objeto sin autor, sin pubDate, sin disciplina', () => {
    const incomplete = {
      title: 'Título Válido',
      description: 'Descripción descriptiva válida',
      readingTime: '5 min',
    };
    const res = blogSchema.safeParse(incomplete);
    assert.strictEqual(res.success, false);
    const missingFields = res.error.issues.map((i) => i.path[0]);
    assert.ok(missingFields.includes('pubDate'), 'Debe requerir pubDate');
    assert.ok(missingFields.includes('disciplina'), 'Debe requerir disciplina');
    assert.ok(missingFields.includes('tipo'), 'Debe requerir tipo');
    assert.ok(missingFields.includes('autor'), 'Debe requerir autor');
  });
});
