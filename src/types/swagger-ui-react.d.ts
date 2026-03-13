declare module 'swagger-ui-react' {
  import type { ComponentType } from 'react';

  export interface SwaggerUIProps {
    url?: string;
    spec?: object;
    layout?: unknown;
    onComplete?: (system: unknown) => void;
    requestInterceptor?: (req: unknown) => unknown;
    responseInterceptor?: (res: unknown) => unknown;
    docExpansion?: 'list' | 'full' | 'none';
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
