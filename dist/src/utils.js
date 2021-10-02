"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceInTemplate = exports.resolveFromCwd = void 0;
const path_1 = require("path");
/**
 * Resolves the user input path from the current working directory
 *
 * @param value
 */
function resolveFromCwd(value) {
    if (!value) {
        return '';
    }
    return (0, path_1.resolve)((0, path_1.join)(process.cwd(), value));
}
exports.resolveFromCwd = resolveFromCwd;
/**
 * Replaces the given vars in the template string
 * @param template string
 * @param replacements object
 */
function replaceInTemplate(template, replacements) {
    let populatedTemplate = template;
    Object.keys(replacements).forEach((keyRegex) => {
        populatedTemplate = populatedTemplate.replace(new RegExp(keyRegex, 'g'), replacements[keyRegex]);
    });
    return populatedTemplate;
}
exports.replaceInTemplate = replaceInTemplate;
//# sourceMappingURL=utils.js.map