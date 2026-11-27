// ======================================================
// NACHOAI TUTOR - COMPLETE FRONTEND
// ======================================================

const $ = id => document.getElementById(id);

let currentChatId = null;
let selectedFiles = [];
let sending = false;

// ======================================================
// THEME
// ======================================================

function loadTheme() {
    const saved = localStorage.getItem("nachoaiTheme");

    if (saved === "dark") {
        document.body.classList.add("dark");
        $("themeBtn").textContent = "☀️";
    } else {
        document.body.classList.remove("dark");
        $("themeBtn").textContent = "🌙";
    }
}

$("themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const dark = document.body.classList.contains("dark");

    localStorage.setItem(
        "nachoaiTheme",
        dark ? "dark" : "light"
    );

    $("themeBtn").textContent = dark ? "☀️" : "🌙";
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
    const language = $("language").value;

    localStorage.setItem("aitutorLanguage", language);

    const t = translations[language] || translations.en;

    $("messageInput").placeholder = t.placeholder;

    const welcome = $("welcome");

    if (welcome) {
        welcome.querySelector("h1").textContent = t.welcome;
        welcome.querySelector("p").textContent = t.description;
    }
}

const savedLanguage = localStorage.getItem("aitutorLanguage");

if (savedLanguage && ["en", "km", "fr"].includes(savedLanguage)) {
    $("language").value = savedLanguage;
}

$("language").addEventListener("change", updateLanguage);

updateLanguage();

// ======================================================
// CHAT HISTORY
// ======================================================

async function loadChatList() {
    try {
        const response = await fetch("/api/chats");

        if (!response.ok) return;

        const chats = await response.json();

        $("chatList").innerHTML = "";

        if (!Array.isArray(chats)) return;

        chats.forEach(chat => {
            const button = document.createElement("button");

            button.textContent = chat.title || "New chat";

            button.className =
                chat.id === currentChatId ? "active" : "";

            button.addEventListener("click", () => {
                openChat(chat.id);
            });

            $("chatList").appendChild(button);
        });

    } catch (error) {
        console.error("Chat history unavailable:", error);
    }
}

// ======================================================
// NEW CHAT
// ======================================================

