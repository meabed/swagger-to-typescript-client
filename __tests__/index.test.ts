import {execSync} from 'child_process';
import fs, {readFileSync} from 'fs';
import * as path from 'path';

const currentDir: string = __dirname;
const swaggerPath: string = './__tests__/fixtures/swagger-1.json';
const outputPath: string = './__tests__/sdk';
const publishPkgName: string = '@websitecom/test-pkg';

beforeAll((): void => {
  execSync('rm -rf __tests__/sdk');
});

afterAll((): void => {
  execSync('rm -rf __tests__/sdk');
});

describe('test', (): void => {
  it('should check template files exists', async (): Promise<void> => {
    const success: string = await execSync('ls template').toString();
    expect(success.includes('client-method.tmpl')).toBeTruthy();
    expect(success.includes('client.tmpl')).toBeTruthy();
    expect(success.includes('index.tmpl')).toBeTruthy();
    expect(success.includes('types.tmpl')).toBeTruthy();
  });

  it('should check static files exists', async (): Promise<void> => {
    const success: string = await execSync('ls template/static').toString();

    expect(success.includes('build.sh')).toBeTruthy();
    expect(success.includes('dtsgen.ts')).toBeTruthy();
    expect(success.includes('package.json')).toBeTruthy();
    expect(success.includes('tsconfig.json')).toBeTruthy();
  });

  it('should generate sdk', async (): Promise<void> => {
    // todo change .. to __dirname or more absolute path or relative path
    const cmd: string = `cd ${currentDir} & rm -rf ${outputPath} & ts-node --transpile-only index.ts --pkg ${publishPkgName} --output ${outputPath} --swagger ${swaggerPath}`;
    expect(await execSync(cmd)).toBeDefined();
  });
  it('should generate sdk with same pkgName', async (): Promise<void> => {
    const outputPackageJson: any = JSON.parse(readFileSync(`${outputPath}/package.json`, { encoding: 'utf8' }));
    await expect(outputPackageJson.name).toEqual(publishPkgName);
  });

  // testing if all the files got generated
  it('should exists package json in the sdk', async (): Promise<void> => {
    expect(fs.existsSync(`${path.join(__dirname, '../', outputPath)}/package.json`)).toEqual(true);
  });

  it('should exists tsconfig.json in the sdk', async (): Promise<void> => {
    expect(fs.existsSync(`${path.join(__dirname, '../', outputPath)}/tsconfig.json`)).toEqual(true);
  });

  it('should exists dtsgen.ts in the sdk', async (): Promise<void> => {
    expect(fs.existsSync(`${path.join(__dirname, '../', outputPath)}/dtsgen.ts`)).toEqual(true);
  });

  it('should exists build.sh in the sdk', async (): Promise<void> => {
    expect(fs.existsSync(`${path.join(__dirname, '../', outputPath)}/build.sh`)).toEqual(true);
  });

  it('should exists typings in the sdk', async (): Promise<void> => {
    expect(fs.existsSync(`${path.join(__dirname, '../', outputPath)}/src/types.ts`)).toEqual(true);
  });

  it('should exists swagger.json in the sdk', async (): Promise<void> => {
    expect(fs.existsSync(`${path.join(__dirname, '../', outputPath)}/src/swagger.json`)).toEqual(true);
  });

  it('should exists clients.ts in the sdk', async (): Promise<void> => {
    expect(fs.existsSync(`${path.join(__dirname, '../', outputPath)}/src/client.ts`)).toEqual(true);
  });

  it('should exists root index.ts in the sdk', async (): Promise<void> => {
    expect(fs.existsSync(`${path.join(__dirname, '../', outputPath)}/src/index.ts`)).toEqual(true);
  });

  it('should fail to generate sdk on same location', async (): Promise<void> => {
    await expect(await generateWithSameParam(swaggerPath, outputPath, publishPkgName)).toHaveProperty('status', 1);
  });

  it('should fail to generate sdk with invalid json', async (): Promise<void> => {
    const swaggerPath: string = '/__tests__/fixtures/invalid-swagger.json';
    await expect(await passInvalidParam(swaggerPath, outputPath, publishPkgName)).toHaveProperty('status', 1);
  });

  it('should fail to generate sdk with swagger having missing paths', async (): Promise<void> => {
    const swaggerPath: string = '/__tests__/fixtures/missing-paths.json';
    await expect(await passInvalidParam(swaggerPath, outputPath, publishPkgName)).toHaveProperty('status', 1);
  });

  it('should fail to generate sdk with no swagger provided', async (): Promise<void> => {
    const swaggerPath: string = '';
    await expect(await passInvalidParam(swaggerPath, outputPath, publishPkgName)).toHaveProperty('status', 1);
  });

  it('should fail to generate sdk with swagger in txt format', async (): Promise<void> => {
    const swaggerPath: string = '/__tests__/fixtures/swagger.txt';
    await expect(await passInvalidParam(swaggerPath, outputPath, publishPkgName)).toHaveProperty('status', 1);
  });
  it('should fail to generate sdk with no outputPath', async (): Promise<void> => {
    const outputPath: string = '';
    await expect(await passInvalidParam(swaggerPath, outputPath, publishPkgName)).toHaveProperty('status', 1);
  });

  it('should fail to generate sdk with no pkgName', async (): Promise<void> => {
    const publishPkgName: string = '';
    await expect(await passInvalidParam(swaggerPath, outputPath, publishPkgName)).toHaveProperty('status', 1);
  });
});

async function passInvalidParam(swaggerPath: string, outputPath: string, publishPkgName: string): Promise<Buffer | Error> {
  let execOutput: Buffer;
  try {
    execOutput = execSync(`cd ${currentDir} & rm -rf ${outputPath} & ts-node --transpile-only index.ts --pkg ${publishPkgName} --output ${outputPath} --swagger ${swaggerPath}`);
  } catch (e) {
    execOutput = e;
  }
  return execOutput;
}

async function generateWithSameParam(swaggerPath: string, outputPath: string, publishPkgName: string): Promise<Buffer | Error> {
  let execOutput: Buffer;
  try {
    execOutput = await execSync(`cd ${currentDir} & ts-node --transpile-only index.ts --pkg ${publishPkgName} --output ${outputPath} --swagger ${swaggerPath}`);
  } catch (e) {
    execOutput = e;
  }

  return execOutput;
}
