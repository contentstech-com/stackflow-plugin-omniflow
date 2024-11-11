import type {
	ActivityBaseParams,
	RegisteredActivityName,
} from "@stackflow/config";
import {
	type ContextProviderComponent,
	createContext,
	useContext,
} from "solid-js";

export type Parent = {
	activityName: RegisteredActivityName;
	activityParams: ActivityBaseParams;
	parent: Parent | undefined;
};

const ParentContext = createContext<Parent>();

export const ParentProvider: ContextProviderComponent<Parent | undefined> =
	ParentContext.Provider;

export const useParent = (): Parent | undefined => useContext(ParentContext);
