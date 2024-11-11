import {
	omniflow,
	useChild,
	useParent,
} from "@contentstech/stackflow-plugin-omniflow";
import { basicRendererPlugin } from "@contentstech/stackflow-plugin-renderer-basic/solid";
import {
	type ActivityComponentType,
	stackflow,
	useStack,
} from "@contentstech/stackflow-solid/future";
import type { RegisteredActivityName } from "@stackflow/config";
import { type JSXElement, Show } from "solid-js";
import { unwrap } from "solid-js/store";
import config from "./config";

declare module "@stackflow/config" {
	interface Register {
		Root: {
			id?: string;
		};
		View: {
			parentId?: string;
		};
		View2: {
			parentId?: string;
		};
		View3: {
			parentId?: string;
		};
	}
}

const Screen = (props: { children: JSXElement }) => (
	<div class="fixed inset-0 bg-white">{props.children}</div>
);

// biome-ignore lint/suspicious/noExplicitAny: idk
const components: Record<RegisteredActivityName, ActivityComponentType<any>> = {
	Root: ((props) => {
		const child = useChild();
		const stack = useStack();
		return (
			<div class="flex h-full">
				<div class="flex flex-col flex-1">
					<h1>Root (ID: {props.params.id})</h1>
					<button
						type="button"
						class="bg-slate-200 rounded p-2"
						onClick={() => actions.push("View", { parentId: props.params.id })}
					>
						Push View
					</button>
					<button
						type="button"
						class="bg-slate-200 rounded p-2"
						onClick={() => actions.push("View2", { parentId: props.params.id })}
					>
						Push View2
					</button>
					<button
						type="button"
						class="bg-slate-200 rounded p-2"
						onClick={() => actions.push("View3", { parentId: props.params.id })}
					>
						Push View3
					</button>
					<button
						type="button"
						class="bg-slate-200 rounded p-2"
						onClick={() =>
							actions.push("Root", { id: Math.random().toString() })
						}
					>
						Push Root
					</button>
					<Show when={child}>
						<div class="border rounded p-2">
							<p>Child will be rendered here</p>
							<div class="border border-red p-2 rounded">{child?.()}</div>
						</div>
					</Show>
				</div>
				<div class="min-h-0 h-full overflow-auto flex-1">
					<pre>{JSON.stringify(unwrap(stack().activities), null, 2)}</pre>
				</div>
			</div>
		);
	}) satisfies ActivityComponentType<"Root">,
	View: ((props) => {
		const parent = useParent();
		const child = useChild();
		return (
			<div>
				<h1>View</h1>
				<Show when={parent}>
					{(parent) => (
						<p>
							Parent activity: {parent().activityName} (ID:{" "}
							{props.params.parentId})
						</p>
					)}
				</Show>
				<Show when={child}>
					<div class="border rounded p-2">
						<p>Child will be rendered here</p>
						<div class="border border-red p-2 rounded">{child?.()}</div>
					</div>
				</Show>
				<button
					type="button"
					class="bg-slate-200 rounded p-2"
					onClick={() => actions.pop()}
				>
					Pop
				</button>
			</div>
		);
	}) satisfies ActivityComponentType<"View">,
	View2: ((props) => {
		const parent = useParent();
		const child = useChild();
		return (
			<div>
				<h1>View2</h1>
				<Show when={parent}>
					{(parent) => (
						<p>
							Parent activity: {parent().activityName} (ID:{" "}
							{props.params.parentId})
						</p>
					)}
				</Show>
				<Show when={child}>
					<div class="border rounded p-2">
						<p>Child will be rendered here</p>
						<div class="border border-red p-2 rounded">{child?.()}</div>
					</div>
				</Show>
				<button
					type="button"
					class="bg-slate-200 rounded p-2"
					onClick={() => actions.pop()}
				>
					Pop
				</button>
			</div>
		);
	}) satisfies ActivityComponentType<"View2">,
	View3: ((props) => {
		const parent = useParent();
		const child = useChild();
		return (
			<div>
				<h1>View3</h1>
				<Show when={parent}>
					{(parent) => (
						<p>
							Parent activity: {parent().activityName} (ID:{" "}
							{props.params.parentId})
						</p>
					)}
				</Show>
				<Show when={child}>
					<div class="border rounded p-2">
						<p>Child will be rendered here</p>
						<div class="border border-red p-2 rounded">{child?.()}</div>
					</div>
				</Show>
				<button
					type="button"
					class="bg-slate-200 rounded p-2"
					onClick={() => actions.pop()}
				>
					Pop
				</button>
			</div>
		);
	}) satisfies ActivityComponentType<"View3">,
};

export const { Stack, actions, stepActions } = stackflow({
	config,
	components,
	plugins: [
		basicRendererPlugin(),
		omniflow({ config, components, environment: "desktop" }),
		() => ({
			key: "wrap-screen",
			wrapActivity: ({ activity }) => <Screen>{activity.render()}</Screen>,
		}),
	],
});
