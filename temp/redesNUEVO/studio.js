const state = {
  master: null,
  questions: [],
  answers: [],
  current: 0,
  activeFilter: { kind: "all", value: "all" }
};

const el = {
  generalBtn: document.getElementById("generalBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  resetBtn: document.getElementById("resetBtn"),
  chips: Array.from(document.querySelectorAll(".chip")),
  bankCount: document.getElementById("bankCount"),
  position: document.getElementById("position"),
  answered: document.getElementById("answered"),
  correct: document.getElementById("correct"),
  wrong: document.getElementById("wrong"),
  score: document.getElementById("score"),
  status: document.getElementById("status"),
  quiz: document.getElementById("quiz"),
  source: document.getElementById("source"),
  topic: document.getElementById("topic"),
  question: document.getElementById("question"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn")
};

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupeQuestions(questions) {
  const seen = new Set();
  return questions.filter((question) => {
    const key = normalize(question.pregunta);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getFilteredQuestions() {
  const all = state.master?.test_general || [];
  const { kind, value } = state.activeFilter;
  if (kind === "all") return all;
  return all.filter((question) => String(question[kind]) === value);
}

function loadQuestions(questions, shouldShuffle = false) {
  state.questions = shouldShuffle ? shuffle(dedupeQuestions(questions)) : dedupeQuestions(questions);
  state.answers = state.questions.map(() => null);
  state.current = 0;
  render();
}

function getCorrectLetter(question) {
  return String(question?.respuesta_correcta || "").trim();
}

function getStats() {
  let answered = 0;
  let correct = 0;
  state.answers.forEach((answer, index) => {
    if (answer === null) return;
    answered += 1;
    if (answer === getCorrectLetter(state.questions[index])) correct += 1;
  });
  const wrong = answered - correct;
  const raw = correct - (wrong * 0.33);
  const max = Math.max(1, state.questions.length);
  return {
    answered,
    correct,
    wrong,
    score: Math.max(0, Math.min(10, (raw / max) * 10))
  };
}

function renderStats() {
  const stats = getStats();
  el.bankCount.textContent = String(state.questions.length);
  el.position.textContent = state.questions.length ? `${state.current + 1}/${state.questions.length}` : "0/0";
  el.answered.textContent = String(stats.answered);
  el.correct.textContent = String(stats.correct);
  el.wrong.textContent = String(stats.wrong);
  el.score.textContent = stats.score.toFixed(2);
}

function renderQuestion() {
  const question = state.questions[state.current];
  if (!question) {
    el.quiz.hidden = true;
    el.status.textContent = "No hay preguntas para el filtro seleccionado.";
    return;
  }

  el.quiz.hidden = false;
  el.status.textContent = `Banco activo: ${state.questions.length} preguntas deduplicadas.`;
  el.source.textContent = question.source || "Sin fuente";
  el.topic.textContent = `${question.tema || "UD"} · ${question.bloque || "bloque"}`;
  el.question.textContent = question.pregunta;
  el.options.innerHTML = "";

  const selected = state.answers[state.current];
  const correct = getCorrectLetter(question);
  Object.entries(question.opciones || {}).forEach(([letter, text]) => {
    const button = document.createElement("button");
    button.className = "option";
    button.type = "button";
    button.textContent = `${letter.toUpperCase()}) ${text}`;
    button.addEventListener("click", () => {
      state.answers[state.current] = letter;
      render();
    });
    if (selected !== null) {
      if (letter === selected) button.classList.add("selected");
      if (letter === correct) button.classList.add("correct");
      if (letter === selected && selected !== correct) button.classList.add("wrong");
    }
    el.options.appendChild(button);
  });

  if (selected === null) {
    el.feedback.hidden = true;
    el.feedback.className = "feedback";
  } else {
    const correctText = question.opciones?.[correct] || "";
    const ok = selected === correct;
    el.feedback.hidden = false;
    el.feedback.className = `feedback ${ok ? "good" : "bad"}`;
    el.feedback.textContent = ok
      ? "Respuesta correcta."
      : `Respuesta incorrecta. Correcta: ${correct.toUpperCase()}) ${correctText}`;
  }

  el.prevBtn.disabled = state.current === 0;
  el.nextBtn.disabled = state.current >= state.questions.length - 1;
}

function render() {
  renderStats();
  renderQuestion();
}

function setActiveChip(chip) {
  el.chips.forEach((item) => item.classList.remove("active"));
  chip.classList.add("active");
  state.activeFilter = {
    kind: chip.dataset.filterKind,
    value: chip.dataset.filterValue
  };
  loadQuestions(getFilteredQuestions(), true);
}

async function init() {
  const response = await fetch("redes_master.json", { cache: "no-store" });
  state.master = await response.json();
  loadQuestions(state.master.test_general || [], true);
  el.status.textContent = `Listo: ${state.master.stats.web_questions_raw} preguntas web brutas, ${state.master.stats.general_deduplicated_questions} unicas para test general.`;
}

el.generalBtn.addEventListener("click", () => {
  state.activeFilter = { kind: "all", value: "all" };
  el.chips.forEach((chip) => chip.classList.toggle("active", chip.dataset.filterKind === "all"));
  loadQuestions(state.master?.test_general || [], true);
});

el.shuffleBtn.addEventListener("click", () => {
  loadQuestions(state.questions, true);
});

el.resetBtn.addEventListener("click", () => {
  state.answers = state.questions.map(() => null);
  state.current = 0;
  render();
});

el.prevBtn.addEventListener("click", () => {
  if (state.current > 0) {
    state.current -= 1;
    render();
  }
});

el.nextBtn.addEventListener("click", () => {
  if (state.current < state.questions.length - 1) {
    state.current += 1;
    render();
  }
});

el.chips.forEach((chip) => {
  chip.addEventListener("click", () => setActiveChip(chip));
});

init().catch((error) => {
  el.status.textContent = `No se pudo cargar redes_master.json: ${error.message}`;
});
