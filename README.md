Desenvolvido por: Eduardo Henrique, Antônio Miguel, Victor Ramos e Mateus Paulo

# 📝 KeepNotes

Aplicativo web de anotações inspirado no Google Keep, focado em organizar
anotações de **aulas, trabalho e cotidiano** através de um dashboard em
cards, com tags, cores e notas fixadas.

## 🎯 Visão geral e objetivo

O KeepNotes foi criado para resolver um problema simples: centralizar
anotações rápidas do dia a dia (aulas, tarefas de trabalho, ideias soltas)
em um único lugar, com organização visual e busca instantânea — sem
necessidade de login, servidor ou instalação de dependências pesadas.

Funcionalidades principais:

- ✅ CRUD completo de notas (criar, visualizar, editar, excluir)
- 🏷️ Categorização por tags (Aulas, Trabalho, Ideias, ou qualquer tag customizada)
- 🎨 9 cores para marcação visual das notas
- 📌 Fixar notas importantes no topo
- 🔍 Busca em tempo real por título, conteúdo ou tag
- 💾 Persistência local automática (localStorage) — os dados não se perdem ao fechar o navegador
- 📱 Interface responsiva (mobile, tablet e desktop)

## 🛠️ Tecnologias utilizadas

| Camada        | Tecnologia                                  |
|---------------|----------------------------------------------|
| Estrutura     | HTML5                                        |
| Estilo        | Tailwind CSS (via CDN) + CSS3 customizado    |
| Lógica        | JavaScript (ES6+, Vanilla — sem frameworks)  |
| Ícones        | Font Awesome 6                               |
| Persistência  | `localStorage` do navegador                  |

> O projeto foi propositalmente feito sem build step (Webpack/Vite) e sem
> backend, para que qualquer pessoa consiga rodá-lo apenas abrindo o
> `index.html`. Veja a seção **"Evoluindo para um backend"** abaixo para
> transformá-lo em uma aplicação full stack com Node.js/Express.

## 🚀 Como rodar localmente

### Opção 1 — Abrir diretamente
1. Baixe/clone os arquivos do projeto.
2. Dê duplo clique em `index.html` (ou clique com o botão direito → "Abrir com" → seu navegador).

### Opção 2 — Servidor local (recomendado)
Alguns navegadores restringem `localStorage`/módulos ao abrir arquivos com `file://`.
Para evitar isso, sirva a pasta com um servidor simples:

```bash
# Usando Node.js (npx, sem instalação global)
npx serve .

# OU usando Python 3
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080` (ou a porta indicada no terminal).
