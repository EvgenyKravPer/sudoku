import { Difficulty, generateBatch, GeneratedSudoku, Grid } from "./sudoku";

type PrintLanguage = "ru" | "en";

interface PrintStrings {
  defaultTitle: string;
  locale: string;
  difficulty: Record<Difficulty, string>;
  puzzleMeta: (id: number, total: number, diff: string, date: string) => string;
  footerRule: string;
  answerKeyTitle: (title: string) => string;
  solutionLabel: (id: number) => string;
}

const PRINT_I18N: Record<PrintLanguage, PrintStrings> = {
  ru: {
    defaultTitle: "Судоку для мамы",
    locale: "ru-RU",
    difficulty: {
      gentle: "Лёгкий+",
      easy: "Лёгкий",
      medium: "Средний",
      hard: "Сложный",
    },
    puzzleMeta: (id, total, diff, date) =>
      `Судоку ${id} из ${total}  •  Уровень: ${diff}  •  ${date}`,
    footerRule:
      "Заполните пустые клетки цифрами от 1 до 9 так, чтобы в каждой строке, каждом столбце и каждом квадрате 3×3 цифры не повторялись.",
    answerKeyTitle: (title) => `${title} — Ответы`,
    solutionLabel: (id) => `Ответ к судоку №${id}`,
  },
  en: {
    defaultTitle: "Mom's Weekly Sudoku",
    locale: "en-US",
    difficulty: {
      gentle: "Gentle",
      easy: "Easy",
      medium: "Medium",
      hard: "Challenging",
    },
    puzzleMeta: (id, total, diff, date) =>
      `Puzzle ${id} of ${total}  •  ${diff}  •  ${date}`,
    footerRule:
      "Every number 1 to 9 appears once in each row, column, and 3×3 box.",
    answerKeyTitle: (title) => `${title} — Answer Key`,
    solutionLabel: (id) => `Puzzle #${id} Solution`,
  },
};

interface AppState {
  title: string;
  lang: PrintLanguage;
  difficulty: Difficulty;
  count: number;
  layout: "1-per-page" | "2-per-page";
  includeSolutions: boolean;
  puzzles: GeneratedSudoku[];
}

const state: AppState = {
  title: "Судоку для мамы",
  lang: "ru",
  difficulty: "medium",
  count: 8,
  layout: "1-per-page",
  includeSolutions: true,
  puzzles: [],
};

