import { AIManager } from "./ai";
import { util } from "./util";

export class MimiMonitor extends HTMLElement {
    static _tmplt = mkTmplt(`
        <div class="aiContainer">
            <circle-progress class="aiProgress"></circle-progress>
            <div class="aiDot"></div>
            <div class="divQueue"></div>
        </div>
        <style>
            .aiContainer{
                position: relative;
                width: 64px;
                height: 64px;
            }
            .aiDot{
                position: absolute;
                top: 50%;
                left: 50%;
                margin-top: -20px;
                margin-left: -20px;
                border-radius: 25px;
                border: 20px outset rgb(154, 165, 174);
                transform-origin: 50% 50%;
                transform: rotateZ(0deg) translateZ(-25px);
                background-color: transparent;
            }
            .aiDot.loading {
                border: 20px outset rgb(154, 68, 235);
                animation: animActive 2s cubic-bezier(.49,.06,.43,.85) infinite;
            }
            .aiDot.ready {
                border: 20px outset rgb(79, 96, 164);
            }
            .aiDot.active {
                border: 20px outset rgb(227, 144, 43);
                animation: animActive 2s cubic-bezier(.49,.06,.43,.85) infinite;
            }
            .divQueue{
                position: absolute;
                bottom: 0;
                right: 0;
            }
            @keyframes animActive {
                0% {
                    transform: rotateZ(0deg) translateZ(-25px);
                }

                50% {
                    transform: rotateZ(50deg) translateZ(0px);
                }

                100% {
                    transform: rotateZ(0deg) translateZ(-25px);
                }
            }
        </style>
    `);
    __aiDot: HTMLDivElement;
    __ctlProgress: CircleProgress;
    constructor(){
        super();
        const shadow = this.attachShadow({mode: "open"});
        shadow.append(MimiMonitor._tmplt.content.cloneNode(true));
    }
    
    connectedCallback(){
        this.__aiDot = this.shadowRoot.querySelector(".aiDot");
        this.__ctlProgress = this.shadowRoot.querySelector(".aiProgress");
    }
    attributeChangedCallback(name, oldValue, newValue){
    }

    public Update(ai: AIManager){
        util.ToggleClassIf(this.__aiDot, "loading", ai.isLoading);
        util.ToggleClassIf(this.__aiDot, "ready", ai.isReady && !ai.isRunning);
        util.ToggleClassIf(this.__aiDot, "active", ai.isRunning);
        console.log(ai.loadPercentage);
        this.__ctlProgress.setAttribute("progress", `${ai.loadPercentage * 100}`);
    }
}

class CircleProgress extends HTMLElement {
    static _tmplt = mkTmplt(`
        <div class="cirProgress"></div>
        <style>
            .cirProgress{
                position: absolute;
                width: 44px;
                height: 44px;
                left: 50%;
                top: 50%;
                margin-left: -22px;
                margin-top: -22px;
                border-radius: 50%;
                background: conic-gradient(rgb(36, 36, 36) 0%,rgb(36, 36, 36) var(--progress, 0%), #e0e0e0 var(--progress, 0%), #e0e0e0 100%);
                display: flex;
                align-items: center;
                justify-content: center;
            }
        </style>
    `);
    constructor(){
        super();
        const shadow = this.attachShadow({mode: "open"});
        shadow.append(CircleProgress._tmplt.content.cloneNode(true));
    }
    
    connectedCallback(){
    }
    
    static get observedAttributes() {
        return ['progress'];
    }
    attributeChangedCallback(name, oldValue, newValue){
        console.log(name, oldValue, newValue);
        if(name === "progress"){
            let circle = this.shadowRoot.querySelector(".cirProgress") as HTMLDivElement;
            circle.style.setProperty('--progress', `${newValue}%`); // 0-100
        }
    }
}

function mkTmplt(innerHtml): HTMLTemplateElement{
    var tmplt = document.createElement("template");
    tmplt.innerHTML = innerHtml;
    return tmplt;
}

customElements.define("mimi-monitor", MimiMonitor);
customElements.define("circle-progress", CircleProgress);