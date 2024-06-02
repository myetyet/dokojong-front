<script lang="ts">
    import { onDestroy, onMount } from 'svelte';

    import Header from './Header.svelte';
    import GameBoard from './GameBoard.svelte';
    import WaitingHall from './WaitingHall.svelte'
    import WebSocket from './WebSocket.svelte';
    import { DokojongWebSocket } from './websocket';

    export let roomId: string;
    
    let websocket: DokojongWebSocket;

    let connected = false,
        gameStart = false,
        myRole: 'OB' | 'P' | 'OP' = 'OB';

    onMount(() => {
        websocket.addHandler('game.status', (data) => {
            gameStart = data.start;
        });
    });

    onDestroy(() => {
        websocket.removeHandler('game.status');
        websocket.close();
    });

</script>

<WebSocket initWebSocket={(ws) => websocket = ws} on:connected={() => connected = true} />
{#if connected}
    <Header {websocket} {roomId} {gameStart} imOperator={myRole === 'OP'} />
    {#if gameStart}
        <GameBoard {websocket} />
    {:else}
        <WaitingHall {websocket} on:changeRole={(ev) => myRole = ev.detail.role} />
    {/if}
{/if}
