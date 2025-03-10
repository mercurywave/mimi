import { con, Deferred } from "./util";

export namespace DB {
    let _db: IDBDatabase | null = null;

    export async function Init(): Promise<void> {
        let future = new Deferred();
        let request = indexedDB.open("mimi-chats", 1);

        request.onupgradeneeded = (ev) => {
            let db = request.result;
            let store = db.createObjectStore("chats", { keyPath: "id" });
        };

        request.onsuccess = () => {
            _db = request.result;
            future.resolve();
        };

        request.onerror = (ev) => {
            future.reject(`Error creating database: ${ev}`);
        };
        await future;
    }

    export function CreateChat(template: string): Chat {
        let now =  new Date().toISOString();
        let chat = {
            id: crypto.randomUUID(),
            messages: [],
            creationIso: now,
            editIso: now,
            template: template,
            summary: "",
        };
        if(template == con.cht.templateChat){
            chat.messages.push(CreateMessage(con.msg.typeAi, "Hello! What can I help you with today?"));
            chat.messages.push(CreateMessage(con.msg.typeUser, "", true));
        }
        if(template == con.cht.templateJournal){
            chat.messages.push(CreateMessage(con.msg.typeAi, "How are you feeling today?"));
            chat.messages.push(CreateMessage(con.msg.typeUser, "", true));
        }
        if(template == con.cht.templateNote){
            chat.messages.push(CreateMessage(con.msg.typeNote, "", true));
        }
        return chat;
    }

    export function CreateMessage(type: string, text?: string, isPending?: boolean): Message {
        let now =  new Date().toISOString();
        let msg = {
            text: text ?? "",
            creationIso: now,
            editIso: now,
            type: type,
            isPending: isPending ?? false,
        };
        return msg;
    }

    export async function SaveChat(chat: Chat): Promise<void>{
        let future = new Deferred();
        let trans = _db.transaction(["chats"], "readwrite");
        let store = trans.objectStore("chats");
        let request = store.put(chat);
        request.onerror = (e) => { future.reject(`Error adding chat: ${e}`); };
        request.onsuccess = () => { future.resolve(); };
        await future;
    }

    export async function AllChats(): Promise<Chat[]> {
        let future = new Deferred<Chat[]>();
        let trans = _db.transaction("chats", "readonly");
        let store = trans.objectStore("chats");
        let request = store.getAll();
        request.onsuccess = (ev) => {
            future.resolve(request.result);
        };
        request.onerror = (e) => { future.reject(`Error loading all chats: ${e}`) }
        return await future;
    }
}

export interface Chat {
    messages: Message[];
    id: string;
    creationIso: string;
    editIso: string;
    template: string;
    summary: string;
}

export interface Message {
    text: string;
    creationIso: string;
    editIso: string;
    isPending: boolean;
    type: string;
}
