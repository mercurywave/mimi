import { Chat, DB, Message } from "./db";
import { con, util } from "./util";

export class ChatPanel extends HTMLElement {
    static _tmplt = util.mkTmplt(/* html */`
        <div class="chatPanel">
        </div>
        <style>
            .chatPanel{
                width: 100%;
            }
        </style>
    `);

    
    __chat: Chat;
    __panel: HTMLDivElement;
    constructor(chat: Chat){
        super();
        this.__chat = chat;
        const shadow = this.attachShadow({mode: "open"});
        shadow.append(ChatPanel._tmplt.content.cloneNode(true));
    }
    
    connectedCallback(){
        this.__panel = this.shadowRoot.querySelector(".chatPanel");
        for (const message of this.__chat.messages) {
            let bubble = new ChatMessage(this, message);
            this.__panel.appendChild(bubble);
        }
    }
    attributeChangedCallback(name, oldValue, newValue){
    }

    public AddMessage(type: string, text?: string){
        let msg = DB.CreateMessage(type, text);
        this.__chat.messages.push(msg);
        this.__panel.appendChild(new ChatMessage(this, msg));
    }
}



export class ChatMessage extends HTMLElement {
    static _tmplt = util.mkTmplt(/* html */`
        <div class="container">
            <p class="bubble"></p>
            <button class="btStop nodisp" role="button">
        </div>
        <style>
            .bubble {
                width: 80%;
                margin: 6px 4px;
                padding: 8px;
                border-radius: 11px;
            }

            .user {
                background-color: #521611;
                color: #FFFFFF;
                float: right;
            }

            .ai {
                background-color: #FFE7E7;
                float: left;
            }
            .nodisp{ display: none; }
        </style>
    `);


    __panel: ChatPanel;
    __message: Message;
    __bubble: HTMLParagraphElement;
    constructor(chat: ChatPanel, message: Message){
        super();
        this.__panel = chat;
        this.__message = message;
        const shadow = this.attachShadow({mode: "open"});
        shadow.append(ChatMessage._tmplt.content.cloneNode(true));
    }
    
    connectedCallback(){
        this.__bubble = this.shadowRoot.querySelector(".bubble");
        this.__bubble.innerText = this.__message.text;
        this.__bubble.classList.add(ChatMessage.getClass(this.__message));
    }
    attributeChangedCallback(name, oldValue, newValue){
    }

    static getClass(message: Message): string{
        return message.type;
    }
}

customElements.define("chat-panel", ChatPanel);
customElements.define("chat-message", ChatMessage);