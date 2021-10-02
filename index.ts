#!/usr/bin/env node

import ncp from 'ncp';
import yargs from 'yargs';
import { promisify } from 'util';
import camelCase from 'camelcase';
import { join, resolve } from 'path';
import { execSync } from 'child_process';
import { generateTypesForDocument } from 'openapi-client-axios-typegen';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { argvToArguments, askArguments } from './src/input';
import { ARG_NAMES, Server, SwaggerSpec, UserArguments } from './src/types';
import { replaceInTemplate } from './src/utils';

type NCP = (source: string, destination: string, options?: ncp.Options) => Promise<void>;
const ncpPromisify: NCP = promisify(ncp);

process
  .on('unhandledRejection', (reason: Error | any, promise: Promise<any>): void => {
    console.error(`✖ ${reason.message}`);
    if (reason.stack.includes('validator')) {
      console.log('');
      yargs.showHelp();
    }

    process.exit(1);
  })
  .on('uncaughtException', (error: Error): void => {
    console.error(`✖ ${error.message}`);
    if (error.stack.includes('validator')) {
      console.log('');
      yargs.showHelp();
    }

    process.exit(1);
  });

//////////////////////////////////////////
// Paths for the templates
//////////////////////////////////////////
const staticsDirPath: string = resolve(`${__dirname}/template/static`);
const sdkTypesTemplatePath: string = resolve(`${__dirname}/template/types.tmpl`);
const clientMethodTemplatePath: string = resolve(`${__dirname}/template/client-method.tmpl`);
const clientTemplatePath: string = resolve(`${__dirname}/template/client.tmpl`);
const gitIgnoreTemplatePath: string = resolve(`${__dirname}/template/.gitignore`);
const indexTemplatePath: string = resolve(`${__dirname}/template/index.tmpl`);

//////////////////////////////////////////
// Reads the command line arguments
//////////////////////////////////////////
const argv: any = yargs
  .option(ARG_NAMES.PKG, {
    alias: 'p',
    description: 'Name of the package e.g. @websitecom/my-api-sdk',
    type: 'string',
  })
  .option(ARG_NAMES.OUTPUT, {
    alias: 'o',
    description: 'Output path for the generated SDK',
    type: 'string',
  })
  .option(ARG_NAMES.SWAGGER, {
    alias: 's',
    description: 'Path to the swagger file',
    type: 'string',
  })
  .option(ARG_NAMES.PKG_VERSION, {
    alias: 'e',
    description: 'Version to set for the npm package (defaults to npm',
    default: '',
  })
  .option(ARG_NAMES.INTERACTIVE, {
    alias: 'i',
    type: 'boolean',
    description: 'Runs the interactive version',
    default: false,
  })
  .help()
  .alias('help', 'h').argv;

const isInteractive: boolean = argv[ARG_NAMES.INTERACTIVE];

