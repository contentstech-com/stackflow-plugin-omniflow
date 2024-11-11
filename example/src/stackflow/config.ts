import { defineConfig } from "@stackflow/config";

export default defineConfig({
	transitionDuration: 400,
	initialActivity: () => "Root",
	activities: [
		{
			name: "Root",
			omniflow: {
				desktop: {
					subview: {
						initialActivity: {
							name: "View",
							params: {},
						},
						children: ["View", "View2"],
					},
				},
			},
		},
		{
			name: "View",
			omniflow: {
				desktop: {
					subview: {
						initialActivity: {
							name: "View2",
							params: {},
						},
						children: ["View2", "View3"],
					},
				},
			},
		},
		{
			name: "View2",
			omniflow: {
				desktop: {
					subview: {
						children: ["View3"],
					},
				},
			},
		},
		{
			name: "View3",
		},
	],
});
