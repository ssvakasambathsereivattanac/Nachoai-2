    // Get saved quiz history
    const quizHistory =
        JSON.parse(localStorage.getItem("quizHistory")) || [];


    // Get saved subject progress
    const subjectProgress =
        JSON.parse(localStorage.getItem("subjectProgress")) || {};


    // Get saved weak topics
    const weakTopics =
        JSON.parse(localStorage.getItem("weakTopics")) || [];


    // -------------------------
    // QUIZ COUNT
    // -------------------------

    document.getElementById("quizCount").textContent =
        quizHistory.length;


    // -------------------------
    // CALCULATE SCORE
    // -------------------------

    let totalScore = 0;
    let totalQuestions = 0;

    quizHistory.forEach(quiz => {

        totalScore += Number(quiz.score) || 0;

        totalQuestions += Number(quiz.total) || 0;

    });


    let average = 0;

    if (totalQuestions > 0) {

        average = Math.round(
            (totalScore / totalQuestions) * 100
        );

    }


    // -------------------------
    // DISPLAY SCORE
    // -------------------------

    document.getElementById("averageScore").textContent =
        average + "%";

    document.getElementById("overallPercent").textContent =
        average + "%";


    // -------------------------
    // PROGRESS MESSAGE
    // -------------------------

    const overallText =
        document.getElementById("overallText");

    if (average === 0) {

        overallText.textContent =
            "Start studying and take your first quiz!";

    } else if (average < 50) {

        overallText.textContent =
            "Keep practicing. You can improve!";

    } else if (average < 80) {

        overallText.textContent =
            "Good progress! Keep learning!";

    } else {

        overallText.textContent =
            "Excellent work! Keep it up! 🎉";

    }


    // -------------------------
    // SUBJECT PROGRESS
    // -------------------------

    function updateSubject(subject) {

        const percent =
            Number(subjectProgress[subject]) || 0;


        const bar =
            document.getElementById(
                subject + "Progress"
            );


        const text =
            document.getElementById(
                subject + "Percent"
            );


        if (bar) {

            bar.style.width =
                Math.min(percent, 100) + "%";

        }


        if (text) {

            text.textContent =
                Math.min(percent, 100) + "%";

        }

    }


    updateSubject("math");
    updateSubject("science");
    updateSubject("english");
    updateSubject("history");


    // -------------------------
    // WEAK TOPICS
    // -------------------------

    const weakTopicsContainer =
        document.getElementById("weakTopics");


    if (weakTopics.length > 0) {

        weakTopicsContainer.innerHTML = "";


        weakTopics.forEach(topic => {

            const topicElement =
                document.createElement("div");


            topicElement.className =
                "weak-topic";


            topicElement.innerHTML = `
                <span>📚</span>
                <strong>${topic}</strong>
            `;


            weakTopicsContainer.appendChild(
                topicElement
            );

        });

    }
