#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ncp_1 = __importDefault(require("ncp"));
const yargs_1 = __importDefault(require("yargs"));
const util_1 = require("util");
const camelcase_1 = __importDefault(require("camelcase"));
const path_1 = require("path");
const child_process_1 = require("child_process");
const openapi_client_axios_typegen_1 = require("openapi-client-axios-typegen");
const fs_1 = require("fs");
const input_1 = require("./src/input");
const types_1 = require("./src/types");
const utils_1 = require("./src/utils");
const ncpPromisify = (0, util_1.promisify)(ncp_1.default);
process
    .on('unhandledRejection', (reason, promise) => {
    console.error(`✖ ${reason.message}`);
    if (reason.stack.includes('validator')) {
        console.log('');
        yargs_1.default.showHelp();
    }
    process.exit(1);
})
    .on('uncaughtException', (error) => {
    console.error(`✖ ${error.message}`);
    if (error.stack.includes('validator')) {
        console.log('');
        yargs_1.default.showHelp();
    }
    process.exit(1);
});
//////////////////////////////////////////
// Paths for the templates
//////////////////////////////////////////
const staticsDirPath = (0, path_1.resolve)(`${__dirname}/template/static`);
const sdkTypesTemplatePath = (0, path_1.resolve)(`${__dirname}/template/types.tmpl`);
const clientMethodTemplatePath = (0, path_1.resolve)(`${__dirname}/template/client-method.tmpl`);
const clientTemplatePath = (0, path_1.resolve)(`${__dirname}/template/client.tmpl`);
const gitIgnoreTemplatePath = (0, path_1.resolve)(`${__dirname}/template/.gitignore`);
const indexTemplatePath = (0, path_1.resolve)(`${__dirname}/template/index.tmpl`);
//////////////////////////////////////////
// Reads the command line arguments
//////////////////////////////////////////
const argv = yargs_1.default
    .option(types_1.ARG_NAMES.PKG, {
    alias: 'p',
    description: 'Name of the package e.g. @websitecom/my-api-sdk',
    type: 'string',
})
    .option(types_1.ARG_NAMES.OUTPUT, {
    alias: 'o',
    description: 'Output path for the generated SDK',
    type: 'string',
})
    .option(types_1.ARG_NAMES.SWAGGER, {
    alias: 's',
    description: 'Path to the swagger file',
    type: 'string',
})
    .option(types_1.ARG_NAMES.PKG_VERSION, {
    alias: 'e',
    description: 'Version to set for the npm package (defaults to npm',
    default: '',
})
    .option(types_1.ARG_NAMES.INTERACTIVE, {
    alias: 'i',
    type: 'boolean',
    description: 'Runs the interactive version',
    default: false,
})
    .help()
    .alias('help', 'h').argv;
