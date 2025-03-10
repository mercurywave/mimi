import { ChatCompletionMessageParam } from "../node_modules/@mlc-ai/web-llm/lib/index";
import { Agent, AI, ePriority, SimpleAgent } from "./ai";
import { ChatPanel } from "./chat panel";
import { ChatPreview } from "./chat preview";
import { Chat, DB, Message } from "./db";
import { con } from "./util";

document.addEventListener("DOMContentLoaded", () => {
    initUi();
    setup();
});

let _activePanel: ChatPanel | null = null;
let _previewPane: HTMLDivElement | null = null;

function initUi(){
    setupButton("btJournal", con.cht.templateJournal);
    setupButton("btNote", con.cht.templateNote);
    setupButton("btChat", con.cht.templateChat);
    _previewPane = document.querySelector("#previews");

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
    addChatPreview(activeChat);
    switchToChat(activeChat);
}

function switchToChat(chat: Chat){
    if(_activePanel != null){
        let prev = _activePanel.chat;
        if(prev.summary == ""){
            queueSummary(_activePanel.chat);
        }
    }
    _activePanel = new ChatPanel(chat);
    const divChat = document.getElementById("chatContainer") as HTMLDivElement;
    divChat.innerHTML = '';
    divChat.appendChild(_activePanel);
    for(const card of document.querySelectorAll("chat-preview") as NodeListOf<ChatPreview>){
        card.CheckSelectFromChat(chat);
    }
    updateHistory();
}

async function queueSummary(chat: Chat): Promise<void>{
    if(!chat.messages.find(m => m.text.length > 10)) { return; }
    let runner = AI.QueueUniqueJob(chat, new SummaryAgent(), chat, "summary");
    try{
        let result = await runner.onComplete;
        console.log(result);
        chat.summary = result;
        updateHistory();
    } catch(e){}
}

function addChatPreview(chat: Chat){
    let card = new ChatPreview(chat);
    _previewPane.appendChild(card);
    card.addEventListener("click", () => {
        switchToChat(chat);
    });
}

function updateHistory(){
    for(const card of document.querySelectorAll("chat-preview") as NodeListOf<ChatPreview>){
        card.update();
    }
}



export class ChatAgent extends Agent{
    __persona : string;
    constructor(persona: string, onStream: (reply: string) => void){
        super();
        this.__persona = persona;
        this.onStream = onStream;
    }
    public GetBasePrompt(): string[] { return [] };
    public async Setup(input: any): Promise<string> {
        return "";
    }
    public async Process(obj: Chat, input: string): Promise<any> {
        let messages: ChatCompletionMessageParam[] = [
            { 
                role: "system",
                content: this.__persona
            }
        ];
        for (const msg of obj.messages) {
            if(!msg.isPending)
                messages.push({
                    role: (msg.type == con.msg.typeAi || msg.type == con.msg.typePrompt)
                        ? "assistant" : "user",
                    content: msg.text,
                });
        }
        console.log(messages);
        return await AI.StreamMessages(messages, this.onStream);
    }
    public async Complete(aiResponse: string): Promise<any> {
        return aiResponse;
    }
}

export class SummaryAgent extends Agent{
    __persona : string;
    public priority: ePriority = ePriority.Low;
    constructor(){
        super();
    }
    public GetBasePrompt(): string[] { return [] };
    public async Setup(input: any): Promise<string> {
        return "";
    }
    public async Process(obj: Chat, input: string): Promise<any> {
        let messages: string[] = [];
        for (const msg of obj.messages) {
            if(!msg.isPending){
                let role = (msg.type == con.msg.typeAi || msg.type != con.msg.typePrompt)
                ? "assistant" : "user";   
                messages.push(`${role}: ${msg.text}`);
            }
        }
        console.log(messages);
        let persona = `You are a professional therapist.`;
        let prompt = `Summarize the following conversation in one sentence:`;
        let consolidate: ChatCompletionMessageParam 
            = { role: "user", content: messages.join("\n") };
        let result = await AI.RunChat(persona, [prompt], [consolidate]);
        console.log(result);
        return result;
    }
    public async Complete(aiResponse: string): Promise<any> {
        return aiResponse;
    }
}