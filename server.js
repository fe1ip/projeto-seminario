const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execSync } = require('child_process');

const PORT = 3000;
const ROOT = __dirname;

// Load .env
try {
  const envFile = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
} catch (e) {}

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH))
    return process.env.CHROME_PATH;

  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ];
    for (const p of candidates) if (fs.existsSync(p)) return p;
  } else if (process.platform === 'darwin') {
    const p = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (fs.existsSync(p)) return p;
  } else {
    for (const cmd of ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium']) {
      try { return execSync(`which ${cmd}`, { stdio: 'pipe' }).toString().trim(); } catch (_) {}
    }
  }

  throw new Error('Chrome não encontrado. Instale o Chrome ou defina a variável CHROME_PATH.');
}

const CHROME = findChrome();
const LOGO_SRC = path.resolve(ROOT, 'UniLogoCor2.png').replace(/\\/g, '/');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.pdf':  'application/pdf',
  '.json': 'application/json',
};

// ── PDF generation ──────────────────────────────────────────────────────────

function buildDocs(student) {
  const {
    name: ALUNO,
    cpf:       CPF       = '000.000.000-00',
    curso:     CURSO     = '',
    matricula: MATRICULA = '',
  } = student;

  const ANO = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const css = `<style>
body{font-family:Georgia,serif;margin:40px;color:#222}
.header{text-align:center}.logo{width:180px;margin-bottom:10px}
h1{font-size:28px;margin:5px 0}h2{text-align:center;margin-top:20px}
.content{margin-top:30px;line-height:1.6;font-size:16px}
.signature{margin-top:60px;text-align:center}
table{width:100%;border-collapse:collapse;margin-top:15px}
table,th,td{border:1px solid #000}th,td{padding:8px}
.diploma{text-align:center;margin-top:80px}
.big-name{font-size:26px;font-weight:bold;margin:20px 0}
</style>`;

  const header = `<div class="header">
  <img src="file:///${LOGO_SRC}" class="logo">
  <h1>UNIFICTA UNIVERSITY</h1>
</div>`;

  const wrap = (title, body) =>
    `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8">
    <title>${title}</title>${css}</head><body>${header}${body}</body></html>`;

  return [
    {
      file: 'Atestado_de_Matricula.pdf',
      html: wrap('Atestado', `
        <h2>ATESTADO DE MATRÍCULA</h2>
        <div class="content">
          Atestamos que <strong>${ALUNO}</strong>, CPF nº ${CPF},
          encontra-se regularmente matriculado no curso de <strong>${CURSO}</strong>,
          sob matrícula nº ${MATRICULA}, no período letivo 2026/1.<br><br>
          Turno: Noturno &nbsp;|&nbsp; Carga horária: 3.000 horas<br><br>
          Vilhena - RO, ${ANO}.
        </div>
        <div class="signature">______________________________<br>Maria Oliveira<br>Secretária Acadêmica</div>`),
    },
    {
      file: 'Historico_Escolar.pdf',
      html: wrap('Histórico', `
        <h2>HISTÓRICO ESCOLAR</h2>
        <div class="content">Aluno: ${ALUNO} &nbsp;|&nbsp; CPF: ${CPF} &nbsp;|&nbsp; Curso: ${CURSO}</div>
        <table>
          <tr><th>Disciplina</th><th>Carga Horária</th><th>Nota</th><th>Situação</th></tr>
          <tr><td>Algoritmos</td><td>80h</td><td>9,0</td><td>Aprovado</td></tr>
          <tr><td>Cálculo I</td><td>60h</td><td>7,5</td><td>Aprovado</td></tr>
          <tr><td>Estrutura de Dados</td><td>100h</td><td>8,8</td><td>Aprovado</td></tr>
        </table>
        <div class="signature">______________________________<br>Maria Oliveira</div>`),
    },
    {
      file: 'Carteirinha_de_Estudante.pdf',
      html: wrap('Carteirinha', `
        <h2>CARTEIRA DE ESTUDANTE</h2>
        <div class="content">
          Nome: ${ALUNO}<br>Curso: ${CURSO}<br>
          Matrícula: ${MATRICULA}<br>Validade: 31/12/2026
        </div>`),
    },
    {
      file: 'Ementa_de_Disciplinas.pdf',
      html: wrap('Ementa', `
        <h2>EMENTA DE DISCIPLINAS</h2>
        <div class="content">
          Aluno: ${ALUNO} &nbsp;|&nbsp; Curso: ${CURSO}<br><br>
          Disciplina: Algoritmos e Programação &nbsp;|&nbsp; Carga Horária: 80h<br><br>
          <strong>Ementa:</strong> Lógica de programação, estruturas de controle e funções.<br><br>
          <strong>Conteúdo:</strong>
          <ul>
            <li>Variáveis e tipos de dados</li>
            <li>Estruturas de repetição</li>
            <li>Funções e recursão</li>
          </ul>
          Professor: Carlos Mendes
        </div>`),
    },
    {
      file: 'Certificado_de_Conclusao.pdf',
      html: wrap('Certificado', `
        <h2>CERTIFICADO DE CONCLUSÃO</h2>
        <div class="content">Certificamos que</div>
        <div class="diploma">
          <div class="big-name">${ALUNO}</div>
          concluiu o curso de ${CURSO}, com carga horária de 3.000 horas, no período de 2022 a 2025.
        </div>
        <div class="signature">______________________________<br>Diretor Geral</div>`),
    },
    {
      file: 'Diploma.pdf',
      html: wrap('Diploma', `
        <h2>DIPLOMA</h2>
        <div class="diploma">
          A UNIFICTA UNIVERSITY confere a
          <div class="big-name">${ALUNO}</div>
          o grau de <strong>Bacharel em ${CURSO}</strong><br><br>
          Colação de grau: 20 de fevereiro de 2026
        </div>
        <div class="signature">
          ______________________________<br>Reitor<br><br>
          ______________________________<br>Secretário Acadêmico
        </div>`),
    },
  ];
}

