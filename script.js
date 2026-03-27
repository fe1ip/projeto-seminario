const STORAGE_USERS = 'portal_users';
const STORAGE_CURRENT = 'portal_currentUser';
const STORAGE_REQUESTS = 'portal_requests';
const STORAGE_NOTAS = 'portal_notas';
const CEP_LOOKUP_URL = 'https://viacep.com.br/ws';
const EMPLOYEE_SECTORS = ['Administrativo', 'Financeiro', 'Acadêmico', 'TI', 'Administrador'];

const MESSAGE_CATEGORY_KEYWORDS = {
  'Tecnológico': ['site', 'portal', 'sistema', 'app', 'erro', 'bug', 'login', 'senha', 'travando', 'carrega', 'tecnico', 'tecnológico', 'tecnologia', 'nao abre', 'não abre', 'nao funciona', 'não funciona', 'nao consigo', 'não consigo', 'acesso'],
  'Acessibilidade': ['acessibilidade', 'libras', 'leitor de tela', 'contraste', 'fonte', 'teclado', 'deficiencia', 'deficiência', 'auditiva', 'visual', 'legendas', 'audiodescricao', 'audiodescrição'],
  'Reclamação': ['reclama', 'reclamação', 'insatisfeito', 'insatisfação', 'atraso', 'demora', 'ruim', 'péssimo', 'pessimo', 'problema', 'falha', 'descaso', 'demorado', 'sem retorno', 'nao respondem', 'não respondem'],
  'Sugestão': ['sugest', 'melhoria', 'proponho', 'seria bom', 'poderia', 'recomendo', 'ideia', 'idéia', 'seria interessante', 'fica a dica', 'minha sugestao', 'minha sugestão'],
  'Dúvida': ['duvida', 'dúvida', 'como', 'quando', 'onde', 'qual', 'quais', 'posso', 'gostaria de saber', 'tenho uma pergunta']
};

const MESSAGE_CATEGORY_PATTERNS = {
  'Tecnológico': [
    /\b(erro|bug|falha|instabilidade)\b/,
    /\b(login|senha|acesso|portal|sistema|site|app)\b/,
    /\b(nao|não)\s+consigo\b/,
    /\b(nao|não)\s+(abre|funciona|carrega)\b/
  ],
  'Acessibilidade': [
    /\b(acessibilidade|libras|contraste|audiodescricao|audiodescrição|leitor de tela|teclado)\b/,
    /\b(deficiencia|deficiência|visual|auditiva|motora)\b/
  ],
  'Reclamação': [
    /\b(reclama(cao|ção)?|insatisfeito|insatisfacao|insatisfação|descaso)\b/,
    /\b(atraso|demora|demorado|sem retorno|nao respondem|não respondem)\b/,
    /\b(ruim|pessimo|péssimo)\b/
  ],
  'Sugestão': [
    /\b(sugest(ao|ão)?|melhoria|proponho|recomendo|ideia|idéia)\b/,
    /\b(seria bom|seria interessante|poderia)\b/
  ],
  'Dúvida': [
    /\?/,
    /\b(duvida|dúvida|como|quando|onde|qual|quais)\b/,
    /\b(gostaria de saber|tenho uma pergunta)\b/
  ]
};

const CATALOG_DISCIPLINAS = [
  { nome: 'Algoritmos',                cargaHoraria: '80h',  categoria: 'Obrigatória' },
  { nome: 'Cálculo I',                 cargaHoraria: '60h',  categoria: 'Obrigatória' },
  { nome: 'Cálculo II',                cargaHoraria: '60h',  categoria: 'Obrigatória' },
  { nome: 'Estrutura de Dados',        cargaHoraria: '100h', categoria: 'Opcional' },
  { nome: 'Física I',                  cargaHoraria: '60h',  categoria: 'Opcional' },
  { nome: 'Banco de Dados',            cargaHoraria: '80h',  categoria: 'Opcional' },
  { nome: 'Programação Orientada a Objetos', cargaHoraria: '80h', categoria: 'Opcional' },
  { nome: 'Redes de Computadores',     cargaHoraria: '60h',  categoria: 'Opcional' },
  { nome: 'Engenharia de Software',    cargaHoraria: '80h',  categoria: 'Opcional' },
  { nome: 'Sistemas Operacionais',     cargaHoraria: '60h',  categoria: 'Opcional' },
  { nome: 'Inteligência Artificial',   cargaHoraria: '80h',  categoria: 'Opcional' },
  { nome: 'Álgebra Linear',            cargaHoraria: '60h',  categoria: 'Obrigatória' },
];
let resetSlider = null;
let selectedMatriculaContext = null;
let cepStatusTimer = null;
let lastCepLookup = '';

