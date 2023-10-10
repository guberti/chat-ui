<script lang="ts">
	import { PUBLIC_APP_NAME, PUBLIC_VERSION } from "$env/static/public";
	import { PUBLIC_ANNOUNCEMENT_BANNERS } from "$env/static/public";
	import { createEventDispatcher } from "svelte";
	import IconChevron from "$lib/components/icons/IconChevron.svelte";
	import CarbonArrowUpRight from "~icons/carbon/arrow-up-right";
	import AnnouncementBanner from "../AnnouncementBanner.svelte";
	import ModelsModal from "../ModelsModal.svelte";
	import type { Model } from "$lib/types/Model";
	import ModelCardMetadata from "../ModelCardMetadata.svelte";
	import type { LayoutData } from "../../../routes/$types";
	import { findCurrentModel } from "$lib/utils/models";

	let isModelsModalOpen = false;

	const announcementBanners = PUBLIC_ANNOUNCEMENT_BANNERS
		? JSON.parse(PUBLIC_ANNOUNCEMENT_BANNERS)
		: [];

	const dispatch = createEventDispatcher<{ message: string }>();
</script>

<div class="my-auto grid gap-8 lg:grid-cols-4">
	<div class="lg:col-span-2">
		<div>
			<div class="mb-3 flex items-center text-2xl font-semibold">
				<svg
					height="30"
					width="30"
					viewBox="0 0 13 12"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class="mr-1 flex-none"
				>
					<path fill="#FFD21E" d="M1.76 5.63a3.7 3.7 0 0 1 3.7-3.7h1.7a3.43 3.43 0 0 1 0 6.87H3.07L2.01 9.83a.14.14 0 0 1-.25-.1v-4.1Z"/>
					<path fill="#32343D" d="M7.37 4.8c.13.05.19.33.33.25a.54.54 0 0 0 .22-.73.54.54 0 0 0-.73-.22.54.54 0 0 0-.22.73c.06.13.27-.08.4-.03ZM4.83 4.8c-.14.05-.2.33-.33.25a.54.54 0 0 1-.23-.73A.54.54 0 0 1 5 4.1c.26.14.36.47.22.73-.06.13-.27-.08-.4-.03ZM6.12 7.4c1.06 0 1.4-.96 1.4-1.44 0-.49-.62.26-1.4.26-.77 0-1.4-.75-1.4-.26 0 .48.34 1.43 1.4 1.43Z"/>
					<path fill="#FF323D" d="M6.97 7.12c-.2.16-.49.27-.85.27-.34 0-.6-.1-.81-.24a.94.94 0 0 1 .57-.49c.04-.01.09.06.13.14.05.07.1.15.14.15.05 0 .1-.08.14-.15.05-.08.1-.15.14-.13a.93.93 0 0 1 .54.45Z"/>
				</svg>
				HuggingFace Chat
			</div>
			<p class="text-base text-gray-600 dark:text-gray-400">
				Powered by the PRO version of Hugging Face's Inference Endpoints, heavily optimized for low latency.
			</p>
		</div>
	</div>
	<div class="lg:col-span-2 lg:pl-24">
		<div class="overflow-hidden rounded-xl border dark:border-gray-800">
			<div class="flex p-3">
				<div class="flex flex-col justify-center mr-4"> <!-- Add margin for spacing -->
					<div class="text-sm text-gray-600 dark:text-gray-400 flex items-center"> <!-- Added flex here -->
						<span>Current Model: </span> <!-- Wrapped text in span for better control -->
						<span class="font-semibold text-black ml-2">Llama-2-70b-chat</span> <!-- Added margin for spacing -->
					</div>
					<span class="text-sm text-gray-600 dark:text-gray-400">140.2 GB, running dense float16 precision</span>
				</div>
			</div>
		</div>
	</div>
<!--	{#if currentModelMetadata.promptExamples}
		<div class="lg:col-span-3 lg:mt-6">
			<p class="mb-3 text-gray-600 dark:text-gray-300">Examples</p>
			<div class="grid gap-3 lg:grid-cols-3 lg:gap-5">
				{#each currentModelMetadata.promptExamples as example}
					<button
						type="button"
						class="rounded-xl border bg-gray-50 p-2.5 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:p-4"
						on:click={() => dispatch("message", example.prompt)}
					>
						{example.title}
					</button>
				{/each}
			</div>
		</div>{/if}-->
</div>
