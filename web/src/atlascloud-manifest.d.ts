/** AtlasCloud node manifest (`atlascloud-manifest.json`). */
declare module "@nodetool/atlascloud-manifest" {
  const manifest: Array<{
    className: string;
    moduleName: string;
    modelId: string;
    [key: string]: unknown;
  }>;
  export default manifest;
}
