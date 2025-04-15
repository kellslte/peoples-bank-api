import tsJest from "ts-jest/presets/index.js";
const { defaultsESM } = tsJest;

export default {
  ...defaultsESM,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // Correctly maps @/ to src/
  },
  testEnvironment: "node",
  rootDir: "./",
};
