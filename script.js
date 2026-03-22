const STORAGE_USERS = 'portal_users';
const STORAGE_CURRENT = 'portal_currentUser';
const STORAGE_REQUESTS = 'portal_requests';
let resetSlider = null;

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  ensureDefaultUsers();
  bindEvents();
  initSlider();
  loadCurrentUser();
}

function ensureDefaultUsers() {
  if (!localStorage.getItem(STORAGE_USERS)) {
    const defaultUsers = [
      { username: 'admin', password: 'admin', name: 'Administrador', role: 'admin' }
    ];
    localStorage.setItem(STORAGE_USERS, JSON.stringify(defaultUsers));
  }
}

function bindEvents() {
    const bind = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener(event, handler);
    }
  };

  bind('btnGoToLogin', 'click', () => openAccountDialog('admin'));
  bind('btnGoToRegister', 'click', () => openAccountDialog('aluno'));
  bind('loginForm', 'submit', handleLogin);
  bind('loginUsername', 'keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('loginPassword').focus();
    }
  });
  bind('loginPassword', 'keydown', (e) => {
    if (e.key === 'Enter' && e.target.value) {
      document.getElementById('loginForm').requestSubmit();
    }
  });
  bind('registerForm', 'submit', handleRegister);
  bind('registerName', 'keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('registerPassword').focus();
    }
  });
  bind('registerPassword', 'keydown', (e) => {
    if (e.key === 'Enter' && e.target.value) {
      document.getElementById('registerForm').requestSubmit();
    }
  });
  bind('logoutBtn', 'click', handleLogout);
  bind('btnSolicitarDocumento', 'click', () => {
    resetDocumentModalState();
    openModal('modalDocumento');
  });
  bind('btnDuvidas', 'click', () => openModal('modalGeral'));
  document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.view, btn.dataset.tab));
  });
  bind('formDocumento', 'submit', handleDocumentSubmit);
  bind('docOutro', 'keydown', (e) => {
    if (e.key === 'Enter' && e.target.value) {
      e.preventDefault();
      document.getElementById('formDocumento').requestSubmit();
    }
  });
  bind('formGeral', 'submit', handleGeneralSubmit);
  bind('formResposta', 'submit', handleAdminResponse);
  document.querySelectorAll('.doc-back-btn').forEach(btn => {
    btn.addEventListener('click', showDocumentCategoryStep);
  });
}

const DOCUMENT_STEP_CONFIG = {
  'Acadêmico': {
    stepId: 'docStepAcademico',
    selectId: 'docAcademicoSelect',
    titleId: 'docStepAcademicoTitle',
    defaultTitle: 'Solicitação de documentos'
  },
  'Financeiro': {
    stepId: 'docStepFinanceiro',
    selectId: 'docFinanceiroSelect',
    titleId: 'docStepFinanceiroTitle',
    defaultTitle: 'Solicitação financeira'
  },
  'Administrativo': {
    stepId: 'docStepAdministrativo',
    selectId: 'docAdministrativoSelect',
    titleId: 'docStepAdministrativoTitle',
    defaultTitle: 'Solicitação administrativa'
  }
};

function resetDocumentModalState() {
  document.getElementById('formDocumento').reset();
  document.getElementById('docTipo').value = '';
  document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('selected'));
  Object.keys(DOCUMENT_STEP_CONFIG).forEach(tipo => updateDocumentStepTitle(tipo));
  const r = document.getElementById('docResultado');
  if (r) {
    r.innerHTML = '';
    r.classList.add('hidden');
  }
  showDocumentCategoryStep();
}

function showDocumentStep(tipo) {
  const config = DOCUMENT_STEP_CONFIG[tipo];
  if (!config) return;

  const stepCategoria = document.getElementById('docStepCategoria');
  const step = document.getElementById(config.stepId);
  const submitBtn = document.querySelector('#formDocumento .btn-save');

  Object.values(DOCUMENT_STEP_CONFIG).forEach(({ stepId }) => {
    const section = document.getElementById(stepId);
    if (section) section.classList.add('hidden');
  });

  if (stepCategoria) stepCategoria.classList.add('hidden');
  if (step) step.classList.remove('hidden');
  if (submitBtn) submitBtn.textContent = 'Enviar Solicitação';
  updateDocumentStepTitle(tipo, tipo);
}

