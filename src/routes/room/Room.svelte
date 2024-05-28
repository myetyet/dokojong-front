<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { ActionIcon, Button, Center, Divider, Flex, Group, Modal, Stack, Switch, Text, TextInput, Title, Tooltip } from '@svelteuidev/core';
    import { ArrowLeft, Gear, InfoCircled, QuestionMarkCircled, Share1 } from 'svelte-radix';
    import { navigate } from 'svelte-routing';

    import Seat from './Seat.svelte';
    import { copyText, extractNickname } from '../../utils';
    import { DokojongWebSocket } from './websocket';
  import Header from './Header.svelte';

    // Status flags for SvelteUI components
    // Modal Opened (mo) status
    let moPlayerHelp = false,
        moGameSetting = false;
    let tipOpened = false,
        nicknameInput = '',
        nicknameError: string | boolean = false,
        modalOpened = {
            connecting: false,  // TODO: set to true
            inputHelp: false,
            playerHelp: false,
            duplicatedLogin: false,
            disconnected: false,
        };
    $: errorModalOpened = modalOpened.duplicatedLogin || modalOpened.disconnected;

    // Game settings
    let sendingSettings = false,
        quickGameInput = true,
        quickGame = true;
    $: gameSettingsChanged = quickGameInput !== quickGame;

    let nickname = localStorage.getItem('dokojong.nickname') ?? '',
        gameStart = false,
        minSeatNumber = 0,
        maxSeatNumber = 0,
        gameSettings = {
        quickGame: true,
        };

    type PlayerStatus = { nickname: string; online: boolean; me: boolean; operator: boolean; };
    let playerStatusList: (PlayerStatus | null)[] = [],
        canStartGame = false;
    // following 2 flags should be used with the flag `imOperator`
    $: canRemoveSeat = playerStatusList.length > minSeatNumber;
    $: canAddSeat = playerStatusList.length < maxSeatNumber;
  
    enum UserRole { Observer, Player, Operator };
    let myRole = UserRole.Observer;
    $: imObserver = myRole === UserRole.Observer;
    $: imPlayer = myRole == UserRole.Player || myRole == UserRole.Operator;
    $: imOperator = myRole === UserRole.Operator;

    let websocket: DokojongWebSocket;

    export let roomId: string;

    function popTooltip() {
        tipOpened = true;
        setTimeout(() => tipOpened = false, 1500);
    }

    function nicknameChangeHandler() {
        if (nicknameInput.length === 0) {
            nicknameError = false;
        } else {
            const nicknameExtraction = extractNickname(nicknameInput);
            if (nicknameExtraction === null) {
                nicknameError = '昵称输入有误';
            } else {
                nickname = nicknameExtraction;
                localStorage.setItem('dokojong.nickname', nickname);
                nicknameError = false;
            }
        }
    }

    onMount(() => {
        websocket = new DokojongWebSocket(
        /* url     */ location.href.replace('http', 'ws'),
        /* onopen  */ (send) => send({ type: 'user.register', nickname }),
        /* onclose */ (reason) => modalOpened[reason === 'close.duplicated_login' ? 'duplicatedLogin' : 'disconnected'] = true,
        /* onerror */ () => modalOpened.disconnected = true
        );
        websocket.addHandler('user.init', (data) => {
        nickname = data.nickname;
        localStorage.setItem('dokojong.nickname', nickname);
        modalOpened.connecting = false;
        });
        websocket.addHandler('player.status', (data) => {
            playerStatusList = data.status;
            let myNewRole = UserRole.Observer;
            let isFullHouse = true;
            for (const playerStatus of playerStatusList) {
                if (playerStatus === null) {
                    isFullHouse = false;
                } else {
                    if (playerStatus.me === true) {
                        myNewRole = UserRole.Player;
                        if (playerStatus.operator) {
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
        websocket.addHandler('game.status', (data) => {
            gameStart = data.status.game_start;
            minSeatNumber = data.status.min_seats;
            maxSeatNumber = data.status.max_seats;
            quickGame = quickGameInput = data.quick_game;
        });
        websocket.addHandler('game.change_settings', (data) => {
            quickGame = quickGameInput = data.quick_game;
            sendingSettings = false;
            moGameSetting = false;
        });
    });

    onDestroy(() => websocket.close());

    function takeSeat(seat: number) {
        websocket.send({ type: 'user.take_seat', seat, nickname: imObserver ? nickname : undefined });
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

    function gameSettingChangeHandler(setting: keyof typeof gameSettings) {
        switch (setting) {
            case 'quickGame':
                return function (ev: PointerEvent) {
                    ev.preventDefault();
                    gameSettings.quickGame = !gameSettings.quickGame;
                    websocket.send({ type: 'game.change_setting', key: 'quick_game', value: gameSettings.quickGame });
                }
        }
    }

    function changeSettings() {
        sendingSettings = true;
        websocket.send({ type: 'game.change_settings', quick: quickGameInput });
    }

</script>

<Header {websocket} {roomId} {gameStart} {imOperator} />

<Divider />
<Group position="center" override={{ gap: '30px' }}>
  {#each playerStatusList as playerStatus, i}
    {#if playerStatus === null}
      <Seat order={i + 1} vacant {imPlayer} xbutton={imOperator && canRemoveSeat} on:join={(ev) => takeSeat(ev.detail.seat)} on:remove={(ev) => removeSeat(ev.detail.seat)} />
    {:else}
      <Seat order={i + 1} {...playerStatus} {imPlayer} xbutton={playerStatus.me || imOperator} on:remove={(ev) => removePlayer(ev.detail.seat)} on:takeOP={() => takeOperator()} />
    {/if}
  {/each}
  {#if imOperator && canAddSeat}
    <Seat virtual on:add={() => addSeat()} />
  {/if}
</Group>
<Divider />
{#if imObserver}
  <Group position="center">
    <Seat {nickname} me />
    <TextInput bind:value={nicknameInput} on:change={nicknameChangeHandler} error={nicknameError} placeholder="输入昵称">
      <svelte:fragment slot="rightSection">
        <ActionIcon on:click={() => modalOpened.inputHelp = true}>
          <QuestionMarkCircled size="16px" />
        </ActionIcon>
      </svelte:fragment>
    </TextInput>
  </Group>
{:else}
  <Stack align="strech">
    {#if imOperator}
      <Center>
        <Button size="sm" disabled={!canStartGame}>开始游戏</Button>
      </Center>
    {/if}
    <!-- <Switch checked bind:element={gameSettingElements.quickGame} on:change={gameSettingChangeHandler('quickGame')} disabled={!imOperator} label="有玩家出局时立即结束游戏" /> -->
    <Switch checked={gameSettings.quickGame} on:click={(ev) => gameSettingChangeHandler('quickGame')} disabled={!imOperator} label="有玩家出局时立即结束游戏" />
  </Stack>
{/if}
<Modal opened={modalOpened.connecting} centered title="网络连接中" withCloseButton={false} closeOnEscape={false} closeOnClickOutside={false}>
  正在与服务器建立连接，请稍候……
</Modal>
<Modal opened={modalOpened.inputHelp} centered on:close={() => modalOpened.inputHelp = false} title="昵称输入帮助">
  输入1个汉字、或1个emoji表情、或2位数字字母的组合作为昵称。输入框并不限制最大输入长度，但会根据输入的内容截取适量头部字符作为昵称。
</Modal>
<Modal opened={modalOpened.playerHelp} center on:close={() => modalOpened.playerHelp = false} title="玩家提示卡">
  轮到你时，你进行如下四项行动中的一项：
  <ol>
    <li>【👍ＯＫ】对当前打开的房门表示OK。</li>
    <li>【➕️增加】再打开1扇房门，然后拿取领袖标记🐾。</li>
    <li>【🔃反转】关闭所有打开的房门，并打开除这些房门以外的任意其他房门，然后拿取领袖标记🐾。<span style="color: #fa5252;">*&nbsp;新打开的房门数量必须比此前处于打开状态的房门数量多1，故有至少3扇打开的房门时不能进行此项行动。</span></li>
    <li>【🫵指认】选择当前领袖的未翻开的1张牌，宣称你认为领袖的狗狗🐶位于此扇房门后。</li>
  </ol>
</Modal>
<Modal opened={errorModalOpened} centered title="网络连接失败" withCloseButton={false} closeOnEscape={false} closeOnClickOutside={false}>
  {#if modalOpened.duplicatedLogin}
    已在其他浏览器页面内打开，请关闭或刷新本页面。
  {:else}
    连接已断开，请关闭或刷新本页面。
  {/if}
</Modal>
