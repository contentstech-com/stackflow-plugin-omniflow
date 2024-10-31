import {
	type ContextProviderComponent,
	type JSXElement,
	createContext,
	useContext,
} from "solid-js";

const ChildContext = createContext<() => JSXElement>();

export const ChildProvider: ContextProviderComponent<
	(() => JSXElement) | undefined
> = ChildContext.Provider;

export const useChild = (): (() => JSXElement) | undefined =>
	useContext(ChildContext);
