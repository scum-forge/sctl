export type Callback<TArgs extends unknown[] = [], TReturn = void> = (...args: TArgs) => TReturn;
export type StaticCallback<TArgs extends unknown[] = [], TReturn = void> = (this: void, ...args: TArgs) => TReturn;

// cli options
export interface RootOptions
{
	db: string | undefined;
	verbose: number;
}
