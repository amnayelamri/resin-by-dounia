/* === Formation Slide Player === */
let formations = [];
let currentFormation = null;
let currentSlideIndex = 0;

/* ---- Matching state ---- */
let matchingSelected = { left: null, right: null };

async function loadFormations() {
  const res = await fetch('data/formations.json');
  formations = await res.json();
  renderFormationList();
}

function renderFormationList() {
  const list = document.getElementById('formation-list');
  if (!list) return;
  list.innerHTML = formations.map((f, i) => `
    <div class="formation-card" onclick="openFormation(${i})">
      <div class="formation-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="formation-info">
        <h3>${f.title}</h3>
        <p>${f.description || ''}</p>
        <div class="tags">${(f.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
      </div>
      <div class="formation-arrow">→</div>
    </div>
  `).join('');
}

function openFormation(index) {
  currentFormation = formations[index];
  currentSlideIndex = 0;

  document.getElementById('formation-list-section').style.display = 'none';
  document.getElementById('formation-hero').style.display = 'none';
  const player = document.getElementById('slide-player');
  player.style.display = 'flex';

  document.getElementById('sidebar-title').textContent = currentFormation.title;
  renderSidebarNav();
  goToSlide(0);
}

function closeFormation() {
  document.getElementById('slide-player').style.display = 'none';
  document.getElementById('formation-list-section').style.display = 'block';
  document.getElementById('formation-hero').style.display = 'block';
  currentFormation = null;
}

function renderSidebarNav() {
  const nav = document.getElementById('slide-nav-list');
  nav.innerHTML = currentFormation.slides.map((s, i) => `
    <div class="slide-nav-item ${i === currentSlideIndex ? 'active' : ''}" onclick="goToSlide(${i})">
      <span class="slide-num">${i + 1}</span>
      <span>${s.title}</span>
    </div>
  `).join('');
}

