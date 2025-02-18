<script lang="ts">
	import type { Message } from "$lib/types/Message";
	import { snapScrollToBottom } from "$lib/actions/snapScrollToBottom";
	import ScrollToBottomBtn from "$lib/components/ScrollToBottomBtn.svelte";
	import { tick } from "svelte";
	import { randomUUID } from "$lib/utils/randomUuid";
	import type { Model } from "$lib/types/Model";
	import type { LayoutData } from "../../../routes/$types";
	import EtchedChatIntroduction from "./EtchedChatIntroduction.svelte";
	import APIChatIntroduction from "./APIChatIntroduction.svelte";

	import ChatMessage from "./ChatMessage.svelte";
	import type { WebSearchUpdate } from "$lib/types/MessageUpdate";
	import { browser } from "$app/environment";
	import SystemPromptModal from "../SystemPromptModal.svelte";

	export let messages: Message[];
	export let loading: boolean;
	export let pending: boolean;
	export let etched: boolean;
	export let isAuthor: boolean;
	export let currentModel: Model;
	export let preprompt: string | undefined;

	let chatContainer: HTMLElement;

	export let webSearchMessages: WebSearchUpdate[] = [];

	async function scrollToBottom() {
		await tick();
		chatContainer.scrollTop = chatContainer.scrollHeight;
	}

	// If last message is from user, scroll to bottom
	$: if (browser && messages[messages.length - 1]?.from === "user") {
		scrollToBottom();
	}
</script>

<div
	class="scrollbar-custom mr-1 h-full overflow-y-auto"
	use:snapScrollToBottom={messages.length ? [...messages, ...webSearchMessages] : false}
	bind:this={chatContainer}
>
	<div class="mx-auto flex h-full max-w-3xl flex-col gap-6 px-5 pt-6 sm:gap-8 xl:max-w-4xl">
		{#if etched}
			<EtchedChatIntroduction on:message />
		{:else}
			<APIChatIntroduction on:message />
		{/if}
		{#each messages as message, i}
			{#if i === 0 && preprompt}
				<SystemPromptModal {preprompt} />
			{/if}
			<ChatMessage
				loading={loading && i === messages.length - 1}
				{message}
				{isAuthor}
				model={currentModel}
				on:retry
				on:vote
			/>
		{:else}
		{/each}
		{#if pending}
			<ChatMessage
				message={{ from: "assistant", content: "", id: randomUUID() }}
				model={currentModel}
			/>
		{/if}
		<div class="h-44 flex-none" />
	</div>
	<ScrollToBottomBtn
		class="bottom-36 right-4 max-md:hidden lg:right-10"
		scrollNode={chatContainer}
	/>
</div>