function generateDocsForStudent(student) {
  const outDir = path.resolve(ROOT, 'docs', student.username);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const docs = buildDocs(student);
  let ok = 0;

  docs.forEach(({ file, html }) => {
    const htmlPath = path.join(outDir, file.replace('.pdf', '.html'));
    const pdfPath  = path.join(outDir, file);
    fs.writeFileSync(htmlPath, html, 'utf8');
    try {
      execSync(
        `"${CHROME}" --headless=new --no-sandbox --disable-gpu --print-to-pdf="${pdfPath}" "file:///${htmlPath.replace(/\\/g, '/')}" 2>NUL`,
        { stdio: 'pipe' }
      );
      fs.unlinkSync(htmlPath);
      ok++;
    } catch (e) {
      console.error(`  ✘ ${file}: ${e.message}`);
    }
  });

  console.log(`[docs] ${student.username}: ${ok}/${docs.length} PDFs gerados`);
}

// ── HTTP server ──────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // POST /generate-docs  →  generate PDFs for one student
  if (req.method === 'POST' && req.url === '/generate-docs') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const student = JSON.parse(body);
        generateDocsForStudent(student);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // POST /api/chat  →  Gemini API proxy
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'sua_chave_aqui' || apiKey.trim() === '') {
          res.writeHead(500);
          res.end(JSON.stringify({ error: { message: 'Chave de API do Gemini não configurada no arquivo .env. Abra o arquivo .env e coloque sua chave.' }}));
          return;
        }

        const https = require('https');
        const options = {
          hostname: 'generativelanguage.googleapis.com',
          port: 443,
          path: `/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        };

        const proxyReq = https.request(options, proxyRes => {
          let proxyData = '';
          proxyRes.on('data', d => { proxyData += d; });
          proxyRes.on('end', () => {
            res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(proxyData);
          });
        });

        proxyReq.on('error', e => {
          res.writeHead(500);
          res.end(JSON.stringify({ error: { message: e.message }}));
        });

        proxyReq.write(body); // Fowards the exact same JSON from frontend to Google
        proxyReq.end();
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: { message: e.message }}));
      }
    });
    return;
  }

  // Static file serving
  let urlPath = decodeURIComponent(req.url.split('?')[0]); // strip query string and decode
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    const ext  = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}`);
  console.log('   Abra o link acima no navegador.\n');
});