const PASSWORD_REQUIREMENTS = {
  length: (password) => password.length >= 8,
  upper: (password) => /[A-Z]/.test(password),
  lower: (password) => /[a-z]/.test(password),
  number: (password) => /\d/.test(password),
  special: (password) => /[^A-Za-z0-9\s]/.test(password),
  noSpaces: (password) => !/\s/.test(password)
};

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
      { username: 'admin', password: 'admin', name: 'Administrador', role: 'admin', setor: 'Administrador' }
    ];
    localStorage.setItem(STORAGE_USERS, JSON.stringify(defaultUsers));
    return;
  }

  const users = getUsers();
  let changed = false;
  const normalizedUsers = users.map(user => {
    if (user.role !== 'admin') return user;
    if (EMPLOYEE_SECTORS.includes(user.setor)) return user;
    changed = true;
    return {
      ...user,
      setor: user.username === 'admin' ? 'Administrador' : 'Administrativo'
    };
  });

  if (changed) {
    saveUsers(normalizedUsers);
    const currentUser = getCurrentUser();
    if (currentUser?.role === 'admin') {
      const refreshed = normalizedUsers.find(u => u.username === currentUser.username);
      if (refreshed) setCurrentUser(refreshed);
    }
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
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => togglePasswordVisibility(btn));
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
      document.getElementById('registerPasswordConfirm')?.focus();
    }
  });
  bind('registerPassword', 'input', updatePasswordRequirementsUI);
  bind('registerPasswordConfirm', 'keydown', (e) => {
    if (e.key === 'Enter' && e.target.value) {
      document.getElementById('registerForm').requestSubmit();
    }
  });
  bind('registerPasswordConfirm', 'input', updatePasswordRequirementsUI);
  bind('logoutBtn', 'click', handleLogout);
  bind('editCep', 'input', handleCepInput);
  bind('editCep', 'blur', handleCepLookup);
  bind('btnSolicitar', 'click', () => {
    resetDocumentModalState();
    openModal('modalDocumento');
  });
  bind('btnDuvidas', 'click', () => {
    const form = document.getElementById('formGeral');
    if (form) form.reset();
    const tipoSelect = document.getElementById('tipoMensagem');
    if (tipoSelect) tipoSelect.value = 'Auto';
    updateMessageCategorySuggestion();
    openModal('modalGeral');
  });
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
  bind('mensagemTexto', 'input', updateMessageCategorySuggestion);
  bind('tipoMensagem', 'change', updateMessageCategorySuggestion);
  bind('formResposta', 'submit', handleAdminResponse);
  bind('employeeRegisterForm', 'submit', handleEmployeeRegister);
  document.querySelectorAll('.doc-back-btn').forEach(btn => {
    btn.addEventListener('click', showDocumentCategoryStep);
  });

  const matriculasPreview = document.getElementById('matriculasPreview');
  if (matriculasPreview) {
    matriculasPreview.addEventListener('contextmenu', handleMatriculaPreviewContextMenu);
  }
  bind('matriculasEditOption', 'click', handleMatriculaEditOption);
  bind('matriculasRemoveOption', 'click', handleMatriculaRemoveOption);
  document.addEventListener('click', hideMatriculasContextMenu);
}

const DOCUMENT_STEP_CONFIG = {
  'Acadêmico': {
    stepId: 'stepAcademico',
    selectId: 'matriculasSelect',
    modalTitle: 'Acadêmico'
  },
  'Financeiro': {
    stepId: 'stepFinanceiro',
    selectId: 'financeiroSelect',
    modalTitle: 'Financeiro'
  },
  'Cadastro': {
    stepId: 'stepCadastro',
    selectId: 'cadastroSelect',
    modalTitle: 'Cadastro'
  }
};

function resetDocumentModalState() {
  document.getElementById('formDocumento').reset();
  document.getElementById('formDocumento').classList.remove('hidden');
  document.getElementById('docTipo').value = '';
  document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.matricula-option-btn').forEach(b => b.classList.remove('selected'));
  renderMatriculasPreview([]);
  hideMatriculasContextMenu();
  updateDocumentModalTitle();
  const r = document.getElementById('docResultado');
  if (r) {
    r.innerHTML = '';
    r.classList.add('hidden');
  }
  showDocumentCategoryStep();
}

function showDocumentStep(tipo) {
  const normalizedTipo = (tipo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const config = DOCUMENT_STEP_CONFIG[tipo]
    || Object.entries(DOCUMENT_STEP_CONFIG).find(([key]) => (
      key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === normalizedTipo
    ))?.[1];
  if (!config) return;

  const stepCategoria = document.getElementById('docStepCategoria');
  const step = document.getElementById(config.stepId);

  Object.values(DOCUMENT_STEP_CONFIG).forEach(({ stepId }) => {
    const section = document.getElementById(stepId);
    if (section) section.classList.add('hidden');
  });

  if (stepCategoria) stepCategoria.classList.add('hidden');
  if (step) step.classList.remove('hidden');
  document.getElementById('modalDocumentoBack')?.classList.remove('hidden');
  updateDocumentModalTitle(config.modalTitle || tipo);
}

function showDocumentCategoryStep() {
  const stepCategoria = document.getElementById('docStepCategoria');

  if (stepCategoria) stepCategoria.classList.remove('hidden');
  document.getElementById('modalDocumentoBack')?.classList.add('hidden');
  updateDocumentModalTitle();
  hideMatriculasContextMenu();
  document.getElementById('stepAcademico')?.classList.add('hidden');
  Object.values(DOCUMENT_STEP_CONFIG).forEach(({ stepId, selectId }) => {
    const step = document.getElementById(stepId);
    const select = document.getElementById(selectId);
    if (step) step.classList.add('hidden');
    if (select) select.value = '';
  });
  document.getElementById('atualizacaoCadastroForm')?.classList.add('hidden');
  document.getElementById('cadastroEnviarBtn')?.classList.remove('hidden');
  const cadastroDownload = document.getElementById('cadastroFormDownload');
  if (cadastroDownload) { cadastroDownload.innerHTML = ''; cadastroDownload.classList.add('hidden'); }
  document.getElementById('modalDocumento')?.classList.remove('modal--wide');
}

function showAcademicoStep() {
  document.getElementById('docTipo').value = 'Acadêmico';
  showDocumentStep('Acadêmico');
}

function updateDocumentModalTitle(title = 'Solicitações') {
  const modalTitle = document.getElementById('modalDocumentoTitle');
  if (!modalTitle) return;
  modalTitle.textContent = title;
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

function setLandingElements(visible) {
  const footer = document.getElementById('siteFooter');
  const nav    = document.getElementById('mainNav');
  if (footer) footer.hidden = !visible;
  if (nav)    nav.hidden    = !visible;
}

function showLanding() {
  updateHeaderAuthState(null, 'landingView');
  document.getElementById('landingView').hidden = false;
  document.getElementById('loginView').hidden = true;
  document.getElementById('registerView').hidden = true;
  document.getElementById('appView').hidden = true;
  document.getElementById('adminView').hidden = true;
  setLandingElements(true);
  if (resetSlider) resetSlider();
}

function showLoginView() {
  updateHeaderAuthState(null, 'loginView');
  document.getElementById('landingView').hidden = true;
  document.getElementById('loginView').hidden = false;
  document.getElementById('registerView').hidden = true;
  document.getElementById('appView').hidden = true;
  document.getElementById('adminView').hidden = true;
  setLandingElements(false);
}

function showRegisterView() {
  updateHeaderAuthState(null, 'registerView');
  document.getElementById('landingView').hidden = true;
  document.getElementById('loginView').hidden = true;
  document.getElementById('registerView').hidden = false;
  document.getElementById('appView').hidden = true;
  document.getElementById('adminView').hidden = true;
  setLandingElements(false);
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
  setLandingElements(false);
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
  setLandingElements(false);
  switchTab('appView', 'solicitacoes');
}

function showAdminView(user) {
  updateHeaderAuthState(user, 'adminView');
  document.getElementById('landingView').hidden = true;
  document.getElementById('loginView').hidden = true;
  document.getElementById('registerView').hidden = true;
  document.getElementById('appView').hidden = true;
  document.getElementById('adminView').hidden = false;
  setLandingElements(false);
  setDefaultAdminSectorFilters(user);
  switchTab('adminView', 'solicitacoes');
}

function getUserSector(user = getCurrentUser()) {
  if (!user || user.role !== 'admin') return '';
  return EMPLOYEE_SECTORS.includes(user.setor) ? user.setor : 'Administrador';
}

function getDefaultSectorFilterValue(user = getCurrentUser()) {
  const setor = getUserSector(user);
  return setor === 'Administrador' ? '' : setor;
}

function setDefaultAdminSectorFilters(user = getCurrentUser()) {
  const defaultValue = getDefaultSectorFilterValue(user);
  const filtroSolicitacoes = document.getElementById('filtroSetorSolicitacoes');
  const filtroMensagens = document.getElementById('filtroSetorMensagens');
  if (filtroSolicitacoes) filtroSolicitacoes.value = defaultValue;
  if (filtroMensagens) filtroMensagens.value = defaultValue;
}

function renderAdminRequestsByFilters(tab) {
  if (tab === 'solicitacoes') {
    const status = document.getElementById('filtroStatusSolicitacoes')?.value ?? 'Pendente';
    const setor = document.getElementById('filtroSetorSolicitacoes')?.value ?? getDefaultSectorFilterValue();
    renderRequests('listaSolicitacoesAdmin', 'Documento', status, setor);
    return;
  }

  const status = document.getElementById('filtroStatusMensagens')?.value ?? 'Pendente';
  const setor = document.getElementById('filtroSetorMensagens')?.value ?? getDefaultSectorFilterValue();
  renderRequests('listaMensagensAdmin', 'Mensagem', status, setor);
}


function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  setAuthStatus('loginStatus', '');

  if (!username || username.length < 3) {
    setAuthStatus('loginStatus', 'Informe um nome com pelo menos 3 caracteres.', true);
    return;
  }

  if (!password) {
    setAuthStatus('loginStatus', 'Informe sua senha.', true);
    return;
  }

  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    setAuthStatus('loginStatus', 'Usuário ou senha inválidos.', true);
    return;
  }

  setAuthStatus('loginStatus', 'Login realizado com sucesso.');
  setCurrentUser(user);
  showApp(user);
}