$("newChat").addEventListener("click", async () => {
    try {
        const response = await fetch("/api/chats", {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error("Could not create a new chat.");
        }

        const chat = await response.json();

        currentChatId = chat.id;

        $("messages").innerHTML = "";

        createWelcome();

        $("messageInput").value = "";

        selectedFiles = [];
        $("fileInput").value = "";

        renderFiles();

        await loadChatList();

    } catch (error) {
        console.error(error);
        alert("Could not create a new chat. Please try again.");
    }
});

// ======================================================
// WELCOME SCREEN
// ======================================================

function createWelcome() {
    const language = $("language").value;

    const t = translations[language] || translations.en;

    $("messages").innerHTML = `
        <div class="welcome" id="welcome">
            <div class="nacho">🧀</div>
            <h1></h1>
            <p></p>
        </div>
    `;

    updateLanguage();
}

// ======================================================
// OPEN CHAT
// ======================================================

async function openChat(id) {
    try {
        const response = await fetch(`/api/chats/${id}`);

        if (!response.ok) {
            throw new Error("Could not load this chat.");
        }

        const chat = await response.json();

        currentChatId = chat.id;

        $("messages").innerHTML = "";

        if (!chat.messages || chat.messages.length === 0) {
            createWelcome();
            return;
        }

        chat.messages.forEach(message => {
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
        });

        await loadChatList();

        scrollBottom();

    } catch (error) {
        console.error(error);
    }
}

// ======================================================
// DISPLAY MESSAGE
// ======================================================

function addMessage(role, text, attachments = []) {
    const welcome = $("welcome");

    if (welcome) {
        welcome.remove();
    }

    const wrapper = document.createElement("div");
    wrapper.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";

    avatar.textContent = role === "user" ? "👤" : "🧀";

    const content = document.createElement("div");
    content.className = "message-content";

    content.textContent = text || "";

    // Display actual uploaded images.
    if (Array.isArray(attachments) && attachments.length > 0) {
        const container = document.createElement("div");

        container.className = "message-attachments";

        attachments.forEach(attachment => {
            const file = typeof attachment === "string"
                ? { name: attachment }
                : attachment;

            const name = file.name || "Attachment";

            if (
                typeof file.data === "string" &&
                file.data.startsWith("data:image/")
            ) {
                const image = document.createElement("img");

                image.className = "message-image";
                image.src = file.data;
                image.alt = name;
                image.loading = "lazy";

                image.addEventListener("click", () => {
                    window.open(file.data, "_blank");
                });

                container.appendChild(image);

                const imageName = document.createElement("div");
                imageName.className = "image-filename";
                imageName.textContent = name;

                container.appendChild(imageName);

            } else {
                const fileLabel = document.createElement("div");

                fileLabel.className = "attachment";

                fileLabel.textContent =
                    file.data && name.toLowerCase().endsWith(".pdf")
                        ? "📄 " + name
                        : "📎 " + name;

                container.appendChild(fileLabel);
            }
        });

        content.appendChild(container);
    }

    wrapper.appendChild(avatar);
    wrapper.appendChild(content);

    $("messages").appendChild(wrapper);

    return content;
}

// ======================================================
// ATTACHMENTS
// ======================================================

$("attachBtn").addEventListener("click", () => {
    $("fileInput").click();
});

$("fileInput").addEventListener("change", () => {
    const files = Array.from($("fileInput").files);

    if (files.length > 3) {
        alert("You can attach up to 3 files at a time.");
    }

    selectedFiles = files.slice(0, 3);

    renderFiles();
});

// ======================================================
// RENDER FILE PREVIEWS
// ======================================================

function renderFiles() {
    const preview = $("filePreview");

    // Remove old temporary image URLs.
    preview.querySelectorAll("img[data-object-url]").forEach(image => {
        URL.revokeObjectURL(image.src);
    });

    preview.innerHTML = "";

    if (!selectedFiles.length) {
        preview.style.display = "none";
        return;
    }

    preview.style.display = "flex";

    selectedFiles.forEach((file, index) => {
        const item = document.createElement("div");

        item.className = "file-item";

        // Show an actual image thumbnail.
        if (file.type.startsWith("image/")) {
            const image = document.createElement("img");

            image.className = "file-preview-image";
            image.src = URL.createObjectURL(file);
            image.dataset.objectUrl = "true";
            image.alt = file.name;

            item.appendChild(image);

            const name = document.createElement("span");

            name.className = "file-item-name";
            name.textContent = file.name;

            item.appendChild(name);

        } else {
            const name = document.createElement("span");

            name.className = "file-item-name";

            name.textContent =
                file.name.toLowerCase().endsWith(".pdf")
                    ? "📄 " + file.name
                    : "📎 " + file.name;

            item.appendChild(name);
        }

        // Remove button.
        const remove = document.createElement("button");

        remove.className = "remove-file";
        remove.textContent = "✕";
        remove.type = "button";
        remove.title = "Remove attachment";

        remove.addEventListener("click", () => {
            selectedFiles.splice(index, 1);

            $("fileInput").value = "";

            renderFiles();
        });

        item.appendChild(remove);

        preview.appendChild(item);
    });
}

// ======================================================
// CONVERT FILE TO DATA URL
// ======================================================

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = () => {
            reject(new Error(`Could not read ${file.name}.`));
        };

        reader.readAsDataURL(file);
    });
}

// ======================================================
// SUGGESTIONS
// ======================================================

document.querySelectorAll(".suggestion").forEach(button => {
    button.addEventListener("click", () => {
        $("messageInput").value = button.textContent.trim();

        $("messageInput").focus();
    });
});

// ======================================================
// TEXTAREA
// ======================================================

$("messageInput").addEventListener("input", () => {
    const input = $("messageInput");

    input.style.height = "44px";

    input.style.height =
        Math.min(input.scrollHeight, 150) + "px";
});

// ======================================================
// HANDLE STREAMED AI EVENTS
// ======================================================

