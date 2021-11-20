import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { OpenAPIV3 } from 'openapi-types';
import { chain, entries, filter, find, flatMap, includes, isEmpty, pick } from 'lodash';
import { indentString } from './indent';

/**
 * Type alias for OpenAPI document. We only support v3
 */
export type Document = OpenAPIV3.Document;

export type Server = OpenAPIV3.ServerObject;

/**
 * OpenAPI allowed HTTP methods
 */
export enum HttpMethod {
  Get = 'get',
  Put = 'put',
  Post = 'post',
  Patch = 'patch',
  Delete = 'delete',
  Options = 'options',
  Head = 'head',
  Trace = 'trace',
}

/**
 * OpenAPI parameters "in"
 */
export enum ParamType {
  Query = 'query',
  Header = 'header',
  Path = 'path',
  Cookie = 'cookie',
}

/**
 * Operation method spec
 */
export type ImplicitParamValue = string | number;

export interface ExplicitParamValue {
  value: string | number;
  name: string;
  in?: ParamType | string;
}

export interface UnknownParamsObject {
  [parameter: string]: ImplicitParamValue | ImplicitParamValue[];
}

export type ParamsArray = ExplicitParamValue[];
export type SingleParam = ImplicitParamValue;
export type Parameters<ParamsObject = UnknownParamsObject> = ParamsObject | ParamsArray | SingleParam;
export type RequestPayload = any; // should we type this?
export type OperationMethodArguments = [Parameters?, RequestPayload?, AxiosRequestConfig?];
export type OperationResponse<Response> = Promise<AxiosResponse<Response>>;
export type UnknownOperationMethod = (parameters?: Parameters, data?: RequestPayload, config?: AxiosRequestConfig) => OperationResponse<any>;

export interface UnknownOperationMethods {
  [operationId: string]: UnknownOperationMethod;
}

/**
 * Generic request config object
 */
export interface RequestConfig {
  method: HttpMethod; // HTTP method
  url: string; // full URL including protocol, host, path and query string
  path: string; // path for the operation (relative to server base URL)
  pathParams: { [key: string]: string }; // path parameters
  query: { [key: string]: string | string[] }; // query parameters
  queryString: string; // query string
  headers: { [header: string]: string | string[] }; // HTTP headers, including cookie
  cookies: { [cookie: string]: string }; // cookies
  payload?: RequestPayload; // the request payload passed as-is
}

/**
 * Operation object extended with path and method for easy looping
 */
export interface Operation extends OpenAPIV3.OperationObject {
  path: string;
  method: HttpMethod;
}

/**
 * A dictionary of paths and their methods
 */
export interface UnknownPathsDictionary {
  [path: string]: { [method in HttpMethod]?: UnknownOperationMethod };
}

/**
 * Generic request config object
 */
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  path: string;
  pathParams: {
    [key: string]: string;
  };
  query: {
    [key: string]: string | string[];
  };
  queryString: string;
  headers: {
    [header: string]: string | string[];
  };
  cookies: {
    [cookie: string]: string;
  };
  payload?: RequestPayload;
}

/**
 * Operation object extended with path and method for easy looping
 */
export interface Operation extends OpenAPIV3.OperationObject {
  path: string;
  method: HttpMethod;
}

function getOperations(dst: any): Operation[] {
  const paths = dst?.paths || {};
  return flatMap(Object.entries(paths), ([path, pathObject]: any) => {
    const methods = pick(pathObject, Object.values(HttpMethod));
    return Object.entries(methods).map(([method, operation]) => {
      const op: Operation = {
        ...(typeof operation === 'object' ? operation : {}),
        path,
        method: method as HttpMethod,
        responses: undefined,
      };
      if (pathObject.parameters) {
        op.parameters = [...(op.parameters || []), ...pathObject.parameters];
      }
      if (pathObject.servers) {
        op.servers = [...(op.servers || []), ...pathObject.servers];
      }
      return op;
    });
  });
}

// tslint:disable-next-line:max-line-length
function generateMethodForOperation(methodName: string, operation: Operation, exportTypes: any[]) {
  const { operationId, summary, description } = operation;

  // parameters arg
  const normalizedOperationId = operationId;
  const parameterTypePaths = chain([
    find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/pathParameters` }),
    find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/queryParameters` }),
    find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/headerParameters` }),
    find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/cookieParameters` }),
  ])
    .filter()
    .map('path')
    .value();

  const parametersType = !isEmpty(parameterTypePaths) ? parameterTypePaths.join(' & ') : 'UnknownParamsObject';
  const parametersArg = `parameters?: Parameters<${parametersType}> | null`;

  // payload arg
  const requestBodyType = find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/requestBody` });
  const dataArg = `data?: ${requestBodyType ? requestBodyType.path : 'any'}`;

  // return type
  const responseTypePaths = chain(exportTypes)
    .filter(({ schemaRef }) => schemaRef.startsWith(`#/paths/${normalizedOperationId}/responses`))
    .map(({ path }) =>
      path
        .split('.')
        // Operation.Responses.200 => Operation.Responses.$200
        .map((key: any, i: number) => (i === path.split('.').length - 1 ? `$${key}` : key))
        .join('.'),
    )
    .value();
  const responseType = !isEmpty(responseTypePaths) ? responseTypePaths.join(' | ') : 'any';
  const returnType = `OperationResponse<${responseType}>`;

  const operationArgs = [parametersArg, dataArg, 'config?: AxiosRequestConfig'];
  const operationMethod = `'${methodName}'(\n${operationArgs.map((arg) => indentString(arg, 2)).join(',\n')}  \n): ${returnType}`;

  // comment for type
  const content = filter([summary, description]).join('\n\n');
  const comment =
    '/**\n' +
    indentString(content === '' ? operationId : `${operationId} - ${content}`, 1, {
      indent: ' * ',
      includeEmptyLines: true,
    }) +
    '\n */';

  return [comment, operationMethod].join('\n');
}

// tslint:disable-next-line:max-line-length
export function generateOperationMethodTypings(api: any, exportTypes: any) {
  const operations = getOperations(api);

  const operationTypings = operations.map((op) => {
    return generateMethodForOperation(op.operationId, op, exportTypes);
  });

  return ['export interface OperationMethods {', ...operationTypings.map((op) => indentString(op, 2)), '}'].join('\n');
}
