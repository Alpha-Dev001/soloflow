import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Recursively converts Mongoose documents so that:
 *   _id  →  id  (string)
 *   __v  is removed
 *
 * Applied globally so every API response uses `id` instead of `_id`,
 * keeping the frontend TypeScript interfaces unchanged.
 */
function transformDocument(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(transformDocument);
  }

  // Mongoose document → plain object
  if (obj && typeof obj.toObject === 'function') {
    obj = obj.toObject({ virtuals: true });
  }

  if (typeof obj !== 'object') return obj;

  // Preserve non-plain instances instead of folding them into `{}`.
  // - Dates: keep as Date so the standard JSON serializer emits an ISO string.
  // - ObjectId / other BSON types: keep so JSON.stringify produces the hex string.
  // Without this, a Date has no enumerable own keys and would be flattened to an
  // empty object `{}` (which React then rejects as a child with "objects are not
  // valid as a React child (found: object with keys {})").
  if (obj instanceof Date) return obj;
  if (typeof obj.toHexString === 'function') return obj.toHexString();
  const proto = Object.getPrototypeOf(obj);
  if (proto !== Object.prototype && proto !== null) return obj;

  const transformed: any = {};
  for (const key of Object.keys(obj)) {
    if (key === '__v') continue;
    if (key === '_id') {
      transformed['id'] = String(obj[key]);
    } else {
      transformed[key] = transformDocument(obj[key]);
    }
  }
  return transformed;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => transformDocument(data)));
  }
}
