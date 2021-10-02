/**
 * Resolves the user input path from the current working directory
 *
 * @param value
 */
export declare function resolveFromCwd(value: string): string;
/**
 * Replaces the given vars in the template string
 * @param template string
 * @param replacements object
 */
export declare function replaceInTemplate(template: string, replacements: {
    [key: string]: string;
}): string;
