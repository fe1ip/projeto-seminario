const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
const LOGO_SRC = path.resolve(__dirname, '..', 'UniLogoCor2.png');
const STUDENTS_FILE = path.resolve(__dirname, '..', 'students.json');

const ANO = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

// Lê students.json se existir, senão usa o aluno padrão (felipe)
let students;
if (fs.existsSync(STUDENTS_FILE)) {
  students = JSON.parse(fs.readFileSync(STUDENTS_FILE, 'utf8'));
  console.log(`📋 Gerando PDFs para ${students.length} aluno(s) de students.json\n`);
} else {
  students = [{
    username: 'felipe',
    name: 'Felipe',
    cpf: '000.000.000-00',
    curso: 'Ciência da Computação',
    matricula: '202600001'
  }];
  console.log('⚠️  students.json não encontrado. Usando aluno padrão (felipe).\n');
}

const css = `
<style>
body { font-family: Georgia, serif; margin: 40px; color: #222; }
.header { text-align: center; }
.logo { width: 180px; margin-bottom: 10px; }
h1 { font-size: 28px; margin: 5px 0; }
h2 { text-align: center; margin-top: 20px; }
.content { margin-top: 30px; line-height: 1.6; font-size: 16px; }
.signature { margin-top: 60px; text-align: center; }
table { width: 100%; border-collapse: collapse; margin-top: 15px; }
table, th, td { border: 1px solid #000; }
th, td { padding: 8px; }
.diploma { text-align: center; margin-top: 80px; }
.big-name { font-size: 26px; font-weight: bold; margin: 20px 0; }
</style>`;

function buildDocs(student) {
  const { name: ALUNO, cpf: CPF = '000.000.000-00', curso: CURSO, matricula: MATRICULA } = student;

  const header = `
<div class="header">
  <img src="${LOGO_SRC.replace(/\\/g, '/')}" class="logo">
  <h1>UNIFICTA UNIVERSITY</h1>
</div>`;

  return [
    {
      file: 'Atestado_de_Matricula.pdf',
      html: `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Atestado</title>${css}</head><body>
${header}
<h2>ATESTADO DE MATRÍCULA</h2>
<div class="content">
Atestamos que <strong>${ALUNO}</strong>, CPF nº ${CPF},
encontra-se regularmente matriculado no curso de <strong>${CURSO}</strong>,
sob matrícula nº ${MATRICULA}, no período letivo 2026/1.<br><br>
Turno: Noturno<br>Carga horária: 3.000 horas<br><br>
Vilhena - RO, ${ANO}.
</div>
<div class="signature">______________________________<br>Maria Oliveira<br>Secretária Acadêmica</div>
</body></html>`
    },
    {
      file: 'Historico_Escolar.pdf',
      html: `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Histórico</title>${css}</head><body>
${header}
<h2>HISTÓRICO ESCOLAR</h2>
<div class="content">
Aluno: ${ALUNO}<br>CPF: ${CPF}<br>Curso: ${CURSO}
</div>
<table>
<tr><th>Disciplina</th><th>Carga Horária</th><th>Nota</th><th>Situação</th></tr>
<tr><td>Algoritmos</td><td>80h</td><td>9,0</td><td>Aprovado</td></tr>
<tr><td>Cálculo I</td><td>60h</td><td>7,5</td><td>Aprovado</td></tr>
<tr><td>Estrutura de Dados</td><td>100h</td><td>8,8</td><td>Aprovado</td></tr>
</table>
<div class="signature">______________________________<br>Maria Oliveira</div>
</body></html>`
    },
    {
      file: 'Carteirinha_de_Estudante.pdf',
      html: `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Carteirinha</title>${css}</head><body>
${header}
<h2>CARTEIRA DE ESTUDANTE</h2>
<div class="content">
Nome: ${ALUNO}<br>Curso: ${CURSO}<br>Matrícula: ${MATRICULA}<br>Validade: 31/12/2026
</div>
</body></html>`
    },
    {
      file: 'Ementa_de_Disciplinas.pdf',
      html: `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Ementa</title>${css}</head><body>
${header}
<h2>EMENTA DE DISCIPLINAS</h2>
<div class="content">
Aluno: ${ALUNO}<br>Curso: ${CURSO}<br><br>
Disciplina: Algoritmos e Programação<br>Carga Horária: 80h<br><br>
<strong>Ementa:</strong><br>Lógica de programação, estruturas de controle e funções.<br><br>
<strong>Conteúdo:</strong>
<ul>
<li>Variáveis e tipos de dados</li>
<li>Estruturas de repetição</li>
<li>Funções e recursão</li>
</ul>
Professor: Carlos Mendes
</div>
</body></html>`
    },
    {
      file: 'Certificado_de_Conclusao.pdf',
      html: `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Certificado</title>${css}</head><body>
${header}
<h2>CERTIFICADO DE CONCLUSÃO</h2>
<div class="content">Certificamos que</div>
<div class="diploma">
<div class="big-name">${ALUNO}</div>
concluiu o curso de ${CURSO}, com carga horária de 3.000 horas, no período de 2022 a 2025.
</div>
<div class="signature">______________________________<br>Diretor Geral</div>
</body></html>`
    },
    {
      file: 'Diploma.pdf',
      html: `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Diploma</title>${css}</head><body>
${header}
<h2>DIPLOMA</h2>
<div class="diploma">
A UNIFICTA UNIVERSITY confere a
<div class="big-name">${ALUNO}</div>
o grau de <strong>Bacharel em ${CURSO}</strong>
<br><br>Colação de grau: 20 de fevereiro de 2026
</div>
<div class="signature">
______________________________<br>Reitor<br><br>
______________________________<br>Secretário Acadêmico
</div>
</body></html>`
    }
  ];
}

let totalOk = 0, totalFail = 0;

for (const student of students) {
  const outDir = path.resolve(__dirname, '..', 'docs', student.username);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const docs = buildDocs(student);
  let ok = 0;

  console.log(`👤 ${student.name} (${student.username})`);
  docs.forEach(({ file, html }) => {
    const htmlPath = path.join(outDir, file.replace('.pdf', '.html'));
    const pdfPath  = path.join(outDir, file);
    fs.writeFileSync(htmlPath, html, 'utf8');
    try {
      execSync(`"${CHROME}" --headless=new --no-sandbox --disable-gpu --print-to-pdf="${pdfPath}" "file:///${htmlPath.replace(/\\/g, '/')}" 2>NUL`, { stdio: 'pipe' });
      fs.unlinkSync(htmlPath);
      console.log(`  ✔ ${file}`);
      ok++;
    } catch (e) {
      console.error(`  ✘ ${file}: ${e.message}`);
      totalFail++;
    }
  });

  console.log(`  → ${ok}/${docs.length} PDFs gerados em docs/${student.username}/\n`);
  totalOk += ok;
}

console.log(`✅ Total: ${totalOk} PDFs gerados, ${totalFail} falhas.`);
