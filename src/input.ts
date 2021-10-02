import prompts, { Answers } from 'prompts';
import { resolveFromCwd } from './utils';
import { ARG_NAMES, UserArguments } from './types';
import { validateOutputPath, validatePackageName, validatePackageVersion, validateSwaggerFile } from './validator';

/**
 * Gets the arguments from the user
 */
export async function askArguments(): Promise<UserArguments> {
  const answers: Answers<string> = await prompts(
    [
      {
        type: 'text',
        name: ARG_NAMES.PKG,
        message: 'Enter name of package e.g. @websitecom/my-api-sdk',
        validate: (value: string): string | boolean => {
          try {
            return validatePackageName(value);
          } catch (e) {
            return e.message;
          }
        },
      },
      {
        type: 'text',
        name: ARG_NAMES.OUTPUT,
        message: 'Enter the output path',
        validate: (value: string): string | boolean => {
          const fullOutputPath: string = resolveFromCwd(value);
          try {
            return validateOutputPath(fullOutputPath);
          } catch (error) {
            return error.message;
          }
        },
      },
      {
        type: 'text',
        name: ARG_NAMES.SWAGGER,
        message: 'Enter the path to swagger file',
        validate: async (value: string): Promise<string | boolean> => {
          try {
            const fullSwaggerPath: string = resolveFromCwd(value);

            return await validateSwaggerFile(fullSwaggerPath);
          } catch (e) {
            return e.message;
          }
        },
      },
      {
        type: 'text',
        name: ARG_NAMES.PKG_VERSION,
        message: 'Enter initial version. Leave empty to use from swagger file',
        validate: (value: string): string | boolean => {
          try {
            return validatePackageVersion(value);
          } catch (e) {
            return e.message;
          }
        },
      },
    ],
    {
      onCancel: (): void => {
        process.exit(0);
      },
    },
  );

  return {
    packageNameWithOrg: answers[ARG_NAMES.PKG],
    givenOutputPath: resolveFromCwd(answers[ARG_NAMES.OUTPUT]),
    givenSwaggerPath: resolveFromCwd(answers[ARG_NAMES.SWAGGER]),
    initialVersion: answers[ARG_NAMES.PKG_VERSION],
  };
}

/**
 * Parses and validates the user arguments
 * @param argv
 */
export async function argvToArguments(argv: any): Promise<UserArguments> {
  const answers: UserArguments = {
    packageNameWithOrg: argv[ARG_NAMES.PKG],
    givenOutputPath: resolveFromCwd(argv[ARG_NAMES.OUTPUT]),
    givenSwaggerPath: resolveFromCwd(argv[ARG_NAMES.SWAGGER]),
    initialVersion: argv[ARG_NAMES.PKG_VERSION],
  };

  validatePackageName(answers.packageNameWithOrg);
  validateOutputPath(answers.givenOutputPath);
  await validateSwaggerFile(answers.givenSwaggerPath);
  validatePackageVersion(answers.initialVersion);

  return answers;
}
