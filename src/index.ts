import { AI } from "./ai";

document.addEventListener("DOMContentLoaded", () => {
    initUi();
    setup();
});

function initUi(){
    const txtPrompt = document.getElementById("txtPrompt") as HTMLTextAreaElement;
    txtPrompt.addEventListener("keyup", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            runPrompt();
        }
    });
}


async function setup(){
    await AI.Setup();
    console.log("Hello World");
}


async function runPrompt(): Promise<void>{
    const txtPrompt = document.getElementById("txtPrompt") as HTMLTextAreaElement;
    let prompt = txtPrompt.value;
    txtPrompt.value = "";
    addChat(prompt, "user");
    let response = await AI.SimplePrompt(prompt);
    addChat(response, "ai");
}

function addChat(message: string, role: string){
    const divResponse = document.getElementById("response") as HTMLDivElement;
    let addition = document.createElement("p");
    addition.classList.add(role);
    addition.innerText = message;
    divResponse.appendChild(addition);
}