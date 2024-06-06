<script lang="ts">
    import { onMount } from 'svelte';
    import { Modal } from '@svelteuidev/core';

    import { DokojongWebSocket } from './websocket';

    export let initWebSocket: (ws: DokojongWebSocket) => void;

    // modal (mo) opened status
    let moDisconnected = false, moDuplicatedLogin = false, moConnecting = true;

    onMount(() => {
        initWebSocket(new DokojongWebSocket(
            location.href.replace('http', 'ws').replace('5173', '8000'),
            function onopen() {
                moConnecting = false;
            },
            function onclose(ev) {
                if (ev.reason === 'close.duplicated_login') {
                    moDuplicatedLogin = true;
                } else {
                    moDisconnected = true;
                }
            },
            function onerror() {
                moDisconnected = true;
            }
        ));
    });
</script>


<Modal opened={moConnecting} centered title="网络连接中" withCloseButton={false} closeOnEscape={false} closeOnClickOutside={false}>
    正在与服务器建立连接，请稍候……
</Modal>
<Modal opened={moDisconnected} centered title="网络连接失败" withCloseButton={false} closeOnEscape={false} closeOnClickOutside={false}>
    连接已断开，请关闭或<a href={location.href}>刷新</a>本页面。
</Modal>
<Modal opened={moDuplicatedLogin} centered title="网络连接失败" withCloseButton={false} closeOnEscape={false} closeOnClickOutside={false}>
    已在其他浏览器页面内打开，请关闭或<a href={location.href}>刷新</a>本页面。
</Modal>
