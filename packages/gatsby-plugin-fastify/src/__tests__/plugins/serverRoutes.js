const { serveGatsby } = require("../../plugins/gatsby");
const { FG_MODULE_HEADER } = require("../../utils/headers");
const { ConfigKeyEnum, setConfig, getServerConfig } = require("../../utils/config");

const { createCliConfig, createFastifyInstance } = require("../__utils__/config");

jest.mock("../../utils/constants", () => ({
  ...jest.requireActual("../../utils/constants"),
  PATH_TO_FUNCTIONS: "../../test-sites/fastify/.cache/functions/",
  PATH_TO_PUBLIC: "src/__tests__/__files__/public",
  PATH_TO_CACHE: "../../test-sites/fastify/.cache",
  CONFIG_FILE_PATH: "../../test-sites/fastify/.cache",
}));

describe(`Test Gatsby DSG/SSR Routes`, () => {
  beforeAll(() => {
    setConfig(
      ConfigKeyEnum.CLI,
      createCliConfig({
        port: 3000,
        host: "127.0.0.1",
        logLevel: "fatal",
        open: false,
      }),
    );

    setConfig(ConfigKeyEnum.SERVER, getServerConfig());
  });

  describe("DSG", () => {
    it(`Should serve DSG route HTML no slash`, async () => {
      const fastify = await createFastifyInstance(serveGatsby);

      const response = await fastify.inject({
        url: "/generated/page-6",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["content-type"]).toEqual("text/html");
      expect(response.headers[FG_MODULE_HEADER]).toContain("DSG");
      expect(response.payload).toContain("<div>Hello world #<!-- -->6<!-- -->!</div>");
    });

    it(`Should serve DSG route HTML with slash`, async () => {
      const fastify = await createFastifyInstance(serveGatsby);

      const response = await fastify.inject({
        url: "/generated/page-6/",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["content-type"]).toEqual("text/html");
      expect(response.headers[FG_MODULE_HEADER]).toContain("DSG");
      expect(response.payload).toContain("<div>Hello world #<!-- -->6<!-- -->!</div>");
    });

    it(`Should serve DSG route "page-data.json"`, async () => {
      const fastify = await createFastifyInstance(serveGatsby);

      const response = await fastify.inject({
        url: "/page-data/generated/page-6/page-data.json",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers[FG_MODULE_HEADER]).toContain("DSG");
      expect(response.headers["content-type"]).toEqual("application/json; charset=utf-8");
      expect(response.payload).toContain(`"result":{"pageContext":{"pageNumber":6}}`);
    });
  });

  describe("SSR", () => {
    it(`Should serve SSR route HTML no slash`, async () => {
      const fastify = await createFastifyInstance(serveGatsby);

      const response = await fastify.inject({
        url: "/ssr",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["content-type"]).toEqual("text/html");
      expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
      expect(response.payload).toContain("SSR Page with Dogs");
    });

    it(`Should serve SSR route HTML with slash`, async () => {
      const fastify = await createFastifyInstance(serveGatsby);

      const response = await fastify.inject({
        url: "/ssr/",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["content-type"]).toEqual("text/html");
      expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
      expect(response.payload).toContain("SSR Page with Dogs");
    });

    it(`Should serve SSR route "page-data.json"`, async () => {
      const fastify = await createFastifyInstance(serveGatsby);

      const response = await fastify.inject({
        url: "/page-data/ssr/page-data.json",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
      expect(response.headers["content-type"]).toEqual("application/json; charset=utf-8");
      expect(response.payload).toContain(`"path":"/ssr/","result":{"serverData"`);
    });

    it(`Should serve SSR route "page-data.json" with custom headers`, async () => {
      const fastify = await createFastifyInstance(serveGatsby);

      const response = await fastify.inject({
        url: "/page-data/ssr/page-data.json",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["x-test"]).toEqual("Custom Headers Work!");
    });

    it(`Should throw 500 error on exception when fetching server data`, async () => {
      const fastify = await createFastifyInstance(serveGatsby);

      const response = await fastify.inject({
        url: "/ssrBad",
        method: "GET",
      });

      expect(response.statusCode).toEqual(500);
      expect(response.headers[FG_MODULE_HEADER]).toContain("SSR");
    });

    it(`Should Add custom headers to SSR routes`, async () => {
      const fastify = await createFastifyInstance(serveGatsby);

      const response = await fastify.inject({
        url: "/ssr",
        method: "GET",
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers["x-test"]).toEqual("Custom Headers Work!");
      expect(response.payload).toContain("SSR Page with Dogs");
    });
  });

  it(`Should 400 if request does not accept "text/html" on DSG/SSR route`, async () => {
    const fastify = await createFastifyInstance(serveGatsby);

    const response = await fastify.inject({
      url: "/ssr",
      method: "GET",
      headers: {
        accept: "text/plain",
      },
    });

    expect(response.statusCode).toEqual(400);
  });

  it(`Should throw 404 if bad /page-data/route`, async () => {
    const fastify = await createFastifyInstance(serveGatsby);

    const response = await fastify.inject({
      url: "/page-data/fsdfsd/page-data.json",
      method: "GET",
    });

    expect(response.statusCode).toEqual(404);
  });
});
