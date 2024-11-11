import {
	type ContextProviderComponent,
	type JSXElement,
	createContext,
	useContext,
} from "solid-js";

export type Child = {
	name: string;
	render: () => JSXElement;
};

const ChildContext = createContext<Child | null>();

export const ChildProvider: ContextProviderComponent<Child | null | undefined> =
	ChildContext.Provider;

export const useChild = (): Child | null | undefined =>
	useContext(ChildContext);
