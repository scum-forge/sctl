export type Callback<TArgs extends unknown[] = [], TReturn = void> = (...args: TArgs) => TReturn;
export type StaticCallback<TArgs extends unknown[] = [], TReturn = void> = (this: void, ...args: TArgs) => TReturn;
