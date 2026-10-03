const $ = id => document.getElementById(id);

let currentChatId = null;
let selectedFiles = [];
let sending = false;


// ======================================================
// THEME
// ======================================================

function loadTheme() {

    const saved =
        localStorage.getItem("nachoaiTheme");

    if (saved === "dark") {

        document.body.classList.add("dark");

        $("themeBtn").textContent = "☀️";

    } else {

        $("themeBtn").textContent = "🌙";
    }
}


$("themeBtn").addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "nachoaiTheme",
        dark ? "dark" : "light"
    );

    $("themeBtn").textContent =
        dark ? "☀️" : "🌙";
});


// ======================================================
// LANGUAGE
// ======================================================

const translations = {

    en: {
        placeholder: "Ask NachoAI anything...",
        welcome: "What do you want to learn?",
        description:
            "I'm NachoAI. Ask me anything about your subject, send your notes, or attach a worksheet and I'll help you understand it."
    },

    km: {
        placeholder: "សួរ NachoAI អ្វីក៏បាន...",
        welcome: "តើអ្នកចង់រៀនអ្វី?",
        description:
            "ខ្ញុំគឺ NachoAI។ សួរខ្ញុំអំពីមុខវិជ្ជារបស់អ្នក ឬភ្ជាប់ឯកសារ ហើយខ្ញុំនឹងជួយអ្នកយល់។"
    },

    fr: {
        placeholder: "Posez une question à NachoAI...",
        welcome: "Qu'aimeriez-vous apprendre ?",
        description:
            "Je suis NachoAI. Posez-moi une question ou joignez un document et je vous aiderai à le comprendre."
    }

};


function updateLanguage() {

    const language =
        $("language").value;

    localStorage.setItem(
        "aitutorLanguage",
        language
    );

    const t =
        translations[language] ||
        translations.en;

    $("messageInput").placeholder =
        t.placeholder;

    $("welcome").querySelector("h1").textContent =
        t.welcome;

    $("welcome").querySelector("p").textContent =
        t.description;
}


const savedLanguage =
    localStorage.getItem("aitutorLanguage");

if (
    savedLanguage &&
    ["en", "km", "fr"].includes(savedLanguage)
) {

    $("language").value =
        savedLanguage;
}

$("language").addEventListener(
    "change",
    updateLanguage
);

updateLanguage();


// ======================================================
// CHAT HISTORY
// ======================================================

async function loadChatList() {

    try {

        const response =
            await fetch("/api/chats");

        if (!response.ok) return;

        const chats =
            await response.json();

        $("chatList").innerHTML = "";

        chats.forEach(chat => {

            const button =
                document.createElement("button");

            button.textContent =
                chat.title || "New chat";

            button.addEventListener(
                "click",
                () => openChat(chat.id)
            );

            $("chatList").appendChild(button);

        });

    } catch (error) {

        console.log(
            "Chat history unavailable:",
            error.message
        );
    }
}


// ======================================================
// NEW CHAT
// ======================================================

$("newChat").addEventListener(
    "click",
    async () => {

        try {

            const response =
                await fetch(
                    "/api/chats",
                    {
                        method: "POST"
                    }
                );

            const chat =
                await response.json();

            currentChatId =
                chat.id;

            $("messages").innerHTML = "";

            createWelcome();

            await loadChatList();

        } catch (error) {

            console.error(error);
        }
    }
);


function createWelcome() {

    const language =
        $("language").value;

    const t =
        translations[language] ||
        translations.en;

    $("messages").innerHTML = `

        <div class="welcome" id="welcome">

            <div class="nacho">🧀</div>

            <h1>${t.welcome}</h1>

            <p>${t.description}</p>

        </div>
    `;
}


// ======================================================
// OPEN CHAT
// ======================================================

async function openChat(id) {

    try {

        const response =
            await fetch(
                `/api/chats/${id}`
            );

        if (!response.ok) return;

        const chat =
            await response.json();

        currentChatId =
            chat.id;

        $("messages").innerHTML = "";

        if (
            !chat.messages ||
            chat.messages.length === 0
        ) {

            createWelcome();

            return;
        }

        chat.messages.forEach(
            message => {

                if (
                    message.role === "user" ||
                    message.role === "assistant"
                ) {

                    addMessage(
                        message.role,
                        message.content,
                        message.attachments || []
                    );
                }
            }
        );

        scrollBottom();

    } catch (error) {

        console.error(error);
    }
}


// ======================================================
// DISPLAY MESSAGE
// ======================================================

function addMessage(
    role,
    text,
    attachments = []
) {

    const welcome =
        $("welcome");

    if (welcome) {
        welcome.remove();
    }

    const wrapper =
        document.createElement("div");

    wrapper.className =
        `message ${role}`;


    const avatar =
        document.createElement("div");

    avatar.className =
        "avatar";

    avatar.textContent =
        role === "user"
            ? "👤"
            : "🧀";


    const content =
        document.createElement("div");

    content.className =
        "message-content";

    content.textContent =
        text || "";


    if (attachments.length) {

        attachments.forEach(
            name => {

                const file =
                    document.createElement("div");

                file.className =
                    "attachment";

                file.textContent =
                    "📎 " + name;

                content.appendChild(file);
            }
        );
    }


    wrapper.appendChild(avatar);
    wrapper.appendChild(content);

    $("messages").appendChild(wrapper);

    return content;
}


// ======================================================
// ATTACHMENTS
// ======================================================

