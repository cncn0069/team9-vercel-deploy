import openapi from '../../../../public/openapi.json';

export async function GET() {
  return Response.json(openapi);
}
