import { resolve } from 'path';
import { readFileSync } from 'fs';

const clientMethodTemplatePath: string = resolve(`${__dirname}/../template/client-method.tmpl`);
const clientTemplatePath: string = resolve(`${__dirname}/../template/client.tmpl`);

const swaggerPath: string = resolve(`${__dirname}/fixtures/swagger-1.json`);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerObj: any = require(swaggerPath);

const methodTemplate: string = readFileSync(clientMethodTemplatePath).toString('utf8');
const clientTemplate: string = readFileSync(clientTemplatePath).toString('utf8');

describe('test client', (): void => {
  it('should check for method template', (): void => {
    expect(methodTemplate).toMatch('{@operation_id@}');
    expect(methodTemplate).toMatch('{@method@}');
    expect(methodTemplate).toMatch('{@summary@}');
    expect(methodTemplate).toMatch('{@description@}');
  });

  it('should check methods details', async (): Promise<void> => {
    const endpoints: any = Object.values(swaggerObj.paths);
    const endpointDetail: any = endpoints[0];
    const method: string = Object.keys(endpointDetail)[0];
    const operationId: string = endpointDetail[method].operationId;

    expect(method).toBe('post');
    expect(operationId).toBe('V1CreateTestAction');
  });

  it('should check for client template', (): void => {
    expect(clientTemplate).toMatch('{@api_local_server@}');
    expect(clientTemplate).toMatch('{@api_local_path@}');
    expect(clientTemplate).toMatch('{@api_dev_server@}');
    expect(clientTemplate).toMatch('{@api_dev_path@}');
    expect(clientTemplate).toMatch('{@api_stage_server@}');
    expect(clientTemplate).toMatch('{@api_stage_path@}');
    expect(clientTemplate).toMatch('{@api_prod_server@}');
    expect(clientTemplate).toMatch('{@api_prod_path@}');
    expect(clientTemplate).toMatch('{@project_name_camel@}');
    expect(clientTemplate).toMatch('{@project_name_lower@}');
    expect(clientTemplate).toMatch('{@project_name_upper@}');
    expect(clientTemplate).toMatch('{@method_definitions@}');
  });
});
