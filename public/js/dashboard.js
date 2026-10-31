// ======================================================
// DASHBOARD
// Reads quiz results recorded by js/progress-store.js
// (shared with quiz.js and progress.js) and renders them here.
// ======================================================

const DASHBOARD_SUBJECT_META = {
    math: { label: "Mathematics", icon: "📐", topic: "algebra" },
    science: { label: "Science", icon: "🔬", topic: "chemistry" },
    english: { label: "English", icon: "📖", topic: "grammar" },
    history: { label: "History", icon: "🏛️", topic: "history" },
    geography: { label: "Geography", icon: "🌍", topic: "geography" },
    biology: { label: "Biology", icon: "🧬", topic: "biology" },
    chemistry: { label: "Chemistry", icon: "🧪", topic: "chemistry" },
    physics: { label: "Physics", icon: "⚛️", topic: "physics" },
    computer: { label: "Computer Science", icon: "💻", topic: "computer" },
};

function subjectMeta(subject) {
    return (
        DASHBOARD_SUBJECT_META[subject] || {
            label: subject,
            icon: "📚",
            topic: subject,
        }
    );
}

function renderStats() {
    const history = NachoProgress.getHistory();
    const averages = NachoProgress.subjectAverages();

    document.getElementById("statSubjects").textContent =
        Object.keys(averages).length;
    document.getElementById("statQuizzes").textContent = history.length;
    document.getElementById("statAverage").textContent =
        NachoProgress.overallAverage() + "%";
    document.getElementById("statStreak").textContent =
        NachoProgress.learningStreak() + " Days";
}

function renderWeakAreas() {
    const weak = NachoProgress.weakSubjects(3);
    const list = document.getElementById("weakAreasList");

    if (!weak.length) {
        return; // Keep the empty-state markup already in the page.
    }

    list.innerHTML = "";

    weak.forEach(({ subject, percent }) => {
        const meta = subjectMeta(subject);

        const row = document.createElement("div");
        row.className = "weak-topic";
        row.innerHTML = `
            <div class="topic-info">
                <span class="topic-icon">${meta.icon}</span>
                <div>
                    <h3>${meta.label}</h3>
                </div>
            </div>
            <div class="topic-score">
                <strong>${percent}%</strong>
                <div class="progress-bar">
                    <div style="width: ${percent}%"></div>
                </div>
            </div>
            <a href="tutor.html?topic=${encodeURIComponent(meta.topic)}" class="small-btn">
                Learn
            </a>
        `;
        list.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderStats();
    renderWeakAreas();
});
