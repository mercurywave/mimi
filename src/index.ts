import { ChatCompletionMessageParam } from "../node_modules/@mlc-ai/web-llm/lib/index";
import { Agent, AI, SimpleAgent } from "./ai";
import { ChatPanel } from "./chat panel";
import { Chat, DB, Message } from "./db";
import { con } from "./util";

document.addEventListener("DOMContentLoaded", () => {
    initUi();
    setup();
});

let _activePanel: ChatPanel | null = null;

function initUi(){
    setupButton("btJournal", con.cht.templateJournal);
    setupButton("btNote", con.cht.templateNote);
    setupButton("btChat", con.cht.templateChat);

    addChat(con.cht.templateNote);
}

function setupButton(id: string, template: string){
    let bt = document.querySelector(`#${id}`);
    bt.addEventListener("click", () => {
        addChat(template);
    })
}

async function setup(){
    await DB.Init();
    console.log("Hello World");
}

function addChat(template: string){
    let activeChat = DB.CreateChat(template);
    _activePanel = new ChatPanel(activeChat);
    const divChat = document.getElementById("chatContainer") as HTMLDivElement;
    divChat.innerHTML = '';
    divChat.appendChild(_activePanel);
}



export class ChatAgent extends Agent{
    __persona : string;
    constructor(persona: string, onStream: (reply: string) => void){
        super();
        this.__persona = persona;
        this.onStream = onStream;
    }
    public GetBasePrompt(): string[] { return [] };
    public async Setup(input: string): Promise<string> {
        return input;
    }
    public async Process(obj: Chat, input: string): Promise<string> {
        let messages: ChatCompletionMessageParam[] = [
            { 
                role: "system",
                content: this.__persona
            }
        ];
        for (const msg of obj.messages) {
            if(!msg.isPending)
                messages.push({
                    role: (msg.type == con.msg.typeAi) ? "assistant" : "user",
                    content: msg.text,
                });
        }   
        console.log(messages);
        return await AI.StreamMessages(messages, this.onStream);
    }
    public async Complete(aiResponse: string): Promise<string> {
        return aiResponse;
    }
}