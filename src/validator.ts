import { existsSync, lstatSync } from 'fs';
import { OpenAPI } from 'openapi-types';
import SwaggerParser from '@apidevtools/swagger-parser';

/**
 * Checks if the package name given by user is valid
 * @param value[string]
 */
export function validatePackageName(value: string): boolean {
  if (/(@[A-Za-z0-9-]+)?[A-Za-z][A-Za-z0-9-][A-Za-z]+$/.test(value)) {
    return true;
  }

  throw new Error('Invalid package name. Valid examples: @abc/something, some-package, somepackage');
}

/**
 * Checks the validity of the path given by the user
 * @param value[string]
 */
export function validateOutputPath(value: string): string | boolean {
  if (!value) {
    throw new Error(`Output path is required`);
  }

  if (!existsSync(value)) {
    return true;
  }

  throw new Error(`Path "${value}" is not empty. Choose another.`);
}

/**
 * Validates if the given path is a valid swagger file
 * @param value
 */
export async function validateSwaggerFile(value: string): Promise<string | boolean> {
  if (!value) {
    throw new Error('Swagger file path is required');
  }

  if (!existsSync(value) || !lstatSync(value).isFile()) {
    throw new Error(`Swagger file does not exist at "${value}"`);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const swagger: OpenAPI.Document = await SwaggerParser.validate(require(value));

    return !!swagger?.info?.version;
  } catch (e) {
    throw new Error(`Invalid swagger file "${value}", error: ${e.message}`);
  }
}

/**
 * Validates if the given package version is valid semantic version
 * @param value[string]
 */
export function validatePackageVersion(value?: string): boolean {
  if (!value || /\d+\.\d+\.\d+/.test(value)) {
    return true;
  }

  throw new Error('Version must be semantic e.g. 0.0.1');
}
