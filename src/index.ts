import { AI } from "./ai";

document.addEventListener("DOMContentLoaded", () => {
    initUi();
    setup();
});

function initUi(){
    const txtPrompt = document.getElementById("txtPrompt") as HTMLTextAreaElement;
    txtPrompt.addEventListener("keyup", (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
            runPrompt();
        }
    });
}


async function setup(){
    console.log("Hello World");
}

async function runPrompt(): Promise<void>{
    const txtPrompt = document.getElementById("txtPrompt") as HTMLTextAreaElement;
    let prompt = txtPrompt.value;
    txtPrompt.value = "";
    addChat(prompt, "user");
    let bubble = addAiChatPlacehodler();
    let response = await AI.SimpleStreamPrompt(prompt, (reply) => {
        bubble.innerText = reply;
    });
    bubble.innerText = response;
}

function addAiChatPlacehodler(): HTMLParagraphElement{
    return addChat("...", "ai");
}

function addChat(message: string, role: string): HTMLParagraphElement {
    const divResponse = document.getElementById("response") as HTMLDivElement;
    let addition = document.createElement("p");
    addition.classList.add(role, "bubble");
    addition.innerText = message;
    divResponse.appendChild(addition);
    return addition;
}