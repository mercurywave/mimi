
export namespace util {
    export function ToggleClassIf(element: HTMLElement, className: string, condition: boolean){
        if(!condition && element.classList.contains(className)){
            element.classList.remove(className);
        } else if(condition && !element.classList.contains(className)){
            element.classList.add(className);
        }
    }
}