function showDocumentCategoryStep() {
  const stepCategoria = document.getElementById('docStepCategoria');
  const submitBtn = document.querySelector('#formDocumento .btn-save');

  if (stepCategoria) stepCategoria.classList.remove('hidden');
  Object.values(DOCUMENT_STEP_CONFIG).forEach(({ stepId, selectId }) => {
    const step = document.getElementById(stepId);
    const select = document.getElementById(selectId);
    if (step) step.classList.add('hidden');
    if (select) select.value = '';
  });

  if (submitBtn) submitBtn.textContent = 'Abrir';
}

function updateDocumentStepTitle(tipo, title = '') {
  const config = DOCUMENT_STEP_CONFIG[tipo];
  if (!config) return;

  const stepTitle = document.getElementById(config.titleId);
  if (!stepTitle) return;
  stepTitle.textContent = title || config.defaultTitle;
}

function updateHeaderAuthState(user, currentView = 'landingView') {
  const authNav = document.getElementById('authNav');
  const profileNav = document.getElementById('profileNav');
  const profileToggle = document.getElementById('profileToggle');
  const isLoggedIn = Boolean(user);
  const isLandingView = currentView === 'landingView';

  if (authNav) {
    authNav.hidden = isLoggedIn;
  }

  if (profileNav) {
    profileNav.hidden = !isLoggedIn || isLandingView;
  }

  if (profileToggle) {
    profileToggle.title = isLoggedIn ? `${user.name} - Sair` : 'Perfil';
    profileToggle.setAttribute('aria-label', isLoggedIn ? `Menu do perfil de ${user.name}` : 'Abrir menu do perfil');
  }
}

function loadCurrentUser() {
  const user = getCurrentUser();
  if (user) {
    showApp(user);
  } else {
    showLanding();
  }
}

function showLanding() {
  updateHeaderAuthState(null, 'landingView');
  document.getElementById('landingView').hidden = false;
  document.getElementById('loginView').hidden = true;
  document.getElementById('registerView').hidden = true;
  document.getElementById('appView').hidden = true;
  document.getElementById('adminView').hidden = true;
  if (resetSlider) resetSlider();
}

function showLoginView() {
  updateHeaderAuthState(null, 'loginView');
  document.getElementById('landingView').hidden = true;
  document.getElementById('loginView').hidden = false;
  document.getElementById('registerView').hidden = true;
  document.getElementById('appView').hidden = true;
  document.getElementById('adminView').hidden = true;
}

function showRegisterView() {
  updateHeaderAuthState(null, 'registerView');
  document.getElementById('landingView').hidden = true;
  document.getElementById('loginView').hidden = true;
  document.getElementById('registerView').hidden = false;
  document.getElementById('appView').hidden = true;
  document.getElementById('adminView').hidden = true;
}

function showRegister() {
  updateHeaderAuthState(null, 'registerView');
  document.getElementById('landingView').hidden = true;
  document.getElementById('loginLandingView').hidden = true;
  document.getElementById('registerLandingView').hidden = true;
  document.getElementById('loginView').hidden = true;
  document.getElementById('registerView').hidden = false;
  document.getElementById('appView').hidden = true;
  document.getElementById('adminView').hidden = true;
}

function showApp(user) {
  if (user.role === 'admin') {
    showAdminView(user);
  } else {
    showAppView(user);
  }
}

function showAppView(user) {
  updateHeaderAuthState(user, 'appView');
  document.getElementById('landingView').hidden = true;
  document.getElementById('loginView').hidden = true;
  document.getElementById('registerView').hidden = true;
  document.getElementById('appView').hidden = false;
  document.getElementById('adminView').hidden = true;
  switchTab('appView', 'documentos');
}

function showAdminView(user) {
  updateHeaderAuthState(user, 'adminView');
  document.getElementById('landingView').hidden = true;
  document.getElementById('loginView').hidden = true;
  document.getElementById('registerView').hidden = true;
  document.getElementById('appView').hidden = true;
  document.getElementById('adminView').hidden = false;
  switchTab('adminView', 'solicitacoes');
}


function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    alert('Usuário ou senha inválidos.');
    return;
  }

  setCurrentUser(user);
  showApp(user);
}

function handleLogout() {
  clearCurrentUser();
  showLanding();
}

function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!name || !password) {
    alert('Preencha todos os campos.');
    return;
  }

  const users = getUsers();
  if (users.find(u => u.name === name)) {
    alert('Já existe um usuário com esse nome.');
    return;
  }

  const username = name;
  const newUser = { username, password, name, role: 'aluno' };
  users.push(newUser);
  saveUsers(users);

  setCurrentUser(newUser);
  document.getElementById('registerForm').reset();
  alert('Cadastro realizado com sucesso. Você entrou no portal.');
  showApp(newUser);
}

