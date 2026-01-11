import * as z from "zod";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { ConfigurationsSchema } from "./schema.js";

export const stringToConfigurations = z.codec(
  z.string(),
  ConfigurationsSchema,
  {
    decode: (string) => JSON.parse(string),
    encode: (configurations) => JSON.stringify(configurations, null, 2),
  },
);

export const xmlStringToConfigurations = z.codec(
  z.string(),
  ConfigurationsSchema,
  {
    decode: (xml) => new XMLParser().parse(xml),
    encode: (configurations) =>
      new XMLBuilder({ format: true }).build(configurations),
  },
);
