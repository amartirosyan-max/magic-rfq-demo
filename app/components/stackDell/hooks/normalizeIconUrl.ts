export const normalizeIconUrl = (url: string) => {
  const minioUrl = "https://magic-dell-minio-assets.prod.datamonsters.com";

  return `${minioUrl}/ui-assets/public/${url}`;
};
