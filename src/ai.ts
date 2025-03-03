import { ChatCompletionMessageParam, CreateMLCEngine, MLCEngine } from "../node_modules/@mlc-ai/web-llm/lib/index";
import { ChatCompletionNonStreamingParams } from "../node_modules/@mlc-ai/web-llm/lib/message";
import { MimiMonitor } from "./mimi";
import { Deferred } from "./util";


export class AIManager {
    _engine: MLCEngine | null = null;
    _loadPercentage: number | null = null; // 0-1
    _monitor: MimiMonitor;
    _isRunning: boolean = false;
    _manager: AgentManager = new AgentManager();
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
    public async SimplePrompt(prompt:string): Promise<string> {
        var runner = this._manager.AddAgent(new SimpleAgent(), prompt);
        return await runner.onComplete;
    }

    public async SimpleStreamPrompt(prompt: string, streamer: (reply:string) => void): Promise<string>{
        var agent = new SimpleAgent();
        agent.onStream = streamer;
        var runner = this._manager.AddAgent(agent, prompt);
        return await runner.onComplete;
    }

    public async RunPrompt(persona: string, prompts: string[], data: string[]): Promise<string>{
        await this.Setup();
        this._isRunning = true;
        this.SignalEvent();

        let messages: ChatCompletionMessageParam[] = [{ role: "system", content: persona }];
        for (const line of prompts) {
            messages.push({ role: "system", content: line })
        }
        for (const line of data) {
            messages.push({ role: "user", content: line })
        }

        const reply = await this._engine.chat.completions.create({
            messages: messages,
        });

        console.log(reply.choices[0].message);
        this._isRunning = false;
        this.SignalEvent();
        return reply.choices[0].message.content;
    }

    public async StreamPrompt(persona: string, prompts: string[], data: string[], streamer: (reply:string) => void ): Promise<string>{
        await this.Setup();
        this._isRunning = true;
        this.SignalEvent();

        let messages: ChatCompletionMessageParam[] = [{ role: "system", content: persona }];
        for (const line of prompts) {
            messages.push({ role: "system", content: line })
        }
        for (const line of data) {
            messages.push({ role: "user", content: line })
        }

        const chunks = await this._engine.chat.completions.create({
            messages: messages,
            stream: true,
        });
        let reply = "";
        for await (const chunk of chunks) {
            reply += chunk.choices[0]?.delta.content || "";
            streamer(reply);
        }

        console.log(reply);
        this._isRunning = false;
        this.SignalEvent();
        return reply;
    }

    SignalEvent() {
        this._monitor.Update(this);
    }
}

export enum ePriority { Low, Medium, High }
export abstract class Agent{
    public onStream: (reply: string) => void;
    public priority: ePriority = ePriority.Medium;
    public persona: string = "You are a helpful AI assistant.";
    public abstract GetBasePrompt(): string[];
    public abstract Setup(input: any): Promise<string>;
    public async Process(input: string): Promise<string> {
        let prompt = this.GetBasePrompt();
        if(this.onStream)
            return await AI.StreamPrompt(this.persona, prompt, [input], this.onStream);
        return AI.RunPrompt(this.persona, prompt, [input]);
    }
    public abstract Complete(aiResponse: string): Promise<any>;
    public _retries: 0;
}

enum eAgentStage { Waiting, Ready, Processed, Complete }
export class AgentRunner{
    public agent: Agent;
    public input: any;
    public process: string;
    public output: any;
    public running: boolean;
    public stage: eAgentStage = eAgentStage.Waiting;
    public onComplete: Deferred<string> = new Deferred<string>();
    public get priority(): ePriority { return this.agent.priority; }
    
    _cancel : boolean = false;
    public Cancel():void {
        this._cancel = true;
        this.Inturrupt();
    }
    public get isCancelled(): boolean { return this._cancel; }
    _rollback: boolean = false;
    public async Inturrupt(): Promise<void> {
        if(this.running){
            await AI._engine.interruptGenerate();
            this._rollback = true;
        }
    }

    public async TryAdvance(){
        try{
            switch(this.stage){
                case eAgentStage.Waiting:
                    this.process = await this.agent.Setup(this.input);
                    this.stage = eAgentStage.Ready;
                    break;
                case eAgentStage.Ready:
                    this._rollback = false;
                    this.running = true;
                    try{
                        this.process = await this.agent.Process(this.process);
                    } catch(e) {
                        throw e;
                    }
                    finally{
                        this.running = false;
                        if(!this._rollback){
                            this.stage = eAgentStage.Processed;
                        }
                    }
                    break;
                case eAgentStage.Processed:
                    this.output = await this.agent.Complete(this.process);
                    this.stage = eAgentStage.Complete;
                    this.onComplete.resolve(this.output);
                    break;
                case eAgentStage.Complete:
                    throw new Error("Agent should not be advanced during this state");
            }
            
        } catch(e){
            this.agent._retries++;
            this.running = false;
        }
    }
}

class AgentManager{
    _agents: AgentRunner[] = [];
    _running: boolean = false;
    _active: AgentRunner | null = null;
    public AddAgent(agent: Agent, input: any): AgentRunner{
        let runner = new AgentRunner();
        runner.agent = agent;
        runner.input = input;
        this._agents.push(runner);
        if(!this._running){
            this.RunAgents();
        }
        return runner;
    }
    public async ProcessNext(): Promise<void>{
        if(this._agents.length == 0) return;
        let agent = this._agents.sort((a, b) => a.priority - b.priority)[0];
        await agent.TryAdvance();
        let doRemove: boolean = (agent.stage == eAgentStage.Complete);
        if(agent.isCancelled){
            console.log("Agent Cancelled", agent);
            doRemove = true;
        } else if(agent.agent._retries > 3){
            console.log("Agent Retries Exceeded", agent);
            doRemove = true;
        }
        if(doRemove){
            this._agents = this._agents.filter(a => a != agent);
        }
    }
    public async RunAgents(): Promise<void>{
        this._running = true;
        while(this._agents.length > 0){
            try{
                await this.ProcessNext();
            } catch(e){
                console.error(e);
            }
        }
        this._running = false;
    }
}

class SimpleAgent extends Agent{
    public GetBasePrompt(): string[] { return [] };
    public async Setup(input: string): Promise<string> {
        return input;
    }
    public async Complete(aiResponse: string): Promise<string> {
        return aiResponse;
    }
}

export var AI: AIManager = new AIManager();