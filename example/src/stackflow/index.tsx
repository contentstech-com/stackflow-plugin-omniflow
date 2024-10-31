import { omniflow, useChild } from "@contentstech/stackflow-plugin-omniflow";
import { basicRendererPlugin } from "@contentstech/stackflow-plugin-renderer-basic/solid";
import {
	type ActivityComponentType,
	stackflow,
	useStack,
} from "@contentstech/stackflow-solid/future";
import type { RegisteredActivityName } from "@stackflow/config";
import type { JSXElement } from "solid-js";
import { unwrap } from "solid-js/store";
import config from "./config";

declare module "@stackflow/config" {
	interface Register {
		Root: Record<string, never>;
		View: Record<string, never>;
		View2: Record<string, never>;
	}
}

const Screen = (props: { children: JSXElement }) => (
	<div class="fixed inset-0 bg-white">{props.children}</div>
);

const components: Record<
	RegisteredActivityName,
	ActivityComponentType<RegisteredActivityName>
> = {
	Root: () => {
		const child = useChild();
		const stack = useStack();
		return (
			<div class="flex h-full">
				<div class="flex flex-col flex-1">
					<h1>Root</h1>
					<button
						type="button"
						class="bg-slate-200 rounded p-2"
						onClick={() => actions.push("View", {})}
					>
						Push View
					</button>
					<button
						type="button"
						class="bg-slate-200 rounded p-2"
						onClick={() => actions.push("View2", {})}
					>
						Push View2
					</button>
					<button
						type="button"
						class="bg-slate-200 rounded p-2"
						onClick={() => actions.push("Root", {})}
					>
						Push Root
					</button>
					<div class="border rounded p-2">
						<p>Child will be rendered here</p>
						<div class="border border-red p-2 rounded">{child?.()}</div>
					</div>
				</div>
				<div class="min-h-0 h-full overflow-auto flex-1">
					<pre>{JSON.stringify(unwrap(stack().activities), null, 2)}</pre>
				</div>
			</div>
		);
	},
	View: () => {
		return (
			<div>
				<h1>View</h1>
				<button
					type="button"
					class="bg-slate-200 rounded p-2"
					onClick={() => actions.pop()}
				>
					Pop
				</button>
			</div>
		);
	},
	View2: () => {
		return (
			<div>
				<h1>View2</h1>
				<button
					type="button"
					class="bg-slate-200 rounded p-2"
					onClick={() => actions.pop()}
				>
					Pop
				</button>
			</div>
		);
	},
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