function docFileName(tipo) {
  return tipo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_') + '.pdf';
}

async function handleDocumentSubmit(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const tipo = document.getElementById('docTipo').value;
  if (!tipo) { alert('Selecione o tipo de solicitação.'); return; }

  const stepConfig = DOCUMENT_STEP_CONFIG[tipo];
  const isStepVisible = stepConfig
    ? !document.getElementById(stepConfig.stepId)?.classList.contains('hidden')
    : false;

  if (stepConfig && !isStepVisible) {
    showDocumentStep(tipo);
    return;
  }

  let requestedItem = tipo;

  if (stepConfig) {
    const selectedRequest = document.getElementById(stepConfig.selectId)?.value;
    if (!selectedRequest) {
      alert('Selecione uma solicitação antes de enviar.');
      return;
    }
    requestedItem = selectedRequest;
  }

  const resultado = document.getElementById('docResultado');
  const fileName = docFileName(requestedItem);
  const filePath = `docs/${user.username}/${fileName}`;

  try {
    const res = await fetch(filePath, { method: 'HEAD' });
    if (res.ok) {
      salvarSolicitacao({ tipo: 'Documento', descricao: requestedItem, filePath, fileName });
      resultado.innerHTML = `
        ✅ Documento disponível:
        <a href="${filePath}" download="${fileName}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          ${fileName}
        </a>`;
      resultado.classList.remove('hidden');
      resetDocumentModalState();
      return;
    }
  } catch (_) {}

  salvarSolicitacao({ tipo: 'Documento', descricao: requestedItem });
  closeModal('modalDocumento');
  resetDocumentModalState();
}

function handleGeneralSubmit(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const tipo = document.getElementById('tipoMensagem').value;
  const desc = document.getElementById('mensagemTexto').value.trim();
  if (!desc) return;

  salvarSolicitacao({ tipo, descricao: desc, autoSolved: false });

  closeModal('modalGeral');
  document.getElementById('formGeral').reset();
}

function handleAdminResponse(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') return;

  const id = Number(document.getElementById('respostaId').value);
  const status = document.getElementById('respostaStatus').value;
  const responseText = document.getElementById('respostaTexto').value.trim();
  const fileInput = document.getElementById('respostaArquivo');
  const file = fileInput.files[0];

  const update = { status, response: responseText };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      update.fileData = reader.result;
      update.fileName = file.name;
      update.responseAt = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      applyResponse(id, update);
    };
    reader.readAsDataURL(file);
  } else {
    update.responseAt = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    applyResponse(id, update);
  }

  closeModal('modalResposta');
  document.getElementById('formResposta').reset();
}

function applyResponse(id, update) {
  const requests = getRequests();
  const updated = requests.map(r => {
    if (r.id === id) {
      return { ...r, ...update };
    }
    return r;
  });
  saveRequests(updated);
  renderRequests('listaSolicitacoesAdmin', 'Documento', document.getElementById('filtroStatusSolicitacoes')?.value ?? 'Pendente');
  renderRequests('listaMensagensAdmin', 'Mensagem', document.getElementById('filtroStatusMensagens')?.value ?? 'Pendente');
}

function salvarSolicitacao({ tipo, descricao, filePath = null, fileName = null }) {
  const user = getCurrentUser();
  if (!user) return;

  const requests = getRequests();
  const newRequest = {
    id: Date.now(),
    createdAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    username: user.username,
    studentName: user.name,
    tipo,
    descricao,
    status: filePath ? 'Concluído' : 'Pendente',
    response: filePath ? 'Documento disponível para download.' : '',
    fileData: null,
    filePath,
    fileName,
    responseAt: filePath ? new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null
  };

  requests.push(newRequest);
  saveRequests(requests);
  renderRequests('listaSolicitacoes');
}

