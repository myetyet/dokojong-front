<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { ActionIcon, Button, Flex, Group, Modal, Stack, Switch, Text, Title, Tooltip } from '@svelteuidev/core';
    import { ArrowLeft, Gear, InfoCircled, Share1 } from 'svelte-radix';
    import { navigate } from 'svelte-routing';

    import { DokojongWebSocket } from './websocket';
    import { copyText } from '../../utils';
    
    export let websocket: DokojongWebSocket, roomId: string, gameStart: boolean, imOperator: boolean;

    // modal (mo), tooltip (to) opened status
    let moGameSetting = false, moPlayerHelp = false, toLinkCopied = false;
    // game settings and their inputs
    let sendingSettings = false, quickGame = true, quickGameInput = true;
    $: gameSettingsChanged = quickGame !== quickGameInput;

    onMount(() => {
        websocket.addHandler('game.change_settings', (data) => {
            quickGame = quickGameInput = data.quick_game;
            sendingSettings = false;
        });
    });

    onDestroy(() => {
        websocket.removeHandler('game.change_settings');
    });

    function popTooltip() {
        toLinkCopied = true;
        setTimeout(() => toLinkCopied = true, 1500);
    }

    function changeSettings() {
        sendingSettings = true;
        websocket.send({ type: 'game.change_settings', quick: quickGameInput });
    }
</script>


<Stack align="center" spacing="xl">
    <Flex justify="space-between" style="width: 95%; align-items: baseline;">
        <ActionIcon on:click={() => navigate('/')}>
            <ArrowLeft />
        </ActionIcon>
        <Title order={1} weight="bold" align="center">Dokojong</Title>
        {#if gameStart}
            <ActionIcon on:click={() => moPlayerHelp = true}>
                <InfoCircled />
            </ActionIcon>
        {:else}
            <Tooltip withArrow opened={toLinkCopied} position="bottom">
                <ActionIcon use={[[copyText, location.href]]} on:copied={popTooltip}>
                    <Share1 />
                </ActionIcon>
                <Text slot="label" color="white" size="sm">链接已复制</Text>
            </Tooltip>
        {/if}
    </Flex>
    <Group >
        <Text size="lg">房间号：{roomId}</Text>
        <ActionIcon on:click={() => moGameSetting = true}>
            <Gear size="18px" />
        </ActionIcon>
    </Group>
</Stack>
<Modal opened={moGameSetting} centered on:close={() => moGameSetting = false} title={imOperator ? '规则设置' : '查看规则'}>
    <Stack>
        <Switch bind:checked={quickGameInput} label="当有玩家出局时结束游戏" disabled={!imOperator && false} />
        <Group position="right">
            {#if imOperator || true}
                <Button on:click={() => changeSettings()} disabled={!gameSettingsChanged} loading={sendingSettings}>
                    保存
                </Button>
            {/if}
        </Group>
    </Stack>
</Modal>
