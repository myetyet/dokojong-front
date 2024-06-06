<script lang="ts">
    import { createEventDispatcher, onDestroy, onMount } from 'svelte';
    import { ActionIcon, Button, Group, Modal, TextInput } from '@svelteuidev/core';
    import { QuestionMarkCircled } from 'svelte-radix';

    import Seat from './Seat.svelte';
    import type { DokojongWebSocket } from './websocket';
    import { extractNickname, getStoredNickname, randomNickname, storeNickname } from '../../utils';

    export let websocket: DokojongWebSocket;
    
    const minSeatNumber = 2, maxSeatNumber = 5;
    const dispatch = createEventDispatcher();

    // modal opened status
    let moPlayerHelp = false;

    // nickname and its input
    let nickname = getStoredNickname() ?? randomNickname(),
        nicknameInput = '',
        nicknameInputError: string | boolean = false;

    // miscellaneous
    let seatStatusList: ({ nickname: string; online: boolean; me: boolean; operator: boolean; } | null)[] = [],
        myRole: 'OB' | 'P' | 'OP' = 'OB',
        canStartGame = false;

    onMount(() => {
        websocket.addHandler('seat.status', (data) => {
            seatStatusList = data.status;
            let myNewRole: typeof myRole = 'OB';
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
                        if (nickname !== seatStatus.nickname) {
                            nickname = seatStatus.nickname;
                            storeNickname(nickname);
                        }
                    }
                }
            }
            dispatch('changeRole', { role: myNewRole });
            myRole = myNewRole;
            canStartGame = isFullHouse;
        });
        websocket.send({ type: 'user.register' });
    });

    onDestroy(() => {
        websocket.removeHandler('seat.status');
    });

    function takeSeat(seat: number) {
        websocket.send({ type: 'user.take_seat', seat, nickname });
    }

    function removeSeat(seat: number) {
        websocket.send({ type: 'room.remove_seat', seat });
    }

    function removePlayer(seat: number) {
        websocket.send({ type: 'room.remove_player', seat });
    }

    function takeOperator() {
        websocket.send({ type: 'player.take_operator' });
    }

    function addSeat() {
        websocket.send({ type: 'room.add_seat' });
    }

    function startGame() {
        websocket.send({ type: 'game.start' });
    }

    function nicknameChangeHandler() {
        if (nicknameInput.length === 0) {
            nicknameInputError = false;
        } else {
            const nicknameExtraction = extractNickname(nicknameInput);
            if (nicknameExtraction === null) {
                nicknameInputError = '昵称输入有误';
            } else {
                nickname = nicknameExtraction;
                storeNickname(nickname);
                nicknameInputError = false;
            }
        }
    }
</script>


<Group position="center" style="gap: 30px; margin-top: 32px;">
    {#each seatStatusList as seatStatus, i}
        {#if seatStatus === null}
            <Seat
                order={i + 1}
                vacant
                imPlayer={myRole === 'P' || myRole === 'OP'}
                xbutton={myRole === 'OP' && seatStatusList.length > minSeatNumber}
                on:join={(ev) => takeSeat(ev.detail.seat)}
                on:remove={(ev) => removeSeat(ev.detail.seat)}
            />
        {:else}
            <Seat
                order={i + 1}
                {...seatStatus}
                imPlayer={myRole === 'P' || myRole === 'OP'}
                xbutton={seatStatus.me || myRole === 'OP'}
                on:remove={(ev) => removePlayer(ev.detail.seat)}
                on:takeOP={() => takeOperator()}
            />
        {/if}
    {/each}
    {#if myRole === 'OP' && seatStatusList.length < maxSeatNumber}
        <Seat virtual on:add={() => addSeat()} />
    {/if}
</Group>

<Group position="center" style="margin-top: 32px;">
    {#if myRole === 'OB'}
        <Seat {nickname} me />
        <TextInput bind:value={nicknameInput} on:change={nicknameChangeHandler} error={nicknameInputError} placeholder="输入昵称">
            <ActionIcon slot="rightSection" on:click={() => moPlayerHelp = true}>
                <QuestionMarkCircled size="16px" />
            </ActionIcon>
        </TextInput>
    {:else if myRole === 'P'}
        <Button size="lg" disabled>请等待房主开始游戏</Button>
    {:else}
        <Button size="lg" disabled={!canStartGame} on:click={() => startGame()}>开始游戏</Button>
    {/if}
</Group>
<Modal opened={moPlayerHelp} centered on:close={() => moPlayerHelp = false} title="昵称输入帮助">
    输入1个汉字、或1个emoji表情、或2位数字字母的组合作为昵称。输入框并不限制最大输入长度，但会根据输入的内容截取适量头部字符作为昵称。
</Modal>