function handleLogout() {
  clearCurrentUser();
  showLanding();
}

function generateMatricula() {
  const year = new Date().getFullYear();
  const count = getUsers().filter(u => u.role === 'aluno').length + 1;
  return `${year}${String(count).padStart(6, '0')}`;
}

function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
  const curso = document.getElementById('registerCurso').value;

  setAuthStatus('registerStatus', '');

  if (name.length < 3) {
    setAuthStatus('registerStatus', 'Informe um nome com pelo menos 3 caracteres.', true);
    return;
  }

  if (!isStrongPassword(password)) {
    setAuthStatus('registerStatus', 'A senha não cumpre todos os requisitos.', true);
    return;
  }

  if (password !== passwordConfirm) {
    setAuthStatus('registerStatus', 'As senhas não conferem.', true);
    return;
  }

  if (!name || !password || !curso) {
    setAuthStatus('registerStatus', 'Preencha todos os campos obrigatórios.', true);
    return;
  }

  const users = getUsers();
  if (users.find(u => String(u.name).toLowerCase() === name.toLowerCase())) {
    setAuthStatus('registerStatus', 'Já existe um usuário com esse nome.');
    return;
  }

  const username = name;
  const matricula = generateMatricula();
  const newUser = { username, password, name, role: 'aluno', curso, matricula };
  users.push(newUser);
  saveUsers(users);

  fetch('/generate-docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, name, cpf: '', curso, matricula }),
  }).catch(() => {}); // silencioso se o servidor não estiver rodando

  setCurrentUser(newUser);
  document.getElementById('registerForm').reset();
  setAuthStatus('registerStatus', 'Cadastro realizado com sucesso.');
  showApp(newUser);
}

function handleEmployeeRegister(event) {
  event.preventDefault();

  const name = document.getElementById('employeeName')?.value.trim() || '';
  const password = document.getElementById('employeePassword')?.value || '';
  const setor = document.getElementById('employeeSetor')?.value || '';

  setAuthStatus('employeeRegisterStatus', '');

  if (name.length < 3) {
    setAuthStatus('employeeRegisterStatus', 'Informe um nome com pelo menos 3 caracteres.', true);
    return;
  }
  if (!password) {
    setAuthStatus('employeeRegisterStatus', 'Informe uma senha para o funcionário.', true);
    return;
  }
  if (!EMPLOYEE_SECTORS.includes(setor)) {
    setAuthStatus('employeeRegisterStatus', 'Selecione um setor válido.', true);
    return;
  }

  const users = getUsers();
  if (users.find(u => String(u.name).toLowerCase() === name.toLowerCase())) {
    setAuthStatus('employeeRegisterStatus', 'Já existe um usuário com esse nome.', true);
    return;
  }

  const employee = {
    username: name,
    password,
    name,
    role: 'admin',
    setor
  };

  users.push(employee);
  saveUsers(users);
  setAuthStatus('employeeRegisterStatus', 'Funcionário cadastrado com sucesso.');
  document.getElementById('employeeRegisterForm')?.reset();
  closeModal('modalFuncionarioCadastro');
  openAccountDialog('admin');
}

function togglePasswordVisibility(button) {
  const targetId = button.dataset.target;
  const target = document.getElementById(targetId);
  if (!target) return;

  const shouldShow = target.type === 'password';
  target.type = shouldShow ? 'text' : 'password';
  button.classList.toggle('is-visible', shouldShow);
  button.setAttribute('aria-label', shouldShow ? 'Ocultar senha' : 'Mostrar senha');
  button.setAttribute('title', shouldShow ? 'Ocultar senha' : 'Mostrar senha');
}

