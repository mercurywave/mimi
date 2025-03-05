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
            <div class="bubbleWrap">
                <textarea class="bubble" rows="1"></textarea>
            </div>
            <button class="btStop nodisp" role="button">Stop</button>
        </div>
        <style>
            .bubbleWrap{
                width: 100%;
                margin: 6px 4px;
                display: grid;
            }
            .bubbleWrap::after{
                padding: 8px;
                content: attr(data-replicated-value) " ";
                white-space: pre-wrap;
                visibility: hidden;
            }
            .bubbleWrap > textarea,
            .bubbleWrap::after {
                font: inherit;

                /* Place on top of each other */
                grid-area: 1 / 1 / 2 / 2;
            }
            .bubble {
                padding: 8px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                border-radius: 11px;
                border: 0;
                outline: 1px solid #FEE0E0;
                border-radius: 11px;
                box-shadow: 0;
                resize: none;
                overflow: hidden;
            }
            .bubble:focus{
                outline: 1px solid #D33A2C;
                background-color: #fff !important;
                color: #000  !important;
            }

            .user {
                width: 80%;
                float: right;
            }
            
            .user .bubble {
                background-color: #521611;
                color: #FFFFFF;
            }

            .ai {
                width: 80%;
                float: left;
            }

            .ai .bubble {
                background-color: #FFE7E7;
            }
            
            .btStop{
                float: left;
                margin: 6px 4px;
                padding: 4px 8px;
                border-radius: 11px;
            }
            .nodisp{ display: none; }
        </style>
    `);


    __panel: ChatPanel;
    __message: Message;
    __bubble: HTMLTextAreaElement;
    __btStop: HTMLButtonElement;
    __wrap: HTMLDivElement;
    constructor(chat: ChatPanel, message: Message){
        super();
        this.__panel = chat;
        this.__message = message;
        const shadow = this.attachShadow({mode: "open"});
        shadow.append(ChatMessage._tmplt.content.cloneNode(true));
    }
    
    connectedCallback(){
        this.__bubble = this.shadowRoot.querySelector(".bubble");
        this.__btStop = this.shadowRoot.querySelector(".btStop");
        this.__wrap = this.shadowRoot.querySelector(".bubbleWrap") as any;
        this.__wrap.classList.add(ChatMessage.getClass(this.__message));
        this.__bubble.value = this.__message.text;
        this.__bubble.addEventListener("input", () => {
            // this is a clever hack to fill the wrapper to the same size
            // this makes the textarea expand to fill available space
            this.__wrap.dataset.replicatedValue = this.__bubble.value;
        });
        this.__wrap.dataset.replicatedValue = this.__bubble.value;
        this.update();
    }
    attributeChangedCallback(name, oldValue, newValue){
    }

    static getClass(message: Message): string{
        return message.type;
    }

    update(){
        const isPending = this.__message.isPending;
        const type = this.__message.type;
        util.ToggleClassIf(this.__btStop, "nodisp", type != con.msg.typeAi || !isPending);
    }
}

customElements.define("chat-panel", ChatPanel);
customElements.define("chat-message", ChatMessage);