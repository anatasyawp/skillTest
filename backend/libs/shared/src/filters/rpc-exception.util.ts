import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { catchError, throwError } from 'rxjs';

export interface RpcErrorPayload {
  statusCode: number;
  message: string;
}

export function throwRpcError(statusCode: HttpStatus, message: string): never {
  throw new RpcException({ statusCode, message } satisfies RpcErrorPayload);
}

export function mapRpcErrorToHttp() {
  return catchError((err: unknown) => {
    const payload = extractRpcError(err);
    return throwError(() => new HttpException(payload.message, payload.statusCode));
  });
}

function extractRpcError(err: unknown): RpcErrorPayload {
  if (typeof err === 'object' && err !== null) {
    const record = err as Record<string, unknown>;
    const nested = (record.error as Record<string, unknown> | undefined) ?? record;
    const statusCode = typeof nested.statusCode === 'number' ? nested.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = typeof nested.message === 'string' ? nested.message : 'Internal microservice error';
    return { statusCode, message };
  }
  return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal microservice error' };
}
