/* =========================================================
   app.js — KeepNotes
   CRUD completo de notas com persistência em localStorage.
   Organizado em: estado, persistência, renderização, eventos.
   ========================================================= */

/* ---------- 1. ESTADO GLOBAL ---------- */
const STORAGE_KEY = "keepnotes_data_v1";

// Cada nota: { id, title, content, tag, color, pinned, createdAt, updatedAt }
let notes = [];
let activeTagFilter = "Todas";
let searchTerm = "";
let editingNoteId = null; // null = criando nova nota

// Paleta de cores disponível (classe CSS + nome amigável)
const COLORS = [
  { key: "white", label: "Padrão" },
  { key: "red", label: "Vermelho" },
  { key: "orange", label: "Laranja" },
  { key: "yellow", label: "Amarelo" },
  { key: "green", label: "Verde" },
  { key: "blue", label: "Azul" },
  { key: "purple", label: "Roxo" },
  { key: "pink", label: "Rosa" },
  { key: "gray", label: "Cinza" },
];

/* ---------- 2. PERSISTÊNCIA (localStorage) ---------- */

// Carrega as notas salvas ou popula com exemplos na primeira execução
function loadNotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    notes = JSON.parse(raw);
  } else {
    notes = getSeedNotes();
    saveNotes();
  }
}

// Persiste o array `notes` inteiro no localStorage
function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// Notas de exemplo exibidas na primeira vez que o app é aberto
function getSeedNotes() {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      title: "Bem-vindo ao KeepNotes 👋",
      content:
        "Clique em 'Nova nota' para começar. Você pode fixar, colorir e organizar por tags como Aulas, Trabalho e Ideias.",
      tag: "Ideias",
      color: "yellow",
      pinned: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: "Revisão - Estrutura de Dados",
      content: "Rever árvores AVL e complexidade de balanceamento antes da prova.",
      tag: "Aulas",
      color: "blue",
      pinned: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: "Reunião de sprint",
      content: "Levar apresentação do progresso do módulo de autenticação.",
      tag: "Trabalho",
      color: "green",
      pinned: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/* ---------- 3. ELEMENTOS DOM ---------- */
const els = {
  pinnedSection: document.getElementById("pinnedSection"),
  pinnedGrid: document.getElementById("pinnedGrid"),
  notesGrid: document.getElementById("notesGrid"),
  othersLabel: document.getElementById("othersLabel"),
  emptyState: document.getElementById("emptyState"),
  tagFilterBar: document.getElementById("tagFilterBar"),
  searchInput: document.getElementById("searchInput"),
  btnNovaNota: document.getElementById("btnNovaNota"),

  modalOverlay: document.getElementById("modalOverlay"),
  noteForm: document.getElementById("noteForm"),
  noteId: document.getElementById("noteId"),
  noteTitle: document.getElementById("noteTitle"),
  noteContent: document.getElementById("noteContent"),
  noteTag: document.getElementById("noteTag"),
  tagSuggestions: document.getElementById("tagSuggestions"),
  colorPicker: document.getElementById("colorPicker"),
  btnTogglePin: document.getElementById("btnTogglePin"),
  btnDeleteNote: document.getElementById("btnDeleteNote"),
  btnCancelModal: document.getElementById("btnCancelModal"),
};

let selectedColor = "white";
let isPinnedDraft = false;

/* ---------- 4. RENDERIZAÇÃO ---------- */

// Retorna a lista de notas já filtrada por tag + busca
function getFilteredNotes() {
  return notes.filter((note) => {
    const matchesTag =
      activeTagFilter === "Todas" || note.tag === activeTagFilter;

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      term === "" ||
      note.title.toLowerCase().includes(term) ||
      note.content.toLowerCase().includes(term) ||
      (note.tag || "").toLowerCase().includes(term);

    return matchesTag && matchesSearch;
  });
}

// Cria o elemento HTML (card) de uma nota
function createNoteCard(note) {
  const card = document.createElement("div");
  card.className = `note-card color-${note.color || "white"}`;
  card.dataset.id = note.id;

  card.innerHTML = `
    ${note.pinned ? '<i class="fa-solid fa-thumbtack pin-icon"></i>' : ""}
    <div class="note-title">${escapeHtml(note.title) || "(Sem título)"}</div>
    <div class="note-content">${escapeHtml(note.content)}</div>
    ${
      note.tag
        ? `<span class="note-tag">${escapeHtml(note.tag)}</span>`
        : ""
    }
    <button class="quick-delete" title="Excluir nota">
      <i class="fa-regular fa-trash-can"></i>
    </button>
  `;

  // Abrir modal de edição ao clicar no card
  card.addEventListener("click", () => openModalForEdit(note.id));

  // Exclusão rápida (sem abrir o modal)
  card.querySelector(".quick-delete").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteNote(note.id);
  });

  return card;
}

