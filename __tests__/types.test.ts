import { generateTypesForDocument } from 'openapi-client-axios-typegen';
import { resolve } from 'path';
import { exit } from 'yargs';
const swaggerPath: string = resolve(`${__dirname}/fixtures/swagger-1.json`);

describe('generate typings', (): void => {
  let imports: string;
  let schemaTypes: string;
  let operationTypings: string;

  beforeAll(async (): Promise<void> => {
    const types: string[] = await generateTypesForDocument(swaggerPath, {
      transformOperationName: function (operation) {
        return operation;
      },
    });
    imports = types[0];
    schemaTypes = types[1];
    operationTypings = types[2];
  });

  it('generates type files from valid v3 specification', async (): Promise<void> => {
    expect(imports).not.toBeFalsy();
    expect(schemaTypes).not.toBeFalsy();
    expect(operationTypings).not.toBeFalsy();
  });

  it('generate schema types ', (): void => {
    // expect(schemaTypes).toMatch('export type XJwtToken = string;'); // todo test header types
    expect(schemaTypes).toMatch('export interface V1CreateTestAction');
    expect(schemaTypes).toMatch('export type V1CreateTestResponse');
  });

  it('exports OperationMethods', async (): Promise<void> => {
    expect(operationTypings).toMatch('export interface OperationMethods');
    expect(operationTypings).toMatch('parameters?: Parameters<UnknownParamsObject>');
    expect(operationTypings).toMatch('data?: Paths.V1CreateTestAction.RequestBody');
    expect(operationTypings).toMatch('config?: AxiosRequestConfig');
    expect(operationTypings).toMatch('V1CreateTestAction');
  });

  it('exports a Client', async (): Promise<void> => {
    expect(operationTypings).toMatch('export type Client =');
  });
});
