import { CreateMLCEngine, MLCEngine } from "../node_modules/@mlc-ai/web-llm/lib/index";
import { MimiMonitor } from "./mimi";


export class AIManager {
    _engine: MLCEngine | null = null;
    _loadPercentage: number | null = null; // 0-1
    _monitor: MimiMonitor;
    _isRunning: boolean = false;
    public get isLoading(): boolean { return this._loadPercentage != null && !this.isReady; }
    public get isReady(): boolean { return this._loadPercentage >= 1; }
    public get isRunning(): boolean { return this._isRunning; }
    public get loadPercentage(): number {
         return this._loadPercentage == null ? 0 : Math.max(this._loadPercentage, .05); 
    }

    public async Setup(): Promise<void>{
        if(this.isReady) return;
        this._monitor = document.querySelector("#mimiMonitor") as MimiMonitor;
        this._loadPercentage = 0;
        this._engine = await CreateMLCEngine('Llama-3.2-3B-Instruct-q4f32_1-MLC', {
            // TODO: this is the main pre-load. this needs to not run on load all the time
            initProgressCallback: ({progress}) => {
                this._loadPercentage = progress;
                this.SignalEvent();
                console.log(`Load Progress: ${progress * 100}`)
            },
            
        });
    }
    public async SimplePrompt(prompt:string) {
        await this.Setup();
        this._isRunning = true; // TODO: this is obviously naive
        this.SignalEvent();
        const reply = await this._engine.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful AI assistant." },
                { role: "user", content: prompt }
            ],
        });
        console.log(reply.usage);
        console.log(reply.choices[0].message);
        this._isRunning = false;
        this.SignalEvent();
        return reply.choices[0].message.content;
    }
    SignalEvent() {
        this._monitor.Update(this);
    }
}
export var AI: AIManager = new AIManager();