/**
 * Checks if the package name given by user is valid
 * @param value[string]
 */
export declare function validatePackageName(value: string): boolean;
/**
 * Checks the validity of the path given by the user
 * @param value[string]
 */
export declare function validateOutputPath(value: string): string | boolean;
/**
 * Validates if the given path is a valid swagger file
 * @param value
 */
export declare function validateSwaggerFile(value: string): Promise<string | boolean>;
/**
 * Validates if the given package version is valid semantic version
 * @param value[string]
 */
export declare function validatePackageVersion(value?: string): boolean;
