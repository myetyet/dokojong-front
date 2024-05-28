<script lang="ts">
    import { ActionIcon, Button, Modal, Stack, TextInput, Title } from '@svelteuidev/core';
    import { QuestionMarkCircled } from 'svelte-radix';
    import { navigate } from "svelte-routing";

    // modal (mo), tooltip (to) opened status
    let moInputHelp = false, moFetchError = false;
    // room id input
    let roomId = '', ridError: string | boolean = false, loading = false;
    $: roomIdValid = roomId.length === 0 || /^\d{4}$/.test(roomId);
    $: buttonMode = roomId.length === 0 ? '创建' : '进入';

    function enterRoom(ev: PointerEvent | KeyboardEvent) {
        if ((ev instanceof KeyboardEvent ? ev.key === 'Enter' : true) && roomIdValid) {
            if (roomId.length === 0) {
                loading = true;
                fetch('xxxx')
                    .then((data) => data.text())
                    .then((text) => navigate(text))  // random room id
                    .catch(() => moFetchError = true)
                    .finally(() => loading = false);
            } else {
                navigate(roomId);
            }
        }
    }

    function ridChangeHandler() {
        ridError = roomIdValid ? false : '房间号为四位数字';
    }
</script>


<Stack align="center" style="gap: 32px;">
    <Title order={1} weight="bold" align="center">Dokojong</Title>
    <TextInput bind:value={roomId} on:change={ridChangeHandler} on:keydown={enterRoom} error={ridError} placeholder="四位数房间号，或留空" maxlength=4>
        <ActionIcon slot="rightSection" on:click={() => moInputHelp = true}>
            <QuestionMarkCircled size={16} />
        </ActionIcon>
    </TextInput>
    <Button variant="outline" radius="xl" size="lg" on:click={enterRoom} {loading}>{buttonMode}房间</Button>
</Stack>
<Modal opened={moInputHelp} centered on:close={() => moInputHelp = false} title="房间号输入帮助">
    输入由四位数字构成的房间号，以创建或加入指定的房间；或将输入框留空，以创建随机号码的房间。
</Modal>
<Modal opened={moFetchError} centered on:close={() => moFetchError = false} title="获取随机房间号失败">
    获取随机房间号失败，可能是暂无空余房间，请稍后再试。
</Modal>