(async (): Promise<void> => {
  const cliArgs: UserArguments = isInteractive ? await askArguments() : await argvToArguments(argv);

  const outputPath: string = cliArgs.givenOutputPath;
  const swaggerPath: string = cliArgs.givenSwaggerPath;
  const publishPkgName: string = cliArgs.packageNameWithOrg;
  const initialVersion: string = cliArgs.initialVersion;

  const projectName: string = publishPkgName.replace(/@.+\//, '').replace('-sdk', '');

  const underscoredProjectName: string = projectName.replace(/-/g, '_');

  const outputPathSrc: string = join(outputPath, '/src');

  //////////////////////////////////////////
  // Codebase for the SDK generator
  //////////////////////////////////////////

  // Create the directory for sdk
  mkdirSync(outputPathSrc, { recursive: true });
  console.info('✔ Created output path');

  // @todo change to node copy
  execSync(`cp -rf ${staticsDirPath}/* ${outputPath}`);

  /////////////////////////////////////////////////////////////////////////
  // Reads the typing template, replaces the values and dumps to the SDK
  /////////////////////////////////////////////////////////////////////////
  const typingTemplate: string = readFileSync(sdkTypesTemplatePath).toString('utf8');
  // replace params as first function param with body and move it the end because we will use all API's as POST unless its needed to be get
  const clientTypingStringReplaced: string = (
    await generateTypesForDocument(swaggerPath, {
      transformOperationName: function (operation) {
        return operation;
      },
    })
  )
    .join('')
    // .replace(/parameters\?: Parameters<UnknownParamsObject>,/gi, '')
    // .replace(/config\?: AxiosRequestConfig/gi, 'config?: AxiosRequestConfig, parameters?: Parameters<UnknownParamsObject>')
    .replace(/\.Responses\.(\d+)/gi, '.Responses.$$$1');
  const typingCode: string = replaceInTemplate(typingTemplate, {
    '{@client_typings@}': clientTypingStringReplaced,
    '{@project_name_underscored@}': underscoredProjectName.toLowerCase(),
  });

  const typingDestPath: string = join(outputPathSrc, `types.ts`);

  writeFileSync(typingDestPath, typingCode);
  console.info('✔ Typings file generated.');

  /////////////////////////////////////////////////////////////////////////
  // Copy swagger file to sdk
  /////////////////////////////////////////////////////////////////////////
  copyFileSync(swaggerPath, join(outputPathSrc, `/swagger.json`));
  console.info('✔ Copied swagger file to sdk.');

  /////////////////////////////////////////////////////////////////////////
  // Generate and write the client for SDK
  /////////////////////////////////////////////////////////////////////////
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerObj: SwaggerSpec = require(swaggerPath);
  const methodTemplate: string = readFileSync(clientMethodTemplatePath).toString('utf8');

  const methodDefinitions: string[] = Object.keys(swaggerObj.paths).map((endpoint: string): string => {
    const endpointDetail: any = swaggerObj.paths[endpoint];
    const method: string = Object.keys(endpointDetail)[0];
    const operationId: string = endpointDetail[method].operationId;
    const summary: string = endpointDetail[method].summary;
    const description: string = endpointDetail[method].description;

    return replaceInTemplate(methodTemplate, {
      '{@operation_id@}': operationId,
      '{@method@}': method,
      '{@endpoint@}': endpoint,
      '{@summary@}': summary,
      '{@description@}': description,
    }).trimRight();
  });

  const serversObj: Server[] = swaggerObj.servers || [];
  let local_server: string = '';
  let local_path: string = '';
  let dev_server: string = '';
  let dev_path: string = '';
  let stage_server: string = '';
  let stage_path: string = '';
  let prod_server: string = '';
  let prod_path: string = '';
  serversObj.forEach((server: Server): void => {
    const { pathname, host, protocol } = new URL(server.url);
    const urlLink: string = `${protocol}//${host}`;
    switch (server.description) {
      case 'local_server':
        local_server = urlLink;
        local_path = pathname;
        break;
      case 'dev_server':
        dev_server = urlLink;
        dev_path = pathname;
        break;
      case 'stage_server':
        stage_server = urlLink;
        stage_path = pathname;
        break;
      case 'prod_server':
        prod_server = urlLink;
        prod_path = pathname;
        break;
    }
  });

  const clientTemplate: string = readFileSync(clientTemplatePath).toString('utf8');
  const clientFileCode: string = replaceInTemplate(clientTemplate, {
    '{@api_local_server@}': local_server,
    '{@api_local_path@}': local_path,
    '{@api_dev_server@}': dev_server,
    '{@api_dev_path@}': dev_path,
    '{@api_stage_server@}': stage_server,
    '{@api_stage_path@}': stage_path,
    '{@api_prod_server@}': prod_server,
    '{@api_prod_path@}': prod_path,
    '{@project_name_camel@}': camelCase(projectName),
    '{@project_name_lower@}': underscoredProjectName.toLowerCase(),
    '{@project_name_upper@}': underscoredProjectName.toUpperCase(),
    '{@method_definitions@}': methodDefinitions.join(',\n\n'),
  });

  writeFileSync(join(outputPathSrc, `/client.ts`), clientFileCode);

  const gitIgnoreFileCode: string = readFileSync(gitIgnoreTemplatePath).toString('utf8');
  writeFileSync(join(outputPathSrc, `/../.gitignore`), gitIgnoreFileCode);

  console.info('✔ Create client index file.');

  /////////////////////////////////////////////////////////////////////////
  // Generate and write the index file for SDK
  /////////////////////////////////////////////////////////////////////////
  const indexFileCode: string = readFileSync(indexTemplatePath).toString('utf8');

  writeFileSync(join(outputPathSrc, `/index.ts`), indexFileCode);
  console.info('✔ Export sdk and typings from sdk.');

  /////////////////////////////////////////////////////////////////////////
  // Update package.json with correct version and name
  /////////////////////////////////////////////////////////////////////////
  const outputPackageJsonPath: string = join(outputPath, 'package.json');
  const outputPackageJson: any = JSON.parse(readFileSync(outputPackageJsonPath, { encoding: 'utf8' }));

  outputPackageJson.name = publishPkgName;
  outputPackageJson.version = initialVersion || swaggerObj?.info?.version || '0.0.1';
  outputPackageJson.description = swaggerObj?.info?.description || '';

  writeFileSync(outputPackageJsonPath, JSON.stringify(outputPackageJson, null, 2));
  console.info('✔ Updated sdk package version.');
  console.info(`✔ Package successfully generated ${outputPath}`);
  console.info(`✔ Installing dependencies and building ${outputPath}`);

  execSync(`cd ${outputPath} && yarn install --check-files && yarn build`);
})();
