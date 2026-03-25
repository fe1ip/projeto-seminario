const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.resolve(__dirname, '..', 'docs', 'felipe');
const LOGO_SRC = path.resolve(__dirname, '..', 'UniLogoCor2.png');

const ALUNO = 'Felipe';
const CPF   = '000.000.000-00';
const CURSO = 'Ciência da Computação';
const MATRICULA = '202600001';
const ANO   = '21 de março de 2026';

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

const header = `
<div class="header">
  <img src="${LOGO_SRC.replace(/\\/g, '/')}" class="logo">
  <h1>UNIFICTA UNIVERSITY</h1>
</div>`;

const docs = [
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

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let ok = 0;
docs.forEach(({ file, html }) => {
  const htmlPath = path.join(OUT_DIR, file.replace('.pdf', '.html'));
  const pdfPath  = path.join(OUT_DIR, file);
  fs.writeFileSync(htmlPath, html, 'utf8');
  try {
    execSync(`"${CHROME}" --headless=new --no-sandbox --disable-gpu --print-to-pdf="${pdfPath}" "file:///${htmlPath.replace(/\\/g, '/')}" 2>NUL`, { stdio: 'pipe' });
    fs.unlinkSync(htmlPath);
    console.log(`✔ ${file}`);
    ok++;
  } catch (e) {
    console.error(`✘ ${file}: ${e.message}`);
  }
});

console.log(`\nGerados ${ok}/${docs.length} PDFs em docs/felipe/`);
