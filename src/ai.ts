import { CreateMLCEngine, MLCEngine } from "../node_modules/@mlc-ai/web-llm/lib/index";


export class AIManager {
    _engine: MLCEngine;
    public get isActive(): boolean { return this._engine != null; }
    public async Setup(): Promise<void>{
        if(this.isActive) return;
        this._engine = await CreateMLCEngine('Llama-3.2-3B-Instruct-q4f32_1-MLC', {
            // TODO: this is the main pre-load. this needs to not run on load all the time
            initProgressCallback: ({progress}) =>  console.log(`Load Progress: ${progress * 100}`)
        });
    }
    public async SimplePrompt(prompt:string) {
        await this.Setup();
        const reply = await this._engine.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful AI assistant." },
                { role: "user", content: prompt }
            ],
        });
        console.log(reply.usage);
        console.log(reply.choices[0].message);
        return reply.choices[0].message.content;
    }
}
export var AI: AIManager = new AIManager();