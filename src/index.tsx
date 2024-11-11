import type {
	ActivityComponentType,
	StackflowSolidPlugin,
} from "@contentstech/stackflow-solid/future";
import type {
	ActivityBaseParams,
	ActivityDefinition,
	Config,
} from "@stackflow/config";
import { type Activity, id } from "@stackflow/core";
import type { JSXElement } from "solid-js";
import { Dynamic, Show } from "solid-js/web";
import { ChildProvider } from "./child.js";
import { ParentProvider, useParent } from "./parent.js";

type OmniflowOptions<ActivityName extends string> = {
	config: Config<ActivityDefinition<ActivityName>>;
	components: Record<ActivityName, ActivityComponentType<ActivityName>>;
	environment: string;
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
		children: ActivityName[];
		initialActivity?: {
			name: ActivityName;
			params: ActivityBaseParams;
		};
	};
};

export function omniflow<ActivityName extends string>({
	config,
	components,
	environment,
}: OmniflowOptions<ActivityName>): StackflowSolidPlugin {
	const getEnvOptions = (activityName: string) => {
		const activityOptions = config.activities.find(
			(a) => a.name === activityName,
		)?.omniflow;
		return activityOptions?.[environment];
	};

	function getOmniInitialParams(activityName: ActivityName):
		| {
				childName: ActivityName[];
				childParams: ActivityBaseParams[];
		  }
		| undefined {
		const envOptions = getEnvOptions(activityName);
		if (envOptions?.subview.initialActivity) {
			const { childName, childParams } =
				getOmniInitialParams(envOptions.subview.initialActivity.name) ?? {};
			return {
				childName: [
					envOptions.subview.initialActivity.name,
					...(childName ?? []),
				],
				childParams: [
					envOptions.subview.initialActivity.params,
					...(childParams ?? []),
				],
			};
		}
	}

	function getOmniStepParams(
		topActivity: Activity,
		newActivityName: ActivityName,
		newActivityParams: ActivityBaseParams,
	) {
		const childNameStack = topActivity.params.OMNI_childName
			? (JSON.parse(topActivity.params.OMNI_childName) as ActivityName[])
			: [];
		const childParamsStack = topActivity.params.OMNI_childParams
			? (JSON.parse(
					topActivity.params.OMNI_childParams,
				) as ActivityBaseParams[])
			: [];
		const iterStack = [topActivity.name as ActivityName, ...childNameStack];

		for (let i = iterStack.length - 1; i >= 0; i--) {
			const activityName = iterStack[i];
			const envOptions = getEnvOptions(activityName);
			if (envOptions?.subview.children?.includes(newActivityName)) {
				const newInitialParams = getOmniInitialParams(newActivityName);

				return {
					OMNI_childName: JSON.stringify([
						...childNameStack.slice(0, i),
						newActivityName,
						...(newInitialParams?.childName ?? []),
					]),
					OMNI_childParams: JSON.stringify([
						...childParamsStack.slice(0, i),
						newActivityParams,
						...(newInitialParams?.childParams ?? []),
					]),
				};
			}
		}
	}

	return () => ({
		key: "plugin-omniflow",
		overrideInitialEvents({ initialEvents }) {
			const topActivityEvent = initialEvents.findLast(
				(e) => e.name === "Pushed",
			);
			if (topActivityEvent) {
				const initialParams = getOmniInitialParams(
					topActivityEvent.activityName as ActivityName,
				);
				if (initialParams) {
					topActivityEvent.activityParams = {
						OMNI_childName: JSON.stringify(initialParams.childName),
						OMNI_childParams: JSON.stringify(initialParams.childParams),
					};
				}
			}
			return initialEvents;
		},
		onBeforePush({ actions, actionParams }) {
			const topActivity = actions.getStack().activities.find((a) => a.isTop);
			if (topActivity) {
				const stepParams = getOmniStepParams(
					topActivity,
					actionParams.activityName as ActivityName,
					actionParams.activityParams,
				);
				if (stepParams) {
					actions.preventDefault();
					actions.stepPush({ stepId: id(), stepParams });
					return;
				}
			}

			const initialParams = getOmniInitialParams(
				actionParams.activityName as ActivityName,
			);
			if (initialParams) {
				actions.overrideActionParams({
					...actionParams,
					activityParams: {
						...actionParams.activityParams,
						OMNI_childName: JSON.stringify(initialParams.childName),
						OMNI_childParams: JSON.stringify(initialParams.childParams),
					},
				});
			}
		},
		onBeforeReplace({ actions, actionParams }) {
			const topActivity = actions.getStack().activities.find((a) => a.isTop);
			if (topActivity) {
				const stepParams = getOmniStepParams(
					topActivity,
					actionParams.activityName as ActivityName,
					actionParams.activityParams,
				);
				if (stepParams) {
					actions.preventDefault();
					actions.stepReplace({ stepId: id(), stepParams });
					return;
				}
			}

			const initialParams = getOmniInitialParams(
				actionParams.activityName as ActivityName,
			);
			if (initialParams) {
				actions.overrideActionParams({
					...actionParams,
					activityParams: {
						...actionParams.activityParams,
						OMNI_childName: JSON.stringify(initialParams.childName),
						OMNI_childParams: JSON.stringify(initialParams.childParams),
					},
				});
			}
		},
		onBeforePop({ actions }) {
			const topActivity = actions.getStack().activities.find((a) => a.isTop);
			if (!topActivity) return;
			const omniChildNames = topActivity.steps
				.filter(
					(s) =>
						s.enteredBy.name.startsWith("Step") &&
						s.params.OMNI_childName != null &&
						(JSON.parse(s.params.OMNI_childName) as ActivityName[]).length > 0,
				)
				.map((s) => s.params.OMNI_childName);
			if (omniChildNames.length === 0) return;
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
			function Wrapped(props: {
				parentName: ActivityName;
				parentParams: ActivityBaseParams;
				childNameStack: ActivityName[];
				childParamsStack: ActivityBaseParams[];
				children: JSXElement;
			}) {
				const envOptions = getEnvOptions(props.parentName);
				if (!envOptions || envOptions.subview.children.length === 0) {
					return (
						<ChildProvider value={undefined}>{props.children}</ChildProvider>
					);
				}

				const child = () =>
					components[props.childNameStack[0]] as
						| ActivityComponentType<ActivityName>
						| undefined;
				const childParams = () => props.childParamsStack[0];

				return (
					<ChildProvider
						value={
							props.childNameStack[0] != null
								? {
										name: props.childNameStack[0],
										render: () => (
											<Show when={child()}>
												{(child) => (
													<ParentProvider
														value={{
															activityName: props.parentName,
															activityParams: props.parentParams,
															parent: useParent(),
														}}
													>
														<Wrapped
															parentName={props.childNameStack[0]}
															parentParams={childParams() ?? {}}
															childNameStack={props.childNameStack.slice(1)}
															childParamsStack={props.childParamsStack.slice(1)}
														>
															<Dynamic
																component={child()}
																params={childParams() ?? {}}
															/>
														</Wrapped>
													</ParentProvider>
												)}
											</Show>
										),
									}
								: null
						}
					>
						{props.children}
					</ChildProvider>
				);
			}

			return (
				<Wrapped
					parentName={activity.name as ActivityName}
					parentParams={activity.params}
					childNameStack={
						activity.params.OMNI_childName
							? (JSON.parse(activity.params.OMNI_childName) as ActivityName[])
							: []
					}
					childParamsStack={
						activity.params.OMNI_childParams
							? (JSON.parse(
									activity.params.OMNI_childParams,
								) as ActivityBaseParams[])
							: []
					}
				>
					{activity.render()}
				</Wrapped>
			);
		},
	});
}

export { useChild } from "./child.js";
export { useParent } from "./parent.js";
