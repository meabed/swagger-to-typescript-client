import { join, resolve } from 'path';

/**
 * Resolves the user input path from the current working directory
 *
 * @param value
 */
export function resolveFromCwd(value: string): string {
  if (!value) {
    return '';
  }

  return resolve(join(process.cwd(), value));
}

/**
 * Replaces the given vars in the template string
 * @param template string
 * @param replacements object
 */
export function replaceInTemplate(template: string, replacements: { [key: string]: string }): string {
  let populatedTemplate: string = template;

  Object.keys(replacements).forEach((keyRegex: string): void => {
    populatedTemplate = populatedTemplate.replace(new RegExp(keyRegex, 'g'), replacements[keyRegex]);
  });

  return populatedTemplate;
}
