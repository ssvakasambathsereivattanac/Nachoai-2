function addMessage(role, text, attachments = []) {
    const welcome = $("welcome");
    if (welcome) welcome.remove();

    const wrapper = document.createElement("div");
    wrapper.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = role === "user" ? "👤" : "🧀";

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = text || "";

    if (attachments.length) {
        const container = document.createElement("div");
        container.className = "message-attachments";

        attachments.forEach(attachment => {
            const file = typeof attachment === "string"
                ? { name: attachment }
                : attachment;

            if (file.data && file.data.startsWith("data:image/")) {
                const image = document.createElement("img");

                image.className = "message-image";
                image.src = file.data;
                image.alt = file.name || "Uploaded image";
                image.loading = "lazy";

                container.appendChild(image);
            } else {
                const label = document.createElement("div");
                label.className = "attachment";

                label.textContent = file.name
                    ? "📎 " + file.name
                    : "📎 Attachment";

                container.appendChild(label);
            }
        });

        content.appendChild(container);
    }

    wrapper.appendChild(avatar);
    wrapper.appendChild(content);

    $("messages").appendChild(wrapper);

    return content;
}