function getPasswordRequirementState(password) {
  const value = String(password || '');
  return {
    length: PASSWORD_REQUIREMENTS.length(value),
    upper: PASSWORD_REQUIREMENTS.upper(value),
    lower: PASSWORD_REQUIREMENTS.lower(value),
    number: PASSWORD_REQUIREMENTS.number(value),
    special: PASSWORD_REQUIREMENTS.special(value),
    noSpaces: PASSWORD_REQUIREMENTS.noSpaces(value)
  };
}

function updatePasswordRequirementsUI() {
  const passwordInput = document.getElementById('registerPassword');
  const confirmInput = document.getElementById('registerPasswordConfirm');
  if (!passwordInput) return;

  const status = getPasswordRequirementState(passwordInput.value);
  const map = [
    ['reqLength', status.length],
    ['reqUpper', status.upper],
    ['reqLower', status.lower],
    ['reqNumber', status.number],
    ['reqSpecial', status.special],
    ['reqNoSpaces', status.noSpaces]
  ];

  map.forEach(([id, met]) => {
    const item = document.getElementById(id);
    if (!item) return;
    item.classList.toggle('is-met', met);
  });

  passwordInput.setCustomValidity(isStrongPassword(passwordInput.value) ? '' : 'Senha não atende os requisitos.');
  if (!confirmInput) return;

  if (confirmInput.value && confirmInput.value !== passwordInput.value) {
    confirmInput.setCustomValidity('As senhas não conferem.');
  } else {
    confirmInput.setCustomValidity('');
  }
}

