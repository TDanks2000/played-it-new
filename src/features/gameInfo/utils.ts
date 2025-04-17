export const getImageUrl = (imageId: string, size: string = "screenshot_big") => {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
};

export const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};