// Evita injeção de HTML ao exibir texto do usuário
function escapeHtml(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Recalcula e desenha toda a interface (grades, tags, empty state)
function render() {
  const filtered = getFilteredNotes();
  const pinned = filtered.filter((n) => n.pinned);
  const others = filtered.filter((n) => !n.pinned);

  // Seção "Fixadas"
  els.pinnedGrid.innerHTML = "";
  if (pinned.length > 0) {
    els.pinnedSection.classList.remove("hidden");
    pinned
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .forEach((n) => els.pinnedGrid.appendChild(createNoteCard(n)));
  } else {
    els.pinnedSection.classList.add("hidden");
  }

  // Demais notas
  els.notesGrid.innerHTML = "";
  others
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .forEach((n) => els.notesGrid.appendChild(createNoteCard(n)));

  els.othersLabel.textContent = pinned.length > 0 ? "Outras notas" : "Notas";

  // Estado vazio
  els.emptyState.classList.toggle("hidden", filtered.length > 0);

  renderTagFilters();
}

// Recria os botões de filtro com base nas tags existentes
function renderTagFilters() {
  const uniqueTags = [...new Set(notes.map((n) => n.tag).filter(Boolean))];

  els.tagFilterBar.innerHTML = "";
  const allTags = ["Todas", ...uniqueTags];

  allTags.forEach((tag) => {
    const btn = document.createElement("button");
    btn.textContent = tag;
    btn.className = "tag-filter-btn";
    btn.dataset.tag = tag;
    if (tag === activeTagFilter) btn.classList.add("active-filter");

    btn.addEventListener("click", () => {
      activeTagFilter = tag;
      render();
    });

    els.tagFilterBar.appendChild(btn);
  });

  // Atualiza sugestões de tag no modal (datalist)
  els.tagSuggestions.innerHTML = uniqueTags
    .map((t) => `<option value="${escapeHtml(t)}"></option>`)
    .join("");
}

/* ---------- 5. CRUD ---------- */

// Cria ou atualiza uma nota a partir dos dados do formulário
function saveNoteFromForm(e) {
  e.preventDefault();

  const title = els.noteTitle.value.trim();
  const content = els.noteContent.value.trim();
  const tag = els.noteTag.value.trim();

  // Ignora notas totalmente vazias
  if (!title && !content) {
    closeModal();
    return;
  }

  if (editingNoteId) {
    // Edição de nota existente
    const note = notes.find((n) => n.id === editingNoteId);
    Object.assign(note, {
      title,
      content,
      tag,
      color: selectedColor,
      pinned: isPinnedDraft,
      updatedAt: Date.now(),
    });
  } else {
    // Criação de nova nota
    notes.unshift({
      id: crypto.randomUUID(),
      title,
      content,
      tag,
      color: selectedColor,
      pinned: isPinnedDraft,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  saveNotes();
  closeModal();
  render();
}

// Remove uma nota pelo id (com confirmação simples)
function deleteNote(id) {
  const confirmDelete = confirm("Excluir esta nota?");
  if (!confirmDelete) return;

  notes = notes.filter((n) => n.id !== id);
  saveNotes();
  closeModal();
  render();
}

/* ---------- 6. MODAL (criar/editar) ---------- */

function buildColorPicker() {
  els.colorPicker.innerHTML = "";
  COLORS.forEach(({ key, label }) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.title = label;
    dot.className = `color-dot color-${key} ${
      selectedColor === key ? "selected" : ""
    }`;
    dot.addEventListener("click", () => {
      selectedColor = key;
      buildColorPicker(); // re-renderiza para marcar o selecionado
    });
    els.colorPicker.appendChild(dot);
  });
}

function openModalForCreate() {
  editingNoteId = null;
  selectedColor = "white";
  isPinnedDraft = false;

  els.noteForm.reset();
  els.btnDeleteNote.classList.add("hidden");
  els.btnTogglePin.classList.remove("text-amber-500");

  buildColorPicker();
  els.modalOverlay.classList.remove("hidden");
  els.modalOverlay.classList.add("flex");
  setTimeout(() => els.noteTitle.focus(), 50);
}

function openModalForEdit(id) {
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  editingNoteId = id;
  selectedColor = note.color || "white";
  isPinnedDraft = !!note.pinned;

  els.noteTitle.value = note.title;
  els.noteContent.value = note.content;
  els.noteTag.value = note.tag || "";
  els.btnDeleteNote.classList.remove("hidden");
  els.btnTogglePin.classList.toggle("text-amber-500", isPinnedDraft);

  buildColorPicker();
  els.modalOverlay.classList.remove("hidden");
  els.modalOverlay.classList.add("flex");
}

function closeModal() {
  els.modalOverlay.classList.add("hidden");
  els.modalOverlay.classList.remove("flex");
  els.noteForm.reset();
  editingNoteId = null;
}

/* ---------- 7. EVENTOS ---------- */

els.btnNovaNota.addEventListener("click", openModalForCreate);
els.btnCancelModal.addEventListener("click", closeModal);
els.noteForm.addEventListener("submit", saveNoteFromForm);

els.btnDeleteNote.addEventListener("click", () => {
  if (editingNoteId) deleteNote(editingNoteId);
});

els.btnTogglePin.addEventListener("click", () => {
  isPinnedDraft = !isPinnedDraft;
  els.btnTogglePin.classList.toggle("text-amber-500", isPinnedDraft);
});

// Fecha o modal ao clicar fora da caixa
els.modalOverlay.addEventListener("click", (e) => {
  if (e.target === els.modalOverlay) closeModal();
});

// Busca em tempo real (título, conteúdo e tag)
els.searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  render();
});

// Atalho: ESC fecha o modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.modalOverlay.classList.contains("hidden")) {
    closeModal();
  }
});

/* ---------- 8. INICIALIZAÇÃO ---------- */
loadNotes();
render();