import { AI, SimpleAgent } from "./ai";

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
    const divResponse = document.getElementById("response") as HTMLDivElement;
    let prompt = txtPrompt.value;
    txtPrompt.value = "";
    addChat(prompt, "user");
    let bubble = addAiChatPlacehodler();
    let stop = addStopButton();
    divResponse.appendChild(stop);
    let job = AI.Queue(prompt, new SimpleAgent((reply) => {
        bubble.innerText = reply;
    }));
    stop.addEventListener("click", () => { job.Cancel(); });
    try{
        bubble.innerText = await job.onComplete;
    } catch(e) { }
    divResponse.removeChild(stop);
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

function addStopButton(): HTMLButtonElement{
    let bt = document.createElement("button");
    bt.classList.add("btStop");
    bt.role = "button";
    bt.innerText = "Stop";
    return bt;
}