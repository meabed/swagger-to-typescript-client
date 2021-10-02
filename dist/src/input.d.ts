import { UserArguments } from './types';
/**
 * Gets the arguments from the user
 */
export declare function askArguments(): Promise<UserArguments>;
/**
 * Parses and validates the user arguments
 * @param argv
 */
export declare function argvToArguments(argv: any): Promise<UserArguments>;
