<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { Group } from '@svelteuidev/core';

    import Seat from './Seat.svelte';
    import type { DokojongWebSocket } from './websocket';

    export let websocket: DokojongWebSocket;

    const dispatch = createEventDispatcher();

    type SeatStatus = { nickname: string; online: boolean; me: boolean; operator: boolean; };
    let seatStatusList: (SeatStatus | null)[] = [], isFullHouse = false;

    onMount(() => {
        websocket.addHandler('seat.status', (data) => {
            seatStatusList = data.status;
            let myNewRole: 'OB' | 'P' | 'OP' = 'OB';
            let isFullHouse = true;
            for (const seatStatus of seatStatusList) {
                if (seatStatus === null) {
                    isFullHouse = false;
                } else {
                    if (seatStatus.me) {
                        myNewRole = 'P';
                        if (seatStatus.operator) {
                            myNewRole = 'OP';
                        }
                    }
                }
            }
            dispatch('changeRole', { role: myNewRole });
            if (canStartGame !== isFullHouse) {
                canStartGame = isFullHouse;
            }
        });
    });
</script>


<Group position="center" style="gap: 30px">
    {#each seatStatusList as seatStatus, i}
        {#if seatStatus === null}
            <Seat
                order={i + 1}
                vacant
                {imPlayer}
                xbutton={imOperator && canRemoveSeat}
                on:join={(ev) => takeSeat(ev.detail.seat)}
                on:remove={(ev) => removeSeat(ev.detail.seat)}
            />
        {:else}
            <Seat
                order={i + 1}
                {...seatStatus}
                {imPlayer}
                xbutton={seatStatus.me || imOperator}
                on:remove={(ev) => removePlayer(ev.detail.seat)}
                on:takeOP={() => takeOperator()}
            />
        {/if}
    {/each}
</Group>