function getFormattedDate(lang: PrintLanguage): string {
  return new Date().toLocaleDateString(PRINT_I18N[lang].locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderGridTable(grid: Grid, puzzleGrid?: Grid): HTMLTableElement {
  const table = document.createElement("table");
  table.className = "sudoku-grid";
  table.setAttribute("role", "grid");

  const tbody = document.createElement("tbody");

  for (let r = 0; r < 9; r++) {
    const tr = document.createElement("tr");
    for (let c = 0; c < 9; c++) {
      const td = document.createElement("td");
      const val = grid[r][c];

      const classes: string[] = ["sudoku-cell"];
      if (r % 3 === 0) classes.push("box-top");
      if (r === 8) classes.push("box-bottom");
      if (c % 3 === 0) classes.push("box-left");
      if (c === 8) classes.push("box-right");

      if (val !== 0) {
        const isGiven = puzzleGrid ? puzzleGrid[r][c] !== 0 : true;
        classes.push(isGiven ? "cell-given" : "cell-answer");
        td.textContent = String(val);
      } else {
        classes.push("cell-empty");
      }

      td.className = classes.join(" ");
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  return table;
}

function createPuzzleCard(item: GeneratedSudoku, total: number): HTMLElement {
  const t = PRINT_I18N[state.lang];
  const dateStr = getFormattedDate(state.lang);

  const card = document.createElement("section");
  card.className = "puzzle-card";

  const header = document.createElement("div");
  header.className = "puzzle-card-header";

  const titleEl = document.createElement("div");
  titleEl.className = "puzzle-pack-title";
  titleEl.textContent = state.title || t.defaultTitle;

  const metaEl = document.createElement("div");
  metaEl.className = "puzzle-meta";
  metaEl.textContent = t.puzzleMeta(
    item.id,
    total,
    t.difficulty[item.difficulty],
    dateStr,
  );

  header.appendChild(titleEl);
  header.appendChild(metaEl);

  const boardWrapper = document.createElement("div");
  boardWrapper.className = "board-wrapper";
  boardWrapper.appendChild(renderGridTable(item.puzzle));

  const footer = document.createElement("div");
  footer.className = "puzzle-card-footer";
  footer.textContent = t.footerRule;

  card.appendChild(header);
  card.appendChild(boardWrapper);
  card.appendChild(footer);

  return card;
}

function renderDocument(): void {
  const container = document.getElementById("print-container");
  if (!container) return;

  container.className = `print-container layout-${state.layout}`;
  container.innerHTML = "";

  const total = state.puzzles.length;

  if (state.layout === "1-per-page") {
    for (const item of state.puzzles) {
      const page = document.createElement("div");
      page.className = "print-page page-single";
      page.appendChild(createPuzzleCard(item, total));
      container.appendChild(page);
    }
  } else {
    // 2 puzzles per page
    for (let i = 0; i < state.puzzles.length; i += 2) {
      const page = document.createElement("div");
      page.className = "print-page page-double";
      page.appendChild(createPuzzleCard(state.puzzles[i], total));
      if (i + 1 < state.puzzles.length) {
        page.appendChild(createPuzzleCard(state.puzzles[i + 1], total));
      }
      container.appendChild(page);
    }
  }

  // Render Answer Key pages (up to 4 solutions per page)
  if (state.includeSolutions && state.puzzles.length > 0) {
    const t = PRINT_I18N[state.lang];
    const dateStr = getFormattedDate(state.lang);
    const perSolutionPage = 4;
    for (let i = 0; i < state.puzzles.length; i += perSolutionPage) {
      const page = document.createElement("div");
      page.className = "print-page page-solutions";

      const pageHeader = document.createElement("div");
      pageHeader.className = "solutions-header";
      pageHeader.innerHTML = `
        <h2>${escapeHtml(t.answerKeyTitle(state.title || t.defaultTitle))}</h2>
        <span>${escapeHtml(dateStr)}</span>
      `;
      page.appendChild(pageHeader);

      const gridContainer = document.createElement("div");
      gridContainer.className = "solutions-grid";

      const slice = state.puzzles.slice(i, i + perSolutionPage);
      for (const item of slice) {
        const solCard = document.createElement("div");
        solCard.className = "solution-item";

        const label = document.createElement("div");
        label.className = "solution-label";
        label.textContent = t.solutionLabel(item.id);

        solCard.appendChild(label);
        solCard.appendChild(renderGridTable(item.solution, item.puzzle));
        gridContainer.appendChild(solCard);
      }

      page.appendChild(gridContainer);
      container.appendChild(page);
    }
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function regeneratePuzzles(): void {
  state.puzzles = generateBatch(state.count, state.difficulty);
  renderDocument();
}

function init(): void {
  const inputTitle = document.getElementById("input-title") as HTMLInputElement;
  const selectLang = document.getElementById(
    "select-lang",
  ) as HTMLSelectElement;
  const selectDifficulty = document.getElementById(
    "select-difficulty",
  ) as HTMLSelectElement;
  const inputCount = document.getElementById("input-count") as HTMLInputElement;
  const selectLayout = document.getElementById(
    "select-layout",
  ) as HTMLSelectElement;
  const checkSolutions = document.getElementById(
    "check-solutions",
  ) as HTMLInputElement;
  const btnGenerate = document.getElementById(
    "btn-generate",
  ) as HTMLButtonElement;
  const btnPrint = document.getElementById("btn-print") as HTMLButtonElement;

  // Keep HTML controls in sync with initial `state`
  inputTitle.value = state.title;
  selectLang.value = state.lang;
  selectDifficulty.value = state.difficulty;
  inputCount.value = String(state.count);
  selectLayout.value = state.layout;
  checkSolutions.checked = state.includeSolutions;

  inputTitle.addEventListener("input", () => {
    state.title = inputTitle.value;
    renderDocument();
  });

  selectLang.addEventListener("change", () => {
    const prevDefault = PRINT_I18N[state.lang].defaultTitle;
    state.lang = selectLang.value as PrintLanguage;
    if (!state.title || state.title === prevDefault) {
      state.title = PRINT_I18N[state.lang].defaultTitle;
      inputTitle.value = state.title;
    }
    renderDocument();
  });

  selectDifficulty.addEventListener("change", () => {
    state.difficulty = selectDifficulty.value as Difficulty;
    regeneratePuzzles();
  });

  inputCount.addEventListener("change", () => {
    const parsed = Math.max(
      1,
      Math.min(30, parseInt(inputCount.value, 10) || 8),
    );
    inputCount.value = String(parsed);
    state.count = parsed;
    regeneratePuzzles();
  });

  selectLayout.addEventListener("change", () => {
    state.layout = selectLayout.value as "1-per-page" | "2-per-page";
    renderDocument();
  });

  checkSolutions.addEventListener("change", () => {
    state.includeSolutions = checkSolutions.checked;
    renderDocument();
  });

  btnGenerate.addEventListener("click", () => {
    regeneratePuzzles();
  });

  btnPrint.addEventListener("click", () => {
    window.print();
  });

  regeneratePuzzles();
}

init();