const isInteractive = argv[types_1.ARG_NAMES.INTERACTIVE];
(async () => {
    var _a, _b;
    const cliArgs = isInteractive ? await (0, input_1.askArguments)() : await (0, input_1.argvToArguments)(argv);
    const outputPath = cliArgs.givenOutputPath;
    const swaggerPath = cliArgs.givenSwaggerPath;
    const publishPkgName = cliArgs.packageNameWithOrg;
    const initialVersion = cliArgs.initialVersion;
    const projectName = publishPkgName.replace(/@.+\//, '').replace('-sdk', '');
    const underscoredProjectName = projectName.replace(/-/g, '_');
    const outputPathSrc = (0, path_1.join)(outputPath, '/src');
    //////////////////////////////////////////
    // Codebase for the SDK generator
    //////////////////////////////////////////
    // Create the directory for sdk
    (0, fs_1.mkdirSync)(outputPathSrc, { recursive: true });
    console.info('✔ Created output path');
    // @todo change to node copy
    (0, child_process_1.execSync)(`cp -rf ${staticsDirPath}/* ${outputPath}`);
    /////////////////////////////////////////////////////////////////////////
    // Reads the typing template, replaces the values and dumps to the SDK
    /////////////////////////////////////////////////////////////////////////
    const typingTemplate = (0, fs_1.readFileSync)(sdkTypesTemplatePath).toString('utf8');
    // replace params as first function param with body and move it the end because we will use all API's as POST unless its needed to be get
    const clientTypingStringReplaced = (await (0, openapi_client_axios_typegen_1.generateTypesForDocument)(swaggerPath, {
        transformOperationName: function (operation) {
            return operation;
        },
    }))
        .join('')
        // .replace(/parameters\?: Parameters<UnknownParamsObject>,/gi, '')
        // .replace(/config\?: AxiosRequestConfig/gi, 'config?: AxiosRequestConfig, parameters?: Parameters<UnknownParamsObject>')
        .replace(/\.Responses\.(\d+)/gi, '.Responses.$$$1');
    const typingCode = (0, utils_1.replaceInTemplate)(typingTemplate, {
        '{@client_typings@}': clientTypingStringReplaced,
        '{@project_name_underscored@}': underscoredProjectName.toLowerCase(),
    });
    const typingDestPath = (0, path_1.join)(outputPathSrc, `types.ts`);
    (0, fs_1.writeFileSync)(typingDestPath, typingCode);
    console.info('✔ Typings file generated.');
    /////////////////////////////////////////////////////////////////////////
    // Copy swagger file to sdk
    /////////////////////////////////////////////////////////////////////////
    (0, fs_1.copyFileSync)(swaggerPath, (0, path_1.join)(outputPathSrc, `/swagger.json`));
    console.info('✔ Copied swagger file to sdk.');
    /////////////////////////////////////////////////////////////////////////
    // Generate and write the client for SDK
    /////////////////////////////////////////////////////////////////////////
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const swaggerObj = require(swaggerPath);
    const methodTemplate = (0, fs_1.readFileSync)(clientMethodTemplatePath).toString('utf8');
    const methodDefinitions = Object.keys(swaggerObj.paths).map((endpoint) => {
        const endpointDetail = swaggerObj.paths[endpoint];
        const method = Object.keys(endpointDetail)[0];
        const operationId = endpointDetail[method].operationId;
        const summary = endpointDetail[method].summary;
        const description = endpointDetail[method].description;
        return (0, utils_1.replaceInTemplate)(methodTemplate, {
            '{@operation_id@}': operationId,
            '{@method@}': method,
            '{@endpoint@}': endpoint,
            '{@summary@}': summary,
            '{@description@}': description,
        }).trimRight();
    });
    const serversObj = swaggerObj.servers || [];
    let local_server = '';
    let local_path = '';
    let dev_server = '';
    let dev_path = '';
    let stage_server = '';
    let stage_path = '';
    let prod_server = '';
    let prod_path = '';
    serversObj.forEach((server) => {
        const { pathname, host, protocol } = new URL(server.url);
        const urlLink = `${protocol}//${host}`;
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
    const clientTemplate = (0, fs_1.readFileSync)(clientTemplatePath).toString('utf8');
    const clientFileCode = (0, utils_1.replaceInTemplate)(clientTemplate, {
        '{@api_local_server@}': local_server,
        '{@api_local_path@}': local_path,
        '{@api_dev_server@}': dev_server,
        '{@api_dev_path@}': dev_path,
        '{@api_stage_server@}': stage_server,
        '{@api_stage_path@}': stage_path,
        '{@api_prod_server@}': prod_server,
        '{@api_prod_path@}': prod_path,
        '{@project_name_camel@}': (0, camelcase_1.default)(projectName),
        '{@project_name_lower@}': underscoredProjectName.toLowerCase(),
        '{@project_name_upper@}': underscoredProjectName.toUpperCase(),
        '{@method_definitions@}': methodDefinitions.join(',\n\n'),
    });
    (0, fs_1.writeFileSync)((0, path_1.join)(outputPathSrc, `/client.ts`), clientFileCode);
    const gitIgnoreFileCode = (0, fs_1.readFileSync)(gitIgnoreTemplatePath).toString('utf8');
    (0, fs_1.writeFileSync)((0, path_1.join)(outputPathSrc, `/../.gitignore`), gitIgnoreFileCode);
    console.info('✔ Create client index file.');
    /////////////////////////////////////////////////////////////////////////
    // Generate and write the index file for SDK
    /////////////////////////////////////////////////////////////////////////
    const indexFileCode = (0, fs_1.readFileSync)(indexTemplatePath).toString('utf8');
    (0, fs_1.writeFileSync)((0, path_1.join)(outputPathSrc, `/index.ts`), indexFileCode);
    console.info('✔ Export sdk and typings from sdk.');
    /////////////////////////////////////////////////////////////////////////
    // Update package.json with correct version and name
    /////////////////////////////////////////////////////////////////////////
    const outputPackageJsonPath = (0, path_1.join)(outputPath, 'package.json');
    const outputPackageJson = JSON.parse((0, fs_1.readFileSync)(outputPackageJsonPath, { encoding: 'utf8' }));
    outputPackageJson.name = publishPkgName;
    outputPackageJson.version = initialVersion || ((_a = swaggerObj === null || swaggerObj === void 0 ? void 0 : swaggerObj.info) === null || _a === void 0 ? void 0 : _a.version) || '0.0.1';
    outputPackageJson.description = ((_b = swaggerObj === null || swaggerObj === void 0 ? void 0 : swaggerObj.info) === null || _b === void 0 ? void 0 : _b.description) || '';
    (0, fs_1.writeFileSync)(outputPackageJsonPath, JSON.stringify(outputPackageJson, null, 2));
    console.info('✔ Updated sdk package version.');
    console.info(`✔ Package successfully generated ${outputPath}`);
    console.info(`✔ Installing dependencies and building ${outputPath}`);
    (0, child_process_1.execSync)(`cd ${outputPath} && yarn install --check-files && yarn build`);
})();
//# sourceMappingURL=index.js.map