function setAuthStatus(statusId, message, isError = false) {
  const status = document.getElementById(statusId);
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

function isStrongPassword(password) {
  const status = getPasswordRequirementState(password);
  return Object.values(status).every(Boolean);
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
  if (!stepConfig) return;

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

  const svgDown = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>`;

  const showDownload = () => {
    salvarSolicitacao({ tipo: 'Documento', descricao: requestedItem, filePath, fileName });
    document.getElementById('formDocumento').classList.add('hidden');
    resultado.innerHTML = `✅ Documento disponível:
      <a href="${filePath}" download="${fileName}">${svgDown} ${fileName}</a>`;
    resultado.classList.remove('hidden');
  };

  if (window.location.protocol === 'file:') {
    showDownload();
    return;
  }

  try {
    const res = await fetch(filePath, { method: 'HEAD' });
    if (res.ok) { showDownload(); return; }
  } catch (_) {}

  salvarSolicitacao({ tipo: 'Documento', descricao: requestedItem });
  closeModal('modalDocumento');
  resetDocumentModalState();
}

function handleGeneralSubmit(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const tipoSelecionado = document.getElementById('tipoMensagem').value;
  const desc = document.getElementById('mensagemTexto').value.trim();
  if (!desc) return;

  const tipoSugerido = suggestMessageCategory(desc);
  const tipo = tipoSelecionado === 'Auto' ? tipoSugerido : tipoSelecionado;

  salvarSolicitacao({
    tipo,
    descricao: desc,
    autoSolved: false,
    triagemAutomatica: tipoSelecionado === 'Auto',
    categoriaSugerida: tipoSugerido
  });

  closeModal('modalGeral');
  document.getElementById('formGeral').reset();
  updateMessageCategorySuggestion();
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function suggestMessageCategory(messageText) {
  const text = normalizeText(messageText);
  if (!text) return 'Dúvida';

  // Regras de prioridade por intenção para evitar viés no fallback.
  if ((MESSAGE_CATEGORY_PATTERNS['Acessibilidade'] || []).some(pattern => pattern.test(text))) {
    return 'Acessibilidade';
  }
  if ((MESSAGE_CATEGORY_PATTERNS['Tecnológico'] || []).some(pattern => pattern.test(text))) {
    return 'Tecnológico';
  }
  if ((MESSAGE_CATEGORY_PATTERNS['Reclamação'] || []).some(pattern => pattern.test(text))) {
    return 'Reclamação';
  }
  if ((MESSAGE_CATEGORY_PATTERNS['Sugestão'] || []).some(pattern => pattern.test(text))) {
    return 'Sugestão';
  }
  if ((MESSAGE_CATEGORY_PATTERNS['Dúvida'] || []).some(pattern => pattern.test(text))) {
    return 'Dúvida';
  }

  let bestCategory = 'Dúvida';
  let bestScore = 0;

  Object.entries(MESSAGE_CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    const score = keywords.reduce((sum, keyword) => {
      return sum + (text.includes(normalizeText(keyword)) ? 1 : 0);
    }, 0);

    const patternScore = (MESSAGE_CATEGORY_PATTERNS[category] || []).reduce((sum, pattern) => {
      return sum + (pattern.test(text) ? 2 : 0);
    }, 0);

    const combinedScore = score + patternScore;

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestCategory = category;
    }
  });

  if (bestScore === 0) {
    if (/\?/.test(text)) return 'Dúvida';
    if (/\b(nao|não)\s+consigo\b/.test(text)) return 'Tecnológico';
    if (/\b(sugest|melhoria|ideia|idéia)\b/.test(text)) return 'Sugestão';
    if (/\b(reclama|atraso|demora|ruim|pessimo|péssimo)\b/.test(text)) return 'Reclamação';
    if (/\b(acessibilidade|libras|leitor de tela|teclado|contraste)\b/.test(text)) return 'Acessibilidade';
  }

  return bestCategory;
}

function updateMessageCategorySuggestion() {
  const hint = document.getElementById('tipoMensagemHint');
  const tipoSelect = document.getElementById('tipoMensagem');
  const messageInput = document.getElementById('mensagemTexto');
  if (!hint || !tipoSelect || !messageInput) return;

  const text = messageInput.value.trim();
  if (!text) {
    hint.textContent = '';
    hint.classList.remove('is-error');
    return;
  }

  const suggested = suggestMessageCategory(text);
  if (tipoSelect.value === 'Auto') {
    hint.textContent = `Categoria sugerida: ${suggested}. Essa categoria será usada no envio.`;
  } else {
    hint.textContent = '';
  }
  hint.classList.remove('is-error');
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
  renderAdminRequestsByFilters('solicitacoes');
  renderAdminRequestsByFilters('mensagens');
}

function salvarSolicitacao({
  tipo,
  descricao,
  filePath = null,
  fileName = null,
  triagemAutomatica = false,
  categoriaSugerida = null
}) {
  const user = getCurrentUser();
  if (!user) return;

  const requests = getRequests();
  const setorResponsavel = getRequestSector({ tipo, descricao });
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
    responseAt: filePath ? new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null,
    triagemAutomatica,
    categoriaSugerida,
    setorResponsavel
  };

  requests.push(newRequest);
  saveRequests(requests);
  renderRequests('listaSolicitacoes');
}

function getRequestSector(request) {
  const tipo = normalizeText(request?.tipo || '');
  const descricao = normalizeText(request?.descricao || '');

  if (tipo === 'tecnologico') return 'TI';
  if (tipo === 'acessibilidade') return 'Acadêmico';

  const isFinanceiro = /(boleto|pagamento|quitacao|quitação|mensalidade|financeiro)/.test(descricao);
  const isAcademico = /(matricula|matrícula|rematricula|rematrícula|disciplina|academico|acadêmico)/.test(descricao);
  const isCadastro = /(cadastro|trancamento|transferencia|transferência|aproveitamento|cpf|endereco|endereço|dados pessoais)/.test(descricao);
  const isTecnologia = /(login|senha|erro|bug|sistema|portal|site|app|tecnologico|tecnológico)/.test(descricao);

  if (isTecnologia) return 'TI';
  if (isFinanceiro) return 'Financeiro';
  if (isAcademico) return 'Acadêmico';
  if (isCadastro) return 'Administrativo';

  return 'Administrativo';
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
    if (tab === 'solicitacoes') {
      const el = document.getElementById('buscaSolicitacoes');
      if (el) el.value = '';
    }
    if (tab === 'mensagens') {
      const el = document.getElementById('buscaMensagens');
      if (el) el.value = '';
    }
    if (tab === 'visao-geral')  renderVisaoGeral();
    if (tab === 'solicitacoes') renderRequests('listaSolicitacoes');
    if (tab === 'mensagens')    renderRequests('listaMensagens', 'Mensagem');
  } else {
    if (tab === 'solicitacoes') {
      const el = document.getElementById('buscaSolicitacoesAdmin');
      if (el) el.value = '';
      document.getElementById('filtroStatusSolicitacoes').value = 'Pendente';
      const filtroSetor = document.getElementById('filtroSetorSolicitacoes');
      if (filtroSetor && !filtroSetor.value && getUserSector() !== 'Administrador') {
        filtroSetor.value = getDefaultSectorFilterValue();
      }
      renderAdminRequestsByFilters('solicitacoes');
    }
    if (tab === 'mensagens') {
      const el = document.getElementById('buscaMensagensAdmin');
      if (el) el.value = '';
      document.getElementById('filtroStatusMensagens').value = 'Pendente';
      const filtroSetor = document.getElementById('filtroSetorMensagens');
      if (filtroSetor && !filtroSetor.value && getUserSector() !== 'Administrador') {
        filtroSetor.value = getDefaultSectorFilterValue();
      }
      renderAdminRequestsByFilters('mensagens');
    }
  }
}

function getRequestAssignedSector(request) {
  return request.setorResponsavel || getRequestSector(request);
}

function canManageRequest(user, request) {
  if (!user || user.role !== 'admin') return false;
  const setorUsuario = getUserSector(user);
  if (setorUsuario === 'Administrador') return true;
  return getRequestAssignedSector(request) === setorUsuario;
}

function openResponseModal(requestId) {
  const user = getCurrentUser();
  const request = getRequests().find(r => r.id === requestId);
  if (!request) return;

  if (!canManageRequest(user, request)) {
    alert('Você pode visualizar esta solicitação, mas apenas o setor responsável pode responder.');
    return;
  }

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

function renderTotalizador(totalizadorId, allItems, filteredItems) {
  const el = document.getElementById(totalizadorId);
  if (!el) return;

  const total     = allItems.length;
  const concluido = allItems.filter(r => r.status === 'Concluído').length;
  const pendente  = allItems.filter(r => r.status === 'Pendente').length;
  const mostrando = filteredItems.length;
  const buscaAtiva = mostrando < total;

  el.innerHTML = `
    <span class="total-chip total-chip--all">📋 Total: <strong>${total}</strong></span>
    <span class="total-chip total-chip--pendente">🕐 Pendentes: <strong>${pendente}</strong></span>
    <span class="total-chip total-chip--concluido">✅ Concluídos: <strong>${concluido}</strong></span>
    ${buscaAtiva ? `<span class="total-chip total-chip--filtro">🔎 Exibindo: <strong>${mostrando}</strong></span>` : ''}
  `;
}

function renderRequests(tbodyId = 'listaSolicitacoes', tipoFilter = null, statusFilter = null, setorFilter = '') {
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

  if (setorFilter) {
    filtered = filtered.filter(r => getRequestSector(r) === setorFilter || r.setorResponsavel === setorFilter);
  }

  // Filtro de busca textual
  const searchInputId = tbodyId === 'listaSolicitacoes'     ? 'buscaSolicitacoes'
                      : tbodyId === 'listaSolicitacoesAdmin' ? 'buscaSolicitacoesAdmin'
                      : tbodyId === 'listaMensagens'         ? 'buscaMensagens'
                      :                                        'buscaMensagensAdmin';

  const totalizadorId = tbodyId === 'listaSolicitacoes'     ? 'totalSolicitacoes'
                      : tbodyId === 'listaSolicitacoesAdmin' ? 'totalSolicitacoesAdmin'
                      : tbodyId === 'listaMensagens'         ? 'totalMensagens'
                      :                                        'totalMensagensAdmin';

  const searchQuery = normalizeText(document.getElementById(searchInputId)?.value ?? '');
  if (searchQuery) {
    filtered = filtered.filter(r => {
      const setor = getRequestAssignedSector(r);
      const haystack = normalizeText([
        r.createdAt,
        r.studentName,
        r.username,
        r.tipo,
        r.descricao,
        r.status,
        setor,
        r.response ?? ''
      ].join(' '));
      return haystack.includes(searchQuery);
    });
  }

  // Totalizador: base sem filtro de busca (reflete status reais do conjunto filtrado por setor/status)
  const allForTotal = (() => {
    let base = user.role === 'admin'
      ? getRequests().slice()
      : getRequests().filter(r => r.username === user.username);
    if (tipoFilter === 'Documento') base = base.filter(r => r.tipo === 'Documento');
    else if (tipoFilter === 'Mensagem') base = base.filter(r => r.tipo !== 'Documento');
    if (statusFilter) base = base.filter(r => r.status === statusFilter);
    if (setorFilter) base = base.filter(r => getRequestSector(r) === setorFilter || r.setorResponsavel === setorFilter);
    return base;
  })();
  renderTotalizador(totalizadorId, allForTotal, filtered);

  filtered.forEach(r => {
    const setor = getRequestAssignedSector(r);
    const canManage = canManageRequest(user, r);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.createdAt}</td>
      <td>${r.studentName || r.username}</td>
      <td>${r.tipo}</td>
      <td>
        <div>${r.descricao}</div>
        ${r.response ? `<div class="muted">Resposta: ${r.response}</div>` : ''}
        ${r.triagemAutomatica ? `<div class="muted">Triagem automática: ${r.tipo}</div>` : ''}
        ${user.role === 'admin' ? `<div class="muted">Setor: ${setor}</div>` : ''}
      </td>
      <td class="status-${r.status.toLowerCase()}">${r.status}</td>
      <td>${renderActions(r, user)}</td>
    `;

    // Para administradores, apenas o setor responsável pode responder.
    if (user.role === 'admin') {
      tr.style.cursor = canManage ? 'pointer' : 'not-allowed';
      if (canManage) {
        tr.addEventListener('click', () => openResponseModal(r.id));
      }
    }

    list.appendChild(tr);
  });
}