$("attachBtn").addEventListener(
    "click",
    () => $("fileInput").click()
);


$("fileInput").addEventListener(
    "change",
    () => {

        selectedFiles =
            Array.from(
                $("fileInput").files
            ).slice(0, 3);

        renderFiles();
    }
);


function renderFiles() {

    const preview =
        $("filePreview");

    preview.innerHTML = "";

    if (!selectedFiles.length) {

        preview.style.display =
            "none";

        return;
    }

    preview.style.display =
        "flex";


    selectedFiles.forEach(
        (file, index) => {

            const item =
                document.createElement("div");

            item.className =
                "file-item";

            item.textContent =
                "📎 " + file.name;


            const remove =
                document.createElement("button");

            remove.className =
                "remove-file";

            remove.textContent =
                "✕";

            remove.addEventListener(
                "click",
                () => {

                    selectedFiles.splice(
                        index,
                        1
                    );

                    renderFiles();
                }
            );


            item.appendChild(remove);

            preview.appendChild(item);
        }
    );
}


function fileToDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload =
                () => resolve(reader.result);

            reader.onerror =
                () =>
                    reject(
                        new Error(
                            "Could not read file."
                        )
                    );

            reader.readAsDataURL(file);
        }
    );
}


// ======================================================
// SUGGESTIONS
// ======================================================

document
    .querySelectorAll(".suggestion")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                $("messageInput").value =
                    button.textContent.trim();

                $("messageInput").focus();
            }
        );

    });


// ======================================================
// TEXTAREA
// ======================================================

$("messageInput").addEventListener(
    "input",
    () => {

        const input =
            $("messageInput");

        input.style.height =
            "44px";

        input.style.height =
            Math.min(
                input.scrollHeight,
                150
            ) + "px";
    }
);


// ======================================================
// SEND MESSAGE
// ======================================================

$("composer").addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (sending) return;

        const text =
            $("messageInput")
                .value
                .trim();

        if (
            !text &&
            selectedFiles.length === 0
        ) {
            return;
        }

        sending = true;

        $("sendBtn").disabled =
            true;


        try {

            const attachments = [];

            for (
                const file of selectedFiles
            ) {

                const data =
                    await fileToDataURL(file);

                attachments.push({

                    name:
                        file.name,

                    data:
                        data
                });
            }


            addMessage(
                "user",
                text ||
                "Please explain my attached file.",
                selectedFiles.map(
                    file => file.name
                )
            );


            $("messageInput").value = "";

            $("messageInput").style.height =
                "44px";


            const typing =
                addMessage(
                    "assistant",
                    ""
                );


            typing.innerHTML = `

                <span class="typing">

                    <span></span>
                    <span></span>
                    <span></span>

                </span>
            `;


            scrollBottom();


            const response =
                await fetch(
                    "/api/tutor",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                chatId:
                                    currentChatId,

                                message:
                                    text,

                                language:
                                    $("language").value,

                                grade:
                                    $("grade").value,

                                subject:
                                    $("subject").value,

                                attachments:
                                    attachments
                            })
                    }
                );


            if (!response.ok) {

                let errorText =
                    "NachoAI could not respond.";

                try {

                    const errorData =
                        await response.json();

                    errorText =
                        errorData.error ||
                        errorText;

                } catch {}

                typing.textContent =
                    errorText;

                return;
            }


            const reader =
                response.body.getReader();

            const decoder =
                new TextDecoder();

            let buffer = "";

            let answerStarted =
                false;


            while (true) {

                const {
                    value,
                    done
                } =
                    await reader.read();

                if (done) break;

                buffer +=
                    decoder.decode(
                        value,
                        {
                            stream: true
                        }
                    );


                const events =
                    buffer.split("\n\n");

                buffer =
                    events.pop() || "";


                for (
                    const event of events
                ) {

                    const line =
                        event
                            .split("\n")
                            .find(
                                line =>
                                    line.startsWith(
                                        "data:"
                                    )
                            );

                    if (!line) continue;


                    try {

                        const data =
                            JSON.parse(
                                line.slice(5).trim()
                            );


                        if (
                            data.type ===
                            "delta"
                        ) {

                            if (
                                !answerStarted
                            ) {

                                typing.innerHTML =
                                    "";

                                answerStarted =
                                    true;
                            }

                            typing.textContent +=
                                data.text;

                            scrollBottom();
                        }


                        if (
                            data.type ===
                            "done"
                        ) {

                            currentChatId =
                                data.chatId;

                            loadChatList();
                        }


                        if (
                            data.type ===
                            "error"
                        ) {

                            typing.textContent =
                                data.error;
                        }

                    } catch (
                        parseError
                    ) {

                        console.log(
                            parseError
                        );
                    }
                }
            }

        } catch (error) {

            console.error(error);

            const errorMessage =
                addMessage(
                    "assistant",
                    "❌ Could not connect to NachoAI. Make sure the server is running."
                );

        } finally {

            selectedFiles = [];

            $("fileInput").value = "";

            renderFiles();

            sending = false;

            $("sendBtn").disabled =
                false;

            $("messageInput").focus();
        }

    }
);


// ======================================================
// SCROLL
// ======================================================

function scrollBottom() {

    $("messages").scrollTop =
        $("messages").scrollHeight;
}


// ======================================================
// ENTER TO SEND
// ======================================================

$("messageInput").addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            $("composer").requestSubmit();
        }
    }
);


// ======================================================
// START
// ======================================================

loadTheme();

loadChatList();
