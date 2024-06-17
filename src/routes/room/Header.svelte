<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { ActionIcon, Box, Button, Flex, Group, Modal, Stack, Switch, Text, Title, Tooltip } from '@svelteuidev/core';
    import { ArrowLeft, Cross1, Gear, InfoCircled, Share1 } from 'svelte-radix';
    import { navigate } from 'svelte-routing';

    import { DokojongWebSocket } from './websocket';
    import { copyText } from '../../utils';
    
    export let websocket: DokojongWebSocket, roomId: string, gaming: boolean, imOperator: boolean;

    // modal (mo), tooltip (to) opened status
    let moGameSetting = false, moPlayerHelp = false, toLinkCopied = false;

    // game settings and their inputs
    let quickGame = true, quickGameInput = true;
    let sendingSettings = false, settingsUnread = false;
    $: gameSettingsChanged = quickGame !== quickGameInput;
    $: settingsDisabled = !imOperator || sendingSettings || gaming;

    // game termination
    let terminationCountdown = -1, terminationIntervalId: number;

    onMount(() => {
        websocket.addHandler('game.settings', (data) => {
            quickGame = quickGameInput = data.quick_game;
            sendingSettings = false;
            if (!imOperator) {
                settingsUnread = true;
            }
        });
    });

    onDestroy(() => {
        websocket.removeHandler('game.settings');
    });

    function popTooltip() {
        toLinkCopied = true;
        setTimeout(() => toLinkCopied = false, 1500);
    }

    function changeSettings() {
        sendingSettings = true;
        websocket.send({ type: 'game.change_settings', quick: quickGameInput });
    }

    function terminateGame() {
        terminationCountdown = 10;
        terminationIntervalId = setInterval(() => {
            terminationCountdown--;
            if (terminationCountdown === 0) {
                websocket.send({ type: 'game.terminate' });
                clearInterval(terminationIntervalId);
            }
        }, 1000);
    }

    function cancelTermination() {
        if (terminationIntervalId !== undefined) {
            clearInterval(terminationIntervalId);
        }
        terminationCountdown = -1;
    }
</script>


<Stack align="center" spacing="xl">
    <Flex justify="space-between" style="width: 95%; align-items: baseline;">
        <ActionIcon on:click={() => navigate('/')}>
            <ArrowLeft />
        </ActionIcon>
        <Title order={1} weight="bold" align="center">Dokojong</Title>
        {#if gaming}
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
        <ActionIcon on:click={() => { moGameSetting = true; settingsUnread = false; }}>
            <Gear size="18px" />
            {#if settingsUnread && !gaming}
                <Box css={{
                    position: 'absolute',
                    top: '0.5px',
                    right: '0.5px',
                    width: '5px',
                    height: '5px',
                    borderRadius: '8px',
                    borderWidth: '0px',
                    backgroundColor: '$red700',
                }} />
            {/if}
        </ActionIcon>
    </Group>
</Stack>
<Modal opened={moGameSetting} centered on:close={() => moGameSetting = false} title={imOperator && !gaming ? '规则设置' : '查看规则'}>
    <Stack>
        <Switch bind:checked={quickGameInput} label="当有玩家出局时结束游戏" disabled={settingsDisabled} />
        {#if imOperator}
            <Group position="right">
                {#if gaming}
                    <Button on:click={() => terminateGame()} color="red" loading={terminationCountdown > 0}>
                        {terminationCountdown > 0 ? `本局将于${terminationCountdown}秒后结束` : '结束游戏'}
                    </Button>
                    {#if terminationCountdown > 0}
                        <ActionIcon on:click={() => cancelTermination()}>
                            <Cross1 size="18px" />
                        </ActionIcon>
                    {/if}
                {:else}
                    <Button on:click={() => changeSettings()} disabled={!gameSettingsChanged} loading={sendingSettings}>
                        保存
                    </Button>
                {/if}
            </Group>
        {/if}
    </Stack>
</Modal>
<Modal opened={moPlayerHelp} center on:close={() => moPlayerHelp = false} title="玩家提示卡">
    轮到你时，你进行如下四项行动中的一项：
    <ol>
        <li>【👍ＯＫ】对当前打开的房门表示OK。</li>
        <li>【➕️增加】再打开1扇房门，然后拿取领袖标记（获得橘黄色动态边框）。</li>
        <li>【🔃反转】关闭所有打开的房门，并打开除这些房门以外的任意其他房门，然后拿取领袖标记（获得橘黄色动态边框）。<span style="color: #fa5252;">*&nbsp;新打开的房门数量必须比此前处于打开状态的房门数量多1，故有至少3扇打开的房门时不能进行此项行动。</span></li>
        <li>【🫵指认】选择当前领袖的未翻开的1张牌，宣称你认为领袖的狗狗🐶位于此扇房门后并将其翻开。若你找到了狗狗🐶，则从你自己的牌中任选1张翻开作为奖励。</li>
    </ol>
</Modal>
