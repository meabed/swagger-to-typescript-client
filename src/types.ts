import { Spec } from 'swagger-schema-official';

export enum ARG_NAMES {
  PKG = 'pkg',
  OUTPUT = 'output',
  SWAGGER = 'swagger',
  PKG_VERSION = 'pkgVersion',
  INTERACTIVE = 'i',
}

export type UserArguments = {
  packageNameWithOrg: string;
  givenOutputPath: string;
  givenSwaggerPath: string;
  initialVersion: string;
};

export interface Server {
  url: string;
  description: string;
}

export interface SwaggerSpec extends Spec {
  servers: Server[];
}