function switchTab(viewId, tab) {
  document.querySelectorAll(`#${viewId} .sidebar-item`).forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`#${viewId} .tab-panel`).forEach(p => { p.hidden = true; });

  const prefix = viewId === 'appView' ? 'app' : 'admin';
  const panel = document.getElementById(`${prefix}Tab-${tab}`);
  if (panel) panel.hidden = false;

  const btn = document.querySelector(`#${viewId} [data-tab="${tab}"]`);
  if (btn) btn.classList.add('active');

  if (viewId === 'appView') {
    if (tab === 'documentos')   renderRequests('listaDocumentos', 'Documento');
    if (tab === 'solicitacoes') renderRequests('listaSolicitacoes');
    if (tab === 'mensagens')    renderRequests('listaMensagens', 'Mensagem');
  } else {
    if (tab === 'solicitacoes') {
      document.getElementById('filtroStatusSolicitacoes').value = 'Pendente';
      renderRequests('listaSolicitacoesAdmin', 'Documento', 'Pendente');
    }
    if (tab === 'mensagens') {
      document.getElementById('filtroStatusMensagens').value = 'Pendente';
      renderRequests('listaMensagensAdmin', 'Mensagem', 'Pendente');
    }
  }
}

function openResponseModal(requestId) {
  const request = getRequests().find(r => r.id === requestId);
  if (!request) return;

  document.getElementById('respostaId').value = request.id;
  document.getElementById('respostaStatus').value = request.status;
  document.getElementById('respostaTexto').value = request.response || '';
  document.getElementById('requestInfo').innerHTML = `
    <p><strong>Aluno:</strong> ${request.studentName || request.username}</p>
    <p><strong>Tipo:</strong> ${request.tipo}</p>
    <p><strong>Descrição:</strong> ${request.descricao}</p>
  `;
  openModal('modalResposta');
}

function renderRequests(tbodyId = 'listaSolicitacoes', tipoFilter = null, statusFilter = null) {
  const user = getCurrentUser();
  if (!user) return;

  const requests = getRequests();
  const list = document.getElementById(tbodyId);
  if (!list) return;
  list.innerHTML = '';

  let filtered = user.role === 'admin'
    ? requests.slice().sort((a,b) => b.id - a.id)
    : requests.filter(r => r.username === user.username).sort((a,b) => b.id - a.id);

  if (tipoFilter === 'Documento') {
    filtered = filtered.filter(r => r.tipo === 'Documento');
  } else if (tipoFilter === 'Mensagem') {
    filtered = filtered.filter(r => r.tipo !== 'Documento');
  }

  if (statusFilter) {
    filtered = filtered.filter(r => r.status === statusFilter);
  }

  filtered.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.createdAt}</td>
      <td>${r.studentName || r.username}</td>
      <td>${r.tipo}</td>
      <td>
        <div>${r.descricao}</div>
        ${r.response ? `<div class="muted">Resposta: ${r.response}</div>` : ''}
      </td>
      <td class="status-${r.status.toLowerCase()}">${r.status}</td>
      <td>${renderActions(r, user)}</td>
    `;

    // Para administradores, tornar a linha clicável para responder
    if (user.role === 'admin') {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => openResponseModal(r.id));
    }

    list.appendChild(tr);
  });
}

function renderActions(request, user) {
  if (user.role === 'admin') {
    return `<button class="btn btn-primary" onclick="openResponseModal(${request.id})">Responder</button>`;
  }

  if (request.status === 'Concluído' && (request.fileData || request.filePath)) {
    return '✅ Concluído';
  }

  return '-';
}

function sendAutoDocument(request) {
  const documento = request.descricao.startsWith('Outro: ') ? request.descricao.substring(7) : request.descricao;

  // Criar documento automático
  const filename = `${documento.replace(/\s+/g, '_')}.txt`;
  const content = `Documento: ${documento}\nEmitido para: ${request.studentName} (${request.username})\nData: ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;

  const fileData = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(content)))}`;

  const update = {
    status: 'Concluído',
    response: 'Documento enviado automaticamente.',
    fileData: fileData,
    fileName: filename,
    responseAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  };

  applyResponse(request.id, update);
  closeModal('modalResposta');
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
  const palette = ['#0078d4','#107c10','#c50f1f','#ca5010','#8764b8','#038387','#00b294','#881798'];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xff;
  return palette[hash % palette.length];
}

function openAccountDialog(role) {
  const modalId = role === 'admin' ? 'modalFuncionarios' : 'modalAlunos';
  const listId  = role === 'admin' ? 'listaFuncionarios' : 'listaAlunos';
  const users   = getUsers().filter(u => u.role === role);
  const list    = document.getElementById(listId);

  list.innerHTML = '';

  if (users.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'account-picker-empty';
    msg.textContent = 'Nenhuma conta cadastrada.';
    list.appendChild(msg);
  } else {
    users.forEach(u => {
      const card = document.createElement('div');
      card.className = 'account-card';

      const enterBtn = document.createElement('button');
      enterBtn.type = 'button';
      enterBtn.className = 'account-card-btn';
      enterBtn.innerHTML = `
        <span class="account-avatar" style="background:${getAvatarColor(u.name)}">${getInitials(u.name)}</span>
        <span class="account-card-name">${u.name}</span>
      `;
      enterBtn.addEventListener('click', () => {
        closeModal(modalId);
        document.getElementById('loginUsername').value = u.username;
        document.getElementById('loginPassword').value = '';
        showLoginView();
        document.getElementById('loginPassword').focus();
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'account-card-delete';
      delBtn.title = 'Excluir conta';
      delBtn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3H9Zm0 5h2v9H9V8Zm4 0h2v9h-2V8Z"/>
        </svg>
      `;
      delBtn.addEventListener('click', () => {
        if (!confirm(`Excluir a conta de "${u.name}"?`)) return;
        saveUsers(getUsers().filter(x => x.username !== u.username));
        openAccountDialog(role);
      });

      card.appendChild(enterBtn);
      card.appendChild(delBtn);
      list.appendChild(card);
    });
  }

  openModal(modalId);
}

