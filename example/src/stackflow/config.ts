import {
	type ActivityDefinition,
	type RegisteredActivityName,
	defineConfig,
} from "@stackflow/config";

export default defineConfig<
	RegisteredActivityName,
	ActivityDefinition<RegisteredActivityName>
>({
	transitionDuration: 400,
	initialActivity: () => "Root",
	activities: [
		{
			name: "Root",
			omniflow: {
				desktop: {
					subview: {
						initialActivity: "View",
						initialParams: {},
						children: ["View", "View2"],
					},
				},
			},
		},
		{ name: "View" },
		{ name: "View2" },
	],
});
