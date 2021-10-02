"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePackageVersion = exports.validateSwaggerFile = exports.validateOutputPath = exports.validatePackageName = void 0;
const fs_1 = require("fs");
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
/**
 * Checks if the package name given by user is valid
 * @param value[string]
 */
function validatePackageName(value) {
    if (/(@[A-Za-z0-9-]+)?[A-Za-z][A-Za-z0-9-][A-Za-z]+$/.test(value)) {
        return true;
    }
    throw new Error('Invalid package name. Valid examples: @abc/something, some-package, somepackage');
}
exports.validatePackageName = validatePackageName;
/**
 * Checks the validity of the path given by the user
 * @param value[string]
 */
function validateOutputPath(value) {
    if (!value) {
        throw new Error(`Output path is required`);
    }
    if (!(0, fs_1.existsSync)(value)) {
        return true;
    }
    throw new Error(`Path "${value}" is not empty. Choose another.`);
}
exports.validateOutputPath = validateOutputPath;
/**
 * Validates if the given path is a valid swagger file
 * @param value
 */
async function validateSwaggerFile(value) {
    var _a;
    if (!value) {
        throw new Error('Swagger file path is required');
    }
    if (!(0, fs_1.existsSync)(value) || !(0, fs_1.lstatSync)(value).isFile()) {
        throw new Error(`Swagger file does not exist at "${value}"`);
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const swagger = await swagger_parser_1.default.validate(require(value));
        return !!((_a = swagger === null || swagger === void 0 ? void 0 : swagger.info) === null || _a === void 0 ? void 0 : _a.version);
    }
    catch (e) {
        throw new Error(`Invalid swagger file "${value}", error: ${e.message}`);
    }
}
exports.validateSwaggerFile = validateSwaggerFile;
/**
 * Validates if the given package version is valid semantic version
 * @param value[string]
 */
function validatePackageVersion(value) {
    if (!value || /\d+\.\d+\.\d+/.test(value)) {
        return true;
    }
    throw new Error('Version must be semantic e.g. 0.0.1');
}
exports.validatePackageVersion = validatePackageVersion;
//# sourceMappingURL=validator.js.map