function initSlider() {
  const track = document.querySelector('.slider-track');
  if (!track) return;

  // Grab originals before cloning
  const origSlides = Array.from(track.querySelectorAll('.slide'));
  const total   = origSlides.length; // 3
  const perView = 2;
  const dots    = document.querySelectorAll('.slider-dot');
  let timer;

  // Build: [clone_last] [S0] [S1] [S2] [clone_S0] [clone_S1]
  // Prepend clone of last slide
  origSlides.slice(total - 1).forEach(s =>
    track.insertBefore(s.cloneNode(true), track.firstChild)
  );
  // Append clones of first `perView` slides
  origSlides.slice(0, perView).forEach(s =>
    track.appendChild(s.cloneNode(true))
  );

  // trackPos 1 = [S0,S1], 2 = [S1,S2], 3 = [S2,clone_S0]
  let trackPos = 1;

  function slide(pos, animate) {
    track.style.transition = animate ? 'transform 0.5s ease' : 'none';
    track.style.transform  = `translateX(-${pos * (100 / perView)}%)`;
  }

  function updateDots() {
    const idx = trackPos - 1; // 1→0, 2→1, 3→2
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  function goTo(pos) {
    trackPos = pos;
    slide(trackPos, true);
    updateDots();
  }

  track.addEventListener('transitionend', () => {
    if (trackPos >= total + 1) {   // went past appended clones → wrap to real start
      trackPos -= total;           // 4 → 1
      slide(trackPos, false);
      updateDots();
    } else if (trackPos <= 0) {    // went past prepended clone → wrap to real end
      trackPos += total;           // 0 → 3
      slide(trackPos, false);
      updateDots();
    }
  });

  function reset() {
    clearInterval(timer);
    timer = setInterval(() => goTo(trackPos + 1), 5000);
  }

  document.querySelector('.slider-prev')?.addEventListener('click', () => { goTo(trackPos - 1); reset(); });
  document.querySelector('.slider-next')?.addEventListener('click', () => { goTo(trackPos + 1); reset(); });
  dots.forEach(d => d.addEventListener('click', () => {
    goTo(Number(d.dataset.index) + 1); // dot 0→pos 1, dot 1→2, dot 2→3
    reset();
  }));

  slide(1, false);
  updateDots();
  resetSlider = () => { trackPos = 1; slide(1, false); updateDots(); reset(); };
  reset();
}

function openModal(id) {
  document.getElementById(id).style.display = 'block';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function toggleOutroCampo() {
  const select = document.getElementById('docTipo');
  const campoOutro = document.getElementById('campoOutro');
  campoOutro.classList.toggle('hidden', select.value !== 'Outro');
}

function selectTipo(btn) {
  document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const tipo = btn.dataset.value;
  document.getElementById('docTipo').value = tipo;
  updateDocumentStepTitle(tipo, tipo);
}

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE_CURRENT) || 'null');
}

function setCurrentUser(user) {
  localStorage.setItem(STORAGE_CURRENT, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(STORAGE_CURRENT);
}

function getRequests() {
  return JSON.parse(localStorage.getItem(STORAGE_REQUESTS) || '[]');
}

function saveRequests(requests) {
  localStorage.setItem(STORAGE_REQUESTS, JSON.stringify(requests));
}