function renderActions(request, user) {
  if (user.role === 'admin') {
    if (!canManageRequest(user, request)) {
      return '<span class="muted">Somente visualização</span>';
    }
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
        <span class="account-card-meta">
          <span class="account-card-name">${u.name}</span>
          ${role === 'admin' ? `<span class="account-card-sector">${u.setor || 'Administrativo'}</span>` : ''}
        </span>
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
  const config = DOCUMENT_STEP_CONFIG[tipo];
  if (config?.modalTitle) {
    updateDocumentModalTitle(config.modalTitle);
  }
}

function selectMatriculaOption(btn) {
  document.querySelectorAll('.matricula-option-btn').forEach(optionBtn => optionBtn.classList.remove('selected'));
  btn.classList.add('selected');
  const selectedValue = btn.dataset.value;
  document.getElementById('matriculasSelect').value = selectedValue;
  hideMatriculasContextMenu();

  if (selectedValue === 'Ver matrículas') {
    const user = getCurrentUser();
    const matriculas = user ? getNotas(user.username).disciplinas : [];
    renderMatriculasPreview(matriculas);
    return;
  }

  if (selectedValue === 'Disciplinas disponíveis') {
    const user = getCurrentUser();
    const matriculadas = user ? getNotas(user.username).disciplinas.map(d => d.nome) : [];
    const disponiveis = CATALOG_DISCIPLINAS.filter(d => !matriculadas.includes(d.nome));
    renderDisciplinasDisponiveis(disponiveis);
    return;
  }

  renderMatriculasPreview([]);
}

function renderMatriculasPreview(matriculas) {
  const preview = document.getElementById('matriculasPreview');
  if (!preview) return;

  if (!matriculas.length) {
    preview.innerHTML = '';
    preview.classList.add('hidden');
    selectedMatriculaContext = null;
    return;
  }

  const normalizedMatriculas = matriculas.map((disciplina, index) => {
    if (typeof disciplina === 'string') {
      return {
        nome: disciplina,
        categoria: index < 2 ? 'Obrigatória' : 'Opcional'
      };
    }

    return {
      ...disciplina,
      categoria: disciplina.categoria || (index < 2 ? 'Obrigatória' : 'Opcional')
    };
  });

  preview.innerHTML = `
    <span class="matricula-preview-label">Matrículas atuais</span>
    ${normalizedMatriculas.map(disciplina => `
      <label class="matricula-preview-item" data-nome="${disciplina.nome}" data-categoria="${disciplina.categoria}">
        <div class="matricula-preview-row">
          <input type="text" value="${disciplina.nome}" readonly>
          <span class="matricula-category-badge ${disciplina.categoria === 'Obrigatória' ? 'is-required' : 'is-optional'}">${disciplina.categoria}</span>
        </div>
      </label>
    `).join('')}
  `;
  preview.classList.remove('hidden');
}

function renderDisciplinasDisponiveis(disciplinas) {
  const preview = document.getElementById('matriculasPreview');
  if (!preview) return;

  if (!disciplinas.length) {
    preview.innerHTML = '<span class="matricula-preview-label">Nenhuma disciplina disponível para matrícula.</span>';
    preview.classList.remove('hidden');
    return;
  }

  preview.innerHTML = `
    <span class="matricula-preview-label">Disciplinas disponíveis para matrícula</span>
    ${disciplinas.map(d => `
      <label class="matricula-preview-item" data-nome="${d.nome}" data-categoria="${d.categoria}">
        <div class="matricula-preview-row">
          <input type="text" value="${d.nome}" readonly>
          <span class="matricula-category-badge ${d.categoria === 'Obrigatória' ? 'is-required' : 'is-optional'}">${d.categoria}</span>
          <span class="matricula-carga">${d.cargaHoraria}</span>
        </div>
      </label>
    `).join('')}
  `;
  preview.classList.remove('hidden');
}

function handleMatriculaPreviewContextMenu(event) {
  if (document.getElementById('matriculasSelect')?.value === 'Disciplinas disponíveis') return;

  const item = event.target.closest('.matricula-preview-item');
  if (!item) return;

  event.preventDefault();
  selectedMatriculaContext = {
    nome: item.dataset.nome || item.querySelector('input')?.value || '',
    categoria: item.dataset.categoria || 'Obrigatória'
  };

  const menu = document.getElementById('matriculasContextMenu');
  if (!menu) return;
  const editBtn = document.getElementById('matriculasEditOption');
  const removeBtn = document.getElementById('matriculasRemoveOption');
  const isRequired = selectedMatriculaContext.categoria === 'Obrigatória';

  if (editBtn) editBtn.disabled = isRequired;
  if (removeBtn) removeBtn.disabled = isRequired;
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.classList.remove('hidden');
}

function hideMatriculasContextMenu() {
  const menu = document.getElementById('matriculasContextMenu');
  if (!menu) return;
  menu.classList.add('hidden');
}

function handleMatriculaEditOption(event) {
  event.preventDefault();
  if (!selectedMatriculaContext?.nome) return;
  if (selectedMatriculaContext.categoria === 'Obrigatória') {
    alert('Disciplinas obrigatórias não podem ser editadas.');
    hideMatriculasContextMenu();
    return;
  }

  document.getElementById('matriculasSelect').value = `Edição de matrícula - ${selectedMatriculaContext.nome}`;
  hideMatriculasContextMenu();
}

function handleMatriculaRemoveOption(event) {
  event.preventDefault();
  if (!selectedMatriculaContext?.nome) return;
  if (selectedMatriculaContext.categoria === 'Obrigatória') {
    alert('Disciplinas obrigatórias não podem ser removidas.');
    hideMatriculasContextMenu();
    return;
  }

  document.getElementById('matriculasSelect').value = `Remoção de matrícula - ${selectedMatriculaContext.nome}`;
  hideMatriculasContextMenu();
}

async function handleCadastroSelectChange(select) {
  const val = select.value;
  const isAtualizar = val === 'Atualização de cadastro';
  const form = document.getElementById('atualizacaoCadastroForm');
  const enviarBtn = document.getElementById('cadastroEnviarBtn');
  const downloadDiv = document.getElementById('cadastroFormDownload');

  document.getElementById('modalDocumento')?.classList.toggle('modal--wide', isAtualizar);

  const STUDENT_DOCS = [
    'Atestado de Matrícula',
    'Histórico Escolar',
    'Carteirinha de Estudante',
    'Ementa de Disciplinas',
    'Certificado de Conclusão',
    'Diploma'
  ];

  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>`;

  form?.classList.add('hidden');
  if (downloadDiv) { downloadDiv.innerHTML = ''; downloadDiv.classList.add('hidden'); }

  if (isAtualizar) {
    const user = getCurrentUser();
    if (user) {
      document.getElementById('editNome').value        = user.name         || '';
      document.getElementById('editCpf').value         = user.cpf          || '';
      document.getElementById('editDataNasc').value    = user.dataNasc     || '';
      document.getElementById('editSexo').value        = user.sexo         || '';
      document.getElementById('editCurso').value       = user.curso        || '';
      document.getElementById('editEmail').value       = user.email        || '';
      document.getElementById('editTelefone').value    = user.telefone     || '';
      document.getElementById('editCep').value         = user.cep          || '';
      document.getElementById('editLogradouro').value  = user.logradouro   || '';
      document.getElementById('editNumero').value      = user.numero       || '';
      document.getElementById('editComplemento').value = user.complemento  || '';
      document.getElementById('editBairro').value      = user.bairro       || '';
      document.getElementById('editCidade').value      = user.cidade       || '';
      document.getElementById('editEstado').value      = user.estado       || '';
    }
    form?.classList.remove('hidden');
    enviarBtn?.classList.add('hidden');

  } else if (STUDENT_DOCS.includes(val)) {
    enviarBtn?.classList.add('hidden');
    const user = getCurrentUser();
    if (user && downloadDiv) {
      if (user.role === 'admin') {
        downloadDiv.innerHTML = 'ℹ️ Esta funcionalidade é exclusiva para alunos.';
        downloadDiv.classList.remove('hidden');
      } else {
        const fileName = docFileName(val);
        const filePath = `docs/${user.username}/${fileName}`;
        const downloadLink = `✅ Documento disponível:
          <a href="${filePath}" download="${fileName}">${svgIcon} ${fileName}</a>`;

        if (window.location.protocol === 'file:') {
          // Sem servidor: mostra link direto (fallback)
          downloadDiv.innerHTML = downloadLink;
          downloadDiv.classList.remove('hidden');
        } else {
          try {
            const res = await fetch(filePath, { method: 'HEAD' });
            if (res.ok) {
              downloadDiv.innerHTML = downloadLink;
              downloadDiv.classList.remove('hidden');
            } else {
              downloadDiv.innerHTML = '';
              downloadDiv.classList.add('hidden');
              enviarBtn?.classList.remove('hidden');
            }
          } catch (_) {
            downloadDiv.innerHTML = '';
            downloadDiv.classList.add('hidden');
            enviarBtn?.classList.remove('hidden');
          }
        }
      }
    }

  } else {
    enviarBtn?.classList.remove('hidden');
  }
}

function formatCep(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function setCepStatus(message, isError = false) {
  const statusEl = document.getElementById('editCepStatus');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.toggle('is-error', isError);

  if (cepStatusTimer) {
    clearTimeout(cepStatusTimer);
    cepStatusTimer = null;
  }

  if (message) {
    cepStatusTimer = setTimeout(() => {
      statusEl.textContent = '';
      statusEl.classList.remove('is-error');
      cepStatusTimer = null;
    }, 3500);
  }
}

function handleCepInput(event) {
  event.target.value = formatCep(event.target.value);
}

async function handleCepLookup(event) {
  const cep = String(event.target.value || '').replace(/\D/g, '');
  if (cep.length !== 8) {
    if (cep.length > 0) {
      setCepStatus('CEP deve conter 8 dígitos.', true);
    }
    return;
  }

  if (cep === lastCepLookup) return;

  setCepStatus('Buscando endereço...');

  try {
    const response = await fetch(`${CEP_LOOKUP_URL}/${cep}/json/`);
    if (!response.ok) {
      throw new Error('Falha na consulta de CEP.');
    }

    const data = await response.json();
    if (data.erro) {
      setCepStatus('CEP não encontrado.', true);
      return;
    }

    const logradouro = document.getElementById('editLogradouro');
    const bairro = document.getElementById('editBairro');
    const cidade = document.getElementById('editCidade');
    const estado = document.getElementById('editEstado');

    if (logradouro) logradouro.value = data.logradouro || '';
    if (bairro) bairro.value = data.bairro || '';
    if (cidade) cidade.value = data.localidade || '';
    if (estado) estado.value = data.uf || '';

    lastCepLookup = cep;
    setCepStatus('Endereço preenchido automaticamente.');
  } catch (_) {
    setCepStatus('Não foi possível consultar o CEP agora.', true);
  }
}

function saveAtualizacaoCadastro() {
  const nome = document.getElementById('editNome').value.trim();
  const curso = document.getElementById('editCurso').value;

  if (!nome || !curso) {
    alert('Preencha ao menos Nome e Curso.');
    return;
  }

  const user = getCurrentUser();
  if (!user) return;

  const updates = {
    name:        nome,
    curso,
    cpf:         document.getElementById('editCpf').value.trim(),
    dataNasc:    document.getElementById('editDataNasc').value,
    sexo:        document.getElementById('editSexo').value,
    email:       document.getElementById('editEmail').value.trim(),
    telefone:    document.getElementById('editTelefone').value.trim(),
    cep:         document.getElementById('editCep').value.trim(),
    logradouro:  document.getElementById('editLogradouro').value.trim(),
    numero:      document.getElementById('editNumero').value.trim(),
    complemento: document.getElementById('editComplemento').value.trim(),
    bairro:      document.getElementById('editBairro').value.trim(),
    cidade:      document.getElementById('editCidade').value.trim(),
    estado:      document.getElementById('editEstado').value,
  };

  saveUsers(getUsers().map(u => u.username === user.username ? { ...u, ...updates } : u));
  setCurrentUser({ ...user, ...updates });

  alert('Cadastro atualizado com sucesso.');
  closeModal('modalDocumento');
  resetDocumentModalState();
}

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
}

function exportStudentsJson() {
  const alunos = getUsers()
    .filter(u => u.role === 'aluno')
    .map(u => ({
      username:  u.username,
      name:      u.name,
      cpf:       u.cpf       || '000.000.000-00',
      curso:     u.curso     || '',
      matricula: u.matricula || ''
    }));

  if (!alunos.length) {
    alert('Nenhum aluno cadastrado para exportar.');
    return;
  }

  const blob = new Blob([JSON.stringify(alunos, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'students.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function getNotas(username) {
  const all = JSON.parse(localStorage.getItem(STORAGE_NOTAS) || '{}');
  if (all[username]) {
    const disciplinasComCategoria = (all[username].disciplinas || []).map((disciplina, index) => ({
      ...disciplina,
      categoria: disciplina.categoria || (index < 2 ? 'Obrigatória' : 'Opcional')
    }));
    return {
      ...all[username],
      disciplinas: disciplinasComCategoria
    };
  }
  return {
    semestre: '2026.1',
    disciplinas: [
      { nome: 'Algoritmos',          cargaHoraria: '80h',  nota: 9.0, situacao: 'Aprovado', categoria: 'Obrigatória' },
      { nome: 'Cálculo I',           cargaHoraria: '60h',  nota: 7.5, situacao: 'Aprovado', categoria: 'Obrigatória' },
      { nome: 'Estrutura de Dados',  cargaHoraria: '100h', nota: 8.8, situacao: 'Aprovado', categoria: 'Opcional' },
      { nome: 'Física I',            cargaHoraria: '60h',  nota: 7, situacao: 'Aprovado', categoria: 'Opcional' },
    ]
  };
}

function getGreeting(name) {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = name.trim().split(' ')[0];
  return `${period}, ${firstName}!`;
}

function renderVisaoGeral() {
  const user = getCurrentUser();
  if (!user) return;
  const { semestre, disciplinas } = getNotas(user.username);
  const total    = disciplinas.length;
  const media    = total ? (disciplinas.reduce((s, d) => s + d.nota, 0) / total).toFixed(1) : '—';
  const aprovadas = disciplinas.filter(d => d.situacao === 'Aprovado').length;

  document.getElementById('visaoGeralContent').innerHTML = `
    <div class="visao-saudacao">
      <span class="visao-saudacao-texto">${getGreeting(user.name)}</span>
      <span class="visao-saudacao-sub">Aqui está um resumo da sua situação acadêmica.</span>
    </div>
    <div class="cadastro-card">
      <div class="cadastro-avatar" style="background:${getAvatarColor(user.name)}">${getInitials(user.name)}</div>
      <div class="cadastro-info">
        <span class="cadastro-nome">${user.name}</span>
        <span class="cadastro-curso">${user.curso || '—'}</span>
        <span class="cadastro-matricula">Matrícula: <strong>${user.matricula || '—'}</strong></span>
        <span class="cadastro-semestre">Semestre: ${semestre}</span>
      </div>
      <span class="cadastro-status">Ativo</span>
    </div>
    <div class="visao-cards">
      <div class="visao-card">
        <span class="visao-card-label">Semestre</span>
        <span class="visao-card-value">${semestre}</span>
      </div>
      <div class="visao-card">
        <span class="visao-card-label">Média geral</span>
        <span class="visao-card-value">${media}</span>
      </div>
      <div class="visao-card">
        <span class="visao-card-label">Aprovações</span>
        <span class="visao-card-value">${aprovadas} / ${total}</span>
      </div>
    </div>
    <h3 class="visao-subtitle">Notas por disciplina</h3>
    <table>
      <thead><tr><th>Disciplina</th><th>Carga Horária</th><th>Nota</th><th>Situação</th></tr></thead>
      <tbody>
        ${disciplinas.map(d => `
          <tr>
            <td>${d.nome}</td>
            <td>${d.cargaHoraria}</td>
            <td>${d.nota.toFixed(1)}</td>
            <td class="${d.situacao === 'Aprovado' ? 'status-concluido' : 'status-pendente'}">${d.situacao}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
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
