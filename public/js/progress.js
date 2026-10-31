// ======================================================
// PROGRESS PAGE
// Reads quiz results recorded by js/progress-store.js
// (shared with quiz.js) and renders them here.
// ======================================================

const SUBJECT_META = {
    math: { label: "Math", icon: "➗" },
    science: { label: "Science", icon: "🔬" },
    english: { label: "English", icon: "📖" },
    history: { label: "History", icon: "🏛️" },
    geography: { label: "Geography", icon: "🌍" },
    biology: { label: "Biology", icon: "🧬" },
    chemistry: { label: "Chemistry", icon: "🧪" },
    physics: { label: "Physics", icon: "⚛️" },
    computer: { label: "Computer Science", icon: "💻" },
};

function subjectLabel(subject) {
    return (SUBJECT_META[subject] && SUBJECT_META[subject].label) || subject;
}

function subjectIcon(subject) {
    return (SUBJECT_META[subject] && SUBJECT_META[subject].icon) || "📚";
}

function renderOverview() {
    const history = NachoProgress.getHistory();
    const average = NachoProgress.overallAverage();

    document.getElementById("quizCount").textContent = history.length;
    document.getElementById("averageScore").textContent = average + "%";
    document.getElementById("overallPercent").textContent = average + "%";

    const overallText = document.getElementById("overallText");

    if (!history.length) {
        overallText.textContent = "Start studying and take your first quiz!";
    } else if (average < 50) {
        overallText.textContent = "Keep practicing. You can improve!";
    } else if (average < 80) {
        overallText.textContent = "Good progress! Keep learning!";
    } else {
        overallText.textContent = "Excellent work! Keep it up! 🎉";
    }
}

function renderSubjectGrid() {
    const averages = NachoProgress.subjectAverages();
    const subjects = Object.keys(averages);
    const grid = document.getElementById("subjectGrid");

    if (!subjects.length) {
        return; // Keep the empty-state markup already in the page.
    }

    grid.innerHTML = "";

    subjects
        .sort((a, b) => subjectLabel(a).localeCompare(subjectLabel(b)))
        .forEach((subject) => {
            const percent = Math.min(averages[subject], 100);

            const card = document.createElement("div");
            card.className = "subject-card";
            card.innerHTML = `
                <div class="subject-title">
                    <span>${subjectIcon(subject)}</span>
                    <h3>${subjectLabel(subject)}</h3>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <p><span>${percent}%</span> completed</p>
            `;
            grid.appendChild(card);
        });
}

function renderWeakTopics() {
    const weak = NachoProgress.weakSubjects();
    const container = document.getElementById("weakTopics");

    if (!weak.length) {
        return; // Keep the empty-state markup already in the page.
    }

    container.innerHTML = "";

    weak.forEach(({ subject, percent }) => {
        const topicElement = document.createElement("div");
        topicElement.className = "weak-topic";
        topicElement.innerHTML = `
            <span>${subjectIcon(subject)}</span>
            <strong>${subjectLabel(subject)}</strong>
            <span>${percent}%</span>
        `;
        container.appendChild(topicElement);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderOverview();
    renderSubjectGrid();
    renderWeakTopics();
});