function goToSlide(index) {
  currentSlideIndex = index;
  matchingSelected = { left: null, right: null };

  /* Update sidebar */
  document.querySelectorAll('.slide-nav-item').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  const slide = currentFormation.slides[index];
  document.getElementById('slide-title').textContent = slide.title;
  document.getElementById('slide-body').innerHTML = renderSlide(slide);
  attachSlideEvents(slide);

  /* Nav buttons */
  document.getElementById('btn-prev').disabled = index === 0;
  document.getElementById('btn-next').disabled = index === currentFormation.slides.length - 1;
  document.getElementById('slide-progress').textContent =
    `${index + 1} / ${currentFormation.slides.length}`;

  /* Scroll to top of content */
  document.getElementById('slide-content-area').scrollTop = 0;
  document.getElementById('slide-content-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function prevSlide() { if (currentSlideIndex > 0) goToSlide(currentSlideIndex - 1); }
function nextSlide() {
  if (currentSlideIndex < currentFormation.slides.length - 1) goToSlide(currentSlideIndex + 1);
}

/* ===== Slide Renderers ===== */
function renderSlide(slide) {
  switch (slide.type) {
    case 'markdown': return renderMarkdown(slide);
    case 'video':    return renderVideo(slide);
    case 'quiz':     return renderQuiz(slide);
    case 'flashcard':return renderFlashcard(slide);
    case 'truefalse':return renderTrueFalse(slide);
    case 'number':   return renderNumber(slide);
    case 'steps':    return renderSteps(slide);
    case 'reveal':   return renderReveal(slide);
    case 'matching': return renderMatching(slide);
    default:         return `<p>${slide.content || ''}</p>`;
  }
}

function renderMarkdown(slide) {
  const html = typeof marked !== 'undefined'
    ? marked.parse(slide.content || '')
    : (slide.content || '').replace(/\n/g, '<br>');
  return `<div class="markdown-content">${html}</div>`;
}

function renderVideo(slide) {
  const videoId = extractYouTubeId(slide.url);
  if (!videoId) return `<p>Vidéo non disponible : <a href="${slide.url}" target="_blank">${slide.url}</a></p>`;
  return `
    <div class="video-wrapper">
      <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen loading="lazy"></iframe>
    </div>`;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return m ? m[1] : null;
}

function renderQuiz(slide) {
  const choices = slide.choices.map(c => `
    <div class="quiz-choice" data-id="${c.id}" data-correct="${c.correct}">
      ${c.text}
    </div>`).join('');
  const exp = slide.explanation
    ? `<div class="quiz-explanation" id="quiz-exp">${slide.explanation}</div>` : '';
  return `
    <div class="quiz-container">
      <div class="quiz-question">${slide.question}</div>
      <div class="quiz-choices" id="quiz-choices">${choices}</div>
      ${exp}
    </div>`;
}

function renderFlashcard(slide) {
  return `
    <div class="flashcard" id="flashcard" onclick="document.getElementById('flashcard').classList.toggle('flipped')">
      <div class="flashcard-inner">
        <div class="flashcard-front">
          <div>${slide.question}</div>
          ${slide.hint ? `<div class="flashcard-hint">💡 ${slide.hint}</div>` : ''}
          <div class="flashcard-flip-hint">${t('slide.flip')}</div>
        </div>
        <div class="flashcard-back">
          <div class="markdown-content">${typeof marked !== 'undefined' ? marked.parse(slide.answer || '') : slide.answer}</div>
        </div>
      </div>
    </div>`;
}

function renderTrueFalse(slide) {
  return `
    <div class="tf-statement">${slide.statement}</div>
    <div class="tf-buttons">
      <button class="tf-btn" onclick="checkTF(this, true, ${slide.answer})">✅ Vrai</button>
      <button class="tf-btn" onclick="checkTF(this, false, ${slide.answer})">❌ Faux</button>
    </div>
    ${slide.explanation ? `<div class="tf-explanation" id="tf-exp">${slide.explanation}</div>` : ''}`;
}

function renderNumber(slide) {
  return `
    <div class="number-question">${slide.question}</div>
    ${slide.hint ? `<div class="number-hint">💡 ${slide.hint}</div>` : ''}
    <div class="number-input-wrap">
      <input type="number" class="number-input" id="number-input" placeholder="Réponse...">
      <button class="number-submit" onclick="checkNumber(${slide.answer}, ${slide.tolerance || 0})">Valider</button>
    </div>
    <div class="number-result" id="number-result">
      ${slide.explanation || ''}
    </div>`;
}

function renderSteps(slide) {
  const intro = slide.intro ? `<p class="steps-intro">${slide.intro}</p>` : '';
  const steps = (slide.steps || []).map((s, i) => `
    <div class="step-item ${i === 0 ? 'revealed' : ''}" onclick="revealStep(this)">
      <div class="step-num">${i + 1}</div>
      <div class="step-body">
        <h4>${s.label}</h4>
        <p>${s.content}</p>
      </div>
    </div>`).join('');
  return `${intro}<div class="steps-list">${steps}</div>
    <p style="font-size:0.8rem;color:var(--color-text-light);margin-top:1rem">${t('slide.reveal_step')}</p>`;
}

function renderReveal(slide) {
  return slide.items.map(item => `
    <div class="reveal-item" onclick="this.classList.toggle('open')">
      <div class="reveal-question">
        <span>${item.question}</span>
        <span class="reveal-chevron">▼</span>
      </div>
      <div class="reveal-answer">${typeof marked !== 'undefined' ? marked.parse(item.answer || '') : item.answer}</div>
    </div>`).join('');
}

function renderMatching(slide) {
  const pairs = [...slide.pairs];
  const shuffledRight = [...pairs].sort(() => Math.random() - 0.5);
  return `
    <p class="matching-instruction">${slide.instruction || 'Reliez chaque élément.'}</p>
    <div class="matching-grid">
      <div class="matching-col">
        <div class="matching-col-title">A</div>
        ${pairs.map((p, i) => `<div class="matching-item" data-left="${i}" onclick="selectLeft(this, ${i})">${p.left}</div>`).join('')}
      </div>
      <div class="matching-col">
        <div class="matching-col-title">B</div>
        ${shuffledRight.map((p, i) => {
          const originalIdx = pairs.findIndex(orig => orig.right === p.right);
          return `<div class="matching-item" data-right="${originalIdx}" onclick="selectRight(this, ${originalIdx})">${p.right}</div>`;
        }).join('')}
      </div>
    </div>
    <p class="matching-result" id="matching-result"></p>`;
}

/* ===== Slide Events ===== */
function attachSlideEvents(slide) {
  if (slide.type === 'quiz') {
    document.querySelectorAll('.quiz-choice').forEach(el => {
      el.addEventListener('click', () => {
        if (el.classList.contains('disabled')) return;
        const isCorrect = el.dataset.correct === 'true';
        document.querySelectorAll('.quiz-choice').forEach(c => {
          c.classList.add('disabled');
          if (c.dataset.correct === 'true') c.classList.add('correct');
          else if (c === el && !isCorrect) c.classList.add('wrong');
        });
        const exp = document.getElementById('quiz-exp');
        if (exp) exp.classList.add('show');
      });
    });
  }
}

function checkTF(btn, answer, correct) {
  const allBtns = document.querySelectorAll('.tf-btn');
  allBtns.forEach(b => b.classList.add('disabled'));
  btn.classList.add(answer === correct ? 'correct' : 'wrong');
  const exp = document.getElementById('tf-exp');
  if (exp) exp.classList.add('show');
}

function checkNumber(answer, tolerance) {
  const input = document.getElementById('number-input');
  const result = document.getElementById('number-result');
  const val = parseFloat(input.value);
  result.className = 'number-result';
  if (Math.abs(val - answer) <= tolerance) {
    result.classList.add('correct');
    result.prepend(document.createTextNode('✅ Correct ! '));
  } else {
    result.classList.add('wrong');
    result.prepend(document.createTextNode(`❌ La réponse était ${answer}. `));
  }
}

function revealStep(el) {
  const steps = el.parentElement.querySelectorAll('.step-item');
  const idx = Array.from(steps).indexOf(el);
  steps.forEach((s, i) => { if (i <= idx) s.classList.add('revealed'); });
}

function selectLeft(el, idx) {
  document.querySelectorAll('[data-left]').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  matchingSelected.left = idx;
  checkMatchingPair();
}

function selectRight(el, idx) {
  document.querySelectorAll('[data-right]').forEach(e => {
    if (!e.classList.contains('matched-correct')) e.classList.remove('selected');
  });
  el.classList.add('selected');
  matchingSelected.right = idx;
  checkMatchingPair();
}

function checkMatchingPair() {
  const { left, right } = matchingSelected;
  if (left === null || right === null) return;

  const leftEl = document.querySelector(`[data-left="${left}"]`);
  const rightEl = document.querySelector(`[data-right="${right}"]`);
  const isMatch = left === right;

  leftEl.classList.remove('selected');
  leftEl.classList.add(isMatch ? 'matched-correct' : 'matched-wrong');
  rightEl.classList.remove('selected');
  rightEl.classList.add(isMatch ? 'matched-correct' : 'matched-wrong');

  matchingSelected = { left: null, right: null };

  if (!isMatch) {
    setTimeout(() => {
      leftEl.classList.remove('matched-wrong');
      rightEl.classList.remove('matched-wrong');
    }, 800);
  } else {
    const total = document.querySelectorAll('[data-left]').length;
    const matched = document.querySelectorAll('[data-left].matched-correct').length;
    const result = document.getElementById('matching-result');
    if (result && matched === total) result.textContent = '🎉 Parfait ! Tous les paires sont correctes.';
  }
}

function onLangChange() {
  if (currentFormation) {
    goToSlide(currentSlideIndex);
  } else {
    renderFormationList();
  }
}

document.addEventListener('DOMContentLoaded', loadFormations);