function handleStreamEvent(eventText, messageElement) {
    const lines = eventText.split(/\r?\n/);

    const line = lines.find(line => line.startsWith("data:"));

    if (!line) return;

    try {
        const data = JSON.parse(line.slice(5).trim());

        if (data.type === "delta") {
            messageElement.textContent += data.text || "";

            scrollBottom();
        }

        if (data.type === "done") {
            currentChatId = data.chatId || currentChatId;

            loadChatList();
        }

        if (data.type === "error") {
            messageElement.textContent =
                data.error || "NachoAI could not respond.";
        }

    } catch (error) {
        console.error("Could not read AI response:", error);
    }
}

// ======================================================
// SEND MESSAGE
// ======================================================

$("composer").addEventListener("submit", async event => {
    event.preventDefault();

    if (sending) return;

    const text = $("messageInput").value.trim();

    if (!text && selectedFiles.length === 0) {
        return;
    }

    sending = true;

    $("sendBtn").disabled = true;

    try {
        // Convert selected files to data URLs.
        const attachments = [];

        for (const file of selectedFiles) {
            const data = await fileToDataURL(file);

            attachments.push({
                name: file.name,
                data: data
            });
        }

        // IMPORTANT:
        // Pass the actual attachment data to addMessage().
        // This lets the chat show the full uploaded image.
        addMessage(
            "user",
            text || "Please explain my attached file.",
            attachments
        );

        $("messageInput").value = "";
        $("messageInput").style.height = "44px";

        const typing = addMessage("assistant", "");

        typing.innerHTML = `
            <span class="typing">
                <span></span>
                <span></span>
                <span></span>
            </span>
        `;

        scrollBottom();

        const response = await fetch("/api/tutor", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                chatId: currentChatId,

                message: text,

                language: $("language").value,

                grade: $("grade").value,

                subject: $("subject").value,

                attachments: attachments
            })
        });

        // Handle ordinary HTTP errors.
        if (!response.ok) {
            let errorText = "NachoAI could not respond.";

            try {
                const errorData = await response.json();

                errorText = errorData.error || errorText;

            } catch (error) {
                console.error(error);
            }

            typing.textContent = errorText;

            return;
        }

        // Read streaming response from NachoAI.
        if (!response.body) {
            throw new Error("The server did not return a response stream.");
        }

        const reader = response.body.getReader();

        const decoder = new TextDecoder();

        let buffer = "";

        let gotResponse = false;

        while (true) {
            const { value, done } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, {
                stream: true
            });

            buffer = buffer.replace(/\r\n/g, "\n");

            const events = buffer.split("\n\n");

            buffer = events.pop() || "";

            for (const streamEvent of events) {
                if (!streamEvent.trim()) continue;

                if (streamEvent.includes('"type":"delta"')) {
                    gotResponse = true;

                    if (typing.querySelector(".typing")) {
                        typing.innerHTML = "";
                    }
                }

                if (streamEvent.includes('"type":"error"')) {
                    gotResponse = true;
                }

                handleStreamEvent(streamEvent, typing);
            }
        }

        // Process any final event left in the buffer.
        if (buffer.trim()) {
            handleStreamEvent(buffer, typing);
        }

        if (!typing.textContent.trim()) {
            typing.textContent =
                "NachoAI did not return an answer. Please try again.";
        }

        scrollBottom();

    } catch (error) {
        console.error("NachoAI connection error:", error);

        addMessage(
            "assistant",
            "❌ Could not connect to NachoAI. Please check your internet connection and try again."
        );

    } finally {
        selectedFiles = [];

        $("fileInput").value = "";

        renderFiles();

        sending = false;

        $("sendBtn").disabled = false;

        $("messageInput").focus();

        scrollBottom();
    }
});

// ======================================================
// SCROLL
// ======================================================

function scrollBottom() {
    const messages = $("messages");

    messages.scrollTop = messages.scrollHeight;
}

// ======================================================
// ENTER TO SEND
// ======================================================

$("messageInput").addEventListener("keydown", event => {
    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {
        event.preventDefault();

        $("composer").requestSubmit();
    }
});

// ======================================================
// START
// ======================================================

loadTheme();

loadChatList();
