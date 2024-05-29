<script lang="ts">
    import { onMount } from 'svelte';
    import { Group } from '@svelteuidev/core';

    import { clipboard } from '@svelteuidev/composables';
    import type { DokojongWebSocket } from './websocket';

    export let websocket: DokojongWebSocket;

    type SeatStatus = { nickname: string; online: boolean; me: boolean; operator: boolean; };
    let seatStatusList: (SeatStatus | null)[] = [];

    onMount(() => {
        websocket.addHandler('seat.status', (data) => {
            seatStatusList = data.status;
            let myNewRole = UserRole.Observer;
            let isFullHouse = true;
            for (const seatStatus of seatStatusList) {
                if (seatStatus === null) {
                    isFullHouse = false;
                } else {
                    if (seatStatus.me) {
                        myNewRole = UserRole.Player;
                        if (seatStatus.operator) {
                            myNewRole = UserRole.Operator;
                        }
                    }
                }
            }
            if (myNewRole !== myRole) {
                myRole = myNewRole;
            }
            if (canStartGame !== isFullHouse) {
                canStartGame = isFullHouse;
            }
        });
    });
</script>


<Group position="center" style="gap: 30px">
    {#each seatStatusList as seatStatus, i}
        {#if playerStatus === null}
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
                {...playerStatus}
                {imPlayer}
                xbutton={playerStatus.me || imOperator}
                on:remove={(ev) => removePlayer(ev.detail.seat)}
                on:takeOP={() => takeOperator()}
            />
        {/if}
    {/each}
</Group>