import { server } from "@/www/server";
import configService from "@/lib/classes/config-service.class";
import DatabaseProvider from "./common/providers/database.provider";

const port = parseInt(configService.getOrThrow("port")) || 3000;

(async function () {
  try {
    await DatabaseProvider.getInstance().connect();
    server.listen(port, function () {
      console.info(`Starting server on ${port}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
