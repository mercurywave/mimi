import { CreateMLCEngine, MLCEngine } from "../node_modules/@mlc-ai/web-llm/lib/index";


var engine: MLCEngine;
export namespace AI{
    export async function Setup():Promise<void>{
        engine = await CreateMLCEngine('Llama-3.2-3B-Instruct-q4f32_1-MLC', {
            // TODO: this is the main pre-load. this needs to not run on load all the time
            initProgressCallback: ({progress}) =>  console.log(`Load Progress: ${progress * 100}`)
        });
    }
    
    export async function DebugPrompt(prompt: string): Promise<string>{
        const reply = await engine.chat.completions.create({
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