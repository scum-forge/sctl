export type Callback<T = void> = (...args: unknown[]) => T;
export type StaticCallback<T = void> = (this: void, ...args: unknown[]) => T;
export type CallbackNoArgs<T = void> = () => T;
export type StaticCallbackNoArgs<T = void> = (this: void) => T;
