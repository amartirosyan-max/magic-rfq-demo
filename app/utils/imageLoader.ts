// app/utils/imageLoader.ts
export async function importAllImages(directory: string) {
  const images: Record<string, string> = {};

  // Use static patterns with relative paths instead of aliases
  let modules;
  switch (directory) {
    case "avatars":
      modules = import.meta.glob("../assets/avatars/*.{png,jpg,jpeg,svg}");
      break;
    case "hardware":
      modules = import.meta.glob("../assets/hardware/*.{png,jpg,jpeg,svg}");
      break;
    case "use_cases":
      modules = import.meta.glob("../assets/use_cases/*.{png,jpg,jpeg,svg}");
      break;
    case "product_icons":
      modules = import.meta.glob(
        "../assets/product_icons/*.{png,jpg,jpeg,svg}",
      );
      break;
    default:
      modules = {};
  }

  for (const path in modules) {
    const imageName =
      path
        .split("/")
        .pop()
        ?.replace(/\.[^.]+$/, "") || "";
    const imageModule = await modules[path]();
    images[imageName] = (imageModule as { default: string }).default;
  }

  return images;
}
