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
    let activeChat = DB.CreateChat(con.cht.typeNote);
    _activePanel = new ChatPanel(activeChat);
    const divChat = document.getElementById("chatContainer") as HTMLDivElement;
    divChat.appendChild(_activePanel);
    _activePanel.AddMessage(con.msg.typeAi, "Hello! What can I help you with today?");
    _activePanel.AddMessage(con.msg.typeUser, "say 'hello'", true).focusOnText();
}


async function setup(){
    await DB.Init();
    console.log("Hello World");
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