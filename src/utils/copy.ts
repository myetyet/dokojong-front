// modified from `clipboard` function in @svelteuidev/composables (https://svelteui.dev/actions/use-clipboard)
export function copyText(node: HTMLElement, text: string) {
    async function click() {
        if (text.length > 0) {
            try {
                await navigator.clipboard.writeText(text);
                node.dispatchEvent(new CustomEvent('copied'));
            } catch (e) {
                const textarea = document.createElement('textarea');
                textarea.setAttribute('style', 'position: absolute; overflow: hidden; width: 0; height: 0; top: 0; left: 0;');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    node.dispatchEvent(new CustomEvent('copied'));
                } finally {
                    textarea.remove();
                }
            }
        }
    }
    node.addEventListener('click', click, true);
    return {
        update: (newText: string) => text = newText,
        destroy: () => node.removeEventListener('click', click, true),
    };
}
