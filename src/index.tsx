import type {
	ActivityComponentType,
	StackflowSolidPlugin,
} from "@contentstech/stackflow-solid/future";
import type {
	ActivityBaseParams,
	ActivityDefinition,
	Config,
} from "@stackflow/config";
import { id } from "@stackflow/core";
import { type Plugin as SerovalPlugin, deserialize, serialize } from "seroval";
import { createMemo } from "solid-js";
import { Dynamic } from "solid-js/web";
import { ChildProvider } from "./child.js";

type OmniflowOptions<ActivityName extends string> = {
	config: Config<ActivityDefinition<ActivityName>>;
	components: Record<ActivityName, ActivityComponentType<ActivityName>>;
	environment: string;
	// biome-ignore lint/suspicious/noExplicitAny: it works like this
	serovalPlugins?: SerovalPlugin<any, any>[];
};

declare module "@stackflow/config" {
	interface ActivityDefinition<ActivityName extends string> {
		omniflow?: ActivityOptions<ActivityName>;
	}
}

export type ActivityOptions<ActivityName extends string> = Record<
	string,
	ActivityEnvironmentOptions<ActivityName>
>;
export type ActivityEnvironmentOptions<ActivityName extends string> = {
	subview: {
		initialActivity: ActivityName;
		initialParams: ActivityBaseParams;
		children: ActivityName[];
	};
};

export function omniflow<ActivityName extends string>({
	config,
	components,
	environment,
	serovalPlugins,
}: OmniflowOptions<ActivityName>): StackflowSolidPlugin {
	const getEnvOptions = (activityName: string) => {
		const activityOptions = config.activities.find(
			(a) => a.name === activityName,
		)?.omniflow;
		return activityOptions?.[environment];
	};

	return () => ({
		key: "plugin-omniflow",
		overrideInitialEvents({ initialEvents }) {
			const topActivityEvent = initialEvents.findLast(
				(e) => e.name === "Pushed",
			);
			if (topActivityEvent) {
				const envOptions = getEnvOptions(topActivityEvent.activityName);
				if (envOptions?.subview.initialActivity) {
					topActivityEvent.activityParams = {
						OMNI_childName: envOptions.subview.initialActivity,
						OMNI_childParams: serialize(envOptions.subview.initialParams, {
							plugins: serovalPlugins,
						}),
					};
				}
			}
			return initialEvents;
		},
		onBeforePush({ actions, actionParams }) {
			const topActivity = actions.getStack().activities.find((a) => a.isTop);
			if (topActivity) {
				const topEnvOptions = getEnvOptions(topActivity.name);
				if (
					(topEnvOptions?.subview.children as string[] | undefined)?.includes(
						actionParams.activityName,
					)
				) {
					actions.preventDefault();
					actions.stepPush({
						stepId: id(),
						stepParams: {
							OMNI_childName: actionParams.activityName,
							OMNI_childParams: serialize(actionParams.activityParams, {
								plugins: serovalPlugins,
							}),
						},
					});
					return;
				}
			}

			const nextEnvOptions = getEnvOptions(actionParams.activityName);
			if (nextEnvOptions?.subview.initialParams) {
				actions.overrideActionParams({
					...actionParams,
					activityParams: {
						...actionParams.activityParams,
						OMNI_childName: nextEnvOptions.subview.initialActivity,
						OMNI_childParams: serialize(nextEnvOptions.subview.initialParams, {
							plugins: serovalPlugins,
						}),
					},
				});
			}
		},
		onBeforeReplace({ actions, actionParams }) {
			const topActivity = actions.getStack().activities.find((a) => a.isTop);
			if (topActivity) {
				const topEnvOptions = getEnvOptions(topActivity.name);
				if (
					(topEnvOptions?.subview.children as string[]).includes(
						actionParams.activityName,
					)
				) {
					actions.preventDefault();
					actions.stepReplace({
						stepId: id(),
						stepParams: {
							OMNI_childName: actionParams.activityName,
							OMNI_childParams: serialize(actionParams.activityParams, {
								plugins: serovalPlugins,
							}),
						},
					});
				}
				return;
			}

			const nextEnvOptions = getEnvOptions(actionParams.activityName);
			if (nextEnvOptions?.subview.initialParams) {
				actions.overrideActionParams({
					...actionParams,
					activityParams: {
						...actionParams.activityParams,
						OMNI_childName: nextEnvOptions.subview.initialActivity,
						OMNI_childParams: serialize(nextEnvOptions.subview.initialParams, {
							plugins: serovalPlugins,
						}),
					},
				});
			}
		},
		onBeforePop({ actions }) {
			const topActivity = actions.getStack().activities.find((a) => a.isTop);
			if (!topActivity) return;
			const omniChildNames = topActivity.steps
				.map((s) => s.params.OMNI_childName)
				.filter((v) => v != null);
			if (new Set(omniChildNames).size <= 1) return;
			actions.preventDefault();
			const activeChildName = omniChildNames.at(-1);
			const indexToTarget = topActivity.steps.findLastIndex(
				(s) =>
					s.enteredBy.name.startsWith("Step") &&
					s.params.OMNI_childName !== activeChildName,
			);
			if (indexToTarget === -1) return actions.stepPop();
			for (let i = topActivity.steps.length - 1; i > indexToTarget; i--) {
				actions.stepPop();
			}
		},
		wrapActivity({ activity }) {
			const envOptions = getEnvOptions(activity.name);
			if (!envOptions || envOptions.subview.children.length === 0) {
				return activity.render();
			}

			const child = () =>
				components[activity.params.OMNI_childName as ActivityName] as
					| ActivityComponentType<ActivityName>
					| undefined;
			const childParams = () => {
				const v = activity.params.OMNI_childParams;
				return v != null ? deserialize<ActivityBaseParams>(v) : undefined;
			};

			return (
				<ChildProvider
					value={() => (
						<Dynamic component={child()} params={childParams() ?? {}} />
					)}
				>
					{activity.render()}
				</ChildProvider>
			);
		},
	});
}

export { useChild } from "./child.js";
