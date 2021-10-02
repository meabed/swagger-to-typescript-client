"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.argvToArguments = exports.askArguments = void 0;
const prompts_1 = __importDefault(require("prompts"));
const utils_1 = require("./utils");
const types_1 = require("./types");
const validator_1 = require("./validator");
/**
 * Gets the arguments from the user
 */
async function askArguments() {
    const answers = await (0, prompts_1.default)([
        {
            type: 'text',
            name: types_1.ARG_NAMES.PKG,
            message: 'Enter name of package e.g. @websitecom/my-api-sdk',
            validate: (value) => {
                try {
                    return (0, validator_1.validatePackageName)(value);
                }
                catch (e) {
                    return e.message;
                }
            },
        },
        {
            type: 'text',
            name: types_1.ARG_NAMES.OUTPUT,
            message: 'Enter the output path',
            validate: (value) => {
                const fullOutputPath = (0, utils_1.resolveFromCwd)(value);
                try {
                    return (0, validator_1.validateOutputPath)(fullOutputPath);
                }
                catch (error) {
                    return error.message;
                }
            },
        },
        {
            type: 'text',
            name: types_1.ARG_NAMES.SWAGGER,
            message: 'Enter the path to swagger file',
            validate: async (value) => {
                try {
                    const fullSwaggerPath = (0, utils_1.resolveFromCwd)(value);
                    return await (0, validator_1.validateSwaggerFile)(fullSwaggerPath);
                }
                catch (e) {
                    return e.message;
                }
            },
        },
        {
            type: 'text',
            name: types_1.ARG_NAMES.PKG_VERSION,
            message: 'Enter initial version. Leave empty to use from swagger file',
            validate: (value) => {
                try {
                    return (0, validator_1.validatePackageVersion)(value);
                }
                catch (e) {
                    return e.message;
                }
            },
        },
    ], {
        onCancel: () => {
            process.exit(0);
        },
    });
    return {
        packageNameWithOrg: answers[types_1.ARG_NAMES.PKG],
        givenOutputPath: (0, utils_1.resolveFromCwd)(answers[types_1.ARG_NAMES.OUTPUT]),
        givenSwaggerPath: (0, utils_1.resolveFromCwd)(answers[types_1.ARG_NAMES.SWAGGER]),
        initialVersion: answers[types_1.ARG_NAMES.PKG_VERSION],
    };
}
exports.askArguments = askArguments;
/**
 * Parses and validates the user arguments
 * @param argv
 */
async function argvToArguments(argv) {
    const answers = {
        packageNameWithOrg: argv[types_1.ARG_NAMES.PKG],
        givenOutputPath: (0, utils_1.resolveFromCwd)(argv[types_1.ARG_NAMES.OUTPUT]),
        givenSwaggerPath: (0, utils_1.resolveFromCwd)(argv[types_1.ARG_NAMES.SWAGGER]),
        initialVersion: argv[types_1.ARG_NAMES.PKG_VERSION],
    };
    (0, validator_1.validatePackageName)(answers.packageNameWithOrg);
    (0, validator_1.validateOutputPath)(answers.givenOutputPath);
    await (0, validator_1.validateSwaggerFile)(answers.givenSwaggerPath);
    (0, validator_1.validatePackageVersion)(answers.initialVersion);
    return answers;
}
exports.argvToArguments = argvToArguments;
//# sourceMappingURL=input.js.map